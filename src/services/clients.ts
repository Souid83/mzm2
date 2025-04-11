import { supabase } from '../lib/supabase';
import type { Client, CreateClientPayload } from '../types';

export async function getAllClients(): Promise<Client[]> {
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*, contacts(*), accounting_contact(*)')
    .order('nom', { ascending: true });

  if (clientsError) {
    throw new Error(`Error fetching clients: ${clientsError.message}`);
  }

  return clients || [];
}

export async function createClient(client: CreateClientPayload): Promise<Client> {
  const { data: newClient, error: clientError } = await supabase
    .from('clients')
    .insert([{
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      adresse_facturation: client.adresse_facturation,
      preference_facturation: client.preference_facturation,
      tva_rate: client.tva_rate,
      numero_commande_requis: client.numero_commande_requis,
      siret: client.siret,
      numero_tva: client.numero_tva,
      country_id: client.country_id,
      opening_hours: client.opening_hours
    }])
    .select()
    .single();

  if (clientError) {
    throw new Error(`Error creating client: ${clientError.message}`);
  }

  // Create contacts
  if (client.contacts?.length > 0) {
    const { error: contactsError } = await supabase
      .from('client_contacts')
      .insert(
        client.contacts.map(contact => ({
          id: crypto.randomUUID(), // Generate UUID for each contact
          ...contact,
          client_id: newClient.id
        }))
      );

    if (contactsError) {
      throw new Error(`Error creating contacts: ${contactsError.message}`);
    }
  }

  // Create accounting contact
  if (client.accounting_contact) {
    const { error: accountingError } = await supabase
      .from('client_accounting_contacts')
      .insert([{
        id: crypto.randomUUID(), // Generate UUID for accounting contact
        ...client.accounting_contact,
        client_id: newClient.id
      }]);

    if (accountingError) {
      throw new Error(`Error creating accounting contact: ${accountingError.message}`);
    }
  }

  return getAllClients().then(clients => 
    clients.find(c => c.id === newClient.id) as Client
  );
}

export async function updateClient(id: string, client: Partial<CreateClientPayload>): Promise<Client> {
  const { error: clientError } = await supabase
    .from('clients')
    .update({
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      adresse_facturation: client.adresse_facturation,
      preference_facturation: client.preference_facturation,
      tva_rate: client.tva_rate,
      numero_commande_requis: client.numero_commande_requis,
      siret: client.siret,
      numero_tva: client.numero_tva,
      country_id: client.country_id,
      opening_hours: client.opening_hours
    })
    .eq('id', id);

  if (clientError) {
    throw new Error(`Error updating client: ${clientError.message}`);
  }

  // Update contacts if provided
  if (client.contacts) {
    // Delete existing contacts
    await supabase
      .from('client_contacts')
      .delete()
      .eq('client_id', id);

    // Insert new contacts
    if (client.contacts.length > 0) {
      const { error: contactsError } = await supabase
        .from('client_contacts')
        .insert(
          client.contacts.map(contact => ({
            id: crypto.randomUUID(), // Generate UUID for each contact
            ...contact,
            client_id: id
          }))
        );

      if (contactsError) {
        throw new Error(`Error updating contacts: ${contactsError.message}`);
      }
    }
  }

  // Update accounting contact if provided
  if (client.accounting_contact) {
    // Delete existing accounting contact
    await supabase
      .from('client_accounting_contacts')
      .delete()
      .eq('client_id', id);

    // Insert new accounting contact
    const { error: accountingError } = await supabase
      .from('client_accounting_contacts')
      .insert([{
        id: crypto.randomUUID(), // Generate UUID for accounting contact
        ...client.accounting_contact,
        client_id: id
      }]);

    if (accountingError) {
      throw new Error(`Error updating accounting contact: ${accountingError.message}`);
    }
  }

  return getAllClients().then(clients => 
    clients.find(c => c.id === id) as Client
  );
}

export async function deleteClients(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .in('id', ids);

  if (error) {
    throw new Error(`Error deleting clients: ${error.message}`);
  }
}