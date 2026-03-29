# Deploy Safety — Design Doc

**Date:** 2026-03-05
**Problem:** Admin dashboard was missing `.env.production`, so API calls fell back to `localhost:5000` on production. No verification caught it before or after deploy. This pattern has caused repeated "it's broken on live" moments.

**Goal:** Make it structurally impossible to deploy without verifying both sites work.

## 1. Fix: Explicit env config files

Each frontend gets a `.env.production` checked into the repo:

- `admin-dashboard/.env.production` — `VITE_API_URL=https://easy-rental.ca/api`
- `public-site/.env.production` — `VITE_API_URL=/api`

Vite reads these automatically on `npm run build`. No reliance on Vercel dashboard env vars for API URLs.

## 2. Deploy wrapper script (`scripts/deploy.sh`)

Single entry point for all deploys. Three phases:

### Pre-check
- Confirms `.env.production` exists for the target site
- Confirms `VITE_API_URL` is set and non-empty
- Refuses to deploy if missing

### Deploy
- Runs `vercel --prod` from the correct directory
- Accepts target: `public`, `admin`, or `all`

### Smoke test
- `easy-rental.ca/api/health` — expects JSON with `status` field
- `easy-rental.ca/api/properties` — expects JSON with `data` array
- `admin.easy-rental.ca` — expects HTTP 200
- Reports pass/fail for each check
- Exits non-zero on any failure

## 3. Workflow impact

Josh's process unchanged: build local, deploy to test, verify, commit.

Claude's process changes:
- Uses `scripts/deploy.sh` instead of raw `vercel --prod`
- Cannot claim "deployed" unless smoke test passes
- Script blocks deploy if config is missing

## Known limitations

- Admin and public share one backend (under easy-rental.ca). If public backend is down, admin is also down. Not a new risk.
- Smoke test runs after deploy, not before. Brief window where site could be broken. Acceptable for this project's scale.
