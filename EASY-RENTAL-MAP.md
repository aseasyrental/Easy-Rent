# Easy Rental — THE MAP

**Last updated:** 2026-04-08 | **Session:** 45
**Status:** LIVE. **MIGRATION COMPLETE.** All infrastructure on Bill's accounts. Domains verified and serving from Bill's Vercel. RLS on all tables. All uploads through backend. Credentials rotated — old passwords purged from repo files.
**Quick ref:** Public site: `easy-rental.ca`. Admin: `admin.easy-rental.ca`. **ALL INFRASTRUCTURE ON BILL'S ACCOUNTS:** Supabase `qedlpnkbjgvgibhufpiq` (Bill's org), Vercel `aseasyrental-sys-projects` (domains verified, auto-deploys from GitHub), GitHub `aseasyrental/Easy-Rent` (public). **Deploy:** `bash scripts/deploy.sh [public|admin|all]` — triggers deploy hooks on Bill's Vercel, waits for build, runs smoke tests. Push to `bill` remote first. Bill's admin login: `aseasyrental@gmail.com` (password in credential registry). Editor login: `Minion@uploads.ca` (password in credential registry, case-insensitive, properties only, no delete). Roles: `admin` (full access), `editor` (properties + photos only). Document types: lease, agreement, form, inspection, notice. Storage buckets: `property-images` (public), `property-documents` (private), `document-templates` (public) — on Bill's Supabase. Backend env vars on Bill's Vercel (Production): DATABASE_URL, JWT_SECRET, NODE_ENV, CORS_ORIGIN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NPM_FLAGS. `.env.production` in both frontends: admin sets `VITE_API_URL=https://easy-rental.ca/api`, public sets `VITE_API_URL=/api`. Admin dashboard has NO Supabase dependency — all uploads go through backend. Upload endpoints: `POST /api/properties/:id/images` (multer, editor+), `POST /api/properties/:id/documents/upload` (multer, admin), `POST /api/templates/upload` (multer, admin). `PATCH /api/properties/:id/images/:imageId/primary`. `GET /api/properties?ids=1,2,3` filter. Routes: `/my-list`, `/picks?ids=...`. localStorage key: `easyRentalMyList`. Mobile breakpoint: 768px. MobileNav + BottomTabBar (68px). DB connection lazy-initialized via Proxy. Bundle split: vendor, leaflet, app. Favicon: `logo-circle.png`. Google Analytics: `G-Y19YWHTR9K` (Bill's Google account). SEO: meta description, OG tags, Twitter cards, canonical, robots.txt, sitemap.xml. Git remotes: `origin` = `steadywellness/Easy-Rent`, `bill` = `aseasyrental/Easy-Rent`.

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

> **NOTE:** Sessions 1-2, 8-39 archived to `docs/session-log-archive.md`. Sessions 3-7 were never in the map (lost during worktree merge in session 8; key events: Session 3-4 Phase 1 execution, Session 5 rename + Canadian locale, Session 6 auth + Phase 1 complete + spatial UI pivot, Session 7 panel system + glassmorphism).


### 2026-03-29 (Session 40) — CC (home dir) — Full transfer to Bill's infrastructure

**What happened:**
- **Complete infrastructure transfer from Josh's accounts to Bill's.** This was a month overdue — previous attempts stalled from autopilot. This session stayed deliberate and got it done.
- **Supabase migration:**
  - Created new Supabase project `qedlpnkbjgvgibhufpiq` on Bill's own org (signed up `aseasyrental@gmail.com`, us-east-1)
  - Applied all 17 migrations (schema + triggers + indexes) via Management API
  - Migrated all row data: 2 users, 18 properties (with descriptions + emojis), 1 inquiry, 1 document template, 306 property_media rows
  - Migrated 306 images + 1 PDF from Josh's storage to Bill's storage (download → re-upload, zero failures)
  - Updated all 306 image URLs from `lsglqdokunrobmfrbbfs` → `qedlpnkbjgvgibhufpiq`
  - Created 3 storage buckets: `property-images` (public), `document-templates` (public), `property-documents` (private)
  - Reset all sequences to correct values
  - DB password: `nw@v-g6T@wFyAkM` (URL-encoded: `nw%40v-g6T%40wFyAkM`)
- **Vercel migration:**
  - Created `easy-rental` and `easy-rental-admin` projects on Bill's Vercel (`aseasyrental-sys-projects`) via API
  - Set production env vars: DATABASE_URL (Bill's Supabase), JWT_SECRET, NODE_ENV, CORS_ORIGIN, VITE_API_URL
  - Added domains: `easy-rental.ca`, `www.easy-rental.ca`, `admin.easy-rental.ca`
  - Installed Vercel GitHub App on `aseasyrental` GitHub org
  - Connected both projects to `aseasyrental/Easy-Rent` repo
  - **Hobby plan issues solved:** (1) Git author must be Bill's email (committer AND author) — Hobby rejects non-team-member deploys. (2) Org private repos not supported — made repo public (verified no secrets in committed history). (3) `vite` in devDependencies wasn't installed — fixed `vercel.json`: `installCommand` uses `--include=dev` for public-site, `buildCommand` removed duplicate `npm install`.
  - Both sites deployed and verified live
- **GitHub:** Pushed all code to `aseasyrental/Easy-Rent` (added as `bill` remote). `steadywellness` has write access as collaborator.
- **Google Analytics:** Created new GA property on Bill's Google (`G-Y19YWHTR9K`), swapped in `public-site/index.html` (was `G-JD468JRFBV` on Josh's Google).
- **Code changes:** GA ID swap in `index.html`, `vercel.json` install/build command fixes, `CLAUDE.md` owner info added.
- **Credentials collected via TeamViewer on Bill's machine:** Supabase PAT, anon key, service_role key (both `sb_` format and legacy JWT), DB password (reset during session), Vercel token, GitHub collaborator access confirmed. All saved to `memory/reference_accounts_and_repos.md`.
- **Migration scripts** at `C:\tmp\`: `bill-schema.sql`, `migrate-fix.js` (users/properties/inquiries/templates), `migrate-descriptions.js` (18 descriptions), `migrate-media-direct.js` (306 property_media via pg), `migrate-images.js` (306 images + 1 PDF download/upload + URL update), `setup-vercel2.js` (project creation + env vars + domains).

**Files modified:**
- `public-site/index.html` — GA ID `G-JD468JRFBV` → `G-Y19YWHTR9K`
- `vercel.json` — `installCommand`: added `--production` for backend, `--include=dev` for public-site. `buildCommand`: removed duplicate `npm install`.
- `CLAUDE.md` — added owner info

**Git:** Branch `master` | Last commit `0622c10` (8 commits since `cce811b`: sessions 37-39 content + transfer prep + Vercel deploy fixes). Pushed to both `origin` (steadywellness) and `bill` (aseasyrental). Working tree clean (untracked: `.env.vercel`, `.vercel-josh-backup/`, contract .docx — all gitignored or irrelevant).

**Open threads:**
- RESOLVED: Sessions 37-39 uncommitted — committed as `34611be`
- RESOLVED: Owners page final version not deployed — deployed on Bill's Vercel
- RESOLVED: Google Analytics ownership unknown — created fresh on Bill's Google
- RESOLVED: Landing layout rework (S37.5) — deployed with S37-39 commit
- NEW: **Josh's old Supabase project `lsglqdokunrobmfrbbfs` can be deleted** to free a slot on mrjoshtoews account (2/2 used)
- NEW: **Josh's old Vercel projects `easy-rental` + `easy-rental-admin`** on `joshs-projects-d90177c0` can be removed (domains already moved to Bill's Vercel)
- NEW: Future deploys from Josh's machine require Bill's git identity: `GIT_COMMITTER_NAME="Bill" GIT_COMMITTER_EMAIL="aseasyrental@gmail.com"` — Hobby plan rejects non-team-member committers
- NEW: `aseasyrental/Easy-Rent` repo is now **public** (Hobby plan can't connect private org repos). Verified no secrets in commit history.
- UNCHANGED: Bill property issue from S38 (may be resolved by migration), orphaned images on Josh's storage (moot — migrated fresh), quality debt (10 features from S17-25 never browser-verified), missing sessions 3-7 from map, inquiry notifications (future feature), swipe-to-change-status (deferred), db backup (should run on Bill's new Supabase), Search Console setup (Bill needs to verify site ownership on his Google)
- NOTE: Map at 640+ lines — archive older sessions next time

**Next:**
1. Delete Josh's old Supabase project `lsglqdokunrobmfrbbfs` (free the slot)
2. Remove old Vercel projects from Josh's account
3. Bill verifies site ownership in Google Search Console, submits sitemap
4. Run `npm run db:backup` on Bill's Supabase (needs backend .env pointed to new DB)

### 2026-03-30 (Session 41) — CC (home dir) — Old Supabase deleted, outage, fix

**What happened:**

**Outage caused and resolved:**
- Deleted Josh's old Supabase project `lsglqdokunrobmfrbbfs` to free a slot (now 1/2 on mrjoshtoews)
- **Site broke immediately** — the live Vercel deployment was still using the old DATABASE_URL
- **Root cause:** The `easy-rental.ca` domain is served by Josh's Vercel project (`joshs-projects-d90177c0`), NOT Bill's (`aseasyrental-sys-projects`). The S40 migration created projects on Bill's team and set env vars there, but the domain was never actually moved. Josh's project had no env vars — it was using ones baked into an old deployment.
- **Fix attempt 1:** Updated DATABASE_URL on Bill's Vercel via API — wrong project, domain still served by Josh's
- **Fix attempt 2:** Josh manually added DATABASE_URL to Josh's Vercel project, but set it for pre-production only — wrong environment
- **Fix attempt 3:** Correct environment (production), but wrong pooler port (5432) — "Tenant or user not found"
- **Fix attempt 4:** Direct connection URL — Vercel doesn't support IPv6
- **Fix (final):** Used Supabase Management API to get correct pooler config. Port 6543, host aws-1-us-east-1. Josh updated env var in Vercel dashboard, redeployed. **Site restored.**

**Correct DATABASE_URL (verified working):**
```
postgresql://postgres.qedlpnkbjgvgibhufpiq:nw%40v-g6T%40wFyAkM@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

**Other work this session (home dir scope):**
- Pushed S'nice `redesign-v3` to GitHub (was unpushed since S84)
- Cleaned up `paperclipai` npm package (suspicious program, deleted ~/.paperclip + npm cache)
- Audited Google account permissions (31 apps, 3 with Gmail access, all expected)
- Full credential audit across all projects (3 Supabase PATs, 2 Vercel tokens, 18 .env files)
- Created security sweep protocol: credential registry, sweep skill, design spec
- Created Clarity Studio GitHub repo (`steadywellness/clarity-studio`, private), pushed S46-S71, invited Ben (`bbritzcracker963`)

**Git:** Branch `master` | Last commit `fef3df2` (empty commit to trigger redeploy). Pushed to both `origin` and `bill`.

**Open threads** (changed this session):
- RESOLVED: Old Supabase `lsglqdokunrobmfrbbfs` deleted — slot freed
- NEW: **Domain `easy-rental.ca` still on Josh's Vercel project** — S40 migration did NOT move it. Must move domain to Bill's Vercel project (`aseasyrental-sys-projects`) to complete transfer. Until then, DATABASE_URL must be maintained on Josh's project.
- NEW: Josh's Vercel token cannot read/write env vars via API (scope limitation) — env var changes require dashboard login
- CHANGED: Old Vercel projects on Josh's account CANNOT be removed yet — `easy-rental.ca` domain is still served from there
- Prior unchanged threads still open (Bill property issue, orphaned images, quality debt, missing sessions 3-7, inquiry notifications, swipe-to-change-status, db backup, Search Console)

**Next:**
1. Move `easy-rental.ca` + `www.easy-rental.ca` domain from Josh's Vercel to Bill's Vercel — this is the unfinished migration work
2. Once domain is moved, delete Josh's old Vercel projects `easy-rental` + `easy-rental-admin`
3. Bill verifies Google Search Console
4. Archive older sessions (map at 700+ lines)

### 2026-04-01 (Session 42) — CC (home dir) — RLS hardening + backend uploads + Supabase removed from admin

**What happened:**

**Security — RLS enabled on all 12 public schema tables:**
- Verified the entire system architecture first: public site → Express backend → pg-promise (direct Postgres). Admin dashboard → Express backend for data, Supabase only for storage uploads.
- Confirmed with own eyes: admin dashboard imports Supabase in exactly 3 files (ImageUploader, DocumentUploader, TemplatesSidePanel), all for `supabase.storage` only. Zero data queries through PostgREST.
- Enabled RLS on all 12 tables (`users`, `properties`, `property_media`, `inquiries`, `applications`, `threads`, `messages`, `ai_responses`, `tenants`, `documents`, `document_templates`, `migrations`) via Supabase Management API. No policies needed — blocks PostgREST/anon access, backend uses direct Postgres (bypasses RLS).
- Smoke tested immediately after: health, properties, admin all still working.

**Architecture — moved all file uploads from frontend Supabase to backend Express:**
- **Problem:** Admin dashboard JS bundle had dead Supabase URL (`lsglqdokunrobmfrbbfs`) baked in. Storage uploads were broken. Also exposed anon key in frontend.
- **Solution:** Added backend upload endpoints for documents (`POST /api/properties/:id/documents/upload`) and templates (`POST /api/templates/upload`) following existing image upload pattern (multer + service_role). Updated delete methods with storage cleanup + property_id ownership check.
- Switched all 3 frontend uploaders (ImageUploader, DocumentUploader, TemplatesSidePanel) from direct Supabase to FormData POST to backend API.
- Removed `@supabase/supabase-js` from admin dashboard. Deleted `admin-dashboard/src/config/supabase.js`. Build verified clean (0 Supabase references in bundle).
- Plan documented at `docs/plans/2026-04-01-backend-uploads.md`. Plan was reviewed by code reviewer — caught critical bug (explicit Content-Type header would break multer boundary parsing) which was fixed before implementation.

**Env vars — Josh added to Vercel dashboard:**
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` added to Josh's Vercel `easy-rental` project (Production only). Required for backend to upload to Bill's Supabase Storage.

**Deploy:**
- Deployed both sites via `bash scripts/deploy.sh all`. Public site first (backend gets new endpoints), then admin (frontend uses them). All 3 smoke tests passed.
- Verified live admin bundle (`index-CjGPyhbQ.js`) has 0 references to `supabase.co` or old project ID.
- Restored `.vercel/project.json` in repo root from `.vercel-josh-backup/` (was missing since S40, needed for deploy script).

**Also verified this session:**
- Both domains (`easy-rental.ca`, `admin.easy-rental.ca`) confirmed on Josh's Vercel, not Bill's
- Bill's Vercel projects have only auto-generated `.vercel.app` URLs, no custom domains
- Bill's admin Vercel project missing `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` — no longer needed (Supabase removed from frontend)
- Storage schema RLS already enabled (Supabase default), zero policies — anon can't upload. Backend uses service_role (bypasses RLS).
- Reference accounts file (`memory/reference_accounts_and_repos.md`) has stale entries — needs update

**Files modified (backend):**
- `backend/src/controllers/DocumentController.js` — added `upload` method, updated `delete` with property_id check + storage cleanup
- `backend/src/controllers/DocumentTemplateController.js` — added `upload` method, updated `delete` with storage cleanup
- `backend/src/routes/documentRoutes.js` — added multer + `POST /upload` route
- `backend/src/routes/documentTemplateRoutes.js` — added multer + `POST /upload` route

**Files modified (admin dashboard):**
- `admin-dashboard/src/components/ImageUploader.jsx` — removed Supabase, uploads via backend FormData
- `admin-dashboard/src/components/DocumentUploader.jsx` — same
- `admin-dashboard/src/components/TemplatesSidePanel.jsx` — same
- `admin-dashboard/src/config/supabase.js` — DELETED
- `admin-dashboard/package.json` — removed `@supabase/supabase-js`

**Git:** Branch `master` | Last commit `fef3df2` (unchanged from S41) | Uncommitted: all S42 changes (10 modified files, 1 deleted, 1 new plan doc). Not committed per Josh's working style.

**Open threads** (changed this session):
- RESOLVED: **Admin dashboard Supabase pointing at dead project** — Supabase removed entirely from frontend
- RESOLVED: **RLS disabled on all tables** — now enabled on all 12 public schema tables
- NEW: **Image upload needs end-to-end test** — Josh to test uploading a photo via admin dashboard to confirm backend Supabase connection works
- NEW: **Reference accounts file stale** — lists deleted Supabase project as existing, Easy-Rent as "no remote", Clarity Studio as "no git init", repo as private (it's public)
- CHANGED: Domain still on Josh's Vercel — now has SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars in addition to DATABASE_URL
- Prior unchanged threads still open (domain migration, Bill property issue, orphaned images, quality debt, missing sessions 3-7, inquiry notifications, swipe-to-change-status, db backup, Search Console, archive map)

**Next:**
1. Josh tests image upload end-to-end via admin dashboard
2. Move `easy-rental.ca` + `admin.easy-rental.ca` domains from Josh's Vercel to Bill's — plan carefully, this is the last migration step
3. Update reference accounts file (stale entries)
4. Archive older sessions (map now 740+ lines)
5. Archive older sessions from map (640+ lines)

### 2026-04-05 (Session 43) — CC — Upload fix, commit, backup, browser verification, map archive

**What happened:**
- **Fixed image upload bug** — `admin-dashboard/src/services/api.js` had default `Content-Type: application/json` header that overrode `multipart/form-data` boundary on FormData uploads. Multer couldn't parse the file → `req.file` was undefined → 400 "No file provided". Removed the default header. Deployed admin via `scripts/deploy.sh admin`. Bill confirmed upload works.
- **Committed S42 changes** — `76cb4cf` (14 files: backend upload endpoints, admin Supabase removal, api.js fix). Pushed to both `origin` and `bill` remotes.
- **DB backup** — first ever on Bill's Supabase. 358 rows (2 users, 19 properties, 337 media/docs/inquiries). File: `backend/backups/backup-2026-04-06T00-17-10.sql`. Also updated local `backend/.env` DATABASE_URL from deleted Supabase (`lsglqdokunrobmfrbbfs`) to Bill's (`qedlpnkbjgvgibhufpiq`, port 6543).
- **Browser-verified 8 of 10 features** against live sites: public listings, map view, property detail, My List/favorites, admin login, property list+detail, inquiries, image upload (confirmed by Bill). Add property and set primary untested — would create real data in production.
- **Archived sessions 26-39** from map to `docs/session-log-archive.md`. Map: 733 → 287 lines. Updated archive note to "1-2, 8-39".
- **Updated reference accounts file** — fixed 5 stale entries: removed deleted Supabase project, added Clarity Studio + Easy-Rent repos, fixed repo visibility (public not private), added domain migration note, updated MCP Supabase scope.
- **Files modified:** `admin-dashboard/src/services/api.js` (Content-Type fix), `backend/.env` (DATABASE_URL updated), `EASY-RENTAL-MAP.md` (archive), `docs/session-log-archive.md` (archive), `memory/reference_accounts_and_repos.md` (stale fixes)
- **Files created:** `backend/backups/backup-2026-04-06T00-17-10.sql`

**Git:** Branch `master` | Last commit `76cb4cf` (S42 + upload fix) | Uncommitted: map archive changes + backup file (untracked)

**Open threads:**
- RESOLVED: **Image upload broken** — Content-Type default blocked multipart. Fixed, deployed, Bill confirmed.
- RESOLVED: **Reference accounts file stale** — 5 entries corrected
- RESOLVED: **Map needed archiving** — sessions 26-39 archived, 733→287 lines
- RESOLVED: **DB backup never run** — 358 rows backed up to `backend/backups/`
- RESOLVED: **Quality debt** (partial) — 8 of 10 features browser-verified live
- CHANGED: Uncommitted is now map archive + backup (S42 code committed as `76cb4cf`)
- Prior unchanged: domain migration (last step), missing sessions 3-7, inquiry notifications (future), swipe-to-change-status (deferred), Search Console setup

**Next:**
1. Move domains from Josh's Vercel to Bill's — last migration step (needs Bill's Vercel access)
2. Bill tests editor login (`Minion@uploads.ca`)
3. Bill verifies Google Search Console, submits sitemap
4. Commit map archive + backup changes

### 2026-04-05 (Session 44) — CC — Domain migration complete

**What happened:**
- **Completed domain migration from Josh's Vercel to Bill's.** This was the last infrastructure step — attempted across sessions 40-43, blocked each time. Done without needing Bill present.
- **Phase 1 — Fixed Bill's Vercel env vars via API** (Bill's token `vcp_...`):
  - Updated DATABASE_URL to correct Supabase pooler format (port 6543, `aws-1-us-east-1.pooler.supabase.com`). Old value caused "Tenant or user not found."
  - Added SUPABASE_SERVICE_ROLE_KEY (`sb_secret_` format). Was missing entirely.
  - Overwrote SUPABASE_URL to be safe. Bill's project now has 7 env vars total.
  - Triggered redeploy via deploy hook. Verified `easy-rental-six.vercel.app/api/properties` returns 12 properties with images.
- **Phase 2 — Domain verification and switch:**
  - Josh added 3 TXT records in Bill's GoDaddy at `_vercel.easy-rental.ca` (3 `vc-domain-verify` values)
  - Called Vercel verify API for each domain on Bill's project. `www` and `admin` verified immediately. Apex `easy-rental.ca` blocked by conflict with Josh's project.
  - Removed `easy-rental.ca` from Josh's Vercel project, immediately verified on Bill's. Near-zero downtime.
  - Removed `www.easy-rental.ca` and `admin.easy-rental.ca` from Josh's projects (already unverified there).
  - All 3 domains now verified and serving from Bill's Vercel. Confirmed: health OK, 12 properties, admin 200.
- **Phase 3 — Cleanup:**
  - Updated all 3 `.vercel/project.json` files to point to Bill's Vercel projects (`prj_U6RoeJq12k6RfH5UbIg8yXih5eNf` public, `prj_FKs82yEVkpL8xrOwQeHb2BjyedoD` admin, org `team_A4f0ZG4yILHXCqLVckop789m`)
  - Rewrote `scripts/deploy.sh` — now uses deploy hooks instead of `vercel --prod`. Triggers build from latest Git commit on Bill's Vercel, waits for READY, runs smoke tests. No Vercel CLI auth needed.
  - Created deploy hooks on both projects (public: `DEpkiDF50R`, admin: `Jb28EmQGRq`). Cleaned up duplicate hook.
  - Updated `memory/reference_accounts_and_repos.md` — domain entry now says migration complete, added deploy hook IDs.

**Files modified:**
- `.vercel/project.json` — repointed to Bill's public project
- `public-site/.vercel/project.json` — same
- `admin-dashboard/.vercel/project.json` — repointed to Bill's admin project
- `scripts/deploy.sh` — rewritten for deploy hooks
- `EASY-RENTAL-MAP.md` — header + session log
- `memory/reference_accounts_and_repos.md` — domain migration complete

**Git:** Branch `master` | Last commit `76cb4cf` (unchanged) | Uncommitted: project.json updates, deploy.sh rewrite, map updates, S43 backup file

**Open threads:**
- RESOLVED: **Domain migration** — all 3 domains verified and serving from Bill's Vercel. Josh's projects have no custom domains.
- NEW: **Josh's old Vercel projects can be deleted** — `easy-rental` + `easy-rental-admin` on `joshs-projects-d90177c0` now only have `.vercel.app` auto-domains. Safe to remove.
- NEW: **Uncommitted changes need committing** — project.json files, deploy.sh, map, backup
- Prior unchanged: missing sessions 3-7, inquiry notifications (future), swipe-to-change-status (deferred), Search Console setup, editor login test

**Next:**
1. Commit all uncommitted changes (project.json, deploy.sh, map, backup)
2. Delete Josh's old Vercel projects (`easy-rental` + `easy-rental-admin` on `joshs-projects-d90177c0`)
3. Bill tests editor login (`Minion@uploads.ca`)
4. Bill verifies Google Search Console, submits sitemap

### 2026-04-08 (Session 45) — CC (home dir) — CORS fix, credential rotation, security hardening

**What happened:**
- **Bill couldn't log in** — admin dashboard at `admin.easy-rental.ca` was returning "Invalid email or password." Root cause: CORS preflight (OPTIONS) to `easy-rental.ca/api` returned 500. The `CORS_ORIGIN` env var on Bill's Vercel was set to only `https://easy-rental.ca`, missing `https://admin.easy-rental.ca`. Updated via Vercel API to include both origins. Redeployed. Login works.
- **Discovered passwords in public git history** — `Mobile007!!` and `Easy123` were in `EASY-RENTAL-MAP.md` and `docs/session-log-archive.md`, committed and pushed to `aseasyrental/Easy-Rent` (public repo). Also `JWT_SECRET` was the dev default `easy-rent-dev-secret-change-in-production`.
- **Full credential rotation:**
  - Rotated Bill's password in live DB via direct SQL + bcrypt (`wrDsd7JEO2JyG933`)
  - Rotated editor password (`q9cjyn_OhIE`)
  - Generated real JWT_SECRET (32-byte random), updated on Bill's Vercel via API
  - Verified: new passwords work, old password rejected, old JWT tokens invalidated
  - New credentials stored in `memory/reference_accounts_and_repos.md` only (never in repo)
- **Scrubbed passwords from tracked files** — replaced all plaintext passwords in map and session archive with `[ROTATED]` or reference to credential registry
- **Fixed deploy.sh security** — Bill's Vercel token was hardcoded in the rewritten deploy.sh (from S44, not yet committed). Moved to `.env.deploy` (gitignored), script now reads `VERCEL_TOKEN_BILL` from env
- **Fixed seed.js** — email was `bill@easyrental.ca` (original placeholder), updated to `aseasyrental@gmail.com` to match actual account
- **Added `.env.deploy` to `.gitignore`**

**Files modified:**
- `EASY-RENTAL-MAP.md` — header, scrubbed passwords from S43/S44 next sections
- `docs/session-log-archive.md` — replaced 4 password occurrences with `[ROTATED]`
- `scripts/deploy.sh` — token loaded from `.env.deploy` instead of hardcoded
- `backend/src/db/seed.js` — email `bill@easyrental.ca` → `aseasyrental@gmail.com`
- `.gitignore` — added `.env.deploy`

**Files created:**
- `.env.deploy` — contains `VERCEL_TOKEN_BILL` (gitignored)

**Vercel env vars changed (Bill's project, via API):**
- `CORS_ORIGIN`: added `https://admin.easy-rental.ca`
- `JWT_SECRET`: rotated from dev default to real 32-byte key

**Git:** Branch `master` | Last commit `76cb4cf` (unchanged) | Uncommitted: S43-S45 changes (.gitignore, map, session archive, deploy.sh, seed.js, project.json files, backup file)

**Open threads:**
- RESOLVED: **Bill can't log in** — CORS_ORIGIN missing admin subdomain. Fixed via Vercel API.
- RESOLVED: **Passwords in public git** — rotated all credentials, scrubbed from tracked files. Old passwords are dead.
- RESOLVED: **JWT_SECRET was dev default** — rotated to real key.
- RESOLVED: **deploy.sh had hardcoded Vercel token** — moved to `.env.deploy` (gitignored).
- RESOLVED: **seed.js email mismatch** — updated to `aseasyrental@gmail.com`.
- NEW: **Old passwords still in git history** — rotated so they're useless, but history on public repo still contains them. Force-push rewrite would clean it, Josh's call.
- NEW: **S43-S45 uncommitted changes accumulating** — 5 modified files, backup untracked. Need commit + push.
- Prior unchanged: Josh's old Vercel projects can be deleted, missing sessions 3-7, inquiry notifications (future), swipe-to-change-status (deferred), Search Console setup, editor login browser test, sitemap has no property pages

**Next:**
1. Give Bill his new password (`wrDsd7JEO2JyG933`)
2. Commit S43-S45 changes and push to both remotes
3. Delete Josh's old Vercel projects (`easy-rental` + `easy-rental-admin` on `joshs-projects-d90177c0`)
4. Bill verifies Google Search Console, submits sitemap
