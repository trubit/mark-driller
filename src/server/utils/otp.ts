import crypto from 'crypto';

/**
 * Generate a cryptographically secure 6-digit OTP string
 */
export function generateNumericOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP string using SHA-256 for secure database storage
 */
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex');
}

/**
 * Verify a plain OTP against a SHA-256 hashed OTP
 */
export function verifyOtpHash(plainOtp: string, hashedOtp: string): boolean {
  const incomingHash = hashOtp(plainOtp);
  return crypto.timingSafeEqual(Buffer.from(incomingHash), Buffer.from(hashedOtp));
}
