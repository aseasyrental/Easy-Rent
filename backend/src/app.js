import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import propertyMediaRoutes from './routes/propertyMediaRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import { errorHandler } from './middleware/index.js';

dotenv.config();

const app = express();

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

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
