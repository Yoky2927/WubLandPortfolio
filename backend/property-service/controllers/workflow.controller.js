// controllers/workflow.controller.js - FIXED VERSION
import PropertyModel from "../models/property.model.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import pool from "../config/database.js";
import NotificationService from "../services/notification.service.js";

// Status constants
const PROPERTY_STATUS = {
  DRAFT: "draft",
  PENDING_CLIENT_APPROVAL: "pending", // Changed to match your existing status
  PENDING_ADMIN_APPROVAL: "pending_admin_approval",
  ACTIVE: "active",
  REJECTED: "rejected",
  SOLD: "sold",
  RENTED: "rented",
  INACTIVE: "inactive",
};

// Helper functions
const safeJsonParse = (str, defaultValue = []) => {
  try {
    return str ? JSON.parse(str) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Helper: CREATE NOTIFICATION
const createNotification = async (userId, type, message, data = {}) => {
  try {
    console.log(`🔔 Notification to user ${userId}: ${type} - ${message}`);

    await pool.execute(
      `INSERT INTO notifications 
       (user_id, type, message, data, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, type, message, JSON.stringify(data)]
    );
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// Helper: NOTIFY ADMINS FOR APPROVAL
const notifyAdminsForApproval = async (propertyId, propertyTitle, clientId) => {
  try {
    const [admins] = await pool.execute(
      `SELECT id FROM users WHERE role IN ('admin', 'super_admin', 'support_admin')`
    );

    for (const admin of admins) {
      await createNotification(
        admin.id,
        "new_listing_for_approval",
        `New property listing requires admin approval: ${propertyTitle}`,
        {
          propertyId,
          propertyTitle,
          clientId,
          actionRequired: true,
        }
      );
    }

    console.log(
      `📢 Notified ${admins.length} admins about property ${propertyId}`
    );
  } catch (error) {
    console.error("Error notifying admins:", error);
  }
};

// Helper: GET NEXT ACTIONS
const getNextActions = (currentStatus, userRole, permissions) => {
  const actions = [];

  if (userRole.includes("broker") && permissions.isAssignedBroker) {
    if (currentStatus === "draft") {
      actions.push({
        action: "submit_for_client_approval",
        label: "Submit for Client Approval",
        endpoint: `/api/workflow/properties/{id}/submit-for-approval`,
      });
      actions.push({
        action: "save_draft",
        label: "Save as Draft",
        endpoint: `/api/properties/{id}`,
      });
    }
  }

  if (
    ["seller", "landlord", "user"].includes(userRole) &&
    permissions.isOwner
  ) {
    if (currentStatus === PROPERTY_STATUS.PENDING_CLIENT_APPROVAL) {
      actions.push({
        action: "approve",
        label: "Approve Listing",
        endpoint: `/api/workflow/properties/{id}/client-approve`,
      });
      actions.push({
        action: "request_changes",
        label: "Request Changes",
        endpoint: `/api/workflow/properties/{id}/request-changes`,
      });
    }
  }

  if (permissions.isAdmin) {
    if (currentStatus === PROPERTY_STATUS.PENDING_ADMIN_APPROVAL) {
      actions.push({
        action: "approve",
        label: "Approve & Publish",
        endpoint: `/api/admin/properties/{id}/status`,
      });
      actions.push({
        action: "reject",
        label: "Reject Listing",
        endpoint: `/api/admin/properties/{id}/status`,
      });
    }
  }

  return actions;
};

class WorkflowController {
  // BROKER: CREATE DRAFT FROM PROPERTY REQUEST
  async createDraftFromRequest(req, res) {
    try {
      const brokerId = req.user.id;
      const brokerRole = req.user.role;
      const { requestId } = req.params;
      const propertyData = req.body;

      console.log("📋 Broker creating draft from request:", {
        brokerId,
        requestId,
      });

      // Validate broker can create drafts
      if (
        ![
          "internal_broker",
          "external_broker",
          "admin",
          "super_admin",
        ].includes(brokerRole)
      ) {
        return errorResponse(
          res,
          403,
          "Only brokers can create property drafts"
        );
      }

      // Get property request
      const [requests] = await pool.execute(
        `SELECT pr.*, 
                u.username as client_username,
                u.email as client_email,
                u.id as client_id
         FROM property_requests pr
         JOIN users u ON pr.user_id = u.id
         WHERE pr.id = ? AND pr.status IN ('assigned', 'in_progress')`,
        [requestId]
      );

      if (requests.length === 0) {
        return errorResponse(
          res,
          404,
          "Property request not found or not in correct status"
        );
      }

      const propertyRequest = requests[0];

      // Verify broker is assigned to this request
      if (propertyRequest.assigned_broker_id !== brokerId) {
        return errorResponse(
          res,
          403,
          "You are not assigned to this property request"
        );
      }

      // Prepare property data with workflow status
      const draftData = {
        ...propertyData,
        owner_user_id: propertyRequest.user_id,
        assigned_broker_id: brokerId,
        title: propertyData.title || `Property from Request #${requestId}`,
        description:
          propertyData.description ||
          `Property listing based on request from ${propertyRequest.client_username}`,
        address: propertyData.address || propertyRequest.location,
        property_status: PROPERTY_STATUS.PENDING_CLIENT_APPROVAL,
      };

      // Create property
      const property = await PropertyModel.create(draftData);

      // Update request status
      await pool.execute(
        `UPDATE property_requests 
         SET status = 'in_progress', 
             current_step = 3,
             updated_at = NOW()
         WHERE id = ?`,
        [requestId]
      );

      // Create notification for client
      await createNotification(
        propertyRequest.user_id,
        "property_draft_created",
        `Your broker has created a draft property listing for your request. Please review and approve.`,
        {
          propertyId: property.id,
          requestId: requestId,
          brokerName: req.user.username || "Your broker",
        }
      );

      successResponse(res, 201, "Property draft created successfully", {
        property: {
          id: property.id,
          title: property.title,
          status: property.property_status,
          nextStep: "client_approval",
        },
        message:
          "Draft created. The client has been notified to review and approve.",
      });
    } catch (error) {
      console.error("Error creating draft from request:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // CLIENT: APPROVE DRAFT
  async clientApproveDraft(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // ✅ FIX THIS LINE TOO - use the same pattern
      const propertyId = req.params.id || req.params.propertyId;

      const { notes } = req.body;

      console.log("✅ Client approving draft:", { userId, propertyId, notes });

      if (!["seller", "landlord", "user"].includes(userRole)) {
        return errorResponse(
          res,
          403,
          "Only property owners can approve drafts"
        );
      }

      // Get property
      const property = await PropertyModel.findById(propertyId);

      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Verify ownership
      if (property.owner_user_id !== userId) {
        return errorResponse(res, 403, "You do not own this property");
      }

      // Verify status
      if (
        property.property_status !== PROPERTY_STATUS.PENDING_CLIENT_APPROVAL
      ) {
        return errorResponse(
          res,
          400,
          `Property must be in pending approval status. Current: ${property.property_status}`
        );
      }

      // Update status
      const updatedProperty = await PropertyModel.update(propertyId, {
        property_status: PROPERTY_STATUS.PENDING_ADMIN_APPROVAL,
        updated_by: userId,
      });

      // Update associated request status
      const [requests] = await pool.execute(
        `SELECT id FROM property_requests 
       WHERE user_id = ? AND status = 'in_progress'
       ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      if (requests.length > 0) {
        await pool.execute(
          `UPDATE property_requests 
         SET status = 'listing',
             current_step = 4,
             updated_at = NOW()
         WHERE id = ?`,
          [requests[0].id]
        );
      }

      // Notify broker
      if (property.assigned_broker_id) {
        await createNotification(
          property.assigned_broker_id,
          "client_approved_draft",
          `Your client has approved property draft: ${property.title}`,
          {
            propertyId: propertyId,
            propertyTitle: property.title,
          }
        );
      }

      // Notify admins
      await notifyAdminsForApproval(propertyId, property.title, userId);

      successResponse(res, 200, "Property submitted for admin approval", {
        property: updatedProperty,
        nextStep: "admin_review",
        estimatedTime: "24-48 hours for admin review",
      });
    } catch (error) {
      console.error("Error in client approve draft:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // CLIENT: REQUEST CHANGES
  async clientRequestChanges(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { propertyId } = req.params;
      const { changesRequested, notes } = req.body;

      console.log("✏️ Client requesting changes:", { userId, propertyId });

      if (!changesRequested) {
        return errorResponse(
          res,
          400,
          "Please specify what changes are needed"
        );
      }

      if (!["seller", "landlord", "user"].includes(userRole)) {
        return errorResponse(
          res,
          403,
          "Only property owners can request changes"
        );
      }

      const property = await PropertyModel.findById(propertyId);

      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Verify ownership
      if (property.owner_user_id !== userId) {
        return errorResponse(res, 403, "You do not own this property");
      }

      // Verify status
      if (
        property.property_status !== PROPERTY_STATUS.PENDING_CLIENT_APPROVAL
      ) {
        return errorResponse(
          res,
          400,
          `Property must be in pending approval status. Current: ${property.property_status}`
        );
      }

      // Update status back to draft
      const updatedProperty = await PropertyModel.update(propertyId, {
        property_status: PROPERTY_STATUS.DRAFT,
        updated_by: userId,
        notes: `Client requested changes: ${changesRequested}. ${notes || ""}`,
      });

      // Notify broker
      if (property.assigned_broker_id) {
        await createNotification(
          property.assigned_broker_id,
          "client_requested_changes",
          `Client requested changes: ${changesRequested}`,
          {
            propertyId: propertyId,
            propertyTitle: property.title,
            changesRequested,
          }
        );
      }

      successResponse(res, 200, "Changes requested successfully", {
        property: updatedProperty,
        message: "Broker has been notified",
      });
    } catch (error) {
      console.error("Error in client request changes:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // BROKER: UPDATE DRAFT
  async brokerUpdateDraft(req, res) {
    try {
      const brokerId = req.user.id;
      const brokerRole = req.user.role;
      const { propertyId } = req.params;
      const updates = req.body;

      console.log("🔄 Broker updating draft:", { brokerId, propertyId });

      if (!["internal_broker", "external_broker"].includes(brokerRole)) {
        return errorResponse(res, 403, "Only brokers can update drafts");
      }

      const property = await PropertyModel.findById(propertyId);

      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Verify broker assignment
      if (property.assigned_broker_id !== brokerId) {
        return errorResponse(res, 403, "Not assigned to this property");
      }

      // Verify status
      if (property.property_status !== PROPERTY_STATUS.DRAFT) {
        return errorResponse(res, 400, "Property must be in draft status");
      }

      // Update property
      const updatedProperty = await PropertyModel.update(propertyId, {
        ...updates,
        updated_by: brokerId,
      });

      successResponse(res, 200, "Draft updated successfully", updatedProperty);
    } catch (error) {
      console.error("Error updating draft:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // GET CLIENT APPROVAL QUEUE
  async getClientApprovalQueue(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { page = 1, limit = 20 } = req.query;

      console.log("📋 Getting client approval queue:", { userId });

      if (!["seller", "landlord", "user"].includes(userRole)) {
        return errorResponse(res, 403, "Access denied");
      }

      // Build query
      let query = `
        SELECT p.*, 
          u.username as owner_username,
          u.email as owner_email,
          b.username as broker_username,
          b.email as broker_email
        FROM properties p
        LEFT JOIN users u ON p.owner_user_id = u.id
        LEFT JOIN users b ON p.assigned_broker_id = b.id
        WHERE p.property_status = ? 
          AND p.owner_user_id = ?
          AND p.deleted_at IS NULL
      `;

      const params = [PROPERTY_STATUS.PENDING_CLIENT_APPROVAL, userId];

      // Count total
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM properties 
         WHERE property_status = ? AND owner_user_id = ? AND deleted_at IS NULL`,
        [PROPERTY_STATUS.PENDING_CLIENT_APPROVAL, userId]
      );

      const total = countResult[0].total;

      // Add pagination
      const offset = (page - 1) * limit;
      query += " ORDER BY p.updated_at DESC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), offset);

      const [properties] = await pool.execute(query, params);

      // Parse JSON fields
      const parsedProperties = properties.map((property) => ({
        ...property,
        features: safeJsonParse(property.features),
        amenities: safeJsonParse(property.amenities),
        status_history: safeJsonParse(property.status_history),
      }));

      successResponse(res, 200, "Client approval queue retrieved", {
        properties: parsedProperties,
        count: parsedProperties.length,
        total: total,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
        instructions:
          "Please review these draft listings and approve or request changes.",
      });
    } catch (error) {
      console.error("Error getting client approval queue:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // GET ADMIN APPROVAL QUEUE
  async getAdminApprovalQueue(req, res) {
    try {
      const userRole = req.user.role;
      const { page = 1, limit = 20 } = req.query;

      console.log("📋 Getting admin approval queue");

      if (!["admin", "super_admin", "support_admin"].includes(userRole)) {
        return errorResponse(res, 403, "Access denied. Admin role required.");
      }

      // Build query
      let query = `
        SELECT p.*, 
          u.username as owner_username,
          u.email as owner_email,
          u.privilege_tier as owner_tier,
          b.username as broker_username,
          b.email as broker_email
        FROM properties p
        LEFT JOIN users u ON p.owner_user_id = u.id
        LEFT JOIN users b ON p.assigned_broker_id = b.id
        WHERE p.property_status = ?
          AND p.deleted_at IS NULL
      `;

      const params = [PROPERTY_STATUS.PENDING_ADMIN_APPROVAL];

      // Count total
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM properties 
         WHERE property_status = ? AND deleted_at IS NULL`,
        [PROPERTY_STATUS.PENDING_ADMIN_APPROVAL]
      );

      const total = countResult[0].total;

      // Add pagination
      const offset = (page - 1) * limit;
      query += " ORDER BY p.updated_at DESC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), offset);

      const [properties] = await pool.execute(query, params);

      successResponse(res, 200, "Admin approval queue retrieved", {
        properties: properties.map((p) => ({
          ...p,
          features: safeJsonParse(p.features),
          amenities: safeJsonParse(p.amenities),
          status_history: safeJsonParse(p.status_history),
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error getting admin approval queue:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // GET BROKER DRAFTS
  async getBrokerDrafts(req, res) {
    try {
      const brokerId = req.user.id;
      const brokerRole = req.user.role;
      const { status } = req.query;

      console.log("📋 Getting broker drafts:", { brokerId });

      if (
        ![
          "internal_broker",
          "external_broker",
          "admin",
          "super_admin",
        ].includes(brokerRole)
      ) {
        return errorResponse(res, 403, "Access denied");
      }

      let statusFilter;
      if (status === "draft") {
        statusFilter = PROPERTY_STATUS.DRAFT;
      } else if (status === "pending_client_approval") {
        statusFilter = PROPERTY_STATUS.PENDING_CLIENT_APPROVAL;
      } else {
        // Get both by default
        const [drafts] = await pool.execute(
          `SELECT p.* FROM properties p
           WHERE p.property_status = ? 
             AND p.assigned_broker_id = ?
             AND p.deleted_at IS NULL
           ORDER BY p.updated_at DESC`,
          [PROPERTY_STATUS.DRAFT, brokerId]
        );

        const [pendingApproval] = await pool.execute(
          `SELECT p.* FROM properties p
           WHERE p.property_status = ? 
             AND p.assigned_broker_id = ?
             AND p.deleted_at IS NULL
           ORDER BY p.updated_at DESC`,
          [PROPERTY_STATUS.PENDING_CLIENT_APPROVAL, brokerId]
        );

        return successResponse(res, 200, "Broker listings retrieved", {
          drafts: {
            properties: drafts.map((p) => ({
              ...p,
              features: safeJsonParse(p.features),
              amenities: safeJsonParse(p.amenities),
            })),
            count: drafts.length,
          },
          pendingClientApproval: {
            properties: pendingApproval.map((p) => ({
              ...p,
              features: safeJsonParse(p.features),
              amenities: safeJsonParse(p.amenities),
            })),
            count: pendingApproval.length,
          },
          totalActiveListings: drafts.length + pendingApproval.length,
        });
      }

      const [properties] = await pool.execute(
        `SELECT p.* FROM properties p
         WHERE p.property_status = ? 
           AND p.assigned_broker_id = ?
           AND p.deleted_at IS NULL
         ORDER BY p.updated_at DESC`,
        [statusFilter, brokerId]
      );

      successResponse(res, 200, "Broker listings retrieved", {
        properties: properties.map((p) => ({
          ...p,
          features: safeJsonParse(p.features),
          amenities: safeJsonParse(p.amenities),
        })),
        count: properties.length,
      });
    } catch (error) {
      console.error("Error getting broker drafts:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // GET PROPERTY WORKFLOW STATUS
  async getPropertyWorkflowStatus(req, res) {
    try {
      const { propertyId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log("📊 Getting workflow status:", { propertyId, userId });

      const property = await PropertyModel.findById(propertyId);

      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Check authorization
      const isOwner = property.owner_user_id === userId;
      const isAssignedBroker = property.assigned_broker_id === userId;
      const isAdmin = ["admin", "super_admin"].includes(userRole);

      if (!isOwner && !isAssignedBroker && !isAdmin) {
        return errorResponse(
          res,
          403,
          "Not authorized to view this property workflow"
        );
      }

      // Determine next possible actions
      const nextActions = getNextActions(property.property_status, userRole, {
        isOwner,
        isAssignedBroker,
        isAdmin,
      });

      successResponse(res, 200, "Property workflow status retrieved", {
        property: {
          id: property.id,
          title: property.title,
          status: property.property_status,
          statusHistory: property.status_history || [],
          ownerId: property.owner_user_id,
          brokerId: property.assigned_broker_id,
          createdBy: property.created_by_user_id,
        },
        nextActions,
        userPermissions: {
          canApprove:
            isOwner &&
            property.property_status ===
              PROPERTY_STATUS.PENDING_CLIENT_APPROVAL,
          canRequestChanges:
            isOwner &&
            property.property_status ===
              PROPERTY_STATUS.PENDING_CLIENT_APPROVAL,
          canUpdateDraft:
            isAssignedBroker &&
            property.property_status === PROPERTY_STATUS.DRAFT,
          canAdminApprove:
            isAdmin &&
            property.property_status === PROPERTY_STATUS.PENDING_ADMIN_APPROVAL,
          canAdminReject:
            isAdmin &&
            property.property_status === PROPERTY_STATUS.PENDING_ADMIN_APPROVAL,
        },
      });
    } catch (error) {
      console.error("Error getting property workflow status:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // GET HOMEPAGE LISTINGS (Premium + Featured)
  async getHomepageListings(req, res) {
    try {
      const { limit = 12 } = req.query;

      console.log("🏠 Getting homepage listings");

      // Get premium listings first
      const [premiumListings] = await pool.execute(
        `SELECT p.*, u.username as owner_username
         FROM properties p
         LEFT JOIN users u ON p.owner_user_id = u.id
         WHERE p.property_status = 'active'
           AND p.is_premium = 1
           AND p.deleted_at IS NULL
         ORDER BY p.published_at DESC
         LIMIT ?`,
        [parseInt(limit)]
      );

      // Get featured if not enough premium
      const remaining = parseInt(limit) - premiumListings.length;
      let featuredListings = [];

      if (remaining > 0) {
        [featuredListings] = await pool.execute(
          `SELECT p.*, u.username as owner_username
           FROM properties p
           LEFT JOIN users u ON p.owner_user_id = u.id
           WHERE p.property_status = 'active'
             AND p.is_featured = 1
             AND p.is_premium = 0
             AND p.deleted_at IS NULL
           ORDER BY p.published_at DESC
           LIMIT ?`,
          [remaining]
        );
      }

      const allListings = [...premiumListings, ...featuredListings];

      successResponse(res, 200, "Homepage listings retrieved successfully", {
        listings: allListings.map((p) => ({
          ...p,
          features: safeJsonParse(p.features, []),
          amenities: safeJsonParse(p.amenities, []),
          isPremium: p.is_premium === 1,
          isFeatured: p.is_featured === 1,
        })),
        stats: {
          premiumCount: premiumListings.length,
          featuredCount: featuredListings.length,
          total: allListings.length,
        },
      });
    } catch (error) {
      console.error("Error getting homepage listings:", error);
      errorResponse(res, 500, error.message);
    }
  }

  async adminApproveProperty(req, res) {
    try {
      const adminId = req.user.id;
      const adminRole = req.user.role;

      // ✅ FIX 1: Get propertyId from params
      const propertyId = req.params.id || req.params.propertyId;

      // ✅ FIX 2: Get notes from request body
      const { notes } = req.body;

      console.log("✅ Admin approving property:", {
        adminId,
        propertyId,
        notes,
        params: req.params,
        body: req.body,
      });

      // Validate admin role
      if (!["admin", "super_admin", "support_admin"].includes(adminRole)) {
        return errorResponse(res, 403, "Access denied");
      }

      // Validate propertyId
      if (!propertyId) {
        return errorResponse(res, 400, "Property ID is required");
      }

      // Get property
      const property = await PropertyModel.findById(propertyId);

      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Verify status
      if (property.property_status !== PROPERTY_STATUS.PENDING_ADMIN_APPROVAL) {
        return errorResponse(res, 400, "Property not pending admin approval");
      }

      // Update to active
      const updateData = {
        property_status: PROPERTY_STATUS.ACTIVE,
        published_at: new Date(),
        updated_by: adminId,
        notes: notes || "Admin approved listing",
      };

      console.log("📝 Updating property with data:", updateData);

      const updatedProperty = await PropertyModel.update(
        propertyId,
        updateData
      );

      // Set as premium based on owner tier
      const [ownerResult] = await pool.execute(
        "SELECT privilege_tier FROM users WHERE id = ?",
        [property.owner_user_id]
      );

      let isPremium = false;
      if (ownerResult.length > 0) {
        const ownerTier = ownerResult[0].privilege_tier;
        isPremium = ["premium", "enterprise"].includes(ownerTier);

        if (isPremium) {
          await pool.execute(
            "UPDATE properties SET is_premium = 1 WHERE id = ?",
            [propertyId]
          );
          console.log(
            `⭐ Property ${propertyId} set as premium (owner tier: ${ownerTier})`
          );
        }
      }

      // Notify broker and client
      const notifications = [];

      if (property.assigned_broker_id) {
        notifications.push(
          createNotification(
            property.assigned_broker_id,
            "admin_approved_listing",
            `Property "${property.title}" approved and published`,
            { propertyId }
          )
        );
      }

      notifications.push(
        createNotification(
          property.owner_user_id,
          "listing_published",
          `Your property "${property.title}" is now live on the platform`,
          { propertyId }
        )
      );

      await Promise.all(notifications);

      // Send external notification
      await NotificationService.notifyPropertyPublished(
        propertyId,
        property.title,
        property.owner_user_id,
        isPremium
      );

      successResponse(res, 200, "Property approved and published", {
        property: updatedProperty,
        isPremium: isPremium,
      });
    } catch (error) {
      console.error("Error approving property:", error);
      errorResponse(res, 500, error.message);
    }
  }
  // ADMIN REJECT PROPERTY
  async adminRejectProperty(req, res) {
    try {
      const adminId = req.user.id;
      const adminRole = req.user.role;

      // ✅ FIX THIS LINE TOO
      const propertyId = req.params.id || req.params.propertyId;

      const { rejectionReason, notes } = req.body;

      console.log("❌ Admin rejecting property:", {
        adminId,
        propertyId,
        rejectionReason,
        notes,
      });

      if (!["admin", "super_admin", "support_admin"].includes(adminRole)) {
        return errorResponse(res, 403, "Access denied");
      }

      if (!rejectionReason) {
        return errorResponse(res, 400, "Rejection reason is required");
      }

      const property = await PropertyModel.findById(propertyId);

      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Verify status
      if (property.property_status !== PROPERTY_STATUS.PENDING_ADMIN_APPROVAL) {
        return errorResponse(res, 400, "Property not pending admin approval");
      }

      // Update to rejected
      const updatedProperty = await PropertyModel.update(propertyId, {
        property_status: PROPERTY_STATUS.REJECTED,
        updated_by: adminId,
        notes: `Rejected: ${rejectionReason}. ${notes || ""}`,
      });

      // Notify broker
      if (property.assigned_broker_id) {
        await createNotification(
          property.assigned_broker_id,
          "admin_rejected_listing",
          `Property "${property.title}" was rejected: ${rejectionReason}`,
          {
            propertyId,
            rejectionReason,
            notes: notes || "",
          }
        );
      }

      successResponse(res, 200, "Property rejected", {
        property: updatedProperty,
        message: "Broker has been notified to make corrections",
      });
    } catch (error) {
      console.error("Error rejecting property:", error);
      errorResponse(res, 500, error.message);
    }
  }
}

export default new WorkflowController();
