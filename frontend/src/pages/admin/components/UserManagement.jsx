// frontend/src/pages/admin/components/UserManagement.jsx
import React, { useState, useMemo, lazy, Suspense, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  MoreVertical,
  ChevronDown,
  Shield,
  CheckCircle,
  XCircle
} from "lucide-react";
import { httpClient } from "../../../services/http.service";

// Lazy load modals
const UserInfoModal = lazy(() => import("./modals/UserInfoModal"));
const CreateUserModal = lazy(() => import("./modals/CreateUserModal"));
const EditUserModal = lazy(() => import("./modals/EditUserModal"));
const ConfirmationModal = lazy(() => import("./modals/ConfirmationModal"));

const UserManagement = ({
  theme,
  user: currentUser,
  users,
  isLoading,
  fetchUsers,
  setToast
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [originalEditUser, setOriginalEditUser] = useState(null);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    role: "admin",
    privilege_tier: "basic",
    phone: "",
    status: "active",
    broker_type: "external",
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("🚀 UserManagement Component Mounted");
    console.log("📊 Current users prop:", users);
    console.log("👤 Current user:", currentUser);
    console.log("⏳ Loading state:", isLoading);
    console.log("🔄 Has fetchUsers function:", !!fetchUsers);

    // If no users and not loading, try to fetch
    if (!isLoading && (!users || users.length === 0)) {
      console.log("🔄 No users detected, attempting to fetch...");
      if (fetchUsers) {
        fetchUsers();
      } else {
        console.error("❌ fetchUsers function not provided!");
      }
    }
  }, []);

  useEffect(() => {
    const testAPI = async () => {
      console.log('🔍 Debug: Testing API directly...');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const text = await response.text();
        console.log('🔍 Raw API response:', text);
        try {
          const json = JSON.parse(text);
          console.log('🔍 Parsed JSON:', json);
        } catch (e) {
          console.error('🔍 Parse error:', e);
        }
      } catch (error) {
        console.error('🔍 Fetch error:', error);
      }
    };

    testAPI();
  }, []);

  useEffect(() => {
    console.log("🔄 Users data updated:", {
      totalUsers: users?.length || 0,
      users: users
    });
  }, [users]);

  // Role colors
  const roleColors = {
    super_admin: "bg-red-500",
    admin: "bg-purple-500",
    support_admin: "bg-indigo-500",
    support_lead: "bg-blue-500",
    support_agent: "bg-cyan-500",
    internal_broker: "bg-amber-500",
    external_broker: "bg-orange-500",
    buyer: "bg-green-500",
    seller: "bg-yellow-500",
    landlord: "bg-teal-500",
    renter: "bg-pink-500",
    user: "bg-gray-500",
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    const feedback = [];

    if (password.length >= 8) strength += 25;
    else feedback.push("at least 8 characters");

    if (/[A-Z]/.test(password)) strength += 25;
    else feedback.push("an uppercase letter");

    if (/[0-9]/.test(password)) strength += 25;
    else feedback.push("a number");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
    else feedback.push("a special character");

    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };

  // Filter users with debugging
  const filteredUsers = useMemo(() => {
    console.log("🔍 Filtering users...", {
      totalUsers: users?.length || 0,
      searchTerm,
      filterStatus,
      filterRole,
      currentUserId: currentUser?.id
    });

    if (!users || users.length === 0) {
      console.log("⚠️ No users to filter");
      return [];
    }

    const result = users
      .filter((u) => {
        const isNotCurrentUser = u.id !== currentUser?.id;
        if (currentUser?.id && u.id === currentUser.id) {
          console.log(`❌ Filtering out current user: ${u.first_name} ${u.last_name}`);
        }
        return isNotCurrentUser;
      })
      .filter((userItem) => {
        const matchesSearch = `${userItem.first_name || ""} ${userItem.last_name || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          (userItem.username &&
            userItem.username
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (userItem.email &&
            userItem.email.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch && searchTerm) {
          console.log(`❌ User ${userItem.first_name} ${userItem.last_name} doesn't match search: ${searchTerm}`);
        }
        return matchesSearch;
      })
      .filter((userItem) => {
        const matchesStatus = filterStatus === "all" || userItem.status === filterStatus;
        if (!matchesStatus && filterStatus !== "all") {
          console.log(`❌ User ${userItem.first_name} status ${userItem.status} doesn't match filter: ${filterStatus}`);
        }
        return matchesStatus;
      })
      .filter((userItem) => {
        const matchesRole = filterRole === "all" || userItem.role === filterRole;
        if (!matchesRole && filterRole !== "all") {
          console.log(`❌ User ${userItem.first_name} role ${userItem.role} doesn't match filter: ${filterRole}`);
        }
        return matchesRole;
      });

    console.log("📊 Filtered result:", result.length, "users");
    if (result.length === 0 && users.length > 0) {
      console.log("⚠️ All users filtered out! Check filters.");
      console.log("Available users:", users.map(u => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        role: u.role,
        status: u.status,
        email: u.email
      })));
    }
    return result;
  }, [users, searchTerm, filterStatus, filterRole, currentUser]);

  // Create user function
  const createUser = async () => {
    if (newUser.password.length < 8) {
      setToast({
        show: true,
        message: "Password must be at least 8 characters long",
        type: "error",
      });
      return;
    }

    if (newUser.role.includes("broker") && !newUser.broker_type) {
      setToast({
        show: true,
        message: "Broker type is required for brokers",
        type: "error",
      });
      return;
    }

    if (passwordStrength < 50) {
      setToast({
        show: true,
        message: `Password is too weak. Please include ${passwordFeedback.join(", ")}`,
        type: "error",
      });
      return;
    }

    try {
      setLoadingAction(true);

      console.log("📤 Creating user:", newUser);

      // First API call - check for warnings
      const response = await httpClient.post(
        "http://localhost:5000/api/auth/admin/create-user",
        newUser
      );

      console.log("✅ First API response:", response);

      // Check if response exists
      if (!response) {
        throw new Error("No response from server");
      }

      // Check for warning response (for client roles like buyer)
      if (response.warning === true) {
        console.log("⚠️ Warning received:", response.message);

        const isConfirmed = window.confirm(
          response.message + "\n\nClick OK to proceed or Cancel to go back."
        );

        if (!isConfirmed) {
          setToast({
            show: true,
            message: "User creation canceled",
            type: "info",
          });
          return;
        }

        console.log("✅ User confirmed, making second API call with X-Confirm header...");

        try {
          // Make the CONFIRMED API call with X-Confirm header
          const confirmResponse = await httpClient.post(
            "http://localhost:5000/api/auth/admin/create-user",
            newUser,
            {
              headers: {
                "X-Confirm": "true",
              },
            }
          );

          console.log("✅ Confirmed API response:", confirmResponse);

          // Handle the confirmed response
          if (confirmResponse && confirmResponse.success === true) {
            setShowCreateUserModal(false);
            resetNewUserForm();
            setToast({
              show: true,
              message: "User created successfully!",
              type: "success",
            });

            // Refresh user list
            console.log("🔄 Refreshing user list...");
            await fetchUsers();
          } else {
            // If no success field, check for error message
            throw new Error(confirmResponse?.message || "User creation failed after confirmation");
          }
        } catch (confirmError) {
          console.error("❌ Confirmed API call failed:", confirmError);

          setToast({
            show: true,
            message: confirmError.response?.data?.message || confirmError.message || "Failed to create user after confirmation",
            type: "error",
          });
          return;
        }
      }
      // Check for direct success (non-client roles like admin)
      else if (response.success === true) {
        console.log("✅ User created directly (no warning needed)");

        setShowCreateUserModal(false);
        resetNewUserForm();
        setToast({
          show: true,
          message: "User created successfully!",
          type: "success",
        });

        // Refresh user list
        console.log("🔄 Refreshing user list...");
        await fetchUsers();
      }
      // Handle other responses
      else {
        console.warn("⚠️ Unexpected response structure:", response);

        setToast({
          show: true,
          message: response.message || "Unexpected response from server",
          type: "error",
        });
      }

    } catch (error) {
      console.error("❌ Error in createUser:", error);
      console.error("Error response:", error.response);

      setToast({
        show: true,
        message: error.response?.data?.message || error.message || "Failed to create user",
        type: "error",
      });
    } finally {
      setLoadingAction(false);
    }
  };
  
  const resetNewUserForm = () => {
    setNewUser({
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      password: "",
      role: "admin",
      privilege_tier: "basic",
      phone: "",
      status: "active",
      broker_type: "external",
    });
    setPasswordStrength(0);
    setPasswordFeedback([]);
  };

  // Update user function - FIXED VERSION
  const updateUser = async (userToUpdate) => {
    try {
      setLoadingAction(true);
      console.log("📤 Updating user:", userToUpdate);

      // Multiple API calls for different updates
      const updates = [];

      // Update role if changed
      if (originalEditUser && userToUpdate.role !== originalEditUser.role) {
        updates.push(
          httpClient.put(
            `http://localhost:5000/api/users/${userToUpdate.id}/role`,
            { newRole: userToUpdate.role }
          )
        );
      }

      // Update privileges if changed
      if (originalEditUser && userToUpdate.privilege_tier !== originalEditUser.privilege_tier) {
        updates.push(
          httpClient.put(
            `http://localhost:5000/api/users/${userToUpdate.id}/privileges`,
            { privilege_tier: userToUpdate.privilege_tier }
          )
        );
      }

      // Update status if changed
      if (originalEditUser && userToUpdate.status !== originalEditUser.status) {
        updates.push(
          httpClient.put(
            `http://localhost:5000/api/users/${userToUpdate.id}/status`,
            { status: userToUpdate.status }
          )
        );
      }

      // If no updates needed, return early
      if (updates.length === 0) {
        setShowActionModal(false);
        setEditUser(null);
        setOriginalEditUser(null);
        setToast({
          show: true,
          message: "No changes detected",
          type: "info",
        });
        return;
      }

      // Execute all updates
      await Promise.all(updates);

      console.log("✅ User update successful");

      setShowActionModal(false);
      setEditUser(null);
      setOriginalEditUser(null);
      setToast({
        show: true,
        message: "User updated successfully!",
        type: "success",
      });

      // Log activity
      console.log("Activity logged:", {
        type: "user_updated",
        admin: currentUser?.username,
        target: `User: ${userToUpdate.first_name} ${userToUpdate.last_name}`
      });

      // Refresh user list
      console.log("🔄 Refreshing user list...");
      await fetchUsers();

    } catch (error) {
      console.error("❌ Error updating user:", error);
      console.error("Error details:", error.response?.data || error.message);
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to update user",
        type: "error",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle user actions
  const handleUserAction = (userAction, action) => {
    if (userAction.role === "super_admin" && userAction.id !== currentUser?.id) {
      setToast({
        show: true,
        message: "You cannot modify other Super Admins",
        type: "error",
      });
      return;
    }

    setSelectedUser(userAction);
    setActionType(action);
    if (action === "edit") {
      const userToEdit = { ...userAction };
      setEditUser(userToEdit);
      setOriginalEditUser(userToEdit); // Save original values for comparison
    }
    setShowActionModal(true);
  };

  // Confirm user action
  const confirmUserAction = async () => {
    try {
      setLoadingAction(true);
      console.log(`🔄 Performing ${actionType} on user:`, selectedUser);

      let endpoint, method, data;

      switch (actionType) {
        case "delete":
          endpoint = `http://localhost:5000/api/users/${selectedUser.id}`;
          method = "DELETE";
          break;
        case "activate":
        case "deactivate":
          endpoint = `http://localhost:5000/api/users/${selectedUser.id}/status`;
          method = "PUT";
          data = { status: actionType === "activate" ? "active" : "inactive" };
          break;
        default:
          return;
      }

      const response = method === "DELETE"
        ? await httpClient.delete(endpoint)
        : await httpClient.put(endpoint, data);

      console.log(`✅ ${actionType} successful:`, response.data);

      setShowActionModal(false);
      setToast({
        show: true,
        message: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} successful!`,
        type: "success",
      });

      // Log activity
      try {
        await httpClient.post("http://localhost:5000/api/activity/log", {
          type: `user_${actionType}`,
          admin: currentUser?.username,
          target: `User: ${selectedUser.first_name} ${selectedUser.last_name}`
        });
      } catch (activityError) {
        console.warn("Activity logging skipped:", activityError.message);
      }

      // Refresh user list
      console.log("🔄 Refreshing user list...");
      await fetchUsers();

    } catch (error) {
      console.error(`❌ Error ${actionType} user:`, error);
      console.error("Error details:", error.response?.data || error.message);
      setToast({
        show: true,
        message: error.response?.data?.message || "Action failed",
        type: "error",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Format profile picture URL
  const formatProfilePictureUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `http://localhost:5000${url}`;
    return `http://localhost:5000/${url}`;
  };

  // Role options
  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "support_admin", label: "Support Admin" },
    { value: "support_lead", label: "Support Lead" },
    { value: "support_agent", label: "Support Agent" },
    { value: "internal_broker", label: "Internal Broker" },
    { value: "external_broker", label: "External Broker" },
    { value: "buyer", label: "Buyer" },
    { value: "seller", label: "Seller" },
    { value: "landlord", label: "Landlord" },
    { value: "renter", label: "Renter" },
    { value: "user", label: "User" },
  ];

  // Stats
  const userStats = {
    total: users?.length || 0,
    active: users?.filter(u => u.status === 'active').length || 0,
    inactive: users?.filter(u => u.status === 'inactive').length || 0,
    brokers: users?.filter(u => u.role.includes('broker')).length || 0,
    admins: users?.filter(u => u.role.includes('admin')).length || 0,
  };

  // Debug panel
  const showDebugPanel = false; // Set to true to see debug info

  return (
    <div className="space-y-6">
      {/* Debug Panel - Temporary */}
      {showDebugPanel && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">Debug Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="font-medium">Total Users:</span> {userStats.total}
            </div>
            <div>
              <span className="font-medium">Current User ID:</span> {currentUser?.id || "None"}
            </div>
            <div>
              <span className="font-medium">Filtered Users:</span> {filteredUsers.length}
            </div>
            <div>
              <span className="font-medium">Loading:</span> {isLoading ? "Yes" : "No"}
            </div>
          </div>
          <button
            onClick={() => {
              console.log("🔍 All users:", users);
              console.log("👤 Current user:", currentUser);
              console.log("🎯 Filtered users:", filteredUsers);
            }}
            className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded"
          >
            Log to Console
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className={`text-2xl lg:text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
            User Management
          </h2>
          <p className={`mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
            Manage all users across the platform
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
              {userStats.total} total users • {userStats.active} active
            </p>
            <p className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <Shield className={`w-5 h-5 ${theme === "dark" ? "text-amber-400" : "text-amber-600"
            }`} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                Total Users
              </p>
              <p className="text-2xl font-bold">{userStats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                Active Users
              </p>
              <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                Brokers
              </p>
              <p className="text-2xl font-bold text-amber-600">{userStats.brokers}</p>
            </div>
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                Admins
              </p>
              <p className="text-2xl font-bold text-purple-600">{userStats.admins}</p>
            </div>
            <UserCheck className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] group"
            style={{
              background: "transparent",
              borderImage:
                theme === "dark"
                  ? "linear-gradient(135deg, #f59e0b, #d97706) 1"
                  : "linear-gradient(135deg, #f59e0b, #fbbf24) 1",
            }}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${theme === "dark"
                ? "bg-gradient-to-r from-amber-400 to-orange-500 group-hover:from-amber-300 group-hover:to-orange-400"
                : "bg-gradient-to-r from-amber-400 to-amber-500 group-hover:from-amber-300 group-hover:to-amber-400"
                }`}
            >
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <span
              className={`font-semibold ${theme === "dark"
                ? "text-amber-200 group-hover:text-amber-100"
                : "text-amber-700 group-hover:text-amber-600"
                }`}
            >
              Create User
            </span>
          </button>

          <div className="relative flex-1 lg:flex-none min-w-[250px]">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                } w-5 h-5`}
            />
            <input
              type="text"
              placeholder="Search users..."
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${theme === "dark"
                ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                : "bg-white text-black border-gray-300 placeholder-gray-500"
                }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <select
            className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${theme === "dark"
              ? "bg-gray-700 text-white border-gray-600"
              : "bg-white text-black border-gray-300"
              }`}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${theme === "dark"
              ? "bg-gray-700 text-white border-gray-600"
              : "bg-white text-black border-gray-300"
              }`}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-3 border rounded-xl flex items-center gap-2 ${theme === "dark"
              ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              : "bg-white text-black border-gray-300 hover:bg-gray-100"
              }`}
          >
            <Filter className="w-5 h-5" />
            More
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""
              }`} />
          </button>

          <button className={`px-4 py-3 border rounded-xl flex items-center gap-2 ${theme === "dark"
            ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            : "bg-white text-black border-gray-300 hover:bg-gray-100"
            }`}>
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className={`p-4 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                Privilege Tier
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
                  }`}
              >
                <option value="all">All Tiers</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                Verified Status
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
                  }`}
              >
                <option value="all">All</option>
                <option value="verified">Verified Only</option>
                <option value="not_verified">Not Verified</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                Date Joined
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
                  }`}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className={`p-4 lg:p-6 rounded-xl border transition-all duration-300 ${theme === "dark"
        ? "bg-gray-800 border-gray-700 shadow-lg"
        : "bg-white border-gray-200 shadow-md"
        }`}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-[900px] w-full table-auto">
              <thead>
                <tr
                  className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    } transition-colors duration-300`}
                >
                  {[
                    "User",
                    "Username",
                    "Email",
                    "Role",
                    "Privilege Tier",
                    "Broker Type",
                    "Status",
                    "Verified",
                    "Message Count",
                    "Joined",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className={`px-6 py-4 text-left font-semibold transition-colors duration-300 ${theme === "dark" ? "text-white" : "text-gray-600"
                        }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userItem) => {
                  const initials = `${userItem.first_name?.[0] || ""}${userItem.last_name?.[0] || ""
                    }`.toUpperCase();
                  const colorClass = roleColors[userItem.role] || "bg-gray-500";

                  return (
                    <tr
                      key={userItem.id}
                      className={`border-b transition-all duration-300 hover:transform hover:scale-[1.01] ${theme === "dark"
                        ? "border-gray-700 hover:bg-gray-750"
                        : "border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      <td
                        className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {userItem.profile_picture ? (
                              <img
                                src={formatProfilePictureUrl(
                                  userItem.profile_picture
                                )}
                                alt={`${userItem.first_name} ${userItem.last_name}`}
                                className="w-12 h-12 rounded-full object-cover shadow-md"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  const sibling = e.target.nextElementSibling;
                                  if (sibling) {
                                    sibling.style.display = "flex";
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md ${colorClass} ${userItem.profile_picture
                                ? "hidden"
                                : "flex"
                                }`}
                            >
                              {initials}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 transition-all duration-300 ${theme === "dark"
                                ? "ring-gray-800"
                                : "ring-white"
                                } ${userItem.status === "active"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                                }`}
                            />
                          </div>
                          <div>
                            <div
                              className={`font-medium transition-colors duration-300 ${theme === "dark"
                                ? "text-white"
                                : "text-black"
                                }`}
                            >
                              {userItem.first_name} {userItem.last_name}
                            </div>
                            <div
                              className={`text-sm transition-colors duration-300 ${theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                                }`}
                            >
                              {userItem.status} • {userItem.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"
                          }`}
                      >
                        {userItem.username || "N/A"}
                      </td>
                      <td
                        className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"
                          }`}
                      >
                        {userItem.email}
                      </td>
                      <td
                        className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"
                          }`}
                      >
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-300 ${colorClass} text-white`}
                        >
                          {userItem.role}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"
                          }`}
                      >
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${userItem.privilege_tier === "premium"
                            ? "bg-purple-100 text-purple-800"
                            : userItem.privilege_tier === "standard"
                              ? "bg-blue-100 text-blue-800"
                              : userItem.privilege_tier === "enterprise"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {userItem.privilege_tier || "basic"}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"
                          }`}
                      >
                        {userItem.role.includes("broker")
                          ? userItem.broker_type || "N/A"
                          : "N/A"}
                      </td>
                      <td
                        className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"
                          }`}
                      >
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${userItem.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : userItem.status === "inactive"
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            }`}
                        >
                          {userItem.status}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"
                          }`}
                      >
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${userItem.verified
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {userItem.verified ? "Yes" : "No"}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"
                          }`}
                      >
                        {userItem.message_count || 0}
                      </td>
                      <td
                        className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"
                          }`}
                      >
                        {new Date(
                          userItem.created_at
                        ).toLocaleDateString()}
                      </td>
                      <td
                        className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"
                          }`}
                      >
                        <div className="flex gap-2">
                          {userItem.role !== "super_admin" ||
                            userItem.id === currentUser?.id ? (
                            <>
                              <button
                                onClick={() =>
                                  handleUserAction(
                                    userItem,
                                    userItem.status === "active"
                                      ? "deactivate"
                                      : "activate"
                                  )
                                }
                                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${userItem.status === "active"
                                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                                  : "bg-green-100 text-green-600 hover:bg-green-200"
                                  }`}
                                title={
                                  userItem.status === "active"
                                    ? "Deactivate"
                                    : "Activate"
                                }
                              >
                                {userItem.status === "active" ? (
                                  <UserX size={16} />
                                ) : (
                                  <UserCheck size={16} />
                                )}
                              </button>
                              <button
                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-300 transform hover:scale-110"
                                title="View Info"
                                onClick={() => {
                                  setSelectedUser(userItem);
                                  setShowUserInfoModal(true);
                                }}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-300 transform hover:scale-110"
                                title="Edit"
                                onClick={() =>
                                  handleUserAction(userItem, "edit")
                                }
                              >
                                <Edit size={16} />
                              </button>
                              {userItem.role !== "super_admin" && (
                                <button
                                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-300 transform hover:scale-110"
                                  title="Delete"
                                  onClick={() =>
                                    handleUserAction(userItem, "delete")
                                  }
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">
                              Protected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className={`text-center py-16 rounded-xl border-2 border-dashed transition-all duration-300 ${theme === "dark"
              ? "border-gray-600 text-gray-400 bg-gray-700"
              : "border-gray-300 text-gray-500 bg-gray-50"
              }`}
          >
            <Users className="w-20 h-20 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No users found</p>
            <p className="text-sm opacity-75">
              {searchTerm || filterStatus !== "all" || filterRole !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first user"}
            </p>
            {users?.length > 0 && filteredUsers.length === 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> You have {users.length} user(s) but they're all filtered out.
                  <br />
                  Current user is filtered out: ID {currentUser?.id}
                  <button
                    onClick={() => {
                      console.log("All users:", users);
                      console.log("Current user:", currentUser);
                    }}
                    className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                  >
                    Debug
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        {selectedUser && (
          <UserInfoModal
            isOpen={showUserInfoModal}
            onClose={() => setShowUserInfoModal(false)}
            selectedUser={selectedUser}
            theme={theme}
          />
        )}

        <CreateUserModal
          isOpen={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
          theme={theme}
          newUser={newUser}
          setNewUser={setNewUser}
          passwordStrength={passwordStrength}
          passwordFeedback={passwordFeedback}
          createUser={createUser}
          checkPasswordStrength={checkPasswordStrength}
          isSuperAdmin={true}
          loading={loadingAction}
        />

        {editUser && (
          <EditUserModal
            isOpen={showActionModal && actionType === "edit"}
            onClose={() => setShowActionModal(false)}
            editUser={editUser}
            setEditUser={setEditUser}
            theme={theme}
            updateUser={updateUser}
            isSuperAdmin={true}
            loading={loadingAction}
          />
        )}

        <ConfirmationModal
          isOpen={showActionModal && actionType !== "edit"}
          onClose={() => setShowActionModal(false)}
          title={`Confirm ${actionType}`}
          message={`Are you sure you want to ${actionType} user ${selectedUser?.first_name
            } ${selectedUser?.last_name}?${actionType === "delete" ? " This action cannot be undone." : ""
            }`}
          onConfirm={confirmUserAction}
          confirmText={`Confirm ${actionType}`}
          confirmColor={
            actionType === "delete"
              ? "bg-red-600 hover:opacity-90"
              : "bg-blue-600 hover:opacity-90"
          }
          theme={theme}
          loading={loadingAction}
        />
      </Suspense>
    </div>
  );
};

export default UserManagement;