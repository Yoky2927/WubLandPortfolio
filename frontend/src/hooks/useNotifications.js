import { useState, useCallback, useEffect } from 'react';
import { notificationsClient } from '../services/http.service';
import socketService from '../services/socket.service';
import { API_CONFIG } from '../config/api.config';

export const useNotifications = (userId, initialCount = 0) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationsClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS);
      
      if (response.data.success) {
        const data = response.data.data || [];
        setNotifications(data);
        
        // Calculate unread count
        const unread = data.filter(n => !n.is_read).length;
        setNotificationCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
      // Optionally show toast notification here
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsClient.get(API_CONFIG.ENDPOINTS.UNREAD_COUNT);
      if (response.data.success) {
        setNotificationCount(response.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsClient.put(
        API_CONFIG.ENDPOINTS.MARK_READ.replace('{id}', notificationId)
      );
      
      // Update local state optimistically
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, is_read: true } : n
      ));
      setNotificationCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Revert optimistic update on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsClient.put(API_CONFIG.ENDPOINTS.MARK_ALL_READ);
      
      // Update local state optimistically
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setNotificationCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationsClient.delete(
        `${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${notificationId}`
      );
      
      // Update local state optimistically
      const notificationToDelete = notifications.find(n => n._id === notificationId);
      if (notificationToDelete && !notificationToDelete.is_read) {
        setNotificationCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
      fetchNotifications();
    }
  }, [notifications]);

  // Setup socket listeners
  useEffect(() => {
    if (!userId) return;

    // Connect socket
    socketService.connect(userId);

    // Listen for new notifications
    const unsubscribeNew = socketService.addListener('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.is_read) {
        setNotificationCount(prev => prev + 1);
      }
    });

    // Listen for count updates
    const unsubscribeCount = socketService.addListener('notification:count', (data) => {
      if (data.unreadCount !== undefined) {
        setNotificationCount(data.unreadCount);
      }
    });

    // Listen for read updates
    const unsubscribeRead = socketService.addListener('notification:read', (data) => {
      setNotifications(prev => prev.map(n => 
        n._id === data.notificationId ? { ...n, is_read: true } : n
      ));
      if (data.unreadCount !== undefined) {
        setNotificationCount(data.unreadCount);
      }
    });

    // Cleanup
    return () => {
      unsubscribeNew();
      unsubscribeCount();
      unsubscribeRead();
    };
  }, [userId]);

  return {
    notifications,
    notificationCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setNotifications,
    setNotificationCount
  };
};