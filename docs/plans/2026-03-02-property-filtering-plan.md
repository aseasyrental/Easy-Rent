# Property Filtering + Pagination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add filtering, sorting, and pagination to the property list endpoint, plus add the missing `property_type` column.

**Architecture:** Single `GET /api/properties` endpoint with query params. Dynamic WHERE clause built in `PropertyModel.findFiltered()`. Optional auth middleware lets admin filter by any status; public is locked to `available`. Response changes from bare array to `{ data, pagination }`.

**Tech Stack:** Express, pg-promise, express-validator, Jest + supertest (TDD)

---

### Task 1: Migration — add property_type column + fix status CHECK

**Files:**
- Create: `backend/src/db/migrations/012_add_property_type.sql`

**Step 1: Write the migration**

```sql
-- Add property_type column
ALTER TABLE properties
  ADD COLUMN property_type VARCHAR(50)
  CHECK (property_type IN ('apartment', 'house', 'townhouse', 'condo', 'duplex', 'basement_suite', 'laneway_house'));

CREATE INDEX idx_properties_property_type ON properties(property_type);

-- Fix status CHECK: replace 'pending' with 'maintenance'
ALTER TABLE properties DROP CONSTRAINT properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check
  CHECK (status IN ('available', 'occupied', 'maintenance'));
```

**Step 2: Run the migration**

Run: `cd backend && npm run migrate`
Expected: "Applying: 012_add_property_type.sql" then "All migrations complete."

**Step 3: Commit**

```bash
git add backend/src/db/migrations/012_add_property_type.sql
git commit -m "feat: add property_type column + fix status CHECK constraint"
```

---

### Task 2: Optional auth middleware

**Files:**
- Modify: `backend/src/middleware/index.js`

**Step 1: Write the failing test**

Add to `backend/tests/properties.test.js` in the `GET /api/properties` describe block:

```javascript
it('returns all statuses when admin is authenticated', async () => {
  await request(app)
    .post('/api/properties')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(validProperty);

  await request(app)
    .post('/api/properties')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ ...validProperty, title: 'Occupied Place', address: '789 Elm St', status: 'occupied' });

  const res = await request(app)
    .get('/api/properties')
    .set('Authorization', `Bearer ${adminToken}`);

  expect(res.status).toBe(200);
  expect(res.body.data).toHaveLength(2);
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest tests/properties.test.js --testNamePattern="returns all statuses" --verbose`
Expected: FAIL — `res.body.data` is undefined (response is still a bare array)

**Step 3: Add `optionalAuth` middleware to `backend/src/middleware/index.js`**

```javascript
export function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      req.user = jwt.verify(token, config.jwt.secret);
    }
  } catch {
    // Invalid token — treat as unauthenticated, not an error
  }
  next();
}
```

**Step 4: Commit**

```bash
git add backend/src/middleware/index.js
git commit -m "feat: add optionalAuth middleware for public endpoints with admin override"
```

---

### Task 3: PropertyModel.findFiltered() — dynamic query builder

**Files:**
- Modify: `backend/src/models/PropertyModel.js`

**Step 1: Write the `findFiltered` method**

Add to `PropertyModel` class in `backend/src/models/PropertyModel.js`:

```javascript
static async findFiltered(filters = {}) {
  const conditions = [];
  const values = [];
  let idx = 1;

  // Status: public locked to 'available', admin can filter or see all
  if (filters.isAdmin && filters.status) {
    conditions.push(`status = $${idx++}`);
    values.push(filters.status);
  } else if (!filters.isAdmin) {
    conditions.push(`status = 'available'`);
  }

  if (filters.min_price !== undefined) {
    conditions.push(`price >= $${idx++}`);
    values.push(filters.min_price);
  }
  if (filters.max_price !== undefined) {
    conditions.push(`price <= $${idx++}`);
    values.push(filters.max_price);
  }
  if (filters.bedrooms !== undefined) {
    conditions.push(`bedrooms >= $${idx++}`);
    values.push(filters.bedrooms);
  }
  if (filters.bathrooms !== undefined) {
    conditions.push(`bathrooms >= $${idx++}`);
    values.push(filters.bathrooms);
  }
  if (filters.min_sqft !== undefined) {
    conditions.push(`sqft >= $${idx++}`);
    values.push(filters.min_sqft);
  }
  if (filters.max_sqft !== undefined) {
    conditions.push(`sqft <= $${idx++}`);
    values.push(filters.max_sqft);
  }
  if (filters.city) {
    conditions.push(`LOWER(city) = LOWER($${idx++})`);
    values.push(filters.city);
  }
  if (filters.property_type) {
    conditions.push(`property_type = $${idx++}`);
    values.push(filters.property_type);
  }
  if (filters.available_by) {
    conditions.push(`availability_date <= $${idx++}`);
    values.push(filters.available_by);
  }

  const where = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  // Sort
  const sortMap = {
    price_asc: 'price ASC',
    price_desc: 'price DESC',
    newest: 'created_at DESC',
    availability: 'availability_date ASC NULLS LAST',
    title_asc: 'title ASC',
  };
  const orderBy = sortMap[filters.sort] || sortMap.newest;

  // Pagination
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
  const offset = (page - 1) * limit;

  // Count total matching rows
  const countResult = await db.one(
    `SELECT COUNT(*)::int AS total FROM properties ${where}`,
    values
  );

  // Fetch page
  const data = await db.any(
    `SELECT * FROM properties ${where} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  return {
    data,
    pagination: {
      page,
      limit,
      total: countResult.total,
      total_pages: Math.ceil(countResult.total / limit),
    },
  };
}
```

**Step 2: Add `property_type` to `create()` and `update()` allowed fields**

In `create()` — add `property_type` to the INSERT column list and values array (after `neighborhood_info`):

```sql
-- Add to INSERT columns: property_type
-- Add to VALUES: $20
-- Add to values array: data.property_type || null
```

In `update()` — add `'property_type'` to the `allowed` array.

**Step 3: Commit**

```bash
git add backend/src/models/PropertyModel.js
git commit -m "feat: PropertyModel.findFiltered() with dynamic query builder + property_type support"
```

---

### Task 4: Controller + route wiring — list endpoint with filters

**Files:**
- Modify: `backend/src/controllers/PropertyController.js`
- Modify: `backend/src/routes/propertyRoutes.js`

**Step 1: Update `PropertyController.list()`**

Replace the existing `list` method in `backend/src/controllers/PropertyController.js`:

```javascript
static async list(req, res, next) {
  try {
    const isAdmin = req.user?.role === 'admin';

    const filters = {
      isAdmin,
      min_price: req.query.min_price,
      max_price: req.query.max_price,
      bedrooms: req.query.bedrooms,
      bathrooms: req.query.bathrooms,
      min_sqft: req.query.min_sqft,
      max_sqft: req.query.max_sqft,
      city: req.query.city,
      property_type: req.query.property_type,
      available_by: req.query.available_by,
      status: req.query.status,
      sort: req.query.sort,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await PropertyModel.findFiltered(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
```

**Step 2: Wire `optionalAuth` + query validation on the list route**

In `backend/src/routes/propertyRoutes.js`, update imports and the `GET /` route:

Add to imports:
```javascript
import { authenticate, requireAdmin, optionalAuth } from '../middleware/index.js';
import { body, param, query } from 'express-validator';
```

Replace `router.get('/', PropertyController.list);` with:

```javascript
const PROPERTY_TYPES = ['apartment', 'house', 'townhouse', 'condo', 'duplex', 'basement_suite', 'laneway_house'];
const SORT_OPTIONS = ['price_asc', 'price_desc', 'newest', 'availability', 'title_asc'];

router.get(
  '/',
  optionalAuth,
  [
    query('min_price').optional().isFloat({ gt: 0 }).withMessage('min_price must be a positive number'),
    query('max_price').optional().isFloat({ gt: 0 }).withMessage('max_price must be a positive number'),
    query('bedrooms').optional().isInt({ min: 0 }).withMessage('bedrooms must be a non-negative integer'),
    query('bathrooms').optional().isInt({ min: 0 }).withMessage('bathrooms must be a non-negative integer'),
    query('min_sqft').optional().isInt({ min: 0 }).withMessage('min_sqft must be a non-negative integer'),
    query('max_sqft').optional().isInt({ min: 0 }).withMessage('max_sqft must be a non-negative integer'),
    query('city').optional().trim().notEmpty().withMessage('city cannot be empty'),
    query('property_type').optional().isIn(PROPERTY_TYPES).withMessage(`property_type must be one of: ${PROPERTY_TYPES.join(', ')}`),
    query('available_by').optional().isISO8601().withMessage('available_by must be a valid date (YYYY-MM-DD)'),
    query('status').optional().isIn(['available', 'occupied', 'maintenance']).withMessage('status must be available, occupied, or maintenance'),
    query('sort').optional().isIn(SORT_OPTIONS).withMessage(`sort must be one of: ${SORT_OPTIONS.join(', ')}`),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  ],
  handleValidation,
  PropertyController.list,
);
```

**Step 3: Commit**

```bash
git add backend/src/controllers/PropertyController.js backend/src/routes/propertyRoutes.js
git commit -m "feat: wire filtering, sorting, pagination on GET /api/properties"
```

---

### Task 5: Fix existing tests for new response format

The response format changes from bare array to `{ data, pagination }`. Existing tests that check `res.body` as an array will break.

**Files:**
- Modify: `backend/tests/properties.test.js`

**Step 1: Update existing GET /api/properties tests**

In `backend/tests/properties.test.js`, update the three existing tests in `describe('GET /api/properties')`:

Test "returns available properties without auth":
```javascript
// Change:
expect(res.body).toHaveLength(2);
// To:
expect(res.body.data).toHaveLength(2);
expect(res.body.pagination).toBeDefined();
expect(res.body.pagination.total).toBe(2);
```

Test "returns empty array when no properties":
```javascript
// Change:
expect(res.body).toEqual([]);
// To:
expect(res.body.data).toEqual([]);
expect(res.body.pagination.total).toBe(0);
```

Test "excludes non-available properties from public list":
```javascript
// Change:
expect(res.body).toHaveLength(0);
// To:
expect(res.body.data).toHaveLength(0);
```

**Step 2: Run all existing tests to confirm they pass**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --verbose`
Expected: All 23 tests pass

**Step 3: Commit**

```bash
git add backend/tests/properties.test.js
git commit -m "fix: update existing tests for new paginated response format"
```

---

### Task 6: Filter tests — price, bedrooms, bathrooms, sqft, city, property_type

**Files:**
- Modify: `backend/tests/properties.test.js`

**Step 1: Add `property_type` to `validProperty`**

```javascript
const validProperty = {
  // ...existing fields...
  property_type: 'apartment',
};
```

**Step 2: Write filter tests**

Add a new describe block in `backend/tests/properties.test.js`:

```javascript
describe('GET /api/properties — filtering', () => {
  beforeEach(async () => {
    // Seed 3 varied properties for filter testing
    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validProperty,
        title: 'Cheap Studio',
        address: '100 First Ave',
        price: 1000, bedrooms: 0, bathrooms: 1, sqft: 400,
        city: 'Vancouver', property_type: 'apartment',
        availability_date: '2026-03-15',
      });

    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validProperty,
        title: 'Mid-Range House',
        address: '200 Second Ave',
        price: 2500, bedrooms: 3, bathrooms: 2, sqft: 1200,
        city: 'Burnaby', property_type: 'house',
        availability_date: '2026-04-01',
      });

    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validProperty,
        title: 'Luxury Condo',
        address: '300 Third Ave',
        price: 4000, bedrooms: 2, bathrooms: 2, sqft: 950,
        city: 'Vancouver', property_type: 'condo',
        availability_date: '2026-05-01',
      });
  });

  it('filters by min_price', async () => {
    const res = await request(app).get('/api/properties?min_price=2000');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every(p => parseFloat(p.price) >= 2000)).toBe(true);
  });

  it('filters by max_price', async () => {
    const res = await request(app).get('/api/properties?max_price=1500');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Cheap Studio');
  });

  it('filters by price range', async () => {
    const res = await request(app).get('/api/properties?min_price=1500&max_price=3000');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Mid-Range House');
  });

  it('filters by minimum bedrooms', async () => {
    const res = await request(app).get('/api/properties?bedrooms=2');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every(p => p.bedrooms >= 2)).toBe(true);
  });

  it('filters by minimum bathrooms', async () => {
    const res = await request(app).get('/api/properties?bathrooms=2');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every(p => p.bathrooms >= 2)).toBe(true);
  });

  it('filters by sqft range', async () => {
    const res = await request(app).get('/api/properties?min_sqft=500&max_sqft=1000');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Luxury Condo');
  });

  it('filters by city (case-insensitive)', async () => {
    const res = await request(app).get('/api/properties?city=vancouver');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every(p => p.city === 'Vancouver')).toBe(true);
  });

  it('filters by property_type', async () => {
    const res = await request(app).get('/api/properties?property_type=house');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Mid-Range House');
  });

  it('filters by available_by date', async () => {
    const res = await request(app).get('/api/properties?available_by=2026-04-01');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('combines multiple filters', async () => {
    const res = await request(app).get('/api/properties?city=Vancouver&bedrooms=1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Luxury Condo');
  });
});
```

**Step 3: Run filter tests to verify they fail (model not updated yet) then pass (after Task 3-4 are done)**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest tests/properties.test.js --testNamePattern="filtering" --verbose`
Expected: All 10 filter tests pass

**Step 4: Commit**

```bash
git add backend/tests/properties.test.js
git commit -m "test: add property filtering tests (price, beds, baths, sqft, city, type, date)"
```

---

### Task 7: Sorting + pagination tests

**Files:**
- Modify: `backend/tests/properties.test.js`

**Step 1: Write sorting tests**

```javascript
describe('GET /api/properties — sorting', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'B Property', address: '1 B St', price: 3000 });

    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'A Property', address: '2 A St', price: 1000 });

    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'C Property', address: '3 C St', price: 2000 });
  });

  it('sorts by price ascending', async () => {
    const res = await request(app).get('/api/properties?sort=price_asc');
    expect(res.body.data[0].title).toBe('A Property');
    expect(res.body.data[2].title).toBe('B Property');
  });

  it('sorts by price descending', async () => {
    const res = await request(app).get('/api/properties?sort=price_desc');
    expect(res.body.data[0].title).toBe('B Property');
    expect(res.body.data[2].title).toBe('A Property');
  });

  it('sorts by title ascending', async () => {
    const res = await request(app).get('/api/properties?sort=title_asc');
    expect(res.body.data[0].title).toBe('A Property');
    expect(res.body.data[1].title).toBe('B Property');
    expect(res.body.data[2].title).toBe('C Property');
  });

  it('defaults to newest first', async () => {
    const res = await request(app).get('/api/properties');
    expect(res.body.data[0].title).toBe('C Property');
  });
});
```

**Step 2: Write pagination tests**

```javascript
describe('GET /api/properties — pagination', () => {
  beforeEach(async () => {
    // Create 5 properties
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validProperty, title: `Property ${i}`, address: `${i} Test St`, price: i * 1000 });
    }
  });

  it('returns paginated results with correct metadata', async () => {
    const res = await request(app).get('/api/properties?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.total_pages).toBe(3);
  });

  it('returns second page', async () => {
    const res = await request(app).get('/api/properties?page=2&limit=2');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.page).toBe(2);
  });

  it('returns partial last page', async () => {
    const res = await request(app).get('/api/properties?page=3&limit=2');
    expect(res.body.data).toHaveLength(1);
  });

  it('returns empty data for page beyond total', async () => {
    const res = await request(app).get('/api/properties?page=10&limit=2');
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(5);
  });

  it('defaults to page 1 limit 20', async () => {
    const res = await request(app).get('/api/properties');
    expect(res.body.data).toHaveLength(5);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(20);
  });

  it('caps limit at 100', async () => {
    const res = await request(app).get('/api/properties?limit=999');
    expect(res.body.pagination.limit).toBe(100);
  });
});
```

**Step 3: Run all tests**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --verbose`
Expected: All tests pass (existing + new filter + sort + pagination)

**Step 4: Commit**

```bash
git add backend/tests/properties.test.js
git commit -m "test: add sorting and pagination tests"
```

---

### Task 8: Admin status filter test + validation tests

**Files:**
- Modify: `backend/tests/properties.test.js`

**Step 1: Write admin + validation tests**

```javascript
describe('GET /api/properties — admin status filtering', () => {
  it('returns all statuses when admin is authenticated', async () => {
    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'Occupied Place', address: '789 Elm St', status: 'occupied' });

    const res = await request(app)
      .get('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('admin can filter by specific status', async () => {
    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'Occupied Place', address: '789 Elm St', status: 'occupied' });

    const res = await request(app)
      .get('/api/properties?status=occupied')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Occupied Place');
  });

  it('public request ignores status param and only shows available', async () => {
    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'Occupied Place', address: '789 Elm St', status: 'occupied' });

    const res = await request(app).get('/api/properties?status=occupied');

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('available');
  });
});

describe('GET /api/properties — validation', () => {
  it('rejects invalid min_price', async () => {
    const res = await request(app).get('/api/properties?min_price=-5');
    expect(res.status).toBe(400);
  });

  it('rejects invalid property_type', async () => {
    const res = await request(app).get('/api/properties?property_type=castle');
    expect(res.status).toBe(400);
  });

  it('rejects invalid sort', async () => {
    const res = await request(app).get('/api/properties?sort=hackme');
    expect(res.status).toBe(400);
  });

  it('rejects page less than 1', async () => {
    const res = await request(app).get('/api/properties?page=0');
    expect(res.status).toBe(400);
  });

  it('rejects limit over 100', async () => {
    const res = await request(app).get('/api/properties?limit=101');
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run full test suite**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --verbose`
Expected: All tests pass

**Step 3: Commit**

```bash
git add backend/tests/properties.test.js
git commit -m "test: add admin status filtering + query validation tests"
```

---

### Task 9: Update property_type in create/update validation

**Files:**
- Modify: `backend/src/routes/propertyRoutes.js`

**Step 1: Add `property_type` to the field validation rules**

In `propertyFieldRules()`, add after the longitude rule:

```javascript
const propertyTypeRule = body('property_type');
// ...
rules.push(
  propertyTypeRule.optional().isIn(['apartment', 'house', 'townhouse', 'condo', 'duplex', 'basement_suite', 'laneway_house']).withMessage('property_type must be a valid type'),
);
```

**Step 2: Run full test suite to confirm nothing breaks**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --verbose`
Expected: All tests pass

**Step 3: Commit**

```bash
git add backend/src/routes/propertyRoutes.js
git commit -m "feat: add property_type validation to create/update routes"
```

---

### Task 10: Final review + full test run

**Step 1: Run full test suite**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --verbose`
Expected: All tests pass (original 23 + ~25 new = ~48 total)

**Step 2: Manual smoke test (optional)**

```bash
cd backend && node src/index.js &
# Public — default
curl http://localhost:3000/api/properties | jq
# Filtered
curl "http://localhost:3000/api/properties?city=Vancouver&bedrooms=2&sort=price_asc&page=1&limit=10" | jq
```

**Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for property filtering + pagination"
```
