import React from 'react';
import { X, Phone, Mail } from 'lucide-react';
import type { Contact, AccountingContact } from '../types';

interface ContactsModalProps {
  clientName: string;
  contacts: Contact[];
  accountingContact?: AccountingContact;
  onClose: () => void;
}

const ContactsModal: React.FC<ContactsModalProps> = ({
  clientName,
  contacts,
  accountingContact,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Contacts - {clientName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {contacts.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mb-4">Contacts entreprise</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {contacts.map((contact, index) => (
                <div
                  key={contact.id || index}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="font-medium text-gray-900">
                    {contact.prenom} {contact.nom}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {contact.service}
                  </div>
                  {contact.email && (
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Mail size={16} className="mr-2" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="hover:text-blue-600"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.telephone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={16} className="mr-2" />
                      <a
                        href={`tel:${contact.telephone}`}
                        className="hover:text-blue-600"
                      >
                        {contact.telephone}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {accountingContact && (
          <>
            <h3 className="text-lg font-semibold mb-4">Contact comptabilité</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="font-medium text-gray-900">
                {accountingContact.prenom} {accountingContact.nom}
              </div>
              {accountingContact.email && (
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Mail size={16} className="mr-2" />
                  <a
                    href={`mailto:${accountingContact.email}`}
                    className="hover:text-blue-600"
                  >
                    {accountingContact.email}
                  </a>
                </div>
              )}
              {accountingContact.telephone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone size={16} className="mr-2" />
                  <a
                    href={`tel:${accountingContact.telephone}`}
                    className="hover:text-blue-600"
                  >
                    {accountingContact.telephone}
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ContactsModal;