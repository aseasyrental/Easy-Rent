# Public-Site Reskin Audit

**Branch:** `kimi/public-reskin`  
**Date:** 2026-04-23  
**Scope:** Every file under `public-site/src/`

---

## Legend

- **Reskin Safe** — Pure presentation (CSS files, style-only components). Restyle freely.
- **Touch Carefully** — Mixed presentation + logic. Note which lines are presentation vs data/routing.
- **Do Not Touch** — Routing, data layer, services, hooks.

---

## Do Not Touch

| File | Role | Why locked |
|------|------|------------|
| `main.jsx` | App bootstrap | Mounts React root, imports CSS order. Only safe change: adding a new CSS import above `./index.css`. |
| `App.jsx` | Router + ErrorBoundary | Defines `<Routes>` and route table (lines 49-61). The `ErrorBoundary` class has inline styles that can be restyled, but the routing block itself must not change. |
| `services/api.js` | Axios client | Base URL, timeout, headers. Zero presentation. |
| `hooks/useApi.js` | Data-fetching hook | `useState` + `useCallback` wrapper. Zero presentation. |
| `hooks/useMyList.js` | localStorage sync hook | `useSyncExternalStore` pattern, `STORAGE_KEY = 'easyRentalMyList'`. Zero presentation. |

---

## Reskin Safe

All CSS files are pure presentation. Restyle freely. Listed with notes on what they control.

| File | Controls |
|------|----------|
| `index.css` | Global reset, `:root` tokens (**old palette** — will be superseded by new tokens), `body` background, base link/button styles, keyframe animations (`fadeIn`, `fadeSlideUp`, `expandCenter`). |
| `pages/Landing.css` | Homepage layout: hero overlay, nav tiles, tagline panel, footer contact buttons, entrance animations, responsive. |
| `pages/Listings.css` | Listings page grid, pagination, loading/empty/error states, property-panel fixed positioning override. |
| `pages/MapView.css` | Map page full-height layout, Leaflet z-index fix, error toast. |
| `pages/MyList.css` | My List header, grid, empty state, share button, error toast styles. |
| `pages/Owners.css` | Owners page panels, service grid, CTA buttons, responsive. |
| `components/NavBar.css` | Fixed navbar, logo sizing, nav links, active state, badge. |
| `components/PropertyCard.css` | Card glass styling, image, heart button, price/title/meta/badge layout, responsive. |
| `components/PropertyPanel.css` | Side panel / mobile bottom sheet, image gallery, heart, contact buttons, divider, responsive. |
| `components/FilterBar.css` | Floating filter bar (fixed position), inputs, mobile toggle/collapse. |
| `components/CustomSelect.css` | Dropdown trigger, panel, option hover/selected states. |
| `components/InquiryForm.css` | Form inputs, textarea, submit button, success/error states. |
| `assets/react.svg` | Unused Vite boilerplate. Safe to delete later. |
| `assets/rental-overlay.png` | Landing page decorative overlay image. |

---

## Touch Carefully

| File | Presentation lines | Logic/data lines | Notes |
|------|-------------------|------------------|-------|
| `pages/Landing.jsx` | 18-61 (all JSX) | 15 (`useNavigate`), 26,30,34,43 (`navigate()` calls) | Pure landing page. Restyle freely; just keep the `onClick={() => navigate('/...')}` calls intact. |
| `pages/Listings.jsx` | 60-127 (JSX markup) | 9-17 (state), 19-32 (`fetchProperties`), 38-49 (`handleCardClick`), 55-58 (`handleFiltersChange`) | The JSX is a straightforward data-driven list. Keep the `onClick` handlers and `PropertyCard` / `PropertyPanel` / `FilterBar` component structure. |
| `pages/MapView.jsx` | 85-128 (JSX markup) | 9-12 (constants), 13-37 (`MapEvents` — Leaflet events), 40-48 (state), 50-60 (`fetchProperties`), 66-78 (`handlePinClick`) | Keep `MapContainer`, `TileLayer`, `MapEvents`, `PropertyMarkers`, `PropertyPanel` structure. Restyle the error-toast markup if needed. |
| `pages/MyList.jsx` | 78-128 (JSX markup) | 10-17 (state), 20-52 (`useEffect` fetch logic), 54-65 (`handleCardClick`), 67-76 (`handleShare`) | Reuses `MyList.css`. `Picks.jsx` also imports `MyList.css` — restyle once, affects both. |
| `pages/Picks.jsx` | 53-94 (JSX markup) | 8-11 (URL parsing), 13-18 (state), 20-34 (`fetchPicks`), 40-51 (`handleCardClick`) | **Imports `MyList.css`** (not its own CSS). Any change to `MyList.css` affects this page too. |
| `pages/Owners.jsx` | 23-56 (all JSX) | 21 (`useNavigate`), 26 (`navigate('/')`) | Simple static page. Keep navigation calls. |
| `components/NavBar.jsx` | 8-38 (all JSX) | 6 (`useMyList`), 10-12 (brand link), 14-37 (`NavLink` routes) | Keep `NavLink` `to` props and `useMyList` hook. Restyle classes freely. |
| `components/PropertyCard.jsx` | 25-71 (all JSX) | 15-18 (data prep), 17 (`useMyList`), 20-23 (`handleHeart`) | Keep `onClick(property.id)` and heart toggle logic. Restyle classes freely. |
| `components/PropertyPanel.jsx` | 23-127 (all JSX) | 16-22 (data prep, `useState`, `useMyList`), 27 (`onClose`), 36 (`onError`), 49 (`setActiveImage`), 60 (`toggle`) | **Note:** On `master` this does NOT include `BookingSheet` — that component lives on `kimi/viewing-booking` branch. When that branch merges, `PropertyPanel` will gain booking logic. Keep `InquiryForm` and all data-binding intact. |
| `components/FilterBar.jsx` | 65-137 (JSX markup) | 26-35 (state init from URL), 39-51 (`useEffect` URL sync), 53-63 (`handleChange`, `handleApply`) | Keep the filter field names (`location`, `min_price`, `max_price`, `bedrooms`, `property_type`) and the `onChange` callback contract. Restyle inputs/layout freely. |
| `components/CustomSelect.jsx` | 47-77 (JSX markup) | 4-9 (state, ref), 10-23 (click-outside/escape handlers), 25-44 (keyboard nav) | **Dead code** — not imported anywhere in the codebase. `FilterBar` uses native `<select>`. Safe to leave as-is or delete in cleanup. |
| `components/InquiryForm.jsx` | 32-79 (JSX markup) | 5-9 (state), 11-13 (`handleChange`), 15-30 (`handleSubmit` API call) | Keep the API endpoint (`/inquiries`) and form field names. Restyle form layout freely. |
| `components/PropertyMarkers.jsx` | 14-33 (JSX markup) | 1-11 (Leaflet icon fix), 13 (props), 16-18 (filter + map), 22-24 (`eventHandlers`) | Keep the marker event handler and popup content structure. The popup HTML can be restyled, but keep the data bindings. |

---

## Surprises & Flags

1. **Dead code: `CustomSelect`** — Built as a fully accessible custom dropdown, but `FilterBar` uses native `<select>` elements instead. Consider deleting or adopting it in Phase 3.

2. **Missing `BookingSheet`** — The `PropertyPanel` on `master` does not include the booking feature (`BookingSheet` component). That component exists only on `kimi/viewing-booking`. When that branch merges, `PropertyPanel` will need reskin attention for the booking button/sheet.

3. **Shared CSS: `Picks.jsx` → `MyList.css`** — `Picks.jsx` has no dedicated CSS file; it imports `MyList.css`. Any restyle of My List will automatically affect Picks (intentional, but worth noting).

4. **Duplicated animation keyframes** — `Owners.css` redefines `fadeIn`, `fadeSlideUp`, and `expandCenter` that already exist in `index.css`. Safe to dedupe in cleanup.

5. **Duplicated stale-request guard** — `Listings.jsx`, `MyList.jsx`, `Picks.jsx`, and `MapView.jsx` all implement the identical `lastClickedId.current` pattern to prevent race conditions on card clicks. Not a reskin blocker, but a candidate for a shared hook later.

6. **Inline styles in JSX** — Several components use inline `style` props for dynamic positioning or conditional display (e.g., `MyList.jsx` line 117, `PropertyPanel.jsx` line 39, `Picks.jsx` line 82). These will need to be converted to token-driven CSS classes in Phase 3 for a fully tokenized design system.

7. **Current tokens in `index.css` are the OLD palette** — The existing `:root` defines `--olive`, `--gold`, `--cream`, etc. The new tokens (sage, terracotta, amber, cream `#FBF7F1`) are defined in a separate `tokens.css` file for Phase 3 consumption. Both palettes can coexist during the transition.

---

## File Count Summary

- **Do Not Touch:** 5 files
- **Reskin Safe:** 14 files (12 CSS + 2 assets)
- **Touch Carefully:** 12 files

**Total audited:** 31 files
