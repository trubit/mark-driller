import React, { useState } from 'react';
import PaystackPop, { type PaystackTransaction } from '@paystack/inline-js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { PortalHeader } from './PortalHeader.js';
import {
  useSubscriptionPlansQuery,
  useMySubscriptionQuery,
  useInitializePaymentMutation,
  useVerifyPaymentMutation,
  PlanTier,
} from '../api/subscriptions.js';
import { useNotificationStore } from '../store/useNotificationStore.js';

export const SubscriptionPlans: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAppStore();
  const { notifySuccess, notifyError, notifyInfo } = useNotificationStore();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlansQuery();
  const { data: currentSub, refetch: refetchSub } = useMySubscriptionQuery();

  const initializeMutation = useInitializePaymentMutation();
  const verifyMutation = useVerifyPaymentMutation();

  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Responsive Unified Header */}
      <PortalHeader badge="PLANS" badgeColor="rust" activePath="/pricing" />

      {/* Main Pricing Content */}
      <main className="wrap" style={{ flex: 1, padding: 'clamp(24px, 4vw, 48px) clamp(16px, 3vw, 24px) 80px', boxSizing: 'border-box', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--rust)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            Nigeria's Premier CBT Preparation Pass
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '38px', margin: '0 0 16px', color: 'var(--ink)' }}>
            Invest in Your University Admission
          </h1>
          <p style={{ color: 'var(--slate)', fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
            Unlock unlimited CBT mock sessions, 30,000+ past questions with step-by-step mathematical workings, and university screening drills.
          </p>
        </div>

        {/* Notices */}
        {successNotice && (
          <div style={{ maxWidth: '800px', margin: '0 auto 32px', padding: '16px 20px', background: '#eaf4ee', border: '1px solid var(--forest)', color: 'var(--forest)', fontSize: '14px', textAlign: 'center' }}>
            🎉 {successNotice}
          </div>
        )}
        {errorNotice && (
          <div style={{ maxWidth: '800px', margin: '0 auto 32px', padding: '16px 20px', background: '#fdf0ed', border: '1px solid var(--rust)', color: 'var(--rust)', fontSize: '14px', textAlign: 'center' }}>
            ⚠ {errorNotice}
          </div>
        )}

        {/* Current Active Plan Badge */}
        {isAuthenticated && currentSub && (
          <div style={{ maxWidth: '800px', margin: '0 auto 36px', background: 'var(--white)', border: '1px solid var(--ink)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '2px 2px 0 var(--ink)' }}>
            <div>
              <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--slate)', textTransform: 'uppercase' }}>Current Subscription</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                {currentSub.plan.replace('_', ' ')} — {currentSub.status}
              </div>
            </div>
            {currentSub.endDate && (
              <div style={{ fontSize: '12px', color: 'var(--slate)', fontFamily: "'JetBrains Mono', monospace" }}>
                Valid until {new Date(currentSub.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Pricing Cards Grid */}
        {plansLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", color: 'var(--slate)' }}>
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
                        fontFamily: "'JetBrains Mono', monospace",
                        padding: '3px 12px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', margin: '0 0 6px', color: 'var(--ink)' }}>
                      {plan.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--slate)', margin: '0 0 20px', minHeight: '38px' }}>
                      {plan.description}
                    </p>

                    <div style={{ margin: '0 0 24px', padding: '16px 0', borderTop: '1px solid var(--cream-deep)', borderBottom: '1px solid var(--cream-deep)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink)' }}>
                          {plan.priceNGN === 0 ? '₦0' : `₦${plan.priceNGN.toLocaleString()}`}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--slate)' }}>/ {plan.billingPeriod}</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--slate)', textTransform: 'uppercase', marginBottom: '12px' }}>
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
                          background: '#eaf4ee',
                          border: '1px solid var(--forest)',
                          color: 'var(--forest)',
                          fontFamily: "'JetBrains Mono', monospace",
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
                          fontFamily: "'JetBrains Mono', monospace",
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
                          fontFamily: "'JetBrains Mono', monospace",
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

        {/* Security & Payment Badge */}
        <div style={{ marginTop: '48px', textAlign: 'center', color: 'var(--slate)', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
          🔒 Secure 256-bit encryption • Processed via Paystack Nigeria • Instant automatic access
        </div>
      </main>
    </div>
  );
};
