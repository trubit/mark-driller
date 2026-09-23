import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import {
  useCurrentUserQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
  useResendVerificationMutation,
  useDeleteAccountMutation,
} from '../api/auth.js';
import { useExamsQuery, useExamSubjectsQuery } from '../api/exams.js';
import { useMySubscriptionQuery, useMyPaymentsQuery } from '../api/subscriptions.js';
import { useMyBookmarksQuery, useToggleBookmarkMutation } from '../api/questions.js';
import { useResultsHistoryQuery } from '../api/results.js';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { apiClient } from '../api/client.js';

export type SettingsTab =
  | 'personal'
  | 'avatar'
  | 'exam'
  | 'security'
  | 'subscription'
  | 'bookmarks'
  | 'history'
  | 'danger';

interface UserSettingsViewProps {
  defaultTab?: SettingsTab;
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
];

export const UserSettingsView: React.FC<UserSettingsViewProps> = ({ defaultTab = 'personal' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || defaultTab;
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const { user, isAuthenticated, clearSession } = useAuthStore();
  const { data: userData } = useCurrentUserQuery();
  const { notifySuccess, notifyError } = useNotificationStore();
  const navigate = useNavigate();

  // Queries & Mutations
  const updateProfile = useUpdateProfileMutation();
  const uploadAvatar = useUploadAvatarMutation();
  const removeAvatar = useRemoveAvatarMutation();
  const resendVerification = useResendVerificationMutation();
  const deleteAccount = useDeleteAccountMutation();

  const { data: exams } = useExamsQuery();
  const { data: subscription } = useMySubscriptionQuery();
  const { data: payments, isLoading: paymentsLoading } = useMyPaymentsQuery();
  const { data: bookmarks, isLoading: bookmarksLoading } = useMyBookmarksQuery();
  const toggleBookmark = useToggleBookmarkMutation();

  // History pagination
  const [historyPage, setHistoryPage] = useState(1);
  const { data: historyData, isLoading: historyLoading } = useResultsHistoryQuery(historyPage, 10);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as SettingsTab;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const currentUser = userData?.user || user;
  const currentProfile = userData?.profile;

  // 1. Personal Info Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [stateOfResidence, setStateOfResidence] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
    }
    if (currentProfile) {
      setPhone(currentProfile.phone || '');
      setEducationLevel(currentProfile.educationLevel || '');
      setStateOfResidence(currentProfile.state || '');
    }
  }, [currentUser, currentProfile]);

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        fullName,
        phone,
        educationLevel,
        state: stateOfResidence,
      });
      notifySuccess('Personal profile details updated successfully.');
    } catch (err: any) {
      notifyError(err?.message || 'Failed to update personal profile.');
    }
  };

  // 2. Avatar Form State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notifyError('Please select a valid image file (JPEG, PNG, or WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      notifyError('Selected image exceeds the 2MB size limit. Please choose a smaller image.');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    try {
      await uploadAvatar.mutateAsync(avatarFile);
      setAvatarFile(null);
      setAvatarPreview(null);
      notifySuccess('Profile photo uploaded and updated successfully.');
    } catch (err: any) {
      notifyError(err?.message || 'Failed to upload profile photo.');
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await removeAvatar.mutateAsync();
      setAvatarFile(null);
      setAvatarPreview(null);
      notifySuccess('Profile photo removed.');
    } catch (err: any) {
      notifyError(err?.message || 'Failed to remove profile photo.');
    }
  };

  // 3. Exam Preferences Form State
  const activeExamId = (currentUser?.targetExam as any)?._id || (currentUser?.targetExam as any) || (exams && exams[0]?._id);
  const [selectedExamId, setSelectedExamId] = useState<string>(activeExamId || '');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const { data: subjectsForExam, isLoading: subjectsLoading } = useExamSubjectsQuery(selectedExamId);

  useEffect(() => {
    if (currentUser?.targetExam) {
      const id = (currentUser.targetExam as any)._id || currentUser.targetExam;
      setSelectedExamId(id);
    }
    if (currentUser?.selectedSubjects) {
      const ids = (currentUser.selectedSubjects as any[]).map((s) => s._id || s);
      setSelectedSubjectIds(ids);
    }
  }, [currentUser]);

  const toggleSubjectSelection = (subjectId: string) => {
    if (selectedSubjectIds.includes(subjectId)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== subjectId));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, subjectId]);
    }
  };

  const handleExamPreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        targetExamId: selectedExamId,
        selectedSubjects: selectedSubjectIds,
      });
      notifySuccess('Target examination board and subjects synced successfully.');
    } catch (err: any) {
      notifyError(err?.message || 'Failed to update examination preferences.');
    }
  };

  // 4. Security & Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Password strength checker
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 25;
    if (/[A-Z]/.test(newPassword)) score += 25;
    if (/[0-9]/.test(newPassword)) score += 25;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 25;
    return score;
  }, [newPassword]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notifyError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      notifyError('New password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiClient('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      notifySuccess('Your account password was updated successfully.');
    } catch (err: any) {
      notifyError(err?.message || 'Current password was incorrect or invalid.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // 5. Bookmarks Filter State
  const [bookmarkSearch, setBookmarkSearch] = useState('');
  const filteredBookmarks = useMemo(() => {
    if (!bookmarks) return [];
    return bookmarks.filter((b) => {
      const q = bookmarkSearch.toLowerCase().trim();
      if (!q) return true;
      const text = b.question?.questionText?.toLowerCase() || '';
      const subj = b.question?.subjectId?.name?.toLowerCase() || '';
      const exam = b.question?.examId?.name?.toLowerCase() || '';
      return text.includes(q) || subj.includes(q) || exam.includes(q);
    });
  }, [bookmarks, bookmarkSearch]);

  // 6. Danger Zone State
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      notifyError('Please type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount.mutateAsync({
        password: deletePassword,
        confirmationText: deleteConfirmText,
      });
      notifySuccess('Your account has been deleted permanently.');
      navigate('/');
    } catch (err: any) {
      notifyError(err?.message || 'Failed to delete account. Please verify your password.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentUser) return null;

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <main className="wrap" style={{ flex: 1, padding: '32px 20px 60px 20px', maxWidth: '1160px', margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '24px' }}>
          <Link to="/dashboard" style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>Dashboard</Link>
          <span>/</span>
          <Link to="/profile" style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>Student Profile</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>Account Settings</span>
        </div>

        {/* Page Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1
            style={{
              fontSize: 'clamp(26px, 3.8vw, 36px)',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '0 0 8px 0',
              fontFamily: "var(--font-sans)",
            }}
          >
            Account Preferences &amp; Settings
          </h1>
          <p style={{ fontSize: '14.5px', color: 'var(--ink-soft)', margin: 0 }}>
            Manage your personal profile, security credentials, examination curricula, subscription tiers, and saved study materials.
          </p>
        </div>

        {/* Layout Grid: Sidebar Navigation + Content Area */}
        <div
          className="settings-layout-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 260px) minmax(0, 1fr)',
            gap: 'clamp(16px, 3vw, 24px)',
            alignItems: 'start',
          }}
        >
          {/* Navigation Sidebar / Tabs */}
          <nav
            className="settings-nav-sidebar"
            aria-label="Account Settings Navigation"
            style={{
              backgroundColor: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '10px',
              padding: '12px',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {[
              { id: 'personal', label: 'Personal Information', icon: '👤' },
              { id: 'avatar', label: 'Profile Photo', icon: '📷' },
              { id: 'exam', label: 'Examination Preferences', icon: '🏛️' },
              { id: 'security', label: 'Security & Password', icon: '🔒' },
              { id: 'subscription', label: 'Subscription & Billing', icon: '★' },
              { id: 'bookmarks', label: 'Saved Bookmarks', icon: '📑' },
              { id: 'history', label: 'Attempt History', icon: '📊' },
              { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              const isDanger = tab.id === 'danger';
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id as SettingsTab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: active
                      ? isDanger
                        ? 'rgba(220, 38, 38, 0.12)'
                        : 'var(--forest-soft, rgba(34, 90, 56, 0.12))'
                      : 'transparent',
                    color: active
                      ? isDanger
                        ? 'var(--color-error)'
                        : 'var(--forest, #225a38)'
                      : isDanger
                      ? 'var(--color-error)'
                      : 'var(--ink)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '14px',
                    fontFamily: "var(--font-sans)",
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Main Content Area */}
          <div
            style={{
              gridColumn: 'span 2',
              backgroundColor: 'var(--white)',
              border: '1.5px solid var(--paper-line)',
              borderRadius: '10px',
              padding: 'clamp(20px, 3.5vw, 36px)',
              boxShadow: 'var(--card-shadow)',
              minHeight: '520px',
            }}
          >
            {/* 1. PERSONAL INFORMATION TAB */}
            {activeTab === 'personal' && (
              <div>
                <div style={{ borderBottom: '1px solid var(--paper-line)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                    Personal Information
                  </h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: 0 }}>
                    Update your official name and location details for academic credentials and mock results.
                  </p>
                </div>

                <form onSubmit={handlePersonalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aminat Olawale"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '6px',
                        border: '1.5px solid var(--paper-line)',
                        backgroundColor: 'var(--paper)',
                        color: 'var(--ink)',
                        fontSize: '14.5px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Email (Read-only notice) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      Registered Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '6px',
                        border: '1.5px solid var(--paper-line)',
                        backgroundColor: 'var(--paper-dim, #e0e3d9)',
                        color: 'var(--ink-soft)',
                        fontSize: '14.5px',
                        cursor: 'not-allowed',
                      }}
                    />
                    <span style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '4px', display: 'block' }}>
                      Email address is tied to your CBT results and account security. Contact support to request an email change.
                    </span>
                  </div>

                  {/* Phone & State of Residence */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 08012345678"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '6px',
                          border: '1.5px solid var(--paper-line)',
                          backgroundColor: 'var(--paper)',
                          color: 'var(--ink)',
                          fontSize: '14.5px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                        State of Residence
                      </label>
                      <select
                        value={stateOfResidence}
                        onChange={(e) => setStateOfResidence(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '6px',
                          border: '1.5px solid var(--paper-line)',
                          backgroundColor: 'var(--paper)',
                          color: 'var(--ink)',
                          fontSize: '14.5px',
                          outline: 'none',
                        }}
                      >
                        <option value="">Select Nigerian State...</option>
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Education Level */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      Current Education Level
                    </label>
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '6px',
                        border: '1.5px solid var(--paper-line)',
                        backgroundColor: 'var(--paper)',
                        color: 'var(--ink)',
                        fontSize: '14.5px',
                        outline: 'none',
                      }}
                    >
                      <option value="">Select Level...</option>
                      <option value="Senior Secondary School (SS3 / WASSCE)">Senior Secondary School (SS3 / WASSCE)</option>
                      <option value="Senior Secondary School (SS1-SS2)">Senior Secondary School (SS1-SS2)</option>
                      <option value="JAMB / UTME Candidate">JAMB / UTME Candidate</option>
                      <option value="Post-UTME / University Aspirant">Post-UTME / University Aspirant</option>
                      <option value="Undergraduate Student">Undergraduate Student</option>
                      <option value="Teacher / Tutor / Educator">Teacher / Tutor / Educator</option>
                    </select>
                  </div>

                  {/* Save Button */}
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="btn-custom btn-custom-primary"
                      style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 700 }}
                    >
                      {updateProfile.isPending ? 'Saving Changes...' : 'Save Profile Details'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. PROFILE PHOTO TAB */}
            {activeTab === 'avatar' && (
              <div>
                <div style={{ borderBottom: '1px solid var(--paper-line)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                    Profile Photo &amp; Avatar
                  </h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: 0 }}>
                    Upload an authentic profile image (PNG, JPEG, or WEBP under 2MB). Executables and unverified file types are strictly rejected.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
                  {/* Current / Preview Avatar */}
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--rust, #a8562f)',
                      color: 'var(--white)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '44px',
                      fontFamily: "var(--font-sans)",
                      overflow: 'hidden',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                      border: '4px solid var(--white)',
                    }}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
                    <label
                      htmlFor="avatar-file-input"
                      className="btn-custom btn-custom-ghost"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '10px 20px',
                        width: '100%',
                        fontSize: '14px',
                        marginBottom: '10px',
                      }}
                    >
                      <span>📁 Select Image File</span>
                    </label>
                    <input
                      id="avatar-file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarFileSelect}
                      style={{ display: 'none' }}
                    />

                    {avatarFile && (
                      <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--forest, #225a38)', fontWeight: 600 }}>
                        Selected: {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      {avatarFile && (
                        <button
                          type="button"
                          onClick={handleAvatarUpload}
                          disabled={uploadAvatar.isPending}
                          className="btn-custom btn-custom-primary"
                          style={{ padding: '8px 20px', fontSize: '13.5px' }}
                        >
                          {uploadAvatar.isPending ? 'Uploading & Verifying...' : 'Upload & Save Photo'}
                        </button>
                      )}

                      {currentUser.avatar && (
                        <button
                          type="button"
                          onClick={handleAvatarRemove}
                          disabled={removeAvatar.isPending}
                          style={{
                            background: 'none',
                            border: '1px solid var(--paper-line)',
                            borderRadius: '4px',
                            color: 'var(--color-error)',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {removeAvatar.isPending ? 'Removing...' : 'Remove Photo'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div
                    style={{
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--paper-line)',
                      borderRadius: '8px',
                      padding: '16px 20px',
                      fontSize: '13px',
                      color: 'var(--ink-soft)',
                      maxWidth: '540px',
                      lineHeight: 1.5,
                      textAlign: 'left',
                    }}
                  >
                    🔒 <strong>Security &amp; Integrity:</strong> MarkDriller inspects raw binary magic bytes upon upload to ensure files are genuine image formats. Executable code, scripts, or non-image assets are automatically blocked.
                  </div>
                </div>
              </div>
            )}

            {/* 3. EXAMINATION PREFERENCES TAB */}
            {activeTab === 'exam' && (
              <div>
                <div style={{ borderBottom: '1px solid var(--paper-line)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                    Examination Profile &amp; Subject Combination
                  </h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: 0 }}>
                    Select your primary examination target. Subjects adapt dynamically to the official syllabuses for your chosen board.
                  </p>
                </div>

                <form onSubmit={handleExamPreferencesSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Exam Board Dropdown */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      Active Examination Board
                    </label>
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '6px',
                        border: '1.5px solid var(--paper-line)',
                        backgroundColor: 'var(--paper)',
                        color: 'var(--ink)',
                        fontSize: '15px',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    >
                      {exams?.map((ex) => (
                        <option key={ex._id} value={ex._id}>
                          {ex.name} ({ex.shortCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subjects Checklist */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                      Registered Subject Combination ({selectedSubjectIds.length} Selected)
                    </label>

                    {subjectsLoading ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                        Loading syllabus subjects...
                      </div>
                    ) : subjectsForExam && subjectsForExam.length > 0 ? (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                          gap: '10px',
                          maxHeight: '340px',
                          overflowY: 'auto',
                          padding: '12px',
                          border: '1.5px solid var(--paper-line)',
                          borderRadius: '8px',
                          backgroundColor: 'var(--paper)',
                        }}
                      >
                        {subjectsForExam.map((subj) => {
                          const isSelected = selectedSubjectIds.includes(subj._id);
                          return (
                            <div
                              key={subj._id}
                              onClick={() => toggleSubjectSelection(subj._id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                backgroundColor: isSelected ? 'var(--forest-soft, rgba(34, 90, 56, 0.12))' : 'var(--white)',
                                border: isSelected ? '1.5px solid var(--forest, #225a38)' : '1px solid var(--paper-line)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // Controlled by container click
                                style={{ accentColor: 'var(--forest, #225a38)', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '13.5px', fontWeight: isSelected ? 700 : 500, color: 'var(--ink)' }}>
                                {subj.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>
                        No subjects available for this examination.
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="btn-custom btn-custom-primary"
                      style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 700 }}
                    >
                      {updateProfile.isPending ? 'Syncing Curricula...' : 'Save Examination Preferences'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 4. SECURITY & PASSWORD TAB */}
            {activeTab === 'security' && (
              <div>
                <div style={{ borderBottom: '1px solid var(--paper-line)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                    Security &amp; Password Management
                  </h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: 0 }}>
                    Manage login credentials, verify your primary email, and review active session security.
                  </p>
                </div>

                {/* Email Verification Card */}
                <div
                  style={{
                    backgroundColor: 'var(--paper)',
                    border: '1.5px solid var(--paper-line)',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
                        Email Verification Status
                      </span>
                      {currentUser.isVerified ? (
                        <span
                          style={{
                            backgroundColor: 'var(--forest-soft, rgba(34, 90, 56, 0.12))',
                            color: 'var(--forest, #225a38)',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          ✓ VERIFIED
                        </span>
                      ) : (
                        <span
                          style={{
                            backgroundColor: 'var(--amber-soft, rgba(226, 154, 60, 0.15))',
                            color: 'var(--amber-deep, #c17d24)',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          ! UNVERIFIED
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0 }}>
                      {currentUser.isVerified
                        ? 'Your primary email is verified. Official CBT result slips and payment notifications are dispatched here.'
                        : 'Your email address has not been confirmed. Please verify to ensure you receive test results and account recovery codes.'}
                    </p>
                  </div>

                  {!currentUser.isVerified && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await resendVerification.mutateAsync({ email: currentUser.email });
                          notifySuccess('Verification code sent! Please check your email inbox or spam folder.');
                        } catch (err: any) {
                          notifyError(err?.message || 'Failed to resend verification code.');
                        }
                      }}
                      disabled={resendVerification.isPending}
                      className="btn-custom btn-custom-primary"
                      style={{ fontSize: '13px', padding: '8px 16px', whiteSpace: 'nowrap' }}
                    >
                      {resendVerification.isPending ? 'Sending Code...' : 'Resend Verification Code'}
                    </button>
                  )}
                </div>

                {/* Change Password Form */}
                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '520px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    Change Account Password
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      Current Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '6px',
                        border: '1.5px solid var(--paper-line)',
                        backgroundColor: 'var(--paper)',
                        color: 'var(--ink)',
                        fontSize: '14.5px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter at least 6 characters"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '6px',
                        border: '1.5px solid var(--paper-line)',
                        backgroundColor: 'var(--paper)',
                        color: 'var(--ink)',
                        fontSize: '14.5px',
                        outline: 'none',
                      }}
                    />

                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ height: '5px', borderRadius: '3px', backgroundColor: 'var(--paper-line)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${passwordStrength}%`,
                              backgroundColor: passwordStrength < 50 ? 'var(--color-error)' : passwordStrength < 75 ? '#d97706' : '#16a34a',
                              transition: 'width 0.2s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '4px', display: 'block' }}>
                          Strength: {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Moderate' : 'Strong'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '6px',
                        border: '1.5px solid var(--paper-line)',
                        backgroundColor: 'var(--paper)',
                        color: 'var(--ink)',
                        fontSize: '14.5px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="show-pass-check"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      style={{ accentColor: 'var(--forest, #225a38)', cursor: 'pointer' }}
                    />
                    <label htmlFor="show-pass-check" style={{ fontSize: '13px', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                      Show password characters
                    </label>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="btn-custom btn-custom-primary"
                      style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 700 }}
                    >
                      {passwordLoading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 5. SUBSCRIPTION & BILLING TAB */}
            {activeTab === 'subscription' && (
              <div>
                <div style={{ borderBottom: '1px solid var(--paper-line)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                    Subscription &amp; Transaction Ledger
                  </h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: 0 }}>
                    Overview of your active subscription tier, direct bank-transfer proof reviews, and past payment receipts.
                  </p>
                </div>

                {/* Active Plan Card */}
                <div
                  style={{
                    backgroundColor: 'var(--paper)',
                    border: '1.5px solid var(--paper-line)',
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Active Subscription Tier
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: isPro ? 'var(--forest, #225a38)' : 'var(--ink)', fontFamily: "var(--font-sans)" }}>
                      {subscription?.plan ? subscription.plan.replace('_', ' ') : 'FREE STARTER'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                      Status: <strong style={{ color: 'var(--ink)' }}>{subscription?.status || 'ACTIVE'}</strong>
                      {subscription?.endDate && (
                        <span> • Valid until {new Date(subscription.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link
                      to="/portal/pricing"
                      className="btn-custom btn-custom-primary"
                      style={{ textDecoration: 'none', padding: '10px 18px', fontSize: '13.5px' }}
                    >
                      {isPro ? 'Extend / Change Tier' : 'Upgrade to Pro ➔'}
                    </Link>
                    <Link
                      to="/portal/activate"
                      className="btn-custom btn-custom-ghost"
                      style={{ textDecoration: 'none', padding: '10px 18px', fontSize: '13.5px' }}
                    >
                      Redeem Scratch Card PIN
                    </Link>
                  </div>
                </div>

                {/* Payment History Table */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px' }}>
                    Transaction History &amp; Payment Proofs
                  </h3>

                  {paymentsLoading ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                      Loading payment transactions...
                    </div>
                  ) : payments && payments.length > 0 ? (
                    <>
                      {/* Mobile Payments Card View (<= 680px) */}
                      <div className="cards-mobile-only" style={{ marginBottom: '16px' }}>
                        {payments.map((p) => (
                          <div key={p._id} className="mobile-attempt-card">
                            <div className="mobile-attempt-header">
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--paper)', color: 'var(--ink)' }}>
                                {p.provider.replace(/_/g, ' ')}
                              </span>
                              <span className="mobile-attempt-date">
                                {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                                Ref: <strong>{p.reference}</strong>
                              </span>
                              <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                                ₦{Math.round(p.amountKobo / 100).toLocaleString()}
                              </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                              <span
                                style={{
                                  backgroundColor:
                                    p.status === 'SUCCESS'
                                      ? 'var(--forest-soft, rgba(34, 90, 56, 0.12))'
                                      : p.status === 'PENDING_REVIEW'
                                      ? 'var(--amber-soft, rgba(226, 154, 60, 0.12))'
                                      : 'rgba(220, 38, 38, 0.1)',
                                  color:
                                    p.status === 'SUCCESS'
                                      ? 'var(--forest, #225a38)'
                                      : p.status === 'PENDING_REVIEW'
                                      ? 'var(--amber-deep, #c17d24)'
                                      : 'var(--color-error)',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  fontSize: '11.5px',
                                }}
                              >
                                {p.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table View (> 680px) */}
                      <div className="table-desktop-only table-responsive" style={{ overflowX: 'auto', marginBottom: '16px' }}>
                        <table style={{ width: '100%', minWidth: '580px', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1.5px solid var(--paper-line)', color: 'var(--ink-soft)' }}>
                              <th style={{ padding: '10px 12px' }}>Date</th>
                              <th style={{ padding: '10px 12px' }}>Reference</th>
                              <th style={{ padding: '10px 12px' }}>Amount</th>
                              <th style={{ padding: '10px 12px' }}>Provider / Method</th>
                              <th style={{ padding: '10px 12px' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((p) => (
                              <tr key={p._id} style={{ borderBottom: '1px solid var(--paper-line)' }}>
                                <td style={{ padding: '12px' }}>
                                  {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td style={{ padding: '12px', fontFamily: "var(--font-sans)", fontWeight: 600 }}>
                                  {p.reference}
                                </td>
                                <td style={{ padding: '12px', fontWeight: 700 }}>
                                  ₦{Math.round(p.amountKobo / 100).toLocaleString()}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--ink-soft)' }}>
                                  {p.provider.replace(/_/g, ' ')}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span
                                    style={{
                                      backgroundColor:
                                        p.status === 'SUCCESS'
                                          ? 'var(--forest-soft, rgba(34, 90, 56, 0.12))'
                                          : p.status === 'PENDING_REVIEW'
                                          ? 'var(--amber-soft, rgba(226, 154, 60, 0.12))'
                                          : 'rgba(220, 38, 38, 0.1)',
                                      color:
                                        p.status === 'SUCCESS'
                                          ? 'var(--forest, #225a38)'
                                          : p.status === 'PENDING_REVIEW'
                                          ? 'var(--amber-deep, #c17d24)'
                                          : 'var(--color-error)',
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      fontWeight: 700,
                                      fontSize: '11px',
                                    }}
                                  >
                                    {p.status}
                                  </span>
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
                        borderRadius: '6px',
                        padding: '30px 20px',
                        textAlign: 'center',
                        color: 'var(--ink-soft)',
                        fontSize: '13.5px',
                        border: '1px dashed var(--paper-line)',
                      }}
                    >
                      No payment transactions found on this account yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. SAVED BOOKMARKS TAB */}
            {activeTab === 'bookmarks' && (
              <div>
                <div style={{ borderBottom: '1px solid var(--paper-line)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                    Saved Questions &amp; Bookmarks ({bookmarks?.length || 0})
                  </h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: 0 }}>
                    Review questions saved during CBT mock sessions or past question drilling for rapid revision.
                  </p>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="Filter saved questions by text, subject, or exam..."
                    value={bookmarkSearch}
                    onChange={(e) => setBookmarkSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '6px',
                      border: '1.5px solid var(--paper-line)',
                      backgroundColor: 'var(--paper)',
                      color: 'var(--ink)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                {bookmarksLoading ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                    Loading saved bookmarks...
                  </div>
                ) : filteredBookmarks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredBookmarks.map((b) => (
                      <div
                        key={b.bookmarkId}
                        style={{
                          backgroundColor: 'var(--paper)',
                          border: '1px solid var(--paper-line)',
                          borderRadius: '8px',
                          padding: '18px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span
                              style={{
                                backgroundColor: 'var(--forest-soft, rgba(34, 90, 56, 0.12))',
                                color: 'var(--forest, #225a38)',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              {b.question?.examId?.shortCode || 'EXAM'}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-soft)' }}>
                              {b.question?.subjectId?.name} • Year {b.question?.year}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await toggleBookmark.mutateAsync(b.question._id);
                                notifySuccess('Bookmark removed.');
                              } catch (err: any) {
                                notifyError(err?.message || 'Failed to remove bookmark.');
                              }
                            }}
                            title="Remove Bookmark"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-error)',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                          >
                            ✕ Remove
                          </button>
                        </div>

                        <p style={{ fontSize: '14.5px', color: 'var(--ink)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                          {b.question?.questionText}
                        </p>

                        <div style={{ fontSize: '12.5px', color: 'var(--forest, #225a38)', fontWeight: 600 }}>
                          Correct Answer: Option {b.question?.correctAnswer}
                        </div>
                      </div>
                    ))}
                  </div>
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
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>📑</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                      No saved bookmarks found
                    </h3>
                    <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', maxWidth: '420px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                      You haven't bookmarked any questions yet. While practicing past questions or taking mock exams, click the bookmark icon to save tricky questions here.
                    </p>
                    <Link
                      to="/portal/questions"
                      className="btn-custom btn-custom-primary"
                      style={{ textDecoration: 'none', display: 'inline-flex', fontSize: '13px', padding: '8px 18px' }}
                    >
                      Browse Past Questions Catalog ➔
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 7. ATTEMPT HISTORY TAB */}
            {activeTab === 'history' && (
              <div>
                <div style={{ borderBottom: '1px solid var(--paper-line)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                    Full Examination &amp; Attempt Records
                  </h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: 0 }}>
                    Review every timed CBT mock and practice drill you have completed on MarkDriller.
                  </p>
                </div>

                {historyLoading ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                    Loading complete history...
                  </div>
                ) : historyData?.results && historyData.results.length > 0 ? (
                  <div>
                    {/* Mobile Attempt Cards (<= 680px) */}
                    <div className="cards-mobile-only" style={{ marginBottom: '20px' }}>
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

                    {/* Desktop Full Table (> 680px) */}
                    <div className="table-desktop-only table-responsive" style={{ overflowX: 'auto', marginBottom: '20px' }}>
                      <table style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1.5px solid var(--paper-line)', color: 'var(--ink-soft)' }}>
                            <th style={{ padding: '10px 12px', minWidth: '150px' }}>Examination</th>
                            <th style={{ padding: '10px 12px', minWidth: '140px' }}>Subject</th>
                            <th style={{ padding: '10px 12px' }}>Score</th>
                            <th style={{ padding: '10px 12px' }}>Percentage</th>
                            <th style={{ padding: '10px 12px' }}>Date</th>
                            <th style={{ padding: '10px 12px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyData.results.map((r) => (
                            <tr key={r._id} style={{ borderBottom: '1px solid var(--paper-line)' }}>
                              <td style={{ padding: '12px', fontWeight: 600, color: 'var(--ink)', minWidth: '150px' }}>
                                {r.examId?.name || r.examId?.shortCode || 'CBT Mock'}
                              </td>
                              <td style={{ padding: '12px', color: 'var(--ink-soft)', minWidth: '140px' }}>
                                {r.subjectId?.name || 'Multi-Subject'}
                              </td>
                              <td style={{ padding: '12px', fontWeight: 700, fontFamily: "var(--font-sans)" }}>
                                {r.score} / {r.maxScore}
                              </td>
                              <td style={{ padding: '12px' }}>
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
                              <td style={{ padding: '12px', color: 'var(--ink-soft)' }}>
                                {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td style={{ padding: '12px' }}>
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

                    {/* Pagination Controls */}
                    {historyData.pagination && historyData.pagination.totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px' }}>
                        <button
                          type="button"
                          disabled={!historyData.pagination.hasPrevPage}
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                          className="btn-custom btn-custom-ghost"
                          style={{ fontSize: '12.5px', padding: '6px 14px' }}
                        >
                          ← Previous Page
                        </button>
                        <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                          Page {historyData.pagination.page} of {historyData.pagination.totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={!historyData.pagination.hasNextPage}
                          onClick={() => setHistoryPage((p) => p + 1)}
                          className="btn-custom btn-custom-ghost"
                          style={{ fontSize: '12.5px', padding: '6px 14px' }}
                        >
                          Next Page →
                        </button>
                      </div>
                    )}
                  </div>
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
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                      No examination records found
                    </h3>
                    <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', maxWidth: '420px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                      Your complete history will appear here once you begin taking CBT mocks or practice quizzes.
                    </p>
                    <Link
                      to="/dashboard"
                      className="btn-custom btn-custom-primary"
                      style={{ textDecoration: 'none', display: 'inline-flex', fontSize: '13px', padding: '8px 18px' }}
                    >
                      Take First Mock Test ➔
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 8. DANGER ZONE TAB */}
            {activeTab === 'danger' && (
              <div>
                <div style={{ borderBottom: '1.5px solid rgba(220, 38, 38, 0.2)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-error)', margin: '0 0 6px 0' }}>
                    Danger Zone: Irreversible Account Actions
                  </h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)', margin: 0 }}>
                    Actions performed in this area cannot be undone. Please proceed with utmost caution.
                  </p>
                </div>

                {/* Danger 1: Logout Other Devices */}
                <div
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.04)',
                    border: '1.5px solid rgba(220, 38, 38, 0.2)',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                      Sign Out Everywhere
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-soft)' }}>
                      End your active browser session immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearSession();
                      notifySuccess('You have been signed out.');
                      navigate('/');
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1.5px solid var(--paper-line)',
                      borderRadius: '6px',
                      color: 'var(--ink)',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Sign Out Now
                  </button>
                </div>

                {/* Danger 2: Permanent Account Deletion */}
                <div
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.05)',
                    border: '1.5px solid rgba(220, 38, 38, 0.3)',
                    borderRadius: '8px',
                    padding: '24px',
                  }}
                >
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: 'var(--color-error)' }}>
                    Permanently Delete MarkDriller Account
                  </h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    Deleting your account permanently removes your identity, profile photo, verified status, active subscriptions, mock attempt records, and saved bookmarks from our database. This action is <strong>irreversible</strong>.
                  </p>

                  <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                        Type <span style={{ color: 'var(--color-error)', fontFamily: "var(--font-sans)" }}>DELETE MY ACCOUNT</span> to confirm
                      </label>
                      <input
                        type="text"
                        required
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE MY ACCOUNT"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid rgba(220, 38, 38, 0.4)',
                          backgroundColor: 'var(--white)',
                          color: 'var(--ink)',
                          fontSize: '13.5px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your current password"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid rgba(220, 38, 38, 0.4)',
                          backgroundColor: 'var(--white)',
                          color: 'var(--ink)',
                          fontSize: '13.5px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                        style={{
                          backgroundColor: deleteConfirmText === 'DELETE MY ACCOUNT' ? 'var(--color-error)' : '#9ca3af',
                          color: 'var(--white)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px 20px',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          cursor: deleteConfirmText === 'DELETE MY ACCOUNT' ? 'pointer' : 'not-allowed',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {isDeleting ? 'Deleting Account...' : 'Permanently Delete Account'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

