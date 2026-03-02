import bcrypt from 'bcryptjs';
import db from '../config/database.js';

async function seed() {
  try {
    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!seedPassword) {
      console.error('FATAL: ADMIN_SEED_PASSWORD environment variable must be set.');
      console.error('Usage: ADMIN_SEED_PASSWORD=yourpassword node src/db/seed.js');
      process.exit(1);
    }

    const existing = await db.oneOrNone(
      "SELECT id FROM users WHERE email = 'bill@easyrental.ca'"
    );

    if (existing) {
      console.log('Admin user already exists, skipping seed.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(seedPassword, 10);

    await db.none(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)`,
      ['Bill', 'bill@easyrental.ca', hashedPassword, 'admin', null]
    );

    console.log('Admin user created: bill@easyrental.ca');
    console.log('Password was set from ADMIN_SEED_PASSWORD env var.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
