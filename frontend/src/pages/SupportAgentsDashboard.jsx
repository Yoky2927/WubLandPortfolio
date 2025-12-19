import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Users,
  Home,
  MessageSquare,
  HelpCircle,
  Flag,
  BarChart3,
  Settings,
  LogOut,
  Eye,
  Edit,
  Search,
  DollarSign,
  CreditCard,
  Activity,
  Menu,
  X,
  Trash2,
  Bell,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Plus,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Star,
  User,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import StaticProfileAvatar from "../components/StaticProfileAvatar";
import ProfileAvatar from "../components/ProfileAvatar";
import ProfilePictureModal from "../components/ProfilePictureModal";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ChatApp from "../components/ChatApp";
import { io } from "socket.io-client";

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

const TicketModal = ({ isOpen, onClose, ticket, theme, onUpdateTicket, currentUser }) => {
  if (!isOpen || !ticket) return null;

  const [response, setResponse] = useState("");
  const [status, setStatus] = useState(ticket.status);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdateTicket(ticket.id, {
      response,
      status,
      respondedAt: new Date().toISOString()
    });
    setResponse("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`p-6 rounded-xl shadow-xl ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Support Ticket #{ticket.id}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded ${
              theme === "dark"
                ? "hover:bg-gray-700 text-white"
                : "hover:bg-gray-200 text-gray-900"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Ticket Info */}
          <div className={`p-4 rounded-lg ${
            theme === "dark" ? "bg-gray-700" : "bg-gray-100"
          }`}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">User:</span> {ticket.user_name}
              </div>
              <div>
                <span className="font-medium">Priority:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  ticket.priority === 'high' 
                    ? 'bg-red-100 text-red-800'
                    : ticket.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {ticket.priority}
                </span>
              </div>
              <div>
                <span className="font-medium">Category:</span> {ticket.category}
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  ticket.status === 'open' 
                    ? 'bg-blue-100 text-blue-800'
                    : ticket.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {ticket.status}
                </span>
              </div>
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <h4 className={`font-medium mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Issue Description
            </h4>
            <p className={`text-sm ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}>
              {ticket.description}
            </p>
          </div>

          {/* Previous Responses */}
          {ticket.responses && ticket.responses.length > 0 && (
            <div>
              <h4 className={`font-medium mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Previous Responses
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {ticket.responses.map((response, index) => (
                  <div key={index} className={`p-3 rounded ${
                    theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                  }`}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{response.responder_username}</span>
                      <span>{getTimeAgo(response.created_at)}</span>
                    </div>
                    <p className="text-sm mt-1">{response.response_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Your Response
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows="4"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="Type your response to the user..."
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Update Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Response
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ArticleModal = ({ isOpen, onClose, article, theme, onSaveArticle }) => {
  const [formData, setFormData] = useState({
    title: article?.title || "",
    content: article?.content || "",
    category: article?.category || "general"
  });

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        category: article.category
      });
    }
  }, [article]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveArticle(article?.id, formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`p-6 rounded-xl shadow-xl ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {article ? 'Edit Article' : 'Create New Article'}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded ${
              theme === "dark"
                ? "hover:bg-gray-700 text-white"
                : "hover:bg-gray-200 text-gray-900"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="general">General</option>
              <option value="account">Account Issues</option>
              <option value="payment">Payment & Billing</option>
              <option value="technical">Technical Support</option>
              <option value="property">Property Listings</option>
              <option value="safety">Safety & Guidelines</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows="8"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              required
            />
          </div>

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
              {article ? 'Update Article' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, trend, color, subtitle, theme }) => (
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
          trend?.includes("+") ? "text-green-500" : trend?.includes("-") ? "text-red-500" : "text-gray-500"
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

const SupportAgentsDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");

  // Support-specific state
  const [tickets, setTickets] = useState([]);
  const [articles, setArticles] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [supportAgents, setSupportAgents] = useState([]);
  const [userFeedback, setUserFeedback] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [recentActivities, setRecentActivities] = useState([]);

  const navigate = useNavigate();

  // API Base URLs
  const API_BASE = "http://localhost:5000"; // User service
  const SUPPORT_API_BASE = "http://localhost:5005"; // Support service

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
      message: "New high-priority ticket from John Doe",
      time: "5 min ago",
      read: false,
    },
    {
      id: 2,
      message: "3 new user inquiries waiting",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      message: "Article 'Payment Issues' needs update",
      time: "3 hours ago",
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mock data for fallback
  const mockTickets = [
    {
      id: 1,
      userName: "John Smith",
      userEmail: "john@example.com",
      subject: "Cannot access my account",
      description: "I'm unable to login to my account. It says invalid credentials but I'm sure my password is correct.",
      priority: "high",
      category: "account",
      status: "open",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      respondedAt: null
    },
    {
      id: 2,
      userName: "Sarah Johnson",
      userEmail: "sarah@example.com",
      subject: "Payment not processed",
      description: "I made a payment 3 days ago but it's still showing as pending. Can you check what's wrong?",
      priority: "medium",
      category: "payment",
      status: "in_progress",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      respondedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    {
      id: 3,
      userName: "Mike Brown",
      userEmail: "mike@example.com",
      subject: "Property listing issue",
      description: "My property listing is not showing up in search results even though it's approved.",
      priority: "medium",
      category: "property",
      status: "open",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      respondedAt: null
    }
  ];

  const mockArticles = [
    {
      id: 1,
      title: "How to Reset Your Password",
      content: "Step-by-step guide to reset your password if you've forgotten it...",
      category: "account",
      views: 1245,
      helpful: 89,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
    },
    {
      id: 2,
      title: "Understanding Payment Processing",
      content: "Learn how payments are processed on our platform and typical timelines...",
      category: "payment",
      views: 876,
      helpful: 67,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    },
    {
      id: 3,
      title: "Property Listing Guidelines",
      content: "Complete guide to creating and managing property listings...",
      category: "property",
      views: 1543,
      helpful: 112,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    }
  ];

  const mockFlaggedContent = [
    {
      id: 1,
      type: "property_listing",
      title: "Suspicious Property in Bole Area",
      reportedBy: "user123",
      reason: "Possible scam listing",
      severity: "high",
      status: "pending",
      reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      id: 2,
      type: "user_message",
      title: "Inappropriate language in chat",
      reportedBy: "user456",
      reason: "Harassment",
      severity: "medium",
      status: "under_review",
      reportedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    }
  ];

  // Fetch user data from user-service (similar to AdminDashboard)
  useEffect(() => {
    const abortController = new AbortController();
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(`${API_BASE}/api/auth/check`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
        });

        if (response.ok) {
          const userData = await response.json();
          
          // Check if user has support agent role
          if (userData.role !== "support_agent" && userData.role !== "admin") {
            localStorage.removeItem("token");
            navigate("/forbidden");
            return;
          }
          
          setUser(userData);
          setIsAuthorized(true);
          setIsLoading(false);
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

  // Fetch real data from APIs
  const fetchSupportData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch support tickets
      const ticketsResponse = await fetch(`${API_BASE}/api/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData);
      } else {
        // Fallback to mock data if API fails
        setTickets(mockTickets);
      }

      // Fetch knowledge base articles
      const articlesResponse = await fetch(`${API_BASE}/api/support/articles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json();
        setArticles(articlesData);
      } else {
        setArticles(mockArticles);
      }

      // Fetch flagged content
      const flagsResponse = await fetch(`${API_BASE}/api/support/flagged-content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (flagsResponse.ok) {
        const flagsData = await flagsResponse.json();
        setFlaggedContent(flagsData);
      } else {
        setFlaggedContent(mockFlaggedContent);
      }

      // Fetch support agents from user-service
      const agentsResponse = await fetch(`${API_BASE}/api/users?role=support_agent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        setSupportAgents(agentsData);
      }

      // Fetch user feedback
      const feedbackResponse = await fetch(`${API_BASE}/api/support/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setUserFeedback(feedbackData);
      }

      // Fetch recent activities
      const activitiesResponse = await fetch(`${API_BASE}/api/support/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setRecentActivities(activitiesData);
      }

    } catch (error) {
      console.error("Error fetching support data:", error);
      // Fallback to mock data
      setTickets(mockTickets);
      setArticles(mockArticles);
      setFlaggedContent(mockFlaggedContent);
    }
  };

  useEffect(() => {
    if (!isAuthorized || !user) return;

    const abortController = new AbortController();
    
    fetchSupportData();

    // Set up WebSocket for real-time updates
    const socket = io("http://localhost:5001");
    
    socket.on("new_ticket", (ticket) => {
      setTickets(prev => [ticket, ...prev]);
      setRecentActivities(prev => [{
        id: Date.now(),
        type: "ticket",
        action: "New Support Ticket",
        detail: `New ticket from ${ticket.userName}: ${ticket.subject}`,
        time: new Date().toLocaleString(),
        icon: "MessageSquare",
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
    });

    return () => {
      abortController.abort();
      socket.disconnect();
    };
  }, [isAuthorized, user]);

  // Update ticket with response
  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/support/tickets/${ticketId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          response: updates.response,
          status: updates.status,
          responder_username: user.username
        }),
      });

      if (response.ok) {
        // Refresh tickets data
        await fetchSupportData();
        
        // Add to recent activities
        setRecentActivities(prev => [{
          id: Date.now(),
          type: "ticket",
          action: "Ticket Response Sent",
          detail: `Responded to ticket #${ticketId}`,
          time: new Date().toLocaleString(),
          icon: "MessageSquare",
          timestamp: new Date(),
          agent: user.username
        }, ...prev.slice(0, 9)]);
      } else {
        // Fallback to local update if API fails
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, ...updates } : ticket
        ));
        
        setRecentActivities(prev => [{
          id: Date.now(),
          type: "ticket",
          action: "Ticket Updated",
          detail: `Updated ticket #${ticketId}`,
          time: new Date().toLocaleString(),
          icon: "Edit",
          timestamp: new Date()
        }, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      // Fallback to local update
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
      ));
    }
  };

  // Create or update knowledge base article
  const handleSaveArticle = async (articleId, data) => {
    try {
      const token = localStorage.getItem("token");
      const url = articleId 
        ? `${API_BASE}/api/support/articles/${articleId}`
        : `${API_BASE}/api/support/articles`;
      
      const method = articleId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          author_username: user.username
        }),
      });

      if (response.ok) {
        await fetchSupportData();
        
        setRecentActivities(prev => [{
          id: Date.now(),
          type: "article",
          action: articleId ? "Article Updated" : "New Article Created",
          detail: `${articleId ? 'Updated' : 'Created'} article: ${data.title}`,
          time: new Date().toLocaleString(),
          icon: "FileText",
          timestamp: new Date(),
          agent: user.username
        }, ...prev.slice(0, 9)]);
      } else {
        // Fallback to local update
        if (articleId) {
          setArticles(prev => prev.map(article => 
            article.id === articleId ? { ...article, ...data, lastUpdated: new Date().toISOString() } : article
          ));
        } else {
          const newArticle = {
            id: Math.max(...articles.map(a => a.id)) + 1,
            ...data,
            views: 0,
            helpful: 0,
            lastUpdated: new Date().toISOString()
          };
          setArticles(prev => [newArticle, ...prev]);
        }
      }
    } catch (error) {
      console.error("Error saving article:", error);
      // Fallback to local update
      if (articleId) {
        setArticles(prev => prev.map(article => 
          article.id === articleId ? { ...article, ...data, lastUpdated: new Date().toISOString() } : article
        ));
      } else {
        const newArticle = {
          id: Math.max(...articles.map(a => a.id)) + 1,
          ...data,
          views: 0,
          helpful: 0,
          lastUpdated: new Date().toISOString()
        };
        setArticles(prev => [newArticle, ...prev]);
      }
    }
  };

  // Resolve flagged content
  const handleResolveFlaggedContent = async (flagId, action) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/support/flagged-content/${flagId}/resolve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          resolved_by: user.username
        }),
      });

      if (response.ok) {
        await fetchSupportData();
        
        setRecentActivities(prev => [{
          id: Date.now(),
          type: "flag",
          action: "Flagged Content Resolved",
          detail: `Resolved flagged content #${flagId} (${action})`,
          time: new Date().toLocaleString(),
          icon: "Flag",
          timestamp: new Date(),
          agent: user.username
        }, ...prev.slice(0, 9)]);
      } else {
        // Fallback to local update
        setFlaggedContent(prev => prev.map(flag => 
          flag.id === flagId ? { ...flag, status: action === 'approve' ? 'approved' : 'rejected' } : flag
        ));
      }
    } catch (error) {
      console.error("Error resolving flagged content:", error);
      // Fallback to local update
      setFlaggedContent(prev => prev.map(flag => 
        flag.id === flagId ? { ...flag, status: action === 'approve' ? 'approved' : 'rejected' } : flag
      ));
    }
  };

  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode);
    setShowLanguagePicker(false);
  };

  // Profile picture upload function (similar to AdminDashboard)
  const handleProfilePictureUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      console.log("Uploading file:", file.name, file.size, file.type);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/auth/upload`, {
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

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => 
      (filterStatus === "all" || ticket.status === filterStatus) &&
      (ticket.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       ticket.user_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [tickets, searchTerm, filterStatus]);

  // Calculate statistics from real data
  const stats = useMemo(() => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const resolvedToday = tickets.filter(t => 
      t.status === 'resolved' && 
      new Date(t.resolved_at || t.respondedAt).toDateString() === new Date().toDateString()
    ).length;
    
    // Calculate average rating from feedback
    const averageRating = userFeedback.length > 0 
      ? (userFeedback.reduce((sum, feedback) => sum + (feedback.rating || 0), 0) / userFeedback.length).toFixed(1)
      : "0.0";

    const helpfulArticles = articles.reduce((sum, article) => sum + (article.helpful_votes || article.helpful || 0), 0);

    return {
      totalTickets,
      openTickets,
      resolvedToday,
      averageRating,
      supportAgentsCount: supportAgents.length,
      helpfulArticles,
      avgResponseTime: "2.5h"
    };
  }, [tickets, userFeedback, supportAgents, articles]);

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
                Here's your support dashboard overview.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={MessageSquare}
                title="Total Tickets"
                value={stats.totalTickets}
                trend="+12%"
                color="bg-blue-500"
                subtitle="All support requests"
                theme={theme}
              />
              <StatCard
                icon={AlertCircle}
                title="Open Tickets"
                value={stats.openTickets}
                trend="+5%"
                color="bg-amber-500"
                subtitle="Needing attention"
                theme={theme}
              />
              <StatCard
                icon={CheckCircle}
                title="Resolved Today"
                value={stats.resolvedToday}
                trend="+8%"
                color="bg-green-500"
                subtitle="Successful resolutions"
                theme={theme}
              />
              <StatCard
                icon={Clock}
                title="Avg Response Time"
                value={stats.avgResponseTime}
                trend="-15%"
                color="bg-purple-500"
                subtitle="Faster responses"
                theme={theme}
              />
              {/* Additional stat cards from first code */}
              <StatCard
                icon={Star}
                title="Average Rating"
                value={stats.averageRating}
                trend="+0.2"
                color="bg-yellow-500"
                subtitle="User satisfaction"
                theme={theme}
              />
              <StatCard
                icon={Users}
                title="Support Team"
                value={stats.supportAgentsCount}
                trend="+1"
                color="bg-purple-500"
                subtitle="Active agents"
                theme={theme}
              />
              <StatCard
                icon={ThumbsUp}
                title="Helpful Articles"
                value={stats.helpfulArticles}
                trend="+15%"
                color="bg-green-500"
                subtitle="Positive feedback"
                theme={theme}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Tickets */}
              <div className={`p-6 rounded-xl border ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    Recent Tickets
                  </h3>
                  <button 
                    onClick={() => setActiveTab("tickets")}
                    className={`text-sm ${
                      theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                    }`}
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {tickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className={`p-3 rounded-lg border ${
                      theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {ticket.subject}
                          </p>
                          <p className={`text-sm ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}>
                            {ticket.userName || ticket.user_name} • {getTimeAgo(ticket.createdAt || ticket.created_at)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          ticket.priority === 'high' 
                            ? 'bg-red-100 text-red-800'
                            : ticket.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activities */}
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
                {recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className={`p-3 rounded-lg border ${
                        theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              theme === "dark" ? "bg-blue-900" : "bg-blue-100"
                            }`}>
                              <MessageSquare className={`w-4 h-4 ${
                                theme === "dark" ? "text-blue-300" : "text-blue-600"
                              }`} />
                            </div>
                            <div>
                              <p className={`font-medium text-sm ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                {activity.action}
                              </p>
                              <p className={`text-xs ${
                                theme === "dark" ? "text-gray-300" : "text-gray-600"
                              }`}>
                                {activity.detail}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}>
                            {getTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>
                    No recent activities
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case "tickets":
        return (
          <div className={`p-6 rounded-xl border ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <h2 className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Support Tickets
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-none min-w-[250px]">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  } w-5 h-5`} />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      theme === "dark"
                        ? "bg-gray-700 text-white border-gray-600"
                        : "bg-white text-black border-gray-300"
                    }`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    theme === "dark"
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-white text-black border-gray-300"
                  }`}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                    <th className="px-4 py-3 text-left">Ticket</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Priority</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className={`border-b ${
                      theme === "dark" ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"
                    }`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className={`font-medium ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {ticket.subject}
                          </p>
                          <p className={`text-sm ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}>
                            {ticket.category}
                          </p>
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {ticket.userName || ticket.user_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          ticket.priority === 'high' 
                            ? 'bg-red-100 text-red-800'
                            : ticket.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          ticket.status === 'open' 
                            ? 'bg-blue-100 text-blue-800'
                            : ticket.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}>
                        {getTimeAgo(ticket.createdAt || ticket.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTicketModal(true);
                          }}
                          className={`px-3 py-1 rounded text-sm ${
                            theme === "dark"
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          }`}
                        >
                          Respond
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "knowledge":
        return (
          <div className={`p-6 rounded-xl border ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Knowledge Base
              </h2>
              <button
                onClick={() => {
                  setSelectedArticle(null);
                  setShowArticleModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                New Article
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <div key={article.id} className={`p-4 rounded-lg border ${
                  theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {article.title}
                  </h3>
                  <p className={`text-sm mb-3 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}>
                    {article.content.substring(0, 100)}...
                  </p>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`px-2 py-1 rounded ${
                      theme === "dark" ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-700"
                    }`}>
                      {article.category}
                    </span>
                    <div className="flex items-center gap-4">
                      <span>{article.views} views</span>
                      <span>{article.helpful_votes || article.helpful} helpful</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setSelectedArticle(article);
                        setShowArticleModal(true);
                      }}
                      className={`px-2 py-1 rounded text-xs ${
                        theme === "dark"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      className={`px-2 py-1 rounded text-xs ${
                        theme === "dark"
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "flags":
        return (
          <div className={`p-6 rounded-xl border ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Flagged Content
            </h2>

            <div className="space-y-4">
              {flaggedContent.map((flag) => (
                <div key={flag.id} className={`p-4 rounded-lg border ${
                  theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={`font-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                        {flag.title}
                      </h3>
                      <p className={`text-sm ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}>
                        Reported by {flag.reportedBy} • {flag.reason}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      flag.severity === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {flag.severity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {getTimeAgo(flag.reportedAt)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveFlaggedContent(flag.id, 'approve')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleResolveFlaggedContent(flag.id, 'reject')}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "chat":
        return (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
              <h1 className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Support Chat
              </h1>
              <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                Communicate directly with users through the support system.
              </p>
            </div>
            <ChatApp
              theme={theme}
              user={user}
              isChatMaximized={false}
              setIsChatMaximized={() => {}}
              showUserInfoModal={false}
              setShowUserInfoModal={() => {}}
              setSelectedUser={() => {}}
            />
          </div>
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
    } flex transition-colors duration-300`}>
      
      {/* Sidebar */}
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
              size="xl"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className={`p-4 flex-1 ${theme === "dark" ? "bg-gray-900/20" : ""}`}>
          <div className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "tickets", label: "Support Tickets", icon: MessageSquare },
              { id: "knowledge", label: "Knowledge Base", icon: HelpCircle },
              { id: "flags", label: "Flagged Content", icon: Flag },
              { id: "chat", label: "Support Chat", icon: MessageSquare },
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
                {activeTab === "dashboard" ? "Support Agent Dashboard" : 
                 activeTab === "tickets" ? "Support Tickets" :
                 activeTab === "knowledge" ? "Knowledge Base" :
                 activeTab === "flags" ? "Flagged Content" :
                 activeTab === "chat" ? "Support Chat" :
                 activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
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
      <TicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        ticket={selectedTicket}
        theme={theme}
        onUpdateTicket={handleUpdateTicket}
        currentUser={user}
      />
      
      <ArticleModal
        isOpen={showArticleModal}
        onClose={() => setShowArticleModal(false)}
        article={selectedArticle}
        theme={theme}
        onSaveArticle={handleSaveArticle}
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

export default SupportAgentsDashboard;