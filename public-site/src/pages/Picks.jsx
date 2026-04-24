import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyPanel from '../components/PropertyPanel.jsx'
import apiClient from '../services/api.js'
import './MyList.css'

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
)

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

export default function Picks() {
  const [searchParams] = useSearchParams()
  const idsParam = searchParams.get('ids') || ''
  const ids = idsParam.split(',').map(Number).filter(n => n > 0)

  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const lastClickedId = useRef(null)

  const fetchPicks = useCallback(async () => {
    if (ids.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/properties', {
        params: { ids: idsParam, limit: 100 }
      })
      setProperties(res.data?.data || [])
    } catch {
      setError('Unable to load these listings.')
    } finally {
      setLoading(false)
    }
  }, [idsParam])

  useEffect(() => {
    fetchPicks()
  }, [fetchPicks])

  const handleCardClick = async (id) => {
    lastClickedId.current = id
    setDetailError(null)
    try {
      const res = await apiClient.get(`/properties/${id}`)
      if (lastClickedId.current !== id) return
      setSelectedProperty(res.data)
    } catch {
      if (lastClickedId.current !== id) return
      setDetailError('Unable to load this listing. Please try again.')
    }
  }

  return (
    <div className="my-list">
      <div className="my-list__header">
        <div>
          <p className="my-list__eyebrow">Shared With You</p>
          <h1 className="my-list__title">Easy-Rental Picks</h1>
        </div>
      </div>

      <div className="my-list__content">
        {error ? (
          <div className="my-list__error">
            <p>{error}</p>
            <button className="my-list__retry-btn" onClick={fetchPicks}>Retry</button>
          </div>
        ) : loading ? (
          <div className="my-list__loading">
            <div className="my-list__loading-dots">
              <span />
              <span />
              <span />
            </div>
            <p className="my-list__loading-text">Loading picks…</p>
          </div>
        ) : ids.length === 0 || properties.length === 0 ? (
          <div className="my-list__empty">
            <div className="my-list__empty-circle">
              <HeartIcon />
            </div>
            <h2 className="my-list__empty-title">These listings are no longer available</h2>
            <p className="my-list__empty-desc">
              The shared homes have been removed or are no longer on the market.
            </p>
            <Link to="/listings" className="my-list__browse-link">
              <ListIcon />
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="my-list__grid">
            {properties.map(p => (
              <PropertyCard key={p.id} property={p} onClick={handleCardClick} />
            ))}
          </div>
        )}
      </div>

      {detailError && (
        <div style={{ position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem 1.25rem', borderRadius: '8px', zIndex: 1000 }}>
          <p style={{ margin: 0, color: '#dc2626', fontSize: '0.9rem' }}>{detailError}</p>
        </div>
      )}

      {selectedProperty && (
        <PropertyPanel
          key={selectedProperty.id}
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  )
}
