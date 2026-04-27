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
    // Migration names are stored in the DB without the .sql extension
    // (historical convention). Strip extension for compare + insert.
    for (const file of files) {
      const name = file.replace(/\.sql$/, '');
      if (applied.includes(name)) {
        console.log(`Skipping (already applied): ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Applying: ${file}`);

      await db.tx(async t => {
        await t.none(sql);
        await t.none('INSERT INTO migrations (name) VALUES ($1)', [name]);
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
