import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

export const StudyMaterialsSection: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAppStore();

  const handleMaterialClick = (link: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate(link);
    }
  };
  const materials = [
    {
      title: 'JAMB Literature Novel Guides',
      tag: 'Compulsory English',
      tagColor: 'var(--rust)',
      description: 'Comprehensive chapter summaries, character profiles, themes, and likely CBT questions for official prescribed novels: The Life Changer & Sweet Sixteen.',
      highlights: ['Chapter-by-chapter breakdowns', 'Character motivation diagrams', '200+ Likely CBT novel questions', 'Key quotes & themes analysis'],
      link: '/novels',
      linkText: 'Read Novel Analysis →',
    },
    {
      title: 'Science & Math Formula Handbook',
      tag: 'STEM Reference',
      tagColor: 'var(--steel)',
      description: 'All essential formulas, physical constants, SI unit conversions, and algebraic identities for Mathematics, Physics, and Chemistry in one searchable digital handbook.',
      highlights: ['Kinematics & thermodynamics laws', 'Organic chemistry reactions', 'Trigonometry & calculus identities', 'Worked calculation examples'],
      link: '/formulas',
      linkText: 'Open Formula Handbook →',
    },
    {
      title: 'Official JAMB & WAEC Syllabi',
      tag: 'Curriculum Outlines',
      tagColor: 'var(--amber)',
      description: 'Topic-by-topic breakdowns of official examination board syllabi. Verify every subtopic and ensure zero blind spots before exam day.',
      highlights: ['100% Syllabus-mapped topics', 'Subtopic weightings & past frequencies', 'Recommended textbooks list', 'Topic mastery checklists'],
      link: '/materials',
      linkText: 'Explore Syllabi →',
    },
    {
      title: 'School & Course Eligibility Checker',
      tag: 'Tertiary Admissions',
      tagColor: '#16a34a',
      description: 'Official JAMB IBASS brochure explorer. Instantly check accredited faculties, required O-Level credit combinations, and UTME subject requirements.',
      highlights: ['O-Level subject prerequisites', 'Federal, state & private universities', 'Polytechnic & college listings', 'Direct Entry (DE) requirements'],
      link: '/schools',
      linkText: 'Check Course Requirements →',
    },
  ];

  return (
    <section className="section" id="study-materials" aria-label="Syllabus-Aligned Study Materials">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow">Curriculum Resources</span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(226, 154, 60, 0.15)',
                color: 'var(--amber)',
                fontWeight: 600,
              }}
            >
              2026 Prescribed Texts Included
            </span>
          </div>
          <h2>Curated Study Materials &amp; Reference Tools</h2>
          <p style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--ink-soft)', fontSize: '15px' }}>
            More than just questions. Master foundational concepts with syllabus-aligned summaries, novel analyses, science formulas, and university admission brochures.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {materials.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--white)',
                border: '1.5px solid var(--paper-line)',
                borderRadius: '10px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--card-shadow)',
                transition: 'transform 0.2s ease',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--paper)',
                    color: item.tagColor,
                    border: '1px solid var(--paper-line)',
                  }}
                >
                  {item.tag}
                </span>
              </div>

              <h3 style={{ fontSize: '17px', margin: '0 0 8px 0', color: 'var(--ink)', lineHeight: 1.3 }}>
                {item.title}
              </h3>

              <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                {item.description}
              </p>

              <div
                style={{
                  backgroundColor: 'var(--paper-soft, #fcfcfb)',
                  borderRadius: '6px',
                  padding: '12px',
                  border: '1px solid var(--paper-line)',
                  marginBottom: '20px',
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '10.5px',
                    color: 'var(--ink)',
                    fontWeight: 700,
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  KEY HIGHLIGHTS:
                </span>
                <ul
                  style={{
                    paddingLeft: '16px',
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--ink-soft)',
                    lineHeight: 1.6,
                  }}
                >
                  {item.highlights.map((h, hIdx) => (
                    <li key={hIdx}>{h}</li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleMaterialClick(item.link)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--rust)',
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: '13.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textAlign: 'left',
                }}
              >
                {item.linkText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

