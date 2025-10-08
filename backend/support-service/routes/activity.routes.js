import express from 'express';
import {
  getRecentActivities,
  getAgentActivities,
  getAllFeedback,
  getAgentFeedback
} from '../controllers/activity.controller.js';
import { authenticateToken, requireSupportAgent, requireSupportLead } from '../middleware/auth.middleware.js';

const router = express.Router();

// All support staff can view recent activities
router.get('/activities', authenticateToken, requireSupportAgent, getRecentActivities);

// All support staff can view their own activities
router.get('/activities/:username', authenticateToken, requireSupportAgent, getAgentActivities);

// Only leads+ can view all feedback
router.get('/feedback', authenticateToken, requireSupportLead, getAllFeedback);

// Support staff can view feedback for specific agents
router.get('/feedback/:username', authenticateToken, requireSupportAgent, getAgentFeedback);

export default router;