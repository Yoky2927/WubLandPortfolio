import express from 'express';
import {
  getAllReviews,
  getAgentReviews,
  createReview
} from '../controllers/review.controller.js';
import { authenticateToken, requireSupportAgent } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireSupportAgent, getAllReviews);
router.get('/:username', authenticateToken, requireSupportAgent, getAgentReviews);
router.post('/', authenticateToken, requireSupportAgent, createReview);

export default router;