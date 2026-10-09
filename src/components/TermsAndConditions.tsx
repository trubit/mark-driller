import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useTermsStatusQuery } from '../api/terms.js';

export const TermsAndConditions: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: termsStatus } = useTermsStatusQuery();

  useEffect(() => {
    document.title = 'Student Terms & Conditions | MarkDriller CBT Platform';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div
      style={{
        backgroundColor: 'var(--paper)',
        color: 'var(--ink)',
        minHeight: '100vh',
        padding: '32px 16px 80px',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {/* Navigation Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink-soft)' }}>
            <Link to="/" style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>
              Home
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Terms &amp; Conditions</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-custom btn-custom-ghost"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                ← Back to Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-custom btn-custom-ghost"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                ← Return to Platform
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/portal/cbt')}
              className="btn-custom btn-custom-primary"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              Start CBT Practice →
            </button>
          </div>
        </div>

        {/* Hero Header Card */}
        <header
          className="mk-card"
          style={{
            backgroundColor: 'var(--white)',
            border: '1.5px solid var(--paper-line)',
            borderRadius: '12px',
            padding: '32px 28px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '4px',
              backgroundColor: 'var(--steel-soft, rgba(147, 197, 253, 0.15))',
              color: 'var(--steel)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '14px',
              border: '1px solid var(--paper-line)',
            }}
          >
            <span>Official Policy</span>
            <span>•</span>
            <span>Version 1.0</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 800,
              fontFamily: 'var(--font-sans)',
              margin: '0 0 12px',
              lineHeight: 1.25,
              color: 'var(--ink)',
            }}
          >
            Mark Driller CBT Platform — Student Terms &amp; Conditions
          </h1>

          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.65,
              color: 'var(--ink-soft)',
              margin: '0 0 20px',
              maxWidth: '80ch',
            }}
          >
            Welcome to Mark Driller CBT Platform. These Terms &amp; Conditions establish the rules that every student
            must agree to follow before using our Computer-Based Test (CBT) platform. By creating an account, logging
            in, starting a test, or using any service on this platform, you confirm that you have read, understood, and
            agreed to these Terms &amp; Conditions.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--paper-line)',
              fontSize: '12.5px',
              color: 'var(--ink-soft)',
            }}
          >
            <div>
              <strong>Effective Date:</strong> October 9, 2026
            </div>
            <div>
              <strong>Applies To:</strong> All Registered Students &amp; CBT Candidates
            </div>
            {termsStatus?.hasAccepted && (
              <div style={{ color: 'var(--forest)', fontWeight: 600 }}>
                ✓ Accepted for this account on {new Date(termsStatus.acceptedAt || '').toLocaleDateString()}
              </div>
            )}
          </div>
        </header>

        {/* Table of Contents Pill Bar */}
        <nav
          aria-label="Terms of conditions quick navigation"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '28px',
            padding: '12px 16px',
            backgroundColor: 'var(--white)',
            borderRadius: '8px',
            border: '1px solid var(--paper-line)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-soft)', alignSelf: 'center', marginRight: '4px' }}>
            Jump to Section:
          </span>
          {[
            { id: 'sec-1', label: '1. Account' },
            { id: 'sec-2', label: '2. Exam Rules' },
            { id: 'sec-3', label: '3. Timing' },
            { id: 'sec-4', label: '4. Technical' },
            { id: 'sec-5', label: '5. Results' },
            { id: 'sec-6', label: '6. Misconduct' },
            { id: 'sec-7', label: '7. IP' },
            { id: 'sec-8', label: '8. Prohibited' },
            { id: 'sec-9', label: '9. Privacy' },
            { id: 'sec-10', label: '10. Payments' },
            { id: 'sec-11', label: '11. Availability' },
            { id: 'sec-12', label: '12. Changes' },
            { id: 'sec-13', label: '13. Declaration' },
            { id: 'sec-14', label: '14. Acceptance' },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                textDecoration: 'none',
                border: '1px solid var(--paper-line)',
                transition: 'background-color 0.15s ease',
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* 14 Distinct Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section 1 */}
          <section
            id="sec-1"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>1</span>
              Student Account
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
              <li>Each student is responsible for providing accurate information when creating an account.</li>
              <li>Students must keep their login details confidential and must not share their account with another person.</li>
              <li>Students are responsible for activities carried out through their account.</li>
              <li>Mark Driller may suspend or restrict an account where there is evidence of misuse, cheating, impersonation, or violation of these Terms.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section
            id="sec-2"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>2</span>
              Examination Rules
            </h2>
            <div style={{ marginBottom: '14px' }}>
              <strong style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--forest)' }}>
                Students must:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
                <li>Read all instructions carefully before starting a test.</li>
                <li>Complete the examination independently unless the test specifically allows collaboration.</li>
                <li>Submit answers before the examination time expires.</li>
                <li>Follow all instructions displayed on the examination page.</li>
                <li>Remain on the examination page where required by the particular test.</li>
              </ul>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--rust)' }}>
                Students must not:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
                <li>Receive unauthorized assistance from another person.</li>
                <li>Allow another person to take a test on their behalf.</li>
                <li>Copy, distribute, photograph, record, or reproduce examination questions without permission.</li>
                <li>Attempt to manipulate the CBT system or examination results.</li>
                <li>Use unauthorized materials or resources where the test rules prohibit them.</li>
                <li>Attempt to gain unauthorized access to another student's account or examination.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section
            id="sec-3"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>3</span>
              Timing
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
              <li>Each CBT may have a specified duration.</li>
              <li>The countdown timer begins according to the test settings.</li>
              <li>Students are responsible for managing their examination time.</li>
              <li>Where the system automatically submits a test when time expires, answers saved by the system at that time may be submitted automatically.</li>
              <li>Students should not wait until the final seconds to submit their examination.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section
            id="sec-4"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>4</span>
              Technical Problems
            </h2>
            <p style={{ margin: '0 0 12px', fontSize: '14.5px', color: 'var(--ink)', lineHeight: 1.6 }}>
              Mark Driller will make reasonable efforts to keep the platform available and functioning properly. However, technical problems may occasionally occur because of internet connectivity, device problems, browser problems, power interruptions, server maintenance, or other circumstances beyond our control.
            </p>
            <strong style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Students should:</strong>
            <ul style={{ margin: '0 0 14px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
              <li>Use a reliable internet connection where possible.</li>
              <li>Ensure their device has sufficient battery power.</li>
              <li>Use a supported and updated browser.</li>
              <li>Report serious technical problems as soon as they occur.</li>
            </ul>
            <div
              style={{
                backgroundColor: 'var(--paper)',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '13.5px',
                color: 'var(--ink-soft)',
                borderLeft: '3px solid var(--amber-deep, #d97706)',
              }}
            >
              A technical problem does not automatically guarantee that an examination will be reset or a result changed. Any decision regarding a reset or retake will depend on the circumstances and applicable examination rules.
            </div>
          </section>

          {/* Section 5 */}
          <section
            id="sec-5"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>5</span>
              Results and Scores
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
              <li>Results displayed by the platform are based on the answers recorded by the CBT system.</li>
              <li>Students should carefully review their submitted answers where the test settings allow this.</li>
              <li>Mark Driller reserves the right to correct a result where a genuine technical or administrative error is identified.</li>
              <li>Where a test is being used by a school, organization, or examination body, the rules of that organization may also apply.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section
            id="sec-6"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--rust)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--rust-soft, rgba(239, 68, 68, 0.15))', color: 'var(--rust)', padding: '2px 8px', borderRadius: '4px' }}>6</span>
              Cheating and Misconduct
            </h2>
            <p style={{ margin: '0 0 12px', fontSize: '14.5px', color: 'var(--ink)', lineHeight: 1.6 }}>
              Any attempt to cheat, impersonate another student, manipulate the examination system, or obtain unauthorized assistance may result in:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
              <li><strong>Cancellation</strong> of the affected test.</li>
              <li><strong>Removal or withholding</strong> of the result.</li>
              <li><strong>Suspension or termination</strong> of the student's account.</li>
              <li><strong>Disqualification</strong> from a particular CBT.</li>
              <li><strong>Further administrative action</strong> where required by the relevant school or examination organization.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section
            id="sec-7"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>7</span>
              Content and Intellectual Property
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
              <li>All examination questions, practice materials, graphics, logos, software, text, and other materials provided on the Mark Driller platform belong to Mark Driller or their respective rights holders unless otherwise stated.</li>
              <li>Students may use the materials for their permitted educational purposes but must not reproduce, sell, redistribute, publish, or commercially exploit them without authorization.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section
            id="sec-8"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>8</span>
              Prohibited Activities
            </h2>
            <strong style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--rust)' }}>
              Students must not:
            </strong>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
              <li>Hack, attack, damage, or interfere with the platform.</li>
              <li>Attempt to bypass security measures.</li>
              <li>Introduce malicious software or harmful code.</li>
              <li>Access information belonging to another student.</li>
              <li>Reverse engineer or unlawfully copy the platform.</li>
              <li>Use automated methods to interfere with examinations.</li>
              <li>Upload unlawful, harmful, offensive, or unauthorized content.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section
            id="sec-9"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>9</span>
              Privacy and Student Information
            </h2>
            <p style={{ margin: '0 0 12px', fontSize: '14.5px', color: 'var(--ink)', lineHeight: 1.6 }}>
              Students should provide only accurate information requested by the platform. Information collected through the platform may be used for purposes such as:
            </p>
            <ul style={{ margin: '0 0 14px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
              <li>Creating and managing student accounts.</li>
              <li>Delivering CBT examinations.</li>
              <li>Recording examination attempts and scores.</li>
              <li>Providing results and educational services.</li>
              <li>Maintaining platform security and preventing abuse.</li>
            </ul>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              Personal information will be handled in accordance with the platform's applicable privacy policy and relevant data protection laws.
            </p>
          </section>

          {/* Section 10 */}
          <section
            id="sec-10"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>10</span>
              Payments and Refunds
            </h2>
            <strong style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>
              Where paid CBT services are offered:
            </strong>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
              <li>Students should confirm the selected service before making payment.</li>
              <li>Payment does not guarantee a particular examination result.</li>
              <li>Refunds, where applicable, will be handled according to the platform's refund policy.</li>
              <li>Students must not attempt fraudulent payment transactions or chargebacks.</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section
            id="sec-11"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>11</span>
              Platform Availability
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
              <li>Mark Driller may occasionally need to suspend or limit access to the platform for maintenance, updates, security reasons, or circumstances beyond its reasonable control.</li>
              <li>Where reasonably possible, students may be notified of planned maintenance or significant service interruptions.</li>
            </ul>
          </section>

          {/* Section 12 */}
          <section
            id="sec-12"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>12</span>
              Changes to These Terms
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.6 }}>
              <li>Mark Driller may update these Terms &amp; Conditions when necessary to reflect changes to the platform, services, security requirements, or applicable laws.</li>
              <li>Updated terms may be published on the website, and continued use of the platform after an update may constitute acceptance of the revised terms.</li>
            </ul>
          </section>

          {/* Section 13 */}
          <section
            id="sec-13"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1.5px solid var(--forest)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px', color: 'var(--forest)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--forest-soft)', color: 'var(--forest)', padding: '2px 8px', borderRadius: '4px' }}>13</span>
              Student Declaration
            </h2>
            <p style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--ink-soft)' }}>
              Before starting a Computer-Based Test (CBT), the student confirms and pledges that:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'I have read and understood the Mark Driller CBT Terms & Conditions.',
                'I agree to follow all examination instructions and rules.',
                'I understand that cheating, impersonation, unauthorized assistance, and attempts to manipulate the CBT system are prohibited.',
                'I understand that violation of these rules may result in cancellation of my test, withholding of my result, suspension of my account, or other appropriate action.',
                'I confirm that the information provided by me is accurate.',
                'I agree to use the Mark Driller CBT platform responsibly and lawfully.',
              ].map((text, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--paper)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: 'var(--ink)',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: 'var(--forest)', fontWeight: 700, fontSize: '16px' }}>☑</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 14 */}
          <section
            id="sec-14"
            className="mk-card"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--paper-dim)', padding: '2px 8px', borderRadius: '4px' }}>14</span>
              Acceptance
            </h2>
            <p style={{ margin: 0, fontSize: '14.5px', color: 'var(--ink)', lineHeight: 1.6 }}>
              By selecting “I Agree”, “Accept Terms &amp; Conditions”, or starting a CBT examination, the student confirms that they have read, understood, and agreed to comply with these Terms &amp; Conditions.
            </p>
          </section>
        </div>

        {/* Official Contact Box */}
        <footer
          className="mk-card"
          style={{
            marginTop: '32px',
            backgroundColor: 'var(--white)',
            border: '1px solid var(--paper-line)',
            borderRadius: '8px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
            Mark Driller CBT Platform — Contact Information
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-soft)' }}>
            For questions or inquiries regarding these Terms &amp; Conditions, please reach out via our official communication channels:
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              paddingTop: '8px',
              fontSize: '13.5px',
            }}
          >
            <div>
              <span style={{ color: 'var(--ink-soft)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                Platform
              </span>
              <strong>Mark Driller CBT Platform</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-soft)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                Official Email
              </span>
              <a href="mailto:markzionsinachi@gmail.com" style={{ color: 'var(--forest)', textDecoration: 'underline' }}>
                markzionsinachi@gmail.com
              </a>
            </div>
            <div>
              <span style={{ color: 'var(--ink-soft)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                Official Phone
              </span>
              <a href="tel:08160133154" style={{ color: 'var(--forest)', textDecoration: 'underline' }}>
                08160133154
              </a>
            </div>
            <div>
              <span style={{ color: 'var(--ink-soft)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                Website
              </span>
              <a href="https://markdriller.ng" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--forest)', textDecoration: 'underline' }}>
                markdriller.ng
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
