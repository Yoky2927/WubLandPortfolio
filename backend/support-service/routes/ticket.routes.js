import express from 'express';
import {
  getAllTickets,
  getTicketById,
  respondToTicket,
  updateTicketStatus,
  createTicket,
  getMyTickets,
  assignTicketToAgent
} from '../controllers/ticket.controller.js';
import { authenticateToken, requireSupportAgent, requireSupportLead } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes - users can create tickets
router.post('/', authenticateToken, createTicket);
router.get('/my', authenticateToken, getMyTickets);

// Protected routes - only support staff
router.get('/', authenticateToken, requireSupportAgent, getAllTickets);
router.get('/:id', authenticateToken, requireSupportAgent, getTicketById);
router.post('/:id/respond', authenticateToken, requireSupportAgent, respondToTicket);
router.put('/:id/status', authenticateToken, requireSupportLead, updateTicketStatus);

// Assign ticket to agent (support leads only)
router.put('/:id/assign', authenticateToken, requireSupportLead, assignTicketToAgent);

export default router;