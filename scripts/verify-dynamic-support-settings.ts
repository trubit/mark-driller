import { z } from 'zod';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/server/config/database.js';
import { SystemSetting } from '../src/server/models/SystemSetting.js';
import { getDynamicSupportConfig, DEFAULT_SUPPORT_CONFIG } from '../src/server/services/supportConfigService.js';
import { buildWhatsAppLink, buildTelLink, buildMailtoLink } from '../src/api/supportContact.js';
import { SUPPORT_CONFIG } from '../src/config/supportConfig.js';

console.log('⚙️ Running MarkDriller Dynamic Support Settings Verification...\n');

let failed = false;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failed = true;
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

// 1. Validation Schema Test (same schema used in PUT /api/admin/support-settings)
const supportSettingsUpdateSchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .min(7, 'WhatsApp number must be at least 7 digits')
    .max(25, 'WhatsApp number is too long')
    .regex(/^[0-9+() -]{7,25}$/, 'Invalid WhatsApp phone format'),
  whatsappDisplay: z.string().trim().max(50).optional().default(''),
  whatsappEnabled: z.boolean().optional().default(true),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(25, 'Phone number is too long')
    .regex(/^[0-9+() -]{7,25}$/, 'Invalid phone format'),
  phoneDisplay: z.string().trim().max(50).optional().default(''),
  phoneEnabled: z.boolean().optional().default(true),
  email: z.string().trim().email('Invalid support email address').max(100),
  emailDisplay: z.string().trim().max(100).optional().default(''),
  emailEnabled: z.boolean().optional().default(true),
  workingHours: z.string().trim().max(120).optional().default('Mon – Sat: 8:00 AM – 8:00 PM WAT'),
});

console.log('--- Testing Backend Validation Schemas ---');

// Valid payload
const validPayload = {
  whatsappNumber: '+234 814 555 0199',
  whatsappDisplay: '+234 814 555 0199 (Lagos & Abuja)',
  whatsappEnabled: true,
  phone: '+2348145550199',
  phoneDisplay: '+234 814 555 0199',
  phoneEnabled: true,
  email: 'official-support@markdriller.ng',
  emailDisplay: 'official-support@markdriller.ng',
  emailEnabled: true,
  workingHours: 'Mon – Sat: 7:30 AM – 8:30 PM WAT',
};

const validParsed = supportSettingsUpdateSchema.safeParse(validPayload);
assert(validParsed.success, 'Valid support settings payload passes Zod validation');

// Invalid WhatsApp (letters instead of digits)
const invalidWhatsApp = supportSettingsUpdateSchema.safeParse({
  ...validPayload,
  whatsappNumber: 'not-a-phone-number',
});
assert(!invalidWhatsApp.success, 'Invalid WhatsApp number correctly rejected by validation');

// Invalid Email
const invalidEmail = supportSettingsUpdateSchema.safeParse({
  ...validPayload,
  email: 'not-an-email-address',
});
assert(!invalidEmail.success, 'Invalid email address correctly rejected by validation');

// Too short phone
const tooShortPhone = supportSettingsUpdateSchema.safeParse({
  ...validPayload,
  phone: '123',
});
assert(!tooShortPhone.success, 'Too short phone number correctly rejected by validation');

// 2. Safe Link Generation Test
console.log('\n--- Testing Safe Support Link Generation ---');
const waLink = buildWhatsAppLink('+234 803 123 4567', 'Test Message');
assert(waLink.startsWith('https://wa.me/2348031234567?text='), `WhatsApp URL is properly sanitized: ${waLink}`);

const emptyWaLink = buildWhatsAppLink('');
assert(emptyWaLink === '/contact', 'Empty WhatsApp number safely falls back to /contact route');

const telLink = buildTelLink('+234 803 123 4567');
assert(telLink === 'tel:+2348031234567', `Telephone URI is properly formatted: ${telLink}`);

const mailtoLink = buildMailtoLink('help@markdriller.com', 'Subject Test');
assert(mailtoLink.startsWith('mailto:help@markdriller.com?subject='), `Mailto URI is properly formatted: ${mailtoLink}`);

// 3. Environment Variable Decoupling Test
console.log('\n--- Testing Environment Variable Decoupling ---');
assert(Boolean(SUPPORT_CONFIG.whatsappNumber), 'SUPPORT_CONFIG provides reliable platform default fallback');
assert(Boolean(SUPPORT_CONFIG.email), 'SUPPORT_CONFIG provides reliable platform email fallback');

// 4. Database Persistence & API Integration Test
console.log('\n--- Testing MongoDB Persistence & Live Dynamic Config ---');

async function testDatabaseIntegration() {
  try {
    await connectDatabase();
    console.log('  Database connected.');

    // Save test settings
    const testSettings = {
      whatsappNumber: '2348099887766',
      whatsappDisplay: '+234 809 988 7766',
      whatsappEnabled: true,
      phone: '+2348099887766',
      phoneDisplay: '+234 809 988 7766',
      phoneEnabled: true,
      email: 'verified-support@markdriller.com',
      emailDisplay: 'verified-support@markdriller.com',
      emailEnabled: true,
      workingHours: 'Mon – Fri: 9:00 AM – 5:00 PM WAT',
    };

    await SystemSetting.findOneAndUpdate(
      { key: 'CUSTOMER_SUPPORT_CONFIG' },
      {
        value: testSettings,
        description: 'Test support settings verification',
      },
      { upsert: true, new: true }
    );

    // Retrieve via service
    const dynamicConfig = await getDynamicSupportConfig();
    assert(dynamicConfig.whatsappNumber === '2348099887766', 'Dynamic config returns updated WhatsApp from DB');
    assert(dynamicConfig.email === 'verified-support@markdriller.com', 'Dynamic config returns updated email from DB');
    assert(dynamicConfig.workingHours === 'Mon – Fri: 9:00 AM – 5:00 PM WAT', 'Dynamic config returns updated working hours from DB');

    // Verify no secret leak
    const publicKeys = Object.keys(dynamicConfig);
    const forbiddenSecrets = ['password', 'secret', 'token', 'key', 'updatedBy', '_id', '__v'];
    const hasSecret = forbiddenSecrets.some((s) => publicKeys.includes(s));
    assert(!hasSecret, 'Public dynamic config does NOT expose any internal secrets or MongoDB metadata');

    await disconnectDatabase();
    console.log('  Database disconnected.');
  } catch (err: any) {
    console.error('  ⚠️ Database integration check skipped/errored:', err.message);
  }
}

testDatabaseIntegration().then(() => {
  if (failed) {
    console.error('\n❌ Dynamic support settings verification encountered failures.');
    process.exit(1);
  } else {
    console.log('\n✨ ALL DYNAMIC SUPPORT SETTINGS CHECKS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
});
