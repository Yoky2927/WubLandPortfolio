// communication-service/server.js - ENHANCED VERSION
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet'; // Add for security
import rateLimit from 'express-rate-limit'; // Add for rate limiting
import compression from 'compression'; // Add for performance
import multer from 'multer';
import { verifyToken } from './middleware/auth.middleware.js';
import { verifyInternalToken } from './middleware/internalAuth.middleware.js'; // Add this
import messageRoutes from './routes/message.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import emailRoutes from './routes/email.routes.js';
import internalNotificationRoutes from './routes/internalNotifications.routes.js';
import { app, server, io } from './utils/socket.js';
import { ApiDocs, createHealthCheck } from '../shared/api-docs.js';
import morgan from 'morgan'; // Add for logging
import fs from 'fs';
import path from 'path';

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only certain file types
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.CLIENT_URL || 'http://localhost:5173',
            'http://localhost:5000', // User service
            'http://localhost:5002', // Property service
            'http://localhost:5003', // Todo service
            'http://localhost:5004', // Analysis service
            'http://localhost:5005', // Support service
            'http://localhost:5006', // Transaction service
            'http://localhost:5008', // Registry service
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Content-Length',
        'Accept',
        'X-CSRF-Token',
        'Internal-Service-Token',
        'X-Confirm'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 attempts per hour for auth endpoints
    message: 'Too many authentication attempts, please try again later.',
});

// Middleware setup
app.use(morgan('combined')); // HTTP request logger
app.use(helmet({
    contentSecurityPolicy: false, // Disable for API unless you need it
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers
app.use(compression()); // Compress responses
app.use(cors(corsOptions)); // CORS
app.use(express.json({ limit: '10mb' })); // JSON body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL-encoded body parser
app.use(cookieParser()); // Cookie parser

// Static files (for email templates or uploaded files)
app.use('/uploads', express.static(uploadDir));

// Define communication service endpoints for documentation
const communicationEndpoints = [
    ApiDocs.createRoute('GET', '/api/messages/conversation/:conversationId', 'Get messages by conversation', true),
    ApiDocs.createRoute('GET', '/api/messages/user/:userId', 'Get user conversations', true),
    ApiDocs.createRoute('POST', '/api/messages', 'Send message', true),
    ApiDocs.createRoute('GET', '/api/notifications', 'Get user notifications', true),
    ApiDocs.createRoute('GET', '/api/notifications/unread-count', 'Get unread notification count', true),
    ApiDocs.createRoute('PUT', '/api/notifications/:notificationId/read', 'Mark notification as read', true),
    ApiDocs.createRoute('PUT', '/api/notifications/mark-all-read', 'Mark all notifications as read', true),
    ApiDocs.createRoute('POST', '/api/email/send-verification', 'Send verification email', false),
    ApiDocs.createRoute('POST', '/api/email/send-password-change', 'Send password change email', false),
    ApiDocs.createRoute('POST', '/api/email/send-security-alert', 'Send security alert email', false),
    ApiDocs.createRoute('POST', '/api/internal/notifications/create', 'Create notification (internal)', true),
    ApiDocs.createRoute('POST', '/api/internal/notifications/send-by-role', 'Send notification by role', true),
    ApiDocs.createRoute('POST', '/api/internal/notifications/send-to-admins', 'Send notification to admins', true),
    ApiDocs.createRoute('POST', '/api/internal/notifications/send-to-brokers', 'Send notification to brokers', true),
    ApiDocs.createRoute('POST', '/api/internal/notifications/security-alert', 'Send security alert', true),
];

// API Documentation endpoint
app.get('/api-docs', (req, res) => {
    res.json(ApiDocs.generateDocs('communication', communicationEndpoints));
});

// Health endpoint using createHealthCheck
app.get('/health', createHealthCheck('communication'));

// Enhanced health check with detailed status
app.get('/health/detailed', async (req, res) => {
    const healthStatus = {
        service: 'communication-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'connected', // You could check DB connection here
        redis: 'connected', // If using Redis
        websocket: io.engine.clientsCount ? 'connected' : 'waiting',
        environment: process.env.NODE_ENV || 'development',
        endpoints: communicationEndpoints.map(e => e.path)
    };
    
    res.json(healthStatus);
});

// Public test endpoint
app.get('/test', (req, res) => {
    res.json({
        message: 'Communication Service is working!',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            docs: '/api-docs',
            health: '/health',
            detailed_health: '/health/detailed',
            messages: '/api/messages',
            notifications: '/api/notifications',
            email: '/api/email',
            internal_notifications: '/api/internal/notifications'
        },
        environment: process.env.NODE_ENV || 'development'
    });
});

// Upload test endpoint
app.post('/api/test-upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }
    
    res.json({
        success: true,
        message: 'File uploaded successfully',
        file: {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            path: req.file.path
        }
    });
});

// WebSocket connection test endpoint
app.get('/api/ws-test', (req, res) => {
    const clientsCount = io.engine.clientsCount;
    res.json({
        success: true,
        websocket: {
            connected: true,
            clients: clientsCount,
            protocol: 'socket.io',
            version: '4.x'
        }
    });
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Routes - PUBLIC
app.use('/api/email', emailRoutes);

// Routes - AUTHENTICATED
app.use('/api/messages', verifyToken, messageRoutes);
app.use('/api/notifications', verifyToken, notificationRoutes);

// Routes - INTERNAL SERVICES (requires internal token)
app.use('/api/internal/notifications', verifyInternalToken, internalNotificationRoutes);

// Add internal notification creation endpoint
app.post('/api/internal/notifications/create', verifyInternalToken, async (req, res) => {
    try {
        const NotificationController = await import('./controllers/notification.controller.js').then(mod => mod.default);
        
        // This is a simplified version - you'd need to adapt based on your controller
        const notification = {
            userId: req.body.userId,
            title: req.body.title,
            message: req.body.message,
            type: req.body.type || 'info',
            actionUrl: req.body.actionUrl,
            priority: req.body.priority || 'medium'
        };
        
        // Call your notification service
        const notificationService = await import('./services/notificationService.js').then(mod => mod.default);
        const result = await notificationService.createNotification(notification);
        
        res.status(201).json({
            success: true,
            message: 'Notification created',
            notification: result
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification'
        });
    }
});

// Add a route for external services to send notifications
app.post('/api/external/notifications', verifyInternalToken, async (req, res) => {
    try {
        const { userId, title, message, type = 'info', actionUrl, metadata = {} } = req.body;
        
        // Validate required fields
        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, title, message'
            });
        }
        
        // Import notification model
        const NotificationModel = await import('./models/notification.model.js').then(mod => mod.default);
        
        // Create notification
        const notificationId = await NotificationModel.createNotification({
            userId,
            title,
            message,
            type,
            actionUrl,
            relatedEntityType: metadata.entityType,
            relatedEntityId: metadata.entityId,
            priority: metadata.priority || 'medium',
            deliveryMethods: ['in_app', 'email'] // Default to both
        });
        
        // Send real-time notification
        const { emitNotification } = await import('./utils/socket.js');
        if (emitNotification) {
            const notification = await NotificationModel.getNotificationById(notificationId);
            emitNotification(userId, notification);
        }
        
        res.status(201).json({
            success: true,
            message: 'Notification sent successfully',
            notificationId,
            userId
        });
        
    } catch (error) {
        console.error('Error creating external notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 404 handler
app.use((req, res) => {
    console.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            '/health',
            '/health/detailed',
            '/test',
            '/api-docs',
            '/api/messages',
            '/api/notifications',
            '/api/email',
            '/api/internal/notifications',
            '/api/external/notifications',
            '/api/ws-test'
        ]
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('🔥 Communication service error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    
    // Multer file upload errors
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
            code: err.code
        });
    }
    
    // JWT authentication errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Authentication token expired'
        });
    }
    
    // Rate limit errors
    if (err.name === 'RateLimitError') {
        return res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later'
        });
    }
    
    // Default error response
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Communication service shut down');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('Communication service shut down');
        process.exit(0);
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`============================================`);
    console.log(`🚀 Communication service running on port ${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🩺 Health: http://localhost:${PORT}/health`);
    console.log(`🧪 Test: http://localhost:${PORT}/test`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 CORS: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log(`============================================`);
    
    // Log startup with important info
    console.log('✅ Service initialized with:');
    console.log(`   • Rate limiting: ${apiLimiter.max} requests per ${apiLimiter.windowMs / 60000} minutes`);
    console.log(`   • File uploads: ${uploadDir}`);
    console.log(`   • Max file size: 10MB`);
    console.log(`   • Security headers: enabled`);
    console.log(`   • Compression: enabled`);
    console.log(`   • Logging: enabled`);
});