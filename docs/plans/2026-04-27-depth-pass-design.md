# Depth Pass — Public Site Visual Update — Design Doc

**Date:** 2026-04-27
**Session:** 58
**Status:** Spec — pending Josh's review

## Why

The post-hero scroll on the public site reads flat. Cream is one tone with sub-3% color shifts between sections; PropertyCard shadows are at `rgba(44,36,32,0.06)` (4px / 20px blur) — nearly invisible; Steps panel and step circles have **no shadow at all**; Owners CTA has a small light shadow. The hero photo is a sunlit 3D space, but the moment you scroll past it, that dimensional quality collapses into a flat plane.

This pass introduces three coordinated changes that bring the post-hero experience into line with the lit, dimensional feel of the hero, while leaving the hero itself completely unchanged.

## Scope

**In scope:** every public-site page (`Landing`, `Listings`, `MapView`, `MyList`, `Picks`, `Owners`) and every shared component (`PropertyCard`, `PropertyPanel`, `NavBar`, `FilterBar`, `PropertyMarkers`).

**Out of scope:**
- Admin dashboard (different palette, different design language)
- Backend, API, data
- Motion and scroll transitions (already shipped in S55-S57 and working)
- The Landing hero itself (locked — sunlit room photo, dark warm gradient overlay, title, action cards, CTAs all stay exactly as they are)
- Layout, copy, section structure (other than the two targeted edits below)

## The three changes

1. **Color** — base cream goes one quiet step deeper. `--bg`: `#F5EDE2 → #ECE3D2`. Warm-cream shifts proportionally. Card lift surface stays light.
2. **Texture** — fine paper grain across every public-site page **except** the Landing hero photo. Tactile but quiet — felt before seen.
3. **Shadows** — every discrete object lifts off the surface with a soft, long, charcoal-tinted shadow. Top-right light source → shadows fall down-and-left. Cards, panels, step circles, heart buttons, close buttons, map markers, the Owners CTA pill — all get a visible shadow.

## Token shifts (`public-site/src/styles/tokens.css`)

### Backgrounds

```css
--bg:        #F5EDE2  →  #ECE3D2
--bg-warm:   #EDE4D6  →  #E5DCC6
--bg-nav:    rgba(245, 237, 226, 0.92)  →  rgba(236, 227, 210, 0.92)
--bg-card:   #FAF6F0  (UNCHANGED — lifted card surface stays light against the deeper page)
--bg-dark:   #2C2420  (UNCHANGED — footer)
```

### Shadows

The codebase already routes every card/panel through `--shadow-sm/md/lg/xl`. Redefining the values applies the change across every page automatically.

```css
/* OLD — near-invisible warm tints */
--shadow-sm: 0 1px 4px rgba(44, 36, 32, 0.04);
--shadow-md: 0 4px 20px rgba(44, 36, 32, 0.06), 0 1px 4px rgba(44, 36, 32, 0.03);
--shadow-lg: 0 12px 40px rgba(44, 36, 32, 0.10), 0 4px 12px rgba(44, 36, 32, 0.05);
--shadow-xl: 0 20px 60px rgba(44, 36, 32, 0.12);

/* NEW — soft, long, dark, charcoal-tinted, top-right light → falls down-and-left */
--shadow-sm: 0 14px 24px -8px rgba(40, 26, 12, 0.32), 0 5px 10px -4px rgba(40, 26, 12, 0.18);
--shadow-md: 0 30px 56px -14px rgba(40, 26, 12, 0.34), 0 12px 22px -10px rgba(40, 26, 12, 0.18);
--shadow-lg: 0 40px 72px -12px rgba(40, 26, 12, 0.42), 0 16px 28px -10px rgba(40, 26, 12, 0.22);
--shadow-xl: 0 36px 72px -20px rgba(40, 26, 12, 0.30), 0 16px 28px -14px rgba(40, 26, 12, 0.16);
```

Token-to-object mapping:
- `--shadow-sm` → small circle objects: heart buttons, close buttons, step circles, page-btn, mobile menu button
- `--shadow-md` → cards default state: PropertyCard, FilterBar, MapView count pill, error toasts, Owners panels, page-btn (currently uses md)
- `--shadow-lg` → cards hover state: PropertyCard:hover, owners__back:hover
- `--shadow-xl` → biggest objects: PropertyPanel (the slide-in detail panel)

## Paper grain (per-section pseudo, NOT global body overlay)

The grain must NOT touch the Landing hero photo. Implementation is per-section so the hero is naturally untouched.

### CSS pattern

Add to `public-site/src/index.css`:

```css
/* Paper grain — apply to any element with .with-grain.
   Pseudo-element overlay at z-index 0 within the element's stacking context.
   Element's own children must sit above via position: relative + z-index 1. */
.with-grain {
  position: relative;
  isolation: isolate;
}

.with-grain::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.18  0 0 0 0 0.12  0 0 0 0 0.06  0 0 0 0.085 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  mix-blend-mode: multiply;
  opacity: 0.55;
}

.with-grain > * {
  position: relative;
  z-index: 1;
}
```

### Where the class goes

Apply `.with-grain` (via JSX className update) to:

- **Landing.jsx** — `.landing-topthree`, `.landing-quote`, `.landing-steps`, `.landing-owners`, `.landing-footer` (NOT `.landing-hero`)
- **Listings.jsx** — `.listings`
- **MapView.jsx** — `.map-view` (the count pill and error toast sit on top via their own z-index; map itself is opaque so grain only shows in the area outside the leaflet container, which is none — but applying it to the wrapper means the count pill and any UI overlays sit on a textured cream surface where they appear)
- **MyList.jsx and Picks.jsx** — both render `<div className="my-list ...">` from separate JSX files; add `with-grain` to both wrappers
- **Owners.jsx** — `.owners`

The `.with-grain` class is added alongside the existing classes (e.g., `<div className="listings with-grain">`).

### Why per-section instead of body-global

A `body::after` global overlay with `mix-blend-mode: multiply` would tint the Landing hero photo. There is no z-index trick that excludes the multiply blend from a specific viewport region — multiply mixes with whatever's below, regardless of layering. Per-section pseudo elements naturally don't overlap the hero, so the hero photo is untouched.

## Hardcoded shadows to update (8 spots)

These are values not currently flowing through tokens. Each gets updated to use the new token, or to a dedicated darker value if the existing token doesn't fit the object.

| File | Line | Old | New |
|---|---|---|---|
| `PropertyCard.css` | 59 | `0 2px 8px rgba(44, 36, 32, 0.08)` | `var(--shadow-sm)` |
| `PropertyPanel.css` | 48 | `0 2px 8px rgba(44, 36, 32, 0.08)` | `var(--shadow-sm)` |
| `PropertyPanel.css` | 141 | `0 2px 8px rgba(44, 36, 32, 0.08)` | `var(--shadow-sm)` |
| `PropertyPanel.css` | 281 | `0 -8px 40px rgba(44, 36, 32, 0.1)` | `0 -16px 32px -8px rgba(40, 26, 12, 0.30), 0 -8px 16px -4px rgba(40, 26, 12, 0.18)` (mobile sheet — negative-Y by design, light source becomes irrelevant since sheet rises from below) |
| `NavBar.css` | 17 | `0 1px 12px rgba(44, 36, 32, 0.04)` | `0 4px 16px -4px rgba(40, 26, 12, 0.16)` (nav scrolled state — small drop shadow, settled feel) |
| `NavBar.css` | 55 | `0 2px 12px rgba(107, 127, 94, 0.18)` | `0 6px 14px -2px rgba(107, 127, 94, 0.32)` (nav logo hover — keeps sage tint, slightly stronger) |
| `PropertyMarkers.css` | 12 | `0 2px 8px rgba(44, 36, 32, 0.2)` | `0 6px 12px -2px rgba(40, 26, 12, 0.34), 0 2px 4px rgba(40, 26, 12, 0.20)` (map pin marker — circle on a map, needs to lift) |
| `PropertyMarkers.css` | 40 | `0 2px 8px rgba(44, 36, 32, 0.2)` | same as above (cluster bubble, same treatment) |

## Other stray cream value

`NavBar.css:155` — mobile menu overlay background:

```css
/* OLD */ background: rgba(251, 247, 241, 0.98);
/* NEW */ background: rgba(236, 227, 210, 0.98);
```

(Matches the new `--bg`. The overlay is a near-opaque takeover of the screen on mobile menu open; needs to match the page color.)

## Targeted edits (non-token changes)

### Landing — quote replacement

**File:** `public-site/src/pages/Landing.jsx`
**Element:** the `<p>` inside `.landing-quote`

```jsx
/* OLD (line ~277) */
<p data-reveal className="landing-quote__text reveal-delay-2">
  We answer the phone. We meet you at the showing. We help you fill out the paperwork. That is it.
</p>

/* NEW */
<p data-reveal className="landing-quote__text reveal-delay-2">
  We exist to eliminate the friction between people who need a home and the person who can provide one.
</p>
```

No CSS changes — existing `.landing-quote__text` styling holds (32px italic serif, max-width 680px, centered).

### Listings — header redesign

**File:** `public-site/src/pages/Listings.jsx`

```jsx
/* OLD (lines 68-72) */
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

**File:** `public-site/src/pages/Listings.css`

Update `.listings__title` to be a flex row containing the logo and the word "Homes". Add `.listings__title-logo`. Remove the now-unused `.listings__eyebrow` block.

```css
/* OLD .listings__title (lines 24-30) */
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

@media (max-width: 768px) {
  .listings__title-logo {
    width: 52px;
    height: 52px;
  }
}
```

**Remove:** `.listings__eyebrow` block (lines 15-22) — eyebrow is gone.

The "lot of space at top" Josh asked for: removing the eyebrow drops 20px of stacked text; collapsing two lines (eyebrow + h1) into one (logo + Homes) saves another ~16px of line-height. Net: ~36-40px of vertical breathing room added at the top of the Listings page.

## Risks & verification

1. **Hero photo untouched** — verify `.landing-hero` and its child layers (`.landing-hero__bg`, `.landing-hero__overlay`) have no grain bleeding. Open Landing in Chrome at scrollY=0 and confirm photo reads identically to current live state.
2. **Mobile menu overlay** — verify the new `rgba(236, 227, 210, 0.98)` reads correctly on the mobile menu open state. Toggle hamburger on a mobile-emulated viewport and check.
3. **PropertyPanel mobile sheet** — sheet rises from bottom; shadow is negative-Y. Verify it still reads as a lifted sheet on phone-width viewports.
4. **Map markers** — verify pin markers and cluster bubbles read clearly against varied map terrain (water, parks, dense urban). Shadow should help legibility, not overwhelm.
5. **Step circles** — going from no shadow to a clear lifted shadow. Verify the proportion looks right (small object on a textured surface).
6. **Owners CTA pill** — keeps its terracotta tint. Strengthen the current `0 2px 14px rgba(192, 122, 91, 0.22)` to `0 18px 32px -10px rgba(168, 80, 50, 0.40), 0 6px 14px -6px rgba(40, 26, 12, 0.20)` (custom inline; not generic since it's color-specific). File: `Landing.css:740-741`.
7. **Token cascade** — confirm no page has hardcoded `#F5EDE2`, `#EDE4D6`, or `#FAF6F0` other than the noted spots; grep before merging.

## Verification checklist

- [ ] All four shadow tokens shifted in `tokens.css`
- [ ] Both bg cream tokens shifted (`--bg`, `--bg-warm`)
- [ ] `--bg-nav` rgba updated proportionally
- [ ] Mobile overlay rgba in `NavBar.css:155` updated
- [ ] `.with-grain` class defined in `index.css`
- [ ] `.with-grain` applied to: `.landing-topthree`, `.landing-quote`, `.landing-steps`, `.landing-owners`, `.landing-footer`, `.listings`, `.map-view`, `.my-list` (in MyList.jsx + Picks.jsx), `.owners`
- [ ] `.with-grain` NOT applied to `.landing-hero`
- [ ] 8 hardcoded shadow values updated per the table
- [ ] Landing quote string updated in `Landing.jsx`
- [ ] Listings header restructured (eyebrow removed, h1 contains logo + "Homes")
- [ ] New `.listings__title-logo` styling added; old `.listings__eyebrow` removed
- [ ] Owners CTA pill custom shadow strengthened in `Landing.css`
- [ ] In Chrome on each public-site page: hero clean (Landing), post-hero textured + lifted cards (Landing), new header + lifted cards (Listings), lifted count pill + lifted markers (Map), lifted cards (MyList, Picks), lifted panels (Owners)
- [ ] `npm run build` clean, zero warnings
- [ ] Tested on mobile-emulated viewport (375x667 + 414x896)

## Out of scope this round, noted for follow-up

- Improving the hero diffusion moment — Josh said the existing motion is fine for now; revisit if it reads off after the depth pass lands
- Tightening the `/api/inquiries` 401 silent-logout bug (pre-existing, unrelated)
- Swapping Landing top-three from `?limit=3&sort=newest` to `?featured=true` (pending Bill's first-three picks in admin)
