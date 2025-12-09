import React, { useState, useEffect } from 'react';
import { Bell, Check, X, ExternalLink, AlertCircle, Info, CheckCircle, Mail, Calendar, UserPlus, DollarSign, MessageSquare, Eye } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import ErrorBoundary from './ErrorBoundary';
import Toast from './Toast';

const NotificationsPanel = ({ 
  isOpen, 
  onClose, 
  theme, 
  unreadCount, 
  setUnreadCount,
  userId 
}) => {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unread', 'read'
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  // Use the custom notifications hook
  const {
    notifications,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications(userId, unreadCount);

  // Update parent unread count when notifications change
  useEffect(() => {
    if (setUnreadCount) {
      const unread = notifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    }
  }, [notifications, setUnreadCount]);

  // Show error toast if fetch fails
  useEffect(() => {
    if (error) {
      setToast({
        show: true,
        message: error,
        type: 'error'
      });
    }
  }, [error]);

  // Filter notifications based on active filter
  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'unread') return !notification.is_read;
    if (activeFilter === 'read') return notification.is_read;
    return true; // 'all'
  });

  // Format timestamp
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'user':
        return <UserPlus className="w-5 h-5 text-amber-500" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get notification background color
  const getNotificationBgColor = (isRead, type) => {
    if (!isRead) {
      return theme === 'dark' 
        ? 'bg-gradient-to-r from-amber-900/20 to-amber-800/10 border-l-4 border-amber-500'
        : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-l-4 border-amber-400';
    }
    
    return theme === 'dark' 
      ? 'bg-gray-800/50 border-l-4 border-gray-600'
      : 'bg-white border-l-4 border-gray-200';
  };

  // Get notification text color
  const getNotificationTextColor = (isRead) => {
    if (!isRead) {
      return theme === 'dark' ? 'text-white' : 'text-gray-900';
    }
    return theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  };

  // Fetch notifications on open
  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications, userId]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
      setToast({
        show: true,
        message: 'Failed to mark notification as read',
        type: 'error'
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      setToast({
        show: true,
        message: 'Failed to mark all notifications as read',
        type: 'error'
      });
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
    } catch (err) {
      setToast({
        show: true,
        message: 'Failed to delete notification',
        type: 'error'
      });
    }
  };

  return (
    <ErrorBoundary>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      
      {/* Notifications Panel */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-96 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className={`h-full flex flex-col shadow-xl border-l ${
          theme === 'dark' 
            ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-gray-700' 
            : 'bg-gradient-to-b from-white via-gray-50 to-white border-gray-200'
        }`}>
          
          {/* Header */}
          <div className={`p-6 border-b ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  theme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100'
                }`}>
                  <Bell className={`w-5 h-5 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Notifications
                  </h2>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {unreadCount} unread • {notifications.length} total
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 mt-4 p-1 rounded-lg bg-gray-200/50 dark:bg-gray-700/50">
              {['all', 'unread', 'read'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeFilter === filter
                      ? theme === 'dark'
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'bg-amber-500 text-white shadow-lg'
                      : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className={`text-sm font-medium transition-colors ${
                  unreadCount === 0
                    ? theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    : theme === 'dark' 
                    ? 'text-amber-400 hover:text-amber-300' 
                    : 'text-amber-600 hover:text-amber-700'
                }`}
              >
                <Check className="w-4 h-4 inline mr-1" />
                Mark all as read
              </button>
              <button
                onClick={fetchNotifications}
                className={`text-sm font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-1" />
                Refresh
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading notifications...
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className={`p-4 rounded-full mb-4 ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Bell className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  No notifications
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activeFilter === 'all' 
                    ? "You're all caught up!" 
                    : `No ${activeFilter} notifications found`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 rounded-xl transition-all duration-200 hover:shadow-lg relative ${
                      getNotificationBgColor(notification.is_read, notification.type)
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Notification Icon */}
                      <div className={`p-2 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-semibold mb-1 truncate ${
                            getNotificationTextColor(notification.is_read)
                          }`}>
                            {notification.title}
                          </h4>
                          <span className={`text-xs whitespace-nowrap ml-2 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>
                        <p className={`text-sm mb-2 ${
                          notification.is_read 
                            ? theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                                theme === 'dark'
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Mark as read
                            </button>
                          )}
                          {notification.link && (
                            <a
                              href={notification.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-xs px-3 py-1 rounded-lg inline-flex items-center gap-1 transition-colors ${
                                theme === 'dark'
                                  ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-800/40'
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              }`}
                            >
                              View
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification._id)}
                            className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                              theme === 'dark'
                                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                                : 'text-gray-600 hover:text-red-600 hover:bg-gray-200'
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Unread indicator dot */}
                    {!notification.is_read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`p-4 border-t ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing {filteredNotifications.length} of {notifications.length}
                </p>
              </div>
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification for Errors */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
        theme={theme}
      />
    </ErrorBoundary>
  );
};

export default NotificationsPanel;