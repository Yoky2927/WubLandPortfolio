// frontend/src/config/api.config.js - SIMPLIFIED WORKING VERSION
import { API_ENDPOINTS } from '../utils/api.endpoints';

// IMPORTANT: Use the SAME SERVICE_URLS from api.endpoints.js
const SERVICE_URLS = {
  USER: 'http://localhost:5000',
  PROPERTY: 'http://localhost:5002',
  COMMUNICATION: 'http://localhost:5001',
  TRANSACTION: 'http://localhost:5006',
  SUPPORT: 'http://localhost:5005',
  TODO: 'http://localhost:5003',
  ANALYSIS: 'http://localhost:5004',  // Not running yet
  REGISTRY: 'http://localhost:5008'
};

const API_CONFIG = {
  // Simple getUrl function that works with httpClient
  getUrl: (endpointKey, params = {}) => {
    const endpoint = API_ENDPOINTS[endpointKey];
    
    if (!endpoint) {
      console.error(`❌ Unknown endpoint key: ${endpointKey}`);
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }
    
    const { service, path: pathTemplate } = endpoint;
    const baseUrl = SERVICE_URLS[service];
    
    if (!baseUrl) {
      console.error(`❌ Unknown service: ${service}`);
      throw new Error(`Unknown service: ${service}`);
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

  // Simple function to get base URL for a service
  getBaseUrl: (service) => {
    return SERVICE_URLS[service] || 'http://localhost:5000';
  },

  // Direct method to make calls (alternative to httpClient)
  call: async (endpointKey, params = {}, options = {}) => {
    const { apiCall } = await import('../utils/api.endpoints');
    return apiCall(endpointKey, params, options);
  },

  // Shortcut methods for convenience
  get: async (endpointKey, params = {}, options = {}) => {
    return API_CONFIG.call(endpointKey, params, { ...options, method: 'GET' });
  },

  post: async (endpointKey, data = {}, options = {}) => {
    return API_CONFIG.call(endpointKey, {}, { ...options, method: 'POST', data });
  },

  put: async (endpointKey, params = {}, data = {}, options = {}) => {
    return API_CONFIG.call(endpointKey, params, { ...options, method: 'PUT', data });
  }
};

export default API_CONFIG;