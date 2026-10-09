import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubjectTopicsQuery, SubjectItem } from '../api/exams.js';

export interface SyllabusSubjectCardProps {
  subject: SubjectItem;
  examId?: string;
  showDrillLink?: boolean;
  isAdmin?: boolean;
  onDeleteSubject?: (subjectId: string, name: string) => void;
  onDeleteTopic?: (topicId: string, name: string) => void;
  onDrillTopic?: (subjectId: string, topicId: string) => void;
}

/**
 * SyllabusSubjectCard — Independent, Accessible Accordion Card
 * 
 * Guarantees:
 * 1. Independent Expansion: State is owned locally by each card instance.
 *    Expanding/collapsing this card NEVER affects sibling cards.
 * 2. Layout Isolation: Uses alignSelf: 'start' so that expanding this card
 *    does NOT stretch or visually drag down sibling cards in the same grid row.
 * 3. WAI-ARIA Accessibility: Uses aria-expanded, aria-controls, role="region",
 *    and aria-labelledby with unique element IDs.
 * 4. Lazy Ingestion: Topics are queried on demand when expanded.
 */
export const SyllabusSubjectCard: React.FC<SyllabusSubjectCardProps> = ({
  subject,
  examId,
  showDrillLink = true,
  isAdmin = false,
  onDeleteSubject,
  onDeleteTopic,
  onDrillTopic,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const effectiveExamId = examId || subject.examId;
  const contentId = `syllabus-panel-${subject._id}`;
  const buttonId = `syllabus-toggle-${subject._id}`;

  const { data: topics, isLoading: topicsLoading } = useSubjectTopicsQuery(
    isExpanded ? subject._id : undefined
  );

  return (
    <div
      className="mk-card mk-card-hover"
      style={{
        backgroundColor: 'var(--white)',
        border: isExpanded ? '1.5px solid var(--rust)' : '1px solid var(--paper-line)',
        borderRadius: '12px',
        padding: '20px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
        boxShadow: isExpanded ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
        alignSelf: 'start', // CRITICAL: Ensures card height matches only its own content
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* Header: Subject Code, Title & Topic Count Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              backgroundColor: 'var(--rust-soft)',
              color: 'var(--rust)',
              padding: '3px 8px',
              borderRadius: '6px',
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            {subject.code}
          </span>
          <h4
            style={{
              fontSize: '17px',
              fontWeight: 700,
              margin: 0,
              color: 'var(--ink)',
              wordBreak: 'break-word',
              lineHeight: 1.3,
            }}
          >
            {subject.name}
          </h4>
        </div>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: '11px',
            color: 'var(--forest)',
            backgroundColor: 'var(--forest-soft)',
            padding: '4px 10px',
            borderRadius: '999px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {subject.topicCount ?? (topics ? topics.length : 0)} Topics
        </span>
      </div>

      {/* Action Strip: Independent Toggle & Navigation Controls */}
      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <button
          id={buttonId}
          type="button"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={() => setIsExpanded((prev) => !prev)}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px 0',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            color: isExpanded ? 'var(--rust)' : 'var(--steel)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'color 0.15s ease',
          }}
        >
          {isExpanded ? 'Hide Syllabus Topics ▲' : 'View Syllabus Topics ▼'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showDrillLink && effectiveExamId && (
            <Link
              to={`/portal/questions?exam=${effectiveExamId}&subject=${subject._id}`}
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
            >
              Practice Drills →
            </Link>
          )}

          {isAdmin && onDeleteSubject && (
            <button
              type="button"
              onClick={() => onDeleteSubject(subject._id, subject.name)}
              style={{
                padding: '4px 9px',
                background: 'var(--rust-soft)',
                border: '1px solid var(--rust)',
                color: 'var(--rust)',
                fontSize: '11px',
                cursor: 'pointer',
                borderRadius: '4px',
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
              }}
            >
              Delete Subject
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Syllabus Topics Panel */}
      {isExpanded && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={buttonId}
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--paper-line)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontFamily: "var(--font-sans)",
              color: 'var(--ink-soft)',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700,
            }}
          >
            Official Exam Topics:
          </div>

          {topicsLoading ? (
            <div style={{ fontSize: '13px', color: 'var(--ink-soft)', fontStyle: 'italic', padding: '6px 0' }}>
              Loading syllabus topics...
            </div>
          ) : topics && topics.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topics.map((topic, idx) => (
                <div
                  key={topic._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--paper-line)',
                    borderRadius: '8px',
                    gap: '8px',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <span style={{ color: 'var(--ink)', wordBreak: 'break-word', flex: 1 }}>
                    <span
                      style={{
                        color: 'var(--ink-soft)',
                        fontFamily: "var(--font-sans)",
                        marginRight: '8px',
                        fontWeight: 600,
                      }}
                    >
                      {idx + 1}.
                    </span>
                    {topic.name}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {onDrillTopic && (
                      <button
                        type="button"
                        onClick={() => onDrillTopic(subject._id, topic._id)}
                        style={{
                          fontSize: '11px',
                          fontFamily: "var(--font-sans)",
                          backgroundColor: 'var(--rust)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          transition: 'opacity 0.15s ease',
                        }}
                        title="Start CBT practice drill on this topic"
                      >
                        Drill CBT ⚡
                      </button>
                    )}

                    {showDrillLink && effectiveExamId && (
                      <Link
                        to={`/portal/questions?exam=${effectiveExamId}&subject=${subject._id}&topic=${topic._id}`}
                        style={{
                          fontSize: '11px',
                          fontFamily: "var(--font-sans)",
                          color: 'var(--ink-soft)',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          padding: '3px 6px',
                        }}
                      >
                        Browse →
                      </Link>
                    )}

                    {isAdmin && onDeleteTopic && (
                      <button
                        type="button"
                        onClick={() => onDeleteTopic(topic._id, topic.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--rust)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                        title="Delete topic"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--ink-soft)', fontStyle: 'italic', padding: '6px 0' }}>
              No specific syllabus topics logged yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

