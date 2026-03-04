import { Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'

// Fix Leaflet default icon path issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

export default function PropertyMarkers({ properties, onPinClick, selectedId }) {
  return (
    <MarkerClusterGroup chunkedLoading>
      {properties
        .filter(p => p.latitude && p.longitude)
        .map(property => (
          <Marker
            key={property.id}
            position={[parseFloat(property.latitude), parseFloat(property.longitude)]}
            eventHandlers={{
              click: () => onPinClick(property.id),
            }}
          >
            <Popup>
              <strong>{property.title}</strong><br />
              {property.price != null ? `$${Number(property.price).toLocaleString()}/mo` : 'Rent TBD'}
            </Popup>
          </Marker>
        ))
      }
    </MarkerClusterGroup>
  )
}
