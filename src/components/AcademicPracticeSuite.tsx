import React, { useState } from 'react';
import { CbtPracticeSection } from './CbtPracticeSection.js';
import { PastQuestionsExplorer } from './PastQuestionsExplorer.js';
import { MockExamSection } from './MockExamSection.js';
import { StudyMaterialsSection } from './StudyMaterialsSection.js';

type PracticeTab = 'cbt' | 'questions' | 'mocks' | 'materials';

interface TabDefinition {
  id: PracticeTab;
  label: string;
  badge: string;
  icon: string;
  description: string;
}

const TABS: TabDefinition[] = [
  {
    id: 'cbt',
    label: 'CBT Simulator',
    badge: '8-Key Navigation',
    icon: '💻',
    description: 'Authentic JAMB CBT terminal with on-screen calculator and exam timer',
  },
  {
    id: 'questions',
    label: 'Past Questions Bank',
    badge: 'Chief Examiner Notes',
    icon: '📖',
    description: 'Topic-by-topic worked solutions spanning 1978 – 2026 examination series',
  },
  {
    id: 'mocks',
    label: 'Timed Mock Exams',
    badge: 'Full-Length',
    icon: '⏱️',
    description: 'Strictly timed simulation rooms with standard JAMB & WAEC exam conditions',
  },
  {
    id: 'materials',
    label: 'Curriculum & Novels',
    badge: 'Syllabus Aligned',
    icon: '📚',
    description: 'Comprehensive study notes, key formulas, and prescribed literature texts',
  },
];

export const AcademicPracticeSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PracticeTab>('cbt');

  const handleTabSelect = (tab: PracticeTab) => {
    setActiveTab(tab);
  };

  return (
    <section
      id="practice-suite"
      className="practice-suite-root"
      style={{
        padding: '56px 0 32px 0',
        backgroundColor: 'var(--paper, #f6f8fc)',
        borderTop: '1px solid var(--paper-line)',
        borderBottom: '1px solid var(--paper-line)',
      }}
      aria-label="Unified Academic Drill & Practice Suite"
    >
      <div className="wrap">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 32px auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'var(--rust-soft, rgba(32, 47, 128, 0.08))',
              border: '1px solid var(--paper-line)',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '13px' }}>⚡</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--rust)',
                textTransform: 'uppercase',
              }}
            >
              Academic Drill &amp; Simulation Suite
            </span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-serif, 'Times New Roman', serif)",
              fontSize: 'clamp(24px, 3.2vw, 36px)',
              fontWeight: 700,
              color: 'var(--ink, #121826)',
              margin: '0 0 12px 0',
              lineHeight: 1.25,
            }}
          >
            All 4 Interactive Practice Engines in One Place
          </h2>

          <p
            style={{
              fontSize: '15px',
              color: 'var(--ink-soft, #526070)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Choose your learning mode below. Experience authentic CBT terminal shortcuts, examine topic-by-topic worked past questions, undertake timed mocks, or study curriculum literature notes.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div
          role="tablist"
          aria-label="Practice Engines Switcher"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-btn-${tab.id}`}
                aria-selected={isSelected}
                aria-controls={`tab-panel-${tab.id}`}
                onClick={() => handleTabSelect(tab.id)}
                type="button"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: isSelected
                    ? '2px solid var(--rust, #202f80)'
                    : '1.5px solid var(--paper-line, rgba(18, 24, 38, 0.13))',
                  backgroundColor: isSelected ? 'var(--white, #ffffff)' : 'rgba(255, 255, 255, 0.65)',
                  boxShadow: isSelected
                    ? '0 6px 20px rgba(32, 47, 128, 0.12)'
                    : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{tab.icon}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: isSelected
                        ? 'var(--rust-soft, rgba(32, 47, 128, 0.1))'
                        : 'rgba(0, 0, 0, 0.05)',
                      color: isSelected ? 'var(--rust)' : 'var(--ink-soft)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tab.badge}
                  </span>
                </div>

                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '14px',
                    fontWeight: 700,
                    color: isSelected ? 'var(--rust)' : 'var(--ink)',
                    marginBottom: '4px',
                  }}
                >
                  {tab.label}
                </div>

                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '11.5px',
                    color: 'var(--ink-soft)',
                    lineHeight: 1.35,
                  }}
                >
                  {tab.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div
          id={`tab-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-btn-${activeTab}`}
          style={{
            backgroundColor: 'var(--white, #ffffff)',
            borderRadius: '12px',
            border: '1.5px solid var(--paper-line)',
            boxShadow: 'var(--card-shadow)',
            overflow: 'hidden',
          }}
        >
          {activeTab === 'cbt' && <CbtPracticeSection />}
          {activeTab === 'questions' && <PastQuestionsExplorer />}
          {activeTab === 'mocks' && <MockExamSection />}
          {activeTab === 'materials' && <StudyMaterialsSection />}
        </div>
      </div>
    </section>
  );
};
