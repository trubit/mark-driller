import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import {
  useAdminOverviewQuery,
  useAdminUsersQuery,
  useToggleUserRoleMutation,
  useUpdateUserStatusMutation,
  useAdminCreateExamMutation,
  useAdminDeleteExamMutation,
  useAdminCreateSubjectMutation,
  useAdminDeleteSubjectMutation,
  useAdminCreateTopicMutation,
  useAdminDeleteTopicMutation,
  useAdminCreateQuestionMutation,
  useAdminDeleteQuestionMutation,
  useAdminIngestQuestionsMutation,
  useAdminQuestionSyncStatusQuery,
  useAdminTriggerQuestionSyncMutation,
  useAdminToggleQuestionSyncMutation,
  useAdminImportQuestionsMutation,
  AdminUserData,
} from '../api/admin.js';

import { useExamsQuery, useExamSubjectsQuery, useSubjectTopicsQuery, ExamItem, SubjectItem, TopicItem } from '../api/exams.js';
import { useQuestionsQuery, QuestionItem } from '../api/questions.js';
import {
  useStudyMaterialsQuery,
  useUploadMaterialMutation,
  useCreateMaterialMutation,
  useTogglePublishMaterialMutation,
  useDeleteMaterialMutation,
  StudyMaterialItem,
} from '../api/materials.js';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { BrandLoader } from './BrandLoader.js';
import { PortalHeader } from './PortalHeader.js';
import { SyllabusSubjectCard } from './SyllabusSubjectCard.js';

type AdminTab = 'OVERVIEW' | 'USERS' | 'CURRICULUM' | 'QUESTIONS' | 'MATERIALS';

export const AdminPortal: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

  // User tab state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Curriculum tab form state
  const [examName, setExamName] = useState('');
  const [examShortCode, setExamShortCode] = useState('');
  const [examCategory, setExamCategory] = useState<'NATIONAL' | 'REGIONAL' | 'PROFESSIONAL'>('NATIONAL');
  const [examSyllabusYear, setExamSyllabusYear] = useState('2025/2026');

  const [subjectExamId, setSubjectExamId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  const [topicSubjectId, setTopicSubjectId] = useState('');
  const [topicName, setTopicName] = useState('');
  const [curriculumExamId, setCurriculumExamId] = useState('');

  // Questions tab form state
  const [qExamId, setQExamId] = useState('');
  const [qSubjectId, setQSubjectId] = useState('');
  const [qTopicId, setQTopicId] = useState('');
  const [qYear, setQYear] = useState(2024);
  const [qNumber, setQNumber] = useState(1);
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');

  // Materials tab form state
  const [matFile, setMatFile] = useState<File | null>(null);
  const [matTitle, setMatTitle] = useState('');
  const [matDescription, setMatDescription] = useState('');
  const [matExamId, setMatExamId] = useState('');
  const [matSubjectId, setMatSubjectId] = useState('');
  const [matIsPremium, setMatIsPremium] = useState(false);

  // Internet Question Ingestion state
  const [ingestExamCode, setIngestExamCode] = useState('JAMB / UTME');
  const [ingestSubjectCode, setIngestSubjectCode] = useState('MTH');
  const [ingestYear, setIngestYear] = useState(2024);
  const [ingestNotice, setIngestNotice] = useState<string | null>(null);

  // File Dataset Import state
  const [fileImportContent, setFileImportContent] = useState('');
  const [fileImportType, setFileImportType] = useState<'csv' | 'json'>('json');
  const [fileImportNotice, setFileImportNotice] = useState<string | null>(null);

  // Queries
  const { data: overview, isLoading: overviewLoading } = useAdminOverviewQuery();
  const { data: usersData, isLoading: usersLoading } = useAdminUsersQuery({
    page,
    limit: 10,
    search: searchTerm,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });
  const { data: exams } = useExamsQuery();
  const effectiveCurriculumExamId = curriculumExamId || subjectExamId || exams?.[0]?._id || '';
  const { data: curriculumSubjects, isLoading: curriculumSubjectsLoading } = useExamSubjectsQuery(effectiveCurriculumExamId || undefined);
  const { data: qSubjects } = useExamSubjectsQuery(qExamId || undefined);
  const { data: qTopics } = useSubjectTopicsQuery(qSubjectId || undefined);
  const { data: matSubjects } = useExamSubjectsQuery(matExamId || undefined);
  const { data: questionsList } = useQuestionsQuery({ limit: 15 });
  const { data: materialsList } = useStudyMaterialsQuery();
  const { data: syncStatusData } = useAdminQuestionSyncStatusQuery();

  // Mutations
  const toggleRoleMutation = useToggleUserRoleMutation();
  const updateStatusMutation = useUpdateUserStatusMutation();
  const createExamMutation = useAdminCreateExamMutation();
  const deleteExamMutation = useAdminDeleteExamMutation();
  const createSubjectMutation = useAdminCreateSubjectMutation();
  const deleteSubjectMutation = useAdminDeleteSubjectMutation();
  const createTopicMutation = useAdminCreateTopicMutation();
  const deleteTopicMutation = useAdminDeleteTopicMutation();
  const createQuestionMutation = useAdminCreateQuestionMutation();
  const deleteQuestionMutation = useAdminDeleteQuestionMutation();
  const ingestQuestionsMutation = useAdminIngestQuestionsMutation();
  const triggerSyncMutation = useAdminTriggerQuestionSyncMutation();
  const toggleSyncMutation = useAdminToggleQuestionSyncMutation();
  const importQuestionsMutation = useAdminImportQuestionsMutation();
  const uploadMaterialMutation = useUploadMaterialMutation();
  const createMaterialMutation = useCreateMaterialMutation();
  const togglePublishMutation = useTogglePublishMaterialMutation();
  const deleteMaterialMutation = useDeleteMaterialMutation();
  const { notifySuccess, notifyError, confirmAction } = useNotificationStore();

  const showNotice = (type: 'success' | 'error', text: string) => {
    setActionNotice({ type, text });
    if (type === 'success') {
      notifySuccess(text);
    } else {
      notifyError(text);
    }
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleIngestQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngestNotice(null);
    try {
      const res = await ingestQuestionsMutation.mutateAsync({
        examShortCode: ingestExamCode,
        subjectCode: ingestSubjectCode,
        year: ingestYear,
        count: 20,
      });
      setIngestNotice(`✓ ${res.message}`);
      showNotice('success', res.message);
    } catch (err: any) {
      const msg = err.message || 'Ingestion failed';
      setIngestNotice(`⚠ Ingestion failed: ${msg}`);
      showNotice('error', msg);
    }
  };

  const handleTriggerFullSync = async () => {
    try {
      const res = await triggerSyncMutation.mutateAsync();
      showNotice(res.success ? 'success' : 'error', res.message);
    } catch (err: any) {
      showNotice('error', err.message || 'Manual synchronization failed');
    }
  };

  const handleToggleAutoSync = async (enable: boolean) => {
    try {
      const res = await toggleSyncMutation.mutateAsync(enable);
      showNotice('success', res.message);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to toggle synchronization');
    }
  };

  const handleFileImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileImportContent.trim()) return;
    setFileImportNotice(null);
    try {
      const res = await importQuestionsMutation.mutateAsync({
        fileContent: fileImportContent,
        fileType: fileImportType,
        defaultExam: ingestExamCode,
        defaultSubject: ingestSubjectCode,
      });
      setFileImportNotice(`✓ ${res.message}`);
      showNotice('success', res.message);
      setFileImportContent('');
    } catch (err: any) {
      const msg = err.message || 'Dataset import failed';
      setFileImportNotice(`⚠ Import failed: ${msg}`);
      showNotice('error', msg);
    }
  };


  if (!user || user.role !== 'ADMIN') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '460px', background: 'var(--white)', border: '2px solid var(--ink)', padding: '36px', boxShadow: '4px 4px 0 var(--ink)' }}>
          <div style={{ color: 'var(--rust)', fontSize: '32px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', margin: '0 0 12px' }}>Administrator Access Required</h2>
          <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            This portal is strictly restricted to verified MarkDriller academic staff. Your account does not have administrative privileges.
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Return to Student Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Action Handlers
  const handleToggleRole = async (targetUserId: string, targetUserName: string) => {
    try {
      const res = await toggleRoleMutation.mutateAsync(targetUserId);
      showNotice('success', `Role for ${targetUserName} changed to ${res.role}.`);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update user role.');
    }
  };

  const handleToggleStatus = async (targetUserId: string, currentStatus: string, targetUserName: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateStatusMutation.mutateAsync({ userId: targetUserId, status: nextStatus as any });
      showNotice('success', `Account for ${targetUserName} set to ${nextStatus}.`);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update user status.');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExamMutation.mutateAsync({
        name: examName.trim(),
        shortCode: examShortCode.trim().toUpperCase(),
        category: examCategory,
        syllabusYear: examSyllabusYear.trim(),
      });
      showNotice('success', `Examination board "${examShortCode}" created successfully.`);
      setExamName('');
      setExamShortCode('');
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to create examination.');
    }
  };

  const handleDeleteExam = (examId: string, shortCode: string) => {
    confirmAction({
      title: 'Delete Examination Board',
      message: `Are you sure you want to delete examination board "${shortCode}" and its associated curriculum?`,
      confirmLabel: 'Delete Examination',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteExamMutation.mutateAsync(examId);
          showNotice('success', `Examination board "${shortCode}" deleted.`);
        } catch (err: any) {
          showNotice('error', err.message || 'Failed to delete examination.');
        }
      },
    });
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectExamId) {
      showNotice('error', 'Please select an examination board.');
      return;
    }
    try {
      await createSubjectMutation.mutateAsync({
        examId: subjectExamId,
        name: subjectName.trim(),
        code: subjectCode.trim().toUpperCase(),
      });
      showNotice('success', `Subject "${subjectName}" created successfully.`);
      setSubjectName('');
      setSubjectCode('');
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to create subject.');
    }
  };

  const handleDeleteSubject = (subjectId: string, name: string) => {
    confirmAction({
      title: 'Delete Curriculum Subject',
      message: `Are you sure you want to delete subject "${name}" and its syllabus topics?`,
      confirmLabel: 'Delete Subject',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteSubjectMutation.mutateAsync(subjectId);
          showNotice('success', `Subject "${name}" deleted.`);
        } catch (err: any) {
          showNotice('error', err.message || 'Failed to delete subject.');
        }
      },
    });
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicSubjectId) {
      showNotice('error', 'Please select a subject.');
      return;
    }
    try {
      await createTopicMutation.mutateAsync({
        subjectId: topicSubjectId,
        name: topicName.trim(),
      });
      showNotice('success', `Topic "${topicName}" created.`);
      setTopicName('');
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to create topic.');
    }
  };

  const handleDeleteTopic = (topicId: string, title: string) => {
    confirmAction({
      title: 'Delete Syllabus Topic',
      message: `Are you sure you want to delete topic "${title}"? This cannot be undone.`,
      confirmLabel: 'Delete Topic',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteTopicMutation.mutateAsync(topicId);
          showNotice('success', `Topic "${title}" deleted.`);
        } catch (err: any) {
          showNotice('error', err.message || 'Failed to delete topic');
        }
      },
    });
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qExamId || !qSubjectId) {
      showNotice('error', 'Please select both Exam Board and Subject.');
      return;
    }
    try {
      await createQuestionMutation.mutateAsync({
        examId: qExamId,
        subjectId: qSubjectId,
        topicId: qTopicId || undefined,
        year: qYear,
        questionNumber: qNumber,
        questionText: qText.trim(),
        optionA: qOptA.trim(),
        optionB: qOptB.trim(),
        optionC: qOptC.trim(),
        optionD: qOptD.trim(),
        correctAnswer: qCorrect,
        explanation: qExplanation.trim(),
        difficulty: qDifficulty,
        published: true,
      });
      showNotice('success', `Question #${qNumber} added to Question Bank!`);
      setQText('');
      setQOptA('');
      setQOptB('');
      setQOptC('');
      setQOptD('');
      setQExplanation('');
      setQNumber((n) => n + 1);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to create question.');
    }
  };

  const handleDeleteQuestion = (qId: string, qNum: number) => {
    confirmAction({
      title: 'Delete Question',
      message: `Are you sure you want to delete question #${qNum}? This question will no longer be served in CBT simulations.`,
      confirmLabel: 'Delete Question',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteQuestionMutation.mutateAsync(qId);
          showNotice('success', `Question #${qNum} removed.`);
        } catch (err: any) {
          showNotice('error', err.message || 'Failed to delete question.');
        }
      },
    });
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matFile || !matExamId || !matSubjectId || !matTitle.trim()) {
      showNotice('error', 'Please select a valid PDF file, Exam, Subject, and provide a title.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', matFile);

      const uploaded = await uploadMaterialMutation.mutateAsync(formData);

      await createMaterialMutation.mutateAsync({
        examId: matExamId,
        subjectId: matSubjectId,
        title: matTitle.trim(),
        description: matDescription.trim(),
        storageFilename: uploaded.storageFilename,
        originalFilename: uploaded.originalFilename,
        fileSize: uploaded.fileSize,
        isPublished: true,
        isPremium: matIsPremium,
      });

      showNotice('success', `Study material "${matTitle}" uploaded and published!`);
      setMatTitle('');
      setMatDescription('');
      setMatFile(null);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to upload study material.');
    }
  };

  const handleTogglePublishMaterial = async (matId: string, title: string) => {
    try {
      const res = await togglePublishMutation.mutateAsync(matId);
      showNotice('success', `"${title}" is now ${res.data?.isPublished ? 'published' : 'unpublished'}.`);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to toggle publication status.');
    }
  };

  const handleDeleteMaterial = (matId: string, title: string) => {
    confirmAction({
      title: 'Delete Study Material',
      message: `Are you sure you want to delete study material "${title}"? Students will no longer be able to download this revision pack.`,
      confirmLabel: 'Delete Study Material',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteMaterialMutation.mutateAsync(matId);
          showNotice('success', `Study material "${title}" deleted.`);
        } catch (err: any) {
          showNotice('error', err.message || 'Failed to delete study material.');
        }
      },
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Responsive Unified Header */}
      <PortalHeader badge="ADMIN" badgeColor="ink" activePath="/admin" />

      {/* Main Admin Content */}
      <main className="wrap" style={{ flex: 1, padding: 'clamp(20px, 4vw, 36px) clamp(16px, 3vw, 24px) 60px', boxSizing: 'border-box', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Banner Title */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--rust)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            Platform Control Center
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 4vw, 32px)', margin: '0 0 8px', color: 'var(--ink)' }}>
            Administrative Governance & Operations
          </h1>
          <p style={{ color: 'var(--slate)', fontSize: '15px', margin: 0 }}>
            Unified system oversight: live metrics, user permissions, syllabus curriculum, and question bank management.
          </p>
        </div>

        {/* Global Action Notices */}
        {actionNotice && (
          <div
            style={{
              padding: '12px 16px',
              background: actionNotice.type === 'success' ? '#eaf4ee' : '#fdf0ed',
              border: `1px solid ${actionNotice.type === 'success' ? 'var(--forest)' : 'var(--rust)'}`,
              color: actionNotice.type === 'success' ? 'var(--forest)' : 'var(--rust)',
              fontSize: '13px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{actionNotice.type === 'success' ? '✓' : '⚠'} {actionNotice.text}</span>
            <button onClick={() => setActionNotice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--ink)', marginBottom: '32px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
          {(['OVERVIEW', 'USERS', 'CURRICULUM', 'QUESTIONS', 'MATERIALS'] as AdminTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 18px',
                border: '1.5px solid var(--ink)',
                borderBottom: activeTab === tab ? 'none' : '1.5px solid var(--ink)',
                background: activeTab === tab ? 'var(--ink)' : 'var(--white)',
                color: activeTab === tab ? 'var(--white)' : 'var(--ink)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: activeTab === tab ? '-2px' : '0',
                transition: 'all 0.15s ease',
              }}
            >
              {tab === 'OVERVIEW' ? 'Telemetry' : tab === 'USERS' ? 'User Directory' : tab === 'CURRICULUM' ? 'Curriculum' : tab === 'QUESTIONS' ? 'Question Bank' : 'Study Materials'}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div>
            {overviewLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>Loading telemetry...</div>
            ) : overview ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '36px', alignItems: 'start' }}>
                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--slate)', textTransform: 'uppercase' }}>Total Users</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: 'var(--ink)', margin: '6px 0 2px' }}>{overview.totalUsers}</div>
                    <div style={{ fontSize: '11px', color: 'var(--forest)' }}>{overview.totalStudents} Students • {overview.totalAdmins} Admins</div>
                  </div>

                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--slate)', textTransform: 'uppercase' }}>Questions in Bank</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: 'var(--ink)', margin: '6px 0 2px' }}>{overview.totalQuestions}</div>
                    <div style={{ fontSize: '11px', color: 'var(--slate)' }}>{overview.totalPublishedQuestions} Published</div>
                  </div>

                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--slate)', textTransform: 'uppercase' }}>CBT Mocks Logged</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: 'var(--rust)', margin: '6px 0 2px' }}>{overview.totalAttempts}</div>
                    <div style={{ fontSize: '11px', color: 'var(--slate)' }}>Server-timed sessions</div>
                  </div>

                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--slate)', textTransform: 'uppercase' }}>Pro Subscriptions</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: 'var(--forest)', margin: '6px 0 2px' }}>{overview.activePaidSubscriptions}</div>
                    <div style={{ fontSize: '11px', color: 'var(--slate)' }}>Active candidate tiers</div>
                  </div>

                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--slate)', textTransform: 'uppercase' }}>Total Revenue</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: 'var(--ink)', margin: '6px 0 2px' }}>₦{overview.totalRevenueNGN.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--forest)' }}>{overview.successfulPayments} verified payments</div>
                  </div>

                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--slate)', textTransform: 'uppercase' }}>Curriculum Entities</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: 'var(--ink)', margin: '6px 0 2px' }}>{overview.totalExams} Boards</div>
                    <div style={{ fontSize: '11px', color: 'var(--slate)' }}>{overview.totalSubjects} Subjects • {overview.totalTopics} Topics</div>
                  </div>
                </div>

                {/* Recent Users List */}
                <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', margin: '0 0 16px' }}>Recently Registered Accounts</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'var(--cream)', borderBottom: '1.5px solid var(--ink)', textAlign: 'left' }}>
                          <th style={{ padding: '10px' }}>Name</th>
                          <th style={{ padding: '10px' }}>Email</th>
                          <th style={{ padding: '10px' }}>Role</th>
                          <th style={{ padding: '10px' }}>Verified</th>
                          <th style={{ padding: '10px' }}>Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.recentUsers.map((u) => (
                          <tr key={u._id} style={{ borderBottom: '1px solid var(--cream-deep)' }}>
                            <td style={{ padding: '10px', fontWeight: 600 }}>{u.fullName}</td>
                            <td style={{ padding: '10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{u.email}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ padding: '2px 8px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", background: u.role === 'ADMIN' ? '#14181c' : '#eaf4ee', color: u.role === 'ADMIN' ? '#fff' : 'var(--forest)' }}>
                                {u.role}
                              </span>
                            </td>
                            <td style={{ padding: '10px', color: u.isVerified ? 'var(--forest)' : 'var(--rust)', fontWeight: 600 }}>
                              {u.isVerified ? '✓ Verified' : 'Pending OTP'}
                            </td>
                            <td style={{ padding: '10px', color: 'var(--slate)', fontSize: '12px' }}>
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 2: USERS DIRECTORY */}
        {activeTab === 'USERS' && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', margin: '0 0 4px' }}>User Directory & Access Controls</h2>
                <p style={{ color: 'var(--slate)', fontSize: '13px', margin: 0 }}>
                  Search users, toggle administrative roles, and activate or suspend candidate access.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  style={{ padding: '8px 12px', border: '1px solid var(--ink)', fontSize: '13px', minWidth: '200px' }}
                />
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                  style={{ padding: '8px 12px', border: '1px solid var(--ink)', fontSize: '13px', background: 'var(--white)' }}
                >
                  <option value="">All Roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="ADMIN">Administrators</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  style={{ padding: '8px 12px', border: '1px solid var(--ink)', fontSize: '13px', background: 'var(--white)' }}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            {usersLoading ? (
              <div style={{ padding: '36px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>Loading users...</div>
            ) : usersData?.users && usersData.users.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--cream)', borderBottom: '2px solid var(--ink)', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Candidate / Account</th>
                      <th style={{ padding: '12px' }}>Role</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Verification</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.users.map((u: AdminUserData) => {
                      const isCurrentUser = u._id === user._id;
                      return (
                        <tr key={u._id} style={{ borderBottom: '1px solid var(--cream-deep)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--slate)', fontFamily: "'JetBrains Mono', monospace" }}>{u.email}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, background: u.role === 'ADMIN' ? '#14181c' : '#eaf4ee', color: u.role === 'ADMIN' ? '#fff' : 'var(--forest)' }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", background: u.accountStatus === 'ACTIVE' ? '#eaf4ee' : '#fdf0ed', color: u.accountStatus === 'ACTIVE' ? 'var(--forest)' : 'var(--rust)' }}>
                              {u.accountStatus}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '12px', color: u.isVerified ? 'var(--forest)' : 'var(--rust)' }}>
                            {u.isVerified ? '✓ Verified' : 'Unverified'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {isCurrentUser ? (
                              <span style={{ fontSize: '11px', color: 'var(--slate)', fontStyle: 'italic' }}>Your Account</span>
                            ) : (
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleToggleRole(u._id, u.fullName)}
                                  disabled={toggleRoleMutation.isPending}
                                  style={{ padding: '4px 8px', border: '1px solid var(--ink)', background: 'var(--white)', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer' }}
                                >
                                  {u.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(u._id, u.accountStatus, u.fullName)}
                                  disabled={updateStatusMutation.isPending}
                                  style={{ padding: '4px 8px', border: '1px solid var(--ink)', background: u.accountStatus === 'ACTIVE' ? '#fdf0ed' : '#eaf4ee', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer' }}
                                >
                                  {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--slate)' }}>No accounts found.</div>
            )}
          </div>
        )}

        {/* TAB 3: CURRICULUM MANAGEMENT */}
        {activeTab === 'CURRICULUM' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px', alignItems: 'start' }}>
            {/* Create Exam Form */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', margin: '0 0 16px' }}>Create Examination Board</h3>
              <form onSubmit={handleCreateExam}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Exam Full Name</label>
                  <input type="text" required value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. Post-UTME Screening Drills" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Short Code (Acronym)</label>
                  <input type="text" required value={examShortCode} onChange={(e) => setExamShortCode(e.target.value)} placeholder="e.g. POST-UTME" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Exam Category</label>
                  <select value={examCategory} onChange={(e) => setExamCategory(e.target.value as any)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                    <option value="NATIONAL">National Examination</option>
                    <option value="REGIONAL">Regional Examination</option>
                    <option value="PROFESSIONAL">Professional Screening</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Syllabus Session</label>
                  <input type="text" required value={examSyllabusYear} onChange={(e) => setExamSyllabusYear(e.target.value)} placeholder="2025/2026" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <button type="submit" disabled={createExamMutation.isPending} style={{ width: '100%', padding: '10px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  {createExamMutation.isPending ? 'Saving...' : 'Add Examination Board +'}
                </button>
              </form>
            </div>

            {/* Create Subject Form */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', margin: '0 0 16px' }}>Add Subject</h3>
              <form onSubmit={handleCreateSubject}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Select Examination Board</label>
                  <select required value={subjectExamId} onChange={(e) => setSubjectExamId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                    <option value="">-- Choose Board --</option>
                    {exams?.map((e: ExamItem) => <option key={e._id} value={e._id}>{e.shortCode} — {e.name}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Subject Name</label>
                  <input type="text" required value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Further Mathematics" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Subject Code</label>
                  <input type="text" required value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} placeholder="e.g. FMTH" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <button type="submit" disabled={createSubjectMutation.isPending} style={{ width: '100%', padding: '10px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  {createSubjectMutation.isPending ? 'Saving...' : 'Add Subject +'}
                </button>
              </form>
            </div>

            {/* Create Topic Form */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', margin: '0 0 16px' }}>Add Syllabus Topic</h3>
              <form onSubmit={handleCreateTopic}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Select Subject</label>
                  <select required value={topicSubjectId} onChange={(e) => setTopicSubjectId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                    <option value="">-- Choose Subject --</option>
                    {curriculumSubjects?.map((s: SubjectItem) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Topic Title</label>
                  <input type="text" required value={topicName} onChange={(e) => setTopicName(e.target.value)} placeholder="e.g. Matrices & Transformations" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <button type="submit" disabled={createTopicMutation.isPending} style={{ width: '100%', padding: '10px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  {createTopicMutation.isPending ? 'Saving...' : 'Add Topic +'}
                </button>
              </form>
            </div>

            {/* List Existing Exams and Curriculum Structure */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)', gridColumn: '1 / -1' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', margin: '0 0 16px' }}>Accredited Examination Boards</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '16px', alignItems: 'start' }}>
                {exams?.map((exam: ExamItem) => (
                  <div key={exam._id} style={{ border: '1px solid var(--cream-deep)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{exam.shortCode}</div>
                      <div style={{ fontSize: '12px', color: 'var(--slate)' }}>{exam.name}</div>
                    </div>
                    <button onClick={() => handleDeleteExam(exam._id, exam.shortCode)} style={{ padding: '4px 8px', background: '#fdf0ed', border: '1px solid var(--rust)', color: 'var(--rust)', fontSize: '11px', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {/* Curriculum Subjects & Syllabus Accordion Section */}
              <div style={{ marginTop: '32px', borderTop: '1px solid var(--cream-deep)', paddingTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', margin: '0 0 4px', color: 'var(--ink)' }}>
                      Curriculum Subjects & Syllabus Structure
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--slate)' }}>
                      Inspect accredited subjects and expand syllabus topics independently without layout distortion.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="curriculum-exam-select" style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                      Board:
                    </label>
                    <select
                      id="curriculum-exam-select"
                      value={effectiveCurriculumExamId}
                      onChange={(e) => setCurriculumExamId(e.target.value)}
                      style={{ padding: '6px 12px', border: '1.5px solid var(--ink)', background: 'var(--white)', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}
                    >
                      {exams?.map((e: ExamItem) => (
                        <option key={e._id} value={e._id}>
                          {e.shortCode} — {e.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {curriculumSubjectsLoading ? (
                  <div style={{ padding: '32px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'var(--slate)' }}>
                    Loading syllabus curriculum...
                  </div>
                ) : curriculumSubjects && curriculumSubjects.length > 0 ? (
                  <div
                    className="syllabus-responsive-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
                      gap: '16px',
                      alignItems: 'start',
                    }}
                  >
                    {curriculumSubjects.map((subject: SubjectItem) => (
                      <SyllabusSubjectCard
                        key={subject._id}
                        subject={subject}
                        isAdmin={true}
                        onDeleteSubject={(id, name) => handleDeleteSubject(id, name)}
                        onDeleteTopic={(topicId, topicTitle) => handleDeleteTopic(topicId, topicTitle)}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', background: 'var(--cream)', border: '1px dashed var(--slate)', fontSize: '13px', color: 'var(--slate)' }}>
                    No subjects registered under this examination board yet. Use the "Add Subject" form above to create one.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: QUESTIONS MANAGEMENT */}
        {activeTab === 'QUESTIONS' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            {/* Dynamic Question Synchronization & Scheduled Ingestion Panel */}
            <div style={{ background: '#f5f7fa', border: '1.5px solid var(--steel-deep)', padding: '24px', borderRadius: '4px', boxShadow: '3px 3px 0 var(--steel-deep)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--steel)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                    ⚡ Dynamic Acquisition & Synchronization Engine
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', margin: '4px 0 0', color: 'var(--ink)' }}>
                    Automated Question Synchronization
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px',
                    background: syncStatusData?.enabled ? '#eaf4ee' : '#fdf0ed',
                    color: syncStatusData?.enabled ? 'var(--forest)' : 'var(--rust)',
                    padding: '4px 10px',
                    borderRadius: '2px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    border: `1px solid ${syncStatusData?.enabled ? 'var(--forest)' : 'var(--rust)'}`
                  }}>
                    {syncStatusData?.enabled ? '● SCHEDULER ACTIVE' : '○ SCHEDULER DISABLED'}
                  </span>
                  <button
                    type="button"
                    disabled={toggleSyncMutation.isPending}
                    onClick={() => handleToggleAutoSync(!syncStatusData?.enabled)}
                    style={{ padding: '4px 10px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', border: '1px solid var(--ink)', background: 'var(--white)' }}
                  >
                    {syncStatusData?.enabled ? 'Disable Auto-Sync' : 'Enable Auto-Sync'}
                  </button>
                </div>
              </div>

              {/* Status Telemetry Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px', background: 'var(--white)', padding: '16px', border: '1px solid var(--cream-deep)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--slate)', fontFamily: "'JetBrains Mono', monospace" }}>Sync Interval</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Every {syncStatusData?.intervalHours || 6} hours</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--slate)', fontFamily: "'JetBrains Mono', monospace" }}>Next Scheduled Run</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {syncStatusData?.nextRunAt ? new Date(syncStatusData.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Standby / Manual'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--slate)', fontFamily: "'JetBrains Mono', monospace" }}>Source API Configuration</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: syncStatusData?.sourceUrlConfigured ? 'var(--forest)' : 'var(--rust)' }}>
                    {syncStatusData?.sourceUrlConfigured ? '✓ Provider Configured' : '⚠ Using Authorized Import'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--slate)', fontFamily: "'JetBrains Mono', monospace" }}>Last Status</div>
                  <div style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink)' }}>
                    {syncStatusData?.lastRunStatus || 'No runs yet'}
                  </div>
                </div>
              </div>

              {ingestNotice && (
                <div style={{ padding: '12px 16px', background: ingestNotice.startsWith('✓') ? '#eaf4ee' : '#fdf0ed', border: `1px solid ${ingestNotice.startsWith('✓') ? 'var(--forest)' : 'var(--rust)'}`, color: ingestNotice.startsWith('✓') ? 'var(--forest)' : 'var(--rust)', fontSize: '13px', marginBottom: '16px' }}>
                  {ingestNotice}
                </div>
              )}

              {/* On-Demand Sync Form */}
              <form onSubmit={handleIngestQuestions} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', alignItems: 'flex-end', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Target Board</label>
                  <select value={ingestExamCode} onChange={(e) => setIngestExamCode(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)', background: 'var(--white)' }}>
                    <option value="JAMB / UTME">JAMB / UTME</option>
                    <option value="WAEC">WAEC</option>
                    <option value="NECO">NECO</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Target Subject</label>
                  <select value={ingestSubjectCode} onChange={(e) => setIngestSubjectCode(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)', background: 'var(--white)' }}>
                    <option value="MTH">Mathematics (MTH)</option>
                    <option value="ENG">Use of English (ENG)</option>
                    <option value="PHY">Physics (PHY)</option>
                    <option value="CHM">Chemistry (CHM)</option>
                    <option value="BIO">Biology (BIO)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Exam Year</label>
                  <select value={ingestYear} onChange={(e) => setIngestYear(parseInt(e.target.value, 10))} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)', background: 'var(--white)' }}>
                    <option value={2024}>2024</option>
                    <option value={2023}>2023</option>
                    <option value={2022}>2022</option>
                    <option value={2021}>2021</option>
                    <option value={2020}>2020</option>
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={ingestQuestionsMutation.isPending}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '8px 16px', background: 'var(--steel-deep)', borderColor: 'var(--steel-deep)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {ingestQuestionsMutation.isPending ? '⏳ Syncing...' : '📥 Sync Subject Now'}
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    disabled={triggerSyncMutation.isPending}
                    onClick={handleTriggerFullSync}
                    style={{ width: '100%', padding: '8px 16px', background: 'var(--ink)', border: '1px solid var(--ink)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}
                  >
                    {triggerSyncMutation.isPending ? '⏳ Running...' : '⚡ Full Cycle Sync'}
                  </button>
                </div>
              </form>

              {/* Secure Dataset Import Form */}
              <div style={{ borderTop: '1px solid var(--cream-deep)', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>
                  📁 Authorized Dataset File Ingestion (CSV / JSON)
                </div>
                {fileImportNotice && (
                  <div style={{ padding: '10px 14px', background: fileImportNotice.startsWith('✓') ? '#eaf4ee' : '#fdf0ed', border: `1px solid ${fileImportNotice.startsWith('✓') ? 'var(--forest)' : 'var(--rust)'}`, color: fileImportNotice.startsWith('✓') ? 'var(--forest)' : 'var(--rust)', fontSize: '12px', marginBottom: '12px' }}>
                    {fileImportNotice}
                  </div>
                )}
                <form onSubmit={handleFileImport}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>Format:</label>
                    <select value={fileImportType} onChange={(e) => setFileImportType(e.target.value as any)} style={{ padding: '4px 8px', border: '1px solid var(--ink)', fontSize: '11px' }}>
                      <option value="json">JSON Array</option>
                      <option value="csv">CSV (Headers: question, optionA, optionB, optionC, optionD, answer)</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={fileImportContent}
                    onChange={(e) => setFileImportContent(e.target.value)}
                    placeholder={fileImportType === 'json' ? '[ { "questionText": "...", "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...", "correctAnswer": "A", "year": 2024 } ]' : 'question,optionA,optionB,optionC,optionD,answer,year\n"What is 2+2?","1","2","3","4","D",2024'}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--ink)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', boxSizing: 'border-box', marginBottom: '10px' }}
                  />
                  <button
                    type="submit"
                    disabled={importQuestionsMutation.isPending}
                    style={{ padding: '6px 16px', background: 'var(--forest)', color: '#fff', border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {importQuestionsMutation.isPending ? '⏳ Importing & Validating...' : '⬆ Ingest Dataset into MongoDB'}
                  </button>
                </form>
              </div>

              {/* Recent Sync Telemetry Logs */}
              {syncStatusData?.recentLogs && syncStatusData.recentLogs.length > 0 && (
                <div style={{ borderTop: '1px solid var(--cream-deep)', marginTop: '20px', paddingTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                    📋 Recent Ingestion Telemetry Audit Log
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>
                      <thead>
                        <tr style={{ background: 'var(--cream-deep)', textAlign: 'left' }}>
                          <th style={{ padding: '6px' }}>Provider</th>
                          <th style={{ padding: '6px' }}>Trigger</th>
                          <th style={{ padding: '6px' }}>Timestamp</th>
                          <th style={{ padding: '6px' }}>Status</th>
                          <th style={{ padding: '6px' }}>Inserted</th>
                          <th style={{ padding: '6px' }}>Updated</th>
                          <th style={{ padding: '6px' }}>Skipped</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncStatusData.recentLogs.slice(0, 5).map((log: any) => (
                          <tr key={log._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '6px' }}>{log.sourceProvider}</td>
                            <td style={{ padding: '6px' }}>{log.trigger}</td>
                            <td style={{ padding: '6px' }}>{new Date(log.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                            <td style={{ padding: '6px', color: log.status === 'SUCCESS' ? 'var(--forest)' : log.status === 'FAILED' ? 'var(--rust)' : 'var(--ink)', fontWeight: 600 }}>
                              {log.status}
                            </td>
                            <td style={{ padding: '6px', color: 'var(--forest)' }}>+{log.totalInserted}</td>
                            <td style={{ padding: '6px' }}>{log.totalUpdated}</td>
                            <td style={{ padding: '6px', color: 'var(--slate)' }}>{log.totalSkipped}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>


            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', margin: '0 0 16px' }}>Create Past Question</h3>
              <form onSubmit={handleCreateQuestion}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Exam Board</label>
                    <select required value={qExamId} onChange={(e) => { setQExamId(e.target.value); setQSubjectId(''); }} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="">-- Choose Board --</option>
                      {exams?.map((e: ExamItem) => <option key={e._id} value={e._id}>{e.shortCode}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Subject</label>
                    <select required value={qSubjectId} onChange={(e) => setQSubjectId(e.target.value)} disabled={!qExamId} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="">-- Choose Subject --</option>
                      {qSubjects?.map((s: SubjectItem) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Syllabus Topic</label>
                    <select value={qTopicId} onChange={(e) => setQTopicId(e.target.value)} disabled={!qSubjectId} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="">-- General Topic --</option>
                      {qTopics?.map((t: TopicItem) => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Examination Year</label>
                    <input type="number" required value={qYear} onChange={(e) => setQYear(parseInt(e.target.value, 10))} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Question Number</label>
                    <input type="number" required value={qNumber} onChange={(e) => setQNumber(parseInt(e.target.value, 10))} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Question Text / Problem Statement</label>
                  <textarea required rows={3} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Type question problem statement..." style={{ width: '100%', padding: '10px', border: '1px solid var(--ink)', fontFamily: 'inherit' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Option A</label>
                    <input type="text" required value={qOptA} onChange={(e) => setQOptA(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Option B</label>
                    <input type="text" required value={qOptB} onChange={(e) => setQOptB(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Option C</label>
                    <input type="text" required value={qOptC} onChange={(e) => setQOptC(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Option D</label>
                    <input type="text" required value={qOptD} onChange={(e) => setQOptD(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Correct Answer Key</label>
                    <select value={qCorrect} onChange={(e) => setQCorrect(e.target.value as any)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Difficulty Level</label>
                    <select value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value as any)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Step-by-Step Worked Mathematical Solution</label>
                  <textarea rows={3} value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} placeholder="Detailed mathematical proof or syllabus explanation..." style={{ width: '100%', padding: '10px', border: '1px solid var(--ink)', fontFamily: 'inherit' }} />
                </div>

                <button type="submit" disabled={createQuestionMutation.isPending} style={{ padding: '12px 24px', background: 'var(--rust)', color: '#fff', border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  {createQuestionMutation.isPending ? 'Saving Question...' : 'Publish to Question Bank →'}
                </button>
              </form>
            </div>

            {/* List Questions */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', margin: '0 0 16px' }}>Question Bank Entries</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {questionsList?.questions.map((q: QuestionItem) => (
                  <div key={q._id} style={{ border: '1px solid var(--cream-deep)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--rust)', fontWeight: 700 }}>
                        {q.examId?.shortCode} • {q.subjectId?.name} • Year {q.year} (Q{q.questionNumber})
                      </span>
                      <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--ink)' }}>{q.questionText}</p>
                    </div>
                    <button onClick={() => handleDeleteQuestion(q._id, q.questionNumber)} style={{ padding: '4px 8px', background: '#fdf0ed', border: '1px solid var(--rust)', color: 'var(--rust)', fontSize: '11px', cursor: 'pointer', flexShrink: 0, marginLeft: '12px' }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STUDY MATERIALS */}
        {activeTab === 'MATERIALS' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px', alignItems: 'start' }}>
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', margin: '0 0 16px' }}>Upload Revision Guide (PDF Only)</h3>
              <form onSubmit={handleUploadMaterial}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Select Document (.pdf format strictly verified)</label>
                  <input type="file" required accept=".pdf" onChange={(e) => setMatFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Title</label>
                  <input type="text" required value={matTitle} onChange={(e) => setMatTitle(e.target.value)} placeholder="e.g. WAEC Mathematics Formula Booklet" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Description</label>
                  <input type="text" value={matDescription} onChange={(e) => setMatDescription(e.target.value)} placeholder="Comprehensive syllabus guide..." style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Exam</label>
                    <select required value={matExamId} onChange={(e) => setMatExamId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="">-- Select Exam --</option>
                      {exams?.map((e: ExamItem) => <option key={e._id} value={e._id}>{e.shortCode}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>Subject</label>
                    <select required value={matSubjectId} onChange={(e) => setMatSubjectId(e.target.value)} disabled={!matExamId} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="">-- Select Subject --</option>
                      {matSubjects?.map((s: SubjectItem) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="premiumCheck" checked={matIsPremium} onChange={(e) => setMatIsPremium(e.target.checked)} />
                  <label htmlFor="premiumCheck" style={{ fontSize: '13px', cursor: 'pointer' }}>
                    Require Active <strong>Pro Subscription</strong> to download
                  </label>
                </div>

                <button type="submit" disabled={uploadMaterialMutation.isPending || createMaterialMutation.isPending} style={{ width: '100%', padding: '12px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {uploadMaterialMutation.isPending || createMaterialMutation.isPending ? (
                    <BrandLoader mode="inline" size="sm" message="Validating & Uploading..." />
                  ) : (
                    'Upload & Publish Material →'
                  )}
                </button>
              </form>
            </div>

            {/* List Published Materials */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', margin: '0 0 16px' }}>Curated Study Materials</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {materialsList?.map((m: StudyMaterialItem) => (
                  <div key={m._id} style={{ border: '1px solid var(--cream-deep)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--ink)' }}>
                          {m.examId?.shortCode} • {m.subjectId?.code}
                        </span>
                        {m.isPremium && (
                          <span style={{ fontSize: '10px', background: 'var(--rust)', color: '#fff', padding: '1px 6px', fontWeight: 700, borderRadius: '2px' }}>PRO</span>
                        )}
                        <span
                          style={{
                            fontSize: '10px',
                            background: m.isPublished ? '#eaf4ee' : '#fff8f3',
                            color: m.isPublished ? 'var(--forest)' : 'var(--rust)',
                            border: `1px solid ${m.isPublished ? 'var(--forest)' : 'var(--rust)'}`,
                            padding: '1px 6px',
                            fontWeight: 600,
                            borderRadius: '2px',
                          }}
                        >
                          {m.isPublished ? 'PUBLISHED' : 'HIDDEN'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{m.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--slate)' }}>{m.downloadCount} downloads</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleTogglePublishMaterial(m._id, m.title)}
                        style={{
                          padding: '4px 8px',
                          background: m.isPublished ? '#f7f6f2' : '#eaf4ee',
                          border: '1px solid var(--ink)',
                          color: 'var(--ink)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        {m.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => handleDeleteMaterial(m._id, m.title)} style={{ padding: '4px 8px', background: '#fdf0ed', border: '1px solid var(--rust)', color: 'var(--rust)', fontSize: '11px', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
