// backend/property-service/server.js - FIXED VERSION
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { ApiDocs, createHealthCheck } from '../shared/api-docs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🚀 PROPERTY SERVICE STARTING...\n');

// ============================================
// 1. BASIC MIDDLEWARE (FIRST)
// ============================================

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

// Security and parsing middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/api", limiter);

// Fix double slashes in URLs
app.use((req, res, next) => {
  if (req.url.includes("//")) {
    req.url = req.url.replace(/\/+/g, "/");
  }
  next();
});

const propertyServiceEndpoints = [
  ApiDocs.createRoute('POST', '/api/buyer/properties/:propertyId/save', 'Save/unsave property', true, ['buyer', 'renter', 'user']),
  ApiDocs.createRoute('GET', '/api/buyer/saved-properties', 'Get saved properties', true, ['buyer', 'renter', 'user']),
  ApiDocs.createRoute('GET', '/api/buyer/recommended-properties', 'Get recommended properties', true, ['buyer', 'renter', 'user']),
  // Add more routes...
];

// API Documentation endpoint
app.get('/api-docs', (req, res) => {
  res.json(ApiDocs.generateDocs('property', propertyServiceEndpoints));
});

// ============================================
// 2. STATIC FILES (BEFORE ROUTES)
// ============================================

// Create upload directories
const uploadDirs = [
  "./uploads/property-images",
  "./uploads/property-images/thumbnails",
  "./uploads/documents",
  "./uploads/floor-plans",
];

uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Serve static files
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));

// ============================================
// 3. SIMPLE TEST ROUTES (BEFORE API ROUTES)
// ============================================

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "property-service",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    service: "property-service",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test-simple", (req, res) => {
  res.json({
    message: "Simple test route works",
    timestamp: new Date().toISOString()
  });
});

// ADD A TEST BUYER ROUTE
app.get("/api/buyer/test", (req, res) => {
  console.log('✅ Buyer test route hit');
  res.json({
    success: true,
    message: 'Buyer routes are working!',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 4. LOAD ALL API ROUTES (MOST IMPORTANT)
// ============================================

console.log('\n🔧 LOADING API ROUTES...\n');

async function loadRoutes() {
  try {
    // Load buyer routes FIRST
    console.log('📦 Loading buyerRoutes...');
    const buyerModule = await import('./routes/buyer.routes.js');
    app.use('/api/buyer', buyerModule.default);
    console.log('   ✅ Buyer routes mounted at /api/buyer');
    
    // Load other routes
    const routes = [
      { name: 'propertyRoutes', path: './routes/property.routes.js', mount: '/api/properties' },
      { name: 'propertyImageRoutes', path: './routes/propertyImage.routes.js', mount: '/api/properties/images' },
      { name: 'propertyDocumentRoutes', path: './routes/propertyDocument.routes.js', mount: '/api/properties/documents' },
      { name: 'availabilityRoutes', path: './routes/availability.routes.js', mount: '/api/availability' },
      { name: 'adminRoutes', path: './routes/admin.routes.js', mount: '/api/admin' },
      { name: 'applicationRoutes', path: './routes/application.routes.js', mount: '/api/applications' },
    ];

    for (const route of routes) {
      try {
        console.log(`📦 Loading ${route.name}...`);
        const module = await import(route.path);
        app.use(route.mount, module.default);
        console.log(`   ✅ Mounted at ${route.mount}`);
      } catch (error) {
        console.log(`   ❌ FAILED to load ${route.name}: ${error.message}`);
      }
    }

    console.log('\n✅ ALL ROUTES LOADED!\n');
    
  } catch (error) {
    console.error('❌ ERROR loading routes:', error);
  }
}

await loadRoutes();

// ============================================
// 5. ROUTE DEBUGGING MIDDLEWARE
// ============================================

// Add route debugging to see what's happening
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  
  // Log buyer routes specifically
  if (req.originalUrl.includes('/api/buyer')) {
    console.log(`   👤 Buyer route accessed: ${req.originalUrl}`);
  }
  
  next();
});

// ============================================
// 6. DATABASE CONNECTION (AFTER ROUTES)
// ============================================

try {
  const { connectDB } = await import("./config/database.js");
  connectDB();
  console.log('✅ Database connected');
} catch (error) {
  console.log('⚠️  Database connection skipped:', error.message);
}

// ============================================
// 7. 404 HANDLER (LAST - CATCHES UNMATCHED ROUTES)
// ============================================

app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  
  // Special debug for buyer routes
  if (req.originalUrl.includes('/api/buyer')) {
    console.log(`   🔍 Buyer route 404 - Check route mounting`);
    console.log(`   🔍 Available buyer routes should be at: /api/buyer/saved-properties, /api/buyer/properties/:id/save`);
  }
  
  res.status(404).json({
    success: false,
    message: "Route not found",
    requestedPath: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    debugInfo: {
      testRoutes: [
        "/health",
        "/api/test-simple",
        "/api/buyer/test",
        "/api/buyer/saved-properties",
        "/api/buyer/properties/1/save"
      ]
    }
  });
});

// ============================================
// 8. ERROR HANDLER (VERY LAST)
// ============================================

app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.message);
  console.error("🔥 STACK:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`✨ ========================================`);
  console.log(`✨ PROPERTY SERVICE RUNNING`);
  console.log(`✨ ========================================`);
  console.log(`✅ Port: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Simple Test: http://localhost:${PORT}/api/test-simple`);
  console.log(`👤 Buyer Test: http://localhost:${PORT}/api/buyer/test`);
  console.log(`\n🔍 TEST THESE BUYER ROUTES:`);
  console.log(`   1. GET  ${`http://localhost:${PORT}/api/buyer/test`}`);
  console.log(`   2. GET  ${`http://localhost:${PORT}/api/buyer/saved-properties`}`);
  console.log(`   3. POST ${`http://localhost:${PORT}/api/buyer/properties/1/save`}`);
  console.log(`   4. GET  ${`http://localhost:${PORT}/api/buyer/properties/1/saved`}`);
  console.log(`\n✨ ========================================\n`);
});