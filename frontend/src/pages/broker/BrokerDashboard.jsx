import React, { useState, useEffect, Suspense, lazy, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useNotifications } from "../../hooks/useNotifications";
import socketService from "../../services/socket.service";
import { api } from "../../utils/api.endpoints";
import { formatProfilePicture } from "../../utils/profilePicture";

// Lazy load components
const Loader = lazy(() => import("../../components/Loader"));
const ErrorBoundary = lazy(() => import("../../components/ErrorBoundary"));
const Toast = lazy(() => import("../../components/Toast"));
const ProfileAvatar = lazy(() => import("../../components/ProfileAvatar"));
const StaticProfileAvatar = lazy(
  () => import("../../components/StaticProfileAvatar"),
);
const NotificationBadge = lazy(
  () => import("../../components/NotificationBadge"),
);
const NotificationsPanel = lazy(
  () => import("../../components/NotificationsPanel"),
);
const ThemeToggle = lazy(() => import("../../components/ThemeToggle"));

// Lazy load broker components
const BrokerPropertiesList = lazy(
  () => import("../../components/BrokerPropertiesList"),
);
const BrokerTransactions = lazy(
  () => import("../../components/BrokerTransactions"),
);
const BrokerAnalytics = lazy(() => import("../../components/BrokerAnalytics"));
const BrokerDocuments = lazy(() => import("../../components/BrokerDocuments"));
const PropertyDetailsModal = lazy(
  () => import("../../components/PropertyDetailsModal"),
);
const CreatePropertyForm = lazy(
  () => import("../../components/CreatePropertyForm"),
);
const EditPropertyForm = lazy(
  () => import("../../components/EditPropertyForm"),
);
const BrokerRequestsList = lazy(
  () => import("../../components/BrokerRequestsList"),
);
const BrokerProfessionalTools = lazy(
  () => import("../../components/BrokerProfessionalTools"),
);
const BrokerChatInterface = lazy(
  () => import("../../components/BrokerChatInterface"),
);
const BrokerBookingCalendar = lazy(
  () => import("../../components/BrokerBookingCalendar"),
);
const RequestDetailsModal = lazy(
  () => import("../../components/RequestDetailsModal"),
);

// Import icons
import {
  Users,
  Home,
  MessageSquare,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Shield,
  RefreshCw,
  Globe,
  Package,
  Database,
  Server,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  Briefcase,
  DollarSign,
  FileCheck,
  Zap,
  Target,
  MapPin,
} from "lucide-react";

const BrokerDashboard = ({ isInternal = true }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [brokerProperties, setBrokerProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestCount, setRequestCount] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showCreatePropertyForm, setShowCreatePropertyForm] = useState(false);
  const [showEditPropertyForm, setShowEditPropertyForm] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState(null);
  const [showProfessionalTools, setShowProfessionalTools] = useState(false);
  const [selectedRequestForTools, setSelectedRequestForTools] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Chat state
  const [activeChats, setActiveChats] = useState([]);
  const [unreadChats, setUnreadChats] = useState(0);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);

  // Workflow state
  const [workflowStats, setWorkflowStats] = useState({
    pendingRequests: 0,
    assignedRequests: 0,
    draftsInProgress: 0,
    waitingClientApproval: 0,
    waitingAdminApproval: 0,
    liveProperties: 0,
    totalCommission: 0,
    recentActivity: [],
  });

  const [brokerStats, setBrokerStats] = useState({
    totalListings: 0,
    pendingReviews: 0,
    approvedListings: 0,
    rejectedListings: 0,
    activeClients: 0,
    totalRevenue: 0,
    responseRate: 0,
    avgResponseTime: "0h",
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    totalDocuments: 0,
    signedContracts: 0,
    pendingDocuments: 0,
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const navigate = useNavigate();
  const { notificationCount, setNotificationCount } = useNotifications(
    user?.id,
  );
  const { analyticsData, fetchAnalyticsData: fetchAnalyticsDataHook } =
    useAnalytics();

  // Navigation items configuration
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      badge: workflowStats.pendingRequests,
    },
    {
      id: "requests",
      label: "Property Requests",
      icon: Users,
      badge: requestCount,
    },
    {
      id: "properties",
      label: "My Listings",
      icon: Building,
      badge: brokerStats.pendingReviews,
    },
    {
      id: "drafts",
      label: "Drafts in Progress",
      icon: FileText,
      badge: workflowStats.draftsInProgress,
    },
    {
      id: "clients",
      label: "My Clients",
      icon: Briefcase,
      badge: brokerStats.activeClients,
    },
    {
      id: "documents",
      label: "Document Vault",
      icon: FileText,
      badge: brokerStats.pendingDocuments,
    },
    { id: "calendar", label: "Bookings Calendar", icon: Calendar },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Get profile picture URL
  const profilePictureUrl = formatProfilePicture(user);

  // Helper to get user from localStorage
  const getUserFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error reading user from localStorage:", error);
      return null;
    }
  }, []);

  // ========== WORKFLOW FUNCTIONS ==========

  // Check if broker can access professional tools (paid or verified)
  const canAccessProfessionalTools = () => {
    if (!user) return false;

    // Internal brokers always have access
    if (isInternal) return true;

    // External brokers need to be verified AND have paid subscription
    const isVerified = user.verification_status === "verified";
    const hasPaid =
      user.subscription_status === "active" ||
      user.subscription_status === "premium";
    const isVerifiedByAdmin = user.broker_verified_by_admin === true;

    return (isVerified && hasPaid) || isVerifiedByAdmin;
  };

  // Fetch workflow statistics
  const fetchWorkflowStats = async (brokerId) => {
    try {
      const response = await api.get("GET_WORKFLOW_STATS", {}, { brokerId });

      if (response.success && response.data) {
        setWorkflowStats({
          pendingRequests: response.data.pendingRequests || 0,
          assignedRequests: response.data.assignedRequests || 0,
          draftsInProgress: response.data.draftsInProgress || 0,
          waitingClientApproval: response.data.waitingClientApproval || 0,
          waitingAdminApproval: response.data.waitingAdminApproval || 0,
          liveProperties: response.data.liveProperties || 0,
          totalCommission: response.data.totalCommission || 0,
          recentActivity: response.data.recentActivity || [],
        });
      }
    } catch (error) {
      console.warn("Could not fetch workflow stats:", error.message);
    }
  };

  // Accept a property request
  const handleAcceptRequest = async (requestId) => {
    console.log("✅ Accepting request:", requestId);

    try {
      // Make sure requestId is a number
      const numericRequestId = Number(requestId);
      if (isNaN(numericRequestId)) {
        throw new Error(`Invalid request ID: ${requestId}`);
      }

      // Call the API with the proper format
      const response = await api.post(
        "BROKER_ACCEPT_REQUEST",
        {}, // Empty object for body
        { id: numericRequestId }, // params go here, not in body
      );

      console.log("📥 Response:", response);

      if (response.success) {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: "assigned" } : req,
          ),
        );

        if (setToast) {
          setToast({
            show: true,
            message: "Request accepted successfully!",
            type: "success",
          });
        }
        fetchRequests();
      } else {
        throw new Error(response.message || "Failed to accept request");
      }
    } catch (error) {
      console.error("❌ Error accepting request:", error);
      if (setToast) {
        setToast({
          show: true,
          message: `Failed to accept request: ${error.message}`,
          type: "error",
        });
      }
    }
  };

  // Create draft property from request
  const handleCreateDraftFromRequest = async (requestId) => {
    if (!canAccessProfessionalTools()) {
      setToast({
        show: true,
        message:
          "You need to be verified and have an active subscription to create listings",
        type: "warning",
      });
      return;
    }

    try {
      const response = await api.post("CREATE_DRAFT_FROM_REQUEST", {
        requestId,
      });

      if (response.success) {
        setToast({
          show: true,
          message:
            "Draft created successfully! Now you can edit and submit for client approval.",
          type: "success",
        });

        // Open professional tools for this draft
        const request = requests.find((r) => r.id === requestId);
        if (request) {
          setSelectedRequestForTools({
            ...request,
            draftId: response.data.draftId,
          });
          setShowProfessionalTools(true);
        }

        // Refresh data
        fetchBrokerDashboardData(user.id);
      }
    } catch (error) {
      console.error("Error creating draft:", error);
      setToast({
        show: true,
        message: "Failed to create draft",
        type: "error",
      });
    }
  };

  // Submit draft for client approval
  const handleSubmitForClientApproval = async (propertyId) => {
    try {
      const response = await api.post("SUBMIT_FOR_CLIENT_APPROVAL", {
        id: propertyId,
      });

      if (response.success) {
        setToast({
          show: true,
          message: "Property submitted for client approval!",
          type: "success",
        });

        // Send notification to client
        const property = brokerProperties.find((p) => p.id === propertyId);
        if (property) {
          sendNotificationToClient(
            property.client_id,
            "property_submitted_for_approval",
            propertyId,
          );
        }

        // Refresh data
        fetchBrokerDashboardData(user.id);
      }
    } catch (error) {
      console.error("Error submitting for approval:", error);
      setToast({
        show: true,
        message: "Failed to submit for approval",
        type: "error",
      });
    }
  };

  // ========== REQUEST DETAILS FUNCTIONS ==========

  const handleViewRequestDetails = async (request) => {
    try {
      // Fetch full request details from backend
      const response = await api.get("GET_PROPERTY_BY_ID", {
        id: request.property_id,
      });

      if (response.success && response.data) {
        // Combine request data with property details
        const enhancedRequest = {
          ...request,
          property_details: response.data,
          // Include images if available
          images: response.data.images || [],
          // Include documents if available
          documents: response.data.documents || [],
        };

        setSelectedRequest(enhancedRequest);
        setShowRequestDetails(true);
      } else {
        // Fallback to basic request data
        setSelectedRequest(request);
        setShowRequestDetails(true);
      }
    } catch (error) {
      console.error("Error fetching request details:", error);
      // Fallback to basic request data
      setSelectedRequest(request);
      setShowRequestDetails(true);
    }
  };

  // ========== CHAT FUNCTIONS ==========

  const fetchActiveChats = async (brokerId) => {
    try {
      const response = await api.get("GET_BROKER_CHATS", {}, { brokerId });

      if (response.success && response.data) {
        setActiveChats(response.data.chats || []);

        // Count unread chats
        const unread = (response.data.chats || []).filter(
          (chat) => chat.unread_count > 0,
        ).length;
        setUnreadChats(unread);
      }
    } catch (error) {
      console.warn("Could not fetch chats:", error.message);
    }
  };

  const openChatWithUser = (userId, contextId = null) => {
    setSelectedChat({
      userId,
      contextId,
      type: contextId ? "property_request" : "direct",
    });
    setShowChatWindow(true);
  };

  // ========== NOTIFICATION FUNCTIONS ==========

  const sendNotificationToSeller = async (requestId, type) => {
    try {
      await api.post(
        "CREATE_NOTIFICATION_INTERNAL",
        {},
        {
          type: `BROKER_${type.toUpperCase()}`,
          data: {
            requestId,
            brokerId: user.id,
            brokerName: `${user.first_name} ${user.last_name}`,
            message: `Your broker ${user.first_name} has ${type.replace("_", " ")} your property request`,
            actionUrl: `/seller-leaser?requestId=${requestId}`,
          },
        },
      );
    } catch (error) {
      console.warn("Failed to send notification:", error);
    }
  };

  const sendNotificationToClient = async (clientId, type, propertyId) => {
    try {
      await api.post(
        "CREATE_NOTIFICATION_INTERNAL",
        {},
        {
          type: `PROPERTY_${type.toUpperCase()}`,
          data: {
            propertyId,
            brokerId: user.id,
            brokerName: `${user.first_name} ${user.last_name}`,
            message: `Your broker ${user.first_name} has submitted a property for your approval`,
            actionUrl: `/seller-leaser?propertyId=${propertyId}`,
          },
          userId: clientId,
        },
      );
    } catch (error) {
      console.warn("Failed to send notification to client:", error);
    }
  };

  // ========== DATA FETCHING ==========

  // Refresh user data from API
  const refreshUserData = async () => {
    try {
      console.log("🔄 Refreshing broker user data...");

      const response = await api.get("GET_PROFILE");
      console.log("✅ API response:", response);

      let userData;

      if (response) {
        if (response.user) {
          userData = response.user;
        } else if (response.data) {
          userData = response.data;
        } else if (response.id || response.username) {
          userData = response;
        } else if (response.success && response.data) {
          userData = response.data;
        }
      }

      if (userData) {
        const storedUser = getUserFromStorage();
        const mergedUser = {
          ...userData,
          profile_picture:
            userData.profile_picture ||
            userData.profilePicture ||
            storedUser?.profile_picture,
        };

        console.log("✅ Merged broker data:", mergedUser);
        setUser(mergedUser);
        localStorage.setItem("user", JSON.stringify(mergedUser));
        return mergedUser;
      }

      return null;
    } catch (error) {
      console.error("❌ Error refreshing broker data:", error);
      const storedUser = getUserFromStorage();
      if (storedUser) {
        console.log("💾 Using stored broker data as fallback");
        setUser(storedUser);
        return storedUser;
      }
      return null;
    }
  };

  // Fetch broker listings
  const fetchBrokerListings = async () => {
    try {
      const response = await api.get("GET_BROKER_LISTINGS");
      console.log("📋 Broker listings response:", response);

      let properties = [];
      if (response?.data?.properties) {
        properties = response.data.properties;
      } else if (response?.data?.data?.properties) {
        properties = response.data.data.properties;
      } else if (Array.isArray(response?.data)) {
        properties = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        properties = response.data.data;
      } else if (Array.isArray(response)) {
        properties = response;
      } else if (response?.properties) {
        properties = response.properties;
      }

      console.log("📊 Extracted properties:", properties);
      setBrokerProperties(Array.isArray(properties) ? properties : []);
      calculateBrokerStatsFromProperties(properties || []);
    } catch (error) {
      console.error("Error fetching broker listings:", error);
      setBrokerProperties([]);
    }
  };

  // Calculate stats from properties
  const calculateBrokerStatsFromProperties = (properties) => {
    if (!Array.isArray(properties)) return;

    const stats = {
      totalListings: properties.length,
      pendingReviews: properties.filter((p) =>
        ["pending", "pending_review", "draft"].includes(
          p.property_status || p.status || "",
        ),
      ).length,
      approvedListings: properties.filter((p) =>
        ["active", "approved"].includes(p.property_status || p.status || ""),
      ).length,
      rejectedListings: properties.filter((p) =>
        ["rejected", "inactive"].includes(p.property_status || p.status || ""),
      ).length,
      totalRevenue: properties.reduce(
        (sum, p) => sum + (parseFloat(p.price) || 0),
        0,
      ),
    };

    setBrokerStats((prev) => ({ ...prev, ...stats }));
  };

  // Fetch broker stats
  const fetchBrokerStats = async (brokerId) => {
    try {
      const response = await api.get("GET_ANALYTICS");
      if (response?.success || response?.data) {
        const allAnalytics = response.data || response;

        if (allAnalytics.brokerStats) {
          setBrokerStats((prev) => ({ ...prev, ...allAnalytics.brokerStats }));
        } else {
          calculateBrokerStatsFromProperties(brokerProperties);
        }
      }
    } catch (error) {
      console.warn("Could not fetch broker stats:", error.message);
      calculateBrokerStatsFromProperties(brokerProperties);
    }
  };

  // Fetch document stats
  const fetchDocumentStats = async (brokerId) => {
    try {
      const docsResponse = await api.get("GET_USER_DOCUMENTS");
      if (docsResponse?.success || docsResponse?.data) {
        const docsData = docsResponse.data || docsResponse;
        const documents = Array.isArray(docsData)
          ? docsData
          : docsData.documents || [];

        setBrokerStats((prev) => ({
          ...prev,
          totalDocuments: documents.length,
          signedContracts: documents.filter(
            (doc) =>
              doc.status === "signed" || doc.document_type === "contract",
          ).length,
          pendingDocuments: documents.filter(
            (doc) =>
              doc.status === "pending" || doc.status === "awaiting_signature",
          ).length,
        }));
      }
    } catch (error) {
      console.warn("Could not fetch document stats:", error.message);
    }
  };

  // Fetch requests from backend
  const fetchRequests = async () => {
    try {
      const response = await api.get("GET_PENDING_REQUESTS");
      console.log("📨 Requests response:", response);

      let requestsData = [];
      if (Array.isArray(response?.data)) {
        requestsData = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        requestsData = response.data.data;
      } else if (Array.isArray(response)) {
        requestsData = response;
      } else if (response?.requests) {
        requestsData = response.requests;
      } else if (response?.data?.requests) {
        requestsData = response.data.requests;
      }

      console.log("📝 Extracted requests:", requestsData);

      // Format the data properly
      const formattedRequests = requestsData.map((request) => ({
        id: request.id,
        request_id: request.id,
        title: request.title || request.property_type || "Unknown Property",
        description: request.description || "No description provided",
        budget: request.budget || request.price || 0,
        property_type: request.property_type || request.type || "Unknown",
        location:
          request.location || request.address || "Address not specified",
        client_name:
          request.client_name ||
          (request.user
            ? `${request.user.first_name} ${request.user.last_name}`
            : "Unknown Client"),
        client_phone: request.client_phone || request.phone || "N/A",
        client_email: request.client_email || request.email || "N/A",
        status: request.status || "pending",
        created_at: request.created_at || new Date().toISOString(),
        images: request.images || [],
        schedule_date: request.schedule_date,
        schedule_time: request.schedule_time,
        schedule_notes: request.schedule_notes,
        client_id: request.user_id || request.client_id,
        broker_id: request.broker_id,
      }));

      setRequests(formattedRequests);
      setRequestCount(formattedRequests.length);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
      setRequestCount(0);
    }
  };

  // Main data fetch function
  const fetchBrokerDashboardData = async (brokerId) => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchBrokerListings(),
        fetchBrokerStats(brokerId),
        fetchDocumentStats(brokerId),
        fetchRequests(),
        fetchWorkflowStats(brokerId),
        fetchActiveChats(brokerId),
      ]);
    } catch (error) {
      console.error("Error in fetchBrokerDashboardData:", error);
      setToast({
        show: true,
        message: "Failed to load broker data. Please try again.",
        type: "error",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Authentication check
  useEffect(() => {
    let isMounted = true;

    const authenticateUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = getUserFromStorage();

        if (!token) {
          console.log("❌ No token found");
          navigate("/login-register");
          return;
        }

        // First try to use stored user
        if (storedUser && storedUser.id) {
          console.log("💾 Using stored broker data");
          setUser(storedUser);
          setIsAuthorized(true);
        }

        // Then fetch fresh data
        try {
          const userData = await refreshUserData();

          if (!isMounted) return;

          if (!userData) {
            throw new Error("No user data received");
          }

          // Check if user is a broker
          const userRole = userData.role || "";
          if (!userRole.includes("broker")) {
            console.log("❌ User is not a broker:", userRole);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/unauthorized");
            return;
          }

          console.log("✅ Broker authentication successful");
          setUser(userData);
          setIsAuthorized(true);

          // Fetch broker-specific data
          await fetchBrokerDashboardData(userData.id);
          console.log("✅ Broker data loaded");
        } catch (apiError) {
          console.error("API error:", apiError);

          if (storedUser?.id) {
            console.log("⚠️ Using stored data due to API error");
            setUser(storedUser);
            setIsAuthorized(true);
            await fetchBrokerDashboardData(storedUser.id);
          } else if (
            apiError.message?.includes("401") ||
            apiError.message?.includes("403")
          ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login-register");
          } else {
            setToast({
              show: true,
              message: "Connection issue. Some features may be limited.",
              type: "warning",
            });
          }
        }
      } catch (error) {
        console.error("Authentication error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login-register");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    authenticateUser();

    return () => {
      isMounted = false;
    };
  }, [navigate, getUserFromStorage]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const connectSocket = async () => {
      try {
        await socketService.connect(user.id);

        // Listen for new property requests
        socketService.addListener("new_property_request", (data) => {
          setToast({
            show: true,
            message: `New property request from ${data.clientName}`,
            type: "info",
          });
          fetchBrokerDashboardData(user.id);
          setNotificationCount((prev) => prev + 1);

          // Send desktop notification
          if (Notification.permission === "granted") {
            new Notification("New Property Request", {
              body: `${data.clientName} wants to ${data.requestType} their property`,
              icon: profilePictureUrl,
            });
          }
        });

        // Listen for property status changes
        socketService.addListener("property_status_changed", (data) => {
          if (data.brokerId === user.id) {
            setToast({
              show: true,
              message: `Property ${data.propertyTitle} status updated to ${data.newStatus}`,
              type: "info",
            });
            fetchBrokerDashboardData(user.id);
          }
        });

        // Listen for new messages
        socketService.addListener("new_message", (data) => {
          if (data.receiverId === user.id) {
            setUnreadChats((prev) => prev + 1);
            setToast({
              show: true,
              message: `New message from ${data.senderName}`,
              type: "info",
            });

            // Update active chats
            setActiveChats((prev) =>
              prev.map((chat) =>
                chat.user_id === data.senderId
                  ? {
                      ...chat,
                      last_message: data.message,
                      updated_at: new Date().toISOString(),
                      unread_count: (chat.unread_count || 0) + 1,
                    }
                  : chat,
              ),
            );
          }
        });

        // Listen for client approval
        socketService.addListener("client_approved_property", (data) => {
          if (data.brokerId === user.id) {
            setToast({
              show: true,
              message: `Client approved property ${data.propertyTitle}! Now waiting for admin approval.`,
              type: "success",
            });
            fetchBrokerDashboardData(user.id);
          }
        });

        // Listen for admin approval
        socketService.addListener("admin_approved_property", (data) => {
          if (data.brokerId === user.id) {
            setToast({
              show: true,
              message: `🎉 Property ${data.propertyTitle} is now live on the marketplace!`,
              type: "success",
            });

            // Check if premium
            if (data.isPremium) {
              setToast({
                show: true,
                message: "⭐ Your property is featured on the homepage!",
                type: "success",
              });
            }

            fetchBrokerDashboardData(user.id);
          }
        });

        // Listen for new documents
        socketService.addListener("new_document_uploaded", (data) => {
          if (data.brokerId === user.id) {
            setToast({
              show: true,
              message: `New document uploaded: ${data.documentTitle}`,
              type: "info",
            });
            fetchBrokerDashboardData(user.id);
          }
        });

        // Listen for new bookings
        socketService.addListener("new_booking_request", (data) => {
          if (data.brokerId === user.id) {
            setToast({
              show: true,
              message: `New viewing request from ${data.clientName}`,
              type: "info",
            });
            fetchBrokerDashboardData(user.id);
          }
        });
      } catch (error) {
        console.log(
          "⚠️ WebSocket not available, continuing without real-time updates",
        );
      }
    };

    connectSocket();

    return () => {
      socketService.disconnect();
    };
  }, [user?.id]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ========== EVENT HANDLERS ==========

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setShowPropertyDetails(true);
  };

  const handleCreateProperty = () => setShowCreatePropertyForm(true);

  const handleEditProperty = (property) => {
    if (!property?.id) {
      setToast({
        show: true,
        message: "Cannot edit: Property ID not found",
        type: "error",
      });
      return;
    }
    setShowPropertyDetails(false);
    setPropertyToEdit(property);
    setShowEditPropertyForm(true);
  };

  const handleUpdateProperty = async (updatedProperty) => {
    try {
      const response = await api.put(
        "UPDATE_PROPERTY",
        { id: updatedProperty.id },
        updatedProperty,
      );
      if (response?.success || response?.data?.success) {
        setShowEditPropertyForm(false);
        setToast({
          show: true,
          message: "Property updated successfully!",
          type: "success",
        });
        fetchBrokerDashboardData(user.id);
      }
    } catch (error) {
      console.error("Error updating property:", error);
      setToast({
        show: true,
        message: "Failed to update property. Please try again.",
        type: "error",
      });
    }
  };

  const handleCreateNewProperty = async (propertyData) => {
    try {
      const response = await api.post("CREATE_PROPERTY", {}, propertyData);
      if (response?.success || response?.data?.success) {
        setToast({
          show: true,
          message: "Property created successfully",
          type: "success",
        });
        setShowCreatePropertyForm(false);
        fetchBrokerDashboardData(user.id);
      }
    } catch (error) {
      setToast({
        show: true,
        message: "Failed to create property",
        type: "error",
      });
    }
  };

  const handlePropertyAction = async (propertyId, action, notes = "") => {
    try {
      const response = await api.post(
        "PROPERTY_ACTION",
        { id: propertyId },
        { action, notes },
      );
      if (response?.success || response?.data?.success) {
        setBrokerProperties((prev) =>
          prev.map((property) =>
            property.id === propertyId
              ? { ...property, property_status: response.data?.property_status }
              : property,
          ),
        );

        setBrokerStats((prev) => {
          const newStats = { ...prev };
          if (action === "approve") {
            newStats.pendingReviews = Math.max(0, prev.pendingReviews - 1);
            newStats.approvedListings++;
          } else if (action === "reject") {
            newStats.pendingReviews = Math.max(0, prev.pendingReviews - 1);
            newStats.rejectedListings++;
          }
          return newStats;
        });

        setToast({
          show: true,
          message: `Property ${action}d successfully`,
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error performing property action:", error);
      setToast({
        show: true,
        message: error.message || "Failed to perform action",
        type: "error",
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await api.put(
        "UPDATE_TICKET_STATUS",
        { id: requestId },
        { status: "rejected" },
      );
      if (response?.success || response?.data?.success) {
        setToast({ show: true, message: "Request rejected", type: "success" });
        fetchRequests();
        setRequestCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      setToast({
        show: true,
        message: "Failed to reject request",
        type: "error",
      });
    }
  };

  const handleStartProfessionalTools = (request) => {
    if (!canAccessProfessionalTools()) {
      setToast({
        show: true,
        message:
          "You need to be verified and have an active subscription to access professional tools",
        type: "warning",
      });
      return;
    }
    setSelectedRequestForTools(request);
    setShowProfessionalTools(true);
  };

  const handleMessageClient = (clientId, requestId = null) => {
    openChatWithUser(clientId, requestId);
  };

  const handleRefresh = () => user?.id && fetchBrokerDashboardData(user.id);

  const handleLogout = async () => {
    try {
      await api.post("LOGOUT");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login-register";
    }
  };

  // Handle booking actions
  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async (bookingId, notes = "") => {
    try {
      const response = await api.post(
        "UPDATE_TICKET_STATUS",
        { id: bookingId },
        {
          status: "confirmed",
          notes,
        },
      );

      if (response?.success) {
        setToast({
          show: true,
          message: "Booking confirmed successfully!",
          type: "success",
        });
        fetchBrokerDashboardData(user.id);
        setShowBookingModal(false);
      }
    } catch (error) {
      console.error("Error confirming booking:", error);
      setToast({
        show: true,
        message: "Failed to confirm booking",
        type: "error",
      });
    }
  };

  const handleRescheduleBooking = async (bookingId, newDate, newTime) => {
    try {
      const response = await api.put(
        "UPDATE_TICKET_STATUS",
        { id: bookingId },
        {
          schedule_date: newDate,
          schedule_time: newTime,
          status: "rescheduled",
        },
      );

      if (response?.success) {
        setToast({
          show: true,
          message: "Booking rescheduled successfully!",
          type: "success",
        });
        fetchBrokerDashboardData(user.id);
        setShowBookingModal(false);
      }
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      setToast({
        show: true,
        message: "Failed to reschedule booking",
        type: "error",
      });
    }
  };

  // ========== RENDER CONTENT ==========

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
              Loading dashboard...
            </p>
          </div>
        </div>
      );
    }

    if (!isAuthorized) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-500 font-semibold">Authorization required</p>
            <button
              onClick={() => navigate("/login-register")}
              className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    const commonProps = {
      theme,
      user,
      brokerStats,
      brokerProperties,
      isInternal,
      onPropertyAction: handlePropertyAction,
      onRefresh: handleRefresh,
      setToast,
    };

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div
              className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    Welcome back, {user?.first_name}!
                  </h1>
                  <p className="text-gray-500">
                    {isInternal
                      ? "Internal Broker Dashboard"
                      : "External Broker Dashboard"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      canAccessProfessionalTools()
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                    }`}
                  >
                    {canAccessProfessionalTools()
                      ? "Verified & Active"
                      : "Limited Access"}
                  </span>
                  {!canAccessProfessionalTools() && !isInternal && (
                    <button
                      onClick={() => navigate("/broker/upgrade")}
                      className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Requests</p>
                    <p className="text-2xl font-bold mt-1">
                      {workflowStats.pendingRequests}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("requests")}
                  className="mt-4 text-sm text-amber-600 dark:text-amber-400 hover:underline"
                >
                  View all →
                </button>
              </div>

              <div
                className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Drafts in Progress</p>
                    <p className="text-2xl font-bold mt-1">
                      {workflowStats.draftsInProgress}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("drafts")}
                  className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Continue working →
                </button>
              </div>

              <div
                className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Awaiting Approval</p>
                    <p className="text-2xl font-bold mt-1">
                      {workflowStats.waitingClientApproval +
                        workflowStats.waitingAdminApproval}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {workflowStats.waitingClientApproval} client •{" "}
                  {workflowStats.waitingAdminApproval} admin
                </div>
              </div>

              <div
                className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Commission</p>
                    <p className="text-2xl font-bold mt-1">
                      ETB {workflowStats.totalCommission.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className="mt-4 text-sm text-green-600 dark:text-green-400 hover:underline"
                >
                  View earnings →
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {workflowStats.recentActivity.length > 0 ? (
                  workflowStats.recentActivity
                    .slice(0, 5)
                    .map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      >
                        <div
                          className={`p-2 rounded-full ${getActivityColor(activity.type)}`}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.description}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {activity.time}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div
              className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab("requests")}
                  className="p-4 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-800">
                      <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="font-medium">Check New Requests</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {requestCount} new property requests available
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("calendar")}
                  className="p-4 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium">View Schedule</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {requests.filter((r) => r.schedule_date).length} scheduled
                    viewings
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("drafts")}
                  className="p-4 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-800">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-medium">Continue Drafts</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {workflowStats.draftsInProgress} drafts in progress
                  </p>
                </button>
              </div>
            </div>
          </div>
        );

      case "requests":
        return (
          <BrokerRequestsList
            theme={theme}
            requests={requests}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onMessageClient={handleMessageClient}
            onViewDetails={handleViewRequestDetails}
            onStartProfessionalTools={handleCreateDraftFromRequest}
            canAccessTools={canAccessProfessionalTools()}
            isInternal={isInternal}
          />
        );

      case "properties":
        return (
          <BrokerPropertiesList
            {...commonProps}
            onViewDetails={handleViewDetails}
            onCreateProperty={handleCreateProperty}
          />
        );

      case "drafts":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Drafts in Progress</h2>
                <p className="text-gray-500">
                  Properties awaiting completion or client approval
                </p>
              </div>
              <button
                onClick={() => setShowCreatePropertyForm(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                + Create New Draft
              </button>
            </div>

            {brokerProperties.filter((p) => p.property_status === "draft")
              .length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No drafts in progress</p>
                <button
                  onClick={() => setActiveTab("requests")}
                  className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                >
                  Check Available Requests
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brokerProperties
                  .filter((p) => p.property_status === "draft")
                  .map((property) => (
                    <div
                      key={property.id}
                      className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{property.title}</h3>
                          <p className="text-sm text-gray-500">
                            {property.location}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 text-xs rounded">
                          Draft
                        </span>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Price:</span>
                          <span className="font-semibold">
                            ETB {property.price?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Client:</span>
                          <span>{property.client_name || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Last Updated:</span>
                          <span>
                            {new Date(property.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditProperty(property)}
                          className="flex-1 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm"
                        >
                          Continue Editing
                        </button>
                        <button
                          onClick={() =>
                            handleSubmitForClientApproval(property.id)
                          }
                          className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                        >
                          Submit for Approval
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );

      case "clients":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">My Clients</h2>
              <p className="text-gray-500">
                Manage your client relationships and communications
              </p>
            </div>

            <div
              className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeChats.map((chat) => (
                  <div
                    key={chat.user_id}
                    className={`p-4 rounded-lg border ${theme === "dark" ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {chat.user_avatar ? (
                        <img
                          src={chat.user_avatar}
                          alt={chat.user_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                          {chat.user_name?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{chat.user_name}</h4>
                        <p className="text-xs text-gray-500">
                          {chat.property_title || "General chat"}
                        </p>
                      </div>
                      {chat.unread_count > 0 && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 truncate">
                      {chat.last_message || "No messages yet"}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleMessageClient(chat.user_id, chat.context_id)
                        }
                        className="flex-1 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm"
                      >
                        Message
                      </button>
                      <button
                        onClick={() => {
                          // View client profile or properties
                          if (chat.context_id) {
                            navigate(`/properties/${chat.context_id}`);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "chat":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Messages</h2>
              <p className="text-gray-500">Communicate with your clients</p>
            </div>

            {activeChats.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active conversations</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start a conversation by accepting a property request
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat List */}
                <div
                  className={`lg:col-span-1 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <div className="p-4 border-b dark:border-gray-700">
                    <h3 className="font-semibold">Conversations</h3>
                  </div>
                  <div className="divide-y dark:divide-gray-700">
                    {activeChats.map((chat) => (
                      <div
                        key={chat.user_id}
                        onClick={() =>
                          setSelectedChat({
                            userId: chat.user_id,
                            contextId: chat.context_id,
                            userName: chat.user_name,
                            userAvatar: chat.user_avatar,
                            propertyTitle: chat.property_title,
                          })
                        }
                        className={`p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 ${selectedChat?.userId === chat.user_id ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          {chat.user_avatar ? (
                            <img
                              src={chat.user_avatar}
                              alt={chat.user_name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                              {chat.user_name?.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold truncate">
                                {chat.user_name}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {new Date(chat.updated_at).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {chat.last_message || "Start conversation"}
                            </p>
                            {chat.unread_count > 0 && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {chat.unread_count} new
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Window */}
                <div className="lg:col-span-2">
                  {selectedChat ? (
                    <Suspense
                      fallback={
                        <div className="h-[500px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                      }
                    >
                      <BrokerChatInterface
                        receiverId={selectedChat.userId}
                        receiverName={selectedChat.userName}
                        receiverAvatar={selectedChat.userAvatar}
                        contextId={selectedChat.contextId}
                        contextType={
                          selectedChat.contextId ? "property_request" : "direct"
                        }
                        theme={theme}
                        userId={user?.id}
                        userAvatar={profilePictureUrl}
                        userName={`${user?.first_name} ${user?.last_name}`}
                      />
                    </Suspense>
                  ) : (
                    <div
                      className={`h-[500px] rounded-xl border flex items-center justify-center ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          Select a conversation to start chatting
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case "calendar":
        return (
          <Suspense
            fallback={
              <div className="h-96 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            }
          >
            <BrokerBookingCalendar
              brokerId={user?.id}
              theme={theme}
              onViewBooking={handleViewBooking}
              onConfirmBooking={handleConfirmBooking}
              onRescheduleBooking={handleRescheduleBooking}
            />
          </Suspense>
        );

      case "transactions":
        return <BrokerTransactions {...commonProps} brokerId={user?.id} />;

      case "analytics":
        return <BrokerAnalytics {...commonProps} brokerId={user?.id} />;

      case "documents":
        return (
          <BrokerDocuments brokerId={user?.id} theme={theme} user={user} />
        );

      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-gray-500">
                Manage your broker account settings
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Settings */}
              <div
                className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Commission Rate
                    </label>
                    <input
                      type="text"
                      defaultValue="2.5%"
                      className={`w-full px-4 py-2 rounded-lg border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Contact Preference
                    </label>
                    <select
                      className={`w-full px-4 py-2 rounded-lg border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                    >
                      <option>Email & Phone</option>
                      <option>Email Only</option>
                      <option>Phone Only</option>
                    </select>
                  </div>
                  <button className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                    Update Profile
                  </button>
                </div>
              </div>

              {/* Subscription Status */}
              <div
                className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <h3 className="text-lg font-semibold mb-4">
                  Subscription Status
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Current Plan</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          canAccessProfessionalTools()
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                        }`}
                      >
                        {canAccessProfessionalTools() ? "Active" : "Limited"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isInternal
                        ? "Internal Broker - Full Access"
                        : canAccessProfessionalTools()
                          ? "Verified External Broker - Full Access"
                          : "Limited Access - Verification Required"}
                    </p>
                  </div>

                  {!isInternal && !canAccessProfessionalTools() && (
                    <button
                      onClick={() => navigate("/broker/upgrade")}
                      className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 font-semibold"
                    >
                      Upgrade to Full Access
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div
            className={`p-12 text-center rounded-xl border ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2
              className={`text-2xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
              This feature is currently in development.
            </p>
          </div>
        );
    }
  };

  // Helper functions for activity icons
  const getActivityColor = (type) => {
    switch (type) {
      case "request":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400";
      case "approval":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400";
      case "property":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400";
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "request":
        return <Users className="w-4 h-4" />;
      case "message":
        return <MessageSquare className="w-4 h-4" />;
      case "approval":
        return <CheckCircle className="w-4 h-4" />;
      case "property":
        return <Home className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen ${
          theme === "dark"
            ? "bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white"
            : "bg-gray-100 text-gray-900"
        } flex transition-colors duration-300`}
      >
        {/* Sidebar */}
        <div
          className={`fixed lg:static w-64 min-h-screen flex-shrink-0 shadow-lg transform transition-transform duration-300 ${
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          } ${
            theme === "dark"
              ? "bg-gray-900/40 backdrop-blur-lg border-r border-gray-700/30"
              : "bg-white border-r border-gray-200"
          } flex flex-col z-30`}
        >
          {/* Logo */}
          <div
            className={`flex items-center gap-4 px-8 py-3 border-b ${
              theme === "dark"
                ? "border-gray-700/40 bg-gray-900/30"
                : "border-gray-200"
            }`}
          >
            <img
              src="/vectors/smallLogo.svg"
              alt="WubLand Logo"
              className="w-16 h-16 md:w-22 md:h-22"
            />
            <span className="font-medium text-lg md:text-2xl text-amber-500">
              WubLand
            </span>
          </div>

          {/* Static Profile */}
          <div
            className={`p-4 md:p-6 border-b ${
              theme === "dark"
                ? "border-gray-700/40 bg-gray-900/30"
                : "border-gray-200"
            } flex flex-col items-center`}
          >
            <div className="flex justify-center mb-4">
              <Suspense
                fallback={
                  <div className="w-20 h-20 rounded-full bg-gray-300 animate-pulse"></div>
                }
              >
                <StaticProfileAvatar
                  key={`static-${user?.id}-${forceUpdate}`}
                  userProfilePicture={profilePictureUrl}
                  firstName={user?.first_name}
                  lastName={user?.last_name}
                  username={user?.username}
                  email={user?.email}
                  role={user?.role}
                  broker_type={isInternal ? "internal" : "external"}
                  size="xl"
                />
              </Suspense>
            </div>
            <div className="text-center">
              <p
                className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {user?.first_name} {user?.last_name}
              </p>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-amber-400" : "text-amber-600"
                } flex items-center justify-center gap-1`}
              >
                <Shield className="w-4 h-4" />
                {isInternal ? "Internal Broker" : "External Broker"}
              </p>
              {!isInternal && (
                <p
                  className={`text-xs mt-1 ${
                    canAccessProfessionalTools()
                      ? "text-green-500"
                      : "text-amber-500"
                  }`}
                >
                  {canAccessProfessionalTools()
                    ? "✓ Verified & Active"
                    : "⚠ Limited Access"}
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={`p-4 flex-1 ${theme === "dark" ? "bg-gray-900/20" : ""}`}
          >
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center rounded-xl px-4 py-3 transition-all text-left ${
                    activeTab === item.id
                      ? theme === "dark"
                        ? "bg-amber-600/80 text-white backdrop-blur-sm shadow-lg"
                        : "bg-amber-100 text-amber-600 shadow-lg"
                      : theme === "dark"
                        ? "text-amber-200 hover:bg-gray-700/50 backdrop-blur-sm"
                        : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 mr-3 ${
                      activeTab === item.id
                        ? theme === "dark"
                          ? "text-white"
                          : "text-amber-600"
                        : theme === "dark"
                          ? "text-amber-400"
                          : "text-gray-600"
                    }`}
                  />
                  <span
                    className={`truncate ${
                      activeTab === item.id
                        ? theme === "dark"
                          ? "text-white"
                          : "text-amber-600"
                        : theme === "dark"
                          ? "text-amber-400"
                          : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Logout */}
          <div
            className={`p-4 border-t ${
              theme === "dark"
                ? "border-gray-700/40 bg-gray-900/30"
                : "border-gray-200"
            }`}
          >
            <button
              className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "text-gray-300 hover:bg-gray-700/50 backdrop-blur-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Right Section - Top Bar + Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div
            className={`flex-shrink-0 border-b ${theme === "dark" ? "border-gray-700/30" : "border-gray-200"}`}
            style={{
              backgroundImage: `url(${
                theme === "dark"
                  ? "/vectors/TiletDark.svg"
                  : "/vectors/TiletLight.svg"
              })`,
              backgroundSize: "cover",
              backgroundPosition: "bottom",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="">
              <div className="flex items-center justify-between p-4">
                {/* Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-2 rounded md:hidden ${
                    theme === "dark"
                      ? "hover:bg-gray-700/50 text-white"
                      : "hover:bg-white/30 text-gray-900"
                  } transition-colors backdrop-blur-sm`}
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Page Title */}
                <h1
                  className={`text-xl font-bold flex-1 mt-2 ml-10 text-center md:text-left ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  {activeTab === "dashboard"
                    ? "Broker Dashboard"
                    : activeTab === "requests"
                      ? "Property Requests"
                      : activeTab === "properties"
                        ? "My Listings"
                        : activeTab === "drafts"
                          ? "Drafts in Progress"
                          : activeTab === "clients"
                            ? "My Clients"
                            : activeTab === "calendar"
                              ? "Bookings Calendar"
                              : activeTab === "documents"
                                ? "Document Vault"
                                : activeTab === "settings"
                                  ? "Settings"
                                  : activeTab.charAt(0).toUpperCase() +
                                    activeTab.slice(1)}
                </h1>

                {/* Quick Stats */}
                <div className="hidden md:flex items-center space-x-6">
                  <div className="text-center backdrop-blur-sm bg-white/10 dark:bg-gray-800/20 rounded-lg px-4 py-2">
                    <div className="font-bold text-lg text-white dark:text-gray-100">
                      {requestCount}
                    </div>
                    <div className="text-xs text-gray-300 dark:text-gray-400">
                      Requests
                    </div>
                  </div>
                  <div className="text-center backdrop-blur-sm bg-white/10 dark:bg-gray-800/20 rounded-lg px-4 py-2">
                    <div className="font-bold text-lg text-white dark:text-gray-100">
                      {unreadChats}
                    </div>
                    <div className="text-xs text-gray-300 dark:text-gray-400">
                      Messages
                    </div>
                  </div>
                  <div className="text-center backdrop-blur-sm bg-white/10 dark:bg-gray-800/20 rounded-lg px-4 py-2">
                    <div className="font-bold text-lg text-white dark:text-gray-100">
                      ETB {workflowStats.totalCommission?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-300 dark:text-gray-400">
                      Commission
                    </div>
                  </div>
                </div>

                {/* Right side - Icons */}
                <div className="flex items-center gap-3">
                  {/* Refresh Button */}
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`p-2 rounded-lg transition-colors backdrop-blur-sm ${
                      theme === "dark"
                        ? "hover:bg-gray-700/50 text-gray-300"
                        : "hover:bg-white/30 text-gray-600"
                    }`}
                    title="Refresh Data"
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </button>

                  {/* Notifications Badge */}
                  <div className="relative">
                    <Suspense
                      fallback={
                        <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
                      }
                    >
                      <NotificationBadge
                        count={notificationCount}
                        onClick={() => setShowNotificationsPanel(true)}
                        theme={theme}
                      />
                    </Suspense>
                  </div>

                  {/* Chat Toggle */}
                  {activeTab !== "chat" && unreadChats > 0 && (
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="relative p-2 rounded-lg backdrop-blur-sm hover:bg-white/10 dark:hover:bg-gray-700/50"
                      title="Messages"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadChats}
                      </span>
                    </button>
                  )}

                  {/* Theme Toggle */}
                  <Suspense fallback={null}>
                    <ThemeToggle theme={theme} />
                  </Suspense>

                  {/* Profile Avatar */}
                  <div className="relative">
                    <Suspense
                      fallback={
                        <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>
                      }
                    >
                      <ProfileAvatar
                        key={`avatar-${user?.id}-${forceUpdate}`}
                        userProfilePicture={profilePictureUrl}
                        firstName={user?.first_name}
                        lastName={user?.last_name}
                        username={user?.username}
                        email={user?.email}
                        role={user?.role}
                        size="sm"
                        onLogout={handleLogout}
                        onNavigateToSection={(section) => {
                          setActiveTab(section);
                          setIsMobileMenuOpen(false);
                        }}
                        theme={theme}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <main>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                }
              >
                {renderContent()}
              </Suspense>
            </main>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black h-full bg-opacity-50 md:hidden z-20"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Modals */}
        {showPropertyDetails && selectedProperty && (
          <PropertyDetailsModal
            property={selectedProperty}
            isOpen={showPropertyDetails}
            onClose={() => setShowPropertyDetails(false)}
            theme={theme}
            onEdit={() => handleEditProperty(selectedProperty)}
          />
        )}

        {showRequestDetails && selectedRequest && (
          <Suspense
            fallback={
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }
          >
            <RequestDetailsModal
              request={selectedRequest}
              isOpen={showRequestDetails}
              onClose={() => setShowRequestDetails(false)}
              theme={theme}
              onAccept={() => handleAcceptRequest(selectedRequest.id)}
              onMessage={() =>
                handleMessageClient(
                  selectedRequest.client_id,
                  selectedRequest.id,
                )
              }
              onStartTools={() => handleStartProfessionalTools(selectedRequest)}
            />
          </Suspense>
        )}

        {showEditPropertyForm && propertyToEdit && (
          <EditPropertyForm
            property={propertyToEdit}
            isOpen={showEditPropertyForm}
            onClose={() => {
              setShowEditPropertyForm(false);
              setPropertyToEdit(null);
            }}
            onSubmit={handleUpdateProperty}
            theme={theme}
          />
        )}

        {showCreatePropertyForm && (
          <CreatePropertyForm
            isOpen={showCreatePropertyForm}
            onClose={() => setShowCreatePropertyForm(false)}
            onSubmit={handleCreateNewProperty}
            theme={theme}
            brokerId={user?.id}
          />
        )}

        {showProfessionalTools && selectedRequestForTools && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`rounded-xl max-w-6xl w-full max-h-[90vh] overflow-auto ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Professional Tools</h2>
                    <p className="text-gray-500">
                      Complete Ethiopian property agreement for request #
                      {selectedRequestForTools.id}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfessionalTools(false);
                      setSelectedRequestForTools(null);
                    }}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <BrokerProfessionalTools
                  brokerId={user?.id}
                  propertyRequestId={selectedRequestForTools.id}
                  onComplete={() => {
                    setShowProfessionalTools(false);
                    setSelectedRequestForTools(null);
                    fetchBrokerDashboardData(user.id);
                    setToast({
                      show: true,
                      message: "Property agreement completed successfully!",
                      type: "success",
                    });
                  }}
                  clientData={{
                    name: selectedRequestForTools.client_name,
                    phone: selectedRequestForTools.client_phone,
                    email: selectedRequestForTools.client_email,
                    id: selectedRequestForTools.client_id,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Window Modal */}
        {showChatWindow && selectedChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    {selectedChat.userAvatar ? (
                      <img
                        src={selectedChat.userAvatar}
                        alt={selectedChat.userName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                        {selectedChat.userName?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedChat.userName}
                      </h3>
                      {selectedChat.propertyTitle && (
                        <p className="text-sm text-gray-500">
                          {selectedChat.propertyTitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowChatWindow(false);
                      setSelectedChat(null);
                    }}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <Suspense
                  fallback={
                    <div className="h-96 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                  }
                >
                  <BrokerChatInterface
                    receiverId={selectedChat.userId}
                    receiverName={selectedChat.userName}
                    receiverAvatar={selectedChat.userAvatar}
                    contextId={selectedChat.contextId}
                    contextType={
                      selectedChat.contextId ? "property_request" : "direct"
                    }
                    theme={theme}
                    userId={user?.id}
                    userAvatar={profilePictureUrl}
                    userName={`${user?.first_name} ${user?.last_name}`}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details Modal */}
        {showBookingModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`rounded-xl max-w-lg w-full ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Viewing Details</h3>
                    <p className="text-sm text-gray-500">
                      Property viewing schedule
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      {selectedBooking.property_title || selectedBooking.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedBooking.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">
                        {new Date(
                          selectedBooking.schedule_date,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">
                        {selectedBooking.schedule_time}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="font-medium">{selectedBooking.client_name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedBooking.client_phone}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedBooking.client_email}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{selectedBooking.location}</p>
                  </div>

                  {selectedBooking.schedule_notes && (
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedBooking.schedule_notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                    <button
                      onClick={() => handleConfirmBooking(selectedBooking.id)}
                      className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        const newDate = prompt("Enter new date (YYYY-MM-DD):");
                        const newTime = prompt("Enter new time (HH:MM):");
                        if (newDate && newTime) {
                          handleRescheduleBooking(
                            selectedBooking.id,
                            newDate,
                            newTime,
                          );
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications & Toast */}
        <Suspense fallback={null}>
          <NotificationsPanel
            isOpen={showNotificationsPanel}
            onClose={() => setShowNotificationsPanel(false)}
            theme={theme}
            unreadCount={notificationCount}
            setUnreadCount={setNotificationCount}
            userId={user?.id}
          />
          <Toast
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast((prev) => ({ ...prev, show: false }))}
            theme={theme}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export const InternalBrokerDashboard = () => (
  <BrokerDashboard isInternal={true} />
);
export const ExternalBrokerDashboard = () => (
  <BrokerDashboard isInternal={false} />
);
export default BrokerDashboard;
