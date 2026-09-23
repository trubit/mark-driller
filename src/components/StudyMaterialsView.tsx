import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useStudyMaterialDetailQuery,
  useStudyMaterialsLibraryQuery,
  StudyMaterialItem,
} from '../api/materials.js';
import { useExamSubjectsQuery, useExamsQuery } from '../api/exams.js';
import { useMySubscriptionQuery } from '../api/subscriptions.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { BrandLoader } from './BrandLoader.js';
import { UploadMaterialModal } from './UploadMaterialModal.js';

type MaterialSort = 'newest' | 'oldest' | 'title' | 'downloads';
type AccessFilter = '' | 'false' | 'true';

const PAGE_SIZE = 12;

const formatFileSize = (bytes: number) => {
  if (!bytes) return 'File size unavailable';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatMaterialDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

const materialMeta = (material: StudyMaterialItem) =>
  [
    material.examId?.shortCode,
    material.subjectId?.name || material.subjectId?.code,
    material.year,
    material.fileType ? material.fileType.toUpperCase() : 'DOCUMENT',
  ].filter(Boolean).join(' · ');

const EXAM_VISUALS: Record<string, { image: string; label: string; tone: string }> = {
  WAEC: { image: '/assets/logos/waec.png', label: 'WAEC revision pack', tone: 'materials-visual-waec' },
  WASSCE: { image: '/assets/logos/waec.png', label: 'WAEC revision pack', tone: 'materials-visual-waec' },
  JAMB: { image: '/assets/logos/jamb.png', label: 'JAMB UTME study file', tone: 'materials-visual-jamb' },
  UTME: { image: '/assets/logos/jamb.png', label: 'JAMB UTME study file', tone: 'materials-visual-jamb' },
  NECO: { image: '/assets/logos/neco.png', label: 'NECO study file', tone: 'materials-visual-neco' },
  NABTEB: { image: '/assets/logos/nabteb.png', label: 'NABTEB technical file', tone: 'materials-visual-nabteb' },
  GCE: { image: '/assets/logos/waec.png', label: 'GCE private candidate file', tone: 'materials-visual-gce' },
  'POST-UTME': { image: '/assets/logos/jamb.png', label: 'Post-UTME admission prep', tone: 'materials-visual-postutme' },
  POSTUTME: { image: '/assets/logos/jamb.png', label: 'Post-UTME admission prep', tone: 'materials-visual-postutme' },
};

const getMaterialVisual = (material: StudyMaterialItem) => {
  const examText = `${material.examId?.shortCode || ''} ${material.examId?.name || ''} ${material.title}`.toUpperCase();
  const match = Object.entries(EXAM_VISUALS).find(([key]) => examText.includes(key));
  return match?.[1] || { image: '/favicon.svg', label: 'MarkDriller study document', tone: 'materials-visual-default' };
};

export const StudyMaterialsView: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAppStore();
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotificationStore();

  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('');
  const [sort, setSort] = useState<MaterialSort>('newest');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: exams, isLoading: examsLoading } = useExamsQuery();
  const { data: subjects, isLoading: subjectsLoading } = useExamSubjectsQuery(selectedExamId || undefined);
  const { data: currentSub } = useMySubscriptionQuery();
  const isAdmin = user?.role === 'ADMIN';
  const hasProAccess = Boolean(currentSub?.isPro || isAdmin);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const libraryQuery = useStudyMaterialsLibraryQuery({
    examId: selectedExamId || undefined,
    subjectId: selectedSubjectId || undefined,
    year: selectedYear || undefined,
    premiumOnly: accessFilter || undefined,
    search: searchTerm || undefined,
    sort,
    page,
    limit: PAGE_SIZE,
  });

  const { data: selectedMaterial, isLoading: detailLoading } = useStudyMaterialDetailQuery(selectedMaterialId || '');

  const materials = libraryQuery.data?.items || [];
  const totalMaterials = libraryQuery.data?.total || 0;
  const totalPages = libraryQuery.data?.totalPages || 1;
  const selectedExam = exams?.find((exam) => exam._id === selectedExamId);
  const activeFilterCount = [selectedExamId, selectedSubjectId, selectedYear, accessFilter, searchTerm].filter(Boolean).length;

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, index) => String(currentYear - index));
  }, []);

  const resetFilters = () => {
    setSelectedExamId('');
    setSelectedSubjectId('');
    setSelectedYear('');
    setAccessFilter('');
    setSearchInput('');
    setSearchTerm('');
    setSort('newest');
    setPage(1);
  };

  const handleDownload = async (material: StudyMaterialItem) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      notifyInfo('Please sign in to download study materials.');
      return;
    }

    if (material.isPremium && !hasProAccess) {
      const message = 'This study material requires an active Pro subscription.';
      setStatusMessage({ type: 'error', text: message });
      notifyWarning(message);
      return;
    }

    setDownloadingId(material._id);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('md_token');
      const response = await fetch(`/api/materials/${material._id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.status === 403) {
        const json = await response.json().catch(() => ({}));
        const message = json.error?.message || 'An active Pro subscription is required for this material.';
        setStatusMessage({ type: 'error', text: message });
        notifyWarning(message);
        return;
      }

      if (response.status === 404) {
        const json = await response.json().catch(() => ({}));
        const message = json.error?.message || 'This study material is currently unavailable.';
        setStatusMessage({ type: 'error', text: message });
        notifyError(message);
        return;
      }

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `${material.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);

      const message = `"${material.title}" is ready for offline revision.`;
      setStatusMessage({ type: 'success', text: message });
      notifySuccess(message);
      libraryQuery.refetch();
    } catch {
      const message = 'We could not complete this download. Please check your connection and try again.';
      setStatusMessage({ type: 'error', text: message });
      notifyError(message);
    } finally {
      setDownloadingId(null);
    }
  };

  const FilterPanel = (
    <form
      className="materials-filter-panel"
      onSubmit={(event) => {
        event.preventDefault();
        setSearchTerm(searchInput.trim());
        setFiltersOpen(false);
      }}
    >
      <div className="materials-filter-head">
        <div>
          <span className="materials-kicker">Discovery</span>
          <h2>Find the right material</h2>
        </div>
        {activeFilterCount > 0 && (
          <button type="button" className="materials-text-button" onClick={resetFilters}>
            Clear all
          </button>
        )}
      </div>

      <label className="materials-field">
        <span>Search library</span>
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Title, subject, topic or filename"
        />
      </label>

      <label className="materials-field">
        <span>Examination board</span>
        <select
          value={selectedExamId}
          onChange={(event) => {
            setSelectedExamId(event.target.value);
            setSelectedSubjectId('');
            setPage(1);
          }}
          disabled={examsLoading}
        >
          <option value="">All boards</option>
          {exams?.map((exam) => (
            <option key={exam._id} value={exam._id}>
              {exam.shortCode} - {exam.name}
            </option>
          ))}
        </select>
      </label>

      <label className="materials-field">
        <span>Subject</span>
        <select
          value={selectedSubjectId}
          onChange={(event) => {
            setSelectedSubjectId(event.target.value);
            setPage(1);
          }}
          disabled={!selectedExamId || subjectsLoading}
        >
          <option value="">{selectedExamId ? 'All subjects' : 'Choose a board first'}</option>
          {subjects?.map((subject) => (
            <option key={subject._id} value={subject._id}>
              {subject.name} ({subject.code})
            </option>
          ))}
        </select>
      </label>

      <div className="materials-filter-grid">
        <label className="materials-field">
          <span>Year</span>
          <select
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Any year</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="materials-field">
          <span>Access</span>
          <select
            value={accessFilter}
            onChange={(event) => {
              setAccessFilter(event.target.value as AccessFilter);
              setPage(1);
            }}
          >
            <option value="">All access</option>
            <option value="false">Free</option>
            <option value="true">Pro</option>
          </select>
        </label>
      </div>

      <label className="materials-field">
        <span>Sort by</span>
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as MaterialSort);
            setPage(1);
          }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A-Z</option>
          <option value="downloads">Most downloaded</option>
        </select>
      </label>

      <button type="submit" className="materials-primary-action">
        Apply filters
      </button>
    </form>
  );

  return (
    <div className="materials-page">
      <main className="materials-wrap">
        <section className="materials-hero" aria-labelledby="materials-title">
          <div>
            <span className="materials-kicker">Study Materials</span>
            <h1 id="materials-title">A focused library for exam revision</h1>
            <p>
              Search official MarkDriller PDFs by examination board, subject and year, then inspect the material before downloading it through the secure access flow.
            </p>
          </div>
          <div className="materials-hero-actions">
            <button type="button" className="materials-filter-toggle" onClick={() => setFiltersOpen(true)}>
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </button>
            {isAdmin && (
              <button type="button" className="materials-primary-action" onClick={() => setUploadModalOpen(true)}>
                Upload material
              </button>
            )}
          </div>
        </section>

        {statusMessage && (
          <div className={`materials-status materials-status-${statusMessage.type}`} role="status">
            <span>{statusMessage.text}</span>
            {statusMessage.type === 'error' && (
              <Link to="/portal/pricing">View Pro plans</Link>
            )}
            <button type="button" onClick={() => setStatusMessage(null)} aria-label="Dismiss message">
              x
            </button>
          </div>
        )}

        <div className="materials-layout">
          <aside className="materials-sidebar" aria-label="Study material filters">
            {FilterPanel}
          </aside>

          <section className="materials-results" aria-live="polite">
            <div className="materials-results-head">
              <div>
                <span className="materials-kicker">Library results</span>
                <h2>
                  {libraryQuery.isLoading
                    ? 'Loading materials'
                    : `${totalMaterials.toLocaleString()} material${totalMaterials === 1 ? '' : 's'} found`}
                </h2>
                <p>
                  {selectedExam ? `${selectedExam.shortCode} materials` : 'All examination boards'}
                  {searchTerm ? ` matching "${searchTerm}"` : ''}
                </p>
              </div>
              <div className="materials-support-note">
                Material saving is not enabled for PDFs yet. Question bookmarks remain available in Settings.
              </div>
            </div>

            {libraryQuery.isError && (
              <div className="materials-empty" role="alert">
                <h3>Materials could not load</h3>
                <p>The library request failed. Please retry; no internal server details are exposed here.</p>
                <button type="button" className="materials-secondary-action" onClick={() => libraryQuery.refetch()}>
                  Retry
                </button>
              </div>
            )}

            {libraryQuery.isLoading && (
              <div className="materials-grid" aria-label="Loading materials">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div className="materials-card materials-card-skeleton" key={index}>
                    <span />
                    <strong />
                    <p />
                    <p />
                    <footer />
                  </div>
                ))}
              </div>
            )}

            {!libraryQuery.isLoading && !libraryQuery.isError && materials.length > 0 && (
              <>
                <div className="materials-grid">
                  {materials.map((material) => (
                    <article className="materials-card" key={material._id}>
                      {(() => {
                        const visual = getMaterialVisual(material);
                        return (
                          <div className={`materials-card-visual ${visual.tone}`}>
                            <div className="materials-card-visual-copy">
                              <span>{visual.label}</span>
                              <strong>{material.examId?.shortCode || 'STUDY'}</strong>
                            </div>
                            <img src={visual.image} alt={`${visual.label} visual identity`} loading="lazy" />
                          </div>
                        );
                      })()}

                      <div className="materials-card-top">
                        <span className="materials-file-mark">{material.fileType?.toUpperCase() || 'DOC'}</span>
                        <span className={material.isPremium ? 'materials-access-pro' : 'materials-access-free'}>
                          {material.isPremium ? 'Pro access' : 'Free access'}
                        </span>
                      </div>

                      <h3>{material.title}</h3>
                      <p className="materials-meta">{materialMeta(material)}</p>
                      {material.description ? (
                        <p className="materials-description">{material.description}</p>
                      ) : (
                        <p className="materials-description materials-muted">No description has been provided for this material.</p>
                      )}

                      <dl className="materials-card-facts">
                        <div>
                          <dt>File</dt>
                          <dd>{formatFileSize(material.fileSize)}</dd>
                        </div>
                        <div>
                          <dt>Added</dt>
                          <dd>{formatMaterialDate(material.createdAt)}</dd>
                        </div>
                        <div>
                          <dt>Downloads</dt>
                          <dd>{material.downloadCount.toLocaleString()}</dd>
                        </div>
                      </dl>

                      <div className="materials-card-actions">
                        <button type="button" className="materials-secondary-action" onClick={() => setSelectedMaterialId(material._id)}>
                          Details
                        </button>
                        <button
                          type="button"
                          className="materials-primary-action"
                          disabled={downloadingId === material._id}
                          onClick={() => handleDownload(material)}
                        >
                          {downloadingId === material._id ? 'Preparing...' : material.isPremium && !hasProAccess ? 'Unlock' : 'Download'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <nav className="materials-pagination" aria-label="Study materials pages">
                  <button
                    type="button"
                    className="materials-secondary-action"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="materials-secondary-action"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Next
                  </button>
                </nav>
              </>
            )}

            {!libraryQuery.isLoading && !libraryQuery.isError && materials.length === 0 && (
              <div className="materials-empty">
                <h3>No matching study materials</h3>
                <p>
                  {searchTerm
                    ? `No published material matches "${searchTerm}" with the current filters.`
                    : 'No published material matches the current filters.'}
                </p>
                <button type="button" className="materials-secondary-action" onClick={resetFilters}>
                  Reset search and filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {filtersOpen && (
        <div className="materials-filter-drawer" role="dialog" aria-modal="true" aria-label="Study material filters">
          <button type="button" className="materials-drawer-backdrop" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />
          <div className="materials-drawer-panel">
            <div className="materials-drawer-title">
              <strong>Filters</strong>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                x
              </button>
            </div>
            {FilterPanel}
          </div>
        </div>
      )}

      {selectedMaterialId && (
        <div className="materials-detail-modal" role="dialog" aria-modal="true" aria-labelledby="material-detail-title">
          <button type="button" className="materials-drawer-backdrop" aria-label="Close material details" onClick={() => setSelectedMaterialId(null)} />
          <div className="materials-detail-panel">
            {detailLoading || !selectedMaterial ? (
              <BrandLoader mode="contained" message="Loading material details..." />
            ) : (
              <>
                <div className="materials-detail-head">
                  <div>
                    <span className="materials-kicker">Material details</span>
                    <h2 id="material-detail-title">{selectedMaterial.title}</h2>
                    <p>{materialMeta(selectedMaterial)}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedMaterialId(null)} aria-label="Close material details">
                    x
                  </button>
                </div>

                <div className="materials-detail-body">
                  {(() => {
                    const visual = getMaterialVisual(selectedMaterial);
                    return (
                      <div className={`materials-detail-preview ${visual.tone}`}>
                        <div>
                          <span className="materials-kicker">Document preview</span>
                          <strong>{visual.label}</strong>
                          <p>
                            Visual identity is based on the selected examination board. Official document contents are only served through the secure download endpoint.
                          </p>
                        </div>
                        <img src={visual.image} alt={`${visual.label} preview mark`} loading="lazy" />
                      </div>
                    );
                  })()}
                  <p>{selectedMaterial.description || 'No description has been provided for this material.'}</p>
                  <dl className="materials-detail-list">
                    <div><dt>Exam board</dt><dd>{selectedMaterial.examId?.name || 'Not specified'}</dd></div>
                    <div><dt>Subject</dt><dd>{selectedMaterial.subjectId?.name || 'Not specified'}</dd></div>
                    <div><dt>Year</dt><dd>{selectedMaterial.year || 'Not specified'}</dd></div>
                    <div><dt>Document</dt><dd>{selectedMaterial.originalFilename || selectedMaterial.fileType?.toUpperCase()}</dd></div>
                    <div><dt>File size</dt><dd>{formatFileSize(selectedMaterial.fileSize)}</dd></div>
                    <div><dt>Access</dt><dd>{selectedMaterial.isPremium ? 'Pro subscription required' : 'Free after sign-in'}</dd></div>
                  </dl>
                  <div className="materials-viewer-note">
                    In-browser reading is not exposed by the current secure download endpoint. Use Download to retrieve the verified PDF after authentication and access checks.
                  </div>
                </div>

                <div className="materials-detail-actions">
                  <button type="button" className="materials-secondary-action" onClick={() => setSelectedMaterialId(null)}>
                    Back to library
                  </button>
                  {selectedMaterial.isPremium && !hasProAccess ? (
                    <button type="button" className="materials-primary-action" onClick={() => navigate('/portal/pricing')}>
                      View Pro plans
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="materials-primary-action"
                      disabled={downloadingId === selectedMaterial._id}
                      onClick={() => handleDownload(selectedMaterial)}
                    >
                      {downloadingId === selectedMaterial._id ? 'Preparing...' : 'Download PDF'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isAdmin && (
        <UploadMaterialModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => libraryQuery.refetch()}
        />
      )}
    </div>
  );
};

