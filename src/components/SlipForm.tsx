import React, { useState, useEffect } from 'react';
import { useClients } from '../hooks/useClients';
import type { Client, TransportSlip, FreightSlip } from '../types';

interface SlipFormProps {
  type: 'transport' | 'freight';
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: TransportSlip | FreightSlip | null;
}

const SlipForm: React.FC<SlipFormProps> = ({
  type,
  onSubmit,
  onCancel,
  loading = false,
  initialData
}) => {
  const { data: clients } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    loading_date: '',
    loading_time: '',
    loading_address: '',
    loading_contact: '',
    delivery_date: '',
    delivery_time: '',
    delivery_address: '',
    delivery_contact: '',
    goods_description: '',
    volume: '',
    weight: '',
    vehicle_type: '',
    exchange_type: '',
    instructions: 'BIEN ARRIMER LA MARCHANDISE',
    price: '',
    payment_method: '',
    observations: '',
    photo_required: true,
    order_number: ''
  });

  // Pre-fill form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        client_id: initialData.client_id || '',
        loading_date: initialData.loading_date || '',
        loading_time: initialData.loading_time || '',
        loading_address: initialData.loading_address || '',
        loading_contact: initialData.loading_contact || '',
        delivery_date: initialData.delivery_date || '',
        delivery_time: initialData.delivery_time || '',
        delivery_address: initialData.delivery_address || '',
        delivery_contact: initialData.delivery_contact || '',
        goods_description: initialData.goods_description || '',
        volume: initialData.volume?.toString() || '',
        weight: initialData.weight?.toString() || '',
        vehicle_type: initialData.vehicle_type || '',
        exchange_type: initialData.exchange_type || '',
        instructions: initialData.instructions || 'BIEN ARRIMER LA MARCHANDISE',
        price: initialData.price?.toString() || '',
        payment_method: initialData.payment_method || '',
        observations: initialData.observations || '',
        photo_required: initialData.photo_required ?? true,
        order_number: 'order_number' in initialData ? initialData.order_number || '' : ''
      });

      // Set selected client
      const client = clients.find(c => c.id === initialData.client_id);
      setSelectedClient(client || null);
    }
  }, [initialData, clients]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const client = clients.find(c => c.id === e.target.value);
    setSelectedClient(client || null);
    setFormData(prev => ({ ...prev, client_id: e.target.value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      volume: formData.volume ? Number(formData.volume) : null,
      weight: formData.weight ? Number(formData.weight) : null,
      price: Number(formData.price)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {initialData ? 'Modifier le bordereau' : `Nouveau bordereau de ${type === 'transport' ? 'transport' : 'affrètement'}`}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Client</label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleClientChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.nom}</option>
                ))}
              </select>
            </div>

            {/* Order Number (Transport only) */}
            {type === 'transport' && selectedClient?.numero_commande_requis && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Numéro de commande client</label>
                <input
                  type="text"
                  name="order_number"
                  value={formData.order_number}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Loading Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date de chargement</label>
              <input
                type="date"
                name="loading_date"
                value={formData.loading_date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Heure de chargement</label>
              <input
                type="time"
                name="loading_time"
                value={formData.loading_time}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Adresse de chargement</label>
              <input
                type="text"
                name="loading_address"
                value={formData.loading_address}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Contact chargement</label>
              <input
                type="text"
                name="loading_contact"
                value={formData.loading_contact}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Delivery Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date de livraison</label>
              <input
                type="date"
                name="delivery_date"
                value={formData.delivery_date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Heure de livraison</label>
              <input
                type="time"
                name="delivery_time"
                value={formData.delivery_time}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Adresse de livraison</label>
              <input
                type="text"
                name="delivery_address"
                value={formData.delivery_address}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Contact livraison</label>
              <input
                type="text"
                name="delivery_contact"
                value={formData.delivery_contact}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Goods Info */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Marchandise / désignation</label>
              <input
                type="text"
                name="goods_description"
                value={formData.goods_description}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Volume (m³)</label>
              <input
                type="number"
                name="volume"
                value={formData.volume}
                onChange={handleInputChange}
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Poids (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type de véhicule</label>
              <input
                type="text"
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type d'échange</label>
              <input
                type="text"
                name="exchange_type"
                value={formData.exchange_type}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Consignes</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                rows={3}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Prix de transport (HT)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mode de règlement</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Sélectionner un mode</option>
                <option value="virement">Virement</option>
                <option value="cheque">Chèque</option>
                <option value="especes">Espèces</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Observations</label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="photo_required"
                  checked={formData.photo_required}
                  onChange={(e) => setFormData(prev => ({ ...prev, photo_required: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-600">Photo CMR impérative</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : initialData ? 'Modifier' : 'Créer le bordereau'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SlipForm;