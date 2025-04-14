import React, { useState, useEffect } from 'react';
import { Plus, FileText, Pencil, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import SlipForm from '../components/SlipForm';
import StatusBadge from '../components/StatusBadge';
import SlipStatusSelect from '../components/SlipStatusSelect';
import EmailModal from '../components/EmailModal';
import { createFreightSlip, getAllFreightSlips, generatePDF } from '../services/slips';
import type { FreightSlip } from '../types';

const Freight = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slips, setSlips] = useState<FreightSlip[]>([]);
  const [loadingSlips, setLoadingSlips] = useState(true);
  const [editingSlip, setEditingSlip] = useState<FreightSlip | null>(null);
  const [emailSlip, setEmailSlip] = useState<FreightSlip | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

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
      const slip = await createFreightSlip(data);
      setShowForm(false);
      fetchSlips();
      const url = await generatePDF(slip);
      setPdfUrl(url);
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
    try {
      const url = await generatePDF(slip);
      setPdfUrl(url);
      setEmailSlip(slip);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
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

      {emailSlip && pdfUrl && (
        <EmailModal
          client={emailSlip.clients}
          pdfUrl={pdfUrl}
          onClose={() => {
            setEmailSlip(null);
            setPdfUrl(null);
          }}
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
                Numéro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Affréteur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix HT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vente HT
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {slips.map((slip) => (
              <tr key={slip.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="group relative">
                    <SlipStatusSelect
                      id={slip.id}
                      status={slip.status}
                      type="freight"
                      onUpdate={fetchSlips}
                    />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Changer le statut
                    </span>
                  </div>
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
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-4 pr-4">
                    <div className="group relative">
                      <button
                        onClick={() => handleEdit(slip)}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <Pencil size={20} />
                      </button>
                      <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Modifier l'ensemble du bordereau
                      </span>
                    </div>
                    <div className="group relative">
                      <button
                        onClick={() => handleEmail(slip)}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <Send size={20} />
                      </button>
                      <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Envoyer le bordereau
                      </span>
                    </div>
                    <div className="group relative">
                      <button
                        onClick={() => generatePDF(slip)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FileText size={20} />
                      </button>
                      <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Télécharger le bordereau
                      </span>
                    </div>
                  </div>
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