import db from '../src/config/database.js';

/**
 * Production safety guard — call at the top of every test file.
 * Throws immediately if NODE_ENV is 'production' to prevent
 * DELETE FROM statements from wiping real data.
 */
export function guardAgainstProduction() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run tests against production database');
  }
}

/**
 * Ordered table list respecting foreign-key constraints.
 * Children first, parents last.
 */
const TABLES = [
  'messages',
  'threads',
  'tenants',
  'applications',
  'inquiries',
  'property_media',
  'documents',
  'ai_responses',
  'properties',
  'users',
];

/**
 * Deletes all rows from every table in FK-safe order.
 * Use in beforeEach / afterAll so the list stays consistent.
 */
export async function cleanAllTables() {
  for (const table of TABLES) {
    await db.none(`DELETE FROM ${table}`);
  }
}

/**
 * Ends the pg-promise connection pool only if it hasn't already
 * been ended by another test file running in the same process.
 */
export async function safePoolEnd() {
  if (!db.$pool.ended) {
    await db.$pool.end();
  }
}
