import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  FileText,
  Shield,
  X,
  MessageCircle,
  Sparkles,
  RefreshCw,
  Loader as LoaderIcon,
  Archive,
  ChevronRight,
  Clock,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Upload,
  FileWarning,
  ArrowRight,
  Eye,
  AlertOctagon,
} from "lucide-react";
import { apiCall } from "../utils/api.endpoints";
import { toast } from "react-hot-toast";

const NotificationToggle = ({
  onOpenChat,
  onOpenDocumentUpload,
  onOpenVerification,
  user,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const bellRef = useRef(null);
  const [isClickRinging, setIsClickRinging] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState({});

  const isDark = theme === "dark";

  // Get notification icon with enhanced icons
  const getIcon = (type) => {
    switch (type) {
      case "document":
      case "document_submitted":
        return <FileText className="w-5 h-5" />;
      case "verification":
      case "verification_update":
        return <ShieldCheck className="w-5 h-5" />;
      case "verification_complete":
        return <CheckCircle className="w-5 h-5" />;
      case "verification_resubmission":
      case "document_rejected":
        return <AlertOctagon className="w-5 h-5" />;
      case "document_approved":
        return <FileCheck className="w-5 h-5" />;
      case "document_needs_resubmission":
        return <FileWarning className="w-5 h-5" />;
      case "application":
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "message":
        return <MessageCircle className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "upload_required":
        return <Upload className="w-5 h-5" />;
      case "broker_assigned":
        return <Users className="w-5 h-5" />;
      case "inspection_scheduled":
        return <Calendar className="w-5 h-5" />;
      case "inspection_completed":
        return <ShieldCheck className="w-5 h-5" />;
      case "listing_proposal_ready":
        return <FileText className="w-5 h-5" />;
      case "admin_approval_granted":
        return <CheckCircle className="w-5 h-5" />;
      case "admin_approval_rejected":
        return <AlertTriangle className="w-5 h-5" />;
      case "property_published":
        return <Globe className="w-5 h-5" />;
      case "verification_complete":
        return <UserCheck className="w-5 h-5" />;
      case "new_property_match":
        return <Home className="w-5 h-5" />;
      case "offer_submitted":
      case "offer_status_update":
        return <FileEdit className="w-5 h-5" />;
      case "appointment_scheduled":
      case "appointment_updated":
      case "appointment_cancelled":
        return <Calendar className="w-5 h-5" />;
      case "payment_successful":
      case "payment_received":
      case "payment_failed":
        return <DollarSign className="w-5 h-5" />;
      case "contract_ready":
      case "contract_signed":
        return <FileText className="w-5 h-5" />;
      case "broker_new_request":
        return <Bell className="w-5 h-5" />;
      case "chat_available":
        return <MessageCircle className="w-5 h-5" />;
      case "new_message":
        return <MessageCircle className="w-5 h-5" />;
      case "system_announcement":
        return <Megaphone className="w-5 h-5" />;
      case "maintenance_scheduled":
        return <Wrench className="w-5 h-5" />;
      case "support_ticket_created":
      case "support_ticket_updated":
        return <Headphones className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  // Get icon color with enhanced colors
  const getIconColor = (type) => {
    switch (type) {
      case "document":
      case "document_submitted":
        return "text-blue-500";
      case "verification_complete":
      case "document_approved":
        return "text-emerald-500";
      case "verification_resubmission":
      case "document_rejected":
      case "document_needs_resubmission":
        return "text-orange-500";
      case "verification_update":
        return "text-blue-500";
      case "verification":
        return "text-emerald-500";
      case "upload_required":
        return "text-amber-500";
      case "application":
        return "text-purple-500";
      case "message":
        return "text-amber-500";
      case "success":
        return "text-emerald-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-amber-500";
      case "broker_assigned":
      case "verification_complete":
      case "new_property_match":
      case "chat_available":
      case "new_message":
        return "text-blue-500";
      case "inspection_scheduled":
      case "appointment_scheduled":
      case "appointment_updated":
        return "text-indigo-500";
      case "inspection_completed":
      case "listing_proposal_ready":
      case "contract_ready":
      case "contract_signed":
        return "text-emerald-500";
      case "admin_approval_granted":
      case "payment_successful":
      case "payment_received":
        return "text-green-500";
      case "admin_approval_rejected":
      case "payment_failed":
      case "appointment_cancelled":
        return "text-red-500";
      case "property_published":
      case "offer_submitted":
      case "offer_status_update":
        return "text-purple-500";
      case "broker_new_request":
        return "text-amber-500";
      case "system_announcement":
        return "text-cyan-500";
      case "maintenance_scheduled":
        return "text-orange-500";
      case "support_ticket_created":
      case "support_ticket_updated":
        return "text-pink-500";
      default:
        return "text-amber-500";
    }
  };

  // Get status color with enhanced colors
  const getStatusColor = (type) => {
    switch (type) {
      case "document":
      case "document_submitted":
        return "bg-blue-100 dark:bg-blue-900/30";
      case "verification_complete":
      case "document_approved":
        return "bg-emerald-100 dark:bg-emerald-900/30";
      case "verification_resubmission":
      case "document_rejected":
      case "document_needs_resubmission":
        return "bg-orange-100 dark:bg-orange-900/30";
      case "verification_update":
        return "bg-blue-100 dark:bg-blue-900/30";
      case "verification":
        return "bg-emerald-100 dark:bg-emerald-900/30";
      case "upload_required":
        return "bg-amber-100 dark:bg-amber-900/30";
      case "application":
        return "bg-purple-100 dark:bg-purple-900/30";
      case "message":
        return "bg-amber-100 dark:bg-amber-900/30";
      case "success":
        return "bg-emerald-100 dark:bg-emerald-900/30";
      case "error":
        return "bg-red-100 dark:bg-red-900/30";
      case "warning":
        return "bg-amber-100 dark:bg-amber-900/30";
      case "broker_assigned":
      case "verification_complete":
      case "new_property_match":
      case "chat_available":
      case "new_message":
        return "bg-blue-100 dark:bg-blue-900/30";
      case "inspection_scheduled":
      case "appointment_scheduled":
      case "appointment_updated":
        return "bg-indigo-100 dark:bg-indigo-900/30";
      case "inspection_completed":
      case "listing_proposal_ready":
      case "contract_ready":
      case "contract_signed":
        return "bg-emerald-100 dark:bg-emerald-900/30";
      case "admin_approval_granted":
      case "payment_successful":
      case "payment_received":
        return "bg-green-100 dark:bg-green-900/30";
      case "admin_approval_rejected":
      case "payment_failed":
      case "appointment_cancelled":
        return "bg-red-100 dark:bg-red-900/30";
      case "property_published":
      case "offer_submitted":
      case "offer_status_update":
        return "bg-purple-100 dark:bg-purple-900/30";
      case "broker_new_request":
        return "bg-amber-100 dark:bg-amber-900/30";
      case "system_announcement":
        return "bg-cyan-100 dark:bg-cyan-900/30";
      case "maintenance_scheduled":
        return "bg-orange-100 dark:bg-orange-900/30";
      case "support_ticket_created":
      case "support_ticket_updated":
        return "bg-pink-100 dark:bg-pink-900/30";
      default:
        return "bg-amber-100 dark:bg-amber-900/30";
    }
  };

  // Enhanced fetch notifications with verification support
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall("GET_NOTIFICATIONS");

      if (response && response.success && Array.isArray(response.data)) {
        const formattedNotifications = response.data.map((notification) => {
          // Parse metadata if available
          let metadata = {};
          try {
            metadata = notification.metadata
              ? JSON.parse(notification.metadata)
              : {};
          } catch (error) {
            console.error("Error parsing notification metadata:", error);
          }

          // Map notification types and enhance messages
          let notificationType = notification.notification_type;
          let notificationMessage = notification.message;
          let notificationTitle = notification.title;
          let documentType = metadata.documentType || metadata.entityType || "";
          let specificFeedback =
            metadata.feedback || metadata.additional_info || "";
          let documentId = metadata.documentId || metadata.entityId || "";

          // Enhance verification notifications with better messages
          switch (notificationType) {
            case "verification_complete":
              notificationMessage =
                "🎉 Your identity verification is complete! You can now explore properties.";
              break;
            case "verification_resubmission":
            case "document_needs_resubmission":
              notificationTitle = "Resubmission Required";
              notificationMessage = documentType
                ? `🔄 Your ${documentType.replace("_", " ")} needs to be resubmitted. ${specificFeedback}`
                : `🔄 Your documents need resubmission. ${specificFeedback}`;
              break;
            case "document_approved":
              notificationMessage = documentType
                ? `✅ Your ${documentType.replace("_", " ")} has been approved.`
                : "✅ Your document has been approved.";
              break;
            case "document_rejected":
              notificationMessage = documentType
                ? `❌ Your ${documentType.replace("_", " ")} needs corrections. ${specificFeedback}`
                : `❌ Your document needs corrections. ${specificFeedback}`;
              break;
          }

          // Ensure we have a valid ID that's a string
          const notificationId =
            notification.id ||
            notification.notification_uuid ||
            `notif-${Date.now()}-${Math.random()}`;

          return {
            id: notificationId,
            title: notificationTitle || getDefaultTitle(notificationType),
            message: notificationMessage || getDefaultMessage(notificationType),
            type: notificationType,
            timestamp: notification.created_at || new Date().toISOString(),
            isRead: notification.is_read === true || notification.is_read === 1,
            actionUrl: notification.action_url || null,
            metadata: metadata,
            priority: notification.priority || "medium",
            additionalInfo: notification.additional_info,
            documentType: documentType,
            documentId: documentId,
            feedback: specificFeedback,
          };
        });

        const newUnread = formattedNotifications.filter(
          (n) => !n.isRead,
        ).length;
        const oldUnread = unreadCount;
        setPreviousUnreadCount(oldUnread);

        setNotifications(formattedNotifications);
        setUnreadCount(newUnread);
        localStorage.setItem("notification_badge_count", newUnread.toString());

        // Store notification details for quick access
        const details = {};
        formattedNotifications.forEach((notif) => {
          if (notif.id && typeof notif.id === "string") {
            details[notif.id] = notif;
          }
        });
        setNotificationDetails(details);

        // SMART RINGING LOGIC for important notifications
        if (newUnread > 0 && newUnread > oldUnread && !isOpen) {
          setHasNewNotifications(true);
          triggerRingEffect();

          // Show toast for important verification notifications
          const importantNotifications = formattedNotifications.filter(
            (n) =>
              !n.isRead &&
              (n.type.includes("resubmission") ||
                n.type.includes("rejected") ||
                n.type.includes("complete") ||
                n.priority === "high"),
          );

          importantNotifications.forEach((notif) => {
            if (notif.type === "verification_complete") {
              toast.success(notif.message, {
                duration: 5000,
                icon: "✅",
              });
            } else if (
              notif.type.includes("resubmission") ||
              notif.type.includes("rejected")
            ) {
              toast.error(notif.message, {
                duration: 6000,
                icon: "🔄",
                action: {
                  label: "Resubmit",
                  onClick: () => handleResubmissionClick(notif),
                },
              });
            } else if (notif.priority === "high") {
              toast(notif.message, {
                duration: 5000,
                icon: "🔔",
                style: {
                  background: isDark ? "#1f2937" : "#ffffff",
                  color: isDark ? "#f3f4f6" : "#111827",
                  border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
                },
              });
            }
          });
        }

        if (newUnread === 0) {
          setHasNewNotifications(false);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resubmission click from toast
  const handleResubmissionClick = (notification) => {
    if (onOpenDocumentUpload && notification.documentType) {
      onOpenDocumentUpload({
        documentType: notification.documentType,
        isResubmission: true,
        adminFeedback: notification.feedback || notification.additionalInfo,
        resubmissionDocument: notification.documentType,
        metadata: notification.metadata,
      });
    } else if (onOpenVerification) {
      onOpenVerification();
    }
  };

  // Trigger ring effect with growing circles
  const triggerRingEffect = () => {
    setIsRinging(true);
    setTimeout(() => {
      setIsRinging(false);
    }, 1500);
  };

  // Handle bell click
  const handleBellClick = () => {
    setIsClickRinging(true);
    setTimeout(() => setIsClickRinging(false), 600);

    if (isRinging) {
      setIsRinging(false);
    }

    setHasNewNotifications(false);
    setIsOpen(!isOpen);

    if (bellRef.current) {
      bellRef.current.style.transform = "scale(0.9)";
      setTimeout(() => {
        if (bellRef.current) {
          bellRef.current.style.transform = "scale(1)";
        }
      }, 150);
    }

    if (!isOpen) {
      fetchNotifications();
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationTime.toLocaleDateString();
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif,
        ),
      );
      const newUnreadCount = notifications.filter(
        (n) => n.id !== notificationId && !n.isRead,
      ).length;
      setUnreadCount(newUnreadCount);
      localStorage.setItem(
        "notification_badge_count",
        newUnreadCount.toString(),
      );

      // Only call API for real notifications (not generated ones)
      if (
        notificationId &&
        typeof notificationId === "string" &&
        !notificationId.startsWith("notif-")
      ) {
        await apiCall("MARK_NOTIFICATION_READ", { id: notificationId });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true })),
      );
      setUnreadCount(0);
      localStorage.setItem("notification_badge_count", "0");

      const realNotificationIds = notifications
        .filter(
          (n) =>
            !n.isRead && typeof n.id === "string" && !n.id.startsWith("notif-"),
        )
        .map((n) => n.id);

      await Promise.all(
        realNotificationIds.map((notif) =>
          apiCall("MARK_NOTIFICATION_READ", { id: notif }).catch(console.error),
        ),
      );

      toast.success("All notifications marked as read");
      setHasNewNotifications(false);
      setIsRinging(false);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case "message":
        if (onOpenChat) {
          onOpenChat();
          setIsOpen(false);
        }
        break;

      case "verification_resubmission":
      case "document_needs_resubmission":
      case "document_rejected":
        if (onOpenDocumentUpload) {
          onOpenDocumentUpload({
            documentType: notification.documentType || "id_card",
            isResubmission: true,
            adminFeedback: notification.feedback || notification.additionalInfo,
            resubmissionDocument: notification.documentType,
            metadata: notification.metadata,
          });
          setIsOpen(false);
          toast.info("Opening document upload for resubmission", {
            icon: "📄",
            duration: 2000,
          });
        } else {
          toast.info(
            "Please upload corrected documents in the verification section",
            {
              duration: 4000,
              icon: "📄",
            },
          );
        }
        break;

      case "verification_complete":
      case "verification_update":
        if (onOpenVerification) {
          onOpenVerification();
          setIsOpen(false);
        }
        break;

      default:
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
          setIsOpen(false);
        }
        break;
    }
  };

  // Get default title
  const getDefaultTitle = (type) => {
    const titles = {
      success: "Action Completed",
      error: "Action Required",
      warning: "Important Notice",
      info: "Update Available",
      document: "Document Update",
      document_submitted: "Document Submitted",
      document_approved: "Document Approved",
      document_rejected: "Document Needs Corrections",
      document_needs_resubmission: "Resubmission Required",
      verification: "Verification Status",
      verification_update: "Verification Update",
      verification_complete: "Verification Complete",
      verification_resubmission: "Resubmission Required",
      application: "Application Update",
      message: "New Message",
      upload_required: "Upload Required",
    };
    return titles[type] || "New Notification";
  };

  // Get default message
  const getDefaultMessage = (type) => {
    const messages = {
      success: "Your action has been completed successfully",
      error: "Action required to proceed",
      warning: "Important notice regarding your account",
      info: "There is an update available for you",
      document: "Your document status has been updated",
      document_submitted: "Your document has been submitted for review",
      document_approved: "Your document has been approved",
      document_rejected: "Your document needs corrections",
      document_needs_resubmission:
        "Please resubmit your document with corrections",
      verification: "Verification process update",
      verification_update: "Your verification status has been updated",
      verification_complete: "Your identity verification is complete",
      verification_resubmission: "Please resubmit your verification documents",
      application: "Application status changed",
      message: "You have a new message",
      upload_required: "Please upload the required document",
    };
    return messages[type] || "You have a new notification";
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for verification status changes
  useEffect(() => {
    const handleVerificationUpdate = () => {
      fetchNotifications();
    };

    const handleStorageChange = (e) => {
      if (
        e.key === "notification_badge_count" ||
        e.key === "user_verification_status"
      ) {
        fetchNotifications();
      }
    };

    window.addEventListener("verification-update", handleVerificationUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "verification-update",
        handleVerificationUpdate,
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Sort notifications
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 fixed bottom-24 right-20 z-50 ${
          isRinging ? "animate-bellRing" : ""
        } ${
          hasNewNotifications && unreadCount > 0 ? "animate-strongPulse" : ""
        } ${
          isDark
            ? "bg-gradient-to-br from-amber-600 to-amber-700"
            : "bg-gradient-to-br from-amber-500 to-amber-600"
        } hover:scale-110 active:scale-95 shadow-2xl`}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <div className="relative w-8 h-8">
          <Bell className="w-8 h-8 text-white" />

          {/* Growing circles for unread notifications */}
          {hasNewNotifications && unreadCount > 0 && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-amber-400 animate-ping opacity-90"></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-amber-300 animate-ping"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping"
                style={{ animationDelay: "0.4s" }}
              ></div>
              {/* Additional expanding circles */}
              <div className="absolute -inset-3 rounded-full border-2 border-amber-500/40 animate-expandRing"></div>
              <div
                className="absolute -inset-4 rounded-full border-2 border-amber-400/30 animate-expandRing"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="absolute -inset-5 rounded-full border-2 border-yellow-300/20 animate-expandRing"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </>
          )}

          {isClickRinging && (
            <>
              <div className="absolute -inset-2 rounded-full border-2 border-white/80 animate-clickRing"></div>
              <div
                className="absolute -inset-3 rounded-full border-2 border-amber-300/60 animate-clickRing"
                style={{ animationDelay: "0.1s" }}
              ></div>
            </>
          )}

          {unreadCount > 0 && (
            <span
              className={`absolute -top-2 -right-2 w-7 h-7 text-white text-xs rounded-full flex items-center justify-center border-2 ${
                isDark ? "border-gray-900" : "border-white"
              } font-bold ${
                hasNewNotifications ? "animate-badgePulse" : "shadow-lg"
              }`}
              style={{
                background:
                  "linear-gradient(135deg, #f59e0b, #d97706, #b45309)",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="fixed bottom-36 right-20 z-50 w-[450px] max-h-[600px] flex flex-col rounded-2xl shadow-2xl animate-scaleIn overflow-hidden">
          <div
            className={`flex-1 flex flex-col ${isDark ? "bg-gray-900" : "bg-white"}`}
          >
            {/* Header */}
            <div
              className={`p-5 border-b ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${isDark ? "bg-amber-900/40" : "bg-amber-100"}`}
                  >
                    <Bell
                      className={`w-6 h-6 ${isDark ? "text-amber-500" : "text-amber-600"}`}
                    />
                  </div>
                  <div>
                    <h2
                      className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Notifications
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Sparkles
                        className={`w-3.5 h-3.5 ${isDark ? "text-amber-600" : "text-amber-500"}`}
                      />
                      <span
                        className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}
                      >
                        Real-time updates
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchNotifications}
                    disabled={isLoading}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? "hover:bg-gray-800 text-amber-400"
                        : "hover:bg-amber-50 text-amber-600"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    title="Refresh"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? "hover:bg-gray-800 text-gray-400"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <LoaderIcon className="w-8 h-8 animate-spin text-amber-500 mb-4" />
                  <p
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Loading notifications...
                  </p>
                </div>
              ) : sortedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Archive
                    className={`w-16 h-16 mb-4 ${isDark ? "text-gray-700" : "text-gray-300"}`}
                  />
                  <p
                    className={`text-lg font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    No notifications
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border group ${
                        notification.isRead
                          ? isDark
                            ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          : isDark
                            ? "bg-amber-900/20 border-amber-800 hover:bg-amber-900/30"
                            : "bg-amber-50 border-amber-200 hover:bg-amber-100"
                      } hover:shadow-md relative`}
                    >
                      {/* Priority indicator */}
                      {notification.priority === "high" &&
                        !notification.isRead && (
                          <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                        )}

                      {/* Action button for resubmissions */}
                      {(notification.type.includes("resubmission") ||
                        notification.type.includes("rejected")) && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div
                            className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${
                              isDark
                                ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                : "bg-orange-100 text-orange-700 border border-orange-300"
                            }`}
                          >
                            <Upload className="w-3 h-3" />
                            <span>Resubmit</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-lg ${getStatusColor(notification.type)}`}
                        >
                          <div className={getIconColor(notification.type)}>
                            {getIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4
                              className={`font-semibold text-sm ${
                                isDark ? "text-white" : "text-gray-900"
                              } ${!notification.isRead ? "font-bold" : ""}`}
                            >
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                              )}
                              <span
                                className={`text-xs whitespace-nowrap ${isDark ? "text-gray-400" : "text-gray-500"}`}
                              >
                                {formatTime(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                          <p
                            className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                          >
                            {notification.message}
                          </p>

                          {/* Show document type if available */}
                          {notification.documentType && (
                            <div
                              className={`text-xs px-2 py-1 rounded inline-block mb-2 ${
                                isDark
                                  ? "bg-blue-900/30 text-blue-300"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {notification.documentType.replace("_", " ")}
                            </div>
                          )}

                          {notification.additionalInfo && (
                            <div
                              className={`text-xs p-2 rounded mb-3 ${
                                isDark
                                  ? "bg-gray-800 text-gray-300"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {notification.additionalInfo}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              {!notification.isRead ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                                    isDark
                                      ? "bg-amber-900/40 text-amber-300"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  Unread
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                                    isDark
                                      ? "bg-gray-800 text-gray-400"
                                      : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Read
                                </span>
                              )}

                              {/* Show action hint for specific types */}
                              {(notification.type.includes("resubmission") ||
                                notification.type.includes("rejected")) && (
                                <span
                                  className={`text-xs ${isDark ? "text-orange-400/70" : "text-orange-600/70"}`}
                                >
                                  Click to resubmit →
                                </span>
                              )}
                            </div>

                            {(notification.actionUrl ||
                              notification.type === "message") && (
                              <ChevronRight
                                className={`w-4 h-4 ${
                                  isDark ? "text-gray-500" : "text-gray-400"
                                } group-hover:translate-x-1 transition-transform`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={`p-4 border-t ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"}`}
            >
              {unreadCount > 0 && (
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {unreadCount} unread notification
                    {unreadCount !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={markAllAsRead}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isDark
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-amber-500 hover:bg-amber-600 text-white"
                    } hover:shadow-md active:scale-95`}
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add CSS animations */}
      <style>{`
        @keyframes bellRing {
          0% { transform: rotate(0deg) scale(1); }
          15% { transform: rotate(-25deg) scale(1.15); }
          30% { transform: rotate(20deg) scale(1.15); }
          45% { transform: rotate(-15deg) scale(1.1); }
          60% { transform: rotate(10deg) scale(1.05); }
          75% { transform: rotate(-5deg) scale(1.02); }
          90% { transform: rotate(3deg) scale(1.01); }
          100% { transform: rotate(0deg) scale(1); }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes strongPulse {
          0% { 
            box-shadow: 
              0 0 0 0 rgba(245, 158, 11, 0.9),
              0 0 0 0 rgba(251, 191, 36, 0.7),
              0 15px 35px -8px rgba(245, 158, 11, 0.6),
              0 25px 50px -15px rgba(245, 158, 11, 0.4),
              0 0 50px 20px rgba(245, 158, 11, 0.2) inset;
          }
          70% { 
            box-shadow: 
              0 0 0 25px rgba(245, 158, 11, 0),
              0 0 0 50px rgba(251, 191, 36, 0),
              0 20px 45px -10px rgba(245, 158, 11, 0.8),
              0 30px 60px -20px rgba(245, 158, 11, 0.6),
              0 0 60px 25px rgba(245, 158, 11, 0.3) inset;
          }
          100% { 
            box-shadow: 
              0 0 0 0 rgba(245, 158, 11, 0),
              0 0 0 0 rgba(251, 191, 36, 0),
              0 15px 35px -8px rgba(245, 158, 11, 0.6),
              0 25px 50px -15px rgba(245, 158, 11, 0.4),
              0 0 50px 20px rgba(245, 158, 11, 0.2) inset;
          }
        }
        
        @keyframes badgePulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 
              0 0 0 0 rgba(217, 119, 6, 0.8),
              0 6px 12px -2px rgba(217, 119, 6, 0.5),
              0 0 20px 5px rgba(217, 119, 6, 0.3);
          }
          50% { 
            transform: scale(1.25);
            box-shadow: 
              0 0 0 12px rgba(217, 119, 6, 0),
              0 8px 16px -4px rgba(217, 119, 6, 0.7),
              0 0 30px 10px rgba(217, 119, 6, 0.4);
          }
        }
        
        @keyframes clickRing {
          0% { 
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% { 
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        /* NEW: Expanding ring animation for unread notifications */
        @keyframes expandRing {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
            border-width: 2px;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
            border-width: 1px;
          }
        }
        
        .animate-bellRing {
          animation: bellRing 0.8s ease-in-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        
        .animate-strongPulse {
          animation: strongPulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
        
        .animate-badgePulse {
          animation: badgePulse 1.5s infinite ease-in-out;
        }
        
        .animate-clickRing {
          animation: clickRing 0.6s ease-out forwards;
        }
        
        /* NEW: Expanding ring animation */
        .animate-expandRing {
          animation: expandRing 2s infinite ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotificationToggle;
