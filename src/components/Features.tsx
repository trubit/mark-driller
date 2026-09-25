import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetryQuery } from '../api/exams';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { SafeImage } from './SafeImage';

export const Features: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAppStore();
  const { data: telemetry } = useTelemetryQuery();

  const handleFeatureClick = (link: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      navigate(link);
    }
  };
  const qCount =
    telemetry && telemetry.totalQuestions > 150000
      ? `${telemetry.totalQuestions.toLocaleString()} questions`
      : '150,000+ verified questions';

  const featureList = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
          <rect x="4" y="6" width="26" height="17" rx="2" stroke="var(--ink)" strokeWidth="2" />
          <line x1="12" y1="27" x2="22" y2="27" stroke="var(--ink)" strokeWidth="2" />
          <path d="M9 15 L13 19 L20 11" stroke="var(--amber)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Full-Fidelity CBT Simulator',
      description: 'Accurate exam-room simulator mirroring official JAMB 8-key keyboard navigation, countdown timer, built-in calculator, and 4-subject UTME mock format.',
      tag: 'Offline & Online CBT',
      link: '/questions',
      image: '/assets/images/digital-cbt.jpg',
      imageAlt: 'Student using a computer for focused digital learning',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
          <circle cx="17" cy="17" r="13" stroke="var(--steel)" strokeWidth="2" />
          <path d="M12 17 L17 12 L22 17 L17 22 Z" fill="var(--amber)" />
          <line x1="17" y1="7" x2="17" y2="10" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Worked Solutions & Examiner Insights',
      description: 'Comprehensive step-by-step problem solver delivering clear, curriculum-aligned explanations for difficult math, physics, chemistry, and English questions.',
      tag: 'Step-by-Step Logic',
      link: '/questions',
      image: '/assets/images/admin-desk.jpg',
      imageAlt: 'Student reviewing handwritten notes and study calculations',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
          <path d="M17 4 L30 11 L17 18 L4 11 Z" stroke="var(--rust)" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 14.5 V22 C9 22 12 26 17 26 C22 26 25 22 25 22 V14.5" stroke="var(--ink)" strokeWidth="2" fill="none" />
        </svg>
      ),
      title: '150,000+ Past Questions Bank',
      description: 'Complete year-by-year past questions (1978–2026) for JAMB, WAEC, NECO, BECE, and Post-UTME. Drill by specific topic, year, or syllabus difficulty level.',
      tag: qCount,
      link: '/questions',
      image: '/assets/images/study-space.jpg',
      imageAlt: 'Students preparing with books in a study space',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
          <rect x="6" y="4" width="18" height="26" rx="2" stroke="var(--ink)" strokeWidth="2" />
          <line x1="10" y1="10" x2="20" y2="10" stroke="var(--rust)" strokeWidth="2" />
          <line x1="10" y1="15" x2="20" y2="15" stroke="var(--rust)" strokeWidth="2" />
          <line x1="10" y1="20" x2="16" y2="20" stroke="var(--rust)" strokeWidth="2" />
        </svg>
      ),
      title: 'JAMB Literature Novel Summaries',
      description: 'Chapter-by-chapter breakdowns, character profiles, thematic analysis, and high-probability CBT questions for official prescribed JAMB English novels.',
      tag: 'The Life Changer & Sweet Sixteen',
      link: '/novels',
      image: '/assets/images/books-study.jpg',
      imageAlt: 'Open books arranged for literature study',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
          <path d="M7 26 L14 8 L21 26 Z" stroke="var(--steel)" strokeWidth="2" fill="none" />
          <line x1="10" y1="20" x2="18" y2="20" stroke="var(--amber)" strokeWidth="2" />
          <circle cx="26" cy="12" r="4" stroke="var(--rust)" strokeWidth="1.5" />
        </svg>
      ),
      title: 'Science & Math Formula Notebook',
      description: 'Comprehensive digital handbook containing essential formulas, unit conversions, physics laws, and chemical equations with worked exam examples.',
      tag: 'Interactive Reference',
      link: '/formulas',
      image: '/assets/images/science-lab.jpg',
      imageAlt: 'Science study materials and laboratory learning equipment',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
          <circle cx="17" cy="14" r="7" stroke="var(--ink)" strokeWidth="2" />
          <path d="M8 28 C8 23 12 21 17 21 C22 21 26 23 26 28" stroke="var(--ink)" strokeWidth="2" />
          <line x1="17" y1="10" x2="17" y2="14" stroke="var(--amber)" strokeWidth="2" />
        </svg>
      ),
      title: 'School & Course Eligibility Finder',
      description: 'Official JAMB Brochure & IBASS checker. Explore approved courses, verify required O-Level subjects, and check tertiary institutions across Nigeria.',
      tag: 'Admissions Guidance',
      link: '/schools',
      image: '/assets/images/university-screening.jpg',
      imageAlt: 'Students walking on a university campus',
    },
  ];

  return (
    <section className="section" id="materials" aria-label="MarkDriller Comprehensive Learning Suite">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Enterprise-Grade E-Learning Suite</span>
          <h2>Everything You Need to Ace Your Examination</h2>
          <p>
            Designed specifically for Nigerian candidates, schools, and CBT centres. Master concepts, practice under authentic exam constraints, and guarantee tertiary admission.
          </p>
        </div>

        <div className="feature-grid">
          {featureList.map((item, idx) => (
            <div
              className="feature-card"
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="feature-card-media">
                  <SafeImage src={item.image} alt={item.imageAlt} loading="lazy" />
                </div>
                <div className="f-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="f-tag">{item.tag}</span>
              </div>
              <button
                type="button"
                onClick={() => handleFeatureClick(item.link)}
                className="btn-custom btn-custom-ghost"
                style={{
                  marginTop: '16px',
                  width: '100%',
                  fontSize: '12.5px',
                  padding: '8px 12px',
                  textAlign: 'center',
                  justifyContent: 'center',
                }}
              >
                {isAuthenticated ? 'Open Module →' : 'Log in to Access →'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

