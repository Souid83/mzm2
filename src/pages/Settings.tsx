import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailSettings {
  email: string;
  signature: string;
  template: string;
}

const DEFAULT_SETTINGS: EmailSettings = {
  email: '',
  signature: 'Cordialement,\nMZN Transport',
  template: `Bonjour,

Veuillez trouver ci-joint le bordereau de transport.

{signature}`
};

export default function Settings() {
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const savedSettings = localStorage.getItem('emailSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('emailSettings', JSON.stringify(settings));
    toast.success('Paramètres enregistrés');
  };

  return (
    <div className="p-8 ml-64">
      <h1 className="text-3xl font-bold mb-8">Paramètres</h1>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Configuration de la messagerie</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signature
                </label>
                <textarea
                  value={settings.signature}
                  onChange={(e) => setSettings({ ...settings, signature: e.target.value })}
                  rows={4}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Votre signature..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Cette signature sera automatiquement ajoutée à vos emails.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modèle d'email pour l'envoi de bordereau
                </label>
                <textarea
                  value={settings.template}
                  onChange={(e) => setSettings({ ...settings, template: e.target.value })}
                  rows={8}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Modèle d'email..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Utilisez {'{signature}'} pour insérer votre signature.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save size={20} className="mr-2" />
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}