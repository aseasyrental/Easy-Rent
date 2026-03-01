import pgPromise from 'pg-promise';
import config from './index.js';

const pgp = pgPromise();

const connectionConfig = config.database.connectionString
  ? { connectionString: config.database.connectionString, ssl: { rejectUnauthorized: false } }
  : {
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
    };

const db = pgp(connectionConfig);

export default db;
