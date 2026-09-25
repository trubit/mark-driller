/**
 * Official MarkDriller Support & Helpline Configuration
 * Database-backed with verified default platform fallbacks.
 * NOTE: Environment variables VITE_SUPPORT_* are NO LONGER the source of truth.
 * Authoritative contact information is retrieved dynamically from MongoDB.
 */

export interface SupportContactDetails {
  whatsappNumber: string;
  whatsappDisplay: string;
  whatsappEnabled: boolean;
  phone: string;
  phoneDisplay: string;
  phoneEnabled: boolean;
  email: string;
  emailDisplay: string;
  emailEnabled: boolean;
  workingHours: string;
}

export const SUPPORT_CONFIG: SupportContactDetails = {
  // WhatsApp number (digits only, e.g. '2348030001234')
  whatsappNumber: '2348030001234',
  whatsappDisplay: '+234 803 000 1234',
  whatsappEnabled: true,

  // Display phone number for calls
  phone: '+2348030001234',
  phoneDisplay: '+234 803 000 1234',
  phoneEnabled: true,

  // Official customer service email
  email: 'support@markdriller.com',
  emailDisplay: 'support@markdriller.com',
  emailEnabled: true,

  // Working hours
  workingHours: 'Mon – Sat: 8:00 AM – 8:00 PM WAT',
};

export const getWhatsAppUrl = (customMessage?: string, number?: string): string => {
  const activeNumber = (number || SUPPORT_CONFIG.whatsappNumber).replace(/[^0-9]/g, '');
  const message = encodeURIComponent(customMessage || 'Hello MarkDriller Support, I need assistance with CBT practice / activation.');
  if (activeNumber) {
    return `https://wa.me/${activeNumber}?text=${message}`;
  }
  return '/contact';
};

export const getTelUrl = (phone?: string): string => {
  const activePhone = phone || SUPPORT_CONFIG.phone || SUPPORT_CONFIG.phoneDisplay;
  if (!activePhone) return '/contact';
  const clean = activePhone.replace(/[^0-9+]/g, '');
  return `tel:${clean}`;
};

export const getMailtoUrl = (email?: string, subject?: string): string => {
  const activeEmail = (email || SUPPORT_CONFIG.email).trim();
  if (!activeEmail) return '/contact';
  const encodedSubj = encodeURIComponent(subject || 'Inquiry: MarkDriller Platform Support');
  return `mailto:${activeEmail}?subject=${encodedSubj}`;
};
