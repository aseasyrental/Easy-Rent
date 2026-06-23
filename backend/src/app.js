import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import propertyMediaRoutes from './routes/propertyMediaRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import documentTemplateRoutes from './routes/documentTemplateRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import { errorHandler } from './middleware/index.js';

// Fail closed if the JWT signing secret is missing or left at the public placeholder.
// In production we refuse to start — a forgeable token secret is worse than downtime.
// This runs for BOTH entry points: local src/index.js AND the Vercel serverless
// api/index.js, which imports this module directly. Elsewhere we only warn so local
// and test runs still work.
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'your_jwt_secret_key_here') {
  const msg = 'JWT_SECRET is missing or set to the insecure default placeholder.';
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${msg} Refusing to start — set a strong JWT_SECRET.`);
  }
  console.warn(`[easy-rental] WARNING: ${msg} Set JWT_SECRET before deploying to production.`);
}

const app = express();

// Behind Vercel's proxy: trust the first hop so req.ip is the real client IP.
// Required for per-IP rate limiting (and for express-rate-limit to not throw on
// the X-Forwarded-For header). A number (not `true`) keeps it from being permissive.
app.set('trust proxy', 1);

// CORS — support comma-separated origins for multi-frontend dev
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, server-to-server, supertest)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/properties/:id/images', propertyMediaRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/templates', documentTemplateRoutes);
app.use('/api/properties/:id/documents', documentRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
