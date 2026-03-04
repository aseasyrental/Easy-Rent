# Public Site — Map-Based Listings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the renter-facing public site with a Leaflet map showing property pins, filter bar, side panel with photos and inquiry form — something Bill can show prospective tenants.

**Architecture:** Landing page (`/`) with "Browse Rentals" CTA → Map view (`/map`) with Leaflet + OpenStreetMap. Property pins from backend API with bounding-box + filter queries. Clicking a pin opens a side panel with details, image gallery, and contact/inquiry form. Images stored in Supabase Storage, metadata in existing `property_media` table. Inquiries stored in existing `inquiries` table.

**Tech Stack:** Leaflet, react-leaflet, react-leaflet-markercluster, Supabase Storage (@supabase/supabase-js), multer (file upload), Express backend (existing), React 19 + React Router 7

**Design doc:** `docs/plans/2026-03-03-public-site-map-design.md`

---

## Task 1: Migration — Add `is_primary` to `property_media`

**Files:**
- Create: `backend/src/db/migrations/013_add_is_primary_to_property_media.sql`

**Step 1: Write migration**

```sql
ALTER TABLE property_media ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

CREATE INDEX idx_property_media_primary ON property_media(property_id) WHERE is_primary = true;
```

**Step 2: Run migration**

Run: `cd backend && node src/db/migrate.js`
Expected: Migration 013 applied successfully.

**Step 3: Commit**

```bash
git add backend/src/db/migrations/013_add_is_primary_to_property_media.sql
git commit -m "feat: add is_primary column to property_media table"
```

---

## Task 2: Supabase Storage Config + PropertyMediaModel

**Files:**
- Create: `backend/src/config/supabase.js`
- Create: `backend/src/models/PropertyMediaModel.js`
- Modify: `backend/package.json` (add @supabase/supabase-js)

**Step 1: Install supabase client**

Run: `cd backend && npm install @supabase/supabase-js`

**Step 2: Create Supabase client config**

Create `backend/src/config/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase Storage not configured — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default supabase;
```

**Step 3: Create PropertyMediaModel**

Create `backend/src/models/PropertyMediaModel.js`:

```javascript
import db from '../config/database.js';

export class PropertyMediaModel {
  static async create({ property_id, type, url, sort_order, is_primary }) {
    return db.one(
      `INSERT INTO property_media (property_id, type, url, sort_order, is_primary)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [property_id, type || 'photo', url, sort_order || 0, is_primary || false]
    );
  }

  static async findByPropertyId(propertyId) {
    return db.any(
      `SELECT * FROM property_media WHERE property_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [propertyId]
    );
  }

  static async findById(id) {
    return db.oneOrNone('SELECT * FROM property_media WHERE id = $1', [id]);
  }

  static async delete(id) {
    const result = await db.result('DELETE FROM property_media WHERE id = $1', [id]);
    return result.rowCount;
  }

  static async setPrimary(propertyId, mediaId) {
    await db.tx(async t => {
      await t.none('UPDATE property_media SET is_primary = false WHERE property_id = $1', [propertyId]);
      await t.none('UPDATE property_media SET is_primary = true WHERE id = $1 AND property_id = $2', [mediaId, propertyId]);
    });
  }
}
```

**Step 4: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/config/supabase.js backend/src/models/PropertyMediaModel.js
git commit -m "feat: add Supabase Storage config and PropertyMediaModel"
```

---

## Task 3: Image Upload/Delete/List Endpoints + Tests

**Files:**
- Create: `backend/src/controllers/PropertyMediaController.js`
- Create: `backend/src/routes/propertyMediaRoutes.js`
- Modify: `backend/src/app.js` (wire routes)
- Modify: `backend/package.json` (add multer)
- Create: `backend/tests/property-media.test.js`

**Step 1: Install multer**

Run: `cd backend && npm install multer`

**Step 2: Write failing tests**

Create `backend/tests/property-media.test.js`:

```javascript
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import db from '../src/config/database.js';
import config from '../src/config/index.js';
import { guardAgainstProduction, cleanAllTables } from './helpers.js';

guardAgainstProduction();

let adminToken, adminId, propertyId;

beforeEach(async () => {
  await cleanAllTables();

  const hashed = await bcrypt.hash('password123', 10);
  const admin = await db.one(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['Admin', 'admin@test.com', hashed, 'admin']
  );
  adminId = admin.id;
  adminToken = jwt.sign({ id: adminId, role: 'admin' }, config.jwt.secret, { expiresIn: '1h' });

  const prop = await db.one(
    `INSERT INTO properties (title, address, price, owner_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['Test Property', '123 Main St', 2000, adminId]
  );
  propertyId = prop.id;
});

afterAll(async () => {
  await cleanAllTables();
});

describe('GET /api/properties/:id/images', () => {
  it('returns empty array when no images', async () => {
    const res = await request(app).get(`/api/properties/${propertyId}/images`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns images sorted by sort_order', async () => {
    await db.none(
      `INSERT INTO property_media (property_id, type, url, sort_order) VALUES ($1, 'photo', 'http://example.com/b.jpg', 2)`,
      [propertyId]
    );
    await db.none(
      `INSERT INTO property_media (property_id, type, url, sort_order, is_primary) VALUES ($1, 'photo', 'http://example.com/a.jpg', 1, true)`,
      [propertyId]
    );

    const res = await request(app).get(`/api/properties/${propertyId}/images`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].url).toBe('http://example.com/a.jpg');
    expect(res.body[0].is_primary).toBe(true);
  });

  it('returns 404 for non-existent property', async () => {
    const res = await request(app).get('/api/properties/99999/images');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/properties/:id/images/:imageId', () => {
  it('requires admin auth', async () => {
    const res = await request(app).delete(`/api/properties/${propertyId}/images/1`);
    expect(res.status).toBe(401);
  });

  it('deletes image record', async () => {
    const img = await db.one(
      `INSERT INTO property_media (property_id, type, url, sort_order) VALUES ($1, 'photo', 'http://example.com/test.jpg', 0) RETURNING id`,
      [propertyId]
    );

    const res = await request(app)
      .delete(`/api/properties/${propertyId}/images/${img.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);

    const check = await db.oneOrNone('SELECT * FROM property_media WHERE id = $1', [img.id]);
    expect(check).toBeNull();
  });

  it('returns 404 for non-existent image', async () => {
    const res = await request(app)
      .delete(`/api/properties/${propertyId}/images/99999`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `cd backend && npm test -- --testPathPattern=property-media`
Expected: FAIL (routes not defined yet)

**Step 4: Create controller**

Create `backend/src/controllers/PropertyMediaController.js`:

```javascript
import { PropertyMediaModel } from '../models/PropertyMediaModel.js';
import { PropertyModel } from '../models/PropertyModel.js';
import supabase from '../config/supabase.js';
import crypto from 'crypto';

export class PropertyMediaController {
  static async list(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      const images = await PropertyMediaModel.findByPropertyId(req.params.id);
      res.json(images);
    } catch (error) {
      next(error);
    }
  }

  static async upload(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      if (!supabase) {
        return res.status(503).json({ message: 'Storage not configured' });
      }

      const ext = req.file.originalname.split('.').pop();
      const fileName = `${req.params.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        return res.status(500).json({ message: 'Upload failed', error: uploadError.message });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      const isPrimary = req.body.is_primary === 'true';
      const sortOrder = parseInt(req.body.sort_order) || 0;

      if (isPrimary) {
        await PropertyMediaModel.setPrimary(req.params.id, null);
      }

      const media = await PropertyMediaModel.create({
        property_id: req.params.id,
        type: 'photo',
        url: publicUrl,
        sort_order: sortOrder,
        is_primary: isPrimary,
      });

      res.status(201).json(media);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const media = await PropertyMediaModel.findById(req.params.imageId);
      if (!media || media.property_id !== parseInt(req.params.id)) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Try to delete from storage (extract path from URL)
      if (supabase && media.url.includes('property-images')) {
        const path = media.url.split('property-images/').pop();
        if (path) {
          await supabase.storage.from('property-images').remove([path]);
        }
      }

      await PropertyMediaModel.delete(req.params.imageId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
```

**Step 5: Create routes**

Create `backend/src/routes/propertyMediaRoutes.js`:

```javascript
import { Router } from 'express';
import { param } from 'express-validator';
import multer from 'multer';
import { PropertyMediaController } from '../controllers/PropertyMediaController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Property ID must be a positive integer'),
];

const imageIdParam = [
  param('imageId').isInt({ min: 1 }).withMessage('Image ID must be a positive integer'),
];

router.get(
  '/',
  idParam,
  handleValidation,
  PropertyMediaController.list,
);

router.post(
  '/',
  authenticate,
  requireAdmin,
  idParam,
  handleValidation,
  upload.single('image'),
  PropertyMediaController.upload,
);

router.delete(
  '/:imageId',
  authenticate,
  requireAdmin,
  [...idParam, ...imageIdParam],
  handleValidation,
  PropertyMediaController.delete,
);

export default router;
```

**Step 6: Wire routes in app.js**

Add to `backend/src/app.js`:

```javascript
import propertyMediaRoutes from './routes/propertyMediaRoutes.js';
```

And add route:

```javascript
app.use('/api/properties/:id/images', propertyMediaRoutes);
```

**Step 7: Run tests**

Run: `cd backend && npm test -- --testPathPattern=property-media`
Expected: All tests PASS.

**Step 8: Run full test suite**

Run: `cd backend && npm test`
Expected: All 51+ existing tests still pass, plus new image tests.

**Step 9: Commit**

```bash
git add backend/src/controllers/PropertyMediaController.js backend/src/routes/propertyMediaRoutes.js backend/src/app.js backend/tests/property-media.test.js backend/package.json backend/package-lock.json
git commit -m "feat: add property image upload/delete/list endpoints with tests"
```

---

## Task 4: Inquiry Endpoint + Tests

**Files:**
- Create: `backend/src/models/InquiryModel.js`
- Create: `backend/src/controllers/InquiryController.js`
- Create: `backend/src/routes/inquiryRoutes.js`
- Modify: `backend/src/app.js` (wire routes)
- Create: `backend/tests/inquiries.test.js`

**Step 1: Write failing tests**

Create `backend/tests/inquiries.test.js`:

```javascript
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import db from '../src/config/database.js';
import config from '../src/config/index.js';
import { guardAgainstProduction, cleanAllTables } from './helpers.js';

guardAgainstProduction();

let adminId, propertyId;

beforeEach(async () => {
  await cleanAllTables();

  const hashed = await bcrypt.hash('password123', 10);
  const admin = await db.one(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['Admin', 'admin@test.com', hashed, 'admin']
  );
  adminId = admin.id;

  const prop = await db.one(
    `INSERT INTO properties (title, address, price, owner_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['Test Property', '123 Main St', 2000, adminId]
  );
  propertyId = prop.id;
});

afterAll(async () => {
  await cleanAllTables();
});

describe('POST /api/inquiries', () => {
  it('creates inquiry with valid data', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({
        property_id: propertyId,
        name: 'Jane Renter',
        email: 'jane@example.com',
        message: 'Is this still available?',
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Jane Renter');
    expect(res.body.property_id).toBe(propertyId);
  });

  it('requires name', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({ property_id: propertyId, email: 'jane@example.com', message: 'Hi' });
    expect(res.status).toBe(400);
  });

  it('requires valid email', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({ property_id: propertyId, name: 'Jane', email: 'not-email', message: 'Hi' });
    expect(res.status).toBe(400);
  });

  it('requires message', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({ property_id: propertyId, name: 'Jane', email: 'jane@example.com' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent property', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({ property_id: 99999, name: 'Jane', email: 'jane@example.com', message: 'Hi' });
    expect(res.status).toBe(404);
  });

  it('does not require authentication', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({
        property_id: propertyId,
        name: 'Anonymous',
        email: 'anon@example.com',
        message: 'Question about this place',
      });
    expect(res.status).toBe(201);
  });
});
```

**Step 2: Run tests to verify failure**

Run: `cd backend && npm test -- --testPathPattern=inquiries`
Expected: FAIL (routes not defined yet)

**Step 3: Create InquiryModel**

Create `backend/src/models/InquiryModel.js`:

```javascript
import db from '../config/database.js';

export class InquiryModel {
  static async create({ property_id, name, email, message }) {
    return db.one(
      `INSERT INTO inquiries (property_id, name, email, message, type, status)
       VALUES ($1, $2, $3, $4, 'question', 'new') RETURNING *`,
      [property_id, name, email, message]
    );
  }

  static async findByPropertyId(propertyId) {
    return db.any(
      'SELECT * FROM inquiries WHERE property_id = $1 ORDER BY created_at DESC',
      [propertyId]
    );
  }
}
```

**Step 4: Create InquiryController**

Create `backend/src/controllers/InquiryController.js`:

```javascript
import { InquiryModel } from '../models/InquiryModel.js';
import { PropertyModel } from '../models/PropertyModel.js';

export class InquiryController {
  static async create(req, res, next) {
    try {
      const { property_id, name, email, message } = req.body;

      const property = await PropertyModel.findById(property_id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      const inquiry = await InquiryModel.create({ property_id, name, email, message });
      res.status(201).json(inquiry);
    } catch (error) {
      next(error);
    }
  }
}
```

**Step 5: Create inquiry routes**

Create `backend/src/routes/inquiryRoutes.js`:

```javascript
import { Router } from 'express';
import { body } from 'express-validator';
import { InquiryController } from '../controllers/InquiryController.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router();

router.post(
  '/',
  [
    body('property_id').isInt({ min: 1 }).withMessage('property_id must be a positive integer'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  handleValidation,
  InquiryController.create,
);

export default router;
```

**Step 6: Wire routes in app.js**

Add to `backend/src/app.js`:

```javascript
import inquiryRoutes from './routes/inquiryRoutes.js';
```

And add route:

```javascript
app.use('/api/inquiries', inquiryRoutes);
```

**Step 7: Run tests**

Run: `cd backend && npm test -- --testPathPattern=inquiries`
Expected: All 6 tests PASS.

**Step 8: Run full test suite**

Run: `cd backend && npm test`
Expected: All tests pass.

**Step 9: Commit**

```bash
git add backend/src/models/InquiryModel.js backend/src/controllers/InquiryController.js backend/src/routes/inquiryRoutes.js backend/src/app.js backend/tests/inquiries.test.js
git commit -m "feat: add public inquiry submission endpoint with tests"
```

---

## Task 5: Add Bounding Box Filter to GET /api/properties

The map needs to fetch only properties visible in the current viewport.

**Files:**
- Modify: `backend/src/models/PropertyModel.js` (add bounds filter)
- Modify: `backend/src/controllers/PropertyController.js` (pass bounds)
- Modify: `backend/src/routes/propertyRoutes.js` (validate bounds params)
- Modify: `backend/tests/properties.test.js` (add bounds tests)

**Step 1: Write failing test**

Add to `backend/tests/properties.test.js` inside the GET /api/properties describe block:

```javascript
describe('bounding box filter', () => {
  it('returns properties within bounds', async () => {
    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'In bounds', latitude: 49.25, longitude: -123.1 });
    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'Out of bounds', latitude: 48.0, longitude: -120.0 });

    const res = await request(app)
      .get('/api/properties')
      .query({ min_lat: 49.0, max_lat: 50.0, min_lng: -124.0, max_lng: -122.0 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('In bounds');
  });

  it('ignores properties with null lat/lng', async () => {
    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'No coords', latitude: null, longitude: null });

    const res = await request(app)
      .get('/api/properties')
      .query({ min_lat: 49.0, max_lat: 50.0, min_lng: -124.0, max_lng: -122.0 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify failure**

Run: `cd backend && npm test -- --testPathPattern=properties`
Expected: Tests fail (bounds not implemented).

**Step 3: Add bounds filter to PropertyModel.findFiltered**

Add inside `findFiltered()` in `backend/src/models/PropertyModel.js`, after the `available_by` filter:

```javascript
if (filters.min_lat !== undefined && filters.max_lat !== undefined &&
    filters.min_lng !== undefined && filters.max_lng !== undefined) {
  conditions.push(`latitude >= $${idx++}`);
  values.push(filters.min_lat);
  conditions.push(`latitude <= $${idx++}`);
  values.push(filters.max_lat);
  conditions.push(`longitude >= $${idx++}`);
  values.push(filters.min_lng);
  conditions.push(`longitude <= $${idx++}`);
  values.push(filters.max_lng);
}
```

**Step 4: Pass bounds from controller**

Add to the `filters` object in `PropertyController.list()`:

```javascript
min_lat: req.query.min_lat,
max_lat: req.query.max_lat,
min_lng: req.query.min_lng,
max_lng: req.query.max_lng,
```

**Step 5: Add query validation in propertyRoutes.js**

Add to the GET `/` validators array:

```javascript
query('min_lat').optional().isFloat({ min: -90, max: 90 }).withMessage('min_lat must be between -90 and 90'),
query('max_lat').optional().isFloat({ min: -90, max: 90 }).withMessage('max_lat must be between -90 and 90'),
query('min_lng').optional().isFloat({ min: -180, max: 180 }).withMessage('min_lng must be between -180 and 180'),
query('max_lng').optional().isFloat({ min: -180, max: 180 }).withMessage('max_lng must be between -180 and 180'),
```

**Step 6: Run tests**

Run: `cd backend && npm test`
Expected: All tests pass including new bounds tests.

**Step 7: Commit**

```bash
git add backend/src/models/PropertyModel.js backend/src/controllers/PropertyController.js backend/src/routes/propertyRoutes.js backend/tests/properties.test.js
git commit -m "feat: add bounding box filter for map viewport queries"
```

---

## Task 6: Include Images in GET /api/properties/:id

When the side panel loads a property, it needs images in one request.

**Files:**
- Modify: `backend/src/controllers/PropertyController.js`

**Step 1: Modify getById to include images**

Update `PropertyController.getById()`:

```javascript
static async getById(req, res, next) {
  try {
    const property = await PropertyModel.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    const images = await PropertyMediaModel.findByPropertyId(req.params.id);
    res.json({ ...property, images });
  } catch (error) {
    next(error);
  }
}
```

Add import at top:

```javascript
import { PropertyMediaModel } from '../models/PropertyMediaModel.js';
```

**Step 2: Run existing tests**

Run: `cd backend && npm test`
Expected: All pass. The existing getById tests check `res.body.title` etc. which still works since images is an added field.

**Step 3: Commit**

```bash
git add backend/src/controllers/PropertyController.js
git commit -m "feat: include images array in GET /api/properties/:id response"
```

---

## Task 7: Frontend Foundation — Dependencies, Routing, CSS

**Files:**
- Modify: `public-site/package.json` (add deps)
- Modify: `public-site/src/main.jsx` (add router)
- Modify: `public-site/src/App.jsx` (add routes)
- Rewrite: `public-site/src/index.css` (design tokens + glassmorphism base)
- Delete: `public-site/src/App.css` (replaced by index.css)
- Modify: `public-site/index.html` (update title, add Leaflet CSS CDN)

**Step 1: Install dependencies**

Run: `cd public-site && npm install leaflet react-leaflet react-leaflet-cluster`

**Step 2: Update index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Easy Rental — Find Your Next Home</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin="" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 3: Set up router in main.jsx**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

**Step 4: Set up routes in App.jsx**

```jsx
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import MapView from './pages/MapView.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/map" element={<MapView />} />
    </Routes>
  )
}
```

**Step 5: Write CSS design tokens in index.css**

```css
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --accent: #e8a87c;
  --accent-hover: #d4956a;
  --text-primary: #2c1810;
  --text-secondary: #5a3e2b;
  --text-light: #f5ebe0;
  --bg-warm: #fdf8f4;
  --glass-bg: rgba(255, 255, 255, 0.12);
  --glass-bg-solid: rgba(255, 255, 255, 0.85);
  --glass-blur: 20px;
  --glass-radius: 16px;
  --glass-border: 1px solid rgba(255, 255, 255, 0.2);
  --glass-shadow: 0 8px 32px rgba(44, 24, 16, 0.15);
  --font-main: 'Segoe UI', system-ui, -apple-system, sans-serif;
  --transition: 0.3s ease;
}

html, body, #root {
  height: 100%;
  width: 100%;
}

body {
  font-family: var(--font-main);
  color: var(--text-primary);
  background: var(--bg-warm);
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--accent);
  text-decoration: none;
}

button {
  cursor: pointer;
  font-family: inherit;
}
```

**Step 6: Create placeholder page files**

Create `public-site/src/pages/Landing.jsx`:

```jsx
export default function Landing() {
  return <div>Landing placeholder</div>
}
```

Create `public-site/src/pages/MapView.jsx`:

```jsx
export default function MapView() {
  return <div>Map placeholder</div>
}
```

**Step 7: Delete App.css, verify dev server starts**

Run: `cd public-site && rm src/App.css && npm run dev`
Expected: Vite starts on port 5173, both `/` and `/map` render placeholders.

**Step 8: Commit**

```bash
git add public-site/
git commit -m "feat: public site foundation — routing, CSS tokens, leaflet deps"
```

---

## Task 8: Landing Page

**Files:**
- Rewrite: `public-site/src/pages/Landing.jsx`
- Create: `public-site/src/pages/Landing.css`
- Copy logo: `Easy Rental joshes.png` → `public-site/public/logo.png`

**Step 1: Copy logo to public directory**

```bash
cp "Easy Rental joshes.png" public-site/public/logo.png
```

**Step 2: Build Landing page**

Create `public-site/src/pages/Landing.css`:

```css
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fdf8f4 0%, #f5ebe0 50%, #e8d5c4 100%);
  padding: 2rem;
}

.landing__panel {
  background: var(--glass-bg-solid);
  backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  padding: 3rem 2.5rem;
  text-align: center;
  max-width: 480px;
  width: 100%;
}

.landing__logo {
  max-width: 240px;
  width: 100%;
  height: auto;
  margin-bottom: 1.5rem;
}

.landing__tagline {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.5;
}

.landing__cta {
  display: inline-block;
  background: var(--accent);
  color: white;
  font-size: 1.125rem;
  font-weight: 600;
  padding: 0.875rem 2.5rem;
  border: none;
  border-radius: 12px;
  transition: background var(--transition), transform var(--transition);
}

.landing__cta:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
}

.landing__footer {
  margin-top: auto;
  padding: 1.5rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.landing__footer a {
  color: var(--accent);
  margin: 0 0.5rem;
}
```

Rewrite `public-site/src/pages/Landing.jsx`:

```jsx
import { Link } from 'react-router-dom'
import './Landing.css'

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing__panel">
        <img src="/logo.png" alt="Easy Rental" className="landing__logo" />
        <p className="landing__tagline">
          Your next home in the Lower Mainland
        </p>
        <Link to="/map" className="landing__cta">
          Browse Rentals
        </Link>
      </div>

      <footer className="landing__footer">
        <a href="tel:+1XXXXXXXXXX">Phone</a>
        <span>&middot;</span>
        <a href="mailto:bill@easy-rental.ca">Email</a>
        <span>&middot;</span>
        <a href="https://easy-rental.ca" target="_blank" rel="noopener noreferrer">
          easy-rental.ca
        </a>
      </footer>
    </div>
  )
}
```

> **Note:** Replace phone number and email with Bill's real contact info before deploy.

**Step 3: Verify in browser**

Run: `cd public-site && npm run dev`
Expected: Landing page with logo, tagline, "Browse Rentals" button, footer. Warm glassmorphism style.

**Step 4: Commit**

```bash
git add public-site/
git commit -m "feat: landing page with logo, tagline, browse CTA"
```

---

## Task 9: Map View — Leaflet + Property Pins + Clustering

**Files:**
- Rewrite: `public-site/src/pages/MapView.jsx`
- Create: `public-site/src/pages/MapView.css`
- Create: `public-site/src/components/PropertyMarkers.jsx`

**Step 1: Build MapView page**

Create `public-site/src/pages/MapView.css`:

```css
.map-view {
  height: 100vh;
  width: 100%;
  position: relative;
}

.map-view__map {
  height: 100%;
  width: 100%;
}

/* Fix Leaflet z-index so UI overlays work */
.leaflet-container {
  z-index: 0;
}
```

Rewrite `public-site/src/pages/MapView.jsx`:

```jsx
import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import PropertyMarkers from '../components/PropertyMarkers.jsx'
import FilterBar from '../components/FilterBar.jsx'
import PropertyPanel from '../components/PropertyPanel.jsx'
import apiClient from '../services/api.js'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

const LOWER_MAINLAND_CENTER = [49.25, -123.1]
const DEFAULT_ZOOM = 11

function MapEvents({ onBoundsChange }) {
  useMapEvents({
    moveend: (e) => {
      const bounds = e.target.getBounds()
      onBoundsChange({
        min_lat: bounds.getSouth(),
        max_lat: bounds.getNorth(),
        min_lng: bounds.getWest(),
        max_lng: bounds.getEast(),
      })
    },
  })
  return null
}

export default function MapView() {
  const [properties, setProperties] = useState([])
  const [filters, setFilters] = useState({})
  const [bounds, setBounds] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchProperties = useCallback(async () => {
    if (!bounds) return
    setLoading(true)
    try {
      const params = { ...filters, ...bounds, limit: 100 }
      const res = await apiClient.get('/properties', { params })
      setProperties(res.data.data)
    } catch (err) {
      console.error('Failed to fetch properties:', err)
    } finally {
      setLoading(false)
    }
  }, [bounds, filters])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const handlePinClick = async (id) => {
    setSelectedId(id)
    try {
      const res = await apiClient.get(`/properties/${id}`)
      setSelectedProperty(res.data)
    } catch (err) {
      console.error('Failed to fetch property:', err)
    }
  }

  const handleClosePanel = () => {
    setSelectedId(null)
    setSelectedProperty(null)
  }

  return (
    <div className="map-view">
      <FilterBar filters={filters} onChange={setFilters} />

      <MapContainer
        center={LOWER_MAINLAND_CENTER}
        zoom={DEFAULT_ZOOM}
        className="map-view__map"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onBoundsChange={setBounds} />
        <PropertyMarkers
          properties={properties}
          onPinClick={handlePinClick}
          selectedId={selectedId}
        />
      </MapContainer>

      {selectedProperty && (
        <PropertyPanel
          property={selectedProperty}
          onClose={handleClosePanel}
        />
      )}
    </div>
  )
}
```

**Step 2: Build PropertyMarkers component**

Create `public-site/src/components/PropertyMarkers.jsx`:

```jsx
import { Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'

// Fix Leaflet default icon path issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

export default function PropertyMarkers({ properties, onPinClick, selectedId }) {
  return (
    <MarkerClusterGroup chunkedLoading>
      {properties
        .filter(p => p.latitude && p.longitude)
        .map(property => (
          <Marker
            key={property.id}
            position={[parseFloat(property.latitude), parseFloat(property.longitude)]}
            eventHandlers={{
              click: () => onPinClick(property.id),
            }}
          >
            <Popup>
              <strong>{property.title}</strong><br />
              ${property.price}/mo
            </Popup>
          </Marker>
        ))
      }
    </MarkerClusterGroup>
  )
}
```

**Step 3: Create placeholder FilterBar and PropertyPanel**

Create `public-site/src/components/FilterBar.jsx`:

```jsx
export default function FilterBar({ filters, onChange }) {
  return <div>FilterBar placeholder</div>
}
```

Create `public-site/src/components/PropertyPanel.jsx`:

```jsx
export default function PropertyPanel({ property, onClose }) {
  return <div>PropertyPanel placeholder</div>
}
```

**Step 4: Verify in browser**

Run: `cd public-site && npm run dev`
Navigate to `/map`. Expected: Full-screen Leaflet map centered on Lower Mainland.

**Step 5: Commit**

```bash
git add public-site/
git commit -m "feat: map view with Leaflet, property pins, marker clustering"
```

---

## Task 10: Filter Bar

**Files:**
- Rewrite: `public-site/src/components/FilterBar.jsx`
- Create: `public-site/src/components/FilterBar.css`

**Step 1: Build FilterBar**

Create `public-site/src/components/FilterBar.css`:

```css
.filter-bar {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background: var(--glass-bg-solid);
  backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  padding: 0.75rem 1rem;
}

.filter-bar__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-bar__label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-bar__input,
.filter-bar__select {
  padding: 0.4rem 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 0.85rem;
  background: white;
  font-family: inherit;
  min-width: 80px;
}

.filter-bar__apply {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background var(--transition);
  align-self: flex-end;
}

.filter-bar__apply:hover {
  background: var(--accent-hover);
}

/* Mobile: collapse to toggle button */
.filter-bar__toggle {
  display: none;
  background: var(--glass-bg-solid);
  backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    top: 4rem;
    width: calc(100% - 2rem);
    left: 1rem;
    transform: none;
  }

  .filter-bar--hidden {
    display: none;
  }

  .filter-bar__toggle {
    display: block;
  }
}
```

Rewrite `public-site/src/components/FilterBar.jsx`:

```jsx
import { useState } from 'react'
import './FilterBar.css'

const PROPERTY_TYPES = [
  { value: '', label: 'Any Type' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'basement_suite', label: 'Basement Suite' },
  { value: 'laneway_house', label: 'Laneway House' },
]

const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
]

export default function FilterBar({ filters, onChange }) {
  const [local, setLocal] = useState({
    min_price: '',
    max_price: '',
    bedrooms: '',
    property_type: '',
    ...filters,
  })
  const [open, setOpen] = useState(true)

  const handleChange = (field, value) => {
    setLocal(prev => ({ ...prev, [field]: value }))
  }

  const handleApply = () => {
    const cleaned = {}
    for (const [key, val] of Object.entries(local)) {
      if (val !== '' && val !== undefined) cleaned[key] = val
    }
    onChange(cleaned)
  }

  return (
    <>
      <button
        className="filter-bar__toggle"
        onClick={() => setOpen(prev => !prev)}
      >
        Filters
      </button>

      <div className={`filter-bar ${!open ? 'filter-bar--hidden' : ''}`}>
        <div className="filter-bar__field">
          <span className="filter-bar__label">Min Price</span>
          <input
            className="filter-bar__input"
            type="number"
            placeholder="$"
            value={local.min_price}
            onChange={e => handleChange('min_price', e.target.value)}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Max Price</span>
          <input
            className="filter-bar__input"
            type="number"
            placeholder="$"
            value={local.max_price}
            onChange={e => handleChange('max_price', e.target.value)}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Bedrooms</span>
          <select
            className="filter-bar__select"
            value={local.bedrooms}
            onChange={e => handleChange('bedrooms', e.target.value)}
          >
            {BEDROOM_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Type</span>
          <select
            className="filter-bar__select"
            value={local.property_type}
            onChange={e => handleChange('property_type', e.target.value)}
          >
            {PROPERTY_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button className="filter-bar__apply" onClick={handleApply}>
          Apply
        </button>
      </div>
    </>
  )
}
```

**Step 2: Verify in browser**

Run: `cd public-site && npm run dev`
Navigate to `/map`. Expected: Glass filter bar floating over map with price, bedrooms, type inputs and Apply button. On mobile width, collapses to "Filters" toggle.

**Step 3: Commit**

```bash
git add public-site/
git commit -m "feat: filter bar with price, bedrooms, property type filters"
```

---

## Task 11: Property Side Panel + Image Gallery + Inquiry Form

**Files:**
- Rewrite: `public-site/src/components/PropertyPanel.jsx`
- Create: `public-site/src/components/PropertyPanel.css`
- Create: `public-site/src/components/InquiryForm.jsx`
- Create: `public-site/src/components/InquiryForm.css`

**Step 1: Build PropertyPanel**

Create `public-site/src/components/PropertyPanel.css`:

```css
.property-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
  height: 100%;
  z-index: 1001;
  background: var(--glass-bg-solid);
  backdrop-filter: blur(var(--glass-blur));
  border-left: var(--glass-border);
  box-shadow: -4px 0 24px rgba(44, 24, 16, 0.12);
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.property-panel__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.property-panel__hero {
  width: 100%;
  height: 240px;
  object-fit: cover;
  display: block;
}

.property-panel__hero-placeholder {
  width: 100%;
  height: 240px;
  background: linear-gradient(135deg, #e8d5c4, #d4c4b0);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.property-panel__gallery {
  display: flex;
  gap: 4px;
  padding: 4px;
  overflow-x: auto;
}

.property-panel__thumb {
  width: 64px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--transition);
}

.property-panel__thumb:hover,
.property-panel__thumb--active {
  opacity: 1;
}

.property-panel__body {
  padding: 1.25rem;
}

.property-panel__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.property-panel__price {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 0.75rem;
}

.property-panel__badge {
  display: inline-block;
  background: rgba(232, 168, 124, 0.15);
  color: var(--accent-hover);
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.property-panel__stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.property-panel__stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.property-panel__section {
  margin-bottom: 1rem;
}

.property-panel__section-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
}

.property-panel__description {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.property-panel__amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  list-style: none;
}

.property-panel__amenity {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.property-panel__contact {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.property-panel__contact a {
  flex: 1;
  text-align: center;
  padding: 0.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
  transition: background var(--transition);
}

.property-panel__contact a:hover {
  background: rgba(0, 0, 0, 0.1);
}

.property-panel__divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 1rem 0;
}

/* Mobile: bottom sheet */
@media (max-width: 768px) {
  .property-panel {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 70vh;
    border-left: none;
    border-top: var(--glass-border);
    border-radius: var(--glass-radius) var(--glass-radius) 0 0;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .property-panel__hero {
    height: 180px;
  }
}
```

Rewrite `public-site/src/components/PropertyPanel.jsx`:

```jsx
import { useState } from 'react'
import InquiryForm from './InquiryForm.jsx'
import './PropertyPanel.css'

const TYPE_LABELS = {
  apartment: 'Apartment',
  house: 'House',
  townhouse: 'Townhouse',
  condo: 'Condo',
  duplex: 'Duplex',
  basement_suite: 'Basement Suite',
  laneway_house: 'Laneway House',
}

export default function PropertyPanel({ property, onClose }) {
  const images = property.images || []
  const primaryImage = images.find(img => img.is_primary) || images[0]
  const [activeImage, setActiveImage] = useState(primaryImage?.url || null)

  return (
    <div className="property-panel">
      <button className="property-panel__close" onClick={onClose}>
        &times;
      </button>

      {activeImage ? (
        <img src={activeImage} alt={property.title} className="property-panel__hero" />
      ) : (
        <div className="property-panel__hero-placeholder">No photos yet</div>
      )}

      {images.length > 1 && (
        <div className="property-panel__gallery">
          {images.map(img => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className={`property-panel__thumb ${img.url === activeImage ? 'property-panel__thumb--active' : ''}`}
              onClick={() => setActiveImage(img.url)}
            />
          ))}
        </div>
      )}

      <div className="property-panel__body">
        <h2 className="property-panel__title">{property.title}</h2>
        <div className="property-panel__price">${Number(property.price).toLocaleString()}/mo</div>

        {property.property_type && (
          <span className="property-panel__badge">
            {TYPE_LABELS[property.property_type] || property.property_type}
          </span>
        )}

        <div className="property-panel__stats">
          {property.bedrooms != null && (
            <span className="property-panel__stat">{property.bedrooms} bed</span>
          )}
          {property.bathrooms != null && (
            <span className="property-panel__stat">{property.bathrooms} bath</span>
          )}
          {property.sqft != null && (
            <span className="property-panel__stat">{property.sqft} sqft</span>
          )}
        </div>

        {property.availability_date && (
          <div className="property-panel__section">
            <div className="property-panel__section-title">Available</div>
            <div>{new Date(property.availability_date).toLocaleDateString('en-CA')}</div>
          </div>
        )}

        {property.description && (
          <div className="property-panel__section">
            <div className="property-panel__section-title">About</div>
            <p className="property-panel__description">{property.description}</p>
          </div>
        )}

        {property.amenities?.length > 0 && (
          <div className="property-panel__section">
            <div className="property-panel__section-title">Amenities</div>
            <ul className="property-panel__amenities">
              {property.amenities.map((a, i) => (
                <li key={i} className="property-panel__amenity">{a}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="property-panel__divider" />

        <div className="property-panel__section">
          <div className="property-panel__section-title">Contact</div>
          <div className="property-panel__contact">
            <a href="tel:+1XXXXXXXXXX">Call</a>
            <a href="mailto:bill@easy-rental.ca">Email</a>
          </div>
        </div>

        <div className="property-panel__divider" />

        <InquiryForm propertyId={property.id} />
      </div>
    </div>
  )
}
```

**Step 2: Build InquiryForm**

Create `public-site/src/components/InquiryForm.css`:

```css
.inquiry-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.inquiry-form__title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.inquiry-form__input,
.inquiry-form__textarea {
  padding: 0.6rem 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  transition: border-color var(--transition);
}

.inquiry-form__input:focus,
.inquiry-form__textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.inquiry-form__textarea {
  min-height: 80px;
  resize: vertical;
}

.inquiry-form__submit {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.65rem;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background var(--transition);
}

.inquiry-form__submit:hover {
  background: var(--accent-hover);
}

.inquiry-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.inquiry-form__success {
  color: #2e7d32;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.5rem;
}

.inquiry-form__error {
  color: #c62828;
  font-size: 0.85rem;
}
```

Create `public-site/src/components/InquiryForm.jsx`:

```jsx
import { useState } from 'react'
import apiClient from '../services/api.js'
import './InquiryForm.css'

export default function InquiryForm({ propertyId }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await apiClient.post('/inquiries', {
        property_id: propertyId,
        ...form,
      })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="inquiry-form">
        <p className="inquiry-form__success">
          Message sent! We'll get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <form className="inquiry-form" onSubmit={handleSubmit}>
      <span className="inquiry-form__title">Send a Message</span>
      <input
        className="inquiry-form__input"
        type="text"
        placeholder="Your name"
        value={form.name}
        onChange={e => handleChange('name', e.target.value)}
        required
      />
      <input
        className="inquiry-form__input"
        type="email"
        placeholder="Your email"
        value={form.email}
        onChange={e => handleChange('email', e.target.value)}
        required
      />
      <textarea
        className="inquiry-form__textarea"
        placeholder="I'm interested in this property..."
        value={form.message}
        onChange={e => handleChange('message', e.target.value)}
        required
      />
      {error && <p className="inquiry-form__error">{error}</p>}
      <button className="inquiry-form__submit" type="submit" disabled={sending}>
        {sending ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}
```

**Step 3: Verify in browser**

Run: `cd public-site && npm run dev`
Navigate to `/map`, click a property pin (requires properties in DB with lat/lng). Side panel slides in from right with details, images, contact links, inquiry form.

**Step 4: Commit**

```bash
git add public-site/
git commit -m "feat: property side panel with image gallery and inquiry form"
```

---

## Task 12: Seed Data for Demo

Bill needs properties to show. Create a seed script with Lower Mainland listings.

**Files:**
- Create: `backend/src/db/seed-demo-properties.js`

**Step 1: Create demo seed script**

Create `backend/src/db/seed-demo-properties.js`:

```javascript
import dotenv from 'dotenv';
dotenv.config();

import db from '../config/database.js';

const DEMO_PROPERTIES = [
  {
    title: 'Cozy 1BR in Kitsilano',
    description: 'Bright ground-floor apartment steps from Kits Beach. In-suite laundry, shared backyard.',
    address: '2145 W 4th Ave',
    city: 'Vancouver',
    province: 'BC',
    postal_code: 'V6K 1N7',
    latitude: 49.2685,
    longitude: -123.1639,
    price: 1850,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 550,
    property_type: 'apartment',
    amenities: ['in-suite laundry', 'backyard', 'bike storage'],
    availability_date: '2026-04-01',
    lease_term_months: 12,
    deposit_amount: 1850,
  },
  {
    title: 'Spacious 2BR Townhouse in Burnaby',
    description: 'End unit with private patio. Close to Metrotown and transit.',
    address: '4520 Kingsway',
    city: 'Burnaby',
    province: 'BC',
    postal_code: 'V5H 2B1',
    latitude: 49.2276,
    longitude: -123.0076,
    price: 2600,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 1100,
    property_type: 'townhouse',
    amenities: ['patio', 'parking', 'dishwasher'],
    availability_date: '2026-04-15',
    lease_term_months: 12,
    deposit_amount: 2600,
  },
  {
    title: 'Modern 3BR House in New Westminster',
    description: 'Renovated home with mountain views. Large fenced yard, perfect for families.',
    address: '312 Queens Ave',
    city: 'New Westminster',
    province: 'BC',
    postal_code: 'V3L 1K3',
    latitude: 49.2057,
    longitude: -122.9110,
    price: 3200,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    property_type: 'house',
    amenities: ['fenced yard', 'garage', 'mountain views', 'renovated kitchen'],
    availability_date: '2026-05-01',
    lease_term_months: 12,
    deposit_amount: 3200,
  },
  {
    title: 'Bright Basement Suite in Surrey',
    description: 'Separate entrance, newly finished. Quiet neighborhood near parks.',
    address: '8912 140th St',
    city: 'Surrey',
    province: 'BC',
    postal_code: 'V3V 5Z4',
    latitude: 49.1913,
    longitude: -122.8490,
    price: 1400,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    property_type: 'basement_suite',
    amenities: ['separate entrance', 'parking', 'utilities included'],
    availability_date: '2026-03-15',
    lease_term_months: 6,
    deposit_amount: 1400,
  },
  {
    title: 'Downtown Vancouver Condo',
    description: 'High-rise living with concierge. Walk to everything — Seawall, restaurants, transit.',
    address: '1055 Homer St',
    city: 'Vancouver',
    province: 'BC',
    postal_code: 'V6B 0G3',
    latitude: 49.2750,
    longitude: -123.1216,
    price: 2200,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 520,
    property_type: 'condo',
    amenities: ['concierge', 'gym', 'rooftop deck', 'bike room'],
    availability_date: '2026-04-01',
    lease_term_months: 12,
    deposit_amount: 2200,
  },
  {
    title: 'Family Duplex in Port Moody',
    description: 'Upper unit of a quiet duplex. Backs onto Shoreline Trail. Great school district.',
    address: '2234 Clarke St',
    city: 'Port Moody',
    province: 'BC',
    postal_code: 'V3H 1Y8',
    latitude: 49.2838,
    longitude: -122.8317,
    price: 2800,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1400,
    property_type: 'duplex',
    amenities: ['trail access', 'parking', 'storage', 'pet-friendly'],
    availability_date: '2026-05-01',
    lease_term_months: 12,
    deposit_amount: 2800,
  },
];

async function seedDemoProperties() {
  try {
    // Find or require admin user
    const admin = await db.oneOrNone("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!admin) {
      console.error('No admin user found. Run npm run seed first.');
      process.exit(1);
    }

    for (const p of DEMO_PROPERTIES) {
      const existing = await db.oneOrNone(
        'SELECT id FROM properties WHERE title = $1 AND address = $2',
        [p.title, p.address]
      );
      if (existing) {
        console.log(`  Skipping "${p.title}" (already exists)`);
        continue;
      }

      await db.one(
        `INSERT INTO properties (
          title, description, address, city, province, postal_code,
          latitude, longitude, price, bedrooms, bathrooms, sqft,
          property_type, amenities, availability_date, lease_term_months,
          deposit_amount, owner_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14::jsonb, $15, $16, $17, $18
        ) RETURNING id`,
        [
          p.title, p.description, p.address, p.city, p.province, p.postal_code,
          p.latitude, p.longitude, p.price, p.bedrooms, p.bathrooms, p.sqft,
          p.property_type, JSON.stringify(p.amenities), p.availability_date,
          p.lease_term_months, p.deposit_amount, admin.id,
        ]
      );
      console.log(`  Added "${p.title}"`);
    }

    console.log('Demo properties seeded.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seedDemoProperties();
```

**Step 2: Add npm script**

Add to `backend/package.json` scripts:

```json
"seed:demo": "node src/db/seed-demo-properties.js"
```

**Step 3: Run seed**

Run: `cd backend && npm run seed:demo`
Expected: 6 demo properties inserted.

**Step 4: Commit**

```bash
git add backend/src/db/seed-demo-properties.js backend/package.json
git commit -m "feat: add demo property seed script for Lower Mainland listings"
```

---

## Task 13: Final Polish + Manual Verification

**Step 1: Start backend**

Run: `cd backend && npm run dev`

**Step 2: Start frontend**

Run: `cd public-site && npm run dev`

**Step 3: Verify end-to-end flow**

1. Open `http://localhost:5173` — Landing page loads with logo, tagline, "Browse Rentals" button
2. Click "Browse Rentals" — Map view loads, centered on Lower Mainland
3. Property pins appear on map (from demo seed data)
4. Zoom in/out — pins cluster/uncluster
5. Click a pin — side panel slides in from right with property details
6. Panel shows: title, price, type badge, bed/bath/sqft, description, amenities, contact links
7. Fill in inquiry form and submit — "Message sent!" confirmation
8. On mobile width — filter bar collapses to toggle, panel becomes bottom sheet

**Step 4: Run full backend test suite**

Run: `cd backend && npm test`
Expected: All tests pass (51 existing + new image + inquiry tests).

**Step 5: Final commit if any tweaks needed**

```bash
git add -A
git commit -m "chore: final polish for public site demo"
```

---

## Summary

| Task | What | Type |
|------|------|------|
| 1 | Migration: is_primary on property_media | Backend |
| 2 | Supabase Storage config + PropertyMediaModel | Backend |
| 3 | Image upload/delete/list endpoints + tests | Backend TDD |
| 4 | Inquiry endpoint + tests | Backend TDD |
| 5 | Bounding box filter on GET /api/properties | Backend TDD |
| 6 | Include images in GET /api/properties/:id | Backend |
| 7 | Frontend foundation (deps, routing, CSS) | Frontend |
| 8 | Landing page | Frontend |
| 9 | Map view + property pins + clustering | Frontend |
| 10 | Filter bar | Frontend |
| 11 | Side panel + image gallery + inquiry form | Frontend |
| 12 | Demo seed data | Backend |
| 13 | Final polish + E2E verification | Integration |
