import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo.js';

export const Footer: React.FC = () => {

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
              <li><Link to="/questions">JAMB / UTME CBT</Link></li>
              <li><Link to="/questions">WAEC / WASSCE SSCE</Link></li>
              <li><Link to="/questions">NECO National Exams</Link></li>
              <li><Link to="/post-utme">University Post-UTME</Link></li>
              <li><Link to="/novels">JAMB English Novels</Link></li>
              <li><Link to="/questions">BECE / Junior WAEC</Link></li>
            </ul>
          </div>

          {/* Col 3: Educational Tools */}
          <div className="foot-col">
            <h4 style={{ fontSize: '13px', fontFamily: "var(--font-sans)", letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff', marginBottom: '14px' }}>
              Learning Tools
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li><Link to="/cbt">CBT Exam Simulator</Link></li>
              <li><Link to="/materials">Curriculum Notes &amp; PDFs</Link></li>
              <li><Link to="/dictionary">Academic Term Dictionary</Link></li>
              <li><Link to="/flashcards">Interactive Flashcards</Link></li>
              <li><Link to="/formulas">Science &amp; Math Notebook</Link></li>
              <li><Link to="/challenge">Weekly UTME Sprint</Link></li>
            </ul>
          </div>

          {/* Col 4: Admissions & Network */}
          <div className="foot-col">
            <h4 style={{ fontSize: '13px', fontFamily: "var(--font-sans)", letterSpacing: '1px', textTransform: 'uppercase', color: '#ffffff', marginBottom: '14px' }}>
              Partners &amp; Support
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <li><Link to="/contact">Institutional Partnerships</Link></li>
              <li><Link to="/blog">Academic Blog &amp; Guides</Link></li>
              <li><Link to="/schools">Nigerian School Finder</Link></li>
              <li><Link to="/careers">JAMB Subject Combinations</Link></li>
              <li><Link to="/contact">24/7 Helpline &amp; WhatsApp</Link></li>
              <li><Link to="/pricing">Pro Subscription Plans</Link></li>
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

        <div className="foot-bottom" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '12px', fontFamily: "var(--font-sans)", color: 'rgba(248, 247, 242, 0.6)' }}>
          <span>© 2026 MARKDRILLER PLATFORM. ALL RIGHTS RESERVED.</span>
          <span>LAGOS · ABUJA · ENUGU · IBADAN · KADUNA</span>
        </div>
      </div>
    </footer>
  );
};

