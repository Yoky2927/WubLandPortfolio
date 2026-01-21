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
const StaticProfileAvatar = lazy(() => import("../../components/StaticProfileAvatar"));
const NotificationBadge = lazy(() => import("../../components/NotificationBadge"));
const NotificationsPanel = lazy(() => import("../../components/NotificationsPanel"));
const ThemeToggle = lazy(() => import("../../components/ThemeToggle"));

// Lazy load broker components
const BrokerPropertiesList = lazy(() => import("../../components/BrokerPropertiesList"));
const BrokerTransactions = lazy(() => import("../../components/BrokerTransactions"));
const BrokerAnalytics = lazy(() => import("../../components/BrokerAnalytics"));
const BrokerDocuments = lazy(() => import("../../components/BrokerDocuments"));
const PropertyDetailsModal = lazy(() => import("../../components/PropertyDetailsModal"));
const CreatePropertyForm = lazy(() => import("../../components/CreatePropertyForm"));
const EditPropertyForm = lazy(() => import("../../components/EditPropertyForm"));
const BrokerRequestsList = lazy(() => import("../../components/BrokerRequestsList"));
const BrokerProfessionalTools = lazy(() => import("../../components/BrokerProfessionalTools"));

// Import icons
import {
  Users, Home, MessageSquare, CreditCard, BarChart3,
  FileText, Settings, LogOut, Bell, Menu, X, Shield,
  RefreshCw, Globe, Package, Database, Server, Building
} from "lucide-react";

const BrokerDashboard = ({ isInternal = true }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("properties");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [brokerProperties, setBrokerProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestCount, setRequestCount] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [showCreatePropertyForm, setShowCreatePropertyForm] = useState(false);
  const [showEditPropertyForm, setShowEditPropertyForm] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState(null);
  const [showProfessionalTools, setShowProfessionalTools] = useState(false);
  const [selectedRequestForTools, setSelectedRequestForTools] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [brokerStats, setBrokerStats] = useState({
    totalListings: 0, pendingReviews: 0, approvedListings: 0, rejectedListings: 0,
    activeClients: 0, totalRevenue: 0, responseRate: 0, avgResponseTime: "0h",
    totalTransactions: 0, completedTransactions: 0, pendingTransactions: 0,
    totalDocuments: 0, signedContracts: 0, pendingDocuments: 0
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const navigate = useNavigate();
  const { notificationCount, setNotificationCount } = useNotifications(user?.id);
  const { analyticsData, fetchAnalyticsData: fetchAnalyticsDataHook } = useAnalytics();

  // Navigation items configuration
  const navItems = [
    { id: "properties", label: "Property Listings", icon: Home, badge: brokerStats.pendingReviews },
    { id: "requests", label: "Property Requests", icon: Users, badge: requestCount },
    { id: "transactions", label: "Transactions", icon: CreditCard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "chat", label: "Messages", icon: MessageSquare },
    { id: "documents", label: "Document Vault", icon: FileText, badge: brokerStats.pendingDocuments },
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
          profile_picture: userData.profile_picture || userData.profilePicture || storedUser?.profile_picture
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

  // Fetch broker listings - FIXED: Using correct API endpoint
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
      pendingReviews: properties.filter(p => 
        ["pending", "pending_review", "draft"].includes(p.property_status || p.status || "")
      ).length,
      approvedListings: properties.filter(p => 
        ["active", "approved"].includes(p.property_status || p.status || "")
      ).length,
      rejectedListings: properties.filter(p => 
        ["rejected", "inactive"].includes(p.property_status || p.status || "")
      ).length,
      totalRevenue: properties.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0),
    };
    
    setBrokerStats(prev => ({ ...prev, ...stats }));
  };

  // Fetch broker stats - FIXED: Using correct API endpoint
  const fetchBrokerStats = async (brokerId) => {
    try {
      // Using GET_ANALYTICS endpoint and filtering client-side
      const response = await api.get("GET_ANALYTICS");
      if (response?.success || response?.data) {
        const allAnalytics = response.data || response;
        
        // Filter for broker-specific analytics if available
        if (allAnalytics.brokerStats) {
          setBrokerStats(prev => ({ ...prev, ...allAnalytics.brokerStats }));
        } else {
          // Default stats from properties
          calculateBrokerStatsFromProperties(brokerProperties);
        }
      }
    } catch (error) {
      console.warn("Could not fetch broker stats:", error.message);
      // Fallback to calculating from properties
      calculateBrokerStatsFromProperties(brokerProperties);
    }
  };

  // Fetch document stats - FIXED: Using GET_USER_DOCUMENTS endpoint
  const fetchDocumentStats = async (brokerId) => {
    try {
      const docsResponse = await api.get("GET_USER_DOCUMENTS");
      if (docsResponse?.success || docsResponse?.data) {
        const docsData = docsResponse.data || docsResponse;
        const documents = Array.isArray(docsData) ? docsData : (docsData.documents || []);
        
        setBrokerStats(prev => ({
          ...prev,
          totalDocuments: documents.length,
          signedContracts: documents.filter(doc => 
            doc.status === 'signed' || doc.document_type === 'contract'
          ).length,
          pendingDocuments: documents.filter(doc => 
            doc.status === 'pending' || doc.status === 'awaiting_signature'
          ).length,
        }));
      }
    } catch (error) {
      console.warn("Could not fetch document stats:", error.message);
    }
  };

  // Fetch requests - FIXED: Using GET_TICKETS endpoint
  const fetchRequests = async () => {
    try {
      const response = await api.get("GET_TICKETS");
      console.log("📨 Requests response:", response);
      
      let requestsData = [];
      if (Array.isArray(response?.data)) {
        requestsData = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        requestsData = response.data.data;
      } else if (Array.isArray(response)) {
        requestsData = response;
      } else if (response?.tickets) {
        requestsData = response.tickets;
      }

      console.log("📝 Extracted requests:", requestsData);
      setRequests(requestsData);
      setRequestCount(requestsData.filter(r => r.status === "pending").length);
    } catch (error) {
      console.error("Error fetching requests:", error);
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
        fetchRequests()
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
          } else if (apiError.message?.includes("401") || apiError.message?.includes("403")) {
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
        
        // Listen for broker-specific events
        socketService.addListener("new_listing_assigned", (data) => {
          setToast({
            show: true,
            message: `New listing assigned: ${data.propertyTitle}`,
            type: "info",
          });
          fetchBrokerDashboardData(user.id);
          setNotificationCount(prev => prev + 1);
        });

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

        socketService.addListener("new_message", () => {
          setNotificationCount(prev => prev + 1);
        });

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
      } catch (error) {
        console.log("⚠️ WebSocket not available, continuing without real-time updates");
      }
    };

    connectSocket();

    return () => {
      socketService.disconnect();
    };
  }, [user?.id]);

  // Event handlers
  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setShowPropertyDetails(true);
  };

  const handleCreateProperty = () => setShowCreatePropertyForm(true);

  const handleEditProperty = (property) => {
    if (!property?.id) {
      setToast({ show: true, message: "Cannot edit: Property ID not found", type: "error" });
      return;
    }
    setShowPropertyDetails(false);
    setPropertyToEdit(property);
    setShowEditPropertyForm(true);
  };

  const handleUpdateProperty = async (updatedProperty) => {
    try {
      const response = await api.put("UPDATE_PROPERTY", { id: updatedProperty.id }, updatedProperty);
      if (response?.success || response?.data?.success) {
        setShowEditPropertyForm(false);
        setToast({ show: true, message: "Property updated successfully!", type: "success" });
        fetchBrokerDashboardData(user.id);
      }
    } catch (error) {
      console.error("Error updating property:", error);
      setToast({ show: true, message: "Failed to update property. Please try again.", type: "error" });
    }
  };

  const handleCreateNewProperty = async (propertyData) => {
    try {
      const response = await api.post("CREATE_PROPERTY", {}, propertyData);
      if (response?.success || response?.data?.success) {
        setToast({ show: true, message: "Property created successfully", type: "success" });
        setShowCreatePropertyForm(false);
        fetchBrokerDashboardData(user.id);
      }
    } catch (error) {
      setToast({ show: true, message: "Failed to create property", type: "error" });
    }
  };

  const handlePropertyAction = async (propertyId, action, notes = "") => {
    try {
      const response = await api.post("PROPERTY_ACTION", { id: propertyId }, { action, notes });
      if (response?.success || response?.data?.success) {
        setBrokerProperties(prev => prev.map(property => 
          property.id === propertyId ? { ...property, property_status: response.data?.property_status } : property
        ));
        
        setBrokerStats(prev => {
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
        
        setToast({ show: true, message: `Property ${action}d successfully`, type: "success" });
      }
    } catch (error) {
      console.error("Error performing property action:", error);
      setToast({ show: true, message: error.message || "Failed to perform action", type: "error" });
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await api.put("UPDATE_TICKET_STATUS", { id: requestId }, { status: "accepted", brokerId: user?.id });
      if (response?.success || response?.data?.success) {
        setToast({ show: true, message: "Request accepted successfully", type: "success" });
        fetchRequests();
        setRequestCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      setToast({ show: true, message: "Failed to accept request", type: "error" });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await api.put("UPDATE_TICKET_STATUS", { id: requestId }, { status: "rejected" });
      if (response?.success || response?.data?.success) {
        setToast({ show: true, message: "Request rejected", type: "success" });
        fetchRequests();
        setRequestCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      setToast({ show: true, message: "Failed to reject request", type: "error" });
    }
  };

  const handleStartProfessionalTools = (request) => {
    setSelectedRequestForTools(request);
    setShowProfessionalTools(true);
  };

  const handleMessageClient = (clientId) => navigate(`/chat/${clientId}`);
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

  // Render content
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
      case "properties":
        return (
          <BrokerPropertiesList
            {...commonProps}
            onViewDetails={handleViewDetails}
            onCreateProperty={handleCreateProperty}
          />
        );
      case "requests":
        return (
          <BrokerRequestsList
            theme={theme}
            requests={requests}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onMessageClient={handleMessageClient}
            onStartProfessionalTools={handleStartProfessionalTools}
          />
        );
      case "transactions":
        return <BrokerTransactions {...commonProps} brokerId={user?.id} />;
      case "analytics":
        return <BrokerAnalytics {...commonProps} brokerId={user?.id} />;
      case "documents":
        return <BrokerDocuments brokerId={user?.id} theme={theme} user={user} />;
      case "chat":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Messages</h2>
            <p className="text-gray-500">Chat feature is integrated with the main chat system.</p>
            <button
              onClick={() => navigate("/chat")}
              className="mt-4 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg transition-colors"
            >
              Open Chat
            </button>
          </div>
        );
      case "settings":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-gray-500">Broker settings coming soon.</p>
          </div>
        );
      default:
        return (
          <div className={`p-12 text-center rounded-xl border ${theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
            }`}
          >
            <h2 className={`text-2xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
              This feature is currently in development.
            </p>
          </div>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${theme === "dark"
        ? "bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white"
        : "bg-gray-100 text-gray-900"
        } flex transition-colors duration-300`}
      >
        {/* Sidebar */}
        <div className={`fixed lg:static w-64 min-h-screen flex-shrink-0 shadow-lg transform transition-transform duration-300 ${isMobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0"
          } ${theme === "dark"
            ? "bg-gray-900/40 backdrop-blur-lg border-r border-gray-700/30"
            : "bg-white border-r border-gray-200"
          } flex flex-col z-30`}
        >
          {/* Logo */}
          <div className={`flex items-center gap-4 px-8 py-3 border-b ${theme === "dark"
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
          <div className={`p-4 md:p-6 border-b ${theme === "dark"
            ? "border-gray-700/40 bg-gray-900/30"
            : "border-gray-200"
            } flex flex-col items-center`}
          >
            <div className="flex justify-center mb-4">
              <Suspense fallback={
                <div className="w-20 h-20 rounded-full bg-gray-300 animate-pulse"></div>
              }>
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
              <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {user?.first_name} {user?.last_name}
              </p>
              <p className={`text-sm ${theme === "dark" ? "text-amber-400" : "text-amber-600"
                } flex items-center justify-center gap-1`}
              >
                <Shield className="w-4 h-4" />
                {isInternal ? "Internal Broker" : "External Broker"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Documents: {brokerStats.signedContracts} signed
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`p-4 flex-1 ${theme === "dark" ? "bg-gray-900/20" : ""}`}>
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center rounded-xl px-4 py-3 transition-all text-left ${activeTab === item.id
                    ? theme === "dark"
                      ? "bg-amber-600/80 text-white backdrop-blur-sm shadow-lg"
                      : "bg-amber-100 text-amber-600 shadow-lg"
                    : theme === "dark"
                      ? "text-amber-200 hover:bg-gray-700/50 backdrop-blur-sm"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${activeTab === item.id
                    ? theme === "dark"
                      ? "text-white"
                      : "text-amber-600"
                    : theme === "dark"
                      ? "text-amber-400"
                      : "text-gray-600"
                    }`}
                  />
                  <span className={`truncate ${activeTab === item.id
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
          <div className={`p-4 border-t ${theme === "dark"
            ? "border-gray-700/40 bg-gray-900/30"
            : "border-gray-200"
            }`}
          >
            <button
              className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${theme === "dark"
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
          <div className={`flex-shrink-0 border-b ${theme === "dark" ? "border-gray-700/30" : "border-gray-200"}`}
            style={{
              backgroundImage: `url(${theme === "dark"
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
                  className={`p-2 rounded md:hidden ${theme === "dark"
                    ? "hover:bg-gray-700/50 text-white"
                    : "hover:bg-white/30 text-gray-900"
                    } transition-colors backdrop-blur-sm`}
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Page Title */}
                <h1 className={`text-xl font-bold flex-1 mt-2 ml-10 text-center md:text-left ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {activeTab === "properties"
                    ? "Property Listings"
                    : activeTab === "analytics"
                    ? "Analytics Dashboard"
                    : activeTab === "transactions"
                    ? "Transaction Management"
                    : activeTab === "documents"
                    ? "Document Vault"
                    : activeTab === "chat"
                    ? "Messages"
                    : activeTab === "settings"
                    ? "Settings"
                    : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h1>

                {/* Quick Stats */}
                <div className="hidden md:flex items-center space-x-6">
                  <div className="text-center backdrop-blur-sm bg-white/10 dark:bg-gray-800/20 rounded-lg px-4 py-2">
                    <div className="font-bold text-lg text-white dark:text-gray-100">
                      {brokerStats.totalListings}
                    </div>
                    <div className="text-xs text-gray-300 dark:text-gray-400">
                      Listings
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
                      {brokerStats.signedContracts}
                    </div>
                    <div className="text-xs text-gray-300 dark:text-gray-400">
                      Signed
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
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              }>
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
            <div className={`rounded-xl max-w-6xl w-full max-h-[90vh] overflow-auto ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Professional Tools</h2>
                    <p className="text-gray-500">
                      Complete Ethiopian property agreement for request #{selectedRequestForTools.id}
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
            onClose={() => setToast(prev => ({ ...prev, show: false }))}
            theme={theme}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export const InternalBrokerDashboard = () => <BrokerDashboard isInternal={true} />;
export const ExternalBrokerDashboard = () => <BrokerDashboard isInternal={false} />;
export default BrokerDashboard;