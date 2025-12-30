// backend/property-service/routes/propertyDocument.routes.js - FIXED
import express from 'express';
import PropertyDocumentController from '../controllers/propertyDocument.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

console.log('✅ propertyDocument.routes.js loading...');

// ========== PUBLIC ROUTES ==========

// Get all documents for a property - PUBLIC (viewing only)
router.get('/:property_id/documents', PropertyDocumentController.getPropertyDocuments);

// Get single document - PUBLIC if document is public
router.get('/documents/:id', PropertyDocumentController.getDocumentById);

// ========== PROTECTED ROUTES ==========

// Document upload
router.post('/:property_id/documents',
  authenticate,
  upload.fields([{ name: 'document', maxCount: 1 }]),
  PropertyDocumentController.uploadDocument
);

// Get pending documents for broker review - PROTECTED
router.get('/documents/pending',
  authenticate,
  authorize(['internal_broker', 'external_broker', 'admin', 'super_admin']),
  PropertyDocumentController.getPendingDocuments
);

// Verify document - PROTECTED
router.patch('/documents/:id/verify',
  authenticate,
  authorize(['internal_broker', 'external_broker', 'admin', 'super_admin']),
  PropertyDocumentController.verifyDocument
);

// Update document metadata - PROTECTED
router.put('/documents/:id',
  authenticate,
  PropertyDocumentController.updateDocument
);

// Delete document - PROTECTED
router.delete('/documents/:id',
  authenticate,
  PropertyDocumentController.deleteDocument
);

console.log('✅ propertyDocument.routes.js loaded successfully');

export default router;