import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyPanel from '../components/PropertyPanel.jsx'
import useMyList from '../hooks/useMyList.js'
import apiClient from '../services/api.js'
import './MyList.css'

export default function MyList() {
  const { ids, shareUrl } = useMyList()
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
    try {
      const res = await apiClient.get(`/properties/${id}`)
      if (lastClickedId.current !== id) return
      setSelectedProperty(res.data)
    } catch {
      // silently fail detail load
    }
  }

  const handleShare = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: clipboard not available
    }
  }

  return (
    <div className="my-list">
      <div className="my-list__header">
        <h1 className="my-list__title">My List</h1>
        {ids.length > 0 && (
          <button className="my-list__share-btn" onClick={handleShare}>
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
          <div className="my-list__loading">Loading...</div>
        ) : ids.length === 0 ? (
          <div className="my-list__empty">
            <p>No properties saved yet.</p>
            <Link to="/listings" className="my-list__browse-link">Browse Listings</Link>
          </div>
        ) : properties.length === 0 ? (
          <div className="my-list__empty">
            <p>Your saved properties are no longer available.</p>
            <Link to="/listings" className="my-list__browse-link">Browse Listings</Link>
          </div>
        ) : (
          <div className="my-list__grid">
            {properties.map(p => (
              <PropertyCard key={p.id} property={p} onClick={handleCardClick} />
            ))}
          </div>
        )}
      </div>

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
