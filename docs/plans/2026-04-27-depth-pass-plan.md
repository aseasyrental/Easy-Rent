# Depth Pass — Public Site Visual Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the depth pass design (deeper cream + paper grain + dark soft long shadows on objects, plus Landing quote replacement + Listings header redesign) to the public site, leaving the Landing hero photo and all motion unchanged.

**Architecture:** Token-driven. Most visual changes flow through `tokens.css` (bg colors + shadow values) which the existing components already reference. A new `.with-grain` utility class in `index.css` adds the paper texture per-section. Eight hardcoded shadow values get explicit updates. Two targeted layout edits (Landing quote, Listings header) round out the pass.

**Tech Stack:** React 19 + Vite + plain CSS. No new dependencies. Static SVG noise filter for grain. CSS custom properties for tokens.

**Reference:** Design spec at `docs/plans/2026-04-27-depth-pass-design.md`.

---

## File Structure

| File | Responsibility | Why touched |
|---|---|---|
| `public-site/src/styles/tokens.css` | CSS custom property definitions for the public site | Shift bg cream + shadow values |
| `public-site/src/index.css` | Global resets and animations | Add `.with-grain` utility class |
| `public-site/src/components/NavBar.css` | NavBar styling | Scrolled-state shadow + logo-hover shadow + mobile overlay rgba |
| `public-site/src/components/PropertyCard.css` | Property card styling | Heart button shadow |
| `public-site/src/components/PropertyPanel.css` | Property panel styling | Close button + heart button + mobile sheet shadows |
| `public-site/src/components/PropertyMarkers.css` | Map marker styling | Pin marker + cluster bubble shadows |
| `public-site/src/pages/Landing.jsx` | Landing page React | Quote string + apply `with-grain` to 5 post-hero sections |
| `public-site/src/pages/Landing.css` | Landing page styling | Owners CTA pill custom shadow |
| `public-site/src/pages/Listings.jsx` | Listings page React | Header redesign + apply `with-grain` to wrapper |
| `public-site/src/pages/Listings.css` | Listings page styling | Title styling + new logo class + remove eyebrow |
| `public-site/src/pages/MyList.jsx` | MyList page React | Apply `with-grain` to wrapper |
| `public-site/src/pages/Picks.jsx` | Picks page React | Apply `with-grain` to wrapper |
| `public-site/src/pages/MapView.jsx` | MapView page React | Apply `with-grain` to wrapper |
| `public-site/src/pages/Owners.jsx` | Owners page React | Apply `with-grain` to wrapper |

**NOT touched:** `Landing.css` (hero classes), all backend code, admin dashboard, hooks, services, other components.

---

## Pre-Flight

### Task 0: Working state setup

**Files:** none — environment only.

- [ ] **Step 1: Confirm clean working tree**

Run: `git status`
Expected: working tree clean, on `master`, at commit `9f99647` (or later).

If uncommitted changes other than `EASY-RENTAL-MAP.md`, stop and ask Josh.

- [ ] **Step 2: Create branch for the depth pass**

```bash
git checkout -b depth-pass-s58
```

Expected: switched to new branch. Per Josh's preference, working on a branch directly (no worktree).

- [ ] **Step 3: Start dev server**

In a separate terminal:

```bash
cd public-site && npm run dev
```

Expected: Vite dev server boots on `http://localhost:5173` (or 5174/5175 if 5173 is taken). Note the actual port for visual verification.

If Vite was previously running and HMR has drifted (gotcha #14): `taskkill //F //IM node.exe` then restart.

- [ ] **Step 4: Open Chrome to the dev server**

Navigate to `http://localhost:5173/` in the "main Josh" Chrome browser. Confirm the live (un-modified) Landing page loads. This is the baseline for visual verification across all subsequent tasks.

---

## Phase 1 — Foundation

### Task 1: Token foundation — bg colors + shadow values

**Files:**
- Modify: `public-site/src/styles/tokens.css:8-11` (bg tokens)
- Modify: `public-site/src/styles/tokens.css:62-66` (shadow tokens)

- [ ] **Step 1: Update bg tokens**

Replace lines 8-11 of `tokens.css`:

```css
/* OLD */
  --bg: #F5EDE2;
  --bg-warm: #EDE4D6;
  --bg-card: #FAF6F0;
  --bg-nav: rgba(245, 237, 226, 0.92);

/* NEW */
  --bg: #ECE3D2;
  --bg-warm: #E5DCC6;
  --bg-card: #FAF6F0;
  --bg-nav: rgba(236, 227, 210, 0.92);
```

(`--bg-card` stays unchanged — it's the lifted card surface, intentionally lighter than the deeper page.)

- [ ] **Step 2: Update shadow tokens**

Replace lines 63-66 of `tokens.css`:

```css
/* OLD */
  --shadow-sm: 0 1px 4px rgba(44, 36, 32, 0.04);
  --shadow-md: 0 4px 20px rgba(44, 36, 32, 0.06), 0 1px 4px rgba(44, 36, 32, 0.03);
  --shadow-lg: 0 12px 40px rgba(44, 36, 32, 0.10), 0 4px 12px rgba(44, 36, 32, 0.05);
  --shadow-xl: 0 20px 60px rgba(44, 36, 32, 0.12);

/* NEW — soft, long, dark, charcoal-tinted; top-right light → falls down-and-left */
  --shadow-sm: 0 14px 24px -8px rgba(40, 26, 12, 0.32), 0 5px 10px -4px rgba(40, 26, 12, 0.18);
  --shadow-md: 0 30px 56px -14px rgba(40, 26, 12, 0.34), 0 12px 22px -10px rgba(40, 26, 12, 0.18);
  --shadow-lg: 0 40px 72px -12px rgba(40, 26, 12, 0.42), 0 16px 28px -10px rgba(40, 26, 12, 0.22);
  --shadow-xl: 0 36px 72px -20px rgba(40, 26, 12, 0.30), 0 16px 28px -14px rgba(40, 26, 12, 0.16);
```

- [ ] **Step 3: Visual verify in Chrome**

Reload `http://localhost:5173/` (Landing). Confirm:
- Hero photo unchanged (still warm + dark gradient)
- Below the hero, the cream is visibly deeper than before (warmer-toasted, not pale-cream)
- Three property cards have visibly stronger drop shadows
- Steps panel + step circles still flat (they don't reference shadow tokens yet — Task 9 adds explicit box-shadow declarations)

Navigate to `/listings`. Confirm cards have stronger shadows than before.
Navigate to `/map`. Confirm count pill (top-left) has a stronger shadow.
Navigate to `/owners`. Confirm panels lift with stronger shadows.

- [ ] **Step 4: Commit**

```bash
git add public-site/src/styles/tokens.css
git commit -m "depth: shift bg cream deeper + dark soft long shadow tokens"
```

---

### Task 2: Paper grain utility + apply per-page

**Files:**
- Modify: `public-site/src/index.css` (add `.with-grain`)
- Modify: `public-site/src/pages/Landing.jsx` (5 className additions)
- Modify: `public-site/src/pages/Listings.jsx` (1 className addition)
- Modify: `public-site/src/pages/MyList.jsx` (1 className addition)
- Modify: `public-site/src/pages/Picks.jsx` (1 className addition)
- Modify: `public-site/src/pages/MapView.jsx` (1 className addition)
- Modify: `public-site/src/pages/Owners.jsx` (1 className addition)

- [ ] **Step 1: Add `.with-grain` utility to `index.css`**

Append to `public-site/src/index.css`:

```css
/* ===== Paper grain =====
   Applied per-section, never to .landing-hero.

   Implementation: background-image + background-blend-mode: multiply directly on
   the element, NOT a pseudo overlay with isolation. The pseudo+isolation approach
   would trap PropertyPanel (z:1001) and FilterBar (z:1000) inside the wrapper's
   stacking context, so they'd render UNDER NavBar (z:50) instead of over it. The
   blend-mode approach has no stacking context impact.

   !important is required because every section currently sets `background:` (shorthand),
   which resets background-image to none. !important on background-image lets the
   grain win over the shorthand reset without converting every section to longhand. */
.with-grain {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.18  0 0 0 0 0.12  0 0 0 0 0.06  0 0 0 0.085 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>") !important;
  background-blend-mode: multiply !important;
}
```

- [ ] **Step 2: Apply `with-grain` to Landing post-hero sections**

In `public-site/src/pages/Landing.jsx`, add `with-grain` to the className of these five elements (NOT `.landing-hero`):

| Element | Existing className | New className |
|---|---|---|
| Top Three section (line 192) | `landing-topthree` | `landing-topthree with-grain` |
| Quote section (line 273) | `landing-quote` | `landing-quote with-grain` |
| Steps section (line 283) | `landing-steps` | `landing-steps with-grain` |
| Owners section (line 311) | `landing-owners` | `landing-owners with-grain` |
| Footer (line 330) | `landing-footer` | `landing-footer with-grain` |

Example diff for Top Three (apply same pattern to others):

```jsx
/* OLD */
<section className="landing-topthree" ref={topThreeRevealRef}>

/* NEW */
<section className="landing-topthree with-grain" ref={topThreeRevealRef}>
```

**DO NOT add `with-grain` to `.landing-hero`** (line 142-143).

- [ ] **Step 3: Apply `with-grain` to other public-site pages**

Update className on the outer wrapper of each page:

```jsx
/* Listings.jsx, line 67 */
/* OLD */ <div className="listings">
/* NEW */ <div className="listings with-grain">

/* MyList.jsx, line 96 */
/* OLD */ <div className="my-list">
/* NEW */ <div className="my-list with-grain">

/* Picks.jsx, line 71 */
/* OLD */ <div className="my-list">
/* NEW */ <div className="my-list with-grain">

/* MapView.jsx, line 86 */
/* OLD */ <div className="map-view">
/* NEW */ <div className="map-view with-grain">

/* Owners.jsx, line 24 */
/* OLD */ <div className="owners">
/* NEW */ <div className="owners with-grain">
```

- [ ] **Step 4: Visual verify in Chrome**

Reload Landing. Confirm:
- **Hero photo is COMPLETELY untouched** (no grain visible on the photo, no dimming)
- Below the hero, cream sections show subtle paper grain (felt before seen — should not look like a pattern)
- Three property cards still readable; grain is on the cream around them, not on the card surfaces (cards have their own bg-card surface)

Navigate `/listings`, `/map`, `/my-list`, `/owners`. Confirm grain is present and quiet on each.

If grain reads as a visible pattern instead of texture, lower the SVG alpha in `.with-grain` (the last value in `feColorMatrix values='... 0 0 0 0.085 0'` — change `0.085` to `0.06`). If grain is invisible, raise to `0.12`. Tune until "felt before seen."

- [ ] **Step 5: Commit**

```bash
git add public-site/src/index.css public-site/src/pages/Landing.jsx public-site/src/pages/Listings.jsx public-site/src/pages/MyList.jsx public-site/src/pages/Picks.jsx public-site/src/pages/MapView.jsx public-site/src/pages/Owners.jsx
git commit -m "depth: add paper grain utility, apply per-section across public site"
```

---

## Phase 2 — Hardcoded shadow updates

### Task 3: NavBar — scrolled state + logo hover + mobile overlay rgba

**Files:**
- Modify: `public-site/src/components/NavBar.css:17` (scrolled state shadow)
- Modify: `public-site/src/components/NavBar.css:55` (logo hover shadow)
- Modify: `public-site/src/components/NavBar.css:155` (mobile overlay rgba)

- [ ] **Step 1: Update NavBar scrolled state shadow**

In `NavBar.css` line 17:

```css
/* OLD */
.navbar--scrolled {
  box-shadow: 0 1px 12px rgba(44, 36, 32, 0.04);

/* NEW */
.navbar--scrolled {
  box-shadow: 0 4px 16px -4px rgba(40, 26, 12, 0.16);
```

- [ ] **Step 2: Update NavBar logo hover shadow**

In `NavBar.css` line 55:

```css
/* OLD */
.navbar__brand:hover .navbar__logo-wrap {
  transform: scale(1.06);
  box-shadow: 0 2px 12px rgba(107, 127, 94, 0.18);
}

/* NEW */
.navbar__brand:hover .navbar__logo-wrap {
  transform: scale(1.06);
  box-shadow: 0 6px 14px -2px rgba(107, 127, 94, 0.32);
}
```

(Sage tint is preserved — this is a hover affordance for the brand, not a structural shadow.)

- [ ] **Step 3: Update mobile overlay rgba**

In `NavBar.css` line 155:

```css
/* OLD */
.navbar__overlay {
  ...
  background: rgba(251, 247, 241, 0.98);

/* NEW */
.navbar__overlay {
  ...
  background: rgba(236, 227, 210, 0.98);
```

- [ ] **Step 4: Visual verify in Chrome**

On `/listings` (or any page with NavBar):
- Scroll past 60px → confirm nav gains a clear (still subtle) shadow underneath
- Hover the brand logo → confirm logo wrap lifts with sage-tinted glow

On a mobile-emulated viewport (DevTools Ctrl+Shift+M, 375x667):
- Tap hamburger → confirm overlay matches the new deeper cream (not the old pale cream)

- [ ] **Step 5: Commit**

```bash
git add public-site/src/components/NavBar.css
git commit -m "depth: NavBar shadows + mobile overlay match new cream"
```

---

### Task 4: PropertyCard heart button shadow

**Files:**
- Modify: `public-site/src/components/PropertyCard.css:59`

- [ ] **Step 1: Update heart button shadow to use `--shadow-sm` token**

In `PropertyCard.css` line 59:

```css
/* OLD */
.property-card__heart {
  ...
  box-shadow: 0 2px 8px rgba(44, 36, 32, 0.08);

/* NEW */
.property-card__heart {
  ...
  box-shadow: var(--shadow-sm);
```

- [ ] **Step 2: Visual verify in Chrome**

On `/listings`, hover a property card. The heart button (top-right of card image) should have a clearly visible drop shadow now (the new `--shadow-sm` is significantly stronger than the old hardcoded value).

- [ ] **Step 3: Commit**

```bash
git add public-site/src/components/PropertyCard.css
git commit -m "depth: PropertyCard heart button uses shadow-sm token"
```

---

### Task 5: PropertyPanel close + heart + mobile sheet shadows

**Files:**
- Modify: `public-site/src/components/PropertyPanel.css:48` (close button)
- Modify: `public-site/src/components/PropertyPanel.css:141` (heart button)
- Modify: `public-site/src/components/PropertyPanel.css:281` (mobile sheet)

- [ ] **Step 1: Update close button shadow**

In `PropertyPanel.css` line 48:

```css
/* OLD */
.property-panel__close {
  ...
  box-shadow: 0 2px 8px rgba(44, 36, 32, 0.08);

/* NEW */
.property-panel__close {
  ...
  box-shadow: var(--shadow-sm);
```

- [ ] **Step 2: Update heart button shadow**

In `PropertyPanel.css` line 141:

```css
/* OLD */
.property-panel__heart {
  ...
  box-shadow: 0 2px 8px rgba(44, 36, 32, 0.08);

/* NEW */
.property-panel__heart {
  ...
  box-shadow: var(--shadow-sm);
```

- [ ] **Step 3: Update mobile bottom sheet shadow**

In `PropertyPanel.css` line 281 (inside the mobile media query):

```css
/* OLD */
@media (max-width: 768px) {
  .property-panel {
    ...
    box-shadow: 0 -8px 40px rgba(44, 36, 32, 0.1);
  }

/* NEW */
@media (max-width: 768px) {
  .property-panel {
    ...
    box-shadow: 0 -16px 32px -8px rgba(40, 26, 12, 0.30), 0 -8px 16px -4px rgba(40, 26, 12, 0.18);
  }
```

(Negative-Y because the sheet rises from the bottom on mobile — light source becomes irrelevant for this object.)

- [ ] **Step 4: Visual verify in Chrome**

On `/listings`, click any property card. The slide-in panel opens.
- Close button (top-right) — confirm clear drop shadow
- Heart button (next to title) — confirm clear drop shadow

On a mobile-emulated viewport (Ctrl+Shift+M, 375x667), click a property card.
- Sheet rises from bottom — confirm visible top-edge shadow above the sheet (lifting it from the page)

- [ ] **Step 5: Commit**

```bash
git add public-site/src/components/PropertyPanel.css
git commit -m "depth: PropertyPanel buttons + mobile sheet pick up depth shadows"
```

---

### Task 6: PropertyMarkers — pin + cluster shadows

**Files:**
- Modify: `public-site/src/components/PropertyMarkers.css:12` (pin marker)
- Modify: `public-site/src/components/PropertyMarkers.css:40` (cluster bubble)

- [ ] **Step 1: Update pin marker shadow**

In `PropertyMarkers.css` line 12:

```css
/* OLD */
.property-marker__pin {
  ...
  box-shadow: 0 2px 8px rgba(44, 36, 32, 0.2);

/* NEW */
.property-marker__pin {
  ...
  box-shadow: 0 6px 12px -2px rgba(40, 26, 12, 0.34), 0 2px 4px rgba(40, 26, 12, 0.20);
```

- [ ] **Step 2: Update cluster bubble shadow**

In `PropertyMarkers.css` line 40:

```css
/* OLD */
.property-marker-cluster__bubble {
  ...
  box-shadow: 0 2px 8px rgba(44, 36, 32, 0.2);

/* NEW */
.property-marker-cluster__bubble {
  ...
  box-shadow: 0 6px 12px -2px rgba(40, 26, 12, 0.34), 0 2px 4px rgba(40, 26, 12, 0.20);
```

- [ ] **Step 3: Visual verify in Chrome**

Navigate to `/map`. Confirm:
- Sage pins (single properties) have a clearly visible drop shadow lifting them off the map
- Terracotta cluster bubbles (numbered) have the same treatment
- Shadows don't overwhelm — the markers should still be the focal point

If shadows look too heavy on busy map terrain, dial down the 0.34/0.20 values toward 0.28/0.16.

- [ ] **Step 4: Commit**

```bash
git add public-site/src/components/PropertyMarkers.css
git commit -m "depth: map pin + cluster bubble shadows lift markers"
```

---

## Phase 3 — Targeted edits

### Task 7: Landing quote replacement

**Files:**
- Modify: `public-site/src/pages/Landing.jsx` (quote text, around line 277)

- [ ] **Step 1: Replace the quote string**

Find the `.landing-quote__text` paragraph in Landing.jsx (around line 276-278):

```jsx
/* OLD */
<p data-reveal className="landing-quote__text reveal-delay-2">
  We answer the phone. We meet you at the showing. We help you fill out the paperwork. That is it.
</p>

/* NEW */
<p data-reveal className="landing-quote__text reveal-delay-2">
  We exist to eliminate the friction between people who need a home and the person who can provide one.
</p>
```

No CSS changes — existing 32px italic serif holds.

- [ ] **Step 2: Visual verify in Chrome**

Reload Landing. Scroll to the Quote section. Confirm:
- The new line displays correctly
- 32px italic serif type, max-width 680px, centered
- No overflow or wrapping issues
- Reveal animation still triggers as you scroll into view

Resize the browser to 375px width and confirm the line wraps cleanly without awkward breaks.

- [ ] **Step 3: Commit**

```bash
git add public-site/src/pages/Landing.jsx
git commit -m "copy: replace Landing brand quote with mission line"
```

---

### Task 8: Listings header redesign

**Files:**
- Modify: `public-site/src/pages/Listings.jsx:68-72` (header JSX)
- Modify: `public-site/src/pages/Listings.css:15-30` (eyebrow + title styling)

- [ ] **Step 1: Restructure Listings header JSX**

In `Listings.jsx`, replace the `.listings__header` block (lines 68-72):

```jsx
/* OLD */
<div className="listings__header">
  <p className="listings__eyebrow">Browse</p>
  <h1 className="listings__title">Homes for rent</h1>
  <p className="listings__count">{countText}</p>
</div>

/* NEW */
<div className="listings__header">
  <h1 className="listings__title">
    <img src="/logo-circle.png" alt="Easy Rental" className="listings__title-logo" />
    <span>Homes</span>
  </h1>
  <p className="listings__count">{countText}</p>
</div>
```

- [ ] **Step 2: Update `.listings__title` styling**

In `Listings.css`, replace the `.listings__title` block (lines 24-30):

```css
/* OLD */
.listings__title {
  font-family: var(--font-serif);
  font-size: 42px;
  font-weight: 400;
  color: var(--text);
  line-height: 1.15;
}

/* NEW */
.listings__title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-family: var(--font-serif);
  font-size: 42px;
  font-weight: 400;
  color: var(--text);
  line-height: 1.15;
}

.listings__title-logo {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
```

- [ ] **Step 3: Remove the obsolete `.listings__eyebrow` block**

In `Listings.css`, delete the entire `.listings__eyebrow` block (lines 15-22):

```css
/* DELETE */
.listings__eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sage);
  margin-bottom: 8px;
}
```

- [ ] **Step 4: Add mobile sizing for the title logo**

In `Listings.css`, add inside the existing `@media (max-width: 768px)` block (around line 250, near the existing `.listings__title` mobile rule):

```css
@media (max-width: 768px) {
  ...
  .listings__title-logo {
    width: 52px;
    height: 52px;
  }
}
```

- [ ] **Step 5: Visual verify in Chrome**

Navigate to `/listings`. Confirm:
- Header is now ONE visual line: circle logo + serif "Homes"
- The "BROWSE" eyebrow is gone
- "X places to call home" still shows below
- Top of page has more vertical breathing room than before
- Logo and "Homes" align cleanly (logo center matches text center)

Resize to 375px width. Confirm logo shrinks to 52px and "Homes" stays serif and readable.

- [ ] **Step 6: Commit**

```bash
git add public-site/src/pages/Listings.jsx public-site/src/pages/Listings.css
git commit -m "listings: replace text header with circle logo + Homes inline"
```

---

### Task 9: Landing.css shadow additions — Steps panel, step circles, Owners CTA pill

**Files:**
- Modify: `public-site/src/pages/Landing.css` — add box-shadow to `.landing-steps__inner` (Steps panel)
- Modify: `public-site/src/pages/Landing.css` — add box-shadow to `.landing-step__circle` (the three numbered circles)
- Modify: `public-site/src/pages/Landing.css` — strengthen `.landing-owners__cta` and its `:hover` shadow

The Steps panel and step circles currently have no box-shadow declared. Without adding one, they stay flat even after the token shifts. Add explicit `box-shadow: var(--shadow-*)` references on each.

- [ ] **Step 1a: Add Steps panel shadow**

In `Landing.css`, find the `.landing-steps__inner` block (around line 596-602) and add `box-shadow: var(--shadow-xl);`:

```css
/* OLD */
.landing-steps__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  background: var(--bg-warm);
  border-radius: var(--radius-lg);
  padding: 64px 48px;
}

/* NEW */
.landing-steps__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  background: var(--bg-warm);
  border-radius: var(--radius-lg);
  padding: 64px 48px;
  box-shadow: var(--shadow-xl);
}
```

- [ ] **Step 1b: Add step circle shadow**

In `Landing.css`, find the `.landing-step__circle` block (around line 635-647) and add `box-shadow: var(--shadow-sm);`:

```css
/* OLD */
.landing-step__circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 600;
}

/* NEW */
.landing-step__circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}
```

- [ ] **Step 1c: Update Owners CTA pill shadow**

In `Landing.css` line ~740-741:

```css
/* OLD */
.landing-owners__cta {
  ...
  box-shadow: 0 2px 14px rgba(192, 122, 91, 0.22);

/* NEW */
.landing-owners__cta {
  ...
  box-shadow: 0 18px 32px -10px rgba(168, 80, 50, 0.40), 0 6px 14px -6px rgba(40, 26, 12, 0.20);
```

Also update the hover state in the same file (around line 745-747):

```css
/* OLD */
.landing-owners__cta:hover {
  background: var(--terracotta-hover, #b06a4b);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(192, 122, 91, 0.32);
}

/* NEW */
.landing-owners__cta:hover {
  background: var(--terracotta-hover, #b06a4b);
  transform: translateY(-1px);
  box-shadow: 0 22px 40px -10px rgba(168, 80, 50, 0.46), 0 8px 16px -6px rgba(40, 26, 12, 0.22);
}
```

- [ ] **Step 2: Visual verify in Chrome**

Reload Landing, scroll to the Owners section. Confirm:
- "List your property →" pill has a visibly stronger drop shadow
- The shadow keeps its terracotta tint (warm, not pure charcoal — it should feel like an extension of the pill's color)
- On hover, the pill lifts slightly (translateY) and the shadow grows

- [ ] **Step 3: Commit**

```bash
git add public-site/src/pages/Landing.css
git commit -m "depth: Owners CTA pill custom shadow keeps terracotta tint"
```

---

## Phase 4 — Final verification

### Task 10: Build clean

**Files:** none.

- [ ] **Step 1: Run production build**

```bash
cd public-site && npm run build
```

Expected: build succeeds with zero warnings. Output written to `public-site/dist/`.

If the build fails, fix the underlying issue. Do NOT bypass with `--no-verify` or any flag that skips validation.

- [ ] **Step 2: Preview the production build locally**

```bash
npm run preview
```

Expected: preview server starts on `http://localhost:4173` (or next available port). Confirm port.

- [ ] **Step 3: Cross-page Chrome walk on the production build**

In Chrome, navigate to the preview server URL and walk through every public page:

| Page | Route | Verify |
|---|---|---|
| Landing | `/` | Hero photo unchanged, post-hero sections show grain + deeper cream + lifted cards/panel/circles, new quote string, lifted Owners CTA pill |
| Listings | `/listings` | New header (logo + Homes, no BROWSE eyebrow), grain across page, lifted property cards |
| Map | `/map` | Grain on margins where visible, lifted count pill, lifted markers |
| MyList | `/my-list` | Grain on page, lifted property cards (if any saved; otherwise empty state with grain visible) |
| Picks | `/picks?ids=1,2,3` | Same depth treatment as MyList |
| Owners | `/owners` | Grain on page, lifted panels (hero + CTA panels), lifted CTA buttons |

For each page, confirm: hero photo (Landing only) is COMPLETELY untouched.

- [ ] **Step 4: Mobile-emulated viewport check**

In Chrome DevTools, toggle device emulation (Ctrl+Shift+M). Test at 375x667 and 414x896:

- Landing: hero shows correctly, post-hero sections grain readable, mobile menu (tap hamburger from /listings) shows new cream
- PropertyPanel mobile sheet: tap a property card; sheet rises from bottom with visible top-edge shadow

- [ ] **Step 5: No commit needed for verification — handoff to Josh**

If any visual issue surfaces, return to the relevant Phase task and dial values. Then re-build, re-verify.

---

### Task 11: Hand control to Josh for ship decision

**Files:** none.

- [ ] **Step 1: Summarize what's on the branch**

Tell Josh:
- Branch `depth-pass-s58` has 9 commits covering tokens + grain + 4 hardcoded shadow updates + quote replacement + Listings header + Owners CTA
- Build is clean, all pages walked in Chrome, hero photo confirmed untouched
- Ready to merge to master and deploy to Bill's Vercel via `bash scripts/deploy.sh public`

- [ ] **Step 2: Wait for Josh's call**

Do NOT merge to master, push to `bill` remote, or trigger deploy without Josh's explicit "go ahead." Bill is meeting with Josh today; Josh decides whether the depth pass ships before, during, or after that meeting.

- [ ] **Step 3 (only after Josh says go): Merge + push + deploy**

```bash
git checkout master
git merge depth-pass-s58
git push origin master
git push bill master
bash scripts/deploy.sh public
```

Expected: deploy script runs git pre-checks, triggers Vercel deploy hook, waits for build, runs smoke tests. Confirm PASS output before declaring done.

If smoke tests fail, do NOT mark deploy as complete — investigate and fix.

---

## Out of scope this round (do not address)

- Hero diffusion redesign — existing motion is good, leave alone
- `/api/inquiries` 401 silent-logout bug — pre-existing, separate fix
- Landing top-three swap from `?limit=3&sort=newest` to `?featured=true` — pending Bill's first three featured picks in admin
- Admin dashboard depth treatment — different palette, different design language
