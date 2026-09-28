import { generateNumericOtp, hashOtp, verifyOtpHash } from '../src/server/utils/otp.js';
import { env } from '../src/server/config/env.js';

let passed = 0;
let total = 0;

function assert(description: string, condition: boolean, details?: string) {
  total++;
  if (condition) {
    console.log(`✅ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${description} ${details ? `(${details})` : ''}`);
  }
}

async function runOtpLifecycleTests() {
  console.log('\n======================================================');
  console.log('MARKDRILLER OTP SECURE LIFECYCLE TEST SUITE');
  console.log('======================================================\n');

  // 1. Generation
  const otp1 = generateNumericOtp();
  assert('OTP is 6 digits string', /^\d{6}$/.test(otp1), `Generated: ${otp1}`);

  // 2. Cryptographic Hashing
  const hash1 = hashOtp(otp1);
  assert('Hashed OTP is 64-char hex SHA-256 string', /^[a-f0-9]{64}$/.test(hash1));
  assert('Plain OTP matches its hash', verifyOtpHash(otp1, hash1));
  assert('Incorrect OTP fails hash verification', !verifyOtpHash('000000', hash1));

  // 3. Expiration calculation
  assert('Default OTP_EXPIRATION_MINUTES is 30 minutes', env.OTP_EXPIRATION_MINUTES === 30);
  const expiryDate = new Date(Date.now() + env.OTP_EXPIRATION_MINUTES * 60 * 1000);
  assert('Expiration is in future', expiryDate.getTime() > Date.now());

  // 4. Dual-validity grace window logic
  // Simulate user receiving OTP 1, requesting resend (getting OTP 2)
  const otp2 = generateNumericOtp();
  const hash2 = hashOtp(otp2);
  const currentOtpHash = hash2;
  const previousOtpHash = hash1;
  const previousOtpExpires = new Date(Date.now() + 10000); // 10s grace in future

  // Verify that either OTP1 (delayed in transit) or OTP2 (new) verifies successfully
  const verifyIncoming = (incomingOtp: string) => {
    const isCurrent = verifyOtpHash(incomingOtp, currentOtpHash);
    const isPrevious = previousOtpExpires > new Date() && verifyOtpHash(incomingOtp, previousOtpHash);
    return isCurrent || isPrevious;
  };

  assert('Dual-validity: In-flight previous OTP 1 verifies successfully', verifyIncoming(otp1));
  assert('Dual-validity: Newly issued OTP 2 verifies successfully', verifyIncoming(otp2));
  assert('Dual-validity: Random wrong code is rejected', !verifyIncoming('999999'));

  // Expired previous OTP
  const expiredPreviousOtpExpires = new Date(Date.now() - 1000);
  const verifyWithExpiredPrevious = (incomingOtp: string) => {
    const isCurrent = verifyOtpHash(incomingOtp, currentOtpHash);
    const isPrevious = expiredPreviousOtpExpires > new Date() && verifyOtpHash(incomingOtp, previousOtpHash);
    return isCurrent || isPrevious;
  };
  assert('Expired previous OTP is strictly rejected', !verifyWithExpiredPrevious(otp1));
  assert('Current OTP still verifies even when previous expired', verifyWithExpiredPrevious(otp2));

  // 5. Cooldown calculation
  assert('Default OTP_RESEND_COOLDOWN_SECONDS is 60 seconds', env.OTP_RESEND_COOLDOWN_SECONDS === 60);

  // 6. Max attempts
  assert('Default OTP_MAX_ATTEMPTS is 5 attempts', env.OTP_MAX_ATTEMPTS === 5);

  console.log('\n======================================================');
  console.log(`LIFECYCLE SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runOtpLifecycleTests().catch((err) => {
  console.error('Fatal error during OTP lifecycle testing:', err);
  process.exit(1);
});
