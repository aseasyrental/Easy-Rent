import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../services/api.js';
import './ImageUploader.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

// Compress image client-side to stay within Vercel's 4.5MB body limit
function compressImage(file) {
  return new Promise((resolve) => {
    // GIFs can't be compressed via canvas without losing animation
    if (file.type === 'image/gif' && file.size < 4 * 1024 * 1024) {
      return resolve(file);
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only resize if larger than max dimension
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

      canvas.toBlob(
        (blob) => {
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
            type: 'image/jpeg',
          }));
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fall back to original on error
    };

    img.src = url;
  });
}

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
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Use JPEG, PNG, WebP, or GIF.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadFileName(file.name);
    setError(null);

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
  }, [propertyId]);

  // Handle file selection from input
  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await uploadFile(file);
    }
    // Reset input so the same files can be re-selected
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

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    for (const file of files) {
      await uploadFile(file);
    }
  }, [uploadFile]);

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
        <span className="img-uploader__dropzone-text img-uploader__dropzone-text--desktop">
          Drag an image here or <strong>click to browse</strong>
        </span>
        <span className="img-uploader__dropzone-text img-uploader__dropzone-text--mobile">
          <strong>Tap to add photos</strong>
        </span>
      </div>

      <input
        ref={fileInputRef}
        className="img-uploader__file-input"
        type="file"
        accept="image/*"
        multiple
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
