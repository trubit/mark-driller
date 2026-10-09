import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo.js';
import { useAppStore } from '../store/useAppStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSupportContactQuery, buildMailtoLink } from '../api/supportContact.js';

export const Footer: React.FC = () => {
  const { openAuthModal } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const { data: support } = useSupportContactQuery();
  const navigate = useNavigate();

  const supportEmail = support?.email || 'support@markdriller.com';

  const handleCreateAccountAction = (dest?: string) => {
    if (isAuthenticated && dest) {
      if (dest === 'exam-boards' || dest === 'experience' || dest === 'offers' || dest === 'performance') {
        const el = document.getElementById(dest);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(dest);
      }
    } else {
      openAuthModal('signup');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const footLinkStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: 0,
    color: 'rgba(248, 247, 242, 0.85)',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'left',
    font: 'inherit',
    lineHeight: '1.5',
    transition: 'color 0.15s ease',
  };

  return (
    <footer className="site-footer" aria-label="Site Footer">
      <div className="wrap">
        <div className="foot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '40px' }}>
          {/* Col 1: Brand Info */}
          <div className="foot-col" style={{ gridColumn: 'span 1.5' }}>
            <div className="foot-logo" style={{ marginBottom: '14px' }}>
              <BrandLogo size="md" />
            </div>
            <p style={{ fontSize: '13.5px', color: 'rgba(248, 247, 242, 0.75)', lineHeight: 1.6, maxWidth: '320px' }}>
              High-fidelity CBT simulations, curriculum past questions, and academic intelligence for Nigerian secondary and tertiary candidates.
            </p>
            <div style={{ marginTop: '14px', fontSize: '12px', fontFamily: "var(--font-sans)", color: 'rgba(248, 247, 242, 0.5)' }}>
              Head Office: Victoria Island, Lagos &amp; Garki 2, Abuja, Nigeria
            </div>
          </div>

          {/* Col 2: Examination Preparation */}
          <div className="foot-col">
            <h4 style={{ fontSize: '13px', fontFamily: "var(--font-sans)", letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff', marginBottom: '14px' }}>
              Examinations
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => handleCreateAccountAction('/questions')}
                  aria-label="Create account for JAMB / UTME CBT"
                >
                  JAMB / UTME CBT
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => handleCreateAccountAction('/questions')}
                  aria-label="Create account for WAEC / WASSCE SSCE"
                >
                  WAEC / WASSCE SSCE
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => handleCreateAccountAction('/questions')}
                  aria-label="Create account for NECO National Exams"
                >
                  NECO National Exams
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => handleCreateAccountAction('/post-utme')}
                  aria-label="Create account for University Post-UTME"
                >
                  University Post-UTME
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => handleCreateAccountAction('exam-boards')}
                  aria-label="Create account for Accredited Exam Boards"
                >
                  Accredited Exam Boards
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Educational Tools */}
          <div className="foot-col">
            <h4 style={{ fontSize: '13px', fontFamily: "var(--font-sans)", letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff', marginBottom: '14px' }}>
              Learning Tools
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => handleCreateAccountAction('experience')}
                  aria-label="Create account for CBT Exam Simulator"
                >
                  CBT Exam Simulator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => handleCreateAccountAction('/materials')}
                  aria-label="Create account for Curriculum Notes & PDFs"
                >
                  Curriculum Notes &amp; PDFs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => handleCreateAccountAction('offers')}
                  aria-label="Create account for Past Questions & Solutions"
                >
                  Past Questions &amp; Solutions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => handleCreateAccountAction('/schools')}
                  aria-label="Create account for School & Course Finder"
                >
                  School &amp; Course Finder
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => handleCreateAccountAction('performance')}
                  aria-label="Create account for Diagnostic Analytics"
                >
                  Diagnostic Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Admissions & Network */}
          <div className="foot-col">
            <h4 style={{ fontSize: '13px', fontFamily: "var(--font-sans)", letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff', marginBottom: '14px' }}>
              Platform &amp; Guidance
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => scrollToSection('how-it-works')}
                >
                  How MarkDriller Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => scrollToSection('offers')}
                >
                  What We Offer
                </button>
              </li>
              <li><Link to="/schools">Nigerian School Finder</Link></li>
              <li><Link to="/terms" style={{ color: 'rgba(248, 247, 242, 0.85)', textDecoration: 'none' }}>Student Terms &amp; Conditions</Link></li>
              <li>
                <button
                  type="button"
                  className="foot-link"
                  style={footLinkStyle}
                  onClick={() => scrollToSection('cta')}
                >
                  Start Practising Free
                </button>
              </li>
              <li><a href={buildMailtoLink(supportEmail, 'MarkDriller Academic Support Desk Inquiry')}>Academic Support Desk</a></li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer & Copyright */}
        <div
          style={{
            borderTop: '1px solid rgba(248, 247, 242, 0.12)',
            paddingTop: '20px',
            fontSize: '11.5px',
            color: 'rgba(248, 247, 242, 0.45)',
            lineHeight: 1.6,
            marginBottom: '16px',
          }}
        >
          Disclaimer: MarkDriller is an independent Nigerian educational examination-preparation platform. Joint Admissions and Matriculation Board (JAMB), West African Examinations Council (WAEC), and National Examinations Council (NECO) names, trademarks, and associated emblems are the registered property of their respective statutory bodies and are referenced strictly for descriptive curriculum alignment under fair educational nominative use.
        </div>

        <div className="foot-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '12px', fontFamily: "var(--font-sans)", color: 'rgba(248, 247, 242, 0.6)' }}>
          <span>© 2026 MARKDRILLER PLATFORM. ALL RIGHTS RESERVED.</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link to="/terms" style={{ color: 'rgba(248, 247, 242, 0.75)', textDecoration: 'underline' }}>
              Terms &amp; Conditions
            </Link>
            <span>·</span>
            <span>LAGOS · ABUJA · ENUGU · IBADAN · KADUNA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

