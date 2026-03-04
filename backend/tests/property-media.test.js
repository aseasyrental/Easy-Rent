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

  it('requires admin auth', async () => {
    const res = await request(app)
      .post(`/api/properties/${propertyId}/images/metadata`)
      .send({ url: 'https://example.com/photo.jpg' });
    expect(res.status).toBe(401);
  });

  it('returns 404 for non-existent property', async () => {
    const res = await request(app)
      .post('/api/properties/99999/images/metadata')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ url: 'https://example.com/photo.jpg' });
    expect(res.status).toBe(404);
  });

  it('validates url is required and valid', async () => {
    const res = await request(app)
      .post(`/api/properties/${propertyId}/images/metadata`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_primary: true });
    expect(res.status).toBe(400);
  });
});
