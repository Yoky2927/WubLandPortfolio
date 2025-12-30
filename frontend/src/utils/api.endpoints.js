// frontend/src/utils/api.endpoints.js

// Base URLs for each service
const SERVICE_BASE_URLS = {
  user: 'http://localhost:5000',       // User service with brokers
  property: 'http://localhost:5002',    // Property service
  communication: 'http://localhost:5001', // Communication service
  transaction: 'http://localhost:5006',  // Transaction service
  support: 'http://localhost:5005',      // Support service
  todo: 'http://localhost:5003',         // Todo service
  analysis: 'http://localhost:5004',     // Analysis service
  registry: 'http://localhost:5008'      // API Registry
};

export const API_ENDPOINTS = {
  // Auth endpoints (User service - port 5000)
  LOGIN: { service: 'user', path: '/api/auth/login', method: 'POST' },
  REGISTER: { service: 'user', path: '/api/auth/register', method: 'POST' },
  CHECK_AUTH: { service: 'user', path: '/api/auth/check', method: 'GET' },
  LOGOUT: { service: 'user', path: '/api/auth/logout', method: 'POST' },
  UPLOAD_PROFILE: { service: 'user', path: '/api/auth/upload-profile-picture', method: 'POST' },
  
  // User management (User service - port 5000)
  GET_BROKERS: { service: 'user', path: '/api/brokers', method: 'GET' },
  GET_BROKERS_ALT: { service: 'user', path: '/api/users/brokers', method: 'GET' },
  GET_USERS: { service: 'user', path: '/api/users', method: 'GET' },
  GET_USER_BY_ID: { service: 'user', path: '/api/users/{id}', method: 'GET' },
  
  // Property endpoints (Property service - port 5002)
  GET_PROPERTIES: { service: 'property', path: '/api/properties', method: 'GET' },
  GET_PROPERTY_BY_ID: { service: 'property', path: '/api/properties/{id}', method: 'GET' },
  SEARCH_PROPERTIES: { service: 'property', path: '/api/properties/search', method: 'GET' },
  CREATE_PROPERTY_REQUEST: { service: 'property', path: '/api/properties/requests', method: 'POST' },
  UPLOAD_PROPERTY_IMAGE: { service: 'property', path: '/api/properties/requests/{id}/upload-image', method: 'POST' },
  ASSIGN_BROKER: { service: 'property', path: '/api/properties/requests/{id}/assign', method: 'POST' },
  UPDATE_PROPERTY_REQUEST: { service: 'property', path: '/api/properties/requests/{id}', method: 'PUT' },
  
  // Premium properties (Property service - port 5002)
  GET_PREMIUM_PROPERTIES: { service: 'property', path: '/api/properties/premium', method: 'GET' },
  
  // For backward compatibility
  GET_BROKER_LIST: { service: 'user', path: '/api/users?role=broker', method: 'GET' },
  GET_ALL_BROKERS: { service: 'user', path: '/api/brokers/all', method: 'GET' },
  GET_AVAILABLE_BROKERS: { service: 'user', path: '/api/brokers/available', method: 'GET' },
  
  // Simple test endpoint
  TEST_API: { service: 'user', path: '/api', method: 'GET' }
};

// Helper to replace path parameters
function buildPath(template, params = {}) {
  let path = template;
  Object.keys(params).forEach(key => {
    path = path.replace(`{${key}}`, params[key]);
  });
  return path;
}

// Unified API call using service-based URLs
export async function apiCall(endpointKey, params = {}, options = {}) {
  const endpoint = API_ENDPOINTS[endpointKey];
  if (!endpoint) {
    throw new Error(`Unknown endpoint: ${endpointKey}`);
  }
  
  const { service, path: pathTemplate, method: defaultMethod } = endpoint;
  const baseUrl = SERVICE_BASE_URLS[service];
  
  if (!baseUrl) {
    throw new Error(`Unknown service: ${service}`);
  }
  
  const path = buildPath(pathTemplate, params);
  const fullUrl = `${baseUrl}${path}`;
  
  console.log(`🔍 API Call [${service}]: ${defaultMethod} ${fullUrl}`, { params });
  
  const method = options.method || defaultMethod;
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Prepare headers
  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };
  
  // Only add Content-Type for non-FormData requests
  if (!(options.body instanceof FormData) && !(options.data instanceof FormData)) {
    if (method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }
  }
  
  // Add authorization if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Prepare body
  let body;
  if (options.data) {
    if (options.data instanceof FormData) {
      body = options.data;
      // Remove Content-Type header for FormData
      delete headers['Content-Type'];
    } else {
      body = JSON.stringify(options.data);
    }
  } else if (params && method !== 'GET') {
    body = JSON.stringify(params);
  }
  
  try {
    // Remove credentials from options
    const fetchOptions = { 
      method, 
      headers, 
      body, 
      mode: 'cors', 
      ...options 
    };
    delete fetchOptions.credentials;
    
    const response = await fetch(fullUrl, fetchOptions);
    
    // Check if response is OK
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP ${response.status}` };
        }
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Ignore parsing errors
      }
      
      // Handle auth errors
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
      }
      
      throw new Error(errorMessage);
    }
    
    // Parse response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
      try {
        data = JSON.parse(data);
      } catch {
        // Keep as text if not JSON
      }
    }
    
    console.log(`✅ API Success [${service}]: ${endpointKey}`, data);
    return data;
    
  } catch (error) {
    console.error(`❌ API Error [${service}/${endpointKey}]:`, error.message);
    
    // Try alternative endpoints for brokers
    if (endpointKey.includes('BROKER')) {
      console.log('🔄 Trying alternative broker endpoints...');
      // The fetchBrokers function will handle this
    }
    
    throw error;
  }
}

// Simple direct API call for testing
export async function directApiCall(url, options = {}) {
  console.log(`🔍 Direct API Call: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        ...options.headers,
      },
      body: options.body,
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Direct API Success:`, data);
    return data;
    
  } catch (error) {
    console.error(`❌ Direct API Error:`, error.message);
    throw error;
  }
}

// Public API call (without auth headers)
export async function publicApiCall(endpointKey, params = {}, options = {}) {
  const endpoint = API_ENDPOINTS[endpointKey];
  if (!endpoint) {
    throw new Error(`Unknown endpoint: ${endpointKey}`);
  }
  
  const { service, path: pathTemplate, method: defaultMethod } = endpoint;
  const baseUrl = SERVICE_BASE_URLS[service];
  
  if (!baseUrl) {
    throw new Error(`Unknown service: ${service}`);
  }
  
  const path = buildPath(pathTemplate, params);
  const fullUrl = `${baseUrl}${path}`;
  
  console.log(`🔍 Public API Call [${service}]: ${defaultMethod} ${fullUrl}`);
  
  const method = options.method || defaultMethod;
  
  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Accept': 'application/json',
        ...(method !== 'GET' && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: options.data ? (options.data instanceof FormData ? options.data : JSON.stringify(options.data)) : null,
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Public API Success [${service}]: ${endpointKey}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Public API Error [${service}/${endpointKey}]:`, error.message);
    throw error;
  }
}

export default API_ENDPOINTS;