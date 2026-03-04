# Admin Dashboard + Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Bill's admin dashboard (login, properties CRUD, image upload, inquiry management) and deploy everything to Vercel with easy-rental.ca domain.

**Architecture:** Single repo, two Vercel projects. Public site + Express API serverless on `easy-rental.ca`. Admin dashboard on `admin.easy-rental.ca`. Direct browser-to-Supabase image uploads. Supabase PostgreSQL for data.

**Tech Stack:** React 19, Vite, Express.js, pg-promise, Supabase JS client, Vercel serverless, JWT auth.

---

## Phase 1: Backend — New Endpoints for Admin Dashboard

### Task 1: Inquiry list endpoint (admin)

The admin dashboard needs to list all inquiries. Currently the backend only has `POST /api/inquiries` (create). We need `GET /api/inquiries` (list) and `GET /api/inquiries/:id` (detail).

**Files:**
- Modify: `backend/src/models/InquiryModel.js`
- Modify: `backend/src/controllers/InquiryController.js`
- Modify: `backend/src/routes/inquiryRoutes.js`
- Modify: `backend/src/app.js` (inquiry routes need auth-protected GET)
- Modify: `backend/tests/inquiries.test.js`

**Step 1: Write failing tests**

Add to `backend/tests/inquiries.test.js`:

```js
describe('GET /api/inquiries', () => {
  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/inquiries');
    expect(res.status).toBe(401);
  });

  it('should return 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/inquiries')
      .set('Authorization', `Bearer ${tenantToken}`);
    expect(res.status).toBe(403);
  });

  it('should list all inquiries for admin', async () => {
    // Create a property and inquiry first
    const prop = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test', address: '123 St', price: 1500 });

    await request(app)
      .post('/api/inquiries')
      .send({ property_id: prop.body.id, name: 'Jane', email: 'jane@test.com', message: 'Hi' });

    const res = await request(app)
      .get('/api/inquiries')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('property_title');
  });
});

describe('GET /api/inquiries/:id', () => {
  it('should return inquiry detail with property info', async () => {
    const prop = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Detail Test', address: '456 St', price: 2000 });

    const inquiry = await request(app)
      .post('/api/inquiries')
      .send({ property_id: prop.body.id, name: 'Bob', email: 'bob@test.com', message: 'Interested' });

    const res = await request(app)
      .get(`/api/inquiries/${inquiry.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Bob');
    expect(res.body.property_title).toBe('Detail Test');
  });
});
```

**Step 2: Run tests, confirm they fail**

```bash
cd backend && npm test -- --testPathPattern=inquiries
```

**Step 3: Implement InquiryModel methods**

Add to `backend/src/models/InquiryModel.js`:

```js
static async findAll(filters = {}) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (filters.status) {
    conditions.push(`i.status = $${idx++}`);
    values.push(filters.status);
  }
  if (filters.property_id) {
    conditions.push(`i.property_id = $${idx++}`);
    values.push(filters.property_id);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  return db.any(
    `SELECT i.*, p.title AS property_title, p.address AS property_address
     FROM inquiries i
     LEFT JOIN properties p ON p.id = i.property_id
     ${where}
     ORDER BY i.created_at DESC`,
    values
  );
}

static async findById(id) {
  return db.oneOrNone(
    `SELECT i.*, p.title AS property_title, p.address AS property_address
     FROM inquiries i
     LEFT JOIN properties p ON p.id = i.property_id
     WHERE i.id = $1`,
    [id]
  );
}

static async updateStatus(id, status) {
  return db.oneOrNone(
    'UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
}
```

**Step 4: Implement controller methods**

Add to `backend/src/controllers/InquiryController.js`:

```js
static async list(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      property_id: req.query.property_id,
    };
    const data = await InquiryModel.findAll(filters);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

static async getById(req, res, next) {
  try {
    const inquiry = await InquiryModel.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }
    res.json(inquiry);
  } catch (error) {
    next(error);
  }
}

static async updateStatus(req, res, next) {
  try {
    const inquiry = await InquiryModel.updateStatus(req.params.id, req.body.status);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }
    res.json(inquiry);
  } catch (error) {
    next(error);
  }
}
```

**Step 5: Add routes**

Add to `backend/src/routes/inquiryRoutes.js`:

```js
import { param, query } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/index.js';

router.get(
  '/',
  authenticate,
  requireAdmin,
  [
    query('status').optional().isIn(['new', 'responded', 'scheduled', 'closed']),
    query('property_id').optional().isInt({ min: 1 }),
  ],
  handleValidation,
  InquiryController.list,
);

router.get(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').isInt({ min: 1 })],
  handleValidation,
  InquiryController.getById,
);

router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['new', 'responded', 'scheduled', 'closed']),
  ],
  handleValidation,
  InquiryController.updateStatus,
);
```

**Step 6: Run tests, confirm they pass**

```bash
cd backend && npm test
```

**Step 7: Commit**

```bash
git add backend/src/models/InquiryModel.js backend/src/controllers/InquiryController.js backend/src/routes/inquiryRoutes.js backend/tests/inquiries.test.js
git commit -m "feat: add inquiry list, detail, and status update endpoints for admin"
```

---

### Task 2: Inquiry count on property list

The admin dashboard shows inquiry counts on property cards. Add `inquiry_count` to the property list response.

**Files:**
- Modify: `backend/src/models/PropertyModel.js` (findFiltered query)
- Modify: `backend/tests/properties.test.js`

**Step 1: Write failing test**

```js
it('should include inquiry_count in property list', async () => {
  const prop = await request(app)
    .post('/api/properties')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Count Test', address: '789 St', price: 1000 });

  await request(app)
    .post('/api/inquiries')
    .send({ property_id: prop.body.id, name: 'A', email: 'a@t.com', message: 'Hi' });

  const res = await request(app)
    .get('/api/properties')
    .set('Authorization', `Bearer ${adminToken}`);
  const found = res.body.data.find(p => p.id === prop.body.id);
  expect(found.inquiry_count).toBe(1);
});
```

**Step 2: Run test, confirm fail**

**Step 3: Add LEFT JOIN + COUNT to findFiltered**

In `PropertyModel.findFiltered`, change the data query to:

```js
const data = await db.any(
  `SELECT p.*, COALESCE(ic.cnt, 0)::int AS inquiry_count
   FROM properties p
   LEFT JOIN (SELECT property_id, COUNT(*)::int AS cnt FROM inquiries GROUP BY property_id) ic
     ON ic.property_id = p.id
   ${where} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx++}`,
  [...values, limit, offset]
);
```

**Step 4: Run tests, confirm pass**

**Step 5: Commit**

```bash
git add backend/src/models/PropertyModel.js backend/tests/properties.test.js
git commit -m "feat: add inquiry_count to property list response"
```

---

### Task 3: Image metadata endpoint (for direct Supabase uploads)

The admin dashboard uploads images directly to Supabase Storage, then tells the backend the URL. Add a metadata-only POST endpoint alongside the existing file-upload one.

**Files:**
- Modify: `backend/src/routes/propertyMediaRoutes.js`
- Modify: `backend/src/controllers/PropertyMediaController.js`
- Modify: `backend/tests/property-media.test.js`

**Step 1: Write failing test**

```js
describe('POST /api/properties/:id/images/metadata', () => {
  it('should save image metadata without file upload', async () => {
    const prop = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Meta Test', address: '111 St', price: 1200 });

    const res = await request(app)
      .post(`/api/properties/${prop.body.id}/images/metadata`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        url: 'https://example.com/photo.jpg',
        is_primary: true,
        sort_order: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body.url).toBe('https://example.com/photo.jpg');
    expect(res.body.is_primary).toBe(true);
  });
});
```

**Step 2: Run test, confirm fail**

**Step 3: Add controller method**

```js
static async createFromUrl(req, res, next) {
  try {
    const property = await PropertyModel.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const { url, is_primary, sort_order } = req.body;

    if (is_primary) {
      await PropertyMediaModel.setPrimary(req.params.id, null);
    }

    const media = await PropertyMediaModel.create({
      property_id: req.params.id,
      type: 'photo',
      url,
      sort_order: sort_order || 0,
      is_primary: is_primary || false,
    });

    res.status(201).json(media);
  } catch (error) {
    next(error);
  }
}
```

**Step 4: Add route**

```js
router.post(
  '/metadata',
  authenticate,
  requireAdmin,
  [...idParam, body('url').isURL().withMessage('Valid URL is required')],
  handleValidation,
  PropertyMediaController.createFromUrl,
);
```

**Step 5: Run tests, confirm pass**

**Step 6: Commit**

```bash
git add backend/src/routes/propertyMediaRoutes.js backend/src/controllers/PropertyMediaController.js backend/tests/property-media.test.js
git commit -m "feat: add image metadata endpoint for direct Supabase uploads"
```

---

### Task 4: Update CORS for admin subdomain

**Files:**
- Modify: `backend/src/app.js`
- Modify: `backend/.env`

**Step 1: Update .env**

```
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,https://easy-rental.ca,https://admin.easy-rental.ca
```

The existing CORS code already supports comma-separated origins, so no code change needed — just the env var.

**Step 2: Verify**

```bash
cd backend && npm test
```

**Step 3: Commit**

```bash
git add backend/.env.example
git commit -m "chore: add production origins to CORS allowlist"
```

Note: Don't commit `.env` itself. Update `.env.example` with the new format.

---

## Phase 2: Admin Dashboard — Authentication

### Task 5: Auth context

Manages JWT state across the app. Protects routes. Handles login/logout.

**Files:**
- Create: `admin-dashboard/src/context/AuthContext.jsx`
- Modify: `admin-dashboard/src/App.jsx`

**Step 1: Create AuthContext**

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

**Step 2: Wire into App.jsx**

```jsx
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Shell from './components/Shell';
import Login from './pages/Login.jsx';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Login />;
  return <Shell />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

**Step 3: Verify build**

```bash
cd admin-dashboard && npx vite build
```

**Step 4: Commit**

```bash
git add admin-dashboard/src/context/AuthContext.jsx admin-dashboard/src/App.jsx
git commit -m "feat: add auth context and route protection to admin dashboard"
```

---

### Task 6: Login page

**Files:**
- Create: `admin-dashboard/src/pages/Login.jsx`
- Create: `admin-dashboard/src/pages/Login.css`

**Step 1: Create Login component**

```jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import bgEnvironment from '../assets/bg-environment.png';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <div className="login__bg" style={{ backgroundImage: `url(${bgEnvironment})` }} />
      <div className="login__bg-overlay" />

      <form className="login__panel" onSubmit={handleSubmit}>
        <h1 className="login__title">Easy Rental</h1>
        <p className="login__subtitle">Admin Dashboard</p>

        {error && <div className="login__error">{error}</div>}

        <label className="login__label">
          Email
          <input
            className="login__input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label className="login__label">
          Password
          <input
            className="login__input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>

        <button className="login__submit" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
```

**Step 2: Create Login.css**

```css
.login {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.login__bg {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.login__bg-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.5) 100%);
  z-index: 1;
}

.login__panel {
  position: relative;
  z-index: 10;
  width: 360px;
  padding: 40px 32px;
  background: rgba(20, 18, 15, 0.6);
  backdrop-filter: blur(40px) saturate(1.2);
  -webkit-backdrop-filter: blur(40px) saturate(1.2);
  border: 1px solid rgba(232, 168, 124, 0.12);
  border-radius: 24px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4), 0 0 60px rgba(232, 168, 124, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--accent);
  text-align: center;
  letter-spacing: 0.03em;
}

.login__subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  margin-top: -8px;
}

.login__error {
  padding: 10px 14px;
  background: rgba(220, 80, 80, 0.15);
  border: 1px solid rgba(220, 80, 80, 0.3);
  border-radius: 12px;
  color: #f0a0a0;
  font-size: 0.85rem;
  text-align: center;
}

.login__label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.login__input {
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: var(--font-family);
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.login__input:focus {
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.08);
}

.login__submit {
  margin-top: 8px;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: var(--accent);
  color: #1a1a1a;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.login__submit:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.login__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Step 3: Verify build**

```bash
cd admin-dashboard && npx vite build
```

**Step 4: Commit**

```bash
git add admin-dashboard/src/pages/Login.jsx admin-dashboard/src/pages/Login.css
git commit -m "feat: add login page to admin dashboard"
```

---

## Phase 3: Admin Dashboard — Properties

### Task 7: Properties SidePanel — wire to real API

Replace hardcoded placeholder data with real API calls. Add health indicators.

**Files:**
- Create: `admin-dashboard/src/components/PropertiesSidePanel.jsx`
- Create: `admin-dashboard/src/components/PropertiesSidePanel.css`
- Modify: `admin-dashboard/src/components/SidePanel.jsx` (delegate to section-specific panels)

**Step 1: Create PropertiesSidePanel**

This component replaces the generic SidePanel content when `activeSection === '/properties'`. It fetches real properties from the API, shows tabs (All/Available/Occupied/Maintenance), displays health indicators, and has an "Add Property" button.

```jsx
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api.js';
import './PropertiesSidePanel.css';

const STATUS_TABS = [
  { label: 'All', value: null },
  { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Maintenance', value: 'maintenance' },
];

export default function PropertiesSidePanel({ onSelectItem, onAddNew }) {
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const statusFilter = STATUS_TABS[activeTab].value;

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/properties', { params });
      setProperties(res.data.data);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const filtered = search
    ? properties.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase())
      )
    : properties;

  return (
    <div className="prop-side">
      <button className="prop-side__add" onClick={onAddNew}>
        + Add Property
      </button>

      <div className="prop-side__tabs">
        {STATUS_TABS.map((tab, i) => (
          <button
            key={tab.label}
            className={`prop-side__tab ${i === activeTab ? 'prop-side__tab--active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="prop-side__search">
        <input
          type="text"
          placeholder="Search properties..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="prop-side__search-input"
        />
      </div>

      <div className="prop-side__items">
        {loading ? (
          <p className="prop-side__loading">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="prop-side__empty">
            {properties.length === 0
              ? <><p>Add your first listing</p><button className="prop-side__empty-cta" onClick={onAddNew}>+ Add Property</button></>
              : <p>No matches</p>
            }
          </div>
        ) : (
          filtered.map(prop => (
            <button
              key={prop.id}
              className="prop-side__item"
              onClick={() => onSelectItem(prop)}
            >
              <div className="prop-side__item-top">
                <span className="prop-side__item-title">{prop.title}</span>
                <span className={`prop-side__status prop-side__status--${prop.status}`}>
                  {prop.status}
                </span>
              </div>
              <div className="prop-side__item-address">{prop.address}</div>
              <div className="prop-side__item-bottom">
                <span className="prop-side__item-price">
                  ${Number(prop.price).toLocaleString()}/mo
                </span>
                <span className="prop-side__item-meta">
                  {prop.bedrooms}bd / {prop.bathrooms}ba
                </span>
                <div className="prop-side__health">
                  {(prop.inquiry_count || 0) > 0 && (
                    <span className="prop-side__health-badge" title={`${prop.inquiry_count} inquiries`}>
                      {prop.inquiry_count}
                    </span>
                  )}
                  {!prop.images?.length && prop.inquiry_count === 0 && (
                    <span className="prop-side__health-icon" title="No photos">📷</span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create PropertiesSidePanel.css** — style to match existing SidePanel patterns (reuse `side-panel__tab`, `side-panel__item` class styles as reference, adapt for property cards with status badges and health icons).

**Step 3: Update SidePanel.jsx** to render `<PropertiesSidePanel>` when `activeSection === '/properties'` instead of the generic config.

**Step 4: Verify build + visual test**

```bash
cd admin-dashboard && npx vite build
```

**Step 5: Commit**

```bash
git add admin-dashboard/src/components/PropertiesSidePanel.jsx admin-dashboard/src/components/PropertiesSidePanel.css admin-dashboard/src/components/SidePanel.jsx
git commit -m "feat: wire properties side panel to real API with health indicators"
```

---

### Task 8: Properties ContentPanel — View mode

Replace the placeholder ContentPanel with a real property detail view when a property is selected.

**Files:**
- Create: `admin-dashboard/src/components/PropertyDetail.jsx`
- Create: `admin-dashboard/src/components/PropertyDetail.css`
- Modify: `admin-dashboard/src/components/ContentPanel.jsx`

**Step 1: Create PropertyDetail**

Shows: all property fields, image gallery, status toggle, Edit button, Archive button, "See what renters see" preview, inquiry count.

The component receives a `property` prop (from the side panel click), but fetches the full detail (with images) from `GET /api/properties/:id`.

Key elements:
- Hero image area with thumbnail gallery
- Property fields in a readable layout
- Status badge with quick-toggle dropdown (Available/Occupied/Maintenance) — calls `PUT /api/properties/:id`
- Edit button → triggers `onEdit(property)` callback
- Archive button → confirm dialog with property title, then `DELETE /api/properties/:id`
- "See what renters see" button → opens `https://easy-rental.ca/listings?preview=:id` in new tab (or in dev: localhost:5173)

**Step 2: Create PropertyDetail.css** — glass panel styling matching existing ContentPanel patterns.

**Step 3: Update ContentPanel.jsx** to detect when the selected item is a property (has `property_id` or comes from `/properties` section) and render `<PropertyDetail>` instead of the placeholder.

**Step 4: Verify build + visual test**

**Step 5: Commit**

```bash
git add admin-dashboard/src/components/PropertyDetail.jsx admin-dashboard/src/components/PropertyDetail.css admin-dashboard/src/components/ContentPanel.jsx
git commit -m "feat: add property detail view mode in content panel"
```

---

### Task 9: Properties ContentPanel — Edit mode + Add Property

**Files:**
- Create: `admin-dashboard/src/components/PropertyForm.jsx`
- Create: `admin-dashboard/src/components/PropertyForm.css`
- Modify: `admin-dashboard/src/components/PropertyDetail.jsx`

**Step 1: Create PropertyForm**

A form component used for both editing and creating properties. Receives optional `property` prop (for edit) or nothing (for add).

Fields: title, address, city, province, postal_code, price, bedrooms, bathrooms, sqft, property_type (dropdown), availability_date, status, description, amenities (comma-separated text → array), lease_term_months, deposit_amount, neighborhood_info, latitude, longitude.

- Empty-field guidance: "Start with the basics — address, price, and a few photos."
- Save → calls `POST /api/properties` (new) or `PUT /api/properties/:id` (edit)
- On save success: transitions back to view mode via `onSave(savedProperty)` callback
- Cancel → returns to view mode via `onCancel()` callback
- Province defaults to "BC"
- property_type uses a dropdown with the 7 types

**Step 2: Create PropertyForm.css** — carved-in input style matching the design system.

**Step 3: Wire into PropertyDetail** — Edit button sets `editing: true` state, renders `<PropertyForm>` instead of the view layout. On save, refetches the property and returns to view mode.

**Step 4: Wire "Add Property" into Shell** — the `onAddNew` callback from PropertiesSidePanel opens the ContentPanel with an empty PropertyForm.

**Step 5: Verify build + visual test**

**Step 6: Commit**

```bash
git add admin-dashboard/src/components/PropertyForm.jsx admin-dashboard/src/components/PropertyForm.css admin-dashboard/src/components/PropertyDetail.jsx admin-dashboard/src/components/Shell.jsx
git commit -m "feat: add property edit form and add-new flow"
```

---

### Task 10: Image upload component (direct to Supabase)

**Files:**
- Create: `admin-dashboard/src/components/ImageUploader.jsx`
- Create: `admin-dashboard/src/components/ImageUploader.css`
- Modify: `admin-dashboard/src/components/PropertyForm.jsx` (embed the uploader)
- Modify: `admin-dashboard/package.json` (add `@supabase/supabase-js`)

**Step 1: Install Supabase client**

```bash
cd admin-dashboard && npm install @supabase/supabase-js
```

**Step 2: Create Supabase client config**

Create `admin-dashboard/src/config/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default supabase;
```

**Step 3: Create ImageUploader**

Features:
- Drag-and-drop zone + click to select
- Shows upload progress
- On upload complete: calls `POST /api/properties/:id/images/metadata` with the Supabase URL
- Displays existing images as draggable thumbnails
- Click thumbnail to set as primary (golden border)
- X on thumbnail to delete (calls `DELETE /api/properties/:id/images/:imageId`)
- Reorder via drag (updates `sort_order` — needs a new PATCH endpoint or batched PUT)

Upload flow:
```
1. File dropped/selected
2. Generate unique path: `{property_id}/{uuid}.{ext}`
3. supabase.storage.from('property-images').upload(path, file)
4. Get public URL via supabase.storage.from('property-images').getPublicUrl(path)
5. POST /api/properties/:id/images/metadata { url, is_primary, sort_order }
6. Add to thumbnail list
```

**Step 4: Create ImageUploader.css** — dropzone with dashed border, hover glow, thumbnail grid.

**Step 5: Embed in PropertyForm** — show below the form fields when editing an existing property (needs property_id). For new properties: show after the first save (save creates the property, then enable uploads).

**Step 6: Verify build**

**Step 7: Commit**

```bash
git add admin-dashboard/src/components/ImageUploader.jsx admin-dashboard/src/components/ImageUploader.css admin-dashboard/src/config/supabase.js admin-dashboard/src/components/PropertyForm.jsx admin-dashboard/package.json admin-dashboard/package-lock.json
git commit -m "feat: add drag-and-drop image upload via Supabase Storage"
```

---

## Phase 4: Admin Dashboard — Inquiries

### Task 11: Inquiries SidePanel — wire to real API

**Files:**
- Create: `admin-dashboard/src/components/InquiriesSidePanel.jsx`
- Create: `admin-dashboard/src/components/InquiriesSidePanel.css`
- Modify: `admin-dashboard/src/components/SidePanel.jsx`

**Step 1: Create InquiriesSidePanel**

Similar pattern to PropertiesSidePanel. Tabs: New / Read / All. Fetches from `GET /api/inquiries` with status filter. Each card shows: renter name, property title, relative timestamp, first line of message. New inquiries get a glow class. Unread count badge on "New" tab.

Helper for relative time:
```js
function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
```

**Step 2: Create CSS, update SidePanel.jsx routing.**

**Step 3: Verify build + visual test**

**Step 4: Commit**

```bash
git add admin-dashboard/src/components/InquiriesSidePanel.jsx admin-dashboard/src/components/InquiriesSidePanel.css admin-dashboard/src/components/SidePanel.jsx
git commit -m "feat: wire inquiries side panel to real API"
```

---

### Task 12: Inquiries ContentPanel

**Files:**
- Create: `admin-dashboard/src/components/InquiryDetail.jsx`
- Create: `admin-dashboard/src/components/InquiryDetail.css`
- Modify: `admin-dashboard/src/components/ContentPanel.jsx`

**Step 1: Create InquiryDetail**

Shows:
- Renter info: name, email (clickable mailto), relative timestamp
- Which property (clickable → navigates to that property in the dashboard)
- Full message text
- Status toggle: mark as read/new (calls `PATCH /api/inquiries/:id/status`)
- Archive button (sets status to 'closed')
- 24-hour nudge: if `status === 'new'` and `created_at` is > 24h ago, show a gentle "Waiting for response" indicator

**Step 2: Create CSS**

**Step 3: Wire into ContentPanel — detect inquiry items and render InquiryDetail**

**Step 4: Verify build + visual test**

**Step 5: Commit**

```bash
git add admin-dashboard/src/components/InquiryDetail.jsx admin-dashboard/src/components/InquiryDetail.css admin-dashboard/src/components/ContentPanel.jsx
git commit -m "feat: add inquiry detail view with status management"
```

---

## Phase 5: Care Details

### Task 13: Schedule & Leads coming-soon states

**Files:**
- Modify: `admin-dashboard/src/components/SidePanel.jsx`

Replace the hardcoded placeholder data in Schedule and Leads sections with friendly "Coming soon" empty states.

```jsx
// When activeSection is /schedule or /leads
<div className="side-panel__coming-soon">
  <p className="side-panel__coming-soon-title">Coming Soon</p>
  <p className="side-panel__coming-soon-text">
    {activeSection === '/schedule'
      ? 'Showing scheduling and calendar management are on the way.'
      : 'Lead tracking and qualification pipeline are on the way.'}
  </p>
</div>
```

**Commit:**
```bash
git add admin-dashboard/src/components/SidePanel.jsx
git commit -m "feat: add coming-soon states for schedule and leads tabs"
```

---

### Task 14: Logout button

**Files:**
- Modify: `admin-dashboard/src/components/Shell.jsx`

Add a logout button near the home button. Uses `useAuth().logout`.

```jsx
const { logout } = useAuth();
// In JSX, near the home button:
<button className="shell__logout" onClick={logout} aria-label="Sign out">↪</button>
```

**Commit:**
```bash
git add admin-dashboard/src/components/Shell.jsx admin-dashboard/src/components/Shell.css
git commit -m "feat: add logout button to admin shell"
```

---

## Phase 6: Deployment

### Task 15: Supabase Storage bucket + RLS

**Manual step** — do this in Supabase dashboard or via MCP.

1. Create `property-images` bucket (public)
2. Set Storage RLS policies:
   - Public read: `SELECT` for everyone
   - Authenticated upload: `INSERT` for authenticated users
   - Authenticated delete: `DELETE` for authenticated users

Use Supabase MCP `execute_sql` if available, or do manually in dashboard.

**Verify:** Upload a test image via the Supabase JS client.

---

### Task 16: Vercel API wrapper

**Files:**
- Create: `api/index.js`

```js
import app from '../backend/src/app.js';
export default app;
```

That's it. Vercel's `@vercel/node` runtime will detect this and serve it as a serverless function.

**Commit:**
```bash
git add api/index.js
git commit -m "feat: add Vercel serverless wrapper for Express API"
```

---

### Task 17: Vercel config for public site + API

**Files:**
- Create: `vercel.json` (repo root)

```json
{
  "buildCommand": "cd public-site && npm install && npm run build",
  "outputDirectory": "public-site/dist",
  "installCommand": "cd backend && npm install && cd ../public-site && npm install",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Commit:**
```bash
git add vercel.json
git commit -m "feat: add Vercel config for public site + API deployment"
```

---

### Task 18: Public site API URL — use relative path

**Files:**
- Modify: `public-site/src/services/api.js`

Change:
```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
```
To:
```js
const API_URL = import.meta.env.VITE_API_URL || '/api'
```

In development, set `VITE_API_URL=http://localhost:5000/api` in `public-site/.env`. In production on Vercel, it defaults to `/api` (same-origin).

Create `public-site/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

**Commit:**
```bash
git add public-site/src/services/api.js public-site/.env.example
git commit -m "feat: use relative API path for production, env var for dev"
```

---

### Task 19: Admin dashboard Vercel config

**Files:**
- Create: `admin-dashboard/vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The admin dashboard is a standalone SPA — all routes go to index.html.

Create `admin-dashboard/.env.example`:
```
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://lsglqdokunrobmfrbbfs.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Commit:**
```bash
git add admin-dashboard/vercel.json admin-dashboard/.env.example
git commit -m "feat: add Vercel config for admin dashboard deployment"
```

---

### Task 20: Push to GitHub + Create Vercel projects

**Manual steps with CLI guidance:**

1. Ensure repo is on GitHub:
```bash
git remote -v
# If no remote: gh repo create Easy-Rent --private --source=.
git push origin master
```

2. Create Vercel project for public site:
   - Import from GitHub in Vercel dashboard
   - Root directory: `.` (repo root — vercel.json is there)
   - Set env vars: DATABASE_URL, JWT_SECRET, JWT_EXPIRE, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   - Add custom domain: `easy-rental.ca`

3. Create Vercel project for admin dashboard:
   - Import same GitHub repo
   - Root directory: `admin-dashboard`
   - Set env vars: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
   - Add custom domain: `admin.easy-rental.ca`

4. Add DNS records in GoDaddy:
   - A record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`
   - CNAME: `admin` → `cname.vercel-dns.com`

5. Wait for DNS propagation, verify SSL.

---

### Task 21: Smoke test production

After deployment, verify:

1. `https://easy-rental.ca` — landing page loads
2. `https://easy-rental.ca/map` — map loads with pins
3. `https://easy-rental.ca/listings` — listings load
4. `https://easy-rental.ca/api/health` — returns API health
5. `https://admin.easy-rental.ca` — login page loads
6. Log in as Bill → properties load
7. Create a test property → verify it appears on public site
8. Upload an image → verify it appears
9. Submit an inquiry on public site → verify it appears in admin dashboard

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 | 1-4 | Backend endpoints for admin (inquiry list, inquiry count, image metadata, CORS) |
| 2 | 5-6 | Admin login (auth context + login page) |
| 3 | 7-10 | Properties management (list, detail, edit, add, image upload) |
| 4 | 11-12 | Inquiry management (list, detail, status updates) |
| 5 | 13-14 | Care details (coming-soon states, logout) |
| 6 | 15-21 | Deployment (Supabase Storage, Vercel config, DNS, smoke test) |

**Total: 21 tasks across 6 phases.**
