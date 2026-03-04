# Landing Page Depth Redesign — Design Doc

**Date:** 2026-03-03
**Session:** 13
**Goal:** Transform the flat landing page into a premium, tactile experience with depth, custom controls, typography, and entrance motion.

## Design Principles

- **Mixed depth model:** Inputs/fields feel carved into the surface; panels and buttons float above it
- **Hero stays open** on linen — no container, logo and tagline sit directly on the background
- **No libraries** — custom CSS only, custom dropdown components in React
- **CSS-only animation** — `@keyframes` + `animation-delay`, no JS animation libraries

---

## 1. Typography

- **Google Fonts:** Playfair Display (serif) + DM Sans (sans-serif)
- Load via `<link>` in `index.html`
- Tagline: Playfair Display, italic, ~1.4rem, `--text-mid`
- All other text: DM Sans — labels, buttons, inputs, footer
- Update `--font-main` to `'DM Sans', system-ui, -apple-system, sans-serif`
- Add `--font-display: 'Playfair Display', Georgia, serif`

## 2. Hero

- Logo: warm drop shadow `0 4px 24px rgba(44,36,24,0.18)`
- Tagline: "Rental homes in the Lower Mainland" — Playfair Display italic (remove "managed by Bill")
- Gold rule: CSS animation expands from center (`scaleX(0) → scaleX(1)`)

## 3. Search Panel — Floating Glass Slab

- Multi-layer shadow: `0 2px 8px rgba(44,36,24,0.10), 0 12px 48px rgba(44,36,24,0.12)`
- Bottom edge highlight: `border-bottom: 1px solid rgba(255,255,255,0.4)`
- More vertical padding (~2rem top/bottom) for breathing room
- Existing `backdrop-filter: blur` and `cream-glass` background stay

## 4. Custom Dropdown Component (Type, Bedrooms)

- Replace native `<select>` with a React `CustomSelect` component
- **Trigger:** styled button matching carved-in input look, shows selected label + chevron (CSS triangle or SVG)
- **Panel:** positioned absolutely below trigger, cream background, rounded corners, shadow
  - Options: olive text, hover highlight (olive bg, cream text), check mark on selected
  - Slides down on open (CSS `transform: scaleY(0) → scaleY(1)` with `transform-origin: top`)
- Closes on: outside click, selection, Escape key
- Accessible: keyboard navigation (arrow keys, Enter, Escape), `role="listbox"` / `role="option"`

## 5. Price Inputs

- `$` prefix positioned inside the field (absolute-positioned span, input gets `padding-left`)
- Hide native number spinners: `::-webkit-inner-spin-button`, `::-webkit-outer-spin-button` `display: none`, `-moz-appearance: textfield`
- Same carved-in style as dropdown triggers

## 6. Carved-In Style (Inputs + Dropdown Triggers)

- Background: `rgba(220,213,200,0.5)` — slightly darker than panel surface
- Inset shadow: `inset 0 2px 4px rgba(44,36,24,0.12)` (dark top-left)
- Subtle bottom highlight: `inset 0 -1px 0 rgba(255,255,255,0.5)` (light bottom edge)
- Focus state: inset deepens to `inset 0 2px 6px rgba(44,36,24,0.18)`, olive border appears
- Border: `1px solid rgba(90,78,59,0.12)` (softer than current)

## 7. Buttons — Raised + Tactile

- Shadow: `0 2px 6px rgba(44,36,24,0.12), 0 6px 20px rgba(44,36,24,0.08)`
- Primary (Search Map): subtle inner top highlight `inset 0 1px 0 rgba(255,255,255,0.15)` for convex feel
- Hover: `translateY(-2px)`, shadow grows to `0 4px 12px ..., 0 10px 32px ...`
- Active/press: `translateY(1px)`, shadow shrinks to `0 1px 3px ...` — tactile snap
- Outline button: same shadow treatment, transparent bg

## 8. Footer — Recessed Contact Bar

- Full-width strip with inset shadow: `inset 0 3px 8px rgba(44,36,24,0.15)` (pressed-in top edge)
- Background: `rgba(180,168,148,0.4)` — darker than page linen
- Layout:
  - "Get in touch" — small uppercase DM Sans heading, `--text-mid`
  - Two pill buttons side by side: **"Call Bill"** and **"Email Bill"**
    - Gold background (`--gold`), cream text
    - Raised shadow matching button style
    - Hover: lift + shadow grow (same as main buttons)
  - easy-rental.ca small text link below, `--olive-dark`
- Padding: generous (`2rem` vertical)

## 9. Entrance Animation

CSS `@keyframes` with staggered `animation-delay`. Elements start invisible (`opacity: 0`) and animate to final state.

| Element | Delay | Animation | Duration |
|---------|-------|-----------|----------|
| Logo | 0ms | fade in | 600ms |
| Tagline | 250ms | fade + slide up 16px | 600ms |
| Gold rule | 500ms | expand from center (scaleX) | 500ms |
| Search panel | 700ms | fade + rise up 20px | 600ms |
| Buttons | 950ms | fade in | 400ms |
| Footer | 1100ms | fade + slide up 12px | 500ms |

Total sequence: ~1.6s. `animation-fill-mode: both` so elements stay invisible until their delay.

Keyframes needed:
- `fadeIn` — opacity 0 → 1
- `fadeSlideUp` — opacity 0 + translateY(Npx) → opacity 1 + translateY(0)
- `expandCenter` — scaleX(0) → scaleX(1)

---

## Files to Create

- `public-site/src/components/CustomSelect.jsx` — reusable dropdown component
- `public-site/src/components/CustomSelect.css` — dropdown styles

## Files to Modify

- `public-site/index.html` — add Google Fonts link
- `public-site/src/index.css` — new CSS variables, font update, keyframes
- `public-site/src/pages/Landing.jsx` — custom dropdowns, price input prefix, footer rewrite, animation classes, remove "managed by Bill"
- `public-site/src/pages/Landing.css` — all depth styles, carved-in, raised buttons, recessed footer, entrance animations

## Out of Scope

- NavBar changes (stays as-is)
- Map/Listings pages (separate effort)
- FilterBar on other pages (separate — may adopt CustomSelect later)
