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

function HeartIcon({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? '#6B7F5E' : 'none'}
      stroke={filled ? '#6B7F5E' : '#A89C90'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="property-card__heart-icon"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20" />
      <path d="M5 20v-8h3v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2h3v8" />
    </svg>
  )
}

function BathIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M19 21h-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  )
}

function SqftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
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
          <HeartIcon filled={isSaved} />
        </button>
      </div>

      <div className="property-card__body">
        <div className="property-card__price">
          {property.price != null ? (
            <>
              ${Number(property.price).toLocaleString()}
              <span className="property-card__price-suffix">/mo</span>
            </>
          ) : (
            'Rent TBD'
          )}
        </div>
        <h3 className="property-card__title">{property.title}</h3>

        <div className="property-card__specs">
          {property.bedrooms != null && (
            <span className="property-card__spec">
              <BedIcon />
              {property.bedrooms} bed
            </span>
          )}
          {property.bathrooms != null && (
            <span className="property-card__spec">
              <BathIcon />
              {property.bathrooms} bath
            </span>
          )}
          {property.sqft != null && (
            <span className="property-card__spec">
              <SqftIcon />
              {property.sqft} sqft
            </span>
          )}
        </div>

        <div className="property-card__footer">
          {property.property_type && (
            <span className="property-card__badge">
              {TYPE_LABELS[property.property_type] || property.property_type}
            </span>
          )}
          {property.city && (
            <span className="property-card__city">
              <PinIcon />
              {property.city}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
