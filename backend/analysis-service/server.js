import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import analyticsRoutes from './routes/analytics.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup WebSocket for Real-Time Updates
const io = new Server(server, {
  cors: { 
    origin: process.env.CLIENT_URL || 'http://localhost:5173', 
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Store active dashboard connections
const dashboardConnections = new Set();

io.on('connection', (socket) => {
  console.log('Analysis Service: Client connected');
  dashboardConnections.add(socket.id);
  
  // Listen for refresh requests
  socket.on('refresh-dashboard', () => {
    socket.emit('dashboard-updated', { timestamp: new Date().toISOString() });
  });
  
  socket.on('disconnect', () => {
    console.log('Analysis Service: Client disconnected');
    dashboardConnections.delete(socket.id);
  });
});

// Security middleware - disable CSP for development if needed
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, enable in production
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
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

// Register Routes
app.use('/api/analytics', analyticsRoutes);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'analysis-service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connections: dashboardConnections.size
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Analysis Service is working!',
    version: '1.0.0'
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5004;
server.listen(PORT, () => {
  console.log(`📊 Analysis Service running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`📈 Ready to aggregate data from other services...`);
  console.log(`🚀 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🩺 Health endpoint: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Analysis service closed.');
    process.exit(0);
  });
});