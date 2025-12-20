import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { verifyToken } from './middleware/auth.middleware.js';
import messageRoutes from './routes/message.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import emailRoutes from './routes/email.routes.js'; // ADD THIS
import { app, server, io } from './utils/socket.js';
import express from 'express';
import multer from 'multer';
import internalNotificationRoutes from './routes/internalNotifications.routes.js';

const upload = multer({ dest: 'uploads/' });

const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Content-Length', 'Internal-Service-Token'] // ADD Internal-Service-Token
};

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/messages', verifyToken, messageRoutes);
app.use('/api/notifications', verifyToken, notificationRoutes);
app.use('/api/email', emailRoutes); // ADD THIS LINE - Note: No verifyToken needed, uses internal token
app.use('/api/internal/notifications', internalNotificationRoutes);

// Global health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'communication-service',
    timestamp: new Date().toISOString(),
    endpoints: {
      messages: '/api/messages',
      notifications: '/api/notifications',
      email: '/api/email',
      internal_notifications: '/api/internal/notifications'
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Communication service running on port ${PORT}`);
});