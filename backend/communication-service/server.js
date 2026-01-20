// communication-service/server.js - CORRECTED VERSION
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import multer from 'multer';
import { verifyToken } from './middleware/auth.middleware.js';
import { verifyInternalToken } from './middleware/internalAuth.middleware.js';
import messageRoutes from './routes/message.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import emailRoutes from './routes/email.routes.js';
import internalNotificationRoutes from './routes/internalNotifications.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import todoRoutes from './routes/todo.routes.js'; // Make sure this import exists
import { app, server, io } from './utils/socket.js';
import { ApiDocs, createHealthCheck } from '../shared/api-docs.js';
import reminderService from './services/reminderService.js';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import announcementRoutes from './routes/announcement.routes.js';

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
            'http://localhost:5000',
            'http://localhost:5001',
            'http://localhost:5002',
            'http://localhost:5003',
            'http://localhost:5004',
            'http://localhost:5005',
            'http://localhost:5006',
            'http://localhost:5008',
        ];

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
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts, please try again later.',
});

// Middleware setup
app.use(morgan('combined'));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadDir));

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// ========== MOUNT ALL ROUTES HERE ==========
// Routes - PUBLIC
app.use('/api/email', emailRoutes);

// Routes - AUTHENTICATED
app.use('/api/messages', verifyToken, messageRoutes);
app.use('/api/notifications', verifyToken, notificationRoutes);
app.use('/api/appointments', verifyToken, appointmentRoutes);
app.use('/api/todos', verifyToken, todoRoutes); // Mount todo routes here

// Routes - INTERNAL SERVICES
app.use('/api/internal/notifications', verifyInternalToken, internalNotificationRoutes);

app.use('/api/announcements', verifyToken, announcementRoutes);

// Define communication service endpoints for documentation
const communicationEndpoints = [
    // Messages
    ApiDocs.createRoute('GET', '/api/messages/conversation/:conversationId', 'Get messages by conversation', true),
    ApiDocs.createRoute('GET', '/api/messages/user/:userId', 'Get user conversations', true),
    ApiDocs.createRoute('POST', '/api/messages', 'Send message', true),

    // Notifications
    ApiDocs.createRoute('GET', '/api/notifications', 'Get user notifications', true),
    ApiDocs.createRoute('GET', '/api/notifications/unread-count', 'Get unread notification count', true),
    ApiDocs.createRoute('PUT', '/api/notifications/:notificationId/read', 'Mark notification as read', true),
    ApiDocs.createRoute('PUT', '/api/notifications/mark-all-read', 'Mark all notifications as read', true),

    // Email
    ApiDocs.createRoute('POST', '/api/email/send-verification', 'Send verification email', false),
    ApiDocs.createRoute('POST', '/api/email/send-password-change', 'Send password change email', false),
    ApiDocs.createRoute('POST', '/api/email/send-security-alert', 'Send security alert email', false),

    // Appointments
    ApiDocs.createRoute('GET', '/api/appointments', 'Get user appointments', true),
    ApiDocs.createRoute('GET', '/api/appointments/:id', 'Get appointment details', true),
    ApiDocs.createRoute('POST', '/api/appointments', 'Create appointment', true),
    ApiDocs.createRoute('PUT', '/api/appointments/:id', 'Update appointment', true),
    ApiDocs.createRoute('DELETE', '/api/appointments/:id', 'Cancel appointment', true),
    ApiDocs.createRoute('GET', '/api/appointments/property/:propertyId', 'Get appointments for property', true),
    ApiDocs.createRoute('GET', '/api/appointments/broker/:brokerId', 'Get appointments for broker', true),
    ApiDocs.createRoute('PUT', '/api/appointments/:id/status', 'Update appointment status', true),
    ApiDocs.createRoute('POST', '/api/appointments/:id/attendees', 'Add attendee to appointment', true),
    ApiDocs.createRoute('PUT', '/api/appointments/:appointmentId/attendees/:userId', 'Update attendee status', true),

    // Todos
    ApiDocs.createRoute('GET', '/api/todos', 'Get user todos', true),
    ApiDocs.createRoute('GET', '/api/todos/upcoming', 'Get upcoming todos', true),
    ApiDocs.createRoute('GET', '/api/todos/search', 'Search todos', true),
    ApiDocs.createRoute('GET', '/api/todos/stats', 'Get todo statistics', true),
    ApiDocs.createRoute('GET', '/api/todos/team-members', 'Get team members for assignment', true),
    ApiDocs.createRoute('GET', '/api/todos/health', 'Todo service health check', true),
    ApiDocs.createRoute('GET', '/api/todos/:id', 'Get todo details', true),
    ApiDocs.createRoute('POST', '/api/todos', 'Create todo', true),
    ApiDocs.createRoute('PUT', '/api/todos/:id', 'Update todo', true),
    ApiDocs.createRoute('DELETE', '/api/todos/:id', 'Delete todo', true),
    ApiDocs.createRoute('PUT', '/api/todos/:id/status', 'Update todo status', true),
    ApiDocs.createRoute('POST', '/api/todos/:id/comments', 'Add comment to todo', true),
    ApiDocs.createRoute('GET', '/api/todos/:id/comments', 'Get todo comments', true),

    // Internal endpoints
    ApiDocs.createRoute('POST', '/api/internal/notifications/create', 'Create notification (internal)', true),
    ApiDocs.createRoute('POST', '/api/internal/notifications/send-by-role', 'Send notification by role', true),
    ApiDocs.createRoute('POST', '/api/internal/notifications/send-to-admins', 'Send notification to admins', true),
    ApiDocs.createRoute('POST', '/api/internal/notifications/send-to-brokers', 'Send notification to brokers', true),
    ApiDocs.createRoute('POST', '/api/internal/notifications/security-alert', 'Send security alert', true),

    // Announcements (Super Admin only)
    ApiDocs.createRoute('POST', '/api/announcements', 'Create announcement', true),
    ApiDocs.createRoute('GET', '/api/announcements', 'Get all announcements', true),
    ApiDocs.createRoute('GET', '/api/announcements/:id', 'Get announcement by ID', true),
    ApiDocs.createRoute('PUT', '/api/announcements/:id', 'Update announcement', true),
    ApiDocs.createRoute('DELETE', '/api/announcements/:id', 'Delete announcement', true),
    ApiDocs.createRoute('POST', '/api/announcements/:id/send', 'Send announcement', true),
    ApiDocs.createRoute('POST', '/api/announcements/:id/schedule', 'Schedule announcement', true),
    ApiDocs.createRoute('GET', '/api/announcements/:id/stats', 'Get announcement statistics', true),
    ApiDocs.createRoute('GET', '/api/announcements/analytics', 'Get announcement analytics', true),

    // User-facing announcement endpoints
    ApiDocs.createRoute('GET', '/api/announcements/user/my', 'Get user announcements', true),
    ApiDocs.createRoute('POST', '/api/announcements/:id/view', 'Mark announcement as viewed', true),
    ApiDocs.createRoute('POST', '/api/announcements/:id/click', 'Mark announcement as clicked', true),
];

// Add internal notification creation endpoint
app.post('/api/internal/notifications/create', verifyInternalToken, async (req, res) => {
    try {
        const NotificationController = await import('./controllers/notification.controller.js').then(mod => mod.default);

        const notification = {
            userId: req.body.userId,
            title: req.body.title,
            message: req.body.message,
            type: req.body.type || 'info',
            actionUrl: req.body.actionUrl,
            priority: req.body.priority || 'medium'
        };

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

        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, title, message'
            });
        }

        const NotificationModel = await import('./models/notification.model.js').then(mod => mod.default);

        const notificationId = await NotificationModel.createNotification({
            userId,
            title,
            message,
            type,
            actionUrl,
            relatedEntityType: metadata.entityType,
            relatedEntityId: metadata.entityId,
            priority: metadata.priority || 'medium',
            deliveryMethods: ['in_app', 'email']
        });

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

// Add reminder service endpoint (for testing/management)
app.get('/api/reminders/status', (req, res) => {
    res.json(reminderService.getStatus());
});

app.post('/api/reminders/start', verifyInternalToken, async (req, res) => {
    try {
        await reminderService.start();
        res.json({ success: true, message: 'Reminder service started' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/reminders/stop', verifyInternalToken, async (req, res) => {
    try {
        reminderService.stop();
        res.json({ success: true, message: 'Reminder service stopped' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start reminder service when server starts (in development only)
if (process.env.NODE_ENV === 'development') {
    reminderService.start().catch(console.error);
}

// API Documentation endpoint
app.get('/api-docs', (req, res) => {
    res.json(ApiDocs.generateDocs('communication', communicationEndpoints));
});

// Health endpoints
app.get('/health', createHealthCheck('communication'));

app.get('/health/detailed', async (req, res) => {
    const healthStatus = {
        service: 'communication-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'connected',
        websocket: io.engine.clientsCount ? 'connected' : 'waiting',
        environment: process.env.NODE_ENV || 'development',
        endpoints: communicationEndpoints.map(e => e.path),
        services: {
            appointments: 'active',
            notifications: 'active',
            messaging: 'active',
            email: 'active',
            todos: 'active'
        }
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
            appointments: '/api/appointments',
            todos: '/api/todos',
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

// ========== 404 HANDLER (MUST BE LAST) ==========
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
            '/api/appointments',
            '/api/todos',
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

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
            code: err.code
        });
    }

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

    if (err.name === 'RateLimitError') {
        return res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later'
        });
    }

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
    console.log(`✅ Todo Health: http://localhost:${PORT}/api/todos/health`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`📅 Appointments: http://localhost:${PORT}/api/appointments`);
    console.log(`📝 Todos: http://localhost:${PORT}/api/todos`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 CORS: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log(`============================================`);

    console.log('✅ Service initialized with:');
    console.log(`   • Rate limiting: ${apiLimiter.max} requests per ${apiLimiter.windowMs / 60000} minutes`);
    console.log(`   • File uploads: ${uploadDir}`);
    console.log(`   • Max file size: 10MB`);
    console.log(`   • Security headers: enabled`);
    console.log(`   • Compression: enabled`);
    console.log(`   • Logging: enabled`);
    console.log(`   • Appointments system: enabled`);
    console.log(`   • Todo system: enabled`);
});