import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  Building2,
  FileText,
  AlertTriangle,
  PackageSearch,
  Clock,
  Settings,
  LogOut
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const Sidebar = () => {
  const { user, signOut } = useUser();
console.log("✅ SIDEBAR MONTÉ");
  return (
    <div className="flex">
      {/* Sidebar à gauche */}
      <div className="w-64 bg-[#1C2632] text-white h-screen fixed left-0 top-0 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-2 gap-1 w-8 h-8 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-sm"></div>
            ))}
          </div>
          <div className="text-sm">
            <div className="font-medium">{user?.name}</div>
            <div className="text-gray-400">{user?.role}</div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <NavLink to="/dashboard" className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/transport" className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <Truck size={20} />
            <span>Transport</span>
          </NavLink>

          <NavLink to="/freight" className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <PackageSearch size={20} />
            <span>Affrètement</span>
          </NavLink>

          <NavLink to="/clients" className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <Users size={20} />
            <span>Clients</span>
          </NavLink>

          <NavLink to="/suppliers" className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <Building2 size={20} />
            <span>Fournisseurs</span>
          </NavLink>

          <NavLink to="/billing" className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <FileText size={20} />
            <span>Facturation</span>
          </NavLink>

          <NavLink to="/pending" className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <Clock size={20} className="text-yellow-400" />
            <span>Dossiers en attente</span>
          </NavLink>

          <NavLink to="/disputes" className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
          }>
            <AlertTriangle size={20} />
            <span>Litiges</span>
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink to="/settings" className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
            }>
              <Settings size={20} />
              <span>Paramètres</span>
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button onClick={() => signOut()} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 w-full">
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Contenu dynamique des routes */}
      <div className="flex-1 ml-64 bg-gray-100 min-h-screen p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default Sidebar;
