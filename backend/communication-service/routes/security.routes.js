import express from 'express';
import SecurityController from '../controllers/security.controller.js';

const router = express.Router();

// Security monitoring endpoints
router.post('/brute-force-alert', SecurityController.handleBruteForceAttempt);
router.post('/sql-injection-alert', SecurityController.handleSQLInjectionAttempt);
router.post('/unauthorized-access', SecurityController.handleUnauthorizedAccess);
router.post('/ddos-alert', SecurityController.handleDDoSAttempt);

export default router;