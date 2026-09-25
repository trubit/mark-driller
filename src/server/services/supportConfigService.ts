import { SystemSetting } from '../models/SystemSetting.js';

export interface CustomerSupportConfig {
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

export const DEFAULT_SUPPORT_CONFIG: CustomerSupportConfig = {
  whatsappNumber: '2348030001234',
  whatsappDisplay: '+234 803 000 1234',
  whatsappEnabled: true,
  phone: '+2348030001234',
  phoneDisplay: '+234 803 000 1234',
  phoneEnabled: true,
  email: 'support@markdriller.com',
  emailDisplay: 'support@markdriller.com',
  emailEnabled: true,
  workingHours: 'Mon – Sat: 8:00 AM – 8:00 PM WAT',
};

export async function getDynamicSupportConfig(): Promise<CustomerSupportConfig> {
  try {
    const setting = await SystemSetting.findOne({ key: 'CUSTOMER_SUPPORT_CONFIG' }).lean();
    if (setting && setting.value) {
      return {
        whatsappNumber: String(setting.value.whatsappNumber || DEFAULT_SUPPORT_CONFIG.whatsappNumber).replace(/[^0-9]/g, ''),
        whatsappDisplay: String(setting.value.whatsappDisplay || DEFAULT_SUPPORT_CONFIG.whatsappDisplay),
        whatsappEnabled: setting.value.whatsappEnabled !== false,
        phone: String(setting.value.phone || DEFAULT_SUPPORT_CONFIG.phone),
        phoneDisplay: String(setting.value.phoneDisplay || DEFAULT_SUPPORT_CONFIG.phoneDisplay),
        phoneEnabled: setting.value.phoneEnabled !== false,
        email: String(setting.value.email || DEFAULT_SUPPORT_CONFIG.email),
        emailDisplay: String(setting.value.emailDisplay || DEFAULT_SUPPORT_CONFIG.emailDisplay),
        emailEnabled: setting.value.emailEnabled !== false,
        workingHours: String(setting.value.workingHours || DEFAULT_SUPPORT_CONFIG.workingHours),
      };
    }
  } catch (err) {
    console.error('[SupportConfigService] Error reading support settings from DB:', err);
  }
  return DEFAULT_SUPPORT_CONFIG;
}
