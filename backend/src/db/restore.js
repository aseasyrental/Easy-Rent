import db from '../config/database.js';
import fs from 'fs';
import path from 'path';

const file = process.argv[2];

if (!file) {
  console.error('Usage: node src/db/restore.js <backup-file>');
  console.error('Example: node src/db/restore.js backups/backup-2026-03-04T12-00-00.sql');
  process.exit(1);
}

const filepath = path.resolve(file);

if (!fs.existsSync(filepath)) {
  console.error(`File not found: ${filepath}`);
  process.exit(1);
}

// Delete order: children first, parents last (respects FK constraints)
const TABLES = [
  'ai_responses',
  'messages',
  'threads',
  'tenants',
  'applications',
  'inquiries',
  'documents',
  'document_templates',
  'property_media',
  'properties',
  'users',
];

async function restore() {
  try {
    const sql = fs.readFileSync(filepath, 'utf8');
    const statements = sql
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('--'))
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);

    console.log(`Restoring from: ${path.basename(filepath)}`);
    console.log(`Found ${statements.length} SQL statements`);

    await db.tx(async t => {
      // Clear existing data first
      for (const table of TABLES) {
        await t.none(`DELETE FROM ${table}`);
      }
      console.log('Cleared existing data');

      // Run all inserts + sequence resets
      for (const stmt of statements) {
        await t.none(stmt + ';');
      }
    });

    console.log('Restore complete.');
    process.exit(0);
  } catch (error) {
    console.error('Restore failed:', error.message);
    process.exit(1);
  }
}

restore();
