# Admin Dashboard Mobile Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the admin dashboard fully usable on mobile (768px and below) with hamburger nav, stack navigation, and touch-friendly controls.

**Architecture:** CSS-first approach — add `@media (max-width: 768px)` rules to existing CSS files. One new component (MobileNav). Minimal JS changes — Shell gets mobile-aware back button, background image moves from inline style to CSS class for conditional loading. Stack navigation works by making both panels full-viewport and layering ContentPanel above SidePanel via z-index.

**Tech Stack:** React, CSS (no new dependencies)

---

### Task 1: Move background image from inline style to CSS

**Why:** Inline `style={{ backgroundImage }}` can't be overridden by media queries. Moving it to CSS lets us skip loading the ~1MB image on mobile.

**Files:**
- Modify: `admin-dashboard/src/components/Shell.jsx`
- Modify: `admin-dashboard/src/components/Shell.css`

**Step 1: Update Shell.css — add bg image and mobile override**

In Shell.css, update `.shell__bg`:
```css
.shell__bg {
  position: fixed;
  inset: 0;
  background-image: url('../assets/bg-environment.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}
```

Add at end of Shell.css:
```css
/* ===========================
   Mobile — 768px and below
   =========================== */

@media (max-width: 768px) {
  .shell__bg {
    display: none;
  }

  .shell__bg-overlay {
    background: var(--bg-primary, #0a0a0a);
  }
}
```

**Step 2: Remove inline style from Shell.jsx**

Change:
```jsx
<div
  className="shell__bg"
  style={{ backgroundImage: `url(${bgEnvironment})` }}
/>
```
To:
```jsx
<div className="shell__bg" />
```

Remove the `bgEnvironment` import from Shell.jsx.

**Step 3: Verify** — desktop should still show bookshelf. At 768px or below, solid dark background instead.

---

### Task 2: Create MobileNav component

**Files:**
- Create: `admin-dashboard/src/components/MobileNav.jsx`
- Create: `admin-dashboard/src/components/MobileNav.css`

**Step 1: Create MobileNav.jsx**

```jsx
import { useState, useCallback } from 'react';
import './MobileNav.css';

const navItems = [
  { path: '/properties', label: 'Properties' },
  { path: '/messages', label: 'Inquiries' },
  { path: '/templates', label: 'Templates' },
  { path: '/schedule', label: 'Schedule' },
  { path: '/leads', label: 'Leads' },
];

export default function MobileNav({ activeSection, onNavigate, onHome, onLogout }) {
  const [open, setOpen] = useState(false);

  const handleNav = useCallback((path) => {
    onNavigate(path);
    setOpen(false);
  }, [onNavigate]);

  const handleHome = useCallback(() => {
    onHome();
    setOpen(false);
  }, [onHome]);

  const handleLogout = useCallback(() => {
    onLogout();
    setOpen(false);
  }, [onLogout]);

  return (
    <>
      <div className="mobile-nav__header">
        <button
          className="mobile-nav__hamburger"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <span className="mobile-nav__hamburger-line" />
          <span className="mobile-nav__hamburger-line" />
          <span className="mobile-nav__hamburger-line" />
        </button>
        <span className="mobile-nav__title">Easy Rental</span>
      </div>

      {open && (
        <>
          <div className="mobile-nav__backdrop" onClick={() => setOpen(false)} />
          <nav className="mobile-nav__drawer" role="navigation" aria-label="Main navigation">
            <div className="mobile-nav__drawer-header">
              <span className="mobile-nav__drawer-title">Easy Rental</span>
              <button
                className="mobile-nav__drawer-close"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                &#x2715;
              </button>
            </div>

            <div className="mobile-nav__items">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  className={`mobile-nav__item ${activeSection === item.path ? 'mobile-nav__item--active' : ''}`}
                  onClick={() => handleNav(item.path)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mobile-nav__footer">
              <button className="mobile-nav__item" onClick={handleHome}>
                Dashboard Home
              </button>
              <button className="mobile-nav__item mobile-nav__item--logout" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
```

**Step 2: Create MobileNav.css**

```css
/* ===========================
   MobileNav — hidden on desktop, visible on mobile
   =========================== */

.mobile-nav__header,
.mobile-nav__backdrop,
.mobile-nav__drawer {
  display: none;
}

@media (max-width: 768px) {
  /* Top bar */
  .mobile-nav__header {
    display: flex;
    align-items: center;
    gap: 12px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    padding: 0 16px;
    background: rgba(20, 18, 15, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(232, 168, 124, 0.12);
    z-index: 400;
  }

  .mobile-nav__hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 44px;
    height: 44px;
    padding: 10px;
    background: none;
    border: none;
    cursor: pointer;
  }

  .mobile-nav__hamburger-line {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--accent);
    border-radius: 1px;
  }

  .mobile-nav__title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--accent);
    letter-spacing: 0.03em;
  }

  /* Backdrop */
  .mobile-nav__backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 450;
  }

  /* Drawer */
  .mobile-nav__drawer {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    background: rgba(20, 18, 15, 0.95);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border-right: 1px solid rgba(232, 168, 124, 0.15);
    box-shadow: 4px 0 40px rgba(0, 0, 0, 0.4);
    z-index: 500;
    animation: mobileNavSlideIn 0.2s ease forwards;
  }

  @keyframes mobileNavSlideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  .mobile-nav__drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(232, 168, 124, 0.08);
  }

  .mobile-nav__drawer-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--accent);
  }

  .mobile-nav__drawer-close {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--text-secondary);
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Nav items */
  .mobile-nav__items {
    flex: 1;
    padding: 12px 0;
  }

  .mobile-nav__item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 14px 24px;
    min-height: 48px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.95rem;
    font-weight: 500;
    font-family: var(--font-family);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .mobile-nav__item:hover,
  .mobile-nav__item:active {
    background: rgba(232, 168, 124, 0.08);
    color: var(--text-primary);
  }

  .mobile-nav__item--active {
    color: var(--accent);
    background: rgba(232, 168, 124, 0.1);
    border-left: 3px solid var(--accent);
  }

  .mobile-nav__item--logout {
    color: #ef5350;
  }

  .mobile-nav__footer {
    border-top: 1px solid rgba(232, 168, 124, 0.08);
    padding: 8px 0;
  }
}
```

**Step 3: Verify** — component should be invisible on desktop. On mobile, top bar with hamburger should appear.

---

### Task 3: Integrate MobileNav into Shell + hide desktop nav on mobile

**Files:**
- Modify: `admin-dashboard/src/components/Shell.jsx`
- Modify: `admin-dashboard/src/components/Shell.css`

**Step 1: Add MobileNav to Shell.jsx**

Add import:
```jsx
import MobileNav from './MobileNav';
```

Add MobileNav before the `<nav>` element in the JSX return:
```jsx
{/* Mobile navigation */}
<MobileNav
  activeSection={activeSection}
  onNavigate={handleNavClick}
  onHome={handleHomeClick}
  onLogout={logout}
/>
```

**Step 2: Add mobile CSS to Shell.css**

Add inside the existing `@media (max-width: 768px)` block:
```css
  .shell__home,
  .shell__logout {
    display: none;
  }

  .nav {
    display: none;
  }

  .shell {
    padding-top: 56px;
    height: 100vh;
    overflow: hidden;
  }
```

**Step 3: Verify** — on mobile, bookshelf nav boxes + home/logout buttons hidden, hamburger menu visible and functional. Desktop unchanged.

---

### Task 4: SidePanel responsive — full-width on mobile

**Files:**
- Modify: `admin-dashboard/src/components/SidePanel.css`

**Step 1: Add mobile rules at end of SidePanel.css**

```css
@media (max-width: 768px) {
  .side-panel {
    width: 100vw;
    top: 56px;
    height: calc(100vh - 56px);
    border-right: none;
  }

  .side-panel__close {
    width: 44px;
    height: 44px;
    font-size: 1rem;
  }

  .side-panel__item {
    min-height: 48px;
    display: flex;
    align-items: center;
  }

  .side-panel__tab {
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  .side-panel__search-input {
    min-height: 44px;
  }
}
```

**Step 2: Verify** — on mobile, side panel fills viewport below the mobile header. Touch targets are 44px+.

---

### Task 5: ContentPanel responsive — full-width + back arrow on mobile

**Files:**
- Modify: `admin-dashboard/src/components/ContentPanel.css`
- Modify: `admin-dashboard/src/components/ContentPanel.jsx`

**Step 1: Add mobile CSS to ContentPanel.css**

```css
@media (max-width: 768px) {
  .content-panel {
    width: 100vw;
    top: 56px;
    height: calc(100vh - 56px);
    border-left: none;
    z-index: 350;
  }

  .content-panel__close {
    width: 44px;
    height: 44px;
    font-size: 1rem;
  }

  .content-panel__header {
    padding: 16px;
  }

  .content-panel__body {
    padding: 16px;
  }

  .content-panel__close--mobile-back {
    border: none;
    border-radius: 0;
    font-size: 1.2rem;
    width: 44px;
    height: 44px;
  }
}
```

**Step 2: Update ContentPanel.jsx close button for mobile**

Change the close button to show a back arrow on mobile:
```jsx
<button className="content-panel__close content-panel__close--mobile-back" onClick={onClose} aria-label="Back">
  &#x2190;
</button>
```

Note: On desktop the `&#x2190;` (left arrow) works fine as a close indicator too. If Josh prefers X on desktop and arrow on mobile, we can use CSS to swap. Start with arrow for both — simpler.

**Step 3: Verify** — on mobile, content panel covers the full screen above the side panel. Back arrow returns to list.

---

### Task 6: PropertyForm responsive — single column, touch inputs

**Files:**
- Modify: `admin-dashboard/src/components/PropertyForm.css`

**Step 1: Read PropertyForm.css to find grid rules**

**Step 2: Add mobile rules**

```css
@media (max-width: 768px) {
  .prop-form__grid {
    grid-template-columns: 1fr;
  }

  .prop-form__input,
  .prop-form__select,
  .prop-form__textarea {
    min-height: 44px;
    font-size: 16px; /* prevents iOS zoom on focus */
  }

  .prop-form__actions {
    flex-direction: column;
  }

  .prop-form__actions button {
    width: 100%;
    min-height: 48px;
  }
}
```

**Step 3: Verify** — property form stacks to single column on mobile, inputs are touch-friendly, no iOS zoom.

---

### Task 7: PropertyDetail responsive — hero + grid

**Files:**
- Modify: `admin-dashboard/src/components/PropertyDetail.css`

**Step 1: Read PropertyDetail.css to find layout rules**

**Step 2: Add mobile rules**

```css
@media (max-width: 768px) {
  .prop-detail__hero {
    height: 180px;
  }

  .prop-detail__grid {
    grid-template-columns: 1fr;
  }

  .prop-detail__actions {
    flex-direction: column;
    gap: 8px;
  }

  .prop-detail__actions button {
    width: 100%;
    min-height: 48px;
  }

  .prop-detail__status-dropdown {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    border-radius: 16px 16px 0 0;
    padding: 16px;
    z-index: 600;
  }
}
```

**Step 3: Verify** — property detail stacks on mobile, hero scales down, status dropdown shows as bottom sheet.

---

### Task 8: ImageUploader mobile — larger thumbnails, simpler reorder

**Files:**
- Modify: `admin-dashboard/src/components/ImageUploader.css`
- Modify: `admin-dashboard/src/components/ImageUploader.jsx`

**Step 1: Read ImageUploader.jsx to understand drag/reorder mechanism**

**Step 2: Add mobile CSS**

```css
@media (max-width: 768px) {
  .img-uploader__dropzone {
    padding: 24px 16px;
    min-height: 80px;
  }

  .img-uploader__thumb {
    width: 72px;
    height: 72px;
  }

  .img-uploader__thumb-actions button {
    min-width: 32px;
    min-height: 32px;
  }

  .img-uploader__thumb-container {
    gap: 8px;
  }
}
```

**Step 3: Add `capture="environment"` to the file input** in ImageUploader.jsx so mobile users get camera option:

Find the file input and add:
```jsx
<input type="file" accept="image/*" capture="environment" multiple ... />
```

Note: `capture="environment"` opens camera by default on mobile. Users can still choose gallery.

**Step 4: Verify** — thumbnails larger on mobile, camera opens when tapping upload.

---

### Task 9: InquiryDetail + InquiriesSidePanel responsive

**Files:**
- Modify: `admin-dashboard/src/components/InquiryDetail.css`
- Modify: `admin-dashboard/src/components/InquiriesSidePanel.css`

**Step 1: Add mobile rules to InquiryDetail.css**

```css
@media (max-width: 768px) {
  .inquiry-detail__actions {
    flex-direction: column;
  }

  .inquiry-detail__actions button {
    width: 100%;
    min-height: 48px;
  }

  .inquiry-detail__reply-textarea {
    min-height: 120px;
    font-size: 16px;
  }

  .inquiry-detail__grid {
    grid-template-columns: 1fr;
  }
}
```

**Step 2: Add mobile rules to InquiriesSidePanel.css**

```css
@media (max-width: 768px) {
  .inq-side__item {
    min-height: 48px;
  }

  .inq-side__tab {
    min-height: 44px;
  }

  .inq-side__search-input {
    min-height: 44px;
  }
}
```

**Step 3: Verify** — inquiry list and detail are touch-friendly on mobile.

---

### Task 10: PropertiesSidePanel + TemplatesSidePanel + DocumentUploader responsive

**Files:**
- Modify: `admin-dashboard/src/components/PropertiesSidePanel.css`
- Modify: `admin-dashboard/src/components/TemplatesSidePanel.css`
- Modify: `admin-dashboard/src/components/DocumentUploader.css`

**Step 1: Add mobile rules to PropertiesSidePanel.css**

```css
@media (max-width: 768px) {
  .prop-side__add {
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .prop-side__tab {
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  .prop-side__search-input {
    min-height: 44px;
  }

  .prop-side__item {
    min-height: 48px;
  }
}
```

**Step 2: Add mobile rules to TemplatesSidePanel.css**

```css
@media (max-width: 768px) {
  .templates-panel__input,
  .templates-panel__select {
    min-height: 44px;
    font-size: 16px;
  }

  .templates-panel__upload-btn {
    min-height: 48px;
  }

  .templates-panel__download,
  .templates-panel__delete {
    width: 44px;
    height: 44px;
  }
}
```

**Step 3: Extend DocumentUploader.css breakpoint from 480px to 768px**

Change:
```css
@media (max-width: 480px) {
```
To:
```css
@media (max-width: 768px) {
```

**Step 4: Verify** — all list panels have 44px+ touch targets. Templates upload/delete buttons are thumb-friendly.

---

### Task 11: Login page responsive

**Files:**
- Modify: `admin-dashboard/src/pages/Login.css`
- Modify: `admin-dashboard/src/pages/Login.jsx`

**Step 1: Add mobile rules to Login.css**

```css
@media (max-width: 768px) {
  .login__panel {
    width: 100%;
    max-width: 360px;
    margin: 0 16px;
    padding: 32px 24px;
  }

  .login__input {
    min-height: 44px;
    font-size: 16px;
  }

  .login__submit {
    min-height: 48px;
  }

  .login__bg {
    display: none;
  }

  .login__bg-overlay {
    background: var(--bg-primary, #0a0a0a);
  }
}
```

**Step 2: Verify** — login page fills mobile screen with centered form, no background image load.

---

### Task 12: Final verification and deploy

**Step 1: Build check**

```bash
cd admin-dashboard && npm run build
```

Expected: clean build, no errors.

**Step 2: Browser verification**

Open admin dashboard at localhost. Use browser DevTools to test at 375px (iPhone) and 768px (breakpoint boundary):

- [ ] Login page: centered form, touch-friendly inputs, no background image
- [ ] Hamburger menu: opens/closes, all nav items work
- [ ] Properties list: full-width, touch targets, search works
- [ ] Property detail: full-screen, back arrow returns to list, hero scales
- [ ] Property form: single column, inputs touch-friendly, no iOS zoom
- [ ] Image upload: camera opens, larger thumbnails
- [ ] Inquiries list: touch targets, items tappable
- [ ] Inquiry detail: full-screen, reply textarea comfortable
- [ ] Templates: upload button, download/delete targets
- [ ] Desktop unchanged: bookshelf nav, side-by-side panels

**Step 3: Deploy**

```bash
cd admin-dashboard && vercel --prod
```

**Step 4: Test on actual phone** — Josh opens admin on his phone, walks through each section.
