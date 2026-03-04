# My List / Easy-Rental Picks — Design

**Date:** 2026-03-04
**Status:** Approved

## Overview

Renters can heart properties from any view. Hearts persist in localStorage (no auth required). They can view their saved list at `/my-list` and share it via a URL (`/picks?ids=1,2,3`) that shows the same grid without remove buttons.

## Naming

- Feature name in UI: **"My List"**
- Shared link page title: **"Easy-Rental Picks"**
- localStorage key: `easyRentalMyList` (JSON array of property IDs)

## Components

### 1. Heart Button on PropertyCard

- Colored circle button overlaying the card image (top-right corner)
- Gold fill (`var(--gold)`) when hearted, translucent glass when not
- Click toggles the property ID in localStorage
- Appears on all PropertyCard instances (Listings grid, My List page, map — anywhere cards render)

### 2. Heart Button on PropertyPanel

- Same toggle behavior in the detail/side panel view
- Positioned near the title or top area
- Allows hearting from the detail view without going back to the grid

### 3. "My List" Nav Link

- Added to NavBar alongside Map and Listings links
- Shows a count badge with the number of saved items (e.g., "My List (3)")
- Badge hidden when count is 0

### 4. `/my-list` Page

- Reuses PropertyCard grid layout from Listings
- Fetches properties by saved IDs from the API
- Each card shows the heart button (filled) — clicking removes from list
- "Share" button copies `/picks?ids=1,2,3` URL to clipboard (toast confirmation)
- Empty state: "No properties saved yet" with link to browse listings
- No filters or pagination — just the saved properties

### 5. `/picks` Page

- Same PropertyCard grid as My List
- Fetches properties by IDs from URL query param
- No heart buttons, no remove buttons — read-only view
- Page title: "Easy-Rental Picks"
- If no valid IDs or all properties not found: "These listings are no longer available"

### 6. Storage

- `localStorage` key: `easyRentalMyList`
- Value: JSON array of integer property IDs, e.g., `[4, 7, 12]`
- No backend changes needed
- No database table, no auth requirement

## Data Flow

1. User clicks heart → toggle ID in localStorage → re-render heart state
2. My List page reads IDs from localStorage → `GET /api/properties?ids=4,7,12` (or individual fetches)
3. Share button reads IDs from localStorage → builds `/picks?ids=4,7,12` → copies to clipboard
4. Picks page reads IDs from URL → same fetch → renders grid

## API Consideration

The existing `GET /api/properties` endpoint with filtering may not support an `ids` param. Two options:

- **Option A:** Add `ids` query param to existing endpoint (preferred — one fetch)
- **Option B:** Fetch each property individually via `GET /api/properties/:id` (simpler but N requests)

Recommend Option A — add `ids` filter to PropertyModel.findFiltered().

## Files to Create

- `public-site/src/pages/MyList.jsx` + `MyList.css`
- `public-site/src/pages/Picks.jsx` (minimal — reuses MyList layout)
- `public-site/src/hooks/useMyList.js` (localStorage read/write/toggle hook)

## Files to Modify

- `public-site/src/components/PropertyCard.jsx` + `PropertyCard.css` — add heart circle button
- `public-site/src/components/PropertyPanel.jsx` + `PropertyPanel.css` — add heart toggle
- `public-site/src/components/NavBar.jsx` + `NavBar.css` — add My List link with count
- `public-site/src/App.jsx` — add `/my-list` and `/picks` routes
- `backend/src/models/PropertyModel.js` — add `ids` filter support
- `backend/src/routes/propertyRoutes.js` — allow `ids` query param
