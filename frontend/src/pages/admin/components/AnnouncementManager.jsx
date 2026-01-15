// frontend/src/pages/admin/components/AnnouncementManager.jsx
import React, { useState, useEffect } from "react";
import { 
  Send, Clock, Users, Target, Calendar, Bell, 
  AlertTriangle, CheckCircle, XCircle, Edit, Trash2,
  ExternalLink, BarChart, Eye, Globe, Filter,
  Download, Search, Plus, MoreVertical
} from "lucide-react";
import { httpClient } from "../../../services/http.service";

const AnnouncementManager = ({ theme, setToast }) => {
  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    target: "all_brokers",
    priority: "normal",
    expires_at: "",
    is_urgent: false,
    scheduled_for: "",
    language: "en",
  });
  const [announcements, setAnnouncements] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("create"); // create, preview, history
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const targetOptions = [
    { value: "all_brokers", label: "All Brokers", icon: Users, count: 250 },
    { value: "external_brokers", label: "External Brokers Only", icon: Target, count: 180 },
    { value: "internal_brokers", label: "Internal Brokers Only", icon: Users, count: 70 },
    { value: "commercial_clients", label: "Commercial Clients", icon: Globe, count: 45 },
    { value: "sellers", label: "Property Sellers", icon: Target, count: 120 },
    { value: "buyers", label: "Property Buyers", icon: Target, count: 320 },
    { value: "landlords", label: "Landlords", icon: Users, count: 65 },
    { value: "renters", label: "Renters", icon: Users, count: 280 },
    { value: "premium_users", label: "Premium Users", icon: CheckCircle, count: 95 },
    { value: "support_staff", label: "Support Staff", icon: Users, count: 12 },
  ];

  const priorityOptions = [
    { value: "low", label: "Low", color: "text-gray-500 bg-gray-100" },
    { value: "normal", label: "Normal", color: "text-blue-600 bg-blue-100" },
    { value: "high", label: "High", color: "text-amber-600 bg-amber-100" },
    { value: "urgent", label: "Urgent", color: "text-red-600 bg-red-100" },
  ];

  const languageOptions = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "am", name: "Amharic", flag: "🇪🇹" },
    { code: "or", name: "Oromo", flag: "🇪🇹" },
    { code: "ti", name: "Tigrinya", flag: "🇪🇷" },
  ];

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get("http://localhost:5001/api/announcements");
      setAnnouncements(response.data || response || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      // Mock data for demonstration
      setAnnouncements([
        {
          id: 1,
          title: "🎉 Platform Update Available",
          message: "We've released new features to improve your experience. Check them out!",
          target: "all_brokers",
          priority: "high",
          status: "sent",
          sent_at: "2024-01-15T10:30:00Z",
          views: 245,
          clicks: 89,
          created_by: "super_admin"
        },
        {
          id: 2,
          title: "🏢 Commercial Listing Discount",
          message: "Get 15% off on all commercial property listings this month!",
          target: "commercial_clients",
          priority: "normal",
          status: "sent",
          sent_at: "2024-01-14T14:20:00Z",
          views: 38,
          clicks: 12,
          created_by: "super_admin"
        },
        {
          id: 3,
          title: "⚠️ Maintenance Notice",
          message: "Scheduled maintenance on Saturday from 2-4 AM. Platform may be unavailable.",
          target: "all_brokers",
          priority: "urgent",
          status: "scheduled",
          scheduled_for: "2024-01-20T02:00:00Z",
          created_by: "super_admin"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSend = async () => {
    if (!announcement.title.trim() || !announcement.message.trim()) {
      setToast({
        show: true,
        message: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    try {
      setSending(true);

      const payload = {
        ...announcement,
        created_by: "super_admin",
        status: announcement.scheduled_for ? "scheduled" : "draft",
      };

      // Create announcement
      const response = await httpClient.post(
        "http://localhost:5001/api/announcements",
        payload
      );

      // If not scheduled, send immediately
      if (!announcement.scheduled_for) {
        await httpClient.post(
          "http://localhost:5001/api/notifications/broadcast",
          {
            announcement_id: response.id || response.data?.id,
            target: announcement.target,
            priority: announcement.priority,
          }
        );

        setToast({
          show: true,
          message: "Announcement sent successfully!",
          type: "success",
        });
      } else {
        setToast({
          show: true,
          message: `Announcement scheduled for ${new Date(announcement.scheduled_for).toLocaleString()}`,
          type: "success",
        });
      }

      // Reset form and refresh list
      setAnnouncement({
        title: "",
        message: "",
        target: "all_brokers",
        priority: "normal",
        expires_at: "",
        is_urgent: false,
        scheduled_for: "",
        language: "en",
      });
      
      await fetchAnnouncements();

    } catch (error) {
      console.error("Error sending announcement:", error);
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to send announcement",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = () => {
    if (!announcement.title.trim() || !announcement.message.trim()) {
      setToast({
        show: true,
        message: "Please fill in all required fields",
        type: "error",
      });
      return;
    }
    
    if (!announcement.scheduled_for) {
      setToast({
        show: true,
        message: "Please select a date and time for scheduling",
        type: "error",
      });
      return;
    }

    setShowPreview(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await httpClient.delete(`http://localhost:5001/api/announcements/${id}`);
      
      setToast({
        show: true,
        message: "Announcement deleted successfully",
        type: "success",
      });
      
      await fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      setToast({
        show: true,
        message: "Failed to delete announcement",
        type: "error",
      });
    }
  };

  const handleResend = async (announcement) => {
    try {
      await httpClient.post(
        "http://localhost:5001/api/notifications/broadcast",
        {
          announcement_id: announcement.id,
          target: announcement.target,
          priority: announcement.priority,
        }
      );

      setToast({
        show: true,
        message: "Announcement resent successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error resending announcement:", error);
      setToast({
        show: true,
        message: "Failed to resend announcement",
        type: "error",
      });
    }
  };

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ann.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || ann.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getTargetCount = (targetValue) => {
    const target = targetOptions.find(t => t.value === targetValue);
    return target ? target.count : 0;
  };

  const PreviewModal = () => {
    if (!showPreview) return null;

    const target = targetOptions.find(t => t.value === announcement.target);
    const priority = priorityOptions.find(p => p.value === announcement.priority);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`p-6 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Announcement Preview
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Preview Card */}
          <div className={`mb-6 p-6 rounded-xl border ${
            theme === "dark" 
              ? "bg-gray-900/50 border-gray-700" 
              : "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  announcement.priority === 'urgent' 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                    : announcement.priority === 'high'
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-lg font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {announcement.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs ${priority.color}`}>
                      {priority.label}
                    </span>
                    {announcement.is_urgent && (
                      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                Preview • Not sent yet
              </span>
            </div>

            <div className={`p-4 rounded-lg mb-4 ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}>
              <p className="whitespace-pre-line">{announcement.message}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                theme === "dark" 
                  ? "bg-gray-700 text-gray-300" 
                  : "bg-gray-200 text-gray-700"
              }`}>
                <Users className="inline w-3 h-3 mr-1" />
                {target?.label} ({getTargetCount(announcement.target)} users)
              </span>
              {announcement.language && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  theme === "dark" 
                    ? "bg-gray-700 text-gray-300" 
                    : "bg-gray-200 text-gray-700"
                }`}>
                  {languageOptions.find(l => l.code === announcement.language)?.flag}{" "}
                  {languageOptions.find(l => l.code === announcement.language)?.name}
                </span>
              )}
              {announcement.expires_at && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  theme === "dark" 
                    ? "bg-gray-700 text-gray-300" 
                    : "bg-gray-200 text-gray-700"
                }`}>
                  <Calendar className="inline w-3 h-3 mr-1" />
                  Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                </span>
              )}
              {announcement.scheduled_for && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  theme === "dark" 
                    ? "bg-blue-900/50 text-blue-400" 
                    : "bg-blue-100 text-blue-800"
                }`}>
                  <Clock className="inline w-3 h-3 mr-1" />
                  Scheduled: {new Date(announcement.scheduled_for).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowPreview(false)}
              className={`px-4 py-2 rounded-lg ${
                theme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Edit Again
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
            >
              {sending ? "Sending..." : "Confirm & Send"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Announcement Manager
          </h2>
          <p className={`mt-1 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Send important updates and promotions to users
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("create")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "create"
                ? "bg-amber-500 text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Plus className="inline w-4 h-4 mr-2" />
            Create
          </button>
          <button
            onClick={() => setViewMode("history")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "history"
                ? "bg-amber-500 text-white"
                : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Clock className="inline w-4 h-4 mr-2" />
            History
          </button>
        </div>
      </div>

      {viewMode === "create" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Announcement Form */}
          <div className={`lg:col-span-2 p-6 rounded-xl border ${
            theme === "dark" 
              ? "bg-gray-800 border-gray-700" 
              : "bg-white border-gray-200"
          }`}>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Title *
                </label>
                <input
                  type="text"
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Enter announcement title"
                />
              </div>

              {/* Message */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Message *
                </label>
                <textarea
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                  rows="6"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Type your announcement message here..."
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${
                    theme === "dark" ? "text-gray-500" : "text-gray-600"
                  }`}>
                    {announcement.message.length}/1000 characters
                  </span>
                  <span className={`text-xs ${
                    announcement.message.length > 800 
                      ? "text-red-500" 
                      : theme === "dark" 
                      ? "text-gray-400" 
                      : "text-gray-500"
                  }`}>
                    {announcement.message.length > 800 ? "Message getting long" : "Good length"}
                  </span>
                </div>
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Audience */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Target Audience *
                  </label>
                  <select
                    value={announcement.target}
                    onChange={(e) => setAnnouncement({...announcement, target: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    {targetOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.count} users)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Priority *
                  </label>
                  <select
                    value={announcement.priority}
                    onChange={(e) => setAnnouncement({...announcement, priority: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Language
                  </label>
                  <select
                    value={announcement.language}
                    onChange={(e) => setAnnouncement({...announcement, language: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    {languageOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.flag} {option.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Expiry Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={announcement.expires_at}
                      onChange={(e) => setAnnouncement({...announcement, expires_at: e.target.value})}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Option */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className={`font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      Schedule Announcement
                    </h4>
                    <p className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      Send at a specific date and time
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnnouncement({
                      ...announcement,
                      scheduled_for: announcement.scheduled_for ? "" : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
                    })}
                    className={`px-4 py-2 rounded-lg ${
                      announcement.scheduled_for
                        ? "bg-blue-500 text-white"
                        : theme === "dark"
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {announcement.scheduled_for ? "Scheduled" : "Schedule"}
                  </button>
                </div>
                
                {announcement.scheduled_for && (
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={announcement.scheduled_for}
                      onChange={(e) => setAnnouncement({...announcement, scheduled_for: e.target.value})}
                      min={new Date().toISOString().slice(0, 16)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Urgent Checkbox */}
              <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={announcement.is_urgent}
                  onChange={(e) => setAnnouncement({...announcement, is_urgent: e.target.checked})}
                  className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                />
                <div>
                  <label htmlFor="urgent" className={`font-medium ${
                    theme === "dark" ? "text-amber-300" : "text-amber-800"
                  }`}>
                    Mark as urgent
                  </label>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-amber-200/80" : "text-amber-700"
                  }`}>
                    Will send push notifications and show as high priority to users
                  </p>
                </div>
                <AlertTriangle className={`w-5 h-5 ${
                  theme === "dark" ? "text-amber-400" : "text-amber-600"
                }`} />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    if (announcement.title && announcement.message) {
                      setShowPreview(true);
                    } else {
                      setToast({
                        show: true,
                        message: "Please fill in title and message first",
                        type: "error",
                      });
                    }
                  }}
                  className="px-4 py-2 border border-amber-500 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                  <Eye className="inline w-4 h-4 mr-2" />
                  Preview
                </button>
                {announcement.scheduled_for ? (
                  <button
                    onClick={handleSchedule}
                    disabled={sending}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    <Clock className="inline w-4 h-4 mr-2" />
                    Schedule Announcement
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={sending || !announcement.title.trim() || !announcement.message.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="inline w-4 h-4 mr-2" />
                        Send Announcement
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Guidelines & Quick Templates */}
          <div className={`p-6 rounded-xl border ${
            theme === "dark" 
              ? "bg-gray-800 border-gray-700" 
              : "bg-white border-gray-200"
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              📢 Best Practices
            </h3>
            <ul className="space-y-3 mb-6">
              <li className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                <span className="font-medium text-amber-500">Be clear & concise</span> - Get straight to the point
              </li>
              <li className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                <span className="font-medium text-amber-500">Target appropriately</span> - Only send relevant messages
              </li>
              <li className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                <span className="font-medium text-amber-500">Use urgency wisely</span> - Reserve for critical updates
              </li>
              <li className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                <span className="font-medium text-amber-500">Set expiry dates</span> - Keep announcements current
              </li>
              <li className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                <span className="font-medium text-amber-500">Consider timezones</span> - Schedule for appropriate hours
              </li>
            </ul>

            {/* Quick Templates */}
            <div className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-gray-900" : "bg-gray-50"
            }`}>
              <h4 className={`font-medium mb-3 flex items-center gap-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                <Bell className="w-4 h-4" />
                Quick Templates
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => setAnnouncement({
                    ...announcement,
                    title: "🎉 Platform Update Available",
                    message: "We've released new features to improve your experience. Check them out!",
                    target: "all_brokers",
                    priority: "high"
                  })}
                  className="text-left text-sm text-blue-500 hover:text-blue-600 w-full p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Platform Update
                </button>
                <button
                  onClick={() => setAnnouncement({
                    ...announcement,
                    title: "🏢 Commercial Listing Discount",
                    message: "Get 15% off on all commercial property listings this month! Limited time offer.",
                    target: "commercial_clients",
                    priority: "normal"
                  })}
                  className="text-left text-sm text-green-500 hover:text-green-600 w-full p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Discount Alert
                </button>
                <button
                  onClick={() => setAnnouncement({
                    ...announcement,
                    title: "⚠️ Maintenance Notice",
                    message: "Scheduled maintenance on Saturday from 2-4 AM. Platform may be temporarily unavailable.",
                    target: "all_brokers",
                    priority: "urgent",
                    is_urgent: true
                  })}
                  className="text-left text-sm text-red-500 hover:text-red-600 w-full p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  System Maintenance
                </button>
                <button
                  onClick={() => setAnnouncement({
                    ...announcement,
                    title: "📈 Quarterly Performance Report",
                    message: "Check out the quarterly performance report for insights and analytics.",
                    target: "premium_users",
                    priority: "normal"
                  })}
                  className="text-left text-sm text-purple-500 hover:text-purple-600 w-full p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Report Release
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className={`mt-6 p-4 rounded-lg ${
              theme === "dark" ? "bg-gray-900" : "bg-amber-50"
            }`}>
              <h4 className={`font-medium mb-2 ${
                theme === "dark" ? "text-amber-300" : "text-amber-800"
              }`}>
                📊 Impact Preview
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    Estimated Reach:
                  </span>
                  <span className="font-medium">
                    {getTargetCount(announcement.target)} users
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    Priority Level:
                  </span>
                  <span className={`font-medium ${
                    announcement.priority === 'urgent' ? 'text-red-500' :
                    announcement.priority === 'high' ? 'text-amber-500' :
                    'text-blue-500'
                  }`}>
                    {announcement.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    Urgent:
                  </span>
                  <span className={announcement.is_urgent ? "text-red-500 font-medium" : "text-gray-500"}>
                    {announcement.is_urgent ? "YES" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History View */
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <h3 className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Announcement History
            </h3>
            <div className="flex gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none lg:w-64">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                } w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                    theme === "dark"
                      ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                      : "bg-white text-black border-gray-300 placeholder-gray-500"
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className={`px-4 py-2 border rounded-lg ${
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-black border-gray-300"
                }`}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Drafts</option>
              </select>
              <button className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                  : "bg-white text-black border-gray-300 hover:bg-gray-100"
              }`}>
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className={`text-center py-16 rounded-xl border-2 border-dashed ${
              theme === "dark" 
                ? "border-gray-700 text-gray-400 bg-gray-800/50" 
                : "border-gray-300 text-gray-500 bg-gray-50"
            }`}>
              <Bell className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <h3 className={`text-lg font-medium mb-2 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                No announcements found
              </h3>
              <p className="text-sm opacity-75">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first announcement to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-4 rounded-xl border ${
                    theme === "dark" 
                      ? "bg-gray-900/50 border-gray-700 hover:bg-gray-800" 
                      : "bg-gray-50 border-gray-200 hover:bg-white"
                  } transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`font-semibold ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          {ann.title}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          ann.priority === 'urgent' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : ann.priority === 'high'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {ann.priority}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          ann.status === 'sent'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : ann.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {ann.status}
                        </span>
                      </div>
                      <p className={`text-sm mb-3 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {ann.message.length > 150 ? ann.message.substring(0, 150) + "..." : ann.message}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          theme === "dark" 
                            ? "bg-gray-700 text-gray-300" 
                            : "bg-gray-200 text-gray-700"
                        }`}>
                          <Target className="inline w-3 h-3 mr-1" />
                          {ann.target.replace('_', ' ')}
                        </span>
                        {ann.views !== undefined && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            theme === "dark" 
                              ? "bg-gray-700 text-gray-300" 
                              : "bg-gray-200 text-gray-700"
                          }`}>
                            <Eye className="inline w-3 h-3 mr-1" />
                            {ann.views} views
                          </span>
                        )}
                        {ann.clicks !== undefined && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            theme === "dark" 
                              ? "bg-gray-700 text-gray-300" 
                              : "bg-gray-200 text-gray-700"
                          }`}>
                            <BarChart className="inline w-3 h-3 mr-1" />
                            {ann.clicks} clicks
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${
                          theme === "dark" 
                            ? "bg-gray-700 text-gray-300" 
                            : "bg-gray-200 text-gray-700"
                        }`}>
                          <Clock className="inline w-3 h-3 mr-1" />
                          {ann.sent_at 
                            ? new Date(ann.sent_at).toLocaleString()
                            : ann.scheduled_for
                            ? `Scheduled: ${new Date(ann.scheduled_for).toLocaleString()}`
                            : 'Draft'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {ann.status === 'sent' && (
                        <button
                          onClick={() => handleResend(ann)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                          title="Resend"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {ann.status === 'draft' && (
                        <button
                          onClick={() => {
                            setAnnouncement({
                              title: ann.title,
                              message: ann.message,
                              target: ann.target,
                              priority: ann.priority,
                              expires_at: ann.expires_at,
                              is_urgent: ann.is_urgent,
                              scheduled_for: ann.scheduled_for,
                              language: ann.language || "en",
                            });
                            setViewMode("create");
                          }}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PreviewModal />
    </div>
  );
};

export default AnnouncementManager;