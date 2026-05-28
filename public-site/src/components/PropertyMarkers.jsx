import { Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import './PropertyMarkers.css'

// Fix Leaflet default icon path issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const makeIcon = (leased) => L.divIcon({
  className: 'property-marker',
  html: `<div class="property-marker__pin${leased ? ' property-marker__pin--leased' : ''}"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
})

const clusterIconCreate = (cluster) => {
  const count = cluster.getChildCount()
  return L.divIcon({
    className: 'property-marker-cluster',
    html: `<div class="property-marker-cluster__bubble">${count}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

export default function PropertyMarkers({ properties, onPinClick }) {
  return (
    <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIconCreate}>
      {properties
        .filter(p => p.latitude && p.longitude)
        .map(property => (
          <Marker
            key={property.id}
            position={[parseFloat(property.latitude), parseFloat(property.longitude)]}
            icon={makeIcon(property.status === 'occupied')}
            eventHandlers={{
              click: () => onPinClick(property.id),
            }}
          >
            <Popup>
              <strong>{property.title}</strong><br />
              {property.status === 'occupied'
                ? 'Leased'
                : (property.price != null ? `$${Number(property.price).toLocaleString()}/mo` : 'Rent TBD')}
            </Popup>
          </Marker>
        ))
      }
    </MarkerClusterGroup>
  )
}
