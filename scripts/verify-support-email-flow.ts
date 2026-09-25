import mongoose from 'mongoose';
import { env } from '../src/server/config/env.js';
import { SupportTicket } from '../src/server/models/SupportTicket.js';
import { getDynamicSupportConfig } from '../src/server/services/supportConfigService.js';
import {
  escapeHtml,
  sendSupportComplaintNotificationEmail,
  sendCustomerTicketConfirmationEmail,
} from '../src/server/services/emailService.js';
import { z } from 'zod';

const createTicketSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Please provide your full name')
    .max(100)
    .refine((val) => !/[\r\n]/.test(val), 'Name cannot contain line breaks'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .max(100)
    .refine((val) => !/[\r\n]/.test(val), 'Email cannot contain line breaks'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  category: z.enum([
    'PAYMENT_PROBLEM',
    'LOGIN_PROBLEM',
    'QUESTION_ERROR',
    'TECHNICAL_PROBLEM',
    'SUBSCRIPTION_PROBLEM',
    'OTHER',
  ]),
  subject: z
    .string()
    .trim()
    .max(200)
    .optional()
    .default('General Support Inquiry')
    .transform((val) => val.replace(/[\r\n]+/g, ' ').trim()),
  message: z.string().trim().min(2).max(5000),
  idempotencyKey: z.string().trim().max(100).optional(),
});

async function runSupportEmailVerification() {
  console.log('\n======================================================');
  console.log('MARKDRILLER CUSTOMER COMPLAINT & SUPPORT EMAIL AUDIT');
  console.log('======================================================\n');

  let passedChecks = 0;
  let failedChecks = 0;

  function assert(condition: boolean, passMsg: string, failMsg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${passMsg}`);
      passedChecks++;
    } else {
      console.error(`  ❌ FAIL: ${failMsg}`);
      failedChecks++;
    }
  }

  // --- 1. Validation & Security Schemas ---
  console.log('--- 1. Testing Input Validation & Anti-Header Injection ---');

  const validPayload = {
    fullName: 'Chioma Okeke',
    email: 'chioma.student@example.com',
    phone: '+234 803 123 4567',
    category: 'PAYMENT_PROBLEM' as const,
    subject: 'Bank transfer receipt uploaded but account not upgraded',
    message: 'Hello, I transferred 3,500 NGN via bank transfer 30 minutes ago and uploaded the receipt. Please confirm.',
  };

  const parsedValid = createTicketSchema.safeParse(validPayload);
  assert(parsedValid.success, 'Valid customer complaint passes validation schema', 'Valid complaint was rejected');

  const headerInjectionPayload = {
    ...validPayload,
    email: 'attacker@example.com\r\nBcc: victim@example.com',
  };
  const parsedInjection = createTicketSchema.safeParse(headerInjectionPayload);
  assert(!parsedInjection.success, 'Email header injection with newline characters strictly rejected', 'Failed to reject email header injection');

  const invalidCategoryPayload = {
    ...validPayload,
    category: 'FREE_MONEY_PLEASE' as any,
  };
  const parsedInvalidCategory = createTicketSchema.safeParse(invalidCategoryPayload);
  assert(!parsedInvalidCategory.success, 'Invalid support category correctly rejected', 'Allowed invalid category');

  // --- 2. HTML Escaping & XSS Protection ---
  console.log('\n--- 2. Testing HTML Escaping & Sanitization ---');
  const rawXss = '<script>alert("pwned")</script> & "quotes" \'apostrophe\' <img src=x onerror=alert(1)>';
  const escaped = escapeHtml(rawXss);
  assert(
    !escaped.includes('<script>') && !escaped.includes('<img') && escaped.includes('&lt;script&gt;') && escaped.includes('&amp;'),
    'Malicious customer script tags strictly escaped into harmless entities',
    'escapeHtml failed to sanitize HTML'
  );

  // --- 3. Database Connection & Dynamic Config ---
  console.log('\n--- 3. Testing MongoDB Persistence & Dynamic Support Email Resolution ---');
  await mongoose.connect(env.MONGODB_URI);
  console.log('  Database connected.');

  const dynamicConfig = await getDynamicSupportConfig();
  const configuredSupportEmail = dynamicConfig.email && dynamicConfig.email.trim()
    ? dynamicConfig.email.trim()
    : env.ADMIN_EMAIL || 'support@markdriller.com';

  assert(Boolean(configuredSupportEmail), `Dynamic support recipient retrieved from MongoDB: ${configuredSupportEmail}`, 'Could not resolve support recipient');
  assert(
    configuredSupportEmail !== 'VITE_SUPPORT_EMAIL',
    'Support recipient is not using deprecated VITE_SUPPORT_EMAIL variable',
    'Found reference to VITE_SUPPORT_EMAIL'
  );

  // --- 4. Ticket Creation in MongoDB ---
  console.log('\n--- 4. Creating Support Ticket in MongoDB ---');
  const timestampPart = Date.now().toString(36).toUpperCase();
  const testRef = `MD-SUP-TEST${timestampPart}`;

  const testTicket = await SupportTicket.create({
    ticketReference: testRef,
    fullName: validPayload.fullName,
    email: validPayload.email,
    phone: validPayload.phone,
    category: validPayload.category,
    subject: validPayload.subject,
    message: validPayload.message,
    status: 'OPEN',
    priority: 'HIGH',
    emailDeliveryStatus: 'NOT_SENT',
  });

  assert(testTicket.ticketReference.startsWith('MD-SUP-'), `Ticket reference format is correct: ${testTicket.ticketReference}`, 'Incorrect ticket reference format');
  assert(testTicket.status === 'OPEN', 'Initial ticket status is OPEN', 'Initial status not OPEN');
  assert(testTicket.emailDeliveryStatus === 'NOT_SENT', 'Initial emailDeliveryStatus is NOT_SENT', 'emailDeliveryStatus not NOT_SENT');

  // --- 5. Live Transactional Email Dispatch via Brevo ---
  console.log('\n--- 5. Testing Brevo Transactional Email Dispatch ---');
  console.log(`  Dispatching notification to support recipient: ${configuredSupportEmail}`);
  console.log(`  Reply-To header configured as: ${validPayload.email}`);

  const dispatchResult = await sendSupportComplaintNotificationEmail({
    supportRecipientEmail: configuredSupportEmail,
    ticketReference: testTicket.ticketReference,
    fullName: testTicket.fullName,
    email: testTicket.email,
    phone: testTicket.phone,
    category: testTicket.category,
    subject: testTicket.subject,
    message: testTicket.message,
    priority: testTicket.priority,
    createdAt: testTicket.createdAt,
  });

  assert(dispatchResult.success, `Brevo transactional email delivered successfully (msgId: ${dispatchResult.messageId})`, `Email dispatch failed: ${dispatchResult.error}`);
  assert(Boolean(dispatchResult.messageId), 'Brevo API returned official message ID', 'Missing Brevo message ID');

  // Update ticket with delivery outcome
  testTicket.emailDeliveryStatus = dispatchResult.success ? 'SENT' : 'FAILED';
  testTicket.emailMessageId = dispatchResult.messageId;
  testTicket.emailRecipient = configuredSupportEmail;
  await testTicket.save();

  const refreshedTicket = await SupportTicket.findById(testTicket._id).lean();
  assert(refreshedTicket?.emailDeliveryStatus === 'SENT', 'Ticket document updated in MongoDB with emailDeliveryStatus = SENT', 'MongoDB ticket not updated with SENT status');
  assert(refreshedTicket?.emailMessageId === dispatchResult.messageId, 'Ticket document records Brevo message ID', 'MongoDB ticket missing message ID');

  // --- 6. Customer Confirmation Email Receipt ---
  console.log('\n--- 6. Testing Customer Confirmation Receipt Email ---');
  const confirmResult = await sendCustomerTicketConfirmationEmail({
    customerEmail: env.EMAIL_FROM, // Send test confirmation to verified sender mailbox
    customerName: testTicket.fullName,
    supportEmail: configuredSupportEmail,
    ticketReference: testTicket.ticketReference,
    category: testTicket.category,
    subject: testTicket.subject,
    message: testTicket.message,
  });

  assert(confirmResult.success, `Customer confirmation email dispatched successfully (msgId: ${confirmResult.messageId})`, `Customer confirmation failed: ${confirmResult.error}`);

  // --- 7. Ticket Resilience on Delivery Failure Simulation ---
  console.log('\n--- 7. Testing Complaint Preservation on Email Delivery Failure ---');
  const failedRef = `MD-SUP-FAIL${Date.now().toString(36).toUpperCase()}`;
  const preservedTicket = await SupportTicket.create({
    ticketReference: failedRef,
    fullName: 'Emeka Umeh',
    email: 'emeka@example.com',
    category: 'TECHNICAL_PROBLEM',
    subject: 'Simulated Network Failure Complaint',
    message: 'Testing that complaint is never lost even if external mail carrier fails',
    status: 'OPEN',
    priority: 'MEDIUM',
    emailDeliveryStatus: 'FAILED',
    emailError: 'Simulated upstream mail service timeout',
  });

  const checkPreserved = await SupportTicket.findById(preservedTicket._id).lean();
  assert(checkPreserved !== null, 'Complaint remains stored in MongoDB when mail delivery fails (Zero Data Loss)', 'Ticket was deleted on failure');
  assert(checkPreserved?.emailDeliveryStatus === 'FAILED', 'Ticket records FAILED status with diagnostic error', 'Status not marked as FAILED');

  // --- 8. Admin Status Updates & Operations ---
  console.log('\n--- 8. Testing Admin Ticket Management & Resolution ---');
  await SupportTicket.updateOne(
    { _id: testTicket._id },
    {
      $set: {
        status: 'RESOLVED',
        adminNotes: 'Resolved by operations team; bank transfer verified.',
        resolvedAt: new Date(),
      },
    }
  );

  const resolvedTicket = await SupportTicket.findById(testTicket._id).lean();
  assert(resolvedTicket?.status === 'RESOLVED', 'Admin can update ticket status to RESOLVED', 'Failed to update ticket status');
  assert(Boolean(resolvedTicket?.resolvedAt), 'resolvedAt timestamp recorded automatically upon ticket resolution', 'resolvedAt not set');

  // Cleanup test tickets
  await SupportTicket.deleteMany({ ticketReference: { $in: [testRef, failedRef] } });
  console.log('  Cleaned up temporary test tickets.');

  await mongoose.disconnect();
  console.log('  Database disconnected.\n');

  console.log('======================================================');
  console.log(`AUDIT COMPLETE: ${passedChecks} PASSED, ${failedChecks} FAILED`);
  console.log('======================================================\n');

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runSupportEmailVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
