import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { verifyInternalToken } from '../middleware/internalAuth.middleware.js'; // Add this line

const router = express.Router();

// External API (for frontend) - requires user authentication
router.use(verifyToken);

// Get notifications
router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/stats', NotificationController.getStats);
router.put('/:notificationId/read', NotificationController.markAsRead);
router.put('/mark-all-read', NotificationController.markAllAsRead);
router.put('/:notificationId/archive', NotificationController.archiveNotification);
router.delete('/:notificationId', NotificationController.deleteNotification);
router.post('/trigger', NotificationController.triggerNotification);

// ========== INTERNAL API (for other services) ==========
// Add a route for internal services to create notifications
router.post('/create', verifyInternalToken, async (req, res) => {
    try {
        const {
            userId,
            title,
            message,
            type = 'info',
            actionUrl = null,
            icon = null,
            relatedEntityType = null,
            relatedEntityId = null,
            priority = 'medium',
            expiresAt = null,
            deliveryMethods = ['in_app']
        } = req.body;

        // Validate required fields
        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'userId, title, and message are required'
            });
        }

        // Import NotificationModel
        const NotificationModel = await import('../models/notification.model.js').then(mod => mod.default);
        
        // Create notification
        const notificationId = await NotificationModel.createNotification({
            userId,
            title,
            message,
            type,
            actionUrl,
            icon,
            relatedEntityType,
            relatedEntityId,
            priority,
            expiresAt,
            deliveryMethods
        });

        // Get the created notification
        const notifications = await NotificationModel.getUserNotifications(userId, {
            limit: 1,
            offset: 0
        });
        
        const notification = notifications.find(n => n.id === notificationId);

        // Send real-time notification
        const { emitNotification } = await import('../utils/socket.js');
        if (typeof emitNotification === 'function') {
            emitNotification(userId, notification);
        }

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            notification
        });

    } catch (error) {
        console.error('Error creating notification via internal API:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification'
        });
    }
});

export default router;