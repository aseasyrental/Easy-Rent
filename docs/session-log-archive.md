# Easy Rental — Session Log Archive

Archived sessions from EASY-RENTAL-MAP.md. Most recent sessions remain in the map.

---

### 2026-02-28 (Session 1) — CC — Brainstorming and project mapping

**What happened:**
- Explored full codebase — confirmed skeleton/boilerplate state, no features implemented
- Defined mission statement: "Clarity at a glance. Simplicity in every step."
- Established design principles (clarity, zero sludge, clean/open, glitch-free)
- Scoped public site features: browse, inquire, apply, messaging, forms access
- Scoped admin dashboard: property management, leads pipeline, active tenant roster, AI assistant, flexible views
- Defined all property listing fields
- Analyzed ShowMojo as competitive reference — identified what to build vs. skip vs. defer
- Bill's profile: moderate technical comfort, long-term residential, needs organization + automation

**Git:** No commits yet for this session. Project has initial scaffold only.

**Open threads:**
- Design not yet finalized — need to propose 2-3 approaches and get approval
- Design doc not yet written
- Implementation plan not yet created

**Next:**
- Propose 2-3 architectural approaches with trade-offs
- Present design section by section for approval
- Write design doc to docs/plans/
- Transition to implementation planning via writing-plans skill

### 2026-03-01 (Session 2) — CC — Design finalized, implementation plan written

**What happened:**
- Proposed 3 architectural approaches: (A) two separate apps, (B) single app role-based, (C) single app migrate later
- Josh approved Approach A — two separate React frontends (`public-site/`, `admin-dashboard/`) sharing one Express backend
- Presented and approved project structure (new directory layout)
- Presented and approved full database schema (10 tables: users, properties, property_media, inquiries, applications, threads, messages, tenants, documents, ai_responses)
- Wrote design doc: `docs/plans/2026-03-01-easy-rental-design.md`
- Wrote implementation plan: `docs/plans/2026-03-01-easy-rental-implementation.md` (29 tasks across 6 phases, Phase 1 fully detailed with TDD)
- Renamed project map from `THE-MAP.md` to `EASY-RENTAL-MAP.md`
- Updated passoff skill to be project-aware (Glob for `*-MAP.md` instead of hardcoded path)
- Created `docs/plans/` directory

**Git:** No branch | No commits this session | Uncommitted: EASY-RENTAL-MAP.md, docs/plans/

**Open threads:**
- RESOLVED: Design not yet finalized → Design doc approved and written
- RESOLVED: Implementation plan not yet created → Full plan written
- NEW: Execution approach not yet chosen — subagent-driven vs. parallel session
- Prior open questions unchanged (AI provider, email service, file storage, showing scheduler UX, mobile strategy)

**Next:**
- Choose execution approach (subagent-driven vs. parallel session)

> **NOTE:** Sessions 3-7 missing from this map. They were in an untracked master copy that was overwritten during worktree merge in session 8. Session 5-7 content is preserved in conversation context and MEMORY.md. Key events: Session 3-4 (Phase 1 execution — restructure, DB migrations, Supabase setup), Session 5 (rename to Easy Rental, Canadian locale, lat/lng), Session 6 (auth system, code review, Phase 1 complete, spatial UI design pivot), Session 7 (nav fine-tuning, panel system, gold glow glassmorphism).

### 2026-03-01 (Session 8) — CC — Worktree merged, Properties CRUD built

**What happened:**
- **Committed + merged worktree** (4 sessions of uncommitted work, organized into 3 logical commits):
  - `823dfd0` rename Easy Rent → Easy Rental + Canadian locale (province, postal_code, lat/lng)
  - `34f79ad` auth system (registration, login, JWT middleware, admin seed, 8 tests, app.js split)
  - `862d7af` admin dashboard spatial UI (glassmorphism shell, SidePanel, ContentPanel, gold glow, useImagePosition hook)
- Worktree `phase1-foundation` removed, branch deleted. All work on master now.
- **Properties CRUD (Task 6) built via subagent-driven development** (TDD, spec + code quality reviews per task):
  - `0e4aad3` POST /api/properties — admin create (4 tests)
  - `b85aa2f` GET /api/properties + GET /:id — public reads (5 tests, 1 status filter skipped until PUT existed)
  - `51e5590` PUT + DELETE /api/properties/:id — admin mutations (6 tests, status filter un-skipped)
  - `9713b74` fix: empty-body update returns 400 (code review catch)
- **Implementation plan written:** `docs/plans/2026-03-01-properties-crud.md`
- **Total:** 23 tests passing (8 auth + 15 properties), 5 property endpoints working
- **Files created:** `PropertyModel.js`, `PropertyController.js`, `propertyRoutes.js`, `properties.test.js`
- **Files modified:** `app.js` (wired property routes)

**Git:** Branch `master` | Last commit `9713b74` (fix: return 400 for update with no valid fields) | Uncommitted: EASY-RENTAL-MAP.md, .claude/, Easy-rental.png, easy-rental logo.png

**Open threads:**
- NEW: Sessions 3-7 missing from map — need to restore or accept gap
- RESOLVED: Worktree merge pending (from Session 4) — merged and cleaned up
- RESOLVED: Task 6 Properties CRUD — complete with 15 tests
- RESOLVED: Panel system placeholder only — backend CRUD now ready to wire
- Prior open questions unchanged (map provider, geocoding, AI provider, email service, mobile strategy)

**Next:**
- Task 7: Property filtering + pagination (query params, page/limit)
- Wire Properties panel in admin dashboard to real CRUD data
- Design detail views for each section's ContentPanel
- Add exit animations for panels (slide out)

### 2026-03-01 (Session 9) — CC — Security audit and hardening

**What happened:**
- **Full code review** of entire backend (auth + properties CRUD + admin UI + migrations)
- Found 2 critical, 10 important, 10 minor issues — fixed all criticals + importants in one pass
- **Security fixes:**
  - JWT_SECRET production startup guard in `index.js`
  - Pinned `role: 'tenant'` in registration (prevents privilege escalation)
  - Explicit field whitelist in PropertyController create + update (prevents mass assignment)
  - Seed script requires `ADMIN_SEED_PASSWORD` env var (no more hardcoded password)
- **Test infrastructure:**
  - Production guard (`guardAgainstProduction()`) in both test files
  - Shared `cleanAllTables()` in `tests/helpers.js` (10 tables, FK-safe order)
  - `--runInBand --forceExit` added to test scripts
- **Input validation:**
  - Wired `express-validator` on all auth routes (email format, password min 6, name required)
  - Wired on all property routes (price positive, bedrooms/bathrooms/sqft int, postal_code Canadian, status enum, lat/lng range)
  - `param('id').isInt({ min: 1 })` on all `:id` routes (returns 400, not 500)
  - Created `middleware/validate.js` reusable error handler
  - Removed duplicate manual validation from controllers
- **CORS fix:** Supports comma-separated origins, defaults to both dev ports (5173, 5174)
- **Cleanup:** Deleted stale `models/index.js` scaffold, removed orphaned `frontend/` directory
- C1 (.env in git history) was a false alarm — `.env` was never committed

**Git:** Branch `master` | Last commit `5d8eec6` (fix: security hardening, input validation, test isolation, dead code cleanup) | Uncommitted: EASY-RENTAL-MAP.md, .claude/, logo images, docs/plans/2026-03-01-properties-crud.md

**Open threads:**
- Sessions 3-7 still missing from map (unchanged from Session 8)
- Prior open questions unchanged (map provider, geocoding, AI provider, email service, mobile strategy)

**Next:**
- Task 7: Property filtering + pagination (query params, page/limit)
- Wire Properties panel in admin dashboard to real CRUD data
- Design detail views for each section's ContentPanel
- Add exit animations for panels (slide out)
- Consider adding validation-specific tests (negative price, invalid postal code, non-integer ID)
- Consider adding `helmet` for HTTP security headers and rate limiting on auth endpoints
- Execute Phase 1: project restructure, database migrations, auth system, admin seeding

### 2026-03-02 (Session 10) — CC — Property filtering, sorting, pagination

**What happened:**
- **Brainstormed + designed** filtering feature with Josh — identified 10 filters, 5 sort modes, pagination, and missing `property_type` column
- **Design doc:** `docs/plans/2026-03-02-property-filtering-design.md`
- **Implementation plan:** `docs/plans/2026-03-02-property-filtering-plan.md` (10 tasks, TDD, subagent-driven)
- **Migration `012_add_property_type.sql`:** Added `property_type` VARCHAR(50) column with CHECK constraint (apartment, house, townhouse, condo, duplex, basement_suite, laneway_house), index, fixed status CHECK from 'pending' to 'maintenance'
- **`optionalAuth` middleware:** Silently attaches user info if valid JWT present, no error if missing/invalid — enables admin override on public endpoints
- **`PropertyModel.findFiltered()`:** Dynamic query builder with parameterized queries, 10 filters (price range, bedrooms, bathrooms, sqft range, city case-insensitive, property_type, available_by, status), 5 sort modes, pagination with COUNT query
- **Response format changed:** `GET /api/properties` now returns `{ data: [...], pagination: { page, limit, total, total_pages } }` instead of bare array
- **`property_type` wired** into create, update, and validation (model + controller + routes)
- **28 new tests** (10 filter, 4 sort, 6 pagination, 3 admin status, 5 validation) — total 51 passing
- **Dead code cleanup:** Removed unused `findAll()` method and ghost `pet_policy` field from controller
- **Subagent-driven development** with spec compliance + code quality reviews per task

**Git:** Branch `master` | Last commit `2e3c6b2` (chore: remove dead findAll + pet_policy) | Uncommitted: EASY-RENTAL-MAP.md, .claude/, logo images, docs/plans/

**Open threads:**
- Sessions 3-7 still missing from map (unchanged)
- Prior open questions unchanged (map provider, geocoding, AI provider, email service, mobile strategy)

**Next:**
- Wire Properties panel in admin dashboard to real CRUD data
- Design detail views for each section's ContentPanel
- Add exit animations for panels (slide out)
- Consider `helmet` for HTTP security headers and rate limiting on auth endpoints

### 2026-03-03 (Session 11) — CC — Public site with Leaflet map

**What happened:**
- **Brainstormed + designed** public site with Josh — Leaflet/OSM map, landing page → map view, side panel, inquiry form, Supabase Storage for images
- **Design doc:** `docs/plans/2026-03-03-public-site-map-design.md`
- **Implementation plan:** `docs/plans/2026-03-03-public-site-map-plan.md` (13 tasks, subagent-driven)
- **Migration `013_add_is_primary_to_property_media.sql`:** Added `is_primary` boolean + partial index
- **Backend new endpoints:**
  - `GET/POST/DELETE /api/properties/:id/images` — image CRUD with Supabase Storage upload, multer for multipart
  - `POST /api/inquiries` — public inquiry submission (name, email, message, property_id), no auth required
  - Bounding box filter (`min_lat/max_lat/min_lng/max_lng`) on GET /api/properties for map viewport queries
  - GET /api/properties/:id now includes `images` array in response
- **New backend files:** `PropertyMediaModel.js`, `PropertyMediaController.js`, `propertyMediaRoutes.js`, `InquiryModel.js`, `InquiryController.js`, `inquiryRoutes.js`, `config/supabase.js`, `seed-demo-properties.js`
- **New deps:** `@supabase/supabase-js`, `multer`
- **Public site built from scratch:**
  - Landing page: logo, tagline ("Your next home in the Lower Mainland"), "Browse Rentals" CTA, footer with contact links
  - Map view: full-viewport Leaflet map centered on Lower Mainland, property pins with MarkerCluster, bounding-box fetch on pan/zoom
  - Filter bar: price range, bedrooms (1+/2+/3+/4+), property type dropdown, Apply button, mobile collapse toggle
  - Property side panel: slides in from right (desktop) / bottom sheet (mobile), hero image + gallery, title/price/type/stats/description/amenities, contact links (phone/email), inquiry form
  - Inquiry form: name, email, message → POST /api/inquiries, success/error states
  - Glassmorphism design: warm glass panels, gold accent (#e8a87c), neighbor vibe
- **New frontend deps:** `leaflet`, `react-leaflet`, `react-leaflet-cluster`
- **6 demo properties seeded:** Kitsilano, Burnaby, New West, Surrey, Vancouver DT, Port Moody — all with lat/lng
- **Admin user seeded:** `bill@easyrental.ca` (for API auth, no login UI yet)
- **14 new tests** (6 image, 6 inquiry, 2 bounding box) — total **65 passing**

**Git:** Branch `master` | Last commit `23fd358` (feat: add Supabase Storage config and PropertyMediaModel) | Uncommitted: all frontend code, backend controllers/models/routes/tests for images + inquiries, seed script, design + plan docs

**Open threads:**
- NEW: Uncommitted work — large batch of frontend + backend changes needs commit
- NEW: Supabase Storage bucket `property-images` not yet created in dashboard — needed before image upload works
- NEW: Bill's phone number placeholder (`+1XXXXXXXXXX`) in Landing.jsx and PropertyPanel.jsx — needs real number
- RESOLVED: Map provider decision — chose Leaflet + OpenStreetMap (free, no API keys)
- Sessions 3-7 still missing from map (unchanged)
- Prior open questions partially resolved: map provider done. Remaining: geocoding approach, AI provider, email service, mobile strategy

**Next:**
- Commit all uncommitted work
- Create `property-images` bucket in Supabase Storage dashboard
- Replace phone/email placeholders with Bill's real contact info
- Wire admin dashboard to image upload + property management
- Add property photos via admin dashboard or API
- Consider `helmet` for HTTP security headers and rate limiting

### 2026-03-03 (Session 12) — CC — Public site redesign — linen/olive palette, listings page, nav bar

**What happened:**
- **Brainstormed + designed** landing page redesign with Josh — reference image: embossed linen/olive/gold property sign aesthetic
- **Design doc:** `docs/plans/2026-03-03-landing-redesign-design.md`
- **Implementation plan:** `docs/plans/2026-03-03-landing-redesign-plan.md` (10 tasks, subagent-driven)
- **Palette swap:** Replaced coral/peach (`#e8a87c`) with linen/olive/gold/cream palette across all CSS. New variables: `--olive`, `--gold`, `--cream`, `--linen`, `--cream-glass`, `--text-dark`, `--text-mid`. CSS-only linen texture via SVG noise pattern on `body::before`.
- **New NavBar component:** Fixed top bar with logo (links home) + Map/Listings links. Shows on `/map` and `/listings`, hidden on landing. Active state highlighted olive.
- **Landing page rewrite:** Hero (logo + "managed by Bill" tagline + gold rule) → search strip (type, price range, bedrooms) → two CTAs ("Search Map" / "Browse Listings"). Filters pass as URL query params.
- **New Listings page (`/listings`):** Card grid (auto-fill, 280px min), pagination (Previous/Next), FilterBar at top. Click card → PropertyPanel slides in. Reads URL filter params from landing.
- **New PropertyCard component:** Thumbnail, price, title, bed/bath/sqft, type badge, city. Cream-glass with hover lift.
- **FilterBar updated:** Now reads URL query params on mount (filters carry from landing → map/listings). Restyled olive/cream.
- **All existing components restyled:** PropertyPanel, InquiryForm, FilterBar, MapView — swapped all old color variables to new palette.
- **New route:** `/listings` added to App.jsx
- **Build verified:** `vite build` passes clean, 160 modules, no errors
- **Files created:** `NavBar.jsx`, `NavBar.css`, `PropertyCard.jsx`, `PropertyCard.css`, `Listings.css`
- **Files modified:** `index.css`, `App.jsx`, `Landing.jsx`, `Landing.css`, `Listings.jsx`, `FilterBar.jsx`, `FilterBar.css`, `PropertyPanel.css`, `InquiryForm.css`, `MapView.css`

**Git:** Branch `master` | Last commit `23fd358` (feat: add Supabase Storage config and PropertyMediaModel) | Uncommitted: all session 11 + 12 frontend changes, backend from session 11, design/plan docs

**Open threads:**
- UNCHANGED: Uncommitted work — now even larger (session 11 backend + session 12 frontend redesign)
- UNCHANGED: Supabase Storage bucket `property-images` not yet created
- UNCHANGED: Bill's phone placeholder (`+1XXXXXXXXXX`) in Landing.jsx and PropertyPanel.jsx
- Sessions 3-7 still missing from map

**Next:**
- Commit all uncommitted work (large batch — session 11 backend + session 12 frontend)
- Visual review in browser — verify landing, map, listings all look right with new palette
- Create `property-images` bucket in Supabase Storage dashboard
- Replace phone/email placeholders with Bill's real contact info
- Wire admin dashboard to image upload + property management
- Consider `helmet` for HTTP security headers and rate limiting

### 2026-03-03 (Session 13) — CC — Landing page depth redesign + icons

**What happened:**
- **Brainstormed + designed** depth overhaul with Josh — mixed model: inputs carved in, panels/buttons float above
- **Design doc:** `docs/plans/2026-03-03-landing-depth-design.md`
- **Implementation plan:** `docs/plans/2026-03-03-landing-depth-plan.md` (7 tasks, subagent-driven)
- **Google Fonts:** Added DM Sans (body) + Playfair Display (tagline) via `<link>` in `index.html`. New CSS vars `--font-main`, `--font-display`.
- **Keyframe animations:** `fadeIn`, `fadeSlideUp` (uses `--slide-distance` custom property), `expandCenter` — all in `index.css`
- **New `CustomSelect` component:** Replaces native `<select>` for Type and Bedrooms. Click-to-open styled dropdown panel, olive hover, check marks, chevron rotation, keyboard nav (arrows/enter/escape), ARIA (`combobox`/`listbox`/`option`), close on outside click.
- **Landing.jsx rewrite:** CustomSelect for dropdowns, `$` prefix in price inputs (hidden native spinners), tagline simplified ("Rental homes in the Lower Mainland" — removed "managed by Bill"), footer rewritten with "Get in touch" heading + gold pill CTAs ("Call Bill" / "Email Bill")
- **Landing.css full depth restyle:** Carved-in inputs (inset shadows, darker bg, bottom highlight), floating search panel (multi-layer shadow, bottom edge highlight), tactile buttons (raised shadow, hover lift -2px, active press +1px, primary inner highlight), recessed footer (inset shadow, darker bg), staggered entrance animations (logo 0ms → tagline 250ms → rule 500ms → search 700ms → buttons 950ms → footer 1100ms)
- **Inline SVG icons:** Mono olive outline icons on all labels (building, price tag, bed), buttons (map pin, grid), footer CTAs (phone, envelope). `currentColor` stroke, no dependencies.
- **Logo swapped** twice during session (new images from Josh)
- **Build verified:** `vite build` clean, 162 modules, no errors
- **Files created:** `CustomSelect.jsx`, `CustomSelect.css`
- **Files modified:** `index.html`, `index.css`, `Landing.jsx`, `Landing.css`

**Git:** Branch `master` | Last commit `23fd358` (unchanged from session 11) | Uncommitted: all session 11 + 12 + 13 changes

**Open threads:**
- UNCHANGED: Uncommitted work — now spans sessions 11-13 (backend + two frontend redesigns)
- UNCHANGED: Supabase Storage bucket `property-images` not yet created
- UNCHANGED: Bill's phone placeholder (`+1XXXXXXXXXX`) in Landing.jsx and PropertyPanel.jsx
- Sessions 3-7 still missing from map

**Next:**
- Commit all uncommitted work (sessions 11-13)
- Visual review in browser — verify depth, animations, icons, custom dropdowns look right
- Create `property-images` bucket in Supabase Storage dashboard
- Replace phone/email placeholders with Bill's real contact info
- Wire admin dashboard to image upload + property management
- Consider `helmet` for HTTP security headers and rate limiting

### 2026-03-03 (Session 14) — CC — New logos + landing layout overhaul + location filter

**What happened:**
- **New logos from Josh:** `3.png` (full rectangular — key/compass/houses + "Easy-Rental" text, linen bg), `4.png` (circle coin medallion, white bg), `Easy Circle.png` (circle with clear/black bg), `Full Logo.png` (full, slightly different crop). Copied to `public-site/public/` as `logo-full.png` and `logo-circle.png`.
- **Landing hero:** `logo-full.png` (full logo), countersunk with inset shadows + bottom highlight
- **NavBar:** `logo-circle.png` (clear-bg coin medallion)
- **Page background tuned:** `--linen` shifted from `#c4b5a0` to `#c9bda8` (warmer) to reduce visible logo rectangle edges. SVG noise pattern + gradient updated to match.
- **Landing layout restructured:** Single vertical stack → two-column top row. Logo offset left (`justify-content: space-between`, `padding-right: 5%`), two nav tiles side by side top-right (Search Map olive filled, Browse Listings outline). Tagline in its own glass panel (3rem/4rem padding, max-width 1100px, 2rem font). Filter bar as separate glass panel below (1.1rem/1.3rem padding, max-width 620px).
- **Location filter added everywhere:**
  - Landing: new text input with pin icon as first filter field
  - FilterBar component: location field added to FILTER_KEYS, local state, JSX (appears on Map + Listings pages)
  - Backend controller: accepts `location` query param as alias for `city`
  - Backend model: changed city filter from exact match (`LOWER(city) = LOWER(...)`) to partial match (`LOWER(city) LIKE LOWER(...)`) with `%` wildcards
- **Filter bar now includes action buttons:** Search Map + Browse Listings buttons inside filter bar (below filter fields) so users pick filters then choose destination
- **Text enlarged ~20%:** Tagline 1.4→2rem, labels 0.7→0.84rem, inputs 0.9→1.05rem, buttons 1→1.15rem, footer 0.95→1.1rem
- **Better button icons:** Map icon changed from pin to folded map with creases, Listings icon from 2x2 grid to staggered horizontal lines
- **Files modified:** `Landing.jsx`, `Landing.css`, `NavBar.jsx`, `index.css`, `FilterBar.jsx`, `PropertyController.js`, `PropertyModel.js`
- **New public assets:** `public-site/public/logo-full.png`, `public-site/public/logo-circle.png`

**Git:** Branch `master` | Last commit `23fd358` (unchanged from session 11) | Uncommitted: all session 11-14 changes

**Open threads:**
- UNCHANGED: Uncommitted work — now spans sessions 11-14
- UNCHANGED: Supabase Storage bucket `property-images` not yet created
- UNCHANGED: Bill's phone placeholder (`+1XXXXXXXXXX`) in Landing.jsx and PropertyPanel.jsx
- Sessions 3-7 still missing from map
- NEW: Logo still has linen background baked in — transparent PNG would eliminate edge mismatch entirely

**Next:**
- Commit all uncommitted work (sessions 11-14)
- Visual review in browser — verify full layout, logo blending, location filter, tile buttons
- Get transparent-background version of full logo from Josh
- Create `property-images` bucket in Supabase Storage dashboard
- Replace phone/email placeholders with Bill's real contact info

### 2026-03-03 (Session 15) — CC — Landing simplification + visual depth overhaul

**What happened:**
- **Layout tweaks:** Enlarged nav tiles 25% (140×110→175×138px, icons 32→40), tile gap widened to 5rem, logo shifted left (`margin-left: -20%`), tiles shifted right (`margin-right: -15%`), tagline enlarged 25% (2→2.5rem) and softened color (55% opacity brown)
- **Filter bar removed from landing:** Stripped entire search panel (5 filter fields + dual action buttons) from Landing.jsx and Landing.css. Landing is now: logo + tiles + tagline + footer. Filters live on `/map` and `/listings` only.
- **Removed dead code:** CustomSelect import, useState, filter state, buildQuery, all filter-related icons (IconBuilding, IconTag, IconBed, IconLocation), PROPERTY_TYPES/BEDROOM_OPTIONS constants
- **Logo decorative border:** 3px gold border + 2px olive outline with 4px offset + gold glow band via box-shadow
- **Background overhaul:** Replaced flat linen + SVG noise with rich gradient (warm gold #d4c5a8 top → olive-grey #8a8a70 bottom) + three radial-gradient light patches for organic warmth
- **Panel depth upgrade:** Tagline panel — radius 16→24px, narrower 1100→700px, translucent glass 55%, visible inner highlight, deeper layered shadows. Footer — lighter/transparent with frosted glass blur
- **Tile depth upgrade:** Radius 12→20px, primary tile now gradient fill (olive-light→olive→olive-dark) with lit top edge and inner bottom shadow. Outline tile more visible frosted glass. Hover lifts 4px with glow. Bolder shadow stacks throughout.
- **Decided on favorites approach:** LocalStorage hearts (A) + shareable URL link (B). No auth needed. Not yet implemented.
- **Files modified:** `Landing.jsx`, `Landing.css`, `index.css`

**Git:** Branch `master` | Last commit `23fd358` (unchanged since session 11) | Uncommitted: all session 11-15 changes

**Open threads:**
- UNCHANGED: Uncommitted work — now spans sessions 11-15
- UNCHANGED: Supabase Storage bucket `property-images` not yet created
- UNCHANGED: Bill's phone placeholder (`+1XXXXXXXXXX`) in Landing.jsx and PropertyPanel.jsx
- UNCHANGED: Sessions 3-7 still missing from map
- UNCHANGED: Logo still has linen background baked in — transparent PNG would help
- NEW: Favorites feature decided (A+B: localStorage + shareable link) but not built yet

**Next:**
- Commit all uncommitted work (sessions 11-15)
- Visual review in browser — verify gradient, panel depth, tile effects
- Build favorites: localStorage hearts on PropertyCard + shareable `/favorites?ids=` URL + Favorites page
- Get transparent-background version of full logo from Josh
- Create `property-images` bucket in Supabase Storage dashboard
- Replace phone/email placeholders with Bill's real contact info
- Wire admin dashboard to image upload + property management

### 2026-03-03 (Session 16) — CC — Deployment design + admin dashboard plan

**What happened:**
- **Brainstormed deployment architecture** with Josh — explored hosting options, decided on Vercel for everything
- **Key decisions:**
  - GoDaddy = DNS only (A/CNAME records to Vercel)
  - Public site + Express API as serverless → `easy-rental.ca` (one Vercel project)
  - Admin dashboard → `admin.easy-rental.ca` (separate Vercel project)
  - Image uploads go direct from browser to Supabase Storage (bypasses Express, no 4.5MB serverless limit)
  - Express backend stays as-is — it's the quality choice (65 tests, security hardening, clean separation)
  - Rejected Supabase-native approach (would throw away tested backend for marginal savings)
- **Admin dashboard design:** Login, Properties CRUD (list with health indicators, view/edit/add forms, drag-and-drop image upload, renter preview), Inquiry management (list, detail, mailto reply, 24h response nudge), care layer (empty states, save confidence, human timestamps)
- **Design doc written:** `docs/plans/2026-03-03-admin-dashboard-and-deployment-design.md`
- **Implementation plan written:** `docs/plans/2026-03-03-admin-dashboard-and-deployment-plan.md` (21 tasks, 6 phases)
  - Phase 1: Backend endpoints for admin (inquiry list/count, image metadata, CORS)
  - Phase 2: Admin login (auth context + login page)
  - Phase 3: Properties management (list, detail, edit, add, image upload)
  - Phase 4: Inquiry management (list, detail, status)
  - Phase 5: Care details (coming-soon states, logout)
  - Phase 6: Deploy (Supabase Storage bucket, Vercel config, DNS, smoke test)
- **No code changes this session** — design and planning only

**Git:** Branch `master` | Last commit `23fd358` (unchanged) | Uncommitted: all session 11-15 frontend/backend changes + session 16 design/plan docs

**Open threads:**
- UNCHANGED: Uncommitted work — now spans sessions 11-16 (design docs added)
- UNCHANGED: Supabase Storage bucket `property-images` not yet created (Task 15 in plan)
- UNCHANGED: Sessions 3-7 still missing from map
- UNCHANGED: Logo still has linen background baked in
- UNCHANGED: Favorites feature decided but not built
- RESOLVED: Deployment architecture — Vercel + GoDaddy DNS designed
- RESOLVED: Admin dashboard scope for launch — login, properties CRUD, inquiries, image upload

**Next:**
- Choose execution approach (subagent-driven this session or parallel session)
- Execute the 21-task implementation plan

### 2026-03-04 (Session 17) — CC — Full admin dashboard build + deploy

**What happened:**
- **Committed sessions 11-16 work** in 3 logical commits: backend (inquiry/media/filtering), public site (all components/pages), docs (design/plan files)
- **Executed all 21 tasks** from admin dashboard plan using subagent-driven development (fresh subagent per task, spec + quality review gates)
- **Phase 1 — Backend endpoints:**
  - Task 1: Inquiry list/detail/status endpoints (`GET /api/inquiries`, `GET /:id`, `PATCH /:id/status`) with auth + validation + 14 new tests
  - Task 2: `inquiry_count` added to property list via LEFT JOIN subquery
  - Task 3: Image metadata endpoint (`POST /api/properties/:id/images/metadata`) for direct Supabase uploads
  - Task 4: CORS allowlist updated for `admin.easy-rental.ca`
- **Phase 2 — Auth:** AuthContext (JWT + localStorage), Login page (glassmorphism panel over bg-environment)
- **Phase 3 — Properties:** PropertiesSidePanel (API-wired, status tabs, search, health indicators), PropertyDetail (images, status toggle, delete with confirm), PropertyForm (18 fields, edit + add-new flow), ImageUploader (drag-and-drop → Supabase Storage → metadata endpoint, thumbnails, set primary, delete)
- **Phase 4 — Inquiries:** InquiriesSidePanel (tabs, unread count, timeAgo), InquiryDetail (status management, 24h nudge, mailto reply)
- **Phase 5 — Care:** Coming-soon states for Schedule/Leads, Logout button in Shell
- **Phase 6 — Deployment:**
  - `api/index.js` Vercel serverless wrapper, `vercel.json` for public site + API rewrites
  - `admin-dashboard/vercel.json` for SPA routing
  - Public site API URL defaults to relative `/api` for production
  - Root `package.json` with `"type": "module"` (fixed ESM compatibility on Vercel)
  - Supabase Storage bucket `property-images` created (public) with RLS: public read, authenticated upload/delete
  - GitHub repo created: `steadywellness/Easy-Rent` (private, HTTPS)
  - Vercel projects created via CLI: `easy-rental` (public site + API) and `easy-rental-admin`
  - Env vars set via `vercel env add` for both projects
  - Both deployed to production — API health check returns 200
- **84 backend tests passing**, both frontends build cleanly
- **Files created (19 new):** AuthContext.jsx, Login.jsx/css, PropertiesSidePanel.jsx/css, PropertyDetail.jsx/css, PropertyForm.jsx/css, ImageUploader.jsx/css, InquiriesSidePanel.jsx/css, InquiryDetail.jsx/css, supabase.js config, api/index.js, vercel.json (x2), root package.json
- **Files modified (12):** InquiryModel.js, InquiryController.js, inquiryRoutes.js, PropertyModel.js, PropertyMediaController.js, propertyMediaRoutes.js, App.jsx, Shell.jsx/css, SidePanel.jsx/css, ContentPanel.jsx, api.js, .env.examples

**Git:** Branch `master` | Last commit `d4f1773` (fix: root package.json for ESM) | Uncommitted: none (clean tree)

**Open threads:**
- RESOLVED: Uncommitted work — all committed in 4 commits (`0ebe29e`, `57ba2f0`, `16f3d69`, `730d235`)
- RESOLVED: Supabase Storage bucket `property-images` — created with RLS policies
- RESOLVED: Admin dashboard — fully built and deployed
- UNCHANGED: Bill's phone placeholder (`+1XXXXXXXXXX`) in Landing.jsx and PropertyPanel.jsx
- UNCHANGED: Sessions 3-7 still missing from map
- UNCHANGED: Logo still has linen background baked in
- UNCHANGED: Favorites feature decided but not built
- NEW: Custom domains not yet configured — need GoDaddy DNS records (A `@` → `76.76.21.21`, CNAME `admin` → `cname.vercel-dns.com`) + Vercel domain settings
- NEW: Admin `VITE_API_URL` currently points to Vercel auto-domain — update to `https://easy-rental.ca/api` after DNS

**Next:**
- Configure custom domains in Vercel dashboard (easy-rental.ca + admin.easy-rental.ca)
- Add DNS records in GoDaddy
- Update admin VITE_API_URL env var to production domain
- Replace Bill's phone/email placeholders with real contact info
- Visual review of both deployed sites in browser
- Build favorites feature (localStorage hearts + shareable URL)
- Commit all uncommitted work (sessions 11-16) before or during execution

### 2026-03-03 (Session 18) — CC — Custom domains + DNS configuration

**What happened:**
- **Configured custom domains in Vercel** via CLI: `easy-rental.ca` + `www.easy-rental.ca` on public site project, `admin.easy-rental.ca` on admin project
- **GoDaddy DNS records added** by Josh: 3 A records (`@`, `www`, `admin`) → `76.76.21.21`, TTL 30min. Deleted old WebsiteBuilder record, replaced CNAME `www` with A record
- **Updated admin `VITE_API_URL`** env var from Vercel auto-domain to `https://easy-rental.ca/api` (removed old, added new via `vercel env`)
- **Redeployed both projects** to production — both aliased to custom domains, SSL certificates provisioning async
- **Verified all three domains resolve** via nslookup: `easy-rental.ca`, `www.easy-rental.ca`, `admin.easy-rental.ca` all → `76.76.21.21`
- **Verified HTTP 200** on `easy-rental.ca`, `admin.easy-rental.ca`, and `easy-rental.ca/api/health`
- **No code changes** — infrastructure/DNS only

**Git:** Branch `master` | Last commit `d4f1773` (unchanged) | Uncommitted: none (clean tree)

**Open threads:**
- RESOLVED: Custom domains — all three configured and verified live
- RESOLVED: Admin `VITE_API_URL` — updated to `https://easy-rental.ca/api`
- UNCHANGED: Bill's phone placeholder (`+1XXXXXXXXXX`) in Landing.jsx and PropertyPanel.jsx
- UNCHANGED: Sessions 3-7 still missing from map
- UNCHANGED: Logo still has linen background baked in
- UNCHANGED: Favorites feature decided but not built

**Next:**
- Visual review of both sites on custom domains in browser
- Replace Bill's phone/email placeholders with real contact info
- Build favorites feature (localStorage hearts + shareable URL)
- Get transparent-background logo from Josh

### 2026-03-03 (Session 19) — CC — Admin login, logo, visual polish

**What happened:**
- **Fixed JWT_EXPIRE env var on Vercel** — was set to an invalid value, causing 500 on auth endpoints. Removed and re-added as `7d`, redeployed
- **Created Bill's admin account** — registered via `/api/auth/register` (`aseasyrental@gmail.com` / `Mobile007!!`), promoted to `admin` role via direct DB update. Login confirmed working
- **Added Easy Key logo to admin Shell** — copied `Easy Key.png` to `admin-dashboard/src/assets/easy-key-logo.png` (transparent PNG, 3.6MB). Rendered in the laptop-screen nav panel (`/home` path). Current state: logo displays but is small due to panel dimensions — needs sizing work
- **Visual polish on admin nav** — removed unicode icon placeholders (`▣ ▦ ◎ ◈`), labels now uppercase with `font-weight: 600` and `letter-spacing: 0.06em`, renamed "Messages" to "Inquiries"
- **Boosted gold glow** on all glass panels — doubled intensity on CSS vars (`--gold-glow`, `--gold-glow-hover`, `--gold-glow-active`), added second wider-radius shadow layer. Also boosted border + glow on SidePanel, ContentPanel, and Login panel
- **Files modified:** Shell.jsx, Shell.css, index.css, SidePanel.css, ContentPanel.css, Login.css
- **Files created:** `admin-dashboard/src/assets/easy-key-logo.png`

**Git:** Branch `master` | Last commit `d4f1773` (unchanged) | Uncommitted: Shell.jsx, Shell.css, index.css, SidePanel.css, ContentPanel.css, Login.css, easy-key-logo.png

**Open threads:**
- NEW: Logo in admin Shell displays but too small — the laptop-screen panel area is inherently small. Need to either tune CSS sizing or rethink placement (e.g. fixed position top-left instead of bookshelf-mapped). Josh wants it bigger without changing panel rect coordinates
- NEW: Uncommitted admin visual changes (Shell, CSS, logo asset)
- RESOLVED: Bill's admin login — account created and working
- RESOLVED: JWT_EXPIRE Vercel env var — fixed
- RESOLVED: Logo has transparent background (Easy Key.png)
- UNCHANGED: Bill's phone placeholder (`+1XXXXXXXXXX`) in Landing.jsx and PropertyPanel.jsx
- UNCHANGED: Sessions 3-7 still missing from map
- UNCHANGED: Favorites feature decided but not built

**Next:**
- Fix logo sizing in admin Shell — figure out approach with Josh (CSS-only or reposition)
- Commit all uncommitted admin visual changes
- Replace Bill's phone/email placeholders with real contact info
- Build favorites feature (localStorage hearts + shareable URL)

### 2026-03-03 (Session 20) — CC — Admin nav depth + public site overlay & contact info

**What happened:**
- **Admin nav box refinement** — added inset shadows for carved depth (top gold highlight `rgba(232,168,124,0.12)` + bottom shadow `rgba(0,0,0,0.25)`), bumped gold border opacity from 0.10→0.18, label color changed from plain white to `var(--accent)` gold with brighter `#f0c4a8` on hover. Applied same treatment to home button and sign-out button. Files: `Shell.css`
- **Public landing — overlay image** — added `rental-overlay.png` (building illustration) as absolute-positioned decorative element (`top: 15%`, `left: 50%`, `transform: translateX(-35%)`, 830px max-width). Uses `mix-blend-mode: lighten` to knock out black background. Added `overflow: hidden` to `.landing` container. Files: `Landing.jsx`, `Landing.css`, `rental-overlay.png` (new asset)
- **Public landing — contact info** — added Bill's phone (`604-213-9911`) and email (`aseasyrental@gmail.com`) as clickable text above CTA buttons with `|` divider. Files: `Landing.jsx`, `Landing.css`
- **Navbar logo doubled** — `.navbar__logo` height from 36px→72px. File: `NavBar.css`
- **Layout tightened** — `.landing` gap reduced from 2.5rem→1rem
- **Deployed both sites** to production multiple times during iterative positioning
- **Design doc** created: `docs/plans/2026-03-03-nav-box-depth-design.md`

**Git:** Branch `master` | Last commit `d4f1773` (unchanged) | Uncommitted: Shell.css, Landing.jsx, Landing.css, NavBar.css, rental-overlay.png (new), nav-box-depth-design.md (new), EASY-RENTAL-MAP.md

**Open threads:**
- NEW: Overlay image has black background — Josh getting a transparent PNG version. Currently using `mix-blend-mode: lighten` as workaround
- NEW: Large uncommitted changeset across admin + public site (sessions 19-20)
- RESOLVED: Bill's phone/email placeholders — real contact info now displayed on landing page
- RESOLVED: Admin nav boxes — refined with depth, gold glow edges, gold label text
- UNCHANGED: Sessions 3-7 still missing from map
- UNCHANGED: Favorites feature decided but not built

**Next:**
- Get transparent overlay PNG from Josh and swap in
- Commit all uncommitted work (sessions 19-20)

### 2026-03-03 (Session 21) — CC — Full bugfix pass across public site, admin, and backend

**What happened:**
- **Committed sessions 19-20 work** — `e1022cb` (16 files: admin visual polish, public overlay + contact info, .gitignore, map, session archive)
- **Public site — error states** — added error + retry UI to Listings.jsx and MapView.jsx. Split into `error` (grid/map fetch) and `detailError` (individual property fetch) so a detail failure doesn't hide the loaded grid/map. CSS for error banners and retry buttons. Files: `Listings.jsx`, `Listings.css`, `MapView.jsx`, `MapView.css`
- **Public site — alt text** — PropertyPanel gallery thumbnails now have `alt={property.title} photo` instead of empty string. File: `PropertyPanel.jsx`
- **Admin — auth loading** — App.jsx now shows "Loading..." with styled background during auth check instead of blank white screen. Files: `App.jsx`, `App.css`
- **Admin — unused code cleanup** — removed `useLocation` import from Shell.jsx (was imported but never used after refactor). Deleted `admin-dashboard/src/hooks/useApi.js` (exported but never imported anywhere)
- **Admin — inquiry→property navigation** — wired up `onNavigateProperty` callback in Shell.jsx, passed through ContentPanel to InquiryDetail. Clicking a property link in inquiry detail now fetches the property and opens it in the properties content panel. File: `Shell.jsx`
- **Admin — image carousel fix** — PropertyDetail.jsx useEffect dependency changed from `[detail?.id]` to `[detail?.id, detail?.images?.length]` so carousel resets when images are added/removed after upload. File: `PropertyDetail.jsx`
- **Backend — file type validation** — image upload endpoint now rejects non-image MIME types (allows JPEG, PNG, WebP, GIF only). File: `PropertyMediaController.js`
- **Both builds verified passing** after all changes

**Git:** Branch `master` | Last commit `cac5ff4` (bugfixes) | Prior: `e1022cb` (sessions 19-20 commit) | Uncommitted: EASY-RENTAL-MAP.md

**Open threads:**
- RESOLVED: Large uncommitted changeset — all committed in `e1022cb` + `cac5ff4`
- NEW: Bugfix commits not yet deployed to production (need `vercel --prod` on both projects)
- UNCHANGED: Overlay image has black background — Josh getting transparent PNG
- UNCHANGED: Sessions 3-7 still missing from map
- UNCHANGED: Favorites feature decided but not built

**Next:**
- Deploy bugfixes to production (`vercel --prod` on public-site + admin-dashboard)
- Get transparent overlay PNG from Josh and swap in
- Build favorites feature (localStorage hearts + shareable URL)
- Build favorites feature (localStorage hearts + shareable URL)

### 2026-03-03 (Session 22) — CC — Bugfixes, documents & templates, rent labels

**What happened:**
- **Fixed "Validation failed" error display** — frontend now joins `errors` array from backend response instead of showing generic message. File: `PropertyForm.jsx`
- **Fixed property_type mismatch** — frontend dropdown had `studio`/`other` but backend only accepted `apartment, house, condo, townhouse, duplex, basement_suite, laneway_house`. Synced frontend to match. File: `PropertyForm.jsx`
- **Fixed status CHECK constraint** — DB had `pending`, backend validated `maintenance`. Migration 014 updated DB constraint to `maintenance`. File: `014_fix_status_check_constraint.sql`
- **Fixed optional field validation** — all `.optional()` validators now use `{ values: 'falsy' }` so `null` values from frontend don't trigger validation errors. Fixes lat/long, bedrooms, bathrooms, sqft, postal code, etc. File: `propertyRoutes.js`
- **Fixed Supabase Storage RLS** — image uploads failed with "new row violates row-level security policy" because INSERT policy required `authenticated` role but frontend uses `anon` key. Added anon INSERT policy for `property-images` bucket.
- **Fixed mouse wheel on number inputs** — added wheel event handler that blurs number inputs to prevent accidental value changes. File: `PropertyForm.jsx`
- **Renamed "Price" to "Rent"** — labels updated across admin PropertyForm, PropertyDetail, and public site FilterBar. DB column stays `price`. Files: `PropertyForm.jsx`, `PropertyDetail.jsx`, `FilterBar.jsx`
- **Built document templates feature** — new "Templates" nav item in admin Shell, TemplatesSidePanel component with upload/download/delete, backed by `document_templates` DB table and `GET/POST/DELETE /api/templates` API. Storage bucket: `document-templates`. Files: `TemplatesSidePanel.jsx`, `TemplatesSidePanel.css`, `Shell.jsx`, `SidePanel.jsx`, `DocumentTemplateModel.js`, `DocumentTemplateController.js`, `documentTemplateRoutes.js`
- **Built per-property document uploads** — DocumentUploader component in property detail view with drag-and-drop upload, title/type fields, document list with download/delete. Uses existing `documents` table (expanded type CHECK to include `inspection`, `notice`). API: `GET/POST/DELETE /api/properties/:id/documents`. Storage bucket: `property-documents`. Files: `DocumentUploader.jsx`, `DocumentUploader.css`, `PropertyDetail.jsx`, `DocumentModel.js`, `DocumentController.js`, `documentRoutes.js`
- **DB migrations:** 014 (status constraint), 015 (document types), 016 (document_templates table) — all applied
- **Supabase Storage buckets created:** `document-templates`, `property-documents` with public read + anon upload/delete RLS policies
- **Design docs:** `docs/plans/2026-03-03-documents-and-templates-design.md`, `docs/plans/2026-03-03-documents-and-templates-plan.md`
- **Deployed both sites** to production after all changes

**Git:** Branch `master` | Last commit `b53dbc0` (templates panel) | Prior commits: `85443cd` (DocumentUploader), `5f8a1bb` (backend APIs), `98cd32d` (storage buckets), `a160cf9` (migrations), `607e18a` (rent labels) | Uncommitted: EASY-RENTAL-MAP.md, docs/plans, .vercel

**Open threads:**
- RESOLVED: Bugfix commits deployed to production
- RESOLVED: "Validation failed" — now shows specific field errors
- RESOLVED: Property type mismatch (studio/other removed)
- RESOLVED: Status constraint mismatch (DB now uses `maintenance`)
- RESOLVED: Supabase Storage RLS for image uploads
- NEW: Templates and documents features deployed but not yet tested by Josh in browser
- UNCHANGED: Overlay image has black background — Josh getting transparent PNG
- UNCHANGED: Sessions 3-7 still missing from map
- UNCHANGED: Favorites feature decided but not built

**Next:**
- Josh to test templates upload/download/delete and property document upload in browser
- Get transparent overlay PNG from Josh and swap in

### 2026-03-04 (Session 23) — CC — Production bugfixes, images in listings, mobile responsive

**What happened:**
- **Fixed "Unable to load properties"** — production build had `VITE_API_URL=http://localhost:5000/api` baked in from committed `.env` file. Created `public-site/.env.production` with `VITE_API_URL=/api` so Vite uses relative path for production builds. Root cause: Vite reads `.env` at build time; Vercel builds picked up the localhost URL.
- **Fixed "No photo" on listing cards** — `PropertyModel.findFiltered()` didn't join `property_media` table. Added `json_agg` subquery to include `images` array in list response. File: `backend/src/models/PropertyModel.js`
- **Mobile responsive CSS — public site** — added `@media` queries to 6 CSS files, consistent 768px + 480px breakpoints:
  - `NavBar.css` — logo 72→48px, tighter padding/font
  - `Landing.css` — fixed margin-left/-right bug (logo/tiles going off-screen on phones), moved breakpoint 640→768px, hides 5.5MB overlay image on mobile, added 480px small-phone tier
  - `PropertyCard.css` — image uses `aspect-ratio: 16/9` instead of fixed 180px in single-column
  - `FilterBar.css` — full-width inputs/apply button, tighter padding
  - `PropertyPanel.css` — 480px: smaller thumbnails, tighter padding, larger close button for touch
  - `MapView.css` — error banner responsive (no centering overflow)
- **Design doc:** `docs/plans/2026-03-04-mobile-responsive-design.md`
- **Deployed 3 times** to production during session (API fix, images fix, mobile CSS)

**Git:** Branch `master` | Last commit `b53dbc0` (unchanged from session 22) | Uncommitted: PropertyModel.js, .env.production (new), 6 CSS files, mobile-responsive-design.md (new), EASY-RENTAL-MAP.md

**Open threads:**
- RESOLVED: "Unable to load properties" — was localhost URL baked into production build
- RESOLVED: "No photo" on listing cards — list endpoint now includes images
- NEW: Large uncommitted changeset (session 23 — production fixes + mobile CSS)
- UNCHANGED: Overlay image has black background — Josh getting transparent PNG (hidden on mobile now)
- UNCHANGED: Sessions 3-7 still missing from map
- UNCHANGED: Favorites feature decided but not built

**Next:**
- Commit all session 23 changes
- Josh to test mobile on phone (landing, listings, map, property detail)
- Get transparent overlay PNG from Josh and swap in
- Build favorites feature (localStorage hearts + shareable URL)

### 2026-03-03 (Session 24) — CC — Full bug audit and 12 critical/high fixes

**What happened:**
- **Full 3-layer audit** — launched parallel agents to audit backend, public site, and admin dashboard. Found 37 public-site issues, 19 admin issues, 31 backend issues. Prioritized into critical/high/medium/low.
- **Fix #1: Stale PropertyPanel** — added `key={selectedProperty.id}` to PropertyPanel in Listings.jsx and MapView.jsx, and `key={item.id}` to InquiryDetail in ContentPanel.jsx. Fixes wrong image/inquiry state when switching between properties.
- **Fix #2: Map empty on initial load** — MapView's `MapEvents` component only fired on `moveend`. Added `useEffect` to capture initial bounds on mount so markers load immediately. File: `public-site/MapView.jsx`
- **Fix #3: 401 redirect to nonexistent /login** — public site: removed entire auth interceptor (public site has no login). Admin: removed `window.location.href = '/login'` hard redirect, kept token clearing so AuthContext handles it. Files: `public-site/api.js`, `admin/api.js`
- **Fix #4: Null safety on API responses** — changed `res.data.data` to `res.data?.data || []` and `res.data.pagination.total_pages` to `res.data?.pagination?.total_pages || 1`. Files: `Listings.jsx`, `MapView.jsx`, `PropertiesSidePanel.jsx`, `InquiriesSidePanel.jsx`
- **Fix #5: Race conditions on rapid clicks** — added `lastClickedId` ref guard so stale detail responses are ignored. Files: `Listings.jsx`, `MapView.jsx`
- **Fix #6: Numeric field coercion** — replaced `||` with `??` for latitude, longitude, price, bedrooms, bathrooms, sqft, lease_term_months, deposit_amount in `PropertyModel.create()`. `bedrooms: 0` no longer silently becomes `null`. File: `backend/PropertyModel.js`
- **Fix #7-9: Admin side panel state** — added `refreshKey` counter to Shell.jsx, keyed SidePanel on `${activeSection}-${refreshKey}` so tabs reset on section change and list refreshes after create/delete/status change. Wired `onInquiryStatusChange` from Shell through ContentPanel to InquiryDetail. File: `admin/Shell.jsx`
- **Fix #10: Set-primary image endpoint** — frontend was POSTing to `/metadata` with an `id` field (creates duplicate instead of updating). Added proper `PATCH /:imageId/primary` route + controller method. Updated frontend ImageUploader to call `apiClient.patch()`. Files: `backend/PropertyMediaController.js`, `backend/propertyMediaRoutes.js`, `admin/ImageUploader.jsx`
- **Fix #11-12: Null price + invalid date display** — price now shows "Rent TBD" instead of `$NaN/mo` when null. `timeAgo` and `isOver24Hours` now guard against null/invalid dates. Files: `PropertyCard.jsx`, `PropertyPanel.jsx`, `PropertyMarkers.jsx`, `PropertiesSidePanel.jsx`, `InquiriesSidePanel.jsx`, `InquiryDetail.jsx`
- **Both builds verified passing** after all changes

**Git:** Branch `master` | Last commit `b53dbc0` (unchanged) | Uncommitted: 13 files across all 3 projects (session 23 changes + session 24 bugfixes)

**Open threads:**
- NEW: Large uncommitted changeset (sessions 23-24 — production fixes + mobile CSS + bug audit fixes)
- NEW: Bugfix changes not yet deployed to production
- UNCHANGED: Overlay image has black background — Josh getting transparent PNG (hidden on mobile)
- UNCHANGED: Sessions 3-7 still missing from map
- UNCHANGED: Favorites feature decided but not built

**Next:**
- Commit all sessions 23-24 changes
- Deploy to production (`vercel --prod` on public-site + admin-dashboard)
- Josh to test in browser: set-primary image, inquiry status updates, map initial load
- Get transparent overlay PNG from Josh and swap in
- Build favorites feature (localStorage hearts + shareable URL)

### 2026-03-04 (Session 25) — CC — "My List" favorites feature built and deployed

**What happened:**
- **Deployed sessions 23-24 work** to production (public site + admin dashboard) at start of session
- **Brainstormed favorites feature** with Josh — named "My List" (personal) / "Easy-Rental Picks" (shared links). Gold circle heart button on card image, localStorage-only, no auth needed
- **Design doc:** `docs/plans/2026-03-04-my-list-design.md`
- **Implementation plan:** `docs/plans/2026-03-04-my-list-plan.md` (9 tasks)
- **Executed all 9 tasks** via subagent-driven development:
  - Task 1: Backend `ids` query param filter on `GET /api/properties` — `PropertyModel.findFiltered()` + route validation
  - Task 2: `useMyList` hook — `useSyncExternalStore` + localStorage + cross-tab sync + same-tab listener pattern
  - Task 3: Heart button on PropertyCard — gold circle overlaying image top-right, `e.stopPropagation()` to not trigger card click
  - Task 4: Heart button on PropertyPanel — next to title in flex row
  - Task 5: "My List" NavBar link with gold count badge (hidden when 0)
  - Task 6: `/my-list` page — saved properties grid, "Share List" button (copies URL to clipboard), empty state with browse link
  - Task 7: `/picks` page — shared read-only view from `?ids=` query param, reuses MyList.css
  - Task 8: Routes wired in App.jsx (`/my-list` + `/picks`)
  - Task 9: Final verification (84 backend tests pass, build clean) + deployed to production
- **Files created (7):** `useMyList.js`, `MyList.jsx`, `MyList.css`, `Picks.jsx`, `my-list-design.md`, `my-list-plan.md`
- **Files modified (9):** `PropertyModel.js`, `propertyRoutes.js`, `PropertyCard.jsx`, `PropertyCard.css`, `PropertyPanel.jsx`, `PropertyPanel.css`, `NavBar.jsx`, `NavBar.css`, `App.jsx`
- **Deployed to production** — `easy-rental.ca` live with My List feature

**Git:** Branch `master` | Last commit `b53dbc0` (unchanged) | Uncommitted: 40 files across all 3 projects (sessions 23-25)

**Open threads:**
- CHANGED: Uncommitted changeset now spans sessions 23-25 (40 files)
- RESOLVED: Favorites feature — fully built and deployed as "My List" / "Easy-Rental Picks"
- UNCHANGED: Overlay image has black background (Josh says current version is fine)
- UNCHANGED: Sessions 3-7 still missing from map
- NOTE: Map at ~490 lines — archive older sessions next session

**Next:**
- Commit all sessions 23-25 changes
- Josh to test My List in browser: heart toggle, nav badge count, share link, picks page
- Archive older sessions from map to `docs/session-log-archive.md`
