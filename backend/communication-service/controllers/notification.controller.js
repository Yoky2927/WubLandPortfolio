import NotificationModel from '../models/notification.model.js';
import { emitNotification } from '../utils/socket.js';

class NotificationController {
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { 
        limit = 50, 
        offset = 0,
        unreadOnly,
        archivedOnly,
        types
      } = req.query;

      const notifications = await NotificationModel.getUserNotifications(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        unreadOnly: unreadOnly === 'true',
        archivedOnly: archivedOnly === 'true',
        types: types ? types.split(',') : []
      });

      res.json({
        success: true,
        data: notifications,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch notifications' 
      });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await NotificationModel.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch unread count' 
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const success = await NotificationModel.markAsRead(notificationId, userId);

      if (success) {
        res.json({ success: true, message: 'Notification marked as read' });
      } else {
        res.status(404).json({ 
          success: false, 
          message: 'Notification not found' 
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to mark notification as read' 
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const count = await NotificationModel.markAllAsRead(userId);

      res.json({
        success: true,
        message: `Marked ${count} notifications as read`
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to mark all notifications as read' 
      });
    }
  }

  async archiveNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const success = await NotificationModel.archiveNotification(notificationId, userId);

      if (success) {
        res.json({ success: true, message: 'Notification archived' });
      } else {
        res.status(404).json({ 
          success: false, 
          message: 'Notification not found' 
        });
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to archive notification' 
      });
    }
  }

  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const success = await NotificationModel.deleteNotification(notificationId, userId);

      if (success) {
        res.json({ success: true, message: 'Notification deleted' });
      } else {
        res.status(404).json({ 
          success: false, 
          message: 'Notification not found' 
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete notification' 
      });
    }
  }

  async getStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await NotificationModel.getNotificationStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch notification stats' 
      });
    }
  }
}

export default new NotificationController();