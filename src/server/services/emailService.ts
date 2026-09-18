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

/**
 * Helper to parse sender string into name and email
 */
function parseSender(fromStr: string): { name: string; email: string } {
  const match = fromStr.match(/^(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)$/);
  if (match) {
    return { name: match[1] || 'MarkDriller Support', email: match[2] };
  }
  return { name: 'MarkDriller Support', email: fromStr };
}

/**
 * Send email via Brevo REST API v3 (HTTPS port 443 fallback)
 */
export async function sendViaBrevoApi(options: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!env.BREVO_API_KEY) {
    return false;
  }

  const sender = parseSender(env.EMAIL_FROM);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: options.to, name: options.toName || options.to.split('@')[0] }],
      subject: options.subject,
      htmlContent: options.html,
    }),
  });

  if (response.ok) {
    const data = await response.json().catch(() => ({}));
    console.log(`📧 [EMAIL DELIVERY via BREVO REST API] Delivered "${options.subject}" to ${options.to} (msgId: ${(data as any).messageId || 'ok'})`);
    return true;
  } else {
    const errBody = await response.text().catch(() => '');
    console.error(`❌ [BREVO API ERROR ${response.status}] Failed to deliver "${options.subject}" to ${options.to}:`, errBody);
    return false;
  }
}

/**
 * Resilient email dispatcher with primary SMTP and automatic Brevo REST API failover
 */
export async function dispatchEmail(options: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  // If provider is set to brevo_api, send via REST API first
  if (env.EMAIL_PROVIDER === 'brevo_api' && env.BREVO_API_KEY) {
    try {
      const apiSuccess = await sendViaBrevoApi(options);
      if (apiSuccess) return true;
    } catch (apiErr: any) {
      console.warn(`⚠️ [BREVO API WARNING] Primary API dispatch failed (${apiErr.message}). Trying SMTP fallback...`);
    }
  }

  // 1. Try SMTP if configured
  if (env.EMAIL_USER && env.EMAIL_PASSWORD) {
    try {
      const t = getTransporter();
      await t.sendMail({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`📧 [EMAIL DELIVERY via SMTP] Successfully delivered "${options.subject}" to ${options.to}`);
      return true;
    } catch (smtpErr: any) {
      console.warn(`⚠️ [SMTP WARNING] SMTP dispatch to ${options.to} failed (${smtpErr.message}). Initiating fallback...`);
    }
  }

  // 2. Automatic Failover: Brevo REST API (HTTPS port 443, immune to SMTP port blocks)
  if (env.BREVO_API_KEY && env.EMAIL_PROVIDER !== 'brevo_api') {
    try {
      const apiSuccess = await sendViaBrevoApi(options);
      if (apiSuccess) return true;
    } catch (apiErr: any) {
      console.error(`❌ [BREVO API FAILOVER ERROR]:`, apiErr.message);
    }
  }

  // 3. In local development/test without credentials, stream mock transporter
  if (!env.EMAIL_USER && !env.BREVO_API_KEY) {
    try {
      const t = getTransporter();
      await t.sendMail({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`📧 [EMAIL MOCK/STREAM] Processed email for ${options.to}: ${options.subject}`);
      return true;
    } catch (err: any) {
      console.error('❌ Stream transport error:', err);
    }
  }

  console.error(`❌ All email delivery mechanisms failed for ${options.to}`);
  return false;
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
): Promise<void> {
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

  await dispatchEmail({ to, toName: fullName, subject, html });
}

/**
 * Send password reset OTP
 */
export async function sendPasswordResetEmail(
  to: string,
  fullName: string,
  otp: string,
  expiresMinutes: number = 15
): Promise<void> {
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

  await dispatchEmail({ to, toName: fullName, subject, html });
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
): Promise<void> {
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
  await dispatchEmail({ to, toName: fullName, subject, html });
}
