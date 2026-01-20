// communication-service/services/announcement.service.js - UPDATED VERSION
import AnnouncementModel from '../models/announcement.model.js';

class AnnouncementService {
  // Create announcement
  async createAnnouncement(announcementData) {
    return await AnnouncementModel.createAnnouncement(announcementData);
  }

  // Get announcements with filters
  async getAnnouncements(filters = {}) {
    return await AnnouncementModel.getAnnouncements(filters);
  }

  // Get announcement by ID
  async getAnnouncementById(id) {
    return await AnnouncementModel.getAnnouncementById(id);
  }

  // Update announcement
  async updateAnnouncement(id, updateData) {
    return await AnnouncementModel.updateAnnouncement(id, updateData);
  }

  // Delete announcement
  async deleteAnnouncement(id) {
    return await AnnouncementModel.deleteAnnouncement(id);
  }

  // Send announcement to recipients
  async sendAnnouncement(announcementId, target, notificationType = 'both') {
    try {
      const announcement = await AnnouncementModel.getAnnouncementById(announcementId);
      if (!announcement) {
        throw new Error('Announcement not found');
      }

      // Get users based on target
      const users = await AnnouncementModel.getUsersByTarget(target);
      
      // Add recipients
      const userIds = users.map(user => user.id);
      await AnnouncementModel.addRecipients(announcementId, userIds);

      // Mark announcement as sent
      await AnnouncementModel.markAsSent(announcementId);

      // Log the action
      await this.logAnnouncementAction(
        announcementId,
        'sent',
        announcement.created_by_user_id,
        {
          target,
          notification_type: notificationType,
          recipients_count: users.length
        }
      );

      return {
        success: true,
        message: `Announcement sent to ${users.length} users`,
        recipients: users.length
      };

    } catch (error) {
      console.error('Error sending announcement:', error);
      throw error;
    }
  }

  // Schedule announcement
  async scheduleAnnouncement(announcementId, scheduledFor) {
    return await AnnouncementModel.updateAnnouncement(announcementId, {
      status: 'scheduled',
      scheduled_for: scheduledFor
    });
  }

  // Get announcement statistics
  async getAnnouncementStats(announcementId) {
    return await AnnouncementModel.getAnnouncementStats(announcementId);
  }

  // Get user's received announcements
  async getUserAnnouncements(userId, filters = {}) {
    const db = (await import('../config/database.js')).default;
    
    let query = `
      SELECT a.*, ar.received_at, ar.viewed_at, ar.clicked_at, ar.status as delivery_status
      FROM announcements a
      INNER JOIN announcement_recipients ar ON a.id = ar.announcement_id
      WHERE ar.user_id = ? AND a.deleted_at IS NULL
    `;

    const params = [userId];

    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      query += ' AND a.priority = ?';
      params.push(filters.priority);
    }

    query += ' ORDER BY a.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  }

  // Mark announcement as viewed by user
  async markAsViewed(announcementId, userId) {
    const db = (await import('../config/database.js')).default;
    const [result] = await db.query(
      `UPDATE announcement_recipients 
       SET viewed_at = NOW(), status = 'viewed' 
       WHERE announcement_id = ? AND user_id = ?`,
      [announcementId, userId]
    );

    // Update announcement views count
    if (result.affectedRows > 0) {
      await db.query(
        'UPDATE announcements SET views_count = views_count + 1 WHERE id = ?',
        [announcementId]
      );
    }

    return result.affectedRows > 0;
  }

  // Mark announcement as clicked by user
  async markAsClicked(announcementId, userId) {
    const db = (await import('../config/database.js')).default;
    const [result] = await db.query(
      `UPDATE announcement_recipients 
       SET clicked_at = NOW(), status = 'clicked' 
       WHERE announcement_id = ? AND user_id = ?`,
      [announcementId, userId]
    );

    // Update announcement clicks count
    if (result.affectedRows > 0) {
      await db.query(
        'UPDATE announcements SET clicks_count = clicks_count + 1 WHERE id = ?',
        [announcementId]
      );
    }

    return result.affectedRows > 0;
  }

  // Log announcement action - NEW METHOD
  async logAnnouncementAction(announcementId, action, performedByUserId, details = {}) {
    try {
      return await AnnouncementModel.logAction(announcementId, action, performedByUserId, details);
    } catch (error) {
      console.error('Error logging announcement action:', error);
      // Don't throw error for logging failures
      return null;
    }
  }

  // Helper: Send in-app notification
  async sendInAppNotification(userId, title, message, type = 'info', actionUrl = null) {
    try {
      const NotificationModel = await import('./notification.model.js').then(mod => mod.default);
      return await NotificationModel.createNotification({
        userId,
        title,
        message,
        type,
        actionUrl,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return null;
    }
  }

  // Helper: Send email notification
  async sendEmailNotification(email, subject, message, language = 'en') {
    try {
      // This would integrate with your email service
      // For now, just log it
      console.log(`[Email] To: ${email}, Subject: ${subject}, Language: ${language}`);
      console.log(`Message: ${message.substring(0, 100)}...`);
      return { success: true, logged: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return null;
    }
  }

  async getPublicAnnouncements() {
    const db = (await import('../config/database.js')).default;
    
    const now = new Date().toISOString();
    
    const query = `
      SELECT 
        id,
        title,
        message,
        priority,
        target,
        status,
        expires_at,
        scheduled_for,
        is_urgent,
        category,
        created_at
      FROM announcements 
      WHERE 
        deleted_at IS NULL 
        AND status IN ('sent', 'active')
        AND (expires_at IS NULL OR expires_at > ?)
        AND (scheduled_for IS NULL OR scheduled_for <= ?)
      ORDER BY 
        is_urgent DESC,
        CASE priority 
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        created_at DESC
      LIMIT 10
    `;
    
    const [announcements] = await db.query(query, [now, now]);
    
    return announcements;
  }
}

export default new AnnouncementService();