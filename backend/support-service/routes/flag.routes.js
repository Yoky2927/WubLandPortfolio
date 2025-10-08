import express from 'express';
import {
  getAllFlaggedContent,
  getFlagById,
  resolveFlag,
  assignFlag
} from '../controllers/flag.controller.js';
import { authenticateToken, requireSupportAgent, requireSupportLead } from '../middleware/auth.middleware.js';

const router = express.Router();

// All support staff can view flagged content
router.get('/', authenticateToken, requireSupportAgent, getAllFlaggedContent);
router.get('/:id', authenticateToken, requireSupportAgent, getFlagById);

// All support staff can resolve flags
router.put('/:id/resolve', authenticateToken, requireSupportAgent, resolveFlag);

// Only leads+ can assign flags to agents
router.put('/:id/assign', authenticateToken, requireSupportLead, assignFlag);

export default router;