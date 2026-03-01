import request from 'supertest';
import app from '../src/app.js';
import db from '../src/config/database.js';

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
});

afterAll(async () => {
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
  await db.$pool.end();
});

describe('POST /api/auth/register', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    phone: '555-0100',
  };

  it('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
      role: 'tenant',
    });
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 400 if email already exists', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('returns 400 if required fields missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const user = {
    name: 'Test User',
    email: 'login@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(user);
  });

  it('logs in with valid credentials and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('returns 401 with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns user when valid token provided', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Me', email: 'me@example.com', password: 'pass123' });

    const token = registerRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
  });
});
