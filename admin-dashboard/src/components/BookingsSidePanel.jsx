import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api.js';
import './BookingsSidePanel.css';

const STATUS_TABS = [
  { label: 'Upcoming', value: 'confirmed' },
  { label: 'Past', value: 'completed' },
  { label: 'Pending', value: 'pending_verification' },
  { label: 'Cancelled', value: 'cancelled' },
];

function ptDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-CA', {
    timeZone: 'America/Vancouver',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function BookingsSidePanel({ onSelectItem }) {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const statusFilter = STATUS_TABS[activeTab].value;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/admin/bookings', { params });
      setBookings(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = search
    ? bookings.filter(
        (b) =>
          b.renter_name?.toLowerCase().includes(search.toLowerCase()) ||
          b.property_title?.toLowerCase().includes(search.toLowerCase()) ||
          b.renter_email?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  return (
    <div className="bookings-side">
      <div className="bookings-side__tabs">
        {STATUS_TABS.map((tab, i) => (
          <button
            key={tab.label}
            className={`bookings-side__tab ${i === activeTab ? 'bookings-side__tab--active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bookings-side__search">
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder="Search bookings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bookings-side__search-input"
        />
      </div>

      <div className="bookings-side__items">
        {loading ? (
          <p className="bookings-side__loading">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bookings-side__empty">
            <p className="bookings-side__empty-text">
              {bookings.length === 0 ? 'No bookings yet' : 'No matches'}
            </p>
          </div>
        ) : (
          filtered.map((b) => (
            <button
              key={b.id}
              className="bookings-side__item"
              onClick={() => onSelectItem(b)}
            >
              <div className="bookings-side__item-top">
                <span className="bookings-side__item-name">{b.renter_name}</span>
                <span className={`bookings-side__status bookings-side__status--${b.status}`}>
                  {b.status.replace('_', ' ')}
                </span>
              </div>
              <div className="bookings-side__item-property">{b.property_title || '(Property removed)'}</div>
              <div className="bookings-side__item-time">{ptDateTime(b.scheduled_at)}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
