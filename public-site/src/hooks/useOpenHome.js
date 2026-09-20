import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Every home has its own address.
 *
 * Opening a home from a card pushes `/home/:id` so the address bar holds a link
 * anyone can copy, and the browser's Back button closes the panel. The page the
 * renter was already on keeps rendering underneath: we hand the current path
 * along as `backgroundLocation`, and App renders the page routes against that
 * while the panel route renders against the real URL.
 *
 * Opening a home while already on a home (shouldn't happen — the backdrop covers
 * the cards) carries no background, so closing falls back to Browse.
 */
export default function useOpenHome() {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback((id) => {
    const alreadyOnAHome = location.pathname.startsWith('/home/')
    navigate(`/home/${id}`, {
      state: alreadyOnAHome
        ? undefined
        : { backgroundLocation: `${location.pathname}${location.search}` },
    })
  }, [navigate, location.pathname, location.search])
}
