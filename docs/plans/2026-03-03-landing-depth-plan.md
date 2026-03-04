# Landing Page Depth Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the flat landing page into a premium, tactile experience with custom controls, typography, depth effects, and entrance animations.

**Architecture:** CSS-only depth (inset/outward shadows, highlights) + one new React component (`CustomSelect`) replacing native `<select>`. Entrance animations via CSS `@keyframes` with staggered delays. Google Fonts loaded in HTML.

**Tech Stack:** React, CSS custom properties, Google Fonts (Playfair Display + DM Sans), no libraries.

**Design doc:** `docs/plans/2026-03-03-landing-depth-design.md`

---

### Task 1: Google Fonts + CSS Variables

**Files:**
- Modify: `public-site/index.html:3-11` (add font link in `<head>`)
- Modify: `public-site/src/index.css:9-29` (update `:root` variables)

**Step 1: Add Google Fonts link to index.html**

In `public-site/index.html`, add after line 5 (`<link rel="icon"...>`):

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
```

**Step 2: Update CSS variables in index.css**

In `public-site/src/index.css`, replace `--font-main` line (line 26) with:

```css
  --font-main: 'DM Sans', system-ui, -apple-system, sans-serif;
  --font-display: 'Playfair Display', Georgia, serif;
```

**Step 3: Verify dev server loads fonts**

Run: `cd public-site && npm run dev`
Open browser, inspect body — confirm `font-family` shows `DM Sans`. Confirm network tab loads both font families.

---

### Task 2: Keyframe Animations in index.css

**Files:**
- Modify: `public-site/src/index.css` (append keyframes at end)

**Step 1: Add keyframes to end of index.css**

Append after the `button` rule (after line 62):

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(var(--slide-distance, 16px));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes expandCenter {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

**Step 2: Verify no build errors**

Run: `cd public-site && npx vite build`
Expected: clean build, no errors.

---

### Task 3: CustomSelect Component

**Files:**
- Create: `public-site/src/components/CustomSelect.jsx`
- Create: `public-site/src/components/CustomSelect.css`

**Step 1: Create CustomSelect.jsx**

```jsx
import { useState, useRef, useEffect } from 'react'
import './CustomSelect.css'

export default function CustomSelect({ options, value, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find(o => o.value === value) || options[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleSelect = (opt) => {
    onChange(opt.value)
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(prev => !prev)
    }
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault()
      const idx = options.findIndex(o => o.value === value)
      if (idx < options.length - 1) onChange(options[idx + 1].value)
    }
    if (e.key === 'ArrowUp' && open) {
      e.preventDefault()
      const idx = options.findIndex(o => o.value === value)
      if (idx > 0) onChange(options[idx - 1].value)
    }
  }

  return (
    <div className={`cselect ${className}`} ref={ref}>
      <button
        type="button"
        className={`cselect__trigger ${open ? 'cselect__trigger--open' : ''}`}
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="cselect__value">{selected.label}</span>
        <span className={`cselect__chevron ${open ? 'cselect__chevron--open' : ''}`} />
      </button>
      {open && (
        <ul className="cselect__panel" role="listbox">
          {options.map(opt => (
            <li
              key={opt.value}
              className={`cselect__option ${opt.value === value ? 'cselect__option--selected' : ''}`}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => handleSelect(opt)}
            >
              <span>{opt.label}</span>
              {opt.value === value && <span className="cselect__check">&#10003;</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

**Step 2: Create CustomSelect.css**

```css
.cselect {
  position: relative;
}

.cselect__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.65rem;
  border: 1px solid rgba(90, 78, 59, 0.12);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  color: var(--text-dark);
  background: rgba(220, 213, 200, 0.5);
  box-shadow:
    inset 0 2px 4px rgba(44, 36, 24, 0.12),
    inset 0 -1px 0 rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.cselect__trigger:focus {
  outline: none;
  border-color: var(--olive);
  box-shadow:
    inset 0 2px 6px rgba(44, 36, 24, 0.18),
    inset 0 -1px 0 rgba(255, 255, 255, 0.5);
}

.cselect__trigger--open {
  border-color: var(--olive);
}

.cselect__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cselect__chevron {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--text-mid);
  transition: transform var(--transition);
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.cselect__chevron--open {
  transform: rotate(180deg);
}

.cselect__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--cream);
  border: 1px solid rgba(90, 78, 59, 0.12);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(44, 36, 24, 0.15);
  list-style: none;
  padding: 0.35rem 0;
  z-index: 100;
  transform-origin: top center;
  animation: dropdownOpen 0.2s ease forwards;
  overflow: hidden;
}

@keyframes dropdownOpen {
  from {
    opacity: 0;
    transform: scaleY(0.9) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scaleY(1) translateY(0);
  }
}

.cselect__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  color: var(--text-dark);
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}

.cselect__option:hover {
  background: var(--olive);
  color: var(--cream);
}

.cselect__option--selected {
  font-weight: 600;
}

.cselect__option--selected:hover .cselect__check {
  color: var(--cream);
}

.cselect__check {
  color: var(--olive);
  font-size: 0.85rem;
  margin-left: 0.5rem;
}
```

**Step 3: Verify build**

Run: `cd public-site && npx vite build`
Expected: clean build.

---

### Task 4: Landing.jsx — Custom Selects, Price Prefix, Hero Text, Footer Rewrite

**Files:**
- Modify: `public-site/src/pages/Landing.jsx` (full rewrite of JSX)

**Step 1: Rewrite Landing.jsx**

Replace entire contents of `public-site/src/pages/Landing.jsx` with:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomSelect from '../components/CustomSelect'
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
        <img src="/logo.png" alt="Easy Rental" className="landing__logo anim-fade" />
        <p className="landing__tagline anim-slide-up" style={{ '--slide-distance': '16px', animationDelay: '250ms' }}>
          Rental homes in the Lower Mainland
        </p>
        <div className="landing__rule anim-expand" style={{ animationDelay: '500ms' }} />
      </div>

      <div className="landing__search anim-slide-up" style={{ '--slide-distance': '20px', animationDelay: '700ms' }}>
        <div className="landing__search-row">
          <div className="landing__field">
            <label className="landing__label">Type</label>
            <CustomSelect
              options={PROPERTY_TYPES}
              value={filters.property_type}
              onChange={val => handleChange('property_type', val)}
            />
          </div>

          <div className="landing__field">
            <label className="landing__label">Min Price</label>
            <div className="landing__price-wrap">
              <span className="landing__price-prefix">$</span>
              <input
                className="landing__input landing__input--price"
                type="number"
                placeholder="0"
                value={filters.min_price}
                onChange={e => handleChange('min_price', e.target.value)}
              />
            </div>
          </div>

          <div className="landing__field">
            <label className="landing__label">Max Price</label>
            <div className="landing__price-wrap">
              <span className="landing__price-prefix">$</span>
              <input
                className="landing__input landing__input--price"
                type="number"
                placeholder="5000"
                value={filters.max_price}
                onChange={e => handleChange('max_price', e.target.value)}
              />
            </div>
          </div>

          <div className="landing__field">
            <label className="landing__label">Bedrooms</label>
            <CustomSelect
              options={BEDROOM_OPTIONS}
              value={filters.bedrooms}
              onChange={val => handleChange('bedrooms', val)}
            />
          </div>
        </div>

        <div className="landing__actions anim-fade" style={{ animationDelay: '950ms' }}>
          <button className="landing__btn landing__btn--primary" onClick={goMap}>
            Search Map
          </button>
          <button className="landing__btn landing__btn--outline" onClick={goListings}>
            Browse Listings
          </button>
        </div>
      </div>

      <footer className="landing__footer anim-slide-up" style={{ '--slide-distance': '12px', animationDelay: '1100ms' }}>
        <p className="landing__footer-heading">Get in touch</p>
        <div className="landing__footer-ctas">
          <a href="tel:+1XXXXXXXXXX" className="landing__footer-btn">Call Bill</a>
          <a href="mailto:bill@easy-rental.ca" className="landing__footer-btn">Email Bill</a>
        </div>
        <a className="landing__footer-link" href="https://easy-rental.ca" target="_blank" rel="noopener noreferrer">
          easy-rental.ca
        </a>
      </footer>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `cd public-site && npx vite build`
Expected: clean build.

---

### Task 5: Landing.css — Full Depth Restyle

**Files:**
- Modify: `public-site/src/pages/Landing.css` (full rewrite)

**Step 1: Replace entire Landing.css**

Replace all contents of `public-site/src/pages/Landing.css` with:

```css
/* ===== Layout ===== */

.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 2rem 0;
  gap: 2.5rem;
}

/* ===== Hero ===== */

.landing__hero {
  text-align: center;
  max-width: 560px;
}

.landing__logo {
  max-width: 280px;
  width: 100%;
  height: auto;
  margin-bottom: 1.25rem;
  filter: drop-shadow(0 4px 24px rgba(44, 36, 24, 0.18));
}

.landing__tagline {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.4rem;
  color: var(--text-mid);
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.landing__rule {
  width: 80px;
  height: 2px;
  background: var(--gold);
  margin: 0 auto;
  border-radius: 1px;
}

/* ===== Search Panel — floating glass slab ===== */

.landing__search {
  background: var(--cream-glass);
  backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--glass-radius);
  box-shadow:
    0 2px 8px rgba(44, 36, 24, 0.10),
    0 12px 48px rgba(44, 36, 24, 0.12);
  padding: 2rem 2.25rem;
  max-width: 800px;
  width: 100%;
}

.landing__search-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.landing__field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.landing__label {
  font-size: 0.7rem;
  color: var(--text-mid);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

/* ===== Carved-in inputs ===== */

.landing__input {
  padding: 0.55rem 0.65rem;
  border: 1px solid rgba(90, 78, 59, 0.12);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  color: var(--text-dark);
  background: rgba(220, 213, 200, 0.5);
  box-shadow:
    inset 0 2px 4px rgba(44, 36, 24, 0.12),
    inset 0 -1px 0 rgba(255, 255, 255, 0.5);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.landing__input:focus {
  outline: none;
  border-color: var(--olive);
  box-shadow:
    inset 0 2px 6px rgba(44, 36, 24, 0.18),
    inset 0 -1px 0 rgba(255, 255, 255, 0.5);
}

/* ===== Price input with $ prefix ===== */

.landing__price-wrap {
  position: relative;
}

.landing__price-prefix {
  position: absolute;
  left: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-mid);
  font-size: 0.9rem;
  pointer-events: none;
}

.landing__input--price {
  width: 100%;
  padding-left: 1.5rem;
}

/* Hide native number spinners */
.landing__input--price::-webkit-inner-spin-button,
.landing__input--price::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.landing__input--price {
  -moz-appearance: textfield;
}

/* ===== Buttons — raised + tactile ===== */

.landing__actions {
  display: flex;
  gap: 0.75rem;
}

.landing__btn {
  flex: 1;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  box-shadow:
    0 2px 6px rgba(44, 36, 24, 0.12),
    0 6px 20px rgba(44, 36, 24, 0.08);
  transition:
    background var(--transition),
    transform var(--transition),
    box-shadow var(--transition),
    border-color var(--transition);
}

.landing__btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(44, 36, 24, 0.15),
    0 10px 32px rgba(44, 36, 24, 0.10);
}

.landing__btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 3px rgba(44, 36, 24, 0.12);
}

.landing__btn--primary {
  background: var(--olive);
  color: var(--text-light);
  border: 2px solid var(--olive);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 2px 6px rgba(44, 36, 24, 0.12),
    0 6px 20px rgba(44, 36, 24, 0.08);
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

/* ===== Footer — recessed contact bar ===== */

.landing__footer {
  margin-top: auto;
  width: 100%;
  padding: 2rem 1.5rem 1.5rem;
  text-align: center;
  background: rgba(180, 168, 148, 0.4);
  box-shadow: inset 0 3px 8px rgba(44, 36, 24, 0.15);
}

.landing__footer-heading {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: var(--text-mid);
  margin-bottom: 1rem;
}

.landing__footer-ctas {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.landing__footer-btn {
  display: inline-block;
  padding: 0.7rem 2rem;
  background: var(--gold);
  color: var(--cream);
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 50px;
  box-shadow:
    0 2px 6px rgba(44, 36, 24, 0.12),
    0 6px 20px rgba(44, 36, 24, 0.08);
  transition:
    transform var(--transition),
    box-shadow var(--transition),
    background var(--transition);
}

.landing__footer-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(44, 36, 24, 0.15),
    0 10px 32px rgba(44, 36, 24, 0.10);
  background: var(--gold-light);
  color: var(--cream);
}

.landing__footer-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 3px rgba(44, 36, 24, 0.12);
}

.landing__footer-link {
  color: var(--olive-dark);
  font-size: 0.8rem;
  font-weight: 500;
}

.landing__footer-link:hover {
  color: var(--olive);
}

/* ===== Entrance animations ===== */

.anim-fade {
  opacity: 0;
  animation: fadeIn 600ms ease forwards;
}

.anim-slide-up {
  opacity: 0;
  animation: fadeSlideUp 600ms ease forwards;
}

.anim-expand {
  transform: scaleX(0);
  animation: expandCenter 500ms ease forwards;
}

/* ===== Responsive ===== */

@media (max-width: 640px) {
  .landing {
    padding: 1.5rem 1rem 0;
    gap: 2rem;
  }

  .landing__search {
    padding: 1.5rem 1.25rem;
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

  .landing__footer-ctas {
    flex-direction: column;
    align-items: center;
  }

  .landing__footer-btn {
    width: 100%;
    max-width: 260px;
    text-align: center;
  }
}
```

**Step 2: Verify build**

Run: `cd public-site && npx vite build`
Expected: clean build, no errors.

---

### Task 6: Visual Verification + Polish

**Step 1: Start dev server**

Run: `cd public-site && npm run dev`

**Step 2: Visual check in browser at http://localhost:5173**

Verify:
- Fonts: Playfair Display italic on tagline, DM Sans everywhere else
- Hero: logo has warm shadow, tagline italic serif, gold rule visible
- Entrance: staggered — logo → tagline → rule → search → buttons → footer
- Search panel: floating glass with layered shadow, bright bottom edge
- Dropdowns: custom styled, click opens panel, chevron rotates, check on selected, close on outside click
- Price inputs: `$` prefix inside field, no browser spinners
- All inputs/triggers: carved-in look (inset shadow, darker bg)
- Buttons: raised shadow, lift on hover, snap on press
- Footer: recessed strip, "Get in touch", two gold pill CTAs, link below
- Mobile (resize to narrow): stacked fields, stacked buttons, stacked footer CTAs

**Step 3: Fix any visual issues found**

Adjust spacing, shadow values, animation timing as needed.

---

### Task 7: Build Verification

**Step 1: Production build**

Run: `cd public-site && npx vite build`
Expected: clean build, no errors, no warnings.

**Step 2: Preview production build**

Run: `cd public-site && npx vite preview`
Verify landing page renders correctly in production mode.
