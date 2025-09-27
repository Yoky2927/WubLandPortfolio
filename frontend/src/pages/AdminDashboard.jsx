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
    // Here you would integrate with your translation service
    console.log("Language changed to:", languageCode);
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    const feedback = [];

    // Length check
    if (password.length >= 8) strength += 25;
    else feedback.push("at least 8 characters");

    // Uppercase check
    if (/[A-Z]/.test(password)) strength += 25;
    else feedback.push("an uppercase letter");

    // Number check
    if (/[0-9]/.test(password)) strength += 25;
    else feedback.push("a number");

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
    else feedback.push("a special character");

    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };

  const chartData = [
    { name: "Jan", users: 45, revenue: 12000 },
    { name: "Feb", users: 52, revenue: 15000 },
    { name: "Mar", users: 48, revenue: 13000 },
    { name: "Apr", users: 78, revenue: 22000 },
    { name: "May", users: 65, revenue: 18000 },
    { name: "Jun", users: 90, revenue: 28000 },
  ];

  const roleDistribution = [
    { name: "Buyers", value: 33, color: "#3B82F6" },
    { name: "Sellers", value: 25, color: "#10B981" },
    { name: "Internal Brokers", value: 45, color: "#F59E0B" },
    { name: "External Brokers", value: 51, color: "#F97316" },
    { name: "Admins", value: 37, color: "#8B5CF6" },
    { name: "Support Agents", value: 30, color: "#8B5CF6" },
  ];

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
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
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
          callback: (value) => `${value}k`,
        },
        title: {
          display: true,
          text: "Revenue ($)",
          color: theme === "dark" ? "#fff" : "#374151",
        },
      },
      x: {
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
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

  const lineChartData = {
    labels: chartData.map((item) => item.name),
    datasets: [
      {
        label: "Users",
        data: chartData.map((item) => item.users),
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
        label: "Revenue ($)",
        data: chartData.map((item) => item.revenue / 1000),
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
      },
    ],
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
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
        },
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
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

  const radarChartData = {
    labels: roleDistribution.map((item) => item.name),
    datasets: [
      {
        label: "User Distribution",
        data: roleDistribution.map((item) => item.value),
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        borderColor: "rgb(245, 158, 11)",
        pointBackgroundColor: "rgb(245, 158, 11)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(245, 158, 11)",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

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

  useEffect(() => {
    if (!isAuthorized || !user) return;

    const abortController = new AbortController();
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const usersResp = await fetch("http://localhost:5000/api/users", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
        });
        if (usersResp.ok) {
          const usersData = await usersResp.json();
          setUsers(usersData);
        } else {
          console.error("Failed to fetch users");
        }
        const todosResp = await fetch("http://localhost:5003/api/todos", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
        });
        if (todosResp.ok) {
          const todosData = await todosResp.json();
          setTodoItems(todosData);
        } else {
          console.error("Failed to fetch todos");
        }
        setProperties([]);
        setTransactions([]);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => abortController.abort();
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
      alert(
        "Password is too weak. Please include " + passwordFeedback.join(", ")
      );
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
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
        setShowCreateUserModal(false);
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
        alert("User created successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to create user: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user.");
    }
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
        const statusResponse = await fetch(
          `http://localhost:5000/api/users/${userToUpdate.id}/status`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: userToUpdate.status }),
          }
        );
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          alert(
            `Failed to update status: ${errorData.message || "Unknown error"}`
          );
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
        alert(
          `${
            actionType.charAt(0).toUpperCase() + actionType.slice(1)
          } successful!`
        );
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
      formData.append("profilePicture", file); // Make sure this matches the backend expectation

      console.log("Uploading file:", file.name, file.size, file.type);

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/auth/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Upload successful:", data);

        // Update user state
        setUser((prevUser) => ({
          ...prevUser,
          profile_picture: data.profilePictureUrl,
        }));

        setShowProfileModal(false);
        toast.success("Profile picture updated successfully!");
      } else {
        const errorData = await response.json();
        console.error("Upload failed:", errorData);
        toast.error(errorData.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload error. Please try again.");
    }
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => u.id !== user.id)
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

  const recentActivities = users
    .filter((u) => u.id !== user.id)
    .filter(
      (user) =>
        new Date(user.created_at) >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )
    .map((user) => ({
      type: "user",
      action: "New user registration",
      detail: `${user.first_name} ${user.last_name} joined as ${user.role}`,
      time: new Date(user.created_at).toLocaleDateString(),
    }))
    .slice(0, 5);

  const renderContent = () => {
    if (isLoading) {
      return <Loader />;
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="mx-0 space-y-6">
            <div
              className={`p-6 text-center ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              } border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h1
                className={`text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                } mb-2`}
              >
                Welcome back, {user?.first_name}!
              </h1>
              <p
                className={`${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Here's what's happening with your platform today.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                title="Total Users"
                value={users.length}
                trend="+12%"
                color="bg-blue-500"
                subtitle="From last week"
                theme={theme}
              />
              <StatCard
                icon={Home}
                title="Properties"
                value={properties.length || 0}
                trend="+8%"
                color="bg-green-500"
                subtitle="Active listings"
                theme={theme}
              />
              <StatCard
                icon={DollarSign}
                title="Revenue"
                value={`$${(28000).toLocaleString()}`}
                trend="+23%"
                color="bg-amber-500"
                subtitle="This month"
                theme={theme}
              />
              <StatCard
                icon={Activity}
                title="Active Now"
                value="42"
                trend="+5%"
                color="bg-purple-500"
                subtitle="Online users"
                theme={theme}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                className={`p-6 rounded-xl border ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="h-80">
                  <Line options={lineChartOptions} data={lineChartData} />
                </div>
              </div>
              <div
                className={`p-6 rounded-xl border ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
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
                Recent Activities
              </h3>
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.map((activity, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                              theme === "dark" ? "bg-blue-900" : "bg-blue-100"
                            }`}
                          >
                            <Users
                              className={`w-5 h-5 ${
                                theme === "dark"
                                  ? "text-blue-300"
                                  : "text-blue-600"
                              }`}
                            />
                          </div>
                          <div>
                            <p
                              className={`font-medium ${
                                theme === "dark"
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {activity.action}
                            </p>
                            <p
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-600"
                              }`}
                            >
                              {activity.detail}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className={`text-center py-8 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No recent activities
                </p>
              )}
            </div>
          </div>
        );
      case "users":
        return (
          <div
            className={`p-4 lg:p-6 rounded-xl border transition-all duration-300 max-w-full lg:max-w-6xl mx-auto ${
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
                User Management
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
            {users.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-transparent scrollbar-thumb-amber-500/70 dark:scrollbar-thumb-amber-400/60">
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
                        "Broker Type",
                        "Status",
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
                    {filteredUsers.map((user) => {
                      const initials = `${user.first_name?.[0] || ""}${
                        user.last_name?.[0] || ""
                      }`.toUpperCase();
                      const roleColors = {
                        admin: "bg-red-500",
                        broker: "bg-purple-500",
                        buyer: "bg-green-500",
                        seller: "bg-yellow-500",
                        support_agent: "bg-blue-500",
                        renter: "bg-pink-500",
                        user: "bg-gray-500",
                      };
                      const colorClass = roleColors[user.role] || "bg-gray-500";

                      return (
                        <tr
                          key={user.id}
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
                                {user.profile_picture ? (
                                  <img
                                    src={user.profile_picture}
                                    alt={`${user.first_name} ${user.last_name}`}
                                    className="w-12 h-12 rounded-full object-cover shadow-md"
                                  />
                                ) : (
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md ${colorClass}`}
                                  >
                                    {initials}
                                  </div>
                                )}
                                <span
                                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 transition-all duration-300 ${
                                    theme === "dark"
                                      ? "ring-gray-800"
                                      : "ring-white"
                                  } ${
                                    user.status === "active"
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
                                  {user.first_name} {user.last_name}
                                </div>
                                <div
                                  className={`text-sm transition-colors duration-300 ${
                                    theme === "dark"
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {user.status} • {user.role}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            className={`px-6 py-4 ${
                              theme === "dark" ? "text-white" : "text-black"
                            }`}
                          >
                            {user.username || "N/A"}
                          </td>
                          <td
                            className={`px-6 py-4 ${
                              theme === "dark" ? "text-white" : "text-black"
                            }`}
                          >
                            {user.email}
                          </td>
                          <td
                            className={`px-6 py-4 ${
                              theme === "dark" ? "text-white" : "text-black"
                            }`}
                          >
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-300 ${colorClass} text-white`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td
                            className={`px-6 py-4 ${
                              theme === "dark" ? "text-white" : "text-black"
                            }`}
                          >
                            {user.role === "broker"
                              ? user.broker_type || "N/A"
                              : "N/A"}
                          </td>
                          <td
                            className={`px-6 py-4 ${
                              theme === "dark" ? "text-white" : "text-black"
                            }`}
                          >
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                                user.status === "active"
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : user.status === "inactive"
                                  ? "bg-red-100 text-red-800 hover:bg-red-200"
                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td
                            className={`px-6 py-4 ${
                              theme === "dark" ? "text-white" : "text-black"
                            }`}
                          >
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td
                            className={`px-6 py-4 ${
                              theme === "dark" ? "text-white" : "text-black"
                            }`}
                          >
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleUserAction(
                                    user,
                                    user.status === "active"
                                      ? "deactivate"
                                      : "activate"
                                  )
                                }
                                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                                  user.status === "active"
                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                    : "bg-green-100 text-green-600 hover:bg-green-200"
                                }`}
                                title={
                                  user.status === "active"
                                    ? "Deactivate"
                                    : "Activate"
                                }
                                aria-label={
                                  user.status === "active"
                                    ? "Deactivate user"
                                    : "Activate user"
                                }
                              >
                                {user.status === "active" ? (
                                  <UserX size={16} />
                                ) : (
                                  <UserCheck size={16} />
                                )}
                              </button>
                              <button
                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-300 transform hover:scale-110"
                                title="View Info"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserInfoModal(true);
                                }}
                                aria-label="View user info"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-300 transform hover:scale-110"
                                title="Edit"
                                onClick={() => handleUserAction(user, "edit")}
                                aria-label="Edit user"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-300 transform hover:scale-110"
                                title="Delete"
                                onClick={() => handleUserAction(user, "delete")}
                                aria-label="Delete user"
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
        return (
          <ComingSoonSection
            title="Properties Management"
            description="This feature is currently in development."
            theme={theme}
          />
        );

      case "transactions":
        return (
          <ComingSoonSection
            title="Transaction Monitoring"
            description="Transaction monitoring is coming soon."
            theme={theme}
          />
        );

      case "support":
        return (
          <ComingSoonSection
            title="Support Center"
            description="Our support system is under construction."
            theme={theme}
          />
        );

      case "system":
        return (
          <ComingSoonSection
            title="System Settings"
            description="System configuration panel is being developed."
            theme={theme}
          />
        );

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
    } flex transition-colors duration-300`}
    >
      {/* Sidebar - Always on left */}
      <div className={`w-64 flex-shrink-0 shadow-lg ${
        theme === "dark"
          ? "bg-gray-900/40 backdrop-blur-lg border-r border-gray-700/30"
          : "bg-white border-r border-gray-200"
      } flex flex-col overflow-y-auto z-30`}>
        
        {/* Logo - Always visible */}
            <div className={`flex items-center gap-4 px-8 py-3
           border-b ${
          theme === "dark"
            ? "border-gray-700/40 bg-gray-900/30"
            : "border-gray-200"
        }`}>
              <img
                src="/vectors/smallLogo.svg"
                alt="WubLand Logo"
                className="w-16 h-16 md:w-22 md:h-22"
              />
              <span className={`font-medium text-lg md:text-2xl text-amber-500`}>
                WubLand
              </span>
            </div>
        {/* Static Profile in Sidebar */}
        <div className={`p-4 md:p-6 border-b ${
          theme === "dark"
            ? "border-gray-700/40 bg-gray-900/30"
            : "border-gray-200"
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
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center rounded-xl px-4 py-3 transition-all text-left
                    ${
                      activeTab === item.id
                        ? `${
                            theme === "dark"
                              ? "bg-amber-600/80 text-white backdrop-blur-sm"
                              : "bg-amber-100 text-amber-600"
                          } shadow-lg`
                        : `${
                            theme === "dark"
                              ? "text-amber-200 hover:bg-gray-700/50 backdrop-blur-sm"
                              : "text-gray-700 hover:bg-gray-100"
                          }`
                    }`}
                aria-current={activeTab === item.id ? "page" : undefined}
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
        <div className={`p-4 border-t ${
          theme === "dark"
            ? "border-gray-700/40 bg-gray-900/30"
            : "border-gray-200"
        }`}>
          <button
            className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "text-gray-300 hover:bg-gray-700/50 backdrop-blur-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Right Section - Top Bar + Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Only on the right side */}
        <div className={`flex-shrink-0 ${
          theme === "dark"
            ? "bg-gray-900/40 border-b border-gray-700/30"
            : "bg-white border-b border-gray-200"
        } border-b`}>
          <div className="flex items-center justify-between p-4">
            {/* Left side - Menu Button (mobile only) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded md:hidden ${
                theme === "dark"
                  ? "hover:bg-gray-700 text-white"
                  : "hover:bg-gray-200 text-gray-900"
              } transition-colors`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Center - Page Title */}
            <h1 className={`text-xl font-bold flex-1 mt-2 ml-10 text-center md:text-left ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              {activeTab === "dashboard"
                ? "Admin Dashboard"
                : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>

            {/* Right side - Icons */}
            <div className="flex items-center gap-3">
              {/* Language Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguagePicker(!showLanguagePicker)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Change Language"
                >
                  <Globe className="w-5 h-5" />
                </button>

                {showLanguagePicker && (
                  <div className={`absolute right-0 top-12 w-48 rounded-lg shadow-lg z-50 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border border-gray-700' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`w-full text-left px-4 py-2 flex items-center gap-3 ${
                          currentLanguage === language.code
                            ? theme === 'dark' ? 'bg-gray-700 text-amber-400' : 'bg-amber-100 text-amber-700'
                            : theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
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
                  className={`p-2 rounded-lg transition-colors relative ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className={`absolute right-0 top-12 w-80 rounded-lg shadow-lg z-50 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border border-gray-700' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <div className={`p-3 border-b ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <h3 className={`font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b ${
                              theme === 'dark' 
                                ? 'border-gray-700 hover:bg-gray-750' 
                                : 'border-gray-200 hover:bg-gray-50'
                            } transition-colors ${!notification.read ? 'bg-amber-500/10' : ''}`}
                          >
                            <p className={`text-sm ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {notification.message}
                            </p>
                            <p className={`text-xs ${
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            } mt-1`}>
                              {notification.time}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className={`p-4 text-center ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
                  onLogout={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/';
                  }}
                  onUploadImage={() => setShowProfileModal(true)}
                  onNavigateToSection={(section) => {
                    setActiveTab(section);
                    setIsMobileMenuOpen(false);
                  }}
                  theme={theme}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Below Top Bar on right side */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <main>{renderContent()}</main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
               onClick={() => setIsMobileMenuOpen(false)} />
          <div className={`fixed inset-y-0 left-0 w-64 z-50 md:hidden ${
            theme === "dark"
              ? "bg-gray-900/95 backdrop-blur-lg"
              : "bg-white"
          } transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300`}>
            {/* Mobile sidebar content would go here */}
          </div>
        </>
      )}

      <ThemeToggle theme={theme} onToggle={toggleTheme} />
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
      />
      <EditUserModal
        isOpen={showActionModal && actionType === "edit"}
        onClose={() => setShowActionModal(false)}
        editUser={editUser}
        setEditUser={setEditUser}
        theme={theme}
        updateUser={updateUser}
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
      {user && (
        <ProfilePictureModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpload={handleProfilePictureUpload}
          user={user}
          theme={theme}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
