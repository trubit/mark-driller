/**
 * Official MarkDriller Support & Helpline Configuration
 * Reads from environment variables with safe platform defaults.
 */
export const SUPPORT_CONFIG = {
  // WhatsApp number (clean international format without '+' or spaces, e.g. '234XXXXXXXXXX')
  whatsappNumber: (((import.meta as any).env?.VITE_SUPPORT_WHATSAPP as string) || '').replace(/[^0-9]/g, ''),

  // Display phone number for calls
  phoneDisplay: ((import.meta as any).env?.VITE_SUPPORT_PHONE as string) || '',

  // Official customer service email
  email: ((import.meta as any).env?.VITE_SUPPORT_EMAIL as string) || 'support@markdriller.com',

  // Pre-filled WhatsApp message
  defaultMessage: 'Hello MarkDriller Support, I need assistance with CBT practice and activation',
};

export const getWhatsAppUrl = (customMessage?: string): string => {
  const message = encodeURIComponent(customMessage || SUPPORT_CONFIG.defaultMessage);
  if (SUPPORT_CONFIG.whatsappNumber) {
    return `https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${message}`;
  }
  // If no WhatsApp number is configured yet, link cleanly to the internal contact portal
  return '/contact';
};

