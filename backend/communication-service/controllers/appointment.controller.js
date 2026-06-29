// communication-service/controllers/appointment.controller.js
import AppointmentModel from "../models/appointment.model.js";
import AppointmentAttendeeModel from "../models/appointmentAttendee.model.js";
import NotificationService from "../utils/notificationService.js";
import EmailService from "../utils/emailService.js";
import { emitNotification } from "../utils/socket.js";
import crypto from "crypto";

class AppointmentController {
  // Create new appointment
  static async createAppointment(req, res) {
    let appointmentId = null;
    let appointmentCreated = false;

    try {
      const userId = req.user.id;
      const appointmentData = req.body;

      console.log("📅 Creating appointment:", {
        userId,
        appointmentData: JSON.stringify(appointmentData, null, 2),
      });

      // Validate required fields
      const requiredFields = ["title", "scheduled_date", "start_time"];
      const missingFields = requiredFields.filter(
        (field) => !appointmentData[field],
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields,
        });
      }

      // Generate UUID if not provided
      if (!appointmentData.appointment_uuid) {
        appointmentData.appointment_uuid = crypto.randomUUID();
      }

      // Set organizer and creator
      appointmentData.organizer_user_id = userId;
      appointmentData.created_by_user_id = userId;

      // Format times for MySQL DATETIME
      appointmentData.start_time = appointmentData.start_time
        .slice(0, 19)
        .replace("T", " ");

      if (!appointmentData.end_time) {
        const start = new Date(appointmentData.start_time);
        start.setHours(start.getHours() + 1);
        appointmentData.end_time = start
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
      } else {
        appointmentData.end_time = appointmentData.end_time
          .slice(0, 19)
          .replace("T", " ");
      }

      console.log("⏰ Time details (formatted):", {
        start_time: appointmentData.start_time,
        end_time: appointmentData.end_time,
      });

      // STEP 1: Create appointment
      appointmentId = await AppointmentModel.createAppointment(appointmentData);
      appointmentCreated = true;

      console.log("✅ Appointment created with ID:", appointmentId);

      // STEP 2: Add organizer as attendee
      await AppointmentAttendeeModel.addAttendee(appointmentId, userId, {
        attendee_role: "client",
        attendee_status: "confirmed",
        is_broker: false,
      });

      // STEP 3: Add broker as attendee if specified
      if (appointmentData.broker_id && appointmentData.broker_id !== userId) {
        try {
          await AppointmentAttendeeModel.addAttendee(
            appointmentId,
            appointmentData.broker_id,
            {
              attendee_role: "broker",
              attendee_status: "invited",
              is_broker: true,
              send_reminder: true,
            },
          );

          // STEP 4: Send notification
          try {
            await NotificationService.createNotification({
              userId: appointmentData.broker_id,
              title: "New Appointment Scheduled",
              message: `You have been invited to an appointment: ${appointmentData.title}`,
              type: "appointment",
              actionUrl: `/appointments/${appointmentId}`,
              priority: "medium",
              relatedEntityType: "appointment",
              relatedEntityId: appointmentId,
            });
          } catch (notificationError) {
            console.warn(
              "⚠️ Notification creation failed:",
              notificationError.message,
            );
          }
        } catch (attendeeError) {
          console.warn(
            "⚠️ Broker attendee creation failed:",
            attendeeError.message,
          );
        }
      }

      // STEP 5: Try to get appointment details - with fallback if query fails
      let appointment = null;
      try {
        appointment = await AppointmentModel.getAppointmentById(appointmentId);
      } catch (fetchError) {
        console.warn(
          "⚠️ Failed to fetch appointment details, creating minimal response:",
          fetchError.message,
        );

        // Create a minimal appointment object with basic info
        appointment = {
          id: appointmentId,
          appointment_uuid: appointmentData.appointment_uuid,
          title: appointmentData.title,
          scheduled_date: appointmentData.scheduled_date,
          start_time: appointmentData.start_time,
          end_time: appointmentData.end_time,
          appointment_type: appointmentData.appointment_type,
          status: appointmentData.status,
          property_id: appointmentData.property_id,
          broker_id: appointmentData.broker_id,
          organizer_user_id: appointmentData.organizer_user_id,
          created_at: new Date().toISOString(),
        };
      }

      console.log("✅ Appointment process completed");

      res.status(201).json({
        success: true,
        message: "Appointment scheduled successfully!",
        appointment,
        appointmentId,
        warning: appointment.property_title
          ? undefined
          : "Some details could not be loaded",
      });
    } catch (error) {
      console.error("❌ Error in appointment creation process:", error);

      // If appointment was created but we have an error
      if (appointmentCreated && appointmentId) {
        console.log(
          "⚠️ Appointment created but error occurred:",
          appointmentId,
        );

        // Try to get basic appointment info directly
        try {
          const minimalQuery = `
          SELECT id, appointment_uuid, title, scheduled_date, start_time, end_time, 
                 appointment_type, status, property_id, broker_id, organizer_user_id, created_at
          FROM appointments 
          WHERE id = ? AND deleted_at IS NULL
        `;
          const [rows] = await db.execute(minimalQuery, [appointmentId]);

          if (rows[0]) {
            return res.status(207).json({
              // 207 Multi-Status
              success: "partial",
              message:
                "Appointment created successfully, but some details could not be loaded",
              appointment: rows[0],
              appointmentId,
              warning: "Some appointment details may be incomplete",
              error:
                process.env.NODE_ENV === "development"
                  ? error.message
                  : undefined,
            });
          }
        } catch (fallbackError) {
          console.warn("Fallback query also failed:", fallbackError.message);
        }

        // Still send success if we know appointment was created
        return res.status(201).json({
          success: true,
          message: "Appointment scheduled successfully!",
          appointmentId,
          warning: "Appointment created but details could not be retrieved",
        });
      }

      // Complete failure
      res.status(500).json({
        success: false,
        message: "Failed to create appointment",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Get user appointments
  static async getUserAppointments(req, res) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const appointments = await AppointmentModel.getUserAppointments(
        userId,
        filters,
      );

      // Get attendee status for each appointment
      const appointmentsWithDetails = await Promise.all(
        appointments.map(async (appointment) => {
          const attendees =
            await AppointmentAttendeeModel.getAppointmentAttendees(
              appointment.id,
            );
          return {
            ...appointment,
            attendees,
            current_user_status:
              attendees.find((a) => a.user_id === userId)?.attendee_status ||
              null,
          };
        }),
      );

      res.json({
        success: true,
        data: appointmentsWithDetails,
        count: appointmentsWithDetails.length,
      });
    } catch (error) {
      console.error("Error getting user appointments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get appointments",
      });
    }
  }

  // Get appointment by ID
  static async getAppointmentById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get appointment
      const appointment = await AppointmentModel.getAppointmentById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // Check if user has access to this appointment
      const isOrganizer = appointment.organizer_user_id === userId;
      const isBroker = appointment.broker_id === userId;
      const isAttendee = await AppointmentAttendeeModel.isUserAttendee(
        id,
        userId,
      );

      if (!isOrganizer && !isBroker && !isAttendee) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view this appointment",
        });
      }

      // Get attendees
      const attendees =
        await AppointmentAttendeeModel.getAppointmentAttendees(id);
      const attendeeCount = await AppointmentAttendeeModel.getAttendeeCount(id);

      res.json({
        success: true,
        data: {
          ...appointment,
          attendees,
          attendee_count: attendeeCount,
          current_user_status:
            attendees.find((a) => a.user_id === userId)?.attendee_status ||
            null,
          can_edit: isOrganizer,
          can_cancel: isOrganizer,
        },
      });
    } catch (error) {
      console.error("Error getting appointment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get appointment",
      });
    }
  }

  // Update appointment
  static async updateAppointment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Get appointment to check permissions
      const appointment = await AppointmentModel.getAppointmentById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // Check if user is organizer
      if (appointment.organizer_user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only the organizer can update this appointment",
        });
      }

      // Check time slot availability if changing time
      if (updates.start_time || updates.end_time) {
        const isAvailable = await AppointmentModel.isTimeSlotAvailable(
          appointment.broker_id || updates.broker_id || null,
          appointment.property_id || updates.property_id || null,
          updates.start_time || appointment.start_time,
          updates.end_time ||
            appointment.end_time ||
            new Date(
              new Date(updates.start_time || appointment.start_time).getTime() +
                60 * 60 * 1000,
            ),
          id,
        );

        if (!isAvailable) {
          return res.status(409).json({
            success: false,
            message: "Time slot is not available",
          });
        }
      }

      // Update appointment
      const updated = await AppointmentModel.updateAppointment(id, updates);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Failed to update appointment",
        });
      }

      // Get updated appointment
      const updatedAppointment = await AppointmentModel.getAppointmentById(id);

      // Notify attendees about changes
      const attendees =
        await AppointmentAttendeeModel.getAppointmentAttendees(id);

      for (const attendee of attendees) {
        if (attendee.user_id !== userId) {
          await NotificationService.createNotification({
            userId: attendee.user_id,
            title: "Appointment Updated",
            message: `Appointment "${updatedAppointment.title}" has been updated`,
            type: "appointment",
            actionUrl: `/appointments/${id}`,
            priority: "medium",
          });
        }
      }

      res.json({
        success: true,
        message: "Appointment updated successfully",
        data: updatedAppointment,
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update appointment",
      });
    }
  }

  // Delete appointment
  static async deleteAppointment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get appointment to check permissions
      const appointment = await AppointmentModel.getAppointmentById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // Check if user is organizer
      if (appointment.organizer_user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only the organizer can cancel this appointment",
        });
      }

      // Delete appointment
      const deleted = await AppointmentModel.deleteAppointment(id, userId);

      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: "Failed to cancel appointment",
        });
      }

      // Notify attendees
      const attendees =
        await AppointmentAttendeeModel.getAppointmentAttendees(id);

      for (const attendee of attendees) {
        if (attendee.user_id !== userId) {
          await NotificationService.createNotification({
            userId: attendee.user_id,
            title: "Appointment Cancelled",
            message: `Appointment "${appointment.title}" has been cancelled`,
            type: "appointment",
            actionUrl: `/appointments`,
            priority: "medium",
          });
        }
      }

      res.json({
        success: true,
        message: "Appointment cancelled successfully",
      });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel appointment",
      });
    }
  }

  // Update appointment status
  static async updateAppointmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (
        !status ||
        ![
          "scheduled",
          "confirmed",
          "completed",
          "cancelled",
          "no_show",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid status is required: scheduled, confirmed, completed, cancelled, or no_show",
        });
      }

      // Get appointment to check permissions
      const appointment = await AppointmentModel.getAppointmentById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // Check if user has permission (organizer or broker)
      const isOrganizer = appointment.organizer_user_id === userId;
      const isBroker = appointment.broker_id === userId;

      if (!isOrganizer && !isBroker) {
        return res.status(403).json({
          success: false,
          message: "Only organizer or broker can update appointment status",
        });
      }

      // Update status
      const updated = await AppointmentModel.updateAppointmentStatus(
        id,
        status,
        userId,
      );

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Failed to update appointment status",
        });
      }

      // Get updated appointment
      const updatedAppointment = await AppointmentModel.getAppointmentById(id);

      // Notify attendees about status change
      const attendees =
        await AppointmentAttendeeModel.getAppointmentAttendees(id);

      for (const attendee of attendees) {
        if (attendee.user_id !== userId) {
          await NotificationService.createNotification({
            userId: attendee.user_id,
            title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Appointment "${appointment.title}" status changed to ${status}`,
            type: "appointment",
            actionUrl: `/appointments/${id}`,
            priority: "medium",
          });
        }
      }

      res.json({
        success: true,
        message: `Appointment status updated to ${status}`,
        data: updatedAppointment,
      });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update appointment status",
      });
    }
  }

  // Add attendee to appointment
  static async addAttendee(req, res) {
    try {
      const { id } = req.params;
      const {
        user_id,
        attendee_role = "client",
        send_reminder = true,
      } = req.body;
      const organizerId = req.user.id;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      // Get appointment to check permissions
      const appointment = await AppointmentModel.getAppointmentById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // Check if user is organizer
      if (appointment.organizer_user_id !== organizerId) {
        return res.status(403).json({
          success: false,
          message: "Only organizer can add attendees",
        });
      }

      // Check max attendees
      const attendeeCount = await AppointmentAttendeeModel.getAttendeeCount(id);
      if (
        appointment.max_attendees &&
        attendeeCount.total >= appointment.max_attendees
      ) {
        return res.status(409).json({
          success: false,
          message: "Maximum number of attendees reached",
        });
      }

      // Add attendee
      const attendeeId = await AppointmentAttendeeModel.addAttendee(
        id,
        user_id,
        {
          attendee_role,
          attendee_status: "invited",
          is_broker: attendee_role === "broker",
          send_reminder,
        },
      );

      // Send notification to new attendee
      await NotificationService.createNotification({
        userId: user_id,
        title: "Appointment Invitation",
        message: `You have been invited to an appointment: ${appointment.title}`,
        type: "appointment",
        actionUrl: `/appointments/${id}`,
        priority: "medium",
        relatedEntityType: "appointment",
        relatedEntityId: id,
      });

      // Get attendee details
      const attendees =
        await AppointmentAttendeeModel.getAppointmentAttendees(id);
      const newAttendee = attendees.find((a) => a.id === attendeeId);

      res.status(201).json({
        success: true,
        message: "Attendee added successfully",
        data: newAttendee,
      });
    } catch (error) {
      console.error("Error adding attendee:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add attendee",
      });
    }
  }

  // Update attendee status (for attendees to accept/decline)
  static async updateAttendeeStatus(req, res) {
    try {
      const { appointmentId, userId } = req.params;
      const { status } = req.body;
      const currentUserId = req.user.id;

      if (
        !status ||
        !["invited", "confirmed", "declined", "attended", "no_show"].includes(
          status,
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid status is required",
        });
      }

      // Check if user is updating their own status
      if (parseInt(userId) !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own attendance status",
        });
      }

      // Update status
      const updated = await AppointmentAttendeeModel.updateAttendeeStatus(
        appointmentId,
        userId,
        status,
      );

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Failed to update attendance status",
        });
      }

      // Get appointment and notify organizer
      const appointment =
        await AppointmentModel.getAppointmentById(appointmentId);
      if (appointment && appointment.organizer_user_id !== userId) {
        await NotificationService.createNotification({
          userId: appointment.organizer_user_id,
          title: "Attendance Status Updated",
          message: `${req.user.first_name} ${req.user.last_name} ${status} the appointment "${appointment.title}"`,
          type: "appointment",
          actionUrl: `/appointments/${appointmentId}`,
          priority: "low",
        });
      }

      res.json({
        success: true,
        message: `Attendance status updated to ${status}`,
      });
    } catch (error) {
      console.error("Error updating attendee status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update attendance status",
      });
    }
  }

  // Get appointments for a property
  static async getPropertyAppointments(req, res) {
    try {
      const { propertyId } = req.params;
      const userId = req.user.id;
      const filters = req.query;

      // TODO: Check if user has permission to view this property's appointments

      const appointments = await AppointmentModel.getPropertyAppointments(
        propertyId,
        filters,
      );

      res.json({
        success: true,
        data: appointments,
        count: appointments.length,
      });
    } catch (error) {
      console.error("Error getting property appointments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get property appointments",
      });
    }
  }

  // Get appointments for a broker
  static async getBrokerAppointments(req, res) {
    try {
      const { brokerId } = req.params;
      const userId = req.user.id;
      const filters = req.query;

      // Check if user is the broker or has permission
      if (parseInt(brokerId) !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own appointments",
        });
      }

      const appointments = await AppointmentModel.getBrokerAppointments(
        brokerId,
        filters,
      );

      res.json({
        success: true,
        data: appointments,
        count: appointments.length,
      });
    } catch (error) {
      console.error("Error getting broker appointments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get broker appointments",
      });
    }
  }

  // Get appointment statistics
  static async getAppointmentStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await AppointmentModel.getAppointmentStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting appointment stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get appointment statistics",
      });
    }
  }

  // Get upcoming appointments
  static async getUpcomingAppointments(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;

      const appointments = await AppointmentModel.getUpcomingAppointments(
        userId,
        limit,
      );

      res.json({
        success: true,
        data: appointments,
        count: appointments.length,
      });
    } catch (error) {
      console.error("Error getting upcoming appointments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get upcoming appointments",
      });
    }
  }

  // Mark attendee as attended (for organizer/broker to mark attendance)
  static async markAttendeeAsAttended(req, res) {
    try {
      const { appointmentId, userId } = req.params;
      const organizerId = req.user.id;

      // Get appointment to check permissions
      const appointment =
        await AppointmentModel.getAppointmentById(appointmentId);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // Check if user is organizer or broker
      const isOrganizer = appointment.organizer_user_id === organizerId;
      const isBroker = appointment.broker_id === organizerId;

      if (!isOrganizer && !isBroker) {
        return res.status(403).json({
          success: false,
          message: "Only organizer or broker can mark attendance",
        });
      }

      // Mark as attended
      const updated = await AppointmentAttendeeModel.markAsAttended(
        appointmentId,
        userId,
      );

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Failed to mark attendee as attended",
        });
      }

      // Update appointment status if all confirmed attendees have attended
      const attendees =
        await AppointmentAttendeeModel.getAppointmentAttendees(appointmentId);
      const confirmedAttendees = attendees.filter(
        (a) => a.attendee_status === "confirmed",
      );
      const attendedAttendees = attendees.filter(
        (a) => a.attendee_status === "attended",
      );

      if (
        confirmedAttendees.length > 0 &&
        confirmedAttendees.length === attendedAttendees.length
      ) {
        await AppointmentModel.updateAppointmentStatus(
          appointmentId,
          "completed",
          organizerId,
        );
      }

      res.json({
        success: true,
        message: "Attendee marked as attended",
      });
    } catch (error) {
      console.error("Error marking attendee as attended:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark attendance",
      });
    }
  }
}

export default AppointmentController;
