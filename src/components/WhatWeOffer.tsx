import React from 'react';
import { Link } from 'react-router-dom';
import { useTelemetryQuery } from '../api/exams.js';

type CapabilityAction =
  | { type: 'link'; label: string; to: string }
  | { type: 'anchor'; label: string; href: string };

interface CapabilityItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  action: CapabilityAction;
  tag: string;
}

export const WhatWeOffer: React.FC = () => {
  const { data: telemetry } = useTelemetryQuery();

  const questionsCount = telemetry?.totalQuestions
    ? `${telemetry.totalQuestions.toLocaleString()}+`
    : 'Curriculum-Verified';

  const capabilities: CapabilityItem[] = [
    {
      id: 'past-questions',
      icon: '📖',
      title: 'Past Questions Bank',
      description: `Comprehensive year-by-year past questions (${questionsCount}) covering JAMB, WAEC, NECO, and Post-UTME with verified solutions.`,
      action: { type: 'link', label: 'Explore Questions →', to: '/questions' },
      tag: 'Curriculum-Aligned',
    },
    {
      id: 'cbt-practice',
      icon: '💻',
      title: 'CBT Practice Engine',
      description: 'Official 8-key keyboard navigation, on-screen scientific calculator, and standard countdown timers matching real exam halls.',
      action: { type: 'anchor', label: 'See Simulator →', href: '#experience' },
      tag: 'Real Hall Conditions',
    },
    {
      id: 'mock-exams',
      icon: '⏱️',
      title: 'Full-Length Mock Exams',
      description: 'Timed 4-subject UTME mock sessions and SSCE papers with instant auto-grading, speed analysis, and lost-mark audits.',
      action: { type: 'anchor', label: 'View Mock Suite →', href: '#experience' },
      tag: 'Standard Timing',
    },
    {
      id: 'worked-solutions',
      icon: '💡',
      title: 'Worked Solutions & Notes',
      description: 'Step-by-step working and Chief Examiner notes for complex mathematics, physics, chemistry, and lexis questions.',
      action: { type: 'link', label: 'Study Explanations →', to: '/questions' },
      tag: 'Step-by-Step Logic',
    },
    {
      id: 'analytics',
      icon: '📊',
      title: 'Diagnostic Analytics',
      description: 'Detailed score breakdown per subject, average response speed per question, and targeted topic weakness identification.',
      action: { type: 'anchor', label: 'Inspect Analytics →', href: '#performance' },
      tag: 'Weakness Tracking',
    },
    {
      id: 'study-materials',
      icon: '📚',
      title: 'Study Materials & Syllabi',
      description: 'Official syllabus outlines, essential formula sheets, and academic notes for all statutory Nigerian secondary exams.',
      action: { type: 'link', label: 'Browse Materials →', to: '/materials' },
      tag: 'Syllabus Outlines',
    },
  ];

  return (
    <section className="section" id="offers" aria-label="What MarkDriller Offers">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Platform Capabilities</span>
          <h2>What MarkDriller Offers</h2>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15.5px' }}>
            Built specifically for Nigerian secondary and tertiary entrance candidates, combining curriculum past questions, real exam simulation, and deep diagnostic tracking.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginTop: '36px',
          }}
        >
          {capabilities.map((cap) => (
            <div
              key={cap.id}
              className="capability-card"
              style={{
                backgroundColor: 'var(--white)',
                border: '1.5px solid var(--paper-line)',
                borderRadius: '10px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--card-shadow)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px', lineHeight: 1 }} aria-hidden="true">
                    {cap.icon}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--paper)',
                      color: 'var(--rust)',
                      border: '1px solid var(--paper-line)',
                    }}
                  >
                    {cap.tag}
                  </span>
                </div>

                <h3 style={{ fontSize: '17.5px', marginBottom: '8px', color: 'var(--ink)' }}>
                  {cap.title}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
                  {cap.description}
                </p>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--paper-line)' }}>
                {cap.action.type === 'link' ? (
                  <Link
                    to={cap.action.to}
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--rust)',
                      textDecoration: 'none',
                    }}
                  >
                    {cap.action.label}
                  </Link>
                ) : (
                  <a
                    href={cap.action.href}
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--rust)',
                      textDecoration: 'none',
                    }}
                  >
                    {cap.action.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
