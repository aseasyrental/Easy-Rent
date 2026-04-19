import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../services/api.js';
import './DocumentUploader.css';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel serverless body limit is 4.5 MB)
const DOC_TYPES = ['lease', 'agreement', 'form', 'inspection', 'notice'];

export default function DocumentUploader({ propertyId }) {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('lease');
  const fileInputRef = useRef(null);

  // Fetch existing documents on mount
  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await apiClient.get(`/properties/${propertyId}/documents`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch property documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      fetchDocuments();
    }
  }, [propertyId, fetchDocuments]);

  // Upload a single file
  const uploadFile = useCallback(async (file) => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum is 4 MB.`);
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a document title before uploading.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadFileName(file.name);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', trimmedTitle);
      formData.append('type', docType);

      setUploadProgress(30);

      const res = await apiClient.post(
        `/properties/${propertyId}/documents/upload`,
        formData,
        { timeout: 60000 }
      );

      setUploadProgress(100);
      setDocuments((prev) => [...prev, res.data]);
      setTitle('');
      setDocType('lease');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadFileName('');
      }, 600);
    }
  }, [propertyId, title, docType]);

  // Handle file selection from input
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadFile]);

  // Drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  // Delete document
  const handleDelete = useCallback(async (docId) => {
    try {
      await apiClient.delete(`/properties/${propertyId}/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError('Failed to delete document. Please try again.');
    }
  }, [propertyId]);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="doc-uploader">
      <h3 className="doc-uploader__title">Documents</h3>

      {/* Title + Type fields */}
      <div className="doc-uploader__fields">
        <div className="doc-uploader__field">
          <label className="doc-uploader__label" htmlFor="doc-title">
            Document Title
          </label>
          <input
            id="doc-title"
            className="doc-uploader__input"
            type="text"
            autoCapitalize="words"
            placeholder="e.g. Lease Agreement 2025"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
          />
        </div>
        <div className="doc-uploader__field">
          <label className="doc-uploader__label" htmlFor="doc-type">
            Document Type
          </label>
          <select
            id="doc-type"
            className="doc-uploader__input doc-uploader__select"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            disabled={uploading}
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dropzone */}
      <div
        className={`doc-uploader__dropzone${dragActive ? ' doc-uploader__dropzone--active' : ''}`}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload document"
      >
        <span className="doc-uploader__dropzone-icon">+</span>
        <span className="doc-uploader__dropzone-text">
          <strong>Tap to browse files</strong>
        </span>
        <span className="doc-uploader__dropzone-hint">
          PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG -- max 4 MB
        </span>
      </div>

      <input
        ref={fileInputRef}
        className="doc-uploader__file-input"
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
      />

      {/* Progress bar */}
      {uploading && (
        <div className="doc-uploader__progress-wrap">
          <div className="doc-uploader__progress-label">
            <span>Uploading {uploadFileName}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="doc-uploader__progress-bar">
            <div
              className="doc-uploader__progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="doc-uploader__error">{error}</div>
      )}

      {/* Loading state */}
      {loadingDocs && (
        <div className="doc-uploader__loading">Loading documents...</div>
      )}

      {/* Document list */}
      {!loadingDocs && documents.length > 0 && (
        <div className="doc-uploader__list">
          {documents.map((doc) => (
            <div key={doc.id} className="doc-uploader__item">
              <div className="doc-uploader__item-icon">
                {doc.type === 'lease' && '\u{1F4C4}'}
                {doc.type === 'agreement' && '\u{1F91D}'}
                {doc.type === 'form' && '\u{1F4CB}'}
                {doc.type === 'inspection' && '\u{1F50D}'}
                {doc.type === 'notice' && '\u{1F4E2}'}
                {!DOC_TYPES.includes(doc.type) && '\u{1F4CE}'}
              </div>
              <div className="doc-uploader__item-info">
                <div className="doc-uploader__item-title" title={doc.title}>
                  {doc.title}
                </div>
                <div className="doc-uploader__item-meta">
                  <span className={`doc-uploader__type-badge doc-uploader__type-badge--${doc.type}`}>
                    {doc.type}
                  </span>
                  {doc.created_at && (
                    <span className="doc-uploader__item-date">
                      {formatDate(doc.created_at)}
                    </span>
                  )}
                </div>
              </div>
              <div className="doc-uploader__item-actions">
                <a
                  className="doc-uploader__btn doc-uploader__btn--download"
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download document"
                >
                  Download
                </a>
                <button
                  className="doc-uploader__btn doc-uploader__btn--delete"
                  onClick={() => handleDelete(doc.id)}
                  title="Delete document"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loadingDocs && documents.length === 0 && (
        <div className="doc-uploader__empty">
          No documents uploaded yet. Add a title and type above, then drop a file to upload.
        </div>
      )}
    </div>
  );
}
