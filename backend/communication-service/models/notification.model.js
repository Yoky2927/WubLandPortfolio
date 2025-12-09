import db from "../../shared/db.js";

class NotificationModel {
  async createNotification(data) {
    const {
      userId,
      title,
      message,
      type = "info",
      actionUrl = null,
      icon = null,
      relatedEntityType = null,
      relatedEntityId = null,
      priority = "medium",
      expiresAt = null,
      deliveryMethods = ["in_app"],
    } = data;

    const [result] = await db.execute(
      `INSERT INTO notifications (
        notification_uuid, user_id, title, message, notification_type,
        action_url, icon, related_entity_type, related_entity_id,
        priority, expires_at, delivery_methods
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        JSON.stringify(deliveryMethods),
      ]
    );

    return result.insertId;
  }

  async getUserNotifications(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      archivedOnly = false,
      types = [],
    } = options;

    let query = `
      SELECT 
        n.*,
        u.id as user_id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.profile_picture as user_avatar,
        u.role
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.user_id = ?
    `;

    const params = [userId];

    if (unreadOnly) {
      query += " AND n.is_read = FALSE";
    }

    if (archivedOnly) {
      query += " AND n.is_archived = TRUE";
    } else {
      query += " AND n.is_archived = FALSE";
    }

    if (types.length > 0) {
      query += " AND n.notification_type IN (?)";
      params.push(types);
    }

    query += " ORDER BY n.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [notifications] = await db.execute(query, params);
    return notifications;
  }

  async getUnreadCount(userId) {
    const [result] = await db.execute(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = ? AND is_read = FALSE AND is_archived = FALSE`,
      [userId]
    );
    return result[0].count;
  }

  async markAsRead(notificationId, userId = null) {
    let query = `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?`;
    const params = [notificationId];

    if (userId) {
      query += " AND user_id = ?";
      params.push(userId);
    }

    const [result] = await db.execute(query, params);
    return result.affectedRows > 0;
  }

  async markAllAsRead(userId) {
    const [result] = await db.execute(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = NOW() 
       WHERE user_id = ? AND is_read = FALSE AND is_archived = FALSE`,
      [userId]
    );
    return result.affectedRows;
  }

  async archiveNotification(notificationId, userId) {
    const [result] = await db.execute(
      `UPDATE notifications 
       SET is_archived = TRUE 
       WHERE id = ? AND user_id = ? AND is_archived = FALSE`,
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  }

  async deleteNotification(notificationId, userId) {
    const [result] = await db.execute(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  }

  async getNotificationStats(userId) {
    const [result] = await db.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN is_archived = TRUE THEN 1 ELSE 0 END) as archived,
        notification_type,
        priority
       FROM notifications 
       WHERE user_id = ? AND is_archived = FALSE
       GROUP BY notification_type, priority`,
      [userId]
    );
    return result;
  }
  async getRecentNotifications(userId, limit = 10, offset = 0) {
    try {
      const [notifications] = await db.execute(
        `SELECT 
        n.*,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.profile_picture as user_avatar,
        u.role
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.user_id = ? AND n.is_archived = FALSE
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      return notifications;
    } catch (error) {
      console.error("Error getting recent notifications:", error);
      throw error;
    }
  }

  // Create multiple notifications at once
  async createMultipleNotifications(notificationsArray) {
    try {
      const results = [];
      for (const notification of notificationsArray) {
        const id = await this.createNotification(notification);
        results.push(id);
      }
      return results;
    } catch (error) {
      console.error("Error creating multiple notifications:", error);
      throw error;
    }
  }

  // Get notifications by type
  async getNotificationsByType(userId, type, limit = 50) {
    try {
      const [notifications] = await db.execute(
        `SELECT * FROM notifications 
       WHERE user_id = ? AND notification_type = ? AND is_archived = FALSE
       ORDER BY created_at DESC
       LIMIT ?`,
        [userId, type, limit]
      );
      return notifications;
    } catch (error) {
      console.error("Error getting notifications by type:", error);
      throw error;
    }
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    try {
      const [result] = await db.execute(
        `DELETE FROM notifications 
       WHERE expires_at IS NOT NULL AND expires_at < NOW()`,
        []
      );
      console.log(`🧹 Cleaned up ${result.affectedRows} expired notifications`);
      return result.affectedRows;
    } catch (error) {
      console.error("Error cleaning up expired notifications:", error);
      throw error;
    }
  }

  // Get notification by ID with user validation
  async getNotificationById(notificationId, userId = null) {
    try {
      let query = `SELECT * FROM notifications WHERE id = ?`;
      const params = [notificationId];

      if (userId) {
        query += " AND user_id = ?";
        params.push(userId);
      }

      const [notifications] = await db.execute(query, params);
      return notifications[0] || null;
    } catch (error) {
      console.error("Error getting notification by ID:", error);
      throw error;
    }
  }
}

export default new NotificationModel();
