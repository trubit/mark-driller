import React from 'react';
import { Link } from 'react-router-dom';
import { useAnalyticsOverviewQuery, useResultsHistoryQuery } from '../api/results.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { BrandLoader } from './BrandLoader.js';
import { handleImageError, FALLBACK_STUDY_HERO } from '../utils/imageFallbacks.js';

const analyticsHeroImage = '/assets/images/study-hero.svg';

const getReadinessLabel = (score: number) => {
  if (score >= 75) return 'High preparedness';
  if (score >= 50) return 'On track';
  return 'Early stage';
};

const getScoreTone = (score: number) => {
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'needs-work';
};

export const StudentAnalytics: React.FC = () => {
  const { user } = useAuthStore();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverviewQuery();
  const { data: historyData, isLoading: historyLoading } = useResultsHistoryQuery(1, 10);

  if (analyticsLoading) {
    return <BrandLoader message="Analyzing performance history and compiling readiness scores..." mode="fullscreen" />;
  }

  const readiness = analytics?.readinessScore ?? 0;
  const totalMinutes = Math.round((analytics?.totalTimeSpentSeconds ?? 0) / 60);
  const readinessLabel = getReadinessLabel(readiness);

  const metrics = [
    {
      label: 'Mocks Completed',
      value: `${analytics?.totalMocksTaken ?? 0} Tests`,
      detail: 'Server-timed simulations',
      tone: 'steel',
    },
    {
      label: 'Overall Accuracy',
      value: `${analytics?.overallAccuracy ?? 0}%`,
      detail: `${analytics?.totalCorrectAnswers ?? 0} of ${analytics?.totalQuestionsAnswered ?? 0} correct`,
      tone: 'forest',
    },
    {
      label: 'Average Score',
      value: `${analytics?.averageScore ?? 0}%`,
      detail: 'Across all examination papers',
      tone: 'rust',
    },
    {
      label: 'Total Time Invested',
      value: `${totalMinutes} mins`,
      detail: 'Active drill and test time',
      tone: 'amber',
    },
  ];

  return (
    <div className="student-workspace-page">
      <main className="portal-workspace">
        <section className="analytics-hero" aria-labelledby="analytics-title">
          <div className="analytics-hero-copy">
            <span className="eyebrow">Readiness Assessment Engine</span>
            <h1 id="analytics-title">{user?.fullName ? `${user.fullName}'s Exam Readiness` : 'Exam Readiness'}</h1>
            <p>
              A consolidated view of your mock results, pacing, accuracy, and subject mastery across accredited past papers.
            </p>
            <div className="student-hero-actions">
              <Link to="/dashboard" className="btn-custom btn-custom-primary">
                Start another mock
              </Link>
              <Link to="/portal/questions" className="btn-custom btn-custom-ghost">
                Drill questions
              </Link>
            </div>
          </div>

          <div className="analytics-score-panel">
            <img src={analyticsHeroImage} alt="Student using a laptop for CBT exam preparation" loading="eager" onError={handleImageError(FALLBACK_STUDY_HERO)} />
            <div className={`analytics-score-card score-${getScoreTone(readiness)}`}>
              <span>Benchmark score</span>
              <strong>{readiness}%</strong>
              <em>{readinessLabel}</em>
            </div>
          </div>
        </section>

        <section className="portal-metric-grid" aria-label="Analytics summary">
          {metrics.map((metric) => (
            <article key={metric.label} className={`portal-metric-card tone-${metric.tone}`}>
              <span className="eyebrow">{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </article>
          ))}
        </section>

        {analytics?.topicWeaknesses && analytics.topicWeaknesses.length > 0 && (
          <section className="analytics-recommendations" aria-labelledby="recommended-topics-title">
            <div className="portal-section-head">
              <span className="eyebrow">Priority revision</span>
              <h2 id="recommended-topics-title">Recommended topics to drill next</h2>
              <p>These topics are currently lowering your readiness score. Start with the weakest areas first.</p>
            </div>
            <div className="analytics-topic-grid">
              {analytics.topicWeaknesses.map((topic) => (
                <article key={`${topic.topicName}-${topic.totalQuestions}`} className="analytics-topic-card">
                  <div>
                    <strong>{topic.topicName}</strong>
                    <span>
                      {topic.accuracyPercentage}% accuracy ({topic.correctAnswers}/{topic.totalQuestions})
                    </span>
                  </div>
                  <Link to={`/portal/questions?search=${encodeURIComponent(topic.topicName.split(' ')[0])}`}>
                    Drill topic
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="portal-section" aria-labelledby="subject-performance-title">
          <div className="portal-section-head">
            <span className="eyebrow">Subject performance</span>
            <h2 id="subject-performance-title">Curriculum mastery by subject</h2>
            <p>Review where your scores are strongest and where more timed practice can lift your average.</p>
          </div>

          {analytics?.subjectPerformance && analytics.subjectPerformance.length > 0 ? (
            <div className="analytics-subject-grid">
              {analytics.subjectPerformance.map((subject) => (
                <article key={subject.subjectId} className="analytics-subject-card">
                  <div className="analytics-subject-head">
                    <div>
                      <span>{subject.subjectCode}</span>
                      <h3>{subject.subjectName}</h3>
                    </div>
                    <strong>{subject.averageScore}%</strong>
                  </div>
                  <div className="analytics-meter" aria-hidden="true">
                    <span className={`meter-${getScoreTone(subject.averageScore)}`} style={{ width: `${Math.min(subject.averageScore, 100)}%` }} />
                  </div>
                  <div className="analytics-subject-meta">
                    <span>{subject.attemptCount} mocks completed</span>
                    <span>Best: {subject.highestScore}%</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="portal-empty-state">No subject tests taken yet. Start a timed mock test to view proficiency ratings.</div>
          )}
        </section>

        {analytics?.recentTrend && analytics.recentTrend.length > 0 && (
          <section className="portal-section" aria-labelledby="trend-title">
            <div className="portal-section-head">
              <span className="eyebrow">Recent trend</span>
              <h2 id="trend-title">Latest performance movement</h2>
            </div>
            <div className="analytics-trend-list">
              {analytics.recentTrend.map((item) => (
                <Link key={`${item.attemptId}-${item.date}`} to={`/cbt/${item.attemptId}/result`} className="analytics-trend-item">
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                  <strong>{item.subjectCode}</strong>
                  <em>{item.percentage}%</em>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="portal-section" aria-labelledby="history-title">
          <div className="portal-section-head">
            <span className="eyebrow">Attempt history</span>
            <h2 id="history-title">Past examination records</h2>
          </div>

          {historyLoading ? (
            <div className="portal-empty-state">Loading attempt logs...</div>
          ) : historyData && historyData.results.length > 0 ? (
            <>
              {/* Mobile Card View (<= 680px) */}
              <div className="cards-mobile-only">
                {historyData.results.map((item) => (
                  <div key={item._id} className="mobile-attempt-card">
                    <div className="mobile-attempt-header">
                      <span className="mobile-attempt-badge">{item.examId?.shortCode || 'CBT Mock'}</span>
                      <span className="mobile-attempt-date">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mobile-attempt-title">
                      {item.subjectId?.name || 'All Core Subjects'}
                    </div>
                    <div className="mobile-attempt-stats">
                      <span className={`analytics-score-badge score-${getScoreTone(item.percentage)}`}>
                        {item.score} / {item.maxScore} ({item.percentage}%)
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                        {item.correctCount}✓ / {item.incorrectCount}✗ • {Math.floor(item.timeSpentSeconds / 60)}m {item.timeSpentSeconds % 60}s
                      </span>
                    </div>
                    <Link to={`/cbt/${item.attemptId?._id || item._id}/result`} className="mobile-attempt-action-btn">
                      Review solutions ➔
                    </Link>
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Full Table (> 680px) */}
              <div className="table-desktop-only table-responsive analytics-history-table">
                <table style={{ minWidth: '620px' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Exam and Subject</th>
                      <th>Score</th>
                      <th>Accuracy</th>
                      <th>Time Spent</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.results.map((item) => (
                      <tr key={item._id}>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td>
                          <strong>{item.examId?.shortCode}</strong> - {item.subjectId?.name}
                        </td>
                        <td>
                          <span className={`analytics-score-badge score-${getScoreTone(item.percentage)}`}>
                            {item.score} / {item.maxScore} ({item.percentage}%)
                          </span>
                        </td>
                        <td>
                          {item.correctCount} correct, {item.incorrectCount} incorrect
                        </td>
                        <td>
                          {Math.floor(item.timeSpentSeconds / 60)}m {item.timeSpentSeconds % 60}s
                        </td>
                        <td>
                          <Link to={`/cbt/${item.attemptId?._id || item._id}/result`}>Review solutions</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="portal-empty-state">
              <p>No previous exam records found.</p>
              <Link to="/dashboard" className="btn-custom btn-custom-primary">
                Launch your first CBT mock
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
