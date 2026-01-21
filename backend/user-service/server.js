import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import privilegeRoutes from "./routes/privilege.routes.js";
import path from 'path';
import { fileURLToPath } from 'url';
import brokersRoutes from "./routes/brokers.routes.js";
import { ApiDocs, createHealthCheck } from '../shared/api-docs.js';
import documentVerificationRoutes from "./routes/document-verification.routes.js";
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

// ADD THIS IMPORT
import { verifyToken, verifyAdmin } from './middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
// ============ CORS SETUP ============

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Confirm'] // ADD X-Confirm here
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || "http://localhost:5173");
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Confirm'); // ADD X-Confirm here
    return res.status(200).end();
  }
  next();
});

// ============ MIDDLEWARE ============

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));
app.use(cookieParser());

const userServiceEndpoints = [
  ApiDocs.createRoute('POST', '/api/auth/register', 'Register new user'),
  ApiDocs.createRoute('POST', '/api/auth/login', 'Login user'),
  ApiDocs.createRoute('GET', '/api/auth/check', 'Check authentication', true),
  ApiDocs.createRoute('POST', '/api/auth/upload-profile-picture', 'Upload profile picture', true),
  ApiDocs.createRoute('GET', '/api/users/me', 'Get current user', true),
  ApiDocs.createRoute('GET', '/api/users/brokers', 'Get all brokers'),
  ApiDocs.createRoute('GET', '/api/brokers', 'Get brokers'),
  // Add more routes as needed
];

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes (but exclude some important ones)
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for health checks and auth
  if (req.path === '/health' || 
      req.path === '/ping' || 
      req.path.includes('/auth/')) {
    return next();
  }
  apiLimiter(req, res, next);
});

// API Documentation endpoint
app.get('/api-docs', (req, res) => {
  res.json(ApiDocs.generateDocs('user', userServiceEndpoints));
});


// File upload - FIXED configuration
app.use((req, res, next) => {
  // Skip express-fileupload for routes that use multer
  if (req.path.includes('/documents/upload') || req.path.includes('/debug-upload')) {
    return next();
  }

  // Otherwise use express-fileupload
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 10 * 1024 * 1024
    },
    useTempFiles: false,
    safeFileNames: true,
    preserveExtension: 4
  })(req, res, next);
});

// Static files
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// ============ TEST ENDPOINTS ============

app.get("/ping", (req, res) => {
  res.json({
    status: "ok",
    service: "user-service",
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

app.use('/Uploads/verification-documents', express.static(path.join(__dirname, 'Uploads/verification-documents')));

// Simple test upload
app.post("/api/test-upload", (req, res) => {
  console.log("Test upload endpoint hit");

  if (!req.files || !req.files.profilePicture) {
    return res.status(400).json({
      error: "No file uploaded",
      hasFiles: !!req.files
    });
  }

  const file = req.files.profilePicture;
  console.log('File received:', file.name, file.size);

  res.json({
    success: true,
    message: "File received successfully",
    filename: file.name
  });
});

// ============ DEBUG ENDPOINTS ============
app.get('/api/debug-middleware', verifyToken, (req, res, next) => {
  console.log('✅ verifyToken passed, req.user:', req.user);
  next();
}, verifyAdmin, (req, res, next) => {
  console.log('✅ verifyAdmin passed, req.user:', req.user);
  next();
}, (req, res) => {
  console.log('✅ Final handler reached');
  res.json({ 
    success: true, 
    message: 'All middleware passed',
    user: req.user 
  });
});

app.get('/api/test-file/:filename', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'Uploads/profile-pictures', filename);
  
  console.log('🔍 Looking for file:', filePath);
  console.log('🔍 File exists?', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ 
      error: 'File not found',
      searched_path: filePath,
      files_in_directory: fs.readdirSync(path.dirname(filePath))
    });
  }
});

app.use("/api/users", userRoutes);

// Then mount your user routes
app.use("/api/users", userRoutes);

app.get('/api/debug-paths', async (req, res) => {
  try {
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const paths = {
      serverDir: __dirname,
      sharedDbPathFromServer: path.join(__dirname, '..', 'shared', 'db.js'),
      sharedDbPathRelative: '../shared/db.js',
      middlewareDir: path.join(__dirname, 'middleware'),
      sharedDbPathFromMiddleware: path.join(__dirname, '..', '..', 'shared', 'db.js')
    };
    
    // Check if files exist
    const fs = await import('fs');
    const fileExists = (filePath) => {
      try {
        return fs.existsSync(filePath);
      } catch {
        return false;
      }
    };
    
    const checks = {
      serverDirExists: fileExists(paths.serverDir),
      sharedDbExistsFromServer: fileExists(paths.sharedDbPathFromServer),
      sharedDbExistsFromMiddleware: fileExists(paths.sharedDbPathFromMiddleware),
      middlewareDirExists: fileExists(paths.middlewareDir)
    };
    
    res.json({
      paths,
      checks,
      explanation: {
        fromServer: 'server.js uses: import("../shared/db.js")',
        fromMiddleware: 'middleware should use: import("../../shared/db.js")'
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test pending verifications directly
app.get('/api/test-pending-direct', async (req, res) => {
  try {
    // Get token manually
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    // IMPORTANT: Import jwt properly - NOT dynamically
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('User ID from token:', decoded.userId);
    
    // Check if user is admin/support staff
    const allowedRoles = ['super_admin', 'admin', 'support_admin', 'support_lead', 'support_agent'];
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Connect to database using the working path
    const db = await import("../shared/db.js").then(mod => mod.default);
    
    // Get pending verifications
    const [pendingUsers] = await db.query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        phone_number,
        role,
        verification_status,
        created_at,
        updated_at,
        kebele_id_document,
        proof_of_income_document,
        other_documents
      FROM users 
      WHERE verification_status = 'pending' 
        AND role IN ('buyer', 'renter')
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      currentUser: {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      },
      pendingVerifications: pendingUsers,
      count: pendingUsers.length
    });
    
  } catch (error) {
    console.error('Direct test error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(500).json({ 
      message: 'Test endpoint failed', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get('/api/test-shared-db', async (req, res) => {
  try {
    console.log('Testing shared/db.js import...');
    
    // Try direct import
    const db = await import("../shared/db.js").then(mod => mod.default);
    console.log('✅ DB imported successfully');
    
    // Test query
    const [result] = await db.query("SELECT 1 + 1 AS test");
    console.log('✅ DB query successful:', result[0].test);
    
    res.json({
      success: true,
      message: 'Shared DB works!',
      testResult: result[0].test
    });
    
  } catch (error) {
    console.error('❌ Shared DB test failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

app.get('/api/test-controller-direct', async (req, res) => {
  try {
    // Get token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Connect to database
    const db = await import("../shared/db.js").then(mod => mod.default);
    
    // Direct query (same as controller)
    const [pendingUsers] = await db.query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        phone_number,
        role,
        verification_status,
        created_at,
        updated_at,
        kebele_id_document,
        proof_of_income_document,
        other_documents
      FROM users 
      WHERE verification_status = 'pending' 
        AND role IN ('buyer', 'renter')
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      currentUser: {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role
      },
      pendingVerifications: pendingUsers,
      count: pendingUsers.length
    });
    
  } catch (error) {
    console.error('Direct controller test error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug-middleware', verifyToken, (req, res, next) => {
  console.log('✅ verifyToken passed, req.user:', req.user);
  next();
}, verifyAdmin, (req, res, next) => {
  console.log('✅ verifyAdmin passed, req.user:', req.user);
  next();
}, (req, res) => {
  console.log('✅ Final handler reached');
  res.json({ 
    success: true, 
    message: 'All middleware passed',
    user: req.user 
  });
});

app.use("/api/brokers", brokersRoutes);
// ============ MAIN ROUTES ============

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/privileges", privilegeRoutes);

// ADD THIS LINE - Mount verification routes
app.use("/api/verification", documentVerificationRoutes);

// ============ ERROR HANDLERS ============

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// ============ START SERVER ============

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 User service running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
  console.log(`📁 Uploads: http://localhost:${PORT}/Uploads`);
  console.log(`🔧 Test endpoints:`);
  console.log(`   - GET  http://localhost:${PORT}/health`);
  console.log(`   - GET  http://localhost:${PORT}/ping`);
  console.log(`   - POST http://localhost:${PORT}/api/test-upload`);
  console.log(`   - GET  http://localhost:${PORT}/api/debug-paths`);
  console.log(`   - GET  http://localhost:${PORT}/api/test-pending-direct (with auth token)`);
  console.log(`=================================`);
});