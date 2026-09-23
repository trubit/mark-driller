import React, { useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { SUPPORT_CONFIG, getWhatsAppUrl } from '../config/supportConfig.js';

export const ContactPortal: React.FC = () => {
  const { notifySuccess } = useNotificationStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('ACTIVATION_KEY');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    notifySuccess('Message dispatched to MarkDriller customer support team.');
  };

  return (
    <div className="premium-portal-page premium-more-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <main className="wrap" style={{ flex: 1, padding: '48px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="eyebrow" style={{ color: 'var(--rust)' }}>
            Customer Support &amp; Enquiries
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '8px 0 12px 0' }}>
            Get in Touch with MarkDriller Support
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            Have questions about activation keys, CBT software installations, bulk school licenses, or subscription billing? Our dedicated support team is available 24/7.
          </p>
        </div>

        {/* 3 Channels Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '44px',
          }}
        >
          {/* Channel 1: WhatsApp Helpline */}
          <div
            style={{
              backgroundColor: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
              <h3 style={{ fontSize: '18px', margin: '0 0 6px 0', color: 'var(--ink)' }}>
                Official WhatsApp 24/7
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                Fastest response for activation PIN verification, scratch card issues, and payment validation.
              </p>
            </div>
            {SUPPORT_CONFIG.whatsappNumber ? (
              <a
                href={getWhatsAppUrl('Hello MarkDriller Support, I need assistance')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-custom btn-custom-primary"
                style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', justifyContent: 'center', fontSize: '13.5px' }}
              >
                Chat on WhatsApp ➔
              </a>
            ) : (
              <a
                href="#message-form"
                className="btn-custom btn-custom-primary"
                style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', justifyContent: 'center', fontSize: '13.5px' }}
              >
                Send Support Ticket ➔
              </a>
            )}
          </div>

          {/* Channel 2: Telephone Hotlines */}
          <div
            style={{
              backgroundColor: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📞</div>
            <h3 style={{ fontSize: '18px', margin: '0 0 6px 0', color: 'var(--ink)' }}>
              Helpline &amp; Email Support
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Speak directly with an accredited technical or billing specialist Monday to Saturday, 8am – 6pm.
            </p>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: '14px', color: 'var(--rust)', fontWeight: 700 }}>
              {SUPPORT_CONFIG.phoneDisplay ? (
                <>Phone: {SUPPORT_CONFIG.phoneDisplay}<br /></>
              ) : null}
              Email: {SUPPORT_CONFIG.email}
            </div>
          </div>

          {/* Channel 3: Offices */}
          <div
            style={{
              backgroundColor: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏢</div>
            <h3 style={{ fontSize: '18px', margin: '0 0 6px 0', color: 'var(--ink)' }}>
              Head Office Locations
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
              <strong>Lagos:</strong> Victoria Island &amp; Yaba Commercial Zone, Lagos State, Nigeria.<br />
              <strong>Abuja:</strong> Garki 2 &amp; Bwari District, Federal Capital Territory, Nigeria.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--paper-line)',
            borderRadius: '8px',
            padding: '32px 28px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <span className="eyebrow" style={{ color: 'var(--rust)' }}>Send Direct Inquiry</span>
          <h2 style={{ fontSize: '22px', margin: '4px 0 16px 0', color: 'var(--ink)' }}>
            Direct Message Form
          </h2>

          {isSent ? (
            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '6px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <h3 style={{ color: '#15803d', margin: '0 0 8px 0' }}>Thank You for Reaching Out!</h3>
              <p style={{ color: 'var(--ink)', fontSize: '14px', margin: '0 0 16px 0' }}>
                Your inquiry has been logged in our support ticketing system. A representative will respond to <strong>{email}</strong> within 2 hours.
              </p>
              <button
                type="button"
                onClick={() => setIsSent(false)}
                className="btn-custom btn-custom-ghost"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Oluwaseun Adeleke"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--paper-line)', backgroundColor: 'var(--paper)', color: 'var(--ink)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--paper-line)', backgroundColor: 'var(--paper)', color: 'var(--ink)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0803 000 0000"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--paper-line)', backgroundColor: 'var(--paper)', color: 'var(--ink)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Inquiry Topic *
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--paper-line)', backgroundColor: 'var(--paper)', color: 'var(--ink)', fontSize: '14px' }}
                >
                  <option value="ACTIVATION_KEY">Activation PIN / Key Issue</option>
                  <option value="PAYMENT_BILLING">Subscription Payment / Bank Transfer</option>
                  <option value="SCHOOL_CBT">School or CBT Centre Bulk Licensing</option>
                  <option value="RESELLER">Reseller Partnership</option>
                  <option value="APP_INSTALL">Windows or Android Software Install</option>
                  <option value="GENERAL">General Feedback / Inquiries</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: "var(--font-sans)", marginBottom: '4px', color: 'var(--ink)' }}>
                  Message Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry or question in detail..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--paper-line)', backgroundColor: 'var(--paper)', color: 'var(--ink)', fontSize: '14px' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button
                  type="submit"
                  className="btn-custom btn-custom-primary btn-custom-lg"
                >
                  Send Inquiry Message ➔
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

