// backend/property-service/server.js - CORRECTED VERSION
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

// Import controllers
import BuyerController from "./controllers/buyerController.js";
import { authenticate } from './middlewares/auth.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🚀 PROPERTY SERVICE STARTING...\n');

// ============================================
// 1. BASIC MIDDLEWARE CONFIGURATION
// ============================================

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware - MUST BE BEFORE ROUTES
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
app.use(morgan("dev"));

// Rate limiting
app.use("/api/", limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`📦 Request body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// ============================================
// 2. CREATE UPLOAD DIRECTORIES
// ============================================

const uploadDirs = [
  "uploads/property-images",
  "uploads/property-images/thumbnails",
  "uploads/documents",
  "uploads/floor-plans",
];

uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================
// 3. DATABASE CONNECTION
// ============================================

let pool;
try {
  const dbModule = await import("./config/database.js");
  pool = dbModule.default || dbModule.pool;
  console.log('✅ Database module loaded');

  // Test database connection
  const [rows] = await pool.execute('SELECT 1 as test');
  console.log('✅ Database connection test successful');
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  console.error('❌ Stack:', error.stack);
  process.exit(1);
}

// ============================================
// 4. HEALTH CHECK AND TEST ROUTES
// ============================================

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "property-service",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      properties: "/api/properties",
      buyer: {
        savedProperties: "/api/buyer/saved-properties",
        saveProperty: "POST /api/buyer/properties/:id/save",
        unsaveProperty: "DELETE /api/buyer/properties/:id/save",
        checkSaved: "/api/buyer/properties/:id/is-saved",
        recommended: "/api/buyer/recommended-properties"
      },
      applications: "/api/applications",
      debug: {
        database: "/api/debug/database-check",
        savedProperties: "/api/debug/saved-properties/:userId",
        saveTest: "/api/debug/save-test",
        checkSaves: "/api/debug/check-saves/:propertyId"
      }
    }
  });
});

// Health check
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    const [result] = await pool.execute('SELECT 1 as db_status');

    res.json({
      status: "healthy",
      service: "property-service",
      database: result[0].db_status === 1 ? "connected" : "disconnected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      service: "property-service",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// 5. PROPERTY ENDPOINTS - MUST COME BEFORE :id
// ============================================

// Get all properties from database
app.get("/api/properties", async (req, res) => {
  try {
    console.log('📝 GET /api/properties called');

    const {
      page = 1,
      limit = 20,
      city,
      property_type,
      listing_type,
      min_price,
      max_price,
      beds,
      baths,
      property_status,
      search,
    } = req.query;

    // Build WHERE clause
    let whereClause = "WHERE deleted_at IS NULL";
    const params = [];

    if (city) {
      whereClause += " AND city = ?";
      params.push(city);
    }

    if (property_type) {
      whereClause += " AND property_type = ?";
      params.push(property_type);
    }

    if (listing_type) {
      whereClause += " AND listing_type = ?";
      params.push(listing_type);
    }

    if (min_price) {
      whereClause += " AND price >= ?";
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      whereClause += " AND price <= ?";
      params.push(parseFloat(max_price));
    }

    if (beds) {
      whereClause += " AND beds = ?";
      params.push(parseInt(beds));
    }

    if (baths) {
      whereClause += " AND baths = ?";
      params.push(parseInt(baths));
    }

    if (property_status) {
      whereClause += " AND property_status = ?";
      params.push(property_status);
    }

    if (search) {
      whereClause += " AND (title LIKE ? OR address LIKE ? OR city LIKE ? OR description LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Count total properties
    const countQuery = `SELECT COUNT(*) as total FROM properties ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get properties with images
    const query = `
      SELECT p.*, 
        (SELECT image_url FROM property_images 
         WHERE property_id = p.id 
         ORDER BY is_primary DESC, image_order ASC 
         LIMIT 1) as main_image
      FROM properties p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [properties] = await pool.execute(query, [...params, parseInt(limit), offset]);

    console.log(`✅ Found ${properties.length} properties from database`);

    // Parse JSON fields
    const parsedProperties = properties.map(property => {
      // Helper function to safely parse JSON
      const safeParse = (str, defaultValue = []) => {
        try {
          return str ? JSON.parse(str) : defaultValue;
        } catch {
          return defaultValue;
        }
      };

      return {
        ...property,
        features: safeParse(property.features),
        amenities: safeParse(property.amenities),
        saved_by_users: safeParse(property.saved_by_users),
        price_history: safeParse(property.price_history),
        status_history: safeParse(property.status_history),
      };
    });

    res.json({
      success: true,
      message: "Properties retrieved successfully",
      data: parsedProperties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching properties:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch properties",
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// 6. SPECIFIC PROPERTY ENDPOINTS (MUST COME BEFORE :id)
// ============================================

// Get company properties
app.get("/api/properties/company", async (req, res) => {
  try {
    console.log('📊 GET /api/properties/company called');

    const [properties] = await pool.execute(
      `SELECT p.* FROM properties p
       WHERE p.property_source = 'company_owned'
       AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      data: properties || [],
      count: properties?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching company properties:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get pending properties
app.get("/api/properties/pending", async (req, res) => {
  try {
    console.log('📊 GET /api/properties/pending called');

    const [properties] = await pool.execute(
      `SELECT p.* FROM properties p
       WHERE p.property_status IN ('pending', 'draft')
       AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      data: properties || [],
      count: properties?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching pending properties:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get approved properties (active properties)
app.get("/api/properties/approved", async (req, res) => {
  try {
    console.log('📊 GET /api/properties/approved called');

    const [properties] = await pool.execute(
      `SELECT p.* FROM properties p
       WHERE p.property_status = 'active'
       AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      data: properties || [],
      count: properties?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching approved properties:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get rejected properties
app.get("/api/properties/rejected", async (req, res) => {
  try {
    console.log('📊 GET /api/properties/rejected called');

    // Check if 'rejected' exists in the enum, otherwise use 'inactive'
    const [statusCheck] = await pool.execute(
      `SELECT COLUMN_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'properties' 
         AND COLUMN_NAME = 'property_status'`
    );

    const columnType = statusCheck[0]?.COLUMN_TYPE || '';
    const hasRejected = columnType.includes("'rejected'");

    let query;
    if (hasRejected) {
      query = `SELECT p.* FROM properties p
               WHERE p.property_status = 'rejected'
               AND p.deleted_at IS NULL
               ORDER BY p.created_at DESC`;
    } else {
      // Fallback to 'inactive' if 'rejected' doesn't exist
      console.log('⚠️ "rejected" status not found in enum, using "inactive" as fallback');
      query = `SELECT p.* FROM properties p
               WHERE p.property_status = 'inactive'
               AND p.deleted_at IS NULL
               ORDER BY p.created_at DESC`;
    }

    const [properties] = await pool.execute(query);

    res.json({
      success: true,
      data: properties || [],
      count: properties?.length || 0,
      timestamp: new Date().toISOString(),
      note: hasRejected ? 'Using "rejected" status' : 'Using "inactive" status as fallback for rejected'
    });
  } catch (error) {
    console.error('❌ Error fetching rejected properties:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// 7. PROPERTY BY ID (MUST COME AFTER SPECIFIC ROUTES)
// ============================================

// Get property by ID - THIS MUST COME AFTER THE SPECIFIC ROUTES
app.get("/api/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 GET /api/properties/${id} called`);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
        timestamp: new Date().toISOString()
      });
    }

    // Get property details
    const [properties] = await pool.execute(`
      SELECT p.* FROM properties p
      WHERE p.id = ? AND p.deleted_at IS NULL
    `, [id]);

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
        timestamp: new Date().toISOString()
      });
    }

    const property = properties[0];

    // Get property images
    const [images] = await pool.execute(`
      SELECT * FROM property_images 
      WHERE property_id = ? 
      ORDER BY is_primary DESC, image_order ASC
    `, [id]);

    // Parse JSON fields
    const safeParse = (str, defaultValue = []) => {
      try {
        return str ? JSON.parse(str) : defaultValue;
      } catch {
        return defaultValue;
      }
    };

    property.features = safeParse(property.features);
    property.amenities = safeParse(property.amenities);
    property.saved_by_users = safeParse(property.saved_by_users);
    property.price_history = safeParse(property.price_history);
    property.status_history = safeParse(property.status_history);

    // Add images to property
    property.images = images;

    console.log(`✅ Retrieved property ${id} from database`);

    res.json({
      success: true,
      message: "Property retrieved successfully",
      data: property,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Error fetching property ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch property",
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// 8. BUYER ENDPOINTS - USING CONTROLLER
// ============================================
// Get saved properties - PROTECTED
app.get("/api/buyer/saved-properties", authenticate, BuyerController.getSavedProperties);

// Save property (POST) - PROTECTED
app.post("/api/buyer/properties/:propertyId/save", authenticate, BuyerController.toggleSaveProperty);

// Unsave property (DELETE) - PROTECTED
app.delete("/api/buyer/properties/:propertyId/save", authenticate, BuyerController.toggleSaveProperty);

// Check if property is saved - PROTECTED
app.get("/api/buyer/properties/:propertyId/is-saved", authenticate, BuyerController.checkSavedStatus);

// Get recommended properties - PROTECTED
app.get("/api/buyer/recommended-properties", authenticate, BuyerController.getRecommendedProperties);

// Track property view - PROTECTED
app.post("/api/buyer/properties/:propertyId/view", authenticate, BuyerController.trackPropertyView);

// Get property stats - PROTECTED
app.get("/api/buyer/properties/:propertyId/stats", authenticate, BuyerController.getPropertyStats);

app.get("/api/properties/broker/listings", authenticate, async (req, res) => {
  try {
    console.log('📝 GET /api/properties/broker/listings called');
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log(`🔍 Fetching listings for user ${userId} with role ${userRole}`);
    
    // Check if user has broker role
    const allowedRoles = ['internal_broker', 'external_broker', 'admin', 'super_admin'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Broker role required.",
        timestamp: new Date().toISOString()
      });
    }
    
    // Query to get broker's listings
    const query = `
      SELECT p.*, 
        (SELECT image_url FROM property_images 
         WHERE property_id = p.id 
         ORDER BY is_primary DESC, image_order ASC 
         LIMIT 1) as main_image,
        u.first_name as broker_first_name,
        u.last_name as broker_last_name
      FROM properties p
      LEFT JOIN users u ON p.assigned_broker_id = u.id
      WHERE p.assigned_broker_id = ? 
        AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `;
    
    const [properties] = await pool.execute(query, [userId]);
    
    console.log(`✅ Found ${properties.length} listings for broker ${userId}`);
    
    // Parse JSON fields
    const parsedProperties = properties.map(property => {
      const safeParse = (str, defaultValue = []) => {
        try {
          return str ? JSON.parse(str) : defaultValue;
        } catch {
          return defaultValue;
        }
      };
      
      return {
        ...property,
        features: safeParse(property.features),
        amenities: safeParse(property.amenities),
        saved_by_users: safeParse(property.saved_by_users),
        price_history: safeParse(property.price_history),
        status_history: safeParse(property.status_history)
      };
    });
    
    res.json({
      success: true,
      message: "Broker listings retrieved successfully",
      data: parsedProperties,
      count: parsedProperties.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching broker listings:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch broker listings",
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// 9. APPLICATION ENDPOINTS
// ============================================

// Create application
app.post("/api/applications", async (req, res) => {
  try {
    console.log('📝 POST /api/applications called');

    const {
      property_id,
      message,
      offered_amount,
      cover_letter,
      application_type = 'rent'
    } = req.body;

    // Validate required fields
    if (!property_id) {
      return res.status(400).json({
        success: false,
        message: "Property ID is required",
        timestamp: new Date().toISOString()
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
        timestamp: new Date().toISOString()
      });
    }

    const user_id = 21; // TODO: Get from auth token

    // Create application
    const [result] = await pool.execute(`
      INSERT INTO property_applications 
      (property_id, user_id, application_type, status, message, 
       offered_amount, cover_letter, submitted_at, created_at, updated_at)
      VALUES (?, ?, ?, 'submitted', ?, ?, ?, NOW(), NOW(), NOW())
    `, [property_id, user_id, application_type, message, offered_amount || null, cover_letter || '']);

    const applicationId = result.insertId;

    // Get the created application
    const [applications] = await pool.execute(`
      SELECT pa.*, 
        p.title as property_title,
        p.address as property_address,
        p.city as property_city
      FROM property_applications pa
      JOIN properties p ON pa.property_id = p.id
      WHERE pa.id = ?
    `, [applicationId]);

    console.log(`✅ Application ${applicationId} created successfully`);

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: applications[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating application:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit application",
      timestamp: new Date().toISOString()
    });
  }
});

// Get user applications
app.get("/api/applications", async (req, res) => {
  try {
    console.log('📝 GET /api/applications called');

    const user_id = 21; // TODO: Get from auth token

    const [applications] = await pool.execute(`
      SELECT pa.*, 
        p.title as property_title,
        p.address as property_address,
        p.city as property_city,
        p.price as property_price,
        p.listing_type as property_listing_type,
        (SELECT image_url FROM property_images 
         WHERE property_id = p.id 
         ORDER BY is_primary DESC, image_order ASC 
         LIMIT 1) as property_image
      FROM property_applications pa
      JOIN properties p ON pa.property_id = p.id
      WHERE pa.user_id = ? AND pa.deleted_at IS NULL
      ORDER BY pa.created_at DESC
    `, [user_id]);

    console.log(`✅ Retrieved ${applications.length} applications for user ${user_id}`);

    res.json({
      success: true,
      message: "Applications retrieved successfully",
      data: applications,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch applications",
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// 10. DEBUG ENDPOINTS
// ============================================

// Debug database check
app.get("/api/debug/database-check", async (req, res) => {
  try {
    // Check the structure of saved_by_users column
    const [columnInfo] = await pool.execute(`
      SHOW COLUMNS FROM properties LIKE 'saved_by_users'
    `);

    // Check total properties count
    const [totalCount] = await pool.execute(`SELECT COUNT(*) as total FROM properties`);

    // Check properties with saves
    const [savedCount] = await pool.execute(`SELECT COUNT(*) as saved FROM properties WHERE saves_count > 0`);

    // Get a sample property
    const [sample] = await pool.execute(`
      SELECT id, title, saved_by_users, saves_count 
      FROM properties 
      WHERE saves_count > 0 OR saved_by_users IS NOT NULL 
      LIMIT 1
    `);

    res.json({
      success: true,
      columnInfo: columnInfo[0],
      totalProperties: totalCount[0].total,
      propertiesWithSaves: savedCount[0].saved,
      sampleProperty: sample.length > 0 ? sample[0] : null,
      savedByUsersSample: sample.length > 0 ? sample[0].saved_by_users : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug saved properties
app.get("/api/debug/saved-properties/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 DEBUG: Checking saved properties for user ${userId}`);

    // Check the database directly
    const [properties] = await pool.execute(`
      SELECT 
        id,
        title,
        saved_by_users,
        JSON_LENGTH(saved_by_users) as saved_count,
        saves_count
      FROM properties 
      WHERE JSON_CONTAINS(saved_by_users, ?)
    `, [JSON.stringify(userId.toString())]);

    console.log(`🔍 DEBUG: Found ${properties.length} properties with user ${userId} in saved_by_users`);

    // Also check all properties to see saved_by_users content
    const [allProperties] = await pool.execute(`
      SELECT id, title, saved_by_users, saves_count FROM properties LIMIT 5
    `);

    res.json({
      success: true,
      userId,
      savedProperties: properties,
      sampleProperties: allProperties,
      message: `Found ${properties.length} properties saved by user ${userId}`
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug save test endpoint
app.get("/api/debug/save-test", async (req, res) => {
  try {
    const user_id = 21;
    const user_id_str = "21";

    // Test 1: Check database structure
    const [columns] = await pool.execute(`
      SHOW COLUMNS FROM properties WHERE Field IN ('saved_by_users', 'saves_count')
    `);

    // Test 2: Check a specific property
    const propertyId = 1;
    const [property] = await pool.execute(`
      SELECT 
        id,
        title,
        saved_by_users,
        saves_count,
        JSON_TYPE(saved_by_users) as json_type,
        JSON_LENGTH(saved_by_users) as json_length
      FROM properties 
      WHERE id = ?
    `, [propertyId]);

    // Test 3: Try to find properties with user 21 saved
    const [userSaved] = await pool.execute(`
      SELECT 
        id,
        title,
        saved_by_users,
        JSON_CONTAINS(saved_by_users, ?) as contains_user,
        JSON_SEARCH(saved_by_users, 'one', ?) as user_position
      FROM properties
      WHERE JSON_CONTAINS(saved_by_users, ?)
    `, [JSON.stringify(user_id_str), user_id_str, JSON.stringify(user_id_str)]);

    res.json({
      success: true,
      columns,
      property: property.length > 0 ? property[0] : null,
      userSaved: userSaved,
      user_id,
      user_id_str,
      test_query: `JSON_CONTAINS(saved_by_users, '${JSON.stringify(user_id_str)}')`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/buyer/properties/:propertyId/save", BuyerController.checkSavedStatus);

// Debug endpoint to check specific property saves
app.get("/api/debug/check-saves/:propertyId", async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = 21;
    const userIdStr = "21";

    const [property] = await pool.execute(`
      SELECT 
        id,
        title,
        saved_by_users,
        saves_count,
        JSON_TYPE(saved_by_users) as json_type,
        JSON_LENGTH(saved_by_users) as json_length,
        JSON_CONTAINS(saved_by_users, ?) as contains_string,
        JSON_CONTAINS(saved_by_users, ?) as contains_number
      FROM properties 
      WHERE id = ?
    `, [JSON.stringify([userIdStr]), JSON.stringify([userId]), propertyId]);

    if (property.length === 0) {
      return res.json({ error: "Property not found" });
    }

    const prop = property[0];

    // Helper function to safely parse JSON
    const safeParse = (str, defaultValue = []) => {
      try {
        return str ? JSON.parse(str) : defaultValue;
      } catch {
        return defaultValue;
      }
    };

    const savedUsers = safeParse(prop.saved_by_users, []);

    res.json({
      property: {
        id: prop.id,
        title: prop.title,
        saved_by_users_raw: prop.saved_by_users,
        saved_by_users_parsed: savedUsers,
        saves_count: prop.saves_count,
        json_type: prop.json_type,
        json_length: prop.json_length,
        contains_string: prop.contains_string,
        contains_number: prop.contains_number
      },
      user: {
        id: userId,
        id_str: userIdStr,
        is_in_array: savedUsers.includes(userIdStr) || savedUsers.includes(userId)
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 11. REDIRECT ROUTES FOR FRONTEND
// ============================================

// Redirect /properties to /api/properties
app.get("/properties", async (req, res) => {
  console.log('🔄 Redirecting /properties to /api/properties');
  res.redirect(307, "/api/properties");
});

// Redirect /properties/:id to /api/properties/:id
app.get("/properties/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`🔄 Redirecting /properties/${id} to /api/properties/${id}`);
  res.redirect(307, `/api/properties/${id}`);
});

// ============================================
// 12. 404 HANDLER
// ============================================

app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    message: "Route not found",
    requestedPath: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "GET /",
      "GET /health",
      "GET /api/properties",
      "GET /api/properties/company",
      "GET /api/properties/pending",
      "GET /api/properties/approved",
      "GET /api/properties/rejected",
      "GET /api/properties/:id",
      "GET /api/buyer/saved-properties",
      "GET /api/properties/broker/listings",  
      "POST /api/buyer/properties/:id/save",
      "DELETE /api/buyer/properties/:id/save",
      "GET /api/buyer/properties/:id/is-saved",
      "GET /api/buyer/recommended-properties",
      "POST /api/applications",
      "GET /api/applications",
      "GET /api/debug/database-check",
      "GET /api/debug/saved-properties/:userId",
      "GET /api/debug/save-test",
      "GET /api/debug/check-saves/:propertyId"
    ]
  });
});

// ============================================
// 13. ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('🔥 ERROR:', err.message);
  console.error('🔥 Stack:', err.stack);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 14. START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`✨ ========================================`);
  console.log(`✨ PROPERTY SERVICE RUNNING`);
  console.log(`✨ ========================================`);
  console.log(`✅ Port: ${PORT}`);
  console.log(`✅ Database: Connected`);
  console.log(`\n🔗 MAIN ENDPOINTS:`);
  console.log(`  1. Health:          http://localhost:${PORT}/health`);
  console.log(`  2. All Properties:  http://localhost:${PORT}/api/properties`);
  console.log(`\n🔗 FILTERED PROPERTY ENDPOINTS:`);
  console.log(`  3. Company:         http://localhost:${PORT}/api/properties/company`);
  console.log(`  4. Pending:         http://localhost:${PORT}/api/properties/pending`);
  console.log(`  5. Approved:        http://localhost:${PORT}/api/properties/approved`);
  console.log(`  6. Rejected:        http://localhost:${PORT}/api/properties/rejected`);
  console.log(`  7. Property by ID:  http://localhost:${PORT}/api/properties/1`);
  console.log(`\n🔗 BUYER ENDPOINTS:`);
  console.log(`  8. Saved Properties: http://localhost:${PORT}/api/buyer/saved-properties`);
  console.log(`  9. Save Property:    POST http://localhost:${PORT}/api/buyer/properties/1/save`);
  console.log(` 10. Unsave Property:  DELETE http://localhost:${PORT}/api/buyer/properties/1/save`);
  console.log(` 11. Check Saved:      http://localhost:${PORT}/api/buyer/properties/1/is-saved`);
  console.log(` 12. Recommended:      http://localhost:${PORT}/api/buyer/recommended-properties`);
  console.log(`\n🔗 DEBUG ENDPOINTS:`);
  console.log(` 13. Database Check:   http://localhost:${PORT}/api/debug/database-check`);
  console.log(` 14. Save Test:        http://localhost:${PORT}/api/debug/save-test`);
  console.log(` 15. Check Saves:      http://localhost:${PORT}/api/debug/check-saves/1`);
  console.log(`\n📌 Note: Using BuyerController for save/unsave operations`);
  console.log(`✨ ========================================\n`);
});