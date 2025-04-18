import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import SlipForm from '../components/SlipForm';
import SlipStatusSelect from '../components/SlipStatusSelect';
import EmailModal from '../components/EmailModal';
import DocumentUploaderModal from '../components/DocumentUploaderModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import ActionButtons from '../components/ActionButtons';
import TableHeader from '../components/TableHeader';
import { createFreightSlip, getAllFreightSlips, generatePDF } from '../services/slips';
import type { FreightSlip } from '../types';
import { supabase } from '../lib/supabase';

const Freight = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slips, setSlips] = useState<FreightSlip[]>([]);
  const [loadingSlips, setLoadingSlips] = useState(true);
  const [editingSlip, setEditingSlip] = useState<FreightSlip | null>(null);
  const [emailSlip, setEmailSlip] = useState<FreightSlip | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState<FreightSlip | null>(null);
  const [viewingDocuments, setViewingDocuments] = useState<FreightSlip | null>(null);

  useEffect(() => {
    fetchSlips();
  }, []);

  const fetchSlips = async () => {
    try {
      const data = await getAllFreightSlips();
      setSlips(data);
    } catch (error) {
      console.error('Error fetching freight slips:', error);
      toast.error('Erreur lors du chargement des bordereaux');
    } finally {
      setLoadingSlips(false);
    }
  };

  const handleCreate = async (data: any) => {
    setLoading(true);
    try {
      const {
        commercial,
        exchange_pallets,
        ...cleanedData
      } = data;

      // Get the user's UUID if a commercial name is provided
      let commercialId = null;
      if (commercial) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('name', commercial)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
        } else if (userData) {
          commercialId = userData.id;
        }
      }

      await createFreightSlip({
        ...cleanedData,
        commercial_id: commercialId
      });

      setShowForm(false);
      fetchSlips();
      toast.success('Bordereau créé avec succès');
    } catch (error) {
      console.error('Error creating freight slip:', error);
      toast.error('Erreur lors de la création du bordereau');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingSlip) return;
    
    try {
      // TODO: Implement update logic
      setEditingSlip(null);
      fetchSlips();
      toast.success('Bordereau mis à jour avec succès');
    } catch (error) {
      console.error('Error updating slip:', error);
      toast.error('Erreur lors de la mise à jour du bordereau');
    }
  };

  const handleDownload = async (slip: FreightSlip) => {
    try {
      await generatePDF(slip, 'freight');
      toast.success('Bordereau téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading slip:', error);
      toast.error('Erreur lors du téléchargement du bordereau');
    }
  };

  const getDocumentCount = (slip: FreightSlip) => {
    return slip.documents ? Object.keys(slip.documents).length : 0;
  };

  if (loadingSlips) {
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Affrètement</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Créer un bordereau
        </button>
      </div>

      {showForm && (
        <SlipForm
          type="freight"
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={loading}
        />
      )}

      {editingSlip && (
        <SlipForm
          type="freight"
          onSubmit={handleUpdate}
          onCancel={() => setEditingSlip(null)}
          initialData={editingSlip}
        />
      )}

      {emailSlip && (
        <EmailModal
          client={emailSlip.client}
          pdfUrl=""
          onClose={() => setEmailSlip(null)}
        />
      )}

      {uploadingSlip && (
        <DocumentUploaderModal
          slipId={uploadingSlip.id}
          slipType="freight"
          onClose={() => setUploadingSlip(null)}
          onUploadComplete={fetchSlips}
        />
      )}

      {viewingDocuments && (
        <DocumentViewerModal
          slipId={viewingDocuments.id}
          slipType="freight"
          onClose={() => setViewingDocuments(null)}
          onDocumentDeleted={fetchSlips}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader>Statut</TableHeader>
              <TableHeader>Numéro</TableHeader>
              <TableHeader>Client</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>Affréteur</TableHeader>
              <TableHeader>ACHAT HT</TableHeader>
              <TableHeader>Vente HT</TableHeader>
              <TableHeader>MARGE €</TableHeader>
              <TableHeader>MARGE %</TableHeader>
              <TableHeader align="center">Actions</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {slips.map((slip) => (
              <tr key={slip.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <SlipStatusSelect
                    id={slip.id}
                    status={slip.status}
                    type="freight"
                    onUpdate={fetchSlips}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {slip.number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {slip.client?.nom}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(slip.delivery_date).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {slip.fournisseur?.nom}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {slip.purchase_price} €
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {slip.selling_price} €
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {slip.margin} €
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {slip.margin_rate?.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ActionButtons
                    slip={slip}
                    onEdit={() => setEditingSlip(slip)}
                    onEmail={() => setEmailSlip(slip)}
                    onUpload={() => setUploadingSlip(slip)}
                    onView={() => setViewingDocuments(slip)}
                    onDownload={() => handleDownload(slip)}
                    documentCount={getDocumentCount(slip)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Freight;