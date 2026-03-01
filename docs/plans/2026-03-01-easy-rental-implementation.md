# Easy Rental Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a rental property management platform with a public site for renters and an admin dashboard for Bill.

**Architecture:** Two separate React frontends (public-site, admin-dashboard) sharing a single Express/PostgreSQL backend API. AI-assisted messaging with email notifications. TDD throughout.

**Tech Stack:** React 18 + Vite, Express.js, PostgreSQL (pg-promise), JWT auth, Axios, Docker Compose

**Design Doc:** `docs/plans/2026-03-01-easy-rental-design.md`

**Phases:**
- Phase 1: Foundation (backend, database, auth, project restructure)
- Phase 2: Properties Backend (CRUD, media upload, documents)
- Phase 3: Public Site (listings, inquiries, applications)
- Phase 4: Admin Dashboard (dashboard, property management, leads, roster)
- Phase 5: Messaging (threads, in-app chat, email bridge)
- Phase 6: AI Layer (auto-respond, draft suggestions, settings)

---

# Phase 1: Foundation

## Task 1: Project Restructure

**Files:**
- Create: `public-site/` (new React app)
- Create: `admin-dashboard/` (new React app)
- Create: `shared/constants.js`
- Preserve: `backend/` (expand in place)
- Remove: `frontend/` (replaced by public-site and admin-dashboard)

**Step 1: Scaffold public-site React app**

Run:
```bash
cd c:/Users/mrjos/Projects/Easy-Rent
npm create vite@latest public-site -- --template react
```

**Step 2: Scaffold admin-dashboard React app**

Run:
```bash
npm create vite@latest admin-dashboard -- --template react
```

**Step 3: Install shared dependencies in both apps**

Run:
```bash
cd public-site && npm install axios react-router-dom && cd ..
cd admin-dashboard && npm install axios react-router-dom && cd ..
```

**Step 4: Create shared constants**

Create `shared/constants.js`:
```js
export const USER_ROLES = {
  ADMIN: 'admin',
  TENANT: 'tenant',
};

export const PROPERTY_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  PENDING: 'pending',
};

export const INQUIRY_STATUS = {
  NEW: 'new',
  RESPONDED: 'responded',
  SCHEDULED: 'scheduled',
  CLOSED: 'closed',
};

export const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  DENIED: 'denied',
};

export const TENANT_STATUS = {
  ACTIVE: 'active',
  NOTICE_GIVEN: 'notice_given',
  MOVED_OUT: 'moved_out',
};

export const MEDIA_TYPES = {
  PHOTO: 'photo',
  VIDEO: 'video',
};

export const DOCUMENT_TYPES = {
  FORM: 'form',
  AGREEMENT: 'agreement',
  LEASE: 'lease',
};

export const INQUIRY_TYPES = {
  QUESTION: 'question',
  VIEWING_REQUEST: 'viewing_request',
};
```

**Step 5: Copy API client setup to both apps**

Copy `frontend/src/services/api.js` to both `public-site/src/services/api.js` and `admin-dashboard/src/services/api.js`.

**Step 6: Copy useApi hook to both apps**

Copy `frontend/src/hooks/useApi.js` to both `public-site/src/hooks/useApi.js` and `admin-dashboard/src/hooks/useApi.js`.

**Step 7: Remove old frontend directory**

Run:
```bash
rm -rf frontend
```

**Step 8: Update docker-compose.yml if needed**

No changes needed — Docker only runs PostgreSQL and pgAdmin.

**Step 9: Verify both apps start**

Run in separate terminals:
```bash
cd public-site && npm run dev
cd admin-dashboard && npm run dev
```

Expected: Both Vite dev servers start without errors. Public-site on 5173, admin-dashboard on 5174.

**Step 10: Commit**

```bash
git add public-site admin-dashboard shared
git rm -r frontend
git add docker-compose.yml
git commit -m "refactor: restructure project into public-site, admin-dashboard, and shared"
```

---

## Task 2: Database Migration System

**Files:**
- Create: `backend/src/db/migrate.js`
- Create: `backend/src/db/migrations/001_create_users.sql`
- Create: `backend/src/db/migrations/002_create_properties.sql`
- Create: `backend/src/db/migrations/003_create_property_media.sql`
- Create: `backend/src/db/migrations/004_create_inquiries.sql`
- Create: `backend/src/db/migrations/005_create_applications.sql`
- Create: `backend/src/db/migrations/006_create_threads.sql`
- Create: `backend/src/db/migrations/007_create_messages.sql`
- Create: `backend/src/db/migrations/008_create_tenants.sql`
- Create: `backend/src/db/migrations/009_create_documents.sql`
- Create: `backend/src/db/migrations/010_create_ai_responses.sql`
- Modify: `backend/package.json` (add migrate script)

**Step 1: Create migration runner**

Create `backend/src/db/migrate.js`:
```js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

async function migrate() {
  try {
    // Create migrations tracking table
    await db.none(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get already applied migrations
    const applied = await db.map(
      'SELECT name FROM migrations ORDER BY id',
      [],
      row => row.name
    );

    // Read migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Apply pending migrations
    for (const file of files) {
      if (applied.includes(file)) {
        console.log(`Skipping (already applied): ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Applying: ${file}`);

      await db.tx(async t => {
        await t.none(sql);
        await t.none('INSERT INTO migrations (name) VALUES ($1)', [file]);
      });

      console.log(`Applied: ${file}`);
    }

    console.log('All migrations complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
```

**Step 2: Create migration files**

Create `backend/src/db/migrations/001_create_users.sql`:
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'tenant' CHECK (role IN ('admin', 'tenant')),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

Create `backend/src/db/migrations/002_create_properties.sql`:
```sql
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  price DECIMAL(10, 2) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  sqft INTEGER,
  amenities JSONB DEFAULT '[]',
  availability_date DATE,
  lease_term_months INTEGER,
  deposit_amount DECIMAL(10, 2),
  neighborhood_info TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'pending')),
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_price ON properties(price);
```

Create `backend/src/db/migrations/003_create_property_media.sql`:
```sql
CREATE TABLE IF NOT EXISTS property_media (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('photo', 'video')),
  url VARCHAR(500) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_property_media_property ON property_media(property_id);
```

Create `backend/src/db/migrations/004_create_inquiries.sql`:
```sql
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('question', 'viewing_request')),
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'responded', 'scheduled', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inquiries_property ON inquiries(property_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
```

Create `backend/src/db/migrations/005_create_applications.sql`:
```sql
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  desired_move_in DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'denied')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_property ON applications(property_id);
CREATE INDEX idx_applications_status ON applications(status);
```

Create `backend/src/db/migrations/006_create_threads.sql`:
```sql
CREATE TABLE IF NOT EXISTS threads (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE SET NULL,
  application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
  subject VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_threads_property ON threads(property_id);
```

Create `backend/src/db/migrations/007_create_messages.sql`:
```sql
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_recipient_unread ON messages(recipient_id, read_at) WHERE read_at IS NULL;
```

Create `backend/src/db/migrations/008_create_tenants.sql`:
```sql
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  rent_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'notice_given', 'moved_out')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_property ON tenants(property_id);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE UNIQUE INDEX idx_tenants_active_property ON tenants(property_id) WHERE status = 'active';
```

Create `backend/src/db/migrations/009_create_documents.sql`:
```sql
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('form', 'agreement', 'lease')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_documents_type ON documents(type);
```

Create `backend/src/db/migrations/010_create_ai_responses.sql`:
```sql
CREATE TABLE IF NOT EXISTS ai_responses (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER REFERENCES threads(id) ON DELETE SET NULL,
  inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE SET NULL,
  prompt_context TEXT,
  response TEXT,
  was_sent_automatically BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_responses_thread ON ai_responses(thread_id);
```

**Step 3: Add migrate script to package.json**

In `backend/package.json`, add to scripts:
```json
"migrate": "node src/db/migrate.js"
```

**Step 4: Run migrations**

Run:
```bash
cd backend && npm run migrate
```

Expected: All 10 migrations applied successfully.

**Step 5: Verify tables exist**

Connect to pgAdmin at `http://localhost:5050` or run:
```bash
docker exec -it easyrental-db psql -U easyrental -d easyrental_db -c "\dt"
```

Expected: All tables listed (users, properties, property_media, inquiries, applications, threads, messages, tenants, documents, ai_responses, migrations).

**Step 6: Commit**

```bash
git add backend/src/db backend/package.json
git commit -m "feat: add database migration system with all 10 table schemas"
```

---

## Task 3: Auth — User Registration

**Files:**
- Create: `backend/tests/auth.test.js`
- Modify: `backend/src/controllers/AuthController.js`
- Create: `backend/src/models/UserModel.js`
- Modify: `backend/src/routes/authRoutes.js`
- Modify: `backend/src/index.js` (uncomment auth routes)

**Step 1: Write failing test for registration**

Create `backend/tests/auth.test.js`:
```js
import request from 'supertest';
import app from '../src/index.js';
import db from '../src/config/database.js';

beforeEach(async () => {
  await db.none('DELETE FROM users');
});

afterAll(async () => {
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
```

**Step 2: Install test dependencies**

Run:
```bash
cd backend && npm install --save-dev supertest
```

**Step 3: Run test to verify it fails**

Run:
```bash
cd backend && npm test -- --testPathPattern=auth
```

Expected: FAIL — registration not implemented.

**Step 4: Create UserModel**

Create `backend/src/models/UserModel.js`:
```js
import db from '../config/database.js';

export class UserModel {
  static async create({ name, email, password, role = 'tenant', phone = null }) {
    return db.one(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, phone, created_at`,
      [name, email, password, role, phone]
    );
  }

  static async findByEmail(email) {
    return db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
  }

  static async findById(id) {
    return db.oneOrNone(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
      [id]
    );
  }
}
```

**Step 5: Implement AuthController.register**

Replace `backend/src/controllers/AuthController.js`:
```js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { UserModel } from '../models/UserModel.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        phone,
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.status(201).json({ token, user });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      // TODO: Implement in Task 4
      res.status(501).json({ message: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      // TODO: Implement in Task 4
      res.status(501).json({ message: 'Not implemented' });
    } catch (error) {
      next(error);
    }
  }
}
```

**Step 6: Wire up auth routes**

Replace `backend/src/routes/authRoutes.js`:
```js
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

export default router;
```

**Step 7: Uncomment auth routes in index.js**

In `backend/src/index.js`, replace the TODO comment block:
```js
import authRoutes from './routes/authRoutes.js';
```
And uncomment:
```js
app.use('/api/auth', authRoutes);
```

**Step 8: Run tests**

Run:
```bash
cd backend && npm test -- --testPathPattern=auth
```

Expected: All 3 tests PASS.

**Step 9: Commit**

```bash
git add backend/src/models/UserModel.js backend/src/controllers/AuthController.js backend/src/routes/authRoutes.js backend/src/index.js backend/tests/auth.test.js backend/package.json backend/package-lock.json
git commit -m "feat: implement user registration with JWT token"
```

---

## Task 4: Auth — Login and JWT Middleware

**Files:**
- Modify: `backend/tests/auth.test.js`
- Modify: `backend/src/controllers/AuthController.js`
- Modify: `backend/src/middleware/index.js`

**Step 1: Write failing tests for login**

Append to `backend/tests/auth.test.js`:
```js
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

describe('Auth middleware', () => {
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
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd backend && npm test -- --testPathPattern=auth
```

Expected: New tests FAIL.

**Step 3: Implement login**

In `backend/src/controllers/AuthController.js`, replace the login method:
```js
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({ token, user: userWithoutPassword });
    } catch (error) {
      next(error);
    }
  }
```

Add a `me` method to AuthController:
```js
  static async me(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
```

**Step 4: Implement JWT middleware**

Replace `backend/src/middleware/index.js`:
```js
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
}
```

**Step 5: Add /me route**

In `backend/src/routes/authRoutes.js`:
```js
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
```

**Step 6: Run tests**

Run:
```bash
cd backend && npm test -- --testPathPattern=auth
```

Expected: All tests PASS.

**Step 7: Commit**

```bash
git add backend/src/controllers/AuthController.js backend/src/middleware/index.js backend/src/routes/authRoutes.js backend/tests/auth.test.js
git commit -m "feat: implement login, JWT middleware, and /me endpoint"
```

---

## Task 5: Admin User Seeding

**Files:**
- Create: `backend/src/db/seed.js`
- Modify: `backend/package.json`

**Step 1: Create seed script for Bill's admin account**

Create `backend/src/db/seed.js`:
```js
import bcrypt from 'bcryptjs';
import db from '../config/database.js';

async function seed() {
  try {
    const existing = await db.oneOrNone(
      "SELECT id FROM users WHERE email = 'bill@easyrental.ca'"
    );

    if (existing) {
      console.log('Admin user already exists, skipping seed.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await db.none(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)`,
      ['Bill', 'bill@easyrental.ca', hashedPassword, 'admin', '555-0001']
    );

    console.log('Admin user created: bill@easyrental.ca / admin123');
    console.log('IMPORTANT: Change this password in production!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
```

**Step 2: Add seed script to package.json**

In `backend/package.json`, add to scripts:
```json
"seed": "node src/db/seed.js"
```

**Step 3: Run seed**

Run:
```bash
cd backend && npm run seed
```

Expected: "Admin user created: bill@easyrental.ca / admin123"

**Step 4: Verify login works with seeded admin**

Run:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bill@easyrental.ca","password":"admin123"}'
```

Expected: 200 with token and user object showing role: "admin".

**Step 5: Commit**

```bash
git add backend/src/db/seed.js backend/package.json
git commit -m "feat: add admin user seed script for Bill"
```

---

# Phase 2: Properties Backend (Outline)

### Task 6: Properties CRUD Controller + Routes
- Create `backend/src/models/PropertyModel.js`
- Create `backend/src/controllers/PropertyController.js`
- Create `backend/src/routes/propertyRoutes.js`
- Tests: CRUD operations, admin-only write access, public read access
- Wire routes in index.js

### Task 7: Property Filtering + Pagination
- Add query params: status, minPrice, maxPrice, bedrooms, city
- Add pagination: page, limit, total count
- Tests: filter combinations, pagination edges

### Task 8: Media Upload Service
- Create `backend/src/services/uploadService.js`
- Create `backend/src/controllers/MediaController.js`
- Install multer for file handling
- Store locally in `backend/uploads/` (S3 later)
- Tests: upload photo, upload video, delete media, sort order

### Task 9: Documents Upload
- Create `backend/src/controllers/DocumentController.js`
- Create `backend/src/routes/documentRoutes.js`
- PDF/doc upload for forms and agreements
- Tests: upload, list, download, delete

---

# Phase 3: Public Site (Outline)

### Task 10: Public Site Layout + Home Page
- App shell with navigation (Home, Listings, Contact)
- Hero section with property search
- Featured listings grid
- Clean, open design per mission

### Task 11: Listings Page
- Property grid with ListingCard components
- Filter sidebar (price, bedrooms, location)
- Pagination
- Loading states, empty states

### Task 12: Listing Detail Page
- Photo/video gallery
- Full property info display
- Amenities list
- Documents/forms access
- CTA buttons: Inquire, Request Viewing, Apply

### Task 13: Inquiry Form
- Question or viewing request
- Name, email, phone, message
- Success confirmation
- Creates inquiry in backend

### Task 14: Application Flow
- Application form (name, contact, desired move-in)
- Access to Bill's forms/agreements (download links)
- Submit application to backend
- Status tracking page

### Task 15: Public Auth (Optional Account)
- Register/login for renters
- Account enables: messaging, application tracking
- Can browse and inquire without account

---

# Phase 4: Admin Dashboard (Outline)

### Task 16: Dashboard Layout + Shell
- Sidebar navigation (Dashboard, Properties, Leads, Roster, Messages, Settings)
- Top bar with notifications count
- Responsive layout

### Task 17: Dashboard Home — "Clarity at a Glance"
- Summary cards: new inquiries, pending applications, viewings today, vacant properties
- Recent activity feed
- AI auto-responses sent today
- Quick actions

### Task 18: Property Management
- Property list with status badges
- Add/edit property form with all fields
- Media upload interface (drag and drop photos/videos)
- Document attachment
- Property detail view showing linked inquiries, applications, tenant

### Task 19: Leads Pipeline
- View toggle: kanban board / list view
- Stages: New → Responded → Viewing Scheduled → Application → Leased
- Drag to change status (kanban) or dropdown (list)
- Click into lead for full thread

### Task 20: Tenant Roster
- Active tenants list with property, lease dates, contact
- Tenant detail: communication history, lease info, notes
- Add tenant (from approved application or manual)
- Status management: active, notice given, moved out

### Task 21: Settings Page
- Bill's profile
- AI preferences (which question types to auto-respond)
- Notification preferences
- Password change

---

# Phase 5: Messaging (Outline)

### Task 22: Messaging Backend
- Threads + messages CRUD
- Thread creation from inquiry or application
- Unread count endpoint
- Mark as read

### Task 23: Chat UI — Public Site
- Message thread view for renters
- Send message, receive replies
- Notification badge

### Task 24: Chat UI — Admin Dashboard
- All threads inbox
- Thread detail with message history
- AI draft indicator (editable before send)
- Quick reply

### Task 25: Email Bridge
- Email notification on new message (both directions)
- Email template: subject, preview, link to in-app thread
- Integration with email provider (SendGrid/Resend)

---

# Phase 6: AI Layer (Outline)

### Task 26: AI Service Setup
- Create `backend/src/services/aiService.js`
- Provider integration (OpenAI/Anthropic)
- Prompt template for property Q&A

### Task 27: Auto-Respond
- Match incoming inquiry against property data
- Common questions: availability, pets, deposit, lease terms
- Send auto-response if confidence is high
- Log to ai_responses table

### Task 28: Draft Suggestions
- For complex inquiries, generate draft reply
- Show draft to Bill in message thread
- Bill can edit, approve, or discard
- Log drafts to ai_responses table

### Task 29: AI Settings + Audit
- Settings page: toggle auto-respond categories
- Audit log view: all AI responses with sent/draft status
- Override: Bill can disable auto-respond per property

---

**End of plan. Phase 1 is fully detailed. Phases 2-6 will be detailed when we reach them.**
