import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useCurrentUserQuery, useResendVerificationMutation } from '../api/auth.js';
import { useAnalyticsOverviewQuery, useResultsHistoryQuery } from '../api/results.js';
import { useMyBookmarksQuery } from '../api/questions.js';
import { useMySubscriptionQuery } from '../api/subscriptions.js';
import { useNotificationStore } from '../store/useNotificationStore.js';

export const UserProfileView: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { data: userData } = useCurrentUserQuery();
  const { data: analytics } = useAnalyticsOverviewQuery();
  const { data: historyData, isLoading: historyLoading } = useResultsHistoryQuery(1, 5);
  const { data: bookmarks } = useMyBookmarksQuery();
  const { data: subscription } = useMySubscriptionQuery();
  const resendVerification = useResendVerificationMutation();
  const { notifySuccess, notifyError } = useNotificationStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const currentUser = userData?.user || user;
  const currentProfile = userData?.profile;

  const initials = currentUser.fullName
    ? currentUser.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const isPro = subscription?.isPro || false;
  const isVerified = currentUser.isVerified;

  const handleResendVerification = async () => {
    try {
      await resendVerification.mutateAsync({ email: currentUser.email });
      notifySuccess('A 6-digit verification code has been dispatched to your email.');
    } catch (err: any) {
      notifyError(err?.message || 'Failed to send verification email. Please try again.');
    }
  };

  const readinessScore = analytics?.readinessScore ?? 0;
  const totalMocks = analytics?.totalMocksTaken ?? 0;
  const totalQuestions = analytics?.totalQuestionsAnswered ?? 0;
  const accuracy = analytics?.overallAccuracy ?? 0;
  const totalMinutes = Math.round((analytics?.totalTimeSpentSeconds ?? 0) / 60);

  const targetExamObj = currentUser.targetExam as any;
  const targetExamName = targetExamObj?.name || targetExamObj?.shortCode || 'JAMB UTME';

  const selectedSubjectsList: any[] = (currentUser.selectedSubjects as any[]) || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <main className="wrap" style={{ flex: 1, padding: '32px 20px 60px 20px', maxWidth: '1160px', margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '24px' }}>
          <Link to="/dashboard" style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>Dashboard</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>Student Profile</span>
        </div>

        {/* Profile Header Hero Card */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1.5px solid var(--paper-line)',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: 'var(--card-shadow)',
            marginBottom: '32px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '28px',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top Decorative Border Accent */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              backgroundColor: isPro ? 'var(--forest, #225a38)' : 'var(--rust, #a8562f)',
            }}
          />

          {/* Large Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                backgroundColor: 'var(--rust, #a8562f)',
                color: 'var(--white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '36px',
                fontFamily: "var(--font-sans)",
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                border: '3px solid var(--white)',
              }}
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>
            <Link
              to="/settings?tab=avatar"
              title="Change Profile Photo"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'var(--white)',
                border: '1px solid var(--paper-line)',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: 'var(--shadow)',
                cursor: 'pointer',
              }}
            >
              📷
            </Link>
          </div>

          {/* Main User Identity & Info */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1
                style={{
                  fontSize: 'clamp(24px, 3.5vw, 32px)',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  margin: 0,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {currentUser.fullName}
              </h1>

              {isVerified ? (
                <span
                  style={{
                    backgroundColor: 'var(--forest-soft, rgba(34, 90, 56, 0.12))',
                    color: 'var(--forest, #225a38)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ✓ VERIFIED CANDIDATE
                </span>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      backgroundColor: 'var(--amber-soft, rgba(226, 154, 60, 0.15))',
                      color: 'var(--amber-deep, #c17d24)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    ! EMAIL UNVERIFIED
                  </span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendVerification.isPending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--forest, #225a38)',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    {resendVerification.isPending ? 'Sending...' : 'Verify Now'}
                  </button>
                </div>
              )}

              <span
                style={{
                  backgroundColor: isPro ? 'var(--forest, #225a38)' : 'var(--paper)',
                  color: isPro ? 'var(--white)' : 'var(--ink)',
                  border: isPro ? 'none' : '1px solid var(--paper-line)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '4px',
                  letterSpacing: '0.05em',
                }}
              >
                {isPro ? '★ PRO SCHOLAR' : 'FREE STARTER'}
              </span>

              {currentUser.role === 'ADMIN' && (
                <span
                  style={{
                    backgroundColor: 'var(--rust, #a8562f)',
                    color: 'var(--white)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                  }}
                >
                  ADMINISTRATOR
                </span>
              )}
            </div>

            {/* Email & Academic Metadata */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13.5px', color: 'var(--ink-soft)', marginBottom: '14px' }}>
              <span>✉️ {currentUser.email}</span>
              {currentProfile?.phone && <span>📞 {currentProfile.phone}</span>}
              {currentProfile?.state && <span>📍 {currentProfile.state}, {currentProfile.country || 'Nigeria'}</span>}
              {currentProfile?.educationLevel && <span>🎓 {currentProfile.educationLevel}</span>}
              <span>📅 Joined {new Date(currentUser.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            </div>

            {/* Target Exam & Subjects Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Target Curriculum:</span>
              <span
                style={{
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: '4px',
                  padding: '3px 9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--forest, #225a38)',
                }}
              >
                🏛️ {targetExamName}
              </span>

              {selectedSubjectsList.length > 0 &&
                selectedSubjectsList.map((subj: any) => (
                  <span
                    key={subj._id || subj}
                    style={{
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--paper-line)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11.5px',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    {subj.name || subj}
                  </span>
                ))}
            </div>
          </div>

          {/* Edit / Quick Settings CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
            <Link
              to="/settings"
              className="btn-custom btn-custom-primary"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13.5px',
                padding: '10px 18px',
              }}
            >
              <span>⚙️ Edit Profile &amp; Settings</span>
            </Link>

            <Link
              to="/settings?tab=subscription"
              className="btn-custom btn-custom-ghost"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                padding: '8px 16px',
              }}
            >
              <span>{isPro ? 'Manage Subscription' : 'Upgrade to Pro ➔'}</span>
            </Link>
          </div>
        </div>

        {/* Quick Action Navigation Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '32px',
          }}
        >
          <Link
            to="/dashboard"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '16px',
              textDecoration: 'none',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow)',
              transition: 'transform 0.15s ease',
            }}
          >
            <span style={{ fontSize: '24px' }}>⏱️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>CBT Exam Room</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Start timed simulation</div>
            </div>
          </Link>

          <Link
            to="/portal/questions"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '16px',
              textDecoration: 'none',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow)',
              transition: 'transform 0.15s ease',
            }}
          >
            <span style={{ fontSize: '24px' }}>📚</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Past Questions</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>30,000+ accredited questions</div>
            </div>
          </Link>

          <Link
            to="/settings?tab=bookmarks"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '16px',
              textDecoration: 'none',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow)',
              transition: 'transform 0.15s ease',
            }}
          >
            <span style={{ fontSize: '24px' }}>📑</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Saved Bookmarks</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{bookmarks?.length || 0} questions saved</div>
            </div>
          </Link>

          <Link
            to="/analytics"
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              borderRadius: '8px',
              padding: '16px',
              textDecoration: 'none',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow)',
              transition: 'transform 0.15s ease',
            }}
          >
            <span style={{ fontSize: '24px' }}>📊</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Readiness Analytics</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Detailed performance stats</div>
            </div>
          </Link>
        </div>

        {/* Real Learning Statistics Matrix */}
        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginBottom: '16px' }}>
            Academic Learning &amp; Preparation Metrics
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Metric 1: Readiness Score */}
            <div
              style={{
                backgroundColor: 'var(--white)',
                border: '1px solid var(--paper-line)',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                Estimated Exam Readiness
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: readinessScore >= 70 ? 'var(--forest, #225a38)' : 'var(--rust, #a8562f)', fontFamily: "var(--font-sans)" }}>
                {readinessScore}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                {readinessScore === 0 ? 'Complete mocks to compute score' : readinessScore >= 70 ? 'Strong preparation track' : 'More mock practice recommended'}
              </div>
            </div>

            {/* Metric 2: Mocks Taken */}
            <div
              style={{
                backgroundColor: 'var(--white)',
                border: '1px solid var(--paper-line)',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                Completed Mock Exams
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink)', fontFamily: "var(--font-sans)" }}>
                {totalMocks}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                Timed simulations submitted
              </div>
            </div>

            {/* Metric 3: Questions Answered */}
            <div
              style={{
                backgroundColor: 'var(--white)',
                border: '1px solid var(--paper-line)',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                Questions Practiced
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink)', fontFamily: "var(--font-sans)" }}>
                {totalQuestions}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                Across accredited curricula
              </div>
            </div>

            {/* Metric 4: Overall Accuracy */}
            <div
              style={{
                backgroundColor: 'var(--white)',
                border: '1px solid var(--paper-line)',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                Average Accuracy
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink)', fontFamily: "var(--font-sans)" }}>
                {accuracy}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                Total study time: {totalMinutes} mins
              </div>
            </div>
          </div>
        </div>

        {/* Recent Attempts History */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1.5px solid var(--paper-line)',
            borderRadius: '12px',
            padding: 'clamp(14px, 3.5vw, 24px)',
            boxShadow: 'var(--shadow)',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              Recent Examination Attempts
            </h2>
            <Link
              to="/settings?tab=history"
              style={{
                fontSize: '13px',
                color: 'var(--forest, #225a38)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              View Full History ➔
            </Link>
          </div>

          {historyLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--ink-soft)' }}>
              Loading examination records...
            </div>
          ) : historyData?.results && historyData.results.length > 0 ? (
            <>
              {/* Mobile Card View (<= 680px) — Solves narrow mobile squishing */}
              <div className="cards-mobile-only">
                {historyData.results.map((r) => (
                  <div key={r._id} className="mobile-attempt-card">
                    <div className="mobile-attempt-header">
                      <span className="mobile-attempt-badge">
                        {r.examId?.shortCode || r.examId?.name || 'CBT Mock'}
                      </span>
                      <span className="mobile-attempt-date">
                        {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="mobile-attempt-title">
                      {r.subjectId?.name || 'Multi-Subject'}
                    </div>
                    <div className="mobile-attempt-stats">
                      <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                        Score: <strong style={{ color: 'var(--ink)' }}>{r.score} / {r.maxScore}</strong>
                      </span>
                      <span
                        style={{
                          backgroundColor: r.percentage >= 60 ? 'var(--forest-soft, rgba(34, 90, 56, 0.12))' : 'var(--amber-soft, rgba(226, 154, 60, 0.12))',
                          color: r.percentage >= 60 ? 'var(--forest, #225a38)' : 'var(--amber-deep, #c17d24)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '12px',
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        {r.percentage}%
                      </span>
                    </div>
                    <Link
                      to={r.attemptId?._id ? `/cbt/${r.attemptId._id}/result` : '/analytics'}
                      className="mobile-attempt-action-btn"
                    >
                      Review Result ➔
                    </Link>
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Full Table (> 680px) */}
              <div className="table-desktop-only table-responsive">
                <table style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--paper-line)', color: 'var(--ink-soft)' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 700, minWidth: '160px' }}>Examination</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, minWidth: '140px' }}>Subject</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Score</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Percentage</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.results.map((r) => (
                      <tr key={r._id} style={{ borderBottom: '1px solid var(--paper-line)' }}>
                        <td style={{ padding: '14px', fontWeight: 600, color: 'var(--ink)', minWidth: '160px' }}>
                          {r.examId?.name || r.examId?.shortCode || 'CBT Mock'}
                        </td>
                        <td style={{ padding: '14px', color: 'var(--ink-soft)', minWidth: '140px' }}>
                          {r.subjectId?.name || 'Multi-Subject'}
                        </td>
                        <td style={{ padding: '14px', fontWeight: 700, fontFamily: "var(--font-sans)" }}>
                          {r.score} / {r.maxScore}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span
                            style={{
                              backgroundColor: r.percentage >= 60 ? 'var(--forest-soft, rgba(34, 90, 56, 0.12))' : 'var(--amber-soft, rgba(226, 154, 60, 0.12))',
                              color: r.percentage >= 60 ? 'var(--forest, #225a38)' : 'var(--amber-deep, #c17d24)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            {r.percentage}%
                          </span>
                        </td>
                        <td style={{ padding: '14px', color: 'var(--ink-soft)' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <Link
                            to={r.attemptId?._id ? `/cbt/${r.attemptId._id}/result` : '/analytics'}
                            style={{
                              color: 'var(--forest, #225a38)',
                              fontWeight: 700,
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Review Result ➔
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--paper)',
                borderRadius: '8px',
                padding: '40px 20px',
                textAlign: 'center',
                border: '1px dashed var(--paper-line)',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📝</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                No examination attempts logged yet
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', maxWidth: '440px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                Take your first timed CBT mock test or practice individual subjects to generate official psychometric performance analytics.
              </p>
              <Link
                to="/dashboard"
                className="btn-custom btn-custom-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', fontSize: '13px', padding: '8px 18px' }}
              >
                Launch CBT Mock Exam ➔
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

