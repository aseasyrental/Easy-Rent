import { useState, useEffect, useCallback } from 'react'
import PropertyCard from '../components/PropertyCard.jsx'
import FilterBar from '../components/FilterBar.jsx'
import useOpenHome from '../hooks/useOpenHome.js'
import apiClient from '../services/api.js'
import './Listings.css'

export default function Listings() {
  const [properties, setProperties] = useState([])
  const [filters, setFilters] = useState({})
  // '' = every kind of home. Browse used to be long-term only; furnished homes were
  // stranded on their own page, which is the thing Bill asked us to undo.
  const [listingType, setListingType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const openHome = useOpenHome()

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { ...filters, page, limit: 12, sort: 'newest', featured_first: true }
      if (listingType) {
        params.listing_type = listingType
        // A kind the renter picked is a hard filter — a featured long-term home must
        // not appear under "Furnished". (Page defaults stay soft; see PropertyModel.)
        params.strict_listing_type = true
      }
      const res = await apiClient.get('/properties', { params })
      setProperties(res.data?.data || [])
      setTotalPages(res.data?.pagination?.total_pages || 1)
      setTotalCount(res.data?.pagination?.total ?? (res.data?.data || []).length)
    } catch {
      setError('Unable to load properties. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [filters, page, listingType])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleListingTypeChange = (next) => {
    setListingType(next)
    setPage(1)
  }

  const countText = totalCount === 1
    ? '1 place to call home'
    : `${totalCount} places to call home`

  return (
    <div className="listings with-grain">
      <div className="listings__header">
        <h1 className="listings__title">Homes</h1>
        <p className="listings__count">{countText}</p>
      </div>

      <FilterBar
        filters={filters}
        onChange={handleFiltersChange}
        listingType={listingType}
        onListingTypeChange={handleListingTypeChange}
      />

      <div className="listings__content">
        {error ? (
          <div className="listings__error">
            <p>{error}</p>
            <button className="listings__retry-btn" onClick={fetchProperties}>Retry</button>
          </div>
        ) : loading ? (
          <div className="listings__loading">
            <div className="listings__loading-dots">
              <span /><span /><span />
            </div>
            <p>Finding homes for you...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="listings__empty">
            <div className="listings__empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h2 className="listings__empty-title">No homes found</h2>
            <p className="listings__empty-desc">Try adjusting your filters to see more places.</p>
          </div>
        ) : (
          <>
            <div className="listings__grid">
              {properties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onClick={openHome}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="listings__pagination">
                <button
                  className="listings__page-btn"
                  disabled={page <= 1}
                  onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  aria-label="Previous page"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="listings__page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="listings__page-btn"
                  disabled={page >= totalPages}
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  aria-label="Next page"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
