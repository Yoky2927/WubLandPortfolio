// server.js - WORKING VERSION
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
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || "http://localhost:5173");
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

// API Documentation endpoint
app.get('/api-docs', (req, res) => {
  res.json(ApiDocs.generateDocs('user', userServiceEndpoints));
});

// Update health endpoint
app.get('/health', createHealthCheck('user'));

// File upload - FIXED configuration
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 10 * 1024 * 1024
  },
  useTempFiles: false,
  safeFileNames: true,
  preserveExtension: 4
}));

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

app.use("/api/brokers", brokersRoutes); 
// ============ MAIN ROUTES ============

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/privileges", privilegeRoutes);

// ============ ERROR HANDLERS ============

// 404 handler - USE A DIFFERENT PATTERN
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
  console.log(`=================================`);
});