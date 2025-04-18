import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {}
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserData = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchAndSetUser = async (session: any) => {
      try {
        if (!session?.user) {
          console.log("❌ Aucun user connecté");
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const userData = await fetchUserData(session.user.id);
        if (!userData) {
          console.log("❌ Aucun user trouvé, redirection...");
          await supabase.auth.signOut();
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          navigate('/login');
          return;
        }

        console.log("✅ User chargé :", userData);
        if (mounted) {
          setUser(userData);
          setLoading(false);
        }
      } catch (error) {
        console.error("🔥 ERREUR chargement user:", error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Check initial session
    supabase.auth.getSession().then(({ data }) => {
      fetchAndSetUser(data.session);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchAndSetUser(session);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Invalid login credentials');
      }

      const userData = await fetchUserData(authData.user.id);
      if (!userData) {
        await supabase.auth.signOut();
        throw new Error('Compte utilisateur non trouvé dans la base de données');
      }

      setUser(userData);
      console.log("✅ User chargé :", userData);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('Email ou mot de passe incorrect');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  if (loading) {
    console.log("⏳ Chargement User...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  console.log("✅ CONTEXT RENDU");
  return (
    <UserContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}