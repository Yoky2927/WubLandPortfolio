// communication-service/models/announcement.model.js
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

class AnnouncementModel {
  // Create a new announcement
  static async createAnnouncement(announcementData) {
    const announcementUuid = uuidv4();
    const {
      title,
      message,
      target = 'all_brokers',
      priority = 'normal',
      status = 'draft',
      notification_type = 'both',
      language = 'en',
      is_urgent = false,
      expires_at = null,
      scheduled_for = null,
      created_by_user_id
    } = announcementData;

    const [result] = await db.query(
      `INSERT INTO announcements (
        announcement_uuid, title, message, target, priority, status,
        notification_type, language, is_urgent, expires_at, scheduled_for,
        created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        announcementUuid, title, message, target, priority, status,
        notification_type, language, is_urgent, expires_at, scheduled_for,
        created_by_user_id
      ]
    );

    return {
      id: result.insertId,
      announcement_uuid: announcementUuid,
      ...announcementData
    };
  }

  // Get announcement by ID
  static async getAnnouncementById(id) {
    const [rows] = await db.query(
      `SELECT a.*, 
              u.first_name as creator_first_name,
              u.last_name as creator_last_name,
              u.username as creator_username
       FROM announcements a
       LEFT JOIN users u ON a.created_by_user_id = u.id
       WHERE a.id = ? AND a.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  // Get announcement by UUID
  static async getAnnouncementByUuid(uuid) {
    const [rows] = await db.query(
      `SELECT a.*, 
              u.first_name as creator_first_name,
              u.last_name as creator_last_name,
              u.username as creator_username
       FROM announcements a
       LEFT JOIN users u ON a.created_by_user_id = u.id
       WHERE a.announcement_uuid = ? AND a.deleted_at IS NULL`,
      [uuid]
    );
    return rows[0] || null;
  }

  // Get all announcements with filtering
  static async getAnnouncements(filters = {}) {
    let query = `
      SELECT a.*, 
             u.first_name as creator_first_name,
             u.last_name as creator_last_name,
             u.username as creator_username,
             COUNT(ar.id) as total_recipients,
             SUM(CASE WHEN ar.viewed_at IS NOT NULL THEN 1 ELSE 0 END) as total_views,
             SUM(CASE WHEN ar.clicked_at IS NOT NULL THEN 1 ELSE 0 END) as total_clicks
      FROM announcements a
      LEFT JOIN users u ON a.created_by_user_id = u.id
      LEFT JOIN announcement_recipients ar ON a.id = ar.announcement_id
      WHERE a.deleted_at IS NULL
    `;

    const params = [];
    const conditions = [];

    if (filters.status) {
      conditions.push('a.status = ?');
      params.push(filters.status);
    }

    if (filters.priority) {
      conditions.push('a.priority = ?');
      params.push(filters.priority);
    }

    if (filters.target) {
      conditions.push('a.target = ?');
      params.push(filters.target);
    }

    if (filters.created_by_user_id) {
      conditions.push('a.created_by_user_id = ?');
      params.push(filters.created_by_user_id);
    }

    if (filters.search) {
      conditions.push('(a.title LIKE ? OR a.message LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' GROUP BY a.id ORDER BY a.created_at DESC';

    // Add pagination
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset));
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  // Update announcement
  static async updateAnnouncement(id, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(id);

    const [result] = await db.query(
      `UPDATE announcements SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );

    return result.affectedRows > 0;
  }

  // Delete announcement (soft delete)
  static async deleteAnnouncement(id) {
    const [result] = await db.query(
      'UPDATE announcements SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Mark announcement as sent
  static async markAsSent(id) {
    const [result] = await db.query(
      'UPDATE announcements SET status = "sent", sent_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Get announcement statistics
  static async getAnnouncementStats(announcementId) {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_recipients,
        SUM(CASE WHEN viewed_at IS NOT NULL THEN 1 ELSE 0 END) as views,
        SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicks,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_deliveries
       FROM announcement_recipients
       WHERE announcement_id = ?`,
      [announcementId]
    );
    return rows[0] || null;
  }

  // Get users by target group
  static async getUsersByTarget(target) {
    let whereClause = 'WHERE u.status = "active" AND u.deleted_at IS NULL';
    const params = [];

    switch (target) {
      case 'all_brokers':
        whereClause += ' AND u.role IN ("internal_broker", "external_broker")';
        break;
      case 'external_brokers':
        whereClause += ' AND u.role = "external_broker"';
        break;
      case 'internal_brokers':
        whereClause += ' AND u.role = "internal_broker"';
        break;
      case 'commercial_clients':
        whereClause += ' AND u.role = "buyer" AND u.privilege_tier = "enterprise"';
        break;
      case 'sellers':
        whereClause += ' AND u.role = "seller"';
        break;
      case 'buyers':
        whereClause += ' AND u.role = "buyer"';
        break;
      case 'landlords':
        whereClause += ' AND u.role = "landlord"';
        break;
      case 'renters':
        whereClause += ' AND u.role = "renter"';
        break;
      case 'premium_users':
        whereClause += ' AND u.privilege_tier IN ("premium", "enterprise")';
        break;
      case 'support_staff':
        whereClause += ' AND u.role IN ("support_admin", "support_lead", "support_agent")';
        break;
      case 'administrators':
        whereClause += ' AND u.role IN ("super_admin", "admin")';
        break;
      case 'all_users':
        // All active users
        break;
      default:
        return [];
    }

    const [rows] = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.privilege_tier 
       FROM users u ${whereClause}`,
      params
    );

    return rows;
  }

  // Add recipients to announcement
  static async addRecipients(announcementId, userIds, deliveryMethod = 'in_app') {
    if (userIds.length === 0) return [];

    const values = userIds.map(userId => [announcementId, userId, deliveryMethod]);
    
    const [result] = await db.query(
      `INSERT INTO announcement_recipients (announcement_id, user_id, delivery_method) 
       VALUES ? 
       ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      [values]
    );

    return result.affectedRows;
  }

  // Log announcement action
  static async logAction(announcementId, action, performedByUserId, details = {}) {
    const [result] = await db.query(
      `INSERT INTO announcement_logs (announcement_id, action, performed_by_user_id, details) 
       VALUES (?, ?, ?, ?)`,
      [announcementId, action, performedByUserId, JSON.stringify(details)]
    );
    return result.insertId;
  }
}

export default AnnouncementModel;