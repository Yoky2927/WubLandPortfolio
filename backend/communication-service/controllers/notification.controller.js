// controllers/notification.controller.js
import NotificationModel from "../models/notification.model.js";

class NotificationController {
  // ========== GET NOTIFICATIONS ==========
  static async getNotifications(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const {
        limit = 20,
        offset = 0,
        unreadOnly = false,
        archived = false,
        type = null,
      } = req.query;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        unreadOnly: unreadOnly === "true",
        archived: archived === "true",
        type: type || null,
      };

      const notifications = await NotificationModel.getUserNotifications(
        userId,
        options,
      );

      res.status(200).json({
        success: true,
        data: {
          notifications,
          pagination: {
            limit: options.limit,
            offset: options.offset,
            total: notifications.length,
          },
        },
      });
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve notifications",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ========== GET UNREAD COUNT ==========
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const count = await NotificationModel.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: {
          unreadCount: count,
        },
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get unread count",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ========== GET NOTIFICATION STATS ==========
  static async getStats(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const stats = await NotificationModel.getUserNotificationStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting notification stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get notification statistics",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ========== MARK AS READ ==========
  static async markAsRead(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          message: "Notification ID is required",
        });
      }

      const result = await NotificationModel.markAsRead(notificationId, userId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Notification not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: { notificationId },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark notification as read",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ========== MARK ALL AS READ ==========
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const count = await NotificationModel.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: `Marked ${count} notifications as read`,
        data: { count },
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ========== ARCHIVE NOTIFICATION ==========
  static async archiveNotification(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          message: "Notification ID is required",
        });
      }

      const result = await NotificationModel.archiveNotification(
        notificationId,
        userId,
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Notification not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        message: "Notification archived",
        data: { notificationId },
      });
    } catch (error) {
      console.error("Error archiving notification:", error);
      res.status(500).json({
        success: false,
        message: "Failed to archive notification",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ========== DELETE NOTIFICATION ==========
  static async deleteNotification(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          message: "Notification ID is required",
        });
      }

      const result = await NotificationModel.deleteNotification(
        notificationId,
        userId,
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Notification not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
        data: { notificationId },
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete notification",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ========== CREATE NOTIFICATION (Internal use) ==========
  static async createNotification(req, res) {
    try {
      // This endpoint is for internal services only
      // The middleware should verify internal service token

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
      } = req.body;

      // Validate required fields
      if (!userId || !title || !message) {
        return res.status(400).json({
          success: false,
          message: "userId, title, and message are required fields",
        });
      }

      // Validate type
      const validTypes = ["info", "success", "warning", "error", "system"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid notification type. Must be one of: ${validTypes.join(", ")}`,
        });
      }

      // Validate priority
      const validPriorities = ["low", "medium", "high", "urgent"];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
        });
      }

      // Create notification
      const notificationId = await NotificationModel.createNotification({
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
        deliveryMethods,
      });

      // Get the created notification
      const notifications = await NotificationModel.getUserNotifications(
        userId,
        {
          limit: 1,
          offset: 0,
        },
      );

      const notification = notifications.find((n) => n.id === notificationId);

      if (!notification) {
        throw new Error("Failed to retrieve created notification");
      }

      // Send real-time notification via WebSocket if available
      try {
        const { emitNotification } = await import("../utils/socket.js");
        if (typeof emitNotification === "function") {
          emitNotification(userId, notification);
        }
      } catch (socketError) {
        console.warn(
          "Socket notification failed (may be expected if sockets not set up):",
          socketError.message,
        );
      }

      res.status(201).json({
        success: true,
        message: "Notification created successfully",
        data: { notification },
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create notification",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // ========== GET NOTIFICATION BY ID ==========
  static async getNotificationById(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const notification = await NotificationModel.getNotificationById(
        notificationId,
        userId,
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      // Mark as read when fetched (optional - you might want this)
      // await NotificationModel.markAsRead(notificationId, userId);

      res.status(200).json({
        success: true,
        data: { notification },
      });
    } catch (error) {
      console.error("Error getting notification by ID:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve notification",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  static async triggerNotification(req, res) {
    try {
      // Verify internal service token
      const serviceToken = req.headers["service-auth"];
      if (serviceToken !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized service access",
        });
      }

      const { type, data } = req.body;

      if (!type || !data) {
        return res.status(400).json({
          success: false,
          message: "Type and data are required",
        });
      }

      // Enhanced notification type mapping
      const notificationTypeMap = {
        // Seller/Landlord notifications
        BROKER_ASSIGNED: "broker_assigned",
        INSPECTION_SCHEDULED: "inspection_scheduled",
        INSPECTION_COMPLETED: "inspection_completed",
        LISTING_PROPOSAL_READY: "listing_proposal_ready",
        ADMIN_APPROVAL_GRANTED: "admin_approval_granted",
        ADMIN_APPROVAL_REJECTED: "admin_approval_rejected",
        PROPERTY_PUBLISHED: "property_published",
        CONTRACT_READY: "contract_ready",
        PAYMENT_RECEIVED: "payment_received",

        // Buyer/Renter notifications
        VERIFICATION_COMPLETE: "verification_complete",
        NEW_PROPERTY_MATCH: "new_property_match",
        OFFER_SUBMITTED: "offer_submitted",
        OFFER_STATUS_UPDATE: "offer_status_update",
        APPOINTMENT_SCHEDULED: "appointment_scheduled",
        APPOINTMENT_UPDATED: "appointment_updated",
        APPOINTMENT_CANCELLED: "appointment_cancelled",
        PAYMENT_SUCCESSFUL: "payment_successful",
        PAYMENT_FAILED: "payment_failed",
        CONTRACT_SIGNED: "contract_signed",

        // Broker notifications
        BROKER_NEW_REQUEST: "broker_new_request",
        BROKER_CLIENT_RESPONSE: "broker_client_response",

        // Support notifications
        SUPPORT_TICKET_CREATED: "support_ticket_created",
        SUPPORT_TICKET_UPDATED: "support_ticket_updated",

        // System notifications
        SYSTEM_ANNOUNCEMENT: "system_announcement",
        MAINTENANCE_SCHEDULED: "maintenance_scheduled",

        // Chat notifications
        CHAT_AVAILABLE: "chat_available",
        NEW_MESSAGE: "new_message",
      };

      const notificationType = notificationTypeMap[type] || type.toLowerCase();

      // Extract user ID from data
      const userId = data.userId || data.clientId;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      // Create notification title based on type
      const titleMap = {
        broker_assigned: "Broker Assigned",
        inspection_scheduled: "Inspection Scheduled",
        inspection_completed: "Inspection Completed",
        listing_proposal_ready: "Listing Proposal Ready",
        admin_approval_granted: "Listing Approved",
        admin_approval_rejected: "Listing Needs Revisions",
        property_published: "Property Published",
        verification_complete: "Verification Complete",
        new_property_match: "New Property Match",
        offer_submitted: "Offer Submitted",
        offer_status_update: "Offer Status Updated",
        appointment_scheduled: "Appointment Scheduled",
        appointment_updated: "Appointment Updated",
        appointment_cancelled: "Appointment Cancelled",
        payment_successful: "Payment Successful",
        payment_failed: "Payment Failed",
        contract_signed: "Contract Signed",
        chat_available: "Chat Available",
        new_message: "New Message",
      };

      const title = data.title || titleMap[notificationType] || "Notification";

      // Create notification
      const notificationId = await NotificationModel.createNotification({
        userId,
        title,
        message: data.message,
        type: notificationType,
        actionUrl: data.actionUrl,
        icon: data.icon,
        relatedEntityType: data.metadata?.entityType,
        relatedEntityId: data.metadata?.entityId,
        priority: data.priority || "medium",
        metadata: data.metadata,
      });

      // Get the created notification
      const notifications = await NotificationModel.getUserNotifications(
        userId,
        {
          limit: 1,
          offset: 0,
        },
      );

      const notification = notifications.find((n) => n.id === notificationId);

      // Send real-time notification via WebSocket if available
      try {
        const { emitNotification } = await import("../utils/socket.js");
        if (typeof emitNotification === "function" && notification) {
          emitNotification(userId, notification);
        }
      } catch (socketError) {
        console.warn("Socket notification failed:", socketError.message);
      }

      res.status(201).json({
        success: true,
        message: "Notification triggered successfully",
        notificationId,
        notification,
      });
    } catch (error) {
      console.error("Error triggering notification:", error);
      res.status(500).json({
        success: false,
        message: "Failed to trigger notification",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
  // ========== GET RECENT NOTIFICATIONS ==========
  static async getRecentNotifications(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { limit = 10 } = req.query;

      const notifications = await NotificationModel.getUserNotifications(
        userId,
        {
          limit: parseInt(limit),
          offset: 0,
          unreadOnly: false,
          archived: false,
        },
      );

      res.status(200).json({
        success: true,
        data: { notifications },
      });
    } catch (error) {
      console.error("Error getting recent notifications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve recent notifications",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

export default NotificationController;
