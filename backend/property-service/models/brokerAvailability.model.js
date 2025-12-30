// backend/property-service/models/brokerAvailability.model.js
import db from "../config/database.js";

class BrokerAvailabilityModel {
  // Upsert availability (insert or update)
  async upsert(availabilityData) {
    try {
      const { broker_id, day_of_week, start_time, end_time, is_available = true } = availabilityData;

      const [result] = await db.execute(
        `INSERT INTO broker_availability 
        (broker_id, day_of_week, start_time, end_time, is_available, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        start_time = VALUES(start_time),
        end_time = VALUES(end_time),
        is_available = VALUES(is_available),
        updated_at = NOW()`,
        [broker_id, day_of_week, start_time, end_time, is_available ? 1 : 0]
      );

      // Return the updated record
      return this.findByBrokerAndDay(broker_id, day_of_week);
    } catch (error) {
      console.error("Upsert availability error:", error);
      throw error;
    }
  }

  // Find by broker and day
  async findByBrokerAndDay(brokerId, dayOfWeek) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM broker_availability 
         WHERE broker_id = ? AND day_of_week = ?`,
        [brokerId, dayOfWeek]
      );

      return rows[0] || null;
    } catch (error) {
      console.error("Find by broker and day error:", error);
      throw error;
    }
  }

  // Find by ID
  async findById(id) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM broker_availability WHERE id = ?`,
        [id]
      );

      return rows[0] || null;
    } catch (error) {
      console.error("Find by ID error:", error);
      throw error;
    }
  }

  // Find all availability for a broker
  async findByBrokerId(brokerId) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM broker_availability 
         WHERE broker_id = ? 
         ORDER BY 
           FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
           start_time`,
        [brokerId]
      );

      return rows;
    } catch (error) {
      console.error("Find by broker ID error:", error);
      throw error;
    }
  }

  // Check if broker is available at specific time
  async checkAvailable(brokerId, dayOfWeek, startTime, endTime) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM broker_availability 
         WHERE broker_id = ? 
           AND day_of_week = ?
           AND is_available = 1
           AND start_time <= ?
           AND end_time >= ?`,
        [brokerId, dayOfWeek, startTime, endTime]
      );

      return rows.length > 0;
    } catch (error) {
      console.error("Check available error:", error);
      throw error;
    }
  }

  // Update weekly schedule
  async updateWeeklySchedule(brokerId, weeklySchedule) {
    try {
      const results = [];
      
      // Start transaction for consistency
      await db.execute('START TRANSACTION');

      try {
        // Delete existing schedule for this broker
        await db.execute(
          `DELETE FROM broker_availability WHERE broker_id = ?`,
          [brokerId]
        );

        // Insert new schedule
        for (const schedule of weeklySchedule) {
          const { day_of_week, start_time, end_time, is_available = true } = schedule;
          
          const [result] = await db.execute(
            `INSERT INTO broker_availability 
            (broker_id, day_of_week, start_time, end_time, is_available, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [brokerId, day_of_week, start_time, end_time, is_available ? 1 : 0]
          );

          results.push({
            day_of_week,
            start_time,
            end_time,
            is_available,
            id: result.insertId
          });
        }

        await db.execute('COMMIT');
        return results;

      } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error("Update weekly schedule error:", error);
      throw error;
    }
  }

  // Get next available slots for a broker
  async getNextAvailableSlots(brokerId, daysAhead = 7) {
    try {
      const [rows] = await db.execute(
        `SELECT 
           ba.day_of_week,
           ba.start_time,
           ba.end_time,
           ba.is_available,
           CASE 
             WHEN ba.day_of_week = DAYNAME(CURDATE()) THEN 0
             WHEN ba.day_of_week = DAYNAME(DATE_ADD(CURDATE(), INTERVAL 1 DAY)) THEN 1
             WHEN ba.day_of_week = DAYNAME(DATE_ADD(CURDATE(), INTERVAL 2 DAY)) THEN 2
             WHEN ba.day_of_week = DAYNAME(DATE_ADD(CURDATE(), INTERVAL 3 DAY)) THEN 3
             WHEN ba.day_of_week = DAYNAME(DATE_ADD(CURDATE(), INTERVAL 4 DAY)) THEN 4
             WHEN ba.day_of_week = DAYNAME(DATE_ADD(CURDATE(), INTERVAL 5 DAY)) THEN 5
             WHEN ba.day_of_week = DAYNAME(DATE_ADD(CURDATE(), INTERVAL 6 DAY)) THEN 6
             ELSE 7
           END as days_from_now
         FROM broker_availability ba
         WHERE ba.broker_id = ? 
           AND ba.is_available = 1
         ORDER BY days_from_now, start_time
         LIMIT ?`,
        [brokerId, daysAhead * 3] // Assuming max 3 slots per day
      );

      return rows;
    } catch (error) {
      console.error("Get next available slots error:", error);
      throw error;
    }
  }

  // Delete availability slot
  async delete(id) {
    try {
      const [result] = await db.execute(
        `DELETE FROM broker_availability WHERE id = ?`,
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Delete availability error:", error);
      throw error;
    }
  }
}

export default new BrokerAvailabilityModel();