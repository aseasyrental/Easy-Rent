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

  it.skip('excludes non-available properties from public list', async () => {
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
    expect(res.body).toHaveLength(0);
  });
});
