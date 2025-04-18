import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { cleanPayload } from '../utils/cleanPayload';
import type { TransportSlip, FreightSlip, SlipStatus } from '../types';

export function cleanPayload<T extends Record<string, any>>(data: T): T {
  const numericFields = [
    "price", "purchase_price", "selling_price",
    "margin", "margin_rate", "volume", "weight"
  ];

  const result = {} as T;
  for (const [key, value] of Object.entries(data)) {
    if (key.endsWith("_id") && value === "") {
      result[key] = null as any;
    } else if (numericFields.includes(key) && (value === "" || isNaN(Number(value)))) {
      result[key] = 0 as any;
    } else {
      result[key] = value;
    }
  }
  return result;
}

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
  
  const payload = cleanPayload({
    ...data,
    number
  });

  const { data: slip, error } = await supabase
    .from('transport_slips')
    .insert([payload])
    .select(`
      id,
      number,
      status,
      client_id,
      client:client_id(nom),
      vehicule_id,
      vehicule:vehicule_id(immatriculation),
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
      order_number,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(`Error creating transport slip: ${error.message}`);
  }

  return slip;
}

export async function createFreightSlip(data: Omit<FreightSlip, 'id' | 'number' | 'created_at' | 'updated_at'>): Promise<FreightSlip> {
  const number = await getNextSlipNumber('freight');

  const payload = cleanPayload({
    ...data,
    number
  });

  const { data: slip, error } = await supabase
    .from('freight_slips')
    .insert([payload])
    .select(`
      id,
      number,
      status,
      client_id,
      client:client_id(nom),
      fournisseur_id,
      fournisseur:fournisseur_id(nom, telephone),
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
      commercial:commercial_id(name),
      order_number,
      purchase_price,
      selling_price,
      margin,
      margin_rate,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    console.error('Error creating freight slip:', error);
    console.error('Payload:', payload);
    throw new Error(`Error creating freight slip: ${error.message}`);
  }

  return slip;
}

export async function getAllTransportSlips(startDate?: string, endDate?: string): Promise<TransportSlip[]> {
  let query = supabase
    .from('transport_slips')
    .select(`
      id,
      number,
      status,
      client_id,
      client:client_id(nom),
      vehicule_id,
      vehicule:vehicule_id(immatriculation),
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
      order_number,
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
      client:client_id(nom),
      fournisseur_id,
      fournisseur:fournisseur_id(nom, telephone),
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
      commercial:commercial_id(name),
      order_number,
      purchase_price,
      selling_price,
      margin,
      margin_rate,
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

export const generatePDF = async (slip: TransportSlip | FreightSlip, type: 'transport' | 'freight' = 'transport'): Promise<void> => {
  try {
    // Fetch template
    const response = await fetch('/affretement.html');
    const template = await response.text();

    // Create temporary container
    const container = document.createElement('div');
    container.style.width = '210mm'; // A4 width
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // Prepare data
    const data = {
      transporteur: type === 'freight' ? slip.fournisseur?.nom || '' : slip.client?.nom || '',
      tel_fax: type === 'freight' ? slip.fournisseur?.telephone || '' : '',
      a_intention: 'EXPLOITATION',
      date: format(new Date(), 'dd/MM/yyyy', { locale: fr }),
      date_heure_chargement: `${format(new Date(slip.loading_date), 'dd/MM/yyyy', { locale: fr })} ${slip.loading_time}`,
      date_heure_livraison: `${format(new Date(slip.delivery_date), 'dd/MM/yyyy', { locale: fr })} ${slip.delivery_time}`,
      adresse_chargement: slip.loading_address || '',
      adresse_livraison: slip.delivery_address || '',
      contact_chargement: slip.loading_contact || '',
      contact_livraison: slip.delivery_contact || '',
      marchandise: slip.goods_description || '',
      volume: slip.volume?.toString() || '-',
      poids: slip.weight?.toString() || '-',
      metre: slip.metre?.toString() || '-',
      echange: slip.exchange_type || '',
      prix_ht: slip.price?.toString() || '-',
      mode_reglement: slip.payment_method || '',
      date_cachet: format(new Date(), 'dd/MM/yyyy', { locale: fr }),
      nom_interlocuteur: slip.commercial?.name || slip.commercial_id || 'NON RENSEIGNÉ'
    };

    // Replace placeholders
    let html = template;
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    });

    // Set HTML content
    container.innerHTML = html;

    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123 // A4 height in pixels at 96 DPI
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297); // A4 dimensions in mm

    // Generate filename: CLIENT - NUMBER - DATE.pdf
    const clientName = slip.client?.nom || 'Client';
    const slipNumber = slip.number;
    const currentDate = format(new Date(), 'dd-MM-yyyy', { locale: fr });
    const filename = `${clientName} - ${slipNumber} - ${currentDate}.pdf`;

    // Save PDF with formatted filename
    pdf.save(filename);

    // Clean up
    document.body.removeChild(container);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const downloadFreightPDF = generatePDF;