import React, { useState, useRef } from 'react';
import { Plus, Search, FileDown, Upload, Pencil, Phone, Mail, Trash2 } from 'lucide-react';
import { useClients, useCreateClient, useUpdateClient } from '../hooks/useClients';
import { useCountries } from '../hooks/useCountries';
import type { Client, CreateClientPayload, Contact, AccountingContact } from '../types';
import ContactsModal from '../components/ContactsModal';
import CountrySelector from '../components/CountrySelector';
import CreateCountryModal from '../components/CreateCountryModal';
import OpeningHours, { type WeekSchedule } from '../components/OpeningHours';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { deleteClients } from '../services/clients';
import { parseClientsExcel } from '../utils/excel-import';

const DEFAULT_SCHEDULE: WeekSchedule = {
  monday: { start: '09:00', end: '19:00', closed: false },
  tuesday: { start: '09:00', end: '19:00', closed: false },
  wednesday: { start: '09:00', end: '19:00', closed: false },
  thursday: { start: '09:00', end: '19:00', closed: false },
  friday: { start: '09:00', end: '19:00', closed: false },
  saturday: { start: '09:00', end: '19:00', closed: true },
  sunday: { start: '09:00', end: '19:00', closed: true },
};

const ContactForm = ({
  contact,
  onChange,
  onRemove,
  isAccountingContact = false
}: {
  contact: Contact | AccountingContact;
  onChange: (updatedContact: Contact | AccountingContact) => void;
  onRemove?: () => void;
  isAccountingContact?: boolean;
}) => (
  <div className="border rounded-lg p-4 mb-4">
    <div className="grid grid-cols-2 gap-4">
      {!isAccountingContact && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Service</label>
          <input
            type="text"
            value={'service' in contact ? contact.service : ''}
            onChange={(e) => onChange({ ...contact, service: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Nom</label>
        <input
          type="text"
          value={contact.nom}
          onChange={(e) => onChange({ ...contact, nom: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Prénom</label>
        <input
          type="text"
          value={contact.prenom}
          onChange={(e) => onChange({ ...contact, prenom: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={contact.email || ''}
          onChange={(e) => onChange({ ...contact, email: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Téléphone</label>
        <input
          type="tel"
          value={contact.telephone || ''}
          onChange={(e) => onChange({ ...contact, telephone: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
    {!isAccountingContact && onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="mt-2 text-red-600 hover:text-red-800 text-sm"
      >
        Supprimer ce contact
      </button>
    )}
  </div>
);

const ClientForm = ({ 
  onSubmit, 
  onCancel, 
  initialData = null, 
  submitLabel = 'Créer',
  loading = false 
}: { 
  onSubmit: (data: CreateClientPayload) => void;
  onCancel: () => void;
  initialData?: Client | null;
  submitLabel?: string;
  loading?: boolean;
}) => {
  const [showCreateCountry, setShowCreateCountry] = useState(false);
  const [editingCountry, setEditingCountry] = useState<{ id: string; name: string; code: string } | null>(null);
  const { data: countries, create: createCountry, update: updateCountry } = useCountries();
  const [selectedCountryId, setSelectedCountryId] = useState(initialData?.country_id || '');
  const [contacts, setContacts] = useState<Contact[]>(
    initialData?.contacts || []
  );
  const [accountingContact, setAccountingContact] = useState<AccountingContact>(
    initialData?.accounting_contact || {
      nom: '',
      prenom: '',
      email: '',
      telephone: ''
    }
  );
  const [openingHours, setOpeningHours] = useState<WeekSchedule>(
    initialData?.opening_hours || DEFAULT_SCHEDULE
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const clientData: CreateClientPayload = {
      nom: formData.get('nom') as string,
      email: formData.get('email') as string,
      telephone: formData.get('telephone') as string,
      adresse_facturation: formData.get('adresse_facturation') as string,
      preference_facturation: formData.get('preference_facturation') as 'mensuelle' | 'hebdomadaire' | 'par_transport',
      tva_rate: formData.get('tva_assujetti') === 'true' ? Number(formData.get('tva_rate')) : undefined,
      numero_commande_requis: formData.get('numero_commande_requis') === 'true',
      country_id: selectedCountryId || undefined,
      contacts,
      accounting_contact: accountingContact,
      siret: formData.get('siret') as string,
      numero_tva: formData.get('numero_tva') as string,
      opening_hours: openingHours
    };

    onSubmit(clientData);
  };

  const handleCreateCountry = async (name: string, code: string) => {
    try {
      const newCountry = await createCountry(name, code);
      setSelectedCountryId(newCountry.id);
      setShowCreateCountry(false);
    } catch (error) {
      console.error('Error creating country:', error);
    }
  };

  const handleEditCountry = async (name: string, code: string) => {
    if (!editingCountry) return;
    try {
      await updateCountry(editingCountry.id, name, code);
      setEditingCountry(null);
    } catch (error) {
      console.error('Error updating country:', error);
    }
  };

  const addContact = () => {
    setContacts([
      ...contacts,
      {
        service: '',
        nom: '',
        prenom: '',
        email: '',
        telephone: ''
      }
    ]);
  };

  const updateContact = (index: number, updatedContact: Contact) => {
    const newContacts = [...contacts];
    newContacts[index] = updatedContact;
    setContacts(newContacts);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Modifier le client' : 'Nouveau client'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
              <CountrySelector
                countries={countries}
                selectedCountryId={selectedCountryId}
                onSelect={setSelectedCountryId}
                onCreateCountry={() => setShowCreateCountry(true)}
                onEditCountry={(country) => setEditingCountry(country)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                type="text"
                name="nom"
                required
                defaultValue={initialData?.nom}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={initialData?.email}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="tel"
                name="telephone"
                defaultValue={initialData?.telephone}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <OpeningHours
              value={openingHours}
              onChange={setOpeningHours}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700">SIRET</label>
              <input
                type="text"
                name="siret"
                defaultValue={initialData?.siret}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="123 456 789 00012"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">N° TVA intracommunautaire</label>
              <input
                type="text"
                name="numero_tva"
                defaultValue={initialData?.numero_tva}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="FR12345678900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse de facturation</label>
              <textarea
                name="adresse_facturation"
                rows={3}
                defaultValue={initialData?.adresse_facturation}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Préférence de facturation</label>
              <select
                name="preference_facturation"
                required
                defaultValue={initialData?.preference_facturation}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="mensuelle">Mensuelle</option>
                <option value="hebdomadaire">Hebdomadaire</option>
                <option value="par_transport">Par transport</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Assujetti à la TVA ?</label>
              <div className="mt-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tva_assujetti"
                    value="true"
                    defaultChecked={initialData?.tva_rate !== undefined}
                    className="form-radio"
                  />
                  <span className="ml-2">Oui</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tva_assujetti"
                    value="false"
                    defaultChecked={initialData?.tva_rate === undefined}
                    className="form-radio"
                  />
                  <span className="ml-2">Non</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Taux de TVA (%)</label>
              <input
                type="number"
                name="tva_rate"
                defaultValue={initialData?.tva_rate ?? 20}
                step="0.1"
                min="0"
                max="100"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Numéro de commande requis ?</label>
              <div className="mt-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="numero_commande_requis"
                    value="true"
                    defaultChecked={initialData?.numero_commande_requis}
                    className="form-radio"
                  />
                  <span className="ml-2">Oui</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="numero_commande_requis"
                    value="false"
                    defaultChecked={!initialData?.numero_commande_requis}
                    className="form-radio"
                  />
                  <span className="ml-2">Non</span>
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Contacts entreprise</h3>
                <button
                  type="button"
                  onClick={addContact}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Ajouter un contact
                </button>
              </div>
              {contacts.map((contact, index) => (
                <ContactForm
                  key={index}
                  contact={contact}
                  onChange={(updatedContact) => updateContact(index, updatedContact as Contact)}
                  onRemove={() => removeContact(index)}
                />
              ))}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Contact comptabilité</h3>
              <ContactForm
                contact={accountingContact}
                onChange={setAccountingContact}
                isAccountingContact
              />
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
              {loading ? 'Chargement...' : submitLabel}
            </button>
          </div>
        </form>
      </div>

      {showCreateCountry && (
        <CreateCountryModal
          onClose={() => setShowCreateCountry(false)}
          onSubmit={handleCreateCountry}
        />
      )}

      {editingCountry && (
        <CreateCountryModal
          onClose={() => setEditingCountry(null)}
          onSubmit={handleEditCountry}
          editingCountry={editingCountry}
        />
      )}
    </div>
  );
};

const Clients = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactsModal, setShowContactsModal] = useState<Client | null>(null);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: clients, loading, error, refresh } = useClients();
  const { create, loading: creating } = useCreateClient();
  const { update, loading: updating } = useUpdateClient();

  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClients(new Set(filteredClients.map(client => client.id)));
    } else {
      setSelectedClients(new Set());
    }
  };

  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (selectedClients.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteClients(Array.from(selectedClients));
      setShowDeleteConfirmation(false);
      setSelectedClients(new Set());
      refresh();
    } catch (err) {
      console.error('Error deleting clients:', err);
    }
  };

  const handleCreate = async (clientData: CreateClientPayload) => {
    try {
      await create(clientData);
      setShowForm(false);
      refresh();
    } catch (err) {
      console.error('Error creating client:', err);
    }
  };

  const handleUpdate = async (clientData: CreateClientPayload) => {
    if (!editingClient) return;
    try {
      await update(editingClient.id, clientData);
      setEditingClient(null);
      refresh();
    } catch (err) {
      console.error('Error updating client:', err);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      const clients = await parseClientsExcel(file);
      
      // Create each client
      for (const client of clients) {
        await create(client);
      }
      
      refresh();
      e.target.value = '';
    } catch (err) {
      console.error('Error importing Excel:', err);
      setImportError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const downloadSampleExcel = () => {
    const link = document.createElement('a');
    link.href = '/sample_clients.xlsx';
    link.download = 'sample_clients.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 ml-64">Chargement...</div>;
  if (error) return <div className="p-8 ml-64 text-red-600">Erreur: {error.message}</div>;

  return (
    <div className="p-8 ml-64">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Clients</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            Nouveau client
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDeleteConfirmation(true)}
            disabled={selectedClients.size === 0}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              selectedClients.size > 0
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Trash2 size={20} />
            Supprimer ({selectedClients.size})
          </button>
          <button
            onClick={downloadSampleExcel}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200"
          >
            <FileDown size={20} />
            📄 Télécharger un modèle Excel
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200"
          >
            <Upload size={20} />
            📥 Importer Excel
          </button>
        </div>
      </div>

      {importError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <pre className="whitespace-pre-wrap font-mono text-sm">{importError}</pre>
        </div>
      )}

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>

      {(showForm || editingClient) && (
        <ClientForm
          onSubmit={editingClient ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
          initialData={editingClient}
          submitLabel={editingClient ? 'Modifier' : 'Créer'}
          loading={creating || updating}
        />
      )}

      {showContactsModal && (
        <ContactsModal
          clientName={showContactsModal.nom}
          contacts={showContactsModal.contacts || []}
          accountingContact={showContactsModal.accounting_contact}
          onClose={() => setShowContactsModal(null)}
        />
      )}

      {showDeleteConfirmation && (
        <DeleteConfirmationModal
          onConfirm={handleDeleteSelected}
          onCancel={() => setShowDeleteConfirmation(false)}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedClients.size === filteredClients.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facturation</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedClients.has(client.id)}
                    onChange={() => handleSelectClient(client.id)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setEditingClient(client)}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <Pencil size={16} />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className="cursor-pointer hover:text-blue-600"
                      onClick={() => setShowContactsModal(client)}
                    >
                      {client.nom}
                    </span>
                    <button
                      onClick={() => setShowContactsModal(client)}
                      className={`${
                        client.contacts?.length ? 'text-blue-600' : 'text-gray-400'
                      } hover:text-blue-800`}
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={() => setShowContactsModal(client)}
                      className={`${
                        client.contacts?.length ? 'text-blue-600' : 'text-gray-400'
                      } hover:text-blue-800`}
                    >
                      <Mail size={16} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client.contacts?.length || 0} contact(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.telephone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.preference_facturation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clients;