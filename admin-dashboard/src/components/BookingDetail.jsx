import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api.js';
import Sheet from './Sheet.jsx';
import './BookingDetail.css';

function ptDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-CA', {
    timeZone: 'America/Vancouver',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' PT';
}

export default function BookingDetail({ booking, onStatusChange }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/admin/bookings/${booking.id}`);
      setDetail(res.data);
    } catch (err) {
      console.error('Failed to fetch booking detail:', err);
      setError('Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  }, [booking.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/admin/bookings/${detail.id}`, { status: newStatus });
      setDetail(res.data);
      onStatusChange?.(res.data);
      if (newStatus === 'cancelled') {
        setShowCancelConfirm(false);
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="booking-detail__loading">Loading booking…</div>;
  }

  if (error) {
    return (
      <div className="booking-detail__error">
        <p>{error}</p>
        <button className="booking-detail__retry" onClick={fetchDetail}>Retry</button>
      </div>
    );
  }

  if (!detail) return null;

  const isPast = new Date(detail.scheduled_at) < new Date();
  const canCancel = detail.status === 'confirmed' || detail.status === 'pending_verification';
  const isCancelled = detail.status === 'cancelled';

  return (
    <div className="booking-detail">
      <div className="booking-detail__section">
        <h3 className="booking-detail__section-title">Renter</h3>
        <div className="booking-detail__info-card">
          <div className="booking-detail__info-row">
            <span className="booking-detail__info-label">Name</span>
            <span className="booking-detail__info-value">{detail.renter_name}</span>
          </div>
          <div className="booking-detail__info-row">
            <span className="booking-detail__info-label">Email</span>
            <a href={`mailto:${detail.renter_email}`} className="booking-detail__info-link">
              {detail.renter_email}
            </a>
          </div>
          {detail.renter_phone && (
            <div className="booking-detail__info-row">
              <span className="booking-detail__info-label">Phone</span>
              <a href={`tel:${detail.renter_phone}`} className="booking-detail__info-value">
                {detail.renter_phone}
              </a>
            </div>
          )}
          {detail.renter_note && (
            <div className="booking-detail__info-row">
              <span className="booking-detail__info-label">Note</span>
              <span className="booking-detail__info-value">{detail.renter_note}</span>
            </div>
          )}
        </div>
      </div>

      <div className="booking-detail__section">
        <h3 className="booking-detail__section-title">Property</h3>
        <div className="booking-detail__info-card">
          <div className="booking-detail__info-row">
            <span className="booking-detail__info-value">{detail.property_title || '(Property removed)'}</span>
          </div>
          {detail.property_address && (
            <div className="booking-detail__info-row">
              <span className="booking-detail__info-value booking-detail__info-value--muted">{detail.property_address}</span>
            </div>
          )}
        </div>
      </div>

      <div className="booking-detail__section">
        <h3 className="booking-detail__section-title">Viewing</h3>
        <div className="booking-detail__info-card">
          <div className="booking-detail__info-row">
            <span className="booking-detail__info-label">Time</span>
            <span className="booking-detail__info-value booking-detail__info-value--accent">
              {ptDateTime(detail.scheduled_at)}
            </span>
          </div>
          <div className="booking-detail__info-row">
            <span className="booking-detail__info-label">Status</span>
            <span className={`booking-detail__status-badge booking-detail__status--${detail.status}`}>
              {detail.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {!isCancelled && (
        <div className="booking-detail__actions">
          {detail.status === 'confirmed' && !isPast && (
            <>
              <button
                className="booking-detail__btn booking-detail__btn--complete"
                onClick={() => handleStatusChange('completed')}
                disabled={updating}
              >
                {updating ? '…' : 'Mark Completed'}
              </button>
              <button
                className="booking-detail__btn booking-detail__btn--noshow"
                onClick={() => handleStatusChange('no_show')}
                disabled={updating}
              >
                {updating ? '…' : 'No Show'}
              </button>
            </>
          )}
          {canCancel && (
            <button
              className="booking-detail__btn booking-detail__btn--cancel"
              onClick={() => setShowCancelConfirm(true)}
              disabled={updating}
            >
              Cancel Booking
            </button>
          )}
        </div>
      )}

      <Sheet
        open={showCancelConfirm}
        onClose={() => !updating && setShowCancelConfirm(false)}
        variant="auto"
        role="alertdialog"
        ariaLabelledBy="booking-cancel-title"
      >
        <h3 id="booking-cancel-title" className="booking-detail__confirm-title">Cancel Booking</h3>
        <p className="booking-detail__confirm-text">
          This will delete the event from your Google Calendar and email the renter.
        </p>
        <div className="booking-detail__confirm-actions">
          <button
            className="booking-detail__btn booking-detail__btn--secondary"
            onClick={() => setShowCancelConfirm(false)}
            disabled={updating}
          >
            Back
          </button>
          <button
            className="booking-detail__btn booking-detail__btn--cancel"
            onClick={() => handleStatusChange('cancelled')}
            disabled={updating}
          >
            {updating ? 'Cancelling…' : 'Cancel Booking'}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
