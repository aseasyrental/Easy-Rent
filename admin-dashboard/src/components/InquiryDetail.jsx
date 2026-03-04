import { useState, useCallback } from 'react';
import apiClient from '../services/api.js';
import './InquiryDetail.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function isOver24Hours(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() > 24 * 60 * 60 * 1000;
}

export default function InquiryDetail({ inquiry, onStatusChange, onNavigateProperty }) {
  const [status, setStatus] = useState(inquiry.status);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = useCallback(async (newStatus) => {
    setUpdating(true);
    try {
      await apiClient.patch(`/inquiries/${inquiry.id}/status`, { status: newStatus });
      setStatus(newStatus);
      onStatusChange?.({ ...inquiry, status: newStatus });
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
    } finally {
      setUpdating(false);
    }
  }, [inquiry, onStatusChange]);

  const showNudge = status === 'new' && isOver24Hours(inquiry.created_at);

  const replySubject = encodeURIComponent(
    `Re: Inquiry about ${inquiry.property_title || 'your listing'}`
  );
  const mailtoHref = `mailto:${inquiry.email}?subject=${replySubject}`;

  return (
    <div className="inq-detail">
      {/* 24-hour nudge */}
      {showNudge && (
        <div className="inq-detail__nudge">
          <span className="inq-detail__nudge-icon">&#x23F3;</span>
          <span className="inq-detail__nudge-text">Waiting for response</span>
        </div>
      )}

      {/* Renter Info Section */}
      <div className="inq-detail__section">
        <h3 className="inq-detail__section-title">Renter</h3>
        <div className="inq-detail__info-card">
          <div className="inq-detail__info-row">
            <span className="inq-detail__info-label">Name</span>
            <span className="inq-detail__info-value">{inquiry.name}</span>
          </div>
          <div className="inq-detail__info-row">
            <span className="inq-detail__info-label">Email</span>
            <a href={`mailto:${inquiry.email}`} className="inq-detail__info-link">
              {inquiry.email}
            </a>
          </div>
          {inquiry.phone && (
            <div className="inq-detail__info-row">
              <span className="inq-detail__info-label">Phone</span>
              <a href={`tel:${inquiry.phone}`} className="inq-detail__info-value">
                {inquiry.phone}
              </a>
            </div>
          )}
          <div className="inq-detail__info-row">
            <span className="inq-detail__info-label">Submitted</span>
            <span className="inq-detail__info-value inq-detail__info-value--muted">
              {timeAgo(inquiry.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Property Link Section */}
      <div className="inq-detail__section">
        <h3 className="inq-detail__section-title">Property</h3>
        <button
          className="inq-detail__property-link"
          onClick={() => onNavigateProperty?.(inquiry)}
          title="View property in dashboard"
        >
          <span className="inq-detail__property-title">
            {inquiry.property_title || 'Unknown Property'}
          </span>
          {inquiry.property_address && (
            <span className="inq-detail__property-address">
              {inquiry.property_address}
            </span>
          )}
        </button>
      </div>

      {/* Message Section */}
      <div className="inq-detail__section">
        <h3 className="inq-detail__section-title">Message</h3>
        <div className="inq-detail__message">
          {inquiry.message}
        </div>
      </div>

      {/* Status Management */}
      <div className="inq-detail__section">
        <h3 className="inq-detail__section-title">Status</h3>
        <div className="inq-detail__status-row">
          <span className={`inq-detail__status-badge inq-detail__status--${status}`}>
            {status}
          </span>
        </div>
        <div className="inq-detail__status-actions">
          {status !== 'responded' && (
            <button
              className="inq-detail__btn inq-detail__btn--responded"
              onClick={() => handleStatusChange('responded')}
              disabled={updating}
            >
              {updating ? '...' : 'Mark as Responded'}
            </button>
          )}
          {status !== 'closed' && (
            <button
              className="inq-detail__btn inq-detail__btn--closed"
              onClick={() => handleStatusChange('closed')}
              disabled={updating}
            >
              {updating ? '...' : 'Mark as Closed'}
            </button>
          )}
          {(status === 'responded' || status === 'closed') && (
            <button
              className="inq-detail__btn inq-detail__btn--reopen"
              onClick={() => handleStatusChange('new')}
              disabled={updating}
            >
              {updating ? '...' : 'Reopen'}
            </button>
          )}
        </div>
      </div>

      {/* Reply Button */}
      <div className="inq-detail__actions">
        <a
          href={mailtoHref}
          className="inq-detail__btn inq-detail__btn--reply"
        >
          Reply to {inquiry.name}
        </a>
      </div>
    </div>
  );
}
