// backend/property-service/controllers/availability.controller.js
import BrokerAvailabilityModel from "../models/brokerAvailability.model.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import pool from '../config/database.js';

class BrokerAvailabilityController {
  // Set or update broker availability
  async setAvailability(req, res) {
    try {
      const brokerId = req.user?.id;
      const availabilityData = req.body;

      console.log(`📅 Setting availability for broker ${brokerId}`);

      if (!brokerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      // Validate input
      if (!availabilityData.day_of_week || !availabilityData.start_time || !availabilityData.end_time) {
        return errorResponse(res, 400, "Missing required fields: day_of_week, start_time, end_time");
      }

      // Validate day of week
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (!validDays.includes(availabilityData.day_of_week.toLowerCase())) {
        return errorResponse(res, 400, "Invalid day_of_week");
      }

      // Set broker ID
      availabilityData.broker_id = brokerId;

      // Save availability
      const availability = await BrokerAvailabilityModel.upsert(availabilityData);

      successResponse(res, 200, "Availability set successfully", availability);

    } catch (error) {
      console.error("❌ Set availability error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Get broker's availability schedule
  async getAvailability(req, res) {
    try {
      const { broker_id } = req.params;
      const userId = req.user?.id;

      console.log(`📅 Getting availability for broker ${broker_id}`);

      // Check permissions (broker can see their own, admin can see anyone)
      if (parseInt(broker_id) !== userId && 
          req.user?.role !== 'admin' && 
          req.user?.role !== 'super_admin') {
        return errorResponse(res, 403, "Not authorized to view this broker's availability");
      }

      const availability = await BrokerAvailabilityModel.findByBrokerId(broker_id);

      successResponse(res, 200, "Availability retrieved successfully", availability);

    } catch (error) {
      console.error("❌ Get availability error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Get my availability (for authenticated broker)
  async getMyAvailability(req, res) {
    try {
      const brokerId = req.user?.id;

      if (!brokerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      console.log(`📅 Getting my availability (broker ${brokerId})`);

      const availability = await BrokerAvailabilityModel.findByBrokerId(brokerId);

      successResponse(res, 200, "Availability retrieved successfully", availability);

    } catch (error) {
      console.error("❌ Get my availability error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Check if broker is available at a specific time
  async checkAvailability(req, res) {
    try {
      const { broker_id } = req.params;
      const { date, start_time, end_time } = req.body;

      console.log(`⏰ Checking availability for broker ${broker_id} at ${date} ${start_time}-${end_time}`);

      if (!date || !start_time || !end_time) {
        return errorResponse(res, 400, "Missing required fields: date, start_time, end_time");
      }

      // Get day of week from date
      const dateObj = new Date(date);
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = days[dateObj.getDay()];

      // Check availability
      const isAvailable = await BrokerAvailabilityModel.checkAvailable(
        broker_id,
        dayOfWeek,
        start_time,
        end_time
      );

      successResponse(res, 200, "Availability checked successfully", {
        broker_id,
        date,
        start_time,
        end_time,
        day_of_week: dayOfWeek,
        is_available: isAvailable
      });

    } catch (error) {
      console.error("❌ Check availability error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Bulk update availability (set entire week)
  async updateWeeklyAvailability(req, res) {
    try {
      const brokerId = req.user?.id;
      const weeklySchedule = req.body;

      console.log(`📅 Updating weekly availability for broker ${brokerId}`);

      if (!brokerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      if (!Array.isArray(weeklySchedule) || weeklySchedule.length === 0) {
        return errorResponse(res, 400, "Schedule data must be an array");
      }

      // Validate each day's schedule
      for (const daySchedule of weeklySchedule) {
        if (!daySchedule.day_of_week || !daySchedule.start_time || !daySchedule.end_time) {
          return errorResponse(res, 400, "Each schedule must have day_of_week, start_time, and end_time");
        }
      }

      // Update weekly schedule
      const updatedSchedule = await BrokerAvailabilityModel.updateWeeklySchedule(brokerId, weeklySchedule);

      successResponse(res, 200, "Weekly availability updated successfully", updatedSchedule);

    } catch (error) {
      console.error("❌ Update weekly availability error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Delete availability slot
  async deleteAvailability(req, res) {
    try {
      const { id } = req.params;
      const brokerId = req.user?.id;

      console.log(`🗑️ Deleting availability slot ${id}`);

      if (!brokerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      // Verify the slot belongs to the broker
      const slot = await BrokerAvailabilityModel.findById(id);
      
      if (!slot) {
        return errorResponse(res, 404, "Availability slot not found");
      }

      if (slot.broker_id !== parseInt(brokerId) && 
          req.user?.role !== 'admin' && 
          req.user?.role !== 'super_admin') {
        return errorResponse(res, 403, "Not authorized to delete this availability slot");
      }

      const deleted = await BrokerAvailabilityModel.delete(id);

      if (!deleted) {
        return errorResponse(res, 500, "Failed to delete availability slot");
      }

      successResponse(res, 200, "Availability slot deleted successfully");

    } catch (error) {
      console.error("❌ Delete availability error:", error);
      errorResponse(res, 500, error.message);
    }
  }
}

export default new BrokerAvailabilityController();