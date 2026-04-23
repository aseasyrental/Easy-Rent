import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PropertyForm from './PropertyForm.jsx';
import DocumentUploader from './DocumentUploader.jsx';
import Sheet from './Sheet.jsx';
import useIsMobile from '../hooks/useIsMobile.js';
import './PropertyDetail.css';

const STATUS_OPTIONS = ['available', 'occupied', 'maintenance'];

export default function PropertyDetail({ property, onEdit, onDelete, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isMobile = useIsMobile();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [upcomingBookings, setUpcomingBookings] = useState(0);
  const [showBookingGuard, setShowBookingGuard] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'delete' | { status: string }

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/properties/${property.id}`);
      setDetail(res.data);
    } catch (err) {
      console.error('Failed to fetch property detail:', err);
      setError('Failed to load property details.');
    } finally {
      setLoading(false);
    }
  }, [property.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Default to primary image when detail loads
  useEffect(() => {
    if (detail?.images?.length) {
      const primaryIdx = detail.images.findIndex((img) => img.is_primary);
      if (primaryIdx >= 0) {
        setActiveImage(primaryIdx);
      } else {
        setActiveImage(0);
      }
    }
  }, [detail?.id, detail?.images?.length]);

  const checkUpcomingBookings = async () => {
    try {
      const res = await apiClient.get('/admin/bookings', {
        params: { property_id: property.id, status: 'confirmed' },
      });
      const upcoming = (res.data?.data || []).filter(
        (b) => new Date(b.scheduled_at) >= new Date()
      );
      return upcoming.length;
    } catch {
      return 0;
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (detail?.status === 'available' && (newStatus === 'occupied' || newStatus === 'maintenance')) {
      const count = await checkUpcomingBookings();
      if (count > 0) {
        setUpcomingBookings(count);
        setPendingAction({ status: newStatus });
        setShowBookingGuard(true);
        setShowStatusDropdown(false);
        return;
      }
    }
    await applyStatusChange(newStatus);
  };

  const applyStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    setError(null);
    try {
      const res = await apiClient.put(`/properties/${property.id}`, { status: newStatus });
      setDetail((prev) => ({ ...prev, status: res.data.status }));
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setStatusUpdating(false);
      setShowStatusDropdown(false);
      setShowBookingGuard(false);
      setPendingAction(null);
    }
  };

  const initiateDelete = async () => {
    const count = await checkUpcomingBookings();
    if (count > 0) {
      setUpcomingBookings(count);
      setPendingAction('delete');
      setShowBookingGuard(true);
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await apiClient.delete(`/properties/${property.id}`);
      onDelete?.();
    } catch (err) {
      console.error('Failed to delete property:', err);
      setError('Failed to delete property. Please try again.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaved = useCallback(async () => {
    setEditing(false);
    await fetchDetail();
  }, [fetchDetail]);

  const formatPrice = (price) => {
    if (!price) return '--';
    return `$${Number(price).toLocaleString()}/mo`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="prop-detail">
        <div className="prop-detail__loading">Loading property...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prop-detail">
        <div className="prop-detail__error">
          <p>{error}</p>
          <button className="prop-detail__retry" onClick={fetchDetail}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  if (editing) {
    return (
      <div className="prop-detail">
        <PropertyForm
          property={detail}
          onSave={handleSaved}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const images = detail.images || [];
  const heroImage = images.length > 0 ? images[activeImage] : null;
  const amenities = Array.isArray(detail.amenities) ? detail.amenities : [];
  const statusClass = `prop-detail__status--${detail.status}`;

  return (
    <div className="prop-detail">
      {/* Hero Image Area */}
      <div className="prop-detail__hero">
        {heroImage ? (
          <img
            className="prop-detail__hero-img"
            src={heroImage.url}
            alt={detail.title}
          />
        ) : (
          <div className="prop-detail__hero-placeholder">
            <span className="prop-detail__hero-placeholder-icon">&#x1f3e0;</span>
            <span className="prop-detail__hero-placeholder-text">No images uploaded</span>
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="prop-detail__thumbs">
          {images.map((img, i) => (
            <button
              key={img.id}
              className={`prop-detail__thumb ${i === activeImage ? 'prop-detail__thumb--active' : ''}`}
              onClick={() => setActiveImage(i)}
              aria-label={`View image ${i + 1}`}
            >
              <img src={img.url} alt={`${detail.title} ${i + 1}`} />
            </button>
          ))}
        </div>
      )}

      {/* Header: Title + Status + Actions */}
      <div className="prop-detail__header">
        <div className="prop-detail__header-top">
          <h2 className="prop-detail__title">{detail.title}</h2>
          <div className="prop-detail__status-wrap">
            <button
              className={`prop-detail__status-badge ${statusClass}`}
              onClick={() => setShowStatusDropdown((v) => !v)}
              disabled={statusUpdating}
              aria-label="Change status"
            >
              {statusUpdating ? '...' : detail.status}
            </button>
            {/* Desktop: inline anchored dropdown. Mobile version renders as a Sheet below. */}
            {showStatusDropdown && !isMobile && (
              <div
                className="prop-detail__status-dropdown"
                role="radiogroup"
                aria-label="Property status"
              >
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    className={`prop-detail__status-option prop-detail__status--${s} ${s === detail.status ? 'prop-detail__status-option--current' : ''}`}
                    onClick={() =>
                      s === detail.status
                        ? setShowStatusDropdown(false)
                        : handleStatusChange(s)
                    }
                    role="radio"
                    aria-checked={s === detail.status}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="prop-detail__address">
          {detail.address}
          {detail.city && `, ${detail.city}`}
          {detail.province && `, ${detail.province}`}
          {detail.postal_code && ` ${detail.postal_code}`}
        </p>
      </div>

      {/* Inquiry count */}
      {(detail.inquiry_count || 0) > 0 && (
        <div className="prop-detail__inquiries">
          <span className="prop-detail__inquiries-badge">
            {detail.inquiry_count} {detail.inquiry_count === 1 ? 'inquiry' : 'inquiries'}
          </span>
        </div>
      )}

      {/* Property Fields Grid */}
      <div className="prop-detail__grid">
        <div className="prop-detail__field">
          <span className="prop-detail__field-label">Rent</span>
          <span className="prop-detail__field-value prop-detail__field-value--accent">
            {formatPrice(detail.price)}
          </span>
        </div>
        <div className="prop-detail__field">
          <span className="prop-detail__field-label">Property Type</span>
          <span className="prop-detail__field-value">
            {detail.property_type || '--'}
          </span>
        </div>
        <div className="prop-detail__field">
          <span className="prop-detail__field-label">Bedrooms</span>
          <span className="prop-detail__field-value">
            {detail.bedrooms ?? '--'}
          </span>
        </div>
        <div className="prop-detail__field">
          <span className="prop-detail__field-label">Bathrooms</span>
          <span className="prop-detail__field-value">
            {detail.bathrooms ?? '--'}
          </span>
        </div>
        <div className="prop-detail__field">
          <span className="prop-detail__field-label">Square Feet</span>
          <span className="prop-detail__field-value">
            {detail.sqft ? Number(detail.sqft).toLocaleString() : '--'}
          </span>
        </div>
        <div className="prop-detail__field">
          <span className="prop-detail__field-label">Availability Date</span>
          <span className="prop-detail__field-value">
            {formatDate(detail.availability_date)}
          </span>
        </div>
        <div className="prop-detail__field">
          <span className="prop-detail__field-label">Lease Term</span>
          <span className="prop-detail__field-value">
            {detail.lease_term_months ? `${detail.lease_term_months} months` : '--'}
          </span>
        </div>
        <div className="prop-detail__field">
          <span className="prop-detail__field-label">Deposit</span>
          <span className="prop-detail__field-value">
            {detail.deposit_amount
              ? `$${Number(detail.deposit_amount).toLocaleString()}`
              : '--'}
          </span>
        </div>
      </div>

      {/* Description — full width */}
      {detail.description && (
        <div className="prop-detail__section">
          <h3 className="prop-detail__section-title">Description</h3>
          <p className="prop-detail__description">{detail.description}</p>
        </div>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="prop-detail__section">
          <h3 className="prop-detail__section-title">Amenities</h3>
          <div className="prop-detail__amenities">
            {amenities.map((amenity, i) => (
              <span key={i} className="prop-detail__amenity-pill">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inline error for actions (status change, delete) */}
      {error && !loading && (
        <div className="prop-detail__error prop-detail__error--inline">
          <p>{error}</p>
          <button className="prop-detail__retry" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Documents */}
      <DocumentUploader propertyId={detail.id} />

      {/* Actions */}
      <div className="prop-detail__actions">
        <button
          className="prop-detail__btn prop-detail__btn--edit"
          onClick={() => setEditing(true)}
        >
          Edit Property
        </button>
        {isAdmin && (
          <button
            className="prop-detail__btn prop-detail__btn--delete"
            onClick={initiateDelete}
          >
            Delete
          </button>
        )}
      </div>

      {/* Mobile status picker — portal-rendered Sheet (bottom). */}
      <Sheet
        open={isMobile && showStatusDropdown}
        onClose={() => setShowStatusDropdown(false)}
        variant="bottom"
        role="dialog"
        ariaLabel="Change property status"
      >
        <div
          className="prop-detail__status-options"
          role="radiogroup"
          aria-label="Property status"
        >
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`prop-detail__status-option prop-detail__status--${s} ${s === detail?.status ? 'prop-detail__status-option--current' : ''}`}
              onClick={() =>
                s === detail?.status
                  ? setShowStatusDropdown(false)
                  : handleStatusChange(s)
              }
              role="radio"
              aria-checked={s === detail?.status}
            >
              {s}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Booking Guard — warns about upcoming viewings before delete or status change. */}
      <Sheet
        open={showBookingGuard}
        onClose={() => {
          setShowBookingGuard(false);
          setPendingAction(null);
        }}
        variant="auto"
        role="alertdialog"
        ariaLabelledBy="prop-detail-guard-title"
      >
        <h3 id="prop-detail-guard-title" className="prop-detail__confirm-title">Upcoming Viewings</h3>
        <p className="prop-detail__confirm-text">
          This property has <strong>{upcomingBookings}</strong> upcoming viewing{upcomingBookings !== 1 ? 's' : ''}. Proceed will cancel them and email each renter.
        </p>
        <div className="prop-detail__confirm-actions">
          <button
            className="prop-detail__btn prop-detail__btn--cancel"
            onClick={() => {
              setShowBookingGuard(false);
              setPendingAction(null);
            }}
          >
            Back
          </button>
          <button
            className="prop-detail__btn prop-detail__btn--confirm-delete"
            onClick={() => {
              setShowBookingGuard(false);
              if (pendingAction === 'delete') {
                setShowDeleteConfirm(true);
              } else if (pendingAction?.status) {
                applyStatusChange(pendingAction.status);
              }
            }}
          >
            Continue
          </button>
        </div>
      </Sheet>

      {/* Delete Confirmation — portal-rendered Sheet (bottom on mobile, centered on desktop). */}
      <Sheet
        open={showDeleteConfirm}
        onClose={() => !deleting && setShowDeleteConfirm(false)}
        variant="auto"
        role="alertdialog"
        ariaLabelledBy="prop-detail-confirm-title"
      >
        <h3 id="prop-detail-confirm-title" className="prop-detail__confirm-title">Delete Property</h3>
        <p className="prop-detail__confirm-text">
          Are you sure you want to delete <strong>{detail?.title}</strong>? This action cannot be undone.
        </p>
        <div className="prop-detail__confirm-actions">
          <button
            className="prop-detail__btn prop-detail__btn--cancel"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="prop-detail__btn prop-detail__btn--confirm-delete"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
