import { supabase } from '../lib/supabase';
import type { TransportSlip, FreightSlip, SlipNumberConfig, SlipStatus } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

async function getNextSlipNumber(type: 'transport' | 'freight'): Promise<string> {
  const { data: existingConfig, error: checkError } = await supabase
    .from('slip_number_configs')
    .select('prefix, current_number')
    .eq('type', type)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Error checking slip number config: ${checkError.message}`);
  }

  if (!existingConfig) {
    const currentYear = new Date().getFullYear().toString();
    const defaultConfig = {
      type,
      prefix: currentYear,
      current_number: 0
    };

    const { error: insertError } = await supabase
      .from('slip_number_configs')
      .insert([defaultConfig]);

    if (insertError) {
      throw new Error(`Error creating default slip number config: ${insertError.message}`);
    }
  }

  const { data: config, error: fetchError } = await supabase
    .from('slip_number_configs')
    .select('prefix, current_number')
    .eq('type', type)
    .single();

  if (fetchError) {
    throw new Error(`Error fetching slip number config: ${fetchError.message}`);
  }

  const nextNumber = config.current_number + 1;

  const { error: updateError } = await supabase
    .from('slip_number_configs')
    .update({ current_number: nextNumber })
    .eq('type', type);

  if (updateError) {
    throw new Error(`Error updating slip number: ${updateError.message}`);
  }

  return `${config.prefix} ${nextNumber.toString().padStart(4, '0')}`;
}

export async function createTransportSlip(data: Omit<TransportSlip, 'id' | 'number' | 'created_at' | 'updated_at'>): Promise<TransportSlip> {
  const number = await getNextSlipNumber('transport');

  const { data: slip, error } = await supabase
    .from('transport_slips')
    .insert([{ ...data, number }])
    .select(`
      *,
      clients (
        nom
      ),
      vehicules (
        immatriculation
      )
    `)
    .single();

  if (error) {
    throw new Error(`Error creating transport slip: ${error.message}`);
  }

  return slip;
}

export async function createFreightSlip(data: Omit<FreightSlip, 'id' | 'number' | 'created_at' | 'updated_at'>): Promise<FreightSlip> {
  const number = await getNextSlipNumber('freight');

  // Extract commercial from data before inserting
  const { commercial_id, ...slipData } = data;

  const { data: slip, error } = await supabase
    .from('freight_slips')
    .insert([{ ...slipData, number, commercial_id }])
    .select(`
  id,
  number,
  status,
  client_id,
  clients(nom),
  fournisseur_id,
  fournisseurs(nom, telephone),
  loading_date,
  loading_time,
  loading_address,
  loading_contact,
  delivery_date,
  delivery_time,
  delivery_address,
  delivery_contact,
  goods_description,
  volume,
  weight,
  vehicle_type,
  exchange_type,
  instructions,
  price,
  payment_method,
  observations,
  photo_required,
  documents,
  commercial_id,
  users:commercial_id(name),
  created_at,
  updated_at
`)
    .single();

  if (error) {
    throw new Error(`Error creating freight slip: ${error.message}`);
  }

  return slip;
}

export async function getSlipNumberConfig(type: 'transport' | 'freight'): Promise<SlipNumberConfig> {
  const { data, error } = await supabase
    .from('slip_number_configs')
    .select('*')
    .eq('type', type)
    .single();

  if (error) {
    throw new Error(`Error fetching slip number config: ${error.message}`);
  }

  return data;
}

export async function updateSlipNumberConfig(
  type: 'transport' | 'freight',
  updates: { prefix?: string; current_number?: number }
): Promise<SlipNumberConfig> {
  const { data, error } = await supabase
    .from('slip_number_configs')
    .update(updates)
    .eq('type', type)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating slip number config: ${error.message}`);
  }

  return data;
}

export async function getAllTransportSlips(startDate?: string, endDate?: string): Promise<TransportSlip[]> {
  let query = supabase
    .from('transport_slips')
    .select(`
      *,
      clients (
        nom
      ),
      vehicules (
        immatriculation
      )
    `)
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('loading_date', startDate);
  }
  if (endDate) {
    query = query.lte('loading_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching transport slips: ${error.message}`);
  }

  return data || [];
}

export async function getAllFreightSlips(startDate?: string, endDate?: string): Promise<FreightSlip[]> {
  let query = supabase
    .from('freight_slips')
    .select(`
  id,
  number,
  status,
  client_id,
  clients(nom),
  fournisseur_id,
  fournisseurs(nom, telephone),
  loading_date,
  loading_time,
  loading_address,
  loading_contact,
  delivery_date,
  delivery_time,
  delivery_address,
  delivery_contact,
  goods_description,
  volume,
  weight,
  vehicle_type,
  exchange_type,
  instructions,
  price,
  payment_method,
  observations,
  photo_required,
  documents,
  commercial_id,
  users:commercial_id(name),
  created_at,
  updated_at
`)

    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('loading_date', startDate);
  }
  if (endDate) {
    query = query.lte('loading_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching freight slips: ${error.message}`);
  }

  return data || [];
}

export async function updateSlipStatus(
  id: string,
  status: SlipStatus,
  type: 'transport' | 'freight'
): Promise<void> {
  const { error } = await supabase
    .from(type === 'transport' ? 'transport_slips' : 'freight_slips')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(`Error updating slip status: ${error.message}`);
  }
}

async function generatePDFFromTemplate(slip: FreightSlip | TransportSlip, template: string, data: Record<string, string>): Promise<Blob> {
  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = template;

  // Replace placeholders
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    container.innerHTML = container.innerHTML.replace(placeholder, value || '');
  });

  // Add container to document
  document.body.appendChild(container);

  try {
    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Return as blob
    return pdf.output('blob');
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

export const generatePDF = async (slip: TransportSlip | FreightSlip, type: 'transport' | 'freight' = 'transport'): Promise<void> => {
  try {
    // Fetch template
    const response = await fetch('/src/templates/affretement.html');
    const template = await response.text();

    // Prepare data
    const data = {
      transporteur: type === 'freight' ? slip.fournisseurs?.nom || '' : slip.clients?.nom || '',
      tel_fax: type === 'freight' ? slip.fournisseurs?.telephone || '' : '',
      a_intention: '',
      date: format(new Date(), 'dd/MM/yyyy', { locale: fr }),
      date_heure_chargement: `${format(new Date(slip.loading_date), 'dd/MM/yyyy', { locale: fr })} ${slip.loading_time}`,
      date_heure_livraison: `${format(new Date(slip.delivery_date), 'dd/MM/yyyy', { locale: fr })} ${slip.delivery_time}`,
      adresse_chargement: slip.loading_address,
      adresse_livraison: slip.delivery_address,
      contact_chargement: slip.loading_contact,
      contact_livraison: slip.delivery_contact,
      marchandise: slip.goods_description,
      volume: slip.volume?.toString() || '-',
      poids: slip.weight?.toString() || '-',
      metre: '-',
      echange: slip.exchange_type,
      prix_ht: slip.price.toString(),
      mode_reglement: slip.payment_method,
      date_cachet: format(new Date(), 'dd/MM/yyyy', { locale: fr }),
      nom_interlocuteur: type === 'freight' ? slip.fournisseurs?.contact_nom || '' : ''
    };

    // Generate PDF
    const blob = await generatePDFFromTemplate(slip, template, data);

    // Download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type === 'transport' ? 'Transport' : 'Affretement'}_${slip.number.replace(/\s/g, '')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const downloadFreightPDF = generatePDF;