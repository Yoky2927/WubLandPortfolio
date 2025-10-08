import express from 'express';
import {
  getAllTickets,
  getTicketById,
  respondToTicket,
  updateTicketStatus
} from '../controllers/ticket.controller.js';
import { authenticateToken, requireSupportAgent, requireSupportLead } from '../middleware/auth.middleware.js';

const router = express.Router();

// All support staff can view tickets
router.get('/', authenticateToken, requireSupportAgent, getAllTickets);
router.get('/:id', authenticateToken, requireSupportAgent, getTicketById);

// All support staff can respond to tickets
router.post('/:id/respond', authenticateToken, requireSupportAgent, respondToTicket);

// Only leads+ can update ticket status
router.put('/:id/status', authenticateToken, requireSupportLead, updateTicketStatus);

export default router;