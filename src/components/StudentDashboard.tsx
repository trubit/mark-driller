import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useCurrentUserQuery } from '../api/auth.js';
import {
  useExamsQuery,
  useDashboardStatsQuery,
  useExamSubjectsQuery,
  useUpdateTargetExamMutation,
} from '../api/exams.js';
import { CbtSetupModal } from './CbtSetupModal.js';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { PortalHeader } from './PortalHeader.js';
import { useMySubscriptionQuery } from '../api/subscriptions.js';
import { SyllabusSubjectCard } from './SyllabusSubjectCard.js';

export const StudentDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { data: userData } = useCurrentUserQuery();
  const { data: exams, isLoading: examsLoading } = useExamsQuery();
  const { data: statsData, isLoading: statsLoading } = useDashboardStatsQuery();
  const { data: currentSub } = useMySubscriptionQuery();
  const updateTargetExam = useUpdateTargetExamMutation();
  const navigate = useNavigate();

  const [examChangeSuccess, setExamChangeSuccess] = useState<string | null>(null);
  const [isCbtModalOpen, setIsCbtModalOpen] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const currentUser = userData?.user || user;
  const currentTargetExamId = (currentUser?.targetExam as any)?._id || (currentUser?.targetExam as any);

  // Resolved active examination object (guaranteed to match an existing board)
  const currentExamObj = exams?.find((ex) => ex._id === currentTargetExamId) || (exams && exams[0]);
  const activeExamId = currentExamObj?._id || '';

  // Load subjects for the active target exam
  const { data: subjects, isLoading: subjectsLoading } = useExamSubjectsQuery(activeExamId);

  const { notifySuccess, notifyError } = useNotificationStore();

  // Auto-sync valid exam to student profile if none is set or if previous ID is obsolete
  React.useEffect(() => {
    if (exams && exams.length > 0) {
      const isValid = exams.some((ex) => ex._id === currentTargetExamId);
      if (!isValid && exams[0]?._id) {
        updateTargetExam.mutate({ examId: exams[0]._id });
      }
    }
  }, [exams, currentTargetExamId]);

  const handleTargetExamChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newExamId = e.target.value;
    if (!newExamId) return;

    try {
      await updateTargetExam.mutateAsync({ examId: newExamId });
      setExamChangeSuccess('Target examination updated successfully.');
      notifySuccess('Active examination updated. Syllabus and drill questions synced.');
      setTimeout(() => setExamChangeSuccess(null), 3000);
    } catch (err: any) {
      notifyError(err.message || 'We could not update your target examination. Please try again.');
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Responsive Portal Header */}
      <PortalHeader badge="STUDENT PORTAL" badgeColor="rust" activePath="/dashboard" />

      {/* Main Student Workspace */}
      <main className="wrap" style={{ flex: 1, padding: 'clamp(18px, 4vw, 40px) clamp(14px, 3vw, 32px)' }}>
        {/* Student Welcome & Target Exam Switcher */}
        <div
          style={{
            backgroundColor: 'var(--ink)',
            color: 'var(--white)',
            padding: '36px',
            borderRadius: '4px',
            marginBottom: '32px',
            border: '1.5px solid var(--ink)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span className="eyebrow" style={{ color: 'var(--amber)', marginBottom: '8px', display: 'block' }}>
                Active Student Workspace
              </span>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', color: 'var(--white)', marginBottom: '10px' }}>
                Welcome back, {currentUser.fullName}
              </h1>
              <p style={{ color: 'rgba(248,247,242,0.75)', fontSize: '15px', maxWidth: '64ch', margin: 0 }}>
                Drill through exam-specific past questions, follow official syllabus benchmarks, and track your server-validated readiness score.
              </p>
            </div>

            {/* Switch Exam Box */}
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                padding: '16px 20px',
                borderRadius: '3px',
                border: '1px solid rgba(255,255,255,0.12)',
                minWidth: '260px',
              }}
            >
              <label
                htmlFor="targetExamSelect"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--amber)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Target Examination:
              </label>
              <select
                id="targetExamSelect"
                value={activeExamId}
                onChange={handleTargetExamChange}
                disabled={updateTargetExam.isPending || examsLoading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  border: '1px solid var(--paper-dim)',
                  borderRadius: '2px',
                  fontSize: '14px',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {examsLoading ? (
                  <option value="">Loading examinations...</option>
                ) : (!exams || exams.length === 0) ? (
                  <option value="" disabled>No examinations available</option>
                ) : (
                  exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.shortCode} — {exam.name}
                    </option>
                  ))
                )}
              </select>
              {examChangeSuccess && (
                <span
                  style={{
                    display: 'block',
                    marginTop: '8px',
                    color: '#65d996',
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  ✓ {examChangeSuccess}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Real Metrics Gauge Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '36px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--white)',
              padding: '20px',
              borderRadius: '3px',
              border: '1.5px solid rgba(20,24,28,0.14)',
            }}
          >
            <span className="eyebrow" style={{ color: 'var(--steel)' }}>Curriculum Target</span>
            <div style={{ fontSize: '24px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {currentExamObj?.shortCode || 'JAMB / UTME'}
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              Session: {currentExamObj?.syllabusYear || '2025/2026'}
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--white)',
              padding: '20px',
              borderRadius: '3px',
              border: '1.5px solid rgba(20,24,28,0.14)',
            }}
          >
            <span className="eyebrow" style={{ color: 'var(--rust)' }}>CBT Mocks Completed</span>
            <div style={{ fontSize: '24px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {statsLoading ? '...' : statsData?.totalAttempts ?? 0}
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              Official timed simulations
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--white)',
              padding: '20px',
              borderRadius: '3px',
              border: '1.5px solid rgba(20,24,28,0.14)',
            }}
          >
            <span className="eyebrow" style={{ color: 'var(--amber-deep)' }}>Average Performance</span>
            <div style={{ fontSize: '24px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {statsLoading ? '...' : `${statsData?.averageScore ?? 0}%`}
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              Server-calculated accuracy
            </span>
            <Link
              to="/analytics"
              style={{
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--rust)',
                textDecoration: 'none',
                display: 'block',
                marginTop: '6px',
                fontWeight: 600,
              }}
            >
              View Readiness Report →
            </Link>
          </div>

          <div
            style={{
              backgroundColor: 'var(--white)',
              padding: '20px',
              borderRadius: '3px',
              border: '1.5px solid rgba(20,24,28,0.14)',
            }}
          >
            <span className="eyebrow" style={{ color: 'var(--ink-soft)' }}>Syllabus Subjects</span>
            <div style={{ fontSize: '24px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {subjectsLoading ? '...' : subjects?.length ?? 0}
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              Accredited exam papers
            </span>
          </div>

          {/* Subscription Tier Metric Card */}
          <div
            style={{
              backgroundColor: 'var(--white)',
              padding: '20px',
              borderRadius: '3px',
              border: currentSub?.isPro ? '1.5px solid var(--forest)' : '1.5px solid rgba(20,24,28,0.14)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="eyebrow" style={{ color: currentSub?.isPro ? 'var(--forest)' : 'var(--rust)' }}>
                Subscription Tier
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: '2px 6px',
                  borderRadius: '2px',
                  background: currentSub?.isPro ? '#eaf4ee' : '#fdf0ed',
                  color: currentSub?.isPro ? 'var(--forest)' : 'var(--rust)',
                  fontWeight: 700,
                }}
              >
                {currentSub?.plan === 'PRO_ANNUAL'
                  ? 'PRO ANNUAL'
                  : currentSub?.plan === 'PRO_MONTHLY'
                  ? 'PRO MONTHLY'
                  : 'FREE STARTER'}
              </span>
            </div>
            <div style={{ fontSize: '20px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, margin: '6px 0 2px' }}>
              {currentSub?.isPro ? 'Unlimited Mocks' : 'Pro Pass Required'}
            </div>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink-soft)' }}>
              {currentSub?.isPro && currentSub.endDate
                ? `Active until ${new Date(currentSub.endDate).toLocaleDateString()}`
                : 'Subscribe to unlock CBT simulations'}
            </span>
            <Link
              to="/pricing"
              style={{
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                color: currentSub?.isPro ? 'var(--forest)' : 'var(--rust)',
                textDecoration: 'none',
                display: 'block',
                marginTop: '6px',
                fontWeight: 600,
              }}
            >
              {currentSub?.isPro ? 'Manage Subscription →' : 'Upgrade to Pro Pass ★'}
            </Link>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div className="feature-card" style={{ border: '1.5px solid var(--ink)', display: 'flex', flexDirection: 'column' }}>
            <span className="eyebrow">CBT Simulator</span>
            <h3>Practice Mock Exam</h3>
            <p>Timed test simulation adhering strictly to official countdown rules, auto-submission, and distribution.</p>
            <button
              type="button"
              className="btn-custom btn-custom-primary"
              style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
              onClick={() => setIsCbtModalOpen(true)}
            >
              Start Timed CBT Mock
            </button>
          </div>

          <div className="feature-card" style={{ border: '1.5px solid var(--ink)', display: 'flex', flexDirection: 'column' }}>
            <span className="eyebrow">Question Bank</span>
            <h3>Past Questions Drill</h3>
            <p>Drill topic-by-topic with detailed marking schemes, step-by-step worked steps, and instant explanations.</p>
            <Link
              to={activeExamId ? `/questions?examId=${activeExamId}` : '/questions'}
              className="btn-custom btn-custom-ghost"
              style={{ marginTop: 'auto', alignSelf: 'flex-start', textDecoration: 'none' }}
            >
              Browse Questions Catalog
            </Link>
          </div>

          <div className="feature-card" style={{ border: '1.5px solid var(--ink)', display: 'flex', flexDirection: 'column' }}>
            <span className="eyebrow">Curriculum</span>
            <h3>Study Materials</h3>
            <p>Syllabus-aligned revision notes, downloadable PDF formulas, and official examination guides.</p>
            <Link
              to={activeExamId ? `/materials?examId=${activeExamId}` : '/materials'}
              className="btn-custom btn-custom-ghost"
              style={{ marginTop: 'auto', alignSelf: 'flex-start', textDecoration: 'none' }}
            >
              Open Materials →
            </Link>
          </div>

          <div className="feature-card" style={{ border: '1.5px solid var(--rust)', background: '#fffaf8', display: 'flex', flexDirection: 'column' }}>
            <span className="eyebrow" style={{ color: 'var(--rust)' }}>Upgrade Pass</span>
            <h3 style={{ color: 'var(--rust)' }}>Pro Member Benefits</h3>
            <p>Unlimited CBT mocks, step-by-step mathematical workings, and university post-UTME screening drills.</p>
            <Link
              to="/pricing"
              className="btn-custom btn-custom-primary"
              style={{ marginTop: 'auto', alignSelf: 'flex-start', textDecoration: 'none', background: 'var(--rust)' }}
            >
              View Pro Tiers ★
            </Link>
          </div>
        </div>

        {/* Interactive Syllabus Subject & Topic Hierarchy */}
        <div style={{ marginBottom: '48px' }}>
          <div className="section-head" style={{ marginBottom: '24px' }}>
            <h2>{currentExamObj?.name || 'Target Examination'} — Core Subjects & Topics</h2>
            <p>Accredited examination topics with targeted past question drill counts.</p>
          </div>

          {subjectsLoading ? (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', color: 'var(--ink-soft)' }}>
              Loading accredited subjects and topic syllabus from MongoDB...
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
                gap: '16px',
                alignItems: 'start',
              }}
            >
              {subjects?.map((subject) => (
                <SyllabusSubjectCard
                  key={subject._id}
                  subject={subject}
                  examId={activeExamId}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer" style={{ padding: '24px 0' }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(248,247,242,0.5)' }}>
          <span>© 2026 MARK DRILLER PLATFORM. LOGGED IN AS {currentUser.email.toUpperCase()}</span>
          <span>ROLE: {currentUser.role} · EXAM: {currentExamObj?.shortCode || 'DEFAULT'}</span>
        </div>
      </footer>

      {/* CBT Configuration Modal */}
      <CbtSetupModal
        isOpen={isCbtModalOpen}
        onClose={() => setIsCbtModalOpen(false)}
        defaultExamId={activeExamId}
      />
    </div>
  );
};
