import React, { useState, useEffect } from 'react';
import { Truck, Euro, Calendar, Pencil, Send, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardCard from '../components/DashboardCard';
import SlipStatusSelect from '../components/SlipStatusSelect';
import SlipForm from '../components/SlipForm';
import EmailModal from '../components/EmailModal';
import DocumentUploaderModal from '../components/DocumentUploaderModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import ActionButtons from '../components/ActionButtons';
import TableHeader from '../components/TableHeader';
import { generatePDF, downloadFreightPDF, getAllTransportSlips, getAllFreightSlips } from '../services/slips';
import { downloadBPA } from '../services/pdfTemplates/bpa';
import type { TransportSlip, FreightSlip } from '../types';

const Pilotage = () => {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'freight'>('deliveries');
  const [activeFilter, setActiveFilter] = useState<'day' | 'week'>('day');
  const [dateRange, setDateRange] = useState<{ start: string; end?: string }>({
    start: new Date().toISOString().split('T')[0],
  });
  const [editingSlip, setEditingSlip] = useState<TransportSlip | FreightSlip | null>(null);
  const [emailSlip, setEmailSlip] = useState<TransportSlip | FreightSlip | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState<TransportSlip | FreightSlip | null>(null);
  const [viewingDocuments, setViewingDocuments] = useState<TransportSlip | FreightSlip | null>(null);

  const { 
    data: transportSlips, 
    loading: loadingTransport,
    refresh: refreshTransport
  } = useSlips('transport', dateRange.start, dateRange.end);

  const { 
    data: freightSlips, 
    loading: loadingFreight,
    refresh: refreshFreight
  } = useSlips('freight', dateRange.start, dateRange.end);

  // Calculate dashboard metrics
  const totalTransport = transportSlips.length;
  const totalFreight = freightSlips.length;
  const marginOfDay = Math.floor(freightSlips.reduce((sum, slip) => sum + (slip.price || 0), 0));
  const revenueOfDay = Math.floor(transportSlips.reduce((sum, slip) => sum + (slip.price || 0), 0));

  const handleEdit = (slip: TransportSlip | FreightSlip) => {
    setEditingSlip(slip);
  };

  const handleEmail = async (slip: TransportSlip | FreightSlip) => {
    setEmailSlip(slip);
  };

  const handleUpload = (slip: TransportSlip | FreightSlip) => {
    setUploadingSlip(slip);
  };

  const handleView = (slip: TransportSlip | FreightSlip) => {
    setViewingDocuments(slip);
  };

  const handleDownload = async (slip: TransportSlip | FreightSlip) => {
    try {
      if ('fournisseurs' in slip) {
        await downloadFreightPDF(slip);
      } else {
        await generatePDF(slip);
      }
      toast.success('Bordereau téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading slip:', error);
      toast.error('Erreur lors du téléchargement du bordereau');
    }
  };

  const handleDownloadBPA = async (slip: FreightSlip) => {
    try {
      await downloadBPA(slip);
      toast.success('BPA téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading BPA:', error);
      toast.error('Erreur lors du téléchargement du BPA');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingSlip) return;
    
    try {
      // TODO: Implement update logic
      setEditingSlip(null);
      if ('vehicule_id' in editingSlip) {
        refreshTransport();
      } else {
        refreshFreight();
      }
    } catch (error) {
      console.error('Error updating slip:', error);
    }
  };

  const getDocumentCount = (slip: TransportSlip | FreightSlip) => {
    return slip.documents ? Object.keys(slip.documents).length : 0;
  };

  if (loadingTransport || loadingFreight) {
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
      <h1 className="text-3xl font-bold mb-8">Pilotage</h1>
      
      <div className="grid grid-cols-4 gap-6 mb-8">
        <DashboardCard
          icon={<Truck size={32} className="mx-auto mb-4" />}
          value={totalTransport.toString()}
          title="Livraisons"
          className="text-center"
        />
        <DashboardCard
          icon={<Truck size={32} className="mx-auto mb-4" />}
          value={totalFreight.toString()}
          title="Affrètement"
          color="text-green-600"
          className="text-center"
        />
        <DashboardCard
          icon={<Euro size={32} className="mx-auto mb-4" />}
          value={`${marginOfDay} €`}
          title="Marge du jour"
          color="text-blue-600"
          className="text-center"
        />
        <DashboardCard
          icon={<Euro size={32} className="mx-auto mb-4" />}
          value={`${revenueOfDay} €`}
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
            onClick={() => {
              setActiveFilter('day');
              setDateRange({ 
                start: new Date().toISOString().split('T')[0]
              });
            }}
          >
            Jour
          </button>
          <button
            className={`px-4 py-1 rounded-md text-sm ${
              activeFilter === 'week'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => {
              setActiveFilter('week');
              const today = new Date();
              const weekAgo = new Date();
              weekAgo.setDate(today.getDate() - 7);
              setDateRange({
                start: weekAgo.toISOString().split('T')[0],
                end: today.toISOString().split('T')[0]
              });
            }}
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

      {emailSlip && (
        <EmailModal
          client={emailSlip.clients}
          pdfUrl=""
          onClose={() => {
            setEmailSlip(null);
          }}
        />
      )}

      {uploadingSlip && (
        <DocumentUploaderModal
          slipId={uploadingSlip.id}
          slipType={activeTab === 'deliveries' ? 'transport' : 'freight'}
          onClose={() => setUploadingSlip(null)}
          onUploadComplete={activeTab === 'deliveries' ? refreshTransport : refreshFreight}
        />
      )}

      {viewingDocuments && (
        <DocumentViewerModal
          slipId={viewingDocuments.id}
          slipType={activeTab === 'deliveries' ? 'transport' : 'freight'}
          onClose={() => setViewingDocuments(null)}
          onDocumentDeleted={activeTab === 'deliveries' ? refreshTransport : refreshFreight}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader>Statut</TableHeader>
              <TableHeader>Client</TableHeader>
              <TableHeader>Date</TableHeader>
              {activeTab === 'deliveries' ? (
                <>
                  <TableHeader>Chauffeur</TableHeader>
                  <TableHeader>Véhicule</TableHeader>
                  <TableHeader>Prix HT</TableHeader>
                  <TableHeader>Prix/km</TableHeader>
                </>
              ) : (
                <>
                  <TableHeader>Affréteur</TableHeader>
                  <TableHeader>Prix HT</TableHeader>
                  <TableHeader>Vente HT</TableHeader>
                </>
              )}
              <TableHeader align="center">Actions</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeTab === 'freight'
              ? freightSlips.map((slip) => (
                  <tr key={slip.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SlipStatusSelect
                        id={slip.id}
                        status={slip.status}
                        type="freight"
                        onUpdate={refreshFreight}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {slip.clients?.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(slip.loading_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {slip.fournisseurs?.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {slip.price} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* TODO: Add selling price */}
                      - €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionButtons
                        slip={slip}
                        onEdit={() => handleEdit(slip)}
                        onEmail={() => handleEmail(slip)}
                        onUpload={() => handleUpload(slip)}
                        onView={() => handleView(slip)}
                        onDownload={() => handleDownload(slip)}
                        onDownloadBPA={() => handleDownloadBPA(slip)}
                        documentCount={getDocumentCount(slip)}
                        showBPA={true}
                      />
                    </td>
                  </tr>
                ))
              : transportSlips.map((slip) => (
                  <tr key={slip.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SlipStatusSelect
                        id={slip.id}
                        status={slip.status}
                        type="transport"
                        onUpdate={refreshTransport}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {slip.clients?.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(slip.loading_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      John Doe {/* TODO: Add driver assignment */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {slip.vehicules?.immatriculation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {slip.price} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* TODO: Add price per km calculation */}
                      - €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionButtons
                        slip={slip}
                        onEdit={() => handleEdit(slip)}
                        onEmail={() => handleEmail(slip)}
                        onUpload={() => handleUpload(slip)}
                        onView={() => handleView(slip)}
                        onDownload={() => handleDownload(slip)}
                        documentCount={getDocumentCount(slip)}
                      />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {editingSlip && (
        <SlipForm
          type={'vehicule_id' in editingSlip ? 'transport' : 'freight'}
          onSubmit={handleUpdate}
          onCancel={() => setEditingSlip(null)}
          initialData={editingSlip}
        />
      )}
    </div>
  );
};

// Custom hook for fetching slips
function useSlips(type: 'transport' | 'freight', startDate?: string, endDate?: string) {
  const [data, setData] = useState<(TransportSlip | FreightSlip)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const slips = await (type === 'transport' 
          ? getAllTransportSlips(startDate, endDate)
          : getAllFreightSlips(startDate, endDate));
        setData(slips);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [type, startDate, endDate]);

  const refresh = async () => {
    setLoading(true);
    try {
      const slips = await (type === 'transport'
        ? getAllTransportSlips(startDate, endDate)
        : getAllFreightSlips(startDate, endDate));
      setData(slips);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
}

export default Pilotage;