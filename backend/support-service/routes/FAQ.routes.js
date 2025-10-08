import express from 'express';
import {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  markHelpful
} from '../controllers/FAQ.controller.js';
import { authenticateToken, requireSupportAgent, requireSupportLead } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (no auth required for viewing)
router.get('/', getAllFAQs);
router.get('/:id', getFAQById);
router.post('/:id/helpful', markHelpful);

// Protected routes - only support staff can manage FAQs
router.post('/', authenticateToken, requireSupportAgent, createFAQ);
router.put('/:id', authenticateToken, requireSupportAgent, updateFAQ);
router.delete('/:id', authenticateToken, requireSupportLead, deleteFAQ);

export default router;