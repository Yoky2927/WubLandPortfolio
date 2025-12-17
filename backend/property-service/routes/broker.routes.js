// routes/broker.routes.js
import express from 'express';
import PropertyController from '../controllers/property.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// Broker-specific property routes
router.get(
  '/properties', 
  authenticate, 
  checkRole(['internal_broker', 'external_broker']), 
  PropertyController.getBrokerListings
);

// Add other broker-specific endpoints here

export default router;