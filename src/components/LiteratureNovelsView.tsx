import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';

interface NovelChapter {
  chapterNumber: number;
  title: string;
  summary: string;
  keyEvents: string[];
}

interface LikelyQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const LiteratureNovelsView: React.FC = () => {
  const { openAuthModal } = useAppStore();
  const [selectedNovel, setSelectedNovel] = useState<'LIFE_CHANGER' | 'SWEET_SIXTEEN'>('LIFE_CHANGER');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  const toggleAnswer = (id: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const lifeChangerChapters: NovelChapter[] = [
    {
      chapterNumber: 1,
      title: 'Family Breakfast & Introduction to University Life',
      summary:
        'The story opens in Ummi’s household as she prepares breakfast with her children: Omar, Teemah, Jamila, and Bintu. Omar proudly announces that he has been offered admission to study Law at Kongi State University. Ummi uses this momentous milestone to prepare Omar by sharing honest narratives about campus freedom, personal responsibility, and the inevitable traps of tertiary education.',
      keyEvents: [
        'Omar shares his admission letter into the Faculty of Law.',
        'Bintu recounts her classroom experience with her social studies teacher.',
        'Ummi introduces the concept that university life is a "life changer".',
      ],
    },
    {
      chapterNumber: 2,
      title: 'Ummi’s Matriculation & The Encounter with Dr. Dabo',
      summary:
        'Ummi reflects on her own university admission twenty years earlier. Freshly matriculated and wearing modest attire, she experiences her first encounter with Dr. Samuel Dabo, a notoriously disciplined and strict lecturer. Dr. Dabo makes an uncharacteristic advances attempt, which Ummi politely refuses, causing Dr. Dabo deep remorse and self-reflection.',
      keyEvents: [
        'Registration hurdles and queues at the university campus.',
        'Encounter with Dr. Samuel Dabo in his office.',
        'Dr. Dabo repents and asks for forgiveness due to his moral standards.',
      ],
    },
    {
      chapterNumber: 3,
      title: 'The Legend of the Quiet Boy (Talle)',
      summary:
        'Ummi narrates the tragic tale of Talle in her native village of Lafayette. Talle, an introverted and pious young man known as "the quiet one", unexpectedly becomes an accomplice in a kidnapping syndicate when he unknowingly agrees to feed an abducted child in exchange for cash, demonstrating that appearances can be deceptive.',
      keyEvents: [
        'Talle’s background and reserved demeanor in Lafayette.',
        'Sudden surge in grocery shopping raising suspicion.',
        'Police raid on Talle’s house and his arrest alongside criminal kingpins.',
      ],
    },
    {
      chapterNumber: 4,
      title: 'Salma’s Arrival & Campus Registration',
      summary:
        'The narrative shifts to Salma, an arrogant, sophisticated, and overly confident undergraduate from a wealthy background. Salma looks down on fellow students during university registration and uses her charms and deceit to bypass registration lines, only to discover that the young man she flirted with was actually the screening officer himself.',
      keyEvents: [
        'Salma encounters long queues at the Faculty of Arts.',
        'Salma cuts corners and mocks the university administrative systems.',
        'The screening officer reveals his true identity, deflating Salma’s pride.',
      ],
    },
    {
      chapterNumber: 5,
      title: 'Room 47, Queen Amina Hall & The Three Roommates',
      summary:
        'Salma is allocated to Room 47 in Queen Amina Hall, sharing space with Tomiwa (an intelligent, jovial girl from Ibadan), Ngozi (a quiet, focused Igbo girl), and Ada (a hardworking candidate from Benue). Despite diverse cultural and religious backgrounds, the four girls forge an unbreakable sisterhood, contrasting sharply with Salma’s extravagant lifestyle.',
      keyEvents: [
        'Introduction of Room 47 roommates: Salma, Tomiwa, Ngozi, and Ada.',
        'Cultural diversity, mutual tolerance, and communal sharing among the girls.',
        'Salma’s lavish parties, late-night outings, and growing academic negligence.',
      ],
    },
  ];

  const likelyQuestions: LikelyQuestion[] = [
    {
      id: 'q1',
      question: 'In "The Life Changer", what course was Omar offered admission to study at the university?',
      options: ['Medicine & Surgery', 'Faculty of Law', 'Accounting', 'Political Science'],
      correctAnswer: 1,
      explanation: 'Omar proudly announced to his mother (Ummi) and sisters that he had received admission to study Law.',
    },
    {
      id: 'q2',
      question: 'Why was Talle nicknamed "the quiet one" by the Lafayette community?',
      options: [
        'He was mute from birth',
        'He rarely spoke and led an intensely introverted, pious life',
        'He was a village monk',
        'He was afraid of local authorities',
      ],
      correctAnswer: 1,
      explanation: 'Talle earned the nickname because of his silent demeanor, solitary habits, and refusal to participate in idle gossip.',
    },
    {
      id: 'q3',
      question: 'Which room in Queen Amina Hall did Salma share with Tomiwa, Ngozi, and Ada?',
      options: ['Room 12', 'Room 33', 'Room 47', 'Room 101'],
      correctAnswer: 2,
      explanation: 'The four diverse roommates were officially paired in Room 47 of Queen Amina Hall.',
    },
    {
      id: 'q4',
      question: 'Who was the strict lecturer who felt deep remorse after making inappropriate advances towards Ummi?',
      options: ['Dr. Samuel Dabo', 'Professor Kabir', 'Mr. Kolawole', 'Dr. Mohammed'],
      correctAnswer: 0,
      explanation: 'Dr. Samuel Dabo, despite having an upright and strict reputation, briefly slipped but was immediately checked by Ummi’s modesty and repented.',
    },
  ];

  const currentChapterData = lifeChangerChapters.find((c) => c.chapterNumber === selectedChapter) || lifeChangerChapters[0];

  return (
    <div className="premium-portal-page premium-learning-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <main className="wrap" style={{ flex: 1, padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ maxWidth: '800px', marginBottom: '36px' }}>
          <span className="eyebrow" style={{ color: 'var(--rust)' }}>
            Official JAMB Literature in English Companion
          </span>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', margin: '8px 0 14px 0' }}>
            JAMB Prescribed Novels Mastery Hub
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '17px', lineHeight: 1.6 }}>
            Every year, JAMB tests all UTME candidates on official compulsory English novels. Master plot summaries, chapter-by-chapter events, character profiles, and real examination questions below.
          </p>
        </div>

        {/* Novel Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedNovel('LIFE_CHANGER')}
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              border: '1.5px solid',
              borderColor: selectedNovel === 'LIFE_CHANGER' ? 'var(--rust)' : 'var(--paper-line)',
              backgroundColor: selectedNovel === 'LIFE_CHANGER' ? 'var(--rust)' : 'var(--white)',
              color: selectedNovel === 'LIFE_CHANGER' ? '#ffffff' : 'var(--ink)',
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            📖 The Life Changer (Khadija A. Jalli) — Primary Novel
          </button>
          <button
            type="button"
            onClick={() => setSelectedNovel('SWEET_SIXTEEN')}
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              border: '1.5px solid',
              borderColor: selectedNovel === 'SWEET_SIXTEEN' ? 'var(--rust)' : 'var(--paper-line)',
              backgroundColor: selectedNovel === 'SWEET_SIXTEEN' ? 'var(--rust)' : 'var(--white)',
              color: selectedNovel === 'SWEET_SIXTEEN' ? '#ffffff' : 'var(--ink)',
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            📚 Sweet Sixteen (Bolaji Abdullahi) — Supplementary
          </button>
        </div>

        {/* Content Layout Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 300px) 1fr',
            gap: '32px',
            alignItems: 'start',
            marginBottom: '48px',
          }}
        >
          {/* Left Sidebar: Chapter List */}
          <div
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <h3 style={{ fontSize: '16px', margin: '0 0 14px 0', color: 'var(--ink)' }}>
              Chapter Navigator
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lifeChangerChapters.map((ch) => (
                <button
                  key={ch.chapterNumber}
                  type="button"
                  onClick={() => setSelectedChapter(ch.chapterNumber)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '4px',
                    textAlign: 'left',
                    border: '1px solid',
                    borderColor: selectedChapter === ch.chapterNumber ? 'var(--amber)' : 'transparent',
                    backgroundColor: selectedChapter === ch.chapterNumber ? 'rgba(226, 154, 60, 0.12)' : 'transparent',
                    color: selectedChapter === ch.chapterNumber ? 'var(--ink)' : 'var(--ink-soft)',
                    fontFamily: "var(--font-sans)",
                    fontWeight: selectedChapter === ch.chapterNumber ? 700 : 500,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Chapter {ch.chapterNumber}: {ch.title.split('&')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Active Chapter Detailed Analysis */}
          <div
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '32px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11.5px',
                color: 'var(--rust)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Chapter {currentChapterData.chapterNumber} Analysis
            </span>
            <h2 style={{ fontSize: '24px', margin: '6px 0 16px 0', color: 'var(--ink)' }}>
              {currentChapterData.title}
            </h2>

            <div style={{ fontSize: '15.5px', lineHeight: 1.7, color: 'var(--ink-soft)', marginBottom: '24px' }}>
              {currentChapterData.summary}
            </div>

            <h4
              style={{
                fontSize: '13px',
                fontFamily: "var(--font-sans)",
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--ink)',
                marginBottom: '12px',
              }}
            >
              Key Examination Plot Points
            </h4>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '14.5px', color: 'var(--ink)', lineHeight: 1.7 }}>
              {currentChapterData.keyEvents.map((ev, i) => (
                <li key={i}>{ev}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Likely CBT Questions Section */}
        <div style={{ marginTop: '32px', marginBottom: '56px' }}>
          <div style={{ marginBottom: '24px' }}>
            <span className="eyebrow" style={{ color: 'var(--rust)' }}>
              Examination Drill Room
            </span>
            <h2 style={{ fontSize: '26px', margin: '6px 0' }}>
              High-Frequency JAMB Questions on This Novel
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '15px' }}>
              Test your recall on likely examination questions curated by accredited examiners.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {likelyQuestions.map((q, idx) => (
              <div
                key={q.id}
                style={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: '6px',
                  padding: '24px',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: '13px',
                      backgroundColor: 'var(--paper)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      color: 'var(--ink)',
                    }}
                  >
                    Q{idx + 1}
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.5 }}>
                    {q.question}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '10px',
                    marginBottom: '16px',
                  }}
                >
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '4px',
                        border: '1px solid var(--paper-line)',
                        backgroundColor:
                          revealedAnswers[q.id] && oIdx === q.correctAnswer
                            ? 'rgba(34, 197, 94, 0.12)'
                            : 'var(--paper)',
                        color:
                          revealedAnswers[q.id] && oIdx === q.correctAnswer
                            ? '#15803d'
                            : 'var(--ink)',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontFamily: "var(--font-sans)" }}>
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => toggleAnswer(q.id)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--rust)',
                      borderRadius: '4px',
                      color: 'var(--rust)',
                      padding: '6px 14px',
                      fontSize: '12.5px',
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {revealedAnswers[q.id] ? 'Hide Answer Key' : 'Reveal Answer Key & Explanation'}
                  </button>

                  <button
                    type="button"
                    onClick={() => openAuthModal('signup')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--steel)',
                      fontSize: '13px',
                      fontFamily: "var(--font-sans)",
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Practice in Timed CBT Mode ➔
                  </button>
                </div>

                {revealedAnswers[q.id] && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(34, 197, 94, 0.08)',
                      borderLeft: '3px solid #22c55e',
                      borderRadius: '4px',
                      fontSize: '13.5px',
                      color: 'var(--ink)',
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>Correct Answer: {String.fromCharCode(65 + q.correctAnswer)}</strong> — {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

