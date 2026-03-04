import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from '../config/supabase.js';
import apiClient from '../services/api.js';
import './ImageUploader.css';

const BUCKET = 'property-images';
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageUploader({ propertyId }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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

  // Upload a single file
  const uploadFile = useCallback(async (file) => {
    if (!supabase) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Use JPEG, PNG, WebP, or GIF.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadFileName(file.name);
    setError(null);

    try {
      // Generate unique storage path
      const ext = file.name.split('.').pop().toLowerCase();
      const uuid = crypto.randomUUID();
      const path = `${propertyId}/${uuid}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Simulate progress since supabase-js v2 doesn't provide granular progress
      setUploadProgress(80);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      // Determine sort_order (append after last)
      const maxSort = images.reduce(
        (max, img) => Math.max(max, img.sort_order ?? 0),
        0
      );

      // Register with backend
      const res = await apiClient.post(
        `/properties/${propertyId}/images/metadata`,
        {
          url: publicUrl,
          is_primary: false,
          sort_order: maxSort + 1,
        }
      );

      setUploadProgress(100);

      // Add to local state
      setImages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      // Brief delay so 100% is visible, then reset
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadFileName('');
      }, 600);
    }
  }, [propertyId, images]);

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

  // Set primary image
  const handleSetPrimary = useCallback(async (imageId) => {
    try {
      await apiClient.post(`/properties/${propertyId}/images/metadata`, {
        id: imageId,
        is_primary: true,
      });
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

  // Graceful fallback if Supabase not configured
  if (!supabase) {
    return (
      <div className="img-uploader">
        <h3 className="img-uploader__title">Property Photos</h3>
        <div className="img-uploader__fallback">
          Image uploads require Supabase configuration. Add{' '}
          <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code>
        </div>
      </div>
    );
  }

  return (
    <div className="img-uploader">
      <h3 className="img-uploader__title">Property Photos</h3>

      {/* Dropzone */}
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

      <input
        ref={fileInputRef}
        className="img-uploader__file-input"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
      />

      {/* Progress bar */}
      {uploading && (
        <div className="img-uploader__progress-wrap">
          <div className="img-uploader__progress-label">
            <span>Uploading {uploadFileName}</span>
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

      {/* Error message */}
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
