# Auto-Geocoding + My List Flicker Fix — Design

**Date:** 2026-03-04
**Status:** Approved

---

## Feature 1: Auto-Geocoding via BC Address Geocoder

### Problem
Properties don't show on the public map because latitude/longitude must be entered manually in the admin form. Bill shouldn't have to look up coordinates — the system should resolve them from the address automatically.

### Solution
Backend auto-geocodes on property create/update using the BC Address Geocoder (free, no API key, BC-specific government data).

### API
- **Endpoint:** `https://geocoder.api.gov.bc.ca/addresses.geojson`
- **Params:** `addressString` (combined address, city, province)
- **Response:** GeoJSON FeatureCollection with coordinates in `[lng, lat]` order
- **Rate limit:** 1,000 req/min (anonymous, no key)
- **Scope:** BC addresses only (perfect for Easy-Rent)

### Changes

**New file — `backend/src/services/geocoder.js`:**
- `geocodeAddress(address, city, province)` → `{ latitude, longitude }` or `null`
- Combines address fields into a single query string
- Calls BC Geocoder, extracts coordinates from first result
- Returns `null` on failure (network error, no results, non-BC address) — never throws

**Modified — `backend/src/controllers/PropertyController.js`:**
- `create()`: calls `geocodeAddress()` before `PropertyModel.create()`, merges lat/lng into data
- `update()`: calls `geocodeAddress()` if any address field (address, city, province, postal_code) is in the request body, merges lat/lng

**Modified — `admin-dashboard/src/components/PropertyForm.jsx`:**
- Remove latitude/longitude input fields from the form
- Remove lat/lng from initial form state and payload construction

**Modified — `backend/src/routes/propertyRoutes.js`:**
- Remove latitude/longitude validation rules (no longer user-provided)

### Failure behavior
If geocoding fails, property saves without coordinates. No error shown to Bill. Property just won't appear on the map until the address is corrected.

### Backfill
Existing properties without coordinates: add a one-time script or let Bill re-save them in the admin dashboard (triggering geocoding on update).

---

## Feature 2: Fix My List Flicker

### Problem
On the My List page, toggling a heart causes the entire grid to flash. The grid shows "Loading..." between every toggle because `fetchSaved` re-runs on every `ids` change.

### Root cause
`fetchSaved` depends on `[ids]` via `useCallback`. When ids change, `useEffect` fires, `setLoading(true)` wipes the grid, API returns, grid re-renders.

### Fix
- Track initial load vs re-fetch — only show "Loading..." on first load
- On toggle-off from My List page: optimistically remove the property from local `properties` state immediately, no re-fetch needed
- On navigation to My List with existing favorites: fetch without loading flash if data already exists

### Changes

**Modified — `public-site/src/pages/MyList.jsx`:**
- Add `initialLoadDone` ref to distinguish first load from subsequent changes
- Skip `setLoading(true)` after initial load completes
- When `ids` shrinks (item removed), filter local `properties` to match remaining ids instead of re-fetching
- When `ids` grows (shouldn't happen on this page, but safe): re-fetch silently in background
