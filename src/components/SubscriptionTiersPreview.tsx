import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

export const SubscriptionTiersPreview: React.FC = () => {
  const navigate = useNavigate();
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  const handleProAction = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate('/pricing');
    }
  };

  return (
    <section className="section" id="pricing-preview" aria-label="Transparent Subscription Plans">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow">Fair Nigerian Pricing</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(168, 86, 47, 0.12)',
                color: 'var(--rust)',
                fontWeight: 600,
              }}
            >
              Zero Hidden Charges
            </span>
          </div>
          <h2>Invest in Exam Success for Less Than the Cost of One Textbook</h2>
          <p style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            Start completely free or unlock the full 150,000+ past questions database, offline PC/Mobile software, and unlimited timed CBT mock exams.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            alignItems: 'stretch',
            marginBottom: '32px',
          }}
        >
          {/* Tier 1: Free Starter */}
          <div
            style={{
              background: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '10px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              STARTER EXPLORER
            </span>
            <h3 style={{ fontSize: '20px', margin: '0 0 12px 0', color: 'var(--ink)' }}>
              Free Practice
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
              <span style={{ fontSize: '36px', fontWeight: 800, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                ₦0
              </span>
              <span style={{ fontSize: '13px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                / forever
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Ideal for new students sampling past questions, syllabus outlines, and CBT test format.
            </p>

            <ul
              style={{
                paddingLeft: '18px',
                margin: '0 0 24px 0',
                fontSize: '13px',
                color: 'var(--ink)',
                lineHeight: 1.7,
                flex: 1,
              }}
            >
              <li>Access to 500+ verified sample past questions</li>
              <li>Standard CBT practice mode</li>
              <li>Official JAMB &amp; WAEC syllabus outlines</li>
              <li>School &amp; course eligibility checker</li>
            </ul>

            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="btn-custom btn-custom-ghost"
              style={{ width: '100%', fontSize: '13px', padding: '10px', textAlign: 'center', justifyContent: 'center' }}
            >
              Start Free Practice
            </button>
          </div>

          {/* Tier 2: Pro Annual Pass (Featured) */}
          <div
            style={{
              background: 'var(--white)',
              border: '2px solid var(--rust)',
              borderRadius: '10px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 28px rgba(168, 86, 47, 0.15)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                right: '20px',
                backgroundColor: 'var(--rust)',
                color: '#ffffff',
                fontSize: '10.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '4px',
                letterSpacing: '0.04em',
              }}
            >
              MOST POPULAR FOR CANDIDATES
            </div>

            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--rust)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              INDIVIDUAL CANDIDATE PASS
            </span>
            <h3 style={{ fontSize: '20px', margin: '0 0 12px 0', color: 'var(--ink)' }}>
              Pro Candidate Pass
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
              <span style={{ fontSize: '36px', fontWeight: 800, fontFamily: "var(--font-sans)", color: 'var(--rust)' }}>
                ₦3,500
              </span>
              <span style={{ fontSize: '13px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                / month (From ₦6,500 for 2 mos)
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Everything an aspiring student needs to achieve 300+ in JAMB and straight A's in WAEC.
            </p>

            <ul
              style={{
                paddingLeft: '18px',
                margin: '0 0 24px 0',
                fontSize: '13px',
                color: 'var(--ink)',
                lineHeight: 1.7,
                flex: 1,
              }}
            >
              <li><strong>150,000+ Past Questions (1978–2026)</strong></li>
              <li><strong>Full-Fidelity 8-Key CBT Simulator</strong></li>
              <li><strong>Step-by-step worked solutions &amp; examiner notes</strong></li>
              <li><strong>100% Offline Windows PC App + Android APK</strong></li>
              <li><strong>The Life Changer novel summary &amp; likely questions</strong></li>
              <li><strong>Science &amp; Math formula handbook</strong></li>
              <li><strong>Weakness analytics &amp; score trajectory</strong></li>
            </ul>

            <button
              type="button"
              onClick={handleProAction}
              className="btn-custom btn-custom-primary"
              style={{ width: '100%', fontSize: '13.5px', padding: '11px', textAlign: 'center', justifyContent: 'center' }}
            >
              Upgrade to Pro Now →
            </button>
          </div>

          {/* Tier 3: School & Centre LAN Server */}
          <div
            style={{
              background: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '10px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--steel)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              INSTITUTIONS &amp; CBT LABS
            </span>
            <h3 style={{ fontSize: '20px', margin: '0 0 12px 0', color: 'var(--ink)' }}>
              School LAN Server
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                Custom / Bulk
              </span>
              <span style={{ fontSize: '13px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                tiered volume
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              For secondary schools, tutorial colleges, and commercial CBT centres conducting bulk mocks.
            </p>

            <ul
              style={{
                paddingLeft: '18px',
                margin: '0 0 24px 0',
                fontSize: '13px',
                color: 'var(--ink)',
                lineHeight: 1.7,
                flex: 1,
              }}
            >
              <li>Deploy across 50 to 500+ student seats</li>
              <li>Official JAMB, WAEC & NECO curriculum coverage</li>
              <li>Administrative dashboard &amp; school batch reporting</li>
              <li>Custom mock exam creator with institutional analytics</li>
            </ul>

            <Link
              to="/contact"
              className="btn-custom btn-custom-ghost"
              style={{ width: '100%', fontSize: '13px', padding: '10px', textAlign: 'center', justifyContent: 'center' }}
            >
              Contact Institutional Desk ➔
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

