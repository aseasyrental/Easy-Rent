# Documents & Templates Design

**Date:** 2026-03-03
**Status:** Approved

## Summary

Two new features for the admin dashboard: global document templates (reusable blank files) and per-property document uploads (filled/signed files). Plus a "Price" to "Rent" label rename across both sites.

## 1. Document Templates (Global)

New "Templates" nav item in admin Shell. Simple file manager for reusable blanks (lease templates, checklists, forms).

**UI:**
- List view: title, category, upload date, file size
- Upload: drag-and-drop or click, with title and category fields
- Actions: download, delete
- Categories: `lease`, `agreement`, `form`, `inspection`, `notice`

**Storage:**
- Supabase Storage bucket: `document-templates`
- Path: `{uuid}.{ext}`

**Database:**
- New table `document_templates`:
  - `id` SERIAL PRIMARY KEY
  - `title` VARCHAR(255) NOT NULL
  - `category` VARCHAR(20) NOT NULL CHECK (category IN ('lease', 'agreement', 'form', 'inspection', 'notice'))
  - `file_url` VARCHAR(500) NOT NULL
  - `file_name` VARCHAR(255) NOT NULL
  - `file_size` INTEGER
  - `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**API:**
- `GET /api/templates` — list all templates
- `POST /api/templates` — upload template (admin only)
- `DELETE /api/templates/:id` — delete template (admin only)

## 2. Property Documents (Per-Property)

New "Documents" section inside property detail view, below the image gallery. Admin uploads filled/signed documents tied to a specific property.

**UI:**
- List view: title, type, upload date, download/delete actions
- Upload: drag-and-drop or click, with title and type fields
- Types: `lease`, `agreement`, `form`, `inspection`, `notice`

**Storage:**
- Supabase Storage bucket: `property-documents`
- Path: `{propertyId}/{uuid}.{ext}`

**Database:**
- Uses existing `documents` table (migration 009), with updated type CHECK to include `inspection` and `notice`:
  - `id, property_id, title, file_url, type, created_at`
  - Migration to alter CHECK: `type IN ('form', 'agreement', 'lease', 'inspection', 'notice')`

**API:**
- `GET /api/properties/:id/documents` — list documents for property
- `POST /api/properties/:id/documents` — upload document (admin only)
- `DELETE /api/properties/:id/documents/:docId` — delete document (admin only)

**Privacy:** Admin-only. No public site exposure. All endpoints behind `authenticate` + `requireAdmin`.

## 3. Rent Label Rename

Rename "Price" to "Rent" in all UI labels:
- Admin PropertyForm: "Price ($/mo)" -> "Rent ($/mo)"
- Admin PropertyDetail: "Price" -> "Rent"
- Public site PropertyCard: any "Price" labels -> "Rent"
- Public site PropertyPanel: any "Price" labels -> "Rent"
- No schema changes (column stays `price` in DB)

## Upload Pattern

Follow the existing image upload pattern:
1. Frontend uploads file directly to Supabase Storage using anon key
2. Frontend gets public URL back
3. Frontend calls backend API to create metadata record with URL
4. Backend stores metadata in DB behind admin auth

Both new buckets need Supabase Storage RLS policies:
- Public SELECT (for download links)
- Anon INSERT (uploads come from frontend with anon key)
- Anon/authenticated DELETE (or handle via service role on backend)

## File Type Constraints

- Templates: PDF, DOCX, DOC, XLS, XLSX, PNG, JPG (common office files)
- Property documents: same set
- Max file size: 10MB (matching image upload limit)
