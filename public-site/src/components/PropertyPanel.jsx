import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import InquiryForm from './InquiryForm.jsx'
import useMyList from '../hooks/useMyList.js'
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

function HeartIcon({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? '#6B7F5E' : 'none'}
      stroke={filled ? '#6B7F5E' : '#A89C90'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="property-panel__heart-icon"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="16"
      height="16"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function PropertyPanel({ property, onClose }) {
  const images = property.images || []
  const primaryImage = images.find(img => img.is_primary) || images[0]
  const [activeImage, setActiveImage] = useState(primaryImage?.url || null)
  const { toggle, has } = useMyList()
  const isSaved = has(property.id)
  const isLeased = property.status === 'occupied'
  const location = useLocation()
  const mountedPath = useRef(location.pathname)

  useEffect(() => {
    if (location.pathname !== mountedPath.current) {
      onClose()
    }
  }, [location.pathname, onClose])

  return (
    <>
    <div className="property-panel__backdrop" onClick={onClose} />
    <div className={`property-panel${isLeased ? ' property-panel--leased' : ''}`}>
      <button className="property-panel__close" onClick={onClose} aria-label="Close property details">
        <CloseIcon />
      </button>

      <div className="property-panel__hero-wrap">
        {activeImage ? (
          <img
            src={activeImage}
            alt={property.title}
            className="property-panel__hero"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }}
          />
        ) : null}
        <div className="property-panel__hero-placeholder" style={activeImage ? { display: 'none' } : {}}>No photos yet</div>
        {isLeased && (
          <span className="property-panel__leased-stamp" aria-label="This home has been leased">
            Leased
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="property-panel__gallery">
          {images.map(img => (
            <img
              key={img.id}
              src={img.url}
              alt={`${property.title} photo`}
              className={`property-panel__thumb ${img.url === activeImage ? 'property-panel__thumb--active' : ''}`}
              onClick={() => setActiveImage(img.url)}
            />
          ))}
        </div>
      )}

      <div className="property-panel__body">
        <div className="property-panel__title-row">
          <h2 className="property-panel__title">{property.title}</h2>
          <button
            className={`property-panel__heart ${isSaved ? 'property-panel__heart--active' : ''}`}
            onClick={() => toggle(property.id)}
            aria-label={isSaved ? 'Remove from My List' : 'Add to My List'}
          >
            <HeartIcon filled={isSaved} />
          </button>
        </div>
        <div className="property-panel__price">
          {property.listing_type === 'short_term' ? (
            <>
              {property.price_daily != null ? (
                <span>${Number(property.price_daily).toLocaleString()}<span className="property-panel__price-suffix">/night</span></span>
              ) : (
                'Rates TBD'
              )}
              {(property.price_weekly != null || property.price_monthly != null) && (
                <div className="property-panel__price-tiers">
                  {property.price_weekly != null && (
                    <span>${Number(property.price_weekly).toLocaleString()}/wk</span>
                  )}
                  {property.price_monthly != null && (
                    <span>${Number(property.price_monthly).toLocaleString()}/mo</span>
                  )}
                </div>
              )}
            </>
          ) : (
            property.price != null ? `$${Number(property.price).toLocaleString()}/mo` : 'Rent TBD'
          )}
        </div>

        <div className="property-panel__badge-row">
          {property.property_type && (
            <span className="property-panel__badge">
              {TYPE_LABELS[property.property_type] || property.property_type}
            </span>
          )}
          {property.listing_type === 'short_term' && (
            <span className="property-panel__badge property-panel__badge--furnished">
              Furnished
            </span>
          )}
        </div>

        {property.listing_type === 'short_term' && property.min_stay_nights != null && (
          <div className="property-panel__min-stay">
            Minimum stay: {property.min_stay_nights} {property.min_stay_nights === 1 ? 'night' : 'nights'}
          </div>
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

        {property.availability_date && !isLeased && (
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

        {isLeased ? (
          <div className="property-panel__leased-note">
            <p>
              This home is currently leased. If you're looking for something similar — same
              area, same kind of place — let me know what you have in mind and I'll reach out
              when a match comes up.
            </p>
          </div>
        ) : (
          <div className="property-panel__section">
            <div className="property-panel__section-title">Contact</div>
            <div className="property-panel__contact">
              <a href="mailto:aseasyrental@gmail.com">Email</a>
              <a href="tel:+16042139911">Call</a>
            </div>
          </div>
        )}

        <div className="property-panel__divider" />

        <InquiryForm propertyId={property.id} leased={isLeased} />
      </div>
    </div>
    </>
  )
}
