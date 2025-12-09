import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  Suspense,
  lazy,
} from "react";
import {
  Users,
  Home,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Search,
  DollarSign,
  MessageSquare,
  CreditCard,
  Activity,
  UserPlus,
  Menu,
  X,
  Trash2,
  Bell,
  Globe,
  CheckSquare,
  Crown,
  Key,
  Database,
  Server,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAnalytics } from "../../hooks/useAnalytics";

// Lazy load heavy components - ALL should be ../../components/
const ChatApp = lazy(() => import("../../components/ChatApp"));
const AdvancedSystemSettings = lazy(
  () => import("../../components/AdvancedSystemSettings")
);
const EthiopiaMap = lazy(() => import("../../components/EthiopiaMap"));
const TodoList = lazy(() => import("../../components/TodoList"));
const NotificationsPanel = lazy(() =>
  import("../../components/NotificationsPanel")
);
const ProfilePictureModal = lazy(() =>
  import("../../components/ProfilePictureModal")
);
const ProfileAvatar = lazy(() => import("../../components/ProfileAvatar"));
const StaticProfileAvatar = lazy(() =>
  import("../../components/StaticProfileAvatar")
);
const PasswordStrengthIndicator = lazy(() =>
  import("../../components/PasswordStrengthIndicator")
);
const ThemeToggle = lazy(() => import("../../components/ThemeToggle"));
const Loader = lazy(() => import("../../components/Loader"));
const NotificationBadge = lazy(() =>
  import("../../components/NotificationBadge")
);
const ErrorBoundary = lazy(() => import("../../components/ErrorBoundary"));
const Toast = lazy(() => import("../../components/Toast"));

// Lazy load Chart.js components
const LineChart = lazy(() => import("../../components/charts/LineChart"));
const RadarChart = lazy(() => import("../../components/charts/RadarChart"));
const DonutChart = lazy(() => import("../../components/charts/DonutChart"));
const SuperAdminDashbord = lazy(() => import("../../components/SuperAdminDashbord")); // FIXED LINE
const PropertiesManagement = lazy(() =>
  import("../../components/PropertiesManagement")
);
const TransactionsManagement = lazy(() =>
  import("../../components/TransactionsManagement")
);


// Import services and hooks
import {
  httpClient,
  analyticsClient,
  chatClient,
} from "../../services/http.service";
import { useNotifications } from "../../hooks/useNotifications";
import { useUserManagement } from "../../hooks/useUserManagement";
import socketService from "../../services/socket.service";
import { API_CONFIG } from "../../config/api.config";

// Helper function to calculate days ago
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInMs = now - past;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} min ago`;
    }
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
};

// UserInfoModal Component
const UserInfoModal = ({ isOpen, onClose, selectedUser, theme }) => {
  if (!isOpen || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`p-6 rounded-xl shadow-xl ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border max-w-md w-full max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            User Details
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded ${
              theme === "dark"
                ? "hover:bg-gray-700 text-white"
                : "hover:bg-gray-200 text-gray-900"
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <Suspense
              fallback={
                <div className="w-20 h-20 rounded-full bg-gray-300 animate-pulse"></div>
              }
            >
              <ProfileAvatar
                userProfilePicture={formatProfilePictureUrl(
                  selectedUser.profile_picture
                )}
                firstName={selectedUser.first_name}
                lastName={selectedUser.last_name}
                username={selectedUser.username || ""}
                email={selectedUser.email}
                role={selectedUser.role}
                size="xl"
                className="cursor-default"
              />
            </Suspense>
          </div>
          <ul className="space-y-2">
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Full Name</span>
              <span>
                {selectedUser.first_name} {selectedUser.last_name}
              </span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Username</span>
              <span>{selectedUser.username || "N/A"}</span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Email</span>
              <span>{selectedUser.email}</span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Role</span>
              <span
                className={`px-2 py-1 rounded-full text-xs capitalize ${
                  selectedUser.role === "super_admin"
                    ? "bg-red-100 text-red-800"
                    : selectedUser.role === "admin"
                    ? "bg-purple-100 text-purple-800"
                    : selectedUser.role === "broker"
                    ? "bg-amber-100 text-amber-800"
                    : selectedUser.role === "support_agent"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {selectedUser.role}
              </span>
            </li>
            {selectedUser.role === "broker" && (
              <li
                className={`flex justify-between ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <span className="font-medium">Broker Type</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs capitalize ${
                    selectedUser.broker_type === "internal"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {selectedUser.broker_type}
                </span>
              </li>
            )}
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Status</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedUser.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedUser.status}
              </span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Phone</span>
              <span>{selectedUser.phone || "N/A"}</span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Joined</span>
              <span>
                {new Date(selectedUser.created_at).toLocaleDateString()}
              </span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Verified</span>
              <span>{selectedUser.verified ? "Yes" : "No"}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// CreateUserModal Component
const CreateUserModal = ({
  isOpen,
  onClose,
  theme,
  newUser,
  setNewUser,
  passwordStrength,
  passwordFeedback,
  createUser,
  checkPasswordStrength,
  isSuperAdmin = false,
}) => {
  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      checkPasswordStrength(value);
    }
    if (name === "role" && !value.includes("broker")) {
      setNewUser((prev) => ({ ...prev, broker_type: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser();
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const availableRoles = isSuperAdmin
    ? [
        "super_admin",
        "admin",
        "support_admin",
        "support_lead",
        "support_agent",
        "internal_broker",
        "external_broker",
        "buyer",
        "seller",
        "landlord",
        "renter",
        "user",
      ]
    : [
        "admin",
        "support_agent",
        "internal_broker",
        "external_broker",
        "buyer",
        "seller",
        "landlord",
        "renter",
        "user",
      ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`p-6 rounded-xl shadow-xl border max-w-md w-full max-h-[90vh] overflow-y-auto ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Create New User
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="first_name"
            placeholder="First Name"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            value={newUser.first_name}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="last_name"
            placeholder="Last Name"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            value={newUser.last_name}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            value={newUser.username}
            onChange={handleInputChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            value={newUser.email}
            onChange={handleInputChange}
            required
          />
          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password (min 8 characters)"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              value={newUser.password}
              onChange={handleInputChange}
              required
              minLength="8"
            />
            {newUser.password && (
              <Suspense
                fallback={
                  <div className="mt-2 h-4 bg-gray-200 rounded animate-pulse"></div>
                }
              >
                <PasswordStrengthIndicator
                  strength={passwordStrength}
                  feedback={passwordFeedback}
                  theme={theme}
                />
              </Suspense>
            )}
          </div>
          <input
            type="text"
            name="phone"
            placeholder="Phone (optional)"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            value={newUser.phone}
            onChange={handleInputChange}
          />

          <select
            name="privilege_tier"
            value={newUser.privilege_tier}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            name="role"
            value={newUser.role}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            required
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>

          {newUser.role.includes("broker") && (
            <select
              name="broker_type"
              value={newUser.broker_type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              required={newUser.role.includes("broker")}
            >
              <option value="internal">Internal Broker</option>
              <option value="external">External Broker</option>
            </select>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                newUser.password.length < 8 ||
                passwordStrength < 50 ||
                (newUser.role.includes("broker") && !newUser.broker_type)
              }
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// EditUserModal Component
const EditUserModal = ({
  isOpen,
  onClose,
  editUser,
  setEditUser,
  theme,
  updateUser,
  isSuperAdmin = false,
}) => {
  if (!isOpen || !editUser) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({ ...prev, [name]: value }));
    if (name === "role" && !value.includes("broker")) {
      setEditUser((prev) => ({ ...prev, broker_type: "" }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateUser(editUser);
      onClose();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const availableRoles = isSuperAdmin
    ? [
        "super_admin",
        "admin",
        "support_admin",
        "support_lead",
        "support_agent",
        "internal_broker",
        "external_broker",
        "buyer",
        "seller",
        "landlord",
        "renter",
        "user",
      ]
    : [
        "admin",
        "support_agent",
        "internal_broker",
        "external_broker",
        "buyer",
        "seller",
        "landlord",
        "renter",
        "user",
      ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`p-6 rounded-xl shadow-xl ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border max-w-md w-full`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Edit User
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <select
            name="privilege_tier"
            value={editUser.privilege_tier || ""}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            required
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            name="role"
            value={editUser.role || ""}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            required
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>

          {editUser.role && editUser.role.includes("broker") && (
            <select
              name="broker_type"
              value={editUser.broker_type || ""}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              required
            >
              <option value="internal">Internal Broker</option>
              <option value="external">External Broker</option>
            </select>
          )}

          <select
            name="status"
            value={editUser.status || ""}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                theme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Confirm Edit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ConfirmationModal Component
const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = "Confirm",
  confirmColor = "bg-blue-600",
  theme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`p-6 rounded-xl shadow-xl ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border max-w-md w-full transition-all duration-300`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        <p
          className={`mb-4 ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              theme === "dark"
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            } transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 ${confirmColor} text-white rounded-lg hover:opacity-90 transition-opacity`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to format profile picture URL
const formatProfilePictureUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_CONFIG.BASE_URL}${url}`;
  return `${API_CONFIG.BASE_URL}/${url}`;
};

const SuperAdminDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState("");
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
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
  const [editUser, setEditUser] = useState(null);
  const [todoItems, setTodoItems] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [newTodoAssignee, setNewTodoAssignee] = useState("Support Team");
  const [newTodoDueDate, setNewTodoDueDate] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const {
    analyticsData,
    isLoading: analyticsLoading,
    fetchAnalyticsData: fetchAnalyticsDataHook,
  } = useAnalytics();

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "error",
  });
  const calendarRef = useRef(null);
  const navigate = useNavigate();

  // Use custom hooks
  const {
    notificationCount,
    setNotificationCount,
  } = useNotifications(user?.id);

  const {
    users,
    isLoading: usersLoading,
    fetchUsers,
    createUser: createUserHook,
    updateUser: updateUserHook,
    deleteUser: deleteUserHook,
  } = useUserManagement();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "am", name: "Amharic", flag: "🇪🇹" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
  ];

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

  // Fetch system health data
  const fetchSystemHealth = async () => {
    try {
      const mockData = {
        apiService: { status: "healthy", responseTime: "120ms" },
        database: { status: "healthy", connections: 15 },
        websocket: { status: "healthy", connections: 42 },
        security: { status: "healthy", threatLevel: "low" },
      };
      setSystemHealth(mockData);
      return mockData;
    } catch (error) {
      console.error("Error fetching system health:", error);
      const mockData = {
        apiService: { status: "unknown", responseTime: "N/A" },
        database: { status: "unknown", connections: "N/A" },
        websocket: { status: "unknown", connections: "N/A" },
        security: { status: "unknown", threatLevel: "N/A" },
      };
      setSystemHealth(mockData);
      return mockData;
    }
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      const data = await fetchAnalyticsDataHook();
      return data;
    } catch (error) {
      console.error("Error in fetchAnalyticsData:", error);
      setToast({
        show: true,
        message: "Failed to load analytics data",
        type: "error",
      });
    }
    return null;
  };

  // Log activity
  const logActivity = async (type, adminUsername, target) => {
    try {
      await httpClient.post(API_CONFIG.ENDPOINTS.ACTIVITY_LOG, {
        type,
        admin: adminUsername,
        target,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  // Authentication check with centralized HTTP client
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login-register");
          return;
        }

        // Check token payload first
        let payload;
        try {
          payload = JSON.parse(atob(token.split(".")[1]));
        } catch (decodeError) {
          console.error("Error decoding token:", decodeError);
          localStorage.removeItem("token");
          if (isMounted) navigate("/login-register");
          return;
        }

        if (payload.role !== "super_admin") {
          localStorage.removeItem("token");
          if (isMounted) navigate("/unauthorized");
          return;
        }

        // Get user data using centralized HTTP client
        const response = await httpClient.get(API_CONFIG.ENDPOINTS.CHECK_AUTH, {
          signal: abortController.signal,
        });

        if (!isMounted) return;

        if (response.data.role !== "super_admin") {
          localStorage.removeItem("token");
          navigate("/unauthorized");
          return;
        }

        setUser(response.data);
        setIsAuthorized(true);

        // Fetch initial data
        await Promise.all([
          fetchUsers(),
          fetchAnalyticsData(),
          fetchSystemHealth(),
        ]);
      } catch (error) {
        if (!isMounted || error.name === "AbortError") return;

        console.error("Error fetching user data:", error);

        // Only show error toast, don't navigate immediately
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login-register");
        } else {
          setToast({
            show: true,
            message: "Failed to load dashboard data. Please refresh.",
            type: "error",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Fetch todos
  const fetchTodos = async () => {
    try {
      const response = await chatClient.get(API_CONFIG.ENDPOINTS.TODOS);
      setTodoItems(response.data || []);
    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  };

  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    // Connect socket
    socketService.connect(user.id);

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
        console.log("New user registered via WebSocket:", newUserData);
        
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
        
        // Always add to recent activities
        setRecentActivities((prev) => {
          const updated = [newActivity, ...prev.slice(0, 9)];
          console.log("Updated recent activities:", updated);
          return updated;
        });
        
        logActivity(
          "user_registered",
          "system",
          `User: ${newUserData.first_name} ${newUserData.last_name}`
        );
      }
    );

    // Also listen for user updates
    const unsubscribeUserUpdate = socketService.addListener(
      "user_updated",
      (updatedUser) => {
        const newActivity = {
          id: `user-update-${Date.now()}`,
          type: "user",
          action: "User Profile Updated",
          detail: `${updatedUser.first_name} ${updatedUser.last_name}'s profile was updated`,
          time: new Date().toLocaleString(),
          icon: "Edit",
          timestamp: new Date(),
        };
        setRecentActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
      }
    );

    return () => {
      unsubscribeTodo();
      unsubscribeUser();
      unsubscribeUserUpdate();
      socketService.disconnect();
    };
  }, [user]);

  // Calculate users from last 7 days
  const usersLast7Days = users.filter((userItem) => {
    const userDate = new Date(userItem.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return userDate > sevenDaysAgo;
  }).length;

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

  // Filter users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => u.id !== user?.id)
      .filter(
        (userItem) =>
          `${userItem.first_name || ""} ${userItem.last_name || ""}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (userItem.username &&
            userItem.username
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (userItem.email &&
            userItem.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .filter(
        (userItem) => filterStatus === "all" || userItem.status === filterStatus
      );
  }, [users, searchTerm, filterStatus, user]);

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
        message: `Password is too weak. Please include ${passwordFeedback.join(
          ", "
        )}`,
        type: "error",
      });
      return;
    }

    const result = await createUserHook(newUser);

    if (result.warning) {
      const isConfirmed = window.confirm(
        result.message + "\n\nClick OK to proceed or Cancel to go back."
      );

      if (isConfirmed) {
        await confirmUserCreation(newUser);
      } else {
        setToast({
          show: true,
          message: "User creation canceled",
          type: "info",
        });
      }
    } else if (result.success) {
      setShowCreateUserModal(false);
      resetNewUserForm();
      setToast({
        show: true,
        message: "User created successfully!",
        type: "success",
      });
      logActivity(
        "user_created",
        user?.username,
        `User: ${newUser.first_name} ${newUser.last_name}`
      );
    } else {
      setToast({
        show: true,
        message: result.message || "Failed to create user",
        type: "error",
      });
    }
  };

  const confirmUserCreation = async (payload) => {
    try {
      const token = localStorage.getItem("token");
      const response = await httpClient.post(
        API_CONFIG.ENDPOINTS.CREATE_USER,
        payload,
        {
          headers: {
            "X-Confirm": "true",
          },
        }
      );

      if (response.data.success) {
        await fetchUsers();
        setShowCreateUserModal(false);
        resetNewUserForm();
        setToast({
          show: true,
          message: "User created successfully!",
          type: "success",
        });
      } else {
        setToast({
          show: true,
          message: response.data.message || "Failed to create user",
          type: "error",
        });
      }
    } catch (error) {
      setToast({
        show: true,
        message: "Error creating user",
        type: "error",
      });
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

  // Update user function
  const updateUser = async (userToUpdate) => {
    const result = await updateUserHook(userToUpdate.id, {
      role: userToUpdate.role,
      privilege_tier: userToUpdate.privilege_tier,
      broker_type: userToUpdate.broker_type,
      status: userToUpdate.status,
    });

    if (result.success) {
      setShowActionModal(false);
      setEditUser(null);
      setToast({
        show: true,
        message: "User updated successfully!",
        type: "success",
      });
      logActivity(
        "user_updated",
        user?.username,
        `User: ${userToUpdate.first_name} ${userToUpdate.last_name}`
      );
    } else {
      setToast({
        show: true,
        message: result.message || "Failed to update user",
        type: "error",
      });
    }
  };

  // Handle user actions
  const handleUserAction = (userAction, action) => {
    if (userAction.role === "super_admin" && userAction.id !== user?.id) {
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
      setEditUser({ ...userAction });
    }
    setShowActionModal(true);
  };

  // Confirm user action
  const confirmUserAction = async () => {
    const result = await deleteUserHook(selectedUser.id);

    if (result.success) {
      setShowActionModal(false);
      setToast({
        show: true,
        message: `${
          actionType.charAt(0).toUpperCase() + actionType.slice(1)
        } successful!`,
        type: "success",
      });
      logActivity(
        `user_${actionType}`,
        user?.username,
        `User: ${selectedUser.first_name} ${selectedUser.last_name}`
      );
    } else {
      setToast({
        show: true,
        message: result.message || "Action failed",
        type: "error",
      });
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await httpClient.post(
        API_CONFIG.ENDPOINTS.LOGOUT,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login-register";
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await httpClient.post(
        API_CONFIG.ENDPOINTS.UPLOAD_PROFILE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data) {
        setUser((prevUser) => ({
          ...prevUser,
          profile_picture: response.data.profilePictureUrl,
        }));
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
        message: "Failed to upload profile picture",
        type: "error",
      });
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    try {
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.CHECK_AUTH);
      if (response.data) {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        return response.data;
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Handle language change
  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode);
    setShowLanguagePicker(false);
    setToast({
      show: true,
      message: `Language changed to ${
        languages.find((l) => l.code === languageCode)?.name
      }`,
      type: "success",
    });
  };

  // Render content
  const renderContent = () => {
    if (isLoading) {
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <Loader />
        </Suspense>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <Suspense
            fallback={
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            }
          >
            <SuperAdminDashbord
              theme={theme}
              user={user}
              users={users}
              analyticsData={analyticsData}
              systemHealth={systemHealth}
              todoItems={todoItems}
              setTodoItems={setTodoItems}
              newTodo={newTodo}
              setNewTodo={setNewTodo}
              newTodoAssignee={newTodoAssignee}
              setNewTodoAssignee={setNewTodoAssignee}
              newTodoDueDate={newTodoDueDate}
              setNewTodoDueDate={setNewTodoDueDate}
              showCalendar={showCalendar}
              setShowCalendar={setShowCalendar}
              calendarRef={calendarRef}
              isChatMaximized={isChatMaximized}
              setIsChatMaximized={setIsChatMaximized}
              showUserInfoModal={showUserInfoModal}
              setShowUserInfoModal={setShowUserInfoModal}
              setSelectedUser={setSelectedUser}
              recentActivities={recentActivities}
              usersLast7Days={usersLast7Days}
            />
          </Suspense>
        );

      case "users":
        return (
          <ErrorBoundary>
            <div
              className={`p-4 lg:p-6 rounded-xl border transition-all duration-300 max-w-full lg:max-w-7xl mx-auto ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700 shadow-lg"
                  : "bg-white border-gray-200 shadow-md"
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <h2
                  className={`text-2xl lg:text-3xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  User Management (Super Admin)
                </h2>
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
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-amber-400 to-orange-500 group-hover:from-amber-300 group-hover:to-orange-400"
                          : "bg-gradient-to-r from-amber-400 to-amber-500 group-hover:from-amber-300 group-hover:to-amber-400"
                      }`}
                    >
                      <UserPlus className="w-4 h-4 text-white" />
                    </div>
                    <span
                      className={`font-semibold ${
                        theme === "dark"
                          ? "text-amber-200 group-hover:text-amber-100"
                          : "text-amber-700 group-hover:text-amber-600"
                      }`}
                    >
                      Create User
                    </span>
                  </button>
                  <div className="relative flex-1 lg:flex-none min-w-[250px]">
                    <Search
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      } w-5 h-5`}
                    />
                    <input
                      type="text"
                      placeholder="Search users..."
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${
                        theme === "dark"
                          ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                          : "bg-white text-black border-gray-300 placeholder-gray-500"
                      }`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${
                      theme === "dark"
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
                </div>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                </div>
              ) : users.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="min-w-[900px] w-full table-auto">
                    <thead>
                      <tr
                        className={`${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-50"
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
                            className={`px-6 py-4 text-left font-semibold transition-colors duration-300 ${
                              theme === "dark" ? "text-white" : "text-gray-600"
                            }`}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((userItem) => {
                        const initials = `${userItem.first_name?.[0] || ""}${
                          userItem.last_name?.[0] || ""
                        }`.toUpperCase();
                        const colorClass =
                          roleColors[userItem.role] || "bg-gray-500";

                        return (
                          <tr
                            key={userItem.id}
                            className={`border-b transition-all duration-300 hover:transform hover:scale-[1.01] ${
                              theme === "dark"
                                ? "border-gray-700 hover:bg-gray-750"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <td
                              className={`px-6 py-4 ${
                                theme === "dark" ? "text-white" : "text-black"
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
                                        const sibling =
                                          e.target.nextElementSibling;
                                        if (sibling) {
                                          sibling.style.display = "flex";
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md ${colorClass} ${
                                      userItem.profile_picture
                                        ? "hidden"
                                        : "flex"
                                    }`}
                                  >
                                    {initials}
                                  </div>
                                  <span
                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 transition-all duration-300 ${
                                      theme === "dark"
                                        ? "ring-gray-800"
                                        : "ring-white"
                                    } ${
                                      userItem.status === "active"
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                    }`}
                                  />
                                </div>
                                <div>
                                  <div
                                    className={`font-medium transition-colors duration-300 ${
                                      theme === "dark"
                                        ? "text-white"
                                        : "text-black"
                                    }`}
                                  >
                                    {userItem.first_name} {userItem.last_name}
                                  </div>
                                  <div
                                    className={`text-sm transition-colors duration-300 ${
                                      theme === "dark"
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
                              className={`px-6 py-4 ${
                                theme === "dark" ? "text-white" : "text-black"
                              }`}
                            >
                              {userItem.username || "N/A"}
                            </td>
                            <td
                              className={`px-6 py-4 ${
                                theme === "dark" ? "text-white" : "text-black"
                              }`}
                            >
                              {userItem.email}
                            </td>
                            <td
                              className={`px-6 py-4 ${
                                theme === "dark" ? "text-white" : "text-black"
                              }`}
                            >
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-300 ${colorClass} text-white`}
                              >
                                {userItem.role}
                              </span>
                            </td>
                            <td
                              className={`px-6 py-4 ${
                                theme === "dark" ? "text-white" : "text-black"
                              }`}
                            >
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                  userItem.privilege_tier === "premium"
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
                              className={`px-6 py-4 ${
                                theme === "dark" ? "text-white" : "text-black"
                              }`}
                            >
                              {userItem.role.includes("broker")
                                ? userItem.broker_type || "N/A"
                                : "N/A"}
                            </td>
                            <td
                              className={`px-6 py-4 ${
                                theme === "dark" ? "text-white" : "text-black"
                              }`}
                            >
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                                  userItem.status === "active"
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
                              className={`px-6 py-4 ${
                                theme === "dark" ? "text-white" : "text-black"
                              }`}
                            >
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  userItem.verified
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {userItem.verified ? "Yes" : "No"}
                              </span>
                            </td>
                            <td
                              className={`px-6 py-4 ${
                                theme === "dark" ? "text-white" : "text-black"
                              }`}
                            >
                              {userItem.message_count || 0}
                            </td>
                            <td
                              className={`px-6 py-4 ${
                                theme === "dark" ? "text-white" : "text-black"
                              }`}
                            >
                              {new Date(
                                userItem.created_at
                              ).toLocaleDateString()}
                            </td>
                            <td
                              className={`px-6 py-4 ${
                                theme === "dark" ? "text-white" : "text-black"
                              }`}
                            >
                              <div className="flex gap-2">
                                {userItem.role !== "super_admin" ||
                                userItem.id === user?.id ? (
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
                                      className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                                        userItem.status === "active"
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
                  className={`text-center py-16 rounded-xl border-2 border-dashed transition-all duration-300 ${
                    theme === "dark"
                      ? "border-gray-600 text-gray-400 bg-gray-700"
                      : "border-gray-300 text-gray-500 bg-gray-50"
                  }`}
                >
                  <Users className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No users found</p>
                  <p className="text-sm opacity-75">
                    {searchTerm || filterStatus !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Get started by creating your first user"}
                  </p>
                </div>
              )}
            </div>
          </ErrorBoundary>
        );

      case "system":
        return (
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              }
            >
              <AdvancedSystemSettings theme={theme} />
            </Suspense>
          </ErrorBoundary>
        );

      case "chat":
        return (
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              }
            >
              <ChatApp
                theme={theme}
                user={user}
                isChatMaximized={isChatMaximized}
                setIsChatMaximized={setIsChatMaximized}
                showUserInfoModal={showUserInfoModal}
                setShowUserInfoModal={setShowUserInfoModal}
                setSelectedUser={setSelectedUser}
              />
            </Suspense>
          </ErrorBoundary>
        );

      case "properties":
        return (
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              }
            >
              <PropertiesManagement theme={theme} />
            </Suspense>
          </ErrorBoundary>
        );

      case "transactions":
        return (
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              }
            >
              <TransactionsManagement theme={theme} />
            </Suspense>
          </ErrorBoundary>
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
              className={`text-2xl font-bold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{" "}
              Management
            </h2>
            <p
              className={`${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              This feature is currently in development.
            </p>
          </div>
        );
    }
  };

  if (!user || !isAuthorized) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Loader />
      </Suspense>
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
                  userProfilePicture={formatProfilePictureUrl(
                    user?.profile_picture
                  )}
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
                <Crown className="w-4 h-4" />
                Super Admin
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={`p-4 flex-1 ${theme === "dark" ? "bg-gray-900/20" : ""}`}
          >
            <div className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                { id: "users", label: "User Management", icon: Users },
                { id: "system", label: "System Config", icon: Settings },
                { id: "chat", label: "Chat", icon: MessageSquare },
                { id: "properties", label: "Properties", icon: Home },
                { id: "transactions", label: "Transactions", icon: CreditCard },
                { id: "support", label: "Support", icon: MessageSquare },
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
                      className={`p-2 rounded-lg transition-colors backdrop-blur-sm ${
                        theme === "dark"
                          ? "hover:bg-gray-700/50 text-gray-300"
                          : "hover:bg-white/30 text-gray-600"
                      }`}
                    >
                      <Globe className="w-5 h-5" />
                    </button>
                    {showLanguagePicker && (
                      <div
                        className={`absolute right-0 top-12 w-48 rounded-lg shadow-lg z-50 backdrop-blur-md ${
                          theme === "dark"
                            ? "bg-gray-800/90 border border-gray-700"
                            : "bg-white/90 border border-gray-200"
                        }`}
                      >
                        {languages.map((language) => (
                          <button
                            key={language.code}
                            onClick={() => handleLanguageChange(language.code)}
                            className={`w-full text-left px-4 py-2 flex items-center gap-3 ${
                              currentLanguage === language.code
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

                  {/* Profile Avatar */}
                  <div className="relative">
                    <Suspense
                      fallback={
                        <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>
                      }
                    >
                      <ProfileAvatar
                        key={user?.profile_picture || "no-pic"}
                        userProfilePicture={formatProfilePictureUrl(
                          user?.profile_picture
                        )}
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

        {/* Theme Toggle */}
        <Suspense fallback={null}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </Suspense>

        {/* Modals */}
        <UserInfoModal
          isOpen={showUserInfoModal}
          onClose={() => setShowUserInfoModal(false)}
          selectedUser={selectedUser}
          theme={theme}
        />
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
        />
        <EditUserModal
          isOpen={showActionModal && actionType === "edit"}
          onClose={() => setShowActionModal(false)}
          editUser={editUser}
          setEditUser={setEditUser}
          theme={theme}
          updateUser={updateUser}
          isSuperAdmin={true}
        />
        <ConfirmationModal
          isOpen={showActionModal && actionType !== "edit"}
          onClose={() => setShowActionModal(false)}
          title={`Confirm ${actionType}`}
          message={`Are you sure you want to ${actionType} user ${
            selectedUser?.first_name
          } ${selectedUser?.last_name}?${
            actionType === "delete" ? " This action cannot be undone." : ""
          }`}
          onConfirm={confirmUserAction}
          confirmText={`Confirm ${actionType}`}
          confirmColor={
            actionType === "delete"
              ? "bg-red-600 hover:opacity-90"
              : "bg-blue-600 hover:opacity-90"
          }
          theme={theme}
        />

        {/* Profile Picture Modal */}
        {user && (
          <Suspense fallback={null}>
            <ProfilePictureModal
              isOpen={showProfileModal}
              onClose={() => {
                setShowProfileModal(false);
                refreshUserData();
              }}
              onUploadComplete={(newProfilePictureUrl) => {
                setUser((prev) => ({
                  ...prev,
                  profile_picture: newProfilePictureUrl,
                }));
                setShowProfileModal(false);
              }}
              userProfilePicture={user?.profile_picture}
              firstName={user?.first_name}
              lastName={user?.last_name}
              role={user?.role}
              theme={theme}
              user={user}
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
            onClose={() => setToast({ ...toast, show: false })}
            theme={theme}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default SuperAdminDashboard;