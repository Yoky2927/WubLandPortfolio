import express from 'express';
import { verifyToken, verifyAdmin, verifySupportStaff } from '../middleware/auth.middleware.js'; // ADD verifySupportStaff
import { getAllUsers, getUserById, updateUserStatus, deleteUser, getSupportAgents } from '../controllers/user.controller.js'; // ADD getSupportAgents

const router = express.Router();

// Admin-only routes for user management
router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.get('/:id', verifyToken, verifyAdmin, getUserById);
router.put('/:id/status', verifyToken, verifyAdmin, updateUserStatus);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

// NEW: Support staff can get list of support agents
router.get('/support/agents', verifyToken, verifySupportStaff, getSupportAgents);

export default router;