import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';

export const ProductsShowcase: React.FC = () => {
  const { openAuthModal } = useAppStore();
  const [activePlatform, setActivePlatform] = useState<'ALL' | 'WINDOWS' | 'ANDROID' | 'SCHOOL'>('ALL');

  const products = [
    {
      id: 'jamb-pc',
      name: 'MarkDriller UTME for Windows PC',
      platform: 'WINDOWS',
      category: 'Tertiary Matriculation',
      description:
        'The #1 CBT software for JAMB candidates. Works 100% offline after one-time activation. Includes all 24 JAMB subjects, past questions from 1978 to 2026, official calculator, and novel summaries.',
      specs: 'Windows 7, 8, 10, 11 (64-bit / 32-bit) · 350 MB · 1 Device License',
      price: '₦3,500 per license',
      badge: 'Bestseller',
      downloadType: 'exe',
      features: [
        'Complete 1978–2026 past questions database',
        'Full-fidelity CBT simulator with 8-key mode',
        'Step-by-step worked solutions with Chief Examiner notes',
        'Official JAMB e-Calculator & formula tables',
        'Syllabus topic-by-topic drill mode',
      ],
    },
    {
      id: 'waec-pc',
      name: 'MarkDriller SSCE for Windows PC',
      platform: 'WINDOWS',
      category: 'Senior Secondary',
      description:
        'Comprehensive computer-based testing and revision suite for WAEC (WASSCE) and NECO candidates. Features objective mock drills, theory revision notes, and Chief Examiners’ performance remarks.',
      specs: 'Windows 7, 8, 10, 11 · 400 MB · Offline Mode Supported',
      price: '₦3,500 per license',
      badge: 'Accredited',
      downloadType: 'exe',
      features: [
        'Over 38 senior secondary subjects covered',
        'Detailed step-by-step mathematical working',
        'Chief Examiners’ reports and common student pitfalls',
        'Custom timed objective paper simulations',
      ],
    },
    {
      id: 'mobile-android',
      name: 'MarkDriller Android Mobile App',
      platform: 'ANDROID',
      category: 'Mobile Learning',
      description:
        'Practise on your phone or tablet on the go. Zero internet connection required after downloading the question packages. Supports practice on the bus, in class, or at home.',
      specs: 'Android 6.0 and above · 48 MB APK Download · Dual SIM Key Binding',
      price: '₦2,500 per license',
      badge: 'Popular',
      downloadType: 'apk',
      features: [
        'Instant offline question synchronization',
        'Audio Text-to-Speech question reader',
        'Educational speed games and vocab challenges',
        'Night/dark mode for late-night study comfort',
      ],
    },
    {
      id: 'school-cbt-server',
      name: 'MarkDriller School & CBT Centre Local Server',
      platform: 'SCHOOL',
      category: 'Institutional',
      description:
        'Deploy a high-speed, local area network (LAN) CBT examination server in your school hall or CBT centre. Run 50 to 500+ client computers simultaneously without requiring an active internet connection.',
      specs: 'Windows Server / Linux / Windows 10 Host · Multi-Client Network Support',
      price: 'Custom Bulk Licensing',
      badge: 'Institutional Grade',
      downloadType: 'server',
      features: [
        'Zero internet required for student test terminals',
        'Central administrator dashboard with instant candidate scoring',
        'Custom exam creation and school curriculum injection',
        'Automatic printable report cards and performance analytics',
      ],
    },
    {
      id: 'bece-junior',
      name: 'MarkDriller BECE (Junior WAEC)',
      platform: 'WINDOWS',
      category: 'Junior Secondary',
      description:
        'Specially crafted for JSS 3 students sitting the Basic Education Certificate Examination. Prepares students thoroughly for transition into Senior Secondary School.',
      specs: 'Windows & Android Compatible · Past Questions from 2010 to Date',
      price: '₦2,500 per license',
      badge: 'Junior School',
      downloadType: 'exe',
      features: [
        'National and State BECE past questions',
        'Interactive science and math drills',
        'Foundational grammar and comprehension masterclasses',
      ],
    },
    {
      id: 'post-utme-bundle',
      name: 'MarkDriller Post-UTME Screening Suite',
      platform: 'WINDOWS',
      category: 'University Admissions',
      description:
        'Targeted screening past questions for UNILAG, University of Ibadan, OAU Ile-Ife, UNIBEN, UNILORIN, ABU Zaria, UNN Nsukka, LASU, and other accredited universities.',
      specs: 'Institution-specific speed testing · 15-minute speed drill mode',
      price: '₦3,000 per license',
      badge: 'Screening Specialized',
      downloadType: 'exe',
      features: [
        'Institution-specific speed test timers',
        'Current affairs and general knowledge database',
        'Aggregate score calculator for admission cut-off matching',
      ],
    },
  ];

  const filteredProducts =
    activePlatform === 'ALL'
      ? products
      : products.filter((p) => p.platform === activePlatform);

  return (
    <div className="premium-portal-page premium-more-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <main className="wrap" style={{ flex: 1, padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ maxWidth: '780px', marginBottom: '36px' }}>
          <span className="eyebrow" style={{ color: 'var(--rust)' }}>
            Official MarkDriller Software Suite
          </span>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', margin: '8px 0 14px 0' }}>
            Products &amp; Downloadable Applications
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '17px', lineHeight: 1.6 }}>
            Every MarkDriller application works <strong>100% offline</strong> without internet. Choose your platform below to download authentic installers for Windows PC, Android, or institutional CBT networks.
          </p>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '36px',
            borderBottom: '1px solid var(--paper-line)',
            paddingBottom: '16px',
          }}
        >
          {(
            [
              { key: 'ALL', label: 'All Products (6)' },
              { key: 'WINDOWS', label: 'Windows PC (.exe)' },
              { key: 'ANDROID', label: 'Android Mobile (.apk)' },
              { key: 'SCHOOL', label: 'Schools & CBT Centres' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActivePlatform(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1.5px solid',
                borderColor: activePlatform === tab.key ? 'var(--rust)' : 'var(--paper-line)',
                backgroundColor: activePlatform === tab.key ? 'var(--rust)' : 'var(--white)',
                color: activePlatform === tab.key ? '#ffffff' : 'var(--ink)',
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
            gap: '24px',
            marginBottom: '56px',
          }}
        >
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: 'var(--white)',
                border: '1px solid var(--paper-line)',
                borderRadius: '8px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--card-shadow)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: 'var(--rust)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {p.category}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      color: 'var(--amber-deep)',
                      backgroundColor: 'rgba(226, 154, 60, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {p.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '20px', color: 'var(--ink)', margin: '0 0 10px 0' }}>
                  {p.name}
                </h3>

                <p style={{ color: 'var(--ink-soft)', fontSize: '14px', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                  {p.description}
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--paper)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '11.5px',
                    fontFamily: "var(--font-sans)",
                    color: 'var(--ink-soft)',
                    marginBottom: '16px',
                    border: '1px solid var(--paper-line)',
                  }}
                >
                  ⚙ {p.specs}
                </div>

                <ul style={{ paddingLeft: '18px', margin: '0 0 20px 0', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
                  {p.features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px', borderTop: '1px solid var(--paper-line)', paddingTop: '14px' }}>
                  <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                    OFFLINE LICENSE
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--rust)', fontFamily: "var(--font-sans)" }}>
                    {p.price}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => openAuthModal('signup')}
                    className="btn-custom btn-custom-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '13px', padding: '10px' }}
                  >
                    {p.downloadType === 'server' ? 'Request Bulk Quote' : 'Download Free Trial'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal('signup')}
                    className="btn-custom btn-custom-ghost"
                    style={{ fontSize: '13px', padding: '10px 14px' }}
                  >
                    Activate PIN 🔑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Offline Verification Notice */}
        <div
          style={{
            backgroundColor: 'var(--dark-panel, #0b1120)',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '36px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ maxWidth: '600px' }}>
            <span style={{ color: 'var(--amber)', fontFamily: "var(--font-sans)", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Instant Offline Key Validation
            </span>
            <h3 style={{ fontSize: '22px', color: '#ffffff', margin: '6px 0 10px 0' }}>
              Already purchased a scratch card or reseller PIN?
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '14.5px', margin: 0 }}>
              Unlock your downloaded desktop or mobile app in seconds. You can validate your 16-digit license code online or generate offline SMS unlocking tokens.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="btn-custom btn-custom-primary"
              style={{ backgroundColor: 'var(--amber)', color: '#14181c', border: 'none', padding: '12px 22px' }}
            >
              Verify License PIN ➔
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

