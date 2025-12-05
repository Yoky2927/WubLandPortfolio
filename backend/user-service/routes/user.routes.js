import express from 'express';
import { 
  verifyToken, 
  verifyAdmin, 
  verifySupportStaff 
} from '../middleware/auth.middleware.js';
import { 
  getAllUsers, 
  getUserById, 
  updateUserStatus, 
  deleteUser, 
  getSupportAgents,
  updateUserPrivileges,
  updateUserRole,
  getUserCounts
} from '../controllers/user.controller.js';

const router = express.Router();

// Add a health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'user-service' });
});

// ============ ADMIN-ONLY ROUTES ============
router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.get('/counts', verifyToken, verifyAdmin, getUserCounts);
router.get('/:id', verifyToken, verifyAdmin, getUserById);
router.put('/:id/status', verifyToken, verifyAdmin, updateUserStatus);
router.put('/:id/role', verifyToken, verifyAdmin, updateUserRole);
router.put('/:id/privileges', verifyToken, verifyAdmin, updateUserPrivileges);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

// ============ SUPPORT STAFF ROUTES ============
router.get('/support/agents', verifyToken, verifySupportStaff, getSupportAgents);

export default router;