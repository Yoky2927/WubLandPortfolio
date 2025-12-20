import express from 'express';
import { 
  sendVerificationEmail, 
  sendPasswordChangeEmail, 
  sendSecurityAlert,
  testEmailConnection,
  healthCheck
} from '../controllers/email.controller.js';

const router = express.Router();

// Middleware to verify internal service token for all email routes
const verifyServiceToken = (req, res, next) => {
  const token = req.headers['internal-service-token'] || req.headers['authorization'];
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN || 'communication-service-secret-12345';
  
  if (!token || token !== expectedToken) {
    console.warn('Unauthorized service token attempt');
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized service request' 
    });
  }
  next();
};

// Public test endpoint (no token required)
router.get('/test', testEmailConnection);
router.get('/health', healthCheck);

// Protected email endpoints (require internal service token)
router.post('/send-verification', verifyServiceToken, sendVerificationEmail);
router.post('/send-password-change', verifyServiceToken, sendPasswordChangeEmail);
router.post('/send-security-alert', verifyServiceToken, sendSecurityAlert);

export default router;