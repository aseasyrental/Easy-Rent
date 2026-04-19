import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../services/api.js';
import useIsMobile from '../hooks/useIsMobile.js';
import './ImageUploader.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_DIMENSION = 1920;
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024; // safe margin under Vercel's 4.5 MB proxy limit

// Compress image client-side to stay within Vercel's 4.5MB body limit.
// Never falls back to the original file — if compression fails, it rejects
// with a user-facing message so the upload is blocked before hitting the server.
function compressImage(file) {
  if (file.type === 'image/gif') {
    if (file.size <= MAX_UPLOAD_BYTES) return Promise.resolve(file);
    return Promise.reject(new Error('GIF is too large (max 3.5 MB). Use a smaller GIF or convert to JPEG.'));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        } else {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Step down quality until the result fits under the limit
      const qualities = [0.85, 0.7, 0.5, 0.3];

      function tryQuality(i) {
        if (i >= qualities.length) {
          reject(new Error('Photo is still too large after compression. Try a smaller image.'));
          return;
        }
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress this photo. Try a different image.'));
              return;
            }
            if (blob.size > MAX_UPLOAD_BYTES && i < qualities.length - 1) {
              tryQuality(i + 1);
              return;
            }
            if (blob.size > MAX_UPLOAD_BYTES) {
              reject(new Error('Photo is still too large after compression. Try a smaller image.'));
              return;
            }
            resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
              type: 'image/jpeg',
            }));
          },
          'image/jpeg',
          qualities[i],
        );
      }

      tryQuality(0);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this photo. The file may be damaged — try a different image.'));
    };

    img.src = url;
  });
}

export default function ImageUploader({ propertyId }) {
  const isMobile = useIsMobile();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchErrors, setBatchErrors] = useState([]);
  const [batchDone, setBatchDone] = useState(0);
  const [batchSummary, setBatchSummary] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Fetch existing images on mount
  const fetchImages = useCallback(async () => {
    try {
      const res = await apiClient.get(`/properties/${propertyId}`);
      const fetched = res.data.images || [];
      // Sort by sort_order, then by id
      fetched.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.id - b.id);
      setImages(fetched);
    } catch (err) {
      console.error('Failed to fetch property images:', err);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      fetchImages();
    }
  }, [propertyId, fetchImages]);

  // Upload a single file. Returns { ok: true } | { ok: false, message }.
  // Per-file UI state is managed here; batch-level state is managed by the caller.
  const uploadFile = useCallback(async (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return { ok: false, message: `Unsupported file type: ${file.type}. Use JPEG, PNG, WebP, or GIF.` };
    }

    setUploadProgress(0);
    setUploadFileName(file.name);

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('image', compressed);
      formData.append('is_primary', 'false');

      setUploadProgress(30);

      const res = await apiClient.post(
        `/properties/${propertyId}/images`,
        formData,
        { timeout: 60000 }
      );

      setUploadProgress(100);
      setImages((prev) => [...prev, res.data]);
      return { ok: true };
    } catch (err) {
      console.error('Upload failed:', err);
      if (err.response?.status === 413) {
        return { ok: false, message: 'Photo exceeds the server size limit. Try a smaller image.' };
      }
      return { ok: false, message: err.response?.data?.message || err.message || 'Upload failed. Please try again.' };
    }
  }, [propertyId]);

  // Upload a batch of files serially, tracking progress across the batch.
  // Shows "X of Y" progress, collects per-file errors, and surfaces a summary at the end.
  const uploadBatch = useCallback(async (files) => {
    if (files.length === 0) return;

    setUploading(true);
    setBatchTotal(files.length);
    setBatchIndex(0);
    setBatchDone(0);
    setBatchErrors([]);
    setBatchSummary(null);
    setError(null); // Clear any stale non-batch error (e.g. previous delete failure)

    const failures = [];
    let successes = 0;

    for (let i = 0; i < files.length; i++) {
      setBatchIndex(i + 1);
      const result = await uploadFile(files[i]);
      if (result.ok) {
        successes++;
        setBatchDone((prev) => prev + 1);
      } else {
        failures.push({ file: files[i], name: files[i].name, message: result.message });
        setBatchErrors((prev) => [...prev, { name: files[i].name, message: result.message }]);
      }
    }

    // Only surface a summary when there's something to act on:
    // multi-file batches (confirms all landed) or any failures (so Bill can retry).
    // A single successful upload stays silent — Bill's most common path.
    if (files.length > 1 || failures.length > 0) {
      setBatchSummary({ total: files.length, successes, failures });
    }

    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
    }, 600);
  }, [uploadFile]);

  // Retry just the files that failed in the last batch.
  const handleRetryFailures = useCallback(async () => {
    if (!batchSummary || batchSummary.failures.length === 0) return;
    const files = batchSummary.failures.map((f) => f.file);
    await uploadBatch(files);
  }, [batchSummary, uploadBatch]);

  // Dismiss the batch summary without retrying.
  const handleDismissSummary = useCallback(() => {
    setBatchSummary(null);
    setBatchErrors([]);
    setBatchTotal(0);
    setBatchIndex(0);
    setBatchDone(0);
  }, []);

  // Handle file selection from input
  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    await uploadBatch(files);
    // Reset input so the same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadBatch]);

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

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    await uploadBatch(files);
  }, [uploadBatch]);

  // Set primary image
  const handleSetPrimary = useCallback(async (imageId) => {
    try {
      await apiClient.patch(`/properties/${propertyId}/images/${imageId}/primary`);
      // Update local state: mark selected as primary, others as not
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_primary: img.id === imageId,
        }))
      );
    } catch (err) {
      console.error('Failed to set primary image:', err);
      // Fallback: re-fetch from server
      fetchImages();
    }
  }, [propertyId, fetchImages]);

  // Delete image
  const handleDelete = useCallback(async (imageId) => {
    try {
      await apiClient.delete(`/properties/${propertyId}/images/${imageId}`);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError('Failed to delete image. Please try again.');
    }
  }, [propertyId]);

  return (
    <div className="img-uploader">
      <h3 className="img-uploader__title">Property Photos</h3>

      {/* Mobile: explicit Take Photo + Library buttons. Desktop: dropzone with drag + click. */}
      {isMobile ? (
        <div className="img-uploader__actions">
          <button
            type="button"
            className="img-uploader__action img-uploader__action--camera"
            onClick={() => !uploading && cameraInputRef.current?.click()}
            disabled={uploading}
          >
            Take Photo
          </button>
          <button
            type="button"
            className="img-uploader__action img-uploader__action--library"
            onClick={() => !uploading && fileInputRef.current?.click()}
            disabled={uploading}
          >
            Choose from Library
          </button>
        </div>
      ) : (
        <div
          className={`img-uploader__dropzone${dragActive ? ' img-uploader__dropzone--active' : ''}`}
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
          aria-label="Upload image"
        >
          <span className="img-uploader__dropzone-icon">+</span>
          <span className="img-uploader__dropzone-text">
            Drag an image here or <strong>click to browse</strong>
          </span>
        </div>
      )}

      {/* Hidden file inputs — triggered by buttons above */}
      <input
        ref={fileInputRef}
        className="img-uploader__file-input"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        className="img-uploader__file-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
      />

      {/* Progress: batch count (if multiple) + current file progress */}
      {uploading && (
        <div className="img-uploader__progress-wrap">
          {batchTotal > 1 && (
            <div className="img-uploader__batch-label">
              <span className="img-uploader__batch-count">
                Uploading {batchIndex} of {batchTotal}
              </span>
              {batchDone > 0 && (
                <span className="img-uploader__batch-done">{batchDone} done</span>
              )}
            </div>
          )}
          <div className="img-uploader__progress-label">
            <span className="img-uploader__progress-filename" title={uploadFileName}>
              {uploadFileName}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="img-uploader__progress-bar">
            <div
              className="img-uploader__progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Live batch errors — visible during upload, replaced by summary at batch end */}
      {batchErrors.length > 0 && !batchSummary && (
        <ul className="img-uploader__error-list">
          {batchErrors.map((e, idx) => (
            <li key={idx} className="img-uploader__error-item">
              <strong>{e.name}:</strong> {e.message}
            </li>
          ))}
        </ul>
      )}

      {/* End-of-batch summary with retry for failures */}
      {batchSummary && (
        <div
          className={`img-uploader__summary${
            batchSummary.failures.length > 0
              ? ' img-uploader__summary--has-failures'
              : ' img-uploader__summary--all-done'
          }`}
        >
          <div className="img-uploader__summary-text">
            {batchSummary.successes > 0 && (
              <span>{batchSummary.successes} uploaded</span>
            )}
            {batchSummary.successes > 0 && batchSummary.failures.length > 0 && (
              <span className="img-uploader__summary-sep">·</span>
            )}
            {batchSummary.failures.length > 0 && (
              <span className="img-uploader__summary-failed">
                {batchSummary.failures.length} failed
              </span>
            )}
          </div>
          {batchSummary.failures.length > 0 && (
            <ul className="img-uploader__error-list img-uploader__error-list--summary">
              {batchSummary.failures.map((f, idx) => (
                <li key={idx} className="img-uploader__error-item">
                  <strong>{f.name}:</strong> {f.message}
                </li>
              ))}
            </ul>
          )}
          <div className="img-uploader__summary-actions">
            {batchSummary.failures.length > 0 && (
              <button
                type="button"
                className="img-uploader__summary-btn img-uploader__summary-btn--primary"
                onClick={handleRetryFailures}
              >
                Retry failed
              </button>
            )}
            <button
              type="button"
              className="img-uploader__summary-btn"
              onClick={handleDismissSummary}
            >
              {batchSummary.failures.length > 0 ? 'Dismiss' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* General error (e.g. delete failure) */}
      {error && (
        <div className="img-uploader__error">{error}</div>
      )}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className="img-uploader__thumbs">
          {images.map((img) => (
            <div
              key={img.id}
              className={`img-uploader__thumb${img.is_primary ? ' img-uploader__thumb--primary' : ''}`}
              onClick={() => handleSetPrimary(img.id)}
              title={img.is_primary ? 'Primary image' : 'Click to set as primary'}
            >
              <img
                className="img-uploader__thumb-img"
                src={img.url}
                alt="Property"
                loading="lazy"
              />
              {img.is_primary && (
                <span className="img-uploader__thumb-badge">Primary</span>
              )}
              <button
                className="img-uploader__thumb-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(img.id);
                }}
                aria-label="Delete image"
                title="Delete image"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
