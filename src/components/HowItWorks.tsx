import React from 'react';

interface StepItem {
  number: string;
  title: string;
  description: string;
}

const STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Pick your exam',
    description: 'Tell us your level and target exam — WAEC, JAMB, a university course, or all three.',
  },
  {
    number: '02',
    title: 'Study the layer',
    description: 'Work through syllabus-mapped materials for that stage, topic by topic.',
  },
  {
    number: '03',
    title: 'Drill past questions',
    description: 'Practise with real past questions, with instant marking and explanations.',
  },
  {
    number: '04',
    title: 'Sit a full CBT mock',
    description: 'Simulate exam day under a real countdown clock, then review where marks were lost.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2>From sign-up to score sheet</h2>
        </div>
        <div className="steps">
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
