import React, { useState, useEffect } from 'react';
import { useClients } from '../hooks/useClients';
import { useFournisseurs } from '../hooks/useFournisseurs';
import { useUser } from '../contexts/UserContext';
import type { Client, TransportSlip, FreightSlip, Fournisseur } from '../types';

function cleanPayload(data: Record<string, any>) {
  const numericFields = [
    "price", "purchase_price", "selling_price",
    "margin", "margin_rate", "volume", "weight"
  ];

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.endsWith('_id') && value === "") result[key] = null;
    else if (numericFields.includes(key) && (value === "" || isNaN(Number(value)))) result[key] = 0;
    else result[key] = value;
  }
  return result;
}

const VEHICLE_TYPES = ['T1', 'T2', 'T3', 'T4'];
const SALES_TEAM = ['ORLANE', 'SALOMÉ', 'ELIOT', 'MEHDI'];

interface AddressFields {
  company: string;
  address: string;
  postalCode: string;
  city: string;
}

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
  const { user } = useUser();
  const { data: clients } = useClients();
  const { data: fournisseurs } = useFournisseurs();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [margin, setMargin] = useState<number>(0);
  const [marginRate, setMarginRate] = useState<number>(0);
  const [selectedCommercial, setSelectedCommercial] = useState<string>('');

  const [loadingAddress, setLoadingAddress] = useState<AddressFields>({
    company: '',
    address: '',
    postalCode: '',
    city: ''
  });

  const [deliveryAddress, setDeliveryAddress] = useState<AddressFields>({
    company: '',
    address: '',
    postalCode: '',
    city: ''
  });

  const [formData, setFormData] = useState({
    client_id: '',
    fournisseur_id: '',
    commercial_id: '',
    loading_date: '',
    loading_time: '',
    loading_contact: '',
    delivery_date: '',
    delivery_time: '',
    delivery_contact: '',
    goods_description: '',
    volume: '',
    weight: '',
    vehicle_type: 'T1',
    exchange_type: '',
    instructions: 'BIEN ARRIMER LA MARCHANDISE',
    price: '',
    payment_method: type === 'freight' ? 'Virement 30j FDM' : '',
    observations: '',
    photo_required: true,
    order_number: '',
    purchase_price: '',
    selling_price: '',
    margin: 0,
    margin_rate: 0
  });

  // Initialiser le commercial par défaut basé sur l'utilisateur connecté
  useEffect(() => {
    if (type === 'freight' && user?.name && !initialData) {
      const upperName = user.name.toUpperCase();
      const matchingName = SALES_TEAM.find(name => 
        name.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 
        upperName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      );
      if (matchingName) {
        setSelectedCommercial(matchingName);
        setFormData(prev => ({ ...prev, commercial_id: matchingName }));
      }
    }
  }, [user, type, initialData]);

  // Charger les données initiales lors de la modification
  useEffect(() => {
    if (initialData) {
      const loadingParts = initialData.loading_address.split(',').map(p => p.trim());
      const deliveryParts = initialData.delivery_address.split(',').map(p => p.trim());
      
      setLoadingAddress({
        company: loadingParts[0] || '',
        address: loadingParts[1] || '',
        postalCode: loadingParts[2]?.split(' ')[0] || '',
        city: loadingParts[2]?.split(' ').slice(1).join(' ') || ''
      });

      setDeliveryAddress({
        company: deliveryParts[0] || '',
        address: deliveryParts[1] || '',
        postalCode: deliveryParts[2]?.split(' ')[0] || '',
        city: deliveryParts[2]?.split(' ').slice(1).join(' ') || ''
      });

      // Handle freight-specific fields
      if ('fournisseur_id' in initialData) {
        const freightData = initialData as FreightSlip;
        setPurchasePrice(freightData.purchase_price || 0);
        setSellingPrice(freightData.selling_price || 0);
        setMargin(freightData.margin || 0);
        setMarginRate(freightData.margin_rate || 0);
        
        // Définir le commercial sélectionné depuis les données initiales
        if (freightData.commercial_id) {
          setSelectedCommercial(freightData.commercial_id);
        }
      }

      setFormData({
        ...formData,
        client_id: initialData.client_id || '',
        fournisseur_id: 'fournisseur_id' in initialData ? initialData.fournisseur_id : '',
        commercial_id: 'commercial_id' in initialData ? initialData.commercial_id : '',
        loading_date: initialData.loading_date || '',
        loading_time: initialData.loading_time || '',
        loading_contact: initialData.loading_contact || '',
        delivery_date: initialData.delivery_date || '',
        delivery_time: initialData.delivery_time || '',
        delivery_contact: initialData.delivery_contact || '',
        goods_description: initialData.goods_description || '',
        volume: initialData.volume?.toString() || '',
        weight: initialData.weight?.toString() || '',
        vehicle_type: initialData.vehicle_type || 'T1',
        exchange_type: initialData.exchange_type || '',
        instructions: initialData.instructions || 'BIEN ARRIMER LA MARCHANDISE',
        price: initialData.price?.toString() || '',
        payment_method: initialData.payment_method || (type === 'freight' ? 'Virement 30j FDM' : ''),
        observations: initialData.observations || '',
        photo_required: initialData.photo_required ?? true,
        order_number: 'order_number' in initialData ? initialData.order_number || '' : '',
        purchase_price: 'purchase_price' in initialData ? initialData.purchase_price?.toString() || '' : '',
        selling_price: 'selling_price' in initialData ? initialData.selling_price?.toString() || '' : '',
        margin: 'margin' in initialData ? initialData.margin || 0 : 0,
        margin_rate: 'margin_rate' in initialData ? initialData.margin_rate || 0 : 0
      });

      const client = clients.find(c => c.id === initialData.client_id);
      setSelectedClient(client || null);

      if ('fournisseur_id' in initialData && initialData.fournisseur_id) {
        const fournisseur = fournisseurs.find(f => f.id === initialData.fournisseur_id);
        setSelectedFournisseur(fournisseur || null);
      }
    }
  }, [initialData, clients, fournisseurs, type]);

  useEffect(() => {
    if (type === 'freight') {
      const margin = sellingPrice - purchasePrice;
      const rate = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
      setMargin(margin);
      setMarginRate(rate);
    }
  }, [purchasePrice, sellingPrice, type]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const client = clients.find(c => c.id === e.target.value);
    setSelectedClient(client || null);
    setFormData(prev => ({ ...prev, client_id: e.target.value }));
  };

  const handleFournisseurChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fournisseur = fournisseurs.find(f => f.id === e.target.value);
    setSelectedFournisseur(fournisseur || null);
    setFormData(prev => ({ ...prev, fournisseur_id: e.target.value }));
  };

  const handleCommercialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const commercial = e.target.value;
    setSelectedCommercial(commercial);
    setFormData(prev => ({ ...prev, commercial_id: commercial }));
  };

  const handleLoadingAddressChange = (field: keyof AddressFields, value: string) => {
    setLoadingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleDeliveryAddressChange = (field: keyof AddressFields, value: string) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
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

    const fullLoadingAddress = `${loadingAddress.company}, ${loadingAddress.address}, ${loadingAddress.postalCode} ${loadingAddress.city}`;
    const fullDeliveryAddress = `${deliveryAddress.company}, ${deliveryAddress.address}, ${deliveryAddress.postalCode} ${deliveryAddress.city}`;

    const submitData = {
      ...formData,
      loading_address: fullLoadingAddress,
      delivery_address: fullDeliveryAddress,
      volume: formData.volume ? Number(formData.volume) : null,
      weight: formData.weight ? Number(formData.weight) : null,
      price: Number(formData.price)
    };

    if (type === 'freight') {
  submitData.purchase_price = purchasePrice;
  submitData.selling_price = sellingPrice;
  submitData.margin = margin;
  submitData.margin_rate = marginRate;
  submitData.commercial_id = selectedCommercial;
}

// Nettoyage des UUID vides ("") et numériques vides ("") => null ou 0
const cleanedData = cleanPayload(submitData);

onSubmit(cleanedData);

  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {initialData ? 'Modifier le bordereau' : `Nouveau bordereau de ${type === 'transport' ? 'transport' : 'affrètement'}`}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
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

            {type === 'freight' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quel commercial fait la saisie ?
                </label>
                <select
                  name="commercial_id"
                  value={selectedCommercial}
                  onChange={handleCommercialChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un commercial</option>
                  {SALES_TEAM.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            {type === 'freight' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Sous-traitant</label>
                <select
                  name="fournisseur_id"
                  value={formData.fournisseur_id}
                  onChange={handleFournisseurChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {fournisseurs.map(fournisseur => (
                    <option key={fournisseur.id} value={fournisseur.id}>{fournisseur.nom}</option>
                  ))}
                </select>
                {selectedFournisseur && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-md">
                    <p><strong>Contact:</strong> {selectedFournisseur.contact_nom}</p>
                    <p><strong>Téléphone:</strong> {selectedFournisseur.telephone}</p>
                    <p><strong>Email:</strong> {selectedFournisseur.email}</p>
                  </div>
                )}
              </div>
            )}

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

            <div className="col-span-2 border p-4 rounded-md">
              <h3 className="text-lg font-medium mb-4">Adresse de chargement</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Entreprise</label>
                  <input
                    type="text"
                    value={loadingAddress.company}
                    onChange={(e) => handleLoadingAddressChange('company', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse</label>
                  <input
                    type="text"
                    value={loadingAddress.address}
                    onChange={(e) => handleLoadingAddressChange('address', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code postal</label>
                  <input
                    type="text"
                    value={loadingAddress.postalCode}
                    onChange={(e) => handleLoadingAddressChange('postalCode', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ville</label>
                  <input
                    type="text"
                    value={loadingAddress.city}
                    onChange={(e) => handleLoadingAddressChange('city', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Contact chargement</label>
                <input
                  type="text"
                  name="loading_contact"
                  value={formData.loading_contact}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
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
                  <label className="block text-sm font-medium text-gray-700">Heure</label>
                  <input
                    type="time"
                    name="loading_time"
                    value={formData.loading_time}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 border p-4 rounded-md">
              <h3 className="text-lg font-medium mb-4">Adresse de livraison</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Entreprise</label>
                  <input
                    type="text"
                    value={deliveryAddress.company}
                    onChange={(e) => handleDeliveryAddressChange('company', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse</label>
                  <input
                    type="text"
                    value={deliveryAddress.address}
                    onChange={(e) => handleDeliveryAddressChange('address', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code postal</label>
                  <input
                    type="text"
                    value={deliveryAddress.postalCode}
                    onChange={(e) => handleDeliveryAddressChange('postalCode', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ville</label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => handleDeliveryAddressChange('city', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Contact livraison</label>
                <input
                  type="text"
                  name="delivery_contact"
                  value={formData.delivery_contact}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
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
                  <label className="block text-sm font-medium text-gray-700">Heure</label>
                  <input
                    type="time"
                    name="delivery_time"
                    value={formData.delivery_time}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

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
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {VEHICLE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Échange palettes</label>
              <select
                name="exchange_type"
                value={formData.exchange_type}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
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

            {type === 'freight' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prix d'achat (€ HT)</label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    step="0.01"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prix de vente (€ HT)</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    step="0.01"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marge (€)</label>
                  <input
                    type="number"
                    value={margin}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Taux de marge (%)</label>
                  <input
                    type="number"
                    value={marginRate.toFixed(2)}
                    readOnly
                    className={`mt-1 block w-full rounded-md border-gray-300 bg-gray-50 ${
                      marginRate >= 20 ? 'text-green-600' : 'text-red-600'
                    }`}
                  />
                </div>
              </>
            ) : (
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
            )}

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
                <option value="Virement 30j FDM">Virement 30j FDM</option>
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