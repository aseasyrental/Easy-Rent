import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import PropertyPanel from '../components/PropertyPanel.jsx'
import apiClient from '../services/api.js'

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

/**
 * One home at its own address: /home/:id
 *
 * Renders the property panel over whatever page App decided sits behind it.
 * Closing goes back to that page (or Browse, for a link opened cold) with a
 * replace so the Back button never bounces between the panel and the page.
 */
export default function SingleHome() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [property, setProperty] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | missing | failed

  const backPath = typeof location.state?.backgroundLocation === 'string'
    ? location.state.backgroundLocation
    : '/listings'

  const load = useCallback(async () => {
    if (!/^\d+$/.test(id)) {
      setState('missing')
      return
    }
    setState('loading')
    try {
      const res = await apiClient.get(`/properties/${id}`)
      setProperty(res.data)
      setState('ready')
    } catch (err) {
      const code = err.response?.status
      // 404 = gone, 400 = the id isn't a real listing id. Both read the same to a renter.
      setState(code === 404 || code === 400 ? 'missing' : 'failed')
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // Printing a home should give one clean home, not the grid behind it.
  // The print rules in PropertyPanel.css key off this class.
  useEffect(() => {
    document.body.classList.add('home-open')
    return () => document.body.classList.remove('home-open')
  }, [])

  const handleClose = useCallback(() => {
    navigate(backPath, { replace: true })
  }, [navigate, backPath])

  if (state === 'ready' && property) {
    return <PropertyPanel key={property.id} property={property} onClose={handleClose} />
  }

  return (
    <>
      <div className="property-panel__backdrop" onClick={handleClose} />
      <div className="property-panel">
        <button className="property-panel__close" onClick={handleClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className="property-panel__body property-panel__notice">
          {state === 'loading' && (
            <>
              <div className="property-panel__notice-dots" aria-hidden="true">
                <span /><span /><span />
              </div>
              <p className="property-panel__notice-text">Opening this home…</p>
            </>
          )}

          {state === 'missing' && (
            <>
              <h2 className="property-panel__notice-title">This home is no longer listed</h2>
              <p className="property-panel__notice-text">
                It may have been rented, or the link may have a typo in it. Everything
                available right now is on the Browse page.
              </p>
              <Link to="/listings" className="property-panel__notice-link" replace>
                Browse all homes
              </Link>
            </>
          )}

          {state === 'failed' && (
            <>
              <h2 className="property-panel__notice-title">We couldn&rsquo;t load this home</h2>
              <p className="property-panel__notice-text">
                The connection dropped before the details arrived. Try again — or head to
                Browse and open it from there.
              </p>
              <button className="property-panel__notice-link" onClick={load}>
                Try again
              </button>
              <Link to="/listings" className="property-panel__notice-link" replace>
                Browse all homes
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
