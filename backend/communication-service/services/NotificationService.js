// communication-service/services/notificationService.js
import NotificationModel from '../models/notification.model.js';
// Import from utils folder instead
import { emitNotification } from '../utils/socket.js';

class NotificationService {
  async createNotification(data) {
    try {
      // Create notification in database
      const notificationId = await NotificationModel.createNotification(data);
      
      // Get the created notification
      const notifications = await NotificationModel.getUserNotifications(data.userId, {
        limit: 1,
        offset: 0
      });
      
      const notification = notifications.find(n => n.id === notificationId);
      
      if (!notification) {
        throw new Error('Failed to retrieve created notification');
      }

      // Send real-time notification via WebSocket
      await this.sendRealTimeNotification(data.userId, notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async sendRealTimeNotification(userId, notification) {
    try {
      // Use the socket function from your utils/socket.js
      if (typeof emitNotification === 'function') {
        emitNotification(userId, notification);
        return true;
      } else {
        console.log('Socket notification function not available');
        return false;
      }
    } catch (error) {
      console.error('Error sending real-time notification:', error);
      return false;
    }
  }

  // ... rest of your methods remain the same ...

  async notifyNewOffer(offerData) {
    const { propertyId, buyerId, sellerId, amount, brokerId } = offerData;

    // Notify seller
    await this.createNotification({
      userId: sellerId,
      title: 'New Offer Received',
      message: `You have received a new offer of ${amount} on your property.`,
      type: 'transaction',
      relatedEntityType: 'offer',
      relatedEntityId: propertyId,
      priority: 'high',
      actionUrl: `/offers/${propertyId}`
    });

    // Notify broker if assigned
    if (brokerId) {
      await this.createNotification({
        userId: brokerId,
        title: 'New Offer on Your Listing',
        message: `A new offer has been made on property #${propertyId}.`,
        type: 'transaction',
        relatedEntityType: 'offer',
        relatedEntityId: propertyId,
        priority: 'medium'
      });
    }
  }

  async notifyAppointmentReminder(appointmentData) {
    const { userId, title, startTime, propertyAddress } = appointmentData;

    await this.createNotification({
      userId,
      title: 'Appointment Reminder',
      message: `Your appointment "${title}" at ${propertyAddress} is scheduled for ${startTime}.`,
      type: 'reminder',
      relatedEntityType: 'appointment',
      relatedEntityId: appointmentData.id,
      priority: 'medium'
    });
  }

  async notifySupportTicketUpdate(ticketData) {
    const { ticketId, userId, status, assignedTo } = ticketData;

    await this.createNotification({
      userId,
      title: 'Support Ticket Updated',
      message: `Your support ticket #${ticketId} status has been updated to ${status}.`,
      type: 'info',
      relatedEntityType: 'ticket',
      relatedEntityId: ticketId,
      actionUrl: `/support/tickets/${ticketId}`
    });

    if (assignedTo) {
      await this.createNotification({
        userId: assignedTo,
        title: 'New Ticket Assigned',
        message: `You have been assigned to support ticket #${ticketId}.`,
        type: 'info',
        relatedEntityType: 'ticket',
        relatedEntityId: ticketId,
        priority: 'medium'
      });
    }
  }

  // Bulk notification creation
  async createMultipleNotifications(notificationsArray) {
    const results = [];
    for (const notificationData of notificationsArray) {
      try {
        const notification = await this.createNotification(notificationData);
        results.push({ success: true, notification });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }
}

export default new NotificationService();