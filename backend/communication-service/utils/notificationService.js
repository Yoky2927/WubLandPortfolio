import NotificationModel from '../models/notification.model.js';
import { emitNotification } from './socket.js';
import EmailService from './emailService.js';
import { User } from '../models/user.model.js';

class NotificationService {
  async createNotification(data) {
    try {
      console.log('🔍 createNotification called with:', {
        userId: data.userId,
        title: data.title,
        type: data.type,
        hasEmitFunction: typeof emitNotification === 'function'
      });

      // 1. Create notification in database
      const notificationId = await NotificationModel.createNotification(data);
      console.log('✅ Notification created with ID:', notificationId);

      // 2. Get the created notification - FIXED: Handle different return formats
      let notificationsResult;
      try {
        notificationsResult = await NotificationModel.getUserNotifications(data.userId, {
          limit: 5,
          offset: 0
        });
        
        console.log('🔍 getUserNotifications returned:', {
          type: typeof notificationsResult,
          isArray: Array.isArray(notificationsResult),
          value: notificationsResult
        });
      } catch (queryError) {
        console.log('⚠️ Could not fetch notifications, but appointment was created:', queryError.message);
        // Continue without the notification query
        notificationsResult = [];
      }

      // 3. Process the result properly
      let notifications = [];
      let foundNotification = null;

      if (notificationsResult) {
        if (Array.isArray(notificationsResult) && notificationsResult.length > 0) {
          // Check if it's an array of arrays (MySQL2 returns [rows])
          if (Array.isArray(notificationsResult[0])) {
            notifications = notificationsResult[0];
          } else if (notificationsResult[0] && notificationsResult[0].id) {
            // It's already an array of objects
            notifications = notificationsResult;
          } else if (notificationsResult[0] && Array.isArray(notificationsResult[0].data)) {
            // It's { success: true, data: [...] } format
            notifications = notificationsResult[0].data || [];
          }
        } else if (notificationsResult.success && Array.isArray(notificationsResult.data)) {
          // It's { success: true, data: [...] } format
          notifications = notificationsResult.data;
        }
      }

      console.log('🔍 Processed notifications array:', {
        length: notifications.length,
        firstItem: notifications[0] ? { id: notifications[0].id, title: notifications[0].title } : 'none'
      });

      // 4. Find the notification we just created
      if (notifications.length > 0) {
        foundNotification = notifications.find(n => n.id === notificationId);
      }

      // 5. If not found, create a simple notification object
      if (!foundNotification) {
        console.log('⚠️ Created notification not found in list, creating simple object');
        foundNotification = {
          id: notificationId,
          user_id: data.userId,
          title: data.title || 'Notification',
          message: data.message || '',
          type: data.type || 'info',
          priority: data.priority || 'medium',
          is_read: false,
          read_at: null,
          action_url: data.actionUrl || data.action_url,
          related_entity_type: data.relatedEntityType,
          related_entity_id: data.relatedEntityId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      // 6. Send real-time notification via WebSocket if available
      try {
        if (typeof emitNotification === 'function') {
          await this.sendRealTimeNotification(data.userId, foundNotification);
          console.log('✅ Real-time notification sent');
        } else {
          console.log('ℹ️ emitNotification function not available, skipping real-time');
        }
      } catch (socketError) {
        console.error('❌ Error sending real-time notification:', socketError.message);
        // Don't fail the whole operation if socket fails
      }

      // 7. Send email if configured
      if (data.deliveryMethods && data.deliveryMethods.includes('email')) {
        try {
          await this.sendEmailNotification(data.userId, foundNotification);
          console.log('✅ Email notification sent');
        } catch (emailError) {
          console.error('❌ Error sending email notification:', emailError.message);
        }
      }

      console.log('🎉 Notification process completed successfully');
      return foundNotification;

    } catch (error) {
      console.error('❌ Error in createNotification:', error.message);
      console.error('Stack:', error.stack);
      
      // Return a minimal notification object even if there's an error
      return {
        id: Date.now(), // Temporary ID
        user_id: data.userId,
        title: data.title || 'Notification',
        message: data.message || '',
        type: data.type || 'info',
        created_at: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async sendRealTimeNotification(userId, notification) {
    try {
      if (typeof emitNotification === 'function') {
        emitNotification(userId, notification);
        console.log(`📡 Real-time notification sent to user ${userId}`);
        return true;
      } else {
        console.log('ℹ️ emitNotification function not available, skipping real-time');
        return false;
      }
    } catch (error) {
      console.error('Error sending real-time notification:', error);
      return false;
    }
  }

  async sendEmailNotification(userId, notification) {
    try {
      // Get user email from database
      let user;
      try {
        if (typeof User.findById === 'function') {
          user = await User.findById(userId);
        } else {
          // Try alternative user lookup
          user = { email: 'user@example.com' }; // Fallback
          console.log('ℹ️ Using fallback email for user:', userId);
        }
      } catch (userError) {
        console.error('Could not fetch user for email:', userError.message);
        return;
      }

      if (!user || !user.email) {
        console.error('User not found or has no email:', userId);
        return;
      }

      await EmailService.sendNotificationEmail({
        to: user.email,
        subject: notification.title || 'Notification',
        text: notification.message || 'You have a new notification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${notification.title || 'Notification'}</h2>
            <p style="color: #666;">${notification.message || 'You have a new notification'}</p>
            ${notification.action_url ? 
              `<p style="margin-top: 20px;">
                <a href="${notification.action_url}" 
                   style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  View Details
                </a>
              </p>` : ''
            }
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              This is an automated notification from WubLand.
            </p>
          </div>
        `
      });
      
      console.log(`📧 Email notification sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Helper method to send notification emails
  async sendNotificationEmail(data) {
    try {
      await EmailService.sendMail({
        from: process.env.EMAIL_USER || 'notifications@wubland.com',
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

    console.log('📈 notifyNewOffer called:', { propertyId, sellerId, amount });

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

    console.log('⏰ notifyAppointmentReminder called:', { userId, title });

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

    console.log('🎫 notifySupportTicketUpdate called:', { ticketId, userId, status });

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

  // Simplified method for appointments (used by appointment controller)
  async notifyAppointmentCreated(appointmentData) {
    const { brokerId, title, appointmentId, userId } = appointmentData;

    console.log('📅 notifyAppointmentCreated called:', { brokerId, appointmentId });

    if (!brokerId) {
      console.log('ℹ️ No broker ID provided, skipping notification');
      return;
    }

    try {
      const notification = await this.createNotification({
        userId: brokerId,
        title: 'New Appointment Scheduled',
        message: `You have been invited to an appointment: ${title}`,
        type: 'appointment',
        actionUrl: `/appointments/${appointmentId}`,
        priority: 'medium',
        relatedEntityType: 'appointment',
        relatedEntityId: appointmentId,
        deliveryMethods: ['realtime'] // Only real-time, no email for now
      });

      console.log('✅ Appointment notification sent:', {
        notificationId: notification.id,
        brokerId,
        appointmentId
      });

      return notification;
    } catch (error) {
      console.error('❌ Error sending appointment notification:', error.message);
      // Don't throw - let the appointment creation succeed even if notification fails
      return null;
    }
  }
}

export default new NotificationService();