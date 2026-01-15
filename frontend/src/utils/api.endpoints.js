// frontend/src/utils/api.endpoints.js - COMPLETE FIXED VERSION

// Service URLs - single source of truth
export const SERVICE_URLS = {
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
  VERIFY_EMAIL: { service: 'USER', path: '/api/auth/verify-email', method: 'POST' },
  FORGOT_PASSWORD: { service: 'USER', path: '/api/auth/forgot-password', method: 'POST' },
  RESET_PASSWORD: { service: 'USER', path: '/api/auth/reset-password', method: 'POST' },

  // ========== NOTIFICATION ENDPOINTS ==========
  EXTERNAL_NOTIFICATION: {
    service: 'COMMUNICATION',
    path: '/api/external/notifications',
    method: 'POST'
  },

  // ========== USER VERIFICATION ENDPOINTS ==========
  GET_VERIFICATION_STATUS: { service: 'USER', path: '/api/verification/status', method: 'GET' },
  GET_MY_DOCUMENTS: { service: 'USER', path: '/api/verification/documents/my', method: 'GET' },
  UPLOAD_VERIFICATION_DOCUMENT: { service: 'USER', path: '/api/verification/documents/upload', method: 'POST' },
  GET_USER_DOCUMENTS: { service: 'USER', path: '/api/auth/documents', method: 'GET' },
  GET_DOCUMENTS_FOR_USER: {
    service: 'USER',
    path: '/api/verification/documents/user/{userId}',
    method: 'GET'
  },

  // ========== ADMIN VERIFICATION ENDPOINTS ==========
  ADMIN_GET_PENDING_VERIFICATIONS: { service: 'USER', path: '/api/verification/admin/pending', method: 'GET' },
  ADMIN_REVIEW_DOCUMENT: { service: 'USER', path: '/api/verification/admin/document/{documentId}/review', method: 'POST' },
  ADMIN_COMPLETE_VERIFICATION: { service: 'USER', path: '/api/verification/admin/user/{userId}/verify', method: 'POST' },
  GET_VERIFICATION_STATS: { service: 'USER', path: '/api/verification/admin/stats', method: 'GET' },

  // ========== VERIFICATION FEEDBACK ENDPOINTS ==========
  REJECT_WITH_FEEDBACK: {
    service: 'USER',
    path: '/api/verification/reject/{userId}',
    method: 'POST'
  },
  REQUEST_RESUBMISSION: {
    service: 'USER',
    path: '/api/verification/request-resubmission/{userId}',
    method: 'POST'
  },
  GET_VERIFICATION_HISTORY: {
    service: 'USER',
    path: '/api/verification/history/{userId}',
    method: 'GET'
  },
  GET_VERIFICATION_STATUS_BY_ID: {
    service: 'USER',
    path: '/api/verification/status/{userId}',
    method: 'GET'
  },
  UPDATE_VERIFICATION_STEP: {
    service: 'USER',
    path: '/api/verification/update-step/{userId}',
    method: 'POST'
  },
  GET_VERIFIED_USERS: {
    service: 'USER',
    path: '/api/verification/admin/verified',
    method: 'GET'
  },
  GET_REJECTED_USERS: {
    service: 'USER',
    path: '/api/verification/admin/rejected',
    method: 'GET'
  },

  // ========== USER VERIFICATION (DOCUMENT-LEVEL) ENDPOINTS ==========
  UPDATE_DOCUMENT_STATUS: {
    service: 'USER',
    path: '/api/verification/admin/document/{documentId}/review',
    method: 'POST'
  },
  UPDATE_VERIFICATION_STATUS: {
    service: 'USER',
    path: '/api/verification/admin/user/{userId}/verify',
    method: 'POST'
  },

  // ========== USER MANAGEMENT ENDPOINTS ==========
  GET_BROKERS: { service: 'USER', path: '/api/brokers', method: 'GET' },
  GET_USERS: { service: 'USER', path: '/api/users', method: 'GET' },
  GET_USER_BY_ID: { service: 'USER', path: '/api/users/{id}', method: 'GET' },
  GET_USER_COUNTS: { service: 'USER', path: '/api/users/counts', method: 'GET' },
  CREATE_USER: { service: 'USER', path: '/api/admin/users', method: 'POST' },
  UPDATE_USER: { service: 'USER', path: '/api/admin/users/{id}', method: 'PUT' },
  UPDATE_USER_STATUS: { service: 'USER', path: '/api/users/{id}/status', method: 'PUT' },
  UPDATE_USER_ROLE: { service: 'USER', path: '/api/users/{id}/role', method: 'PUT' },
  DELETE_USER: { service: 'USER', path: '/api/users/{id}', method: 'DELETE' },
  GET_PROFILE: { service: 'USER', path: '/api/auth/check', method: 'GET' },
  UPDATE_PROFILE: { service: 'USER', path: '/api/auth/update', method: 'PUT' },

  // ========== USER VERIFICATION (USER SERVICE) ==========
  GET_PENDING_USER_VERIFICATIONS: { service: 'USER', path: '/api/users/pending-verifications', method: 'GET' },
  APPROVE_USER_VERIFICATION: { service: 'USER', path: '/api/users/{id}/verify', method: 'PUT' },
  GET_USER_DOCUMENTS_BY_ID: { service: 'USER', path: '/api/users/{id}/documents', method: 'GET' },

  // ========== ANALYTICS ENDPOINTS ==========
  ANALYTICS: { service: 'PROPERTY', path: '/api/analytics', method: 'GET' },

  // ========== ACTIVITY LOG ENDPOINTS ==========
  ACTIVITY_LOG: { service: 'USER', path: '/api/activity/log', method: 'POST' },

  // ========== TODO ENDPOINTS ==========
  TODOS: { service: 'TODO', path: '/api/todos', method: 'GET' },
  CREATE_TODO: { service: 'TODO', path: '/api/todos', method: 'POST' },
  UPDATE_TODO: { service: 'TODO', path: '/api/todos/{id}', method: 'PUT' },
  DELETE_TODO: { service: 'TODO', path: '/api/todos/{id}', method: 'DELETE' },

  // ========== PROPERTY ENDPOINTS ==========
  GET_PROPERTIES: { service: 'PROPERTY', path: '/api/properties', method: 'GET' },
  GET_PROPERTY_BY_ID: { service: 'PROPERTY', path: '/api/properties/{id}', method: 'GET' },
  GET_BROKER_LISTINGS: { service: 'PROPERTY', path: '/api/properties/broker/listings', method: 'GET' },
  CREATE_PROPERTY: { service: 'PROPERTY', path: '/api/properties', method: 'POST' },
  UPDATE_PROPERTY: { service: 'PROPERTY', path: '/api/properties/{id}', method: 'PUT' },
  DELETE_PROPERTY: { service: 'PROPERTY', path: '/api/properties/{id}', method: 'DELETE' },
  PROPERTY_ACTION: { service: 'PROPERTY', path: '/api/properties/{id}/action', method: 'POST' },
  UPLOAD_PROPERTY_IMAGES: { service: 'PROPERTY', path: '/api/properties/images/property/{propertyId}/upload', method: 'POST' },

  // ========== BUYER/RENTER PROPERTY ENDPOINTS ==========
  GET_SAVED_PROPERTIES: { service: 'PROPERTY', path: '/api/buyer/saved-properties', method: 'GET' },
  SAVE_PROPERTY: { service: 'PROPERTY', path: '/api/buyer/properties/{propertyId}/save', method: 'POST' },
  UNSAVE_PROPERTY: { service: 'PROPERTY', path: '/api/buyer/properties/{propertyId}/save', method: 'DELETE' },
  GET_RECOMMENDED_PROPERTIES: { service: 'PROPERTY', path: '/api/buyer/recommended-properties', method: 'GET' },
  TRACK_PROPERTY_VIEW: { service: 'PROPERTY', path: '/api/buyer/properties/{propertyId}/view', method: 'POST' },
  CHECK_SAVED_STATUS: { service: 'PROPERTY', path: '/api/buyer/properties/{propertyId}/saved', method: 'GET' },
  GET_PROPERTY_STATS: { service: 'PROPERTY', path: '/api/buyer/properties/{propertyId}/stats', method: 'GET' },

  // ========== PROPERTY APPLICATIONS ENDPOINTS ==========
  GET_APPLICATIONS: { service: 'PROPERTY', path: '/api/applications', method: 'GET' },
  CREATE_APPLICATION: { service: 'PROPERTY', path: '/api/applications', method: 'POST' },
  GET_APPLICATION_BY_ID: { service: 'PROPERTY', path: '/api/applications/{id}', method: 'GET' },
  UPDATE_APPLICATION: { service: 'PROPERTY', path: '/api/applications/{id}', method: 'PUT' },
  DELETE_APPLICATION: { service: 'PROPERTY', path: '/api/applications/{id}', method: 'DELETE' },
  GET_APPLICATION_STATS: { service: 'PROPERTY', path: '/api/applications/stats', method: 'GET' },

  // ========== PROPERTY REQUESTS ENDPOINTS ==========
  GET_BROKER_REQUESTS: { service: 'PROPERTY', path: '/api/properties/property-requests/broker', method: 'GET' },
  ACCEPT_PROPERTY_REQUEST: { service: 'PROPERTY', path: '/api/properties/property-requests/{requestId}/accept', method: 'PUT' },
  REJECT_PROPERTY_REQUEST: { service: 'PROPERTY', path: '/api/properties/property-requests/{requestId}/reject', method: 'PUT' },

  // ========== BROKER ANALYTICS ENDPOINTS ==========
  BROKER_ANALYTICS: { service: 'PROPERTY', path: '/api/properties/analytics/broker/{brokerId}', method: 'GET' },
  BROKER_STATS: { service: 'PROPERTY', path: '/api/properties/analytics/broker/{brokerId}/stats', method: 'GET' },
  BROKER_TRANSACTIONS: { service: 'PROPERTY', path: '/api/properties/analytics/broker/{brokerId}/transactions', method: 'GET' },

  // ========== TRANSACTION ENDPOINTS ==========
  GET_BROKER_TRANSACTIONS: { service: 'TRANSACTION', path: '/api/transactions/broker/{brokerId}', method: 'GET' },
  CREATE_TRANSACTION: { service: 'TRANSACTION', path: '/api/transactions', method: 'POST' },
  UPDATE_TRANSACTION: { service: 'TRANSACTION', path: '/api/transactions/{id}', method: 'PUT' },
  GET_TRANSACTIONS: { service: 'TRANSACTION', path: '/api/transactions', method: 'GET' },
  GET_TRANSACTION_BY_ID: { service: 'TRANSACTION', path: '/api/transactions/{id}', method: 'GET' },

  // ========== COMMUNICATION ENDPOINTS ==========
  SEND_MESSAGE: { service: 'COMMUNICATION', path: '/api/messages/send', method: 'POST' },
  GET_CONVERSATIONS: { service: 'COMMUNICATION', path: '/api/conversations/user/{userId}', method: 'GET' },
  GET_MESSAGES: { service: 'COMMUNICATION', path: '/api/messages/conversation/{conversationId}', method: 'GET' },
  GET_CHAT: { service: 'COMMUNICATION', path: '/api/chat', method: 'GET' },
  CREATE_NOTIFICATION: { service: 'COMMUNICATION', path: '/api/external/notifications', method: 'POST' },

  // ========== NOTIFICATIONS ENDPOINTS ==========
  NOTIFICATIONS: { service: 'COMMUNICATION', path: '/api/notifications', method: 'GET' },
  MARK_NOTIFICATION_READ: { service: 'COMMUNICATION', path: '/api/notifications/{id}/read', method: 'PUT' },

  // ========== SYSTEM ENDPOINTS ==========
  SYSTEM_HEALTH: { service: 'USER', path: '/health', method: 'GET' },
  SYSTEM_CONFIG: { service: 'USER', path: '/api/system/config', method: 'GET' },

  // ========== SUPPORT ENDPOINTS ==========
  GET_SUPPORT_TICKETS: { service: 'SUPPORT', path: '/api/support/tickets', method: 'GET' },
  GET_SUPPORT_AGENTS: { service: 'USER', path: '/api/users/support/agents', method: 'GET' },
  CREATE_SUPPORT_TICKET: { service: 'SUPPORT', path: '/api/support/tickets', method: 'POST' },
  UPDATE_SUPPORT_TICKET: { service: 'SUPPORT', path: '/api/support/tickets/{id}', method: 'PUT' },

  // ========== REGISTRY ENDPOINTS ==========
  GET_REGISTRY_ENTRIES: { service: 'REGISTRY', path: '/api/registry', method: 'GET' },
  CREATE_REGISTRY_ENTRY: { service: 'REGISTRY', path: '/api/registry', method: 'POST' },
  UPDATE_REGISTRY_ENTRY: { service: 'REGISTRY', path: '/api/registry/{id}', method: 'PUT' },

  // ========== ACCOUNT STATUS ENDPOINTS ==========
  ACCOUNT_STATUS: { service: 'USER', path: '/api/auth/account/status', method: 'GET' },
  ACCOUNT_RESEND_VERIFICATION: { service: 'USER', path: '/api/auth/account/resend-verification', method: 'POST' },

  // ========== USER VERIFICATION STATS (LEGACY) ==========
  GET_USER_VERIFICATION_STATS: { service: 'USER', path: '/api/users/verification-stats', method: 'GET' },

  // ========== PASSWORD CHANGE ENDPOINTS ==========
  FORCE_CHANGE_PASSWORD: { service: 'USER', path: '/api/auth/force-change-password', method: 'POST' },
  CHANGE_REQUIRED_PASSWORD: { service: 'USER', path: '/api/auth/change-required-password', method: 'POST' },

  // ========== VERIFICATION DOCUMENT UPLOAD (AUTH) ==========
  AUTH_UPLOAD_VERIFICATION_DOCUMENT: { service: 'USER', path: '/api/auth/documents/upload', method: 'POST' },

  // ========== BROKER ENDPOINTS ==========
  GET_BROKER_DETAILS: { service: 'USER', path: '/api/brokers/{id}', method: 'GET' },

  // ========== PROPERTY IMAGES ENDPOINTS ==========
  GET_PROPERTY_IMAGES: { service: 'PROPERTY', path: '/api/properties/images/property/{id}', method: 'GET' },
  UPLOAD_PROPERTY_IMAGES: { service: 'PROPERTY', path: '/api/properties/images/property/{id}/upload', method: 'POST' },
  DELETE_PROPERTY_IMAGE: { service: 'PROPERTY', path: '/api/properties/images/{imageId}', method: 'DELETE' },
  SET_PRIMARY_IMAGE: { service: 'PROPERTY', path: '/api/properties/images/{imageId}/set-primary', method: 'PATCH' },

  // ========== FLOOR PLAN ENDPOINTS ==========
  GET_FLOOR_PLANS: { service: 'PROPERTY', path: '/api/properties/images/property/{id}/floor-plans', method: 'GET' },
  UPLOAD_FLOOR_PLAN: { service: 'PROPERTY', path: '/api/properties/images/property/{id}/floor-plan', method: 'POST' },

  // ========== PROFILE PICTURE ENDPOINT ==========
  GET_PROFILE_PICTURE: { service: 'USER', path: '/Uploads/profile-pictures/{filename}', method: 'GET' },
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

// Main API call function - COMPLETE FIXED VERSION
export async function apiCall(endpointKey, params = {}, options = {}) {
  try {
    // Validate endpoint exists
    const endpoint = API_ENDPOINTS[endpointKey];
    if (!endpoint) {
      console.error(`❌ apiCall: Endpoint "${endpointKey}" not found`);
      throw new Error(`API endpoint "${endpointKey}" not found`);
    }

    // Get service URL
    const serviceUrl = SERVICE_URLS[endpoint.service];
    if (!serviceUrl) {
      console.error(`❌ apiCall: Service "${endpoint.service}" not found`);
      throw new Error(`Service "${endpoint.service}" not configured`);
    }

    // Replace path parameters
    const path = replacePathParams(endpoint.path, params);
    const url = `${serviceUrl}${path}`;

    // Get method from options or endpoint
    const method = options.method || endpoint.method || 'GET';

    // Get token
    const token = localStorage.getItem('token');

    // Prepare headers
    const headers = {
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Prepare body for non-GET requests
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      // Check for options.body first (for backward compatibility)
      if (options.body) {
        body = options.body;
        // If it's FormData, don't set Content-Type
        if (body instanceof FormData) {
          delete headers['Content-Type'];
        } else if (typeof body === 'string') {
          // Assume it's already stringified JSON
          headers['Content-Type'] = 'application/json';
        }
      } else if (options.data) {
        if (options.data instanceof FormData) {
          body = options.data;
          // Don't set Content-Type for FormData - browser sets it automatically
          delete headers['Content-Type'];
        } else if (options.data) {
          body = JSON.stringify(options.data);
          headers['Content-Type'] = 'application/json';
        }
      }
    }


    // Prepare query parameters for GET requests
    let finalUrl = url;
    if ((method === 'GET' || method === 'DELETE') && options.data) {
      const queryParams = new URLSearchParams();
      Object.entries(options.data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    console.log(`🔍 apiCall [${endpointKey}]:`, {
      method,
      url: finalUrl,
      endpoint: endpointKey,
      hasToken: !!token,
      headers,
      body: body ? (body instanceof FormData ? '[FormData]' : body) : 'none'
    });

    // Make the request
    const response = await fetch(finalUrl, {
      method,
      headers,
      body,
      credentials: 'include',
      ...(options.config || {})
    });

    console.log(`📥 apiCall [${endpointKey}] response:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    });

    // Handle response
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.text();
        if (errorData) {
          try {
            const parsedError = JSON.parse(errorData);
            errorMessage = parsedError.message || parsedError.error || errorMessage;
          } catch {
            errorMessage = errorData;
          }
        }
      } catch {
        // Ignore error in parsing error response
      }

      console.error(`❌ apiCall [${endpointKey}] failed:`, errorMessage);
      throw new Error(errorMessage);
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text;

      // Try to parse as JSON if it looks like JSON
      if (text && (text.startsWith('{') || text.startsWith('['))) {
        try {
          data = JSON.parse(text);
        } catch {
          // Keep as text if not valid JSON
        }
      }
    }

    console.log(`✅ apiCall [${endpointKey}] success:`, {
      type: typeof data,
      isArray: Array.isArray(data),
      hasUsers: data?.users !== undefined,
      data
    });

    // Return the data directly (not wrapped in another object)
    return data;

  } catch (error) {
    console.error(`💥 apiCall [${endpointKey}] exception:`, error.message, error.stack);

    // Provide more specific error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }

    if (error.message.includes('401')) {
      // Token might be invalid, clear it
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Session expired. Please log in again.');
    }

    if (error.message.includes('403')) {
      throw new Error('Access denied. You do not have permission for this action.');
    }

    if (error.message.includes('404')) {
      throw new Error(`API endpoint not found: ${endpointKey}`);
    }

    throw error;
  }
}

// Convenience methods
export const api = {
  get: (endpointKey, params = {}, options = {}) =>
    apiCall(endpointKey, params, { ...options, method: 'GET' }),
  post: (endpointKey, data = {}, options = {}) =>
    apiCall(endpointKey, {}, { ...options, method: 'POST', data }),
  put: (endpointKey, params = {}, data = {}, options = {}) =>
    apiCall(endpointKey, params, { ...options, method: 'PUT', data }),
  delete: (endpointKey, params = {}, options = {}) =>
    apiCall(endpointKey, params, { ...options, method: 'DELETE' }),
  patch: (endpointKey, params = {}, data = {}, options = {}) =>
    apiCall(endpointKey, params, { ...options, method: 'PATCH', data }),
};

export const apiClient = api;
export default api;