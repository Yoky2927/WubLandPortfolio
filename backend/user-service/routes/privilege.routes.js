// user-service/routes/privilege.routes.js
import express from 'express';
import { verifyToken  } from '../middleware/auth.middleware.js'; // Use protectRoute instead
import { 
  getUserPrivileges, 
  checkPermission, 
  getUserLimits,
  checkChatUpgrade,
  getPropertyPermissions
} from '../controllers/privilege.controller.js';

const router = express.Router();

// All privilege routes require authentication
router.use(verifyToken ); // Use protectRoute here

// Get complete privilege profile for current user
router.get('/profile', getUserPrivileges);

// Check specific permission
router.post('/check', checkPermission);

// Get user resource limits
router.get('/limits', getUserLimits);

// Check chat upgrade requirements
router.post('/chat/upgrade-check', checkChatUpgrade);

// Get property listing permissions
router.get('/property-permissions', getPropertyPermissions);

export default router;