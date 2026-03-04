# Easy Rental — THE MAP

**Last updated:** 2026-03-03 | **Session:** 16
**Status:** Deployment architecture designed + admin dashboard planned. Vercel hosting (public site + Express serverless on easy-rental.ca, admin dashboard on admin.easy-rental.ca). GoDaddy DNS only. Direct Supabase Storage image uploads. 21-task implementation plan written. 65 tests passing. Large batch of uncommitted work (sessions 11-15).
**Quick ref:** Public site: landing (logo-full.png offset left, Search Map / Browse Listings tiles top-right, tagline glass panel, Call/Email footer). `/map` (Leaflet + FilterBar), `/listings` (card grid + FilterBar). Admin dashboard: bookshelf nav shell built (glassmorphism, SidePanel, ContentPanel placeholder). Needs: login, properties CRUD, image upload, inquiry management, then deploy. Plan: `docs/plans/2026-03-03-admin-dashboard-and-deployment-plan.md`.

---

## Mission Statement

*Clarity at a glance. Simplicity in every step.*

Easy Rental exists to eliminate the friction between people who need a home and the person who can provide one.

**For the renter:** Finding a place to live is stressful. Easy Rental makes it effortless — clean, open design where every listing is clear, every step is obvious, and nothing feels broken or confusing. Browse, inquire, apply — no guesswork.

**For Bill (property manager):** Managing properties shouldn't bury you in busywork. Easy Rental gives you a dashboard built on clarity — upload media easily, see all your threads in one place, and let AI handle the repetitive responses so you can focus on the decisions that matter.

**Design Principles:**
1. Clarity over cleverness — if it needs explanation, it's wrong
2. Zero sludge — every interaction should feel like one step, not five
3. Clean and open — white space is a feature, not wasted space
4. Glitch-free or don't ship — reliability is a design choice

---

## Product Overview

**Type:** Long-term residential rental management platform
**Users:** Bill (admin/property manager) + Prospective and current tenants (public)

### Two Sides

**Public Site (Tenants)**
- Browse rental listings with full detail
- Request viewings
- Submit inquiries / ask questions
- Access Bill's forms and agreements
- Submit rental applications
- Direct messaging with Bill (in-app + email notifications)

**Admin Dashboard (Bill)**
- Property management (add/edit/remove listings)
- Media uploads (photos + video tours)
- Leads pipeline: new inquiries → viewing requests → applications → leased
- Active roster: current tenants, which property, lease details, communication history
- Messaging hub: all threads in one place
- AI assistant: auto-responds to routine questions, drafts replies for complex ones, Bill always has final say
- Flexible views: by property, by pipeline status, by what needs attention today

---

## Property Listing Fields

- Photos and video tours
- Address / location
- Rent price (monthly)
- Bedrooms / bathrooms / square footage
- Amenities (parking, laundry, pets allowed, etc.)
- Availability date
- Lease terms (length, deposit amount)
- Neighborhood info / nearby things

---

## Tech Stack

- **Frontend:** React 18 + Vite + React Router + Axios
- **Backend:** Express.js + PostgreSQL (pg-promise) + JWT auth
- **Infrastructure:** Docker Compose (PostgreSQL 15 + pgAdmin)
- **AI:** TBD — for auto-responses and draft suggestions

---

## Architecture

### Current State (Skeleton)
- Express server with health check endpoint only
- React app with placeholder components
- Database schemas defined but not created (users, properties, bookings)
- Auth middleware stubbed but not implemented
- API service layer with JWT interceptors ready

### Target State
- Full public site with listing browsing, inquiry forms, application flow, messaging
- Admin dashboard with property management, leads pipeline, tenant roster, AI-assisted messaging
- Showing scheduling with confirmations
- Lead qualification via AI
- In-app messaging with email bridge

---

## Competitive Awareness

**ShowMojo** — features they have that we're tracking:
- Listing syndication to 50+ sites → Phase 2
- Showing scheduling + confirmations → Phase 1 (core)
- Self-guided tours / lockboxes → Skip (hardware dependency)
- Lead qualification / screening → Phase 1 (AI handles)
- Post-showing feedback collection → Phase 2
- 24/7 live answer service → Phase 1 (AI auto-responder covers digitally)

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Long-term residential only | Bill's business model, no nightly booking complexity |
| In-app messaging + email | Keeps threads centralized, nobody misses messages |
| AI auto-respond + draft | Reduces Bill's busywork, he stays in control |
| Bill's own forms/agreements | App delivers them cleanly, doesn't reinvent paperwork |
| Flexible dashboard views | Bill needs property view, pipeline view, and daily urgency view |
| Dashboard manages leads AND roster | Not just vacancy filling — full tenant lifecycle |

---

## Open Questions

- AI provider/approach (OpenAI, Anthropic, local model?)
- Showing scheduling UX — calendar picker? Available time slots Bill sets?
- Form/agreement upload format — PDF upload? Fillable forms in-app?
- Email bridge implementation — SendGrid, Resend, etc.?
- Mobile responsiveness priority vs. dedicated mobile experience?

---

## Session Log

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
- Commit all uncommitted work (sessions 11-16) before or during execution
