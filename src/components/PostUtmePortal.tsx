import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SafeImage } from './SafeImage.js';

interface InstitutionProfile {
  id: string;
  name: string;
  shortName: string;
  location: string;
  type: 'FEDERAL' | 'STATE' | 'PRIVATE';
  minJambCutoff: number;
  screeningFormat: string;
  durationMinutes: number;
  totalQuestions: number;
  testedSubjects: string[];
  guidelines: string[];
}

const ACCREDITED_INSTITUTIONS: InstitutionProfile[] = [
  {
    id: 'unilag',
    name: 'University of Lagos',
    shortName: 'UNILAG',
    location: 'Akoka, Yaba, Lagos State',
    type: 'FEDERAL',
    minJambCutoff: 200,
    screeningFormat: 'Computer-Based Screening Test: 40 questions (Maths, English & General Paper). 30% contribution to aggregate.',
    durationMinutes: 30,
    totalQuestions: 40,
    testedSubjects: ['Use of English (15 Qs)', 'Mathematics (15 Qs)', 'General Paper / Current Affairs (10 Qs)'],
    guidelines: [
      'Calculators provided on-screen only; physical gadgets strictly prohibited.',
      'Aggregate formula: 50% JAMB score + 30% Post-UTME score + 20% O\'Level grades.',
      'Candidates must possess credit passes in 5 relevant O\'Level subjects at one sitting for Medicine and Law.',
    ],
  },
  {
    id: 'ui',
    name: 'University of Ibadan',
    shortName: 'UI',
    location: 'Ibadan, Oyo State',
    type: 'FEDERAL',
    minJambCutoff: 200,
    screeningFormat: 'Central Post-UTME CBT: 100 questions across candidate\'s 4 registered JAMB UTME subjects.',
    durationMinutes: 75,
    totalQuestions: 100,
    testedSubjects: ['English Language (25 Qs)', 'Subject 2 (25 Qs)', 'Subject 3 (25 Qs)', 'Subject 4 (25 Qs)'],
    guidelines: [
      'Questions mirror advanced UTME standards with rigorous analytical depth.',
      'Only candidates scoring 50% and above in the Post-UTME test are considered for merit admission.',
      'UI conducts physical verification of original WAEC/NECO certificates.',
    ],
  },
  {
    id: 'oau',
    name: 'Obafemi Awolowo University',
    shortName: 'OAU',
    location: 'Ile-Ife, Osun State',
    type: 'FEDERAL',
    minJambCutoff: 200,
    screeningFormat: 'Computer-Based Screening Test: 40 questions (Aptitude, English & core departmental disciplines).',
    durationMinutes: 40,
    totalQuestions: 40,
    testedSubjects: ['Verbal & English Aptitude', 'Quantitative Analysis', 'Current Affairs & Core Subjects'],
    guidelines: [
      'Negative marking is NOT applied; candidates are advised to attempt all questions.',
      'High competition disciplines (Medicine, Law, Nursing, CompSci) require composite score >= 70%.',
    ],
  },
  {
    id: 'uniben',
    name: 'University of Benin',
    shortName: 'UNIBEN',
    location: 'Benin City, Edo State',
    type: 'FEDERAL',
    minJambCutoff: 200,
    screeningFormat: 'PUTME CBT: Timed examination covering candidate\'s 4 UTME subjects.',
    durationMinutes: 60,
    totalQuestions: 80,
    testedSubjects: ['English', 'Mathematics / Government / Biology', 'Core Departmental Subjects'],
    guidelines: [
      'Candidates must print their screening schedule slip with biometric verification slip.',
      'Aggregate is computed as (JAMB / 8) + (PUTME / 2).',
    ],
  },
  {
    id: 'abu',
    name: 'Ahmadu Bello University',
    shortName: 'ABU',
    location: 'Zaria, Kaduna State',
    type: 'FEDERAL',
    minJambCutoff: 180,
    screeningFormat: 'ABU PUTME CBT Screening: Departmental subject tests.',
    durationMinutes: 45,
    totalQuestions: 50,
    testedSubjects: ['English Language', 'Mathematics / Sciences', 'Faculty-specific discipline'],
    guidelines: [
      'Pass mark threshold is 50% in the screening CBT.',
      'Direct Entry candidates must present official transcript from accredited polytechnics/colleges.',
    ],
  },
  {
    id: 'unn',
    name: 'University of Nigeria, Nsukka',
    shortName: 'UNN',
    location: 'Nsukka, Enugu State',
    type: 'FEDERAL',
    minJambCutoff: 200,
    screeningFormat: 'Computer-Based Screening: 60 questions covering 4 UTME subjects.',
    durationMinutes: 60,
    totalQuestions: 60,
    testedSubjects: ['English', 'Faculty Subject 1', 'Faculty Subject 2', 'Faculty Subject 3'],
    guidelines: [
      'Aggregate computed on a 400-point scale: (JAMB + UNN PUTME) / 2.',
      'Strict adherence to the official JAMB brochure subject combination.',
    ],
  },
  {
    id: 'lasu',
    name: 'Lagos State University',
    shortName: 'LASU',
    location: 'Ojo, Lagos State',
    type: 'STATE',
    minJambCutoff: 195,
    screeningFormat: 'Online Point-Based Grading & Composite Screening System.',
    durationMinutes: 30,
    totalQuestions: 40,
    testedSubjects: ['English Proficiency', 'General Paper & Analytical Skills'],
    guidelines: [
      'Strict priority to Lagos State indigenes under the state catchment quota.',
      'Requires verified WAEC/NECO scratch card verification pin during clearance.',
    ],
  },
  {
    id: 'covenant',
    name: 'Covenant University',
    shortName: 'CU',
    location: 'Ota, Ogun State',
    type: 'PRIVATE',
    minJambCutoff: 200,
    screeningFormat: 'Covenant University Scholastic Aptitude Screening (CUSAS): CBT + Personality Interview.',
    durationMinutes: 60,
    totalQuestions: 60,
    testedSubjects: ['Quantitative Reasoning', 'English & Verbal Aptitude', 'General Knowledge'],
    guidelines: [
      'Requires strong moral and academic standing.',
      'Screening involves both computer-based scholastic aptitude test and character evaluation.',
    ],
  },
];

export const PostUtmePortal: React.FC = () => {
  const navigate = useNavigate();
  const [selectedInstId, setSelectedInstId] = useState<string>('unilag');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = ACCREDITED_INSTITUTIONS.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || inst.type === filterType;
    return matchesSearch && matchesType;
  });

  const activeInstitution =
    ACCREDITED_INSTITUTIONS.find((inst) => inst.id === selectedInstId) || ACCREDITED_INSTITUTIONS[0];

  return (
    <div className="portal-layout premium-portal-page premium-postutme-page" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div className="wrap" style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Breadcrumb / Section Header */}
        <section className="premium-portal-hero" aria-labelledby="post-utme-title">
          <div className="premium-portal-hero-copy">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="eyebrow" style={{ margin: 0 }}>Institution-Specific Screening</span>
            </div>
            <h1 id="post-utme-title" style={{ fontSize: '28px', color: 'var(--ink)', margin: '0 0 8px 0' }}>
              Post-UTME Screening Preparation
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '750px', margin: 0 }}>
              Prepare for university-specific Computer-Based Test (CBT) screenings. Each tertiary institution in Nigeria employs distinct test formats, duration limits, and aggregate formulas.
            </p>
          </div>
          <div className="premium-portal-hero-media">
            <SafeImage
              src="/assets/images/university-screening.jpg"
              alt="University students walking on campus while preparing for admission screening"
              loading="eager"
            />
            <div className="premium-portal-hero-stat">
              <span>Admission Blueprint</span>
              <strong>Compare school rules, timing, subject mix, and aggregate requirements.</strong>
            </div>
          </div>
        </section>

        {/* Filter / Search Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--white)',
            padding: '14px 18px',
            borderRadius: '6px',
            border: '1px solid var(--paper-line)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search university by name, state, or acronym (e.g. UNILAG, UI)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--paper-line)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'FEDERAL', 'STATE', 'PRIVATE'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  border: filterType === t ? '1px solid var(--rust)' : '1px solid var(--paper-line)',
                  background: filterType === t ? 'var(--rust)' : 'var(--paper)',
                  color: filterType === t ? '#ffffff' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Grid: Institution List on Left, Active Institution Deep Dive on Right */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: University Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="eyebrow" style={{ fontSize: '11px', marginBottom: '4px' }}>
              Select University ({filtered.length} Institutions)
            </span>
            {filtered.map((inst) => {
              const isSelected = inst.id === activeInstitution.id;
              return (
                <div
                  className="institution-card"
                  key={inst.id}
                  onClick={() => setSelectedInstId(inst.id)}
                  style={{
                    background: isSelected ? 'var(--white)' : 'var(--paper-dim)',
                    border: isSelected ? '2px solid var(--rust)' : '1px solid var(--paper-line)',
                    borderRadius: '6px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 3px 10px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: '16px', color: 'var(--ink)' }}>
                      {inst.shortName}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: 'rgba(20, 24, 28, 0.06)',
                        color: 'var(--ink-soft)',
                      }}
                    >
                      {inst.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '6px' }}>
                    {inst.name}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                    <span>📍 {inst.location}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--rust)', fontWeight: 600 }}>JAMB Cut-off: {inst.minJambCutoff}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active University Screening Blueprint */}
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '6px',
              padding: '28px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div>
                <span className="eyebrow" style={{ fontSize: '11px' }}>Official Screening Specification</span>
                <h2 style={{ fontSize: '22px', margin: '4px 0 0 0', color: 'var(--ink)' }}>
                  {activeInstitution.name} ({activeInstitution.shortName})
                </h2>
                <span style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                  {activeInstitution.location} • {activeInstitution.type} INSTITUTION
                </span>
              </div>
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                onClick={() => navigate('/portal/questions')}
                style={{
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontFamily: "var(--font-sans)",
                }}
              >
                Launch {activeInstitution.shortName} Mock Drill →
              </button>
            </div>

            {/* Test Specification Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                background: 'var(--paper)',
                padding: '16px',
                borderRadius: '6px',
                margin: '18px 0',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  TEST DURATION
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                  {activeInstitution.durationMinutes} Minutes
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  TOTAL QUESTIONS
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                  {activeInstitution.totalQuestions} CBT Qs
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  MIN JAMB CUT-OFF
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: "var(--font-sans)", color: 'var(--rust)' }}>
                  {activeInstitution.minJambCutoff}+
                </span>
              </div>
            </div>

            {/* Screening Format Description */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontFamily: "var(--font-sans)", marginBottom: '6px', color: 'var(--ink)' }}>
                Screening Architecture &amp; Grading Formula
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
                {activeInstitution.screeningFormat}
              </p>
            </div>

            {/* Tested Subject Breakdown */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontFamily: "var(--font-sans)", marginBottom: '8px', color: 'var(--ink)' }}>
                Tested Disciplines / Syllabus Areas
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {activeInstitution.testedSubjects.map((subj, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--paper-dim)',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12.5px',
                      fontFamily: "var(--font-sans)",
                      color: 'var(--ink)',
                      border: '1px solid var(--paper-line)',
                    }}
                  >
                    ✓ {subj}
                  </span>
                ))}
              </div>
            </div>

            {/* Official Screening Guidelines */}
            <div>
              <h4 style={{ fontSize: '14px', fontFamily: "var(--font-sans)", marginBottom: '8px', color: 'var(--ink)' }}>
                Verified Official Guidelines &amp; Requirements
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                {activeInstitution.guidelines.map((g, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{g}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

