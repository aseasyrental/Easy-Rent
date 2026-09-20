import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import PropertyMarkers from '../components/PropertyMarkers.jsx'
import FilterBar from '../components/FilterBar.jsx'
import useOpenHome from '../hooks/useOpenHome.js'
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
  const [error, setError] = useState(null)
  const openHome = useOpenHome()

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
          onPinClick={openHome}
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

    </div>
  )
}
