import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  Users,
  Home,
  Search,
  MessageSquare,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Eye,
  Filter,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  Shield,
  Upload,
  TrendingUp,
  Phone,
  Mail,
  RefreshCw,
  Check,
  AlertTriangle,
  Clock,
  Target,
  TrendingDown,
  Percent,
  Activity,
  Package,
  Crown,
  Globe,
  Database,
  Server,
  UserCheck,
  UserX,
  Edit,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import ErrorBoundary from "../../components/ErrorBoundary";
import PropertyDetailsModal from "../../components/PropertyDetailsModal";
import CreatePropertyForm from "../../components/CreatePropertyForm";
import BrokerRequestsList from "../../components/BrokerRequestsList";

// Lazy load components with correct paths
const BrokerPropertiesList = lazy(() =>
  import("../../components/BrokerPropertiesList")
);
const BrokerTransactions = lazy(() =>
  import("../../components/BrokerTransactions")
);
const BrokerAnalytics = lazy(() => import("../../components/BrokerAnalytics"));
const Loader = lazy(() => import("../../components/Loader"));
const ProfileAvatar = lazy(() => import("../../components/ProfileAvatar"));
const StaticProfileAvatar = lazy(() =>
  import("../../components/StaticProfileAvatar")
);
const ThemeToggle = lazy(() => import("../../components/ThemeToggle"));
const NotificationBadge = lazy(() =>
  import("../../components/NotificationBadge")
);
const Toast = lazy(() => import("../../components/Toast"));
const NotificationsPanel = lazy(() =>
  import("../../components/NotificationsPanel")
);
// Add this to your lazy imports section (around line 40-50)
const EditPropertyForm = lazy(() => import("../../components/EditPropertyForm"));
// Import services
import { httpClient } from "../../services/http.service";
import socketService from "../../services/socket.service";
import { API_CONFIG } from "../../config/api.config";

// Create a simple broker analytics hook inline since we don't have the file
const useBrokerAnalytics = (brokerId) => {
  const [brokerAnalytics, setBrokerAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("monthly");

  const fetchBrokerData = async () => {
    if (!brokerId) return null;

    setIsLoading(true);
    try {
      // Try to fetch real data first
      const response = await httpClient.get(
        API_CONFIG.getUrl("BROKER_ANALYTICS", { brokerId }) +
          "?timeframe=monthly"
      );

      if (response.data.success) {
        console.log("✅ Real broker analytics received:", response.data.data);
        setBrokerAnalytics(response.data.data);
        return {
          analytics: response.data.data,
          transactions: [],
          commissions: [],
        };
      } else {
        throw new Error("No real data available");
      }
    } catch (error) {
      console.warn("⚠️ Using mock broker analytics data:", error.message);
      // Mock data as fallback
      const mockAnalytics = {
        brokerId: brokerId,
        totalListings: 12,
        pendingReviews: 3,
        approvedListings: 8,
        rejectedListings: 1,
        activeClients: 5,
        totalRevenue: 245000,
        responseRate: 85,
        avgResponseTime: "2h",
        totalTransactions: 15,
        completedTransactions: 12,
        pendingTransactions: 3,
        propertyStats: {
          approved: 8,
          pending: 3,
          rejected: 1,
          draft: 0,
        },
        performance: {
          responseRate: 85,
          approvalRate: 67,
          clientSatisfaction: 90,
          avgCommissionRate: 2.5,
        },
        revenueTrend: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          data: [45000, 52000, 48000, 55000, 60000, 70000],
        },
        clientStats: {
          totalClients: 15,
          activeClients: 5,
          newClients: 3,
          retentionRate: 87,
        },
        transactionStats: {
          total: 15,
          completed: 12,
          pending: 3,
          avgCommission: 16333,
        },
      };

      setBrokerAnalytics(mockAnalytics);
      return { analytics: mockAnalytics, transactions: [], commissions: [] };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    brokerAnalytics,
    transactions,
    isLoading,
    fetchBrokerData,
    updateTimeframe: () => {},
  };
};

const BrokerDashboard = ({ isInternal = true }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("properties");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [showCreatePropertyForm, setShowCreatePropertyForm] = useState(false);
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
  });
  const [brokerProperties, setBrokerProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestCount, setRequestCount] = useState(0);
  const [showEditPropertyForm, setShowEditPropertyForm] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState(null);

  // Fetch requests
  const fetchRequests = async () => {
    try {
      const response = await httpClient.get(
        "http://localhost:5000/api/property-requests/broker"
      );
      if (response.data.success) {
        setRequests(response.data.data);
        setRequestCount(
          response.data.data.filter((r) => r.status === "pending").length
        );
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Use the inline broker analytics hook
  const {
    brokerAnalytics,
    transactions,
    fetchBrokerData,
    isLoading: analyticsLoading,
  } = useBrokerAnalytics(user?.id);

  // Format profile picture URL
  const formatProfilePictureUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `${API_CONFIG.BASE_URL}${url}`;
    return `${API_CONFIG.BASE_URL}/${url}`;
  };

  // Add handlers
  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setShowPropertyDetails(true);
  };

  const handleCreateProperty = () => {
    setShowCreatePropertyForm(true);
  };

  const handleEditProperty = (property) => {
    console.log("📝 Edit Property clicked:", property);

    if (!property?.id) {
      setToast({
        show: true,
        message: "Cannot edit: Property ID not found",
        type: "error",
      });
      return;
    }

    // Close property details modal
    setShowPropertyDetails(false);

    // Set property to edit and open edit form
    setPropertyToEdit(property);
    setShowEditPropertyForm(true);

    console.log(`Opening edit form for property ID: ${property.id}`);
  };

  // Add this function to handle property updates:
  const handleUpdateProperty = async (updatedProperty) => {
    console.log("🔄 Updating property:", updatedProperty);

    try {
      // Close edit form
      setShowEditPropertyForm(false);

      // Show success message
      setToast({
        show: true,
        message: "Property updated successfully!",
        type: "success",
      });

      // Refresh data
      if (user?.id) {
        await fetchBrokerDashboardData(user.id);
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

  const handleUploadImages = async (propertyId, files) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const response = await httpClient.post(
        `http://localhost:5002/api/properties/images/property/${propertyId}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            // Add authorization if needed
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setToast({
          show: true,
          message: "Images uploaded successfully",
          type: "success",
        });
        fetchBrokerDashboardData(user.id);
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setToast({
        show: true,
        message: `Failed to upload images: ${
          error.response?.data?.error || error.message
        }`,
        type: "error",
      });
    }
  };

  const handleCreateNewProperty = async (propertyData) => {
    try {
      const response = await httpClient.post(
        "http://localhost:5002/api/properties",
        propertyData
      );

      if (response.data.success) {
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

  // Fetch broker data
  const fetchBrokerDashboardData = async (brokerId) => {
    try {
      setRefreshing(true);

      console.log(`🔄 Fetching broker data for ID: ${brokerId}`);

      // 1. Fetch broker properties from PROPERTY-SERVICE (port 5002)
      const propertiesUrl =
        "http://localhost:5002/api/properties/broker/listings";
      console.log(`🏠 Fetching broker properties from: ${propertiesUrl}`);

      try {
        const propertiesResponse = await httpClient.get(propertiesUrl);

        console.log("📥 Properties response:", propertiesResponse.data);

        if (propertiesResponse.data?.success) {
          let properties = [];
          if (propertiesResponse.data.data?.properties) {
            properties = propertiesResponse.data.data.properties;
          } else if (Array.isArray(propertiesResponse.data.data)) {
            properties = propertiesResponse.data.data;
          } else if (Array.isArray(propertiesResponse.data)) {
            properties = propertiesResponse.data;
          }

          console.log(`✅ ${properties.length} properties received`);
          setBrokerProperties(properties);

          // Calculate broker stats from properties
          calculateBrokerStatsFromProperties(properties);
        } else {
          console.warn(
            "⚠️ Properties response not successful:",
            propertiesResponse.data
          );
          setBrokerProperties([]);
        }
      } catch (propertiesError) {
        console.error(
          "❌ Error fetching from property-service:",
          propertiesError
        );
        console.warn("⚠️ Setting empty properties array");
        setBrokerProperties([]);
      }

      // 2. Fetch broker stats from ANALYSIS-SERVICE (analytics) - port 5004
      const statsUrl = API_CONFIG.getUrl("BROKER_STATS", { brokerId });
      console.log(
        `📊 Fetching broker stats from analysis-service: ${statsUrl}`
      );

      try {
        const statsResponse = await httpClient.get(statsUrl);

        if (statsResponse.data?.success) {
          console.log(
            "✅ Broker stats received from analysis-service:",
            statsResponse.data.data
          );
          // Merge with calculated stats from properties
          setBrokerStats((prev) => ({
            ...prev,
            ...statsResponse.data.data,
          }));
        } else {
          console.warn(
            "⚠️ Analysis-service stats response not successful:",
            statsResponse.data
          );
        }
      } catch (statsError) {
        console.warn(
          "⚠️ Could not fetch broker stats from analysis-service:",
          statsError.response?.data?.message || statsError.message
        );
      }

      // 3. Fetch broker clients from ANALYSIS-SERVICE
      if (isInternal) {
        const clientsUrl = API_CONFIG.getUrl("BROKER_CLIENTS", { brokerId });
        console.log(
          `👥 Fetching broker clients from analysis-service: ${clientsUrl}`
        );

        try {
          const clientsResponse = await httpClient.get(clientsUrl);

          if (clientsResponse.data?.success) {
            const clients = Array.isArray(clientsResponse.data.data)
              ? clientsResponse.data.data
              : [];
            console.log(
              `✅ ${clients.length} clients received from analysis-service`
            );
            setClients(clients);
          } else {
            console.warn(
              "⚠️ Clients response not successful, setting empty array"
            );
            setClients([]);
          }
        } catch (clientsError) {
          console.warn(
            "⚠️ Could not fetch clients:",
            clientsError.response?.data?.message || clientsError.message
          );
          setClients([]);
        }
      }
    } catch (error) {
      console.error("❌ Error in fetchBrokerDashboardData:", error);

      // Set empty arrays on any error
      setBrokerProperties([]);
      setClients([]);

      setToast({
        show: true,
        message:
          "Some broker data failed to load. Please check your network connection.",
        type: "warning",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to calculate stats from properties
  const calculateBrokerStatsFromProperties = (properties) => {
    if (!properties || !Array.isArray(properties)) return;

    const stats = {
      totalListings: properties.length,
      pendingReviews: properties.filter((p) => {
        const status = p.property_status || p.status || "";
        return (
          status === "pending" ||
          status === "pending_review" ||
          status === "draft"
        );
      }).length,
      approvedListings: properties.filter((p) => {
        const status = p.property_status || p.status || "";
        return status === "active" || status === "approved";
      }).length,
      rejectedListings: properties.filter((p) => {
        const status = p.property_status || p.status || "";
        return status === "rejected" || status === "inactive";
      }).length,
      totalRevenue: properties.reduce((sum, p) => sum + (p.price || 0), 0),
    };

    setBrokerStats((prev) => ({
      ...prev,
      ...stats,
    }));
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login-register");
          return;
        }

        // FIX: Use getUrl instead of ENDPOINTS directly
        const checkAuthUrl = API_CONFIG.getUrl("CHECK_AUTH");
        console.log(`🔐 Checking auth at: ${checkAuthUrl}`);

        const response = await httpClient.get(checkAuthUrl);

        // Check if user is a broker
        const userRole = response.data.role;
        if (!userRole || !userRole.includes("broker")) {
          console.warn(
            `User role "${userRole}" is not a broker, redirecting...`
          );
          navigate("/unauthorized");
          return;
        }

        console.log("✅ User authenticated:", response.data);
        setUser(response.data);

        // Fetch broker data
        await fetchBrokerDashboardData(response.data.id);

        // Set up WebSocket connection
        try {
          socketService.connect(response.data.id, {
            timeout: 10000, // 10 second timeout
            retry: true,
            retryDelay: 3000, // 3 second retry delay
          });
          // Add connection status listener
          socketService.addListener("connect_error", (error) => {
            console.warn("Socket connection error:", error.message);
            // You might want to show a toast notification here
            setToast({
              show: true,
              message:
                "Realtime connection lost. Some features may be limited.",
              type: "warning",
            });
          });

          socketService.addListener("connect", () => {
            console.log("✅ Socket connected");
            setToast({
              show: true,
              message: "Realtime connection established",
              type: "success",
            });
          });

          // Listen for new listings assigned to broker
          socketService.addListener("new_listing_assigned", (data) => {
            setToast({
              show: true,
              message: `New listing assigned: ${data.propertyTitle}`,
              type: "info",
            });
            fetchBrokerDashboardData(response.data.id);
            setNotificationCount((prev) => prev + 1);
          });

          // Listen for property status updates
          socketService.addListener("property_status_changed", (data) => {
            if (data.brokerId === response.data.id) {
              setToast({
                show: true,
                message: `Property ${data.propertyTitle} status updated to ${data.newStatus}`,
                type: "info",
              });
              fetchBrokerDashboardData(response.data.id);
            }
          });

          // Listen for new messages
          socketService.addListener("new_message", (data) => {
            setNotificationCount((prev) => prev + 1);
          });
        } catch (socketError) {
          console.warn("⚠️ WebSocket connection failed:", socketError.message);
        }
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url,
        });

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login-register");
        } else {
          setToast({
            show: true,
            message:
              "Failed to load user data. Please try refreshing the page.",
            type: "error",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    return () => {
      try {
        socketService.disconnect();
      } catch (error) {
        console.warn("Error disconnecting socket:", error.message);
      }
    };
  }, [navigate, isInternal]);

  const handlePropertyAction = async (propertyId, action, notes = "") => {
    try {
      const actionMap = {
        approve: "active",
        reject: "rejected",
        request_changes: "pending",
      };

      const newStatus = actionMap[action];

      if (!newStatus) {
        throw new Error(`Invalid action: ${action}`);
      }

      // USE THE CORRECT ENDPOINT - /action not /status
      const url = `http://localhost:5002/api/properties/${propertyId}/action`;
      console.log(
        `⚡ Performing ${action} (status: ${newStatus}) on property ${propertyId}`
      );

      const response = await httpClient.post(url, {
        action,
        notes,
      });

      if (response.data.success) {
        // Update local state
        setBrokerProperties((prev) =>
          prev.map((property) =>
            property.id === propertyId
              ? {
                  ...property,
                  property_status: newStatus,
                }
              : property
          )
        );

        // Update statistics
        setBrokerStats((prev) => {
          const newStats = { ...prev };
          if (action === "approve") {
            newStats.pendingReviews = Math.max(0, prev.pendingReviews - 1);
            newStats.approvedListings = prev.approvedListings + 1;
          } else if (action === "reject") {
            newStats.pendingReviews = Math.max(0, prev.pendingReviews - 1);
            newStats.rejectedListings = prev.rejectedListings + 1;
          }
          return newStats;
        });

        setToast({
          show: true,
          message: `Property ${action}d successfully`,
          type: "success",
        });
      } else {
        throw new Error(response.data.message || "Action failed");
      }
    } catch (error) {
      console.error("❌ Error performing property action:", error);
      setToast({
        show: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to perform action",
        type: "error",
      });
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await httpClient.put(
        `http://localhost:5000/api/property-requests/${requestId}/accept`,
        { brokerId: user?.id }
      );

      if (response.data.success) {
        setToast({
          show: true,
          message: "Request accepted successfully",
          type: "success",
        });
        fetchRequests();
        setRequestCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      setToast({
        show: true,
        message: "Failed to accept request",
        type: "error",
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await httpClient.put(
        `http://localhost:5000/api/property-requests/${requestId}/reject`,
        { brokerId: user?.id }
      );

      if (response.data.success) {
        setToast({
          show: true,
          message: "Request rejected",
          type: "success",
        });
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

  const handleMessageClient = (clientId) => {
    // Navigate to chat
    navigate(`/chat/${clientId}`);
  };
  // Handle refresh
  const handleRefresh = () => {
    if (user?.id) {
      console.log("🔄 Manual refresh triggered");
      fetchBrokerDashboardData(user.id);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const logoutUrl = API_CONFIG.getUrl("LOGOUT");
      console.log(`🚪 Logging out at: ${logoutUrl}`);
      await httpClient.post(logoutUrl);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login-register";
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    if (isLoading) {
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <Loader />
        </Suspense>
      );
    }

    const contentProps = {
      theme,
      user,
      brokerStats,
      brokerProperties,
      clients,
      isInternal,
      onPropertyAction: handlePropertyAction,
      onRefresh: handleRefresh,
      setToast,
      brokerMetrics: brokerAnalytics,
      analyticsLoading,
    };

    switch (activeTab) {
      case "properties":
        return (
          <Suspense
            fallback={
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            }
          >
            <BrokerPropertiesList
              {...contentProps}
              onViewDetails={handleViewDetails}
              onCreateProperty={handleCreateProperty}
              onUploadImages={handleUploadImages}
            />
          </Suspense>
        );
      case "requests":
        return (
          <BrokerRequestsList
            theme={theme}
            requests={requests}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onMessageClient={handleMessageClient}
          />
        );

      case "transactions":
        return (
          <Suspense
            fallback={
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            }
          >
            <BrokerTransactions {...contentProps} />
          </Suspense>
        );
      case "analytics":
        return (
          <Suspense
            fallback={
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            }
          >
            <BrokerAnalytics {...contentProps} />
          </Suspense>
        );
      case "clients":
        return (
          <div
            className={`p-4 lg:p-6 rounded-xl ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } border ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <h2 className="text-2xl font-bold mb-4">My Clients</h2>
            {clients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-6 rounded-xl border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold">
                        {client.name?.charAt(0) || "C"}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {client.name || "Unknown Client"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {client.role || "Client"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {client.email || "No email"}
                      </p>
                      {client.phone && (
                        <p className="text-sm flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          {client.phone}
                        </p>
                      )}
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span>Properties: {client.total_properties || 0}</span>
                        <span>Active: {client.active_transactions || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No clients assigned yet</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div
            className={`p-4 lg:p-6 rounded-xl ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } border ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <h2 className="text-2xl font-bold mb-4">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-gray-500">This feature is coming soon!</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Suspense fallback={<div>Loading...</div>}>
          <Loader />
        </Suspense>
      </div>
    );
  }

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
          {/* Logo - REMOVED the label */}
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
            {/* REMOVED: The Internal/External label */}
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
                  userProfilePicture={formatProfilePictureUrl(
                    user?.profile_picture
                  )}
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
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
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
              <p className="text-xs text-gray-500 mt-1">
                Response Rate: {brokerStats.responseRate}%
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={`p-4 flex-1 ${theme === "dark" ? "bg-gray-900/20" : ""}`}
          >
            <div className="space-y-1">
              {[
                {
                  id: "properties",
                  label: "Property Listings",
                  icon: Home,
                  badge: brokerStats.pendingReviews,
                },
                {
                  id: "requests",
                  label: "Property Requests",
                  icon: Users,
                  badge: requestCount,
                },
                {
                  id: "clients",
                  label: "My Clients",
                  icon: Users,
                  badge: isInternal ? brokerStats.activeClients : 0,
                },
                { id: "transactions", label: "Transactions", icon: CreditCard },
                { id: "analytics", label: "Analytics", icon: BarChart3 },
                { id: "chat", label: "Messages", icon: MessageSquare },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((item) => (
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
            className={`flex-shrink-0 border-b ${
              theme === "dark" ? "border-gray-700/30" : "border-gray-200"
            }`}
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
                  className={`text-xl font-bold flex-1 mt-2 ml-10 text-center md:text-left ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {activeTab === "properties"
                    ? "Property Listings"
                    : activeTab === "analytics"
                    ? "Analytics Dashboard"
                    : activeTab === "transactions"
                    ? "Transaction Management"
                    : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h1>

                {/* Quick Stats - UPDATED with transparent background */}
                <div className="hidden md:flex items-center space-x-6">
                  <div className="text-center backdrop-blur-sm bg-white/10 dark:bg-gray-800/20 rounded-lg px-4 py-2">
                    <div className="font-bold text-lg text-white dark:text-gray-100">
                      {brokerStats.totalListings}
                    </div>
                    <div className="text-xs text-gray-300 dark:text-gray-400">
                      Total Listings
                    </div>
                  </div>
                  <div className="text-center backdrop-blur-sm bg-white/10 dark:bg-gray-800/20 rounded-lg px-4 py-2">
                    <div className="font-bold text-lg text-white dark:text-gray-100">
                      {brokerStats.pendingReviews}
                    </div>
                    <div className="text-xs text-gray-300 dark:text-gray-400">
                      Pending
                    </div>
                  </div>
                  <div className="text-center backdrop-blur-sm bg-white/10 dark:bg-gray-800/20 rounded-lg px-4 py-2">
                    <div className="font-bold text-lg text-white dark:text-gray-100">
                      {brokerStats.totalRevenue.toLocaleString("en-ET", {
                        style: "currency",
                        currency: "ETB",
                        minimumFractionDigits: 0,
                      })}
                    </div>
                    <div className="text-xs text-gray-300 dark:text-gray-400">
                      Revenue
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

                  {/* Theme Toggle */}
                  <Suspense fallback={null}>
                    <ThemeToggle theme={theme} onToggle={toggleTheme} />
                  </Suspense>

                  {/* Profile Avatar */}
                  <div className="relative">
                    <Suspense
                      fallback={
                        <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>
                      }
                    >
                      <ProfileAvatar
                        userProfilePicture={formatProfilePictureUrl(
                          user?.profile_picture
                        )}
                        firstName={user?.first_name}
                        lastName={user?.last_name}
                        username={user?.username}
                        email={user?.email}
                        role={user?.role}
                        size="sm"
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
            <main>{renderContent()}</main>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black h-full bg-opacity-50 md:hidden z-20"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        {/* Property Details Modal */}
        {showPropertyDetails && selectedProperty && (
          <PropertyDetailsModal
            property={selectedProperty}
            isOpen={showPropertyDetails}
            onClose={() => setShowPropertyDetails(false)}
            theme={theme}
            onEdit={() => handleEditProperty(selectedProperty)}
          />
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

        {/* Create Property Form Modal */}
        {showCreatePropertyForm && (
          <CreatePropertyForm
            isOpen={showCreatePropertyForm}
            onClose={() => setShowCreatePropertyForm(false)}
            onSubmit={handleCreateNewProperty}
            theme={theme}
            brokerId={user?.id}
          />
        )}
        {/* Notifications Panel */}
        <Suspense fallback={null}>
          <NotificationsPanel
            isOpen={showNotificationsPanel}
            onClose={() => setShowNotificationsPanel(false)}
            theme={theme}
            unreadCount={notificationCount}
            setUnreadCount={setNotificationCount}
            userId={user?.id}
          />
        </Suspense>

        {/* Toast Notifications */}
        <Suspense fallback={null}>
          <Toast
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
            theme={theme}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

// Internal and External Broker Dashboard Wrappers
export const InternalBrokerDashboard = () => (
  <BrokerDashboard isInternal={true} />
);
export const ExternalBrokerDashboard = () => (
  <BrokerDashboard isInternal={false} />
);

export default BrokerDashboard;
