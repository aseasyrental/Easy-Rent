# Admin PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a manifest and three icons so `admin.easy-rental.ca` is installable to the iPhone home screen as a fullscreen PWA.

**Architecture:** Static assets in `admin-dashboard/public/` (Vite serves from `/`). A one-off Node script using `sharp` generates three PNG sizes from the existing `Easy Circle.png`. Three tag edits to `admin-dashboard/index.html` wire it all up. No runtime code, no service worker, no new deps in production.

**Tech Stack:** Vite 7, React 19 (unchanged). `sharp` added as a devDependency for icon generation only.

---

## Reference

Spec: `docs/plans/2026-04-18-admin-pwa-design.md` — read this first if you haven't.

## File Structure

| Path | Action | Purpose |
|---|---|---|
| `admin-dashboard/package.json` | Modify | Add `sharp` to devDependencies |
| `admin-dashboard/package-lock.json` | Modify | Lockfile update from install |
| `admin-dashboard/scripts/generate-icons.mjs` | Create | One-off icon generator (kept for future re-gen) |
| `admin-dashboard/public/icon-192.png` | Create | 192×192 PNG, PWA / Android home screen |
| `admin-dashboard/public/icon-512.png` | Create | 512×512 PNG, PWA install / app switcher |
| `admin-dashboard/public/apple-touch-icon.png` | Create | 180×180 PNG, iOS home screen |
| `admin-dashboard/public/manifest.webmanifest` | Create | Web app manifest |
| `admin-dashboard/index.html` | Modify | 3 `<link>` tag changes in `<head>` |

No source code in `src/` changes. No backend changes.

---

## Task 1: Generate the three icon PNGs

**Files:**
- Create: `admin-dashboard/scripts/generate-icons.mjs`
- Create: `admin-dashboard/public/icon-192.png`
- Create: `admin-dashboard/public/icon-512.png`
- Create: `admin-dashboard/public/apple-touch-icon.png`
- Modify: `admin-dashboard/package.json` (add sharp to devDependencies)
- Modify: `admin-dashboard/package-lock.json` (auto-updated by npm)

Source image: `C:/Users/mrjos/Projects/clients/easy-rent/Easy Circle.png` (repo root — landscape orientation, coin centered on a dark background).

- [ ] **Step 1: Install sharp as a devDependency**

Run from `admin-dashboard/`:

```bash
cd admin-dashboard && npm install --save-dev sharp
```

Expected: `added N packages` output, `sharp` now listed under `devDependencies` in `package.json`.

- [ ] **Step 2: Write the icon generator script**

Create `admin-dashboard/scripts/generate-icons.mjs` with this exact content:

```javascript
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(here, '../../Easy Circle.png');
const OUT_DIR = resolve(here, '../public');

const BG = { r: 0x14, g: 0x12, b: 0x0f, alpha: 1 };

await mkdir(OUT_DIR, { recursive: true });

const { width, height } = await sharp(SOURCE).metadata();
const side = Math.min(width, height);
const left = Math.round((width - side) / 2);
const top = Math.round((height - side) / 2);

async function render(size, filename) {
  await sharp(SOURCE)
    .extract({ left, top, width: side, height: side })
    .resize(size, size, { fit: 'contain', background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(resolve(OUT_DIR, filename));
  console.log(`wrote ${filename} (${size}x${size})`);
}

await render(512, 'icon-512.png');
await render(192, 'icon-192.png');
await render(180, 'apple-touch-icon.png');
```

What it does:
- Reads `Easy Circle.png`, computes a centered square crop (`side = min(width, height)`)
- For each target size, crops to square, resizes, flattens onto `#14120f` (the walnut theme color) so there are no surprise transparencies
- Writes PNGs to `admin-dashboard/public/`

- [ ] **Step 3: Run the script**

From `admin-dashboard/`:

```bash
node scripts/generate-icons.mjs
```

Expected output:
```
wrote icon-512.png (512x512)
wrote icon-192.png (192x192)
wrote apple-touch-icon.png (180x180)
```

- [ ] **Step 4: Verify the three files exist and have correct dimensions**

From `admin-dashboard/`:

```bash
ls -la public/icon-512.png public/icon-192.png public/apple-touch-icon.png
node -e "const s=require('sharp');(async()=>{for(const f of ['public/icon-512.png','public/icon-192.png','public/apple-touch-icon.png']){const m=await s(f).metadata();console.log(f,m.width+'x'+m.height,m.format);}})();"
```

Expected: all 3 files exist. Dimensions print as `512x512 png`, `192x192 png`, `180x180 png`.

- [ ] **Step 5: Visually verify one icon**

Open `admin-dashboard/public/icon-512.png` in the Read tool (or image viewer). Confirm: coin is centered, visible, not cropped at the edges, dark background matches the walnut theme (not pure black, not transparent).

If the coin is cropped or the crop is off-center, adjust `left`/`top` in the script and re-run step 3.

- [ ] **Step 6: Commit**

```bash
cd C:/Users/mrjos/Projects/clients/easy-rent
git add admin-dashboard/package.json admin-dashboard/package-lock.json admin-dashboard/scripts/generate-icons.mjs admin-dashboard/public/icon-512.png admin-dashboard/public/icon-192.png admin-dashboard/public/apple-touch-icon.png
git commit -m "$(cat <<'EOF'
add: PWA icons for admin dashboard

512, 192, and 180px PNGs generated from Easy Circle.png via
scripts/generate-icons.mjs (sharp-based, one-off). Dark walnut
background matches theme.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Write the web manifest

**Files:**
- Create: `admin-dashboard/public/manifest.webmanifest`

- [ ] **Step 1: Write the manifest**

Create `admin-dashboard/public/manifest.webmanifest` with exactly this content:

```json
{
  "name": "Easy Rental Admin",
  "short_name": "Easy Rental",
  "description": "Property management dashboard for Easy Rental.",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#14120f",
  "theme_color": "#14120f",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 2: Validate it parses as JSON**

From `admin-dashboard/`:

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('public/manifest.webmanifest','utf8')).name)"
```

Expected: `Easy Rental Admin`

- [ ] **Step 3: Commit**

```bash
cd C:/Users/mrjos/Projects/clients/easy-rent
git add admin-dashboard/public/manifest.webmanifest
git commit -m "$(cat <<'EOF'
add: web app manifest for admin dashboard

Name, icons, theme colors, standalone display, portrait orientation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Wire the icons and manifest into index.html

**Files:**
- Modify: `admin-dashboard/index.html` (3 line changes in `<head>`)

Current `<head>` (lines 4–14) has the iOS meta tags already; only the favicon link and two new links need changes.

- [ ] **Step 1: Replace the Vite favicon with icon-192.png**

In `admin-dashboard/index.html`, find:

```html
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

Replace with:

```html
    <link rel="icon" type="image/png" href="/icon-192.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- [ ] **Step 2: Verify the file looks right**

Read `admin-dashboard/index.html` and confirm the `<head>` contains:
- `<link rel="icon" type="image/png" href="/icon-192.png" />`
- `<link rel="manifest" href="/manifest.webmanifest" />`
- `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`
- All existing meta tags (viewport, theme-color, apple-mobile-web-app-*, etc.) still present

- [ ] **Step 3: Commit**

```bash
cd C:/Users/mrjos/Projects/clients/easy-rent
git add admin-dashboard/index.html
git commit -m "$(cat <<'EOF'
add: PWA manifest and icon links to admin index.html

Replaces Vite default favicon. Wires manifest.webmanifest and
apple-touch-icon.png so admin.easy-rental.ca is installable.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Build locally and verify the bundle

**Files:** None modified in this task — build output only.

- [ ] **Step 1: Build the admin dashboard**

From `admin-dashboard/`:

```bash
npm run build
```

Expected: `vite build` completes without error. `dist/` directory updated.

- [ ] **Step 2: Verify static assets landed in dist/**

From `admin-dashboard/`:

```bash
ls -la dist/manifest.webmanifest dist/icon-192.png dist/icon-512.png dist/apple-touch-icon.png
```

Expected: all 4 files exist in `dist/`.

- [ ] **Step 3: Verify index.html links survive the build**

From `admin-dashboard/`:

```bash
grep -E "manifest.webmanifest|apple-touch-icon|icon-192" dist/index.html
```

Expected: all three lines present in the built `index.html`.

- [ ] **Step 4: No commit — this task is verification only.**

Nothing to commit. Move to Task 5.

---

## Task 5: Push and deploy

**Files:** None modified.

- [ ] **Step 1: Confirm working tree is clean**

```bash
cd C:/Users/mrjos/Projects/clients/easy-rent && git status
```

Expected: "nothing to commit, working tree clean" (apart from known pre-existing untracked files: `EASY-RENTAL-MAP.md` modified, `.env.vercel`, `ER 3d Logo.jpg`, etc.). **If any of the PWA task files show as uncommitted, stop and commit them before deploying.**

- [ ] **Step 2: Check commit log**

```bash
cd C:/Users/mrjos/Projects/clients/easy-rent && git log --oneline -5
```

Expected: 3 new commits on top of `6b3dfc1` (the spec commit) — icons, manifest, index.html.

- [ ] **Step 3: Push to the `bill` remote**

```bash
cd C:/Users/mrjos/Projects/clients/easy-rent && git push bill master
```

Expected: push succeeds. If Hobby plan rejects due to git identity, the existing commit author config handles it (Bill's email is already configured for this repo).

- [ ] **Step 4: Also push to `origin`**

```bash
cd C:/Users/mrjos/Projects/clients/easy-rent && git push origin master
```

Expected: push succeeds.

- [ ] **Step 5: Run the deploy script**

```bash
cd C:/Users/mrjos/Projects/clients/easy-rent && bash scripts/deploy.sh admin
```

Expected: script triggers Vercel deploy hook, waits for READY, runs smoke tests, prints PASS. If FAIL, stop and diagnose before moving to Task 6.

---

## Task 6: Live verification

**Files:** None modified.

- [ ] **Step 1: Confirm manifest is live**

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://admin.easy-rental.ca/manifest.webmanifest
```

Expected: `200 application/manifest+json` or `200 application/json` (Vercel may serve either; both are acceptable to browsers).

- [ ] **Step 2: Confirm manifest content is correct**

```bash
curl -s https://admin.easy-rental.ca/manifest.webmanifest
```

Expected output: the JSON from Task 2 Step 1, unchanged.

- [ ] **Step 3: Confirm all three icons serve**

```bash
for f in icon-192.png icon-512.png apple-touch-icon.png; do
  echo -n "$f: "
  curl -s -o /dev/null -w "%{http_code} %{size_download}B\n" "https://admin.easy-rental.ca/$f"
done
```

Expected: all three return `200` with non-zero byte sizes.

- [ ] **Step 4: Confirm `<head>` in the live HTML has the new links**

```bash
curl -s https://admin.easy-rental.ca/ | grep -E "manifest.webmanifest|apple-touch-icon|icon-192"
```

Expected: all three `<link>` lines present.

- [ ] **Step 5: Confirm old Vite favicon reference is gone**

```bash
curl -s https://admin.easy-rental.ca/ | grep -c "vite.svg"
```

Expected: `0`.

- [ ] **Step 6: No commit — live verification only.**

---

## Task 7: Browser manifest check (DevTools)

**Files:** None modified.

This uses Claude-in-Chrome to inspect the live manifest via Chrome DevTools protocol, no visual rendering required.

- [ ] **Step 1: Open the live admin URL**

Navigate Chrome to `https://admin.easy-rental.ca/`.

- [ ] **Step 2: Fetch the manifest via fetch() in the page context**

Run in page JS:

```javascript
fetch('/manifest.webmanifest').then(r => r.json()).then(m => ({
  name: m.name,
  display: m.display,
  start_url: m.start_url,
  theme_color: m.theme_color,
  icon_count: m.icons.length,
  icon_sizes: m.icons.map(i => i.sizes)
}))
```

Expected: `{ name: "Easy Rental Admin", display: "standalone", start_url: "/", theme_color: "#14120f", icon_count: 2, icon_sizes: ["192x192", "512x512"] }`.

- [ ] **Step 3: Verify the icons load in the browser**

Run in page JS:

```javascript
Promise.all(['/icon-192.png','/icon-512.png','/apple-touch-icon.png'].map(u =>
  fetch(u).then(r => ({ url: u, ok: r.ok, type: r.headers.get('content-type') }))
))
```

Expected: all three `ok: true`, `type: "image/png"`.

- [ ] **Step 4: Tell Josh the server-side is verified and ask him to do the iPhone install test**

---

## Task 8: Josh installs on his iPhone (real-device verification)

This task is Josh-driven. I provide instructions; Josh runs them.

- [ ] **Step 1: Post install instructions to Josh**

Text to send:

> Server side is live and verified. Please install on your iPhone to confirm the real experience:
> 1. Open Safari on your iPhone
> 2. Go to `admin.easy-rental.ca`
> 3. Log in as admin (or don't — install still works from the login screen)
> 4. Tap the Share icon (square with an arrow pointing up)
> 5. Scroll down in the share sheet → tap "Add to Home Screen"
> 6. You'll see a preview — confirm the icon is the gold coin and the name reads "Easy Rental"
> 7. Tap "Add" (top right)
> 8. Find the icon on your home screen, tap it
> 9. Confirm: app opens fullscreen (no address bar, no browser chrome), icon looks crisp, login or dashboard loads normally

- [ ] **Step 2: Wait for Josh's report**

Possible outcomes:
- **"Works"** — move to Task 9.
- **"Icon looks wrong"** (cropped, off-center, dark corners, etc.) — adjust `generate-icons.mjs` (likely the `left`/`top` crop offsets or the background color), rerun it, commit, redeploy via `deploy.sh admin`, have Josh remove the home-screen icon and reinstall (iOS caches the apple-touch-icon aggressively).
- **"Doesn't open fullscreen"** — inspect manifest `display` field is `"standalone"`, confirm iOS meta tags still in `index.html` (`apple-mobile-web-app-capable: yes`). Likely a cache issue — tell Josh to delete the home screen entry and redo install.

---

## Task 9: Final cleanup and summary

**Files:** None modified.

- [ ] **Step 1: Confirm branch state**

```bash
cd C:/Users/mrjos/Projects/clients/easy-rent && git log --oneline -8
```

Expected: 3 PWA commits (icons / manifest / index.html) on master, pushed to both remotes. Spec commit `6b3dfc1` also present.

- [ ] **Step 2: No map update in this plan**

The map file is owned by the passoff skill. Do NOT edit `EASY-RENTAL-MAP.md` as part of this execution. If Josh runs `/passoff` after, that skill handles the map entry.

- [ ] **Step 3: Report to Josh**

Short end-of-work summary:
- What shipped: manifest, 3 icons, 3 link tags in index.html
- What's deployed: live at admin.easy-rental.ca, all 5 live HTTP checks green
- What's installed: the admin on Josh's phone (after Task 8)
- What's next: when Bill's ready, send him the install steps from Task 8 Step 1

---

## Rollback

If anything on the live site breaks (extremely unlikely — this is additive static content), rollback is:

```bash
cd C:/Users/mrjos/Projects/clients/easy-rent
git revert --no-edit <icons-commit> <manifest-commit> <html-commit>
git push bill master && git push origin master
bash scripts/deploy.sh admin
```

No DB migrations, no env var changes, no runtime code — pure static revert.
