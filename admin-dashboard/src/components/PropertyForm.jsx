import { useState, useCallback, useRef, useEffect } from 'react';
import apiClient from '../services/api.js';
import ImageUploader from './ImageUploader.jsx';
import './PropertyForm.css';
import './ImageUploader.css';

const PROPERTY_TYPES = [
  'apartment',
  'house',
  'condo',
  'townhouse',
  'duplex',
  'basement_suite',
  'laneway_house',
];

const STATUS_OPTIONS = ['available', 'occupied', 'maintenance'];

const INITIAL_STATE = {
  title: '',
  address: '',
  city: '',
  province: 'BC',
  postal_code: '',
  price: '',
  bedrooms: '',
  bathrooms: '',
  sqft: '',
  property_type: 'apartment',
  availability_date: '',
  status: 'available',
  description: '',
  amenities: '',
  lease_term_months: '',
  deposit_amount: '',
};

function buildInitialState(property) {
  if (!property) return INITIAL_STATE;

  const amenities = Array.isArray(property.amenities)
    ? property.amenities.join(', ')
    : property.amenities || '';

  // Format date for input[type=date] — needs YYYY-MM-DD
  let availability_date = '';
  if (property.availability_date) {
    const d = new Date(property.availability_date);
    if (!isNaN(d.getTime())) {
      availability_date = d.toISOString().split('T')[0];
    }
  }

  return {
    title: property.title || '',
    address: property.address || '',
    city: property.city || '',
    province: property.province || 'BC',
    postal_code: property.postal_code || '',
    price: property.price ?? '',
    bedrooms: property.bedrooms ?? '',
    bathrooms: property.bathrooms ?? '',
    sqft: property.sqft ?? '',
    property_type: property.property_type || 'apartment',
    availability_date,
    status: property.status || 'available',
    description: property.description || '',
    amenities,
    lease_term_months: property.lease_term_months ?? '',
    deposit_amount: property.deposit_amount ?? '',
  };
}

export default function PropertyForm({ property, onSave, onCancel }) {
  const isEdit = Boolean(property);
  const [form, setForm] = useState(() => buildInitialState(property));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const formRef = useRef(null);
  const [openSections, setOpenSections] = useState(new Set(['basic', 'details']));

  const toggleSection = useCallback((section) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  // Prevent mouse wheel from changing number input values
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const block = (e) => {
      if (e.target.type === 'number') e.target.blur();
    };
    el.addEventListener('wheel', block, { passive: true });
    return () => el.removeEventListener('wheel', block);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSaving(true);
      setError(null);

      // Build payload
      const payload = {
        title: form.title.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        postal_code: form.postal_code.trim(),
        price: form.price !== '' ? Number(form.price) : null,
        bedrooms: form.bedrooms !== '' ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms !== '' ? Number(form.bathrooms) : null,
        sqft: form.sqft !== '' ? Number(form.sqft) : null,
        property_type: form.property_type,
        availability_date: form.availability_date || null,
        status: form.status,
        description: form.description.trim(),
        amenities: form.amenities
          ? form.amenities
              .split(',')
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        lease_term_months:
          form.lease_term_months !== '' ? Number(form.lease_term_months) : null,
        deposit_amount:
          form.deposit_amount !== '' ? Number(form.deposit_amount) : null,
      };

      try {
        let res;
        if (isEdit) {
          res = await apiClient.put(`/properties/${property.id}`, payload);
        } else {
          res = await apiClient.post('/properties', payload);
        }
        onSave?.(res.data);
      } catch (err) {
        console.error('Failed to save property:', err);
        const data = err.response?.data;
        const msg =
          (Array.isArray(data?.errors) && data.errors.join(', ')) ||
          data?.error ||
          data?.message ||
          'Failed to save property. Please try again.';
        setError(msg);
      } finally {
        setSaving(false);
      }
    },
    [form, isEdit, property, onSave]
  );

  return (
    <form ref={formRef} className="prop-form" onSubmit={handleSubmit}>
      {/* Header guidance */}
      <div className="prop-form__header">
        <h2 className="prop-form__title">
          {isEdit ? 'Edit Property' : 'New Property'}
        </h2>
        {!isEdit && (
          <p className="prop-form__guidance">
            Start with the basics — address, rent, and a few photos.
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="prop-form__error">
          {error}
        </div>
      )}

      {/* === Section: Basic Info === */}
      <div className="prop-form__section">
        <button
          type="button"
          className={`prop-form__section-header ${openSections.has('basic') ? 'prop-form__section-header--open' : ''}`}
          onClick={() => toggleSection('basic')}
        >
          <span>Basic Info</span>
          <span className="prop-form__section-chevron">{openSections.has('basic') ? '−' : '+'}</span>
        </button>
        {openSections.has('basic') && (
          <div className="prop-form__section-body">
            <div className="prop-form__grid">
              <div className="prop-form__field prop-form__field--full">
                <label className="prop-form__label" htmlFor="pf-title">Title</label>
                <input id="pf-title" className="prop-form__input" type="text" autoCapitalize="words" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Modern 2BR Downtown" required />
              </div>
              <div className="prop-form__field prop-form__field--full">
                <label className="prop-form__label" htmlFor="pf-address">Address</label>
                <input id="pf-address" className="prop-form__input" type="text" autoComplete="street-address" autoCapitalize="words" name="address" value={form.address} onChange={handleChange} placeholder="123 Main St" required />
              </div>
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-city">City</label>
                <input id="pf-city" className="prop-form__input" type="text" autoComplete="address-level2" autoCapitalize="words" name="city" value={form.city} onChange={handleChange} placeholder="Vancouver" />
              </div>
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-province">Province</label>
                <input id="pf-province" className="prop-form__input" type="text" autoComplete="address-level1" autoCapitalize="characters" name="province" value={form.province} onChange={handleChange} placeholder="BC" />
              </div>
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-postal">Postal Code</label>
                <input id="pf-postal" className="prop-form__input" type="text" autoComplete="postal-code" autoCapitalize="characters" name="postal_code" value={form.postal_code} onChange={handleChange} placeholder="V6B 1A1" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === Section: Details === */}
      <div className="prop-form__section">
        <button
          type="button"
          className={`prop-form__section-header ${openSections.has('details') ? 'prop-form__section-header--open' : ''}`}
          onClick={() => toggleSection('details')}
        >
          <span>Details</span>
          <span className="prop-form__section-chevron">{openSections.has('details') ? '−' : '+'}</span>
        </button>
        {openSections.has('details') && (
          <div className="prop-form__section-body">
            <div className="prop-form__grid">
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-type">Property Type</label>
                <select id="pf-type" className="prop-form__input prop-form__select" name="property_type" value={form.property_type} onChange={handleChange}>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-beds">Bedrooms</label>
                <input id="pf-beds" className="prop-form__input" type="number" inputMode="numeric" name="bedrooms" value={form.bedrooms} onChange={handleChange} placeholder="2" min="0" />
              </div>
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-baths">Bathrooms</label>
                <input id="pf-baths" className="prop-form__input" type="number" inputMode="decimal" name="bathrooms" value={form.bathrooms} onChange={handleChange} placeholder="1" min="0" step="0.5" />
              </div>
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-sqft">Square Feet</label>
                <input id="pf-sqft" className="prop-form__input" type="number" inputMode="numeric" name="sqft" value={form.sqft} onChange={handleChange} placeholder="850" min="0" />
              </div>
              <div className="prop-form__field prop-form__field--full">
                <label className="prop-form__label" htmlFor="pf-desc">Description</label>
                <textarea id="pf-desc" className="prop-form__input prop-form__textarea" name="description" value={form.description} onChange={handleChange} placeholder="Describe the property..." rows={4} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === Section: Pricing === */}
      <div className="prop-form__section">
        <button
          type="button"
          className={`prop-form__section-header ${openSections.has('pricing') ? 'prop-form__section-header--open' : ''}`}
          onClick={() => toggleSection('pricing')}
        >
          <span>Pricing</span>
          <span className="prop-form__section-chevron">{openSections.has('pricing') ? '−' : '+'}</span>
        </button>
        {openSections.has('pricing') && (
          <div className="prop-form__section-body">
            <div className="prop-form__grid">
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-price">Rent ($/mo)</label>
                <input id="pf-price" className="prop-form__input" type="number" inputMode="numeric" name="price" value={form.price} onChange={handleChange} placeholder="2000" min="0" step="1" />
              </div>
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-deposit">Deposit ($)</label>
                <input id="pf-deposit" className="prop-form__input" type="number" inputMode="numeric" name="deposit_amount" value={form.deposit_amount} onChange={handleChange} placeholder="1000" min="0" />
              </div>
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-lease">Lease Term (months)</label>
                <input id="pf-lease" className="prop-form__input" type="number" inputMode="numeric" name="lease_term_months" value={form.lease_term_months} onChange={handleChange} placeholder="12" min="1" />
              </div>
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-avail">Availability Date</label>
                <input id="pf-avail" className="prop-form__input" type="date" name="availability_date" value={form.availability_date} onChange={handleChange} />
              </div>
              <div className="prop-form__field">
                <label className="prop-form__label" htmlFor="pf-status">Status</label>
                <select id="pf-status" className="prop-form__input prop-form__select" name="status" value={form.status} onChange={handleChange}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === Section: Amenities === */}
      <div className="prop-form__section">
        <button
          type="button"
          className={`prop-form__section-header ${openSections.has('amenities') ? 'prop-form__section-header--open' : ''}`}
          onClick={() => toggleSection('amenities')}
        >
          <span>Amenities</span>
          <span className="prop-form__section-chevron">{openSections.has('amenities') ? '−' : '+'}</span>
        </button>
        {openSections.has('amenities') && (
          <div className="prop-form__section-body">
            <div className="prop-form__grid">
              <div className="prop-form__field prop-form__field--full">
                <label className="prop-form__label" htmlFor="pf-amenities">Amenities</label>
                <input id="pf-amenities" className="prop-form__input" type="text" autoCapitalize="words" name="amenities" value={form.amenities} onChange={handleChange} placeholder="Parking, Gym, Pool, In-suite Laundry" />
                <span className="prop-form__hint">Comma-separated list</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === Section: Photos === */}
      <div className="prop-form__section">
        <button
          type="button"
          className={`prop-form__section-header ${openSections.has('photos') ? 'prop-form__section-header--open' : ''}`}
          onClick={() => toggleSection('photos')}
        >
          <span>Photos</span>
          <span className="prop-form__section-chevron">{openSections.has('photos') ? '−' : '+'}</span>
        </button>
        {openSections.has('photos') && (
          <div className="prop-form__section-body">
            {isEdit && property?.id ? (
              <ImageUploader propertyId={property.id} />
            ) : (
              <p className="img-uploader__save-first">
                Save the property first, then you can add photos.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sticky actions bar */}
      <div className="prop-form__actions">
        <button
          type="button"
          className="prop-form__btn prop-form__btn--cancel"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="prop-form__btn prop-form__btn--save"
          disabled={saving}
        >
          {saving
            ? 'Saving...'
            : isEdit
              ? 'Save Changes'
              : 'Create Property'}
        </button>
      </div>
    </form>
  );
}
