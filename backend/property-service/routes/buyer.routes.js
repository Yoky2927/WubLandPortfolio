// backend/property-service/routes/buyer.routes.js - FIXED VERSION
import express from 'express';
import BuyerController from '../controllers/buyerController.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

console.log('✅ Buyer routes loading...');

// Debug: Check if BuyerController has all methods
console.log('🔍 BuyerController methods:', Object.keys(BuyerController));
console.log('🔍 getSavedProperties type:', typeof BuyerController.getSavedProperties);
console.log('🔍 toggleSaveProperty type:', typeof BuyerController.toggleSaveProperty);
console.log('🔍 getRecommendedProperties type:', typeof BuyerController.getRecommendedProperties);
console.log('🔍 trackPropertyView type:', typeof BuyerController.trackPropertyView);
console.log('🔍 checkSavedStatus type:', typeof BuyerController.checkSavedStatus);
console.log('🔍 getPropertyStats type:', typeof BuyerController.getPropertyStats);

// All routes require authentication
router.use(authenticate);

// Get saved properties
router.get('/saved-properties', BuyerController.getSavedProperties);

// Save/unsave property
router.post('/properties/:propertyId/save', BuyerController.toggleSaveProperty);

// Get recommended properties
router.get('/recommended-properties', BuyerController.getRecommendedProperties);

// Track property view
router.post('/properties/:propertyId/view', BuyerController.trackPropertyView);

// Check if property is saved
router.get('/properties/:propertyId/saved', BuyerController.checkSavedStatus);

// Add DELETE endpoint for unsaving
router.delete('/properties/:propertyId/save', BuyerController.toggleSaveProperty);

// Get property stats
router.get('/properties/:propertyId/stats', BuyerController.getPropertyStats);

console.log('✅ Buyer routes loaded successfully');

export default router;