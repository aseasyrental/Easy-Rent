import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import db from '../src/config/database.js';
import config from '../src/config/index.js';
import { guardAgainstProduction, cleanAllTables } from './helpers.js';

guardAgainstProduction();

let adminId, propertyId, adminToken, tenantToken;

beforeEach(async () => {
  await cleanAllTables();

  const hashed = await bcrypt.hash('password123', 10);
  const admin = await db.one(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role`,
    ['Admin', 'admin@test.com', hashed, 'admin']
  );
  adminId = admin.id;
  adminToken = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const tenant = await db.one(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role`,
    ['Tenant', 'tenant@test.com', hashed, 'tenant']
  );
  tenantToken = jwt.sign(
    { id: tenant.id, email: tenant.email, role: tenant.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

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

describe('POST /api/inquiries — furnished_interest type', () => {
  it('creates a furnished_interest inquiry with no property_id', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({ type: 'furnished_interest', email: 'lead@example.com', name: 'Curious Renter' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('furnished_interest');
    expect(res.body.property_id).toBeNull();
    expect(res.body.email).toBe('lead@example.com');
  });

  it('allows an email-only furnished_interest lead (no name, no message)', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({ type: 'furnished_interest', email: 'anon@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('furnished_interest');
    expect(res.body.property_id).toBeNull();
    expect(res.body.name).toBeNull();
  });

  it('persists a furnished_interest inquiry and reads it back via admin GET', async () => {
    const created = await request(app)
      .post('/api/inquiries')
      .send({ type: 'furnished_interest', email: 'lead2@example.com', name: 'R2' });
    expect(created.status).toBe(201);

    const res = await request(app)
      .get('/api/inquiries')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const found = res.body.data.find((i) => i.id === created.body.id);
    expect(found).toBeDefined();
    expect(found.type).toBe('furnished_interest');
    expect(found.property_id).toBeNull();
  });

  it('still requires property_id when type is omitted (defaults to question)', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({ name: 'Jane', email: 'jane@example.com', message: 'Hi' });
    expect(res.status).toBe(400);
  });

  it('still requires property_id for an explicit question inquiry', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({ type: 'question', name: 'Jane', email: 'jane@example.com', message: 'Hi' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid type', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({ type: 'bogus', email: 'x@example.com', property_id: propertyId });
    expect(res.status).toBe(400);
  });

  it('defaults to type question when type is omitted (with valid property data)', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({
        property_id: propertyId,
        name: 'Default Type',
        email: 'default@example.com',
        message: 'Hello',
      });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('question');
  });
});

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
    await request(app)
      .post('/api/inquiries')
      .send({ property_id: propertyId, name: 'Jane', email: 'jane@test.com', message: 'Hi' });

    const res = await request(app)
      .get('/api/inquiries')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('property_title');
  });

  it('should filter inquiries by status', async () => {
    await request(app)
      .post('/api/inquiries')
      .send({ property_id: propertyId, name: 'Jane', email: 'jane@test.com', message: 'Hi' });

    const res = await request(app)
      .get('/api/inquiries?status=new')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every(i => i.status === 'new')).toBe(true);
  });

  it('should filter inquiries by property_id', async () => {
    await request(app)
      .post('/api/inquiries')
      .send({ property_id: propertyId, name: 'Jane', email: 'jane@test.com', message: 'Hi' });

    const res = await request(app)
      .get(`/api/inquiries?property_id=${propertyId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every(i => i.property_id === propertyId)).toBe(true);
  });
});

describe('GET /api/inquiries/:id', () => {
  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/inquiries/1');
    expect(res.status).toBe(401);
  });

  it('should return 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/inquiries/1')
      .set('Authorization', `Bearer ${tenantToken}`);
    expect(res.status).toBe(403);
  });

  it('should return inquiry detail with property info', async () => {
    const inquiry = await request(app)
      .post('/api/inquiries')
      .send({ property_id: propertyId, name: 'Bob', email: 'bob@test.com', message: 'Interested' });

    const res = await request(app)
      .get(`/api/inquiries/${inquiry.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Bob');
    expect(res.body.property_title).toBe('Test Property');
  });

  it('should return 404 for non-existent inquiry', async () => {
    const res = await request(app)
      .get('/api/inquiries/99999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/inquiries/:id/status', () => {
  it('should return 401 without auth', async () => {
    const res = await request(app)
      .patch('/api/inquiries/1/status')
      .send({ status: 'responded' });
    expect(res.status).toBe(401);
  });

  it('should return 403 for non-admin', async () => {
    const res = await request(app)
      .patch('/api/inquiries/1/status')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ status: 'responded' });
    expect(res.status).toBe(403);
  });

  it('should update inquiry status for admin', async () => {
    const inquiry = await request(app)
      .post('/api/inquiries')
      .send({ property_id: propertyId, name: 'Bob', email: 'bob@test.com', message: 'Interested' });

    const res = await request(app)
      .patch(`/api/inquiries/${inquiry.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'responded' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('responded');
  });

  it('should return 404 for non-existent inquiry', async () => {
    const res = await request(app)
      .patch('/api/inquiries/99999/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'responded' });
    expect(res.status).toBe(404);
  });

  it('should return 400 for invalid status', async () => {
    const inquiry = await request(app)
      .post('/api/inquiries')
      .send({ property_id: propertyId, name: 'Bob', email: 'bob@test.com', message: 'Interested' });

    const res = await request(app)
      .patch(`/api/inquiries/${inquiry.body.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalid_status' });
    expect(res.status).toBe(400);
  });
});
