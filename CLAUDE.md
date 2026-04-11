This is new. Josh is different. This work has history and complexities you haven't seen yet. Success comes from understanding. Failure comes from assumption.

# Easy Rental

## IDENTITY — READ THIS FIRST

This project belongs to **Bill A.** (aseasyrental@gmail.com). Not Josh.

| Resource | Owner | Account |
|----------|-------|---------|
| GitHub | Bill's org `aseasyrental` | repo `Easy-Rent` (public). Josh's `steadywellness` has write access. |
| Vercel | Bill | `aseasyrental-sys-projects` (team/pro tier) |
| Supabase | Bill | `qedlpnkbjgvgibhufpiq` on Bill's own org |
| Domain | Bill | `easy-rental.ca` on GoDaddy, DNS points to Vercel |

**Josh builds locally. Everything deploys to Bill's accounts. Not Josh's.**

## DEPLOY PROCEDURE — THIS EXISTS. USE IT.

The deployment procedure for this project is fully built and working. Do not suggest alternatives. Do not ask if deployment needs to be set up. Do not run `npx vercel`. Use the script below.

```bash
bash scripts/deploy.sh [public|admin|all]
```

- **public** — deploys the public site (repo root) to `easy-rental.ca`
- **admin** — deploys the admin dashboard (`admin-dashboard/`) to `admin.easy-rental.ca`
- **all** — deploys both

The script handles: git pre-checks, environment validation, deploy hook trigger, build wait, and smoke tests. It uses Bill's Vercel token from `.env.deploy` (gitignored).

**Deploy checklist:**
1. Make sure changes are committed and pushed to the `bill` remote
2. Run `bash scripts/deploy.sh [public|admin|all]`
3. Script auto-verifies — wait for PASS/FAIL output
4. If smoke tests fail, DO NOT mark deploy as complete

**DO NOT:**
- Run `npx vercel` or `vercel --prod` — this deploys to Josh's Vercel, not Bill's
- Create new Vercel projects — both `easy-rental` and `easy-rental-admin` already exist on Bill's account
- Suggest setting up deployment — it is set up. You are reading the procedure right now.
- Use the Vercel MCP — it's connected to Josh's account, not Bill's

**Deploy hooks (reference only — the script uses these internally):**
- Public: `DEpkiDF50R`
- Admin: `Jb28EmQGRq`

## Stack
React + Express + Supabase + Vercel

## Map
See `EASY-RENTAL-MAP.md` in this directory for full project state.
