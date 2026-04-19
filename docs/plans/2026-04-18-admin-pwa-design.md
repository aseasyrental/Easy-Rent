# Admin PWA — Installable to home screen

**Date:** 2026-04-18
**Scope:** `admin-dashboard/` only. Public site not included.
**Constraint:** Clean simple version. No app store, no developer fees, no service worker.

## Goal

Make `admin.easy-rental.ca` installable on Bill's iPhone home screen. Tapping the icon opens the admin fullscreen — no browser chrome, no address bar — and feels like a native app. Android is a bonus path via Chrome.

Nothing about data, auth, or UX changes. This is presentation + manifest only.

## Current state

`admin-dashboard/index.html` already has the iOS web-app meta tags from session 50:

- `apple-mobile-web-app-capable`
- `apple-mobile-web-app-status-bar-style: black-translucent`
- `apple-mobile-web-app-title: Easy Rental`
- `theme-color: #14120f`
- `viewport-fit=cover`

What's missing to make it a real PWA: a manifest, proper icons, and the `<link>` tags that wire them up. Favicon is still Vite's default `vite.svg`.

## What's being added

### Icons (3 files in `admin-dashboard/public/`)

Source: `Easy Circle.png` at the repo root (the gold coin with "EASY-RENTAL" and the key-compass mark, on a dark background). The coin is centered, which crops cleanly to square.

- `icon-512.png` — 512×512 PNG. Square crop around the coin, coin centered on the existing dark background. Used by Android, PWA install, and the browser manifest.
- `icon-192.png` — 192×192 PNG. Same crop, smaller size. Used by Android home screen.
- `apple-touch-icon.png` — 180×180 PNG. Same crop. iOS uses this specifically when added to home screen.

All three are the same image, different resolutions. iOS auto-rounds the corners on install, so no pre-rounded variant is needed.

### Manifest (`admin-dashboard/public/manifest.webmanifest`)

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
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- `name` shown during install prompt and in the app switcher
- `short_name` shown under the icon on the home screen (limited characters)
- `start_url: "/"` — opens at the admin root, which redirects to login if unauthenticated (existing behavior)
- `display: "standalone"` — fullscreen, no browser UI
- `orientation: "portrait"` — admin is mobile-first portrait; prevents accidental landscape
- Colors match the walnut palette already in use

### `index.html` changes

Three line changes in `admin-dashboard/index.html`:

- Replace `<link rel="icon" type="image/svg+xml" href="/vite.svg" />` with `<link rel="icon" type="image/png" href="/icon-192.png" />`
- Add `<link rel="manifest" href="/manifest.webmanifest" />`
- Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`

Nothing else in the file changes. Existing iOS web-app meta tags stay.

## What's intentionally NOT included

- **Service worker / offline mode.** App needs a network connection to load, same as today. A service worker is the right next step if Bill ever reports "I open it on the go and it won't load." Until then, the complexity isn't earned.
- **Install-prompt UI.** No in-app "Install this app" banner. Bill uses Safari's Share menu → Add to Home Screen (one-time).
- **Push notifications.** Not possible on iOS PWA without extra work and recent iOS versions; not in scope.
- **Maskable icon variant.** Android's adaptive-icon masks can crop standard icons awkwardly. The coin is centered with padding, so the standard icon should read fine. If Bill reports Android cropping issues we add a maskable variant.
- **Public site PWA.** Public-site visitors don't need to install anything. Adding a manifest there is a separate decision.

## Install flow (for the passoff / Bill instructions)

**iPhone (Safari):**
1. Open `admin.easy-rental.ca` in Safari
2. Tap the Share icon (square with upward arrow)
3. Scroll down → "Add to Home Screen"
4. Tap "Add"
5. Icon appears on home screen. Tap it — opens fullscreen.

**Android (Chrome):**
1. Open `admin.easy-rental.ca` in Chrome
2. Chrome prompts "Install app" — tap it. (Or three-dot menu → "Install app.")
3. Icon on home screen, opens fullscreen.

## Deploy path

Standard `bash scripts/deploy.sh admin`. Smoke tests confirm the admin is serving. Bill's next visit will see the manifest and icon link; after he adds to home screen, updates flow normally through the deploy hook.

## Verification before declaring done

1. `admin.easy-rental.ca/manifest.webmanifest` returns JSON (not 404, not HTML)
2. `admin.easy-rental.ca/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png` all return images
3. Chrome DevTools → Application → Manifest: shows the manifest with both icons, no errors, installability passes
4. Real iPhone test: Bill installs via Share → Add to Home Screen, confirms icon shows correctly and app opens fullscreen
5. No regression on the existing admin (login still works, properties still load)

## Known gotchas

- Vite serves files from `public/` at the root URL. So `admin-dashboard/public/icon-192.png` → `admin.easy-rental.ca/icon-192.png`. Correct.
- iOS caches the apple-touch-icon aggressively. If the icon looks wrong after install, remove from home screen and re-add — don't just refresh.
- iOS PWAs treat cookies and localStorage as a separate browser context from Safari. Bill will need to log in again the first time he uses the installed app (then JWT persists as normal).
- `display: standalone` means no address bar. If Bill ever needs to check the URL he's on, he has to remove + reinstall. Unlikely for a single-purpose admin app, but worth noting.
