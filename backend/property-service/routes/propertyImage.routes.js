// routes/propertyImage.routes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middlewares/auth.middleware.js';
import { checkRole, canManageProperty } from '../middlewares/role.middleware.js';

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

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get property images
router.get('/property/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Query database for property images
    res.json({
      success: true,
      data: [] // Return images from database
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload property image (protected route - brokers can manage)
router.post(
  '/property/:id/upload', 
  authenticate, 
  checkRole(['internal_broker', 'external_broker', 'admin']),
  canManageProperty,
  upload.array('images', 10), // Allow up to 10 images
  async (req, res) => {
    try {
      const { id } = req.params;
      const files = req.files;
      
      // Save image references to database
      const imageData = files.map(file => ({
        property_id: id,
        image_url: `/uploads/property-images/${file.filename}`,
        filename: file.filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
        is_primary: false, // You might want to handle primary image logic
        uploaded_by: req.user.id
      }));
      
      // Insert into database (pseudo-code)
      // await PropertyImageModel.bulkCreate(imageData);
      
      res.json({
        success: true,
        message: `${files.length} images uploaded successfully`,
        data: imageData
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Delete property image
router.delete(
  '/:imageId', 
  authenticate, 
  checkRole(['internal_broker', 'external_broker', 'admin']),
  canManageProperty,
  async (req, res) => {
    try {
      const { imageId } = req.params;
      const { propertyId } = req.body; // Or from query params
      
      // Delete image from database and file system
      // await PropertyImageModel.delete(imageId, propertyId);
      
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;