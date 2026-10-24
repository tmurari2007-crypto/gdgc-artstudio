import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import paintingRoutes from './routes/paintingRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import wallBookingRoutes from './routes/wallBookingRoutes.js';
import potteryRoutes from './routes/potteryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Allowed origins for CORS (Credentials enabled, never wildcard)
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body and Cookie parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'art_studio_cookie_secret_key_9988'));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Art Studio API',
    timestamp: new Date().toISOString(),
  });
});

// RESTful Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/paintings', paintingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', wallBookingRoutes);
app.use('/api/pottery', potteryRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all 404 for unknown endpoints
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
