# Mobile-First Admin Dashboard Redesign

**Date:** 2026-03-05
**Context:** Bill is a property manager in his car all day. Phone is his primary device. The admin dashboard works on mobile but wasn't designed for it. This redesign makes mobile the primary experience while keeping the desktop bookshelf UI intact.

## Constraints

- Keep desktop bookshelf UI unchanged (Bill also uses desktop)
- No backend changes needed — same API, same data
- React + Vite + existing component library
- Must not break editor role (Minion account)
- Notifications (inquiry alerts) are a future feature, not in scope here

## What Changes

Mobile (<=768px) gets a completely different layout from desktop. Desktop stays as-is.

### 1. Bottom Tab Bar (replaces hamburger drawer)

**Why:** Hamburger menus hide navigation. Bill shouldn't have to tap twice to get to Properties. A bottom tab bar puts his 3 most-used sections one tap away, always visible, thumb-reachable.

**Tabs:**
- **Dashboard** (home icon) — summary cards showing counts at a glance
- **Properties** (building icon) — property list
- **Inquiries** (message icon) — inquiry list with unread badge

Admin-only tabs (Schedule, Leads, Templates) move to a "More" tab or stay in the hamburger for admin users. These are "Coming Soon" anyway.

**Specs:**
- Fixed bottom, 56px tall, z-index 500
- Icons + labels, active state highlighted
- Safe area padding for iPhone notch/home indicator
- Replaces MobileNav hamburger on mobile (hamburger still exists for desktop tablet range if needed)

### 2. Dashboard Home (new)

**Why:** Currently mobile dashboard is blank — just the background image. Bill opens the app and sees nothing useful. Dashboard home gives him a glance at what needs attention.

**Cards:**
- **Properties** — count by status (2 available, 1 occupied)
- **New Inquiries** — count of unread/pending inquiries
- **Quick Actions** — "Add Property" button, "View All Inquiries" button

**Specs:**
- Simple card grid, 1 column on phone
- Each card tappable — navigates to that section
- No background image on mobile (save bandwidth)

### 3. Property List (improved)

**Current:** Side panel, full width on mobile, works OK but dense.

**Changes:**
- Property cards instead of list items — show primary image thumbnail (48px), title, status pill, price, inquiry count
- Swipe right on a card → quick status change (available/occupied/maintenance)
- Bigger touch targets (56px min height per card)
- Sticky search bar at top
- Floating "+" button bottom-right to add property (instead of button in the list header)

### 4. Property Form (sectioned)

**Current:** One long column, 14+ fields, 4-5 scrolls to reach Save.

**Changes:** Break into collapsible sections with clear headings:

- **Basic Info** (title, address, city, province, postal) — open by default
- **Details** (property type, bedrooms, bathrooms, sqft, description) — open by default
- **Pricing** (rent, deposit, lease term, availability date, status) — collapsed
- **Amenities** — collapsed
- **Photos** (ImageUploader) — collapsed, with photo count badge

**Other form improvements:**
- Sticky Save/Cancel bar at bottom (always visible, no scrolling to find it)
- Labels bumped to 14px minimum
- Field grouping reduces cognitive load

### 5. Property Detail (streamlined)

**Current:** Works OK. Hero image, fields grid, edit/delete buttons.

**Changes:**
- Hero image reduced to 160px (more content visible above the fold)
- Thumbnail gallery gets left/right swipe indicators (dots or arrows)
- Quick status toggle inline (tap status pill → bottom sheet, already exists)
- Edit button more prominent — full-width primary button
- Delete stays small/secondary (admin only)

### 6. Image Uploader (mobile-optimized)

**Current:** Works after session 33 bugfixes. Drag/drop + multi-file.

**Changes:**
- Dropzone text shortened: "Tap to add photos" (not "Drag an image here or click to browse")
- Delete button moved to bottom of thumbnail (easier thumb reach vs top-right corner)
- Larger progress bar (8px instead of 4px)
- Thumbnail size stays 72px (good)

### 7. Shell CSS (performance)

**Current:** 4269x2400px background image loads on mobile even though the compressed version already exists.

**Changes:**
- On mobile, swap `.shell__bg` background-image to `bg-environment-compressed.jpg` (100KB) instead of the full-size original
- Keep the background visible — it looks good

## What Stays the Same

- Desktop bookshelf UI — untouched
- Backend API — no changes
- Login page — already mobile-friendly
- InquiryDetail — already has good bottom-sheet status, stacked buttons
- Editor role filtering — same logic, just rendered in new layout
- Auth flow — unchanged

## Implementation Order

1. Shell CSS — kill background image on mobile (quick win, saves bandwidth)
2. Bottom tab bar component — replaces MobileNav on mobile
3. Dashboard home view — summary cards
4. Property list cards — replace list items with card layout
5. Property form sections — collapsible groups + sticky save bar
6. Property detail tweaks — hero size, swipe indicators
7. Image uploader text + delete button position
8. Test everything on phone before deploy

## File Impact

**New files:**
- `BottomTabBar.jsx` + `BottomTabBar.css`
- `DashboardHome.jsx` + `DashboardHome.css`

**Modified files:**
- `Shell.jsx` — render BottomTabBar on mobile instead of MobileNav
- `Shell.css` — hide bg image on mobile, add bottom padding for tab bar
- `SidePanel.css` — adjust bottom padding to clear tab bar
- `ContentPanel.css` — adjust bottom padding to clear tab bar
- `PropertyForm.jsx` + `PropertyForm.css` — sectioned layout + sticky save
- `PropertyDetail.css` — hero size, thumb indicators
- `ImageUploader.jsx` + `ImageUploader.css` — text change, delete button position
- `PropertiesSidePanel.jsx` + `PropertiesSidePanel.css` — card layout for property items

**Untouched:**
- All backend files
- MobileNav.jsx (kept for potential tablet use, hidden on phone)
- Login.jsx/css
- InquiryDetail.jsx/css
- Desktop-specific CSS (all changes are inside `@media (max-width: 768px)`)
