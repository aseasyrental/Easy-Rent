import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/api.js';
import LoadError from './LoadError.jsx';
import Sheet from './Sheet.jsx';
import './TemplatesSidePanel.css';

const CATEGORIES = [
  { label: 'Lease', value: 'lease' },
  { label: 'Agreement', value: 'agreement' },
  { label: 'Form', value: 'form' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Notice', value: 'notice' },
];

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel serverless body limit is 4.5 MB)

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TemplatesSidePanel() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('lease');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch templates on mount
  const fetchTemplates = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await apiClient.get('/templates');
      setTemplates(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setTemplates([]);
      setLoadError("Couldn't load templates. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle file selection and upload
  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title before uploading.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('category', category);

      await apiClient.post('/templates/upload', formData, { timeout: 60000 });

      setTitle('');
      setCategory('lease');
      await fetchTemplates();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [title, category, fetchTemplates]);

  const handleDeleteClick = useCallback((template) => {
    setError(null);
    setConfirmDelete(template);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (deleting) return;
    setConfirmDelete(null);
  }, [deleting]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/templates/${confirmDelete.id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete template.');
    } finally {
      setDeleting(false);
    }
  }, [confirmDelete]);

  return (
    <div className="templates-panel">
      {/* Upload form */}
      <div className="templates-panel__form">
        <input
          type="text"
          className="templates-panel__input"
          autoCapitalize="words"
          placeholder="Template title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={uploading}
        />

        <select
          className="templates-panel__select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={uploading}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        <button
          className="templates-panel__upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="templates-panel__file-input"
          onChange={handleFileSelect}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="templates-panel__error">{error}</div>
      )}

      {/* Template list */}
      <div className="templates-panel__list">
        {loading ? (
          <p className="templates-panel__loading">Loading...</p>
        ) : loadError ? (
          <LoadError message={loadError} onRetry={fetchTemplates} />
        ) : templates.length === 0 ? (
          <div className="templates-panel__empty">
            <p className="templates-panel__empty-text">No templates yet</p>
            <p className="templates-panel__empty-hint">
              Upload your first document template above.
            </p>
          </div>
        ) : (
          templates.map((tpl) => (
            <div key={tpl.id} className="templates-panel__item">
              <div className="templates-panel__item-top">
                <span className="templates-panel__item-title">{tpl.title}</span>
                <span className={`templates-panel__badge templates-panel__badge--${tpl.category}`}>
                  {tpl.category}
                </span>
              </div>
              <div className="templates-panel__item-bottom">
                <span className="templates-panel__item-size">
                  {tpl.file_size ? formatFileSize(tpl.file_size) : ''}
                </span>
                <div className="templates-panel__item-actions">
                  <a
                    href={tpl.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="templates-panel__download"
                    aria-label={`Download ${tpl.title}`}
                    title="Download"
                  >
                    &#x21E9;
                  </a>
                  <button
                    className="templates-panel__delete"
                    onClick={() => handleDeleteClick(tpl)}
                    aria-label={`Delete ${tpl.title}`}
                    title="Delete"
                  >
                    &#x2715;
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation — portal-rendered Sheet (bottom on mobile, centered on desktop). */}
      <Sheet
        open={confirmDelete !== null}
        onClose={handleDeleteCancel}
        variant="auto"
        role="alertdialog"
        ariaLabelledBy="templates-confirm-title"
      >
        <h3 id="templates-confirm-title" className="templates-panel__confirm-title">
          Delete Template
        </h3>
        <p className="templates-panel__confirm-text">
          Are you sure you want to delete <strong>{confirmDelete?.title}</strong>? This action cannot be undone.
        </p>
        <div className="templates-panel__confirm-actions">
          <button
            className="templates-panel__confirm-btn templates-panel__confirm-btn--cancel"
            onClick={handleDeleteCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="templates-panel__confirm-btn templates-panel__confirm-btn--delete"
            onClick={handleDeleteConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
