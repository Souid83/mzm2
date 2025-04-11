import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  Building2,
  FileText,
  AlertTriangle,
  PackageSearch,
  Clock
} from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-[#1C2632] text-white h-screen fixed left-0 top-0">
      <div className="p-4 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-1 w-8 h-8 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-sm"></div>
          ))}
        </div>
      </div>
      
      <nav className="p-4">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/transport"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <Truck size={20} />
          <span>Transport</span>
        </NavLink>

        <NavLink
          to="/freight"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <PackageSearch size={20} />
          <span>Affrètement</span>
        </NavLink>

        <NavLink
          to="/clients"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <Users size={20} />
          <span>Clients</span>
        </NavLink>

        <NavLink
          to="/suppliers"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <Building2 size={20} />
          <span>Fournisseurs</span>
        </NavLink>

        <NavLink
          to="/billing"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <FileText size={20} />
          <span>Facturation</span>
        </NavLink>

        <NavLink
          to="/pending"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <Clock size={20} className="text-yellow-400" />
          <span>Dossiers en attente</span>
        </NavLink>

        <NavLink
          to="/disputes"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-3 rounded-lg ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`
          }
        >
          <AlertTriangle size={20} />
          <span>Litiges</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;