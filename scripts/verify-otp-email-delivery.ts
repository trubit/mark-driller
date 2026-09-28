import { env } from '../src/server/config/env.js';
import {
  parseSenderAddress,
  VERIFIED_BREVO_SENDER,
  DEFAULT_SENDER_NAME,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../src/server/services/emailService.js';

async function runOtpEmailVerification() {
  console.log('\n======================================================');
  console.log('MARKDRILLER OTP EMAIL DELIVERY VERIFICATION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(testName: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    }
  }

  // 1. Test parseSenderAddress with various RFC 5322 inputs
  console.log('--- TEST 1: Sender Address Parsing ---');
  const testCases = [
    {
      input: '"MarkDriller" <oliversmith2140@gmail.com>',
      expectedName: 'MarkDriller',
      expectedEmail: 'oliversmith2140@gmail.com',
    },
    {
      input: 'MarkDriller Support <oliversmith2140@gmail.com>',
      expectedName: 'MarkDriller Support',
      expectedEmail: 'oliversmith2140@gmail.com',
    },
    {
      input: 'oliversmith2140@gmail.com',
      expectedName: DEFAULT_SENDER_NAME,
      expectedEmail: 'oliversmith2140@gmail.com',
    },
    {
      input: '"oliversmith2140@gmail.com"',
      expectedName: DEFAULT_SENDER_NAME,
      expectedEmail: 'oliversmith2140@gmail.com',
    },
    {
      input: '',
      expectedName: DEFAULT_SENDER_NAME,
      expectedEmail: VERIFIED_BREVO_SENDER,
    },
  ];

  for (const tc of testCases) {
    const res = parseSenderAddress(tc.input);
    assert(
      `parseSenderAddress("${tc.input}") -> ${res.name} <${res.email}>`,
      res.name === tc.expectedName && res.email === tc.expectedEmail,
      `Got name: "${res.name}", email: "${res.email}"`
    );
  }

  // 2. Test live Brevo REST API dispatch
  console.log('\n--- TEST 2: Live Brevo REST API OTP Dispatch ---');
  const targetEmail = parseSenderAddress(env.EMAIL_FROM).email;
  console.log(`Target Recipient: ${targetEmail}`);

  const testOtp = '849201';
  const verifyResult = await sendVerificationEmail(targetEmail, 'Test Candidate', testOtp, 15);
  assert('sendVerificationEmail dispatches successfully via Brevo REST API', verifyResult === true);

  const resetOtp = '391024';
  const resetResult = await sendPasswordResetEmail(targetEmail, 'Test Candidate', resetOtp, 15);
  assert('sendPasswordResetEmail dispatches successfully via Brevo REST API', resetResult === true);

  console.log('\n======================================================');
  console.log(`VERIFICATION SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runOtpEmailVerification().catch((err) => {
  console.error('Fatal error during OTP email verification:', err);
  process.exit(1);
});
