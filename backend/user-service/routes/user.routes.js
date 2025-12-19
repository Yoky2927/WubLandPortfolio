import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';
import { getAllUsers, getUserById, updateUserStatus, deleteUser } from '../controllers/user.controller.js';

const router = express.Router();

// Admin-only routes for user management
router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.get('/:id', verifyToken, verifyAdmin, getUserById);
router.put('/:id/status', verifyToken, verifyAdmin, updateUserStatus);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

export default router;