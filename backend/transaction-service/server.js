const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { ApiDocs } = require('../shared/api-docs.js');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Import routes
const transactionRoutes = require('./routes/transaction.routes');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());

const transactionEndpoints = [
  ApiDocs.createRoute('POST', '/api/transactions/create', 'Create transaction', true),
  ApiDocs.createRoute('GET', '/api/transactions/:id', 'Get transaction', true),
  ApiDocs.createRoute('POST', '/api/transactions/initiate-payment', 'Initiate payment', true),
  ApiDocs.createRoute('POST', '/api/transactions/verify-payment', 'Verify payment'),
  ApiDocs.createRoute('POST', '/api/transactions/debug/webhook', 'Debug webhook'),
];

app.get('/api-docs', (req, res) => {
  res.json(ApiDocs.generateDocs('transaction', transactionEndpoints));
});

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-internal-token']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Database connection test
const db = require('./config/database');

// Health endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const [dbResult] = await db.query('SELECT 1 as connected');

    res.json({
      status: 'ok',
      service: 'transaction-service',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbResult[0].connected === 1 ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'transaction-service',
      error: error.message
    });
  }
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Transaction Service is working!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    docs: 'http://localhost:5003/api-docs',
    health: 'http://localhost:5003/health'
  });
});

app.post('/api/transactions/debug/webhook', (req, res) => {
  console.log('=== DEBUG WEBHOOK ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Signature header:', req.headers['x-chapa-signature']);
  console.log('====================');

  res.json({
    received: true,
    headers: req.headers,
    body: req.body
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Transaction Service is working!',
    version: '1.0.0',
    features: ['Chapa Payment Integration', 'Offer Management', 'Contract Handling', 'Invoice System']
  });
});

// Register API Routes
app.use('/api/transactions', transactionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});



const PORT = process.env.PORT || 5006;
server.listen(PORT, () => {
  console.log(`💰 Transaction Service running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`💳 Chapa Mode: ${process.env.CHAPA_SECRET_KEY?.includes('TEST') ? 'Test' : 'Live'}`);
  console.log(`🚀 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🩺 Health endpoint: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Transaction service closed.');
    process.exit(0);
  });
});

module.exports = app;