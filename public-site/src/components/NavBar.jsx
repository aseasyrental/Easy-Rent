import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import useMyList from '../hooks/useMyList.js'
import './NavBar.css'

const navRoutes = [
  { to: '/', label: 'Home' },
  { to: '/listings', label: 'Listings' },
  { to: '/map', label: 'Map' },
  { to: '/my-list', label: 'My List' },
]

export default function NavBar() {
  const { count } = useMyList()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <nav className="navbar">
        <div className="navbar__inner">
          <NavLink to="/" className="navbar__brand">
            <div className="navbar__logo-wrap">
              <img src="/logo-circle.png" alt="Easy Rental" className="navbar__logo" />
            </div>
            <span className="navbar__logo-text">Easy Rental</span>
          </NavLink>

          <div className="navbar__links">
            {navRoutes.map((route) => (
              <NavLink
                key={route.to}
                to={route.to}
                className={({ isActive }) =>
                  `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                }
                end={route.to === '/'}
              >
                {route.label}
                {route.to === '/my-list' && count > 0 && (
                  <span className="navbar__badge">{count}</span>
                )}
              </NavLink>
            ))}
          </div>

          <button
            className="navbar__mobile-btn"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      <div className={`navbar__overlay ${mobileOpen ? 'navbar__overlay--open' : ''}`}>
        {navRoutes.map((route) => (
          <NavLink
            key={route.to}
            to={route.to}
            className={({ isActive }) =>
              `navbar__overlay-link ${isActive ? 'navbar__overlay-link--active' : ''}`
            }
            onClick={closeMobile}
            end={route.to === '/'}
          >
            {route.label}
          </NavLink>
        ))}
      </div>
    </>
  )
}
