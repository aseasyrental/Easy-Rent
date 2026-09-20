import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import './FilterBar.css'

const PROPERTY_TYPES = [
  { value: '', label: 'Any Type' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'basement_suite', label: 'Basement Suite' },
  { value: 'laneway_house', label: 'Laneway House' },
]

const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
]

const FILTER_KEYS = ['location', 'min_price', 'max_price', 'bedrooms', 'property_type']

// Which kinds of home to show. Only rendered where a page hands us a handler, so the
// map page is untouched.
const LISTING_SEGMENTS = [
  { value: '', label: 'All' },
  { value: 'long_term', label: 'Long-term' },
  { value: 'short_term', label: 'Furnished' },
]

export default function FilterBar({ filters, onChange, listingType, onListingTypeChange }) {
  const [searchParams] = useSearchParams()
  const [local, setLocal] = useState(() => {
    const initial = { location: '', min_price: '', max_price: '', bedrooms: '', property_type: '' }
    for (const key of FILTER_KEYS) {
      const val = searchParams.get(key)
      if (val) initial[key] = val
    }
    return { ...initial, ...filters }
  })
  const [open, setOpen] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      const urlFilters = {}
      for (const key of FILTER_KEYS) {
        const val = searchParams.get(key)
        if (val) urlFilters[key] = val
      }
      if (Object.keys(urlFilters).length > 0) {
        onChange(urlFilters)
      }
    }
  }, [searchParams, onChange])

  const handleChange = (field, value) => {
    setLocal(prev => ({ ...prev, [field]: value }))
  }

  const handleApply = () => {
    const cleaned = {}
    for (const [key, val] of Object.entries(local)) {
      if (val !== '' && val !== undefined) cleaned[key] = val
    }
    onChange(cleaned)
  }

  return (
    <>
      <button
        className="filter-bar__toggle"
        onClick={() => setOpen(prev => !prev)}
      >
        Filters
      </button>

      <div className={`filter-bar ${!open ? 'filter-bar--hidden' : ''}`}>
        {onListingTypeChange && (
          <div className="filter-bar__field filter-bar__field--segments">
            <span className="filter-bar__label">Show</span>
            <div className="filter-bar__segments" role="group" aria-label="Which homes to show">
              {LISTING_SEGMENTS.map(seg => {
                const active = (listingType || '') === seg.value
                return (
                  <button
                    key={seg.value || 'all'}
                    type="button"
                    className={`filter-bar__segment ${active ? 'filter-bar__segment--active' : ''}`}
                    aria-pressed={active}
                    onClick={() => onListingTypeChange(seg.value)}
                  >
                    {seg.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="filter-bar__field">
          <span className="filter-bar__label">Location</span>
          <input
            className="filter-bar__input"
            type="text"
            placeholder="e.g. Burnaby, Vancouver..."
            value={local.location}
            onChange={e => handleChange('location', e.target.value)}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Min Rent</span>
          <input
            className="filter-bar__input"
            type="number"
            placeholder="$"
            value={local.min_price}
            onChange={e => handleChange('min_price', e.target.value)}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Max Rent</span>
          <input
            className="filter-bar__input"
            type="number"
            placeholder="$"
            value={local.max_price}
            onChange={e => handleChange('max_price', e.target.value)}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Bedrooms</span>
          <select
            className="filter-bar__select"
            value={local.bedrooms}
            onChange={e => handleChange('bedrooms', e.target.value)}
          >
            {BEDROOM_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Type</span>
          <select
            className="filter-bar__select"
            value={local.property_type}
            onChange={e => handleChange('property_type', e.target.value)}
          >
            {PROPERTY_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button className="filter-bar__apply" onClick={handleApply}>
          Apply
        </button>
      </div>
    </>
  )
}
