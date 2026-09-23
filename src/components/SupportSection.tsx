import React from 'react';
import { Link } from 'react-router-dom';
import { SUPPORT_CONFIG, getWhatsAppUrl } from '../config/supportConfig';

export const SupportSection: React.FC = () => {
  const whatsappUrl = getWhatsAppUrl('Hello MarkDriller Support, I need assistance with CBT practice / activation.');

  return (
    <section className="section" id="support" aria-label="Customer and Institutional Support">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow">Direct Assistance</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(62, 110, 142, 0.12)',
                color: 'var(--steel)',
                fontWeight: 600,
              }}
            >
              Lagos &amp; Abuja Desks
            </span>
          </div>
          <h2>We Are Here to Support Your Exam Journey</h2>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            Whether you are a student preparing for UTME, a parent purchasing an activation key, or a school administrator deploying CBT software, our team is ready to assist.
          </p>
        </div>

        {/* 3 Contact Support Channels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          {/* Card 1: Official Help Line */}
          <div
            style={{
              background: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(168, 86, 47, 0.1)',
                color: 'var(--rust)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              📞
            </div>
            <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--ink)' }}>
              Phone &amp; SMS Helplines
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
              Available Monday – Saturday, 8:00 AM to 6:00 PM WAT for urgent activation or download guidance.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
              <a
                href={`tel:${SUPPORT_CONFIG.phoneDisplay}`}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--rust)',
                  textDecoration: 'none',
                }}
              >
                {SUPPORT_CONFIG.phoneDisplay}
              </a>
            </div>
          </div>

          {/* Card 2: Email & Support Ticket */}
          <div
            style={{
              background: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(62, 110, 142, 0.1)',
                color: 'var(--steel)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              ✉️
            </div>
            <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--ink)' }}>
              Email &amp; Help Desk
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
              Submit technical queries, billing receipts, or institutional partnership inquiries for fast turnaround.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
              <a
                href={`mailto:${SUPPORT_CONFIG.email}`}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: 'var(--steel)',
                  textDecoration: 'none',
                }}
              >
                {SUPPORT_CONFIG.email}
              </a>
            </div>
          </div>

          {/* Card 3: WhatsApp Instant Support */}
          <div
            style={{
              background: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              💬
            </div>
            <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--ink)' }}>
              WhatsApp Instant Support
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
              Chat directly with our student onboarding reps for immediate scratch card resolution and links.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#16a34a',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Start WhatsApp Chat →
              </a>
            </div>
          </div>
        </div>

        {/* Corporate Office Strip */}
        <div
          style={{
            backgroundColor: 'var(--paper)',
            borderRadius: '8px',
            padding: '18px 24px',
            border: '1px solid var(--paper-line)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            fontSize: '13px',
            color: 'var(--ink)',
          }}
        >
          <div>
            <strong style={{ color: 'var(--rust)', display: 'block', marginBottom: '2px' }}>
              📍 Corporate &amp; Editorial Presence:
            </strong>
            <span style={{ color: 'var(--ink-soft)' }}>
              Lagos Office: 42 Commercial Avenue, Yaba, Lagos State · Abuja Support Desk: Plot 18 Ahmadu Bello Way, Central Business District, Abuja.
            </span>
          </div>

          <Link
            to="/contact"
            className="btn-custom btn-custom-ghost"
            style={{ fontSize: '12.5px', padding: '6px 14px', whiteSpace: 'nowrap' }}
          >
            Visit Full Contact Portal →
          </Link>
        </div>
      </div>
    </section>
  );
};

