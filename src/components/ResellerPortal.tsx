import React, { useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore.js';

export const ResellerPortal: React.FC = () => {
  const { notifySuccess } = useNotificationStore();
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    state: 'Lagos',
    businessCategory: 'CBT_CENTRE',
    monthlyVolume: '50-200',
    address: '',
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Interactive Reseller Profit Calculator
  const [calcQuantity, setCalcQuantity] = useState<number>(100);
  const cardRetailPrice = 3500;
  const marginPercent = calcQuantity < 200 ? 0.35 : calcQuantity < 500 ? 0.42 : 0.50;
  const totalGrossSales = calcQuantity * cardRetailPrice;
  const estimatedProfit = totalGrossSales * marginPercent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      notifySuccess('Reseller distribution partnership application submitted successfully!');
    }, 800);
  };

  return (
    <div className="portal-layout premium-portal-page premium-more-page" style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <div className="wrap" style={{ padding: '36px 24px', maxWidth: '1100px', margin: '0 auto', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '32px' }}>
          <span className="eyebrow" style={{ margin: 0, color: 'var(--rust)' }}>Wholesale &amp; Institutional Distribution</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', color: 'var(--ink)', margin: '6px 0 10px 0' }}>
            Accredited Reseller &amp; CBT Centre Network
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '800px', margin: 0, lineHeight: 1.6 }}>
            Distribute official MarkDriller scratch cards, activation PINs, and bulk institution licenses to students, schools, tutorial colleges, and CBT centres across Nigeria. Earn up to <strong>50% profit margins</strong> with 100% automated key delivery.
          </p>
        </div>

        {/* Wholesale Tiers Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div>
              <span className="eyebrow" style={{ fontSize: '10px' }}>Tier 1: Starter Retail</span>
              <h3 style={{ fontSize: '18px', margin: '4px 0 8px 0', color: 'var(--ink)' }}>
                50 – 199 Scratch Cards
              </h3>
              <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--rust)', fontFamily: "var(--font-sans)", marginBottom: '8px' }}>
                35% Margin
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Ideal for independent bookshops, campus cyber cafes, and neighborhood tutorial centres.
              </p>
            </div>
            <ul style={{ paddingLeft: '18px', margin: '14px 0 0 0', fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.6 }}>
              <li>Instant downloadable PIN batch (CSV)</li>
              <li>Print-ready scratch card PDF template</li>
              <li>Official MarkDriller authorized merchant decal</li>
            </ul>
          </div>

          <div
            style={{
              background: 'var(--white)',
              border: '2px solid var(--rust)',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(168, 86, 47, 0.15)',
            }}
          >
            <div>
              <span className="eyebrow" style={{ fontSize: '10px' }}>Tier 2: Commercial Partner</span>
              <h3 style={{ fontSize: '18px', margin: '4px 0 8px 0', color: 'var(--ink)' }}>
                200 – 499 Scratch Cards
              </h3>
              <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--rust)', fontFamily: "var(--font-sans)", marginBottom: '8px' }}>
                42% Margin
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Designed for JAMB CBT centres, secondary schools, and major educational supply distributors.
              </p>
            </div>
            <ul style={{ paddingLeft: '18px', margin: '14px 0 0 0', fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.6 }}>
              <li>All Starter Retail benefits</li>
              <li>Priority technical &amp; billing helpline</li>
              <li>Physical scratch card shipment across Nigeria</li>
              <li>Custom school branded portal options</li>
            </ul>
          </div>

          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div>
              <span className="eyebrow" style={{ fontSize: '10px' }}>Tier 3: State Distributor</span>
              <h3 style={{ fontSize: '18px', margin: '4px 0 8px 0', color: 'var(--ink)' }}>
                500+ Scratch Cards
              </h3>
              <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--rust)', fontFamily: "var(--font-sans)", marginBottom: '8px' }}>
                50% Margin
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                For regional educational vendors, state school boards, and large tutorial academies.
              </p>
            </div>
            <ul style={{ paddingLeft: '18px', margin: '14px 0 0 0', fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.6 }}>
              <li>Highest discount wholesale rate</li>
              <li>Dedicated account executive in Lagos / Abuja</li>
              <li>Direct database API license key integration</li>
            </ul>
          </div>
        </div>

        {/* Interactive Earnings Calculator */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--paper-line)',
            borderRadius: '8px',
            padding: '28px',
            marginBottom: '36px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <span className="eyebrow" style={{ color: 'var(--rust)' }}>Revenue Projection</span>
          <h2 style={{ fontSize: '20px', margin: '4px 0 16px 0', color: 'var(--ink)' }}>
            Interactive Reseller Profit Calculator
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontFamily: "var(--font-sans)", marginBottom: '8px', color: 'var(--ink)' }}>
                Estimated Monthly Volume: <strong>{calcQuantity} Scratch Cards</strong>
              </label>
              <input
                type="range"
                min={50}
                max={1500}
                step={25}
                value={calcQuantity}
                onChange={(e) => setCalcQuantity(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--rust)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px', fontFamily: "var(--font-sans)" }}>
                <span>50 cards</span>
                <span>500 cards</span>
                <span>1,500+ cards</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--paper)',
                borderRadius: '6px',
                padding: '16px 20px',
                border: '1px solid var(--paper-line)',
                display: 'flex',
                justifyContent: 'space-around',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '11.5px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  RETAIL VALUE
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', fontFamily: "var(--font-sans)" }}>
                  ₦{totalGrossSales.toLocaleString()}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--paper-line)' }} />
              <div>
                <div style={{ fontSize: '11.5px', fontFamily: "var(--font-sans)", color: 'var(--rust)' }}>
                  YOUR ESTIMATED PROFIT ({(marginPercent * 100).toFixed(0)}%)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--rust)', fontFamily: "var(--font-sans)" }}>
                  ₦{estimatedProfit.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--paper-line)',
            borderRadius: '8px',
            padding: '32px 28px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <span className="eyebrow" style={{ fontSize: '10.5px' }}>Accreditation Application</span>
            <h2 style={{ fontSize: '22px', margin: '4px 0 0 0', color: 'var(--ink)' }}>
              Apply for Accredited Reseller Status
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: '4px 0 0 0' }}>
              Fill out your business details below. Our distribution department verifies and issues reseller merchant credentials within 24 business hours.
            </p>
          </div>

          {isSubmitted ? (
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '6px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <h3 style={{ color: '#15803d', margin: '0 0 8px 0' }}>Application Received Successfully!</h3>
              <p style={{ color: 'var(--ink)', fontSize: '14px', maxWidth: '560px', margin: '0 auto 16px auto' }}>
                Thank you for applying to become an authorized MarkDriller reseller. An account representative will contact you at <strong>{formData.phone}</strong> or <strong>{formData.email}</strong> with your wholesale pricing schedule and verification pack.
              </p>
              <button
                type="button"
                className="btn-custom btn-custom-ghost"
                onClick={() => setIsSubmitted(false)}
                style={{ fontSize: '13px' }}
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Business / Centre Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Apex CBT Centre"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--paper-line)', borderRadius: '4px', fontSize: '14px', backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. Alhaji Babatunde"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--paper-line)', borderRadius: '4px', fontSize: '14px', backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@business.com"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--paper-line)', borderRadius: '4px', fontSize: '14px', backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 0803 123 4567"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--paper-line)', borderRadius: '4px', fontSize: '14px', backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Operating State in Nigeria *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--paper-line)', borderRadius: '4px', fontSize: '14px', backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
                >
                  {['Lagos', 'Abuja (FCT)', 'Oyo', 'Kano', 'Kaduna', 'Edo', 'Rivers', 'Enugu', 'Ogun', 'Delta', 'Anambra', 'Osun'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Business Category *
                </label>
                <select
                  value={formData.businessCategory}
                  onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--paper-line)', borderRadius: '4px', fontSize: '14px', backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
                >
                  <option value="CBT_CENTRE">Accredited CBT Exam Centre</option>
                  <option value="SECONDARY_SCHOOL">Secondary School / College</option>
                  <option value="TUTORIAL_CENTRE">Tutorial / Remedial College</option>
                  <option value="BOOKSHOP">Educational Bookshop / Cyber Cafe</option>
                  <option value="INDIVIDUAL_AGENT">Independent Student Distributor</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Physical Business Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, city / town"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--paper-line)', borderRadius: '4px', fontSize: '14px', backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-custom btn-custom-primary btn-custom-lg"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Partnership Application →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

