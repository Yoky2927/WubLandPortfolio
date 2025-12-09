// communication-service/controllers/roleNotification.controller.js
import RoleNotifications from '../services/roleNotifications.js';

// List of valid roles from your database schema
const VALID_ROLES = [
  'super_admin', 'admin', 'support_admin', 'support_lead', 'support_agent',
  'internal_broker', 'external_broker', 'buyer', 'seller', 'landlord', 'renter', 'user'
];

// List of valid notification types from your database schema
const VALID_NOTIFICATION_TYPES = [
  'info', 'success', 'warning', 'error', 'system', 
  'transaction', 'property', 'message', 'appointment', 'reminder'
];

class RoleNotificationController {
  // Internal endpoint for other services to send role-based notifications
  async sendNotificationByRole(req, res) {
    try {
      const { roles, notificationData } = req.body;

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Roles array is required'
        });
      }

      // Validate roles
      const invalidRoles = roles.filter(role => !VALID_ROLES.includes(role));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid role(s): ${invalidRoles.join(', ')}. Valid roles are: ${VALID_ROLES.join(', ')}`
        });
      }

      if (!notificationData || !notificationData.title || !notificationData.message) {
        return res.status(400).json({
          success: false,
          message: 'Notification title and message are required'
        });
      }

      // Validate notification type if provided
      if (notificationData.type && !VALID_NOTIFICATION_TYPES.includes(notificationData.type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid notification type: ${notificationData.type}. Valid types are: ${VALID_NOTIFICATION_TYPES.join(', ')}`
        });
      }

      // Ensure notification type is set
      if (!notificationData.type) {
        notificationData.type = 'info';
      }

      const result = await RoleNotifications.notifyUsersByRole(roles, notificationData);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error sending notification by role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notifications'
      });
    }
  }

  // Send to all admins and support
  async sendToAdmins(req, res) {
    try {
      const { notificationData } = req.body;

      if (!notificationData || !notificationData.title || !notificationData.message) {
        return res.status(400).json({
          success: false,
          message: 'Notification title and message are required'
        });
      }

      // Ensure notification type is set
      if (!notificationData.type) {
        notificationData.type = 'system'; // Default for admin notifications
      }

      const result = await RoleNotifications.notifyAdminsAndSupport(notificationData);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error sending to admins:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notifications'
      });
    }
  }

  // Send to all brokers
  async sendToBrokers(req, res) {
    try {
      const { brokerType, notificationData } = req.body;

      if (!notificationData || !notificationData.title || !notificationData.message) {
        return res.status(400).json({
          success: false,
          message: 'Notification title and message are required'
        });
      }

      // Validate broker type if provided
      if (brokerType && !['internal', 'external'].includes(brokerType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid broker type: ${brokerType}. Valid types are: internal, external`
        });
      }

      // Ensure notification type is set
      if (!notificationData.type) {
        notificationData.type = 'info'; // Default for broker notifications
      }

      const result = await RoleNotifications.notifyAllBrokers(notificationData, brokerType);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error sending to brokers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notifications'
      });
    }
  }

  // Specific notification endpoints - set default types
  async sendSecurityAlert(req, res) {
    try {
      // Set default type for security alerts
      req.body.notificationData = req.body.notificationData || {};
      req.body.notificationData.type = 'system';
      req.body.notificationData.priority = 'high';
      
      const result = await RoleNotifications.sendSecurityAlert(req.body);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error sending security alert:', error);
      res.status(500).json({ success: false, message: 'Failed to send security alert' });
    }
  }

  async sendNewBrokerApplication(req, res) {
    try {
      // Set default type for broker applications
      req.body.notificationData = req.body.notificationData || {};
      req.body.notificationData.type = 'info';
      
      const result = await RoleNotifications.notifyNewBrokerApplication(req.body);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error sending broker application notification:', error);
      res.status(500).json({ success: false, message: 'Failed to send notification' });
    }
  }

  async sendContentFlag(req, res) {
    try {
      // Set default type for content flags
      req.body.notificationData = req.body.notificationData || {};
      req.body.notificationData.type = 'warning';
      
      const result = await RoleNotifications.notifyContentFlag(req.body);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error sending content flag:', error);
      res.status(500).json({ success: false, message: 'Failed to send content flag' });
    }
  }

  async sendPaymentIssue(req, res) {
    try {
      // Set default type for payment issues
      req.body.notificationData = req.body.notificationData || {};
      req.body.notificationData.type = 'error';
      
      const result = await RoleNotifications.notifyPaymentIssue(req.body);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error sending payment issue:', error);
      res.status(500).json({ success: false, message: 'Failed to send payment issue' });
    }
  }

  async sendNewSupportTicket(req, res) {
    try {
      // Set default type for support tickets
      req.body.notificationData = req.body.notificationData || {};
      req.body.notificationData.type = 'info';
      
      const result = await RoleNotifications.notifyNewSupportTicket(req.body);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error sending support ticket:', error);
      res.status(500).json({ success: false, message: 'Failed to send support ticket' });
    }
  }
}

export default new RoleNotificationController();