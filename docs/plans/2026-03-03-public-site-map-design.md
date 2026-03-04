# Public Site — Map-Based Listings Design

**Date:** 2026-03-03
**Status:** Approved
**Context:** Bill needs a renter-facing site to show prospective tenants. This is the product — what renters see.

---

## Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Map provider | Leaflet + OpenStreetMap | Free, no API keys, sufficient for Bill's scale |
| Image storage | Supabase Storage | Already on Supabase, 1GB free, one ecosystem |
| Chat widget | None — phone/email + inquiry form | Current site has no chat service to reuse |
| Landing page style | Simple with "Browse Rentals" CTA | Idiot-proof, one click to map |
| Property detail view | Side panel over map | Map stays visible, fluid UX |
| Visual tone | Neighbor vibe — warm, approachable, local | Bill's brand, not corporate real estate |
| Logo | `Easy Rental joshes.png` in project root | Josh's design |

---

## Pages

### 1. Landing Page (`/`)

- Full-viewport warm background image
- Centered glass panel:
  - Easy Rental logo (`Easy Rental joshes.png`)
  - Friendly tagline ("Your next home in the Lower Mainland")
  - "Browse Rentals" button → `/map`
- Footer: Bill's phone, email, link to easy-rental.ca
- Spatial glassmorphism style (glass panel, blur, warm tones)
- Mobile-first, stacks naturally

### 2. Map View (`/map`)

**Layout (desktop):**
- Leaflet map fills full viewport
- Filter bar overlaid across top (glass panel)
- Property pins with lat/lng from DB

**Filter bar:**
- Price range (min/max inputs)
- Bedrooms (dropdown: Any, 1+, 2+, 3+, 4+)
- Property type (dropdown: Any + 7 types from DB enum)
- "Apply" button to re-fetch

**Map behavior:**
- Centers on Lower Mainland on load (~49.25, -123.1)
- Shows all `available` properties as pins
- MarkerCluster plugin for zoomed-out clustering
- Re-fetches properties in visible bounds as map moves/zooms

**Mobile:**
- Map fills screen
- Filter bar collapses to "Filters" button → dropdown/sheet
- Side panel becomes bottom sheet

### 3. Property Side Panel

**Trigger:** Click a map pin.
**Desktop:** Slides in from right. **Mobile:** Slides up from bottom.
Map stays visible.

**Content (top to bottom):**
1. Primary photo (large), thumbnail gallery if multiple images
2. Property title
3. Price ($/month)
4. Property type badge (e.g. "Apartment", "Townhouse")
5. Bedrooms / bathrooms / sqft
6. Availability date
7. Description
8. Amenities list
9. Contact section:
   - Bill's phone (clickable `tel:` link)
   - Bill's email (clickable `mailto:` link)
   - Inquiry form: name, email, message, "Send" button
10. Close button (X) to dismiss

---

## New Database Tables

### `property_images`

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| property_id | int FK → properties | ON DELETE CASCADE |
| image_url | text | Supabase Storage public URL |
| display_order | int | Controls gallery ordering |
| is_primary | boolean | Hero image for pins/panels |
| created_at | timestamp | Default NOW() |

### `inquiries`

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| property_id | int FK → properties | ON DELETE CASCADE |
| name | varchar(255) | Required |
| email | varchar(255) | Required, validated format |
| message | text | Required |
| created_at | timestamp | Default NOW() |

---

## New Backend Endpoints

### Property Images

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/properties/:id/images` | Admin | Upload image(s) to Supabase Storage, create DB record |
| DELETE | `/api/properties/:id/images/:imageId` | Admin | Remove image from storage + DB |
| GET | `/api/properties/:id/images` | Public | Returns ordered image list |

### Inquiries

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/inquiries` | None | Submit inquiry (name, email, message, property_id) |

**Supabase Storage:**
- Bucket: `property-images` (public read, authenticated write)
- File path: `{property_id}/{uuid}.{ext}`

---

## Visual Design

- Spatial glassmorphism from admin dashboard carries over
- Glass panels: `backdrop-filter: blur(20px)`, semi-transparent backgrounds
- Color palette: warm neutrals, gold accent (`#e8a87c`)
- Neighbor vibe: friendly copy, warm imagery, nothing sterile or corporate
- Custom CSS only — no Tailwind, no component libraries
- Mobile-first, desktop-ready

---

## Existing Backend (No Changes Needed)

- `GET /api/properties` — filtering, sorting, pagination all built (10 filters, 5 sort modes)
- `GET /api/properties/:id` — single property detail
- `optionalAuth` middleware — already supports public access
- Response format: `{ data: [...], pagination: { page, limit, total, total_pages } }`

---

## Out of Scope (Future)

- Renter accounts / login
- Application forms
- Messaging system
- Showing/scheduling
- AI auto-responder
- Admin dashboard wiring to images/inquiries
