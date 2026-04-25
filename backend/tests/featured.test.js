import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import db from '../src/config/database.js';
import config from '../src/config/index.js';
import { guardAgainstProduction, cleanAllTables } from './helpers.js';

guardAgainstProduction();

let adminToken;
let editorToken;
let adminId;

async function createAdmin() {
  const hashed = await bcrypt.hash('admin123', 10);
  const admin = await db.one(
    `INSERT INTO users (name, email, password, role)
     VALUES ('Test Admin', 'admin@test.com', $1, 'admin')
     RETURNING id, email, role`,
    [hashed]
  );
  adminId = admin.id;
  adminToken = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
}

async function createEditor() {
  const hashed = await bcrypt.hash('editor123', 10);
  const editor = await db.one(
    `INSERT INTO users (name, email, password, role)
     VALUES ('Test Editor', 'editor@test.com', $1, 'editor')
     RETURNING id, email, role`,
    [hashed]
  );
  editorToken = jwt.sign(
    { id: editor.id, email: editor.email, role: editor.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
}

async function createProperty(title, extra = {}) {
  const res = await request(app)
    .post('/api/properties')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title,
      address: `${title} St`,
      price: 2000,
      bedrooms: 2,
      bathrooms: 1,
      sqft: 800,
      ...extra,
    });
  return res.body.id;
}

beforeEach(async () => {
  await cleanAllTables();
  await createAdmin();
  await createEditor();
});

afterAll(async () => {
  await cleanAllTables();
});

describe('PATCH /api/properties/:id/featured', () => {
  it('admin can set positions 1, 2, 3 on three different properties', async () => {
    const id1 = await createProperty('A');
    const id2 = await createProperty('B');
    const id3 = await createProperty('C');

    const r1 = await request(app)
      .patch(`/api/properties/${id1}/featured`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ position: 1 });
    const r2 = await request(app)
      .patch(`/api/properties/${id2}/featured`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ position: 2 });
    const r3 = await request(app)
      .patch(`/api/properties/${id3}/featured`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ position: 3 });

    expect(r1.status).toBe(200);
    expect(r1.body.featured_position).toBe(1);
    expect(r2.body.featured_position).toBe(2);
    expect(r3.body.featured_position).toBe(3);
  });

  it('assigning a 4th property to a taken slot kicks the previous occupant out', async () => {
    const id1 = await createProperty('A');
    const id4 = await createProperty('D');

    await request(app)
      .patch(`/api/properties/${id1}/featured`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ position: 1 });

    const res = await request(app)
      .patch(`/api/properties/${id4}/featured`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ position: 1 });

    expect(res.status).toBe(200);
    expect(res.body.featured_position).toBe(1);

    // Original occupant has been kicked out
    const oldOccupant = await request(app).get(`/api/properties/${id1}`);
    expect(oldOccupant.body.featured_position).toBeNull();
  });

  it('reassigning the same property to its current slot is a no-op', async () => {
    const id1 = await createProperty('A');

    await request(app)
      .patch(`/api/properties/${id1}/featured`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ position: 1 });

    const res = await request(app)
      .patch(`/api/properties/${id1}/featured`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ position: 1 });

    expect(res.status).toBe(200);
    expect(res.body.featured_position).toBe(1);
  });

  it('position null clears the slot', async () => {
    const id1 = await createProperty('A');

    await request(app)
      .patch(`/api/properties/${id1}/featured`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ position: 1 });

    const res = await request(app)
      .patch(`/api/properties/${id1}/featured`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ position: null });

    expect(res.status).toBe(200);
    expect(res.body.featured_position).toBeNull();
  });

  it('returns 404 for non-existent property', async () => {
    const res = await request(app)
      .patch('/api/properties/999999/featured')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ position: 1 });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid position values', async () => {
    const id1 = await createProperty('A');

    for (const bad of [0, 4, 'foo', undefined]) {
      const res = await request(app)
        .patch(`/api/properties/${id1}/featured`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ position: bad });
      expect(res.status).toBe(400);
    }
  });

  it('returns 401 without auth', async () => {
    const id1 = await createProperty('A');
    const res = await request(app)
      .patch(`/api/properties/${id1}/featured`)
      .send({ position: 1 });
    expect(res.status).toBe(401);
  });

  it('returns 403 for editor role', async () => {
    const id1 = await createProperty('A');
    const res = await request(app)
      .patch(`/api/properties/${id1}/featured`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ position: 1 });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/properties?featured=true', () => {
  it('returns up to three featured properties in position order', async () => {
    const id1 = await createProperty('A');
    const id2 = await createProperty('B');
    const id3 = await createProperty('C');

    await request(app).patch(`/api/properties/${id3}/featured`).set('Authorization', `Bearer ${adminToken}`).send({ position: 1 });
    await request(app).patch(`/api/properties/${id1}/featured`).set('Authorization', `Bearer ${adminToken}`).send({ position: 2 });
    await request(app).patch(`/api/properties/${id2}/featured`).set('Authorization', `Bearer ${adminToken}`).send({ position: 3 });

    const res = await request(app).get('/api/properties?featured=true');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].id).toBe(id3);
    expect(res.body.data[0].featured_position).toBe(1);
    expect(res.body.data[1].id).toBe(id1);
    expect(res.body.data[1].featured_position).toBe(2);
    expect(res.body.data[2].id).toBe(id2);
    expect(res.body.data[2].featured_position).toBe(3);
  });

  it('excludes non-featured properties', async () => {
    const id1 = await createProperty('A');
    await createProperty('B');
    await createProperty('C');

    await request(app).patch(`/api/properties/${id1}/featured`).set('Authorization', `Bearer ${adminToken}`).send({ position: 1 });

    const res = await request(app).get('/api/properties?featured=true');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(id1);
  });

  it('returns empty when nothing is featured', async () => {
    await createProperty('A');

    const res = await request(app).get('/api/properties?featured=true');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it('public request hides featured properties that are not available', async () => {
    const id1 = await createProperty('A');

    await request(app).patch(`/api/properties/${id1}/featured`).set('Authorization', `Bearer ${adminToken}`).send({ position: 1 });
    await request(app).put(`/api/properties/${id1}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'occupied' });

    const res = await request(app).get('/api/properties?featured=true');
    expect(res.body.data).toHaveLength(0);
  });

  it('admin request shows featured properties regardless of status', async () => {
    const id1 = await createProperty('A');

    await request(app).patch(`/api/properties/${id1}/featured`).set('Authorization', `Bearer ${adminToken}`).send({ position: 1 });
    await request(app).put(`/api/properties/${id1}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'occupied' });

    const res = await request(app)
      .get('/api/properties?featured=true')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(id1);
  });

  it('rejects invalid featured query value', async () => {
    const res = await request(app).get('/api/properties?featured=garbage');
    expect(res.status).toBe(400);
  });
});
