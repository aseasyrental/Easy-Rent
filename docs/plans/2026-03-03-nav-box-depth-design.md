# Nav Box Depth & Gold Refinement

**Date:** 2026-03-03
**Scope:** Shell.css only — CSS changes to admin nav boxes

## Problem
Nav boxes are flat glass rectangles with plain white text. They lack depth and don't match the warm gold aesthetic.

## Solution — Inner Glow + Inset Shadow

### `.nav__box` (default)
- Border: `rgba(232, 168, 124, 0.18)` (up from 0.10)
- Add inset shadows: top gold highlight + bottom depth
- Label color: `var(--accent)` (#e8a87c)

### `.nav__box:hover`
- Border: `rgba(232, 168, 124, 0.30)`
- Inset highlight brightens
- Label: `#f0c4a8` (lighter gold)

### `.nav__box--active`
- Border: `rgba(232, 168, 124, 0.35)` (unchanged)
- Inset highlight: `rgba(232, 168, 124, 0.25)`
- Label: `var(--accent)`

### Home button + Sign Out
- Same inset treatment for consistency
- Default color: `var(--accent)`
