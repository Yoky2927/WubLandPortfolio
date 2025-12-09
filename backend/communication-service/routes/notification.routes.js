import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(verifyToken);

// Get notifications
router.get('/', NotificationController.getNotifications);

// Get unread count
router.get('/unread-count', NotificationController.getUnreadCount);

// Get notification statistics
router.get('/stats', NotificationController.getStats);

// Mark notification as read
router.put('/:notificationId/read', NotificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', NotificationController.markAllAsRead);

// Archive notification
router.put('/:notificationId/archive', NotificationController.archiveNotification);

// Delete notification
router.delete('/:notificationId', NotificationController.deleteNotification);

export default router;