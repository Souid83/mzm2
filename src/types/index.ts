import { Database } from './supabase';

export interface DaySchedule {
  start: string;
  end: string;
  closed?: boolean;
}

export interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flag_url: string;
}

export interface DeliveryStatus {
  id: string;
  status: 'loaded' | 'waiting' | 'delivered' | 'dispute';
  client: string;
  freightNumber: string;
  vehicle: string;
  loadingDate: string;
  loadingPostalCode: string;
  deliveryDate: string;
  deliveryPostalCode: string;
  kilometers: number;
  priceBeforeTax: number;
  pricePerKm: number;
}

export interface FreightStatus {
  id: string;
  status: 'loaded' | 'waiting' | 'delivered' | 'dispute';
  date: string;
  client: string;
  subcontractor: string;
  loadingDate: string;
  loadingPostalCode: string;
  deliveryDate: string;
  deliveryPostalCode: string;
  purchasePrice: number;
  sellingPrice: number;
  margin: number;
  marginRate: number;
}

export interface Contact {
  id?: string;
  service: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
}

export interface AccountingContact {
  id?: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
}

export interface Client {
  id: string;
  nom: string;
  email?: string;
  emails?: string[];
  telephone?: string;
  adresse_facturation?: string;
  preference_facturation: 'mensuelle' | 'hebdomadaire' | 'par_transport';
  tva_rate?: number;
  numero_commande_requis: boolean;
  siret?: string;
  numero_tva?: string;
  country_id?: string;
  country?: Country;
  created_at?: string;
  updated_at?: string;
  contacts?: Contact[];
  accounting_contact?: AccountingContact;
  opening_hours?: WeekSchedule;
}

export interface CreateClientPayload {
  nom: string;
  email?: string;
  emails?: string[];
  telephone?: string;
  adresse_facturation?: string;
  preference_facturation: 'mensuelle' | 'hebdomadaire' | 'par_transport';
  tva_rate?: number;
  numero_commande_requis: boolean;
  siret?: string;
  numero_tva?: string;
  country_id?: string;
  contacts: Contact[];
  accounting_contact: AccountingContact;
  opening_hours?: WeekSchedule;
}

export interface Fournisseur {
  id: string;
  nom: string;
  contact_nom?: string;
  email?: string;
  emails?: string[];
  telephone?: string;
  services_offerts?: string[];
  zones_couvertes?: string[];
  conditions_paiement?: string;
  siret?: string;
  numero_tva?: string;
  country_id?: string;
  country?: Country;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFournisseurPayload {
  nom: string;
  contact_nom?: string;
  email?: string;
  emails?: string[];
  telephone?: string;
  services_offerts?: string[];
  zones_couvertes?: string[];
  conditions_paiement?: string;
  siret?: string;
  numero_tva?: string;
  country_id?: string;
}