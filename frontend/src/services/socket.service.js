import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect(userId) {
    if (!userId) {
      console.warn('SocketService: No userId provided');
      return;
    }

    if (this.socket && this.isConnected) {
      console.log('SocketService: Already connected');
      return;
    }

    try {
      // Clean up existing connection if any
      if (this.socket) {
        this.disconnect();
      }

      // Create new connection with authentication
      const token = localStorage.getItem('token');
      this.socket = io(API_CONFIG.NOTIFICATIONS_URL, {
        query: { userId, token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.setupEventHandlers();
      
    } catch (error) {
      console.error('SocketService: Connection error', error);
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('SocketService: Connected to server');
      this.isConnected = true;
      this.notifyListeners('connect', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('SocketService: Disconnected', reason);
      this.isConnected = false;
      this.notifyListeners('disconnect', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketService: Connection error', error);
      this.notifyListeners('connect_error', { error });
    });

    this.socket.on('newNotification', (notification) => {
      console.log('SocketService: New notification received', notification);
      this.notifyListeners('newNotification', notification);
    });

    this.socket.on('notification:count', (data) => {
      console.log('SocketService: Notification count update', data);
      this.notifyListeners('notification:count', data);
    });

    this.socket.on('notification:read', (data) => {
      console.log('SocketService: Notification read update', data);
      this.notifyListeners('notification:read', data);
    });
  }

  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.removeListener(event, callback);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`SocketService: Error in listener for ${event}`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('SocketService: Disconnected');
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;