import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api.js';
import LoadError from './LoadError.jsx';
import './PropertiesSidePanel.css';

const STATUS_TABS = [
  { label: 'All', value: null },
  { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Maintenance', value: 'maintenance' },
];

export default function PropertiesSidePanel({ onSelectItem, onAddNew }) {
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const statusFilter = STATUS_TABS[activeTab].value;

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/properties', { params });
      setProperties(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setProperties([]);
      setLoadError("Couldn't load properties. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filtered = search
    ? properties.filter(
        (p) =>
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.address?.toLowerCase().includes(search.toLowerCase())
      )
    : properties;

  return (
    <div className="prop-side">
      <button className="prop-side__add" onClick={onAddNew}>
        + Add Property
      </button>

      <div className="prop-side__tabs">
        {STATUS_TABS.map((tab, i) => (
          <button
            key={tab.label}
            className={`prop-side__tab ${i === activeTab ? 'prop-side__tab--active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="prop-side__search">
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder="Search properties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="prop-side__search-input"
        />
      </div>

      <div className="prop-side__items">
        {loading ? (
          <p className="prop-side__loading">Loading...</p>
        ) : loadError ? (
          <LoadError message={loadError} onRetry={fetchProperties} />
        ) : filtered.length === 0 ? (
          <div className="prop-side__empty">
            {properties.length === 0 ? (
              <>
                <p className="prop-side__empty-text">Add your first listing</p>
                <button className="prop-side__empty-cta" onClick={onAddNew}>
                  + Add Property
                </button>
              </>
            ) : (
              <p className="prop-side__empty-text">No matches</p>
            )}
          </div>
        ) : (
          filtered.map((prop) => {
            const primaryImg = prop.images?.find((img) => img.is_primary) || prop.images?.[0];
            return (
              <button
                key={prop.id}
                className="prop-side__item"
                onClick={() => onSelectItem(prop)}
              >
                {primaryImg && (
                  <img
                    src={primaryImg.url}
                    alt=""
                    className="prop-side__item-thumb"
                  />
                )}
                <div className="prop-side__item-info">
                  <div className="prop-side__item-top">
                    <span className="prop-side__item-title">{prop.title}</span>
                    <span
                      className={`prop-side__status prop-side__status--${prop.status}`}
                    >
                      {prop.status}
                    </span>
                  </div>
                  <div className="prop-side__item-address">{prop.address}</div>
                  <div className="prop-side__item-bottom">
                    <span className="prop-side__item-price">
                      {prop.price != null ? `$${Number(prop.price).toLocaleString()}/mo` : 'Rent TBD'}
                    </span>
                    <span className="prop-side__item-meta">
                      {prop.bedrooms}bd / {prop.bathrooms}ba
                    </span>
                    <div className="prop-side__health">
                      {(prop.inquiry_count || 0) > 0 && (
                        <span
                          className="prop-side__health-badge"
                          title={`${prop.inquiry_count} inquiries`}
                        >
                          {prop.inquiry_count}
                        </span>
                      )}
                      {prop.photos_count === 0 && (
                        <span
                          className="prop-side__missing-photos"
                          title="No photos uploaded"
                        >
                          &#x1f4f7;
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* FAB — mobile only (hidden via CSS on desktop) */}
      <button className="prop-side__fab" onClick={onAddNew} aria-label="Add property">
        +
      </button>
    </div>
  );
}
