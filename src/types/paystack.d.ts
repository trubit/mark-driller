/**
 * Type declarations for @paystack/inline-js v2.25.0
 * Official Paystack Inline JS V2 SDK — ambient module declaration
 *
 * Official API (verified against library source & official docs):
 *   - resumeTransaction(accessCode, callbacks) → opens popup for server-initialized transaction with callbacks
 *   - newTransaction(options)                 → opens popup; accepts accessCode or parameters, onSuccess, onCancel
 *   - cancelTransaction()                     → closes popup programmatically
 */
declare module '@paystack/inline-js' {
  export interface PaystackTransaction {
    id?: number;
    reference: string;
    status?: string;
    trans?: string;
    transaction?: string;
    message?: string;
    trxref?: string;
  }

  export interface PaystackCallbacks {
    onSuccess?: (transaction: PaystackTransaction) => void;
    onCancel?: () => void;
    onError?: (error: { message?: string; [key: string]: unknown } | Error) => void;
    onLoad?: (response: { id: number; customer: Record<string, unknown>; accessCode: string }) => void;
  }

  export interface PaystackTransactionOptions extends PaystackCallbacks {
    /** Public key — required unless using accessCode for server-initialized transaction */
    key?: string;
    email?: string;
    amount?: number;
    currency?: string;
    ref?: string;
    reference?: string;
    /** accessCode returned from server-side Paystack transaction initialization */
    accessCode?: string;
    /** Backwards-compatible alias for accessCode */
    access_code?: string;
    plan?: string;
    quantity?: number;
    subaccount?: string;
    transaction_charge?: number;
    bearer?: 'account' | 'subaccount';
    metadata?: Record<string, unknown>;
    label?: string;
    channels?: string[];
    split_code?: string;
    split?: Record<string, unknown>;
  }

  class PaystackPop {
    /**
     * Open Paystack checkout popup.
     * When accessCode is provided (server-initialized transaction), no key/email/amount is needed.
     * Supports onSuccess, onCancel, onError, onLoad callbacks.
     */
    newTransaction(options: PaystackTransactionOptions): void;

    /**
     * Resume a server-initialized Paystack transaction using its access_code.
     * Official Paystack Popup V2 method. Accepts accessCode and lifecycle callbacks.
     */
    resumeTransaction(accessCode: string, callbacks?: PaystackCallbacks): void;

    /** Programmatically close the Paystack popup */
    cancelTransaction(): void;
  }

  export default PaystackPop;
}

