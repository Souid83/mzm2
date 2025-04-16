import React, { useState, useEffect } from 'react';
import { Plus, FileText, Pencil, Send, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import SlipForm from '../components/SlipForm';
import StatusBadge from '../components/StatusBadge';
import SlipStatusSelect from '../components/SlipStatusSelect';
import EmailModal from '../components/EmailModal';
import DocumentUploaderModal from '../components/DocumentUploaderModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import ActionButtons from '../components/ActionButtons';
import TableHeader from '../components/TableHeader';
import { createFreightSlip, getAllFreightSlips, downloadFreightPDF } from '../services/slips';
import { downloadBPA, generateAndSaveBPA } from '../services/pdfTemplates/bpa';
import type { FreightSlip } from '../types';

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
      const newSlip = await createFreightSlip(data);
      // Generate BPA automatically
      await generateAndSaveBPA(newSlip);
      setShowForm(false);
      fetchSlips();
      toast.success('Bordereau et BPA créés avec succès');
    } catch (error) {
      console.error('Error creating freight slip:', error);
      toast.error('Erreur lors de la création du bordereau');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slip: FreightSlip) => {
    setEditingSlip(slip);
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

  const handleEmail = async (slip: FreightSlip) => {
    setEmailSlip(slip);
  };

  const handleUpload = (slip: FreightSlip) => {
    setUploadingSlip(slip);
  };

  const handleView = (slip: FreightSlip) => {
    setViewingDocuments(slip);
  };

  const handleDownload = async (slip: FreightSlip) => {
    try {
      await downloadFreightPDF(slip);
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
              <TableHeader>Prix HT</TableHeader>
              <TableHeader>Vente HT</TableHeader>
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
                  {slip.clients?.nom}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(slip.delivery_date).toLocaleDateString('fr-FR')}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Freight;