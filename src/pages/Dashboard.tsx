import React, { useState } from 'react';
import { Truck, Euro, Calendar, Phone, Mail } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/StatusBadge';
import ContactsModal from '../components/ContactsModal';
import { useAffretements } from '../hooks/useAffretements';
import { useLivraisons } from '../hooks/useLivraisons';
import { useClients } from '../hooks/useClients';
import type { Client } from '../types';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'freight'>('deliveries');
  const [activeFilter, setActiveFilter] = useState<'day' | 'week'>('day');
  const [dateRange, setDateRange] = useState<{ start: string; end?: string }>({
    start: new Date().toISOString().split('T')[0],
  });
  const [showContactsModal, setShowContactsModal] = useState<Client | null>(null);
  
  const { data: affretements, loading: loadingAffretements } = useAffretements();
  const { data: livraisons, loading: loadingLivraisons } = useLivraisons();
  const { data: clients } = useClients();

  // Calculate dashboard metrics
  const totalLivraisons = livraisons.length;
  const totalAffretements = affretements.length;
  const margeDuJour = Math.floor(affretements
    .reduce((sum, a) => sum + (a.margin || 0), 0));
  const caDuJour = Math.floor(affretements
    .reduce((sum, a) => sum + (a.sellingPrice || 0), 0));

  const handleClientClick = (clientName: string) => {
    const client = clients.find(c => c.nom === clientName);
    if (client) {
      setShowContactsModal(client);
    }
  };

  if (loadingAffretements || loadingLivraisons) {
    return (
      <div className="p-8 ml-64">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 ml-64">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-6 mb-8">
        <DashboardCard
          icon={<Truck size={32} className="mx-auto mb-4" />}
          value={totalLivraisons.toString()}
          title="Livraisons"
          className="text-center"
        />
        <DashboardCard
          icon={<Truck size={32} className="mx-auto mb-4" />}
          value={totalAffretements.toString()}
          title="Affrètement"
          color="text-green-600"
          className="text-center"
        />
        <DashboardCard
          icon={<Euro size={32} className="mx-auto mb-4" />}
          value={`${margeDuJour} €`}
          title="Marge du jour"
          color="text-blue-600"
          className="text-center"
        />
        <DashboardCard
          icon={<Euro size={32} className="mx-auto mb-4" />}
          value={`${caDuJour} €`}
          title="CA du jour"
          color="text-purple-600"
          className="text-center"
        />
      </div>

      <div className="mb-6 flex flex-col items-center space-y-4">
        <div className="space-x-4">
          <button
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'deliveries'
                ? 'bg-gray-200 text-gray-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('deliveries')}
          >
            Livraison
          </button>
          <button
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'freight'
                ? 'bg-green-100 text-green-800'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
            onClick={() => setActiveTab('freight')}
          >
            Affrètement
          </button>
        </div>

        <div className="space-x-2">
          <button
            className={`px-4 py-1 rounded-md text-sm ${
              activeFilter === 'day'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => setActiveFilter('day')}
          >
            Jour
          </button>
          <button
            className={`px-4 py-1 rounded-md text-sm ${
              activeFilter === 'week'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => setActiveFilter('week')}
          >
            Semaine
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Calendar size={20} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {activeFilter === 'week' && (
            <>
              <span className="text-gray-500">à</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}
        </div>
      </div>

      {showContactsModal && (
        <ContactsModal
          clientName={showContactsModal.nom}
          contacts={showContactsModal.contacts || []}
          accountingContact={showContactsModal.accounting_contact}
          onClose={() => setShowContactsModal(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              {activeTab === 'deliveries' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chauffeur
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {activeTab === 'freight' ? 'Affréteur' : 'Véhicule'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {activeTab === 'freight' ? 'Vente' : 'Prix/km'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeTab === 'freight'
              ? affretements.map((freight) => (
                  <tr key={freight.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={freight.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="cursor-pointer hover:text-blue-600"
                          onClick={() => handleClientClick(freight.client)}
                        >
                          {freight.client}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{freight.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{freight.subcontractor}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{Math.floor(freight.purchasePrice)} €</td>
                    <td className="px-6 py-4 whitespace-nowrap">{Math.floor(freight.sellingPrice)} €</td>
                  </tr>
                ))
              : livraisons.map((delivery) => (
                  <tr key={delivery.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={delivery.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="cursor-pointer hover:text-blue-600"
                          onClick={() => handleClientClick(delivery.client)}
                        >
                          {delivery.client}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{delivery.loadingDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">John Doe</td>
                    <td className="px-6 py-4 whitespace-nowrap">{delivery.vehicle}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{Math.floor(delivery.priceBeforeTax)} €</td>
                    <td className="px-6 py-4 whitespace-nowrap">{Math.floor(delivery.pricePerKm)} €</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;