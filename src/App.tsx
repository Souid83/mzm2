import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from './contexts/UserContext';
import PrivateRoute from './components/PrivateRoute';
import LoginForm from './components/LoginForm';
import Pilotage from './pages/Pilotage';
import Clients from './pages/Clients';
import Fournisseurs from './pages/Fournisseurs';
import Transport from './pages/Transport';
import Freight from './pages/Freight';
import Settings from './pages/Settings';
import Disputes from './pages/Disputes';
import Pending from './pages/Pending';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Sidebar />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Pilotage />} />
            <Route path="clients" element={<Clients />} />
            <Route path="suppliers" element={<Fournisseurs />} />
            <Route path="transport" element={<Transport />} />
            <Route path="freight" element={<Freight />} />
            <Route path="disputes" element={<Disputes />} />
            <Route path="pending" element={<Pending />} />
            <Route
              path="settings"
              element={
                <PrivateRoute roles={['admin']}>
                  <Settings />
                </PrivateRoute>
              }
            />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </UserProvider>
    </Router>
  );
}

export default App;