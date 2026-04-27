import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyPanel from '../components/PropertyPanel.jsx'
import useMyList from '../hooks/useMyList.js'
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

export default function MyList() {
  const { ids, shareUrl } = useMyList()
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const [copied, setCopied] = useState(false)
  const lastClickedId = useRef(null)
  const prevIdsRef = useRef(null)

  useEffect(() => {
    if (ids.length === 0) {
      setProperties([])
      setLoading(false)
      prevIdsRef.current = ids
      return
    }

    const prevIds = prevIdsRef.current
    prevIdsRef.current = ids

    // Item removed — optimistically filter local state, no re-fetch
    if (prevIds && ids.length < prevIds.length) {
      setProperties(prev => prev.filter(p => ids.includes(p.id)))
      return
    }

    // Initial load or item added — fetch from API
    const fetchSaved = async () => {
      setError(null)
      try {
        const res = await apiClient.get('/properties', {
          params: { ids: ids.join(','), limit: 100 }
        })
        setProperties(res.data?.data || [])
      } catch {
        setError('Unable to load your saved properties.')
      } finally {
        setLoading(false)
      }
    }
    fetchSaved()
  }, [ids])

  const handleCardClick = async (id) => {
    lastClickedId.current = id
    setDetailError(null)
    try {
      const res = await apiClient.get(`/properties/${id}`)
      if (lastClickedId.current !== id) return
      setSelectedProperty(res.data)
    } catch {
      if (lastClickedId.current !== id) return
      setDetailError('Unable to load property details. Please try again.')
    }
  }

  const handleShare = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', shareUrl)
    }
  }

  return (
    <div className="my-list with-grain">
      <div className="my-list__header">
        <div>
          <p className="my-list__eyebrow">Your Collection</p>
          <h1 className="my-list__title">My List</h1>
          {ids.length > 0 && (
            <p className="my-list__count">
              {ids.length} home{ids.length === 1 ? '' : 's'} saved
            </p>
          )}
        </div>
        {ids.length > 0 && (
          <button
            className="my-list__share-btn"
            onClick={handleShare}
          >
            {copied ? 'Link Copied!' : 'Share List'}
          </button>
        )}
      </div>

      <div className="my-list__content">
        {error ? (
          <div className="my-list__error">
            <p>{error}</p>
            <button className="my-list__retry-btn" onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : loading ? (
          <div className="my-list__loading">
            <div className="my-list__loading-dots">
              <span />
              <span />
              <span />
            </div>
            <p className="my-list__loading-text">Loading your saved homes…</p>
          </div>
        ) : ids.length === 0 ? (
          <div className="my-list__empty">
            <div className="my-list__empty-circle">
              <HeartIcon />
            </div>
            <h2 className="my-list__empty-title">No homes saved yet</h2>
            <p className="my-list__empty-desc">
              Take your time browsing. When you find a place that feels right, save it here.
            </p>
            <Link to="/listings" className="my-list__browse-link">
              <ListIcon />
              Browse Listings
            </Link>
          </div>
        ) : properties.length === 0 ? (
          <div className="my-list__empty">
            <div className="my-list__empty-circle">
              <HeartIcon />
            </div>
            <h2 className="my-list__empty-title">Your saved properties are no longer available</h2>
            <p className="my-list__empty-desc">
              The homes you saved have been removed or are no longer on the market.
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
        <div className="my-list__error my-list__error--toast" style={{ position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem 1.25rem', borderRadius: '8px', zIndex: 1000 }}>
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
