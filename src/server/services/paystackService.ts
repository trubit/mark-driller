import crypto from 'node:crypto';
import { env } from '../config/env.js';

export interface PaystackInitializeOptions {
  email: string;
  amountKobo: number;
  reference: string;
  plan?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaystackInitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaystackVerifyResult {
  success: boolean;
  status: 'success' | 'failed' | 'abandoned';
  reference: string;
  amountKobo: number;
  currency: string;
  channel: string;
  paidAt?: Date;
  customerEmail?: string;
  gatewayResponse?: string;
  rawResponse?: any;
}

/**
 * PaystackService: Production Paystack Gateway Client
 * 
 * Enforces server-side transaction initialization, verification against official Paystack API,
 * and cryptographic HMAC SHA-512 webhook signature verification.
 * 
 * Supports test/sandbox simulation fallback when running automated tests with mock secret keys.
 */
export class PaystackService {
  private static readonly PAYSTACK_BASE_URL = 'https://api.paystack.co';

  /**
   * Determine if secret key is a mock/test fixture key
   */
  public static isMockKey(key: string): boolean {
    return !key || key.includes('_mock_') || key.startsWith('sk_test_mock');
  }

  /**
   * Initialize a Paystack transaction via POST https://api.paystack.co/transaction/initialize
   */
  public static async initializeTransaction(
    options: PaystackInitializeOptions
  ): Promise<PaystackInitializeResult> {
    const { email, amountKobo, reference, plan, callbackUrl, metadata } = options;

    if (this.isMockKey(env.PAYSTACK_SECRET_KEY)) {
      if (env.NODE_ENV === 'production') {
        throw new Error('FATAL SECURITY ERROR: Mock Paystack keys and transaction simulation are forbidden in production.');
      }
      // Offline / Test environment simulated response
      return {
        authorizationUrl: `${env.CLIENT_URL || 'http://localhost:3009'}/pricing?mock_checkout=true&ref=${reference}`,
        accessCode: `mock_code_${reference}`,
        reference,
      };
    }

    const payload = {
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl || `${env.CLIENT_URL || 'http://localhost:3009'}/pricing`,
      metadata: {
        ...metadata,
        plan,
        platform: 'MarkDriller',
      },
    };

    const response = await fetch(`${this.PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as any;

    if (!response.ok || !data.status) {
      const errorMsg = data?.message || 'Failed to initialize transaction with Paystack.';
      console.error('Paystack initialization error:', errorMsg);
      throw new Error(`Paystack initialization error: ${errorMsg}`);
    }

    return {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  }

  /**
   * Verify a transaction with Paystack via GET https://api.paystack.co/transaction/verify/:reference
   */
  public static async verifyTransaction(reference: string): Promise<PaystackVerifyResult> {
    if (this.isMockKey(env.PAYSTACK_SECRET_KEY)) {
      if (env.NODE_ENV === 'production') {
        throw new Error('FATAL SECURITY ERROR: Mock Paystack keys and transaction simulation are forbidden in production.');
      }
      // Offline / Test environment simulated verification
      return {
        success: true,
        status: 'success',
        reference,
        amountKobo: 0, // Router reconciles with trusted plan price
        currency: 'NGN',
        channel: 'card_simulation',
        paidAt: new Date(),
        gatewayResponse: 'Successful mock transaction',
      };
    }

    const response = await fetch(
      `${this.PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json() as any;

    if (!response.ok || !data.status) {
      const errorMsg = data?.message || 'Transaction verification failed.';
      throw new Error(`Paystack verification error: ${errorMsg}`);
    }

    const tx = data.data;
    const isSuccess = tx.status === 'success';

    return {
      success: isSuccess,
      status: tx.status,
      reference: tx.reference,
      amountKobo: tx.amount,
      currency: tx.currency,
      channel: tx.channel || 'card',
      paidAt: tx.paid_at ? new Date(tx.paid_at) : new Date(),
      customerEmail: tx.customer?.email,
      gatewayResponse: tx.gateway_response,
      rawResponse: tx,
    };
  }

  /**
   * Cryptographically verify Paystack Webhook HMAC SHA-512 signature
   * against the raw request body buffer.
   */
  public static verifyWebhookSignature(
    rawBody: Buffer | string | undefined,
    signature: string | undefined
  ): boolean {
    if (!signature || !rawBody) {
      return false;
    }

    const secret = (env.PAYSTACK_WEBHOOK_SECRET && env.PAYSTACK_WEBHOOK_SECRET.trim() !== '')
      ? env.PAYSTACK_WEBHOOK_SECRET
      : env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      return false;
    }

    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);

    const computedSignature = crypto
      .createHmac('sha512', secret)
      .update(bodyBuffer)
      .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(computedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      return false;
    }
  }
}

