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
  useAdminUpdateQuestionMutation,
  useAdminDeleteQuestionMutation,
  useAdminIngestQuestionsMutation,
  useAdminQuestionSyncStatusQuery,
  useAdminTriggerQuestionSyncMutation,
  useAdminToggleQuestionSyncMutation,
  useAdminImportQuestionsMutation,
  useAdminManualPaymentProofsQuery,
  useAdminApproveManualPaymentMutation,
  useAdminRejectManualPaymentMutation,
  useAdminBankDetailsQuery,
  useAdminUpdateBankDetailsMutation,
  useAdminInstitutionsQuery,
  useAdminCreateInstitutionMutation,
  useAdminDeleteInstitutionMutation,
  useAdminBlogQuery,
  useAdminCreateBlogMutation,
  useAdminDeleteBlogMutation,
  useAdminTestimonialsQuery,
  useAdminCreateTestimonialMutation,
  useAdminDeleteTestimonialMutation,
  useAdminVideosQuery,
  useAdminCreateVideoMutation,
  useAdminDeleteVideoMutation,
  useAdminSubscriptionsQuery,
  useAdminPaymentsDirectoryQuery,
  useAdminMediaQuery,
  AdminUserData,
  AdminManualPaymentItem,
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
import { SyllabusSubjectCard } from './SyllabusSubjectCard.js';
import { SafeImage } from './SafeImage.js';
import {
  useAdminSupportSettingsQuery,
  useUpdateAdminSupportSettingsMutation,
  type SupportContactInfo,
} from '../api/supportContact.js';
import {
  useAdminSupportTicketsQuery,
  useUpdateAdminSupportTicketMutation,
  useResendSupportTicketEmailMutation,
  type AdminSupportTicketItem,
} from '../api/support.js';

type AdminTab =
  | 'OVERVIEW'
  | 'USERS'
  | 'CURRICULUM'
  | 'QUESTIONS'
  | 'MATERIALS'
  | 'PAYMENTS'
  | 'CONTENT'
  | 'SUBSCRIPTIONS'
  | 'TICKETS'
  | 'SETTINGS';

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

  // Questions filter & search state (Req 41, 49)
  const [qSearchTerm, setQSearchTerm] = useState('');
  const [qFilterExamId, setQFilterExamId] = useState('');
  const [qFilterDifficulty, setQFilterDifficulty] = useState('');
  const [qFilterYear, setQFilterYear] = useState('');
  const [qPage, setQPage] = useState(1);

  // Question editing modal state (Req 41, 46, 47, 48)
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [editQText, setEditQText] = useState('');
  const [editQOptA, setEditQOptA] = useState('');
  const [editQOptB, setEditQOptB] = useState('');
  const [editQOptC, setEditQOptC] = useState('');
  const [editQOptD, setEditQOptD] = useState('');
  const [editQCorrect, setEditQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [editQDifficulty, setEditQDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [editQExplanation, setEditQExplanation] = useState('');

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

  // Manual Payment Verification State
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'PENDING_REVIEW' | 'SUCCESS' | 'REJECTED' | ''>('PENDING_REVIEW');
  const [paymentPage, setPaymentPage] = useState(1);
  const [viewProofModalUrl, setViewProofModalUrl] = useState<string | null>(null);
  const [rejectDialogPayment, setRejectDialogPayment] = useState<AdminManualPaymentItem | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Dynamic Physical Bank Account State
  const { data: currentBankDetails, isLoading: bankDetailsLoading } = useAdminBankDetailsQuery();
  const updateBankDetailsMutation = useAdminUpdateBankDetailsMutation();
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    currency: 'NGN',
    instructions: '',
  });
  React.useEffect(() => {
    if (currentBankDetails) {
      setBankForm({
        bankName: currentBankDetails.bankName || '',
        accountName: currentBankDetails.accountName || '',
        accountNumber: currentBankDetails.accountNumber || '',
        currency: currentBankDetails.currency || 'NGN',
        instructions: currentBankDetails.instructions || '',
      });
    }
  }, [currentBankDetails]);

  // Dynamic Customer Support Channels State
  const { data: currentSupportSettings, isLoading: supportSettingsLoading } = useAdminSupportSettingsQuery();
  const updateSupportSettingsMutation = useUpdateAdminSupportSettingsMutation();
  const [supportForm, setSupportForm] = useState<SupportContactInfo>({
    whatsappNumber: '2348030001234',
    whatsappDisplay: '+234 803 000 1234',
    whatsappEnabled: true,
    phone: '+2348030001234',
    phoneDisplay: '+234 803 000 1234',
    phoneEnabled: true,
    email: 'support@markdriller.com',
    emailDisplay: 'support@markdriller.com',
    emailEnabled: true,
    workingHours: 'Mon – Sat: 8:00 AM – 8:00 PM WAT',
  });

  React.useEffect(() => {
    if (currentSupportSettings) {
      setSupportForm({
        whatsappNumber: currentSupportSettings.whatsappNumber || '',
        whatsappDisplay: currentSupportSettings.whatsappDisplay || '',
        whatsappEnabled: currentSupportSettings.whatsappEnabled !== false,
        phone: currentSupportSettings.phone || '',
        phoneDisplay: currentSupportSettings.phoneDisplay || '',
        phoneEnabled: currentSupportSettings.phoneEnabled !== false,
        email: currentSupportSettings.email || '',
        emailDisplay: currentSupportSettings.emailDisplay || '',
        emailEnabled: currentSupportSettings.emailEnabled !== false,
        workingHours: currentSupportSettings.workingHours || 'Mon – Sat: 8:00 AM – 8:00 PM WAT',
      });
    }
  }, [currentSupportSettings]);

  const handleSaveSupportSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSupportSettingsMutation.mutateAsync(supportForm);
      setActionNotice({
        type: 'success',
        text: 'Customer support channels updated in MongoDB and deployed live across the platform.',
      });
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err?.message || 'Failed to update customer support settings.',
      });
    }
  };

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
  const { data: questionsList, isLoading: questionsLoading } = useQuestionsQuery({
    search: qSearchTerm || undefined,
    examId: qFilterExamId || undefined,
    difficulty: qFilterDifficulty || undefined,
    year: qFilterYear ? parseInt(qFilterYear, 10) : undefined,
    page: qPage,
    limit: 10,
  });
  const { data: materialsList } = useStudyMaterialsQuery();
  const { data: syncStatusData } = useAdminQuestionSyncStatusQuery();
  const { data: manualPaymentsData, isLoading: manualPaymentsLoading } = useAdminManualPaymentProofsQuery({
    status: paymentStatusFilter || undefined,
    page: paymentPage,
    limit: 10,
  });

  // Support Tickets Admin State
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketStatusFilter, setTicketStatusFilter] = useState('');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedTicketModal, setSelectedTicketModal] = useState<AdminSupportTicketItem | null>(null);
  const [ticketNotesInput, setTicketNotesInput] = useState('');
  const [ticketStatusInput, setTicketStatusInput] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('OPEN');
  const [ticketPriorityInput, setTicketPriorityInput] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  const { data: ticketsData, isLoading: ticketsLoading } = useAdminSupportTicketsQuery({
    page: ticketPage,
    limit: 10,
    status: ticketStatusFilter || undefined,
    category: ticketCategoryFilter || undefined,
    search: ticketSearch || undefined,
  });
  const updateTicketMutation = useUpdateAdminSupportTicketMutation();
  const resendTicketEmailMutation = useResendSupportTicketEmailMutation();

  const handleOpenTicketModal = (t: AdminSupportTicketItem) => {
    setSelectedTicketModal(t);
    setTicketNotesInput(t.adminNotes || '');
    setTicketStatusInput(t.status);
    setTicketPriorityInput(t.priority);
  };

  const handleSaveTicketUpdate = async () => {
    if (!selectedTicketModal) return;
    try {
      await updateTicketMutation.mutateAsync({
        ticketId: selectedTicketModal._id,
        status: ticketStatusInput,
        priority: ticketPriorityInput,
        adminNotes: ticketNotesInput,
      });
      showNotice('success', `Ticket ${selectedTicketModal.ticketReference} updated successfully.`);
      setSelectedTicketModal((prev) =>
        prev
          ? {
              ...prev,
              status: ticketStatusInput,
              priority: ticketPriorityInput,
              adminNotes: ticketNotesInput,
            }
          : null
      );
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to update ticket.');
    }
  };

  const handleResendTicketEmail = async (ticketId: string, ref: string) => {
    try {
      const res = await resendTicketEmailMutation.mutateAsync(ticketId);
      if (res.success) {
        showNotice('success', `Notification email for ${ref} resent successfully!`);
      } else {
        showNotice('error', `Failed to resend: ${res.message || 'Check email service'}`);
      }
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to resend email.');
    }
  };

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
  const updateQuestionMutation = useAdminUpdateQuestionMutation();
  const deleteQuestionMutation = useAdminDeleteQuestionMutation();
  const ingestQuestionsMutation = useAdminIngestQuestionsMutation();
  const triggerSyncMutation = useAdminTriggerQuestionSyncMutation();
  const toggleSyncMutation = useAdminToggleQuestionSyncMutation();
  const importQuestionsMutation = useAdminImportQuestionsMutation();
  const uploadMaterialMutation = useUploadMaterialMutation();
  const createMaterialMutation = useCreateMaterialMutation();
  const togglePublishMutation = useTogglePublishMaterialMutation();
  const deleteMaterialMutation = useDeleteMaterialMutation();
  const approveManualPaymentMutation = useAdminApproveManualPaymentMutation();
  const rejectManualPaymentMutation = useAdminRejectManualPaymentMutation();

  // Content & Subscriptions Admin State
  const [contentSubTab, setContentSubTab] = useState<'INSTITUTIONS' | 'BLOG' | 'TESTIMONIALS' | 'VIDEOS'>('INSTITUTIONS');
  const [instName, setInstName] = useState('');
  const [instCode, setInstCode] = useState('');
  const [instType, setInstType] = useState<'FEDERAL_UNI' | 'STATE_UNI' | 'PRIVATE_UNI' | 'POLYTECHNIC'>('FEDERAL_UNI');
  const [instState, setInstState] = useState('Lagos');
  const [instCutoff, setInstCutoff] = useState(200);

  const [blogTitle, setBlogTitle] = useState('');
  const [blogCat, setBlogCat] = useState<'JAMB_GUIDES' | 'WAEC_INSIGHTS' | 'POST_UTME' | 'STUDY_TECHNIQUES'>('JAMB_GUIDES');
  const [blogAuthor, setBlogAuthor] = useState('MarkDriller Editorial');
  const [blogSummary, setBlogSummary] = useState('');
  const [blogParagraph, setBlogParagraph] = useState('');

  const [testStudent, setTestStudent] = useState('');
  const [testExam, setTestExam] = useState('JAMB UTME 2026');
  const [testScore, setTestScore] = useState('320 / 400');
  const [testQuote, setTestQuote] = useState('');
  const [testUni, setTestUni] = useState('');

  const [videoTitle, setVideoTitle] = useState('');
  const [videoIdInput, setVideoIdInput] = useState('');
  const [videoDuration, setVideoDuration] = useState('20:00');
  const [videoIsPrem, setVideoIsPrem] = useState(false);

  // Queries for Content & Subscriptions
  const { data: institutionsData } = useAdminInstitutionsQuery({ limit: 50 });
  const { data: blogData } = useAdminBlogQuery({ limit: 50 });
  const { data: testimonialsData } = useAdminTestimonialsQuery();
  const { data: videosData } = useAdminVideosQuery();
  const { data: subscriptionsData } = useAdminSubscriptionsQuery({ limit: 50 });
  const { data: paymentsDirectoryData } = useAdminPaymentsDirectoryQuery({ limit: 50 });
  const { data: mediaData } = useAdminMediaQuery();

  const createInstitutionMutation = useAdminCreateInstitutionMutation();
  const deleteInstitutionMutation = useAdminDeleteInstitutionMutation();
  const createBlogMutation = useAdminCreateBlogMutation();
  const deleteBlogMutation = useAdminDeleteBlogMutation();
  const createTestimonialMutation = useAdminCreateTestimonialMutation();
  const deleteTestimonialMutation = useAdminDeleteTestimonialMutation();
  const createVideoMutation = useAdminCreateVideoMutation();
  const deleteVideoMutation = useAdminDeleteVideoMutation();
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
        batchSize: 20,
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

  const handleUpdateBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName.trim() || !bankForm.accountName.trim() || !bankForm.accountNumber.trim()) {
      showNotice('error', 'Please provide the bank name, account holder name, and account number.');
      return;
    }
    try {
      await updateBankDetailsMutation.mutateAsync({
        bankName: bankForm.bankName.trim(),
        accountName: bankForm.accountName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        currency: bankForm.currency.trim() || 'NGN',
        instructions: bankForm.instructions.trim() || 'Use your registered MarkDriller email address as the payment narration or transfer remark.',
      });
      showNotice('success', 'Official receiving bank account updated successfully. New account details are immediately live for all students!');
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update physical bank account.');
    }
  };


  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="premium-portal-page premium-admin-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '460px', background: 'var(--white)', border: '2px solid var(--ink)', padding: '36px', boxShadow: '4px 4px 0 var(--ink)' }}>
          <div style={{ color: 'var(--rust)', fontSize: '32px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontFamily: "var(--font-sans)", fontSize: '24px', margin: '0 0 12px' }}>Administrator Access Required</h2>
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

  const handleOpenEditQuestion = (q: QuestionItem) => {
    setEditingQuestion(q);
    setEditQText(q.questionText);
    setEditQOptA(q.optionA);
    setEditQOptB(q.optionB);
    setEditQOptC(q.optionC);
    setEditQOptD(q.optionD);
    setEditQCorrect(q.correctAnswer);
    setEditQDifficulty(q.difficulty);
    setEditQExplanation(q.explanation || '');
  };

  const handleSaveEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    try {
      await updateQuestionMutation.mutateAsync({
        questionId: editingQuestion._id,
        payload: {
          questionText: editQText,
          optionA: editQOptA,
          optionB: editQOptB,
          optionC: editQOptC,
          optionD: editQOptD,
          correctAnswer: editQCorrect,
          difficulty: editQDifficulty,
          explanation: editQExplanation,
        },
      });

      showNotice('success', `Question #${editingQuestion.questionNumber} successfully updated.`);
      setEditingQuestion(null);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update question.');
    }
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

  const handleApprovePayment = (payment: AdminManualPaymentItem) => {
    confirmAction({
      title: 'Approve Bank Transfer',
      message: `Approve payment reference "${payment.reference}" for ${payment.userId?.fullName || 'Student'} (₦${(payment.amount ?? payment.amountKobo / 100).toLocaleString()})? This will immediately activate their Pro subscription.`,
      confirmLabel: 'Confirm & Activate Pro',
      cancelLabel: 'Cancel',
      isDestructive: false,
      onConfirm: async () => {
        try {
          const res = await approveManualPaymentMutation.mutateAsync({
            paymentId: payment._id,
            adminReviewNotes: `Verified manual transfer by admin ${user?.fullName || ''}`,
          });
          showNotice('success', res.message || 'Payment approved and subscription activated!');
        } catch (err: any) {
          showNotice('error', err.message || 'Failed to approve payment.');
        }
      },
    });
  };

  const handleConfirmReject = async () => {
    if (!rejectDialogPayment) return;
    if (!rejectReasonInput.trim()) {
      showNotice('error', 'Please provide a clear reason for rejecting this payment.');
      return;
    }
    try {
      const res = await rejectManualPaymentMutation.mutateAsync({
        paymentId: rejectDialogPayment._id,
        reviewNotes: rejectReasonInput.trim(),
      });
      showNotice('success', res.message || 'Payment rejected.');
      setRejectDialogPayment(null);
      setRejectReasonInput('');
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to reject payment.');
    }
  };

  const pendingPaymentsCount = manualPaymentsData?.payments?.filter((p) => p.status === 'PENDING_REVIEW').length || 0;

  return (
    <div className="premium-portal-page premium-admin-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Main Admin Content */}
      <main className="wrap" style={{ flex: 1, padding: 'clamp(20px, 4vw, 36px) clamp(16px, 3vw, 24px) 60px', boxSizing: 'border-box', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Banner Title */}
        <section className="premium-portal-hero" aria-labelledby="admin-title">
          <div className="premium-portal-hero-copy">
            <div className="eyebrow" style={{ fontFamily: "var(--font-sans)", fontSize: '12px', color: 'var(--rust)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              Platform Control Center
            </div>
            <h1 id="admin-title" style={{ fontFamily: "var(--font-sans)", fontSize: 'clamp(24px, 4vw, 32px)', margin: '0 0 8px', color: 'var(--ink)' }}>
              Administrative Governance &amp; Operations
            </h1>
            <p style={{ color: 'var(--slate)', fontSize: '15px', margin: 0 }}>
              Unified system oversight: live metrics, user permissions, syllabus curriculum, and question bank management.
            </p>
          </div>
          <div className="premium-portal-hero-media">
            <SafeImage
              src="/assets/images/admin-desk.jpg"
              alt="Education operations team reviewing platform reports and documents"
              loading="eager"
            />
            <div className="premium-portal-hero-stat">
              <span>Secure Operations</span>
              <strong>Review users, curriculum, content, payments, and audit trails from one workspace.</strong>
            </div>
          </div>
        </section>

        {/* Global Action Notices */}
        {actionNotice && (
          <div
            style={{
              padding: '12px 16px',
              background: actionNotice.type === 'success' ? 'var(--forest-soft)' : 'var(--rust-soft)',
              border: `1px solid ${actionNotice.type === 'success' ? 'var(--forest)' : 'var(--rust)'}`,
              color: actionNotice.type === 'success' ? 'var(--forest)' : 'var(--rust)',
              fontSize: '13px',
              borderRadius: '4px',
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
        <div className="admin-tab-bar" style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--ink)', marginBottom: '32px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
          {(['OVERVIEW', 'USERS', 'CURRICULUM', 'QUESTIONS', 'MATERIALS', 'PAYMENTS', 'CONTENT', 'SUBSCRIPTIONS', 'TICKETS', 'SETTINGS'] as AdminTab[]).map((tab) => (
            <button
              key={tab}
              className={`admin-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 18px',
                border: '1.5px solid var(--ink)',
                borderBottom: activeTab === tab ? 'none' : '1.5px solid var(--ink)',
                background: activeTab === tab ? 'var(--ink)' : 'var(--white)',
                color: activeTab === tab ? 'var(--white)' : 'var(--ink)',
                fontFamily: "var(--font-sans)",
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: activeTab === tab ? '-2px' : '0',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>
                {tab === 'OVERVIEW'
                  ? 'Telemetry'
                  : tab === 'USERS'
                  ? 'User Directory'
                  : tab === 'CURRICULUM'
                  ? 'Curriculum'
                  : tab === 'QUESTIONS'
                  ? 'Question Bank'
                  : tab === 'MATERIALS'
                  ? 'Study Materials'
                  : tab === 'PAYMENTS'
                  ? 'Finance & Transfers'
                  : tab === 'CONTENT'
                  ? 'Institutions & Editorial'
                  : tab === 'SUBSCRIPTIONS'
                  ? 'Subscriptions & Audit'
                  : tab === 'TICKETS'
                  ? 'Support Tickets'
                  : 'Customer Support & Channels'}
              </span>
              {tab === 'PAYMENTS' && pendingPaymentsCount > 0 && (
                <span
                  style={{
                    background: 'var(--rust)',
                    color: '#fff',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {pendingPaymentsCount}
                </span>
              )}
              {tab === 'TICKETS' && (ticketsData?.counts?.open ?? 0) > 0 && (
                <span
                  style={{
                    background: 'var(--rust)',
                    color: '#fff',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {ticketsData?.counts?.open}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div>
            {overviewLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', fontFamily: "var(--font-sans)" }}>Loading telemetry...</div>
            ) : overview ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '36px', alignItems: 'start' }}>
                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--slate)', textTransform: 'uppercase' }}>Total Users</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: '28px', color: 'var(--ink)', margin: '6px 0 2px' }}>{overview.totalUsers}</div>
                    <div style={{ fontSize: '11px', color: 'var(--forest)' }}>{overview.totalStudents} Students • {overview.totalAdmins} Admins</div>
                  </div>

                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--slate)', textTransform: 'uppercase' }}>Questions in Bank</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: '28px', color: 'var(--ink)', margin: '6px 0 2px' }}>{overview.totalQuestions}</div>
                    <div style={{ fontSize: '11px', color: 'var(--slate)' }}>{overview.totalPublishedQuestions} Published</div>
                  </div>

                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--slate)', textTransform: 'uppercase' }}>CBT Mocks Logged</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: '28px', color: 'var(--rust)', margin: '6px 0 2px' }}>{overview.totalAttempts}</div>
                    <div style={{ fontSize: '11px', color: 'var(--slate)' }}>Server-timed sessions</div>
                  </div>

                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--slate)', textTransform: 'uppercase' }}>Pro Subscriptions</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: '28px', color: 'var(--forest)', margin: '6px 0 2px' }}>{overview.activePaidSubscriptions}</div>
                    <div style={{ fontSize: '11px', color: 'var(--slate)' }}>Active candidate tiers</div>
                  </div>

                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--slate)', textTransform: 'uppercase' }}>Total Revenue</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: '28px', color: 'var(--ink)', margin: '6px 0 2px' }}>₦{overview.totalRevenueNGN.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--forest)' }}>{overview.successfulPayments} verified payments</div>
                  </div>

                  <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px', boxShadow: '3px 3px 0 var(--ink)' }}>
                    <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--slate)', textTransform: 'uppercase' }}>Curriculum Entities</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: '28px', color: 'var(--ink)', margin: '6px 0 2px' }}>{overview.totalExams} Boards</div>
                    <div style={{ fontSize: '11px', color: 'var(--slate)' }}>{overview.totalSubjects} Subjects • {overview.totalTopics} Topics</div>
                  </div>
                </div>

                {/* Recent Users List */}
                <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: '0 0 16px' }}>Recently Registered Accounts</h3>
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
                            <td style={{ padding: '10px', fontFamily: "var(--font-sans)", fontSize: '12px' }}>{u.email}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ padding: '2px 8px', fontSize: '11px', fontFamily: "var(--font-sans)", background: u.role === 'ADMIN' ? 'var(--ink)' : 'var(--forest-soft)', color: u.role === 'ADMIN' ? 'var(--white)' : 'var(--forest)', borderRadius: '2px' }}>
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
                <h2 style={{ fontFamily: "var(--font-sans)", fontSize: '20px', margin: '0 0 4px' }}>User Directory & Access Controls</h2>
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
              <div style={{ padding: '36px', textAlign: 'center', fontFamily: "var(--font-sans)" }}>Loading users...</div>
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
                            <div style={{ fontSize: '11px', color: 'var(--slate)', fontFamily: "var(--font-sans)" }}>{u.email}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '11px', fontFamily: "var(--font-sans)", fontWeight: 600, background: u.role === 'ADMIN' ? 'var(--ink)' : 'var(--forest-soft)', color: u.role === 'ADMIN' ? 'var(--white)' : 'var(--forest)' }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '11px', fontFamily: "var(--font-sans)", background: u.accountStatus === 'ACTIVE' ? 'var(--forest-soft)' : 'var(--rust-soft)', color: u.accountStatus === 'ACTIVE' ? 'var(--forest)' : 'var(--rust)' }}>
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
                                  style={{ padding: '4px 8px', border: '1px solid var(--ink)', background: 'var(--white)', color: 'var(--ink)', fontSize: '11px', fontFamily: "var(--font-sans)", cursor: 'pointer' }}
                                >
                                  {u.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(u._id, u.accountStatus, u.fullName)}
                                  disabled={updateStatusMutation.isPending}
                                  style={{ padding: '4px 8px', border: '1px solid var(--ink)', background: u.accountStatus === 'ACTIVE' ? 'var(--rust-soft)' : 'var(--forest-soft)', color: u.accountStatus === 'ACTIVE' ? 'var(--rust)' : 'var(--forest)', fontSize: '11px', fontFamily: "var(--font-sans)", cursor: 'pointer' }}
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
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: '0 0 16px' }}>Create Examination Board</h3>
              <form onSubmit={handleCreateExam}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Exam Full Name</label>
                  <input type="text" required value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. Post-UTME Screening Drills" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Short Code (Acronym)</label>
                  <input type="text" required value={examShortCode} onChange={(e) => setExamShortCode(e.target.value)} placeholder="e.g. POST-UTME" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Exam Category</label>
                  <select value={examCategory} onChange={(e) => setExamCategory(e.target.value as any)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                    <option value="NATIONAL">National Examination</option>
                    <option value="REGIONAL">Regional Examination</option>
                    <option value="PROFESSIONAL">Professional Screening</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Syllabus Session</label>
                  <input type="text" required value={examSyllabusYear} onChange={(e) => setExamSyllabusYear(e.target.value)} placeholder="2025/2026" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <button type="submit" disabled={createExamMutation.isPending} style={{ width: '100%', padding: '10px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: "var(--font-sans)", fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  {createExamMutation.isPending ? 'Saving...' : 'Add Examination Board +'}
                </button>
              </form>
            </div>

            {/* Create Subject Form */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: '0 0 16px' }}>Add Subject</h3>
              <form onSubmit={handleCreateSubject}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Select Examination Board</label>
                  <select required value={subjectExamId} onChange={(e) => setSubjectExamId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                    <option value="">-- Choose Board --</option>
                    {exams?.map((e: ExamItem) => <option key={e._id} value={e._id}>{e.shortCode} — {e.name}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Subject Name</label>
                  <input type="text" required value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Further Mathematics" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Subject Code</label>
                  <input type="text" required value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} placeholder="e.g. FMTH" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <button type="submit" disabled={createSubjectMutation.isPending} style={{ width: '100%', padding: '10px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: "var(--font-sans)", fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  {createSubjectMutation.isPending ? 'Saving...' : 'Add Subject +'}
                </button>
              </form>
            </div>

            {/* Create Topic Form */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: '0 0 16px' }}>Add Syllabus Topic</h3>
              <form onSubmit={handleCreateTopic}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Select Subject</label>
                  <select required value={topicSubjectId} onChange={(e) => setTopicSubjectId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                    <option value="">-- Choose Subject --</option>
                    {curriculumSubjects?.map((s: SubjectItem) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Topic Title</label>
                  <input type="text" required value={topicName} onChange={(e) => setTopicName(e.target.value)} placeholder="e.g. Matrices & Transformations" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <button type="submit" disabled={createTopicMutation.isPending} style={{ width: '100%', padding: '10px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: "var(--font-sans)", fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  {createTopicMutation.isPending ? 'Saving...' : 'Add Topic +'}
                </button>
              </form>
            </div>

            {/* List Existing Exams and Curriculum Structure */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)', gridColumn: '1 / -1' }}>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: '0 0 16px' }}>Accredited Examination Boards</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '16px', alignItems: 'start' }}>
                {exams?.map((exam: ExamItem) => (
                  <div key={exam._id} style={{ border: '1px solid var(--cream-deep)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{exam.shortCode}</div>
                      <div style={{ fontSize: '12px', color: 'var(--slate)' }}>{exam.name}</div>
                    </div>
                    <button onClick={() => handleDeleteExam(exam._id, exam.shortCode)} style={{ padding: '4px 8px', background: 'var(--rust-soft)', border: '1px solid var(--rust)', color: 'var(--rust)', fontSize: '11px', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {/* Curriculum Subjects & Syllabus Accordion Section */}
              <div style={{ marginTop: '32px', borderTop: '1px solid var(--cream-deep)', paddingTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '20px', margin: '0 0 4px', color: 'var(--ink)' }}>
                      Curriculum Subjects & Syllabus Structure
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--slate)' }}>
                      Inspect accredited subjects and expand syllabus topics independently without layout distortion.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="curriculum-exam-select" style={{ fontSize: '11px', fontFamily: "var(--font-sans)", fontWeight: 700 }}>
                      Board:
                    </label>
                    <select
                      id="curriculum-exam-select"
                      value={effectiveCurriculumExamId}
                      onChange={(e) => setCurriculumExamId(e.target.value)}
                      style={{ padding: '6px 12px', border: '1.5px solid var(--ink)', background: 'var(--white)', fontSize: '12px', fontFamily: "var(--font-sans)", fontWeight: 600 }}
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
                  <div style={{ padding: '32px', textAlign: 'center', fontFamily: "var(--font-sans)", fontSize: '13px', color: 'var(--slate)' }}>
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
            <div style={{ background: 'var(--paper)', border: '1.5px solid var(--steel-deep)', padding: '24px', borderRadius: '4px', boxShadow: '3px 3px 0 var(--steel-deep)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--steel)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                    ⚡ Dynamic Acquisition & Synchronization Engine
                  </div>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '20px', margin: '4px 0 0', color: 'var(--ink)' }}>
                    Automated Question Synchronization
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px',
                    background: syncStatusData?.enabled ? 'var(--forest-soft)' : 'var(--rust-soft)',
                    color: syncStatusData?.enabled ? 'var(--forest)' : 'var(--rust)',
                    padding: '4px 10px',
                    borderRadius: '2px',
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    border: `1px solid ${syncStatusData?.enabled ? 'var(--forest)' : 'var(--rust)'}`
                  }}>
                    {syncStatusData?.enabled ? '● SCHEDULER ACTIVE' : '○ SCHEDULER DISABLED'}
                  </span>
                  <button
                    type="button"
                    disabled={toggleSyncMutation.isPending}
                    onClick={() => handleToggleAutoSync(!syncStatusData?.enabled)}
                    style={{ padding: '4px 10px', fontSize: '11px', fontFamily: "var(--font-sans)", cursor: 'pointer', border: '1px solid var(--ink)', background: 'var(--white)' }}
                  >
                    {syncStatusData?.enabled ? 'Disable Auto-Sync' : 'Enable Auto-Sync'}
                  </button>
                </div>
              </div>

              {/* Status Telemetry Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px', background: 'var(--white)', padding: '16px', border: '1px solid var(--cream-deep)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--slate)', fontFamily: "var(--font-sans)" }}>Sync Interval</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Every {syncStatusData?.intervalHours || 6} hours</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--slate)', fontFamily: "var(--font-sans)" }}>Next Scheduled Run</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {syncStatusData?.nextRunAt ? new Date(syncStatusData.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Standby / Manual'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--slate)', fontFamily: "var(--font-sans)" }}>Source API Configuration</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: syncStatusData?.sourceUrlConfigured ? 'var(--forest)' : 'var(--rust)' }}>
                    {syncStatusData?.sourceUrlConfigured ? '✓ Provider Configured' : '⚠ Using Authorized Import'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--slate)', fontFamily: "var(--font-sans)" }}>Last Status</div>
                  <div style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                    {syncStatusData?.lastRunStatus || 'No runs yet'}
                  </div>
                </div>
              </div>

              {ingestNotice && (
                <div style={{ padding: '12px 16px', background: ingestNotice.startsWith('✓') ? 'var(--forest-soft)' : 'var(--rust-soft)', border: `1px solid ${ingestNotice.startsWith('✓') ? 'var(--forest)' : 'var(--rust)'}`, color: ingestNotice.startsWith('✓') ? 'var(--forest)' : 'var(--rust)', fontSize: '13px', marginBottom: '16px' }}>
                  {ingestNotice}
                </div>
              )}

              {/* On-Demand Sync Form */}
              <form onSubmit={handleIngestQuestions} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', alignItems: 'flex-end', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Target Board</label>
                  <select value={ingestExamCode} onChange={(e) => setIngestExamCode(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)', background: 'var(--white)' }}>
                    <option value="JAMB / UTME">JAMB / UTME</option>
                    <option value="WAEC">WAEC</option>
                    <option value="NECO">NECO</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Target Subject</label>
                  <select value={ingestSubjectCode} onChange={(e) => setIngestSubjectCode(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)', background: 'var(--white)' }}>
                    <option value="MTH">Mathematics (MTH)</option>
                    <option value="ENG">Use of English (ENG)</option>
                    <option value="PHY">Physics (PHY)</option>
                    <option value="CHM">Chemistry (CHM)</option>
                    <option value="BIO">Biology (BIO)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Exam Year</label>
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
                    style={{ width: '100%', padding: '8px 16px', background: 'var(--ink)', border: '1px solid var(--ink)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: "var(--font-sans)", fontSize: '12px' }}
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
                  <div style={{ padding: '10px 14px', background: fileImportNotice.startsWith('✓') ? 'var(--forest-soft)' : 'var(--rust-soft)', border: `1px solid ${fileImportNotice.startsWith('✓') ? 'var(--forest)' : 'var(--rust)'}`, color: fileImportNotice.startsWith('✓') ? 'var(--forest)' : 'var(--rust)', fontSize: '12px', marginBottom: '12px' }}>
                    {fileImportNotice}
                  </div>
                )}
                <form onSubmit={handleFileImport}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontFamily: "var(--font-sans)" }}>Format:</label>
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
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--ink)', fontFamily: "var(--font-sans)", fontSize: '11px', boxSizing: 'border-box', marginBottom: '10px' }}
                  />
                  <button
                    type="submit"
                    disabled={importQuestionsMutation.isPending}
                    style={{ padding: '6px 16px', background: 'var(--forest)', color: '#fff', border: 'none', fontFamily: "var(--font-sans)", fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
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
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: "var(--font-sans)" }}>
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
                          <tr key={log._id} style={{ borderBottom: '1px solid var(--paper-line)' }}>
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
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: '0 0 16px' }}>Create Past Question</h3>
              <form onSubmit={handleCreateQuestion}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Exam Board</label>
                    <select required value={qExamId} onChange={(e) => { setQExamId(e.target.value); setQSubjectId(''); }} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="">-- Choose Board --</option>
                      {exams?.map((e: ExamItem) => <option key={e._id} value={e._id}>{e.shortCode}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Subject</label>
                    <select required value={qSubjectId} onChange={(e) => setQSubjectId(e.target.value)} disabled={!qExamId} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="">-- Choose Subject --</option>
                      {qSubjects?.map((s: SubjectItem) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Syllabus Topic</label>
                    <select value={qTopicId} onChange={(e) => setQTopicId(e.target.value)} disabled={!qSubjectId} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="">-- General Topic --</option>
                      {qTopics?.map((t: TopicItem) => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Examination Year</label>
                    <input type="number" required value={qYear} onChange={(e) => setQYear(parseInt(e.target.value, 10))} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Question Number</label>
                    <input type="number" required value={qNumber} onChange={(e) => setQNumber(parseInt(e.target.value, 10))} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Question Text / Problem Statement</label>
                  <textarea required rows={3} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Type question problem statement..." style={{ width: '100%', padding: '10px', border: '1px solid var(--ink)', fontFamily: 'inherit' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Option A</label>
                    <input type="text" required value={qOptA} onChange={(e) => setQOptA(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Option B</label>
                    <input type="text" required value={qOptB} onChange={(e) => setQOptB(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Option C</label>
                    <input type="text" required value={qOptC} onChange={(e) => setQOptC(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Option D</label>
                    <input type="text" required value={qOptD} onChange={(e) => setQOptD(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Correct Answer Key</label>
                    <select value={qCorrect} onChange={(e) => setQCorrect(e.target.value as any)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Difficulty Level</label>
                    <select value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value as any)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Step-by-Step Worked Mathematical Solution</label>
                  <textarea rows={3} value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} placeholder="Detailed mathematical proof or syllabus explanation..." style={{ width: '100%', padding: '10px', border: '1px solid var(--ink)', fontFamily: 'inherit' }} />
                </div>

                <button type="submit" disabled={createQuestionMutation.isPending} style={{ padding: '12px 24px', background: 'var(--rust)', color: '#fff', border: 'none', fontFamily: "var(--font-sans)", fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  {createQuestionMutation.isPending ? 'Saving Question...' : 'Publish to Question Bank →'}
                </button>
              </form>
            </div>

            {/* List Questions with Search, Filter & Edit Modal (Req 41, 46-51) */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: 0 }}>
                  Question Bank Archive ({questionsList?.pagination?.total || 0} Total Entries)
                </h3>
              </div>

              {/* Filters Header (Req 49) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px', background: 'var(--paper)', padding: '12px', border: '1px solid var(--paper-line)', borderRadius: '4px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)', marginBottom: '3px' }}>Search Question</label>
                  <input
                    type="text"
                    value={qSearchTerm}
                    onChange={(e) => { setQSearchTerm(e.target.value); setQPage(1); }}
                    placeholder="Search keywords..."
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid var(--paper-line)', borderRadius: '3px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)', marginBottom: '3px' }}>Exam Board</label>
                  <select
                    value={qFilterExamId}
                    onChange={(e) => { setQFilterExamId(e.target.value); setQPage(1); }}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid var(--paper-line)', borderRadius: '3px' }}
                  >
                    <option value="">All Boards</option>
                    {exams?.map((e: ExamItem) => (
                      <option key={e._id} value={e._id}>{e.shortCode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)', marginBottom: '3px' }}>Difficulty</label>
                  <select
                    value={qFilterDifficulty}
                    onChange={(e) => { setQFilterDifficulty(e.target.value); setQPage(1); }}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid var(--paper-line)', borderRadius: '3px' }}
                  >
                    <option value="">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)', marginBottom: '3px' }}>Year</label>
                  <input
                    type="number"
                    value={qFilterYear}
                    onChange={(e) => { setQFilterYear(e.target.value); setQPage(1); }}
                    placeholder="e.g. 2024"
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid var(--paper-line)', borderRadius: '3px' }}
                  />
                </div>
              </div>

              {questionsLoading ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--ink-soft)' }}>
                  Loading question bank entries...
                </div>
              ) : questionsList?.questions && questionsList.questions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {questionsList.questions.map((q: QuestionItem) => (
                    <div key={q._id} style={{ border: '1px solid var(--cream-deep)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--rust)', fontWeight: 700 }}>
                            {q.examId?.shortCode} • {q.subjectId?.name} • Year {q.year} (Q{q.questionNumber})
                          </span>
                          <span style={{ fontSize: '10px', background: 'var(--paper)', border: '1px solid var(--paper-line)', padding: '1px 6px', borderRadius: '2px', fontWeight: 600 }}>
                            {q.difficulty}
                          </span>
                          <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '1px 6px', borderRadius: '2px', fontWeight: 700 }}>
                            Key: {q.correctAnswer}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0 8px', fontSize: '14px', color: 'var(--ink)', lineHeight: 1.5 }}>
                          {q.questionText}
                        </p>
                        {q.explanation && (
                          <div style={{ fontSize: '12px', color: 'var(--ink-soft)', background: 'var(--paper)', padding: '6px 10px', borderRadius: '3px', borderLeft: '3px solid var(--steel)' }}>
                            💡 {q.explanation}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditQuestion(q)}
                          style={{ padding: '5px 10px', background: 'var(--paper)', border: '1px solid var(--ink)', color: 'var(--ink)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', borderRadius: '2px' }}
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q._id, q.questionNumber)}
                          style={{ padding: '5px 10px', background: 'var(--rust-soft)', border: '1px solid var(--rust)', color: 'var(--rust)', fontSize: '11px', cursor: 'pointer', borderRadius: '2px' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {questionsList.pagination && questionsList.pagination.totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--paper-line)' }}>
                      <button
                        type="button"
                        disabled={!questionsList.pagination.hasPrevPage}
                        onClick={() => setQPage((prev) => Math.max(1, prev - 1))}
                        className="btn-custom btn-custom-ghost"
                        style={{ opacity: questionsList.pagination.hasPrevPage ? 1 : 0.4, padding: '4px 12px', fontSize: '12px' }}
                      >
                        ← Previous
                      </button>
                      <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                        Page {questionsList.pagination.page} of {questionsList.pagination.totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={!questionsList.pagination.hasNextPage}
                        onClick={() => setQPage((prev) => prev + 1)}
                        className="btn-custom btn-custom-ghost"
                        style={{ opacity: questionsList.pagination.hasNextPage ? 1 : 0.4, padding: '4px 12px', fontSize: '12px' }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '13px' }}>
                  No questions match your current search and filter criteria.
                </div>
              )}
            </div>

            {/* Edit Question Modal (Section 41, 46, 47, 48) */}
            {editingQuestion && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(11, 17, 32, 0.75)',
                  backdropFilter: 'blur(3px)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  overflowY: 'auto',
                }}
                onClick={() => setEditingQuestion(null)}
              >
                <div
                  style={{
                    backgroundColor: 'var(--white)',
                    border: '1.5px solid var(--ink)',
                    borderRadius: '6px',
                    width: '100%',
                    maxWidth: '580px',
                    padding: '24px',
                    boxShadow: '0 20px 48px rgba(0,0,0,0.35)',
                    maxHeight: 'min(90vh, 90dvh)',
                    overflowY: 'auto',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: '18px' }}>
                      Edit Question #{editingQuestion.questionNumber} ({editingQuestion.examId?.shortCode} • {editingQuestion.year})
                    </h3>
                    <button type="button" onClick={() => setEditingQuestion(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--ink-soft)' }}>
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditQuestion}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", fontWeight: 700, marginBottom: '4px' }}>
                        Question Text *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={editQText}
                        onChange={(e) => setEditQText(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', borderRadius: '3px', fontSize: '13px', fontFamily: 'inherit' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>Option A</label>
                        <input type="text" required value={editQOptA} onChange={(e) => setEditQOptA(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--paper-line)', borderRadius: '3px', fontSize: '12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>Option B</label>
                        <input type="text" required value={editQOptB} onChange={(e) => setEditQOptB(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--paper-line)', borderRadius: '3px', fontSize: '12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>Option C</label>
                        <input type="text" required value={editQOptC} onChange={(e) => setEditQOptC(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--paper-line)', borderRadius: '3px', fontSize: '12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>Option D</label>
                        <input type="text" required value={editQOptD} onChange={(e) => setEditQOptD(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--paper-line)', borderRadius: '3px', fontSize: '12px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>Correct Answer Key *</label>
                        <select
                          value={editQCorrect}
                          onChange={(e) => setEditQCorrect(e.target.value as any)}
                          style={{ width: '100%', padding: '6px', border: '1px solid var(--paper-line)', borderRadius: '3px', fontSize: '12px' }}
                        >
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>Difficulty</label>
                        <select
                          value={editQDifficulty}
                          onChange={(e) => setEditQDifficulty(e.target.value as any)}
                          style={{ width: '100%', padding: '6px', border: '1px solid var(--paper-line)', borderRadius: '3px', fontSize: '12px' }}
                        >
                          <option value="EASY">EASY</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HARD">HARD</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>Explanation / Worked Solution</label>
                      <textarea
                        rows={3}
                        value={editQExplanation}
                        onChange={(e) => setEditQExplanation(e.target.value)}
                        placeholder="Step-by-step worked mathematical proof or syllabus explanation..."
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', borderRadius: '3px', fontSize: '12px', fontFamily: 'inherit' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button type="button" onClick={() => setEditingQuestion(null)} className="btn-custom btn-custom-ghost">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateQuestionMutation.isPending}
                        className="btn-custom btn-custom-primary"
                        style={{ padding: '8px 18px', fontSize: '13px' }}
                      >
                        {updateQuestionMutation.isPending ? 'Saving Updates...' : 'Save Question Changes ✓'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: STUDY MATERIALS */}
        {activeTab === 'MATERIALS' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px', alignItems: 'start' }}>
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: '0 0 16px' }}>Upload Revision Guide (PDF Only)</h3>
              <form onSubmit={handleUploadMaterial}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Select Document (.pdf format strictly verified)</label>
                  <input type="file" required accept=".pdf" onChange={(e) => setMatFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Title</label>
                  <input type="text" required value={matTitle} onChange={(e) => setMatTitle(e.target.value)} placeholder="e.g. WAEC Mathematics Formula Booklet" style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Description</label>
                  <input type="text" value={matDescription} onChange={(e) => setMatDescription(e.target.value)} placeholder="Comprehensive syllabus guide..." style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Exam</label>
                    <select required value={matExamId} onChange={(e) => setMatExamId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--ink)' }}>
                      <option value="">-- Select Exam --</option>
                      {exams?.map((e: ExamItem) => <option key={e._id} value={e._id}>{e.shortCode}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>Subject</label>
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

                <button type="submit" disabled={uploadMaterialMutation.isPending || createMaterialMutation.isPending} style={{ width: '100%', padding: '12px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: "var(--font-sans)", fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: '0 0 16px' }}>Curated Study Materials</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {materialsList?.map((m: StudyMaterialItem) => (
                  <div key={m._id} style={{ border: '1px solid var(--cream-deep)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontFamily: "var(--font-sans)", fontWeight: 700, color: 'var(--ink)' }}>
                          {m.examId?.shortCode} • {m.subjectId?.code}
                        </span>
                        {m.isPremium && (
                          <span style={{ fontSize: '10px', background: 'var(--rust)', color: '#fff', padding: '1px 6px', fontWeight: 700, borderRadius: '2px' }}>PRO</span>
                        )}
                        <span
                          style={{
                            fontSize: '10px',
                            background: m.isPublished ? 'var(--forest-soft)' : 'var(--amber-soft)',
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
                          background: m.isPublished ? 'var(--paper)' : 'var(--forest-soft)',
                          border: '1px solid var(--ink)',
                          color: 'var(--ink)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        {m.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => handleDeleteMaterial(m._id, m.title)} style={{ padding: '4px 8px', background: 'var(--rust-soft)', border: '1px solid var(--rust)', color: 'var(--rust)', fontSize: '11px', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MANUAL PAYMENTS & PROOFS */}
        {activeTab === 'PAYMENTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Dynamic Receiving Bank Account Configuration Card */}
            <div style={{ background: 'var(--white)', border: '1.5px solid var(--ink)', padding: '28px', boxShadow: '4px 4px 0 var(--ink)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '20px' }}>🏛️</span>
                    <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '22px', margin: 0, color: 'var(--ink)' }}>
                      Official Physical Bank Account Configuration
                    </h3>
                    <span style={{ fontSize: '10px', fontFamily: "var(--font-sans)", background: 'var(--forest-soft)', color: 'var(--forest)', border: '1px solid var(--forest)', padding: '2px 8px', borderRadius: '3px', fontWeight: 700 }}>
                      DATABASE DYNAMIC
                    </span>
                  </div>
                  <p style={{ color: 'var(--slate)', fontSize: '13.5px', margin: 0, maxWidth: '750px' }}>
                    Configure the official receiving bank account for direct wire transfers across Nigeria. Modifying these details updates MongoDB Atlas in real-time, instantly reflecting on the public pricing page checkout for all candidates without redeploying code.
                  </p>
                </div>
              </div>

              {bankDetailsLoading ? (
                <div style={{ padding: '36px', textAlign: 'center' }}>
                  <BrandLoader mode="inline" size="sm" message="Loading receiving bank account details..." />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  {/* Left: Interactive Edit Form */}
                  <form onSubmit={handleUpdateBankDetails} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '5px' }}>
                        RECEIVING BANK NAME *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Access Bank, First Bank, Zenith Bank"
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '3px', border: '1.5px solid var(--ink)', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '5px' }}>
                          ACCOUNT HOLDER NAME *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. MarkDriller Education Services Ltd"
                          value={bankForm.accountName}
                          onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '3px', border: '1.5px solid var(--ink)', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '5px' }}>
                          CURRENCY *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="NGN"
                          value={bankForm.currency}
                          onChange={(e) => setBankForm({ ...bankForm, currency: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '3px', border: '1.5px solid var(--ink)', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '5px' }}>
                        NUBAN ACCOUNT NUMBER (10 DIGITS) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 10-digit NUBAN Account Number"
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '3px', border: '1.5px solid var(--ink)', fontFamily: "var(--font-sans)", fontSize: '15px', fontWeight: 700, letterSpacing: '1px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '5px' }}>
                        PAYMENT NARRATION / TRANSFER INSTRUCTIONS *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="e.g. Use your registered MarkDriller email address as the payment narration or transfer remark."
                        value={bankForm.instructions}
                        onChange={(e) => setBankForm({ ...bankForm, instructions: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '3px', border: '1.5px solid var(--ink)', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.5, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ marginTop: '6px' }}>
                      <button
                        type="submit"
                        disabled={updateBankDetailsMutation.isPending}
                        className="btn-custom btn-custom-primary"
                        style={{ padding: '12px 24px', fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        {updateBankDetailsMutation.isPending ? 'Saving & Deploying...' : '💾 Save & Deploy Bank Details'}
                      </button>
                    </div>
                  </form>

                  {/* Right: Live Preview Box */}
                  <div style={{ background: 'var(--paper)', border: '1.5px solid var(--cream-deep)', borderRadius: '4px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--cream-deep)', paddingBottom: '10px' }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: '11px', color: 'var(--rust)', fontWeight: 700, textTransform: 'uppercase' }}>
                          Live Candidate Preview
                        </span>
                        <span style={{ fontSize: '10px', background: 'var(--forest-soft)', color: 'var(--forest)', border: '1px solid var(--forest)', padding: '2px 6px', fontWeight: 700, borderRadius: '2px' }}>
                          ACTIVE RECEIVING DESK
                        </span>
                      </div>

                      <div style={{ background: 'var(--white)', border: '1.5px solid var(--ink)', padding: '18px', borderRadius: '3px', boxShadow: '2px 2px 0 var(--ink)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', fontFamily: "var(--font-sans)", marginBottom: '4px' }}>
                          Direct Bank Wire Transfer
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                          {bankForm.bankName || 'Bank Name Not Set'}
                        </div>
                        <div style={{ fontSize: '13.5px', marginBottom: '6px' }}>
                          <strong>Account Name:</strong> {bankForm.accountName || 'Not Set'}
                        </div>
                        <div style={{ fontSize: '13.5px', marginBottom: '12px' }}>
                          <strong>Account Number:</strong>{' '}
                          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: '16px', color: 'var(--forest)', background: 'var(--forest-soft)', padding: '2px 8px', borderRadius: '2px' }}>
                            {bankForm.accountNumber || '0000000000'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.5, background: 'var(--paper)', padding: '10px', borderRadius: '2px', borderLeft: '3px solid var(--rust)' }}>
                          ℹ️ {bankForm.instructions || 'Include your registered email as the transfer narration.'}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--slate)', marginTop: '16px', fontFamily: "var(--font-sans)" }}>
                      ✓ Protected by Administrator RBAC. Changes propagate dynamically to /api/subscriptions/bank-details.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Bank Transfer Verifications Card */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '20px', margin: '0 0 6px', color: 'var(--ink)' }}>
                    Manual Bank Transfer Verifications
                  </h3>
                  <p style={{ color: 'var(--slate)', fontSize: '13px', margin: 0 }}>
                    Audit student payment receipts, verify against the official receiving business account statement, and authorize instant Pro subscription activations.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['PENDING_REVIEW', 'SUCCESS', 'REJECTED', ''] as const).map((filterVal) => (
                    <button
                      key={filterVal}
                      onClick={() => {
                        setPaymentStatusFilter(filterVal);
                        setPaymentPage(1);
                      }}
                      style={{
                        padding: '6px 14px',
                        border: '1px solid var(--ink)',
                        background: paymentStatusFilter === filterVal ? 'var(--ink)' : 'var(--white)',
                        color: paymentStatusFilter === filterVal ? 'var(--white)' : 'var(--ink)',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: "var(--font-sans)",
                        cursor: 'pointer',
                      }}
                    >
                      {filterVal === 'PENDING_REVIEW'
                        ? 'Pending Review'
                        : filterVal === 'SUCCESS'
                        ? 'Approved'
                        : filterVal === 'REJECTED'
                        ? 'Rejected'
                        : 'All Transfers'}
                    </button>
                  ))}
                </div>
              </div>

              {manualPaymentsLoading ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <BrandLoader mode="inline" size="md" message="Loading transfer records..." />
                </div>
              ) : !manualPaymentsData?.payments || manualPaymentsData.payments.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed var(--cream-deep)', background: 'var(--paper)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                  <h4 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: '0 0 8px' }}>No payment transfers found</h4>
                  <p style={{ color: 'var(--slate)', fontSize: '13px', margin: 0 }}>
                    {paymentStatusFilter ? `No records match status "${paymentStatusFilter}".` : 'No manual bank transfer records recorded yet.'}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--ink)', textAlign: 'left', background: 'var(--paper)' }}>
                        <th style={{ padding: '12px 10px', fontFamily: "var(--font-sans)", fontSize: '11px' }}>REFERENCE / DATE</th>
                        <th style={{ padding: '12px 10px', fontFamily: "var(--font-sans)", fontSize: '11px' }}>STUDENT</th>
                        <th style={{ padding: '12px 10px', fontFamily: "var(--font-sans)", fontSize: '11px' }}>DEPOSITOR & BANK</th>
                        <th style={{ padding: '12px 10px', fontFamily: "var(--font-sans)", fontSize: '11px' }}>PLAN & AMOUNT</th>
                        <th style={{ padding: '12px 10px', fontFamily: "var(--font-sans)", fontSize: '11px' }}>RECEIPT PROOF</th>
                        <th style={{ padding: '12px 10px', fontFamily: "var(--font-sans)", fontSize: '11px' }}>STATUS</th>
                        <th style={{ padding: '12px 10px', fontFamily: "var(--font-sans)", fontSize: '11px', textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualPaymentsData.payments.map((p) => {
                        const isPending = p.status === 'PENDING_REVIEW';
                        const isApproved = p.status === 'SUCCESS';
                        const isRejected = p.status === 'REJECTED';

                        return (
                          <tr key={p._id} style={{ borderBottom: '1px solid var(--cream-deep)' }}>
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: '12px', color: 'var(--ink)' }}>
                                {p.reference}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--slate)', marginTop: '2px' }}>
                                {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{p.userId?.fullName || 'Anonymous'}</div>
                              <div style={{ fontSize: '11px', color: 'var(--slate)' }}>{p.userId?.email || 'N/A'}</div>
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ fontWeight: 600 }}>{p.depositorName || 'N/A'}</div>
                              <div style={{ fontSize: '11px', color: 'var(--slate)' }}>
                                {p.bankName || 'Direct Transfer'} {p.transferDate && `• ${p.transferDate}`}
                              </div>
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ fontWeight: 700, color: 'var(--forest)', fontSize: '14px' }}>
                                ₦{(p.amount ?? p.amountKobo / 100).toLocaleString()}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--slate)' }}>
                                {p.metadata?.planName || p.metadata?.plan || 'Pro Pass'}
                              </div>
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              {p.proofUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setViewProofModalUrl(p.proofUrl!)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    background: 'var(--paper)',
                                    border: '1px solid var(--ink)',
                                    color: 'var(--ink)',
                                    fontFamily: "var(--font-sans)",
                                    cursor: 'pointer',
                                    borderRadius: '2px',
                                  }}
                                >
                                  <span>📎 View Receipt</span>
                                </button>
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--slate)', fontStyle: 'italic' }}>No receipt</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  fontFamily: "var(--font-sans)",
                                  borderRadius: '2px',
                                  background: isPending ? 'var(--amber-soft)' : isApproved ? 'var(--forest-soft)' : 'var(--rust-soft)',
                                  color: isPending ? 'var(--amber)' : isApproved ? 'var(--forest)' : 'var(--rust)',
                                  border: `1px solid ${isPending ? 'var(--amber)' : isApproved ? 'var(--forest)' : 'var(--rust)'}`,
                                }}
                              >
                                {isPending ? 'PENDING REVIEW' : isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : p.status}
                              </span>
                              {p.reviewedBy && (
                                <div style={{ fontSize: '10px', color: 'var(--slate)', marginTop: '4px' }}>
                                  By: {p.reviewedBy.fullName}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                              {isPending ? (
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleApprovePayment(p)}
                                    disabled={approveManualPaymentMutation.isPending}
                                    style={{
                                      padding: '5px 12px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      background: 'var(--forest)',
                                      color: 'var(--white)',
                                      border: '1px solid var(--forest)',
                                      cursor: 'pointer',
                                      fontFamily: "var(--font-sans)",
                                    }}
                                  >
                                    Approve & Activate
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectDialogPayment(p)}
                                    disabled={rejectManualPaymentMutation.isPending}
                                    style={{
                                      padding: '5px 10px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      background: 'var(--rust-soft)',
                                      color: 'var(--rust)',
                                      border: '1px solid var(--rust)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--slate)' }}>
                                  {isApproved ? 'Pro Activated' : p.adminReviewNotes || 'Processed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {manualPaymentsData.pagination && manualPaymentsData.pagination.totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--cream-deep)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--slate)', fontFamily: "var(--font-sans)" }}>
                        Page {manualPaymentsData.pagination.page} of {manualPaymentsData.pagination.totalPages} ({manualPaymentsData.pagination.total} total)
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={paymentPage <= 1}
                          onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                          style={{
                            padding: '4px 10px',
                            border: '1px solid var(--ink)',
                            background: paymentPage <= 1 ? '#eee' : 'var(--white)',
                            cursor: paymentPage <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          ← Previous
                        </button>
                        <button
                          type="button"
                          disabled={paymentPage >= manualPaymentsData.pagination.totalPages}
                          onClick={() => setPaymentPage((p) => p + 1)}
                          style={{
                            padding: '4px 10px',
                            border: '1px solid var(--ink)',
                            background: paymentPage >= manualPaymentsData.pagination.totalPages ? '#eee' : 'var(--white)',
                            cursor: paymentPage >= manualPaymentsData.pagination.totalPages ? 'not-allowed' : 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: View Receipt Image */}
        {viewProofModalUrl && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(20, 24, 28, 0.75)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setViewProofModalUrl(null)}
          >
            <div
              style={{
                background: 'var(--white)',
                border: '2px solid var(--ink)',
                boxShadow: '6px 6px 0 var(--ink)',
                maxWidth: '650px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--ink)', background: 'var(--paper)' }}>
                <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: '13px' }}>
                  Bank Transfer Payment Receipt Proof
                </div>
                <button
                  type="button"
                  onClick={() => setViewProofModalUrl(null)}
                  style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: '20px', overflowY: 'auto', textAlign: 'center', flex: 1 }}>
                <img
                  src={viewProofModalUrl}
                  alt="Proof of payment"
                  style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', border: '1px solid var(--cream-deep)' }}
                />
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--cream-deep)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <a
                  href={viewProofModalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none', fontSize: '12px', padding: '6px 12px' }}
                >
                  Open in New Tab ↗
                </a>
                <button
                  type="button"
                  onClick={() => setViewProofModalUrl(null)}
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reject Payment Reason Prompt */}
        {rejectDialogPayment && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(20, 24, 28, 0.75)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              style={{
                background: 'var(--white)',
                border: '2px solid var(--rust)',
                boxShadow: '6px 6px 0 var(--ink)',
                maxWidth: '480px',
                width: '100%',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rust)', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: '18px', margin: 0 }}>
                  Reject Bank Transfer Proof
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--slate)', margin: '0 0 16px', lineHeight: 1.5 }}>
                Reject payment for <strong>{rejectDialogPayment.userId?.fullName || 'student'}</strong> (Ref: {rejectDialogPayment.reference}, ₦{(rejectDialogPayment.amount ?? rejectDialogPayment.amountKobo / 100).toLocaleString()}). Please specify the reason below.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Reason for Rejection:
                </label>
                <textarea
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="e.g. Transaction reference not found in bank statement; amount mismatch; blurry receipt image..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1.5px solid var(--ink)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRejectDialogPayment(null);
                    setRejectReasonInput('');
                  }}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid var(--ink)',
                    background: 'var(--white)',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={rejectManualPaymentMutation.isPending || !rejectReasonInput.trim()}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--rust)',
                    background: 'var(--rust)',
                    color: 'var(--white)',
                    cursor: rejectReasonInput.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {rejectManualPaymentMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CONTENT MANAGEMENT (Institutions, Editorial, Testimonials, Videos) */}
        {activeTab === 'CONTENT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Sub-tab navigation */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--paper-line)', paddingBottom: '12px' }}>
              {(['INSTITUTIONS', 'BLOG', 'TESTIMONIALS', 'VIDEOS'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setContentSubTab(st)}
                  style={{
                    padding: '6px 14px',
                    border: '1px solid var(--ink)',
                    background: contentSubTab === st ? 'var(--ink)' : 'var(--white)',
                    color: contentSubTab === st ? 'var(--white)' : 'var(--ink)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {st === 'INSTITUTIONS' ? 'Institutions' : st === 'BLOG' ? 'Editorial Blog' : st === 'TESTIMONIALS' ? 'Testimonials' : 'Video Lectures'}
                </button>
              ))}
            </div>

            {/* Institutions Manager */}
            {contentSubTab === 'INSTITUTIONS' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '20px', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Add Nigerian Institution</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        await createInstitutionMutation.mutateAsync({
                          name: instName,
                          shortCode: instCode,
                          type: instType,
                          state: instState,
                          founded: 1970,
                          minJambCutoff: instCutoff,
                          isPublished: true,
                        });
                        setInstName('');
                        setInstCode('');
                        showNotice('success', 'Institution successfully created');
                      } catch (err: any) {
                        showNotice('error', err.message || 'Failed to create institution');
                      }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Institution Name</label>
                      <input
                        type="text"
                        required
                        value={instName}
                        onChange={(e) => setInstName(e.target.value)}
                        placeholder="e.g. University of Benin"
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Short Code</label>
                      <input
                        type="text"
                        required
                        value={instCode}
                        onChange={(e) => setInstCode(e.target.value)}
                        placeholder="e.g. UNIBEN"
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Type</label>
                        <select
                          value={instType}
                          onChange={(e) => setInstType(e.target.value as any)}
                          style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                        >
                          <option value="FEDERAL_UNI">Federal University</option>
                          <option value="STATE_UNI">State University</option>
                          <option value="PRIVATE_UNI">Private University</option>
                          <option value="POLYTECHNIC">Polytechnic</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>State</label>
                        <input
                          type="text"
                          required
                          value={instState}
                          onChange={(e) => setInstState(e.target.value)}
                          placeholder="e.g. Edo"
                          style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Min JAMB Cutoff</label>
                      <input
                        type="number"
                        required
                        min="100"
                        max="400"
                        value={instCutoff}
                        onChange={(e) => setInstCutoff(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={createInstitutionMutation.isPending}
                      style={{ padding: '10px', background: 'var(--ink)', color: 'var(--white)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      {createInstitutionMutation.isPending ? 'Saving...' : 'Add Institution'}
                    </button>
                  </form>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '20px', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Accredited Institutions ({institutionsData?.institutions?.length || 0})</h3>
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid var(--ink)', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Code</th>
                          <th style={{ padding: '8px' }}>Name</th>
                          <th style={{ padding: '8px' }}>State</th>
                          <th style={{ padding: '8px' }}>Cutoff</th>
                          <th style={{ padding: '8px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {institutionsData?.institutions?.map((inst: any) => (
                          <tr key={inst._id} style={{ borderBottom: '1px solid var(--paper-line)' }}>
                            <td style={{ padding: '8px', fontWeight: 700 }}>{inst.shortCode}</td>
                            <td style={{ padding: '8px' }}>{inst.name}</td>
                            <td style={{ padding: '8px' }}>{inst.state}</td>
                            <td style={{ padding: '8px' }}>{inst.minJambCutoff}</td>
                            <td style={{ padding: '8px' }}>
                              <button
                                type="button"
                                onClick={() => deleteInstitutionMutation.mutate(inst._id)}
                                style={{ padding: '3px 8px', background: 'var(--rust)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px' }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Editorial Blog Manager */}
            {contentSubTab === 'BLOG' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '20px', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Publish Editorial Article</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        await createBlogMutation.mutateAsync({
                          title: blogTitle,
                          category: blogCat,
                          author: blogAuthor,
                          authorRole: 'Senior Academic Editor',
                          summary: blogSummary,
                          content: [blogParagraph],
                        });
                        setBlogTitle('');
                        setBlogSummary('');
                        setBlogParagraph('');
                        showNotice('success', 'Article published to live blog');
                      } catch (err: any) {
                        showNotice('error', err.message || 'Failed to publish article');
                      }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Title</label>
                      <input
                        type="text"
                        required
                        value={blogTitle}
                        onChange={(e) => setBlogTitle(e.target.value)}
                        placeholder="e.g. 2026/2027 JAMB Novel Analysis"
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Category</label>
                      <select
                        value={blogCat}
                        onChange={(e) => setBlogCat(e.target.value as any)}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      >
                        <option value="JAMB_GUIDES">JAMB Guides</option>
                        <option value="WAEC_INSIGHTS">WAEC Insights</option>
                        <option value="POST_UTME">Post-UTME</option>
                        <option value="STUDY_TECHNIQUES">Study Techniques</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Author</label>
                      <input
                        type="text"
                        required
                        value={blogAuthor}
                        onChange={(e) => setBlogAuthor(e.target.value)}
                        placeholder="Author name"
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Summary</label>
                      <textarea
                        required
                        value={blogSummary}
                        onChange={(e) => setBlogSummary(e.target.value)}
                        rows={2}
                        placeholder="Brief summary..."
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>First Paragraph Content</label>
                      <textarea
                        required
                        value={blogParagraph}
                        onChange={(e) => setBlogParagraph(e.target.value)}
                        rows={4}
                        placeholder="Article content text..."
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={createBlogMutation.isPending}
                      style={{ padding: '10px', background: 'var(--ink)', color: 'var(--white)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      {createBlogMutation.isPending ? 'Publishing...' : 'Publish Article'}
                    </button>
                  </form>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '20px', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Published Articles ({blogData?.articles?.length || 0})</h3>
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid var(--ink)', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Title</th>
                          <th style={{ padding: '8px' }}>Category</th>
                          <th style={{ padding: '8px' }}>Views</th>
                          <th style={{ padding: '8px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogData?.articles?.map((art: any) => (
                          <tr key={art._id} style={{ borderBottom: '1px solid var(--paper-line)' }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{art.title}</td>
                            <td style={{ padding: '8px' }}>{art.category}</td>
                            <td style={{ padding: '8px' }}>{art.viewCount || 0}</td>
                            <td style={{ padding: '8px' }}>
                              <button
                                type="button"
                                onClick={() => deleteBlogMutation.mutate(art._id)}
                                style={{ padding: '3px 8px', background: 'var(--rust)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px' }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Testimonials Manager */}
            {contentSubTab === 'TESTIMONIALS' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '20px', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Add Student Testimonial</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        await createTestimonialMutation.mutateAsync({
                          studentName: testStudent,
                          examTaken: testExam,
                          score: testScore,
                          quote: testQuote,
                          universityAdmitted: testUni,
                          isApproved: true,
                          isFeatured: true,
                        });
                        setTestStudent('');
                        setTestQuote('');
                        showNotice('success', 'Testimonial added to public showcase');
                      } catch (err: any) {
                        showNotice('error', err.message || 'Failed to add testimonial');
                      }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Candidate Name</label>
                      <input
                        type="text"
                        required
                        value={testStudent}
                        onChange={(e) => setTestStudent(e.target.value)}
                        placeholder="e.g. Ibrahim K."
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Exam</label>
                        <input
                          type="text"
                          required
                          value={testExam}
                          onChange={(e) => setTestExam(e.target.value)}
                          style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Score</label>
                        <input
                          type="text"
                          required
                          value={testScore}
                          onChange={(e) => setTestScore(e.target.value)}
                          style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>University Admitted</label>
                      <input
                        type="text"
                        value={testUni}
                        onChange={(e) => setTestUni(e.target.value)}
                        placeholder="e.g. Pharmacy, UNN"
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Student Quote</label>
                      <textarea
                        required
                        value={testQuote}
                        onChange={(e) => setTestQuote(e.target.value)}
                        rows={3}
                        placeholder="Testimonial text..."
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={createTestimonialMutation.isPending}
                      style={{ padding: '10px', background: 'var(--ink)', color: 'var(--white)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      {createTestimonialMutation.isPending ? 'Saving...' : 'Add Testimonial'}
                    </button>
                  </form>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '20px', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Student Testimonials ({testimonialsData?.length || 0})</h3>
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid var(--ink)', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Candidate</th>
                          <th style={{ padding: '8px' }}>Exam &amp; Score</th>
                          <th style={{ padding: '8px' }}>Admission</th>
                          <th style={{ padding: '8px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testimonialsData?.map((test: any) => (
                          <tr key={test._id} style={{ borderBottom: '1px solid var(--paper-line)' }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{test.studentName}</td>
                            <td style={{ padding: '8px' }}>{test.examTaken} ({test.score})</td>
                            <td style={{ padding: '8px' }}>{test.universityAdmitted || '—'}</td>
                            <td style={{ padding: '8px' }}>
                              <button
                                type="button"
                                onClick={() => deleteTestimonialMutation.mutate(test._id)}
                                style={{ padding: '3px 8px', background: 'var(--rust)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px' }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Video Lectures Manager */}
            {contentSubTab === 'VIDEOS' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '20px', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Add Video Lecture</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        await createVideoMutation.mutateAsync({
                          title: videoTitle,
                          videoId: videoIdInput,
                          duration: videoDuration,
                          isPremium: videoIsPrem,
                          isPublished: true,
                        });
                        setVideoTitle('');
                        setVideoIdInput('');
                        showNotice('success', 'Video lecture added successfully');
                      } catch (err: any) {
                        showNotice('error', err.message || 'Failed to add video lecture');
                      }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Lesson Title</label>
                      <input
                        type="text"
                        required
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        placeholder="e.g. Calculus: Limits and Derivatives"
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>YouTube Video ID (11 chars)</label>
                      <input
                        type="text"
                        required
                        value={videoIdInput}
                        onChange={(e) => setVideoIdInput(e.target.value)}
                        placeholder="e.g. kpCJyQ2usJ4"
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Duration</label>
                        <input
                          type="text"
                          required
                          value={videoDuration}
                          onChange={(e) => setVideoDuration(e.target.value)}
                          placeholder="e.g. 24:15"
                          style={{ width: '100%', padding: '8px', border: '1px solid var(--paper-line)', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                        <input
                          type="checkbox"
                          id="vidPrem"
                          checked={videoIsPrem}
                          onChange={(e) => setVideoIsPrem(e.target.checked)}
                        />
                        <label htmlFor="vidPrem" style={{ fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Pro Only</label>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={createVideoMutation.isPending}
                      style={{ padding: '10px', background: 'var(--ink)', color: 'var(--white)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      {createVideoMutation.isPending ? 'Saving...' : 'Add Video'}
                    </button>
                  </form>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '20px', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Curriculum Video Lessons ({videosData?.length || 0})</h3>
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid var(--ink)', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Title</th>
                          <th style={{ padding: '8px' }}>YouTube ID</th>
                          <th style={{ padding: '8px' }}>Duration</th>
                          <th style={{ padding: '8px' }}>Tier</th>
                          <th style={{ padding: '8px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {videosData?.map((vid: any) => (
                          <tr key={vid._id} style={{ borderBottom: '1px solid var(--paper-line)' }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{vid.title}</td>
                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>{vid.videoId}</td>
                            <td style={{ padding: '8px' }}>{vid.duration}</td>
                            <td style={{ padding: '8px' }}>{vid.isPremium ? 'PRO' : 'FREE'}</td>
                            <td style={{ padding: '8px' }}>
                              <button
                                type="button"
                                onClick={() => deleteVideoMutation.mutate(vid._id)}
                                style={{ padding: '3px 8px', background: 'var(--rust)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px' }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: SUBSCRIPTIONS & PAYMENT AUDIT */}
        {activeTab === 'SUBSCRIPTIONS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Storage / Media Telemetry Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '16px', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Total Subscriptions</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)' }}>{subscriptionsData?.pagination?.total || 0}</div>
              </div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '16px', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Payments Processed</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)' }}>{paymentsDirectoryData?.pagination?.total || 0}</div>
              </div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '16px', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Physical Media Files</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)' }}>{mediaData?.totalFiles || 0} ({mediaData?.totalMegabytes || 0} MB)</div>
              </div>
            </div>

            {/* Subscriptions Directory Table */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '20px', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Candidate Subscriptions Directory</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--ink)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>User</th>
                      <th style={{ padding: '8px' }}>Email</th>
                      <th style={{ padding: '8px' }}>Plan</th>
                      <th style={{ padding: '8px' }}>Status</th>
                      <th style={{ padding: '8px' }}>Start Date</th>
                      <th style={{ padding: '8px' }}>Expiration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionsData?.subscriptions?.map((sub: any) => (
                      <tr key={sub._id} style={{ borderBottom: '1px solid var(--paper-line)' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>{sub.userId?.fullName || 'User'}</td>
                        <td style={{ padding: '8px' }}>{sub.userId?.email || '—'}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ fontWeight: 700, color: sub.plan === 'FREE' ? 'var(--ink-soft)' : 'var(--forest)' }}>
                            {sub.plan}
                          </span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '11px', background: sub.status === 'ACTIVE' ? 'var(--forest-soft)' : 'var(--rust-soft)', color: sub.status === 'ACTIVE' ? 'var(--forest)' : 'var(--rust)' }}>
                            {sub.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px' }}>{new Date(sub.startDate).toLocaleDateString()}</td>
                        <td style={{ padding: '8px' }}>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'Lifetime'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments Audit Directory Table */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--paper-line)', padding: '20px', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>All Payments Audit Trail</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--ink)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Reference</th>
                      <th style={{ padding: '8px' }}>User</th>
                      <th style={{ padding: '8px' }}>Provider</th>
                      <th style={{ padding: '8px' }}>Amount (NGN)</th>
                      <th style={{ padding: '8px' }}>Status</th>
                      <th style={{ padding: '8px' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsDirectoryData?.payments?.map((pm: any) => (
                      <tr key={pm._id} style={{ borderBottom: '1px solid var(--paper-line)' }}>
                        <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 600 }}>{pm.reference}</td>
                        <td style={{ padding: '8px' }}>{pm.userId?.fullName || 'User'}</td>
                        <td style={{ padding: '8px' }}>{pm.provider}</td>
                        <td style={{ padding: '8px', fontWeight: 700 }}>₦{Math.round((pm.amountKobo || 0) / 100).toLocaleString()}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: pm.status === 'SUCCESS' ? 'var(--forest-soft)' : pm.status === 'PENDING_REVIEW' ? 'var(--amber-soft)' : 'var(--rust-soft)',
                            color: pm.status === 'SUCCESS' ? 'var(--forest)' : pm.status === 'PENDING_REVIEW' ? 'var(--amber)' : 'var(--rust)',
                          }}>
                            {pm.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px' }}>{new Date(pm.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: CUSTOMER SUPPORT TICKETS & COMPLAINTS               */}
        {/* ======================================================== */}
        {activeTab === 'TICKETS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header & Metrics */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '24px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', borderBottom: '1.5px solid var(--ink)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '22px' }}>🎫</span>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontSize: '22px', margin: 0, color: 'var(--ink)' }}>
                      Customer Support Tickets &amp; Complaints
                    </h2>
                  </div>
                  <p style={{ color: 'var(--slate)', fontSize: '13.5px', margin: 0, maxWidth: '800px', lineHeight: 1.5 }}>
                    Real-time student inquiry log and technical problem reports. Every submission is recorded in MongoDB and dispatched to the configured support inbox via Brevo with <code>Reply-To</code> set directly to the student.
                  </p>
                </div>
              </div>

              {/* Stat Counters Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--paper)', border: '1px solid var(--ink)', padding: '12px 16px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', fontWeight: 700 }}>Total Inquiries</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>
                    {ticketsData?.counts?.total ?? 0}
                  </div>
                </div>
                <div style={{ background: 'var(--paper)', border: '1px solid var(--ink)', padding: '12px 16px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#b45309', textTransform: 'uppercase', fontWeight: 700 }}>Open / Needs Action</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                    {ticketsData?.counts?.open ?? 0}
                  </div>
                </div>
                <div style={{ background: 'var(--paper)', border: '1px solid var(--ink)', padding: '12px 16px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#1d4ed8', textTransform: 'uppercase', fontWeight: 700 }}>In Progress</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                    {ticketsData?.counts?.inProgress ?? 0}
                  </div>
                </div>
                <div style={{ background: 'var(--paper)', border: '1px solid var(--ink)', padding: '12px 16px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#15803d', textTransform: 'uppercase', fontWeight: 700 }}>Resolved</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                    {ticketsData?.counts?.resolved ?? 0}
                  </div>
                </div>
                <div style={{ background: 'var(--paper)', border: '1px solid var(--ink)', padding: '12px 16px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: (ticketsData?.counts?.failedEmail ?? 0) > 0 ? '#b91c1c' : 'var(--slate)', textTransform: 'uppercase', fontWeight: 700 }}>Email Delivery Alerts</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: (ticketsData?.counts?.failedEmail ?? 0) > 0 ? '#dc2626' : 'var(--ink)', marginTop: '4px' }}>
                    {ticketsData?.counts?.failedEmail ?? 0}
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search Reference, Student Name, Email..."
                  value={ticketSearch}
                  onChange={(e) => {
                    setTicketSearch(e.target.value);
                    setTicketPage(1);
                  }}
                  style={{ flex: '1 1 240px', padding: '9px 12px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px' }}
                />
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => {
                    setTicketStatusFilter(e.target.value);
                    setTicketPage(1);
                  }}
                  style={{ padding: '9px 12px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px', background: 'var(--white)' }}
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open Only</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <select
                  value={ticketCategoryFilter}
                  onChange={(e) => {
                    setTicketCategoryFilter(e.target.value);
                    setTicketPage(1);
                  }}
                  style={{ padding: '9px 12px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px', background: 'var(--white)' }}
                >
                  <option value="">All Categories</option>
                  <option value="PAYMENT_PROBLEM">Payment / Bank Transfer</option>
                  <option value="LOGIN_PROBLEM">Login / Account Problem</option>
                  <option value="QUESTION_ERROR">Incorrect Question Report</option>
                  <option value="TECHNICAL_PROBLEM">Technical CBT Issue</option>
                  <option value="SUBSCRIPTION_PROBLEM">Subscription / Tier Activation</option>
                  <option value="OTHER">General Inquiry</option>
                </select>
              </div>
            </div>

            {/* Tickets Table */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)', overflowX: 'auto' }}>
              {ticketsLoading ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <BrandLoader mode="inline" size="md" message="Loading support inquiries from MongoDB..." />
                </div>
              ) : !ticketsData?.tickets || ticketsData.tickets.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--slate)', fontSize: '14px' }}>
                  No customer support tickets found matching current criteria.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--paper)', borderBottom: '1.5px solid var(--ink)' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ink)' }}>Ref ID</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ink)' }}>Student</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ink)' }}>Category</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ink)' }}>Subject</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ink)' }}>Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ink)' }}>Email Delivery</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ink)' }}>Submitted</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ink)', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsData.tickets.map((t) => (
                      <tr key={t._id} style={{ borderBottom: '1px solid var(--paper-line)', transition: 'background 0.1s' }}>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--rust)' }}>
                          {t.ticketReference}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{t.fullName}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--slate)' }}>{t.email}</div>
                          {t.phone && <div style={{ fontSize: '11px', color: 'var(--slate)' }}>{t.phone}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '3px', background: 'var(--paper)', border: '1px solid var(--paper-line)', fontWeight: 600 }}>
                            {t.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.subject}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '3px',
                              background:
                                t.status === 'OPEN'
                                  ? '#fff3cd'
                                  : t.status === 'IN_PROGRESS'
                                  ? '#cce5ff'
                                  : t.status === 'RESOLVED'
                                  ? '#d4edda'
                                  : '#e2e3e5',
                              color:
                                t.status === 'OPEN'
                                  ? '#856404'
                                  : t.status === 'IN_PROGRESS'
                                  ? '#004085'
                                  : t.status === 'RESOLVED'
                                  ? '#155724'
                                  : '#383d41',
                              border: `1px solid ${
                                t.status === 'OPEN'
                                  ? '#ffeeba'
                                  : t.status === 'IN_PROGRESS'
                                  ? '#b8daff'
                                  : t.status === 'RESOLVED'
                                  ? '#c3e6cb'
                                  : '#d6d8db'
                              }`,
                            }}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {t.emailDeliveryStatus === 'SENT' ? (
                            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              ✓ Dispatched
                            </span>
                          ) : t.emailDeliveryStatus === 'FAILED' ? (
                            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              ⚠ Failed
                              <button
                                type="button"
                                onClick={() => handleResendTicketEmail(t._id, t.ticketReference)}
                                style={{ marginLeft: '4px', fontSize: '10px', padding: '1px 5px', border: '1px solid #dc2626', background: '#fff', color: '#dc2626', borderRadius: '3px', cursor: 'pointer' }}
                              >
                                Retry
                              </button>
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--slate)' }}>Pending</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--slate)', whiteSpace: 'nowrap' }}>
                          {new Date(t.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenTicketModal(t)}
                            style={{
                              padding: '5px 12px',
                              background: 'var(--ink)',
                              color: '#fff',
                              border: '1px solid var(--ink)',
                              borderRadius: '3px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Inspect &amp; Reply
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Pagination */}
              {ticketsData?.pagination && ticketsData.pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--paper)', borderTop: '1px solid var(--paper-line)', fontSize: '12px' }}>
                  <span>Page {ticketsData.pagination.page} of {ticketsData.pagination.totalPages} ({ticketsData.pagination.total} total tickets)</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      disabled={ticketPage <= 1}
                      onClick={() => setTicketPage((p) => Math.max(1, p - 1))}
                      style={{ padding: '4px 10px', border: '1px solid var(--ink)', background: ticketPage <= 1 ? '#e5e7eb' : 'var(--white)', cursor: ticketPage <= 1 ? 'not-allowed' : 'pointer' }}
                    >
                      Previous
                    </button>
                    <button
                      disabled={ticketPage >= ticketsData.pagination.totalPages}
                      onClick={() => setTicketPage((p) => p + 1)}
                      style={{ padding: '4px 10px', border: '1px solid var(--ink)', background: ticketPage >= ticketsData.pagination.totalPages ? '#e5e7eb' : 'var(--white)', cursor: ticketPage >= ticketsData.pagination.totalPages ? 'not-allowed' : 'pointer' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ticket Inspection / Reply Modal */}
            {selectedTicketModal && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    background: 'var(--white)',
                    border: '2px solid var(--ink)',
                    boxShadow: '6px 6px 0 var(--ink)',
                    maxWidth: '680px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '28px',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid var(--ink)', paddingBottom: '12px' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 800, color: 'var(--rust)' }}>
                        {selectedTicketModal.ticketReference}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--slate)', marginTop: '2px' }}>
                        Category: <strong>{selectedTicketModal.category.replace(/_/g, ' ')}</strong> · Submitted on {new Date(selectedTicketModal.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTicketModal(null)}
                      style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Customer Information Strip */}
                  <div style={{ background: 'var(--paper)', border: '1px solid var(--paper-line)', padding: '14px', borderRadius: '4px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
                    <div>
                      <span style={{ color: 'var(--slate)', display: 'block' }}>Student Name:</span>
                      <strong>{selectedTicketModal.fullName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--slate)', display: 'block' }}>Student Email:</span>
                      <a href={`mailto:${selectedTicketModal.email}`} style={{ color: 'var(--rust)', fontWeight: 600 }}>{selectedTicketModal.email}</a>
                    </div>
                    <div>
                      <span style={{ color: 'var(--slate)', display: 'block' }}>Phone Number:</span>
                      <span>{selectedTicketModal.phone || 'Not provided'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--slate)', display: 'block' }}>Account Type:</span>
                      <span>{selectedTicketModal.userId ? 'Registered User' : 'Guest / External'}</span>
                    </div>
                  </div>

                  {/* Email Delivery Diagnostics */}
                  <div style={{ padding: '10px 14px', background: selectedTicketModal.emailDeliveryStatus === 'SENT' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${selectedTicketModal.emailDeliveryStatus === 'SENT' ? '#bbf7d0' : '#fecaca'}`, borderRadius: '4px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Email Delivery to Support Inbox: </strong>
                      <span style={{ color: selectedTicketModal.emailDeliveryStatus === 'SENT' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                        {selectedTicketModal.emailDeliveryStatus}
                      </span>
                      {selectedTicketModal.emailRecipient && (
                        <span style={{ color: 'var(--slate)', marginLeft: '6px' }}>({selectedTicketModal.emailRecipient})</span>
                      )}
                      {selectedTicketModal.emailMessageId && (
                        <div style={{ fontSize: '11px', color: 'var(--slate)', marginTop: '2px', fontFamily: 'monospace' }}>
                          MsgId: {selectedTicketModal.emailMessageId}
                        </div>
                      )}
                      {selectedTicketModal.emailError && (
                        <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
                          Reason: {selectedTicketModal.emailError}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={resendTicketEmailMutation.isPending}
                      onClick={() => handleResendTicketEmail(selectedTicketModal._id, selectedTicketModal.ticketReference)}
                      style={{ padding: '5px 10px', fontSize: '11px', border: '1px solid var(--ink)', background: 'var(--white)', cursor: 'pointer', borderRadius: '3px' }}
                    >
                      {resendTicketEmailMutation.isPending ? 'Sending...' : 'Dispatch Email Again'}
                    </button>
                  </div>

                  {/* Inquiry Subject & Message */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', marginBottom: '4px' }}>
                      Subject
                    </label>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)', marginBottom: '12px' }}>
                      {selectedTicketModal.subject}
                    </div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate)', marginBottom: '4px' }}>
                      Customer Complaint / Details
                    </label>
                    <div style={{ background: 'var(--paper)', border: '1.5px solid var(--ink)', padding: '14px', borderRadius: '4px', fontSize: '13.5px', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '180px', overflowY: 'auto' }}>
                      {selectedTicketModal.message}
                    </div>
                  </div>

                  {/* Status & Priority Management */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Update Status</label>
                      <select
                        value={ticketStatusInput}
                        onChange={(e) => setTicketStatusInput(e.target.value as any)}
                        style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px' }}
                      >
                        <option value="OPEN">OPEN (Requires attention)</option>
                        <option value="IN_PROGRESS">IN_PROGRESS (Being handled)</option>
                        <option value="RESOLVED">RESOLVED (Customer resolved)</option>
                        <option value="CLOSED">CLOSED (Archived)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Priority</label>
                      <select
                        value={ticketPriorityInput}
                        onChange={(e) => setTicketPriorityInput(e.target.value as any)}
                        style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px' }}
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Internal Admin Operations Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Add internal resolution remarks, verification details, or notes..."
                      value={ticketNotesInput}
                      onChange={(e) => setTicketNotesInput(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '12.5px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderTop: '1px solid var(--paper-line)', paddingTop: '16px' }}>
                    <a
                      href={`mailto:${selectedTicketModal.email}?subject=${encodeURIComponent(`Re: [${selectedTicketModal.ticketReference}] ${selectedTicketModal.subject}`)}`}
                      className="btn-custom btn-custom-primary"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: 'var(--forest)', border: 'none' }}
                    >
                      ✉️ Reply Directly to Student
                    </a>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedTicketModal(null)}
                        className="btn-custom btn-custom-ghost"
                        style={{ fontSize: '12px' }}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        disabled={updateTicketMutation.isPending}
                        onClick={handleSaveTicketUpdate}
                        className="btn-custom btn-custom-primary"
                        style={{ fontSize: '12px' }}
                      >
                        {updateTicketMutation.isPending ? 'Saving...' : 'Save Ticket Status'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 10: CUSTOMER SUPPORT & CHANNELS CONFIGURATION        */}
        {/* MongoDB-backed dynamic source of truth for all support   */}
        {/* ======================================================== */}
        {activeTab === 'SETTINGS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '28px', boxShadow: '3px 3px 0 var(--ink)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '1.5px solid var(--ink)', paddingBottom: '16px' }}>

                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px' }}>💬</span>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontSize: '22px', margin: 0, color: 'var(--ink)' }}>
                      Customer Support &amp; Communication Channels
                    </h2>
                  </div>
                  <p style={{ color: 'var(--slate)', fontSize: '13.5px', margin: 0, maxWidth: '800px', lineHeight: 1.5 }}>
                    Authoritative customer support contact configuration stored directly in MongoDB. Changes save instantly and propagate dynamically to the public website, floating WhatsApp button, support desk, and student portals without requiring frontend redeployment.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '3px',
                      fontWeight: 700,
                      background: 'var(--forest-soft)',
                      color: 'var(--forest)',
                      border: '1px solid var(--forest)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ● Database Synchronized
                  </span>
                </div>
              </div>

              {supportSettingsLoading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <BrandLoader mode="inline" size="md" message="Loading database support configuration..." />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                  {/* Left Column: Configuration Form */}
                  <form onSubmit={handleSaveSupportSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* WhatsApp Channel Card */}
                    <div style={{ border: '1px solid var(--cream-deep)', padding: '18px', borderRadius: '4px', background: 'var(--paper)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>💬</span>
                          <strong style={{ fontSize: '14px', color: 'var(--ink)', fontFamily: "var(--font-sans)" }}>WhatsApp Channel</strong>
                        </div>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={supportForm.whatsappEnabled}
                            onChange={(e) => setSupportForm({ ...supportForm, whatsappEnabled: e.target.checked })}
                          />
                          Channel Active
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '4px' }}>
                            WHATSAPP NUMBER (CLEAN DIGITS) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2348030001234"
                            value={supportForm.whatsappNumber}
                            onChange={(e) => setSupportForm({ ...supportForm, whatsappNumber: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '4px' }}>
                            DISPLAY LABEL (PUBLIC)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. +234 803 000 1234"
                            value={supportForm.whatsappDisplay}
                            onChange={(e) => setSupportForm({ ...supportForm, whatsappDisplay: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--slate)', marginTop: '6px' }}>
                        Generates secure link: <code>https://wa.me/{supportForm.whatsappNumber.replace(/[^0-9]/g, '') || '...' }</code>
                      </div>
                    </div>

                    {/* Phone Helpline Card */}
                    <div style={{ border: '1px solid var(--cream-deep)', padding: '18px', borderRadius: '4px', background: 'var(--paper)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>📞</span>
                          <strong style={{ fontSize: '14px', color: 'var(--ink)', fontFamily: "var(--font-sans)" }}>Telephone Helplines</strong>
                        </div>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={supportForm.phoneEnabled}
                            onChange={(e) => setSupportForm({ ...supportForm, phoneEnabled: e.target.checked })}
                          />
                          Channel Active
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '4px' }}>
                            PHONE NUMBER (DIALABLE) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. +2348030001234"
                            value={supportForm.phone}
                            onChange={(e) => setSupportForm({ ...supportForm, phone: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '4px' }}>
                            DISPLAY LABEL (PUBLIC)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. +234 803 000 1234"
                            value={supportForm.phoneDisplay}
                            onChange={(e) => setSupportForm({ ...supportForm, phoneDisplay: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--slate)', marginTop: '6px' }}>
                        Generates action: <code>tel:{supportForm.phone || '...'}</code>
                      </div>
                    </div>

                    {/* Email Support Card */}
                    <div style={{ border: '1px solid var(--cream-deep)', padding: '18px', borderRadius: '4px', background: 'var(--paper)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>✉️</span>
                          <strong style={{ fontSize: '14px', color: 'var(--ink)', fontFamily: "var(--font-sans)" }}>Email Support Desk</strong>
                        </div>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={supportForm.emailEnabled}
                            onChange={(e) => setSupportForm({ ...supportForm, emailEnabled: e.target.checked })}
                          />
                          Channel Active
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '4px' }}>
                            SUPPORT EMAIL ADDRESS *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. support@markdriller.com"
                            value={supportForm.email}
                            onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '4px' }}>
                            DISPLAY EMAIL (PUBLIC)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. support@markdriller.com"
                            value={supportForm.emailDisplay}
                            onChange={(e) => setSupportForm({ ...supportForm, emailDisplay: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--slate)', marginTop: '6px' }}>
                        Generates action: <code>mailto:{supportForm.email || '...'}</code>
                      </div>
                    </div>

                    {/* Operational Hours */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: '5px' }}>
                        OPERATING HOURS / RESPONSE COMMITMENT NOTE
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Monday – Saturday: 8:00 AM – 8:00 PM WAT"
                        value={supportForm.workingHours}
                        onChange={(e) => setSupportForm({ ...supportForm, workingHours: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--ink)', borderRadius: '3px', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Save Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <button
                        type="submit"
                        disabled={updateSupportSettingsMutation.isPending}
                        className="btn-custom btn-custom-primary"
                        style={{ padding: '12px 28px', fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        {updateSupportSettingsMutation.isPending ? 'Saving & Updating MongoDB...' : '💾 Save Support Settings'}
                      </button>
                    </div>
                  </form>

                  {/* Right Column: Live Student Experience Preview */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'var(--paper)', border: '1.5px solid var(--cream-deep)', borderRadius: '4px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--cream-deep)', paddingBottom: '10px' }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: '11px', color: 'var(--rust)', fontWeight: 700, textTransform: 'uppercase' }}>
                          Live Candidate Experience Preview
                        </span>
                        <span style={{ fontSize: '10px', background: 'var(--forest-soft)', color: 'var(--forest)', border: '1px solid var(--forest)', padding: '2px 6px', fontWeight: 700, borderRadius: '2px' }}>
                          LIVE IN-APP PREVIEW
                        </span>
                      </div>

                      {/* Preview: Floating Button Widget */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--slate)', marginBottom: '6px', fontWeight: 600 }}>
                          FLOATING CONTACT BUTTON:
                        </div>
                        {supportForm.whatsappEnabled && supportForm.whatsappNumber ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: '#22c55e',
                              color: '#fff',
                              borderRadius: '50px',
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: 700,
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            <span>💬</span>
                            <span>Need Help? Chat on WhatsApp</span>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: 'var(--rust)',
                              color: '#fff',
                              borderRadius: '50px',
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: 700,
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            <span>✉️</span>
                            <span>Support Desk</span>
                          </div>
                        )}
                      </div>

                      {/* Preview: Support Channels Card */}
                      <div style={{ background: 'var(--white)', border: '1.5px solid var(--ink)', padding: '16px', borderRadius: '4px', boxShadow: '2px 2px 0 var(--ink)' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--ink)' }}>Official Contact Channels</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                          {supportForm.whatsappEnabled && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>💬</span>
                              <strong>WhatsApp:</strong>
                              <span style={{ color: '#16a34a', fontWeight: 600 }}>{supportForm.whatsappDisplay || supportForm.whatsappNumber}</span>
                            </div>
                          )}
                          {supportForm.phoneEnabled && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>📞</span>
                              <strong>Phone:</strong>
                              <span style={{ color: 'var(--rust)', fontWeight: 600 }}>{supportForm.phoneDisplay || supportForm.phone}</span>
                            </div>
                          )}
                          {supportForm.emailEnabled && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>✉️</span>
                              <strong>Email:</strong>
                              <span style={{ color: 'var(--steel)', fontWeight: 600 }}>{supportForm.emailDisplay || supportForm.email}</span>
                            </div>
                          )}
                          <div style={{ borderTop: '1px solid var(--paper-line)', paddingTop: '8px', marginTop: '4px', fontSize: '11.5px', color: 'var(--slate)' }}>
                            Hours: {supportForm.workingHours}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '16px', padding: '12px', background: 'var(--white)', border: '1px solid var(--cream-deep)', borderRadius: '3px', fontSize: '11px', color: 'var(--slate)', lineHeight: 1.5 }}>
                        <strong>🔒 Verification &amp; Security:</strong>
                        <br />
                        Changes are saved to the <code>SystemSetting</code> collection (key: <code>CUSTOMER_SUPPORT_CONFIG</code>) with admin audit tracking. The public endpoint <code>GET /api/support/contact-info</code> exposes ONLY safe contact channels without any internal system secrets.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

