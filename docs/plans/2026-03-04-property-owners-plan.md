# Property Owners Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Property Owners" tile to the landing page and a new `/owners` info page pitching Bill's property management services.

**Architecture:** New React page component (`Owners.jsx` + `Owners.css`) with glass-panel sections. Landing page gets a third nav tile. Route added to `App.jsx`. No backend changes.

**Tech Stack:** React, React Router, custom CSS (glassmorphism)

---

### Task 1: Add route for `/owners` page

**Files:**
- Modify: `public-site/src/App.jsx`
- Create: `public-site/src/pages/Owners.jsx` (placeholder)

**Step 1: Create placeholder Owners page**

Create `public-site/src/pages/Owners.jsx`:

```jsx
import { useNavigate } from 'react-router-dom'

export default function Owners() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Property Owners</h1>
      <button onClick={() => navigate('/')}>Back</button>
    </div>
  )
}
```

**Step 2: Add route to App.jsx**

In `public-site/src/App.jsx`:
- Import: `import Owners from './pages/Owners.jsx'`
- Add route: `<Route path="/owners" element={<Owners />} />` after the `/picks` route
- Add `/owners` to the `isLanding` check so NavBar is hidden: `const isLanding = location.pathname === '/' || location.pathname === '/owners'`

**Step 3: Verify**

Run dev server (`npm run dev` from `public-site/`), navigate to `http://localhost:5173/owners`. Should see placeholder text, no NavBar.

---

### Task 2: Add "Property Owners" tile to landing page

**Files:**
- Modify: `public-site/src/pages/Landing.jsx`
- Modify: `public-site/src/pages/Landing.css`

**Step 1: Add icon and tile to Landing.jsx**

Add a building icon component after the existing icons (around line 11):

```jsx
const IconBuilding = (p) => <I {...p} d="M3 21V3h8v4h10v14H3zM5 5v2h2V5H5zm0 4v2h2V9H5zm0 4v2h2v-2H5zm0 4v2h2v-2H5zm4-12v2h2V5H9zm4 4v2h2V9h-2zm0 4v2h2v-2h-2zm0 4v2h2v-2h-2z" />
```

Add third tile after "Browse Listings" tile (inside `.landing__nav-tiles`):

```jsx
<button className="landing__tile landing__tile--outline" onClick={() => navigate('/owners')}>
  <IconBuilding size={40} />
  <span>Property Owners</span>
</button>
```

**Step 2: Adjust tile sizing in Landing.css for 3 tiles**

At the 768px breakpoint, the tiles sit in a row. Three tiles need to be narrower. Update:

```css
/* In @media (max-width: 768px) */
.landing__tile {
  width: 105px;
  height: 90px;
  font-size: 0.8rem;
}
```

At the 480px breakpoint:

```css
.landing__tile {
  width: 90px;
  height: 75px;
  font-size: 0.72rem;
  border-radius: 14px;
}
```

**Step 3: Verify**

Check landing page at desktop and mobile widths. Three tiles should display — "Search Map" (primary), "Browse Listings" (outline), "Property Owners" (outline). All three fit side-by-side on mobile.

---

### Task 3: Build Owners page — full layout and CSS

**Files:**
- Modify: `public-site/src/pages/Owners.jsx` (replace placeholder)
- Create: `public-site/src/pages/Owners.css`

**Step 1: Write Owners.css**

Create `public-site/src/pages/Owners.css` with:
- `.owners` — full-page layout, cream bg, column flex, min-height 100vh, centered content, padding
- `.owners__header` — flex row, logo + back link, max-width container
- `.owners__logo` — smaller version of landing logo (max-width 200px), same border/shadow treatment
- `.owners__back` — text link, olive color, hover underline
- `.owners__hero` — glass panel (same treatment as `.landing__tagline-panel`), centered, max-width 700px
- `.owners__hero h1` — display font, italic, ~2rem
- `.owners__hero p` — muted text, 1.1rem
- `.owners__services` — grid of 6 items, 2 columns on desktop, 1 on mobile
- `.owners__service` — glass card, padding, border-radius 16px
- `.owners__service h3` — olive color, 1.1rem, margin-bottom 0.5rem
- `.owners__service p` — muted text, 0.95rem
- `.owners__cta` — glass panel, centered, max-width 500px
- `.owners__cta h2` — display font, 1.5rem
- `.owners__cta-buttons` — flex row, gap, centered (reuse `.landing__footer-btn` style but defined locally)
- Responsive 768px: services grid to 1 column, hero/cta padding reduced, CTA buttons stack
- Entrance animations: reuse `.anim-fade`, `.anim-slide-up` classes (defined in Landing.css — need to move to global or duplicate)

**Important:** The animation keyframes (`fadeIn`, `fadeSlideUp`, `expandCenter`) are in `Landing.css`. Either:
- (a) Move them to a shared file (e.g., `public-site/src/index.css` or `App.css`), or
- (b) Duplicate the keyframe definitions in `Owners.css`

Option (b) is simpler and avoids touching Landing.css unnecessarily. Duplicate the 3 keyframes + `.anim-fade` and `.anim-slide-up` classes in `Owners.css`.

**Step 2: Write Owners.jsx**

Replace placeholder with full component:

```jsx
import { useNavigate } from 'react-router-dom'
import './Owners.css'

const I = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
const IconPhone = (p) => <I {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.66 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.73-1.23a2 2 0 0 1 2.11-.45c.75.3 1.54.53 2.35.66A2 2 0 0 1 22 16.92z" />
const IconMail = (p) => <I {...p} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" />
const IconBack = (p) => <I {...p} d="M19 12H5M12 19l-7-7 7-7" />

const services = [
  { title: 'Marketing & Leasing', desc: 'We find qualified tenants through targeted listings and professional showings.' },
  { title: 'Rent Collection', desc: 'Monthly rent collected and sent to you via EMT\u00a0\u2014\u00a0on time, every time.' },
  { title: 'Maintenance Coordination', desc: "We handle repair requests and vendor coordination so you don't get midnight calls." },
  { title: 'Tenant Relations', desc: 'All tenant communication managed professionally on your behalf.' },
  { title: 'Financial Reporting', desc: 'Clear monthly statements so you always know where your property stands.' },
  { title: 'Lease Management', desc: 'From signing to renewal, we handle the paperwork.' },
]

export default function Owners() {
  const navigate = useNavigate()

  return (
    <div className="owners">
      <header className="owners__header anim-fade">
        <button className="owners__back" onClick={() => navigate('/')}>
          <IconBack size={20} /> Home
        </button>
        <img src="/logo-circle.png" alt="Easy Rental" className="owners__logo" />
      </header>

      <section className="owners__hero anim-slide-up" style={{ animationDelay: '150ms' }}>
        <h1>Let us manage your property.</h1>
        <p>Easy Rental handles everything from finding tenants to collecting rent, so you can focus on what matters.</p>
      </section>

      <div className="owners__services">
        {services.map((s, i) => (
          <div key={s.title} className="owners__service anim-slide-up" style={{ animationDelay: `${250 + i * 80}ms` }}>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>

      <section className="owners__cta anim-slide-up" style={{ animationDelay: '750ms' }}>
        <h2>Interested? Let's talk.</h2>
        <div className="owners__cta-buttons">
          <a href="tel:+16042139911" className="owners__cta-btn"><IconPhone size={20} /> Call Easy Rent</a>
          <a href="mailto:aseasyrental@gmail.com" className="owners__cta-btn"><IconMail size={20} /> Email Easy Rent</a>
        </div>
      </section>
    </div>
  )
}
```

**Step 3: Verify**

Navigate to `/owners`. Check:
- Glass panels render with blur + transparency
- 6 service cards in 2-col grid on desktop, 1-col on mobile
- Animations stagger in
- CTA buttons work (tel + mailto)
- Back button returns to landing
- No NavBar visible

---

### Task 4: Final check and commit

**Step 1: Check landing page at all breakpoints**

- Desktop (1200px+): 3 tiles vertical stack, right side
- Tablet (960px): tiles slightly smaller
- Mobile (768px): 3 tiles horizontal row
- Small mobile (480px): 3 tiles fit, smaller text

**Step 2: Check `/owners` at mobile and desktop**

- Services grid collapses to 1 column
- CTA buttons stack
- Everything readable, no overflow

**Step 3: Commit**

```bash
git add public-site/src/pages/Owners.jsx public-site/src/pages/Owners.css public-site/src/pages/Landing.jsx public-site/src/pages/Landing.css public-site/src/App.jsx
git commit -m "feat: add Property Owners tile on landing + /owners info page"
```
