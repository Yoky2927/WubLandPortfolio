import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { checkRole } from "../middlewares/role.middleware.js";
import WorkflowController from "../controllers/workflow.controller.js";
import ChatController from "../controllers/chat.controller.js";

const router = express.Router();

// ================= WORKFLOW ENDPOINTS =================

// Broker creates draft from property request
router.post(
  "/requests/:requestId/create-draft",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin", "super_admin"]),
  WorkflowController.createDraftFromRequest
);

// Client approves draft
router.post(
  "/properties/:propertyId/client-approve",
  authenticate,
  checkRole(["seller", "landlord", "user"]),
  WorkflowController.clientApproveDraft
);

// Client requests changes
router.post(
  "/properties/:propertyId/request-changes",
  authenticate,
  checkRole(["seller", "landlord", "user"]),
  WorkflowController.clientRequestChanges
);

// Broker updates draft after changes
router.put(
  "/properties/:propertyId/update-draft",
  authenticate,
  checkRole(["internal_broker", "external_broker"]),
  WorkflowController.brokerUpdateDraft
);

// Get client approval queue
router.get(
  "/client/approval-queue",
  authenticate,
  checkRole(["seller", "landlord", "user"]),
  WorkflowController.getClientApprovalQueue
);

// Get admin approval queue
router.get(
  "/admin/approval-queue",
  authenticate,
  checkRole(["admin", "super_admin", "support_admin"]),
  WorkflowController.getAdminApprovalQueue
);

// Get broker drafts
router.get(
  "/broker/drafts",
  authenticate,
  checkRole(["internal_broker", "external_broker", "admin", "super_admin"]),
  WorkflowController.getBrokerDrafts
);

// Get property workflow status
router.get(
  "/properties/:propertyId/workflow-status",
  authenticate,
  WorkflowController.getPropertyWorkflowStatus
);

// ================= CHAT ENDPOINTS =================

// Get or create chat session
router.get(
  "/chat/session/:propertyRequestId",
  authenticate,
  ChatController.getOrCreateChatSession
);

// Get user chat sessions
router.get(
  "/chat/sessions",
  authenticate,
  ChatController.getUserChatSessions
);

// Send message
router.post(
  "/chat/:chatSessionId/message",
  authenticate,
  ChatController.sendMessage
);

// Mark messages as read
router.post(
  "/chat/:chatSessionId/read",
  authenticate,
  ChatController.markMessagesAsRead
);

// ================= PUBLIC ENDPOINTS =================

// Get homepage listings (premium + featured)
router.get(
  "/homepage-listings",
  WorkflowController.getHomepageListings
);

// Get premium listings only
router.get(
  "/premium-listings",
  WorkflowController.getPremiumListings
);

export default router;