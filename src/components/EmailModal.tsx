import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendEmail } from '../services/email';
import type { Client } from '../types';

interface EmailSettings {
  email: string;
  signature: string;
  template: string;
}

interface EmailModalProps {
  client: Client;
  pdfUrl: string;
  onClose: () => void;
}

export default function EmailModal({ client, pdfUrl, onClose }: EmailModalProps) {
  const [selectedEmail, setSelectedEmail] = useState(client.email || '');
  const [customEmail, setCustomEmail] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Load email settings from localStorage
    const savedSettings = localStorage.getItem('emailSettings');
    if (savedSettings) {
      const settings: EmailSettings = JSON.parse(savedSettings);
      const body = settings.template.replace('{signature}', settings.signature);
      setEmailBody(body);
    } else {
      setEmailBody(`Bonjour,\n\nVeuillez trouver ci-joint le bordereau de transport.\n\nCordialement,\nMZN Transport`);
    }
  }, []);

  // Combine all available emails
  const availableEmails = [
    client.email,
    ...(client.emails || []),
    ...(client.contacts?.map(c => c.email) || []),
    client.accounting_contact?.email
  ].filter((email): email is string => Boolean(email));

  const handleSend = async () => {
    try {
      setSending(true);
      await sendEmail({
        to: customEmail || selectedEmail,
        subject: `Bordereau de transport - ${client.nom}`,
        body: emailBody,
        attachmentUrl: pdfUrl
      });
      toast.success('Email envoyé avec succès');
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Envoyer le bordereau</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email du destinataire
            </label>
            {availableEmails.length > 0 ? (
              <div className="flex gap-2">
                <select
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {availableEmails.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
                <span className="text-gray-500 self-center">ou</span>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="Saisir une autre adresse"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            ) : (
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Saisir l'adresse email"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={6}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || (!selectedEmail && !customEmail)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Envoi en cours...' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}