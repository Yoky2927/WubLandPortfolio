// communication-service/server.js - FIXED VERSION
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { verifyToken } from './middleware/auth.middleware.js';
import messageRoutes from './routes/message.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import emailRoutes from './routes/email.routes.js';
import { app, server, io } from './utils/socket.js';
import express from 'express';
import multer from 'multer';
import internalNotificationRoutes from './routes/internalNotifications.routes.js';
import { ApiDocs, createHealthCheck } from '../shared/api-docs.js';

const upload = multer({ dest: 'uploads/' });

const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Content-Length', 'Internal-Service-Token']
};

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());

// Define communication service endpoints for documentation
const communicationEndpoints = [
  ApiDocs.createRoute('GET', '/api/messages/:conversationId', 'Get messages', true),
  ApiDocs.createRoute('POST', '/api/messages', 'Send message', true),
  ApiDocs.createRoute('GET', '/api/notifications', 'Get notifications', true),
  ApiDocs.createRoute('POST', '/api/email/send', 'Send email', false),
  ApiDocs.createRoute('GET', '/api/internal/notifications', 'Get internal notifications'),
  // Add more routes from your routes files
];

// API Documentation endpoint
app.get('/api-docs', (req, res) => {
  res.json(ApiDocs.generateDocs('communication', communicationEndpoints));
});

// Health endpoint using createHealthCheck
app.get('/health', createHealthCheck('communication'));

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Communication Service is working!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      docs: '/api-docs',
      health: '/health',
      messages: '/api/messages',
      notifications: '/api/notifications',
      email: '/api/email',
      internal_notifications: '/api/internal/notifications'
    }
  });
});

// Routes
app.use('/api/messages', verifyToken, messageRoutes);
app.use('/api/notifications', verifyToken, notificationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/internal/notifications', internalNotificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: [
      '/health',
      '/test',
      '/api-docs',
      '/api/messages',
      '/api/notifications',
      '/api/email',
      '/api/internal/notifications'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Communication service error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Communication service running on port ${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🩺 Health: http://localhost:${PORT}/health`);
    console.log(`🧪 Test: http://localhost:${PORT}/test`);
});