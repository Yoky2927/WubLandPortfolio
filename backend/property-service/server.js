// backend/property-service/server.js - FIXED ORDER VERSION
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
  ApiDocs.createRoute('POST', '/api/properties/requests', 'Submit property request', true, ['seller', 'landlord']),
  ApiDocs.createRoute('POST', '/api/properties/requests/:id/assign', 'Assign broker to request', true, ['seller', 'landlord', 'broker', 'admin']),
  ApiDocs.createRoute('POST', '/api/properties/requests/:id/upload-image', 'Upload property image', true, ['seller', 'landlord']),
  ApiDocs.createRoute('GET', '/api/properties', 'Get all properties'),
  ApiDocs.createRoute('GET', '/api/properties/:id', 'Get property by ID'),
  ApiDocs.createRoute('GET', '/api/properties/requests/my', 'Get my property requests', true, ['seller', 'landlord']),
  ApiDocs.createRoute('GET', '/api/properties/requests/pending', 'Get pending requests', true, ['broker', 'admin']),
  // Add more routes from your property.routes.js
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

// ============================================
// 4. LOAD ALL API ROUTES (MOST IMPORTANT)
// ============================================

console.log('\n🔧 LOADING API ROUTES...\n');

async function loadRoutes() {
  const routes = [
    { name: 'propertyRoutes', path: './routes/property.routes.js', mount: '/api/properties' },
    { name: 'propertyImageRoutes', path: './routes/propertyImage.routes.js', mount: '/api/properties/images' },
    { name: 'propertyDocumentRoutes', path: './routes/propertyDocument.routes.js', mount: '/api/properties/documents' },
    { name: 'availabilityRoutes', path: './routes/availability.routes.js', mount: '/api/availability' },
    { name: 'adminRoutes', path: './routes/admin.routes.js', mount: '/api/admin' },
  ];

  for (const route of routes) {
    try {
      console.log(`📦 Loading ${route.name}...`);
      const module = await import(route.path);
      app.use(route.mount, module.default);
      console.log(`   ✅ Mounted at ${route.mount}`);
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      // Don't crash - continue loading other routes
    }
  }
  
  console.log('\n✅ ALL ROUTES LOADED!\n');
}

await loadRoutes();

// ============================================
// 5. DATABASE CONNECTION (AFTER ROUTES)
// ============================================

try {
  const { connectDB } = await import("./config/database.js");
  connectDB();
  console.log('✅ Database connected');
} catch (error) {
  console.log('⚠️  Database connection skipped:', error.message);
}

// ============================================
// 6. DEBUG MIDDLEWARE (AFTER ROUTES)
// ============================================

// Add route debugging to see what's happening
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================
// 7. 404 HANDLER (LAST - CATCHES UNMATCHED ROUTES)
// ============================================

app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
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
        "/api/properties/images/property/1",
        "/api/properties/documents/1/documents"
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
  console.log(`🧪 Test: http://localhost:${PORT}/api/test-simple`);
  console.log(`\n🔍 TEST THESE CRITICAL ROUTES:`);
  console.log(`   1. ${`http://localhost:${PORT}/api/test-simple`}`);
  console.log(`   2. ${`http://localhost:${PORT}/api/properties/images/property/1`}`);
  console.log(`   3. ${`http://localhost:${PORT}/api/properties/documents/1/documents`}`);
  console.log(`\n🎯 Then run: node final-comprehensive-test.js`);
  console.log(`✨ ========================================\n`);
});