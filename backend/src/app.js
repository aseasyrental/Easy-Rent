import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import propertyMediaRoutes from './routes/propertyMediaRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import documentTemplateRoutes from './routes/documentTemplateRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import { errorHandler } from './middleware/index.js';

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
