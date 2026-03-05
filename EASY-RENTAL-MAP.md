# Easy Rental — THE MAP

**Last updated:** 2026-03-05 | **Session:** 36
**Status:** Systematic debugging of both sites complete. Fixed intermittent API 500s (lazy DB init), desktop admin nav blocked (DashboardHome z-index), 8 linting errors, missing favicon, duplicate dotenv. Both sites redeployed and verified. 3 properties live.
**Quick ref:** Public site: `easy-rental.ca`. Admin: `admin.easy-rental.ca`. **Deploy public from repo root** (`C:\Users\mrjos\Projects\Easy-Rent\`, project "easy-rental"). **Deploy admin from `admin-dashboard/`** (project "easy-rental-admin"). API: `/api/health` returns 200. Bill's admin login: `aseasyrental@gmail.com` / `Mobile007!!`. Editor login: `Minion@uploads.ca` / `Easy123` (case-insensitive, properties only, no delete). Roles: `admin` (full access), `editor` (properties + photos only). Document types: lease, agreement, form, inspection, notice. Storage buckets: `property-images`, `property-documents`, `document-templates`. `.env.production` sets `VITE_API_URL=/api` for Vercel builds. `PATCH /api/properties/:id/images/:imageId/primary`. `GET /api/properties?ids=1,2,3` filter. Routes: `/my-list`, `/picks?ids=...`. localStorage key: `easyRentalMyList`. Backup: `npm run db:backup` / `npm run db:restore` from `backend/`. Overlay now uses `%`/`vw` positioning (responsive). Mobile breakpoint: 768px. MobileNav component for hamburger menu + BottomTabBar (68px, SVG icons) for mobile primary nav. Admin bg: `bg-environment-compressed.jpg` (100KB). Mobile landing uses `100dvh` not `100vh` (iOS Safari fix). New components: `BottomTabBar.jsx/css`, `DashboardHome.jsx/css`. DB connection is lazy-initialized via Proxy (cold-start safe). Public site JS bundle: 488KB (down from 712KB). Favicon: `logo-circle.png`.

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

> **NOTE:** Sessions 1-2, 8-25 archived to `docs/session-log-archive.md`. Sessions 3-7 were never in the map (lost during worktree merge in session 8; key events: Session 3-4 Phase 1 execution, Session 5 rename + Canadian locale, Session 6 auth + Phase 1 complete + spatial UI pivot, Session 7 panel system + glassmorphism).


### 2026-03-04 (Session 26) — CC — Database wipe discovered, safeguards added, quality reckoning

**What happened:**
- **Discovered all database data was wiped** — every table had 0 rows. Root cause: `cleanAllTables()` in `backend/tests/helpers.js` ran `DELETE FROM` on all tables. The production guard only checked `NODE_ENV === 'production'`, but `.env` has `NODE_ENV=development` with the live Supabase connection string. Every test run (sessions 17, 21, 24, 25) deleted all data from the production database.
- **Re-created Bill's admin account** — registered via production API, promoted to admin via direct SQL. Credentials: `aseasyrental@gmail.com` / `Mobile007!!`
- **Hardened test guard** — `guardAgainstProduction()` now checks `DATABASE_URL` for non-localhost hosts, not just `NODE_ENV`. Tests will refuse to run against any remote database. File: `backend/tests/helpers.js`
- **Built backup/restore scripts** — `backend/src/db/backup.js` exports all table data to timestamped SQL file in `backend/backups/`. `backend/src/db/restore.js` restores from a backup file. FK-safe ordering in both directions. Added `npm run db:backup` and `npm run db:restore` to package.json. Files: `backup.js` (new), `restore.js` (new), `package.json`
- **Confirmed 3 images survived** in Supabase Storage `property-images` bucket (storage wasn't affected by test cleanup). Orphaned — no DB records linking them to properties.
- **Landing page CSS tweaks** — tagline panel `max-width` from `700px` → `735px`. Overlay image position locked to fixed px values (`top: 130px`, `left: 280px`, `width: 830px`) so it won't shift when other elements change. File: `public-site/src/pages/Landing.css`
- **Deployed public site 3 times** during CSS iteration

**QUALITY NOTE FOR NEXT SESSION:** This session exposed a pattern of rushing — building fast, "verifying" via test runs that actually destroyed data, deploying without browser testing, making CSS changes beyond what was asked. Josh has flagged this clearly. Next session must: (1) verify each feature in the actual browser before marking it done, (2) only change exactly what's requested, (3) slow down. The 10 features from sessions 17-25 need real browser verification one at a time.

**Git:** Branch `master` | Last commit `b53dbc0` (unchanged) | Uncommitted: ~45 files across all 3 projects (sessions 23-26)

**Open threads:**
- NEW: All property data lost — Bill must re-enter properties via admin dashboard
- NEW: 3 orphaned images in Supabase Storage (no DB records)
- NEW: Quality debt — 10 features built across sessions 17-25 never browser-verified (admin login, add property, image upload, set primary, public listings, map view, property detail, My List, inquiries, templates/documents)
- CHANGED: Uncommitted changeset now spans sessions 23-26 (~45 files)
- UNCHANGED: Sessions 3-7 still missing from map
- NOTE: Map at ~530 lines — archive older sessions next session

**Next:**
- Bill re-enters properties via admin dashboard
- Run `npm run db:backup` immediately after Bill adds data
- Commit all sessions 23-26 changes
- Methodical browser verification of each feature, one at a time, fix what's broken before moving on

### 2026-03-04 (Session 27) — CC — Responsive layout fixes + logo compression + tagline link

**What happened:**
- **Logo images compressed** — `logo-circle.png` 18MB→39KB, `logo-full.png` 36MB→1.1MB, `logo.png` 9.9MB→376KB. Resized via ffmpeg to 2x display size (retina). Originals were 6000×3375px.
- **Navbar logo** — removed `position: fixed` with hardcoded `left: 1.5rem`, now flows in navbar flex layout. File: `NavBar.css`
- **Filter bar** — changed `left: calc(1.5rem + 72px + 0.75rem)` to `left: 1.5rem` since navbar logo is no longer fixed. File: `FilterBar.css`
- **Landing page layout overhaul** — multiple iterations with Josh to get logo pinned to left wall:
  - Removed `padding-left` from `.landing` (now `padding: 2.5rem 2rem 0 0`)
  - Added `align-self: flex-start` to `.landing__top` so it pins left instead of centering
  - Removed all intermediate logo breakpoints (1200px, 960px) — logo stays 480px until 768px mobile drop to 280px
  - Overlay image changed from hardcoded px (`top: 130px; left: 280px; width: 830px`) to responsive (`top: 15%; left: 25%; width: 60vw; max-width: 830px`)
  - Added `position: relative; z-index: 1` to `.landing__top`, `.landing__tagline-row`, `.landing__footer` so content renders above overlay
  - Logo CSS: added `min-width: 0`, `box-sizing: border-box`, `max-width: min(480px, calc(100vw - 6rem))`
  - File: `Landing.css`
- **Tagline clickable** — "Rental homes in the Lower Mainland" now navigates to `/listings` on click. File: `Landing.jsx`
- **Deployed to production** 3 times during iteration (`easy-rental.ca`)

**Git:** Branch `master` | Last commit `b53dbc0` (unchanged) | Uncommitted: ~50 files across all 3 projects (sessions 23-27)

**Open threads:**
- CHANGED: Uncommitted changeset now spans sessions 23-27 (~50 files)
- CHANGED: Landing page responsive layout still needs Josh's final review at various screen widths — logo left-wall pinning was contentious, may need further tweaks
- Prior open threads unchanged

**Next:**
- Josh to review landing page at various screen widths on phone + desktop, flag remaining layout issues
- Commit all sessions 23-27 changes
- Bill re-enters properties via admin dashboard
- Run `npm run db:backup` immediately after Bill adds data
- Methodical browser verification of each feature, one at a time
- Archive older sessions from map

### 2026-03-04 (Session 28) — CC — Admin dashboard mobile responsive

**What happened:**
- **Brainstormed mobile admin design** with Josh — full mobile admin access for Bill, hamburger menu (not bottom tabs), stack navigation (list → detail with back arrow), 768px breakpoint
- **Design doc:** `docs/plans/2026-03-04-admin-mobile-design.md`
- **Implementation plan:** `docs/plans/2026-03-04-admin-mobile-plan.md` (12 tasks)
- **Executed all 12 tasks** via subagent-driven development:
  - Task 1: Moved background image from inline style to CSS, `@media (min-width: 769px)` only loads the ~13MB image on desktop (Safari-safe)
  - Task 2: Created `MobileNav.jsx` + `MobileNav.css` — hamburger icon, 280px slide-out drawer, glass morphism styling, 44px+ touch targets
  - Task 3: Integrated MobileNav into Shell, hid desktop bookshelf nav + home/logout buttons on mobile, added 56px top padding for mobile header
  - Task 4: SidePanel — full viewport width on mobile, positioned below 56px header
  - Task 5: ContentPanel — full viewport width on mobile, z-index 350 (above SidePanel), close button changed from X to back arrow
  - Task 6: PropertyForm — 2-col grid → 1 column, 44px input height, 16px font-size (iOS zoom prevention), stacked full-width buttons
  - Task 7: PropertyDetail — hero 260→180px, grid → 1 column, status dropdown → bottom sheet on mobile
  - Task 8: ImageUploader — `capture="environment"` for phone camera, delete button always visible on mobile (no hover), thumbnail size adjusted
  - Task 9: InquiryDetail — stacked buttons, info rows stacked vertically. InquiriesSidePanel — 48px item height, 44px tabs/search
  - Task 10: PropertiesSidePanel + TemplatesSidePanel — 44-48px touch targets. DocumentUploader breakpoint 480→768px
  - Task 11: Login page — responsive panel width, bg image desktop-only, touch inputs
  - Task 12: Build clean, deployed to `admin.easy-rental.ca`
- **Files created (2):** `MobileNav.jsx`, `MobileNav.css`
- **Files modified (16):** `Shell.jsx`, `Shell.css`, `ContentPanel.jsx`, `ContentPanel.css`, `SidePanel.css`, `PropertyForm.css`, `PropertyDetail.css`, `ImageUploader.jsx`, `ImageUploader.css`, `InquiryDetail.css`, `InquiriesSidePanel.css`, `PropertiesSidePanel.css`, `TemplatesSidePanel.css`, `DocumentUploader.css`, `Login.jsx`, `Login.css`
- **Deployed admin dashboard** to production

**Git:** Branch `master` | Last commit `03b97b2` (sessions 23-28) | Uncommitted: ~22 files (session 28 mobile work)

**Open threads:**
- NEW: Admin mobile deployed — Josh testing on phone, may need tweaks
- CHANGED: Uncommitted changeset is now ~22 files (session 28 mobile responsive)
- UNCHANGED: All property data lost — Bill must re-enter properties
- UNCHANGED: 3 orphaned images in Supabase Storage
- UNCHANGED: Quality debt — 10 features never browser-verified
- UNCHANGED: Sessions 3-7 still missing from map
- NOTE: Map at ~580 lines — archive older sessions soon

**Next:**
- Josh tests admin on phone — flag layout issues, touch problems
- Fix any mobile issues found during testing
- Commit session 28 changes
- Bill re-enters properties via admin dashboard
- Run `npm run db:backup` immediately after Bill adds data

### 2026-03-04 (Session 29) — CC — Map archive

**What happened:**
- **Archived sessions 15-25** from map to `docs/session-log-archive.md` — map went from 591→233 lines
- Updated archive note in Session Log header to reflect sessions 1-2, 8-25 archived

**Git:** Branch `master` | Last commit `03b97b2` (sessions 23-28) | Uncommitted: ~22 files (session 28 mobile) + map archive changes

**Open threads:**
- Prior open threads unchanged

**Next:**
- Josh tests admin on phone — flag layout issues, touch problems
- Fix any mobile issues found
- Commit session 28-29 changes
- Bill re-enters properties via admin dashboard
- Run `npm run db:backup` immediately after Bill adds data

### 2026-03-04 (Session 30) — CC — Admin bg compression + public mobile landing fix

**What happened:**
- **Admin background image compressed** — `bg-environment.png` 13MB→`bg-environment-compressed.jpg` 100KB via ffmpeg (resized to 1920px wide). Now loads on both desktop AND mobile (was desktop-only).
- **Files modified (admin):** `Shell.css`, `Login.css` — switched to `bg-environment-compressed.jpg`, removed `display: none` on mobile for bg, removed solid color overlay fallback on mobile.
- **File created (admin):** `bg-environment-compressed.jpg` in `admin-dashboard/src/assets/`
- **Admin deployed** to `admin.easy-rental.ca`
- **Public landing page mobile fix** — footer (Bill's email/buttons) was cut off on mobile phones. Root cause: `100vh` on iOS Safari includes area behind browser chrome (URL bar + bottom nav), making footer render behind toolbar. Fix: `100dvh` (dynamic viewport height) on mobile, `justify-content: space-between` to distribute content, `margin-top: 0` on top and footer, `gap: 1rem` inside `.landing__top`.
- **File modified (public):** `Landing.css`
- **Public deployed** to `easy-rental.ca` — verified footer visible on Josh's phone
- **CRITICAL LESSON:** Multiple deploys went to wrong Vercel project ("public-site" instead of "easy-rental"). Public site must deploy from repo root `C:\Users\mrjos\Projects\Easy-Rent\`, not from `public-site/` subfolder.

**Git:** Branch `master` | Last commit `03b97b2` (sessions 23-28) | Uncommitted: ~25 files (sessions 28-30)

**Open threads:**
- CHANGED: Uncommitted changeset now spans sessions 28-30 (~25 files)
- RESOLVED: Admin mobile bg — now shows on both desktop and mobile (compressed)
- RESOLVED: Public landing footer cutoff on mobile — fixed with 100dvh
- Prior open threads unchanged (property data, orphaned images, quality debt, missing sessions 3-7)

**Next:**
- Commit sessions 28-30 changes
- Bill re-enters properties via admin dashboard
- Run `npm run db:backup` immediately after Bill adds data
- Methodical browser verification of each feature, one at a time

### 2026-03-04 (Session 31) — CC — Phone field, multi-photo, CTA rename, editor role

**What happened:**
- **Committed sessions 28-30** — `dffe2a3` (24 files)
- **Inquiry form phone field** — added optional `type="tel"` phone input to `InquiryForm.jsx`. DB column already existed. Admin `InquiryDetail.jsx` already displays phone with tappable `tel:` link.
- **Image uploader bug fix** — removed `capture="environment"` from `ImageUploader.jsx` so mobile shows gallery/camera/files picker instead of forcing camera only
- **Multi-photo upload** — added `multiple` attribute to file input, `handleFileSelect` now loops through all selected files and uploads sequentially
- **CTA button rename** — `Landing.jsx` buttons changed from "Call Bill"/"Email Bill" to "Call Easy Rent"/"Email Easy Rent"
- **Editor role** — full role-based access control:
  - Migration `017_add_editor_role.sql` — added `'editor'` to users table role constraint
  - `requireEditor` middleware — allows admin OR editor (backend `middleware/index.js`)
  - Property create/edit routes use `requireEditor`; delete stays `requireAdmin`
  - Property media routes (upload, metadata, set-primary, delete) use `requireEditor`
  - `Shell.jsx` + `MobileNav.jsx` — filter nav items by role (editors see Properties only)
  - `PropertyDetail.jsx` — delete button hidden for non-admin
  - Created editor account: `Minion@uploads.ca` / `Easy123` (id: 2501, role: editor)
- **Files modified (public):** `InquiryForm.jsx`, `Landing.jsx`
- **Files modified (admin):** `ImageUploader.jsx`, `Shell.jsx`, `MobileNav.jsx`, `PropertyDetail.jsx`
- **Files modified (backend):** `middleware/index.js`, `propertyRoutes.js`, `propertyMediaRoutes.js`
- **Files created (backend):** `017_add_editor_role.sql`
- **Deployed** public site to `easy-rental.ca`, admin dashboard to `admin.easy-rental.ca` (multiple deploys)

**Git:** Branch `master` | Last commit `dffe2a3` (sessions 28-30) | Uncommitted: session 31 changes (~10 files)

**Open threads:**
- NEW: Editor account created but not tested by Bill yet
- NEW: Josh mentioned a connection error — not yet investigated
- RESOLVED: Sessions 28-30 committed
- Prior open threads unchanged (property data, orphaned images, quality debt, missing sessions 3-7)

**Next:**
- Investigate connection error Josh mentioned
- Bill tests editor account (`Minion@uploads.ca` / `Easy123`)
- Bill re-enters properties via admin dashboard

### 2026-03-05 (Session 32) — CC — Fix production API crash, redeploy

**What happened:**
- **Diagnosed production API crash** — `easy-rental.ca/api/properties` returning `FUNCTION_INVOCATION_FAILED` with `SyntaxError: Identifier 're...'` (truncated in Vercel logs). All backend source files pass syntax checks locally on Node 24. Root cause unclear — likely stale Vercel function bundle from session 31's CLI deploy.
- **Redeployed public site** from repo root via `vercel --prod` — API healthy, properties loading (2 listings with images confirmed).
- Bill has already entered properties (2 listings live: "1 Bedroom Suite Available" in Surrey, "The Josh Residence")

**Git:** Branch `master` | Last commit `dffe2a3` (sessions 28-30) | Uncommitted: session 31 changes (~10 files) + map update

**Open threads:**
- RESOLVED: Production API crash — fixed by redeploying
- RESOLVED: Property data lost — Bill has re-entered 2 properties with images
- NEW: Editor login ("minions") — Josh wants to work on this next
- Prior open threads unchanged (orphaned images, quality debt, missing sessions 3-7)

**Next:**
- Work on editor/minion login flow
- Commit session 31-32 changes
- Run `npm run db:backup` now that Bill has data in

### 2026-03-05 (Session 33) — CC — Bugfixes + mobile-first admin design

**What happened:**
- **Codebase scan** — ran full backend + frontend audit for bugs
- **ImageUploader race condition fixed** — removed `images` from `uploadFile` useCallback dependency array (was causing multi-file uploads to hang). `sort_order` now defaults server-side.
- **ImageUploader drag & drop fixed** — `handleDrop` now loops through all dropped files (was only taking first file)
- **Favorites/My List bug fixed** — `PropertyController.list` wasn't passing `ids` query param to `findFiltered`. Added `ids: req.query.ids` to filters object. Also fixed COUNT query alias mismatch (`FROM properties` → `FROM properties p`) so `p.id = ANY(...)` doesn't crash.
- **Deployed admin** to `admin.easy-rental.ca` (ImageUploader fixes)
- **Deployed public** to `easy-rental.ca` (favorites filter fix)
- **Mobile-first admin design doc written** — `docs/plans/2026-03-05-mobile-first-admin-redesign.md`. Bill is in his car all day, phone is primary device. Design: bottom tab bar, dashboard home with summary cards, property list cards with swipe status, sectioned property form with sticky save, compressed bg image on mobile (keep it, it's nice). Desktop bookshelf untouched.
- **Files modified:** `admin-dashboard/src/components/ImageUploader.jsx`, `backend/src/controllers/PropertyController.js`, `backend/src/models/PropertyModel.js`
- **Files created:** `docs/plans/2026-03-05-mobile-first-admin-redesign.md`

**Git:** Branch `master` | Last commit `dffe2a3` (sessions 28-30) | Uncommitted: sessions 31-33 changes

**Open threads:**
- NEW: Mobile-first admin redesign designed, not yet implemented (design doc ready)
- NEW: Bill wants inquiry notifications (email/push when inquiry comes in) — future feature, not in mobile redesign scope
- CHANGED: Uncommitted changeset now spans sessions 31-33
- Prior open threads unchanged (orphaned images, quality debt, missing sessions 3-7)

**Next:**
- Commit sessions 31-33
- Implement mobile-first admin redesign (follow `docs/plans/2026-03-05-mobile-first-admin-redesign.md`)
- Step 1: Shell CSS — use compressed bg on mobile instead of full-size
- Step 2: Bottom tab bar component
- Step 3: Dashboard home view

### 2026-03-04 (Session 34) — CC — Mobile-first admin redesign implementation

**What happened:**
- **Implemented steps 1-7** of mobile-first admin redesign from `docs/plans/2026-03-05-mobile-first-admin-redesign.md`
- **Step 1 (Shell CSS):** Already done — compressed bg was already in use everywhere
- **Step 2 (BottomTabBar):** New component — 3 tabs (Dashboard, Properties, Inquiries), fixed bottom 56px, safe-area padding for iPhone, unread badge support. Wired into Shell.jsx. Updated SidePanel.css and ContentPanel.css heights to account for tab bar
- **Step 3 (DashboardHome):** New component — fetches property counts + inquiry counts from API, shows summary cards (Properties with status breakdown, Inquiries with new count), quick action buttons (Add Property, View Inquiries)
- **Step 4 (Property list cards):** Added thumbnail images from primary image to PropertiesSidePanel items. Card-style borders/background on mobile. Sticky search bar. Floating "+" FAB button replaces top Add button on mobile
- **Step 5 (Property form sections):** Restructured PropertyForm into 5 collapsible sections (Basic Info, Details, Pricing, Amenities, Photos). Basic + Details open by default, others collapsed. Sticky Save/Cancel bar at bottom on mobile. Labels bumped to 14px
- **Step 6 (Property detail tweaks):** Hero image reduced to 160px on mobile. Edit button more prominent, delete button smaller/secondary
- **Step 7 (Image uploader tweaks):** Dropzone text shortened to "Tap to add photos" on mobile. Delete button moved from top-right to bottom of thumbnail. Progress bar 8px on mobile (was 4px)
- **Desktop untouched** — all changes inside `@media (max-width: 768px)` or mobile-only components
- **Build passes clean** — verified with `vite build` after each step
- **Not yet deployed** — Step 8 (phone test + deploy) pending
- **New files:** `BottomTabBar.jsx`, `BottomTabBar.css`, `DashboardHome.jsx`, `DashboardHome.css`
- **Modified files:** `Shell.jsx`, `Shell.css`, `SidePanel.css`, `ContentPanel.css`, `PropertiesSidePanel.jsx`, `PropertiesSidePanel.css`, `PropertyForm.jsx`, `PropertyForm.css`, `PropertyDetail.css`, `ImageUploader.jsx`, `ImageUploader.css`

**Git:** Branch `master` | Last commit `dffe2a3` (sessions 28-30) | Uncommitted: sessions 31-34 changes

**Open threads:**
- CHANGED: Uncommitted changeset now spans sessions 31-34 (~20 files + 4 new files)
- CHANGED: Mobile-first admin redesign — implemented (steps 1-7), needs phone test + deploy (step 8)
- Prior open threads unchanged (orphaned images, quality debt, missing sessions 3-7, inquiry notifications future feature)

**Next:**
- Deploy admin to `admin.easy-rental.ca` and test on phone (step 8)
- Commit sessions 31-34 changes
- Swipe-to-change-status on property cards (deferred from step 4 — can add later)
- Run `npm run db:backup`

### 2026-03-05 (Session 35) — CC — Mobile deploy, code review fixes, API crash fix

**What happened:**
- **Code review** of mobile-first admin build — found 2 issues to fix before deploy
- **Fix 1: DashboardHome cards** — changed from `<div role="button">` to proper `<button type="button">` elements for keyboard accessibility
- **Fix 2: Inquiry unread badge** — added `useEffect` in Shell.jsx to fetch inquiry count, passed `unreadCount` prop to BottomTabBar. Re-fetches on `refreshKey` change (e.g. after status updates)
- **BottomTabBar upgraded** — replaced emoji icons (⌂, 🏠, ✉) with clean SVG stroke icons (grid, house, chat bubble). Height increased from 56px → 68px. All spacing references updated across Shell.css, SidePanel.css, ContentPanel.css, PropertiesSidePanel.css (FAB position)
- **DashboardHome upgraded** — emoji icons → SVG icons with accent color, bigger cards (88px min-height), larger title/value text
- **Shell.css mobile fix** — `.shell__content` was `height: 100vh` on mobile, overflowing past tab bar. Changed to `height: 100%`
- **Sign out button** — already exists in hamburger menu (MobileNav drawer footer). Removed redundant attempt from DashboardHome
- **Login case-insensitive fix** — `UserModel.findByEmail` now uses `LOWER(email) = LOWER($1)` so phone auto-capitalization doesn't break login
- **API crash discovered and fixed** — `requireEditor` export was missing from `backend/src/middleware/index.js` (lost from uncommitted session 31 changes). Previous deploys had it cached; redeploy exposed the gap. Added it back, verified with `node -e "import('./backend/src/app.js')"`, redeployed
- **Deployed admin** to `admin.easy-rental.ca` (5 deploys during session — iterating on mobile UI + fixes)
- **Deployed public/API** to `easy-rental.ca` (2 deploys — case-insensitive fix, then crash fix)
- **Files modified (admin):** `BottomTabBar.jsx`, `BottomTabBar.css`, `DashboardHome.jsx`, `DashboardHome.css`, `Shell.jsx`, `Shell.css`, `SidePanel.css`, `ContentPanel.css`, `PropertiesSidePanel.css`
- **Files modified (backend):** `middleware/index.js` (restored `requireEditor`), `models/UserModel.js` (case-insensitive email)

**Git:** Branch `master` | Last commit `dffe2a3` (sessions 28-30) | Uncommitted: sessions 31-35 changes

**Open threads:**
- CHANGED: Uncommitted changeset now spans sessions 31-35 (~25 files)
- RESOLVED: Mobile-first admin redesign — deployed and phone-tested (step 8 done)
- RESOLVED: API crash — `requireEditor` restored to middleware
- NEW: `requireEditor` was silently missing — indicates uncommitted session 31 files may have other gaps. Should audit before commit
- Prior open threads unchanged (orphaned images, quality debt, missing sessions 3-7, inquiry notifications future feature, swipe-to-change-status deferred)

**Next:**
- Audit all session 31 files for any other missing changes before committing
- Commit sessions 31-35
- Run `npm run db:backup`
- Bill phone-tests editor login + property uploads

### 2026-03-05 (Session 36) — CC — Systematic debugging + fixes for both sites

**What happened:**
- **Desktop admin fix** — `DashboardHome` component rendered an invisible `shell__content` div on desktop (`z-index: 10`, `height: 100vh`) blocking nav box clicks. Added `isMobile` state via `matchMedia` listener; DashboardHome now only renders on screens ≤768px. File: `Shell.jsx`
- **Systematic debugging** of both public site and admin dashboard using Vercel runtime logs, build logs, and code audit
- **Root cause of intermittent API 500s found and fixed** — `database.js` created the pg-promise connection pool at module import time. On Vercel cold-starts, if the connection timed out during module init, every endpoint crashed. Replaced with lazy initialization via ES Proxy — pool now creates on first actual DB query, not at import. File: `backend/src/config/database.js`
- **Removed duplicate `dotenv.config()`** from `app.js` (already loaded by `config/index.js`). File: `backend/src/app.js`
- **Fixed 8 linting errors across public site:**
  - `FilterBar.jsx` — replaced `useState`+`setState` in useEffect with `useRef` for initialization flag
  - `PropertyMarkers.jsx` — removed unused `selectedId` prop
  - `Listings.jsx` — removed unused `searchParams` import, fixed 2 unused `err` in catch blocks
  - `MapView.jsx` — removed unused `loading` state, fixed 2 unused `err` in catch blocks
- **Fixed missing favicon** — `index.html` referenced nonexistent `favicon.png`, pointed to existing `logo-circle.png`. File: `public-site/index.html`
- **JS bundle size reduced** — public site went from 712KB → 488KB after removing unused `react-router-dom` `useSearchParams` import from Listings.jsx
- **Deployed public site** to `easy-rental.ca` — API healthy, 3 properties loading (verified)
- **Deployed admin** to `admin.easy-rental.ca` — desktop nav boxes clickable again
- **Files modified (backend):** `config/database.js`, `app.js`
- **Files modified (admin):** `Shell.jsx`
- **Files modified (public):** `FilterBar.jsx`, `PropertyMarkers.jsx`, `Listings.jsx`, `MapView.jsx`, `index.html`

**Git:** Branch `master` | Last commit `dffe2a3` (sessions 28-30) | Uncommitted: sessions 31-36 changes (~30 files)

**Open threads:**
- RESOLVED: Desktop admin nav blocked — fixed with isMobile guard on DashboardHome
- RESOLVED: Intermittent API 500s — fixed with lazy DB connection init
- CHANGED: Uncommitted changeset now spans sessions 31-36 (~30 files)
- Prior open threads unchanged (orphaned images, quality debt, missing sessions 3-7, inquiry notifications future feature, swipe-to-change-status deferred, audit session 31 files before commit)

**Next:**
- Audit session 31 files for any other missing changes before committing
- Commit sessions 31-36
- Run `npm run db:backup` (Bill has 3 properties with images)
- Bill phone-tests editor login + property uploads
- Run `npm run db:backup` (Bill has data in)
