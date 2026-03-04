import './PropertyCard.css'

const TYPE_LABELS = {
  apartment: 'Apartment',
  house: 'House',
  townhouse: 'Townhouse',
  condo: 'Condo',
  duplex: 'Duplex',
  basement_suite: 'Basement Suite',
  laneway_house: 'Laneway House',
}

export default function PropertyCard({ property, onClick }) {
  const images = property.images || []
  const primaryImage = images.find(img => img.is_primary) || images[0]

  return (
    <article className="property-card" onClick={() => onClick(property.id)}>
      {primaryImage ? (
        <img
          src={primaryImage.url}
          alt={property.title}
          className="property-card__image"
        />
      ) : (
        <div className="property-card__image-placeholder">No photo</div>
      )}

      <div className="property-card__body">
        <div className="property-card__price">
          ${Number(property.price).toLocaleString()}/mo
        </div>
        <h3 className="property-card__title">{property.title}</h3>

        <div className="property-card__meta">
          {property.bedrooms != null && (
            <span>{property.bedrooms} bed</span>
          )}
          {property.bathrooms != null && (
            <span>{property.bathrooms} bath</span>
          )}
          {property.sqft != null && (
            <span>{property.sqft} sqft</span>
          )}
        </div>

        <div className="property-card__footer">
          {property.property_type && (
            <span className="property-card__badge">
              {TYPE_LABELS[property.property_type] || property.property_type}
            </span>
          )}
          {property.city && (
            <span className="property-card__city">{property.city}</span>
          )}
        </div>
      </div>
    </article>
  )
}
