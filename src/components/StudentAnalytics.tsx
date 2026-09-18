import React from 'react';
import { Link } from 'react-router-dom';
import { useAnalyticsOverviewQuery, useResultsHistoryQuery } from '../api/results.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { PortalHeader } from './PortalHeader.js';
import { BrandLoader } from './BrandLoader.js';

export const StudentAnalytics: React.FC = () => {
  const { user } = useAuthStore();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverviewQuery();
  const { data: historyData, isLoading: historyLoading } = useResultsHistoryQuery(1, 10);

  if (analyticsLoading) {
    return <BrandLoader message="Analyzing performance history and compiling readiness scores..." mode="fullscreen" />;
  }

  const readiness = analytics?.readinessScore ?? 0;
  const isHighReadiness = readiness >= 75;
  const isModerateReadiness = readiness >= 50;

  const totalMinutes = Math.round((analytics?.totalTimeSpentSeconds ?? 0) / 60);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Responsive Unified Header */}
      <PortalHeader badge="ANALYTICS" badgeColor="rust" activePath="/analytics" />

      {/* Main Workspace */}
      <main className="wrap" style={{ flex: 1, padding: 'clamp(20px, 4vw, 36px) clamp(16px, 3vw, 32px)', boxSizing: 'border-box', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Executive Readiness Banner */}
        <div
          style={{
            backgroundColor: 'var(--ink)',
            color: 'var(--white)',
            padding: '36px',
            borderRadius: '4px',
            marginBottom: '32px',
            border: '1.5px solid var(--ink)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '28px',
          }}
        >
          <div>
            <span className="eyebrow" style={{ color: 'var(--amber)', marginBottom: '8px', display: 'block' }}>
              Readiness Assessment Engine
            </span>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', color: 'var(--white)', margin: '0 0 10px' }}>
              {user?.fullName}’s Exam Readiness
            </h1>
            <p style={{ color: 'rgba(248,247,242,0.75)', fontSize: '15px', maxWidth: '58ch', margin: 0 }}>
              Calculated using server-authoritative mock examination results, pacing data, and syllabus topic coverage benchmarks across accredited past papers.
            </p>
          </div>

          {/* Readiness Gauge Meter */}
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: isHighReadiness ? '2px solid #22c55e' : isModerateReadiness ? '2px solid var(--amber)' : '2px solid #ef4444',
              borderRadius: '4px',
              padding: '24px 36px',
              textAlign: 'center',
              minWidth: '220px',
            }}
          >
            <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--amber)', textTransform: 'uppercase', marginBottom: '4px' }}>
              BENCHMARK SCORE
            </div>
            <div style={{ fontSize: '48px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'var(--white)', lineHeight: 1 }}>
              {readiness}%
            </div>
            <div
              style={{
                fontSize: '11.5px',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                color: isHighReadiness ? '#4ade80' : isModerateReadiness ? 'var(--amber)' : '#f87171',
                marginTop: '8px',
              }}
            >
              {isHighReadiness ? '★ HIGH PREPAREDNESS' : isModerateReadiness ? '✓ ON TRACK' : 'EARLY STAGE'}
            </div>
          </div>
        </div>

        {/* Global Metric Strips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}>
          <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '3px', border: '1.5px solid rgba(20,24,28,0.14)' }}>
            <span className="eyebrow" style={{ color: 'var(--steel)' }}>Mocks Completed</span>
            <div style={{ fontSize: '26px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {analytics?.totalMocksTaken ?? 0} Tests
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              Server-timed simulations
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '3px', border: '1.5px solid rgba(20,24,28,0.14)' }}>
            <span className="eyebrow" style={{ color: '#217844' }}>Overall Accuracy</span>
            <div style={{ fontSize: '26px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {analytics?.overallAccuracy ?? 0}%
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              {analytics?.totalCorrectAnswers ?? 0} of {analytics?.totalQuestionsAnswered ?? 0} correct
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '3px', border: '1.5px solid rgba(20,24,28,0.14)' }}>
            <span className="eyebrow" style={{ color: 'var(--rust)' }}>Average Score</span>
            <div style={{ fontSize: '26px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {analytics?.averageScore ?? 0}%
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              Across all examination papers
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '3px', border: '1.5px solid rgba(20,24,28,0.14)' }}>
            <span className="eyebrow" style={{ color: 'var(--amber-deep)' }}>Total Time Invested</span>
            <div style={{ fontSize: '26px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {totalMinutes} mins
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              Active drill &amp; test time
            </span>
          </div>
        </div>

        {/* Targeted Revision Suggestions */}
        {analytics?.topicWeaknesses && analytics.topicWeaknesses.length > 0 && (
          <div
            style={{
              backgroundColor: '#fef3e2',
              border: '1.5px solid #fbd38d',
              borderRadius: '4px',
              padding: '24px',
              marginBottom: '40px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>🎯</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontFamily: "'Space Grotesk', sans-serif", color: '#744210' }}>
                Recommended Topics to Drill Next
              </h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#975a16' }}>
              Our analytics detected lower accuracy in these specific syllabus topics. Drill these concepts to quickly raise your exam score:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {analytics.topicWeaknesses.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--white)',
                    padding: '14px 16px',
                    borderRadius: '3px',
                    border: '1px solid rgba(20,24,28,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {t.topicName}
                    </div>
                    <div style={{ fontSize: '11.5px', fontFamily: "'JetBrains Mono', monospace", color: '#c53030' }}>
                      {t.accuracyPercentage}% accuracy ({t.correctAnswers}/{t.totalQuestions})
                    </div>
                  </div>

                  <Link
                    to={`/questions?search=${encodeURIComponent(t.topicName.split(' ')[0])}`}
                    style={{
                      fontSize: '12px',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      color: 'var(--rust)',
                      textDecoration: 'none',
                    }}
                  >
                    Drill →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject Proficiency Meters */}
        <div style={{ marginBottom: '40px' }}>
          <div className="section-head" style={{ marginBottom: '20px' }}>
            <span className="eyebrow">Subject Performance</span>
            <h2>Curriculum Mastery by Subject</h2>
          </div>

          {analytics?.subjectPerformance && analytics.subjectPerformance.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {analytics.subjectPerformance.map((sub) => (
                <div
                  key={sub.subjectId}
                  style={{
                    backgroundColor: 'var(--white)',
                    padding: '20px',
                    borderRadius: '3px',
                    border: '1.5px solid rgba(20,24,28,0.14)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                          backgroundColor: 'var(--paper-dim)',
                          padding: '2px 6px',
                          borderRadius: '2px',
                          color: 'var(--ink-soft)',
                        }}
                      >
                        {sub.subjectCode}
                      </span>
                      <h4 style={{ margin: '4px 0 0', fontSize: '17px', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {sub.subjectName}
                      </h4>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '20px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                        {sub.averageScore}%
                      </span>
                      <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
                        Average
                      </div>
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--paper)', borderRadius: '4px', overflow: 'hidden', margin: '14px 0 10px' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${sub.averageScore}%`,
                        backgroundColor: sub.averageScore >= 70 ? '#22c55e' : sub.averageScore >= 50 ? 'var(--amber)' : '#ef4444',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
                    <span>{sub.attemptCount} Mocks Completed</span>
                    <span>Best: {sub.highestScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--ink-soft)', fontSize: '14px' }}>
              No subject tests taken yet. Start a timed mock test to view proficiency ratings.
            </p>
          )}
        </div>

        {/* Historical Examination Attempts Table */}
        <div style={{ marginBottom: '40px' }}>
          <div className="section-head" style={{ marginBottom: '20px' }}>
            <span className="eyebrow">Attempt History</span>
            <h2>Past Examination Records</h2>
          </div>

          {historyLoading ? (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)', fontSize: '14px' }}>
              Loading attempt logs...
            </div>
          ) : historyData && historyData.results.length > 0 ? (
            <div style={{ backgroundColor: 'var(--white)', borderRadius: '4px', border: '1.5px solid rgba(20,24,28,0.14)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--paper)', borderBottom: '1px solid rgba(20,24,28,0.12)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--ink-soft)' }}>
                      <th style={{ padding: '14px 18px' }}>DATE</th>
                      <th style={{ padding: '14px 18px' }}>EXAM &amp; SUBJECT</th>
                      <th style={{ padding: '14px 18px' }}>SCORE</th>
                      <th style={{ padding: '14px 18px' }}>ACCURACY</th>
                      <th style={{ padding: '14px 18px' }}>TIME SPENT</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.results.map((item) => (
                      <tr key={item._id} style={{ borderBottom: '1px solid rgba(20,24,28,0.06)' }}>
                        <td style={{ padding: '14px 18px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                          {item.examId?.shortCode} — {item.subjectId?.name}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 700,
                              fontSize: '12px',
                              padding: '3px 8px',
                              borderRadius: '2px',
                              backgroundColor: item.percentage >= 70 ? '#e4f5ea' : item.percentage >= 50 ? '#fef3e2' : '#fde8e8',
                              color: item.percentage >= 70 ? '#217844' : item.percentage >= 50 ? '#a16207' : '#b91c1c',
                            }}
                          >
                            {item.score} / {item.maxScore} ({item.percentage}%)
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--ink-soft)', fontSize: '13px' }}>
                          {item.correctCount} correct, {item.incorrectCount} incorrect
                        </td>
                        <td style={{ padding: '14px 18px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'var(--ink-soft)' }}>
                          {Math.floor(item.timeSpentSeconds / 60)}m {item.timeSpentSeconds % 60}s
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <Link
                            to={`/cbt/${item.attemptId?._id || item._id}/result`}
                            style={{
                              fontSize: '13px',
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontWeight: 600,
                              color: 'var(--rust)',
                              textDecoration: 'none',
                            }}
                          >
                            Review Solutions →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--white)', padding: '32px', borderRadius: '4px', border: '1px solid rgba(20,24,28,0.12)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 12px', color: 'var(--ink-soft)' }}>No previous exam records found.</p>
              <Link to="/dashboard" className="btn-custom btn-custom-primary">
                Launch Your First CBT Mock
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer" style={{ padding: '24px 0' }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(248,247,242,0.5)' }}>
          <span>© 2026 MARK DRILLER PLATFORM · AGGREGATED STUDENT ANALYTICS</span>
          <span>STUDENT: {user?.email.toUpperCase()}</span>
        </div>
      </footer>
    </div>
  );
};
