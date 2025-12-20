// routes/propertyImage.routes.js - UPDATED VERSION
import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middlewares/auth.middleware.js';
import { checkRole, canManageProperty } from '../middlewares/role.middleware.js';
import PropertyImageController from '../controllers/propertyImage.controller.js';

const router = express.Router();

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

// File filter for floor plans (allow PDF and SVG too)
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const floorPlanUpload = multer({ 
  storage, 
  fileFilter: floorPlanFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get property images
router.get('/property/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const images = await PropertyImageController.getPropertyImages(id);
    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload property images (multiple)
router.post(
  '/property/:id/upload', 
  authenticate, 
  checkRole(['internal_broker', 'external_broker', 'admin', 'seller', 'landlord']),
  canManageProperty,
  imageUpload.array('images', 20), // Allow up to 20 images
  PropertyImageController.uploadImages
);

// Upload floor plan
router.post(
  '/property/:id/floor-plan',
  authenticate,
  checkRole(['internal_broker', 'external_broker', 'admin', 'seller', 'landlord']),
  canManageProperty,
  floorPlanUpload.single('floor_plan'),
  PropertyImageController.uploadFloorPlan
);

// Delete property image
router.delete(
  '/:imageId',
  authenticate,
  checkRole(['internal_broker', 'external_broker', 'admin', 'seller', 'landlord']),
  async (req, res) => {
    try {
      const { imageId } = req.params;
      const { propertyId } = req.body;
      
      if (!propertyId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Property ID is required' 
        });
      }
      
      // Verify user can manage this property
      await canManageProperty(req, res, async () => {
        const result = await PropertyImageController.deleteImage(imageId, req.user.id, propertyId);
        res.json({
          success: true,
          message: 'Image deleted successfully',
          data: result
        });
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Set primary image
router.patch(
  '/:imageId/set-primary',
  authenticate,
  checkRole(['internal_broker', 'external_broker', 'admin', 'seller', 'landlord']),
  async (req, res) => {
    try {
      const { imageId } = req.params;
      const { propertyId } = req.body;
      
      if (!propertyId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Property ID is required' 
        });
      }
      
      // Verify user can manage this property
      await canManageProperty(req, res, async () => {
        const result = await PropertyImageController.setPrimaryImage(imageId, propertyId);
        res.json({
          success: true,
          message: 'Primary image set successfully',
          data: result
        });
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get floor plans
router.get('/property/:id/floor-plans', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const floorPlans = await PropertyImageController.getFloorPlans(id);
    res.json({
      success: true,
      data: floorPlans
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;