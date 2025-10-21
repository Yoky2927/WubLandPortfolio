import express from 'express';
import {
  getAllPendingVerifications,
  submitVerificationRequest,
  getBrokerVerificationStatus,
  reviewVerificationRequest,
  updateBrokerStatus,
  getBrokerAnalytics
} from '../controllers/broker.controller.js';
import { authenticateToken, requireSupportAgent, requireSupportLead, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Broker routes (for brokers themselves)
router.post('/verification/request', authenticateToken, submitVerificationRequest);
router.get('/verification/status', authenticateToken, getBrokerVerificationStatus);

// Admin/Support routes
router.get('/verification/pending', authenticateToken, requireSupportAgent, getAllPendingVerifications);
router.post('/verification/review', authenticateToken, requireSupportLead, reviewVerificationRequest);
router.put('/status', authenticateToken, requireAdmin, updateBrokerStatus);
router.get('/analytics', authenticateToken, requireSupportLead, getBrokerAnalytics);

export default router;