import db from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupsDir = path.join(__dirname, '..', '..', 'backups');

// Insert order: parents first, children last (respects FK constraints)
const TABLES = [
  'users',
  'properties',
  'property_media',
  'documents',
  'document_templates',
  'inquiries',
  'applications',
  'tenants',
  'threads',
  'messages',
  'ai_responses',
];

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function backup() {
  try {
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupsDir, filename);

    const lines = [
      `-- Easy Rental database backup`,
      `-- Created: ${new Date().toISOString()}`,
      `-- Restore with: node src/db/restore.js backups/${filename}`,
      '',
    ];

    let totalRows = 0;

    for (const table of TABLES) {
      const rows = await db.any(`SELECT * FROM ${table}`);
      lines.push(`-- ${table}: ${rows.length} rows`);

      if (rows.length === 0) continue;

      const columns = Object.keys(rows[0]);
      for (const row of rows) {
        const values = columns.map(col => escapeValue(row[col]));
        lines.push(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`
        );
      }

      // Reset sequence to max id so future inserts don't collide
      lines.push(
        `SELECT setval('${table}_id_seq', (SELECT COALESCE(MAX(id), 0) FROM ${table}), true);`
      );
      lines.push('');
      totalRows += rows.length;
    }

    fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
    console.log(`Backup complete: ${filename} (${totalRows} rows across ${TABLES.length} tables)`);
    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error.message);
    process.exit(1);
  }
}

backup();
