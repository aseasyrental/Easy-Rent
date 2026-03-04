# Admin Dashboard Mobile Design

**Date:** 2026-03-04
**Scope:** Full mobile admin access for Bill (properties, inquiries, templates, schedule, leads)
**Breakpoint:** 768px

## Decisions

- **Navigation:** Hamburger menu (top-left icon, slide-out panel with nav items + home/sign-out)
- **Panel behavior:** Stack navigation — list fills screen, tapping item pushes to full-screen detail with back arrow
- **Breakpoint:** `@media (max-width: 768px)` — single threshold, no tablet intermediate
- **No new pages or routes** — same components, responsive CSS + one MobileNav component

## Mobile Layout

### Above 768px (unchanged)
Bookshelf background → image-mapped nav boxes → 420px side panel → remaining-width content panel.

### At or below 768px

**Shell:**
- Bookshelf background image: hidden (not loaded — use CSS to skip)
- Image-mapped nav boxes: hidden
- Background color replaces image (dark neutral to match brand)
- Home + sign-out buttons: moved into hamburger menu

**MobileNav (new component):**
- Hamburger icon: top-left, 44×44px touch target
- Slide-out menu: full-height left panel, ~280px wide, semi-transparent backdrop
- Nav items: Properties, Inquiries, Templates, Schedule, Leads — each 48px tall, full-width tap targets
- Home + Sign Out at bottom of menu
- Tap backdrop or X to close

**SidePanel (list view):**
- `width: 100vw`, `left: 0` (fills screen instead of 420px)
- Search/filter bar stays at top
- List items: minimum 48px row height for touch
- Tapping item hides list, shows detail (full screen)

**ContentPanel (detail view):**
- `width: 100vw` (fills screen instead of `calc(100vw - 440px)`)
- Back arrow (top-left, 44×44px) returns to list view
- Header actions: stack vertically if needed

## Component-Specific Mobile Adjustments

### PropertyForm
- 2-column grid → 1 column at 768px
- Input fields: minimum height 44px for touch
- Submit/cancel buttons: full-width, stacked

### PropertyDetail
- Hero image: scale height proportionally (max 200px on mobile)
- 2-column detail grid → 1 column
- Status dropdown: full-width on mobile

### ImageUploader
- Drag-drop zone: tap triggers camera/file picker (native `<input type="file" accept="image/*" capture="environment">`)
- Thumbnails: increase from 56px to 72px on mobile
- Reorder: simplify — up/down buttons instead of drag (drag is unreliable on mobile)
- Set primary / delete: larger tap targets (44px minimum)

### DocumentUploader
- Already has 480px media query — extend to 768px breakpoint
- Upload button: full-width on mobile

### InquiryDetail
- Reply textarea: comfortable height, no tiny box
- Action buttons: full-width, stacked

### Login
- Already 360px panel — add `max-width: 90vw` for very small screens
- Input fields: 44px minimum height

## Touch Targets

Systematic rule: all interactive elements minimum 44×44px on mobile.
- Buttons, links, nav items, thumbnails, dropdown triggers
- List rows: minimum 48px height
- Form inputs: minimum 44px height

## Performance

- Background image (`bg-environment.png`, ~1MB): do not load on mobile
  - Use CSS: `@media (max-width: 768px) { .shell__background { display: none; } }`
  - Or use `<picture>` / media query to prevent download entirely
- No other performance changes needed — admin is lightweight

## What This Does NOT Change

- Desktop layout (above 768px) — untouched
- API layer — no backend changes
- Auth flow — same login, same tokens
- Data model — no schema changes
- Routing — no new URL routes (panel state is managed in React state, not URL)
