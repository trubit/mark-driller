import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';

interface VideoLesson {
  id: string;
  videoId: string;
  subject: string;
  exam: string;
  topic: string;
  title: string;
  durationMinutes: number;
  instructor: string;
  description: string;
  keyConcepts: string[];
  embedUrl: string;
  isFreePreview: boolean;
}

const SYLLABUS_VIDEO_LESSONS: VideoLesson[] = [
  {
    id: 'v-math-1',
    videoId: 'kpCJyQ2usJ4',
    subject: 'Mathematics',
    exam: 'WAEC / JAMB',
    topic: 'Algebra & Functions',
    title: 'The Beauty of Algebra: Equations, Variables & Expressions',
    durationMinutes: 32,
    instructor: 'Sal Khan (Khan Academy)',
    description: 'Core algebraic foundation: understanding variables, algebraic expressions, linear equations, and quadratic problem-solving for WAEC and UTME mathematics.',
    keyConcepts: ['Algebraic Variables & Terms', 'Linear vs Quadratic Expressions', 'Equational Transformations', 'Algorithmic Problem Solving'],
    embedUrl: 'https://www.youtube.com/embed/kpCJyQ2usJ4',
    isFreePreview: true,
  },
  {
    id: 'v-eng-1',
    videoId: 'ptM7FzyjtRk',
    subject: 'English Language',
    exam: 'JAMB / UTME',
    topic: 'Lexis, Structure & Syntax',
    title: "Grammar's Great Divide: Syntax, Punctuation & Concord",
    durationMinutes: 26,
    instructor: 'TED-Ed Master Educator Series',
    description: 'In-depth examination of punctuation rules, clause connectors, grammatical concord, and ambiguity resolution essential for JAMB Use of English and WAEC objective tests.',
    keyConcepts: ['Syntax Rules & Clause Connectors', 'Oxford Comma & Punctuation Precision', 'Syntactic Ambiguity Resolution', 'Grammatical Concord Foundations'],
    embedUrl: 'https://www.youtube.com/embed/ptM7FzyjtRk',
    isFreePreview: true,
  },
  {
    id: 'v-phy-1',
    videoId: 'ZM8ECpBuQYE',
    subject: 'Physics',
    exam: 'WAEC / NECO',
    topic: 'Kinematics & Mechanics',
    title: 'Motion in a Straight Line: Velocity, Acceleration & Graphs',
    durationMinutes: 35,
    instructor: 'Dr. Shini Somara (CrashCourse)',
    description: 'Comprehensive analysis of one-dimensional motion: velocity, acceleration, scalar vs vector quantities, equations of uniformly accelerated motion, and graphical interpretation for WAEC/JAMB physics.',
    keyConcepts: ['Displacement vs Distance', 'Velocity vs Speed Vectors', 'Uniform Acceleration Equations', 'v-t and s-t Graph Analysis'],
    embedUrl: 'https://www.youtube.com/embed/ZM8ECpBuQYE',
    isFreePreview: false,
  },
  {
    id: 'v-chem-1',
    videoId: '0RRVV4Diomg',
    subject: 'Chemistry',
    exam: 'JAMB / UTME',
    topic: 'Atomic Structure & Periodicity',
    title: 'The Periodic Table & Chemical Periodicity',
    durationMinutes: 38,
    instructor: 'Hank Green (CrashCourse Chemistry)',
    description: 'Systematic breakdown of the periodic table: atomic number, electron configuration, periodicity trends across groups and periods (atomic radius, ionization energy, electronegativity) for JAMB and SSCE chemistry.',
    keyConcepts: ['Electronic Configuration Principles', 'Periodic Trends across Groups & Periods', 'Ionization Energy & Electronegativity', 'Metals, Metalloids & Non-Metals'],
    embedUrl: 'https://www.youtube.com/embed/0RRVV4Diomg',
    isFreePreview: false,
  },
  {
    id: 'v-bio-1',
    videoId: 'eEUvRrhmcxM',
    subject: 'Biology',
    exam: 'WAEC / SSCE',
    topic: 'Genetics & Heredity',
    title: 'Introduction to Heredity: Dominant & Recessive Traits',
    durationMinutes: 30,
    instructor: 'Sal Khan (Khan Academy)',
    description: "Detailed walkthrough of Mendelian genetics: homozygous and heterozygous alleles, dominant and recessive phenotypes, Punnett squares, and inheritance ratios frequently tested in WAEC Biology.",
    keyConcepts: ['Alleles & Genotypic Notation', 'Dominant vs Recessive Phenotypes', 'Monohybrid Punnett Squares', "Mendel's Law of Segregation"],
    embedUrl: 'https://www.youtube.com/embed/eEUvRrhmcxM',
    isFreePreview: true,
  },
  {
    id: 'v-econ-1',
    videoId: '3ez10ADR_gM',
    subject: 'Economics',
    exam: 'WAEC / JAMB',
    topic: 'Fundamental Principles of Economics',
    title: 'Intro to Economics: Scarcity, Opportunity Cost & Markets',
    durationMinutes: 34,
    instructor: 'CrashCourse Economics Series',
    description: 'The core foundation of economic science: scarcity, opportunity cost, production possibility frontiers (PPF), macro vs microeconomics, and price mechanisms for WAEC Paper 1 & 2.',
    keyConcepts: ['Scarcity & Opportunity Cost', 'Production Possibility Frontier (PPF)', 'Micro vs Macroeconomic Decisions', 'Market Equilibria & Price Mechanisms'],
    embedUrl: 'https://www.youtube.com/embed/3ez10ADR_gM',
    isFreePreview: true,
  },
  {
    id: 'v-govt-1',
    videoId: 'lrk4oY7UxpQ',
    subject: 'Government',
    exam: 'WAEC / JAMB',
    topic: 'Forms of Government & Constitutions',
    title: 'Constitutional Structures & Systems of Government',
    durationMinutes: 36,
    instructor: 'Craig Benzine (CrashCourse Government)',
    description: 'Structural comparison of political arrangements: presidential vs parliamentary systems, constitutional frameworks, separation of powers, and checks and balances for JAMB Government.',
    keyConcepts: ['Separation of Powers & Checks', 'Federal vs Unitary Systems', 'Constitutional Provisions & Rights', 'Rule of Law Principles'],
    embedUrl: 'https://www.youtube.com/embed/lrk4oY7UxpQ',
    isFreePreview: true,
  },
  {
    id: 'v-lit-1',
    videoId: 'MSYw502dJNY',
    subject: 'Literature in English',
    exam: 'JAMB / WAEC',
    topic: 'Literary Appreciation & Critical Analysis',
    title: 'How and Why We Read: Literary Appreciation & Analysis',
    durationMinutes: 33,
    instructor: 'John Green (CrashCourse Literature)',
    description: 'Analytical frameworks for literary criticism: dissecting theme, metaphor, narrative perspective, character arcs, and literary devices prescribed in African and Non-African literature.',
    keyConcepts: ['Theme & Figurative Imagery', 'Narrative Perspective & Voice', 'Metaphor vs Allegory', 'Critical Literary Interpretation'],
    embedUrl: 'https://www.youtube.com/embed/MSYw502dJNY',
    isFreePreview: false,
  },
];

export const VideoLessonsView: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [activeLesson, setActiveLesson] = useState<VideoLesson | null>(null);

  const { data: remoteVideos } = useQuery<any[]>({
    queryKey: ['videos'],
    queryFn: () => apiClient<any[]>('/api/videos'),
    staleTime: 60000,
  });

  const availableLessons: VideoLesson[] = remoteVideos && remoteVideos.length > 0
    ? remoteVideos.map((v, idx) => ({
        id: v._id || `v-${idx}`,
        videoId: v.videoId,
        subject: v.subjectId?.name || 'General Revision',
        exam: v.examId?.shortCode || 'JAMB / WAEC',
        topic: v.topicName || 'Curriculum Revision',
        title: v.title,
        durationMinutes: parseInt(v.duration, 10) || 20,
        instructor: 'MarkDriller Verified Educator',
        description: `Comprehensive video lecture covering ${v.topicName || v.title} for UTME and WASSCE candidates.`,
        keyConcepts: ['Syllabus Objectives', 'Past Question Analysis', 'Step-by-Step Problem Solving'],
        embedUrl: `https://www.youtube.com/embed/${v.videoId}`,
        isFreePreview: !v.isPremium,
      }))
    : SYLLABUS_VIDEO_LESSONS;

  const subjects = ['ALL', 'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature in English'];

  const filteredLessons = availableLessons.filter(
    (l) => selectedSubject === 'ALL' || l.subject === selectedSubject
  );

  return (
    <div className="portal-layout premium-portal-page premium-learning-page" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div className="wrap" style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <span className="eyebrow" style={{ margin: 0 }}>Curriculum Syllabus Masterclasses</span>
          <h1 style={{ fontSize: '28px', color: 'var(--ink)', margin: '6px 0' }}>
            Curriculum Video Walkthroughs
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '750px', margin: 0 }}>
            Structured pedagogical lessons taught by seasoned Nigerian secondary and tertiary educators, aligned directly to WAEC, NECO and JAMB UTME syllabuses.
          </p>
        </div>

        {/* Subject Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '24px',
            background: 'var(--white)',
            padding: '12px 16px',
            borderRadius: '6px',
            border: '1px solid var(--paper-line)',
          }}
        >
          {subjects.map((subj) => (
            <button
              key={subj}
              type="button"
              onClick={() => setSelectedSubject(subj)}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '12.5px',
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                border: selectedSubject === subj ? '1px solid var(--rust)' : '1px solid var(--paper-line)',
                background: selectedSubject === subj ? 'var(--rust)' : 'var(--paper)',
                color: selectedSubject === subj ? '#ffffff' : 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              {subj}
            </button>
          ))}
        </div>

        {/* Lessons Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--paper-line)',
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              {/* Top Banner / Mock Thumbnail */}
              <div
                style={{
                  height: '140px',
                  background: 'linear-gradient(135deg, #14181c 0%, #294a60 100%)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {lesson.exam} • {lesson.subject}
                  </span>
                  <span
                    style={{
                      background: lesson.isFreePreview ? '#225a38' : 'var(--rust)',
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {lesson.isFreePreview ? 'Free Preview' : 'Subscriber Access'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--rust)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setActiveLesson(lesson)}
                  >
                    ▶
                  </div>
                  <span style={{ fontSize: '13px', fontFamily: "var(--font-sans)" }}>
                    {lesson.durationMinutes} mins
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span className="eyebrow" style={{ fontSize: '10.5px' }}>{lesson.topic}</span>
                  <h3 style={{ fontSize: '17px', margin: '4px 0 8px 0', color: 'var(--ink)' }}>
                    {lesson.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--rust)', fontFamily: "var(--font-sans)", marginBottom: '10px' }}>
                    Instructor: {lesson.instructor}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '14px' }}>
                    {lesson.description}
                  </p>

                  <div style={{ marginBottom: '14px' }}>
                    <span className="eyebrow" style={{ fontSize: '10px' }}>Key Curriculum Takeaways</span>
                    <ul style={{ paddingLeft: '18px', margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ink)' }}>
                      {lesson.keyConcepts.map((c, idx) => (
                        <li key={idx} style={{ marginBottom: '3px' }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--paper-line)' }}>
                  <button
                    type="button"
                    className="btn-custom btn-custom-primary"
                    onClick={() => setActiveLesson(lesson)}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px', textAlign: 'center' }}
                  >
                    Watch Lesson ({lesson.durationMinutes}m) →
                  </button>
                  <button
                    type="button"
                    className="btn-custom btn-custom-ghost"
                    onClick={() => navigate('/portal/questions')}
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                    title="Practice matching questions"
                  >
                    Drill Qs
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Player Modal */}
        {activeLesson && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(20, 24, 28, 0.75)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              style={{
                background: 'var(--white)',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '780px',
                padding: '28px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <span className="eyebrow" style={{ fontSize: '11px' }}>{activeLesson.subject} • {activeLesson.topic}</span>
                  <h3 style={{ fontSize: '20px', margin: '4px 0 0 0', color: 'var(--ink)' }}>
                    {activeLesson.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLesson(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '22px',
                    cursor: 'pointer',
                    color: 'var(--ink-soft)',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Responsive 16:9 Video Player */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 9',
                  background: '#0a0d10',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  marginBottom: '14px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                }}
              >
                {activeLesson.embedUrl ? (
                  <iframe
                    src={`${activeLesson.embedUrl}?playsinline=1&rel=0&modestbranding=1`}
                    title={`${activeLesson.subject}: ${activeLesson.title}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                    <p>Loading masterclass stream...</p>
                  </div>
                )}
              </div>

              {/* Stream Diagnostics & Direct Player Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                  HD Academic Masterclass Stream (Verified Curriculum)
                </span>
                <a
                  href={`https://www.youtube.com/watch?v=${activeLesson.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    fontFamily: "var(--font-sans)",
                    fontWeight: 600,
                    color: 'var(--rust)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Open video in external player tab if school firewall restricts iframes"
                >
                  <span>Open Stream in Dedicated Tab ↗</span>
                </a>
              </div>

              {/* Lesson Overview & Key Concepts Bar */}
              <div
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: '6px',
                  padding: '14px 16px',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--slate)' }}>
                    Instructor: <strong>{activeLesson.instructor}</strong>
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: "var(--font-sans)",
                      background: activeLesson.isFreePreview ? 'var(--forest)' : 'var(--rust)',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '2px',
                    }}
                  >
                    {activeLesson.isFreePreview ? 'FREE PREVIEW' : 'PRO SUBSCRIBER'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--ink)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                  {activeLesson.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {activeLesson.keyConcepts.map((concept, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        fontFamily: "var(--font-sans)",
                        background: 'var(--white)',
                        border: '1px solid rgba(20,24,28,0.12)',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        color: 'var(--ink-soft)',
                      }}
                    >
                      ✓ {concept}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--ink-soft)', fontFamily: "var(--font-sans)" }}>
                  Duration: {activeLesson.durationMinutes} Minutes • Syllabus Aligned
                </span>
                <button
                  type="button"
                  className="btn-custom btn-custom-primary"
                  onClick={() => {
                    const topicQuery = encodeURIComponent(activeLesson.topic);
                    setActiveLesson(null);
                    navigate(`/portal/questions?search=${topicQuery}`);
                  }}
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  Practice Topic Questions Now →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

