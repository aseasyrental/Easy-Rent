import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import db from '../src/config/database.js';
import config from '../src/config/index.js';
import { guardAgainstProduction, cleanAllTables } from './helpers.js';

guardAgainstProduction();

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
  property_type: 'apartment',
};

beforeEach(async () => {
  await cleanAllTables();
  await createAdmin();
});

afterAll(async () => {
  await cleanAllTables();
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
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(2);
  });

  it('returns empty array when no properties', async () => {
    const res = await request(app).get('/api/properties');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it('excludes non-available properties from public list', async () => {
    const createRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProperty);

    // Mark as occupied — depends on PUT endpoint from Task 3
    await request(app)
      .put(`/api/properties/${createRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'occupied' });

    const res = await request(app).get('/api/properties');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

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
        .send({ ...validProperty, title: 'No coords' });

      const res = await request(app)
        .get('/api/properties')
        .query({ min_lat: 49.0, max_lat: 50.0, min_lng: -124.0, max_lng: -122.0 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });
});

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

  it('accepts max limit of 100', async () => {
    const res = await request(app).get('/api/properties?limit=100');
    expect(res.body.pagination.limit).toBe(100);
  });
});

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

describe('Short-term rental fields', () => {
  const shortTermProperty = {
    title: 'Furnished Studio Short-Term',
    address: '10 Beach Ave',
    city: 'Vancouver',
    province: 'BC',
    postal_code: 'V6E 1A1',
    bedrooms: 0,
    bathrooms: 1,
    listing_type: 'short_term',
    is_furnished: true,
    price_daily: 120.00,
    price_weekly: 700.00,
    price_monthly: 2400.00,
    min_stay_nights: 3,
  };

  it('creates a short-term property with rates and reads fields back', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(shortTermProperty);

    expect(res.status).toBe(201);
    expect(res.body.listing_type).toBe('short_term');
    expect(res.body.is_furnished).toBe(true);
    expect(res.body.price_daily).toBe('120.00');
    expect(res.body.price_weekly).toBe('700.00');
    expect(res.body.price_monthly).toBe('2400.00');
    expect(res.body.min_stay_nights).toBe(3);
  });

  it('GET ?listing_type=short_term returns only short-term rows', async () => {
    // Create one long-term (default) and one short-term
    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'Long-Term Place', address: '1 Long St' });

    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(shortTermProperty);

    const res = await request(app).get('/api/properties?listing_type=short_term');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].listing_type).toBe('short_term');
    expect(res.body.data[0].title).toBe('Furnished Studio Short-Term');
  });

  it('GET ?listing_type=long_term excludes short-term rows', async () => {
    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProperty, title: 'Long-Term Place', address: '1 Long St' });

    await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(shortTermProperty);

    const res = await request(app).get('/api/properties?listing_type=long_term');

    expect(res.status).toBe(200);
    expect(res.body.data.every(p => p.listing_type === 'long_term')).toBe(true);
    expect(res.body.data.some(p => p.listing_type === 'short_term')).toBe(false);
  });

  it('rejects invalid listing_type query param', async () => {
    const res = await request(app).get('/api/properties?listing_type=vacation');
    expect(res.status).toBe(400);
  });
});
