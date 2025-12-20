import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import PropertyController from "../controllers/property.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  checkRole,
  canManageProperty,
} from "../middlewares/role.middleware.js";

const router = express.Router();

// Configure multer for property creation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create directory if it doesn't exist
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
  console.log("📄 File upload attempt:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  // Accept common image mime types
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "application/octet-stream", // ✅ Accept generic binary (some browsers send this)
  ];

  // Also check extensions as fallback
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

  console.log("📄 File check:", {
    ext,
    mimetype: file.mimetype,
    isValidMimeType,
    isValidExtension,
  });

  if (isValidMimeType || isValidExtension) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        `File type not allowed: ${file.mimetype} - ${
          file.originalname
        }. Allowed: ${allowedMimeTypes.join(", ")}`
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 25, // Max 25 files total
  },
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "property-service",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ================= PUBLIC ROUTES =================
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
  checkRole(["internal_broker", "external_broker"]),
  PropertyController.getBrokerListings
);

// Property action route (for broker actions - approve/reject/request_changes)
router.post(
  "/:id/action",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin"]),
  PropertyController.brokerUpdatePropertyStatus
);

// Property status update route (general status updates)
router.patch(
  "/:id/status",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin"]),
  PropertyController.updatePropertyStatusAction
);

// ================= ADMIN ROUTES =================
router.get(
  "/admin/all",
  authenticate,
  checkRole(["admin", "super_admin", "support_admin"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, status, search } = req.query;

      const filters = {};
      if (status && status !== "all") filters.property_status = status;
      if (search) filters.search = search;

      const result = await PropertyController.getAllProperties(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ================= CRUD ROUTES =================
// IMPORTANT: Add multer middleware to handle file uploads
router.post(
  "/",
  authenticate,
  checkRole([
    "internal_broker",
    "external_broker",
    "admin",
    "seller",
    "landlord",
  ]),
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
  checkRole(["admin", "super_admin"]),
  PropertyController.deleteProperty
);
router.patch(
  "/:id/price",
  authenticate,
  canManageProperty,
  PropertyController.updatePropertyPrice
);

// ================= BULK OPERATIONS =================
router.post(
  "/bulk/status",
  authenticate,
  checkRole(["admin", "super_admin"]),
  async (req, res) => {
    try {
      const { propertyIds, status, notes } = req.body;

      if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Property IDs array is required",
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const results = [];
      for (const propertyId of propertyIds) {
        try {
          const result = await PropertyController.updatePropertyStatusAction({
            params: { id: propertyId },
            body: { status, notes },
            user: req.user,
          });
          results.push({ propertyId, success: true, data: result });
        } catch (error) {
          results.push({ propertyId, success: false, error: error.message });
        }
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      res.json({
        success: true,
        message: `Updated ${successful} properties, ${failed} failed`,
        data: results,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ================= PROPERTY ANALYTICS =================
router.get(
  "/:id/analytics",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { timeframe = "monthly" } = req.query;

      const property = await PropertyController.getPropertyById({
        params: { id },
      });
      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Property not found",
        });
      }

      // In a real app, you'd fetch analytics from a separate service
      const analytics = {
        propertyId: id,
        views: {
          total: 150,
          last7Days: 45,
          last30Days: 120,
        },
        inquiries: {
          total: 25,
          pending: 3,
          responded: 22,
        },
        saves: 18,
        shares: 12,
        performance: {
          engagementRate: "15%",
          conversionRate: "8%",
        },
      };

      res.json({
        success: true,
        data: analytics,
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
  checkRole(["internal_broker", "external_broker", "admin"]),
  async (req, res) => {
    try {
      const { user } = req;
      const { timeframe = "monthly" } = req.query;

      let stats;

      if (user.role.includes("broker")) {
        // Broker-specific stats
        const brokerListings = await PropertyController.getBrokerListings({
          user,
          query: { limit: 1000 },
        });

        const properties = brokerListings.data?.properties || [];

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
        };
      } else if (user.role.includes("admin")) {
        // Admin stats (all properties)
        const allProperties = await PropertyController.getAllProperties({
          query: { limit: 1000 },
        });

        const properties = allProperties.data?.properties || [];

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
              ["house", "apartment", "condo", "townhouse"].includes(
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

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

export default router;
