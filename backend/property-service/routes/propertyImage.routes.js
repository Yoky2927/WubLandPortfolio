// backend/property-service/routes/propertyImage.routes.js - FIXED
import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middlewares/auth.middleware.js';
import { checkRole, canManageProperty } from '../middlewares/role.middleware.js';
import PropertyImageController from '../controllers/propertyImage.controller.js';

const router = express.Router();

console.log('✅ propertyImage.routes.js loading...');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/property-images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `property-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// File filter for floor plans
const floorPlanFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image, PDF, and SVG files are allowed for floor plans'));
  }
};

// Upload configurations
const imageUpload = multer({ 
  storage, 
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const floorPlanUpload = multer({ 
  storage, 
  fileFilter: floorPlanFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ========== PUBLIC ROUTES (NO AUTH) ==========

// Get property images - PUBLIC
router.get('/property/:id', PropertyImageController.getPropertyImages);

// Get floor plans - PUBLIC  
router.get('/property/:id/floor-plans', PropertyImageController.getFloorPlans);

// ========== PROTECTED ROUTES (REQUIRE AUTH) ==========

// Upload property images - PROTECTED
router.post(
  '/property/:id/upload', 
  authenticate,
  checkRole(['internal_broker', 'external_broker', 'admin', 'seller', 'landlord']),
  canManageProperty,
  imageUpload.array('images', 20),
  PropertyImageController.uploadImages
);

// Upload floor plan - PROTECTED
router.post(
  '/property/:id/floor-plan',
  authenticate,
  checkRole(['internal_broker', 'external_broker', 'admin', 'seller', 'landlord']),
  canManageProperty,
  floorPlanUpload.single('floor_plan'),
  PropertyImageController.uploadFloorPlan
);

// Delete property image - PROTECTED
router.delete(
  '/:imageId',
  authenticate,
  checkRole(['internal_broker', 'external_broker', 'admin', 'seller', 'landlord']),
  async (req, res, next) => {
    try {
      const { propertyId } = req.body;
      if (!propertyId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Property ID is required' 
        });
      }
      await PropertyImageController.deleteImage(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Set primary image - PROTECTED
router.patch(
  '/:imageId/set-primary',
  authenticate,
  checkRole(['internal_broker', 'external_broker', 'admin', 'seller', 'landlord']),
  async (req, res, next) => {
    try {
      const { propertyId } = req.body;
      if (!propertyId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Property ID is required' 
        });
      }
      await PropertyImageController.setPrimaryImage(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

console.log('✅ propertyImage.routes.js loaded successfully');

export default router;