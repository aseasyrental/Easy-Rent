# Properties CRUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build CRUD API for property management — admin creates/updates/deletes, public reads.

**Architecture:** PropertyModel (pg-promise static methods) → PropertyController (Express handlers with try/catch → next) → propertyRoutes (Router with middleware). Admin writes require `authenticate` + `requireAdmin`. Public reads have no auth.

**Tech Stack:** Express.js, pg-promise, JWT auth (existing middleware), supertest + Jest (TDD)

**Existing patterns to follow:**
- Model: `backend/src/models/UserModel.js` — static methods, `db.one()` / `db.oneOrNone()` / `db.any()`
- Controller: `backend/src/controllers/AuthController.js` — static methods, try/catch, `next(error)`
- Routes: `backend/src/routes/authRoutes.js` — Router instance, middleware chaining
- Tests: `backend/tests/auth.test.js` — supertest, beforeEach cleanup, afterAll pool close

**DB note:** pg-promise returns DECIMAL columns as strings (e.g., `price: "2200.00"`). This is correct — preserves precision.

---

## Task 1: Create Property Endpoint (TDD)

Creates all infrastructure files + implements the POST endpoint.

**Files:**
- Create: `backend/tests/properties.test.js`
- Create: `backend/src/models/PropertyModel.js`
- Create: `backend/src/controllers/PropertyController.js`
- Create: `backend/src/routes/propertyRoutes.js`
- Modify: `backend/src/app.js` (wire routes)

**Step 1: Write the failing tests for create**

Create `backend/tests/properties.test.js`:
```js
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import db from '../src/config/database.js';
import config from '../src/config/index.js';

let adminToken;
let adminId;

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await db.one(
    `INSERT INTO users (name, email, password, role)
     VALUES ('Test Admin', 'admin@test.com', $1, 'admin')
     RETURNING id, email, role`,
    [hashedPassword]
  );
  adminId = admin.id;
  adminToken = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
}

const validProperty = {
  title: '2BR Apartment Downtown',
  description: 'Spacious 2-bedroom in downtown Vancouver',
  address: '123 Main St',
  city: 'Vancouver',
  province: 'BC',
  postal_code: 'V6B 1A1',
  price: 2200.00,
  bedrooms: 2,
  bathrooms: 1,
  sqft: 850,
  amenities: ['parking', 'in-suite laundry'],
  availability_date: '2026-04-01',
  lease_term_months: 12,
  deposit_amount: 2200.00,
  neighborhood_info: 'Near Skytrain',
};

beforeEach(async () => {
  await db.none('DELETE FROM messages');
  await db.none('DELETE FROM threads');
  await db.none('DELETE FROM tenants');
  await db.none('DELETE FROM applications');
  await db.none('DELETE FROM inquiries');
  await db.none('DELETE FROM property_media');
  await db.none('DELETE FROM documents');
  await db.none('DELETE FROM ai_responses');
  await db.none('DELETE FROM properties');
  await db.none('DELETE FROM users');
  await createAdmin();
});

afterAll(async () => {
  await db.none('DELETE FROM properties');
  await db.none('DELETE FROM users');
  await db.$pool.end();
});

describe('POST /api/properties', () => {
  it('creates a property when admin authenticated', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(validProperty.title);
    expect(res.body.price).toBe('2200.00');
    expect(res.body.owner_id).toBe(adminId);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('created_at');
  });

  it('returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'no title or address' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/properties')
      .send(validProperty);

    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Renter', email: 'renter@test.com', password: 'pass123' });

    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${regRes.body.token}`)
      .send(validProperty);

    expect(res.status).toBe(403);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=properties --no-coverage 2>&1 | head -30`

Expected: FAIL — route not found (404).

**Step 3: Create PropertyModel**

Create `backend/src/models/PropertyModel.js`:
```js
import db from '../config/database.js';

export class PropertyModel {
  static async create(data) {
    return db.one(
      `INSERT INTO properties (
        title, description, address, city, province, postal_code,
        latitude, longitude, price, bedrooms, bathrooms, sqft,
        amenities, availability_date, lease_term_months,
        deposit_amount, neighborhood_info, status, owner_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13::jsonb, $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        data.title,
        data.description || null,
        data.address,
        data.city || null,
        data.province || null,
        data.postal_code || null,
        data.latitude || null,
        data.longitude || null,
        data.price,
        data.bedrooms || null,
        data.bathrooms || null,
        data.sqft || null,
        JSON.stringify(data.amenities || []),
        data.availability_date || null,
        data.lease_term_months || null,
        data.deposit_amount || null,
        data.neighborhood_info || null,
        data.status || 'available',
        data.owner_id,
      ]
    );
  }
}
```

**Step 4: Create PropertyController**

Create `backend/src/controllers/PropertyController.js`:
```js
import { PropertyModel } from '../models/PropertyModel.js';

export class PropertyController {
  static async create(req, res, next) {
    try {
      const { title, address, price } = req.body;

      if (!title || !address || price == null) {
        return res.status(400).json({ message: 'Title, address, and price are required' });
      }

      const property = await PropertyModel.create({
        ...req.body,
        owner_id: req.user.id,
      });

      res.status(201).json(property);
    } catch (error) {
      next(error);
    }
  }
}
```

**Step 5: Create propertyRoutes and wire in app.js**

Create `backend/src/routes/propertyRoutes.js`:
```js
import { Router } from 'express';
import { PropertyController } from '../controllers/PropertyController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';

const router = Router();

router.post('/', authenticate, requireAdmin, PropertyController.create);

export default router;
```

In `backend/src/app.js`, add the import and route (after the auth routes line):
```js
import propertyRoutes from './routes/propertyRoutes.js';
```
```js
app.use('/api/properties', propertyRoutes);
```

**Step 6: Run tests to verify they pass**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=properties --no-coverage`

Expected: All 4 tests PASS.

**Step 7: Commit**

```bash
git add backend/tests/properties.test.js backend/src/models/PropertyModel.js backend/src/controllers/PropertyController.js backend/src/routes/propertyRoutes.js backend/src/app.js
git commit -m "feat: property create endpoint with admin auth (TDD)"
```

---

## Task 2: Read Endpoints — Get by ID + List (TDD)

Adds public read endpoints. No auth required.

**Files:**
- Modify: `backend/tests/properties.test.js` (add test blocks)
- Modify: `backend/src/models/PropertyModel.js` (add findById, findAll)
- Modify: `backend/src/controllers/PropertyController.js` (add getById, list)
- Modify: `backend/src/routes/propertyRoutes.js` (add GET routes)

**Step 1: Write failing tests for read endpoints**

Append to `backend/tests/properties.test.js` (before the closing of the file):

```js
describe('GET /api/properties/:id', () => {
  it('returns a property by ID without auth', async () => {
    const createRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    const res = await request(app)
      .get(`/api/properties/${createRes.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe(validProperty.title);
    expect(res.body.id).toBe(createRes.body.id);
  });

  it('returns 404 for non-existent property', async () => {
    const res = await request(app).get('/api/properties/99999');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/properties', () => {
  it('returns available properties without auth', async () => {
    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'Another Place', address: '456 Oak Ave' });

    const res = await request(app).get('/api/properties');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('returns empty array when no properties', async () => {
    const res = await request(app).get('/api/properties');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('excludes non-available properties from public list', async () => {
    const createRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    // Mark as occupied
    await request(app)
      .put(`/api/properties/${createRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'occupied' });

    const res = await request(app).get('/api/properties');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});
```

**Note:** The last test (`excludes non-available`) depends on the PUT endpoint from Task 3. It will fail until Task 3 is done — skip it for now by changing `it(` to `it.skip(` and un-skip it in Task 3.

**Step 2: Run tests to verify new ones fail**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=properties --no-coverage 2>&1 | tail -20`

Expected: New GET tests FAIL (404 — routes not defined yet). Create tests still pass.

**Step 3: Add findById and findAll to PropertyModel**

Append to the `PropertyModel` class in `backend/src/models/PropertyModel.js`:
```js
  static async findById(id) {
    return db.oneOrNone('SELECT * FROM properties WHERE id = $1', [id]);
  }

  static async findAll() {
    return db.any(
      `SELECT * FROM properties
       WHERE status = 'available'
       ORDER BY created_at DESC`
    );
  }
```

**Step 4: Add getById and list to PropertyController**

Append to the `PropertyController` class in `backend/src/controllers/PropertyController.js`:
```js
  static async getById(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      res.json(property);
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const properties = await PropertyModel.findAll();
      res.json(properties);
    } catch (error) {
      next(error);
    }
  }
```

**Step 5: Add GET routes**

In `backend/src/routes/propertyRoutes.js`, add before the POST route:
```js
router.get('/', PropertyController.list);
router.get('/:id', PropertyController.getById);
```

**Step 6: Run tests to verify they pass**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=properties --no-coverage`

Expected: All tests PASS (the skipped one shows as skipped).

**Step 7: Commit**

```bash
git add backend/tests/properties.test.js backend/src/models/PropertyModel.js backend/src/controllers/PropertyController.js backend/src/routes/propertyRoutes.js
git commit -m "feat: property read endpoints — get by ID and list available (TDD)"
```

---

## Task 3: Update + Delete Endpoints (TDD)

Adds admin-only mutation endpoints. Partial updates supported.

**Files:**
- Modify: `backend/tests/properties.test.js` (add test blocks, un-skip the status filter test)
- Modify: `backend/src/models/PropertyModel.js` (add update, delete)
- Modify: `backend/src/controllers/PropertyController.js` (add update, delete)
- Modify: `backend/src/routes/propertyRoutes.js` (add PUT, DELETE routes)

**Step 1: Write failing tests for update + delete**

Append to `backend/tests/properties.test.js`:

```js
describe('PUT /api/properties/:id', () => {
  it('updates a property when admin authenticated', async () => {
    const createRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    const res = await request(app)
      .put(`/api/properties/${createRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Title', price: 2500.00 });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
    expect(res.body.price).toBe('2500.00');
    expect(res.body.address).toBe(validProperty.address);
  });

  it('returns 404 for non-existent property', async () => {
    const res = await request(app)
      .put('/api/properties/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Nope' });

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin user', async () => {
    const createRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Renter', email: 'renter@test.com', password: 'pass123' });

    const res = await request(app)
      .put(`/api/properties/${createRes.body.id}`)
      .set('Authorization', `Bearer ${regRes.body.token}`)
      .send({ title: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/properties/:id', () => {
  it('deletes a property when admin authenticated', async () => {
    const createRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    const res = await request(app)
      .delete(`/api/properties/${createRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/properties/${createRes.body.id}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 for non-existent property', async () => {
    const res = await request(app)
      .delete('/api/properties/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin user', async () => {
    const createRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Renter', email: 'renter@test.com', password: 'pass123' });

    const res = await request(app)
      .delete(`/api/properties/${createRes.body.id}`)
      .set('Authorization', `Bearer ${regRes.body.token}`);

    expect(res.status).toBe(403);
  });
});
```

Also: un-skip the `excludes non-available properties from public list` test in the GET /api/properties describe block (change `it.skip(` back to `it(`).

**Step 2: Run tests to verify new ones fail**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=properties --no-coverage 2>&1 | tail -20`

Expected: PUT and DELETE tests FAIL. Existing tests still pass.

**Step 3: Add update and delete to PropertyModel**

Append to the `PropertyModel` class in `backend/src/models/PropertyModel.js`:
```js
  static async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = [
      'title', 'description', 'address', 'city', 'province', 'postal_code',
      'latitude', 'longitude', 'price', 'bedrooms', 'bathrooms', 'sqft',
      'amenities', 'availability_date', 'lease_term_months',
      'deposit_amount', 'neighborhood_info', 'status',
    ];

    for (const field of allowed) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${idx}`);
        values.push(field === 'amenities' ? JSON.stringify(data[field]) : data[field]);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    return db.oneOrNone(
      `UPDATE properties SET ${fields.join(', ')}
       WHERE id = $${idx} RETURNING *`,
      values
    );
  }

  static async delete(id) {
    const result = await db.result('DELETE FROM properties WHERE id = $1', [id]);
    return result.rowCount;
  }
```

**Step 4: Add update and delete to PropertyController**

Append to the `PropertyController` class in `backend/src/controllers/PropertyController.js`:
```js
  static async update(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      const updated = await PropertyModel.update(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      await PropertyModel.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
```

**Step 5: Add PUT and DELETE routes**

In `backend/src/routes/propertyRoutes.js`, add after the GET routes:
```js
router.put('/:id', authenticate, requireAdmin, PropertyController.update);
router.delete('/:id', authenticate, requireAdmin, PropertyController.delete);
```

**Step 6: Run tests to verify they all pass**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=properties --no-coverage`

Expected: All tests PASS (including the un-skipped status filter test).

**Step 7: Run full test suite**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --no-coverage`

Expected: All auth tests + all property tests PASS.

**Step 8: Commit**

```bash
git add backend/tests/properties.test.js backend/src/models/PropertyModel.js backend/src/controllers/PropertyController.js backend/src/routes/propertyRoutes.js
git commit -m "feat: property update + delete endpoints with admin auth (TDD)"
```

---

## Summary

| Task | Endpoint(s) | Tests | Commit |
|------|-------------|-------|--------|
| 1 | POST /api/properties | 4 (create, missing fields, no auth, non-admin) | `feat: property create endpoint with admin auth (TDD)` |
| 2 | GET /api/properties, GET /api/properties/:id | 5 (get by id, 404, list, empty, status filter) | `feat: property read endpoints — get by ID and list available (TDD)` |
| 3 | PUT /api/properties/:id, DELETE /api/properties/:id | 6 (update, 404, 403, delete, 404, 403) | `feat: property update + delete endpoints with admin auth (TDD)` |

**Total: 15 tests across 3 commits.**
