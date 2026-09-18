import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStudyMaterialsQuery, StudyMaterialItem } from '../api/materials.js';
import { useExamsQuery } from '../api/exams.js';
import { useMySubscriptionQuery } from '../api/subscriptions.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { BrandLoader } from './BrandLoader.js';
import { UploadMaterialModal } from './UploadMaterialModal.js';
import { PortalHeader } from './PortalHeader.js';

export const StudyMaterialsView: React.FC = () => {
  const navigate = useNavigate();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [downloadErrorMsg, setDownloadErrorMsg] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const { data: currentSub } = useMySubscriptionQuery();
  const isPro = Boolean(currentSub?.isPro || user?.role === 'ADMIN');

  const { openAuthModal } = useAppStore();
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotificationStore();

  const { data: exams } = useExamsQuery();
  const { data: materials, isLoading, refetch } = useStudyMaterialsQuery({
    examId: selectedExamId || undefined,
    year: selectedYear || undefined,
    search: searchTerm || undefined,
  });

  const handleDownload = async (materialId: string, title: string, isPremium: boolean) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      notifyInfo('Please sign in or create an account to download revision materials.');
      return;
    }

    // Pre-emptively gate Pro study materials to avoid unauthorized requests
    if (isPremium && !isPro) {
      const upgradeMsg = 'This official curriculum guide is reserved for Pro Pass members. Upgrade for ₦3,500/month to download all 300 syllabus packs.';
      setDownloadErrorMsg(upgradeMsg);
      notifyWarning(upgradeMsg);
      return;
    }

    setDownloadSuccessMsg(null);
    setDownloadErrorMsg(null);
    setDownloadingId(materialId);

    try {
      const token = localStorage.getItem('md_token');
      const response = await fetch(`/api/materials/${materialId}/download`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 403) {
        const json = await response.json().catch(() => ({}));
        const msg = json.error?.message || 'A Pro subscription is required to download this official curriculum pack.';
        setDownloadErrorMsg(msg);
        notifyWarning(msg);
        return;
      }

      if (response.status === 404) {
        const json = await response.json().catch(() => ({}));
        const msg = json.error?.message || 'This study material is currently unavailable.';
        setDownloadErrorMsg(msg);
        notifyError(msg);
        return;
      }

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      const successMsg = `Downloaded "${title}". Ready for offline revision.`;
      setDownloadSuccessMsg(successMsg);
      notifySuccess(successMsg);
      setTimeout(() => setDownloadSuccessMsg(null), 4000);
      refetch();
    } catch {
      const errMsg = 'We could not complete your download. Please check your connection and try again.';
      setDownloadErrorMsg(errMsg);
      notifyError(errMsg);
    } finally {
      setDownloadingId(null);
    }
  };

  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Responsive Portal Header */}
      <PortalHeader
        badge="MATERIALS"
        badgeColor="forest"
        activePath="/materials"
        extraAction={
          isAdmin ? (
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              style={{
                padding: '6px 14px',
                background: 'var(--rust)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '2px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              + Upload Material
            </button>
          ) : undefined
        }
      />

      {/* Main Content */}
      <main className="wrap" style={{ flex: 1, padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 20px) 60px' }}>
        {/* Banner */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--forest)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            Official Syllabus Library
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', margin: '0 0 8px', color: 'var(--ink)' }}>
            Curriculum Summaries & Formula Booklets
          </h1>
          <p style={{ color: 'var(--slate)', fontSize: '15px', margin: 0 }}>
            Curated offline revision guides, essential mathematical formula sheets, and past question breakdown packs verified by senior Nigerian examiners.
          </p>
        </div>

        {downloadSuccessMsg && (
          <div style={{ padding: '12px 16px', background: '#eaf4ee', border: '1px solid var(--forest)', color: 'var(--forest)', fontSize: '13px', marginBottom: '24px' }}>
            ✓ {downloadSuccessMsg}
          </div>
        )}

        {downloadErrorMsg && (
          <div style={{ padding: '14px 18px', background: '#fdf0ed', border: '1.5px solid var(--rust)', color: 'var(--rust)', fontSize: '13px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🔒 {downloadErrorMsg}</span>
            <Link to="/pricing" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none' }}>
              View Pro Plans →
            </Link>
          </div>
        )}

        {/* Filter Bar */}
        <div className="responsive-filter-bar" style={{ background: 'var(--white)', border: '1px solid var(--ink)', padding: '18px 24px', marginBottom: '32px', boxShadow: '3px 3px 0 var(--ink)' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Exam Board:</span>
            <button
              onClick={() => setSelectedExamId('')}
              style={{
                padding: '6px 14px',
                border: '1px solid var(--ink)',
                background: selectedExamId === '' ? 'var(--ink)' : 'var(--white)',
                color: selectedExamId === '' ? 'var(--white)' : 'var(--ink)',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
              }}
            >
              All Boards
            </button>
            {exams?.map((e) => (
              <button
                key={e._id}
                onClick={() => setSelectedExamId(e._id)}
                style={{
                  padding: '6px 14px',
                  border: '1px solid var(--ink)',
                  background: selectedExamId === e._id ? 'var(--ink)' : 'var(--white)',
                  color: selectedExamId === e._id ? 'var(--white)' : 'var(--ink)',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: 'pointer',
                }}
              >
                {e.shortCode}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--ink)',
                fontSize: '13px',
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'var(--white)',
                cursor: 'pointer',
              }}
            >
              <option value="">All Series Years</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>

            <input
              type="text"
              placeholder="Search topics, formulas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="responsive-search-input"
              style={{
                padding: '8px 12px',
                border: '1px solid var(--ink)',
                fontSize: '13px',
                fontFamily: 'inherit',
                minWidth: '220px',
                boxSizing: 'border-box',
              }}
            />
            {isAdmin && (
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--ink)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                + Upload Material
              </button>
            )}
          </div>
        </div>

        {/* Pro Upgrade or Status Banner */}
        {downloadErrorMsg && (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#fffaf8',
              border: '1.5px solid var(--rust)',
              borderRadius: '3px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🔒</span>
              <span style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 500 }}>
                {downloadErrorMsg}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-custom btn-custom-primary"
                style={{ fontSize: '12px', padding: '6px 14px', backgroundColor: 'var(--rust)', borderColor: 'var(--rust)' }}
                onClick={() => navigate('/pricing')}
              >
                Upgrade to Pro Pass (₦3,500/mo) ★
              </button>
              <button
                type="button"
                onClick={() => setDownloadErrorMsg(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--ink-soft)' }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {downloadSuccessMsg && (
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: '#eaf4ee',
              border: '1px solid #65d996',
              borderRadius: '3px',
              marginBottom: '24px',
              fontSize: '13px',
              color: 'var(--forest)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>✓ {downloadSuccessMsg}</span>
            <button
              type="button"
              onClick={() => setDownloadSuccessMsg(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--forest)' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Materials Grid */}
        {isLoading ? (
          <BrandLoader mode="contained" message="Retrieving official curriculum guides..." />
        ) : materials && materials.length > 0 ? (
          <div className="materials-responsive-grid">
            {materials.map((item: StudyMaterialItem) => (
              <div
                key={item._id}
                style={{
                  background: 'var(--white)',
                  border: item.isPremium ? '1.5px solid var(--rust)' : '1px solid var(--ink)',
                  padding: '24px',
                  boxShadow: item.isPremium ? '4px 4px 0 var(--rust)' : '4px 4px 0 var(--ink)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          background: 'var(--cream)',
                          border: '1px solid var(--cream-deep)',
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}
                      >
                        {item.examId?.shortCode} • {item.subjectId?.code}
                      </span>
                      {item.isPremium && (
                        <span
                          style={{
                            padding: '2px 6px',
                            background: 'var(--rust)',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 700,
                            borderRadius: '2px',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          PRO PASS
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--slate)',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                      }}
                    >
                      {item.fileType.toUpperCase()} ({Math.round(item.fileSize / 1024)} KB)
                    </span>
                  </div>

                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', margin: '0 0 8px', color: 'var(--ink)', wordBreak: 'break-word' }}>
                    {item.title}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--slate)', lineHeight: 1.6, margin: '0 0 20px', wordBreak: 'break-word' }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--cream-deep)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--slate)', fontFamily: "'JetBrains Mono', monospace" }}>
                    ⬇ {item.downloadCount} downloads
                  </div>
                  <button
                    onClick={() => handleDownload(item._id, item.title, item.isPremium)}
                    disabled={downloadingId === item._id}
                    style={{
                      padding: '8px 16px',
                      background: item.isPremium ? (isPro ? 'var(--rust)' : 'var(--rust)') : 'var(--forest)',
                      color: 'var(--white)',
                      border: 'none',
                      fontSize: '12px',
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: downloadingId === item._id ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {downloadingId === item._id ? (
                      <BrandLoader mode="inline" size="sm" message="Preparing..." />
                    ) : item.isPremium ? (
                      isPro ? 'Download Pro Packet ↓' : 'Unlock Pro Packet 🔒'
                    ) : (
                      'Download Free Guide ↓'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '60px 24px', background: 'var(--white)', border: '1px solid var(--ink)', textAlign: 'center' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', margin: '0 0 8px' }}>No study guides found</h3>
            <p style={{ color: 'var(--slate)', fontSize: '14px', margin: '0 0 16px' }}>
              Try adjusting your search criteria or selecting "All Boards".
            </p>
            <button
              onClick={() => {
                setSelectedExamId('');
                setSearchTerm('');
              }}
              style={{
                padding: '6px 14px',
                border: '1px solid var(--ink)',
                background: 'var(--cream)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Admin Upload Modal */}
      {isAdmin && (
        <UploadMaterialModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};
