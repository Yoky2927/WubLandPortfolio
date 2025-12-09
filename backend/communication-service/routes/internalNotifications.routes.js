// communication-service/routes/internalNotifications.routes.js
import express from 'express';
import RoleNotificationController from '../controllers/roleNotification.controller.js';
// Import from the correct file - internalAuth.middleware.js NOT auth.middleware.js
import { verifyInternalToken } from '../middleware/internalAuth.middleware.js';

const router = express.Router();

// Verify internal token for all routes (other services)
router.use(verifyInternalToken);

// General role-based notification
router.post('/send-by-role', RoleNotificationController.sendNotificationByRole);

// Specific target groups
router.post('/send-to-admins', RoleNotificationController.sendToAdmins);
router.post('/send-to-brokers', RoleNotificationController.sendToBrokers);

// Specific notification types
router.post('/security-alert', RoleNotificationController.sendSecurityAlert);
router.post('/new-broker-application', RoleNotificationController.sendNewBrokerApplication);
router.post('/content-flag', RoleNotificationController.sendContentFlag);
router.post('/payment-issue', RoleNotificationController.sendPaymentIssue);
router.post('/new-support-ticket', RoleNotificationController.sendNewSupportTicket);

export default router;