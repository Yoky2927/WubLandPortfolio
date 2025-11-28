// user-service/routes/brokers.routes.js
import express from 'express';
import {
  getBrokers,
  getBrokerDetails,
  createBrokerProfile,
  addBrokerReview
} from '../controllers/broker.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js'; // Fixed import

const router = express.Router();

// Public routes
router.get('/', getBrokers);
router.get('/:id', getBrokerDetails);

// Protected routes
router.post('/profile', authenticateToken, createBrokerProfile);
router.post('/reviews', authenticateToken, addBrokerReview);

export default router;