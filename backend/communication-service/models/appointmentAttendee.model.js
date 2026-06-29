// communication-service/models/appointmentAttendee.model.js
import db from "../../shared/db.js";

class AppointmentAttendeeModel {
  // Add attendee to appointment
  static async addAttendee(appointmentId, userId, attendeeData = {}) {
    try {
      const {
        broker_id = null,
        attendee_role = "client",
        attendee_status = "invited",
        is_broker = false,
        send_reminder = true,
        additional_guests = 0,
        // REMOVE notes from here since it doesn't exist in DB
      } = attendeeData;

      const query = `
      INSERT INTO appointment_attendees (
        appointment_id, user_id, broker_id, attendee_role,
        attendee_status, is_broker, send_reminder,
        additional_guests
        -- REMOVED notes column
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      -- Changed from 9 to 8 values
      ON DUPLICATE KEY UPDATE
        attendee_status = VALUES(attendee_status),
        updated_at = CURRENT_TIMESTAMP
    `;

      const values = [
        appointmentId,
        userId,
        broker_id,
        attendee_role,
        attendee_status,
        is_broker,
        send_reminder,
        additional_guests,
        // REMOVED notes value
      ];

      const [result] = await db.execute(query, values);
      return result.insertId;
    } catch (error) {
      console.error("Error adding attendee:", error);
      throw error;
    }
  }

  // Get attendees for an appointment
  static async getAppointmentAttendees(appointmentId) {
    try {
      const query = `
        SELECT aa.*, 
          u.first_name, u.last_name, u.email, u.phone_number,
          u.profile_picture, u.role as user_role,
          b.first_name as broker_first_name, b.last_name as broker_last_name,
          b.email as broker_email, b.phone_number as broker_phone
        FROM appointment_attendees aa
        LEFT JOIN users u ON aa.user_id = u.id
        LEFT JOIN users b ON aa.broker_id = b.id
        WHERE aa.appointment_id = ?
        ORDER BY aa.created_at ASC
      `;

      const [rows] = await db.execute(query, [appointmentId]);
      return rows;
    } catch (error) {
      console.error("Error getting appointment attendees:", error);
      throw error;
    }
  }

  // Update attendee status
  static async updateAttendeeStatus(appointmentId, userId, status) {
    try {
      const query = `
        UPDATE appointment_attendees 
        SET attendee_status = ?, 
            updated_at = CURRENT_TIMESTAMP,
            responded_at = CASE 
              WHEN ? != 'invited' THEN CURRENT_TIMESTAMP 
              ELSE responded_at 
            END
        WHERE appointment_id = ? AND user_id = ?
      `;

      const [result] = await db.execute(query, [
        status,
        status,
        appointmentId,
        userId,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating attendee status:", error);
      throw error;
    }
  }

  // Remove attendee from appointment
  static async removeAttendee(appointmentId, userId) {
    try {
      const query = `
        DELETE FROM appointment_attendees 
        WHERE appointment_id = ? AND user_id = ?
      `;

      const [result] = await db.execute(query, [appointmentId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error removing attendee:", error);
      throw error;
    }
  }

  // Get user's appointments
  static async getUserAppointmentsAsAttendee(userId, filters = {}) {
    try {
      let query = `
        SELECT a.*, 
          aa.attendee_status, aa.attendee_role, aa.responded_at,
          p.title as property_title, p.property_uuid, p.address as property_address,
          p.city as property_city, p.state as property_state, p.country as property_country,
          u.first_name as organizer_first_name, u.last_name as organizer_last_name,
          b.first_name as broker_first_name, b.last_name as broker_last_name
        FROM appointment_attendees aa
        JOIN appointments a ON aa.appointment_id = a.id
        LEFT JOIN properties p ON a.property_id = p.id
        LEFT JOIN users u ON a.organizer_user_id = u.id
        LEFT JOIN users b ON a.broker_id = b.id
        WHERE aa.user_id = ? AND a.deleted_at IS NULL
      `;

      const values = [userId];

      if (filters.status) {
        query += " AND a.status = ?";
        values.push(filters.status);
      }

      if (filters.attendee_status) {
        query += " AND aa.attendee_status = ?";
        values.push(filters.attendee_status);
      }

      if (filters.start_date) {
        query += " AND a.scheduled_date >= ?";
        values.push(filters.start_date);
      }

      if (filters.end_date) {
        query += " AND a.scheduled_date <= ?";
        values.push(filters.end_date);
      }

      query += " ORDER BY a.start_time DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        values.push(filters.limit);
      }

      if (filters.offset) {
        query += " OFFSET ?";
        values.push(filters.offset);
      }

      const [rows] = await db.execute(query, values);
      return rows;
    } catch (error) {
      console.error("Error getting user appointments as attendee:", error);
      throw error;
    }
  }

  // Check if user is attendee
  static async isUserAttendee(appointmentId, userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM appointment_attendees
        WHERE appointment_id = ? AND user_id = ?
      `;

      const [rows] = await db.execute(query, [appointmentId, userId]);
      return rows[0].count > 0;
    } catch (error) {
      console.error("Error checking if user is attendee:", error);
      throw error;
    }
  }

  // Get attendee count
  static async getAttendeeCount(appointmentId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN attendee_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN attendee_status = 'attended' THEN 1 ELSE 0 END) as attended,
          SUM(CASE WHEN attendee_status = 'no_show' THEN 1 ELSE 0 END) as no_show,
          SUM(additional_guests) as additional_guests
        FROM appointment_attendees
        WHERE appointment_id = ?
      `;

      const [rows] = await db.execute(query, [appointmentId]);
      return (
        rows[0] || {
          total: 0,
          confirmed: 0,
          attended: 0,
          no_show: 0,
          additional_guests: 0,
        }
      );
    } catch (error) {
      console.error("Error getting attendee count:", error);
      throw error;
    }
  }

  // Mark attendee as attended
  static async markAsAttended(appointmentId, userId) {
    try {
      const query = `
        UPDATE appointment_attendees 
        SET attendee_status = 'attended', 
            updated_at = CURRENT_TIMESTAMP
        WHERE appointment_id = ? AND user_id = ?
      `;

      const [result] = await db.execute(query, [appointmentId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error marking attendee as attended:", error);
      throw error;
    }
  }
}

export default AppointmentAttendeeModel;
