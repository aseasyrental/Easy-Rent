import './PropertyCard.css'
import useMyList from '../hooks/useMyList.js'

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
  const { toggle, has } = useMyList()
  const isSaved = has(property.id)

  const handleHeart = (e) => {
    e.stopPropagation()
    toggle(property.id)
  }

  return (
    <article className="property-card" onClick={() => onClick(property.id)}>
      <div className="property-card__image-wrap">
        {primaryImage ? (
          <img src={primaryImage.url} alt={property.title} className="property-card__image" />
        ) : (
          <div className="property-card__image-placeholder">No photo</div>
        )}
        <button
          className={`property-card__heart ${isSaved ? 'property-card__heart--active' : ''}`}
          onClick={handleHeart}
          aria-label={isSaved ? 'Remove from My List' : 'Add to My List'}
        >
          {isSaved ? '\u2665' : '\u2661'}
        </button>
      </div>

      <div className="property-card__body">
        <div className="property-card__price">
          {property.price != null ? `$${Number(property.price).toLocaleString()}/mo` : 'Rent TBD'}
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
