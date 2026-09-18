import { env } from '../src/server/config/env.js';
import { sendVerificationEmail } from '../src/server/services/emailService.js';
import nodemailer from 'nodemailer';

async function verifyBrevo() {
  console.log('\n======================================================');
  console.log('BREVO DUAL-DELIVERY ENGINE VERIFICATION');
  console.log('======================================================\n');

  console.log('1. Brevo REST API Key Authentication Test:');
  console.log(`   API Key: ${env.BREVO_API_KEY.slice(0, 12)}...${env.BREVO_API_KEY.slice(-8)}`);

  // Test Brevo Account API using the API Key
  try {
    const res = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
    });

    if (res.ok) {
      const account = await res.json();
      console.log('   ✅ Brevo API Key Validated Successfully!');
      console.log(`      Account Email: ${account.email}`);
      console.log(`      Company/Name:  ${account.companyName || account.firstName || 'Brevo Account'}`);
      console.log(`      Plan:          ${account.plan?.[0]?.type || 'Standard'}`);
    } else {
      const err = await res.text();
      console.error(`   ❌ Brevo API Key Rejected [HTTP ${res.status}]:`, err);
    }
  } catch (err: any) {
    console.error('   ❌ Network error calling Brevo API:', err.message);
  }

  console.log('\n2. Brevo SMTP Connection & Credentials Test (Port 465 SSL):');
  console.log(`   Host: ${env.EMAIL_HOST}:${env.EMAIL_PORT}`);
  console.log(`   User: ${env.EMAIL_USER}`);

  const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });

  await new Promise<void>((resolve) => {
    transporter.verify((err, success) => {
      if (err) {
        console.error('   ❌ Brevo SMTP Failed:', err.message);
      } else {
        console.log('   ✅ Brevo SMTP Credentials Verified Successfully on Port 465!');
      }
      resolve();
    });
  });

  console.log('\n3. Dual-Delivery End-to-End Live Dispatch Test:');
  console.log(`   Target: ${env.EMAIL_FROM}`);
  try {
    await sendVerificationEmail(env.EMAIL_FROM, 'Oliver Smith', '593812', 15);
    console.log('   ✅ Live Verification Email Dispatched Successfully!');
  } catch (err: any) {
    console.error('   ❌ Live dispatch error:', err.message);
  }

  console.log('\n======================================================');
  console.log('VERIFICATION COMPLETE');
  console.log('======================================================\n');
  process.exit(0);
}

verifyBrevo().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
