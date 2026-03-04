# Auto-Geocoding + My List Flicker Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-geocode property addresses via BC Address Geocoder on save, and fix the My List page flicker caused by full re-fetches on every heart toggle.

**Architecture:** Backend geocoder service calls `geocoder.api.gov.bc.ca` when properties are created/updated with address fields. Controller merges coordinates before model save. Frontend My List page switches from re-fetch to optimistic local state updates.

**Tech Stack:** Node.js (ESM), Express, Jest + supertest, React (Vite), BC Address Geocoder REST API (free, no key)

---

### Task 1: Create geocoder service

**Files:**
- Create: `backend/src/services/geocoder.js`

**Step 1: Create the geocoder service**

```javascript
const BC_GEOCODER_URL = 'https://geocoder.api.gov.bc.ca/addresses.geojson'

export async function geocodeAddress(address, city, province) {
  if (!address) return null

  const parts = [address, city, province].filter(Boolean)
  const addressString = parts.join(', ')

  try {
    const url = new URL(BC_GEOCODER_URL)
    url.searchParams.set('addressString', addressString)
    url.searchParams.set('maxResults', '1')
    url.searchParams.set('outputSRS', '4326')

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return null

    const data = await res.json()
    const feature = data?.features?.[0]
    if (!feature?.geometry?.coordinates) return null

    const [longitude, latitude] = feature.geometry.coordinates
    return { latitude, longitude }
  } catch {
    return null
  }
}
```

**Step 2: Verify file was created**

Run: `node -e "import('./backend/src/services/geocoder.js').then(m => console.log(typeof m.geocodeAddress))"`
Expected: `function`

---

### Task 2: Wire geocoding into PropertyController

**Files:**
- Modify: `backend/src/controllers/PropertyController.js`

**Step 1: Update the create method**

At top of file, add import:
```javascript
import { geocodeAddress } from '../services/geocoder.js';
```

In `create()` method, after destructuring `req.body` (line 12) and before `PropertyModel.create()` (line 14), add geocoding:

```javascript
      const coords = await geocodeAddress(address, city, province);
```

Then in the `PropertyModel.create()` call, replace `latitude, longitude,` with:
```javascript
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
```

**Step 2: Update the update method**

In `update()` method, after destructuring `req.body` (line 85) and before `PropertyModel.update()` (line 87), add geocoding when address fields are present:

```javascript
      let coords = null;
      if (address || city || province || postal_code) {
        const addrForGeocode = address || property.address;
        const cityForGeocode = city || property.city;
        const provForGeocode = province || property.province;
        coords = await geocodeAddress(addrForGeocode, cityForGeocode, provForGeocode);
      }
```

Then in the `PropertyModel.update()` call, replace `latitude, longitude,` with:
```javascript
        latitude: coords?.latitude ?? undefined,
        longitude: coords?.longitude ?? undefined,
```

Note: `undefined` means the update model won't overwrite existing coordinates if geocoding failed or no address fields changed (since the update method skips `undefined` values).

**Step 3: Verify syntax**

Run: `node -e "import('./backend/src/controllers/PropertyController.js').then(() => console.log('OK'))"`
Expected: `OK`

---

### Task 3: Remove lat/lng from validation and admin form

**Files:**
- Modify: `backend/src/routes/propertyRoutes.js:22-23,48-49`
- Modify: `admin-dashboard/src/components/PropertyForm.jsx:36-37,73-74,132-133,424-456`

**Step 1: Remove lat/lng validation from routes**

In `propertyRoutes.js`, remove these lines from `propertyFieldRules`:
- Line 22-23: `const latitudeRule = body('latitude');` and `const longitudeRule = body('longitude');`
- Line 48-49: The latitude and longitude validation rules in `rules.push()`

**Step 2: Remove lat/lng from admin form**

In `PropertyForm.jsx`:
- Remove from `INITIAL_STATE` (lines 36-37): `latitude: '',` and `longitude: '',`
- Remove from `buildInitialState` (lines 73-74): `latitude: property.latitude ?? '',` and `longitude: property.longitude ?? '',`
- Remove from payload in `handleSubmit` (lines 132-133): `latitude: form.latitude !== '' ? Number(form.latitude) : null,` and `longitude: form.longitude !== '' ? Number(form.longitude) : null,`
- Remove the entire Latitude and Longitude field JSX (lines 424-456)

**Step 3: Verify admin dashboard builds**

Run: `cd admin-dashboard && npm run build`
Expected: Build succeeds with no errors

---

### Task 4: Fix My List flicker

**Files:**
- Modify: `public-site/src/pages/MyList.jsx`

**Step 1: Fix the flicker**

Replace the current fetch logic (lines 13-39) with optimistic updates:

```javascript
  const [loading, setLoading] = useState(true)  // true only for initial load
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const lastClickedId = useRef(null)
  const prevIdsRef = useRef(null)

  useEffect(() => {
    if (ids.length === 0) {
      setProperties([])
      setLoading(false)
      return
    }

    const prevIds = prevIdsRef.current
    prevIdsRef.current = ids

    // Item removed — optimistically filter local state, no re-fetch
    if (prevIds && ids.length < prevIds.length) {
      setProperties(prev => prev.filter(p => ids.includes(p.id)))
      return
    }

    // Initial load or item added — fetch from API
    const fetchSaved = async () => {
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
    }
    fetchSaved()
  }, [ids])
```

Also remove the `useCallback` import if `fetchSaved` was the only usage — check first. The `fetchSaved` function is now inside the useEffect, and the retry button needs updating.

Update the retry button (line 78) to reload the page or trigger a re-fetch:
```javascript
<button className="my-list__retry-btn" onClick={() => window.location.reload()}>Retry</button>
```

**Step 2: Verify public site builds**

Run: `cd public-site && npm run build`
Expected: Build succeeds with no errors

---

### Task 5: Verify both builds clean

**Step 1: Build backend check**

Run: `cd backend && node -e "import('./src/app.js').then(() => console.log('OK'))"`
Expected: `OK`

**Step 2: Build public site**

Run: `cd public-site && npm run build`
Expected: Clean build, no warnings about unused imports

**Step 3: Build admin dashboard**

Run: `cd admin-dashboard && npm run build`
Expected: Clean build, no warnings about unused imports

---

### Task 6: Deploy and verify

**Step 1: Deploy public site + API**

Run: `cd C:/Users/mrjos/Projects/Easy-Rent && vercel --prod`

**Step 2: Deploy admin dashboard**

Run: `cd C:/Users/mrjos/Projects/Easy-Rent/admin-dashboard && vercel --prod`

**Step 3: Tell Josh to test**

Verification checklist for Josh:
- Admin: Create or edit a property with an address → save → check that map shows the pin
- Public: Go to `/map` → properties with addresses should appear as pins
- Public: Go to `/my-list` → toggle hearts → grid should NOT flash/flicker
