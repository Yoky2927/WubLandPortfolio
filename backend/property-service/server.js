// server.js - UPDATED VERSION
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

// Routes
import propertyRoutes from "./routes/property.routes.js";
import propertyImageRoutes from "./routes/propertyImage.routes.js";
import propertyDocumentRoutes from "./routes/propertyDocument.routes.js";
import propertyViewingRoutes from "./routes/propertyViewing.routes.js";
import brokerRoutes from "./routes/broker.routes.js";

// Database connection
import { connectDB } from "./config/database.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "http://localhost:5002", // Property Service
          "http://localhost:5173", // Frontend
          "https://images.unsplash.com", // Fallback images
        ],
        "connect-src": [
          "'self'",
          "http://localhost:5002",
          "http://localhost:5173",
          "http://localhost:5000", // User Service
        ],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
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

// Ensure upload directories exist
const uploadDirs = [
  "./uploads/property-images",
  "./uploads/property-images/thumbnails",
  "./uploads/documents",
  "./uploads/floor-plans",
  "./uploads/images", // You have this folder
];

uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${fullPath}`);
  }
});

// CRITICAL: Serve static files from uploads directory
const uploadsPath = path.join(__dirname, "uploads");
console.log(`📁 Serving static files from: ${uploadsPath}`);

app.use("/uploads", express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Set CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    
    // Cache images for 24 hours
    const ext = path.extname(filePath).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
      res.set("Cache-Control", "public, max-age=86400");
    }
    
    // Debug logging for image requests
    if (process.env.NODE_ENV === "development") {
      console.log(`📁 Serving static file: ${filePath}`);
    }
  },
}));

// Database connection
connectDB();

// Routes
app.use("/api/properties", propertyRoutes);
app.use("/api/properties/images", propertyImageRoutes);
app.use("/api/properties/documents", propertyDocumentRoutes);
app.use("/api/properties/viewings", propertyViewingRoutes);
app.use("/api/broker", brokerRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "property-service",
    timestamp: new Date().toISOString(),
    uploadsPath: uploadsPath,
    staticFiles: "Serving from /uploads",
  });
});

// Test endpoint for static files
app.get("/api/test-static", (req, res) => {
  const testFiles = [];
  
  try {
    // Check if files exist
    const propertyImagesPath = path.join(__dirname, "uploads/property-images");
    if (fs.existsSync(propertyImagesPath)) {
      const files = fs.readdirSync(propertyImagesPath);
      testFiles.push(...files.filter(f => !f.includes("thumbnails")));
    }
  } catch (error) {
    console.error("Error checking files:", error);
  }
  
  res.json({
    message: "Static file server test",
    uploadsPath: uploadsPath,
    propertyImagesPath: path.join(__dirname, "uploads/property-images"),
    availableFiles: testFiles.slice(0, 5), // First 5 files
    testUrl: testFiles.length > 0 
      ? `http://localhost:${PORT}/uploads/property-images/${testFiles[0]}`
      : "No test files available",
    instructions: "Upload an image and test the URL above",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "property-service",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    staticFiles: "Available at /uploads",
    endpoints: [
      "/health",
      "/api/test-static",
      "/uploads/property-images/",
      "/api/properties",
      "/api/properties/:id",
      "/api/properties/search",
      "/api/properties/featured",
      "/api/properties/premium",
      "/api/properties/recent",
    ],
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Property Service running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads/`);
  console.log(`📸 Example image: http://localhost:${PORT}/uploads/property-images/property-1766153837603-368540975.webp`);
});