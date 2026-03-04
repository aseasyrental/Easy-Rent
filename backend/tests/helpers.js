import db from '../src/config/database.js';

/**
 * Safety guard — refuses to run tests against any remote database.
 * Blocks Supabase pooler URLs, any non-localhost host, and production env.
 */
export function guardAgainstProduction() {
  const dbUrl = process.env.DATABASE_URL || '';
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run tests: NODE_ENV is production');
  }
  if (dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
    throw new Error(
      'Refusing to run tests: DATABASE_URL points to a remote database. ' +
      'Tests must run against localhost only. Current URL: ' +
      dbUrl.replace(/:[^:@]+@/, ':***@')
    );
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
