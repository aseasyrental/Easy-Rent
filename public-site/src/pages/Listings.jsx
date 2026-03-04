import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyPanel from '../components/PropertyPanel.jsx'
import FilterBar from '../components/FilterBar.jsx'
import apiClient from '../services/api.js'
import './Listings.css'

export default function Listings() {
  const [searchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const params = { ...filters, page, limit: 12, sort: 'newest' }
      const res = await apiClient.get('/properties', { params })
      setProperties(res.data.data)
      setTotalPages(res.data.pagination.total_pages)
    } catch (err) {
      console.error('Failed to fetch properties:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const handleCardClick = async (id) => {
    try {
      const res = await apiClient.get(`/properties/${id}`)
      setSelectedProperty(res.data)
    } catch (err) {
      console.error('Failed to fetch property:', err)
    }
  }

  const handleClosePanel = () => {
    setSelectedProperty(null)
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  return (
    <div className="listings">
      <FilterBar filters={filters} onChange={handleFiltersChange} />

      <div className="listings__content">
        {loading ? (
          <div className="listings__loading">Loading...</div>
        ) : properties.length === 0 ? (
          <div className="listings__empty">
            No properties match your filters. Try adjusting your search.
          </div>
        ) : (
          <>
            <div className="listings__grid">
              {properties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onClick={handleCardClick}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="listings__pagination">
                <button
                  className="listings__page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </button>
                <span className="listings__page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="listings__page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedProperty && (
        <PropertyPanel
          property={selectedProperty}
          onClose={handleClosePanel}
        />
      )}
    </div>
  )
}
