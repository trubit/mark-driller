import React, { useState } from 'react';
import PaystackPop, { type PaystackTransaction } from '@paystack/inline-js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import {
  useSubscriptionPlansQuery,
  useMySubscriptionQuery,
  useInitializePaymentMutation,
  useVerifyPaymentMutation,
  useBankDetailsQuery,
  useSubmitManualProofMutation,
  useRedeemPinMutation,
  useUploadReceiptMutation,
  PlanTier,
} from '../api/subscriptions.js';
import { useNotificationStore } from '../store/useNotificationStore.js';

export const SubscriptionPlans: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAppStore();
  const { notifySuccess, notifyError, notifyInfo } = useNotificationStore();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlansQuery();
  const { data: currentSub, refetch: refetchSub } = useMySubscriptionQuery();
  const { data: bankDetails } = useBankDetailsQuery();

  const initializeMutation = useInitializePaymentMutation();
  const verifyMutation = useVerifyPaymentMutation();
  const submitProofMutation = useSubmitManualProofMutation();
  const redeemPinMutation = useRedeemPinMutation();

  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Scratch Card PIN Redemption State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isRedeemingPin, setIsRedeemingPin] = useState(false);

  // Manual Transfer Form State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualPlan, setManualPlan] = useState<'PRO_MONTHLY' | 'PRO_ANNUAL'>('PRO_MONTHLY');
  const [depositorName, setDepositorName] = useState('');
  const [bankName, setBankName] = useState('');
  const [amountPaid, setAmountPaid] = useState('3500');
  const [proofUrl, setProofUrl] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Receipt File Upload State
  const uploadReceiptMutation = useUploadReceiptMutation();
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(null);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setReceiptUploadError('File size exceeds 10MB limit. Please upload a smaller image or PDF.');
      return;
    }

    setIsUploadingReceipt(true);
    setReceiptUploadError(null);

    try {
      const res = await uploadReceiptMutation.mutateAsync(file);
      setProofUrl(res.fileUrl);
      setReceiptFileName(file.name);
      notifySuccess(`✓ Receipt uploaded: ${file.name}`);
    } catch (err: any) {
      const msg = err.message || 'Failed to upload receipt proof.';
      setReceiptUploadError(msg);
      notifyError(msg);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleSubscribe = async (planId: 'PRO_MONTHLY' | 'PRO_ANNUAL') => {
    if (!isAuthenticated) {
      openAuthModal('signup');
      notifyInfo('Please sign in or create an account to activate your Pro subscription.');
      return;
    }

    if (processingPlan) return;

    setProcessingPlan(planId);
    setErrorNotice(null);
    setSuccessNotice(null);

    let initData: {
      reference: string;
      amountKobo: number;
      currency: string;
      plan: string;
      userEmail: string;
      publicKey: string;
      authorizationUrl?: string;
      accessCode?: string;
    };

    try {
      // Step 1: Server-side transaction initialization — secure backend generates reference & access_code
      initData = await initializeMutation.mutateAsync(planId);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "We couldn't initialize your payment. Please try again.";
      setErrorNotice(errMsg);
      notifyError(errMsg);
      setProcessingPlan(null);
      return;
    }

    const reference = initData.reference;
    const accessCode = initData.accessCode;

    // Step 2: Open Paystack V2 checkout popup
    // Uses accessCode from backend (most secure approach — no amount/email in browser).
    if (accessCode && initData.publicKey && !initData.publicKey.includes('_mock_')) {
      try {
        const popup = new PaystackPop();
        const callbacks = {
          onSuccess: async (transaction: PaystackTransaction) => {
            try {
              const verifiedRef = transaction?.reference || reference;
              await verifyMutation.mutateAsync(verifiedRef);
              await refetchSub();
              const planName = planId === 'PRO_ANNUAL' ? 'Annual Scholar Pass' : 'Monthly Pro Pass';
              const successMsg = `Payment confirmed! Your ${planName} subscription is now active.`;
              setSuccessNotice(successMsg);
              notifySuccess(successMsg);
              setTimeout(() => setSuccessNotice(null), 7000);
            } catch (verifyErr: unknown) {
              const verifyErrMsg =
                verifyErr instanceof Error
                  ? verifyErr.message
                  : 'Payment received. Subscription activation is in progress — please refresh in a moment.';
              setErrorNotice(verifyErrMsg);
              notifyError(verifyErrMsg);
            } finally {
              setProcessingPlan(null);
            }
          },
          onCancel: () => {
            setProcessingPlan(null);
            notifyInfo('Payment checkout window was closed. No charge was made.');
          },
          onError: (paystackErr: unknown) => {
            const errMsg =
              paystackErr && typeof paystackErr === 'object' && 'message' in paystackErr && typeof (paystackErr as any).message === 'string'
                ? (paystackErr as any).message
                : 'Could not load payment checkout form. Please try again.';
            setErrorNotice(errMsg);
            notifyError(errMsg);
            setProcessingPlan(null);
          },
        };

        // Official @paystack/inline-js V2 API for server-initialized transactions
        if (typeof popup.resumeTransaction === 'function') {
          popup.resumeTransaction(accessCode, callbacks);
        } else {
          // Defensive fallback if resumeTransaction is not exposed in a custom build
          popup.newTransaction({
            accessCode,
            ...callbacks,
          });
        }
      } catch (popupErr: unknown) {
        console.error('Paystack popup initialization error:', popupErr);
        const rawMsg =
          popupErr instanceof Error
            ? popupErr.message
            : popupErr && typeof popupErr === 'object' && 'message' in popupErr && typeof (popupErr as any).message === 'string'
            ? (popupErr as any).message
            : null;

        if (initData.authorizationUrl) {
          // Graceful fallback to hosted Paystack checkout if popup is blocked or fails
          window.location.href = initData.authorizationUrl;
        } else {
          const errMsg = rawMsg || 'Could not open payment window. Please try again.';
          setErrorNotice(errMsg);
          notifyError(errMsg);
          setProcessingPlan(null);
        }
      }
    } else if (initData.authorizationUrl) {
      // Fallback: redirect to Paystack hosted checkout (for environments where popup is blocked)
      window.location.href = initData.authorizationUrl;
    } else {
      setErrorNotice('Payment checkout could not be initialized. Please try again.');
      notifyError('Payment checkout could not be initialized. Please try again.');
      setProcessingPlan(null);
    }
  };

  const handleManualProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('signup');
      notifyInfo('Please sign in or create an account to submit your payment proof.');
      return;
    }
    if (!depositorName.trim() || !bankName.trim() || !proofUrl.trim()) {
      notifyError('Please fill out all required fields including depositor name and receipt URL.');
      return;
    }
    const numAmount = parseFloat(amountPaid);
    if (isNaN(numAmount) || numAmount <= 0) {
      notifyError('Please provide a valid amount paid in NGN.');
      return;
    }

    try {
      const res = await submitProofMutation.mutateAsync({
        plan: manualPlan,
        depositorName: depositorName.trim(),
        bankName: bankName.trim(),
        amountPaidNGN: numAmount,
        proofUrl: proofUrl.trim(),
        notes: transferNotes.trim(),
      });
      notifySuccess(`Payment proof submitted! Tracking reference: ${res.reference}. Our team is reviewing it.`);
      setShowManualModal(false);
      setSuccessNotice(`Payment proof submitted (Ref: ${res.reference}). Your account will be upgraded to Pro upon verification.`);
    } catch (err: any) {
      notifyError(err.message || 'Failed to submit payment proof. Please try again.');
    }
  };

  const handleRedeemPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('signup');
      notifyInfo('Please sign in or create an account to redeem your activation key.');
      return;
    }
    if (!pinInput.trim()) {
      notifyError('Please enter your 12-digit scratch card PIN or product activation code.');
      return;
    }

    setIsRedeemingPin(true);
    try {
      const res = await redeemPinMutation.mutateAsync(pinInput.trim());
      notifySuccess(res.plan ? `Pass activated! ${res.plan.replace('_', ' ')} is now active.` : 'Pass activated successfully!');
      setShowPinModal(false);
      setPinInput('');
      setSuccessNotice(`Activation successful! Your ${res.plan.replace('_', ' ')} is active until ${new Date(res.expiryDate).toLocaleDateString()}.`);
      refetchSub();
    } catch (err: any) {
      notifyError(err.message || 'Invalid or already redeemed activation key.');
    } finally {
      setIsRedeemingPin(false);
    }
  };

  return (
    <div className="premium-portal-page premium-more-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Main Pricing / Subscription Content */}
      <main className="wrap" style={{ flex: 1, padding: 'clamp(24px, 4vw, 48px) clamp(16px, 3vw, 24px) 80px', boxSizing: 'border-box', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: '12px', color: 'var(--rust)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            {isAuthenticated ? 'Student Portal • Subscription Management' : "Nigeria's Premier CBT Preparation Pass"}
          </div>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 'clamp(28px, 4vw, 38px)', margin: '0 0 16px', color: 'var(--ink)' }}>
            {isAuthenticated ? 'Your Subscription & Access Pass' : 'Invest in Your University Admission'}
          </h1>
          <p style={{ color: 'var(--slate)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
            {isAuthenticated
              ? 'Manage your active MarkDriller license, view days remaining, redeem scratch card activation keys, or upgrade your study access.'
              : 'Unlock unlimited CBT mock sessions, 30,000+ past questions with step-by-step mathematical workings, and university screening drills.'}
          </p>
        </div>

        {/* Notices */}
        {successNotice && (
          <div style={{ maxWidth: '900px', margin: '0 auto 28px', padding: '16px 20px', background: 'var(--forest-soft)', border: '1px solid var(--forest)', color: 'var(--forest)', fontSize: '14px', textAlign: 'center' }}>
            🎉 {successNotice}
          </div>
        )}
        {errorNotice && (
          <div style={{ maxWidth: '900px', margin: '0 auto 28px', padding: '16px 20px', background: 'var(--rust-soft)', border: '1px solid var(--rust)', color: 'var(--rust)', fontSize: '14px', textAlign: 'center' }}>
            ⚠ {errorNotice}
          </div>
        )}

        {/* Authenticated Student Subscription Overview Panel */}
        {isAuthenticated && (
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto 40px',
              background: 'var(--white)',
              border: '2px solid var(--ink)',
              boxShadow: '4px 4px 0 var(--ink)',
              padding: 'clamp(20px, 3vw, 28px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--paper-line, rgba(20,24,28,0.12))', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  Account Access Status
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                    {currentSub ? currentSub.plan.replace('_', ' ') : 'Free Explorer Tier'}
                  </h2>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      backgroundColor: currentSub?.status === 'ACTIVE' && currentSub?.isPro ? 'var(--forest, #225a38)' : 'var(--rust, #a8562f)',
                      color: 'var(--white)',
                      padding: '3px 8px',
                      borderRadius: '2px',
                    }}
                  >
                    {currentSub?.status === 'ACTIVE' && currentSub?.isPro ? 'ACTIVE PRO PASS' : 'FREE / TRIAL'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowPinModal(true)}
                  className="btn-custom btn-custom-outline"
                  style={{ fontSize: '12.5px', padding: '8px 14px' }}
                >
                  🎟️ Redeem Scratch PIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManualPlan('PRO_ANNUAL');
                    setAmountPaid('15000');
                    setShowManualModal(true);
                  }}
                  className="btn-custom btn-custom-ghost"
                  style={{ fontSize: '12.5px', padding: '8px 14px' }}
                >
                  🏦 Bank Transfer
                </button>
              </div>
            </div>

            {/* Subscription Metrics & Entitlements Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', background: 'var(--paper)', border: '1px solid var(--paper-line)' }}>
                <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--slate)' }}>
                  EXPIRATION DATE
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginTop: '4px' }}>
                  {currentSub?.endDate ? new Date(currentSub.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Lifetime / Free'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--slate)', marginTop: '2px' }}>
                  {currentSub?.endDate && Math.ceil((new Date(currentSub.endDate).getTime() - Date.now()) / (1000 * 3600 * 24)) > 0
                    ? `${Math.ceil((new Date(currentSub.endDate).getTime() - Date.now()) / (1000 * 3600 * 24))} days remaining`
                    : currentSub?.isPro ? 'Renewal due' : 'Limited preview features'}
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--paper)', border: '1px solid var(--paper-line)' }}>
                <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--slate)' }}>
                  CBT MOCK SIMULATOR
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: currentSub?.isPro ? 'var(--forest)' : 'var(--rust)', marginTop: '4px' }}>
                  {currentSub?.isPro ? '✓ Full Unlimited Access' : 'Limited (3 Mocks Free)'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--slate)', marginTop: '2px' }}>
                  Exact JAMB/WAEC interface & timers
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--paper)', border: '1px solid var(--paper-line)' }}>
                <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--slate)' }}>
                  SOLUTIONS & WORKINGS
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: currentSub?.isPro ? 'var(--forest)' : 'var(--rust)', marginTop: '4px' }}>
                  {currentSub?.isPro ? '✓ Unlocked (30,000+ Qs)' : 'Basic Answers Only'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--slate)', marginTop: '2px' }}>
                  Step-by-step mathematical proofs
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--cream, #f7f5ed)', padding: '12px 16px', borderLeft: '4px solid var(--rust)' }}>
              <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
                <strong>Need offline access for Windows/Android?</strong> Use your activation key on MarkDriller Offline Desktop App.
              </div>
              <a
                href="/products"
                style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--rust)', textDecoration: 'none' }}
              >
                Download Desktop App →
              </a>
            </div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        {plansLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', fontFamily: "var(--font-sans)", color: 'var(--slate)' }}>
            Loading subscription tiers...
          </div>
        ) : plans && plans.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px', alignItems: 'stretch' }}>
            {plans.map((plan: PlanTier) => {
              const isCurrent = currentSub?.plan === plan.id && currentSub?.status === 'ACTIVE';
              return (
                <div
                  key={plan.id}
                  style={{
                    background: 'var(--white)',
                    border: plan.isPopular ? '2px solid var(--rust)' : '1px solid var(--ink)',
                    padding: '32px 24px',
                    boxShadow: plan.isPopular ? '5px 5px 0 var(--rust)' : '3px 3px 0 var(--ink)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  {plan.isPopular && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-13px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--rust)',
                        color: 'var(--white)',
                        fontSize: '10px',
                        fontWeight: 700,
                        fontFamily: "var(--font-sans)",
                        padding: '3px 12px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '22px', margin: '0 0 6px', color: 'var(--ink)' }}>
                      {plan.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--slate)', margin: '0 0 20px', minHeight: '38px' }}>
                      {plan.description}
                    </p>

                    <div style={{ margin: '0 0 24px', padding: '16px 0', borderTop: '1px solid var(--cream-deep)', borderBottom: '1px solid var(--cream-deep)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                          {plan.priceNGN === 0 ? '₦0' : `₦${plan.priceNGN.toLocaleString()}`}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--slate)' }}>/ {plan.billingPeriod}</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--slate)', textTransform: 'uppercase', marginBottom: '12px' }}>
                        Included Capabilities:
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {plan.features.map((feature: string, idx: number) => (
                          <li key={idx} style={{ fontSize: '13px', color: 'var(--ink)', marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ color: 'var(--forest)', fontWeight: 700 }}>✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    {isCurrent ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'var(--forest-soft)',
                          border: '1px solid var(--forest)',
                          color: 'var(--forest)',
                          fontFamily: "var(--font-sans)",
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'default',
                        }}
                      >
                        ✓ Active Current Plan
                      </button>
                    ) : plan.id === 'FREE' ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'var(--cream)',
                          border: '1px solid var(--cream-deep)',
                          color: 'var(--slate)',
                          fontFamily: "var(--font-sans)",
                          fontSize: '12px',
                          cursor: 'default',
                        }}
                      >
                        Included by Default
                      </button>
                    ) : (
                      <button
                        id={`subscribe-btn-${plan.id.toLowerCase()}`}
                        onClick={() => handleSubscribe(plan.id as 'PRO_MONTHLY' | 'PRO_ANNUAL')}
                        disabled={Boolean(processingPlan)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: processingPlan === plan.id
                            ? 'var(--slate)'
                            : plan.isPopular
                              ? 'var(--rust)'
                              : 'var(--ink)',
                          color: 'var(--white)',
                          border: 'none',
                          fontFamily: "var(--font-sans)",
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: processingPlan ? 'not-allowed' : 'pointer',
                          transition: 'background 0.2s ease, opacity 0.2s ease',
                          opacity: processingPlan && processingPlan !== plan.id ? 0.5 : 1,
                        }}
                      >
                        {processingPlan === plan.id
                          ? 'Opening Paystack...'
                          : `Upgrade to ${plan.name} →`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Alternative: Direct Bank Transfer Card */}
        <div
          style={{
            marginTop: '40px',
            backgroundColor: 'var(--white)',
            border: '1.5px solid var(--paper-line)',
            borderRadius: '4px',
            padding: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <span className="eyebrow" style={{ color: 'var(--rust)', marginBottom: '6px', display: 'block' }}>
              Alternative Payment Method
            </span>
            <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '20px', margin: '0 0 6px', color: 'var(--ink)' }}>
              Direct Bank Transfer &amp; Proof Verification
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '14px', maxWidth: '60ch', margin: 0 }}>
              Don't have a debit card or prefer online banking? Transfer directly to our official corporate {bankDetails?.bankName ? `${bankDetails.bankName} ` : ''}account and submit your receipt for prompt administrator approval.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('signup');
                notifyInfo('Please sign in or register to submit a bank transfer proof.');
                return;
              }
              setShowManualModal(true);
            }}
            className="btn-custom btn-custom-outline"
            style={{ padding: '12px 24px', flexShrink: 0 }}
          >
            Bank Transfer Details &amp; Upload Receipt →
          </button>
        </div>

        {/* Scratch Card / Activation Key Redemption Card */}
        <div
          style={{
            marginTop: '20px',
            backgroundColor: 'var(--white)',
            border: '1.5px solid var(--paper-line)',
            borderRadius: '4px',
            padding: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <span className="eyebrow" style={{ color: 'var(--rust)', marginBottom: '6px', display: 'block' }}>
              Physical Scratch Card or Product Key
            </span>
            <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '20px', margin: '0 0 6px', color: 'var(--ink)' }}>
              Redeem Scratch Card / Activation PIN
            </h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '14px', maxWidth: '60ch', margin: 0 }}>
              Purchased a physical scratch card from your school, CBT centre, or bookshop? Enter your 12-digit PIN to immediately unlock full Pro subscriber access.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('signup');
                notifyInfo('Please sign in or create an account to redeem your activation key.');
                return;
              }
              setShowPinModal(true);
            }}
            className="btn-custom btn-custom-primary"
            style={{ padding: '12px 24px', flexShrink: 0 }}
          >
            Redeem Activation PIN →
          </button>
        </div>

        {/* Security & Payment Badge */}
        <div style={{ marginTop: '36px', textAlign: 'center', color: 'var(--slate)', fontSize: '12px', fontFamily: "var(--font-sans)" }}>
          🔒 Secure 256-bit encryption • Processed via Paystack Nigeria or Direct Bank Transfer • Official Educational Preparation
        </div>

        {/* Scratch Card PIN Redemption Modal */}
        {showPinModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(20,24,28,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
            onClick={() => setShowPinModal(false)}
          >
            <div
              style={{
                backgroundColor: 'var(--white)',
                borderRadius: '6px',
                width: '100%',
                maxWidth: '480px',
                padding: 'clamp(18px, 4vw, 32px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                maxHeight: 'min(90vh, 90dvh)',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span className="eyebrow" style={{ fontSize: '10.5px' }}>Instant Product Activation</span>
                  <h3 style={{ fontSize: '20px', margin: '4px 0 0 0', color: 'var(--ink)' }}>
                    Redeem Scratch Card PIN
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--ink-soft)' }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '20px' }}>
                Gently scratch off the silver panel on the back of your official MarkDriller card and enter the serial activation key below:
              </p>

              <form onSubmit={handleRedeemPin}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '6px' }}>
                    12-DIGIT ACTIVATION PIN / CODE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MD-PRO-7842-9901"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '16px',
                      fontFamily: "var(--font-sans)",
                      letterSpacing: '2px',
                      border: '1.5px solid var(--paper-line)',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={isRedeemingPin}
                    className="btn-custom btn-custom-primary"
                    style={{ flex: 1, padding: '12px', textAlign: 'center', fontSize: '14px' }}
                  >
                    {isRedeemingPin ? 'Validating PIN...' : 'Activate Pro Subscription ✓'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPinModal(false)}
                    className="btn-custom btn-custom-ghost"
                    style={{ padding: '12px 16px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manual Payment Proof Submission Modal */}
        {showManualModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(20,24,28,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
            onClick={() => setShowManualModal(false)}
          >
            <div
              style={{
                backgroundColor: 'var(--white)',
                borderRadius: '4px',
                border: '1.5px solid var(--ink)',
                width: '100%',
                maxWidth: '560px',
                padding: 'clamp(18px, 4vw, 32px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                maxHeight: 'min(90vh, 90dvh)',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: '20px' }}>
                  Direct Bank Transfer Proof
                </h3>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--ink-soft)' }}
                >
                  ✕
                </button>
              </div>

              {/* Official Bank Account Details Box */}
              <div
                style={{
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: '3px',
                  padding: '16px',
                  marginBottom: '24px',
                  fontSize: '13px',
                  fontFamily: "var(--font-sans)",
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--rust)', marginBottom: '8px' }}>
                  OFFICIAL CORPORATE PAYMENT DETAILS:
                </div>
                <div><strong>Bank Name:</strong> {bankDetails?.bankName || 'Loading bank details...'}</div>
                <div><strong>Account Name:</strong> {bankDetails?.accountName || 'Loading account name...'}</div>
                <div style={{ fontSize: '15px', color: 'var(--ink)', margin: '4px 0' }}>
                  <strong>Account Number:</strong>{' '}
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700 }}>
                    {bankDetails?.accountNumber || '—'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '6px' }}>
                  ℹ️ {bankDetails?.instructions || 'Include your registered email as the transfer narration.'}
                </div>
              </div>

              {/* Proof Submission Form */}
              <form onSubmit={handleManualProofSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Select Plan Paid For *
                  </label>
                  <select
                    value={manualPlan}
                    onChange={(e) => {
                      const p = e.target.value as 'PRO_MONTHLY' | 'PRO_ANNUAL';
                      setManualPlan(p);
                      setAmountPaid(p === 'PRO_ANNUAL' ? '25000' : '3500');
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '3px', border: '1px solid var(--paper-line)' }}
                  >
                    <option value="PRO_MONTHLY">Pro Monthly Pass — ₦3,500</option>
                    <option value="PRO_ANNUAL">Pro Annual Scholar — ₦25,000</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Depositor / Account Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chukwuemeka Okafor"
                    value={depositorName}
                    onChange={(e) => setDepositorName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '3px', border: '1px solid var(--paper-line)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Sending Bank *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zenith Bank, Kuda, OPay"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '3px', border: '1px solid var(--paper-line)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Amount Paid (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '3px', border: '1px solid var(--paper-line)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Upload Payment Receipt / Proof Screenshot *
                  </label>

                  {/* Interactive File Upload Area */}
                  <div
                    onClick={() => !isUploadingReceipt && fileInputRef.current?.click()}
                    style={{
                      border: receiptFileName ? '2px solid var(--forest)' : '2px dashed var(--paper-line)',
                      borderRadius: '6px',
                      padding: '16px',
                      textAlign: 'center',
                      backgroundColor: receiptFileName ? 'rgba(22, 163, 74, 0.05)' : 'var(--paper)',
                      cursor: isUploadingReceipt ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleReceiptFileChange}
                      accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                      style={{ display: 'none' }}
                    />

                    {isUploadingReceipt ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '24px' }}>⏳</div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Uploading receipt document...</span>
                        <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Please wait while your proof is securely saved</span>
                      </div>
                    ) : receiptFileName ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '22px' }}>📄</span>
                          <div style={{ textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--forest)' }}>
                              ✓ Receipt Attached
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{receiptFileName}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptFileName(null);
                            setProofUrl('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          style={{
                            background: 'none',
                            border: '1px solid var(--color-error)',
                            color: 'var(--color-error)',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Remove / Replace
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div style={{ fontSize: '28px' }}>📁</div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                          Click to browse & upload receipt screenshot
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                          Supports PNG, JPG, JPEG, WEBP, or PDF (Max 10MB)
                        </span>
                      </div>
                    )}
                  </div>

                  {receiptUploadError && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-error)' }}>
                      ⚠ {receiptUploadError}
                    </div>
                  )}

                  {/* Manual URL input fallback toggle */}
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '11px',
                        color: 'var(--ink-soft)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      {showManualUrlInput ? 'Hide manual URL input' : 'Or paste a direct image URL manually ↗'}
                    </button>
                  </div>

                  {showManualUrlInput && (
                    <div style={{ marginTop: '6px' }}>
                      <input
                        type="text"
                        placeholder="https://... direct link to receipt image"
                        value={proofUrl}
                        onChange={(e) => {
                          setProofUrl(e.target.value);
                          if (!receiptFileName && e.target.value) {
                            setReceiptFileName('Manual URL link');
                          }
                        }}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '3px', border: '1px solid var(--paper-line)', fontSize: '12px' }}
                      />
                    </div>
                  )}

                  {/* Hidden field enforcing required proof on submission */}
                  <input
                    type="text"
                    required
                    value={proofUrl}
                    onChange={() => {}}
                    tabIndex={-1}
                    style={{ opacity: 0, height: 0, width: 0, padding: 0, margin: 0, position: 'absolute', pointerEvents: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Optional Remarks / Bank Reference
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Session ID 100004294829..."
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '3px', border: '1px solid var(--paper-line)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="submit"
                    disabled={submitProofMutation.isPending}
                    className="btn-custom btn-custom-primary"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    {submitProofMutation.isPending ? 'Submitting Receipt...' : 'Submit Payment Proof'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="btn-custom btn-custom-outline"
                    style={{ padding: '12px 20px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

