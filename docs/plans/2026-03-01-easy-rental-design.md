# Easy Rental — Design Document

**Date:** 2026-03-01
**Status:** Approved
**Approach:** Two separate frontends, one shared backend (Approach A)

---

## Mission Statement

*Clarity at a glance. Simplicity in every step.*

Easy Rental exists to eliminate the friction between people who need a home and the person who can provide one.

**Design Principles:**
1. Clarity over cleverness — if it needs explanation, it's wrong
2. Zero sludge — every interaction should feel like one step, not five
3. Clean and open — white space is a feature, not wasted space
4. Glitch-free or don't ship — reliability is a design choice

---

## Users

**Bill (Admin):** Property manager, moderate technical comfort. Manages long-term residential rentals. Needs organization, automation, and a dashboard that gives clarity at a glance. Manages both new leads and active tenants.

**Renters (Public):** Prospective tenants looking for a place to live. Need absolute clarity and simplicity. Browse, inquire, apply — no guesswork.

---

## Architecture

### Approach: Two Separate Apps

- `public-site/` — Renter-facing React app. Clean, minimal, fast.
- `admin-dashboard/` — Bill's React app. Feature-rich, flexible views.
- `backend/` — Single Express API serving both apps.
- `shared/` — Types, constants, validation rules shared across apps.

### Tech Stack
- **Frontend (both):** React 18 + Vite + React Router + Axios
- **Backend:** Express.js + PostgreSQL (pg-promise) + JWT auth
- **Infrastructure:** Supabase (PostgreSQL 17, session pooler, us-east-1)
- **Maps:** TBD provider (Mapbox / Google Maps / Leaflet) — map-first listing search
- **AI:** TBD provider — for auto-responses and draft suggestions
- **Email:** TBD provider (SendGrid/Resend) — for message notifications
- **File Storage:** TBD (local/S3) — for property media and documents

---

## Project Structure

```
Easy-Rental/
├── backend/
│   ├── src/
│   │   ├── config/           # DB, JWT, env config
│   │   ├── controllers/      # Auth, Properties, Bookings, Messages, Tenants
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── models/           # DB schemas + queries
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # AI responder, email bridge, file uploads
│   │   └── utils/
│   └── tests/
│
├── public-site/
│   └── src/
│       ├── components/       # ListingCard, InquiryForm, ApplicationForm, Chat
│       ├── pages/            # Home, Listings, ListingDetail, Apply, Messages, Contact
│       ├── services/         # API client
│       └── hooks/
│
├── admin-dashboard/
│   └── src/
│       ├── components/       # PropertyEditor, LeadCard, TenantCard, MessageThread, AIPanel
│       ├── pages/            # Dashboard, Properties, Leads, Roster, Messages, Settings
│       ├── services/         # API client
│       └── hooks/
│
├── shared/                   # Types, constants, validation rules
└── EASY-RENTAL-MAP.md
```

---

## Database Schema

### users
- id (SERIAL PK)
- name (VARCHAR 255, NOT NULL)
- email (VARCHAR 255, UNIQUE, NOT NULL)
- password (VARCHAR 255, NOT NULL)
- role (VARCHAR 20, `admin` | `tenant`)
- phone (VARCHAR 20)
- created_at, updated_at (TIMESTAMP)

### properties
- id (SERIAL PK)
- title (VARCHAR 255, NOT NULL)
- description (TEXT)
- address (VARCHAR 255, NOT NULL)
- city (VARCHAR 100)
- province (VARCHAR 50)
- postal_code (VARCHAR 10)
- latitude (DECIMAL 10,7) — for map search
- longitude (DECIMAL 10,7) — for map search
- price (DECIMAL 10,2, NOT NULL)
- bedrooms (INTEGER)
- bathrooms (INTEGER)
- sqft (INTEGER)
- amenities (JSONB)
- availability_date (DATE)
- lease_term_months (INTEGER)
- deposit_amount (DECIMAL 10,2)
- neighborhood_info (TEXT)
- status (VARCHAR 20, `available` | `occupied` | `pending`)
- owner_id (FK users, NOT NULL)
- created_at, updated_at (TIMESTAMP)

### property_media
- id (SERIAL PK)
- property_id (FK properties, NOT NULL)
- type (VARCHAR 10, `photo` | `video`)
- url (VARCHAR 500, NOT NULL)
- sort_order (INTEGER, DEFAULT 0)
- created_at (TIMESTAMP)

### inquiries
- id (SERIAL PK)
- property_id (FK properties, NOT NULL)
- name (VARCHAR 255, NOT NULL)
- email (VARCHAR 255, NOT NULL)
- phone (VARCHAR 20)
- message (TEXT)
- type (VARCHAR 20, `question` | `viewing_request`)
- status (VARCHAR 20, `new` | `responded` | `scheduled` | `closed`)
- created_at, updated_at (TIMESTAMP)

### applications
- id (SERIAL PK)
- property_id (FK properties, NOT NULL)
- user_id (FK users, nullable)
- name (VARCHAR 255, NOT NULL)
- email (VARCHAR 255, NOT NULL)
- phone (VARCHAR 20)
- desired_move_in (DATE)
- status (VARCHAR 20, `submitted` | `under_review` | `approved` | `denied`)
- created_at, updated_at (TIMESTAMP)

### threads
- id (SERIAL PK)
- property_id (FK properties, nullable)
- inquiry_id (FK inquiries, nullable)
- application_id (FK applications, nullable)
- subject (VARCHAR 255)
- created_at, updated_at (TIMESTAMP)

### messages
- id (SERIAL PK)
- thread_id (FK threads, NOT NULL)
- sender_id (FK users, NOT NULL)
- recipient_id (FK users, NOT NULL)
- body (TEXT, NOT NULL)
- is_ai_generated (BOOLEAN, DEFAULT false)
- read_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)

### tenants
- id (SERIAL PK)
- user_id (FK users, NOT NULL)
- property_id (FK properties, NOT NULL)
- lease_start (DATE, NOT NULL)
- lease_end (DATE, NOT NULL)
- rent_amount (DECIMAL 10,2, NOT NULL)
- status (VARCHAR 20, `active` | `notice_given` | `moved_out`)
- notes (TEXT)
- created_at, updated_at (TIMESTAMP)

### documents
- id (SERIAL PK)
- property_id (FK properties, nullable)
- title (VARCHAR 255, NOT NULL)
- file_url (VARCHAR 500, NOT NULL)
- type (VARCHAR 20, `form` | `agreement` | `lease`)
- created_at (TIMESTAMP)

### ai_responses
- id (SERIAL PK)
- thread_id (FK threads)
- inquiry_id (FK inquiries, nullable)
- prompt_context (TEXT)
- response (TEXT)
- was_sent_automatically (BOOLEAN, DEFAULT false)
- created_at (TIMESTAMP)

---

## API Endpoints (High Level)

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout

### Properties (public)
- GET /api/properties — list available properties (with filters, radius search by lat/lng)
- GET /api/properties/:id — property detail with media

### Properties (admin)
- POST /api/properties — create property
- PUT /api/properties/:id — update property
- DELETE /api/properties/:id — remove property
- POST /api/properties/:id/media — upload photos/videos
- DELETE /api/properties/:id/media/:mediaId — remove media

### Inquiries
- POST /api/inquiries — submit inquiry (public)
- GET /api/inquiries — list all inquiries (admin)
- PUT /api/inquiries/:id — update status (admin)

### Applications
- POST /api/applications — submit application (public)
- GET /api/applications — list all applications (admin)
- PUT /api/applications/:id — update status (admin)

### Messages
- GET /api/threads — list threads (authenticated)
- GET /api/threads/:id/messages — get messages in thread
- POST /api/threads/:id/messages — send message
- PUT /api/messages/:id/read — mark as read

### Tenants (admin)
- GET /api/tenants — list all tenants
- POST /api/tenants — add tenant to roster
- PUT /api/tenants/:id — update tenant info
- GET /api/tenants/:id — tenant detail with history

### Documents (admin)
- POST /api/documents — upload form/agreement
- GET /api/documents — list documents
- GET /api/documents/:id — download document
- DELETE /api/documents/:id — remove document

### AI (admin)
- POST /api/ai/draft — generate draft response for an inquiry/message
- POST /api/ai/auto-respond — trigger auto-response for routine questions
- GET /api/ai/responses — audit trail of AI-generated responses

### Dashboard (admin)
- GET /api/dashboard/summary — counts, statuses, urgent items
- GET /api/dashboard/pipeline — leads by stage
- GET /api/dashboard/today — what needs attention today

---

## Locale

- **Country:** Canada (`.ca` domain)
- **Region:** British Columbia — default view is Lower Mainland, properties may span across BC
- **Address fields:** province (not state), postal_code (not zip)
- **Geocoding:** Addresses auto-converted to lat/lng when Bill adds a property

---

## Public Site — Page Flow

1. **Home** — Hero with map search, featured listings, clear CTAs
2. **Listings (Map View)** — Interactive map centered on Lower Mainland. Renter picks area + radius, sees pins for all listings in range. List panel alongside map shows matching properties. This is the primary search experience.
3. **Listing Detail** — Full info, photo/video gallery, amenities, forms access, inquiry button, apply button
4. **Inquiry Form** — Ask a question or request a viewing
5. **Application** — Submit rental application, access Bill's forms/agreements
6. **Messages** — In-app conversation with Bill (requires account)
7. **Contact** — General contact info for Bill

---

## Admin Dashboard — Views

1. **Dashboard Home** — "Clarity at a glance" summary: new inquiries count, pending applications, viewings today, vacant properties, AI auto-responses sent
2. **Properties** — All properties with status badges. Click into property for full management (edit, media, linked inquiries/applications/tenant)
3. **Leads Pipeline** — Kanban or list view: New → Responded → Viewing Scheduled → Application → Leased
4. **Roster** — Active tenants: who's where, lease dates, contact info, communication history
5. **Messages** — All threads. AI drafts visible inline. Bill can edit and send, or let AI auto-respond
6. **Settings** — Profile, AI preferences (which questions to auto-respond), notification preferences

---

## AI Layer

- **Auto-respond:** Matches incoming questions against property data Bill has entered. "Is this still available?" → checks property status and replies. "Do you allow pets?" → checks amenities field.
- **Draft suggestions:** For complex inquiries, AI drafts a response Bill can review, edit, and send.
- **Bill controls:** Settings page lets Bill define which question types get auto-responded vs. drafted.
- **Audit trail:** Every AI response is logged (ai_responses table) so Bill can review what was sent.

---

## Messaging + Email Bridge

- All conversations happen in-app via threads/messages tables.
- Email notifications sent when a new message arrives (both directions).
- Renter gets email: "Bill replied to your inquiry about 123 Main St" with link to in-app thread.
- Bill gets email: "New message from Jane about 123 Main St" with link to admin dashboard thread.
- No reply-via-email in v1 — all replies happen in-app.

---

## Competitive Features Tracking

| Feature | Phase | Notes |
|---------|-------|-------|
| Showing scheduling + confirmations | 1 | Core — calendar-based viewing slots |
| Lead qualification via AI | 1 | AI screens routine questions |
| In-app messaging + email notify | 1 | Core communication |
| Property media (photo + video) | 1 | Upload and gallery |
| Forms/agreements delivery | 1 | PDF upload + access |
| Post-showing feedback | 2 | Survey after viewing |
| Listing syndication (Zillow etc.) | 2 | API integrations |
| Self-guided tours / lockboxes | Skip | Hardware dependency |

---

## Decisions Log

| Decision | Rationale |
|----------|-----------|
| Two separate frontends | Different UX goals — public needs minimal, admin needs rich |
| Map-first listings | Location is the #1 filter for renters — map IS the search experience |
| Canadian locale (BC) | Bill operates in Lower Mainland / BC — province + postal_code, not state + zip |
| Long-term residential only | Bill's business model |
| In-app messaging + email notify | Centralized threads, nobody misses messages |
| AI auto-respond + draft | Reduces busywork, Bill stays in control |
| Bill's own forms/agreements | App delivers them, doesn't reinvent paperwork |
| Flexible dashboard views | Property, pipeline, and daily urgency views |
| Dashboard manages leads AND roster | Full tenant lifecycle |
| No reply-via-email v1 | Simplifies email bridge, replies in-app only |

---

## Open Questions (to resolve during implementation)

- AI provider (OpenAI / Anthropic / local)
- Email service (SendGrid / Resend)
- Map provider (Mapbox / Google Maps / Leaflet) — for map-first listing search + geocoding
- File storage (local filesystem / S3 / Cloudinary)
- Showing scheduler UX (Bill sets available slots? Calendar picker?)
- Mobile responsiveness priority vs. dedicated mobile experience
