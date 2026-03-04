import { NavLink } from 'react-router-dom'
import './NavBar.css'

export default function NavBar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__brand">
        <img src="/logo-circle.png" alt="Easy Rental" className="navbar__logo" />
      </NavLink>
      <div className="navbar__links">
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `navbar__link ${isActive ? 'navbar__link--active' : ''}`
          }
        >
          Map
        </NavLink>
        <NavLink
          to="/listings"
          className={({ isActive }) =>
            `navbar__link ${isActive ? 'navbar__link--active' : ''}`
          }
        >
          Listings
        </NavLink>
      </div>
    </nav>
  )
}
