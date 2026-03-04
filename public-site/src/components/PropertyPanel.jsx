import { useState } from 'react'
import InquiryForm from './InquiryForm.jsx'
import './PropertyPanel.css'

const TYPE_LABELS = {
  apartment: 'Apartment',
  house: 'House',
  townhouse: 'Townhouse',
  condo: 'Condo',
  duplex: 'Duplex',
  basement_suite: 'Basement Suite',
  laneway_house: 'Laneway House',
}

export default function PropertyPanel({ property, onClose }) {
  const images = property.images || []
  const primaryImage = images.find(img => img.is_primary) || images[0]
  const [activeImage, setActiveImage] = useState(primaryImage?.url || null)

  return (
    <div className="property-panel">
      <button className="property-panel__close" onClick={onClose}>
        &times;
      </button>

      {activeImage ? (
        <img src={activeImage} alt={property.title} className="property-panel__hero" />
      ) : (
        <div className="property-panel__hero-placeholder">No photos yet</div>
      )}

      {images.length > 1 && (
        <div className="property-panel__gallery">
          {images.map(img => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className={`property-panel__thumb ${img.url === activeImage ? 'property-panel__thumb--active' : ''}`}
              onClick={() => setActiveImage(img.url)}
            />
          ))}
        </div>
      )}

      <div className="property-panel__body">
        <h2 className="property-panel__title">{property.title}</h2>
        <div className="property-panel__price">${Number(property.price).toLocaleString()}/mo</div>

        {property.property_type && (
          <span className="property-panel__badge">
            {TYPE_LABELS[property.property_type] || property.property_type}
          </span>
        )}

        <div className="property-panel__stats">
          {property.bedrooms != null && (
            <span className="property-panel__stat">{property.bedrooms} bed</span>
          )}
          {property.bathrooms != null && (
            <span className="property-panel__stat">{property.bathrooms} bath</span>
          )}
          {property.sqft != null && (
            <span className="property-panel__stat">{property.sqft} sqft</span>
          )}
        </div>

        {property.availability_date && (
          <div className="property-panel__section">
            <div className="property-panel__section-title">Available</div>
            <div>{new Date(property.availability_date).toLocaleDateString('en-CA')}</div>
          </div>
        )}

        {property.description && (
          <div className="property-panel__section">
            <div className="property-panel__section-title">About</div>
            <p className="property-panel__description">{property.description}</p>
          </div>
        )}

        {property.amenities?.length > 0 && (
          <div className="property-panel__section">
            <div className="property-panel__section-title">Amenities</div>
            <ul className="property-panel__amenities">
              {property.amenities.map((a, i) => (
                <li key={i} className="property-panel__amenity">{a}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="property-panel__divider" />

        <div className="property-panel__section">
          <div className="property-panel__section-title">Contact</div>
          <div className="property-panel__contact">
            <a href="tel:+16042139911">Call</a>
            <a href="mailto:aseasyrental@gmail.com">Email</a>
          </div>
        </div>

        <div className="property-panel__divider" />

        <InquiryForm propertyId={property.id} />
      </div>
    </div>
  )
}
