# Mobile Responsive Design — Public Site

**Date:** 2026-03-04
**Approach:** CSS-only responsive (no JSX changes)
**Breakpoints:** 768px (primary), 480px (small phone)
**Scope:** Public site only (admin deferred)

## Changes by Component

### NavBar.css
- Logo 72px → 48px at 768px
- Padding tightened
- Link font/padding reduced

### Landing.css
- Migrate 640px → 768px breakpoint
- Fix margin-left/-right bug (logo/tiles going off-screen)
- Hide overlay image on mobile (5.5MB, performance)
- 480px: further tile/tagline/button scaling

### PropertyCard.css
- 768px: aspect-ratio 16/9 instead of fixed 180px height

### FilterBar.css
- 768px: tighter padding, full-width inputs

### PropertyPanel.css
- 480px: smaller thumbnails, reduced padding/font sizes

### MapView.css
- Minor padding adjustment at 768px

### No changes needed
- InquiryForm.css (flex-column, contained in panel)
- CustomSelect.css (relative-positioned in filter bar)
