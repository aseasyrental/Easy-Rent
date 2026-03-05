# Property Owners Page — Design

## Summary

Add a "Property Owners" tile to the landing page nav and a new `/owners` page. Soft pitch — highlights services and value without showing pricing. Pushes owners to call/email Bill.

## Landing Page Change

- Third nav tile: "Property Owners", outline style (matches Browse Listings)
- Building/house icon
- Navigates to `/owners`
- Mobile (768px): three tiles in a row, slightly narrower to fit

## `/owners` Page

Single-page layout. Same spatial feel as landing — cream background, glass panels, entrance animations.

### Sections

**Header** — Smaller logo + back link to home

**Hero panel** — Glass panel, centered. Headline: "Let us manage your property." Subtitle: soft one-liner about Easy Rental handling everything.

**Services panel** — 6 services, each with a short value-focused description:

| Service | Description |
|---------|-------------|
| Marketing & Leasing | We find qualified tenants through targeted listings and professional showings. |
| Rent Collection | Monthly rent collected and sent to you via EMT — on time, every time. |
| Maintenance Coordination | We handle repair requests and vendor coordination so you don't get midnight calls. |
| Tenant Relations | All tenant communication managed professionally on your behalf. |
| Financial Reporting | Clear monthly statements so you always know where your property stands. |
| Lease Management | From signing to renewal, we handle the paperwork. |

**CTA section** — Glass panel. "Interested? Let's talk." Call + Email buttons (same gold pill style as landing footer).

### What's NOT on this page

- No pricing (Bill closes in conversation)
- No contract details
- No inquiry form (just phone + email CTAs)

## Styling

- Glass panels: `backdrop-filter: blur`, semi-transparent backgrounds, rounded corners, box shadows
- Entrance animations: same `anim-fade`, `anim-slide-up` as landing
- Mobile-first: stacks vertically on 768px, service cards go single column
- Custom CSS only (no libraries)
