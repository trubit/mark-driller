import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    if (env.EMAIL_USER && env.EMAIL_PASSWORD) {
      transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_PORT === 465,
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
        connectionTimeout: 10000,
        greetingTimeout: 8000,
        socketTimeout: 15000,
      });
    } else {
      // In development or test without live SMTP credentials, create a stream/json transporter
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows',
      });
    }
  }
  return transporter;
}


export interface EmailDispatchOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: { email: string; name?: string };
  tags?: string[];
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Safe HTML escaping to prevent XSS and HTML injection in transactional emails
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Send email via Brevo REST API v3 (HTTPS port 443, reliable on all cloud hosts)
 */
export async function sendViaBrevoApi(options: EmailDispatchOptions): Promise<EmailDispatchResult> {
  if (!env.BREVO_API_KEY) {
    console.error('❌ [BREVO API ERROR] BREVO_API_KEY is not set in environment variables. Please add it to your Render Environment tab.');
    return { success: false, error: 'BREVO_API_KEY is not set' };
  }

  // Brevo strictly requires sender.email to be a verified address in the Brevo account.
  // The verified address in this account is oliversmith2140@gmail.com.
  const sender = {
    name: 'MarkDriller Support',
    email: env.EMAIL_FROM || 'oliversmith2140@gmail.com',
  };

  const payload: any = {
    sender,
    replyTo: options.replyTo || { email: 'support@markdriller.com', name: 'MarkDriller Academic Support' },
    to: [{ email: options.to, name: options.toName || options.to.split('@')[0] }],
    subject: options.subject,
    htmlContent: options.html,
  };

  if (options.text) {
    payload.textContent = options.text;
  }
  if (options.tags && options.tags.length > 0) {
    payload.tags = options.tags;
  }

  let lastError = '';
  // Bounded retry logic: 2 attempts max with backoff
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const messageId = (data as any).messageId || `brevo-${Date.now()}`;
        console.log(`📧 [EMAIL DELIVERY via BREVO REST API] Delivered "${options.subject}" to ${options.to} (msgId: ${messageId})`);
        return { success: true, messageId };
      } else {
        const errBody = await response.text().catch(() => '');
        lastError = `Brevo HTTP ${response.status}: ${errBody.slice(0, 300)}`;
        console.error(`❌ [BREVO API ERROR ${response.status}] Attempt ${attempt}: Failed to deliver "${options.subject}" to ${options.to}:`, errBody);
        if (response.status < 500) {
          // Client configuration error (4xx) - do not repeat
          break;
        }
      }
    } catch (netErr: any) {
      lastError = `Network error: ${netErr.message}`;
      console.error(`❌ [BREVO NETWORK ERROR] Attempt ${attempt}: Failed contacting Brevo API:`, netErr.message);
    }

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  return { success: false, error: lastError };
}

/**
 * Resilient email dispatcher with primary Brevo API on cloud and SMTP support
 */
export async function dispatchEmail(options: EmailDispatchOptions): Promise<EmailDispatchResult> {
  // 1. Primary: Brevo HTTPS REST API on port 443 (fast, reliable, immune to cloud SMTP port blocking)
  if (env.BREVO_API_KEY) {
    try {
      const apiResult = await sendViaBrevoApi(options);
      if (apiResult.success) return apiResult;
      console.warn(`⚠️ [BREVO API WARNING] Primary API dispatch failed (${apiResult.error}). Trying SMTP fallback...`);
    } catch (apiErr: any) {
      console.warn(`⚠️ [BREVO API WARNING] Primary API dispatch failed (${apiErr.message}). Trying SMTP fallback...`);
    }
  }

  // 2. Try SMTP if configured with live credentials
  if (env.EMAIL_USER && env.EMAIL_PASSWORD) {
    try {
      const t = getTransporter();
      const info = await t.sendMail({
        from: env.EMAIL_FROM,
        to: options.to,
        replyTo: options.replyTo
          ? (options.replyTo.name ? `"${options.replyTo.name}" <${options.replyTo.email}>` : options.replyTo.email)
          : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`📧 [EMAIL DELIVERY via SMTP] Successfully delivered "${options.subject}" to ${options.to}`);
      return { success: true, messageId: info.messageId || `smtp-${Date.now()}` };
    } catch (smtpErr: any) {
      console.warn(`⚠️ [SMTP WARNING] SMTP dispatch to ${options.to} failed (${smtpErr.message}).`);
    }
  }

  // 3. If running in local development without credentials, log clearly
  if (env.NODE_ENV === 'development') {
    try {
      const t = getTransporter();
      const info = await t.sendMail({
        from: env.EMAIL_FROM,
        to: options.to,
        replyTo: options.replyTo
          ? (options.replyTo.name ? `"${options.replyTo.name}" <${options.replyTo.email}>` : options.replyTo.email)
          : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`📧 [EMAIL DEV STREAM] Processed local email for ${options.to}: ${options.subject}`);
      return { success: true, messageId: info?.messageId || `dev-stream-${Date.now()}` };
    } catch (err: any) {
      console.error('❌ Stream transport error:', err);
    }
  }

  console.error(`❌ [EMAIL DISPATCH FAILURE] Could not send email to ${options.to}. Ensure BREVO_API_KEY is configured in your Render environment variables.`);
  return { success: false, error: 'All email delivery channels failed' };
}

/**
 * Common HTML wrapper with MarkDriller brand styling
 */
function wrapBrandedTemplate(title: string, contentHtml: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 0; background-color: #f7f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #14181c; }
      .container { max-width: 580px; margin: 40px auto; background: #ffffff; border: 1.5px solid #14181c; box-shadow: 4px 4px 0 #14181c; }
      .header { padding: 24px; background: #14181c; color: #ffffff; text-align: center; }
      .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-decoration: none; }
      .logo span { color: #d4622b; }
      .body { padding: 32px 24px; }
      .otp-box { margin: 24px 0; padding: 20px; background: #fdfbf7; border: 1.5px dashed #d4622b; text-align: center; }
      .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #14181c; }
      .footer { padding: 20px 24px; background: #faf9f6; border-top: 1px solid #eae8e1; font-size: 12px; color: #6e7781; text-align: center; }
      .security-notice { font-size: 12px; color: #8c603a; background: #fff8f3; padding: 12px; border-left: 3px solid #d4622b; margin-top: 24px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Mark<span>Driller</span></div>
      </div>
      <div class="body">
        ${contentHtml}
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} MarkDriller Academic Technologies. All rights reserved.<br>
        Standard CBT Preparation for JAMB / UTME, WAEC, and NECO Candidates.
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Send 6-digit email verification OTP
 */
export async function sendVerificationEmail(
  to: string,
  fullName: string,
  otp: string,
  expiresMinutes: number = 15
): Promise<boolean> {
  const subject = `Verify Your MarkDriller Account — OTP: ${otp}`;
  const content = `
    <h2 style="font-size: 20px; margin: 0 0 12px; color: #14181c;">Confirm Your Email Address</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #444d56;">
      Hello <strong>${fullName}</strong>,<br>
      Thank you for registering on MarkDriller. To activate your student account and access accredited past questions and CBT practice rooms, please verify your email address using the One-Time Passcode (OTP) below:
    </p>
    <div class="otp-box">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #6e7781; margin-bottom: 8px;">Your 6-Digit Passcode</div>
      <div class="otp-code">${otp}</div>
      <div style="font-size: 12px; color: #d4622b; margin-top: 8px;">Expires in ${expiresMinutes} minutes</div>
    </div>
    <div class="security-notice">
      <strong>Security Reminder:</strong> MarkDriller staff will never ask for your password or OTP. If you did not create this account, please disregard this email.
    </div>
  `;

  const html = wrapBrandedTemplate(subject, content);

  console.log('\n============================================================');
  console.log(`🔑 [MARKDRILLER OTP VERIFICATION PASSCODE]`);
  console.log(`Recipient: ${to}`);
  console.log(`Passcode:  ${otp}`);
  console.log(`Expires:   ${expiresMinutes} minutes`);
  console.log('============================================================\n');

  const res = await dispatchEmail({ to, toName: fullName, subject, html });
  return res.success;
}

/**
 * Send password reset OTP
 */
export async function sendPasswordResetEmail(
  to: string,
  fullName: string,
  otp: string,
  expiresMinutes: number = 15
): Promise<boolean> {
  const subject = `Reset Your MarkDriller Password — OTP: ${otp}`;
  const content = `
    <h2 style="font-size: 20px; margin: 0 0 12px; color: #14181c;">Password Reset Request</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #444d56;">
      Hello <strong>${fullName}</strong>,<br>
      We received a request to reset your MarkDriller account password. Enter the 6-digit recovery code below on the password reset screen:
    </p>
    <div class="otp-box">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #6e7781; margin-bottom: 8px;">Recovery Security Code</div>
      <div class="otp-code">${otp}</div>
      <div style="font-size: 12px; color: #d4622b; margin-top: 8px;">Valid for ${expiresMinutes} minutes</div>
    </div>
    <div class="security-notice">
      <strong>Security Alert:</strong> If you did not request a password reset, please change your password immediately or contact support@markdriller.com.
    </div>
  `;

  const html = wrapBrandedTemplate(subject, content);

  console.log('\n============================================================');
  console.log(`🔑 [MARKDRILLER PASSWORD RESET PASSCODE]`);
  console.log(`Recipient: ${to}`);
  console.log(`Passcode:  ${otp}`);
  console.log(`Expires:   ${expiresMinutes} minutes`);
  console.log('============================================================\n');

  const res = await dispatchEmail({ to, toName: fullName, subject, html });
  return res.success;
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionEmail(
  to: string,
  fullName: string,
  planName: string,
  amountNGN: number,
  reference: string
): Promise<boolean> {
  const subject = `Payment Confirmed: Your ${planName} is Active!`;
  const content = `
    <h2 style="font-size: 20px; margin: 0 0 12px; color: #14181c;">Payment Receipt & Subscription Active</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #444d56;">
      Hello <strong>${fullName}</strong>,<br>
      Your payment for <strong>${planName}</strong> has been successfully processed through Paystack.
    </p>
    <div style="background: #f7f9fa; border: 1px solid #e1e4e8; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="color: #6e7781; padding: 4px 0;">Tier:</td><td><strong>${planName}</strong></td></tr>
        <tr><td style="color: #6e7781; padding: 4px 0;">Amount Paid:</td><td><strong>₦${amountNGN.toLocaleString()}</strong></td></tr>
        <tr><td style="color: #6e7781; padding: 4px 0;">Transaction Ref:</td><td style="font-family: monospace;">${reference}</td></tr>
        <tr><td style="color: #6e7781; padding: 4px 0;">Status:</td><td style="color: #2e7d32; font-weight: bold;">PAID / ACTIVE</td></tr>
      </table>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #444d56;">
      You now have unlimited access to all timed CBT mock examinations, worked mathematical solutions, and official downloadable syllabus revision guides.
    </p>
  `;

  const html = wrapBrandedTemplate(subject, content);
  const res = await dispatchEmail({ to, toName: fullName, subject, html });
  return res.success;
}

const SUPPORT_CATEGORY_LABELS: Record<string, string> = {
  PAYMENT_PROBLEM: 'Payment problem / Bank transfer',
  LOGIN_PROBLEM: 'Login or account problem',
  QUESTION_ERROR: 'Incorrect question or answer report',
  TECHNICAL_PROBLEM: 'Technical problem / CBT Simulator',
  SUBSCRIPTION_PROBLEM: 'Subscription problem / Tier activation',
  OTHER: 'General Support Inquiry',
};

/**
 * Send customer complaint notification email to the configured Admin Customer Support Email.
 * The customer's email is set as Reply-To so the support team can reply directly.
 */
export async function sendSupportComplaintNotificationEmail(params: {
  supportRecipientEmail: string;
  ticketReference: string;
  fullName: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  userId?: string;
  createdAt: Date;
}): Promise<EmailDispatchResult> {
  const categoryLabel = SUPPORT_CATEGORY_LABELS[params.category] || params.category;
  // Strictly prevent email header injection by removing line breaks from subject
  const safeSubjectText = params.subject.replace(/[\r\n]+/g, ' ').trim();
  const emailSubject = `[MarkDriller Support] ${categoryLabel} — Ref: ${params.ticketReference}: ${safeSubjectText}`;

  const submittedAtFormatted =
    new Date(params.createdAt).toLocaleString('en-NG', {
      timeZone: 'Africa/Lagos',
      dateStyle: 'medium',
      timeStyle: 'short',
    }) + ' WAT';

  const isHighPriority =
    params.priority === 'HIGH' || params.priority === 'URGENT' || params.category === 'PAYMENT_PROBLEM';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(emailSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #14181c;">
  <div style="max-width: 600px; margin: 30px auto; background: #ffffff; border: 1.5px solid #14181c; box-shadow: 4px 4px 0 #14181c;">
    <!-- Header -->
    <div style="padding: 20px 24px; background: #14181c; color: #ffffff;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
              Mark<span style="color: #d4622b;">Driller</span> Support Desk
            </div>
            <div style="font-size: 11.5px; color: #b0b8c0; margin-top: 2px;">
              Academic &amp; Student Operations Desk
            </div>
          </td>
          <td style="text-align: right;">
            <span style="display: inline-block; font-size: 11px; background: ${isHighPriority ? '#dc2626' : '#d4622b'}; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
              ${escapeHtml(params.priority)} PRIORITY
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Content -->
    <div style="padding: 24px;">
      <h2 style="font-size: 18px; margin: 0 0 16px; color: #14181c;">
        New Customer Support Inquiry Received
      </h2>

      <!-- Ticket Summary Table -->
      <div style="background: #faf9f6; border: 1px solid #eae8e1; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 13.5px; border-collapse: collapse;">
          <tr>
            <td style="color: #6e7781; padding: 6px 0; width: 140px;"><strong>Reference ID:</strong></td>
            <td style="font-family: monospace; font-size: 14px; font-weight: 700; color: #d4622b;">${escapeHtml(params.ticketReference)}</td>
          </tr>
          <tr>
            <td style="color: #6e7781; padding: 6px 0;"><strong>Category:</strong></td>
            <td style="font-weight: 600; color: #14181c;">${escapeHtml(categoryLabel)}</td>
          </tr>
          <tr>
            <td style="color: #6e7781; padding: 6px 0;"><strong>Subject:</strong></td>
            <td style="font-weight: 600; color: #14181c;">${escapeHtml(safeSubjectText)}</td>
          </tr>
          <tr>
            <td style="color: #6e7781; padding: 6px 0;"><strong>Customer Name:</strong></td>
            <td style="color: #14181c; font-weight: 600;">${escapeHtml(params.fullName)}</td>
          </tr>
          <tr>
            <td style="color: #6e7781; padding: 6px 0;"><strong>Customer Email:</strong></td>
            <td><a href="mailto:${escapeHtml(params.email)}" style="color: #d4622b; text-decoration: none; font-weight: 600;">${escapeHtml(params.email)}</a></td>
          </tr>
          <tr>
            <td style="color: #6e7781; padding: 6px 0;"><strong>Phone Number:</strong></td>
            <td style="color: #14181c;">${params.phone ? escapeHtml(params.phone) : '<em style="color:#6e7781;">Not provided</em>'}</td>
          </tr>
          <tr>
            <td style="color: #6e7781; padding: 6px 0;"><strong>Account Status:</strong></td>
            <td style="color: #14181c;">${params.userId ? `Registered Student (UID: ${escapeHtml(params.userId)})` : 'Guest / Prospective Student'}</td>
          </tr>
          <tr>
            <td style="color: #6e7781; padding: 6px 0;"><strong>Submitted At:</strong></td>
            <td style="color: #6e7781;">${submittedAtFormatted}</td>
          </tr>
        </table>
      </div>

      <!-- Complaint Details -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6e7781; margin-bottom: 8px;">
          Customer Message / Inquiry:
        </div>
        <div style="background: #ffffff; border: 1.5px solid #14181c; border-radius: 4px; padding: 16px; font-size: 14px; line-height: 1.6; color: #14181c; white-space: pre-wrap; word-break: break-word;">
${escapeHtml(params.message)}
        </div>
      </div>

      <!-- Direct Reply Notice -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 0 4px 4px 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
        <strong>💬 Direct Reply Enabled:</strong> Simply click <strong>Reply</strong> in your email client to respond directly to <strong>${escapeHtml(params.fullName)}</strong> at <code>${escapeHtml(params.email)}</code>. The customer's address is already set as the <code>Reply-To</code> header.
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 16px 24px; background: #faf9f6; border-top: 1px solid #eae8e1; font-size: 11.5px; color: #6e7781; text-align: center;">
      Dispatched to configured support inbox: <strong>${escapeHtml(params.supportRecipientEmail)}</strong><br>
      © ${new Date().getFullYear()} MarkDriller Academic Technologies · All Rights Reserved
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
[MarkDriller Support Desk] New Customer Support Request

Reference ID:   ${params.ticketReference}
Category:       ${categoryLabel}
Priority:       ${params.priority}
Subject:        ${safeSubjectText}
Customer Name:  ${params.fullName}
Customer Email: ${params.email}
Phone:          ${params.phone || 'Not provided'}
Account:        ${params.userId ? `Registered Student (UID: ${params.userId})` : 'Guest'}
Submitted At:   ${submittedAtFormatted}

Customer Inquiry / Message:
------------------------------------------------------------
${params.message}
------------------------------------------------------------

DIRECT REPLY:
Click "Reply" in your email client to respond directly to ${params.fullName} (${params.email}).

Configured Support Recipient: ${params.supportRecipientEmail}
  `.trim();

  return await dispatchEmail({
    to: params.supportRecipientEmail,
    toName: 'MarkDriller Support Desk',
    replyTo: {
      email: params.email,
      name: params.fullName,
    },
    subject: emailSubject,
    html,
    text: textContent,
    tags: ['customer-support', 'complaint-ticket'],
  });
}

/**
 * Send customer confirmation receipt email to the student acknowledging their support request.
 */
export async function sendCustomerTicketConfirmationEmail(params: {
  customerEmail: string;
  customerName: string;
  supportEmail: string;
  ticketReference: string;
  category: string;
  subject: string;
  message: string;
}): Promise<EmailDispatchResult> {
  const categoryLabel = SUPPORT_CATEGORY_LABELS[params.category] || params.category;
  const safeSubjectText = params.subject.replace(/[\r\n]+/g, ' ').trim();
  const emailSubject = `[MarkDriller Support] Inquiry Received — Ref: ${params.ticketReference}`;

  const messageExcerpt =
    params.message.length > 250 ? params.message.slice(0, 250) + '...' : params.message;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(emailSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #14181c;">
  <div style="max-width: 580px; margin: 30px auto; background: #ffffff; border: 1.5px solid #14181c; box-shadow: 4px 4px 0 #14181c;">
    <!-- Header -->
    <div style="padding: 24px; background: #14181c; color: #ffffff; text-align: center;">
      <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
        Mark<span style="color: #d4622b;">Driller</span>
      </div>
      <div style="font-size: 12px; color: #b0b8c0; margin-top: 4px;">
        Official Student &amp; Academic Help Desk
      </div>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <h2 style="font-size: 20px; margin: 0 0 12px; color: #14181c;">
        We Received Your Support Request
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #444d56;">
        Hello <strong>${escapeHtml(params.customerName)}</strong>,<br>
        Thank you for contacting MarkDriller Support. Our academic and technical operations team has registered your inquiry and assigned it the unique tracking reference below:
      </p>

      <!-- Ticket Box -->
      <div style="margin: 20px 0; padding: 18px; background: #fdfbf7; border: 1.5px dashed #d4622b; text-align: center;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #6e7781; margin-bottom: 6px;">Your Support Reference ID</div>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #14181c;">
          ${escapeHtml(params.ticketReference)}
        </div>
        <div style="font-size: 12px; color: #d4622b; margin-top: 6px;">
          Category: ${escapeHtml(categoryLabel)}
        </div>
      </div>

      <div style="background: #faf9f6; border: 1px solid #eae8e1; border-radius: 4px; padding: 14px; margin-bottom: 20px; font-size: 13px;">
        <div style="margin-bottom: 6px;"><strong>Subject:</strong> ${escapeHtml(safeSubjectText)}</div>
        <div style="color: #6e7781; line-height: 1.5;"><strong>Your message preview:</strong> <em>"${escapeHtml(messageExcerpt)}"</em></div>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #444d56;">
        Our team reviews inquiries promptly, typically within <strong>2 hours</strong> during standard support hours (Monday – Saturday, 8:00 AM – 8:00 PM WAT).
      </p>

      <div style="font-size: 12.5px; color: #8c603a; background: #fff8f3; padding: 12px; border-left: 3px solid #d4622b; margin-top: 20px; line-height: 1.5;">
        <strong>Need to add documents?</strong> If you need to send bank transfer receipts, proof of payment, or screenshots, simply reply directly to this email with your attachments.
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 24px; background: #faf9f6; border-top: 1px solid #eae8e1; font-size: 12px; color: #6e7781; text-align: center;">
      MarkDriller Support Desk · <a href="mailto:${escapeHtml(params.supportEmail)}" style="color: #d4622b; text-decoration: none;">${escapeHtml(params.supportEmail)}</a><br>
      © ${new Date().getFullYear()} MarkDriller Academic Technologies. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Hello ${params.customerName},

Thank you for reaching out to MarkDriller Support. We have received your inquiry.

Support Reference ID: ${params.ticketReference}
Category:             ${categoryLabel}
Subject:              ${safeSubjectText}

Our operations team will review your inquiry and respond within 2 hours during normal hours (Mon - Sat, 8:00 AM - 8:00 PM WAT).

If you have payment receipts or screenshots to provide, simply reply directly to this email.

MarkDriller Support Desk
${params.supportEmail}
  `.trim();

  return await dispatchEmail({
    to: params.customerEmail,
    toName: params.customerName,
    replyTo: {
      email: params.supportEmail,
      name: 'MarkDriller Academic Support',
    },
    subject: emailSubject,
    html,
    text: textContent,
    tags: ['customer-support', 'student-confirmation'],
  });
}


