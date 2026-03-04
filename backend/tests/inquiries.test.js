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
