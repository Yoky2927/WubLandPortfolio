// user-service/routes/user.routes.js
import express from 'express';
import { 
  verifyToken, 
  verifyAdmin
} from '../middleware/auth.middleware.js';
import { 
  getAllUsers, 
  getUserById, 
  updateUserStatus, 
  deleteUser, 
  getSupportAgents,
  updateUserPrivileges,
  updateUserRole,
  getUserCounts,
  approveUserVerification,
  getUserDocuments,
  getVerificationStats,
  testVerificationNotification
} from '../controllers/user.controller.js';
import { getPendingVerifications } from '../controllers/document-verification.controller.js';

const router = express.Router();

// Debug: Log when routes file loads
console.log('✅ user.routes.js loaded');

// ============ HEALTH CHECK ============
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'user-service' });
});

// ============ TEST ENDPOINTS (for debugging) ============
// Add this to test if the router is working
router.get('/test', (req, res) => {
  console.log('✅ /api/users/test endpoint called');
  res.json({ 
    success: true, 
    message: 'User routes are working',
    timestamp: new Date().toISOString()
  });
});

router.get('/test-auth', verifyToken, (req, res) => {
  console.log('✅ /api/users/test-auth endpoint called');
  console.log('✅ req.user:', req.user);
  res.json({ 
    success: true, 
    message: 'Auth test passed',
    user: req.user
  });
});

// ============ SPECIFIC ROUTES FIRST ============
// These must come BEFORE parameterized routes like /:id
// Otherwise /pending-verifications would be caught by /:id

// Get verification stats - ADD THIS BEFORE PENDING VERIFICATIONS
router.get('/verification-stats', verifyToken, verifyAdmin, getVerificationStats);

// Get pending verifications
router.get('/pending-verifications', verifyToken, verifyAdmin, getPendingVerifications);

// Get support agents
router.get('/support/agents', verifyToken, verifyAdmin, getSupportAgents);

// Get user counts
router.get('/counts', verifyToken, verifyAdmin, getUserCounts);

// ============ PARAMETERIZED ROUTES LAST ============
// These come AFTER specific routes
// :id will NOT match 'pending-verifications' or 'support/agents' anymore

// Get all users
router.get('/', verifyToken, verifyAdmin, getAllUsers);

// Get user by ID
router.get('/:id', verifyToken, verifyAdmin, getUserById);

// Update user status
router.put('/:id/status', verifyToken, verifyAdmin, updateUserStatus);

// Update user role
router.put('/:id/role', verifyToken, verifyAdmin, updateUserRole);

// Update user privileges
router.put('/:id/privileges', verifyToken, verifyAdmin, updateUserPrivileges);

// Delete user
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

// ============ USER VERIFICATION ROUTES ============

// Approve/reject verification
router.put('/:id/verify', verifyToken, verifyAdmin, approveUserVerification);

// Get user documents
router.get('/:id/documents', verifyToken, verifyAdmin, getUserDocuments);

// ============ TEST NOTIFICATION ENDPOINT ============
router.get('/test-notification/:userId', verifyToken, verifyAdmin, testVerificationNotification);

// ============ ERROR HANDLER FOR TESTING ============
// Add this to catch any errors in the route chain
router.use((err, req, res, next) => {
  console.error('❌ Error in user routes:', err.message);
  console.error('❌ Error stack:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Route handler error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

export default router;