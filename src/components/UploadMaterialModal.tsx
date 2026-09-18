import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useExamsQuery, useExamSubjectsQuery, ExamItem, SubjectItem } from '../api/exams.js';
import { useUploadMaterialMutation, useCreateMaterialMutation } from '../api/materials.js';
import { useNotificationStore } from '../store/useNotificationStore.js';
import { BrandLoader } from './BrandLoader.js';

export interface UploadMaterialModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB server limit

export const UploadMaterialModal: React.FC<UploadMaterialModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError, notifyWarning } = useNotificationStore();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { data: exams, isLoading: examsLoading } = useExamsQuery();
  const { data: subjects, isLoading: subjectsLoading } = useExamSubjectsQuery(examId || undefined);

  const uploadMutation = useUploadMaterialMutation();
  const createMutation = useCreateMaterialMutation();

  // Reset state on open/close
  useEffect(() => {
    if (!open) {
      setFile(null);
      setTitle('');
      setDescription('');
      setExamId('');
      setSubjectId('');
      setIsPremium(false);
      setIsSubmitting(false);
      setLocalError(null);
    }
  }, [open]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const selected = e.target.files?.[0] || null;
    if (!selected) {
      setFile(null);
      return;
    }

    // Client-side UX validation
    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && selected.type !== 'application/pdf') {
      const msg = 'This file type is not supported. Please select an approved PDF study guide.';
      setLocalError(msg);
      notifyWarning(msg);
      setFile(null);
      e.target.value = '';
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      const msg = `This file exceeds the maximum permitted size of 15MB (${(selected.size / (1024 * 1024)).toFixed(1)}MB selected).`;
      setLocalError(msg);
      notifyWarning(msg);
      setFile(null);
      e.target.value = '';
      return;
    }

    setFile(selected);
    if (!title.trim()) {
      // Pre-fill clean title from filename
      const baseName = selected.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      setTitle(baseName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!file) {
      setLocalError('Please select an authentic PDF document.');
      return;
    }

    if (!examId) {
      setLocalError('Please select the examination board.');
      return;
    }

    if (!subjectId) {
      setLocalError('Please select the relevant subject.');
      return;
    }

    if (!title.trim()) {
      setLocalError('Please specify a title for this revision guide.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload physical file with magic-byte verification on server
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await uploadMutation.mutateAsync(formData);

      // Step 2: Create material database record
      await createMutation.mutateAsync({
        examId,
        subjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        storageFilename: uploadRes.storageFilename,
        fileUrl: uploadRes.fileUrl,
        originalFilename: uploadRes.originalFilename,
        fileSize: uploadRes.fileSize,
        isPublished: true,
        isPremium,
      });

      // Step 3: Refresh caches & notify
      await queryClient.invalidateQueries({ queryKey: ['studyMaterials'] });
      await queryClient.invalidateQueries({ queryKey: ['adminOverview'] });

      notifySuccess(`"${title.trim()}" uploaded and published successfully.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err?.message || 'We could not upload this study material. Please verify the file and try again.';
      setLocalError(errMsg);
      notifyError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(20, 24, 28, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--white, #ffffff)',
          border: '2px solid var(--ink, #14181c)',
          boxShadow: '6px 6px 0 var(--ink, #14181c)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1.5px solid var(--ink, #14181c)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--cream, #f7f6f2)',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--rust, #a8562f)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Curriculum Administration
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '20px',
                margin: '2px 0 0',
                color: 'var(--ink, #14181c)',
              }}
            >
              Upload Revision Guide
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              lineHeight: 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: 'var(--ink, #14181c)',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px' }}>
          {localError && (
            <div
              style={{
                padding: '12px 16px',
                background: '#fdf0ed',
                border: '1.5px solid var(--rust, #a8562f)',
                color: 'var(--rust, #a8562f)',
                fontSize: '13px',
                marginBottom: '18px',
                lineHeight: 1.5,
              }}
            >
              ⚠ {localError}
            </div>
          )}

          {/* File Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'var(--ink, #14181c)',
              }}
            >
              PDF Document (.pdf strictly verified, max 15MB) *
            </label>
            <div
              style={{
                border: '2px dashed var(--slate, #999)',
                padding: '16px',
                textAlign: 'center',
                backgroundColor: 'var(--cream, #f7f6f2)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('modal-pdf-file-input')?.click()}
            >
              <input
                id="modal-pdf-file-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={isSubmitting}
                style={{ display: 'none' }}
              />
              {file ? (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'var(--forest, #225a38)' }}>
                  📄 <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                  <div style={{ fontSize: '11px', color: 'var(--slate, #666)', marginTop: '4px' }}>
                    Click to choose a different PDF
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--slate, #555)', fontSize: '13px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>📁</div>
                  <strong>Click to select PDF</strong> or drag & drop here
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'var(--ink, #14181c)',
              }}
            >
              Material Title *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. WAEC Further Mathematics Formula Booklet"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid var(--ink, #14181c)',
                fontSize: '13.5px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Exam & Subject */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--ink, #14181c)',
                }}
              >
                Exam Board *
              </label>
              <select
                required
                disabled={isSubmitting || examsLoading}
                value={examId}
                onChange={(e) => {
                  setExamId(e.target.value);
                  setSubjectId('');
                }}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  border: '1.5px solid var(--ink, #14181c)',
                  fontSize: '13px',
                  backgroundColor: 'var(--white, #ffffff)',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">-- Select Exam --</option>
                {exams?.map((e: ExamItem) => (
                  <option key={e._id} value={e._id}>
                    {e.shortCode} - {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--ink, #14181c)',
                }}
              >
                Subject *
              </label>
              <select
                required
                disabled={isSubmitting || !examId || subjectsLoading}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  border: '1.5px solid var(--ink, #14181c)',
                  fontSize: '13px',
                  backgroundColor: 'var(--white, #ffffff)',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">{examId ? '-- Select Subject --' : 'Select exam first'}</option>
                {subjects?.map((s: SubjectItem) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'var(--ink, #14181c)',
              }}
            >
              Description & Summary (Optional)
            </label>
            <textarea
              rows={3}
              disabled={isSubmitting}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Curated revision summary covering the complete 2025/2026 examination syllabus..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid var(--ink, #14181c)',
                fontSize: '13px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Pro Pass Checkbox */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--cream, #f7f6f2)',
              border: '1px solid var(--ink, #14181c)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <input
              type="checkbox"
              id="modal-premium-check"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              disabled={isSubmitting}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label
              htmlFor="modal-premium-check"
              style={{
                fontSize: '13px',
                color: 'var(--ink, #14181c)',
                cursor: 'pointer',
                margin: 0,
                userSelect: 'none',
              }}
            >
              Restrict download to <strong>Pro Subscription</strong> members
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 18px',
                border: '1.5px solid var(--ink, #14181c)',
                background: 'transparent',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              style={{
                padding: '10px 22px',
                border: '1.5px solid var(--ink, #14181c)',
                background: isSubmitting || !file ? 'var(--slate, #999)' : 'var(--ink, #14181c)',
                color: '#fff',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: isSubmitting || !file ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? (
                <BrandLoader mode="inline" size="sm" message="Validating & Uploading..." />
              ) : (
                'Upload Material →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
