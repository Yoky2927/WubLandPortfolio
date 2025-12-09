import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

// Create axios instance with base config
const httpClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login-register';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Notifications service client (different base URL)
const notificationsClient = axios.create({
  baseURL: API_CONFIG.NOTIFICATIONS_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

notificationsClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Analytics service client
const analyticsClient = axios.create({
  baseURL: API_CONFIG.ANALYTICS_URL,
  timeout: 10000,
});

analyticsClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Chat service client
const chatClient = axios.create({
  baseURL: API_CONFIG.CHAT_URL,
  timeout: 10000,
});

chatClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Export all clients
export {
  httpClient,
  notificationsClient,
  analyticsClient,
  chatClient
};