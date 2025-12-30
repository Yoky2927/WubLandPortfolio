// frontend/src/config/api.config.js - FIXED VERSION
import { API_ENDPOINTS } from '../utils/api.endpoints';
import { apiClient } from '../utils/api.client';

const API_CONFIG = {
  // Base URLs - these are the default URLs
  BASE_URL: 'http://localhost:5000',
  USER_URL: 'http://localhost:5000',
  PROPERTY_URL: 'http://localhost:5002',
  COMMUNICATION_URL: 'http://localhost:5001',
  TRANSACTION_URL: 'http://localhost:5006',
  SUPPORT_URL: 'http://localhost:5005',
  TODO_URL: 'http://localhost:5003',
  ANALYSIS_URL: 'http://localhost:5004',
  REGISTRY_URL: 'http://localhost:5008',
  NOTIFICATIONS_URL: 'http://localhost:5001',

  // Get service URL by service name
  getServiceUrl: (service) => {
    const urls = {
      user: 'http://localhost:5000',
      property: 'http://localhost:5002',
      communication: 'http://localhost:5001',
      transaction: 'http://localhost:5006',
      support: 'http://localhost:5005',
      todo: 'http://localhost:5003',
      analysis: 'http://localhost:5004',
      registry: 'http://localhost:5008'
    };
    return urls[service] || 'http://localhost:5000';
  },

  // Main method to get URL for an endpoint
  getUrl: (endpointKey, params = {}) => {
    const endpoint = API_ENDPOINTS[endpointKey];
    
    if (!endpoint) {
      console.error(`❌ Unknown endpoint key: ${endpointKey}`);
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }
    
    const { service, path: pathTemplate } = endpoint;
    const baseUrl = API_CONFIG.getServiceUrl(service);
    
    if (!pathTemplate) {
      console.error(`❌ Missing path template for endpoint: ${endpointKey}`);
      return baseUrl;
    }
    
    // Replace path parameters
    let path = pathTemplate;
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      if (path.includes(placeholder)) {
        path = path.replace(placeholder, params[key]);
      }
    });
    
    const fullUrl = `${baseUrl}${path}`;
    console.log(`🔗 Built URL for ${endpointKey}: ${fullUrl}`);
    return fullUrl;
  },

  // Helper to make API calls directly (using apiClient)
  call: async (endpointKey, params = {}, options = {}) => {
    const endpoint = API_ENDPOINTS[endpointKey];
    
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }
    
    const { service, path: pathTemplate, method } = endpoint;
    
    // Replace path parameters
    let path = pathTemplate;
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      if (path.includes(placeholder)) {
        path = path.replace(placeholder, params[key]);
      }
    });
    
    console.log(`📡 API Call [${service}]: ${method} ${path}`, { params, options });
    
    // Use apiClient for the request
    try {
      const result = await apiClient.call(service, path, {
        method,
        ...options,
        data: options.data || (method !== 'GET' ? params : undefined)
      });
      return result;
    } catch (error) {
      console.error(`❌ API Call failed for ${endpointKey}:`, error);
      throw error;
    }
  },

  // Shortcut methods
  get: async (endpointKey, params = {}, options = {}) => {
    return API_CONFIG.call(endpointKey, params, { ...options, method: 'GET' });
  },

  post: async (endpointKey, data = {}, options = {}) => {
    return API_CONFIG.call(endpointKey, {}, { ...options, method: 'POST', data });
  },

  put: async (endpointKey, params = {}, data = {}, options = {}) => {
    return API_CONFIG.call(endpointKey, params, { ...options, method: 'PUT', data });
  },

  delete: async (endpointKey, params = {}, options = {}) => {
    return API_CONFIG.call(endpointKey, params, { ...options, method: 'DELETE' });
  },

  // Simple version for httpClient compatibility
  getUrlForHttpClient: (endpointKey, params = {}) => {
    const endpoint = API_ENDPOINTS[endpointKey];
    
    if (!endpoint) {
      console.error(`❌ Unknown endpoint key: ${endpointKey}`);
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }
    
    const { service, path: pathTemplate } = endpoint;
    const baseUrl = API_CONFIG.getServiceUrl(service);
    
    if (!pathTemplate) {
      console.error(`❌ Missing path template for endpoint: ${endpointKey}`);
      return baseUrl;
    }
    
    // Replace path parameters
    let path = pathTemplate;
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      if (path.includes(placeholder)) {
        path = path.replace(placeholder, params[key]);
      }
    });
    
    const fullUrl = `${baseUrl}${path}`;
    console.log(`🔗 Built URL for httpClient: ${fullUrl}`);
    return fullUrl;
  }
};

export default API_CONFIG;