import pgPromise from 'pg-promise';
import config from './index.js';

const pgp = pgPromise();

let db = null;

function getDb() {
  if (!db) {
    const connectionConfig = config.database.connectionString
      ? { connectionString: config.database.connectionString, ssl: { rejectUnauthorized: false } }
      : {
          host: config.database.host,
          port: config.database.port,
          user: config.database.user,
          password: config.database.password,
          database: config.database.database,
        };
    db = pgp(connectionConfig);
  }
  return db;
}

export default new Proxy({}, {
  get(_, prop) {
    const instance = getDb();
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
