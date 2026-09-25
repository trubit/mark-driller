import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { useExamsQuery, useExamSubjectsQuery, useSubjectTopicsQuery } from '../api/exams.js';
import {
  useQuestionsQuery,
  useToggleBookmarkMutation,
  useMyBookmarksQuery,
  useAcquireCurriculumMutation,
  useTrialUsageQuery,
  type QuestionItem,
} from '../api/questions.js';
import { SafeImage } from './SafeImage.js';


interface QuestionCardProps {
  question: QuestionItem;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  isBookmarkPending: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isBookmarked,
  onToggleBookmark,
  isBookmarkPending,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const options: { label: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
    { label: 'A', text: question.optionA },
    { label: 'B', text: question.optionB },
    { label: 'C', text: question.optionC },
    { label: 'D', text: question.optionD },
  ];

  return (
    <div
      className="question-card"
      style={{
        backgroundColor: 'var(--white)',
        border: '1.5px solid rgba(20,24,28,0.14)',
        borderRadius: '4px',
        padding: '24px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Question Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '10px',
          borderBottom: '1px solid rgba(20,24,28,0.08)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: '14px',
              color: 'var(--ink)',
            }}
          >
            {question.examId?.shortCode || 'EXAM'} {question.year}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: "var(--font-sans)",
              backgroundColor: 'var(--paper)',
              padding: '2px 8px',
              borderRadius: '2px',
              color: 'var(--rust)',
              fontWeight: 600,
            }}
          >
            QUESTION {question.questionNumber}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: "var(--font-sans)",
              backgroundColor: 'var(--paper-dim)',
              padding: '2px 8px',
              borderRadius: '2px',
              color: 'var(--ink-soft)',
            }}
          >
            {question.subjectId?.name}
          </span>
          {question.topicId && (
            <span
              style={{
                fontSize: '11px',
                fontFamily: "var(--font-sans)",
                backgroundColor: '#e7edf3',
                padding: '2px 8px',
                borderRadius: '2px',
                color: 'var(--steel-deep)',
              }}
            >
              {question.topicId.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '10.5px',
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '2px',
              backgroundColor:
                question.difficulty === 'EASY'
                  ? '#e4f5ea'
                  : question.difficulty === 'HARD'
                  ? '#fde8e8'
                  : '#fef3e2',
              color:
                question.difficulty === 'EASY'
                  ? '#217844'
                  : question.difficulty === 'HARD'
                  ? '#b91c1c'
                  : '#a16207',
            }}
          >
            {question.difficulty}
          </span>

          <button
            type="button"
            onClick={() => onToggleBookmark(question._id)}
            disabled={isBookmarkPending}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
            style={{
              background: isBookmarked ? '#faede7' : 'transparent',
              border: isBookmarked ? '1px solid var(--rust)' : '1px solid rgba(20,24,28,0.2)',
              borderRadius: '3px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: isBookmarked ? 'var(--rust)' : 'var(--ink-soft)',
            }}
          >
            {isBookmarked ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>

      {/* Question Text */}
      <div
        style={{
          fontSize: '16px',
          lineHeight: '1.6',
          color: 'var(--ink)',
          fontFamily: "var(--font-sans)",
        }}
      >
        {question.questionText}
      </div>

      {/* Options Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
        {options.map((opt) => {
          const isChosen = selectedOption === opt.label;
          const isCorrect = showExplanation && opt.label === question.correctAnswer;
          const isWrong = showExplanation && isChosen && opt.label !== question.correctAnswer;

          let bg = 'var(--paper)';
          let border = '1px solid rgba(20,24,28,0.12)';
          let color = 'var(--ink)';

          if (isCorrect) {
            bg = '#e4f5ea';
            border = '1.5px solid #217844';
            color = '#11532c';
          } else if (isWrong) {
            bg = '#fde8e8';
            border = '1.5px solid #b91c1c';
            color = '#991b1b';
          } else if (isChosen) {
            bg = '#e8f0fe';
            border = '1.5px solid var(--steel)';
          }

          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSelectedOption(opt.label)}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: '3px',
                backgroundColor: bg,
                border,
                color,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '14.5px',
                fontFamily: "var(--font-sans)",
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontFamily: "var(--font-sans)",
                  fontSize: '13px',
                  backgroundColor: 'rgba(20,24,28,0.06)',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  minWidth: '22px',
                  textAlign: 'center',
                }}
              >
                {opt.label}
              </span>
              <span style={{ flex: 1 }}>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Action Strip: Toggle Explanation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={() => setShowExplanation((prev) => !prev)}
          className="btn-custom btn-custom-ghost"
          style={{ fontSize: '13px', padding: '6px 14px' }}
        >
          {showExplanation ? 'Hide Explanation ▲' : 'Reveal Solution & Steps ▼'}
        </button>

        {selectedOption && !showExplanation && (
          <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
            Selected: Option {selectedOption}
          </span>
        )}
      </div>

      {/* Explanation Box */}
      {showExplanation && (
        <div
          style={{
            marginTop: '6px',
            padding: '16px 20px',
            backgroundColor: 'var(--paper)',
            borderRadius: '3px',
            borderLeft: '4px solid var(--rust)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--white)',
                backgroundColor: '#217844',
                padding: '2px 8px',
                borderRadius: '2px',
              }}
            >
              CORRECT ANSWER: {question.correctAnswer}
            </span>
          </div>

          <p
            style={{
              fontSize: '14.5px',
              lineHeight: '1.6',
              color: 'var(--ink)',
              margin: 0,
              fontFamily: "var(--font-sans)",
            }}
          >
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export const QuestionCatalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const selectedExamId = searchParams.get('exam') || searchParams.get('examId') || '';
  const selectedSubjectId = searchParams.get('subject') || searchParams.get('subjectId') || '';
  const selectedTopicId = searchParams.get('topic') || searchParams.get('topicId') || '';
  const selectedYear = searchParams.get('year') || '';
  const selectedDifficulty = searchParams.get('difficulty') || '';
  const searchQuery = searchParams.get('q') || searchParams.get('search') || '';
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Math.max(1, isNaN(rawPage) ? 1 : rawPage);

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const navigate = useNavigate();
  const { openAuthModal } = useAppStore();
  const { notifySuccess, notifyError, notifyInfo } = useNotificationStore();

  const { data: exams } = useExamsQuery();
  const { data: subjects } = useExamSubjectsQuery(selectedExamId || undefined);
  const { data: topics } = useSubjectTopicsQuery(selectedSubjectId || undefined);
  const { data: bookmarksData } = useMyBookmarksQuery();
  const { data: trialUsageData } = useTrialUsageQuery();
  const toggleBookmark = useToggleBookmarkMutation();
  const acquireCurriculum = useAcquireCurriculumMutation();
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const bookmarkedQuestionIds = new Set(
    bookmarksData?.map((b) => b.question?._id) || []
  );


  const {
    data: questionsData,
    isLoading: questionsLoading,
    isFetching: questionsFetching,
    isError: questionsError,
    error: questionsErrorObj,
    refetch: refetchQuestions,
  } = useQuestionsQuery({
    examId: selectedExamId || undefined,
    subjectId: selectedSubjectId || undefined,
    topicId: selectedTopicId || undefined,
    year: selectedYear || undefined,
    difficulty: selectedDifficulty || undefined,
    search: searchQuery || undefined,
    page: currentPage,
    limit: 10,
  });

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // If exam changes, reset subject and topic
    if (key === 'exam') {
      next.delete('subject');
      next.delete('topic');
    }
    // If subject changes, reset topic
    if (key === 'subject') {
      next.delete('topic');
    }
    // Only reset page to 1 if a filter other than page changes
    if (key !== 'page') {
      next.set('page', '1');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('q', searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handleToggleBookmark = async (questionId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      notifyInfo('Please sign in or create an account to bookmark questions.');
      return;
    }
    try {
      const res = await toggleBookmark.mutateAsync(questionId);
      notifySuccess(
        res.isBookmarked
          ? 'Question saved to your bookmarks.'
          : 'Question removed from your bookmarks.'
      );
    } catch (err: any) {
      notifyError(err.message || 'We could not update your bookmark. Please try again.');
    }
  };

  return (
    <div className="premium-portal-page premium-question-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Main Catalog View */}
      <main className="wrap" style={{ flex: 1, padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 32px)' }}>
        {/* Title Header */}
        <section className="premium-portal-hero" aria-labelledby="questions-title">
          <div className="premium-portal-hero-copy">
            <span className="eyebrow" style={{ marginBottom: '6px', display: 'block' }}>
              Official Past Questions Repository
            </span>
            <h1 id="questions-title" style={{ fontSize: 'clamp(28px, 4vw, 36px)', margin: '0 0 8px 0', color: 'var(--ink)' }}>
              Past Questions Drill &amp; Solved Solutions
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '72ch', margin: 0 }}>
              Browse accredited past questions across JAMB, WAEC, and NECO. Filter by examination board, subject, topic, year, or search by keywords.
            </p>
          </div>
          <div className="premium-portal-hero-media">
            <SafeImage
              src="/assets/images/cbt-practice.jpg"
              alt="Student working through a computer-based exam practice session"
              loading="eager"
            />
            <div className="premium-portal-hero-stat">
              <span>Exam-Ready Workflow</span>
              <strong>Filter, solve, save, and revisit official practice questions.</strong>
            </div>
          </div>
        </section>

        {/* Filter Toolbar */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            padding: '20px',
            borderRadius: '4px',
            border: '1.5px solid rgba(20,24,28,0.14)',
            marginBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Keyword Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search questions by keyword, topic, or concept (e.g. logarithm, kinetic, ephemeral)..."
              style={{
                flex: '1 1 200px',
                minWidth: 0,
                padding: '10px 14px',
                borderRadius: '2px',
                border: '1px solid rgba(20,24,28,0.2)',
                fontSize: '14px',
                fontFamily: "var(--font-sans)",
                boxSizing: 'border-box',
              }}
            />
            <button type="submit" className="btn-custom btn-custom-primary" style={{ padding: '10px 24px', flexShrink: 0 }}>
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowBookmarksOnly((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '2px',
                border: showBookmarksOnly ? '1.5px solid var(--rust)' : '1px solid rgba(20,24,28,0.2)',
                backgroundColor: showBookmarksOnly ? '#fdf0ed' : 'var(--paper)',
                color: showBookmarksOnly ? 'var(--rust)' : 'var(--ink)',
                fontSize: '13px',
                fontFamily: "var(--font-sans)",
                fontWeight: showBookmarksOnly ? 700 : 500,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              title="Filter by bookmarked questions"
            >
              <span>{showBookmarksOnly ? '★' : '☆'}</span>
              <span>{showBookmarksOnly ? 'Saved Bookmarks Only' : 'Saved Bookmarks'}</span>
              {bookmarksData && bookmarksData.length > 0 && (
                <span
                  style={{
                    backgroundColor: showBookmarksOnly ? 'var(--rust)' : 'rgba(20,24,28,0.1)',
                    color: showBookmarksOnly ? '#fff' : 'var(--ink)',
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: 700,
                  }}
                >
                  {bookmarksData.length}
                </span>
              )}
            </button>
          </form>

          {/* Filter Dropdowns Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {/* Exam Filter */}
            <div>
              <label
                htmlFor="examFilter"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: "var(--font-sans)",
                  color: 'var(--ink-soft)',
                  marginBottom: '4px',
                }}
              >
                EXAM BOARD
              </label>
              <select
                id="examFilter"
                value={selectedExamId}
                onChange={(e) => updateFilter('exam', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '2px',
                  border: '1px solid rgba(20,24,28,0.2)',
                  backgroundColor: 'var(--paper)',
                  fontSize: '13px',
                  fontFamily: "var(--font-sans)",
                }}
              >
                <option value="">All Examination Boards</option>
                {exams?.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.shortCode}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label
                htmlFor="subjectFilter"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: "var(--font-sans)",
                  color: 'var(--ink-soft)',
                  marginBottom: '4px',
                }}
              >
                SUBJECT
              </label>
              <select
                id="subjectFilter"
                value={selectedSubjectId}
                onChange={(e) => updateFilter('subject', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '2px',
                  border: '1px solid rgba(20,24,28,0.2)',
                  backgroundColor: 'var(--paper)',
                  fontSize: '13px',
                  fontFamily: "var(--font-sans)",
                }}
              >
                <option value="">All Subjects</option>
                {subjects?.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Filter */}
            <div>
              <label
                htmlFor="topicFilter"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: "var(--font-sans)",
                  color: 'var(--ink-soft)',
                  marginBottom: '4px',
                }}
              >
                TOPIC
              </label>
              <select
                id="topicFilter"
                value={selectedTopicId}
                disabled={!selectedSubjectId}
                onChange={(e) => updateFilter('topic', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '2px',
                  border: '1px solid rgba(20,24,28,0.2)',
                  backgroundColor: 'var(--paper)',
                  fontSize: '13px',
                  fontFamily: "var(--font-sans)",
                  opacity: selectedSubjectId ? 1 : 0.6,
                }}
              >
                <option value="">All Topics</option>
                {topics?.map((top) => (
                  <option key={top._id} value={top._id}>
                    {top.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label
                htmlFor="yearFilter"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: "var(--font-sans)",
                  color: 'var(--ink-soft)',
                  marginBottom: '4px',
                }}
              >
                EXAM YEAR
              </label>
              <select
                id="yearFilter"
                value={selectedYear}
                onChange={(e) => updateFilter('year', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '2px',
                  border: '1px solid rgba(20,24,28,0.2)',
                  backgroundColor: 'var(--paper)',
                  fontSize: '13px',
                  fontFamily: "var(--font-sans)",
                }}
              >
                <option value="">All Past Years</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label
                htmlFor="difficultyFilter"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: "var(--font-sans)",
                  color: 'var(--ink-soft)',
                  marginBottom: '4px',
                }}
              >
                DIFFICULTY
              </label>
              <select
                id="difficultyFilter"
                value={selectedDifficulty}
                onChange={(e) => updateFilter('difficulty', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '2px',
                  border: '1px solid rgba(20,24,28,0.2)',
                  backgroundColor: 'var(--paper)',
                  fontSize: '13px',
                  fontFamily: "var(--font-sans)",
                }}
              >
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Link */}
          {(selectedExamId || selectedSubjectId || selectedTopicId || selectedYear || selectedDifficulty || searchQuery) && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--rust)',
                  fontSize: '12px',
                  fontFamily: "var(--font-sans)",
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                ✕ Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* On-Demand Acquisition Banner */}
        {(questionsData?.acquiredOnDemand || syncSuccessMsg) && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #86efac',
              padding: '12px 18px',
              borderRadius: '4px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(34,197,94,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>⚡</span>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '13.5px',
                    fontFamily: "var(--font-sans)",
                    color: '#166534',
                    fontWeight: 700,
                  }}
                >
                  Accredited Questions Synced
                </span>
                <span
                  style={{
                    fontSize: '12.5px',
                    color: '#15803d',
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {syncSuccessMsg ||
                    'Authentic past questions were dynamically acquired on-demand and stored in your MarkDriller database.'}
                </span>
              </div>
            </div>
            {syncSuccessMsg && (
              <button
                type="button"
                onClick={() => setSyncSuccessMsg(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#166534',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Free Trial Past Questions Usage Tracker */}
        {(() => {
          const effectiveUsage = questionsData?.trialUsage || trialUsageData;
          if (!effectiveUsage || effectiveUsage.isPro) return null;
          return (
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: 'var(--white)',
                border: `1.5px solid ${effectiveUsage.isLimitReached ? 'var(--rust)' : 'rgba(20,24,28,0.14)'}`,
                borderRadius: '6px',
                marginBottom: '20px',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontFamily: 'var(--font-sans)', fontWeight: 700, color: 'var(--ink)' }}>
                    Past Questions Free Trial: {effectiveUsage.used} / {effectiveUsage.limit} used
                  </span>
                  {effectiveUsage.isLimitReached ? (
                    <span style={{ fontSize: '11px', backgroundColor: 'var(--rust)', color: '#fff', padding: '2px 8px', borderRadius: '3px', fontWeight: 700 }}>
                      Limit Reached
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', backgroundColor: 'var(--paper)', color: 'var(--ink-soft)', padding: '2px 8px', borderRadius: '3px', fontWeight: 600 }}>
                      {effectiveUsage.remaining} remaining
                    </span>
                  )}
                </div>
                <div style={{ width: '100%', maxWidth: '360px', height: '7px', backgroundColor: 'rgba(20,24,28,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, (effectiveUsage.used / effectiveUsage.limit) * 100)}%`,
                      height: '100%',
                      backgroundColor: effectiveUsage.isLimitReached ? 'var(--rust)' : '#0284c7',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              <div>
                {effectiveUsage.isLimitReached ? (
                  <button
                    type="button"
                    onClick={() => navigate('/portal/pricing')}
                    className="btn-custom btn-custom-primary"
                    style={{ backgroundColor: 'var(--rust)', color: '#fff', fontSize: '12.5px', padding: '8px 16px', fontWeight: 700 }}
                  >
                    Limit Reached — Upgrade to Pro →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/portal/pricing')}
                    className="btn-custom btn-custom-ghost"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Upgrade to Pro for Unlimited Questions →
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Questions List */}
        {showBookmarksOnly ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontFamily: "var(--font-sans)", color: 'var(--rust)', fontWeight: 700 }}>
              <span>★ Saved Bookmarks ({bookmarksData?.length || 0} questions)</span>
              <button
                type="button"
                onClick={() => setShowBookmarksOnly(false)}
                style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px' }}
              >
                Back to all questions →
              </button>
            </div>
            {!bookmarksData || bookmarksData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--white)', border: '1.5px dashed rgba(20,24,28,0.2)', borderRadius: '4px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>★</div>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: '0 0 8px' }}>No Bookmarked Questions Yet</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: '14px', maxWidth: '46ch', margin: '0 auto 16px' }}>
                  Save questions for rapid revision by clicking the bookmark icon on any question card.
                </p>
                <button type="button" onClick={() => setShowBookmarksOnly(false)} className="btn-custom btn-custom-primary">
                  Explore Question Bank
                </button>
              </div>
            ) : (
              bookmarksData.map((b) => (
                <QuestionCard
                  key={b.question._id}
                  question={b.question}
                  isBookmarked={true}
                  onToggleBookmark={handleToggleBookmark}
                  isBookmarkPending={toggleBookmark.isPending}
                />
              ))
            )}
          </div>
        ) : questionsLoading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
            Loading questions catalog from database...
          </div>
        ) : questionsError ? (
          (questionsErrorObj as any)?.statusCode === 403 ||
          (questionsErrorObj as any)?.message?.includes('Free Trial Past Questions limit has been reached') ||
          (questionsErrorObj as any)?.message?.includes('limit has been reached') ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: 'var(--white)',
                borderRadius: '8px',
                border: '1.5px solid var(--rust)',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>🔒</div>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: '22px', color: 'var(--ink)', marginBottom: '10px' }}>
                Free Trial Past Questions Limit Reached
              </h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: '14.5px', maxWidth: '52ch', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Your Free Trial Past Questions limit has been reached (<strong>200 / 200 used</strong>). Upgrade to MarkDriller Pro to continue accessing our complete question archive across all examination boards.
              </p>
              <button
                type="button"
                onClick={() => navigate('/portal/pricing')}
                className="btn-custom btn-custom-primary"
                style={{ backgroundColor: 'var(--rust)', color: '#fff', padding: '12px 28px', fontSize: '14px', fontWeight: 700 }}
              >
                Upgrade to Pro Now →
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                backgroundColor: '#fff5f5',
                borderRadius: '4px',
                border: '1.5px solid #feb2b2',
              }}
            >
              <h3 style={{ fontFamily: "var(--font-sans)", color: '#c53030', marginBottom: '8px' }}>
                Error Loading Questions
              </h3>
              <p style={{ color: 'var(--ink)', fontSize: '14px', maxWidth: '50ch', margin: '0 auto 16px' }}>
                {(questionsErrorObj as any)?.message || 'A network error occurred while contacting the MarkDriller server.'}
              </p>
              <button
                type="button"
                onClick={() => refetchQuestions()}
                className="btn-custom btn-custom-primary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                Retry Loading Questions ↻
              </button>
            </div>
          )
        ) : questionsData && questionsData.questions.length > 0 ? (

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Showing {questionsData.questions.length} of {questionsData.pagination.total} Questions
                {questionsFetching && (
                  <span style={{ fontSize: '11px', color: 'var(--rust)', fontStyle: 'italic' }}>
                    (updating...)
                  </span>
                )}
              </span>
              <span>
                Page {questionsData.pagination.page} of {questionsData.pagination.totalPages}
              </span>
            </div>

            {questionsData.questions.map((question) => (
              <QuestionCard
                key={question._id}
                question={question}
                isBookmarked={bookmarkedQuestionIds.has(question._id)}
                onToggleBookmark={handleToggleBookmark}
                isBookmarkPending={toggleBookmark.isPending}
              />
            ))}

            {/* Pagination Controls */}
            {questionsData.pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
                {/* First Page Button */}
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => updateFilter('page', '1')}
                  className="btn-custom btn-custom-ghost"
                  title="First Page"
                  style={{ opacity: currentPage > 1 ? 1 : 0.4, padding: '6px 10px', fontSize: '12px' }}
                >
                  « First
                </button>

                {/* Previous Page Button */}
                <button
                  type="button"
                  disabled={!questionsData.pagination.hasPrevPage}
                  onClick={() => updateFilter('page', (currentPage - 1).toString())}
                  className="btn-custom btn-custom-ghost"
                  style={{ opacity: questionsData.pagination.hasPrevPage ? 1 : 0.4, padding: '6px 14px', fontSize: '13px' }}
                >
                  ← Previous
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, questionsData.pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  const total = questionsData.pagination.totalPages;
                  if (total <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= total - 2) {
                    pageNum = total - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => updateFilter('page', pageNum.toString())}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontFamily: "var(--font-sans)",
                        fontWeight: isActive ? 700 : 500,
                        backgroundColor: isActive ? 'var(--ink)' : 'var(--white)',
                        color: isActive ? 'var(--white)' : 'var(--ink)',
                        border: '1px solid rgba(20,24,28,0.2)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Page Button */}
                <button
                  type="button"
                  disabled={!questionsData.pagination.hasNextPage}
                  onClick={() => updateFilter('page', (currentPage + 1).toString())}
                  className="btn-custom btn-custom-ghost"
                  style={{ opacity: questionsData.pagination.hasNextPage ? 1 : 0.4, padding: '6px 14px', fontSize: '13px' }}
                >
                  Next →
                </button>

                {/* Last Page Button */}
                <button
                  type="button"
                  disabled={currentPage >= questionsData.pagination.totalPages}
                  onClick={() => updateFilter('page', questionsData.pagination.totalPages.toString())}
                  className="btn-custom btn-custom-ghost"
                  title="Last Page"
                  style={{ opacity: currentPage < questionsData.pagination.totalPages ? 1 : 0.4, padding: '6px 10px', fontSize: '12px' }}
                >
                  Last »
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              backgroundColor: 'var(--white)',
              borderRadius: '4px',
              border: '1.5px solid rgba(20,24,28,0.12)',
            }}
          >
            <h3 style={{ fontFamily: "var(--font-sans)", marginBottom: '8px' }}>No Questions Found</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '14px', maxWidth: '54ch', margin: '0 auto 20px' }}>
              {currentPage > 1
                ? `You are on page ${currentPage}, but there are no questions on this page.`
                : selectedExamId && selectedSubjectId
                ? 'No past questions are currently cached in the local database for this curriculum selection. You can synchronize authentic accredited past questions right now.'
                : 'We could not find any questions matching your active filters. Select an examination board and subject to browse or sync questions.'}
            </p>

            {selectedExamId && selectedSubjectId && (
              <div style={{ marginBottom: '24px' }}>
                <button
                  type="button"
                  disabled={acquireCurriculum.isPending}
                  onClick={async () => {
                    setSyncErrorMsg(null);
                    try {
                      const res = await acquireCurriculum.mutateAsync({
                        examId: selectedExamId,
                        subjectId: selectedSubjectId,
                        year: selectedYear ? Number(selectedYear) : undefined,
                      });
                      setSyncSuccessMsg(
                        `Successfully synchronized ${res.totalInserted} accredited questions for ${res.exam} ${res.subject}!`
                      );
                      refetchQuestions();
                    } catch (err: any) {
                      setSyncErrorMsg(err.message || 'Failed to synchronize questions from curriculum repository');
                    }
                  }}
                  className="btn-custom btn-custom-primary"
                  style={{
                    padding: '11px 24px',
                    fontSize: '14px',
                    backgroundColor: 'var(--rust)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: acquireCurriculum.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {acquireCurriculum.isPending
                    ? 'Connecting to accredited past questions feed...'
                    : '⚡ Sync Accredited Questions for this Subject'}
                </button>
                {syncErrorMsg && (
                  <p
                    style={{
                      color: '#c53030',
                      fontSize: '13px',
                      marginTop: '8px',
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    ⚠ {syncErrorMsg}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {currentPage > 1 && (
                <button
                  type="button"
                  onClick={() => updateFilter('page', '1')}
                  className="btn-custom btn-custom-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  ← Go to Page 1
                </button>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-custom btn-custom-ghost"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

