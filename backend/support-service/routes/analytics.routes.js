import express from 'express';
import { getSupportAnalytics } from '../controllers/analytics.controller.js';
import { authenticateToken, requireSupportAgent } from '../middleware/auth.middleware.js';

const router = express.Router();

// Support analytics endpoint
router.get('/analytics', authenticateToken, requireSupportAgent, getSupportAnalytics);

export default router;