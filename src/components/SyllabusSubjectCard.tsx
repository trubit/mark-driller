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
      style={{
        backgroundColor: 'var(--white)',
        border: isExpanded ? '1.5px solid var(--rust)' : '1.5px solid rgba(20,24,28,0.14)',
        borderRadius: '3px',
        padding: '20px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: isExpanded ? '0 4px 12px rgba(20,24,28,0.06)' : 'none',
        alignSelf: 'start', // CRITICAL: Ensures card height matches only its own content
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* Header: Subject Code, Title & Topic Count Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              backgroundColor: 'var(--paper-dim)',
              color: 'var(--ink-soft)',
              padding: '2px 6px',
              borderRadius: '2px',
              display: 'inline-block',
              marginBottom: '6px',
            }}
          >
            {subject.code}
          </span>
          <h4
            style={{
              fontSize: '17px',
              margin: 0,
              color: 'var(--ink)',
              wordBreak: 'break-word',
            }}
          >
            {subject.name}
          </h4>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: 'var(--rust)',
            backgroundColor: '#faede7',
            padding: '3px 8px',
            borderRadius: '12px',
            fontWeight: 600,
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
            padding: 0,
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            color: isExpanded ? 'var(--rust)' : 'var(--steel)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.15s ease',
          }}
        >
          {isExpanded ? 'Hide Syllabus Topics ▲' : 'View Syllabus Topics ▼'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showDrillLink && effectiveExamId && (
            <Link
              to={`/questions?exam=${effectiveExamId}&subject=${subject._id}`}
              style={{
                fontSize: '12px',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                color: 'var(--rust)',
                textDecoration: 'none',
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
                padding: '3px 8px',
                background: '#fdf0ed',
                border: '1px solid var(--rust)',
                color: 'var(--rust)',
                fontSize: '11px',
                cursor: 'pointer',
                borderRadius: '2px',
                fontFamily: "'JetBrains Mono', monospace",
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
            borderTop: '1px solid rgba(20,24,28,0.08)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--ink-soft)',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
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
                    padding: '6px 8px',
                    backgroundColor: 'var(--paper-dim)',
                    borderRadius: '2px',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: 'var(--ink)', wordBreak: 'break-word', flex: 1 }}>
                    <span
                      style={{
                        color: 'var(--ink-soft)',
                        fontFamily: "'JetBrains Mono', monospace",
                        marginRight: '8px',
                      }}
                    >
                      {idx + 1}.
                    </span>
                    {topic.name}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {showDrillLink && effectiveExamId && (
                      <Link
                        to={`/questions?exam=${effectiveExamId}&subject=${subject._id}&topic=${topic._id}`}
                        style={{
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: 'var(--rust)',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Drill →
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
                          fontSize: '11px',
                          cursor: 'pointer',
                          padding: '2px 4px',
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
