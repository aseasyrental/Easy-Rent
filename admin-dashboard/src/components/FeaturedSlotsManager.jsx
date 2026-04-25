import { useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api.js';
import Sheet from './Sheet.jsx';
import './FeaturedSlotsManager.css';

function primaryImage(property) {
  if (!property?.images?.length) return null;
  const primary = property.images.find((i) => i.is_primary);
  return primary?.url || property.images[0]?.url || null;
}

function formatPrice(price) {
  if (price === null || price === undefined) return '';
  return `$${Number(price).toLocaleString()}/mo`;
}

function SlotCard({
  slot,
  busy,
  canMoveUp,
  canMoveDown,
  onPick,
  onClear,
  onMoveUp,
  onMoveDown,
}) {
  const property = slot.property;
  const photo = primaryImage(property);
  return (
    <div className={`feat-slot ${property ? 'feat-slot--filled' : 'feat-slot--empty'}`}>
      <div className="feat-slot__header">
        <span className="feat-slot__position">Slot {slot.position}</span>
        {busy && <span className="feat-slot__busy">Saving…</span>}
      </div>

      {property ? (
        <div className="feat-slot__body">
          <div className="feat-slot__thumb">
            {photo ? (
              <img src={photo} alt={property.title} />
            ) : (
              <span className="feat-slot__thumb-placeholder">&#x1f3e0;</span>
            )}
          </div>
          <div className="feat-slot__meta">
            <p className="feat-slot__title" title={property.title}>{property.title}</p>
            <p className="feat-slot__price">{formatPrice(property.price)}</p>
            {property.status !== 'available' && (
              <p className="feat-slot__status">{property.status} — hidden from public</p>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="feat-slot__empty-cta"
          onClick={() => onPick(slot.position)}
          disabled={busy}
        >
          + Pick a home for this slot
        </button>
      )}

      <div className="feat-slot__actions">
        {property && (
          <>
            <button
              type="button"
              className="feat-slot__btn"
              onClick={() => onPick(slot.position)}
              disabled={busy}
            >
              Change
            </button>
            <button
              type="button"
              className="feat-slot__btn feat-slot__btn--danger"
              onClick={() => onClear(slot.position)}
              disabled={busy}
            >
              Clear
            </button>
          </>
        )}
        <div className="feat-slot__reorder">
          <button
            type="button"
            className="feat-slot__icon-btn"
            onClick={() => onMoveUp(slot.position)}
            disabled={busy || !canMoveUp}
            aria-label={`Move slot ${slot.position} up`}
          >
            ↑
          </button>
          <button
            type="button"
            className="feat-slot__icon-btn"
            onClick={() => onMoveDown(slot.position)}
            disabled={busy || !canMoveDown}
            aria-label={`Move slot ${slot.position} down`}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertyPicker({ open, onClose, onPick, currentSlotPosition, currentlyFeaturedIds }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    apiClient.get('/properties', { params: { limit: 100 } })
      .then((res) => { if (!cancelled) setProperties(res.data?.data || []); })
      .catch((err) => { console.error('Failed to load properties for picker:', err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p) => {
      const hay = [p.title, p.address, p.city].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [properties, search]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      variant="auto"
      role="dialog"
      ariaLabel={`Pick a home for slot ${currentSlotPosition}`}
    >
      <div className="feat-picker">
        <div className="feat-picker__head">
          <h3 className="feat-picker__title">Pick a home for slot {currentSlotPosition}</h3>
          <button type="button" className="feat-picker__close" onClick={onClose} aria-label="Close picker">
            ×
          </button>
        </div>
        <input
          type="search"
          className="feat-picker__search"
          placeholder="Search by title, address, or city"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoCapitalize="none"
          spellCheck={false}
        />
        {loading && <p className="feat-picker__loading">Loading homes…</p>}
        {!loading && filtered.length === 0 && (
          <p className="feat-picker__empty">No homes match.</p>
        )}
        <ul className="feat-picker__list">
          {filtered.map((p) => {
            const photo = primaryImage(p);
            const featuredAt = p.featured_position;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className="feat-picker__row"
                  onClick={() => onPick(p)}
                >
                  <span className="feat-picker__thumb">
                    {photo ? <img src={photo} alt="" /> : <span>&#x1f3e0;</span>}
                  </span>
                  <span className="feat-picker__meta">
                    <span className="feat-picker__row-title">{p.title}</span>
                    <span className="feat-picker__row-sub">
                      {formatPrice(p.price)}
                      {p.city ? ` · ${p.city}` : ''}
                      {featuredAt ? ` · in slot ${featuredAt}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}

export default function FeaturedSlotsManager({ open, onClose, controller }) {
  const { slots, loading, error, busyPosition, setSlot, clearSlot, swapSlots } = controller;
  const [pickerForPosition, setPickerForPosition] = useState(null);

  const featuredIds = useMemo(
    () => slots.map((s) => s.property?.id).filter(Boolean),
    [slots],
  );

  const handlePick = (position) => setPickerForPosition(position);
  const handleClear = async (position) => { await clearSlot(position); };
  const handleMoveUp = async (position) => {
    if (position <= 1) return;
    await swapSlots(position, position - 1);
  };
  const handleMoveDown = async (position) => {
    if (position >= 3) return;
    await swapSlots(position, position + 1);
  };

  const handlePickerSelect = async (property) => {
    const position = pickerForPosition;
    setPickerForPosition(null);
    if (!position) return;
    await setSlot(property.id, position);
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        variant="auto"
        role="dialog"
        ariaLabel="Manage featured homes"
      >
        <div className="feat-mgr">
          <div className="feat-mgr__head">
            <h2 className="feat-mgr__title">Featured homes</h2>
            <button type="button" className="feat-mgr__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          <p className="feat-mgr__hint">
            These three homes show on the public landing page in this order.
            Slot 1 shows first.
          </p>
          {error && <div className="feat-mgr__error">{error}</div>}
          {loading && slots.every((s) => !s.property) ? (
            <p className="feat-mgr__loading">Loading…</p>
          ) : (
            <div className="feat-mgr__slots">
              {slots.map((slot) => (
                <SlotCard
                  key={slot.position}
                  slot={slot}
                  busy={busyPosition === slot.position}
                  canMoveUp={slot.position > 1}
                  canMoveDown={slot.position < 3}
                  onPick={handlePick}
                  onClear={handleClear}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))}
            </div>
          )}
        </div>
      </Sheet>

      <PropertyPicker
        open={pickerForPosition !== null}
        onClose={() => setPickerForPosition(null)}
        onPick={handlePickerSelect}
        currentSlotPosition={pickerForPosition}
        currentlyFeaturedIds={featuredIds}
      />
    </>
  );
}
