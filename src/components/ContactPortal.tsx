import React, { useState } from 'react';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSupportContactQuery, buildWhatsAppLink, buildTelLink, buildMailtoLink } from '../api/supportContact.js';
import { useSubmitSupportTicketMutation } from '../api/support.js';

export const ContactPortal: React.FC = () => {
  const { user } = useAuthStore();
  const { notifySuccess, notifyError } = useNotificationStore();
  const submitTicketMutation = useSubmitSupportTicketMutation();
  const { data: support } = useSupportContactQuery();

  const isWhatsAppEnabled = support ? support.whatsappEnabled !== false : true;
  const whatsappNum = support?.whatsappNumber || '2348030001234';
  const phoneDisplay = support?.phoneDisplay || support?.phone || '+234 803 000 1234';
  const emailDisplay = support?.emailDisplay || support?.email || 'support@markdriller.com';
  const isPhoneEnabled = support ? support.phoneEnabled !== false : true;
  const isEmailEnabled = support ? support.emailEnabled !== false : true;

  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<
    | 'PAYMENT_PROBLEM'
    | 'LOGIN_PROBLEM'
    | 'QUESTION_ERROR'
    | 'TECHNICAL_PROBLEM'
    | 'SUBSCRIPTION_PROBLEM'
    | 'OTHER'
  >('PAYMENT_PROBLEM');
  const [subjectText, setSubjectText] = useState('');
  const [message, setMessage] = useState('');
  const [ticketRef, setTicketRef] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitTicketMutation.isPending) return;
    try {
      const idempotencyKey = `sub_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      const res = await submitTicketMutation.mutateAsync({
        fullName: name,
        email,
        phone: phone || undefined,
        category,
        subject: subjectText || `Inquiry: ${category.replace(/_/g, ' ')}`,
        message,
        idempotencyKey,
      });

      setTicketRef(res.ticketReference);
      notifySuccess(`Support request registered: ${res.ticketReference}`);
    } catch (err: any) {
      let msg = err.message || 'Failed to submit support inquiry. Please try again.';
      if (err.details) {
        const detailsList = Object.entries(err.details)
          .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
          .join('; ');
        if (detailsList) msg += ` (${detailsList})`;
      }
      notifyError(msg);
    }
  };

  return (
    <div className="premium-portal-page premium-more-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <main className="wrap" style={{ flex: 1, padding: '48px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="eyebrow" style={{ color: 'var(--rust)' }}>
            Customer Support &amp; Academic Help Desk
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '8px 0 12px 0' }}>
            Get in Touch with MarkDriller Support
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '16px', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            Have questions about CBT practice, payment verification, question accuracy, or technical issues? Our academic operations team is on standby to assist you.
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
                Fastest response for subscription validation, bank transfer verification, and account support.
              </p>
            </div>
            {isWhatsAppEnabled && whatsappNum ? (
              <a
                href={buildWhatsAppLink(whatsappNum, 'Hello MarkDriller Support, I need assistance')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-custom btn-custom-primary"
                style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', justifyContent: 'center', fontSize: '13.5px' }}
              >
                Chat on WhatsApp ({support?.whatsappDisplay || whatsappNum}) ➔
              </a>
            ) : (
              <a
                href="#message-form"
                className="btn-custom btn-custom-primary"
                style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', justifyContent: 'center', fontSize: '13.5px' }}
              >
                Submit Ticket Below ➔
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
              Academic questions, institutional partnerships, and curriculum inquiries.
            </p>
            <div style={{ fontSize: '14px', color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {isPhoneEnabled && phoneDisplay && (
                <div>
                  <strong>Phone:</strong> <a href={buildTelLink(phoneDisplay)} style={{ color: 'var(--rust)' }}>{phoneDisplay}</a>
                </div>
              )}
              {isEmailEnabled && emailDisplay && (
                <div>
                  <strong>Email:</strong> <a href={buildMailtoLink(emailDisplay)} style={{ color: 'var(--rust)' }}>{emailDisplay}</a>
                </div>
              )}
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                Response window: {support?.workingHours || 'Typically within 2 hours'}
              </div>
            </div>
          </div>

          {/* Channel 3: Institutional CBT Licencing */}
          <div
            style={{
              backgroundColor: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏛️</div>
            <h3 style={{ fontSize: '18px', margin: '0 0 6px 0', color: 'var(--ink)' }}>
              Schools &amp; CBT Centres
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Inquire about local offline computer lab servers, school-wide bulk student licensing, and customized mock setups.
            </p>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
              Bulk student discounts available for registered secondary schools and tutorial centres.
            </div>
          </div>
        </div>

        {/* Contact / Support Ticket Form (Section 53, 54, 55) */}
        <div
          id="message-form"
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--paper-line)',
            borderRadius: '8px',
            padding: '32px 28px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <span className="eyebrow" style={{ color: 'var(--rust)' }}>Official Support Ticket</span>
          <h2 style={{ fontSize: '22px', margin: '4px 0 16px 0', color: 'var(--ink)' }}>
            Submit an Inquiry or Issue Report
          </h2>

          {ticketRef ? (
            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1.5px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '6px',
                padding: '28px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✓</div>
              <h3 style={{ color: '#15803d', margin: '0 0 8px 0', fontSize: '20px' }}>Support Ticket Registered!</h3>
              <p style={{ color: 'var(--ink)', fontSize: '15px', margin: '0 0 12px 0' }}>
                Your ticket reference number is: <strong style={{ fontFamily: 'monospace', fontSize: '17px', color: 'var(--rust)' }}>{ticketRef}</strong>
              </p>
              <p style={{ color: 'var(--ink-soft)', fontSize: '13.5px', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Our operations team has received your inquiry and will follow up with you at <strong>{email}</strong> within 2 hours. Keep your reference number for any follow-up.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTicketRef(null);
                  setMessage('');
                  setSubjectText('');
                }}
                className="btn-custom btn-custom-ghost"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-sans)', marginBottom: '4px', color: 'var(--ink)' }}>
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
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-sans)', marginBottom: '4px', color: 'var(--ink)' }}>
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
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-sans)', marginBottom: '4px', color: 'var(--ink)' }}>
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
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-sans)', marginBottom: '4px', color: 'var(--ink)' }}>
                  Issue Category (Section 54) *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--paper-line)', backgroundColor: 'var(--paper)', color: 'var(--ink)', fontSize: '14px' }}
                >
                  <option value="PAYMENT_PROBLEM">💳 Payment problem / Bank transfer</option>
                  <option value="LOGIN_PROBLEM">🔐 Login or account problem</option>
                  <option value="QUESTION_ERROR">📝 Incorrect question or answer report</option>
                  <option value="TECHNICAL_PROBLEM">⚙️ Technical problem / CBT Simulator</option>
                  <option value="SUBSCRIPTION_PROBLEM">⭐ Subscription problem / Tier activation</option>
                  <option value="OTHER">💬 Other inquiries</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-sans)', marginBottom: '4px', color: 'var(--ink)' }}>
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={subjectText}
                  onChange={(e) => setSubjectText(e.target.value)}
                  placeholder="Brief summary of your inquiry (e.g. Receipt uploaded reference MNL_12345)"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--paper-line)', backgroundColor: 'var(--paper)', color: 'var(--ink)', fontSize: '14px' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontFamily: 'var(--font-sans)', marginBottom: '4px', color: 'var(--ink)' }}>
                  Message Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry or question in detail. Never include your password or sensitive payment-card numbers."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--paper-line)', backgroundColor: 'var(--paper)', color: 'var(--ink)', fontSize: '14px' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button
                  type="submit"
                  disabled={submitTicketMutation.isPending}
                  className="btn-custom btn-custom-primary btn-custom-lg"
                >
                  {submitTicketMutation.isPending ? 'Submitting Ticket...' : 'Send Inquiry Message ➔'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
