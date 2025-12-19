import React, { useState, useEffect, useRef, useMemo } from "react";
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
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import StaticProfileAvatar from "../components/StaticProfileAvatar";
import ProfileAvatar from "../components/ProfileAvatar";
import ProfilePictureModal from "../components/ProfilePictureModal";
import TodoList from "../components/TodoList";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ChatApp from "../components/ChatApp";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";
import EthiopiaMap from "../components/EthiopiaMap";
import { io } from "socket.io-client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler,
} from "chart.js";
import { Line, Radar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
);

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
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

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
            <ProfileAvatar
              userProfilePicture={selectedUser.profile_picture}
              firstName={selectedUser.first_name}
              lastName={selectedUser.last_name}
              username={selectedUser.username || ""}
              email={selectedUser.email}
              role={selectedUser.role}
              size="xl"
              className="cursor-default"
            />
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
                  selectedUser.role === "admin"
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
}) => {
  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      checkPasswordStrength(value);
    }
    if (name === "role" && value !== "broker") {
      setNewUser((prev) => ({ ...prev, broker_type: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createUser();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`p-6 rounded-xl shadow-xl border max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-transparent scrollbar-thumb-amber-500/70 dark:scrollbar-thumb-amber-400/60 ${
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
              <PasswordStrengthIndicator
                strength={passwordStrength}
                feedback={passwordFeedback}
                theme={theme}
              />
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
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="broker">Broker</option>
            <option value="user">User</option>
            <option value="renter">Renter</option>
            <option value="admin">Admin</option>
            <option value="support_agent">Support Agent</option>
          </select>
          {newUser.role === "broker" && (
            <select
              name="broker_type"
              value={newUser.broker_type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              required
            >
              <option value="external">External</option>
              <option value="internal">Internal</option>
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
                (newUser.role === "broker" && !newUser.broker_type)
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

const EditUserModal = ({
  isOpen,
  onClose,
  editUser,
  setEditUser,
  theme,
  updateUser,
}) => {
  if (!isOpen || !editUser) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({ ...prev, [name]: value }));
    if (name === "role" && value !== "broker") {
      setEditUser((prev) => ({ ...prev, broker_type: "" }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateUser(editUser);
    onClose();
  };

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
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="broker">Broker</option>
            <option value="user">User</option>
            <option value="renter">Renter</option>
            <option value="admin">Admin</option>
            <option value="support_agent">Support Agent</option>
          </select>
          {editUser.role === "broker" && (
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
              <option value="external">External</option>
              <option value="internal">Internal</option>
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

const ComingSoonSection = ({ title, description, theme }) => (
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
      {title}
    </h2>
    <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
      {description}
    </p>
  </div>
);

const ChatPage = ({
  theme,
  users,
  showUserInfoModal,
  setShowUserInfoModal,
  setSelectedUser,
  isChatMaximized,
  setIsChatMaximized,
  user,
}) => (
  <div className="space-y-6">
    <div
      className={`p-6 rounded-xl ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      } border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
    >
      <h1
        className={`text-2xl font-bold ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        Chatting Interface
      </h1>
      <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
        Responsive and interactive chat with user profiles. Click avatars to
        view info.
      </p>
    </div>
    <ChatApp
      theme={theme}
      user={user}
      isChatMaximized={isChatMaximized}
      setIsChatMaximized={setIsChatMaximized}
      showUserInfoModal={showUserInfoModal}
      setShowUserInfoModal={setShowUserInfoModal}
      setSelectedUser={setSelectedUser}
    />
    <div
      className={`p-6 rounded-xl border ${
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
        Active Users/Chats
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {users
          .filter((u) => u.id !== user.id)
          .slice(0, 5)
          .map((u) => (
            <div
              key={u.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer hover:${
                theme === "dark" ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <ProfileAvatar
                userProfilePicture={u.profile_picture}
                firstName={u.first_name}
                lastName={u.last_name}
                username={u.username || ""}
                email={u.email}
                role={u.role}
                size="sm"
                className="mr-3 cursor-pointer"
                onClick={() => {
                  setSelectedUser(u);
                  setShowUserInfoModal(true);
                }}
              />
              <div>
                <p
                  className={`${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {u.first_name} {u.last_name}
                </p>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {u.role} • {u.status}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>
);

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

const StatCard = ({
  icon: Icon,
  title,
  value,
  trend,
  color,
  subtitle,
  theme,
}) => (
  <div
    className={`p-6 rounded-xl border ${
      theme === "dark"
        ? "bg-gray-800 border-gray-700"
        : "bg-white border-gray-200"
    } transition-all duration-300 hover:shadow-lg`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
      </div>
      <span
        className={`text-sm font-medium ${
          trend.includes("+") ? "text-green-500" : "text-red-500"
        }`}
      >
        {trend}
      </span>
    </div>
    <h3
      className={`text-2xl font-bold mb-1 ${
        theme === "dark" ? "text-white" : "text-gray-900"
      }`}
    >
      {value}
    </h3>
    <p
      className={`text-sm ${
        theme === "dark" ? "text-gray-400" : "text-gray-600"
      }`}
    >
      {title}
    </p>
    <p
      className={`text-xs mt-2 ${
        theme === "dark" ? "text-gray-500" : "text-gray-400"
      }`}
    >
      {subtitle}
    </p>
  </div>
);

const AdminDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState(null);
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
    role: "buyer",
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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const calendarRef = useRef(null);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "am", name: "Amharic", flag: "🇪🇹" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
  ];

  const notifications = [
    {
      id: 1,
      message: "New message from John Doe",
      time: "2 min ago",
      read: false,
    },
    {
      id: 2,
      message: "Your listing was approved",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      message: "Payment received for property #123",
      time: "3 hours ago",
      read: true,
    },
    {
      id: 4,
      message: "Meeting reminder: Client meeting at 2 PM",
      time: "5 hours ago",
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode);
    setShowLanguagePicker(false);
    console.log("Language changed to:", languageCode);
  };

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

  // Fetch real-time analytics data from analysis-service
  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5004/api/analytics/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
        return data;
      } else {
        console.error("Failed to fetch analytics data:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
    return null;
  };

  // Real-time WebSocket setup with 7-day filter
  useEffect(() => {
    const socket = io("http://localhost:5001");

    socket.on("todo_created", (todo) => {
      const newActivity = {
        id: `todo-${Date.now()}`,
        type: "todo",
        action: "New Todo Created",
        detail: `"${todo.text}" assigned to ${todo.assignee}`,
        time: new Date().toLocaleString(),
        icon: "CheckSquare",
        timestamp: new Date()
      };

      setRecentActivities(prev => [newActivity, ...prev.slice(0, 9)]);
      logActivity("todo_created", user?.username, `Todo: ${todo.text}`);
    });

    socket.on("todo_updated", (todo) => {
      const newActivity = {
        id: `todo-${Date.now()}`,
        type: "todo",
        action: "Todo Updated",
        detail: `"${todo.text}" status changed`,
        time: new Date().toLocaleString(),
        icon: "Edit",
        timestamp: new Date()
      };

      setRecentActivities(prev => [newActivity, ...prev.slice(0, 9)]);
      logActivity("todo_updated", user?.username, `Todo: ${todo.text}`);
    });

    socket.on("todo_deleted", (todo) => {
      const newActivity = {
        id: `todo-${Date.now()}`,
        type: "todo",
        action: "Todo Deleted",
        detail: `"${todo.text}" was removed`,
        time: new Date().toLocaleString(),
        icon: "Trash2",
        timestamp: new Date()
      };

      setRecentActivities(prev => [newActivity, ...prev.slice(0, 9)]);
      logActivity("todo_deleted", user?.username, `Todo: ${todo.text}`);
    });

    // Real-time user registration updates with 7-day filter
    socket.on('user_registered', (newUser) => {
      const userJoinDate = new Date(newUser.created_at || new Date());
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Only show users who joined in the last 7 days
      if (userJoinDate > sevenDaysAgo) {
        const newActivity = {
          id: `user-${Date.now()}`,
          type: "user",
          action: "New User Registered",
          detail: `${newUser.first_name} ${newUser.last_name} joined as ${newUser.role}`,
          time: userJoinDate.toLocaleString(),
          icon: 'Users',
          timestamp: userJoinDate
        };
        
        // Update both users list and recent activities
        setUsers(prev => [...prev, newUser]);
        setRecentActivities(prev => [newActivity, ...prev.slice(0, 9)]); // Keep only 10 latest
        
        logActivity('user_registered', 'system', `User: ${newUser.first_name} ${newUser.last_name}`);
      }
    });

    return () => socket.disconnect();
  }, [user]);

  const logActivity = async (type, adminUsername, target) => {
    try {
      await fetch("http://localhost:5004/api/analytics/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          admin: adminUsername,
          target,
        }),
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme === "dark" ? "#fff" : "#374151",
          font: { size: 12 },
        },
      },
      title: {
        display: true,
        text: "Monthly Performance",
        color: theme === "dark" ? "#fff" : "#374151",
        font: { size: 16, weight: "bold" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: theme === "dark" ? "#fff" : "#374151",
        },
        title: {
          display: true,
          text: "Users",
          color: theme === "dark" ? "#fff" : "#374151",
        },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: {
          color: theme === "dark" ? "#fff" : "#374151",
          callback: (value) => `${value}k ETB`,
        },
        title: {
          display: true,
          text: "Revenue (ETB)",
          color: theme === "dark" ? "#fff" : "#374151",
        },
      },
      x: {
        grid: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: theme === "dark" ? "#fff" : "#374151",
        },
      },
    },
    animation: {
      duration: 2000,
      easing: "easeOutQuart",
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme === "dark" ? "#fff" : "#374151",
          font: { size: 12 },
        },
      },
      title: {
        display: true,
        text: "User Role Distribution",
        color: theme === "dark" ? "#fff" : "#374151",
        font: { size: 16, weight: "bold" },
      },
    },
    scales: {
      r: {
        angleLines: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        grid: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        pointLabels: {
          color: theme === "dark" ? "#fff" : "#374151",
          font: { size: 12 },
        },
        ticks: {
          backdropColor: "transparent",
          color: theme === "dark" ? "#fff" : "#374151",
        },
      },
    },
    animation: {
      duration: 2000,
      easing: "easeOutQuart",
    },
  };

  const getChartData = () => {
    if (!analyticsData) {
      return {
        lineChartData: {
          labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
          datasets: [
            {
              label: "Users",
              data: [0, 0, 0, 0, 0, 0, 0],
              borderColor: "rgb(59, 130, 246)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "rgb(59, 130, 246)",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "rgb(59, 130, 246)",
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: "Revenue (ETB)",
              data: [0, 0, 0, 0, 0, 0, 0],
              borderColor: "rgb(16, 185, 129)",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "rgb(16, 185, 129)",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "rgb(16, 185, 129)",
              pointRadius: 4,
              pointHoverRadius: 6,
              yAxisID: "y1",
            }
          ]
        },
        radarChartData: {
          labels: ["Buyers", "Sellers", "Renters", "Brokers", "Admins", "Support Agents"],
          datasets: [{
            label: "User Distribution",
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: "rgba(245, 158, 11, 0.2)",
            borderColor: "rgb(245, 158, 11)",
            pointBackgroundColor: "rgb(245, 158, 11)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgb(245, 158, 11)",
            pointRadius: 4,
            pointHoverRadius: 6,
          }]
        }
      };
    }

    return {
      lineChartData: {
        labels: analyticsData.revenueData?.map(item => item.month) || ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        datasets: [
          {
            label: "Users",
            data: analyticsData.revenueData?.map(item => item.userCount) || [0, 0, 0, 0, 0, 0, 0],
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "rgb(59, 130, 246)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgb(59, 130, 246)",
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Revenue (ETB)",
            data: analyticsData.revenueData?.map(item => item.revenue / 1000) || [0, 0, 0, 0, 0, 0, 0],
            borderColor: "rgb(16, 185, 129)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "rgb(16, 185, 129)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgb(16, 185, 129)",
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: "y1",
          }
        ]
      },
      radarChartData: {
        labels: analyticsData.userDistribution?.map(item => item.role) || ["Buyers", "Sellers", "Renters", "Brokers", "Admins", "Support Agents"],
        datasets: [{
          label: "User Distribution",
          data: analyticsData.userDistribution?.map(item => item.count) || [0, 0, 0, 0, 0, 0],
          backgroundColor: "rgba(245, 158, 11, 0.2)",
          borderColor: "rgb(245, 158, 11)",
          pointBackgroundColor: "rgb(245, 158, 11)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(245, 158, 11)",
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      }
    };
  };

  const { lineChartData, radarChartData } = getChartData();

  useEffect(() => {
    const abortController = new AbortController();
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const response = await fetch("http://localhost:5000/api/auth/check", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.role !== "admin") {
            localStorage.removeItem("token");
            navigate("/forbidden");
            return;
          }
          setUser(userData);
          setIsAuthorized(true);
        } else {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Error fetching user data:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchUserData();

    return () => abortController.abort();
  }, [navigate]);

  // Updated fetchData function with 7-day filter
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      // Fetch users
      const usersResp = await fetch("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let usersData = [];
      if (usersResp.ok) {
        usersData = await usersResp.json();
        setUsers(usersData);
      }

      // Fetch todos
      const todosResp = await fetch("http://localhost:5003/api/todos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (todosResp.ok) {
        const todosData = await todosResp.json();
        setTodoItems(todosData);
      }

      // Fetch analytics data
      const analyticsResp = await fetchAnalyticsData();

      // Get users from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentUsers = usersData
        .filter((u) => u.id !== user?.id) // Exclude current admin user
        .filter((user) => new Date(user.created_at) > sevenDaysAgo)
        .map((user) => ({
          id: `user-${user.id}`,
          type: "user",
          action: "New User Registration",
          detail: `${user.first_name} ${user.last_name} joined as ${user.role}`,
          time: new Date(user.created_at).toLocaleString(),
          icon: "Users",
          timestamp: new Date(user.created_at)
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first

      // Get recent activities from analytics service (todos, etc.)
      const analyticsActivities = analyticsResp?.recentActivities?.map((activity) => ({
        id: `analytics-${activity.id}`,
        type: activity.type,
        action: activity.type.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        detail: activity.target,
        time: new Date(activity.timestamp).toLocaleString(),
        icon: activity.icon,
        timestamp: new Date(activity.timestamp)
      })) || [];

      // Combine and sort all activities (newest first)
      const allActivities = [...analyticsActivities, ...recentUsers]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10); // Show only latest 10 activities

      setRecentActivities(allActivities);

    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthorized || !user) return;

    const abortController = new AbortController();
    
    fetchData();

    // Set up real-time data refresh every 30 seconds
    const interval = setInterval(() => {
      if (isAuthorized && user) {
        fetchAnalyticsData();
      }
    }, 30000);

    return () => {
      abortController.abort();
      clearInterval(interval);
    };
  }, [isAuthorized, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const createUser = async () => {
    if (newUser.password.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }
    if (newUser.role === "broker" && !newUser.broker_type) {
      alert("Broker type is required for brokers");
      return;
    }
    if (passwordStrength < 50) {
      alert("Password is too weak. Please include " + passwordFeedback.join(", "));
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        phone: newUser.phone,
      };

      if (newUser.role === "broker") {
        payload.broker_type = newUser.broker_type;
      }

      const response = await fetch("http://localhost:5000/api/auth/admin/create-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.warning) {
          const isConfirmed = window.confirm(
            result.message + "\n\nClick OK to proceed or Cancel to go back."
          );

          if (isConfirmed) {
            await confirmUserCreation(payload, token);
          } else {
            alert("User creation canceled.");
          }
        } else {
          await refreshUsersList(token);
          setShowCreateUserModal(false);
          resetNewUserForm();
          alert("User created successfully!");
          logActivity("user_created", user?.username, `User: ${newUser.first_name} ${newUser.last_name}`);
        }
      } else {
        alert(`Failed to create user: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user.");
    }
  };

  const confirmUserCreation = async (payload, token) => {
    try {
      const confirmResponse = await fetch("http://localhost:5000/api/auth/admin/create-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Confirm": "true",
        },
        body: JSON.stringify(payload),
      });

      const confirmResult = await confirmResponse.json();

      if (confirmResponse.ok && confirmResult.success) {
        await refreshUsersList(token);
        setShowCreateUserModal(false);
        resetNewUserForm();
        alert("User created successfully!");
        logActivity("user_created", user?.username, `User: ${payload.firstName} ${payload.lastName}`);
      } else {
        alert(`Failed to create user: ${confirmResult.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error confirming user creation:", error);
      alert("Error creating user.");
    }
  };

  const refreshUsersList = async (token) => {
    const usersResp = await fetch("http://localhost:5000/api/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (usersResp.ok) {
      const usersData = await usersResp.json();
      setUsers(usersData);
    }
  };

  const resetNewUserForm = () => {
    setNewUser({
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      password: "",
      role: "buyer",
      phone: "",
      status: "active",
      broker_type: "external",
    });
    setPasswordStrength(0);
    setPasswordFeedback([]);
  };

  const updateUser = async (userToUpdate) => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        userId: userToUpdate.id,
        newRole: userToUpdate.role,
      };
      if (userToUpdate.role === "broker") {
        payload.broker_type = userToUpdate.broker_type;
      }
      const roleResponse = await fetch("http://localhost:5000/api/auth/role", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!roleResponse.ok) {
        const errorData = await roleResponse.json();
        alert(`Failed to update role: ${errorData.message || "Unknown error"}`);
        return;
      }
      if (userToUpdate.status && userToUpdate.status !== selectedUser.status) {
        const statusResponse = await fetch(`http://localhost:5000/api/users/${userToUpdate.id}/status`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: userToUpdate.status }),
        });
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          alert(`Failed to update status: ${errorData.message || "Unknown error"}`);
          return;
        }
      }
      const usersResp = await fetch("http://localhost:5000/api/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (usersResp.ok) {
        const usersData = await usersResp.json();
        setUsers(usersData);
      }
      setShowActionModal(false);
      setEditUser(null);
      alert("User updated successfully!");
      logActivity("user_updated", user?.username, `User: ${userToUpdate.first_name} ${userToUpdate.last_name}`);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user.");
    }
  };

  const handleUserAction = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    if (action === "edit") {
      setEditUser({ ...user });
    }
    setShowActionModal(true);
  };

  const confirmUserAction = async () => {
    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      let method = "PUT";
      let body = {};
      switch (actionType) {
        case "deactivate":
          endpoint = `http://localhost:5000/api/users/${selectedUser.id}/status`;
          body = { status: "inactive" };
          break;
        case "activate":
          endpoint = `http://localhost:5000/api/users/${selectedUser.id}/status`;
          body = { status: "active" };
          break;
        case "delete":
          endpoint = `http://localhost:5000/api/users/${selectedUser.id}`;
          method = "DELETE";
          body = undefined;
          break;
        default:
          return;
      }
      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: method !== "DELETE" ? JSON.stringify(body) : undefined,
      });
      if (response.ok) {
        const usersResp = await fetch("http://localhost:5000/api/users", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (usersResp.ok) {
          const usersData = await usersResp.json();
          setUsers(usersData);
        }
        setShowActionModal(false);
        alert(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} successful!`);
        logActivity(`user_${actionType}`, user?.username, `User: ${selectedUser.first_name} ${selectedUser.last_name}`);
      } else {
        const errorData = await response.json();
        alert(`Action failed: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error performing user action:", error);
      alert("Error performing action.");
    }
  };

  const handleProfilePictureUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      console.log("Uploading file:", file.name, file.size, file.type);

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/auth/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Upload successful:", data);

        setUser((prevUser) => ({
          ...prevUser,
          profile_picture: data.profilePictureUrl,
        }));

        setShowProfileModal(false);
      } else {
        const errorData = await response.json();
        console.error("Upload failed:", errorData);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => u.id !== user?.id)
      .filter(
        (user) =>
          `${user.first_name || ""} ${user.last_name || ""}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (user.username &&
            user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.email &&
            user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .filter((user) => filterStatus === "all" || user.status === filterStatus);
  }, [users, searchTerm, filterStatus, user]);

  // Calculate users from last 7 days
  const usersLast7Days = users.filter(user => {
    const userDate = new Date(user.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return userDate > sevenDaysAgo;
  }).length;

  const renderContent = () => {
    if (isLoading) {
      return <Loader />;
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="mx-0 space-y-6">
            <div className={`p-6 text-center ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
              <h1 className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              } mb-2`}>
                Welcome back, {user?.first_name}!
              </h1>
              <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                Here's what's happening with your platform today.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                title="Total Users"
                value={users.length}
                trend={analyticsData?.userTrend || "+0%"}
                color="bg-blue-500"
                subtitle="Registered users"
                theme={theme}
              />
              <StatCard
                icon={Home}
                title="Properties"
                value={analyticsData?.totalProperties || 0}
                trend="+8%"
                color="bg-green-500"
                subtitle="Active listings"
                theme={theme}
              />
              <StatCard
                icon={DollarSign}
                title="Revenue"
                value={`ETB ${((analyticsData?.dealAnalytics?.totalRevenue || 0) / 1000).toFixed(0)}K`}
                trend="+23%"
                color="bg-amber-500"
                subtitle="This month"
                theme={theme}
              />
              <StatCard
                icon={Activity}
                title="Active Now"
                value={analyticsData?.activeUsers || Math.floor(users.length * 0.65)}
                trend="+5%"
                color="bg-purple-500"
                subtitle="Online users"
                theme={theme}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`p-6 rounded-xl border ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <div className="h-80">
                  <Line options={lineChartOptions} data={lineChartData} />
                </div>
              </div>
              <div className={`p-6 rounded-xl border ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <div className="h-80">
                  <Radar options={radarChartOptions} data={radarChartData} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TodoList
                theme={theme}
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
              />
              <ChatApp
                theme={theme}
                user={user}
                isChatMaximized={isChatMaximized}
                setIsChatMaximized={setIsChatMaximized}
                showUserInfoModal={showUserInfoModal}
                setShowUserInfoModal={setShowUserInfoModal}
                setSelectedUser={setSelectedUser}
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <EthiopiaMap data={analyticsData?.locationAnalytics || []} />
            </div>

            {/* Updated Recent Activities with 7-Day Filter */}
            <div className={`p-6 rounded-xl border ${
              theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  Recent Activities
                </h3>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  theme === "dark" ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                }`}>
                  Last 7 Days
                </span>
              </div>

              {/* 7-Day Statistics */}
              <div className={`mb-4 p-3 rounded-lg ${
                theme === "dark" ? "bg-gray-700" : "bg-blue-50"
              }`}>
                <p className={`text-sm text-center ${
                  theme === "dark" ? "text-blue-300" : "text-blue-700"
                }`}>
                  📊 <strong>{usersLast7Days} users</strong> joined in the last 7 days
                </p>
              </div>
              
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className={`p-4 rounded-lg border ${
                      theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            theme === "dark" ? "bg-blue-900" : "bg-blue-100"
                          }`}>
                            {activity.type === "user" ? (
                              <Users className={`w-5 h-5 ${
                                theme === "dark" ? "text-blue-300" : "text-blue-600"
                              }`} />
                            ) : activity.type.includes("todo") ? (
                              activity.icon === "CheckSquare" ? (
                                <CheckSquare className={`w-5 h-5 ${
                                  theme === "dark" ? "text-green-300" : "text-green-600"
                                }`} />
                              ) : activity.icon === "Edit" ? (
                                <Edit className={`w-5 h-5 ${
                                  theme === "dark" ? "text-yellow-300" : "text-yellow-600"
                                }`} />
                              ) : (
                                <Trash2 className={`w-5 h-5 ${
                                  theme === "dark" ? "text-red-300" : "text-red-600"
                                }`} />
                              )
                            ) : (
                              <Activity className={`w-5 h-5 ${
                                theme === "dark" ? "text-blue-300" : "text-blue-600"
                              }`} />
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                              {activity.action}
                            </p>
                            <p className={`text-sm ${
                              theme === "dark" ? "text-gray-300" : "text-gray-600"
                            }`}>
                              {activity.detail}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {getTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className={`w-16 h-16 mx-auto mb-4 ${
                    theme === "dark" ? "text-gray-600" : "text-gray-400"
                  }`} />
                  <p className={`text-lg font-medium mb-2 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>
                    No recent activities
                  </p>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-500" : "text-gray-400"
                  }`}>
                    No user registrations or activities in the past 7 days
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      // ... rest of the cases remain the same
      case "users":
        return (
          <div className={`p-4 lg:p-6 rounded-xl border transition-all duration-300 max-w-full lg:max-w-6xl mx-auto ${
            theme === "dark" ? "bg-gray-800 border-gray-700 shadow-lg" : "bg-white border-gray-200 shadow-md"
          }`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <h2 className={`text-2xl lg:text-3xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                User Management
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] group"
                  style={{
                    background: "transparent",
                    borderImage: theme === "dark" 
                      ? "linear-gradient(135deg, #f59e0b, #d97706) 1" 
                      : "linear-gradient(135deg, #f59e0b, #fbbf24) 1",
                  }}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 group-hover:from-amber-300 group-hover:to-orange-400"
                      : "bg-gradient-to-r from-amber-400 to-amber-500 group-hover:from-amber-300 group-hover:to-amber-400"
                  }`}>
                    <UserPlus className="w-4 h-4 text-white" />
                  </div>
                  <span className={`font-semibold ${
                    theme === "dark" ? "text-amber-200 group-hover:text-amber-100" : "text-amber-700 group-hover:text-amber-600"
                  }`}>
                    Create User
                  </span>
                </button>
                <div className="relative flex-1 lg:flex-none min-w-[250px]">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  } w-5 h-5`} />
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

            {users.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-transparent scrollbar-thumb-amber-500/70 dark:scrollbar-thumb-amber-400/60">
                <table className="min-w-[900px] w-full table-auto">
                  <thead>
                    <tr className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"} transition-colors duration-300`}>
                      {["User", "Username", "Email", "Role", "Broker Type", "Status", "Joined", "Actions"].map((header) => (
                        <th key={header} className={`px-6 py-4 text-left font-semibold transition-colors duration-300 ${
                          theme === "dark" ? "text-white" : "text-gray-600"
                        }`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
                      const roleColors = {
                        admin: "bg-red-500", broker: "bg-purple-500", buyer: "bg-green-500", 
                        seller: "bg-yellow-500", support_agent: "bg-blue-500", renter: "bg-pink-500", user: "bg-gray-500"
                      };
                      const colorClass = roleColors[user.role] || "bg-gray-500";

                      return (
                        <tr key={user.id} className={`border-b transition-all duration-300 hover:transform hover:scale-[1.01] ${
                          theme === "dark" ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"
                        }`}>
                          <td className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {user.profile_picture ? (
                                  <img src={user.profile_picture} alt={`${user.first_name} ${user.last_name}`} 
                                    className="w-12 h-12 rounded-full object-cover shadow-md" />
                                ) : (
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md ${colorClass}`}>
                                    {initials}
                                  </div>
                                )}
                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 transition-all duration-300 ${
                                  theme === "dark" ? "ring-gray-800" : "ring-white"
                                } ${user.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
                              </div>
                              <div>
                                <div className={`font-medium transition-colors duration-300 ${
                                  theme === "dark" ? "text-white" : "text-black"
                                }`}>
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className={`text-sm transition-colors duration-300 ${
                                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                                }`}>
                                  {user.status} • {user.role}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
                            {user.username || "N/A"}
                          </td>
                          <td className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
                            {user.email}
                          </td>
                          <td className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-300 ${colorClass} text-white`}>
                              {user.role}
                            </span>
                          </td>
                          <td className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
                            {user.role === "broker" ? user.broker_type || "N/A" : "N/A"}
                          </td>
                          <td className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                              user.status === "active"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : user.status === "inactive"
                                ? "bg-red-100 text-red-800 hover:bg-red-200"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className={`px-6 py-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUserAction(user, user.status === "active" ? "deactivate" : "activate")}
                                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                                  user.status === "active"
                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                    : "bg-green-100 text-green-600 hover:bg-green-200"
                                }`}
                                title={user.status === "active" ? "Deactivate" : "Activate"}
                              >
                                {user.status === "active" ? <UserX size={16} /> : <UserCheck size={16} />}
                              </button>
                              <button
                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-300 transform hover:scale-110"
                                title="View Info"
                                onClick={() => { setSelectedUser(user); setShowUserInfoModal(true); }}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-300 transform hover:scale-110"
                                title="Edit"
                                onClick={() => handleUserAction(user, "edit")}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-300 transform hover:scale-110"
                                title="Delete"
                                onClick={() => handleUserAction(user, "delete")}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={`text-center py-16 rounded-xl border-2 border-dashed transition-all duration-300 ${
                theme === "dark" ? "border-gray-600 text-gray-400 bg-gray-700" : "border-gray-300 text-gray-500 bg-gray-50"
              }`}>
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
        );

      case "chat":
        return (
          <ChatPage
            theme={theme}
            users={users}
            showUserInfoModal={showUserInfoModal}
            setShowUserInfoModal={setShowUserInfoModal}
            setSelectedUser={setSelectedUser}
            isChatMaximized={isChatMaximized}
            setIsChatMaximized={setIsChatMaximized}
            user={user}
          />
        );

      case "properties":
        return <ComingSoonSection title="Properties Management" description="This feature is currently in development." theme={theme} />;

      case "transactions":
        return <ComingSoonSection title="Transaction Monitoring" description="Transaction monitoring is coming soon." theme={theme} />;

      case "support":
        return <ComingSoonSection title="Support Center" description="Our support system is under construction." theme={theme} />;

      case "system":
        return <ComingSoonSection title="System Settings" description="System configuration panel is being developed." theme={theme} />;

      default:
        return null;
    }
  };

  if (!user || !isAuthorized) {
    return <Loader />;
  }

  return (
    <div className={`min-h-screen ${
      theme === "dark" 
        ? "bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white" 
        : "bg-gray-100 text-gray-900"
    } flex transition-colors duration-300`}>
      
      {/* Sidebar - Responsive */}
      <div className={`fixed lg:static w-64 min-h-screen flex-shrink-0 shadow-lg transform transition-transform duration-300 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${
        theme === "dark" 
          ? "bg-gray-900/40 backdrop-blur-lg border-r border-gray-700/30" 
          : "bg-white border-r border-gray-200"
      } flex flex-col z-30`}>
        
        {/* Logo */}
        <div className={`flex items-center gap-4 px-8 py-3 border-b ${
          theme === "dark" ? "border-gray-700/40 bg-gray-900/30" : "border-gray-200"
        }`}>
          <img src="/vectors/smallLogo.svg" alt="WubLand Logo" className="w-16 h-16 md:w-22 md:h-22" />
          <span className="font-medium text-lg md:text-2xl text-amber-500">WubLand</span>
        </div>

        {/* Static Profile */}
        <div className={`p-4 md:p-6 border-b ${
          theme === "dark" ? "border-gray-700/40 bg-gray-900/30" : "border-gray-200"
        } flex flex-col items-center`}>
          <div className="flex justify-center mb-4">
            <StaticProfileAvatar
              userProfilePicture={user?.profile_picture}
              firstName={user?.first_name}
              lastName={user?.last_name}
              username={user?.username}
              email={user?.email}
              role={user?.role}
              broker_type={user?.broker_type}
              size="xl"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className={`p-4 flex-1 ${theme === "dark" ? "bg-gray-900/20" : ""}`}>
          <div className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "users", label: "User Management", icon: Users },
              { id: "chat", label: "Chat", icon: MessageSquare },
              { id: "properties", label: "Properties", icon: Home },
              { id: "transactions", label: "Transactions", icon: CreditCard },
              { id: "support", label: "Support", icon: MessageSquare },
              { id: "system", label: "System Settings", icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
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
                <item.icon className={`w-5 h-5 mr-3 ${
                  activeTab === item.id
                    ? theme === "dark" ? "text-white" : "text-amber-600"
                    : theme === "dark" ? "text-amber-400" : "text-gray-600"
                }`} />
                <span className={`truncate ${
                  activeTab === item.id
                    ? theme === "dark" ? "text-white" : "text-amber-600"
                    : theme === "dark" ? "text-amber-400" : "text-gray-700"
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className={`p-4 border-t ${
          theme === "dark" ? "border-gray-700/40 bg-gray-900/30" : "border-gray-200"
        }`}>
          <button
            className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
              theme === "dark" 
                ? "text-gray-300 hover:bg-gray-700/50 backdrop-blur-sm" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Right Section - Top Bar + Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className={`flex-shrink-0 border-b ${
          theme === "dark" ? "border-gray-700/30" : "border-gray-200"
        }`} style={{
          backgroundImage: `url(${theme === "dark" ? "/vectors/TiletDark.svg" : "/vectors/TiletLight.svg"})`,
          backgroundSize: "cover", backgroundPosition: "bottom", backgroundRepeat: "no-repeat",
        }}>
          <div className="">
            <div className="flex items-center justify-between p-4">
              {/* Menu Button (mobile only) */}
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
              <h1 className={`text-xl font-bold flex-1 mt-2 ml-10 text-center md:text-left ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {activeTab === "dashboard" ? "Admin Dashboard" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
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
                    <div className={`absolute right-0 top-12 w-48 rounded-lg shadow-lg z-50 backdrop-blur-md ${
                      theme === "dark" ? "bg-gray-800/90 border border-gray-700" : "bg-white/90 border border-gray-200"
                    }`}>
                      {languages.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => handleLanguageChange(language.code)}
                          className={`w-full text-left px-4 py-2 flex items-center gap-3 ${
                            currentLanguage === language.code
                              ? theme === "dark" ? "bg-gray-700/50 text-amber-400" : "bg-amber-100/80 text-amber-700"
                              : theme === "dark" ? "hover:bg-gray-700/50 text-gray-300" : "hover:bg-gray-100/80 text-gray-700"
                          } transition-colors`}
                        >
                          <span className="text-lg">{language.flag}</span>
                          <span>{language.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-lg transition-colors backdrop-blur-sm relative ${
                      theme === "dark" 
                        ? "hover:bg-gray-700/50 text-gray-300" 
                        : "hover:bg-white/30 text-gray-600"
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center backdrop-blur-sm">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className={`absolute right-0 top-12 w-80 rounded-lg shadow-lg z-50 backdrop-blur-md ${
                      theme === "dark" ? "bg-gray-800/90 border border-gray-700" : "bg-white/90 border border-gray-200"
                    }`}>
                      <div className={`p-3 border-b ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}>
                        <h3 className={`font-semibold ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          Notifications
                        </h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div key={notification.id} className={`p-3 border-b ${
                              theme === "dark" 
                                ? "border-gray-700 hover:bg-gray-700/50" 
                                : "border-gray-200 hover:bg-gray-100/80"
                            } transition-colors ${!notification.read ? "bg-amber-500/10" : ""}`}>
                              <p className={`text-sm ${
                                theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }`}>
                                {notification.message}
                              </p>
                              <p className={`text-xs ${
                                theme === "dark" ? "text-gray-500" : "text-gray-400"
                              } mt-1`}>
                                {notification.time}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className={`p-4 text-center ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}>
                            No notifications
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar */}
                <div className="relative">
                  <ProfileAvatar
                    userProfilePicture={user?.profile_picture}
                    firstName={user?.first_name}
                    lastName={user?.last_name}
                    username={user?.username}
                    email={user?.email}
                    role={user?.role}
                    size="sm"
                    onLogout={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
                    onUploadImage={() => setShowProfileModal(true)}
                    onNavigateToSection={(section) => { setActiveTab(section); setIsMobileMenuOpen(false); }}
                    theme={theme}
                  />
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
        <div className="fixed inset-0 bg-black h-full bg-opacity-50 md:hidden z-20" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      
      {/* Modals */}
      <UserInfoModal isOpen={showUserInfoModal} onClose={() => setShowUserInfoModal(false)} selectedUser={selectedUser} theme={theme} />
      <CreateUserModal
        isOpen={showCreateUserModal} onClose={() => setShowCreateUserModal(false)} theme={theme}
        newUser={newUser} setNewUser={setNewUser} passwordStrength={passwordStrength} passwordFeedback={passwordFeedback}
        createUser={createUser} checkPasswordStrength={checkPasswordStrength}
      />
      <EditUserModal
        isOpen={showActionModal && actionType === "edit"} onClose={() => setShowActionModal(false)}
        editUser={editUser} setEditUser={setEditUser} theme={theme} updateUser={updateUser}
      />
      <ConfirmationModal
        isOpen={showActionModal && actionType !== "edit"} onClose={() => setShowActionModal(false)}
        title={`Confirm ${actionType}`}
        message={`Are you sure you want to ${actionType} user ${selectedUser?.first_name} ${selectedUser?.last_name}?${
          actionType === "delete" ? " This action cannot be undone." : ""
        }`}
        onConfirm={confirmUserAction} confirmText={`Confirm ${actionType}`}
        confirmColor={actionType === "delete" ? "bg-red-600 hover:opacity-90" : "bg-blue-600 hover:opacity-90"}
        theme={theme}
      />
      {user && (
        <ProfilePictureModal
          isOpen={showProfileModal} onClose={() => setShowProfileModal(false)}
          onUpload={handleProfilePictureUpload} user={user} theme={theme}
        />
      )}
    </div>
  );
};

export default AdminDashboard;