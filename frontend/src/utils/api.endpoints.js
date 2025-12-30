// frontend/src/utils/api.endpoints.js - UPDATED & CLEANED

// Service URLs - single source of truth
const SERVICE_URLS = {
  USER: 'http://localhost:5000',
  PROPERTY: 'http://localhost:5002',
  COMMUNICATION: 'http://localhost:5001',
  TRANSACTION: 'http://localhost:5006',
  SUPPORT: 'http://localhost:5005',
  TODO: 'http://localhost:5003',
  ANALYSIS: 'http://localhost:5004',
  REGISTRY: 'http://localhost:5008'
};

// All API endpoints
export const API_ENDPOINTS = {
  // ========== AUTH ENDPOINTS ==========
  LOGIN: { service: 'USER', path: '/api/auth/login', method: 'POST' },
  REGISTER: { service: 'USER', path: '/api/auth/register', method: 'POST' },
  CHECK_AUTH: { service: 'USER', path: '/api/auth/check', method: 'GET' },
  LOGOUT: { service: 'USER', path: '/api/auth/logout', method: 'POST' },
  UPLOAD_PROFILE: { service: 'USER', path: '/api/auth/upload-profile-picture', method: 'POST' },
  
  // ========== USER MANAGEMENT ==========
  GET_BROKERS: { service: 'USER', path: '/api/brokers', method: 'GET' },
  GET_USERS: { service: 'USER', path: '/api/users', method: 'GET' },
  GET_USER_BY_ID: { service: 'USER', path: '/api/users/{id}', method: 'GET' },
  
  // ========== PROPERTY ENDPOINTS ==========
  GET_PROPERTIES: { service: 'PROPERTY', path: '/api/properties', method: 'GET' },
  GET_PROPERTY_BY_ID: { service: 'PROPERTY', path: '/api/properties/{id}', method: 'GET' },
  GET_BROKER_LISTINGS: { service: 'PROPERTY', path: '/api/properties/broker/listings', method: 'GET' },
  CREATE_PROPERTY: { service: 'PROPERTY', path: '/api/properties', method: 'POST' },
  UPDATE_PROPERTY: { service: 'PROPERTY', path: '/api/properties/{id}', method: 'PUT' },
  DELETE_PROPERTY: { service: 'PROPERTY', path: '/api/properties/{id}', method: 'DELETE' },
  PROPERTY_ACTION: { service: 'PROPERTY', path: '/api/properties/{id}/action', method: 'POST' },
  UPLOAD_PROPERTY_IMAGES: { service: 'PROPERTY', path: '/api/properties/images/property/{propertyId}/upload', method: 'POST' },
  
  // ========== PROPERTY REQUESTS ==========
  GET_BROKER_REQUESTS: { service: 'PROPERTY', path: '/api/property-requests/broker', method: 'GET' },
  ACCEPT_PROPERTY_REQUEST: { service: 'PROPERTY', path: '/api/property-requests/{requestId}/accept', method: 'PUT' },
  REJECT_PROPERTY_REQUEST: { service: 'PROPERTY', path: '/api/property-requests/{requestId}/reject', method: 'PUT' },
  
  // ========== BROKER ANALYTICS ==========
  BROKER_ANALYTICS: { service: 'ANALYSIS', path: '/api/analytics/broker/{brokerId}', method: 'GET' },
  BROKER_STATS: { service: 'ANALYSIS', path: '/api/analytics/broker/{brokerId}/stats', method: 'GET' },
  BROKER_TRANSACTIONS: { service: 'ANALYSIS', path: '/api/analytics/broker/{brokerId}/transactions', method: 'GET' },
  
  // ========== TRANSACTION ENDPOINTS ==========
  GET_BROKER_TRANSACTIONS: { service: 'TRANSACTION', path: '/api/transactions/broker/{brokerId}', method: 'GET' },
  CREATE_TRANSACTION: { service: 'TRANSACTION', path: '/api/transactions', method: 'POST' },
  UPDATE_TRANSACTION: { service: 'TRANSACTION', path: '/api/transactions/{id}', method: 'PUT' },
  
  // ========== COMMUNICATION ENDPOINTS ==========
  SEND_MESSAGE: { service: 'COMMUNICATION', path: '/api/messages/send', method: 'POST' },
  GET_CONVERSATIONS: { service: 'COMMUNICATION', path: '/api/conversations/user/{userId}', method: 'GET' }
};

// Helper to replace path parameters
function replacePathParams(path, params = {}) {
  let result = path;
  Object.keys(params).forEach(key => {
    const placeholder = `{${key}}`;
    if (result.includes(placeholder)) {
      result = result.replace(placeholder, params[key]);
    }
  });
  return result;
}

// Main API call function
export async function apiCall(endpointKey, params = {}, options = {}) {
  const endpoint = API_ENDPOINTS[endpointKey];
  
  if (!endpoint) {
    console.error(`❌ Unknown endpoint: ${endpointKey}`);
    throw new Error(`Unknown endpoint: ${endpointKey}`);
  }
  
  const { service, path: pathTemplate, method: defaultMethod } = endpoint;
  const baseUrl = SERVICE_URLS[service];
  
  if (!baseUrl) {
    console.error(`❌ Unknown service: ${service}`);
    throw new Error(`Unknown service: ${service}`);
  }
  
  // Replace path parameters
  const path = replacePathParams(pathTemplate, params);
  const fullUrl = `${baseUrl}${path}`;
  const method = options.method || defaultMethod;
  
  console.log(`📡 API Call [${service}]: ${method} ${fullUrl}`, { params, options });
  
  // Get auth token
  const token = localStorage.getItem('token');
  
  // Prepare headers
  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };
  
  // Set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData) && !(options.data instanceof FormData)) {
    if (method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }
  }
  
  // Add authorization header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Prepare request body
  let body;
  if (options.data) {
    if (options.data instanceof FormData) {
      body = options.data;
      delete headers['Content-Type']; // Let browser set it
    } else {
      body = JSON.stringify(options.data);
    }
  } else if (options.body) {
    body = options.body;
  } else if (params && method !== 'GET') {
    body = JSON.stringify(params);
  }
  
  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
      mode: 'cors',
      credentials: 'omit',
    });
    
    // Handle response
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = errorText;
          }
        }
      } catch {
        // Ignore parsing errors
      }
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.warn('🔐 Authentication error, clearing tokens');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-changed'));
      }
      
      throw new Error(errorMessage);
    }
    
    // Parse successful response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { text };
      }
    }
    
    console.log(`✅ API Success [${service}/${endpointKey}]:`, data);
    return data;
    
  } catch (error) {
    console.error(`❌ API Error [${service}/${endpointKey}]:`, error.message);
    
    // Re-throw with more context
    const apiError = new Error(`API call failed: ${endpointKey} - ${error.message}`);
    apiError.originalError = error;
    throw apiError;
  }
}

// Convenience methods
export const api = {
  // GET request
  get: (endpointKey, params = {}, options = {}) => 
    apiCall(endpointKey, params, { ...options, method: 'GET' }),
  
  // POST request
  post: (endpointKey, data = {}, options = {}) => 
    apiCall(endpointKey, {}, { ...options, method: 'POST', data }),
  
  // PUT request
  put: (endpointKey, params = {}, data = {}, options = {}) => 
    apiCall(endpointKey, params, { ...options, method: 'PUT', data }),
  
  // DELETE request
  delete: (endpointKey, params = {}, options = {}) => 
    apiCall(endpointKey, params, { ...options, method: 'DELETE' }),
  
  // PATCH request
  patch: (endpointKey, params = {}, data = {}, options = {}) => 
    apiCall(endpointKey, params, { ...options, method: 'PATCH', data }),
};

// Export for convenience
export default api;