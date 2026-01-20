// backend/user-service/routes/document-verification.routes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  getUserVerificationStatus,
  uploadVerificationDocument,
  getDocumentsForUser,
  getCurrentUserDocuments, // ADD THIS IMPORT
  reviewDocument,
  completeUserVerification,
  getPendingVerifications,
  getVerificationStats,
  rejectWithFeedback,
  requestResubmission,
  getVerificationHistory,
  getVerificationStatusById,
  updateVerificationStep,
  getVerifiedUsers,
  getRejectedUsers,
  reviewIndividualDocument,
  getDocumentFeedback
} from '../controllers/document-verification.controller.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for verification documents - FIXED VERSION
const uploadVerificationDoc = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '../Uploads/verification-documents');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const userId = req.user?.id || 'unknown';
      const timestamp = Date.now();
      const originalName = path.parse(file.originalname).name;
      const ext = path.extname(file.originalname);
      const safeName = `${userId}_${timestamp}_${originalName}${ext}`.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, safeName);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, PDF, and document files are allowed'));
    }
  }
});
const handleUpload = (req, res, next) => {
  // Check if request is JSON (not FormData)
  const contentType = req.headers['content-type'];
  if (contentType && contentType.includes('application/json')) {
    // Skip multer for JSON requests
    console.log("📝 JSON request detected, skipping multer");
    return next();
  }
  // Use multer for FormData requests
  console.log("📝 FormData request detected, using multer");
  uploadVerificationDoc.single('document')(req, res, next);
};

// User routes (requires authentication)
router.get('/status', verifyToken, getUserVerificationStatus);

// NEW: Get current user's documents
router.get('/documents/my', verifyToken, getCurrentUserDocuments);

// Get documents for a specific user (admin or user themselves)
router.get('/documents/user/:userId', verifyToken, getDocumentsForUser);

// Single route that handles both JSON and FormData
router.post('/documents/upload', verifyToken, handleUpload, uploadVerificationDocument);


export const uploadTimeoutMiddleware = (req, res, next) => {
  // Only apply timeout to upload routes
  if (req.path.includes('/documents/upload')) {
    const timeout = 30000; // 30 seconds

    // Set timeout
    req.setTimeout(timeout, () => {
      if (!res.headersSent) {
        console.warn(`⚠️ Upload timeout for ${req.path}`);
        // Don't send response here to avoid "Can't set headers after they are sent"
      }
    });

    // Handle request completion
    const originalEnd = res.end;
    res.end = function (...args) {
      clearTimeout(req.uploadTimeout);
      originalEnd.apply(this, args);
    };

    // Set a timer that will send timeout response
    req.uploadTimeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: "Upload timeout. Please try again with a smaller file.",
          code: 'UPLOAD_TIMEOUT'
        });
      }
    }, timeout);
  }

  next();
};

// In your routes file, use it like this:
router.post('/documents/upload',
  verifyToken,
  uploadTimeoutMiddleware,
  handleUpload,
  uploadVerificationDocument
);


// Admin routes (requires admin role)
router.get('/admin/pending', verifyToken, verifyAdmin, getPendingVerifications);
router.post('/admin/document/:documentId/review', verifyToken, verifyAdmin, reviewDocument);
router.post('/admin/user/:userId/verify', verifyToken, verifyAdmin, completeUserVerification);
router.get('/admin/stats', verifyToken, verifyAdmin, getVerificationStats);
// Individual document review (for document-level feedback)
router.post('/admin/document/:documentId/review-individual', verifyToken, verifyAdmin, reviewIndividualDocument);

// NEW: Feedback and status routes
router.post('/reject/:userId', verifyToken, verifyAdmin, rejectWithFeedback);
router.post('/request-resubmission/:userId', verifyToken, verifyAdmin, requestResubmission);
router.get('/history/:userId', verifyToken, verifyAdmin, getVerificationHistory);
router.get('/status/:userId', verifyToken, verifyAdmin, getVerificationStatusById);
router.post('/update-step/:userId', verifyToken, verifyAdmin, updateVerificationStep);
router.get('/documents/:documentId/feedback', verifyToken, getDocumentFeedback);

// NEW: Filtered user lists
router.get('/admin/verified', verifyToken, verifyAdmin, getVerifiedUsers);
router.get('/admin/rejected', verifyToken, verifyAdmin, getRejectedUsers);

export default router;