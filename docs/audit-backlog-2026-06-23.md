# Easy Rental — Audit Backlog (from Session 63, 2026-06-23)

Source: the S63 9-dimension read-only audit (58 confirmed findings; 6 already fixed & shipped).
The S63 "cluster A–F" labels were **never persisted to a file** — this list is regrouped by impact
to Bill and de-duplicated against what's already fixed. Items tagged **(claim)** are audit findings
that still need reproduction against source/DB before fixing.

Full per-finding detail (incl. file/line) is recoverable from the S63 agent transcripts under
`.claude/projects/**/wf_49b09ea0-e7c/`.

---

## Fixed & shipped (this session — commit 739a297, live)

**Data-loss group — property UPDATE path. All three confirmed against source, fixed & verified live.**
- [x] Long-term edit can **silently wipe the monthly rent** — empty price → `null` passes
      `optional({ values: 'falsy' })`, model writes `NULL` (column nullable since migration 023).
- [x] Short-term edit can **clear every rate** → no price shown on `/furnished`.
- [x] Toggling long↔short **strands the other type's price/rates** on the row.

Fix: listing-type-aware UPDATE validation + model normalization + clean form payload.
Gated on `listing_type` presence so the status-flip update (`PropertyDetail.jsx:62`,
sends only `{ status }`) is unaffected.

---

## Security
- [x] Public `/register` endpoint — **locked behind admin auth** (was fully public: anyone could
      create a `tenant` account and mint a JWT). No UI used it; only ever bootstrapped Bill's admin
      account, then promoted via SQL. Chose lock over delete to keep the path for a possible future
      renter-accounts feature. NOTE: `backend/tests/{auth,properties}.test.js` seed users via
      `/register` — now admin-gated; update test seeding when the jest suite is next run (it is not
      in the deploy path, so this didn't break shipping).
- DB password in git history — **ACCEPTED, leave it** (Josh, S61/S63). Not actionable without a Bill window.

## Renter-facing correctness
- [ ] Document/template downloads **403** — private bucket served via `getPublicUrl`. (claim: `DocumentController`)
- [ ] Availability dates show **a day early** — UTC parse. (claim)
- [ ] Inquiry reply uses `mailto:` — should be Gmail compose (standing rule). (claim: `InquiryDetail.jsx`)
- [ ] `/furnished` "Get notified" CTA is `mailto:` + never got Josh's sign-off.
- [ ] `sitemap.xml` missing `/furnished` and other routes.

## Polish / low
- [ ] Geocoder failures silently drop a listing's map pin. (claim: `geocoder.js` bare catch)
- [ ] DRY / minor-UI items (availability display duplicated across PropertyCard/Panel, generic
      error messages, MyList hard-reload on retry, etc.) — batch later.

---

### Already fixed & shipped in S63 (not backlog — here for dedup)
JWT fail-closed guard · featured-occupied pinning · landing leased-badge · editor Documents gate ·
Vercel serverless guard · login/inquiry rate-limit · admin `LoadError` empty-states · furnished-create bug.
