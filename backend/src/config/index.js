import dotenv from 'dotenv';

dotenv.config();

const config = {
  database: {
    connectionString: process.env.DATABASE_URL || null,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'easyrent',
    password: process.env.DB_PASSWORD || 'easyrent_password',
    database: process.env.DB_NAME || 'easyrent_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    expiresIn: process.env.JWT_EXPIRE || '7d'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development'
};

export default config;
