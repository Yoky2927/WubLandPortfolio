// routes/property.routes.js - FIXED VERSION
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../config/database.js"; // ADD THIS IMPORT
import PropertyController from "../controllers/property.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  checkRole,
  canManageProperty,
} from "../middlewares/role.middleware.js";
import {
  canPostProperties,
  checkListingLimit,
  requireBrokerVerification,
  canFeatureProperty,
  canPostPremium
} from "../middlewares/privilege.middleware.js";

const router = express.Router();

// Configure multer for property creation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/property-images/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `property-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "application/octet-stream",
  ];

  const allowedExtensions = [
    ".jpeg",
    ".jpg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".pdf",
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
  const isValidExtension = allowedExtensions.includes(ext);

  if (isValidMimeType || isValidExtension) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        `File type not allowed: ${file.mimetype} - ${file.originalname}. Allowed: ${allowedMimeTypes.join(", ")}`
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 25,
  },
});

// ================= PUBLIC ROUTES =================
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "property-service",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

router.get("/", PropertyController.getAllProperties);
router.get("/search", PropertyController.searchProperties);
router.get("/featured", PropertyController.getFeaturedProperties);
router.get("/recent", PropertyController.getRecentProperties);
router.get("/premium", PropertyController.getPremiumProperties);
router.get("/:id", PropertyController.getPropertyById);

// ================= BROKER ROUTES =================
router.get(
  "/broker/listings",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin", "super_admin"]),
  PropertyController.getBrokerListings
);

// Property action route (for broker actions - approve/reject/publish/unpublish)
router.post(
  "/:id/action",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin", "super_admin"]),
  canManageProperty,
  PropertyController.propertyAction  // FIXED: Changed from brokerUpdatePropertyStatus
);

// Property status update route (general status updates)
router.patch(
  "/:id/status",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin", "super_admin", "seller", "landlord"]),
  canManageProperty,
  PropertyController.updatePropertyStatus
);

// Feature property route (premium/enterprise only)
router.patch(
  "/:id/feature",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin", "super_admin"]),
  canFeatureProperty,
  canManageProperty,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { is_featured } = req.body;
      
      if (typeof is_featured !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: "is_featured must be a boolean"
        });
      }
      
      const [result] = await pool.execute(
        `UPDATE properties 
         SET is_featured = ?, 
             updated_at = NOW(),
             last_modified_by_user_id = ?
         WHERE id = ?`,
        [is_featured, req.user?.id, id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Property not found"
        });
      }
      
      res.json({
        success: true,
        message: `Property ${is_featured ? 'featured' : 'unfeatured'} successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ================= PROPERTY REQUESTS (for sellers/landlords) =================
router.post(
  "/requests",
  authenticate,
  checkRole(["seller", "landlord", "buyer", "renter", "user"]),
  async (req, res) => {
    try {
      const { property_data, notes } = req.body;
      const userId = req.user.id;
      
      if (!property_data || typeof property_data !== 'object') {
        return res.status(400).json({
          success: false,
          message: "Property data is required"
        });
      }
      
      // Save property request to database
      const [result] = await pool.execute(
        `INSERT INTO property_requests 
         (user_id, property_data, notes, created_at, updated_at) 
         VALUES (?, ?, ?, NOW(), NOW())`,
        [userId, JSON.stringify(property_data), notes || '']
      );
      
      res.status(201).json({
        success: true,
        message: "Property request submitted successfully. A broker will contact you soon.",
        data: {
          request_id: result.insertId,
          status: "pending"
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get my property requests
router.get(
  "/requests/my",
  authenticate,
  checkRole(["seller", "landlord", "buyer", "renter", "user"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const [requests] = await pool.execute(
        `SELECT pr.*, 
                u.first_name as assigned_broker_first_name,
                u.last_name as assigned_broker_last_name,
                u.email as assigned_broker_email
         FROM property_requests pr
         LEFT JOIN users u ON pr.assigned_broker_id = u.id
         WHERE pr.user_id = ?
         ORDER BY pr.created_at DESC`,
        [userId]
      );
      
      res.json({
        success: true,
        data: requests
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.post(
  "/requests/:id/upload-image",
  authenticate,
  checkRole(["seller", "landlord", "buyer", "renter", "user"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided"
        });
      }
      
      // Verify the request belongs to the user
      const [request] = await pool.execute(
        `SELECT * FROM property_requests WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      
      if (request.length === 0) {
        // Delete uploaded file since request doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: "Property request not found"
        });
      }
      
      const imageUrl = `/uploads/property-images/${req.file.filename}`;
      
      // Update property data with image URL
      const propertyData = JSON.parse(request[0].property_data || '{}');
      propertyData.property_image_url = imageUrl;
      
      // Update the property request
      await pool.execute(
        `UPDATE property_requests 
         SET property_data = ?, updated_at = NOW()
         WHERE id = ?`,
        [JSON.stringify(propertyData), id]
      );
      
      res.json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          image_url: imageUrl
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get pending property requests (for brokers)
router.get(
  "/requests/pending",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin", "super_admin"]),
  async (req, res) => {
    try {
      const [requests] = await pool.execute(
        `SELECT pr.*,
                u.first_name as requester_first_name,
                u.last_name as requester_last_name,
                u.email as requester_email,
                u.phone_number as requester_phone
         FROM property_requests pr
         JOIN users u ON pr.user_id = u.id
         WHERE pr.status = 'pending'
         ORDER BY pr.created_at DESC`
      );
      
      res.json({
        success: true,
        data: requests
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Assign property request to broker
router.post(
  "/requests/:id/assign",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin", "super_admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const brokerId = req.user.id;
      
      const [result] = await pool.execute(
        `UPDATE property_requests 
         SET assigned_broker_id = ?, 
             status = 'assigned',
             updated_at = NOW()
         WHERE id = ? AND status = 'pending'`,
        [brokerId, id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Request not found or already assigned"
        });
      }
      
      res.json({
        success: true,
        message: "Property request assigned to you"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ================= CRUD ROUTES (Brokers/Admins only) =================
router.post(
  "/",
  authenticate,
  canPostProperties,           // Only brokers/admins can post
  requireBrokerVerification,   // External brokers must be verified
  checkListingLimit,           // Tier-based limits
  upload.fields([
    { name: "images", maxCount: 20 },
    { name: "floor_plans", maxCount: 5 },
  ]),
  PropertyController.createProperty
);

// Premium property creation (additional checks)
router.post(
  "/premium",
  authenticate,
  canPostProperties,
  canPostPremium,             // Premium tier required
  checkListingLimit,
  upload.fields([
    { name: "images", maxCount: 20 },
    { name: "floor_plans", maxCount: 5 },
  ]),
  PropertyController.createProperty
);

router.put(
  "/:id",
  authenticate,
  canManageProperty,
  PropertyController.updateProperty
);

router.delete(
  "/:id",
  authenticate,
  canManageProperty,
  PropertyController.deleteProperty
);

router.patch(
  "/:id/price",
  authenticate,
  canManageProperty,
  PropertyController.updatePropertyPrice
);

// ================= ADMIN ROUTES =================
router.get(
  "/admin/all",
  authenticate,
  checkRole(["admin", "super_admin", "support_admin"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, status, search } = req.query;
      
      let whereClause = "1=1";
      const params = [];
      
      if (status && status !== "all") {
        whereClause += " AND property_status = ?";
        params.push(status);
      }
      
      if (search) {
        whereClause += " AND (title LIKE ? OR address LIKE ? OR city LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      // Count total
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM properties WHERE ${whereClause}`,
        params
      );
      
      const total = countResult[0].total;
      const offset = (page - 1) * limit;
      
      // Get properties
      const [properties] = await pool.execute(
        `SELECT * FROM properties 
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );
      
      res.json({
        success: true,
        data: {
          properties,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ================= PROPERTY STATISTICS =================
router.get(
  "/stats/summary",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin", "super_admin"]),
  async (req, res) => {
    try {
      const { user } = req;
      const { timeframe = "monthly" } = req.query;

      let stats;

      if (user.role.includes("broker")) {
        const [properties] = await pool.execute(
          `SELECT * FROM properties 
           WHERE assigned_broker_id = ? 
           AND deleted_at IS NULL`,
          [user.id]
        );

        stats = {
          totalListings: properties.length,
          activeListings: properties.filter(
            (p) => p.property_status === "active"
          ).length,
          pendingListings: properties.filter(
            (p) =>
              p.property_status === "pending" ||
              p.property_status === "pending_review" ||
              p.property_status === "draft"
          ).length,
          soldRented: properties.filter(
            (p) =>
              p.property_status === "sold" || p.property_status === "rented"
          ).length,
          totalValue: properties.reduce((sum, p) => sum + (p.price || 0), 0),
          averagePrice:
            properties.length > 0
              ? properties.reduce((sum, p) => sum + (p.price || 0), 0) /
              properties.length
              : 0,
          tier: user.privilege_tier || 'basic',
          listingLimit: user.role === 'external_broker' 
            ? (user.privilege_tier === 'basic' ? 3 : 
               user.privilege_tier === 'standard' ? 10 :
               user.privilege_tier === 'premium' ? 25 : 100)
            : (user.privilege_tier === 'basic' ? 10 :
               user.privilege_tier === 'standard' ? 50 :
               user.privilege_tier === 'premium' ? 200 : 1000)
        };
      } else if (user.role.includes("admin")) {
        const [properties] = await pool.execute(
          `SELECT * FROM properties WHERE deleted_at IS NULL`
        );

        stats = {
          totalListings: properties.length,
          activeListings: properties.filter(
            (p) => p.property_status === "active"
          ).length,
          pendingListings: properties.filter(
            (p) =>
              p.property_status === "pending" ||
              p.property_status === "pending_review" ||
              p.property_status === "draft"
          ).length,
          soldRented: properties.filter(
            (p) =>
              p.property_status === "sold" || p.property_status === "rented"
          ).length,
          totalValue: properties.reduce((sum, p) => sum + (p.price || 0), 0),
          averagePrice:
            properties.length > 0
              ? properties.reduce((sum, p) => sum + (p.price || 0), 0) /
              properties.length
              : 0,
          byType: {
            residential: properties.filter((p) =>
              ["house", "apartment", "condo", "townhouse", "villa", "penthouse", "cottage", "loft"].includes(
                p.property_type
              )
            ).length,
            commercial: properties.filter(
              (p) => p.property_type === "commercial"
            ).length,
            land: properties.filter((p) => p.property_type === "land").length,
          },
        };
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ================= BROKER VERIFICATION =================
// Verify external broker (admin only)
router.post(
  "/brokers/:id/verify",
  authenticate,
  checkRole(["admin", "super_admin", "support_admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      // Verify broker profile
      const [result] = await pool.execute(
        `UPDATE broker_profiles 
         SET is_verified = TRUE, 
             verified_at = NOW(),
             updated_at = NOW()
         WHERE user_id = ?`,
        [id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Broker profile not found"
        });
      }
      
      res.json({
        success: true,
        message: "Broker verified successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get broker verification status
router.get(
  "/brokers/:id/verification",
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Users can only check their own or admin can check any
      if (parseInt(id) !== userId && 
          !['admin', 'super_admin', 'support_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized"
        });
      }
      
      const [result] = await pool.execute(
        `SELECT is_verified, verified_at, created_at 
         FROM broker_profiles 
         WHERE user_id = ?`,
        [id]
      );
      
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Broker profile not found"
        });
      }
      
      res.json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

export default router;