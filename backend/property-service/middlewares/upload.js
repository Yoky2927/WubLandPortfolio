// backend/property-service/middleware/upload.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage configuration for property images
const propertyImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/property-images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `property-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for property documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/documents'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `document-${uniqueSuffix}${ext}`);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
  }
};

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt|rtf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (pdf, doc, docx, txt, rtf)'));
  }
};

// Create multer instances
const propertyImageUpload = multer({
  storage: propertyImageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const documentUpload = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for documents
});

// Combined upload middleware
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'images' || file.fieldname === 'image') {
        cb(null, path.join(__dirname, '../uploads/property-images'));
      } else if (file.fieldname === 'document') {
        cb(null, path.join(__dirname, '../uploads/documents'));
      } else if (file.fieldname === 'floor_plans') {
        cb(null, path.join(__dirname, '../uploads/floor-plans'));
      } else {
        cb(null, path.join(__dirname, '../uploads/images'));
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const prefix = file.fieldname === 'document' ? 'document' : 'property';
      cb(null, `${prefix}-${uniqueSuffix}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Check file type based on fieldname
    if (file.fieldname === 'images' || file.fieldname === 'image' || file.fieldname === 'floor_plans') {
      const allowedTypes = /jpeg|jpg|png|webp|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
      }
    } else if (file.fieldname === 'document') {
      const allowedTypes = /pdf|doc|docx|txt|rtf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Only document files are allowed (pdf, doc, docx, txt, rtf)'));
      }
    } else {
      cb(new Error('Invalid file field'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  }
});

export default upload;
export { propertyImageUpload, documentUpload };