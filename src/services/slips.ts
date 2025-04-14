import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as svg2pdfjs from 'svg2pdf.js';
import { supabase } from '../lib/supabase';
import type { TransportSlip, FreightSlip, SlipNumberConfig, SlipStatus } from '../types';

// Helper function to check if we need a new page
const needsNewPage = (currentY: number, requiredSpace: number, pageHeight: number, margin: number) => {
  return currentY + requiredSpace > pageHeight - margin;
};

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

  const { data: slip, error } = await supabase
    .from('freight_slips')
    .insert([{ ...data, number }])
    .select(`
      *,
      clients (
        nom
      )
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
      *,
      clients (
        nom
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

export async function generatePDF(data: TransportSlip | FreightSlip): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let currentY = margin;

  // Draw green sidebar
  doc.setFillColor(200, 255, 200);
  doc.rect(0, 0, 40, pageHeight, 'F');

  // Helper functions
  const drawText = (text: string, x: number, y: number, options: any = {}) => {
    const { fontSize = 7, color = 'black', align = 'left', style = 'normal' } = options;
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    doc.setTextColor(color === 'red' ? '#FF0000' : color === 'white' ? '#FFFFFF' : '#000000');
    doc.text(text, x, y, { align });
  };

  // Wrapper pour éviter les textes blancs invisibles
  const safeText = (text: string, x: number, y: number, options: any = {}) => {
    const fixedColor = options.color === 'white' ? 'black' : options.color;
    drawText(text, x, y, { ...options, color: fixedColor });
  };

  const drawRect = (x: number, y: number, w: number, h: number, options: any = {}) => {
    const { fillColor, strokeColor = '#000000' } = options;
    if (fillColor) {
      doc.setFillColor(fillColor);
      doc.rect(x, y, w, h, 'F');
    } else {
      doc.setDrawColor(strokeColor);
      doc.rect(x, y, w, h);
    }
  };

  // Add logo
  try {
    const svgResponse = await fetch('/logo_mzm_transport_cleaned.svg');
    const svgText = await svgResponse.text();
    const container = document.createElement('div');
    container.innerHTML = svgText;
    const svgElement = container.querySelector('svg');

    if (svgElement) {
      const logoWidth = 35;
      const logoHeight = 12;
      const logoX = pageWidth / 2 - logoWidth / 2;
      const logoY = currentY + 2;

      svgElement.setAttribute('width', `${logoWidth}mm`);
      svgElement.setAttribute('height', `${logoHeight}mm`);

      await svg2pdfjs.svg2pdf(svgElement, doc, {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight
      });

      doc.setFont('helvetica');
    }
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  currentY += 5;  // Reduced space after logo

  // Company header in green sidebar - moved up
  const companyStartY = currentY;
  safeText('MZN TRANSPORT', 5, companyStartY, { color: 'black' });
  safeText('12 RUE DES AIRES', 5, companyStartY + 3, { color: 'black' });
  safeText('34430 SAINT JEAN DE VÉDAS', 5, companyStartY + 6, { color: 'black' });
  safeText('FR48911875672', 5, companyStartY + 9, { color: 'black' });
  safeText('MEZIANE SALOMÉ', 5, companyStartY + 12, { color: 'black' });
  safeText('06 89 28 43 07', 5, companyStartY + 15, { color: 'black' });
  const companyBlockEndY = companyStartY + 18;

  // Right header - aligned with company block
  const rightColumn = pageWidth - margin - 55;
  safeText('Transporteur : MZN', rightColumn, companyStartY);
  safeText('Tél/fax : Mehdi', rightColumn, companyStartY + 3);
  safeText('À l\'intention de : ' + (data.client?.nom || '...'), rightColumn, companyStartY + 6);
  safeText('Date : ' + format(new Date(), 'dd/MM/yyyy'), rightColumn, companyStartY + 9);
  const transporterBlockEndY = companyStartY + 12;

  currentY = Math.max(companyBlockEndY, transporterBlockEndY) + 5;

  // Title and merged reference
  safeText('CONFIRMATION D\'AFFRÈTEMENT', pageWidth / 2, currentY, { 
    fontSize: 14, 
    align: 'center',
    style: 'bold'
  });
  currentY += 7;
  safeText(`Référence à rappeler sur facture : ${data.number}`, pageWidth / 2, currentY, { 
    align: 'center',
    style: 'bold',
    fontSize: 10
  });
  currentY += 7;
  safeText(
    'IL EST FORMELLEMENT INTERDIT DE MONTRER CETTE COMMANDE À L\'EXPÉDITEUR ET AU DESTINATAIRE',
    pageWidth / 2,
    currentY,
    { align: 'center', fontSize: 8, color: 'red' }
  );

  // Loading and delivery boxes
  const boxHeight = 28; // légèrement réduit
  const boxWidth = (pageWidth - 2 * margin - 10) / 2;

  // Loading box
  drawRect(margin, currentY, boxWidth, boxHeight);
  safeText('Date /heure de chargement', margin + 5, currentY + 7);
  safeText(format(new Date(data.loading_date), 'dd/MM/yyyy HH:mm', { locale: fr }), 
    margin + 5, currentY + 13);
  safeText('Adresse de chargement', margin + 5, currentY + 18);
  safeText(data.loading_address, margin + 5, currentY + 23);
  safeText('Contact', margin + 5, currentY + 28);
  safeText(data.loading_contact, margin + 5, currentY + 32);

  // Delivery box
  const rightBox = margin + boxWidth + 10;
  drawRect(rightBox, currentY, boxWidth, boxHeight);
  safeText('Date /heure de livraison', rightBox + 5, currentY + 7);
  safeText(format(new Date(data.delivery_date), 'dd/MM/yyyy', { locale: fr }) + 
    ' ' + data.delivery_time, rightBox + 5, currentY + 13);
  safeText('Adresse de livraison', rightBox + 5, currentY + 18);
  safeText(data.delivery_address, rightBox + 5, currentY + 23);
  safeText('Contact', rightBox + 5, currentY + 28);
  safeText(data.delivery_contact, rightBox + 5, currentY + 32);

  currentY += boxHeight + 1; // on remonte les blocs suivants juste en dessous

  // Combined goods and instructions block - single rectangle
  const goodsBlockStartY = currentY;
  
  // Draw rectangle first
  const goodsBlockHeight = 40; // Fixed height to accommodate all content
  drawRect(margin, goodsBlockStartY, pageWidth - 2 * margin, goodsBlockHeight);
  
  // Goods table
  (doc as any).autoTable({
    startY: currentY + 2,
    head: [['Marchandise', 'Volume', 'Poids', 'Metre', 'Échange']],
    body: [[
      data.goods_description,
      data.volume?.toString() || '-',
      data.weight?.toString() + ' kg' || '-',
      '-',
      data.exchange_type
    ]],
    styles: { 
      fontSize: 7,
      cellPadding: 1,
      lineWidth: 0.1
    },
    margin: { top: 1 },
    headStyles: {
      fillColor: [200, 220, 200],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    theme: 'grid'
  });

  currentY = (doc as any).lastAutoTable.finalY + 1;
  safeText('full small truck', margin + 5, currentY, { fontSize: 7, style: 'italic' });
  currentY += 3;

  // Instructions
  safeText('CONSIGNES', margin + 5, currentY + 3);
  safeText('BIEN ARRIMER LA MARCHANDISE', pageWidth / 2, currentY + 8, { 
    color: 'red',
    align: 'center',
    style: 'bold'
  });

  currentY = goodsBlockStartY + goodsBlockHeight + 5;

  // Combined price and payment block - single rectangle
  const priceBlockStartY = currentY;
  const priceBlockHeight = 12;
  
  // Draw rectangle first
  drawRect(margin, priceBlockStartY, pageWidth - 2 * margin, priceBlockHeight);
  
  // Left price section
  safeText('Prix de transport', margin + 5, currentY + 5);
  safeText(`${data.price || '-'} € HT`, margin + 5, currentY + 8);
  safeText('*taxe gasoil inclus*', margin + 5, currentY + 11, { fontSize: 6 });

  // Right payment section
  safeText('Mode de règlement', rightBox + 5, currentY + 5);
  safeText(data.payment_method || '-', rightBox + 5, currentY + 8);
  currentY += priceBlockHeight + 5;

  // Photo requirement - modified with rounded border
  const photoText = 'PRISE DE PHOTO IMPÉRATIVE AU CHARGEMENT ET DÉCHARGEMENT';
  const photoTextWidth = doc.getTextWidth(photoText);
  const photoBoxWidth = photoTextWidth + 10;
  const photoBoxX = (pageWidth - photoBoxWidth) / 2;
  
  doc.setDrawColor('#000000');
  doc.setLineWidth(0.5);
  doc.roundedRect(photoBoxX, currentY, photoBoxWidth, 10, 3, 3, 'S');
  drawText(photoText, pageWidth / 2, currentY + 7, {
    color: 'red',
    align: 'center',
    style: 'bold'
  });
  doc.setTextColor(0, 0, 0); // Reset text color to black

  currentY += 25;  // Increased spacing after photo block
  currentY += 15;  // Additional spacing before legal mentions

  // Vérification de l'espace pour les mentions légales
  if (needsNewPage(currentY, 20, pageHeight, margin)) {
    doc.addPage();
    currentY = margin;
  }
  currentY += 10;  // Added spacing before legal text

  // Legal text - adjusted spacing and justification
  doc.setFontSize(8);
  currentY += 5;  // Added spacing before facturation
  doc.text('FACTURATION: direction@mzntransport.fr', margin, currentY);
  currentY += 5;  // Spacing after facturation line
  doc.text('Merci de rappeler le numéro d\'affrètement impérativement sur vos factures + CMR', 
    margin, currentY, { align: 'justify', maxWidth: pageWidth - 2 * margin });
  currentY += 10;  // Increased spacing before legal text

  if (needsNewPage(currentY, 70, pageHeight, margin)) {
    doc.addPage();
    currentY = margin;
  }

  currentY += 5;  // Added spacing before legal text
  const legalText = `En cas de problème ou retard survenant lors du transport ou des opérations de chargement et déchargement, nous contacter impérativement afin d'en informer nos clients dans les meilleurs délais. - Les documents de transport émargés doivent impérativement nous parvenir avec la facture.
- Les instructions de ce fax doivent être suivies dans le strict respect de la règlementation sociale (Temps de conduite et de repos et respecter la limitation de vitesse).
- Le transporteur reconnaît le prix déterminé par les parties dans ce contrat ne relève pas que définition de l'article 3 de la loi 92-1445 du 31 décembre 1992. - L'entreprise certifie avoir souscrit une assurance tant en responsabilité civile et professionnelle que contractuelle, et être inscrit au registre des transporteurs.`;

  doc.text(legalText, margin, currentY, {
    maxWidth: pageWidth - 2 * margin,
    align: 'justify'
  });
  currentY += 5;  // Added spacing after legal text

  // Contact info - adjusted spacing
  if (needsNewPage(currentY, 40, pageHeight, margin)) {
    doc.addPage();
    currentY = margin;
  }

  currentY += 5;  // Added spacing before contacts
  safeText('NOS CONTACTS', margin, currentY, { fontSize: 9, style: 'bold' });
  currentY += 6;
  safeText('Direction: 06 89 28 43 07', margin, currentY);
  currentY += 6;
  safeText('Urgences: 06 12 34 56 78', margin, currentY);
  currentY += 6;
  safeText('Email: direction@mzntransport.fr', margin, currentY);
  currentY += 10;  // Increased spacing before approval

  // Approval section
  if (!needsNewPage(currentY, 30, pageHeight, margin)) {
    safeText('BON POUR ACCORD', pageWidth / 2 - 30, currentY + 10, {
      fontSize: 12,
      style: 'bold'
    });
    safeText('Date et cachet commercial', pageWidth / 2 + 30, currentY + 10, {
      fontSize: 8
    });
    // Add line for signature
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 30, currentY + 25, pageWidth / 2 + 30, currentY + 25);
  }
  if (!needsNewPage(currentY, 30, pageHeight, margin)) {
    safeText('BON POUR ACCORD', pageWidth / 2 - 30, currentY + 10, {
      fontSize: 12,
      style: 'bold'
    });
    safeText('Date et cachet commercial', pageWidth / 2 + 30, currentY + 10, {
      fontSize: 8
    });
    // Add line for signature
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 30, currentY + 25, pageWidth / 2 + 30, currentY + 25);
  }

  // Sécurité PDF
  if ((doc as any).internal.getNumberOfPages() === 0) {
    doc.addPage();
    doc.setFontSize(10);
    doc.text('Erreur de génération', pageWidth / 2, pageHeight / 2, { align: 'center' });
  }

  // Vérification finale du téléchargement
  const nomClient = (data as any).client?.nom || (data as any).clients?.nom || 'Client';
  const numAffretement = data.number || '0000';
  if ((doc as any).internal.getNumberOfPages() === 0) {
    doc.addPage();
    doc.setFontSize(10);
    doc.text('Erreur de génération', pageWidth / 2, pageHeight / 2, { align: 'center' });
  }
  doc.save(`${format(new Date(), 'yyyy-MM-dd')} - ${nomClient} - Affretement ${numAffretement}.pdf`);
}
