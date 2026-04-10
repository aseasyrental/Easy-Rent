import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyPanel from '../components/PropertyPanel.jsx'
import apiClient from '../services/api.js'
import './MyList.css'

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
        <h1 className="my-list__title">Easy-Rental Picks</h1>
      </div>

      <div className="my-list__content">
        {error ? (
          <div className="my-list__error">
            <p>{error}</p>
            <button className="my-list__retry-btn" onClick={fetchPicks}>Retry</button>
          </div>
        ) : loading ? (
          <div className="my-list__loading">Loading...</div>
        ) : ids.length === 0 || properties.length === 0 ? (
          <div className="my-list__empty">
            <p>These listings are no longer available.</p>
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
