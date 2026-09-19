import { env } from '../src/server/config/env.js';

async function testSendToUser() {
  const apiKey = env.BREVO_API_KEY;
  const recipient = 'trustezika831@gmail.com';
  const senderEmail = 'oliversmith2140@gmail.com';

  console.log(`Testing Brevo API delivery to [${recipient}] from [${senderEmail}]...`);

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'MarkDriller', email: senderEmail },
      to: [{ email: recipient, name: 'Trust' }],
      subject: 'MarkDriller OTP Verification Code Test',
      htmlContent: '<p>Your MarkDriller 6-digit OTP is: <strong>839201</strong></p>',
    }),
  });

  console.log('Response status:', res.status);
  const body = await res.text();
  console.log('Response body:', body);
}

testSendToUser();
