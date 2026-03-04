import { useState, useEffect } from 'react'
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

export default function FilterBar({ filters, onChange }) {
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
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized) {
      setInitialized(true)
      const urlFilters = {}
      for (const key of FILTER_KEYS) {
        const val = searchParams.get(key)
        if (val) urlFilters[key] = val
      }
      if (Object.keys(urlFilters).length > 0) {
        onChange(urlFilters)
      }
    }
  }, [initialized, searchParams, onChange])

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
          <span className="filter-bar__label">Min Price</span>
          <input
            className="filter-bar__input"
            type="number"
            placeholder="$"
            value={local.min_price}
            onChange={e => handleChange('min_price', e.target.value)}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Max Price</span>
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
