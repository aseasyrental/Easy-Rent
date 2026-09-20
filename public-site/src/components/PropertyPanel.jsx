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

// availability_date arrives as a UTC-midnight ISO string; format the date part as
// a local date so it doesn't render a day early in negative-offset zones (BC).
function formatLocalDate(value, locale = 'en-CA', opts) {
  if (!value) return ''
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  if (!y) return ''
  return new Date(y, m - 1, d).toLocaleDateString(locale, opts)
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

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A89C90"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="property-panel__share-icon"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6B7F5E"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="property-panel__share-icon"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// A phone gets the system share sheet (text, email, AirDrop, Print). Everything with a
// mouse gets the link on the clipboard instead — a desktop share dialog is a detour
// when all Bill wants is the link.
function prefersNativeShare() {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches
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
  const [copied, setCopied] = useState(false)
  const homeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/home/${property.id}`
    : `/home/${property.id}`

  // Tapping a nav link while this panel is open has to close it. Moving to this home's
  // own address is not that — it's the panel arriving, so let it through.
  useEffect(() => {
    if (location.pathname === mountedPath.current) return
    if (location.pathname === `/home/${property.id}`) {
      mountedPath.current = location.pathname
      return
    }
    onClose()
  }, [location.pathname, onClose, property.id])

  const handleShare = async () => {
    if (prefersNativeShare()) {
      try {
        await navigator.share({
          title: property.title,
          text: `${property.title} — Easy Rental`,
          url: homeUrl,
        })
        return
      } catch (err) {
        // The renter backed out of the share sheet — leave them be.
        if (err?.name === 'AbortError') return
        // Anything else (no handler, blocked) falls through to the clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(homeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', homeUrl)
    }
  }

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
          <div className="property-panel__actions">
            <button
              className={`property-panel__heart ${isSaved ? 'property-panel__heart--active' : ''}`}
              onClick={() => toggle(property.id)}
              aria-label={isSaved ? 'Remove from My List' : 'Add to My List'}
            >
              <HeartIcon filled={isSaved} />
            </button>
            <button
              className={`property-panel__share ${copied ? 'property-panel__share--copied' : ''}`}
              onClick={handleShare}
              aria-label="Share this home"
            >
              {copied ? <CheckIcon /> : <ShareIcon />}
            </button>
          </div>
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
            <div>{formatLocalDate(property.availability_date)}</div>
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

        {/* The form comes first: it's the route that reaches Bill's dashboard with the
            property attached. Email and Call stay below it as the alternatives. */}
        <InquiryForm propertyId={property.id} leased={isLeased} />

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

        {/* On paper, "Email" and "Call" are dead words. Printed sheets carry the
            details and the link back to this home. Hidden on screen. */}
        <div className="property-panel__print-footer" aria-hidden="true">
          <span>Easy Rental &middot; aseasyrental@gmail.com &middot; 604-213-9911</span>
          <span>{homeUrl}</span>
        </div>
      </div>
    </div>
    {copied && (
      <div className="property-panel__toast" role="status">Link copied</div>
    )}
    </>
  )
}
