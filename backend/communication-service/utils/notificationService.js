import NotificationModel from '../models/notification.model.js';
import { emitNotification } from './socket.js';
import EmailService from './emailService.js';
import { User } from '../models/user.model.js';

class NotificationService {
  async createNotification(data) {
    try {
      // Create notification in database
      const notificationId = await NotificationModel.createNotification(data);
      
      // Get the created notification
      const [notifications] = await NotificationModel.getUserNotifications(data.userId, {
        limit: 1,
        offset: 0
      });
      
      const notification = notifications.find(n => n.id === notificationId);
      
      if (!notification) {
        throw new Error('Failed to retrieve created notification');
      }

      // Send real-time notification via WebSocket
      await this.sendRealTimeNotification(data.userId, notification);

      // Send email if configured
      if (data.deliveryMethods && data.deliveryMethods.includes('email')) {
        await this.sendEmailNotification(data.userId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async sendRealTimeNotification(userId, notification) {
    try {
      // Get the socket function from your existing socket.js
      if (typeof emitNotification === 'function') {
        emitNotification(userId, notification);
      } else {
        // Fallback: Use direct socket emit if needed
        console.log('Real-time notification would be sent to user:', userId);
      }
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  async sendEmailNotification(userId, notification) {
    try {
      // Get user email from database
      const user = await User.findById(userId);
      if (!user || !user.email) {
        console.error('User not found or has no email:', userId);
        return;
      }

      await EmailService.sendNotificationEmail({
        to: user.email,
        subject: notification.title,
        text: notification.message,
        html: `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          ${notification.action_url ? 
            `<p><a href="${notification.action_url}">View Details</a></p>` : ''
          }
        `
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Helper method to send notification emails
  async sendNotificationEmail(data) {
    try {
      await EmailService.sendMail({
        from: process.env.EMAIL_USER,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html
      });
    } catch (error) {
      console.error('Error in sendNotificationEmail:', error);
    }
  }

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
}

export default new NotificationService();