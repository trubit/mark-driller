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
import { useMySubscriptionQuery } from '../api/subscriptions.js';
import { SyllabusSubjectCard } from './SyllabusSubjectCard.js';

const studentWorkspaceImage =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=82';

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
  const [cbtModalSubjectId, setCbtModalSubjectId] = useState<string | undefined>(undefined);
  const [cbtModalTopicId, setCbtModalTopicId] = useState<string | undefined>(undefined);

  const handleLaunchTopicDrill = (subjectId: string, topicId: string) => {
    setCbtModalSubjectId(subjectId);
    setCbtModalTopicId(topicId);
    setIsCbtModalOpen(true);
  };

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const currentUser = userData?.user || user;
  const currentTargetExamId = (currentUser?.targetExam as any)?._id || (currentUser?.targetExam as any);
  const currentExamObj = exams?.find((ex) => ex._id === currentTargetExamId) || (exams && exams[0]);
  const activeExamId = currentExamObj?._id || '';
  const { data: subjects, isLoading: subjectsLoading } = useExamSubjectsQuery(activeExamId);
  const { notifySuccess, notifyError } = useNotificationStore();

  React.useEffect(() => {
    if (exams && exams.length > 0) {
      const isValid = exams.some((ex) => ex._id === currentTargetExamId);
      if (!isValid && exams[0]?._id) {
        updateTargetExam.mutate({ examId: exams[0]._id });
      }
    }
  }, [exams, currentTargetExamId, updateTargetExam]);

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

  const subscriptionLabel =
    currentSub?.plan === 'PRO_ANNUAL'
      ? 'Pro Annual'
      : currentSub?.plan === 'PRO_MONTHLY'
      ? 'Pro Monthly'
      : 'Free Starter';

  const metrics = [
    {
      label: 'Curriculum Target',
      value: currentExamObj?.shortCode || 'JAMB / UTME',
      detail: `Session: ${currentExamObj?.syllabusYear || '2025/2026'}`,
      tone: 'steel',
    },
    {
      label: 'CBT Mocks Completed',
      value: statsLoading ? '...' : `${statsData?.totalAttempts ?? 0}`,
      detail: 'Official timed simulations',
      tone: 'rust',
    },
    {
      label: 'Average Performance',
      value: statsLoading ? '...' : `${statsData?.averageScore ?? 0}%`,
      detail: 'Server-calculated accuracy',
      tone: 'amber',
      href: '/analytics',
      cta: 'View readiness report',
    },
    {
      label: 'Syllabus Subjects',
      value: subjectsLoading ? '...' : `${subjects?.length ?? 0}`,
      detail: 'Accredited exam papers',
      tone: 'forest',
    },
    {
      label: 'Subscription Tier',
      value: currentSub?.isPro ? 'Unlimited Mocks' : 'Pro Pass Required',
      detail: currentSub?.isPro && currentSub.endDate
        ? `Active until ${new Date(currentSub.endDate).toLocaleDateString()}`
        : 'Subscribe to unlock CBT simulations',
      tone: currentSub?.isPro ? 'forest' : 'rust',
      badge: subscriptionLabel,
      href: '/portal/pricing',
      cta: currentSub?.isPro ? 'Manage subscription' : 'Upgrade to Pro Pass',
    },
  ];

  const quickActions = [
    {
      eyebrow: 'CBT Simulator',
      title: 'Practice Mock Exam',
      body: 'Launch a focused, timed exam room with auto-submission, official pacing, and instant scoring.',
      action: (
        <button type="button" className="btn-custom btn-custom-primary" onClick={() => setIsCbtModalOpen(true)}>
          Start timed CBT mock
        </button>
      ),
      featured: true,
    },
    {
      eyebrow: 'Question Bank',
      title: 'Past Questions Drill',
      body: 'Drill topic-by-topic with detailed marking schemes, explanations, and syllabus filters.',
      action: (
        <Link to={activeExamId ? `/portal/questions?examId=${activeExamId}` : '/portal/questions'} className="btn-custom btn-custom-ghost">
          Browse question catalog
        </Link>
      ),
    },
    {
      eyebrow: 'Curriculum',
      title: 'Study Materials',
      body: 'Open aligned revision notes, formula guides, downloadable materials, and exam board resources.',
      action: (
        <Link to={activeExamId ? `/portal/materials?examId=${activeExamId}` : '/portal/materials'} className="btn-custom btn-custom-ghost">
          Open materials
        </Link>
      ),
    },
    {
      eyebrow: 'Upgrade Pass',
      title: 'Pro Member Benefits',
      body: 'Unlock unlimited mocks, step-by-step workings, Post-UTME drills, and deeper analytics.',
      action: (
        <Link to="/portal/pricing" className="btn-custom btn-custom-primary">
          View Pro tiers
        </Link>
      ),
      accent: true,
    },
  ];

  const tools = [
    ['Tertiary Screening', 'Post-UTME Portal', 'Institution-specific screening formats and CBT tests.', '/portal/post-utme'],
    ['Active Recall', 'Interactive Flashcards', 'High-yield definitions, rules, and facts for fast revision.', '/flashcards'],
    ['Formula Reference', 'Science and Math Handbook', 'WAEC and UTME equations, units, and worked calculations.', '/portal/formulas'],
    ['Weekly Benchmark', 'Weekly UTME Challenge', 'Timed national-style speed trials across core subjects.', '/challenge'],
    ['Speed Drills', 'Educational Speed Games', 'Vocabulary and arithmetic drills under a focused clock.', '/games'],
    ['Video Walkthroughs', 'Curriculum Video Lessons', 'Topic masterclasses built for Nigerian exam preparation.', '/lessons'],
    ['Admissions Guide', 'Nigerian School Finder', 'Cut-off marks, faculties, and admission guidelines.', '/portal/schools'],
    ['JAMB Brochure', 'Career and Subject Combinations', 'UTME subject requirements and O Level prerequisites.', '/portal/careers'],
    ['Curriculum Lexis', 'Academic Dictionary and Lexis', 'Vetted examination vocabulary and scientific definitions.', '/portal/dictionary'],
    ['Academic Intelligence', 'Examination Blog and Guides', 'Scoring blueprints, syllabus breakdowns, and cut-off tips.', '/portal/blog'],
    ['Subscription Pass', 'Subscription and Activation', 'Manage your student pass, scratch card PINs, and transfers.', '/portal/pricing'],
  ];

  return (
    <div className="student-workspace-page">
      <main className="portal-workspace">
        {currentUser.role === 'ADMIN' && (
          <div className="portal-admin-banner">
            <div>
              <strong>Administrator account active ({currentUser.email})</strong>
              <span>System governance privileges are available from the admin portal.</span>
            </div>
            <Link to="/admin" className="btn-custom btn-custom-primary">
              Open admin portal
            </Link>
          </div>
        )}

        <section className="student-hero" aria-labelledby="dashboard-title">
          <div className="student-hero-copy">
            <span className="eyebrow">Active Student Workspace</span>
            <h1 id="dashboard-title">Welcome back, {currentUser.fullName}</h1>
            <p>
              Plan your exam week, start focused CBT practice, and track the readiness signals that matter for your next paper.
            </p>
            <div className="student-hero-actions">
              <button type="button" className="btn-custom btn-custom-primary" onClick={() => setIsCbtModalOpen(true)}>
                Start timed CBT mock
              </button>
              <Link to="/analytics" className="btn-custom btn-custom-ghost">
                View analytics
              </Link>
            </div>
          </div>

          <div className="student-hero-panel">
            <img src={studentWorkspaceImage} alt="Students studying together for examination preparation" loading="eager" />
            <div className="student-exam-switcher">
              <label htmlFor="targetExamSelect">Target examination</label>
              <select
                id="targetExamSelect"
                value={activeExamId}
                onChange={handleTargetExamChange}
                disabled={updateTargetExam.isPending || examsLoading}
              >
                {examsLoading ? (
                  <option value="">Loading examinations...</option>
                ) : (!exams || exams.length === 0) ? (
                  <option value="" disabled>No examinations available</option>
                ) : (
                  exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.shortCode} - {exam.name}
                    </option>
                  ))
                )}
              </select>
              {examChangeSuccess && <span className="student-form-success">{examChangeSuccess}</span>}
            </div>
          </div>
        </section>

        <section className="portal-metric-grid" aria-label="Dashboard summary">
          {metrics.map((metric) => (
            <article key={metric.label} className={`portal-metric-card tone-${metric.tone}`}>
              <div className="portal-card-head">
                <span className="eyebrow">{metric.label}</span>
                {metric.badge && <span className="portal-pill">{metric.badge}</span>}
              </div>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
              {metric.href && metric.cta && <Link to={metric.href}>{metric.cta}</Link>}
            </article>
          ))}
        </section>

        <section className="portal-section" aria-labelledby="quick-actions-title">
          <div className="portal-section-head">
            <span className="eyebrow">Next best action</span>
            <h2 id="quick-actions-title">Keep practice moving</h2>
            <p>Choose a focused path based on your current target exam, subscription status, and syllabus coverage.</p>
          </div>
          <div className="portal-action-grid">
            {quickActions.map((item) => (
              <article key={item.title} className={`portal-action-card${item.featured ? ' is-featured' : ''}${item.accent ? ' is-accent' : ''}`}>
                <span className="eyebrow">{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <div className="portal-card-action">{item.action}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="portal-section" aria-labelledby="tools-title">
          <div className="portal-section-head">
            <span className="eyebrow">Preparation suite</span>
            <h2 id="tools-title">Specialized tools and intelligence</h2>
            <p>Everything here stays aligned to the Nigerian exam pathways your learners are preparing for.</p>
          </div>
          <div className="portal-tool-grid">
            {tools.map(([eyebrow, title, body, path]) => (
              <Link key={title} to={path} className="portal-tool-card">
                <span>{eyebrow}</span>
                <strong>{title}</strong>
                <p>{body}</p>
                <em>Open tool</em>
              </Link>
            ))}
          </div>
        </section>

        <section className="portal-section" aria-labelledby="syllabus-title">
          <div className="portal-section-head">
            <span className="eyebrow">Curriculum map</span>
            <h2 id="syllabus-title">{currentExamObj?.name || 'Target Examination'} core subjects and topics</h2>
            <p>Accredited examination topics with targeted past-question drill counts.</p>
          </div>

          {subjectsLoading ? (
            <div className="portal-empty-state">Loading accredited subjects and topic syllabus...</div>
          ) : subjects && subjects.length > 0 ? (
            <div
              className="syllabus-responsive-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
                alignItems: 'start',
                gap: '16px',
              }}
            >
              {subjects.map((subject) => (
                <SyllabusSubjectCard
                  key={subject._id}
                  subject={subject}
                  examId={activeExamId}
                  onDrillTopic={handleLaunchTopicDrill}
                />
              ))}
            </div>
          ) : (
            <div className="portal-empty-state">No subjects are available for this examination yet.</div>
          )}
        </section>
      </main>

      <CbtSetupModal
        isOpen={isCbtModalOpen}
        onClose={() => {
          setIsCbtModalOpen(false);
          setCbtModalSubjectId(undefined);
          setCbtModalTopicId(undefined);
        }}
        defaultExamId={activeExamId}
        defaultSubjectId={cbtModalSubjectId}
        defaultTopicId={cbtModalTopicId}
      />
    </div>
  );
};
