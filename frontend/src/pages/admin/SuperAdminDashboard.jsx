// frontend/src/pages/admin/SuperAdminDashboard.jsx
import React, { useState, useEffect, Suspense, lazy, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useNotifications } from "../../hooks/useNotifications";
import { useUserManagement } from "../../hooks/useUserManagement";
import socketService from "../../services/socket.service";
import { apiCall } from "../../utils/api.endpoints";
import { formatProfilePicture } from "../../utils/profilePicture";

// Lazy load components
const Loader = lazy(() => import("../../components/Loader"));
const ErrorBoundary = lazy(() => import("../../components/ErrorBoundary"));
const Toast = lazy(() => import("../../components/Toast"));
const ProfileAvatar = lazy(() => import("../../components/ProfileAvatar"));
const StaticProfileAvatar = lazy(() => import("../../components/StaticProfileAvatar"));
const ProfilePictureModal = lazy(() => import("../../components/ProfilePictureModal"));
const NotificationBadge = lazy(() => import("../../components/NotificationBadge"));
const NotificationsPanel = lazy(() => import("../../components/NotificationsPanel"));
const ThemeToggle = lazy(() => import("../../components/ThemeToggle"));

// Lazy load dashboard components
const DashboardOverview = lazy(() => import("./components/DashboardOverview"));
const UserManagement = lazy(() => import("./components/UserManagement"));
const BrokerVerification = lazy(() => import("./components/BrokerVerification"));
const AnnouncementManager = lazy(() => import("./components/AnnouncementManager"));
const AnalyticsDashboard = lazy(() => import("./components/AnalyticsDashboard"));
const SystemHealth = lazy(() => import("./components/SystemHealth"));
const UserVerification = lazy(() => import("./components/UserVerification"));
const PropertiesRequest = lazy(() => import("./components/PropertiesRequest"));
const ChatApp = lazy(() => import("../../components/ChatApp.jsx"));

// Import icons
import {
  Users, Home, Shield, BarChart3, LogOut,
  Menu, X, Globe, Crown, MessageSquare, CreditCard,
  CheckSquare, AlertTriangle, Database, Server,
  Building, Key, Package, Settings, Bell, FileText,
  BarChart, ShieldCheck, Calendar, DollarSign
} from "lucide-react";

const SuperAdminDashboard = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [recentActivities, setRecentActivities] = useState([]);
  const [forceUpdate, setForceUpdate] = useState(false); // Add this for forcing re-renders
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "error",
  });

  const navigate = useNavigate();
  const { notificationCount, setNotificationCount } = useNotifications(user?.id);
  const { analyticsData, fetchAnalyticsData: fetchAnalyticsDataHook } = useAnalytics();
  const { users, isLoading: usersLoading, fetchUsers } = useUserManagement();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "am", name: "Amharic", flag: "🇪🇹" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
  ];

  // Get profile picture URL with fallback
  const profilePictureUrl = formatProfilePicture(user);

  // Fetch system health data
  const fetchSystemHealth = async () => {
    try {
      const response = await apiCall('SYSTEM_HEALTH');
      setSystemHealth(response);
    } catch (error) {
      console.error('Error fetching system health:', error);
      setSystemHealth({
        status: 'unknown',
        service: 'user-service',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      return await fetchAnalyticsDataHook();
    } catch (error) {
      console.error("Error in fetchAnalyticsData:", error);
      setToast({
        show: true,
        message: "Failed to load analytics data",
        type: "error",
      });
      return null;
    }
  };

  // Log activity
  const logActivity = async (type, adminUsername, target) => {
    try {
      await apiCall('ACTIVITY_LOG', {}, {
        method: 'POST',
        data: {
          type,
          admin: adminUsername,
          target,
        }
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

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
      console.log("🔄 Refreshing user data from API...");

      // Try CHECK_AUTH endpoint
      let response = await apiCall('GET_PROFILE'); // Use GET_PROFILE instead of CHECK_AUTH

      console.log("✅ API response:", response);

      let userData;

      // Handle different response formats
      if (response) {
        if (response.user) {
          userData = response.user;
        } else if (response.data) {
          userData = response.data;
        } else if (response.id || response.username) {
          userData = response; // Direct user object
        } else if (response.success && response.data) {
          userData = response.data;
        }
      }

      if (userData) {
        console.log("✅ Extracted user data:", userData);

        // Merge with any existing profile picture from localStorage
        const storedUser = getUserFromStorage();
        const mergedUser = {
          ...userData,
          profile_picture: userData.profile_picture || userData.profilePicture || storedUser?.profile_picture
        };

        console.log("✅ Merged user data:", mergedUser);
        setUser(mergedUser);
        localStorage.setItem("user", JSON.stringify(mergedUser));
        return mergedUser;
      } else {
        console.warn("⚠️ No user data in API response");
        return null;
      }

    } catch (error) {
      console.error("❌ Error refreshing user data:", error);

      // Try alternative endpoint as fallback
      try {
        console.log("🔄 Trying alternative endpoint...");
        const fallbackResponse = await fetch('http://localhost:5000/api/auth/check', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
          }
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log("✅ Fallback response:", fallbackData);

          if (fallbackData.user || fallbackData.data) {
            const userData = fallbackData.user || fallbackData.data;
            const storedUser = getUserFromStorage();
            const mergedUser = {
              ...userData,
              profile_picture: userData.profile_picture || userData.profilePicture || storedUser?.profile_picture
            };

            setUser(mergedUser);
            localStorage.setItem("user", JSON.stringify(mergedUser));
            return mergedUser;
          }
        }
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }

      // Final fallback to localStorage
      const storedUser = getUserFromStorage();
      if (storedUser) {
        console.log("💾 Using stored user data as fallback");
        setUser(storedUser);
        return storedUser;
      }

      return null;
    }
  };

  const debugApiResponse = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("🔍 Debug - Token exists:", !!token);

      const response = await fetch('http://localhost:5000/api/auth/check', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      console.log("🔍 Debug - Response status:", response.status);
      console.log("🔍 Debug - Response headers:", response.headers);

      const text = await response.text();
      console.log("🔍 Debug - Raw response text:", text);

      try {
        const parsed = JSON.parse(text);
        console.log("🔍 Debug - Parsed JSON:", parsed);
      } catch {
        console.log("🔍 Debug - Response is not JSON");
      }
    } catch (error) {
      console.error("🔍 Debug - Fetch error:", error);
    }
  };

  // Call it in your useEffect to see what's happening
  useEffect(() => {
    if (isLoading) {
      debugApiResponse();
    }
  }, [isLoading]);

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

        // Check token payload
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.role !== "super_admin") {
            console.log("❌ Invalid role:", payload.role);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/unauthorized");
            return;
          }
          console.log("✅ Valid super_admin token");
        } catch (decodeError) {
          console.error("Token decode error:", decodeError);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login-register");
          return;
        }

        // First try to use stored user (for quick load)
        if (storedUser && storedUser.id) {
          console.log("💾 Using stored user data");
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

          if (userData.role !== "super_admin") {
            console.log("❌ API returned invalid role");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/unauthorized");
            return;
          }

          console.log("✅ Authentication successful");
          setUser(userData);
          setIsAuthorized(true);

          // Fetch initial data
          await Promise.allSettled([
            fetchUsers(),
            fetchAnalyticsData(),
            fetchSystemHealth(),
          ]);
          console.log("✅ Initial data loaded");

        } catch (apiError) {
          console.error("API error:", apiError);

          // If we have stored user, use it
          if (storedUser?.id) {
            console.log("⚠️ Using stored data due to API error");
            setUser(storedUser);
            setIsAuthorized(true);
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
      } catch (error) {
        console.log("⚠️ WebSocket not available, continuing without real-time updates");
      }
    };

    connectSocket();

    // Listen for todo events
    const unsubscribeTodo = socketService.addListener(
      "todo_created",
      (todo) => {
        const newActivity = {
          id: `todo-${Date.now()}`,
          type: "todo",
          action: "New Todo Created",
          detail: `"${todo.text}" assigned to ${todo.assignee}`,
          time: new Date().toLocaleString(),
          icon: "CheckSquare",
          timestamp: new Date(),
        };
        setRecentActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
        logActivity("todo_created", user?.username, `Todo: ${todo.text}`);
      }
    );

    // Listen for user registration
    const unsubscribeUser = socketService.addListener(
      "user_registered",
      (newUserData) => {
        const userJoinDate = new Date(newUserData.created_at || new Date());

        const newActivity = {
          id: `user-${Date.now()}`,
          type: "user",
          action: "New User Registered",
          detail: `${newUserData.first_name} ${newUserData.last_name} joined as ${newUserData.role}`,
          time: userJoinDate.toLocaleString(),
          icon: "Users",
          timestamp: userJoinDate,
        };

        setRecentActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
        logActivity(
          "user_registered",
          "system",
          `User: ${newUserData.first_name} ${newUserData.last_name}`
        );
      }
    );

    return () => {
      unsubscribeTodo();
      unsubscribeUser();
      socketService.disconnect();
    };
  }, [user?.id]); // Only depend on user.id

  // Calculate users from last 7 days
  const usersLast7Days = users.filter((userItem) => {
    const userDate = new Date(userItem.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return userDate > sevenDaysAgo;
  }).length;

  // Handle language change
  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode);
    setShowLanguagePicker(false);
    setToast({
      show: true,
      message: `Language changed to ${languages.find((l) => l.code === languageCode)?.name}`,
      type: "success",
    });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await apiCall('LOGOUT', {}, { method: 'POST' });
      }
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue anyway
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login-register";
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (file) => {
    try {
      console.log('📤 Uploading profile picture...');

      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await apiCall('UPLOAD_PROFILE', {}, {
        method: 'POST',
        data: formData
      });

      console.log('✅ Upload response:', response);

      if (response.success) {
        const newProfilePicture = response.profilePictureUrl || response.fullUrl;

        console.log('🆕 New profile picture:', newProfilePicture);

        // Update user state immediately
        const updatedUser = {
          ...user,
          profile_picture: newProfilePicture,
        };

        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Force refresh from API to ensure consistency
        await refreshUserData();

        // Force re-render
        setForceUpdate(prev => !prev);

        setShowProfileModal(false);
        setToast({
          show: true,
          message: "Profile picture updated successfully!",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setToast({
        show: true,
        message: error.message || "Failed to upload profile picture",
        type: "error",
      });
    }
  };

  // Debug function (remove in production)
  const debugProfilePicture = () => {
    console.log('🔍 DEBUG PROFILE PICTURE:', {
      user: user,
      profile_picture: user?.profile_picture,
      formatted: profilePictureUrl,
      localStorage: getUserFromStorage(),
      forceUpdate: forceUpdate
    });
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
      setToast,
      forceUpdate, // Pass forceUpdate to child components
    };

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            {...commonProps}
            users={users}
            analyticsData={analyticsData}
            systemHealth={systemHealth}
            recentActivities={recentActivities}
            usersLast7Days={usersLast7Days}
          />
        );
      case "users":
        return (
          <UserManagement
            {...commonProps}
            users={users}
            isLoading={usersLoading}
            fetchUsers={fetchUsers}
          />
        );
      case "brokers":
        return (
          <BrokerVerification
            {...commonProps}
            users={users}
            fetchUsers={fetchUsers}
          />
        );
      case "announcements":
        return <AnnouncementManager {...commonProps} />;
      case "analytics":
        return (
          <AnalyticsDashboard
            {...commonProps}
            analyticsData={analyticsData}
            fetchAnalyticsData={fetchAnalyticsDataHook}
          />
        );
      case "user-verification":
        return <UserVerification theme={theme} setToast={setToast} />;
      case "system":
        return <SystemHealth {...commonProps} />;
      case "properties":
        return <PropertiesRequest theme={theme} setToast={setToast} />; // Fixed: Added props
      case "chat":
        return <ChatApp />;
      default:
        return (
          <div className={`p-12 text-center rounded-xl border ${theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
            }`}
          >
            <h2 className={`text-2xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
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
                  broker_type={user?.broker_type}
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
                <Crown className="w-4 h-4" />
                Super Admin
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`p-4 flex-1 ${theme === "dark" ? "bg-gray-900/20" : ""}`}>
            <div className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                { id: "users", label: "User Management", icon: Users },
                { id: "brokers", label: "Broker Verification", icon: Shield },
                { id: "announcements", label: "Announcements", icon: AlertTriangle },
                { id: "analytics", label: "Analytics", icon: Database },
                { id: "system", label: "System Health", icon: Server },
                { id: "properties", label: "Properties", icon: Building },
                { id: "transactions", label: "Transactions", icon: CreditCard },
                { id: "user-verification", label: "User Verification", icon: ShieldCheck },
                { id: "chat", label: "Chat", icon: MessageSquare },
              ].map((item) => (
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
                  {activeTab === "dashboard"
                    ? "Super Admin Dashboard"
                    : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h1>

                {/* Right side - Icons */}
                <div className="flex items-center gap-3">
                  {/* Language Picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLanguagePicker(!showLanguagePicker)}
                      className={`p-2 rounded-lg transition-colors backdrop-blur-sm ${theme === "dark"
                        ? "hover:bg-gray-700/50 text-gray-300"
                        : "hover:bg-white/30 text-gray-600"
                        }`}
                    >
                      <Globe className="w-5 h-5" />
                    </button>
                    {showLanguagePicker && (
                      <div className={`absolute right-0 top-12 w-48 rounded-lg shadow-lg z-50 backdrop-blur-md ${theme === "dark"
                        ? "bg-gray-800/90 border border-gray-700"
                        : "bg-white/90 border border-gray-200"
                        }`}
                      >
                        {languages.map((language) => (
                          <button
                            key={language.code}
                            onClick={() => handleLanguageChange(language.code)}
                            className={`w-full text-left px-4 py-2 flex items-center gap-3 ${currentLanguage === language.code
                              ? theme === "dark"
                                ? "bg-gray-700/50 text-amber-400"
                                : "bg-amber-100/80 text-amber-700"
                              : theme === "dark"
                                ? "hover:bg-gray-700/50 text-gray-300"
                                : "hover:bg-gray-100/80 text-gray-700"
                              } transition-colors`}
                          >
                            <span className="text-lg">{language.flag}</span>
                            <span>{language.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notifications Badge */}
                  <div className="relative">
                    <Suspense fallback={
                      <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
                    }>
                      <NotificationBadge
                        count={notificationCount}
                        onClick={() => setShowNotificationsPanel(true)}
                        theme={theme}
                      />
                    </Suspense>
                  </div>

                  {/* Profile Avatar */}
                  <div className="relative">
                    <Suspense fallback={
                      <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>
                    }>
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
                        onUploadImage={() => setShowProfileModal(true)}
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

        {/* Theme Toggle */}
        <Suspense fallback={null}>
          <ThemeToggle theme={theme} />
        </Suspense>

        {/* Modals */}
        {user && (
          <Suspense fallback={null}>
            <ProfilePictureModal
              key={`modal-${user?.id}-${forceUpdate}`}
              isOpen={showProfileModal}
              onClose={() => {
                setShowProfileModal(false);
                refreshUserData();
              }}
              onUpload={handleProfilePictureUpload}
              userProfilePicture={profilePictureUrl}
              firstName={user?.first_name}
              lastName={user?.last_name}
              role={user?.role}
              theme={theme}
              user={user}
              onSuccess={refreshUserData}
            />
          </Suspense>
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
            onClose={() => setToast(prev => ({ ...prev, show: false }))}
            theme={theme}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default SuperAdminDashboard;