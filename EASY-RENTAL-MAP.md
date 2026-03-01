# Easy Rental — THE MAP

**Last updated:** 2026-03-01 | **Session:** 2
**Status:** Design complete, implementation plan written, ready to build
**Quick ref:** Approach A approved (two frontends, one backend). Design doc + full implementation plan saved. Next: execute Phase 1 (restructure, DB, auth).

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
- Execute Phase 1: project restructure, database migrations, auth system, admin seeding
