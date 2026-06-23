import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import PropertyMarkers from '../components/PropertyMarkers.jsx'
import FilterBar from '../components/FilterBar.jsx'
import PropertyPanel from '../components/PropertyPanel.jsx'
import apiClient from '../services/api.js'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

const LOWER_MAINLAND_CENTER = [49.25, -123.1]
const DEFAULT_ZOOM = 11

function MapEvents({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: (e) => {
      const bounds = e.target.getBounds()
      onBoundsChange({
        min_lat: bounds.getSouth(),
        max_lat: bounds.getNorth(),
        min_lng: bounds.getWest(),
        max_lng: bounds.getEast(),
      })
    },
  })

  // Capture initial bounds on mount
  useEffect(() => {
    const bounds = map.getBounds()
    onBoundsChange({
      min_lat: bounds.getSouth(),
      max_lat: bounds.getNorth(),
      min_lng: bounds.getWest(),
      max_lng: bounds.getEast(),
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function MapView() {
  const [properties, setProperties] = useState([])
  const [filters, setFilters] = useState({})
  const [bounds, setBounds] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [error, setError] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const lastClickedId = useRef(null)

  const fetchProperties = useCallback(async () => {
    if (!bounds) return
    setError(null)
    try {
      const params = { ...filters, ...bounds, listing_type: 'long_term', limit: 100 }
      const res = await apiClient.get('/properties', { params })
      setProperties(res.data?.data || [])
    } catch {
      setError('Unable to load properties.')
    }
  }, [bounds, filters])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const handlePinClick = async (id) => {
    lastClickedId.current = id
    setSelectedId(id)
    setDetailError(null)
    try {
      const res = await apiClient.get(`/properties/${id}`)
      if (lastClickedId.current !== id) return
      setSelectedProperty(res.data)
    } catch {
      if (lastClickedId.current !== id) return
      setDetailError('Unable to load property details.')
    }
  }

  const handleClosePanel = () => {
    setSelectedId(null)
    setSelectedProperty(null)
  }

  return (
    <div className="map-view with-grain">
      <FilterBar filters={filters} onChange={setFilters} />

      {error && (
        <div className="map-view__error">
          <p>{error}</p>
          <button onClick={fetchProperties}>Retry</button>
        </div>
      )}

      <MapContainer
        center={LOWER_MAINLAND_CENTER}
        zoom={DEFAULT_ZOOM}
        className="map-view__map"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onBoundsChange={setBounds} />
        <PropertyMarkers
          properties={properties}
          onPinClick={handlePinClick}
          selectedId={selectedId}
        />
      </MapContainer>

      {properties.length > 0 && (
        <div className="map-view__count">
          <span className="map-view__count-number">{properties.length}</span>
          <span className="map-view__count-label">
            {properties.length === 1 ? 'home' : 'homes'} on the map
          </span>
        </div>
      )}

      {detailError && (
        <div className="map-view__error map-view__error--detail">
          <p>{detailError}</p>
          <button onClick={() => setDetailError(null)}>Dismiss</button>
        </div>
      )}

      {selectedProperty && (
        <PropertyPanel
          key={selectedProperty.id}
          property={selectedProperty}
          onClose={handleClosePanel}
        />
      )}
    </div>
  )
}
