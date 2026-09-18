import React from 'react';
import { BrandLogo } from './BrandLogo.js';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-col">
            <div className="foot-logo" style={{ marginBottom: '12px' }}>
              <BrandLogo size="md" />
            </div>
            <p>Study materials, past questions and CBT practice for secondary and university students across West Africa.</p>
          </div>
          <div className="foot-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#materials">Study materials</a></li>
              <li><a href="#questions">Past questions</a></li>
              <li><a href="#cbt">CBT practice</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Exams</h4>
            <ul>
              <li><a href="#boards">WAEC / WASSCE</a></li>
              <li><a href="#boards">NECO / GCE</a></li>
              <li><a href="#boards">JAMB / Post-UTME</a></li>
              <li><a href="#boards">University courses</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 MARK DRILLER. ALL RIGHTS RESERVED.</span>
          <span>LAGOS · ACCRA · ABUJA</span>
        </div>
      </div>
    </footer>
  );
};
