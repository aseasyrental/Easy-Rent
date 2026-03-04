# Landing Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the public site with a linen/olive/gold aesthetic, add a listings browse page, and tie all pages together with a shared nav bar.

**Architecture:** Pure CSS palette swap + 3 new components (NavBar, PropertyCard, Listings page). Landing page rewrite. Filters travel between pages via URL query params. All backend endpoints already exist — this is frontend only.

**Tech Stack:** React, React Router (already installed), CSS custom properties, axios (already installed)

---

### Task 1: Palette swap — update CSS variables

**Files:**
- Modify: `public-site/src/index.css`

**Step 1: Replace CSS variables and add linen texture**

Replace the entire `:root` block and body styles in `index.css` with the new palette. Add a CSS-only linen texture using a subtle SVG noise pattern as background.

```css
:root {
  /* New palette — linen/olive/gold */
  --olive: #7a8060;
  --olive-light: #8f9572;
  --olive-dark: #656b4e;
  --gold: #b09a5e;
  --gold-light: #c4ae72;
  --cream: #f0ebe3;
  --cream-glass: rgba(240, 235, 227, 0.88);
  --linen: #c4b5a0;
  --linen-light: #d4c8b6;
  --text-dark: #2c2418;
  --text-mid: #5a4e3b;
  --text-light: #f0ebe3;
  --glass-blur: 20px;
  --glass-radius: 16px;
  --glass-border: 1px solid rgba(255, 255, 255, 0.25);
  --glass-shadow: 0 8px 32px rgba(44, 36, 24, 0.15);
  --font-main: 'Segoe UI', system-ui, -apple-system, sans-serif;
  --transition: 0.3s ease;
  --nav-height: 56px;
}

body {
  font-family: var(--font-main);
  color: var(--text-dark);
  background: var(--linen);
  -webkit-font-smoothing: antialiased;
}

/* Linen texture overlay — CSS only */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23c4b5a0'/%3E%3Crect width='1' height='1' x='0' y='0' fill='%23bfb09a' fill-opacity='0.4'/%3E%3Crect width='1' height='1' x='2' y='2' fill='%23cabbaa' fill-opacity='0.3'/%3E%3C/svg%3E"),
    linear-gradient(165deg, #cfc0ab 0%, #c4b5a0 40%, #b8a892 100%);
  pointer-events: none;
}

a {
  color: var(--olive);
  text-decoration: none;
}

button {
  cursor: pointer;
  font-family: inherit;
}
```

Also remove the old `--accent`, `--accent-hover`, `--text-primary`, `--text-secondary`, `--bg-warm`, `--glass-bg`, `--glass-bg-solid` variables. They're replaced by the new tokens above.

**Step 2: Verify the app still loads**

Run: `cd public-site && npm run dev`
Open browser — colors will look broken on existing pages (expected, we're swapping the whole palette). Confirm no build errors.

---

### Task 2: NavBar component

**Files:**
- Create: `public-site/src/components/NavBar.jsx`
- Create: `public-site/src/components/NavBar.css`

**Step 1: Create NavBar.jsx**

```jsx
import { NavLink } from 'react-router-dom'
import './NavBar.css'

export default function NavBar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__brand">
        <img src="/logo.png" alt="Easy Rental" className="navbar__logo" />
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
```

**Step 2: Create NavBar.css**

```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--nav-height);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background: rgba(196, 181, 160, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(176, 154, 94, 0.25);
}

.navbar__brand {
  display: flex;
  align-items: center;
}

.navbar__logo {
  height: 36px;
  width: auto;
}

.navbar__links {
  display: flex;
  gap: 0.25rem;
}

.navbar__link {
  color: var(--text-dark);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  transition: background var(--transition), color var(--transition);
}

.navbar__link:hover {
  background: rgba(122, 128, 96, 0.12);
  color: var(--olive-dark);
}

.navbar__link--active {
  background: var(--olive);
  color: var(--text-light);
}

.navbar__link--active:hover {
  background: var(--olive-light);
  color: var(--text-light);
}
```

**Step 3: Wire NavBar into App.jsx**

Update `App.jsx` to include NavBar above Routes (but NOT on the landing page — landing has its own hero treatment). Use a layout wrapper:

```jsx
import { Routes, Route, useLocation } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Landing from './pages/Landing.jsx'
import MapView from './pages/MapView.jsx'
import Listings from './pages/Listings.jsx'

export default function App() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <>
      {!isLanding && <NavBar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/listings" element={<Listings />} />
      </Routes>
    </>
  )
}
```

Note: `Listings` import will break until Task 6. That's okay — we'll create a placeholder.

**Step 4: Create placeholder Listings page so the app compiles**

Create `public-site/src/pages/Listings.jsx` with a minimal placeholder:

```jsx
export default function Listings() {
  return <div style={{ paddingTop: 'var(--nav-height)' }}>Listings — coming soon</div>
}
```

**Step 5: Verify**

Run the dev server. Navigate between `/`, `/map`, `/listings`. Confirm:
- NavBar shows on `/map` and `/listings` but NOT on `/`
- Logo links home
- Active link is highlighted olive

---

### Task 3: Landing page rewrite

**Files:**
- Modify: `public-site/src/pages/Landing.jsx`
- Modify: `public-site/src/pages/Landing.css`

**Step 1: Rewrite Landing.jsx**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

const PROPERTY_TYPES = [
  { value: '', label: 'Any Type' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'basement_suite', label: 'Basement Suite' },
  { value: 'laneway_house', label: 'Laneway House' },
]

const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    property_type: '',
    min_price: '',
    max_price: '',
    bedrooms: '',
  })

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const buildQuery = () => {
    const params = new URLSearchParams()
    for (const [key, val] of Object.entries(filters)) {
      if (val) params.set(key, val)
    }
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  const goMap = () => navigate(`/map${buildQuery()}`)
  const goListings = () => navigate(`/listings${buildQuery()}`)

  return (
    <div className="landing">
      <div className="landing__hero">
        <img src="/logo.png" alt="Easy Rental" className="landing__logo" />
        <p className="landing__tagline">
          Rental homes in the Lower Mainland — managed by Bill
        </p>
        <div className="landing__rule" />
      </div>

      <div className="landing__search">
        <div className="landing__search-row">
          <div className="landing__field">
            <label className="landing__label">Type</label>
            <select
              className="landing__select"
              value={filters.property_type}
              onChange={e => handleChange('property_type', e.target.value)}
            >
              {PROPERTY_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="landing__field">
            <label className="landing__label">Min Price</label>
            <input
              className="landing__input"
              type="number"
              placeholder="$"
              value={filters.min_price}
              onChange={e => handleChange('min_price', e.target.value)}
            />
          </div>

          <div className="landing__field">
            <label className="landing__label">Max Price</label>
            <input
              className="landing__input"
              type="number"
              placeholder="$"
              value={filters.max_price}
              onChange={e => handleChange('max_price', e.target.value)}
            />
          </div>

          <div className="landing__field">
            <label className="landing__label">Bedrooms</label>
            <select
              className="landing__select"
              value={filters.bedrooms}
              onChange={e => handleChange('bedrooms', e.target.value)}
            >
              {BEDROOM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="landing__actions">
          <button className="landing__btn landing__btn--primary" onClick={goMap}>
            Search Map
          </button>
          <button className="landing__btn landing__btn--outline" onClick={goListings}>
            Browse Listings
          </button>
        </div>
      </div>

      <footer className="landing__footer">
        <a href="tel:+1XXXXXXXXXX">Phone</a>
        <span className="landing__footer-dot">&middot;</span>
        <a href="mailto:bill@easy-rental.ca">Email</a>
        <span className="landing__footer-dot">&middot;</span>
        <a href="https://easy-rental.ca" target="_blank" rel="noopener noreferrer">
          easy-rental.ca
        </a>
      </footer>
    </div>
  )
}
```

**Step 2: Rewrite Landing.css**

```css
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 2rem;
}

/* Hero */
.landing__hero {
  text-align: center;
  max-width: 560px;
}

.landing__logo {
  max-width: 280px;
  width: 100%;
  height: auto;
  margin-bottom: 1rem;
}

.landing__tagline {
  font-size: 1.2rem;
  color: var(--text-mid);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.landing__rule {
  width: 80px;
  height: 2px;
  background: var(--gold);
  margin: 0 auto;
  border-radius: 1px;
}

/* Search strip */
.landing__search {
  background: var(--cream-glass);
  backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  padding: 1.5rem 2rem;
  max-width: 800px;
  width: 100%;
}

.landing__search-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.landing__field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.landing__label {
  font-size: 0.7rem;
  color: var(--text-mid);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.landing__input,
.landing__select {
  padding: 0.55rem 0.65rem;
  border: 1px solid rgba(90, 78, 59, 0.15);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--cream);
  color: var(--text-dark);
  font-family: inherit;
  transition: border-color var(--transition);
}

.landing__input:focus,
.landing__select:focus {
  outline: none;
  border-color: var(--olive);
}

.landing__actions {
  display: flex;
  gap: 0.75rem;
}

.landing__btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  transition: background var(--transition), transform var(--transition),
    box-shadow var(--transition);
}

.landing__btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(44, 36, 24, 0.15);
}

.landing__btn--primary {
  background: var(--olive);
  color: var(--text-light);
  border: 2px solid var(--olive);
}

.landing__btn--primary:hover {
  background: var(--olive-light);
  border-color: var(--olive-light);
}

.landing__btn--outline {
  background: transparent;
  color: var(--olive);
  border: 2px solid var(--olive);
}

.landing__btn--outline:hover {
  background: rgba(122, 128, 96, 0.08);
}

/* Footer */
.landing__footer {
  margin-top: auto;
  padding: 1.5rem;
  text-align: center;
  color: var(--text-mid);
  font-size: 0.85rem;
}

.landing__footer a {
  color: var(--olive-dark);
  font-weight: 500;
  margin: 0 0.4rem;
}

.landing__footer a:hover {
  color: var(--olive);
}

.landing__footer-dot {
  color: var(--gold);
}

/* Mobile */
@media (max-width: 640px) {
  .landing {
    padding: 1.5rem 1rem;
  }

  .landing__search {
    padding: 1.25rem 1rem;
  }

  .landing__search-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .landing__actions {
    flex-direction: column;
  }

  .landing__btn {
    text-align: center;
  }
}
```

**Step 3: Verify**

Open `/` in browser. Confirm:
- Logo centered, tagline reads "managed by Bill", gold rule below
- Search strip with 4 filters and 2 buttons
- "Search Map" and "Browse Listings" navigate to `/map?...` and `/listings?...` with filter params
- Mobile: filters and buttons stack vertically
- No NavBar visible on landing page

---

### Task 4: FilterBar restyle + query param support

**Files:**
- Modify: `public-site/src/components/FilterBar.jsx`
- Modify: `public-site/src/components/FilterBar.css`

**Step 1: Update FilterBar.jsx to read initial filters from URL**

Add `useSearchParams` to read filters from URL on mount. This lets the landing page pass filters forward.

```jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import './FilterBar.css'

const PROPERTY_TYPES = [
  { value: '', label: 'Any Type' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'basement_suite', label: 'Basement Suite' },
  { value: 'laneway_house', label: 'Laneway House' },
]

const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
]

const FILTER_KEYS = ['min_price', 'max_price', 'bedrooms', 'property_type']

export default function FilterBar({ filters, onChange }) {
  const [searchParams] = useSearchParams()
  const [local, setLocal] = useState(() => {
    const initial = { min_price: '', max_price: '', bedrooms: '', property_type: '' }
    for (const key of FILTER_KEYS) {
      const val = searchParams.get(key)
      if (val) initial[key] = val
    }
    return { ...initial, ...filters }
  })
  const [open, setOpen] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // On first render, if URL had filters, fire onChange so parent fetches with them
  useEffect(() => {
    if (!initialized) {
      setInitialized(true)
      const urlFilters = {}
      for (const key of FILTER_KEYS) {
        const val = searchParams.get(key)
        if (val) urlFilters[key] = val
      }
      if (Object.keys(urlFilters).length > 0) {
        onChange(urlFilters)
      }
    }
  }, [initialized, searchParams, onChange])

  const handleChange = (field, value) => {
    setLocal(prev => ({ ...prev, [field]: value }))
  }

  const handleApply = () => {
    const cleaned = {}
    for (const [key, val] of Object.entries(local)) {
      if (val !== '' && val !== undefined) cleaned[key] = val
    }
    onChange(cleaned)
  }

  return (
    <>
      <button
        className="filter-bar__toggle"
        onClick={() => setOpen(prev => !prev)}
      >
        Filters
      </button>

      <div className={`filter-bar ${!open ? 'filter-bar--hidden' : ''}`}>
        <div className="filter-bar__field">
          <span className="filter-bar__label">Min Price</span>
          <input
            className="filter-bar__input"
            type="number"
            placeholder="$"
            value={local.min_price}
            onChange={e => handleChange('min_price', e.target.value)}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Max Price</span>
          <input
            className="filter-bar__input"
            type="number"
            placeholder="$"
            value={local.max_price}
            onChange={e => handleChange('max_price', e.target.value)}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Bedrooms</span>
          <select
            className="filter-bar__select"
            value={local.bedrooms}
            onChange={e => handleChange('bedrooms', e.target.value)}
          >
            {BEDROOM_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Type</span>
          <select
            className="filter-bar__select"
            value={local.property_type}
            onChange={e => handleChange('property_type', e.target.value)}
          >
            {PROPERTY_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button className="filter-bar__apply" onClick={handleApply}>
          Apply
        </button>
      </div>
    </>
  )
}
```

**Step 2: Update FilterBar.css for new palette**

Replace the entire file. Key changes: `--accent` → `--olive`, input backgrounds → `--cream`, glass bg → `--cream-glass`. Position adjustments to account for `--nav-height`:

```css
.filter-bar {
  position: absolute;
  top: calc(var(--nav-height) + 0.75rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background: var(--cream-glass);
  backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  padding: 0.75rem 1rem;
}

.filter-bar__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-bar__label {
  font-size: 0.7rem;
  color: var(--text-mid);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-bar__input,
.filter-bar__select {
  padding: 0.4rem 0.5rem;
  border: 1px solid rgba(90, 78, 59, 0.15);
  border-radius: 8px;
  font-size: 0.85rem;
  background: var(--cream);
  color: var(--text-dark);
  font-family: inherit;
  min-width: 80px;
  transition: border-color var(--transition);
}

.filter-bar__input:focus,
.filter-bar__select:focus {
  outline: none;
  border-color: var(--olive);
}

.filter-bar__apply {
  background: var(--olive);
  color: var(--text-light);
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background var(--transition);
  align-self: flex-end;
}

.filter-bar__apply:hover {
  background: var(--olive-light);
}

.filter-bar__toggle {
  display: none;
  background: var(--cream-glass);
  backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  color: var(--text-dark);
  position: absolute;
  top: calc(var(--nav-height) + 0.75rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    top: calc(var(--nav-height) + 3.5rem);
    width: calc(100% - 2rem);
    left: 1rem;
    transform: none;
  }

  .filter-bar--hidden {
    display: none;
  }

  .filter-bar__toggle {
    display: block;
  }
}
```

**Step 3: Verify**

Navigate from landing with filters → `/map?bedrooms=2&property_type=house`. Confirm FilterBar initializes with those values and auto-applies them.

---

### Task 5: PropertyPanel restyle

**Files:**
- Modify: `public-site/src/components/PropertyPanel.css`

**Step 1: Update colors in PropertyPanel.css**

Replace all old color references:
- `var(--accent)` → `var(--olive)` for price color
- `var(--accent-hover)` → `var(--olive-dark)` for badge
- `var(--glass-bg-solid)` → `var(--cream-glass)`
- `var(--text-secondary)` → `var(--text-mid)`
- `var(--text-primary)` → `var(--text-dark)`
- Badge background: `rgba(232, 168, 124, 0.15)` → `rgba(122, 128, 96, 0.12)`
- Hero placeholder gradient → `linear-gradient(135deg, #d4c8b6, #c4b5a0)`

These are targeted find-and-replace operations. Do NOT rewrite the whole file — just swap the color values.

**Step 2: Verify**

Click a property pin on the map. Panel slides in with olive/cream colors instead of coral.

---

### Task 6: PropertyCard component

**Files:**
- Create: `public-site/src/components/PropertyCard.jsx`
- Create: `public-site/src/components/PropertyCard.css`

**Step 1: Create PropertyCard.jsx**

```jsx
import './PropertyCard.css'

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

  return (
    <article className="property-card" onClick={() => onClick(property.id)}>
      {primaryImage ? (
        <img
          src={primaryImage.url}
          alt={property.title}
          className="property-card__image"
        />
      ) : (
        <div className="property-card__image-placeholder">No photo</div>
      )}

      <div className="property-card__body">
        <div className="property-card__price">
          ${Number(property.price).toLocaleString()}/mo
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
```

**Step 2: Create PropertyCard.css**

```css
.property-card {
  background: var(--cream-glass);
  backdrop-filter: blur(12px);
  border: var(--glass-border);
  border-radius: var(--glass-radius);
  box-shadow: 0 4px 16px rgba(44, 36, 24, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition);
}

.property-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(44, 36, 24, 0.18);
}

.property-card__image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.property-card__image-placeholder {
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, #d4c8b6, #c4b5a0);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-mid);
  font-size: 0.85rem;
}

.property-card__body {
  padding: 1rem;
}

.property-card__price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--olive-dark);
  margin-bottom: 0.2rem;
}

.property-card__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.property-card__meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-mid);
  margin-bottom: 0.6rem;
}

.property-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.property-card__badge {
  display: inline-block;
  background: rgba(122, 128, 96, 0.12);
  color: var(--olive-dark);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.property-card__city {
  font-size: 0.8rem;
  color: var(--text-mid);
}
```

---

### Task 7: Listings page

**Files:**
- Modify: `public-site/src/pages/Listings.jsx` (replace placeholder)
- Create: `public-site/src/pages/Listings.css`

**Step 1: Write Listings.jsx**

```jsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyPanel from '../components/PropertyPanel.jsx'
import FilterBar from '../components/FilterBar.jsx'
import apiClient from '../services/api.js'
import './Listings.css'

export default function Listings() {
  const [searchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const params = { ...filters, page, limit: 12, sort: 'newest' }
      const res = await apiClient.get('/properties', { params })
      setProperties(res.data.data)
      setTotalPages(res.data.pagination.total_pages)
    } catch (err) {
      console.error('Failed to fetch properties:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const handleCardClick = async (id) => {
    try {
      const res = await apiClient.get(`/properties/${id}`)
      setSelectedProperty(res.data)
    } catch (err) {
      console.error('Failed to fetch property:', err)
    }
  }

  const handleClosePanel = () => {
    setSelectedProperty(null)
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  return (
    <div className="listings">
      <FilterBar filters={filters} onChange={handleFiltersChange} />

      <div className="listings__content">
        {loading ? (
          <div className="listings__loading">Loading...</div>
        ) : properties.length === 0 ? (
          <div className="listings__empty">
            No properties match your filters. Try adjusting your search.
          </div>
        ) : (
          <>
            <div className="listings__grid">
              {properties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onClick={handleCardClick}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="listings__pagination">
                <button
                  className="listings__page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </button>
                <span className="listings__page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="listings__page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedProperty && (
        <PropertyPanel
          property={selectedProperty}
          onClose={handleClosePanel}
        />
      )}
    </div>
  )
}
```

**Step 2: Create Listings.css**

```css
.listings {
  min-height: 100vh;
  padding-top: calc(var(--nav-height) + 5rem);
  position: relative;
}

.listings__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem 3rem;
}

.listings__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.listings__loading,
.listings__empty {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-mid);
  font-size: 1rem;
}

.listings__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
  padding: 1rem;
}

.listings__page-btn {
  background: var(--olive);
  color: var(--text-light);
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background var(--transition);
}

.listings__page-btn:hover:not(:disabled) {
  background: var(--olive-light);
}

.listings__page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.listings__page-info {
  color: var(--text-mid);
  font-size: 0.9rem;
}

/* PropertyPanel overlay on listings */
.listings .property-panel {
  position: fixed;
}

@media (max-width: 768px) {
  .listings {
    padding-top: calc(var(--nav-height) + 4rem);
  }

  .listings__content {
    padding: 0.75rem 1rem 2rem;
  }

  .listings__grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
```

**Step 3: Verify**

Navigate to `/listings`. Confirm:
- Grid of property cards loads from API
- Clicking a card opens the PropertyPanel
- Pagination works (Previous/Next)
- Filters from landing page carry over via URL params
- Empty state shows when no results match

---

### Task 8: MapView adjustments

**Files:**
- Modify: `public-site/src/pages/MapView.css`

**Step 1: Add top padding for nav bar**

The map needs to start below the nav bar now. Update `MapView.css`:

```css
.map-view {
  height: 100vh;
  width: 100%;
  position: relative;
  padding-top: var(--nav-height);
}

.map-view__map {
  height: 100%;
  width: 100%;
}

.leaflet-container {
  z-index: 0;
}
```

**Step 2: Verify**

Navigate to `/map`. Map fills below the nav bar. Filter bar sits below nav. Property pins and panel still work.

---

### Task 9: InquiryForm restyle

**Files:**
- Modify: `public-site/src/components/InquiryForm.css`

**Step 1: Update color references**

Read the file and replace:
- Any `var(--accent)` → `var(--olive)`
- Any `var(--accent-hover)` → `var(--olive-light)`
- Any `var(--text-secondary)` → `var(--text-mid)`
- Input backgrounds → `var(--cream)`

These are targeted replacements, not a full rewrite.

**Step 2: Verify**

Open a property panel, scroll to inquiry form. Colors match the new palette.

---

### Task 10: Visual polish + final verify

**Files:** None new — review all pages

**Step 1: Full walkthrough**

1. Open `/` — landing page with hero, search strip, footer
2. Set filters (e.g., House, 2+ bed) → click "Search Map" → confirm `/map?property_type=house&bedrooms=2`, filters applied
3. Go back to `/` → same filters → click "Browse Listings" → confirm `/listings?property_type=house&bedrooms=2`, cards filtered
4. Click a card on listings → panel slides in with olive/cream styling
5. Submit an inquiry from the panel
6. Navigate between Map ↔ Listings via nav bar
7. Test mobile viewport (Chrome DevTools, 375px width):
   - Landing: filters stack, buttons stack
   - Map: filter toggle works, panel is bottom sheet
   - Listings: single column grid
   - Nav: still functional

**Step 2: Fix any visual issues found during walkthrough**

Address spacing, color inconsistencies, or responsive breakpoint issues.

**Step 3: Commit**

```bash
git add public-site/src/
git commit -m "feat: redesign public site — linen/olive palette, nav bar, listings page, filter-first landing"
```
