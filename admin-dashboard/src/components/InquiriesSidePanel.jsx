import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api.js';
import './InquiriesSidePanel.css';

const STATUS_TABS = [
  { label: 'All', value: null },
  { label: 'New', value: 'new' },
  { label: 'Responded', value: 'responded' },
  { label: 'Closed', value: 'closed' },
];

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

function truncate(text, maxLen = 60) {
  if (!text) return '';
  const firstLine = text.split('\n')[0];
  if (firstLine.length <= maxLen) return firstLine;
  return firstLine.slice(0, maxLen) + '...';
}

export default function InquiriesSidePanel({ onSelectItem }) {
  const [inquiries, setInquiries] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const statusFilter = STATUS_TABS[activeTab].value;

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/inquiries', { params });
      setInquiries(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Count of new inquiries for badge (always compute from all data when on 'All' tab,
  // or use length when on 'New' tab)
  const newCount = statusFilter === 'new'
    ? inquiries.length
    : inquiries.filter((inq) => inq.status === 'new').length;

  const filtered = search
    ? inquiries.filter(
        (inq) =>
          inq.name?.toLowerCase().includes(search.toLowerCase()) ||
          inq.property_title?.toLowerCase().includes(search.toLowerCase()) ||
          inq.message?.toLowerCase().includes(search.toLowerCase())
      )
    : inquiries;

  return (
    <div className="inq-side">
      <div className="inq-side__tabs">
        {STATUS_TABS.map((tab, i) => (
          <button
            key={tab.label}
            className={`inq-side__tab ${i === activeTab ? 'inq-side__tab--active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
            {tab.value === 'new' && newCount > 0 && (
              <span className="inq-side__tab-badge">{newCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="inq-side__search">
        <input
          type="text"
          placeholder="Search inquiries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="inq-side__search-input"
        />
      </div>

      <div className="inq-side__items">
        {loading ? (
          <p className="inq-side__loading">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="inq-side__empty">
            <p className="inq-side__empty-text">
              {inquiries.length === 0 ? 'No inquiries yet' : 'No matches'}
            </p>
          </div>
        ) : (
          filtered.map((inq) => (
            <button
              key={inq.id}
              className={`inq-side__item ${inq.status === 'new' ? 'inq-side__item--new' : ''}`}
              onClick={() => onSelectItem(inq)}
            >
              <div className="inq-side__item-top">
                <span className="inq-side__item-name">{inq.name}</span>
                <span className="inq-side__item-time">{timeAgo(inq.created_at)}</span>
              </div>
              <div className="inq-side__item-property">{inq.property_title}</div>
              <div className="inq-side__item-preview">{truncate(inq.message)}</div>
              <span className={`inq-side__status inq-side__status--${inq.status}`}>
                {inq.status}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
