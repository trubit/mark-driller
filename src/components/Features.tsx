import React from 'react';

export const Features: React.FC = () => {
  return (
    <section className="section" id="materials">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">What you get</span>
          <h2>Three tools. One target.</h2>
          <p>Everything is built around a single job: getting your next result closer to the mark you're aiming for.</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <svg className="f-icon" width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect x="6" y="4" width="18" height="26" rx="1.5" stroke="#14181c" strokeWidth="2" />
              <line x1="10" y1="11" x2="20" y2="11" stroke="#3e6e8e" strokeWidth="2" />
              <line x1="10" y1="16" x2="20" y2="16" stroke="#3e6e8e" strokeWidth="2" />
              <line x1="10" y1="21" x2="16" y2="21" stroke="#3e6e8e" strokeWidth="2" />
            </svg>
            <h3>Study materials</h3>
            <p>Syllabus-mapped notes, worked examples and revision guides for every core and elective subject, from JSS1 through 400 level.</p>
            <span className="f-tag" id="materials-tag">Updated every term</span>
          </div>

          <div className="feature-card" id="questions">
            <svg className="f-icon" width="34" height="34" viewBox="0 0 34 34" fill="none">
              <path d="M17 4 L30 11 L17 18 L4 11 Z" stroke="#a8562f" strokeWidth="2" strokeLinejoin="round" />
              <path d="M9 14.5 V22 C9 22 12 26 17 26 C22 26 25 22 25 22 V14.5" stroke="#14181c" strokeWidth="2" fill="none" />
            </svg>
            <h3>Past questions bank</h3>
            <p>Real questions from previous WAEC, NECO, JAMB and university sittings, sorted by year, topic and difficulty — with marking guides.</p>
            <span className="f-tag">120,000+ questions</span>
          </div>

          <div className="feature-card" id="cbt">
            <svg className="f-icon" width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect x="4" y="6" width="26" height="17" rx="1.5" stroke="#14181c" strokeWidth="2" />
              <line x1="12" y1="27" x2="22" y2="27" stroke="#14181c" strokeWidth="2" />
              <path d="M9 15 L13 19 L20 11" stroke="#e29a3c" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3>CBT practice</h3>
            <p>A timed, exam-accurate computer-based test simulator that mirrors the real JAMB and Post-UTME interface — down to the countdown clock.</p>
            <span className="f-tag">Instant scoring</span>
          </div>
        </div>
      </div>
    </section>
  );
};
