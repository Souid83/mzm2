import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Pilotage from './pages/Pilotage';
import Clients from './pages/Clients';
import Fournisseurs from './pages/Fournisseurs';
import Transport from './pages/Transport';
import Freight from './pages/Freight';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Pilotage />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/suppliers" element={<Fournisseurs />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/freight" element={<Freight />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;