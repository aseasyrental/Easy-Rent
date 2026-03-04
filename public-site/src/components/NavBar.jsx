import { NavLink } from 'react-router-dom'
import useMyList from '../hooks/useMyList.js'
import './NavBar.css'

export default function NavBar() {
  const { count } = useMyList()

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
        <NavLink
          to="/my-list"
          className={({ isActive }) =>
            `navbar__link ${isActive ? 'navbar__link--active' : ''}`
          }
        >
          My List{count > 0 && <span className="navbar__badge">{count}</span>}
        </NavLink>
      </div>
    </nav>
  )
}
