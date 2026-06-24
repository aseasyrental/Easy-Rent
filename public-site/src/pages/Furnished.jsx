import { useState, useEffect, useCallback, useRef } from 'react'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyPanel from '../components/PropertyPanel.jsx'
import apiClient from '../services/api.js'
import './Furnished.css'

export default function Furnished() {
  const [properties, setProperties] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detailError, setDetailError] = useState(null)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyName, setNotifyName] = useState('')
  const [notifyStatus, setNotifyStatus] = useState('idle') // idle | submitting | success | error
  const [notifyMsg, setNotifyMsg] = useState('')
  const lastClickedId = useRef(null)

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { listing_type: 'short_term', limit: 12, sort: 'newest', page }
      const res = await apiClient.get('/properties', { params })
      setProperties(res.data?.data || [])
      setTotalPages(res.data?.pagination?.total_pages || 1)
      setTotalCount(res.data?.pagination?.total ?? (res.data?.data || []).length)
    } catch {
      setError('Unable to load furnished stays. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const handleCardClick = async (id) => {
    lastClickedId.current = id
    setDetailError(null)
    try {
      const res = await apiClient.get(`/properties/${id}`)
      if (lastClickedId.current !== id) return
      setSelectedProperty(res.data)
    } catch {
      if (lastClickedId.current !== id) return
      setDetailError('Unable to load property details. Please try again.')
    }
  }

  const handleClosePanel = () => {
    setSelectedProperty(null)
  }

  const handleNotifySubmit = async (e) => {
    e.preventDefault()
    const email = notifyEmail.trim()
    // Light client check — the backend is the authority. isEmail() rejects
    // 1-char TLDs, so don't over-validate here; just catch obvious misses.
    if (!email || !email.includes('@') || !email.includes('.')) {
      setNotifyStatus('error')
      setNotifyMsg('Please enter a valid email address.')
      return
    }
    setNotifyStatus('submitting')
    setNotifyMsg('')
    try {
      const payload = { type: 'furnished_interest', email }
      if (notifyName.trim()) payload.name = notifyName.trim()
      await apiClient.post('/inquiries', payload)
      setNotifyStatus('success')
    } catch (err) {
      setNotifyStatus('error')
      setNotifyMsg(err.response?.data?.message || 'Something went wrong. Please try again.')
    }
  }

  const countText = totalCount === 1
    ? '1 furnished stay'
    : `${totalCount} furnished stays`

  return (
    <div className="furnished with-grain">
      <div className="furnished__header">
        <h1 className="furnished__title">Furnished Stays</h1>
        <p className="furnished__subtitle">
          Move-in ready homes for short stays — daily, weekly, or monthly.
          Everything you need, nothing you don't.
        </p>
        {!loading && !error && totalCount > 0 && (
          <p className="furnished__count">{countText}</p>
        )}
      </div>

      <div className="furnished__content">
        {error ? (
          <div className="furnished__error">
            <p>{error}</p>
            <button className="furnished__retry-btn" onClick={fetchProperties}>Retry</button>
          </div>
        ) : loading ? (
          <div className="furnished__loading">
            <div className="furnished__loading-dots">
              <span /><span /><span />
            </div>
            <p>Finding furnished stays...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="furnished__empty">
            <div className="furnished__empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h2 className="furnished__empty-title">No furnished stays right now</h2>
            <p className="furnished__empty-desc">
              We're working on it — leave your email and we'll let you know the moment a
              furnished stay opens up.
            </p>
            {notifyStatus === 'success' ? (
              <p className="furnished__notify-success">
                You're on the list — we'll email you when a furnished stay opens up.
              </p>
            ) : (
              <form className="furnished__notify" onSubmit={handleNotifySubmit} noValidate>
                <input
                  className="furnished__notify-input"
                  type="email"
                  placeholder="Your email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  autoComplete="email"
                  disabled={notifyStatus === 'submitting'}
                  aria-label="Your email"
                />
                <input
                  className="furnished__notify-input"
                  type="text"
                  placeholder="Your name (optional)"
                  value={notifyName}
                  onChange={(e) => setNotifyName(e.target.value)}
                  autoComplete="name"
                  disabled={notifyStatus === 'submitting'}
                  aria-label="Your name (optional)"
                />
                {notifyStatus === 'error' && notifyMsg && (
                  <p className="furnished__notify-error" role="alert">{notifyMsg}</p>
                )}
                <button
                  className="furnished__notify-submit"
                  type="submit"
                  disabled={notifyStatus === 'submitting'}
                >
                  {notifyStatus === 'submitting' ? 'Sending…' : 'Notify me'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            <div className="furnished__grid">
              {properties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onClick={handleCardClick}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="furnished__pagination">
                <button
                  className="furnished__page-btn"
                  disabled={page <= 1}
                  onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  aria-label="Previous page"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="furnished__page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="furnished__page-btn"
                  disabled={page >= totalPages}
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  aria-label="Next page"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {detailError && (
        <div className="furnished__error furnished__error--toast">
          <p>{detailError}</p>
          <button className="furnished__retry-btn" onClick={() => setDetailError(null)}>Dismiss</button>
        </div>
      )}

      {selectedProperty && (
        <PropertyPanel
          key={selectedProperty.id}
          property={selectedProperty}
          onClose={handleClosePanel}
        />
      )}
    </div>
  )
}
