# Admin Dashboard + Deployment Design

**Date:** 2026-03-03
**Status:** Approved
**Scope:** Build Bill's admin dashboard for launch, deploy everything to Vercel, connect easy-rental.ca via GoDaddy DNS

---

## Architecture

```
easy-rental.ca            → public site (Vercel project 1)
admin.easy-rental.ca      → admin dashboard (Vercel project 2)
easy-rental.ca/api/*      → Express serverless (bundled with public site project)
Supabase                  → PostgreSQL + Storage
GoDaddy                   → DNS only
```

One repo. Two Vercel projects. One Express API. One database.

### Repo Changes

```
Easy-Rent/
├── api/
│   └── index.js              ← NEW: 3-line wrapper exporting Express app for Vercel
├── vercel.json               ← NEW: public site build + API routing config
├── admin-dashboard/
│   └── vercel.json           ← NEW: admin dashboard build config
├── public-site/              (unchanged)
├── backend/                  (unchanged)
└── ...
```

### GoDaddy DNS Records

| Type  | Name    | Value                  |
|-------|---------|------------------------|
| A     | `@`     | `76.76.21.21`          |
| CNAME | `www`   | `cname.vercel-dns.com` |
| CNAME | `admin` | `cname.vercel-dns.com` |

Vercel handles SSL automatically.

### Environment Variables (Vercel Dashboard)

**Public site project:**

| Variable              | Value                        |
|-----------------------|------------------------------|
| `DATABASE_URL`        | Supabase connection string   |
| `JWT_SECRET`          | Strong random production key |
| `JWT_EXPIRE`          | `7d`                         |
| `SUPABASE_URL`        | Supabase project URL         |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase dashboard |

**Admin dashboard project:**

| Variable               | Value                              |
|------------------------|------------------------------------|
| `VITE_API_URL`         | `https://easy-rental.ca/api`       |
| `VITE_SUPABASE_URL`    | Supabase project URL               |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable anon key    |

Frontend `VITE_API_URL` in the public site goes away — API is same-origin.

### CORS Update

Add `https://admin.easy-rental.ca` to the backend's allowed origins for the admin dashboard cross-origin calls.

---

## Admin Dashboard — Login

Full-viewport bookshelf background (`bg-environment.png`) with a single centered glass panel.

- Email + password fields, "Sign In" button
- On success: JWT in localStorage, redirect to Shell
- On failure: inline error ("Invalid email or password")
- No registration — Bill is the only admin, already seeded in the database
- No forgot password, no OAuth

---

## Admin Dashboard — Properties Management

Lives in the existing Shell. SidePanel (left) = list, ContentPanel (right) = detail/edit.

### SidePanel (already built, wire to real API)

- Tabs: All / Available / Occupied / Maintenance (maps to `status` filter on GET /api/properties)
- Each property card shows: title, address, price, status badge
- Listing health indicators (subtle, not nagging):
  - Dimmed camera icon if zero images
  - Dimmed text icon if no description
  - Amber dot if availability date is in the past
- Inquiry count on each card — Bill sees which properties get attention
- "Add Property" button at top
- Click a property → ContentPanel opens

### ContentPanel — View Mode

- Property details: title, address, price, beds/baths/sqft, type, description, amenities
- Image gallery: thumbnails with primary image highlighted
- Status badge + quick toggle (Available / Occupied / Maintenance)
- "See what renters see" preview button — shows the listing as it appears on the public site
- Edit button, Archive button (soft delete)
- Inquiry count for this property

### ContentPanel — Edit Mode

Same panel, switches in place.

- Form fields for all property attributes
- Image upload zone: drag-and-drop or click to select
  - Files upload directly to Supabase Storage (`property-images` bucket)
  - On success, frontend calls Express API to save metadata (URL, property_id, is_primary)
  - Thumbnails appear immediately after upload
- Drag thumbnails to reorder
- Click thumbnail to set as primary
- X on thumbnail to delete
- Save / Cancel buttons
- Save transitions smoothly back to view mode showing the changes — no toast, Bill sees the result

### ContentPanel — Add Property

Same edit form with empty fields. Guided empty state: "Start with the basics — address, price, and a few photos."

### Empty State

First time Bill opens Properties with nothing added: "Add your first listing" with a clear CTA. Not "No properties found."

### Delete Behavior

Soft delete — "Archive" button with confirmation showing property title and address. Archived properties move to a hidden tab, not permanently destroyed.

---

## Admin Dashboard — Inquiries

When a renter submits an inquiry on the public site, Bill sees it here.

### SidePanel (Messages section)

- Tabs: New / Read / All
- Unread count badge on "New" tab
- Each inquiry card: renter name, property title, relative timestamp ("2 hours ago"), first line of message
- New inquiries get a subtle glow — noticeable without being loud
- Click → ContentPanel opens

### ContentPanel

- Renter info: name, email (clickable mailto link), which property
- Full message
- Property quick-link — tap property name to jump to that listing
- Mark as read/unread toggle
- Archive button
- If unresponded for 24+ hours: gentle "waiting" indicator — awareness, not shame

### Email Reply (launch scope)

For launch, Bill clicks the renter's email to reply from his own email client. The dashboard organizes inquiries — it doesn't replace Bill's inbox.

In-app messaging and email sending (SendGrid/Resend) comes in a later phase.

---

## Admin Dashboard — Schedule & Leads

Not built for launch. These tabs already exist in the SidePanel with placeholder data.

Replace placeholder data with friendly "Coming soon" empty states so nothing feels broken or fake.

---

## Image Upload — Direct to Supabase Storage

### Flow

1. Bill drops files onto upload zone in admin dashboard
2. Admin dashboard uploads directly to Supabase Storage using `@supabase/supabase-js`
3. On upload success, admin dashboard calls `POST /api/properties/:id/images` with the file URL and metadata
4. Express saves the metadata record in `property_media` table

### Changes Required

- Create `property-images` bucket in Supabase Storage dashboard
- Set RLS policy: authenticated users can upload/delete, public can read
- Simplify the existing `POST /api/properties/:id/images` endpoint to accept a URL + metadata instead of a multipart file upload
- Add `@supabase/supabase-js` to admin-dashboard dependencies
- Remove multer from the image upload flow (keep it in backend deps for now, remove later)

### Why Direct Upload

- No 4.5MB serverless body limit
- Faster uploads (no Express middleman)
- Supabase Storage handles CDN, caching, transforms
- Simpler backend (metadata only, no file handling)

---

## Public Site Frontend Change

The public site currently has `VITE_API_URL` pointing to `http://localhost:5000/api`. In production on Vercel, the API is same-origin.

- Change API base URL to use relative path: `/api` instead of a full URL
- Fallback to `http://localhost:5000/api` in development via env var

---

## What's NOT in This Design

- Admin registration / forgot password (Bill is the only user, seeded)
- In-app messaging / email sending (later phase)
- Schedule management (later phase)
- Leads pipeline (later phase)
- Mobile-specific admin layout (Bill uses desktop)
- Analytics / reporting
