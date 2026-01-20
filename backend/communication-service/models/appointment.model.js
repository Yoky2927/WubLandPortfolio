// communication-service/models/appointment.model.js
import db from '../../shared/db.js';

class AppointmentModel {
  // Create a new appointment
  static async createAppointment(appointmentData) {
    try {
      const appointmentUuid = appointmentData.appointment_uuid || crypto.randomUUID();
      
      const {
        title,
        description,
        appointment_type = 'property_viewing',
        scheduled_date,
        start_time,
        end_time,
        duration_minutes = 60,
        timezone = 'UTC',
        location_type = 'property',
        location_address,
        virtual_meeting_url,
        property_id = null,
        transaction_id = null,
        organizer_user_id,
        broker_id = null,
        status = 'scheduled',
        created_by_user_id,
        max_attendees = 10
      } = appointmentData;

      const query = `
        INSERT INTO appointments (
          appointment_uuid, title, description, appointment_type, 
          scheduled_date, start_time, end_time, duration_minutes, timezone,
          location_type, location_address, virtual_meeting_url,
          property_id, transaction_id, organizer_user_id, broker_id,
          status, created_by_user_id, max_attendees
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        appointmentUuid,
        title,
        description || null,
        appointment_type,
        scheduled_date,
        start_time,
        end_time,
        duration_minutes,
        timezone,
        location_type,
        location_address || null,
        virtual_meeting_url || null,
        property_id,
        transaction_id,
        organizer_user_id,
        broker_id,
        status,
        created_by_user_id,
        max_attendees
      ];
      
      const [result] = await db.execute(query, values);
      return result.insertId;
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // Get appointment by ID
  static async getAppointmentById(appointmentId) {
    try {
      const query = `
        SELECT a.*, 
          p.title as property_title, p.property_uuid, p.address as property_address,
          p.city as property_city, p.state as property_state, p.country as property_country,
          u.first_name as organizer_first_name, u.last_name as organizer_last_name,
          u.email as organizer_email, u.phone_number as organizer_phone,
          b.first_name as broker_first_name, b.last_name as broker_last_name,
          b.email as broker_email, b.phone_number as broker_phone,
          bp.brokerage_firm, bp.experience_years, bp.average_rating as broker_rating
        FROM appointments a
        LEFT JOIN properties p ON a.property_id = p.id
        LEFT JOIN users u ON a.organizer_user_id = u.id
        LEFT JOIN users b ON a.broker_id = b.id
        LEFT JOIN broker_profiles bp ON a.broker_id = bp.user_id
        WHERE a.id = ? AND a.deleted_at IS NULL
      `;
      
      const [rows] = await db.execute(query, [appointmentId]);
      return rows[0] || null;
      
    } catch (error) {
      console.error('Error getting appointment:', error);
      throw error;
    }
  }

  // Get appointment by UUID
  static async getAppointmentByUuid(appointmentUuid) {
    try {
      const query = `
        SELECT a.*, 
          p.title as property_title, p.property_uuid, p.address as property_address,
          u.first_name as organizer_first_name, u.last_name as organizer_last_name,
          b.first_name as broker_first_name, b.last_name as broker_last_name
        FROM appointments a
        LEFT JOIN properties p ON a.property_id = p.id
        LEFT JOIN users u ON a.organizer_user_id = u.id
        LEFT JOIN users b ON a.broker_id = b.id
        WHERE a.appointment_uuid = ? AND a.deleted_at IS NULL
      `;
      
      const [rows] = await db.execute(query, [appointmentUuid]);
      return rows[0] || null;
      
    } catch (error) {
      console.error('Error getting appointment by UUID:', error);
      throw error;
    }
  }

  // Get appointments for a user
  static async getUserAppointments(userId, filters = {}) {
    try {
      let query = `
        SELECT DISTINCT a.*, 
          p.title as property_title, p.property_uuid, p.address as property_address,
          p.city as property_city, p.state as property_state, p.country as property_country,
          u.first_name as organizer_first_name, u.last_name as organizer_last_name,
          b.first_name as broker_first_name, b.last_name as broker_last_name,
          bp.brokerage_firm,
          (SELECT COUNT(*) FROM appointment_attendees aa WHERE aa.appointment_id = a.id) as attendee_count
        FROM appointments a
        LEFT JOIN properties p ON a.property_id = p.id
        LEFT JOIN users u ON a.organizer_user_id = u.id
        LEFT JOIN users b ON a.broker_id = b.id
        LEFT JOIN broker_profiles bp ON a.broker_id = bp.user_id
        LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id
        WHERE a.deleted_at IS NULL 
          AND (a.organizer_user_id = ? 
               OR aa.user_id = ? 
               OR a.broker_id = ? 
               OR (a.property_id IN (SELECT id FROM properties WHERE owner_user_id = ?))
          )
      `;
      
      const values = [userId, userId, userId, userId];
      
      // Apply filters
      if (filters.status) {
        query += ' AND a.status = ?';
        values.push(filters.status);
      }
      
      if (filters.appointment_type) {
        query += ' AND a.appointment_type = ?';
        values.push(filters.appointment_type);
      }
      
      if (filters.start_date) {
        query += ' AND a.scheduled_date >= ?';
        values.push(filters.start_date);
      }
      
      if (filters.end_date) {
        query += ' AND a.scheduled_date <= ?';
        values.push(filters.end_date);
      }
      
      if (filters.property_id) {
        query += ' AND a.property_id = ?';
        values.push(filters.property_id);
      }
      
      // Order and limit
      query += ' ORDER BY a.start_time DESC';
      
      if (filters.limit) {
        query += ' LIMIT ?';
        values.push(filters.limit);
      }
      
      if (filters.offset) {
        query += ' OFFSET ?';
        values.push(filters.offset);
      }
      
      const [rows] = await db.execute(query, values);
      return rows;
      
    } catch (error) {
      console.error('Error getting user appointments:', error);
      throw error;
    }
  }

  // Get appointments for a property
  static async getPropertyAppointments(propertyId, filters = {}) {
    try {
      let query = `
        SELECT a.*, 
          u.first_name as organizer_first_name, u.last_name as organizer_last_name,
          b.first_name as broker_first_name, b.last_name as broker_last_name,
          (SELECT COUNT(*) FROM appointment_attendees aa WHERE aa.appointment_id = a.id) as attendee_count
        FROM appointments a
        LEFT JOIN users u ON a.organizer_user_id = u.id
        LEFT JOIN users b ON a.broker_id = b.id
        WHERE a.property_id = ? AND a.deleted_at IS NULL
      `;
      
      const values = [propertyId];
      
      if (filters.status) {
        query += ' AND a.status = ?';
        values.push(filters.status);
      }
      
      if (filters.start_date) {
        query += ' AND a.scheduled_date >= ?';
        values.push(filters.start_date);
      }
      
      if (filters.end_date) {
        query += ' AND a.scheduled_date <= ?';
        values.push(filters.end_date);
      }
      
      query += ' ORDER BY a.start_time ASC';
      
      const [rows] = await db.execute(query, values);
      return rows;
      
    } catch (error) {
      console.error('Error getting property appointments:', error);
      throw error;
    }
  }

  // Get appointments for a broker
  static async getBrokerAppointments(brokerId, filters = {}) {
    try {
      let query = `
        SELECT a.*, 
          p.title as property_title, p.property_uuid, p.address as property_address,
          p.city as property_city, u.first_name as organizer_first_name, 
          u.last_name as organizer_last_name,
          (SELECT COUNT(*) FROM appointment_attendees aa WHERE aa.appointment_id = a.id) as attendee_count
        FROM appointments a
        LEFT JOIN properties p ON a.property_id = p.id
        LEFT JOIN users u ON a.organizer_user_id = u.id
        WHERE a.broker_id = ? AND a.deleted_at IS NULL
      `;
      
      const values = [brokerId];
      
      if (filters.status) {
        query += ' AND a.status = ?';
        values.push(filters.status);
      }
      
      if (filters.start_date) {
        query += ' AND a.scheduled_date >= ?';
        values.push(filters.start_date);
      }
      
      if (filters.end_date) {
        query += ' AND a.scheduled_date <= ?';
        values.push(filters.end_date);
      }
      
      query += ' ORDER BY a.start_time ASC';
      
      const [rows] = await db.execute(query, values);
      return rows;
      
    } catch (error) {
      console.error('Error getting broker appointments:', error);
      throw error;
    }
  }

  // Update appointment
  static async updateAppointment(appointmentId, updates) {
    try {
      const allowedFields = [
        'title', 'description', 'appointment_type', 'scheduled_date',
        'start_time', 'end_time', 'duration_minutes', 'timezone',
        'location_type', 'location_address', 'virtual_meeting_url',
        'property_id', 'transaction_id', 'broker_id', 'status',
        'max_attendees', 'cancellation_reason', 'reminder_sent',
        'reminder_sent_at', 'follow_up_required', 'follow_up_date',
        'follow_up_completed', 'internal_notes'
      ];
      
      const setClauses = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          setClauses.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      setClauses.push('updated_at = CURRENT_TIMESTAMP');
      
      const query = `
        UPDATE appointments 
        SET ${setClauses.join(', ')}
        WHERE id = ? AND deleted_at IS NULL
      `;
      
      values.push(appointmentId);
      const [result] = await db.execute(query, values);
      
      return result.affectedRows > 0;
      
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  // Cancel/delete appointment (soft delete)
  static async deleteAppointment(appointmentId, userId) {
    try {
      const query = `
        UPDATE appointments 
        SET deleted_at = CURRENT_TIMESTAMP, 
            status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND organizer_user_id = ? AND deleted_at IS NULL
      `;
      
      const [result] = await db.execute(query, [appointmentId, userId]);
      return result.affectedRows > 0;
      
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  // Update appointment status
  static async updateAppointmentStatus(appointmentId, status, userId = null) {
    try {
      let query;
      let values;
      
      if (userId) {
        query = `
          UPDATE appointments 
          SET status = ?, 
              updated_at = CURRENT_TIMESTAMP,
              status_changed_at = CURRENT_TIMESTAMP
          WHERE id = ? AND organizer_user_id = ? AND deleted_at IS NULL
        `;
        values = [status, appointmentId, userId];
      } else {
        query = `
          UPDATE appointments 
          SET status = ?, 
              updated_at = CURRENT_TIMESTAMP,
              status_changed_at = CURRENT_TIMESTAMP
          WHERE id = ? AND deleted_at IS NULL
        `;
        values = [status, appointmentId];
      }
      
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
      
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  // Get appointment statistics
  static async getAppointmentStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show,
          SUM(CASE WHEN appointment_type = 'property_viewing' THEN 1 ELSE 0 END) as viewings,
          SUM(CASE WHEN appointment_type = 'consultation' THEN 1 ELSE 0 END) as consultations,
          SUM(CASE WHEN appointment_type = 'signing' THEN 1 ELSE 0 END) as signings
        FROM appointments
        WHERE organizer_user_id = ? 
          AND deleted_at IS NULL
          AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `;
      
      const [rows] = await db.execute(query, [userId]);
      return rows[0] || {};
      
    } catch (error) {
      console.error('Error getting appointment stats:', error);
      throw error;
    }
  }

  // Check if time slot is available
  static async isTimeSlotAvailable(brokerId, propertyId, startTime, endTime, excludeAppointmentId = null) {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM appointments
        WHERE deleted_at IS NULL 
          AND status IN ('scheduled', 'confirmed', 'pending')
          AND ((broker_id = ?) OR (property_id = ?))
          AND (
            (start_time < ? AND end_time > ?) OR
            (start_time >= ? AND start_time < ?) OR
            (end_time > ? AND end_time <= ?)
          )
      `;
      
      const values = [
        brokerId, propertyId,
        endTime, startTime,
        startTime, endTime,
        startTime, endTime
      ];
      
      if (excludeAppointmentId) {
        query += ' AND id != ?';
        values.push(excludeAppointmentId);
      }
      
      const [rows] = await db.execute(query, values);
      return rows[0].count === 0;
      
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      throw error;
    }
  }

  // Get upcoming appointments
  static async getUpcomingAppointments(userId, limit = 10) {
    try {
      const query = `
        SELECT a.*, 
          p.title as property_title, p.property_uuid, p.address as property_address,
          p.city as property_city, u.first_name as organizer_first_name, 
          u.last_name as organizer_last_name, b.first_name as broker_first_name,
          b.last_name as broker_last_name
        FROM appointments a
        LEFT JOIN properties p ON a.property_id = p.id
        LEFT JOIN users u ON a.organizer_user_id = u.id
        LEFT JOIN users b ON a.broker_id = b.id
        LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id
        WHERE a.deleted_at IS NULL 
          AND a.status IN ('scheduled', 'confirmed')
          AND a.start_time > NOW()
          AND (a.organizer_user_id = ? 
               OR aa.user_id = ? 
               OR a.broker_id = ?)
        GROUP BY a.id
        ORDER BY a.start_time ASC
        LIMIT ?
      `;
      
      const [rows] = await db.execute(query, [userId, userId, userId, limit]);
      return rows;
      
    } catch (error) {
      console.error('Error getting upcoming appointments:', error);
      throw error;
    }
  }
}

export default AppointmentModel;