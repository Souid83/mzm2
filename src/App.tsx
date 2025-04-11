import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Fournisseurs from './pages/Fournisseurs';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/suppliers" element={<Fournisseurs />} />
          {/* Other routes will be added as we develop them */}
        </Routes>
      </div>
    </Router>
  );
}

export default App