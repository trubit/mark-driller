import React from 'react';

interface StepItem {
  number: string;
  title: string;
  description: string;
}

const STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Choose an Examination',
    description: 'Select your target examination board — JAMB/UTME, WAEC, NECO, GCE, or university Post-UTME.',
  },
  {
    number: '02',
    title: 'Choose Subject & Topic',
    description: 'Pick your registered subjects and navigate topic-by-topic aligned with the official national syllabus.',
  },
  {
    number: '03',
    title: 'Practice or Study',
    description: 'Solve authentic past questions with instant marking, step-by-step working, and Chief Examiner explanations.',
  },
  {
    number: '04',
    title: 'Take a Timed CBT Mock',
    description: 'Sit full-length timed mock exams under official 8-key keyboard controls, built-in calculator, and exam clock.',
  },
  {
    number: '05',
    title: 'Review Your Performance',
    description: 'Inspect detailed analytics on speed-per-question, accuracy percentage, and pinpoint exact weak topics.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="section" id="how-it-works" aria-label="How MarkDriller Works">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">User Journey</span>
          <h2>How It Works</h2>
          <p style={{ maxWidth: '620px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15.5px' }}>
            A proven, structured five-step preparation workflow from initial topic revision to exam-day confidence.
          </p>
        </div>
        <div className="steps" style={{ marginTop: '36px' }}>
          {STEPS.map((step) => (
            <div className="step" key={step.number}>
              <span className="step-num mono">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
