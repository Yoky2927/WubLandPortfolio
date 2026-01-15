// frontend/src/services/http.service.js - FINAL VERSION (No directApiCall)

import { apiCall, api } from '../utils/api.endpoints.js';

// HTTP Client - main API calls using apiCall with endpoint keys
export const httpClient = {
  get: async (endpointKey, params = {}, config = {}) => {
    return apiCall(endpointKey, params, { method: 'GET', ...config });
  },
  
  post: async (endpointKey, data = {}, config = {}) => {
    return apiCall(endpointKey, {}, { method: 'POST', data, ...config });
  },
  
  put: async (endpointKey, params = {}, data = {}, config = {}) => {
    return apiCall(endpointKey, params, { method: 'PUT', data, ...config });
  },
  
  delete: async (endpointKey, params = {}, config = {}) => {
    return apiCall(endpointKey, params, { method: 'DELETE', ...config });
  },
  
  patch: async (endpointKey, params = {}, data = {}, config = {}) => {
    return apiCall(endpointKey, params, { method: 'PATCH', data, ...config });
  },
};

// Analytics Client - uses endpoint keys
export const analyticsClient = {
  getAnalytics: async (brokerId) => {
    return apiCall('BROKER_ANALYTICS', { brokerId });
  },
  
  getStats: async (brokerId) => {
    return apiCall('BROKER_STATS', { brokerId });
  },
  
  getTransactions: async (brokerId) => {
    return apiCall('BROKER_TRANSACTIONS', { brokerId });
  },
};

// Chat Client
export const chatClient = {
  sendMessage: async (data) => {
    return apiCall('SEND_MESSAGE', {}, { data });
  },
  
  getConversations: async (userId) => {
    return apiCall('GET_CONVERSATIONS', { userId });
  },
  
  getMessages: async (conversationId) => {
    // This one uses direct URL — we'll keep it as direct fetch for now
    const response = await fetch(`http://localhost:5001/api/messages/conversation/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return await response.json();
  },
};

// Notifications Client - uses endpoint keys when possible
export const notificationsClient = {
  get: async (endpointKey, params = {}, config = {}) => {
    return apiCall(endpointKey, params, { method: 'GET', ...config });
  },
  
  put: async (endpointKey, data = {}, config = {}) => {
    return apiCall(endpointKey, {}, { method: 'PUT', data, ...config });
  },
  
  post: async (endpointKey, data = {}, config = {}) => {
    return apiCall(endpointKey, {}, { method: 'POST', data, ...config });
  },
  
  delete: async (endpointKey, config = {}) => {
    return apiCall(endpointKey, {}, { method: 'DELETE', ...config });
  }
};

// For backward compatibility
export const httpService = httpClient;

export default { 
  httpClient, 
  analyticsClient, 
  chatClient, 
  notificationsClient,
  httpService 
};