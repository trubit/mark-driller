import nodemailer from 'nodemailer';
import { env } from '../src/server/config/env.js';

console.log('\n======================================================');
console.log('BREVO / SMTP CONFIGURATION VERIFICATION');
console.log('======================================================\n');
console.log(`Host:     ${env.EMAIL_HOST}`);
console.log(`Port:     ${env.EMAIL_PORT}`);
console.log(`User:     ${env.EMAIL_USER ? env.EMAIL_USER.slice(0, 4) + '...' + env.EMAIL_USER.slice(-14) : 'NOT SET'}`);
console.log(`Password: ${env.EMAIL_PASSWORD ? '••••••••••••••• (' + env.EMAIL_PASSWORD.length + ' chars)' : 'NOT SET'}`);
console.log(`From:     ${env.EMAIL_FROM}`);
console.log('\nConnecting to SMTP server and verifying credentials...');

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

transporter.verify((error, _success) => {
  if (error) {
    console.error('\n❌ SMTP VERIFICATION FAILED:');
    console.error('Error Code:   ', (error as any).code || 'N/A');
    console.error('Response Code:', (error as any).responseCode || 'N/A');
    console.error('Command:      ', (error as any).command || 'N/A');
    console.error('Message:      ', error.message);
    if ((error as any).response) {
      console.error('SMTP Response:', (error as any).response);
    }
    process.exit(1);
  } else {
    console.log('\n✅ SMTP CONNECTION & CREDENTIALS VERIFIED SUCCESSFULLY!');
    console.log('Brevo SMTP server responded: Server is ready to take our messages.');
    console.log('======================================================\n');
    process.exit(0);
  }
});
