// communication-service/services/roleNotifications.js
import NotificationModel from '../models/notification.model.js';
import { User } from '../models/user.model.js';
import { emitNotification } from '../utils/socket.js';

class RoleNotifications {
  // Helper function to create notification data
  async createNotificationForUser(user, notificationData, customTitle = null, customMessage = null) {
    const notification = {
      userId: user.id,
      title: customTitle || notificationData.title,
      message: customMessage || notificationData.message,
      type: notificationData.type || 'info',
      actionUrl: notificationData.actionUrl,
      icon: notificationData.icon,
      relatedEntityType: notificationData.relatedEntityType,
      relatedEntityId: notificationData.relatedEntityId,
      priority: notificationData.priority || 'medium',
      expiresAt: notificationData.expiresAt,
      deliveryMethods: notificationData.deliveryMethods || ['in_app']
    };

    const notificationId = await NotificationModel.createNotification(notification);
    
    // Emit real-time notification
    emitNotification(user.id, {
      id: notificationId,
      ...notification,
      createdAt: new Date().toISOString()
    });

    return notificationId;
  }

  // Notify users by role
  async notifyUsersByRole(roles, notificationData) {
    try {
      const users = await User.findByRoles(roles);
      
      if (users.length === 0) {
        return {
          message: 'No users found with the specified roles',
          count: 0,
          recipients: []
        };
      }

      const notificationIds = [];
      
      for (const user of users) {
        const notificationId = await this.createNotificationForUser(user, notificationData);
        notificationIds.push(notificationId);
      }

      return {
        message: `Sent ${notificationIds.length} of ${users.length} notifications`,
        count: notificationIds.length,
        recipients: users.map(u => ({ id: u.id, name: u.full_name, role: u.role }))
      };
    } catch (error) {
      console.error('Error in notifyUsersByRole:', error);
      throw error;
    }
  }

  // Notify admins and support staff
  async notifyAdminsAndSupport(notificationData) {
    const users = await User.findAdminsAndSupport();
    
    const notificationIds = [];
    
    for (const user of users) {
      const notificationId = await this.createNotificationForUser(user, notificationData);
      notificationIds.push(notificationId);
    }

    return {
      message: `Sent ${notificationIds.length} of ${users.length} notifications`,
      count: notificationIds.length,
      recipients: users.map(u => ({ id: u.id, name: u.full_name, role: u.role }))
    };
  }

  // Notify all brokers (with optional type filter)
  async notifyAllBrokers(notificationData, brokerType = null) {
    const users = await User.findBrokers(brokerType);
    
    const notificationIds = [];
    
    for (const user of users) {
      const notificationId = await this.createNotificationForUser(user, notificationData);
      notificationIds.push(notificationId);
    }

    return {
      message: `Sent ${notificationIds.length} notifications to brokers${brokerType ? ` (${brokerType})` : ''}`,
      count: notificationIds.length,
      recipients: users.map(u => ({ id: u.id, name: u.full_name, role: u.role, brokerType: u.broker_type }))
    };
  }

  // Specific notification types
  async sendSecurityAlert(data) {
    const notificationData = {
      title: `Security Alert: ${data.type || 'Security Incident'}`,
      message: data.details || 'A security incident has been detected',
      type: 'system',
      priority: data.severity || 'high',
      actionUrl: '/admin/security',
      icon: 'security'
    };

    return this.notifyAdminsAndSupport(notificationData);
  }

  async notifyNewBrokerApplication(data) {
    const notificationData = {
      title: 'New Broker Application',
      message: `${data.applicantName} has applied to become a broker. Application ID: ${data.applicationId}`,
      type: 'info',
      priority: 'medium',
      actionUrl: `/admin/broker-applications/${data.applicationId}`,
      icon: 'person_add'
    };

    return this.notifyAdminsAndSupport(notificationData);
  }

  async notifyContentFlag(data) {
    const notificationData = {
      title: `Content Flagged: ${data.entityType || 'Content'}`,
      message: `${data.flaggedBy} flagged content for: ${data.reason}`,
      type: 'warning',
      priority: data.severity || 'medium',
      actionUrl: `/admin/flagged-content/${data.listingId}`,
      icon: 'flag'
    };

    return this.notifyAdminsAndSupport(notificationData);
  }

  async notifyPaymentIssue(data) {
    const notificationData = {
      title: `Payment Issue: ${data.type || 'Transaction'}`,
      message: `Payment failed for ${data.type}: ${data.error}`,
      type: 'error',
      priority: 'high',
      actionUrl: `/admin/payments/${data.transactionId}`,
      icon: 'payment'
    };

    // Also notify the affected user if userId is provided
    if (data.userId) {
      const user = await User.findById(data.userId);
      if (user) {
        const userNotification = {
          title: 'Payment Issue',
          message: `Your ${data.type} payment of ${data.amount} failed: ${data.error}`,
          type: 'error',
          priority: 'high',
          actionUrl: `/payments/${data.transactionId}`,
          icon: 'payment'
        };
        
        await this.createNotificationForUser(user, userNotification);
      }
    }

    return this.notifyAdminsAndSupport(notificationData);
  }

  async notifyNewSupportTicket(data) {
    const notificationData = {
      title: `New Support Ticket: ${data.ticketId}`,
      message: `${data.userName || 'A user'} has submitted a support ticket: ${data.issue}`,
      type: 'info',
      priority: 'medium',
      actionUrl: `/support/tickets/${data.ticketId}`,
      icon: 'support'
    };

    // Send to support agents
    const users = await User.findByRole('support_agent');
    
    const notificationIds = [];
    
    for (const user of users) {
      const notificationId = await this.createNotificationForUser(user, notificationData);
      notificationIds.push(notificationId);
    }

    return {
      message: `Sent ${notificationIds.length} notifications for new support ticket`,
      count: notificationIds.length,
      recipients: users.map(u => ({ id: u.id, name: u.full_name, role: u.role }))
    };
  }
}

export default new RoleNotifications();