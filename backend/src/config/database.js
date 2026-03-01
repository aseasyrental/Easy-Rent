// Database connection utility
// This file will contain functions to connect to the PostgreSQL database

import pgPromise from 'pg-promise';
import config from './index.js';

const pgp = pgPromise();

const db = pgp({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database
});

export default db;
