# Landing Page Redesign — Design Doc

**Date:** 2026-03-03
**Goal:** Redesign the public site landing page to match the embossed linen/olive/gold aesthetic from the reference image, add a listings browse path alongside the existing map, and tie pages together with navigation.

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--linen` | `#c4b5a0` | Background base |
| `--olive` | `#7a8060` | Primary accent — buttons, active states |
| `--olive-light` | `#8f9572` | Hover states |
| `--gold` | `#b09a5e` | Logo highlights, border accents, horizontal rules |
| `--cream` | `#f0ebe3` | Card backgrounds, input fields |
| `--cream-glass` | `rgba(240, 235, 227, 0.85)` | Glass panels (replaces white-glass) |
| `--text-dark` | `#2c2418` | Primary text |
| `--text-mid` | `#5a4e3b` | Secondary text |

Background: CSS-only linen texture — subtle repeating noise over warm tan gradient. No image dependency.

## Pages

### Landing (`/`)

Top to bottom, single viewport, mobile-first:

1. **Nav bar** — slim, linen background, logo on left (links home), "Map" and "Listings" links on right. Olive text, gold underline on active. Shared across all pages.

2. **Hero** (~55vh) — linen textured background. Logo centered. Tagline: "Rental homes in the Lower Mainland — managed by Bill." Subtle gold horizontal rule below.

3. **Search strip** — single cream-glass panel, centered, max-width 800px. Three inline filters:
   - Property type dropdown (Any, House, Apartment, Condo, Townhouse, Duplex, Basement Suite, Laneway House)
   - Price range — min/max inputs
   - Bedrooms dropdown (Any, 1+, 2+, 3+, 4+)

   Two buttons below filters, equal weight:
   - **"Search Map"** — olive, solid fill → navigates to `/map?filters`
   - **"Browse Listings"** — olive, outlined → navigates to `/listings?filters`

   Mobile: filters stack vertically, buttons full-width stacked.

4. **Footer** — compact. Bill's phone, email, easy-rental.ca. Warm muted text.

### Listings (`/listings`) — NEW

- Shared nav bar at top
- Filter bar pinned below nav (reuses existing filter options, restyled to match new palette)
- Property card grid below:
  - Card: thumbnail image, price, beds/baths, property type, city
  - Cream-glass card backgrounds, olive accent on hover
  - Click card → PropertyPanel slides in (same component used on map)
- Pagination at bottom (backend already supports page/limit)
- "Switch to Map" button to jump to `/map` with current filters preserved

### Map (`/map`) — EXISTING, minor updates

- Shared nav bar added at top
- Filter bar restyled to match new palette
- "Switch to Listings" link in nav or filter area
- Map + PropertyPanel behavior unchanged

## Shared Components

- **NavBar** — new component, used on all three pages
- **FilterBar** — existing, restyled with new palette, extended to pass filters via URL query params
- **PropertyCard** — new component for the listings grid
- **PropertyPanel** — existing, reused as-is on both map and listings
- **InquiryForm** — existing, reused inside PropertyPanel

## Data Flow

Filters travel as URL query params between pages. Landing search strip builds params and navigates. Map and Listings pages read params on load, apply to API calls. Switching between map/listings preserves filters via query string.

## What Already Exists (no changes needed)

- Backend: `GET /api/properties` with filtering, sorting, pagination — fully built
- PropertyPanel component — slides in with full detail + inquiry form
- InquiryForm component — submits to `POST /api/inquiries`
- PropertyMarkers component — map pins with clustering
- All filter options (property types, bedrooms, price range)

## What's New

1. CSS variable overhaul — new palette in `index.css`
2. Linen texture background (CSS-only)
3. NavBar component
4. Landing page rewrite (hero + search strip + footer)
5. PropertyCard component
6. Listings page (grid + filters + pagination + panel)
7. FilterBar restyle
8. Query param sync between pages
9. Minor MapView updates (add nav, restyle filters)
