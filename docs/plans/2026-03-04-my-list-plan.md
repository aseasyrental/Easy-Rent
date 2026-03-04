# My List / Easy-Rental Picks — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let renters heart properties, view them at `/my-list`, and share via `/picks?ids=...` URL.

**Architecture:** localStorage-only (no auth, no DB). A `useMyList` hook wraps localStorage read/write. Backend gets one small change: `ids` query param on `GET /properties`. Frontend gets heart buttons on PropertyCard + PropertyPanel, two new pages, and a nav link with count badge.

**Tech Stack:** React 18, React Router, Axios, localStorage, Express + pg-promise (backend)

---

### Task 1: Backend — Add `ids` filter to property list endpoint

**Files:**
- Modify: `backend/src/models/PropertyModel.js:44-105` (findFiltered)
- Modify: `backend/src/routes/propertyRoutes.js:63-87` (GET / validation)

**Step 1: Add `ids` filter to PropertyModel.findFiltered**

In `PropertyModel.js`, add this block after the `filters.available_by` condition (after line 92, before the bounds check):

```javascript
    if (filters.ids && filters.ids.length > 0) {
      conditions.push(`p.id = ANY($${idx++}::int[])`);
      values.push(filters.ids);
    }
```

Note: Use `p.id` (not just `id`) because the main query aliases properties as `p`.

**Step 2: Add `ids` query param validation to route**

In `propertyRoutes.js`, add this validator inside the GET `/` array (after the `limit` validator, before the closing `]`):

```javascript
    query('ids').optional().custom((value) => {
      const arr = value.split(',').map(Number);
      if (arr.some(isNaN) || arr.some(n => n < 1)) throw new Error('ids must be comma-separated positive integers');
      return true;
    }),
```

**Step 3: Parse `ids` in controller**

Check how PropertyController.list passes filters. The controller likely passes `req.query` through. If `ids` arrives as a string `"1,2,3"`, the model needs to split it. Add parsing at the top of `findFiltered`:

```javascript
    if (typeof filters.ids === 'string') {
      filters.ids = filters.ids.split(',').map(Number).filter(n => n > 0);
    }
```

Add this right after `const conditions = [];` on line 45.

**Step 4: Verify both builds still pass**

Run: `cd backend && npm test`
Expected: All 84+ tests pass

Run: `cd public-site && npm run build`
Expected: Build succeeds

---

### Task 2: Create `useMyList` hook

**Files:**
- Create: `public-site/src/hooks/useMyList.js`

**Step 1: Write the hook**

```javascript
import { useState, useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'easyRentalMyList'

function getSnapshot() {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw || '[]'
}

function subscribe(callback) {
  // Listen for changes from other tabs
  const handler = (e) => {
    if (e.key === STORAGE_KEY) callback()
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

// Module-level listeners for same-tab updates
let listeners = []
function emitChange() {
  for (const l of listeners) l()
}

function subscribeAll(callback) {
  listeners.push(callback)
  const unsub = subscribe(callback)
  return () => {
    listeners = listeners.filter(l => l !== callback)
    unsub()
  }
}

export default function useMyList() {
  const raw = useSyncExternalStore(subscribeAll, getSnapshot)
  const ids = JSON.parse(raw)

  const toggle = useCallback((id) => {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const next = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    emitChange()
  }, [])

  const has = useCallback((id) => ids.includes(id), [ids])

  const clear = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '[]')
    emitChange()
  }, [])

  const shareUrl = ids.length > 0
    ? `${window.location.origin}/picks?ids=${ids.join(',')}`
    : null

  return { ids, count: ids.length, toggle, has, clear, shareUrl }
}
```

**Step 2: Verify build**

Run: `cd public-site && npm run build`
Expected: Build succeeds

---

### Task 3: Add heart button to PropertyCard

**Files:**
- Modify: `public-site/src/components/PropertyCard.jsx`
- Modify: `public-site/src/components/PropertyCard.css`

**Step 1: Update PropertyCard.jsx**

Add import and hook at top of component:

```javascript
import useMyList from '../hooks/useMyList.js'
```

Inside the component function, before `return`:

```javascript
  const { toggle, has } = useMyList()
  const isSaved = has(property.id)

  const handleHeart = (e) => {
    e.stopPropagation()
    toggle(property.id)
  }
```

Add the heart button inside the `<article>`, right after the image/placeholder (before `<div className="property-card__body">`):

```jsx
      <button
        className={`property-card__heart ${isSaved ? 'property-card__heart--active' : ''}`}
        onClick={handleHeart}
        aria-label={isSaved ? 'Remove from My List' : 'Add to My List'}
      >
        {isSaved ? '\u2665' : '\u2661'}
      </button>
```

The image and heart need a wrapper for positioning. Wrap the image section (lines 19-27) in a `<div className="property-card__image-wrap">`:

```jsx
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
          {isSaved ? '\u2665' : '\u2661'}
        </button>
      </div>
```

**Step 2: Add heart CSS to PropertyCard.css**

Add before the `@media` query:

```css
.property-card__image-wrap {
  position: relative;
}

.property-card__heart {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(240, 235, 227, 0.75);
  backdrop-filter: blur(8px);
  color: var(--text-mid);
  box-shadow: 0 2px 8px rgba(44, 36, 24, 0.15);
  transition: background var(--transition), color var(--transition), transform var(--transition);
  z-index: 1;
}

.property-card__heart:hover {
  background: rgba(240, 235, 227, 0.95);
  transform: scale(1.1);
}

.property-card__heart--active {
  background: var(--gold);
  color: white;
}

.property-card__heart--active:hover {
  background: var(--gold-light);
  color: white;
}
```

**Step 3: Verify build**

Run: `cd public-site && npm run build`
Expected: Build succeeds

---

### Task 4: Add heart button to PropertyPanel

**Files:**
- Modify: `public-site/src/components/PropertyPanel.jsx`
- Modify: `public-site/src/components/PropertyPanel.css`

**Step 1: Update PropertyPanel.jsx**

Add import at top:

```javascript
import useMyList from '../hooks/useMyList.js'
```

Inside the component, after `const [activeImage, setActiveImage] = ...`:

```javascript
  const { toggle, has } = useMyList()
  const isSaved = has(property.id)
```

Add heart button right after the `<h2>` title tag (inside `.property-panel__body`, after the title):

```jsx
        <div className="property-panel__title-row">
          <h2 className="property-panel__title">{property.title}</h2>
          <button
            className={`property-panel__heart ${isSaved ? 'property-panel__heart--active' : ''}`}
            onClick={() => toggle(property.id)}
            aria-label={isSaved ? 'Remove from My List' : 'Add to My List'}
          >
            {isSaved ? '\u2665' : '\u2661'}
          </button>
        </div>
```

Remove the standalone `<h2>` that was there before — it's now inside the title-row wrapper.

**Step 2: Add CSS to PropertyPanel.css**

Add these rules:

```css
.property-panel__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.property-panel__heart {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1.3rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(240, 235, 227, 0.75);
  backdrop-filter: blur(8px);
  color: var(--text-mid);
  box-shadow: 0 2px 8px rgba(44, 36, 24, 0.15);
  transition: background var(--transition), color var(--transition), transform var(--transition);
}

.property-panel__heart:hover {
  background: rgba(240, 235, 227, 0.95);
  transform: scale(1.1);
}

.property-panel__heart--active {
  background: var(--gold);
  color: white;
}

.property-panel__heart--active:hover {
  background: var(--gold-light);
  color: white;
}
```

**Step 3: Verify build**

Run: `cd public-site && npm run build`
Expected: Build succeeds

---

### Task 5: Add "My List" link with count badge to NavBar

**Files:**
- Modify: `public-site/src/components/NavBar.jsx`
- Modify: `public-site/src/components/NavBar.css`

**Step 1: Update NavBar.jsx**

Add import:

```javascript
import useMyList from '../hooks/useMyList.js'
```

Inside the component function, before `return`:

```javascript
  const { count } = useMyList()
```

Add a new NavLink after the Listings link (inside `.navbar__links`):

```jsx
        <NavLink
          to="/my-list"
          className={({ isActive }) =>
            `navbar__link ${isActive ? 'navbar__link--active' : ''}`
          }
        >
          My List{count > 0 && <span className="navbar__badge">{count}</span>}
        </NavLink>
```

**Step 2: Add badge CSS to NavBar.css**

Add before the `@media` query:

```css
.navbar__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  border-radius: 9px;
  background: var(--gold);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
}
```

**Step 3: Verify build**

Run: `cd public-site && npm run build`
Expected: Build succeeds

---

### Task 6: Create My List page

**Files:**
- Create: `public-site/src/pages/MyList.jsx`
- Create: `public-site/src/pages/MyList.css`

**Step 1: Write MyList.jsx**

```jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyPanel from '../components/PropertyPanel.jsx'
import useMyList from '../hooks/useMyList.js'
import apiClient from '../services/api.js'
import './MyList.css'

export default function MyList() {
  const { ids, shareUrl } = useMyList()
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const lastClickedId = useRef(null)

  const fetchSaved = useCallback(async () => {
    if (ids.length === 0) {
      setProperties([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/properties', {
        params: { ids: ids.join(','), limit: 100 }
      })
      setProperties(res.data?.data || [])
    } catch {
      setError('Unable to load your saved properties.')
    } finally {
      setLoading(false)
    }
  }, [ids])

  useEffect(() => {
    fetchSaved()
  }, [fetchSaved])

  const handleCardClick = async (id) => {
    lastClickedId.current = id
    try {
      const res = await apiClient.get(`/properties/${id}`)
      if (lastClickedId.current !== id) return
      setSelectedProperty(res.data)
    } catch {
      // silently fail detail load
    }
  }

  const handleShare = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select a hidden input
    }
  }

  return (
    <div className="my-list">
      <div className="my-list__header">
        <h1 className="my-list__title">My List</h1>
        {ids.length > 0 && (
          <button className="my-list__share-btn" onClick={handleShare}>
            {copied ? 'Link Copied!' : 'Share List'}
          </button>
        )}
      </div>

      <div className="my-list__content">
        {error ? (
          <div className="my-list__error">
            <p>{error}</p>
            <button className="my-list__retry-btn" onClick={fetchSaved}>Retry</button>
          </div>
        ) : loading ? (
          <div className="my-list__loading">Loading...</div>
        ) : ids.length === 0 ? (
          <div className="my-list__empty">
            <p>No properties saved yet.</p>
            <Link to="/listings" className="my-list__browse-link">Browse Listings</Link>
          </div>
        ) : properties.length === 0 ? (
          <div className="my-list__empty">
            <p>Your saved properties are no longer available.</p>
            <Link to="/listings" className="my-list__browse-link">Browse Listings</Link>
          </div>
        ) : (
          <div className="my-list__grid">
            {properties.map(p => (
              <PropertyCard key={p.id} property={p} onClick={handleCardClick} />
            ))}
          </div>
        )}
      </div>

      {selectedProperty && (
        <PropertyPanel
          key={selectedProperty.id}
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  )
}
```

**Step 2: Write MyList.css**

```css
.my-list {
  padding-top: calc(var(--nav-height) + 1rem);
  min-height: 100vh;
}

.my-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem 1rem;
}

.my-list__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark);
}

.my-list__share-btn {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: var(--olive);
  color: var(--text-light);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition);
}

.my-list__share-btn:hover {
  background: var(--olive-light);
}

.my-list__content {
  padding: 0 1.5rem 2rem;
}

.my-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.my-list__empty {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-mid);
  font-size: 1rem;
}

.my-list__browse-link {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.6rem 1.5rem;
  background: var(--olive);
  color: var(--text-light);
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background var(--transition);
}

.my-list__browse-link:hover {
  background: var(--olive-light);
}

.my-list__loading {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-mid);
}

.my-list__error {
  text-align: center;
  padding: 2rem 1rem;
  color: #b44;
}

.my-list__retry-btn {
  margin-top: 0.5rem;
  padding: 0.4rem 1rem;
  border: 1px solid #b44;
  border-radius: 6px;
  background: transparent;
  color: #b44;
  cursor: pointer;
}

@media (max-width: 768px) {
  .my-list__header {
    padding: 0 1rem 0.75rem;
  }

  .my-list__content {
    padding: 0 1rem 2rem;
  }

  .my-list__title {
    font-size: 1.25rem;
  }
}
```

**Step 3: Verify build**

Run: `cd public-site && npm run build`
Expected: Build succeeds

---

### Task 7: Create Picks page (shared view)

**Files:**
- Create: `public-site/src/pages/Picks.jsx`

**Step 1: Write Picks.jsx**

```jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyPanel from '../components/PropertyPanel.jsx'
import apiClient from '../services/api.js'
import '../pages/MyList.css'

export default function Picks() {
  const [searchParams] = useSearchParams()
  const idsParam = searchParams.get('ids') || ''
  const ids = idsParam.split(',').map(Number).filter(n => n > 0)

  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const lastClickedId = useRef(null)

  const fetchPicks = useCallback(async () => {
    if (ids.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/properties', {
        params: { ids: idsParam, limit: 100 }
      })
      setProperties(res.data?.data || [])
    } catch {
      setError('Unable to load these listings.')
    } finally {
      setLoading(false)
    }
  }, [idsParam])

  useEffect(() => {
    fetchPicks()
  }, [fetchPicks])

  const handleCardClick = async (id) => {
    lastClickedId.current = id
    try {
      const res = await apiClient.get(`/properties/${id}`)
      if (lastClickedId.current !== id) return
      setSelectedProperty(res.data)
    } catch {
      // silently fail
    }
  }

  return (
    <div className="my-list">
      <div className="my-list__header">
        <h1 className="my-list__title">Easy-Rental Picks</h1>
      </div>

      <div className="my-list__content">
        {error ? (
          <div className="my-list__error">
            <p>{error}</p>
            <button className="my-list__retry-btn" onClick={fetchPicks}>Retry</button>
          </div>
        ) : loading ? (
          <div className="my-list__loading">Loading...</div>
        ) : ids.length === 0 || properties.length === 0 ? (
          <div className="my-list__empty">
            <p>These listings are no longer available.</p>
            <Link to="/listings" className="my-list__browse-link">Browse Listings</Link>
          </div>
        ) : (
          <div className="my-list__grid">
            {properties.map(p => (
              <PropertyCard key={p.id} property={p} onClick={handleCardClick} />
            ))}
          </div>
        )}
      </div>

      {selectedProperty && (
        <PropertyPanel
          key={selectedProperty.id}
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  )
}
```

Note: Picks reuses `MyList.css` for consistent styling. Heart buttons still appear on cards (via useMyList inside PropertyCard) — the recipient can save picks to their own list. This is a feature, not a bug.

**Step 2: Verify build**

Run: `cd public-site && npm run build`
Expected: Build succeeds

---

### Task 8: Wire routes in App.jsx

**Files:**
- Modify: `public-site/src/App.jsx`

**Step 1: Add imports and routes**

Add imports at top:

```javascript
import MyList from './pages/MyList.jsx'
import Picks from './pages/Picks.jsx'
```

Add routes inside `<Routes>` (after the `/listings` route):

```jsx
        <Route path="/my-list" element={<MyList />} />
        <Route path="/picks" element={<Picks />} />
```

**Step 2: Verify build and test locally**

Run: `cd public-site && npm run build`
Expected: Build succeeds

---

### Task 9: Final verification and deploy

**Step 1: Run backend tests**

Run: `cd backend && npm test`
Expected: All tests pass

**Step 2: Build both frontends**

Run: `cd public-site && npm run build`
Expected: Build succeeds

**Step 3: Deploy public site**

Run from project root: `vercel --prod --yes`
Expected: Deploys to easy-rental.ca

**Step 4: Smoke test in browser**

Verify:
- Heart button appears on PropertyCard (Listings page)
- Clicking heart toggles gold fill
- Heart appears in PropertyPanel detail view
- "My List" shows in nav with count badge
- `/my-list` page shows saved properties
- "Share List" button copies URL
- `/picks?ids=X,Y` loads shared properties
- Hearts persist across page refresh (localStorage)
