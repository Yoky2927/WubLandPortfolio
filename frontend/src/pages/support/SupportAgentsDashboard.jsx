// File: src/pages/SupportAgentsDashboard.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, RadialLinearScale, Filler, ArcElement } from 'chart.js';
import { Line, Radar, Doughnut } from 'react-chartjs-2';
import {
  Users, Home, MessageSquare, HelpCircle, Flag, BarChart3,
  Settings, LogOut, Eye, Edit, Search, DollarSign, CreditCard,
  Activity, Menu, X, Trash2, Bell, Globe, CheckCircle, Clock,
  AlertCircle, Filter, Plus, FileText, ThumbsUp, ThumbsDown,
  Star, User, Video, Play, Shield, Send, TrendingUp, ChevronRight,
  FolderOpen, FileCheck, FileX, Sparkles, Info, Loader as LoaderIcon,
  ExternalLink, Download, Calendar, Archive, RefreshCw, FileSpreadsheet,
  FileBarChart, ListTodo, BookOpen, MessageCircle, FileWarning,
  ChevronLeft, ShieldCheck, ShieldOff, UploadCloud, Mail, Phone,
  MapPin, FileUp, FileDown, FilePlus, FileMinus, UserCircle,
  Building2, FileType, Image, FileJson, FileCode, Lock, Unlock,
  EyeOff, FileSearch, ArrowRight, AlertTriangle, Upload, File,
  Award, Building, Landmark, Banknote, Camera, FileArchive,
  FileClock, FileQuestion, FileKey, FileDigit, FileSignature,
  CreditCard as Card, FileImage, RotateCw,ShieldAlert 
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import StaticProfileAvatar from '../../components/StaticProfileAvatar';
import ProfileAvatar from '../../components/ProfileAvatar';
import ProfilePictureModal from '../../components/ProfilePictureModal';
import Loader from '../../components/Loader';
import ChatApp from '../../components/ChatApp';
import { directApi } from '../../utils/api.endpoints';
import { toast } from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, RadialLinearScale, Filler, ArcElement);

const getTimeAgo = (timestamp) => {
  if (!timestamp) return "Just now";
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

const TicketModal = ({ isOpen, onClose, ticket, theme, onUpdateTicket, currentUser }) => {
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState(ticket?.status || "open");
  const [priority, setPriority] = useState(ticket?.priority || "medium");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setPriority(ticket.priority);
    }
  }, [ticket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!response.trim()) {
      toast.error("Please enter a response");
      return;
    }

    setIsLoading(true);
    setUploadProgress(10);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    try {
      await onUpdateTicket(ticket.id, { 
        response, 
        status, 
        priority, 
        respondedAt: new Date().toISOString() 
      });
      
      setUploadProgress(100);
      setTimeout(() => {
        setResponse("");
        setUploadProgress(0);
        onClose();
        toast.success("Response sent successfully!");
      }, 500);
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to send response");
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
    }
  };

  if (!isOpen || !ticket) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl rounded-3xl shadow-2xl ${isDark
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-amber-800/30'
          : 'bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200'
          } border-2 transition-all duration-500 animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        {/* Header with gradient */}
        <div className={`p-6 border-b ${isDark
          ? 'border-amber-800/30 bg-gradient-to-r from-amber-900/20 via-amber-800/20 to-amber-900/20'
          : 'border-amber-200 bg-gradient-to-r from-amber-50/80 via-amber-100/50 to-amber-50/80'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isDark
                ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20'
                : 'bg-gradient-to-br from-blue-100 to-blue-200'
                }`}>
                <MessageCircle className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Support Ticket #{ticket.id}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-sm font-inter ${isDark ? 'text-blue-300/80' : 'text-blue-700/80'}`}>
                      {ticket.user_first_name} {ticket.user_last_name}
                    </span>
                  </div>
                  <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-blue-600' : 'bg-blue-800'}`} />
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-sm font-inter ${isDark ? 'text-blue-300/80' : 'text-blue-700/80'}`}>
                      {getTimeAgo(ticket.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl transition-all duration-300 ${isDark
                ? 'hover:bg-amber-900/30 hover:scale-105 text-amber-300'
                : 'hover:bg-amber-100 hover:scale-105 text-amber-600'
                } active:scale-95`}
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Ticket Info Card */}
            <div className={`p-5 rounded-2xl border ${isDark
              ? 'bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-800/30'
              : 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200'
              }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCircle className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>User:</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>
                      {ticket.user_first_name} {ticket.user_last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Email:</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{ticket.user_email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Category:</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{ticket.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Created:</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{getTimeAgo(ticket.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Selection */}
            <div>
              <label className={`block text-sm font-medium mb-3 font-inter ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                Priority Level
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: "low", label: "Low", color: "bg-gradient-to-r from-green-500 to-emerald-600", icon: CheckCircle },
                  { value: "medium", label: "Medium", color: "bg-gradient-to-r from-yellow-500 to-amber-600", icon: AlertCircle },
                  { value: "high", label: "High", color: "bg-gradient-to-r from-orange-500 to-red-600", icon: AlertTriangle },
                  { value: "urgent", label: "Urgent", color: "bg-gradient-to-r from-red-500 to-rose-700", icon: ShieldAlert }
                ].map((level) => {
                  const Icon = level.icon;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setPriority(level.value)}
                      className={`p-4 rounded-xl text-white text-sm font-medium font-inter transition-all duration-300 ${priority === level.value
                        ? `${level.color} ring-2 ring-offset-2 ${isDark ? 'ring-white/50' : 'ring-gray-900/30'} shadow-lg`
                        : `${level.color} opacity-80 hover:opacity-100 hover:shadow-lg`
                        } flex flex-col items-center gap-2`}
                    >
                      <Icon className="w-5 h-5" />
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Issue Description */}
            <div>
              <h4 className={`font-medium mb-3 font-inter flex items-center gap-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                <FileText className="w-5 h-5" />
                Issue Description
              </h4>
              <div className={`p-4 rounded-xl ${isDark
                ? 'bg-gray-800/50 border border-gray-700/50'
                : 'bg-gray-50 border border-gray-200'
                }`}>
                <p className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Previous Responses */}
            {ticket.responses && ticket.responses.length > 0 && (
              <div>
                <h4 className={`font-medium mb-3 font-inter flex items-center gap-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  <MessageCircle className="w-5 h-5" />
                  Previous Responses
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {ticket.responses.map((response, index) => (
                    <div key={index} className={`p-4 rounded-xl border ${isDark
                      ? 'bg-gray-800/30 border-gray-700/50'
                      : 'bg-gray-50 border-gray-200'
                      }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <UserCircle className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                          <span className={`font-medium font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                            {response.responder_username}
                          </span>
                        </div>
                        <span className={`text-xs font-inter ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {getTimeAgo(response.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {response.response_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-3 font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Your Response
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows="4"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-inter ${isDark
                    ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  placeholder="Type your response to the user..."
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Update Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-inter ${isDark
                    ? 'bg-gray-800/50 border-gray-700/50 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Upload Progress */}
              {(isLoading || uploadProgress > 0) && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      {isLoading ? 'Sending response...' : 'Response sent!'}
                    </span>
                    <span className={`text-sm font-bold font-inter ${isDark ? 'text-amber-800' : 'text-amber-600'}`}>
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className={`h-3 rounded-full ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'} overflow-hidden`}>
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-amber-200 dark:border-amber-800/30">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className={`flex-1 py-3.5 rounded-xl border font-medium font-inter transition-all duration-300 ${isDark
                    ? 'border-amber-800/50 hover:bg-amber-900/30 text-amber-300 hover:scale-[1.02]'
                    : 'border-amber-300 hover:bg-amber-100 text-amber-700 hover:scale-[1.02]'
                    } disabled:opacity-50 active:scale-95`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !response.trim()}
                  className={`flex-1 py-3.5 rounded-xl font-semibold font-inter flex items-center justify-center gap-2 transition-all duration-300 ${isLoading
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-xl hover:scale-[1.02]'
                    } shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <LoaderIcon className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Response
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const FAQModal = ({ isOpen, onClose, article, theme, onSaveArticle, currentUser }) => {
  const [formData, setFormData] = useState({
    title: article?.title || "",
    content: article?.content || "",
    category: article?.category || "general",
    video_url: article?.video_url || ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        category: article.category,
        video_url: article.video_url || ""
      });
    }
  }, [article]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await onSaveArticle(article?.id, formData);
      toast.success(article ? "FAQ updated successfully!" : "FAQ created successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast.error("Failed to save FAQ");
    } finally {
      setIsLoading(false);
    }
  };

  const extractYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  if (!isOpen) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl rounded-3xl shadow-2xl ${isDark
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-amber-800/30'
          : 'bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200'
          } border-2 transition-all duration-500 animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        {/* Header with gradient */}
        <div className={`p-6 border-b ${isDark
          ? 'border-amber-800/30 bg-gradient-to-r from-green-900/20 via-green-800/20 to-green-900/20'
          : 'border-amber-200 bg-gradient-to-r from-green-50/80 via-green-100/50 to-green-50/80'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isDark
                ? 'bg-gradient-to-br from-green-500/20 to-green-600/20'
                : 'bg-gradient-to-br from-green-100 to-green-200'
                }`}>
                <BookOpen className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {article ? "Edit FAQ" : "Create New FAQ"}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-sm font-inter ${isDark ? 'text-green-300/80' : 'text-green-700/80'}`}>
                      {article ? "Edit existing article" : "Create new help article"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl transition-all duration-300 ${isDark
                ? 'hover:bg-amber-900/30 hover:scale-105 text-amber-300'
                : 'hover:bg-amber-100 hover:scale-105 text-amber-600'
                } active:scale-95`}
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className={`block text-sm font-medium mb-3 font-inter ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-inter ${isDark
                  ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                required
                placeholder="Enter FAQ title"
              />
            </div>

            {/* Category */}
            <div>
              <label className={`block text-sm font-medium mb-3 font-inter ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-inter ${isDark
                  ? 'bg-gray-800/50 border-gray-700/50 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
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

            {/* Video URL */}
            <div>
              <label className={`block text-sm font-medium mb-3 font-inter ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                YouTube Video URL (Optional)
              </label>
              <div className={`p-6 border-2 border-dashed rounded-2xl text-center ${isDark
                ? 'border-gray-600/50 bg-gray-800/30'
                : 'border-gray-300 bg-gray-50'
                }`}>
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className={`text-lg font-medium mb-2 font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Add Videos Here
                </p>
                <p className={`text-sm mb-4 font-inter ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Paste YouTube URL to embed tutorial videos
                </p>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-inter ${isDark
                    ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                />
                {formData.video_url && extractYouTubeId(formData.video_url) && (
                  <div className="mt-6">
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border-2 border-gray-700/50">
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYouTubeId(formData.video_url)}`}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube video"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className={`block text-sm font-medium mb-3 font-inter ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows="8"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-inter ${isDark
                  ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                required
                placeholder="Enter FAQ content..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-amber-200 dark:border-amber-800/30">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`flex-1 py-3.5 rounded-xl border font-medium font-inter transition-all duration-300 ${isDark
                  ? 'border-amber-800/50 hover:bg-amber-900/30 text-amber-300 hover:scale-[1.02]'
                  : 'border-amber-300 hover:bg-amber-100 text-amber-700 hover:scale-[1.02]'
                  } disabled:opacity-50 active:scale-95`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
                className={`flex-1 py-3.5 rounded-xl font-semibold font-inter flex items-center justify-center gap-2 transition-all duration-300 ${isLoading
                  ? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-xl hover:scale-[1.02]'
                  } shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {article ? "Update FAQ" : "Create FAQ"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const FlaggedContentModal = ({ isOpen, onClose, flag, theme, onResolveFlag, currentUser }) => {
  const [action, setAction] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !flag) return null;

  const isDark = theme === "dark";

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!action) {
      toast.error("Please select an action");
      return;
    }

    setIsLoading(true);
    try {
      await onResolveFlag(flag.id, action, adminMessage);
      setAdminMessage("");
      onClose();
      toast.success("Flag resolved successfully!");
    } catch (error) {
      console.error("Error resolving flag:", error);
      toast.error("Failed to resolve flag");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl rounded-3xl shadow-2xl ${isDark
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-amber-800/30'
          : 'bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200'
          } border-2 transition-all duration-500 animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        {/* Header with gradient */}
        <div className={`p-6 border-b ${isDark
          ? 'border-amber-800/30 bg-gradient-to-r from-red-900/20 via-red-800/20 to-red-900/20'
          : 'border-amber-200 bg-gradient-to-r from-red-50/80 via-red-100/50 to-red-50/80'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isDark
                ? 'bg-gradient-to-br from-red-500/20 to-red-600/20'
                : 'bg-gradient-to-br from-red-100 to-red-200'
                }`}>
                <Flag className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Review Flagged Content
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-900'}`} />
                    <span className={`text-sm font-inter ${isDark ? 'text-red-300/80' : 'text-red-900/80'}`}>
                      {flag.severity} Priority
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl transition-all duration-300 ${isDark
                ? 'hover:bg-amber-900/30 hover:scale-105 text-amber-300'
                : 'hover:bg-amber-100 hover:scale-105 text-amber-600'
                } active:scale-95`}
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Flag Info */}
            <div className={`p-5 rounded-2xl border ${isDark
              ? 'bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-800/30'
              : 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-200'
              }`}>
              <h4 className={`font-medium mb-3 font-inter ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                {flag.content_type} Report
              </h4>
              <p className={`text-sm font-inter mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {flag.reason}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>Content ID:</span>
                <span className={`px-3 py-1.5 rounded-lg text-sm font-inter ${isDark
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
                  }`}>
                  {flag.content_id}
                </span>
              </div>
            </div>

            {/* Flag Details */}
            <div className={`p-5 rounded-2xl ${isDark
              ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50'
              : 'bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200'
              }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCircle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    <span className={`font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>Reported By:</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{flag.reported_by_username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    <span className={`font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>Reason:</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{flag.reason}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    <span className={`font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>Severity:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-inter ${flag.severity === "high"
                      ? 'bg-red-100 text-red-800'
                      : flag.severity === "medium"
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                      }`}>
                      {flag.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    <span className={`font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>Reported:</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{getTimeAgo(flag.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-3 font-inter ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                  Action to Take
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-inter ${isDark
                    ? 'bg-gray-800/50 border-gray-700/50 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  required
                >
                  <option value="">Select Action</option>
                  <option value="approve">Approve Content</option>
                  <option value="reject">Reject Content</option>
                  <option value="suspend_user">Suspend User</option>
                  <option value="warn_user">Send Warning</option>
                </select>
              </div>

              {action && (
                <div>
                  <label className={`block text-sm font-medium mb-3 font-inter ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                    Message to Admin
                  </label>
                  <textarea
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    rows="3"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-inter ${isDark
                      ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    placeholder="Add notes for admin review..."
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-amber-200 dark:border-amber-800/30">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className={`flex-1 py-3.5 rounded-xl border font-medium font-inter transition-all duration-300 ${isDark
                    ? 'border-amber-800/50 hover:bg-amber-900/30 text-amber-300 hover:scale-[1.02]'
                    : 'border-amber-300 hover:bg-amber-100 text-amber-700 hover:scale-[1.02]'
                    } disabled:opacity-50 active:scale-95`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !action}
                  className={`flex-1 py-3.5 rounded-xl font-semibold font-inter flex items-center justify-center gap-2 transition-all duration-300 ${isLoading
                    ? 'bg-gradient-to-r from-red-400 to-red-500 text-white'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-xl hover:scale-[1.02]'
                    } shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <LoaderIcon className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Flag className="w-5 h-5" />
                      Submit Action
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewsModal = ({ isOpen, onClose, reviews, theme, currentUser, stats }) => {
  if (!isOpen) return null;

  const isDark = theme === "dark";

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating
          ? "text-yellow-400 fill-yellow-400"
          : isDark ? "text-gray-600" : "text-gray-300"
          }`}
      />
    ));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl rounded-3xl shadow-2xl ${isDark
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-amber-800/30'
          : 'bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200'
          } border-2 transition-all duration-500 animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        {/* Header with gradient */}
        <div className={`p-6 border-b ${isDark
          ? 'border-amber-800/30 bg-gradient-to-r from-yellow-900/20 via-yellow-800/20 to-yellow-900/20'
          : 'border-amber-200 bg-gradient-to-r from-yellow-50/80 via-yellow-100/50 to-yellow-50/80'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isDark
                ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20'
                : 'bg-gradient-to-br from-yellow-100 to-yellow-200'
                }`}>
                <Star className={`w-8 h-8 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Customer Reviews & Feedback
                </h1>
                {stats && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(Math.round(stats.averageRating || 0))}</div>
                      <span className={`text-sm font-inter ${isDark ? 'text-yellow-300/80' : 'text-yellow-700/80'}`}>
                        {stats.averageRating || "0.0"} / 5.0
                      </span>
                    </div>
                    <span className={`text-sm font-inter ${isDark ? 'text-yellow-300/80' : 'text-yellow-700/80'}`}>
                      {stats.totalFeedback || 0} total reviews
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl transition-all duration-300 ${isDark
                ? 'hover:bg-amber-900/30 hover:scale-105 text-amber-300'
                : 'hover:bg-amber-100 hover:scale-105 text-amber-600'
                } active:scale-95`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {reviews.length > 0 ? reviews.map((review) => (
              <div
                key={review.id}
                className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg ${isDark
                  ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-yellow-500/30'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100/50 border-gray-200 hover:border-yellow-300'
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className={`font-semibold font-inter mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {review.user_first_name} {review.user_last_name}
                    </p>
                    <p className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {review.ticket_subject || "General Feedback"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className={`text-xs font-inter ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {getTimeAgo(review.created_at)}
                    </span>
                  </div>
                </div>
                {review.feedback_text && (
                  <p className={`text-sm font-inter mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    "{review.feedback_text}"
                  </p>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-gray-700/30 dark:border-gray-200/30">
                  <span className={`text-xs font-inter ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Responded by: {review.responded_to_by}
                  </span>
                  {review.rating >= 4 && (
                    <span className="flex items-center gap-2 text-green-600 text-xs font-inter">
                      <ThumbsUp className="w-4 h-4" />
                      Positive
                    </span>
                  )}
                  {review.rating <= 2 && (
                    <span className="flex items-center gap-2 text-red-600 text-xs font-inter">
                      <ThumbsDown className="w-4 h-4" />
                      Needs Improvement
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium font-inter mb-2">No reviews yet</p>
                <p className="text-sm font-inter">Customer feedback will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, trend, color, subtitle, theme }) => {
  const isDark = theme === "dark";
  const colorClasses = color.split(" ");

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-500 hover:shadow-xl hover:scale-[1.02] ${isDark
      ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-amber-500/30'
      : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-amber-300'
      }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[0]} ${colorClasses[1]} bg-opacity-10 backdrop-blur-sm`}>
          <Icon className={`w-7 h-7 ${color.replace("bg-", "text-")}`} />
        </div>
        <span className={`text-sm font-medium font-inter px-3 py-1.5 rounded-full ${trend?.includes("+")
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          : trend?.includes("-")
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
          }`}>
          {trend}
        </span>
      </div>
      <h3 className={`text-3xl font-bold font-montserrat mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </h3>
      <p className={`text-sm font-medium font-inter mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {title}
      </p>
      <p className={`text-xs font-inter ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {subtitle}
      </p>
    </div>
  );
};

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
  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [supportAgents, setSupportAgents] = useState([]);
  const [userFeedback, setUserFeedback] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [recentActivities, setRecentActivities] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);

  const navigate = useNavigate();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "am", name: "Amharic", flag: "🇪🇹" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" }
  ];

  const notifications = [
    { id: 1, message: "New high-priority ticket from John Doe", time: "5 min ago", read: false },
    { id: 2, message: "3 new user inquiries waiting", time: "1 hour ago", read: false },
    { id: 3, message: "FAQ 'Payment Issues' needs update", time: "3 hours ago", read: true }
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme === "dark" ? "#fff" : "#374151",
          font: { size: 12, family: "'Inter', sans-serif" }
        }
      },
      title: {
        display: true,
        text: "Customer Satisfaction Trend",
        color: theme === "dark" ? "#fff" : "#374151",
        font: { size: 16, weight: "bold", family: "'Montserrat', sans-serif" }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 5,
        grid: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        },
        ticks: {
          color: theme === "dark" ? "#fff" : "#374151",
          stepSize: 1,
          font: { family: "'Inter', sans-serif" }
        },
        title: {
          display: true,
          text: "Rating",
          color: theme === "dark" ? "#fff" : "#374151",
          font: { family: "'Inter', sans-serif" }
        }
      },
      x: {
        grid: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        },
        ticks: {
          color: theme === "dark" ? "#fff" : "#374151",
          font: { family: "'Inter', sans-serif" }
        }
      }
    },
    animation: {
      duration: 2000,
      easing: "easeOutQuart"
    }
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme === "dark" ? "#fff" : "#374151",
          font: { size: 12, family: "'Inter', sans-serif" }
        }
      },
      title: {
        display: true,
        text: "Ticket Distribution by Category",
        color: theme === "dark" ? "#fff" : "#374151",
        font: { size: 16, weight: "bold", family: "'Montserrat', sans-serif" }
      }
    },
    scales: {
      r: {
        angleLines: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        },
        grid: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        },
        pointLabels: {
          color: theme === "dark" ? "#fff" : "#374151",
          font: { size: 11, family: "'Inter', sans-serif" }
        },
        ticks: {
          backdropColor: "transparent",
          color: theme === "dark" ? "#fff" : "#374151",
          stepSize: 1,
          font: { family: "'Inter', sans-serif" }
        },
        beginAtZero: true
      }
    },
    animation: {
      duration: 2000,
      easing: "easeOutQuart"
    }
  };

  const canAssignTickets = () => ["support_lead", "support_admin", "admin", "super_admin"].includes(user?.role);
  const canManageTeam = () => ["support_admin", "admin", "super_admin"].includes(user?.role);
  const canDeleteContent = () => ["support_lead", "support_admin", "admin", "super_admin"].includes(user?.role);
  const canViewAnalytics = () => ["support_lead", "support_admin", "admin", "super_admin"].includes(user?.role);
  const canCreateFAQ = () => ["support_agent", "support_lead", "support_admin", "admin", "super_admin"].includes(user?.role);
  const canResolveFlags = () => ["support_agent", "support_lead", "support_admin", "admin", "super_admin"].includes(user?.role);
  const canViewAllTickets = () => ["support_lead", "support_admin", "admin", "super_admin"].includes(user?.role);

  useEffect(() => {
    const abortController = new AbortController();
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const response = await directApi.getProfile();
        const userData = response.data || response;
        const supportRoles = ["support_agent", "support_lead", "support_admin", "super_admin", "admin"];
        if (!supportRoles.includes(userData.role)) {
          localStorage.removeItem("token");
          navigate("/forbidden");
          return;
        }
        setUser(userData);
        setIsAuthorized(true);
        setIsLoading(false);
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

  const fetchSupportData = async () => {
    try {
      console.log('🔄 Fetching support data...');

      const results = await Promise.allSettled([
        directApi.getTickets().catch(err => {
          console.error('Error fetching tickets:', err);
          return [];
        }),
        directApi.getFAQs().catch(err => {
          console.error('Error fetching FAQs:', err);
          return [];
        }),
        directApi.getFlaggedContent().catch(err => {
          console.error('Error fetching flags:', err);
          return [];
        }),
        directApi.getReviews().catch(err => {
          console.error('Error fetching reviews:', err);
          return [];
        }),
        directApi.getActivities().catch(err => {
          console.error('Error fetching activities:', err);
          return [];
        })
      ]);

      const [ticketsResult, faqsResult, flagsResult, feedbackResult, activitiesResult] = results;

      setTickets(ticketsResult.status === 'fulfilled' ? ticketsResult.value || [] : []);
      setFaqs(faqsResult.status === 'fulfilled' ? faqsResult.value || [] : []);
      setFlaggedContent(flagsResult.status === 'fulfilled' ? flagsResult.value || [] : []);
      setUserFeedback(feedbackResult.status === 'fulfilled' ? feedbackResult.value || [] : []);
      setReviews(feedbackResult.status === 'fulfilled' ? feedbackResult.value || [] : []);
      setRecentActivities(activitiesResult.status === 'fulfilled' ? (activitiesResult.value?.slice(0, 10) || []) : []);

      const reviewsData = feedbackResult.status === 'fulfilled' ? feedbackResult.value || [] : [];
      if (reviewsData.length > 0) {
        const averageRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewsData.length;
        setReviewStats({
          averageRating: averageRating.toFixed(1),
          totalFeedback: reviewsData.length
        });
      } else {
        setReviewStats({ averageRating: "0.0", totalFeedback: 0 });
      }

      try {
        const agentsResponse = await directApi.getUsers().catch(() => ({ data: [] }));
        const supportAgentsList = agentsResponse?.data?.filter(u =>
          ["support_agent", "support_lead", "support_admin", "super_admin", "admin"].includes(u.role)
        ) || [user];
        setSupportAgents(supportAgentsList);
      } catch (error) {
        console.error("Error fetching support agents:", error);
        setSupportAgents([user]);
      }

      console.log('✅ Support data loaded successfully');

    } catch (error) {
      console.error('Error fetching support data:', error);
      setTickets([]);
      setFaqs([]);
      setFlaggedContent([]);
      setReviews([]);
      setRecentActivities([]);
      setSupportAgents([]);
      setReviewStats({ averageRating: "0.0", totalFeedback: 0 });
    }
  };

  useEffect(() => {
    if (!isAuthorized || !user) return;
    const abortController = new AbortController();
    fetchSupportData();
    const socket = io("http://localhost:5005");
    socket.on("new_ticket", (ticket) => {
      setTickets((prev) => [ticket, ...prev]);
      setRecentActivities((prev) => [{
        id: Date.now(),
        type: "ticket",
        action: "New Support Ticket",
        detail: `New ${ticket.priority} priority ticket from ${ticket.user_name}`,
        time: new Date().toLocaleString(),
        icon: "MessageSquare",
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
    });
    socket.on("faq_updated", (faq) => {
      setRecentActivities((prev) => [{
        id: Date.now(),
        type: "faq",
        action: "FAQ Updated",
        detail: `Updated FAQ: ${faq.title}`,
        time: new Date().toLocaleString(),
        icon: "FileText",
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
    });
    socket.on("new_feedback", (feedback) => {
      setReviews((prev) => [feedback, ...prev]);
      setRecentActivities((prev) => [{
        id: Date.now(),
        type: "feedback",
        action: "New Customer Review",
        detail: `Received ${feedback.rating}-star review from ${feedback.user_name}`,
        time: new Date().toLocaleString(),
        icon: "Star",
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
    });
    return () => {
      abortController.abort();
      socket.disconnect();
    };
  }, [isAuthorized, user]);

  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      await directApi.updateTicket(ticketId, {
        response: updates.response,
        status: updates.status,
        priority: updates.priority,
        responder_username: user.username,
      });
      await fetchSupportData();
      setRecentActivities((prev) => [{
        id: Date.now(),
        type: "ticket",
        action: "Ticket Response Sent",
        detail: `Responded to ${updates.priority} priority ticket #${ticketId}`,
        time: new Date().toLocaleString(),
        icon: "MessageSquare",
        timestamp: new Date(),
        agent: user.username
      }, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error("Error updating ticket:", error);
      setTickets((prev) => prev.map((ticket) => ticket.id === ticketId ? { ...ticket, ...updates } : ticket));
    }
  };

  const handleSaveFAQ = async (faqId, data) => {
    try {
      if (faqId) {
        await directApi.updateFAQ(faqId, { ...data, author_username: user.username });
      } else {
        await directApi.createFAQ({ ...data, author_username: user.username });
      }
      await fetchSupportData();
      setRecentActivities((prev) => [{
        id: Date.now(),
        type: "faq",
        action: faqId ? "FAQ Updated" : "New FAQ Created",
        detail: `${faqId ? "Updated" : "Created"} FAQ: ${data.title}`,
        time: new Date().toLocaleString(),
        icon: "FileText",
        timestamp: new Date(),
        agent: user.username
      }, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error("Error saving FAQ:", error);
      if (faqId) {
        setFaqs((prev) => prev.map((faq) => faq.id === faqId ? { ...faq, ...data, lastUpdated: new Date().toISOString() } : faq));
      } else {
        const newFAQ = {
          id: Math.max(...faqs.map((f) => f.id || 0), 0) + 1,
          ...data,
          views: 0,
          helpful_votes: 0,
          lastUpdated: new Date().toISOString()
        };
        setFaqs((prev) => [newFAQ, ...prev]);
      }
    }
  };

  const handleDeleteFAQ = async (faqId) => {
    try {
      await directApi.deleteFAQ(faqId);
      await fetchSupportData();
      toast.success("FAQ deleted successfully!");
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      setFaqs((prev) => prev.filter((faq) => faq.id !== faqId));
    }
  };

  const handleResolveFlaggedContent = async (flagId, action, adminMessage) => {
    try {
      await directApi.resolveFlag(flagId, {
        action,
        admin_message: adminMessage,
        resolved_by: user.username
      });
      await fetchSupportData();
      setRecentActivities((prev) => [{
        id: Date.now(),
        type: "flag",
        action: "Flagged Content Resolved",
        detail: `Resolved flagged content #${flagId} (${action})`,
        time: new Date().toLocaleString(),
        icon: "Flag",
        timestamp: new Date(),
        agent: user.username
      }, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error("Error resolving flagged content:", error);
      setFlaggedContent((prev) => prev.map((flag) => flag.id === flagId ? { ...flag, status: "resolved" } : flag));
    }
  };

  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode);
    setShowLanguagePicker(false);
    toast.success(`Language changed to ${languages.find(l => l.code === languageCode)?.name}`);
  };

  const handleProfilePictureUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      await directApi.uploadProfilePicture(formData);
      const updatedProfile = await directApi.getProfile();
      setUser(updatedProfile.data || updatedProfile);
      setShowProfileModal(false);
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to update profile picture");
    }
  };

  const filteredTickets = useMemo(() =>
    tickets.filter((ticket) =>
      (filterStatus === "all" || ticket.status === filterStatus) &&
      (ticket.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user_last_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [tickets, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status === "open").length;
    const resolvedToday = tickets.filter((t) => t.status === "resolved" && new Date(t.resolved_at || t.respondedAt).toDateString() === new Date().toDateString()).length;
    const averageRating = reviews.length > 0 ? (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1) : "0.0";
    const helpfulFaqs = faqs.reduce((sum, faq) => sum + (faq.helpful_votes || faq.helpful || 0), 0);
    const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
    const satisfactionRate = reviews.length > 0 ? Math.round((reviews.filter((r) => r.rating >= 3).length / reviews.length) * 100) : 0;
    return {
      totalTickets,
      openTickets,
      resolvedToday,
      averageRating,
      supportAgentsCount: supportAgents.length,
      helpfulFaqs,
      avgResponseTime: "2.5h",
      positiveReviews,
      satisfactionRate: `${satisfactionRate}%`,
      totalReviews: reviews.length
    };
  }, [tickets, reviews, supportAgents, faqs]);

  const chartData = useMemo(() => {
    const satisfactionData = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [{
        label: "Customer Rating",
        data: [3.2, 3.8, 4.2, 4.5, 4.3, parseFloat(stats.averageRating) || 4.6],
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgb(245, 158, 11)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(245, 158, 11)",
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    };
    const ticketDistribution = {
      labels: ["Account", "Payment", "Technical", "Property", "Safety", "General"],
      datasets: [{
        label: "Tickets by Category",
        data: [
          tickets.filter((t) => t.category === "account").length,
          tickets.filter((t) => t.category === "payment").length,
          tickets.filter((t) => t.category === "technical").length,
          tickets.filter((t) => t.category === "property").length,
          tickets.filter((t) => t.category === "safety").length,
          tickets.filter((t) => t.category === "general").length
        ],
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgb(59, 130, 246)",
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(59, 130, 246)",
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    };
    return { satisfactionData, ticketDistribution };
  }, [tickets, stats.averageRating]);

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating
          ? "text-yellow-400 fill-yellow-400"
          : theme === "dark" ? "text-gray-600" : "text-gray-300"
          }`}
      />
    ));

  const renderContent = () => {
    if (isLoading) return <Loader />;
    const isDark = theme === "dark";

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="mx-0 space-y-6">
            {/* Welcome Banner */}
            <div className={`p-8 rounded-3xl border text-center ${isDark
              ? 'bg-gradient-to-r from-gray-800/50 via-gray-900/50 to-gray-800/50 border-gray-700/50'
              : 'bg-gradient-to-r from-white via-amber-50/50 to-white border-amber-200'
              }`}>
              <h1 className={`text-3xl font-bold font-montserrat mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Welcome back, {user?.first_name}!
              </h1>
              <p className={`text-lg font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Here's your support dashboard overview.
              </p>
            </div>

            {/* Stats Grid */}
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
                icon={Star}
                title="Customer Rating"
                value={stats.averageRating}
                trend="+0.3"
                color="bg-yellow-500"
                subtitle="out of 5 stars"
                theme={theme}
              />
              <StatCard
                icon={Users}
                title="Support Team"
                value={stats.supportAgentsCount}
                trend="+1"
                color="bg-indigo-500"
                subtitle="Active agents"
                theme={theme}
              />
              <StatCard
                icon={ThumbsUp}
                title="Helpful FAQs"
                value={stats.helpfulFaqs}
                trend="+15%"
                color="bg-green-500"
                subtitle="Positive feedback"
                theme={theme}
              />
              <StatCard
                icon={TrendingUp}
                title="Satisfaction Rate"
                value={stats.satisfactionRate}
                trend="+5%"
                color="bg-purple-500"
                subtitle="happy customers"
                theme={theme}
              />
              <StatCard
                icon={Clock}
                title="Avg Response Time"
                value={stats.avgResponseTime}
                trend="-15%"
                color="bg-blue-500"
                subtitle="Faster responses"
                theme={theme}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`p-6 rounded-3xl border ${isDark
                ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
                : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
                }`}>
                <div className="h-64">
                  <Line options={lineChartOptions} data={chartData.satisfactionData} />
                </div>
              </div>
              <div className={`p-6 rounded-3xl border ${isDark
                ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
                : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
                }`}>
                <div className="h-64">
                  <Radar options={radarChartOptions} data={chartData.ticketDistribution} />
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`p-6 rounded-3xl border ${isDark
                ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
                : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
                }`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-lg font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Recent Tickets
                  </h3>
                  <button
                    onClick={() => setActiveTab("tickets")}
                    className={`text-sm font-inter px-4 py-2 rounded-xl transition-all ${isDark
                      ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-100'
                      }`}
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {tickets.slice(0, 5).map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${isDark
                        ? 'bg-gray-800/30 border-gray-700/50 hover:border-blue-500/30'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium font-inter mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {ticket.subject}
                          </p>
                          <p className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {ticket.user_first_name} {ticket.user_last_name} • {getTimeAgo(ticket.created_at)}
                          </p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-inter ${ticket.priority === "urgent"
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : ticket.priority === "high"
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            : ticket.priority === "medium"
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-6 rounded-3xl border ${isDark
                ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
                : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
                }`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-lg font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Recent Activities
                  </h3>
                  <span className={`text-sm font-inter px-3 py-1.5 rounded-full ${isDark
                    ? 'bg-blue-900/30 text-blue-300'
                    : 'bg-blue-100 text-blue-800'
                    }`}>
                    Last 7 Days
                  </span>
                </div>
                {recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${isDark
                          ? 'bg-gray-800/30 border-gray-700/50 hover:border-amber-500/30'
                          : 'bg-gray-50 border-gray-200 hover:border-amber-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isDark
                              ? 'bg-blue-900/30'
                              : 'bg-blue-100'
                              }`}>
                              {activity.activity_type?.includes("ticket") ? (
                                <MessageSquare className={`w-5 h-5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                              ) : activity.activity_type?.includes("article") ? (
                                <FileText className={`w-5 h-5 ${isDark ? 'text-green-300' : 'text-green-600'}`} />
                              ) : activity.activity_type?.includes("flag") ? (
                                <Flag className={`w-5 h-5 ${isDark ? 'text-red-300' : 'text-red-600'}`} />
                              ) : (
                                <Star className={`w-5 h-5 ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`} />
                              )}
                            </div>
                            <div>
                              <p className={`font-medium text-sm font-inter mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {activity.activity_type?.replace("_", " ") || activity.action}
                              </p>
                              <p className={`text-xs font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {activity.details || activity.detail}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs font-inter ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {getTimeAgo(activity.timestamp || activity.time)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-inter">No recent activities</p>
                  </div>
                )}
              </div>
            </div>

            {/* Team Analytics */}
            {canViewAnalytics() && (
              <div className={`p-6 rounded-3xl border ${isDark
                ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
                : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
                }`}>
                <h3 className={`text-xl font-bold font-montserrat mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Team Analytics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    icon={Users}
                    title="Team Members"
                    value={supportAgents.length}
                    trend="+2"
                    color="bg-blue-500"
                    subtitle="Active support staff"
                    theme={theme}
                  />
                  <StatCard
                    icon={TrendingUp}
                    title="Team Performance"
                    value="94%"
                    trend="+3%"
                    color="bg-green-500"
                    subtitle="Satisfaction rate"
                    theme={theme}
                  />
                  <StatCard
                    icon={Clock}
                    title="Avg Team Response"
                    value="1.8h"
                    trend="-0.5h"
                    color="bg-purple-500"
                    subtitle="Faster responses"
                    theme={theme}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case "tickets":
        return (
          <div className={`p-6 rounded-3xl border ${isDark
            ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
            : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
            }`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <h2 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Support Tickets
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-none min-w-[250px]">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark
                    ? 'text-gray-400'
                    : 'text-gray-600'
                    } w-5 h-5`} />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-inter ${isDark
                      ? 'bg-gray-800/50 text-white border-gray-700/50 placeholder-gray-500'
                      : 'bg-white text-black border-gray-300 placeholder-gray-400'
                      }`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-inter ${isDark
                    ? 'bg-gray-800/50 text-white border-gray-700/50'
                    : 'bg-white text-black border-gray-300'
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

            <div className="overflow-x-auto rounded-xl border border-gray-700/30 dark:border-gray-200/30">
              <table className="w-full">
                <thead>
                  <tr className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <th className="px-6 py-4 text-left font-inter font-medium">Ticket</th>
                    <th className="px-6 py-4 text-left font-inter font-medium">User</th>
                    <th className="px-6 py-4 text-left font-inter font-medium">Priority</th>
                    <th className="px-6 py-4 text-left font-inter font-medium">Status</th>
                    <th className="px-6 py-4 text-left font-inter font-medium">Created</th>
                    <th className="px-6 py-4 text-left font-inter font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`border-t ${isDark
                        ? 'border-gray-700/30 hover:bg-gray-800/30'
                        : 'border-gray-200 hover:bg-gray-50'
                        } transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className={`font-medium font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {ticket.subject}
                          </p>
                          <p className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {ticket.category}
                          </p>
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {ticket.user_first_name} {ticket.user_last_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-inter ${ticket.priority === "urgent"
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : ticket.priority === "high"
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            : ticket.priority === "medium"
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-inter ${ticket.status === "open"
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : ticket.status === "in_progress"
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {getTimeAgo(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTicketModal(true);
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-inter transition-all ${isDark
                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:scale-105'
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

      case "faqs":
        return (
          <div className={`p-6 rounded-3xl border ${isDark
            ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
            : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
            }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                FAQ Section
              </h2>
              {canCreateFAQ() && (
                <button
                  onClick={() => {
                    setSelectedFAQ(null);
                    setShowFAQModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-inter">New FAQ</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`p-5 rounded-2xl border transition-all hover:shadow-xl hover:scale-[1.02] ${isDark
                    ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-green-500/30'
                    : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-green-300'
                    }`}
                >
                  <h3 className={`font-semibold font-inter mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {faq.title}
                  </h3>
                  <p className={`text-sm font-inter mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {faq.content?.substring(0, 100)}...
                  </p>
                  {faq.video_url && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-xs text-blue-500 font-inter">
                        <Video className="w-4 h-4" />
                        Video Tutorial Available
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs mb-4">
                    <span className={`px-3 py-1.5 rounded-lg font-inter ${isDark
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-700'
                      }`}>
                      {faq.category}
                    </span>
                    <div className="flex items-center gap-4 font-inter">
                      <span>{faq.views || 0} views</span>
                      <span>{faq.helpful_votes || 0} helpful</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedFAQ(faq);
                        setShowFAQModal(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-inter transition-all ${isDark
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:scale-105'
                        }`}
                    >
                      Edit
                    </button>
                    {canDeleteContent() && (
                      <button
                        onClick={() => handleDeleteFAQ(faq.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-inter transition-all ${isDark
                          ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
                          : 'bg-red-100 text-red-800 hover:bg-red-200 hover:scale-105'
                          }`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "flags":
        return (
          <div className={`p-6 rounded-3xl border ${isDark
            ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
            : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
            }`}>
            <h2 className={`text-2xl font-bold font-montserrat mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Flagged Content
            </h2>
            <div className="space-y-4">
              {flaggedContent.map((flag) => (
                <div
                  key={flag.id}
                  className={`p-5 rounded-2xl border transition-all hover:shadow-lg ${isDark
                    ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-red-500/30'
                    : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-red-300'
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`font-semibold font-inter mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {flag.content_type} Report
                      </h3>
                      <p className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Reported by {flag.reported_by_username} • {flag.reason}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-inter ${flag.severity === "high"
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : flag.severity === "medium"
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                      {flag.severity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-inter ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {getTimeAgo(flag.created_at)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedFlag(flag);
                          setShowFlagModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-inter hover:bg-blue-700 hover:scale-105 transition-all"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "reviews":
        return (
          <div className={`p-6 rounded-3xl border ${isDark
            ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
            : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
            }`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Customer Reviews
                </h2>
                {reviewStats && (
                  <p className={`mt-2 font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Average rating: <span className="font-semibold">{reviewStats.averageRating}/5</span> from{' '}
                    <span className="font-semibold">{reviewStats.totalFeedback}</span> reviews
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowReviewsModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transition-all"
              >
                <Eye className="w-5 h-5" />
                <span className="font-inter">View All Reviews</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Star}
                title="Average Rating"
                value={reviewStats?.averageRating || "0.0"}
                trend="+0.2"
                color="bg-yellow-500"
                subtitle="out of 5 stars"
                theme={theme}
              />
              <StatCard
                icon={Users}
                title="Total Reviews"
                value={reviewStats?.totalFeedback || 0}
                trend="+12%"
                color="bg-blue-500"
                subtitle="customer feedback"
                theme={theme}
              />
              <StatCard
                icon={ThumbsUp}
                title="Positive Reviews"
                value={reviews.filter((r) => r.rating >= 4).length}
                trend="+8%"
                color="bg-green-500"
                subtitle="4+ stars"
                theme={theme}
              />
              <StatCard
                icon={TrendingUp}
                title="Satisfaction Rate"
                value={`${reviews.length > 0 ? Math.round((reviews.filter((r) => r.rating >= 3).length / reviews.length) * 100) : 0}%`}
                trend="+5%"
                color="bg-purple-500"
                subtitle="happy customers"
                theme={theme}
              />
            </div>
            <div className={`p-6 rounded-2xl border ${isDark
              ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
              : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
              }`}>
              <h3 className={`text-lg font-semibold font-inter mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recent Feedback
              </h3>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className={`p-5 rounded-xl border transition-all hover:scale-[1.01] ${isDark
                      ? 'bg-gray-800/30 border-gray-700/50 hover:border-yellow-500/30'
                      : 'bg-white border-gray-200 hover:border-yellow-300'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className={`font-medium font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {review.user_first_name} {review.user_last_name}
                          </span>
                        </div>
                        {review.feedback_text && (
                          <p className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {review.feedback_text}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-inter ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {getTimeAgo(review.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-inter mb-2">No reviews yet</p>
                    <p className="text-sm font-inter">Customer feedback will appear here as you help users</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "chat":
        return (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border ${isDark
              ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
              }`}>
              <h1 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Support Chat
              </h1>
              <p className={`font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Communicate directly with users through the support system.
              </p>
            </div>
            <ChatApp
              theme={theme}
              user={user}
              isChatMaximized={false}
              setIsChatMaximized={() => { }}
              showUserInfoModal={false}
              setShowUserInfoModal={() => { }}
              setSelectedUser={() => { }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!user || !isAuthorized) return <Loader />;

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen ${isDark
      ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white'
      : 'bg-gradient-to-br from-gray-50 via-amber-50/30 to-gray-50 text-gray-900'
      } flex transition-colors duration-300`}>
      {/* Sidebar */}
      <div className={`fixed lg:static w-72 min-h-screen flex-shrink-0 shadow-xl transform transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${isDark
        ? 'bg-gradient-to-b from-gray-900/80 to-gray-800/80 backdrop-blur-xl border-r border-gray-700/30'
        : 'bg-gradient-to-b from-white/90 to-gray-50/90 backdrop-blur-xl border-r border-gray-200'
        } flex flex-col z-30`}>
        {/* Logo */}
        <div className={`flex items-center gap-4 px-8 py-4 border-b ${isDark
          ? 'border-gray-700/40 bg-gray-900/30'
          : 'border-gray-200'
          }`}>
          <img src="/vectors/smallLogo.svg" alt="WubLand Logo" className="w-16 h-16 md:w-20 md:h-20" />
          <span className="font-bold text-xl md:text-2xl text-amber-500 font-montserrat">WubLand</span>
        </div>

        {/* Profile Section */}
        <div className={`p-6 border-b ${isDark
          ? 'border-gray-700/40 bg-gray-900/30'
          : 'border-gray-200'
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
          <div className="text-center">
            <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user?.first_name} {user?.last_name}
            </p>
            <p className={`text-sm font-inter ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`p-4 flex-1 ${isDark ? 'bg-gray-900/20' : ''}`}>
          <div className="space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "tickets", label: "Support Tickets", icon: MessageSquare },
              { id: "faqs", label: "FAQ Section", icon: HelpCircle },
              { id: "flags", label: "Flagged Content", icon: Flag },
              { id: "reviews", label: "Customer Reviews", icon: Star },
              { id: "chat", label: "Support Chat", icon: MessageSquare }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center rounded-xl px-4 py-3.5 transition-all text-left group ${activeTab === item.id
                  ? isDark
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-white backdrop-blur-sm shadow-lg border border-amber-500/30'
                    : 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-600 shadow-lg border border-amber-300'
                  : isDark
                    ? 'text-amber-200 hover:bg-gray-700/50 backdrop-blur-sm hover:border-amber-800/30 border border-transparent'
                    : 'text-gray-700 hover:bg-gray-100 hover:border-amber-200 border border-transparent'
                  }`}
              >
                <item.icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${activeTab === item.id
                  ? isDark ? 'text-white' : 'text-amber-600'
                  : isDark ? 'text-amber-400' : 'text-gray-600'
                  }`} />
                <span className={`font-inter truncate ${activeTab === item.id
                  ? isDark ? 'text-white' : 'text-amber-600'
                  : isDark ? 'text-amber-400' : 'text-gray-700'
                  }`}>
                  {item.label}
                </span>
                {activeTab === item.id && (
                  <ChevronRight className={`w-4 h-4 ml-auto ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className={`p-4 border-t ${isDark
          ? 'border-gray-700/40 bg-gray-900/30'
          : 'border-gray-200'
          }`}>
          <button
            className={`w-full flex items-center justify-center px-4 py-3 rounded-xl transition-all group ${isDark
              ? 'text-gray-300 hover:bg-gray-700/50 backdrop-blur-sm hover:text-white border border-gray-700/50 hover:border-red-500/30'
              : 'text-gray-600 hover:bg-gray-100 hover:text-red-600 border border-gray-200 hover:border-red-300'
              }`}
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
              toast.success("Logged out successfully!");
            }}
          >
            <LogOut className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
            <span className="font-inter">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className={`flex-shrink-0 border-b ${isDark ? 'border-gray-700/30' : 'border-gray-200'}`}
          style={{
            backgroundImage: `url(${isDark ? "/vectors/TiletDark.svg" : "/vectors/TiletLight.svg"})`,
            backgroundSize: "cover",
            backgroundPosition: "bottom",
            backgroundRepeat: "no-repeat"
          }}>
          <div className="">
            <div className="flex items-center justify-between p-6">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-3 rounded-xl md:hidden ${isDark
                  ? 'hover:bg-gray-700/50 text-white backdrop-blur-sm'
                  : 'hover:bg-white/30 text-gray-900'
                  } transition-colors`}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className={`text-2xl font-bold font-montserrat flex-1 text-center md:text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {activeTab === "dashboard" ? "Support Agent Dashboard" :
                  activeTab === "tickets" ? "Support Tickets" :
                    activeTab === "faqs" ? "FAQ Section" :
                      activeTab === "flags" ? "Flagged Content" :
                        activeTab === "reviews" ? "Customer Reviews" :
                          activeTab === "chat" ? "Support Chat" :
                            activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <div className="flex items-center gap-4">
                {/* Language Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowLanguagePicker(!showLanguagePicker)}
                    className={`p-3 rounded-xl transition-all ${isDark
                      ? 'hover:bg-gray-700/50 text-gray-300 backdrop-blur-sm'
                      : 'hover:bg-white/30 text-gray-600'
                      }`}
                  >
                    <Globe className="w-5 h-5" />
                  </button>
                  {showLanguagePicker && (
                    <div className={`absolute right-0 top-14 w-56 rounded-xl shadow-2xl z-50 backdrop-blur-xl ${isDark
                      ? 'bg-gray-800/90 border border-gray-700'
                      : 'bg-white/90 border border-gray-200'
                      }`}>
                      {languages.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => handleLanguageChange(language.code)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg mx-1 my-1 ${currentLanguage === language.code
                            ? isDark
                              ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300'
                              : 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700'
                            : isDark
                              ? 'hover:bg-gray-700/50 text-gray-300'
                              : 'hover:bg-gray-100/80 text-gray-700'
                            } transition-all`}
                        >
                          <span className="text-xl">{language.flag}</span>
                          <span className="font-inter">{language.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-3 rounded-xl transition-all relative ${isDark
                      ? 'hover:bg-gray-700/50 text-gray-300 backdrop-blur-sm'
                      : 'hover:bg-white/30 text-gray-600'
                      }`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center backdrop-blur-sm">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className={`absolute right-0 top-14 w-80 rounded-xl shadow-2xl z-50 backdrop-blur-xl ${isDark
                      ? 'bg-gray-800/90 border border-gray-700'
                      : 'bg-white/90 border border-gray-200'
                      }`}>
                      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h3 className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Notifications
                        </h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b transition-colors ${isDark
                              ? 'border-gray-700 hover:bg-gray-700/50'
                              : 'border-gray-200 hover:bg-gray-100/80'
                              } ${!notification.read ? 'bg-amber-500/10' : ''}`}
                          >
                            <p className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {notification.message}
                            </p>
                            <p className={`text-xs font-inter mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {notification.time}
                            </p>
                          </div>
                        )) : (
                          <p className={`p-4 text-center font-inter ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                      localStorage.removeItem("token");
                      window.location.href = "/";
                      toast.success("Logged out successfully!");
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
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <main>{renderContent()}</main>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black h-full bg-opacity-50 md:hidden z-20 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Theme Toggle */}
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
      <FAQModal
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
        article={selectedFAQ}
        theme={theme}
        onSaveArticle={handleSaveFAQ}
        currentUser={user}
      />
      <FlaggedContentModal
        isOpen={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        flag={selectedFlag}
        theme={theme}
        onResolveFlag={handleResolveFlaggedContent}
        currentUser={user}
      />
      <ReviewsModal
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        reviews={reviews}
        theme={theme}
        currentUser={user}
        stats={reviewStats}
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