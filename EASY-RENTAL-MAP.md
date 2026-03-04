# Easy Rental — THE MAP

**Last updated:** 2026-03-03 | **Session:** 20
**Status:** Admin nav boxes refined with inset depth + gold glow edges + gold label text. Public landing page: added overlay building illustration (absolute positioned), Bill's contact info text above CTA buttons, navbar logo doubled to 72px. Both sites deployed to production.
**Quick ref:** Public site: `easy-rental.ca`. Admin: `admin.easy-rental.ca`. API: `/api/health` returns 200. Bill's admin login: `aseasyrental@gmail.com`. Overlay image needs transparent PNG (current has black bg, using mix-blend-mode:lighten). Needs: transparent overlay PNG, commit all work, favorites feature.

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

> **NOTE:** Sessions 1-2 and 8-14 archived to `docs/session-log-archive.md`. Sessions 3-7 were never in the map (lost during worktree merge in session 8; key events: Session 3-4 Phase 1 execution, Session 5 rename + Canadian locale, Session 6 auth + Phase 1 complete + spatial UI pivot, Session 7 panel system + glassmorphism).

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
- Build favorites feature (localStorage hearts + shareable URL)
