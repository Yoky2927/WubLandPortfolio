// frontend/src/utils/api.endpoints.js - CORRECTED VERSION
// Service URLs - single source of truth
export const SERVICE_URLS = {
  USER: 'http://localhost:5000',
  PROPERTY: 'http://localhost:5002',
  COMMUNICATION: 'http://localhost:5001',
  TRANSACTION: 'http://localhost:5006',
  SUPPORT: 'http://localhost:5005',
  ANALYSIS: 'http://localhost:5004'
};

// Main API endpoints - UPDATED with all missing endpoints
export const API_ENDPOINTS = {
  // ========== AUTH ENDPOINTS ==========
  LOGIN: { service: 'USER', path: '/api/auth/login', method: 'POST' },
  REGISTER: { service: 'USER', path: '/api/auth/register', method: 'POST' },
  CHECK_AUTH: { service: 'USER', path: '/api/auth/check', method: 'GET' },
  LOGOUT: { service: 'USER', path: '/api/auth/logout', method: 'POST' },

  // ========== USER MANAGEMENT ==========
  GET_USER: { service: 'USER', path: '/api/auth/check', method: 'GET' },
  UPDATE_PROFILE: { service: 'USER', path: '/api/auth/update', method: 'PUT' },
  UPLOAD_PROFILE_PICTURE: { service: 'USER', path: '/api/auth/upload-profile-picture', method: 'POST' },

  // ========== VERIFICATION ENDPOINTS ==========
  GET_VERIFICATION_STATUS: { service: 'USER', path: '/api/verification/status', method: 'GET' },
  UPLOAD_VERIFICATION_DOCUMENT: { service: 'USER', path: '/api/verification/documents/upload', method: 'POST' },
  GET_MY_DOCUMENTS: { service: 'USER', path: '/api/verification/documents/my', method: 'GET' },

  // ========== PROPERTY ENDPOINTS ==========
  GET_PROPERTIES: { service: 'PROPERTY', path: '/api/properties', method: 'GET' },
  GET_PROPERTY_BY_ID: { service: 'PROPERTY', path: '/api/properties/{id}', method: 'GET' },

  // ========== BUYER ENDPOINTS ==========
  GET_SAVED_PROPERTIES: { service: 'PROPERTY', path: '/api/buyer/saved-properties', method: 'GET' },
  SAVE_PROPERTY: { service: 'PROPERTY', path: '/api/buyer/properties/{propertyId}/save', method: 'POST' },
  UNSAVE_PROPERTY: { service: 'PROPERTY', path: '/api/buyer/properties/{propertyId}/save', method: 'DELETE' },
  CHECK_SAVED_STATUS: { service: 'PROPERTY', path: '/api/buyer/properties/{propertyId}/is-saved', method: 'GET' },
  GET_RECOMMENDED_PROPERTIES: { service: 'PROPERTY', path: '/api/buyer/recommended-properties', method: 'GET' },
  TRACK_PROPERTY_VIEW: { service: 'PROPERTY', path: '/api/buyer/properties/{propertyId}/view', method: 'POST' },
  GET_PROPERTY_STATS: { service: 'PROPERTY', path: '/api/buyer/properties/{propertyId}/stats', method: 'GET' },

  // ========== APPLICATION ENDPOINTS ==========
  GET_APPLICATIONS: { service: 'PROPERTY', path: '/api/applications', method: 'GET' },
  CREATE_APPLICATION: { service: 'PROPERTY', path: '/api/applications', method: 'POST' },

  // ========== BROKER ENDPOINTS ==========
  GET_BROKERS: { service: 'USER', path: '/api/brokers', method: 'GET' },

  // ========== DEBUG ENDPOINTS ==========
  DEBUG_DATABASE_CHECK: { service: 'PROPERTY', path: '/api/debug/database-check', method: 'GET' },
  DEBUG_SAVED_PROPERTIES: { service: 'PROPERTY', path: '/api/debug/saved-properties/{userId}', method: 'GET' },
  DEBUG_SAVE_TEST: { service: 'PROPERTY', path: '/api/debug/save-test', method: 'GET' },
  DEBUG_PROPERTY_SAVES: { service: 'PROPERTY', path: '/api/debug/check-saves/{propertyId}', method: 'GET' },

  // ========== NOTIFICATION ENDPOINTS ==========
  GET_NOTIFICATIONS: { service: 'COMMUNICATION', path: '/api/notifications', method: 'GET' },
  MARK_NOTIFICATION_READ: { service: 'COMMUNICATION', path: '/api/notifications/{id}/read', method: 'PUT' },
  GET_UNREAD_NOTIFICATIONS_COUNT: { service: 'COMMUNICATION', path: '/api/notifications/unread-count', method: 'GET' },

  // ========== TODO ENDPOINTS ==========
  GET_TODOS: { service: 'COMMUNICATION', path: '/api/todos', method: 'GET' },
  GET_TODO_BY_ID: { service: 'COMMUNICATION', path: '/api/todos/{id}', method: 'GET' },
  CREATE_TODO: { service: 'COMMUNICATION', path: '/api/todos', method: 'POST' },
  UPDATE_TODO: { service: 'COMMUNICATION', path: '/api/todos/{id}', method: 'PUT' },
  DELETE_TODO: { service: 'COMMUNICATION', path: '/api/todos/{id}', method: 'DELETE' },
  UPDATE_TODO_STATUS: { service: 'COMMUNICATION', path: '/api/todos/{id}/status', method: 'PUT' },
  REORDER_TODOS: { service: 'COMMUNICATION', path: '/api/todos/reorder', method: 'PUT' },
  GET_TEAM_MEMBERS: { service: 'COMMUNICATION', path: '/api/todos/team-members', method: 'GET' },
  GET_TODO_STATS: { service: 'COMMUNICATION', path: '/api/todos/stats', method: 'GET' },
  ADD_TODO_COMMENT: { service: 'COMMUNICATION', path: '/api/todos/{id}/comments', method: 'POST' },
  GET_TODO_COMMENTS: { service: 'COMMUNICATION', path: '/api/todos/{id}/comments', method: 'GET' },
  GET_UPCOMING_TODOS: { service: 'COMMUNICATION', path: '/api/todos/upcoming', method: 'GET' },
  SEARCH_TODOS: { service: 'COMMUNICATION', path: '/api/todos/search', method: 'GET' },

  // ========== BROKER DETAILS ==========
  GET_BROKER_DETAILS: { service: 'USER', path: '/api/brokers/{id}', method: 'GET' },

  // ========== APPOINTMENT ENDPOINTS ==========
  GET_APPOINTMENTS: { service: 'COMMUNICATION', path: '/api/appointments', method: 'GET' },
  CREATE_APPOINTMENT: { service: 'COMMUNICATION', path: '/api/appointments', method: 'POST' },
  UPDATE_APPOINTMENT_STATUS: { service: 'COMMUNICATION', path: '/api/appointments/{id}/status', method: 'PUT' },
  ADD_APPOINTEE: { service: 'COMMUNICATION', path: '/api/appointments/{appointmentId}/attendees', method: 'POST' },

  // ========== PAYMENT & TRANSACTION ENDPOINTS ==========
  INITIALIZE_PAYMENT: { service: 'TRANSACTION', path: '/api/transactions/invoices/{invoiceId}/pay', method: 'POST' },
  VERIFY_PAYMENT: { service: 'TRANSACTION', path: '/api/transactions/payments/verify', method: 'GET' },
  GET_PAYMENT: { service: 'TRANSACTION', path: '/api/transactions/payments/{id}', method: 'GET' },
  GET_USER_PAYMENTS: { service: 'TRANSACTION', path: '/api/transactions/user/payments', method: 'GET' },

  // ========== OFFER ENDPOINTS ==========
  CREATE_OFFER: { service: 'TRANSACTION', path: '/api/transactions/offers', method: 'POST' },
  GET_OFFER: { service: 'TRANSACTION', path: '/api/transactions/offers/{id}', method: 'GET' },
  ACCEPT_OFFER: { service: 'TRANSACTION', path: '/api/transactions/offers/{id}/accept', method: 'PUT' },
  REJECT_OFFER: { service: 'TRANSACTION', path: '/api/transactions/offers/{id}/reject', method: 'PUT' },
  GET_PROPERTY_OFFERS: { service: 'TRANSACTION', path: '/api/transactions/properties/{propertyId}/offers', method: 'GET' },
  GET_USER_OFFERS: { service: 'TRANSACTION', path: '/api/transactions/user/offers', method: 'GET' },

  // ========== INVOICE ENDPOINTS ==========
  GET_INVOICE: { service: 'TRANSACTION', path: '/api/transactions/invoices/{id}', method: 'GET' },
  GET_USER_INVOICES: { service: 'TRANSACTION', path: '/api/transactions/user/invoices', method: 'GET' },

  // ========== WEBHOOK DEBUG ==========
  DEBUG_WEBHOOK: { service: 'TRANSACTION', path: '/api/transactions/debug/webhook', method: 'POST' },

  // ========== INTERNAL ENDPOINTS ==========
  CREATE_INVOICE_INTERNAL: { service: 'TRANSACTION', path: '/api/transactions/internal/create-invoice', method: 'POST' },
  GET_TRANSACTION_INTERNAL: { service: 'TRANSACTION', path: '/api/transactions/internal/transaction/{id}', method: 'GET' },
  CREATE_TEST_INVOICE: { service: 'TRANSACTION', path: '/api/transactions/test/create-invoice', method: 'POST' },

  // ========== TRANSACTION HISTORY ENDPOINTS ==========
  GET_TRANSACTIONS: { service: 'TRANSACTION', path: '/api/transactions', method: 'GET' },
  GET_TRANSACTION_HISTORY: { service: 'TRANSACTION', path: '/api/transactions/user/payments', method: 'GET' },

  // ========== ADMIN ENDPOINTS ==========
  GET_USERS: { service: 'USER', path: '/api/users', method: 'GET' },
  GET_USER_BY_ID: { service: 'USER', path: '/api/users/{id}', method: 'GET' },
  CREATE_USER: { service: 'USER', path: '/api/auth/admin/create-user', method: 'POST' },
  UPDATE_USER: { service: 'USER', path: '/api/users/{id}', method: 'PUT' },
  UPDATE_USER_STATUS: { service: 'USER', path: '/api/users/{id}/status', method: 'PUT' },
  UPDATE_USER_ROLE: { service: 'USER', path: '/api/users/{id}/role', method: 'PUT' },
  DELETE_USER: { service: 'USER', path: '/api/users/{id}', method: 'DELETE' },
  ACTIVITY_LOG: { service: 'USER', path: '/api/activities', method: 'POST' },

  // ========== PROFILE ENDPOINTS ==========
  UPLOAD_PROFILE_PICTURE: { service: 'USER', path: '/api/auth/upload', method: 'POST' },
  UPDATE_PROFILE: { service: 'USER', path: '/api/auth/update', method: 'PUT' },
  UPDATE_USERNAME: { service: 'USER', path: '/api/auth/username', method: 'PUT' },
  GET_PROFILE: { service: 'USER', path: '/api/auth/check', method: 'GET' },

  // ========== VERIFICATION DOCUMENT ENDPOINTS ==========
  UPLOAD_VERIFICATION_DOCUMENT: { service: 'USER', path: '/api/auth/documents/upload', method: 'POST' },
  GET_USER_DOCUMENTS: { service: 'USER', path: '/api/auth/documents', method: 'GET' },
  GET_VERIFICATION_STATUS: { service: 'USER', path: '/api/auth/account/status', method: 'GET' },
  RESEND_VERIFICATION_EMAIL: { service: 'USER', path: '/api/auth/account/resend-verification', method: 'POST' },
  RESEND_VERIFICATION_PUBLIC: { service: 'USER', path: '/api/auth/resend-verification-public', method: 'POST' },

  // ========== DEBUG ENDPOINTS ==========
  DEBUG_UPLOAD: { service: 'USER', path: '/api/auth/debug-upload', method: 'POST' },
  DEBUG_MIDDLEWARE: { service: 'USER', path: '/api/debug-middleware', method: 'GET' },
  TEST_FILE: { service: 'USER', path: '/api/test-file/{filename}', method: 'GET' },

  // ========== SYSTEM & ANALYTICS ENDPOINTS ==========
  SYSTEM_HEALTH: { service: 'USER', path: '/api/health', method: 'GET' },
  GET_SERVICE_HEALTH: { service: 'COMMUNICATION', path: '/api/health', method: 'GET' },
  GET_ANALYTICS: { service: 'ANALYSIS', path: '/api/analytics/system', method: 'GET' },

  // ========== VERIFICATION ENDPOINTS ==========
  GET_PENDING_USER_VERIFICATIONS: { service: 'USER', path: '/api/verification/admin/pending', method: 'GET' },
  GET_VERIFIED_USERS: { service: 'USER', path: '/api/verification/admin/verified', method: 'GET' },
  GET_REJECTED_USERS: { service: 'USER', path: '/api/verification/admin/rejected', method: 'GET' },
  GET_VERIFICATION_STATS: { service: 'USER', path: '/api/verification/admin/stats', method: 'GET' },
  REVIEW_DOCUMENT: { service: 'USER', path: '/api/verification/admin/document/{documentId}/review', method: 'POST' },
  COMPLETE_USER_VERIFICATION: { service: 'USER', path: '/api/verification/admin/user/{userId}/verify', method: 'POST' },
  GET_USER_VERIFICATION_STATUS: { service: 'USER', path: '/api/verification/status/{userId}', method: 'GET' },
  REQUEST_RESUBMISSION: { service: 'USER', path: '/api/verification/request-resubmission/{userId}', method: 'POST' },
  GET_VERIFICATION_HISTORY: { service: 'USER', path: '/api/verification/history/{userId}', method: 'GET' },
  REVIEW_INDIVIDUAL_DOCUMENT: { service: 'USER', path: '/api/verification/admin/document/{documentId}/review-individual', method: 'POST' },
  GET_DOCUMENT_FEEDBACK: { service: 'USER', path: '/api/verification/documents/{documentId}/feedback', method: 'GET' },

  // ========== ANALYTICS ENDPOINTS ==========
  GET_SYSTEM_ANALYTICS: { service: 'ANALYSIS', path: '/api/analytics/system', method: 'GET' },
  GET_USER_ANALYTICS: { service: 'ANALYSIS', path: '/api/analytics/users', method: 'GET' },
  GET_TRANSACTION_ANALYTICS: { service: 'ANALYSIS', path: '/api/analytics/transactions', method: 'GET' },
  GET_PROPERTY_ANALYTICS: { service: 'ANALYSIS', path: '/api/analytics/properties', method: 'GET' },

  // ========== ANNOUNCEMENT ENDPOINTS ==========
  GET_ANNOUNCEMENTS: { service: 'COMMUNICATION', path: '/api/announcements', method: 'GET' },
  GET_ANNOUNCEMENT_BY_ID: { service: 'COMMUNICATION', path: '/api/announcements/{id}', method: 'GET' },
  CREATE_ANNOUNCEMENT: { service: 'COMMUNICATION', path: '/api/announcements', method: 'POST' },
  UPDATE_ANNOUNCEMENT: { service: 'COMMUNICATION', path: '/api/announcements/{id}', method: 'PUT' },
  DELETE_ANNOUNCEMENT: { service: 'COMMUNICATION', path: '/api/announcements/{id}', method: 'DELETE' },
  SEND_ANNOUNCEMENT: { service: 'COMMUNICATION', path: '/api/announcements/{id}/send', method: 'POST' },
  SCHEDULE_ANNOUNCEMENT: { service: 'COMMUNICATION', path: '/api/announcements/{id}/schedule', method: 'POST' },
  GET_ANNOUNCEMENT_STATS: { service: 'COMMUNICATION', path: '/api/announcements/{id}/stats', method: 'GET' },
  GET_ANNOUNCEMENT_ANALYTICS: { service: 'COMMUNICATION', path: '/api/announcements/analytics', method: 'GET' },
  GET_USER_ANNOUNCEMENTS: { service: 'COMMUNICATION', path: '/api/announcements/user/my', method: 'GET' },
  MARK_ANNOUNCEMENT_VIEWED: { service: 'COMMUNICATION', path: '/api/announcements/{id}/view', method: 'POST' },
  MARK_ANNOUNCEMENT_CLICKED: { service: 'COMMUNICATION', path: '/api/announcements/{id}/click', method: 'POST' },
  GET_PUBLIC_ANNOUNCEMENTS: { service: 'COMMUNICATION', path: '/api/announcements/public', method: 'GET' },

  // ========== PROPERTY MANAGEMENT ENDPOINTS ==========
  GET_COMPANY_PROPERTIES: { service: 'PROPERTY', path: '/api/properties/company', method: 'GET' },
  GET_PENDING_PROPERTIES: { service: 'PROPERTY', path: '/api/properties/pending', method: 'GET' },
  GET_APPROVED_PROPERTIES: { service: 'PROPERTY', path: '/api/properties/approved', method: 'GET' },
  GET_REJECTED_PROPERTIES: { service: 'PROPERTY', path: '/api/properties/rejected', method: 'GET' },
  GET_BROKER_LISTINGS: { service: 'PROPERTY', path: '/api/properties/broker/listings', method: 'GET' },

  // ========== PROPERTY ACTIONS ==========
  CREATE_PROPERTY: { service: 'PROPERTY', path: '/api/properties', method: 'POST' },
  UPDATE_PROPERTY: { service: 'PROPERTY', path: '/api/properties/{id}', method: 'PUT' },
  DELETE_PROPERTY: { service: 'PROPERTY', path: '/api/properties/{id}', method: 'DELETE' },
  UPDATE_PROPERTY_STATUS: { service: 'PROPERTY', path: '/api/properties/{id}/status', method: 'PATCH' },
  UPDATE_PROPERTY_PRICE: { service: 'PROPERTY', path: '/api/properties/{id}/price', method: 'PATCH' },
  PROPERTY_ACTION: { service: 'PROPERTY', path: '/api/properties/{id}/action', method: 'POST' },

  // ========== SUPPORT ENDPOINTS ==========
  GET_TICKETS: { service: 'SUPPORT', path: '/api/support/tickets', method: 'GET' },
  GET_TICKET_BY_ID: { service: 'SUPPORT', path: '/api/support/tickets/{id}', method: 'GET' },
  CREATE_TICKET: { service: 'SUPPORT', path: '/api/support/tickets', method: 'POST' },
  GET_MY_TICKETS: { service: 'SUPPORT', path: '/api/support/tickets/my', method: 'GET' },
  RESPOND_TO_TICKET: { service: 'SUPPORT', path: '/api/support/tickets/{id}/respond', method: 'POST' },
  UPDATE_TICKET_STATUS: { service: 'SUPPORT', path: '/api/support/tickets/{id}/status', method: 'PUT' },
  ASSIGN_TICKET: { service: 'SUPPORT', path: '/api/support/tickets/{id}/assign', method: 'PUT' },
  GET_FAQS: { service: 'SUPPORT', path: '/api/support/faqs', method: 'GET' },
  GET_FAQ_BY_ID: { service: 'SUPPORT', path: '/api/support/faqs/{id}', method: 'GET' },
  CREATE_FAQ: { service: 'SUPPORT', path: '/api/support/faqs', method: 'POST' },
  UPDATE_FAQ: { service: 'SUPPORT', path: '/api/support/faqs/{id}', method: 'PUT' },
  DELETE_FAQ: { service: 'SUPPORT', path: '/api/support/faqs/{id}', method: 'DELETE' },
  MARK_FAQ_HELPFUL: { service: 'SUPPORT', path: '/api/support/faqs/{id}/helpful', method: 'POST' },
  GET_FLAGGED_CONTENT: { service: 'SUPPORT', path: '/api/support/flagged-content', method: 'GET' },
  GET_FLAG_BY_ID: { service: 'SUPPORT', path: '/api/support/flagged-content/{id}', method: 'GET' },
  RESOLVE_FLAG: { service: 'SUPPORT', path: '/api/support/flagged-content/{id}/resolve', method: 'PUT' },
  ASSIGN_FLAG: { service: 'SUPPORT', path: '/api/support/flagged-content/{id}/assign', method: 'PUT' },
  GET_REVIEWS: { service: 'SUPPORT', path: '/api/support/reviews', method: 'GET' },
  GET_AGENT_REVIEWS: { service: 'SUPPORT', path: '/api/support/reviews/{username}', method: 'GET' },
  CREATE_REVIEW: { service: 'SUPPORT', path: '/api/support/reviews', method: 'POST' },
  GET_ACTIVITIES: { service: 'SUPPORT', path: '/api/support/activity/activities', method: 'GET' },
  GET_AGENT_ACTIVITIES: { service: 'SUPPORT', path: '/api/support/activity/activities/{username}', method: 'GET' },
  GET_SUPPORT_ANALYTICS: { service: 'SUPPORT', path: '/api/support/analytics', method: 'GET' },
  GET_TEAM_ANALYTICS: { service: 'SUPPORT', path: '/api/support/activity/team-analytics', method: 'GET' },
  GET_PENDING_VERIFICATIONS: { service: 'SUPPORT', path: '/api/support/brokers/verification/pending', method: 'GET' },
  SUBMIT_VERIFICATION_REQUEST: { service: 'SUPPORT', path: '/api/support/brokers/verification/request', method: 'POST' },
  GET_VERIFICATION_STATUS: { service: 'SUPPORT', path: '/api/support/brokers/verification/status', method: 'GET' },
  REVIEW_VERIFICATION: { service: 'SUPPORT', path: '/api/support/brokers/verification/review', method: 'POST' },
  UPDATE_BROKER_STATUS: { service: 'SUPPORT', path: '/api/support/brokers/status', method: 'PUT' },
  GET_BROKER_ANALYTICS: { service: 'SUPPORT', path: '/api/support/brokers/analytics', method: 'GET' }

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
      if (options.body) {
        body = options.body;
        if (body instanceof FormData) {
          delete headers['Content-Type'];
        } else if (typeof body === 'string') {
          headers['Content-Type'] = 'application/json';
        }
      } else if (options.data) {
        if (options.data instanceof FormData) {
          body = options.data;
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
      hasToken: !!token,
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

      // Handle specific status codes
      if (response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Authentication required - Please log in again');
      }

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
      success: data?.success,
      message: data?.message,
      count: data?.data?.length || data?.length || 0
    });

    // Return the data directly
    return data;

  } catch (error) {
    console.error(`💥 apiCall [${endpointKey}] exception:`, error.message);

    // Provide more specific error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }

    if (error.message.includes('Authentication required')) {
      throw new Error('Please log in to continue');
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
};

// Direct API calls for common endpoints
export const directApi = {
  // Property endpoints
  getProperties: (params = {}) => apiCall('GET_PROPERTIES', {}, { data: params }),
  getPropertyById: (id) => apiCall('GET_PROPERTY_BY_ID', { id }),

  // Buyer endpoints
  getSavedProperties: () => apiCall('GET_SAVED_PROPERTIES'),
  saveProperty: (propertyId) => apiCall('SAVE_PROPERTY', { propertyId }),
  unsaveProperty: (propertyId) => apiCall('UNSAVE_PROPERTY', { propertyId }),
  checkSavedStatus: (propertyId) => apiCall('CHECK_SAVED_STATUS', { propertyId }),
  getRecommendedProperties: () => apiCall('GET_RECOMMENDED_PROPERTIES'),
  trackPropertyView: (propertyId) => apiCall('TRACK_PROPERTY_VIEW', { propertyId }),
  getPropertyStats: (propertyId) => apiCall('GET_PROPERTY_STATS', { propertyId }),

  // Application endpoints
  getApplications: () => apiCall('GET_APPLICATIONS'),
  createApplication: (data) => apiCall('CREATE_APPLICATION', {}, { data }),

  // ========== PAYMENT ENDPOINTS ==========
  initializePayment: (invoiceId, data) => apiCall('INITIALIZE_PAYMENT', { invoiceId }, { data }),
  verifyPayment: (transactionRef) => {
    console.log('🛠️ verifyPayment called with:', transactionRef);
    const result = apiCall('VERIFY_PAYMENT', {}, {
      data: { transaction_ref: transactionRef }
    });
    return result;
  },
  getPayment: (id) => apiCall('GET_PAYMENT', { id }),
  getUserPayments: (type = 'sent') => apiCall('GET_USER_PAYMENTS', {}, { data: { type } }),

  // ========== OFFER ENDPOINTS ==========
  createOffer: (data) => apiCall('CREATE_OFFER', {}, { data }),
  getOffer: (id) => apiCall('GET_OFFER', { id }),
  acceptOffer: (id, notes) => apiCall('ACCEPT_OFFER', { id }, { data: { responseNotes: notes } }),
  rejectOffer: (id, notes) => apiCall('REJECT_OFFER', { id }, { data: { responseNotes: notes } }),
  getPropertyOffers: (propertyId) => apiCall('GET_PROPERTY_OFFERS', { propertyId }),
  getUserOffers: (type = 'offered') => apiCall('GET_USER_OFFERS', {}, { data: { type } }),

  // ========== INVOICE ENDPOINTS ==========
  getInvoice: (id) => apiCall('GET_INVOICE', { id }),
  getUserInvoices: (type = 'from') => apiCall('GET_USER_INVOICES', {}, { data: { type } }),

  // ========== APPOINTMENT ENDPOINTS ==========
  getAppointments: () => apiCall('GET_APPOINTMENTS'),
  createAppointment: (data) => apiCall('CREATE_APPOINTMENT', {}, { data }),
  updateAppointmentStatus: (id, data) => apiCall('UPDATE_APPOINTMENT_STATUS', { id }, { data }),
  addAppointee: (appointmentId, data) => apiCall('ADD_APPOINTEE', { appointmentId }, { data }),

  // ========== TODO ENDPOINTS ==========
  getTodos: (filters = {}) => apiCall('GET_TODOS', {}, { data: filters }),
  getTodoById: (id) => apiCall('GET_TODO_BY_ID', { id }),
  createTodo: (data) => apiCall('CREATE_TODO', {}, { data }),
  updateTodo: (id, data) => apiCall('UPDATE_TODO', { id }, { data }),
  deleteTodo: (id) => apiCall('DELETE_TODO', { id }),
  updateTodoStatus: (id, data) => apiCall('UPDATE_TODO_STATUS', { id }, { data }),
  reorderTodos: (data) => apiCall('REORDER_TODOS', {}, { data }),
  getTeamMembers: (department = null) => apiCall('GET_TEAM_MEMBERS', {}, {
    data: department ? { department } : {}
  }),
  getTodoStats: () => apiCall('GET_TODO_STATS'),
  addTodoComment: (id, data) => apiCall('ADD_TODO_COMMENT', { id }, { data }),
  getTodoComments: (id) => apiCall('GET_TODO_COMMENTS', { id }),
  getUpcomingTodos: (limit = 10) => apiCall('GET_UPCOMING_TODOS', {}, {
    data: { limit }
  }),
  searchTodos: (q, filters = {}) => apiCall('SEARCH_TODOS', {}, {
    data: { q, ...filters }
  }),

  // ========== NOTIFICATION ENDPOINTS ==========
  getNotifications: (filters = {}) => apiCall('GET_NOTIFICATIONS', {}, { data: filters }),
  markNotificationRead: (id) => apiCall('MARK_NOTIFICATION_READ', { id }),
  getUnreadNotificationsCount: () => apiCall('GET_UNREAD_NOTIFICATIONS_COUNT'),

  // Debug endpoints
  debugDatabaseCheck: () => apiCall('DEBUG_DATABASE_CHECK'),
  debugSavedProperties: (userId) => apiCall('DEBUG_SAVED_PROPERTIES', { userId }),
  debugSaveTest: () => apiCall('DEBUG_SAVE_TEST'),
  debugPropertySaves: (propertyId) => apiCall('DEBUG_PROPERTY_SAVES', { propertyId }),

  createTestInvoice: (data) => apiCall('CREATE_TEST_INVOICE', {}, { data }),

  getTransactions: (params = {}) => apiCall('GET_TRANSACTIONS', {}, { data: params }),
  getTransactionHistory: (type = 'sent') => apiCall('GET_TRANSACTION_HISTORY', {}, { data: { type } }),

  getUsers: () => apiCall('GET_USERS'),
  getUserById: (id) => apiCall('GET_USER_BY_ID', { id }),
  createUser: (data) => apiCall('CREATE_USER', {}, { data }),
  updateUser: (id, data) => apiCall('UPDATE_USER', { id }, { data }),
  updateUserStatus: (id, data) => apiCall('UPDATE_USER_STATUS', { id }, { data }),
  updateUserRole: (id, data) => apiCall('UPDATE_USER_ROLE', { id }, { data }),
  deleteUser: (id) => apiCall('DELETE_USER', { id }),

  // ========== PROFILE ENDPOINTS ==========
  uploadProfilePicture: (data) => apiCall('UPLOAD_PROFILE_PICTURE', {}, {
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  updateProfile: (data) => apiCall('UPDATE_PROFILE', {}, { data }),
  updateUsername: (data) => apiCall('UPDATE_USERNAME', {}, { data }),
  getProfile: () => apiCall('GET_PROFILE'),

  // ========== VERIFICATION DOCUMENT ENDPOINTS ==========
  uploadVerificationDocument: (formData) => apiCall('UPLOAD_VERIFICATION_DOCUMENT', {}, {
    body: formData,
    headers: {} // Let browser set Content-Type for FormData
  }),
  getUserDocuments: () => apiCall('GET_USER_DOCUMENTS'),
  getVerificationStatus: () => apiCall('GET_VERIFICATION_STATUS'),
  resendVerificationEmail: (email) => apiCall('RESEND_VERIFICATION_EMAIL', {}, { data: { email } }),
  resendVerificationPublic: (email) => apiCall('RESEND_VERIFICATION_PUBLIC', {}, { data: { email } }),

  // ========== SYSTEM & ANALYTICS ENDPOINTS ==========
  getSystemHealth: () => apiCall('SYSTEM_HEALTH'),
  getServiceHealth: () => apiCall('GET_SERVICE_HEALTH'),
  getAnalytics: () => apiCall('GET_ANALYTICS'),

  // ========== VERIFICATION ENDPOINTS ==========
  getPendingUserVerifications: (params = {}) => apiCall('GET_PENDING_USER_VERIFICATIONS', {}, { data: params }),
  getVerifiedUsers: (params = {}) => apiCall('GET_VERIFIED_USERS', {}, { data: params }),
  getRejectedUsers: (params = {}) => apiCall('GET_REJECTED_USERS', {}, { data: params }),
  getVerificationStats: () => apiCall('GET_VERIFICATION_STATS'),
  reviewDocument: (documentId, data) => apiCall('REVIEW_DOCUMENT', { documentId }, { data }),
  completeUserVerification: (userId, data) => apiCall('COMPLETE_USER_VERIFICATION', { userId }, { data }),
  getUserVerificationStatus: (userId) => apiCall('GET_USER_VERIFICATION_STATUS', { userId }),
  requestResubmission: (userId, data) => apiCall('REQUEST_RESUBMISSION', { userId }, { data }),
  getVerificationHistory: (userId) => apiCall('GET_VERIFICATION_HISTORY', { userId }),
  reviewIndividualDocument: (documentId, data) => apiCall('REVIEW_INDIVIDUAL_DOCUMENT', { documentId }, { data }),
  getDocumentFeedback: (documentId) => apiCall('GET_DOCUMENT_FEEDBACK', { documentId }),


  // ========== ANNOUNCEMENT ENDPOINTS ==========
  getAnnouncements: (filters = {}) => apiCall('GET_ANNOUNCEMENTS', {}, { data: filters }),
  getAnnouncementById: (id) => apiCall('GET_ANNOUNCEMENT_BY_ID', { id }),
  createAnnouncement: (data) => apiCall('CREATE_ANNOUNCEMENT', {}, { data }),
  updateAnnouncement: (id, data) => apiCall('UPDATE_ANNOUNCEMENT', { id }, { data }),
  deleteAnnouncement: (id) => apiCall('DELETE_ANNOUNCEMENT', { id }),
  sendAnnouncement: (id, data) => apiCall('SEND_ANNOUNCEMENT', { id }, { data }),
  scheduleAnnouncement: (id, data) => apiCall('SCHEDULE_ANNOUNCEMENT', { id }, { data }),
  getAnnouncementStats: (id) => apiCall('GET_ANNOUNCEMENT_STATS', { id }),
  getAnnouncementAnalytics: (filters = {}) => apiCall('GET_ANNOUNCEMENT_ANALYTICS', {}, { data: filters }),
  getUserAnnouncements: (filters = {}) => apiCall('GET_USER_ANNOUNCEMENTS', {}, { data: filters }),
  markAnnouncementViewed: (id) => apiCall('MARK_ANNOUNCEMENT_VIEWED', { id }),
  markAnnouncementClicked: (id) => apiCall('MARK_ANNOUNCEMENT_CLICKED', { id }),
  getPublicAnnouncements: () => apiCall('GET_PUBLIC_ANNOUNCEMENTS'),

  // ========== PROPERTY MANAGEMENT ==========
  getCompanyProperties: (params = {}) => apiCall('GET_COMPANY_PROPERTIES', {}, { data: params }),
  getPendingProperties: (params = {}) => apiCall('GET_PENDING_PROPERTIES', {}, { data: params }),
  getApprovedProperties: (params = {}) => apiCall('GET_APPROVED_PROPERTIES', {}, { data: params }),
  getRejectedProperties: (params = {}) => apiCall('GET_REJECTED_PROPERTIES', {}, { data: params }),
  getBrokerListings: (params = {}) => apiCall('GET_BROKER_LISTINGS', {}, { data: params }),

  // ========== PROPERTY ACTIONS ==========
  createProperty: (data) => apiCall('CREATE_PROPERTY', {}, { data }),
  updateProperty: (id, data) => apiCall('UPDATE_PROPERTY', { id }, { data }),
  deleteProperty: (id) => apiCall('DELETE_PROPERTY', { id }),
  updatePropertyStatus: (id, data) => apiCall('UPDATE_PROPERTY_STATUS', { id }, { data }),
  updatePropertyPrice: (id, data) => apiCall('UPDATE_PROPERTY_PRICE', { id }, { data }),
  propertyAction: (id, data) => apiCall('PROPERTY_ACTION', { id }, { data }),


  // ========== SUPPORT ENDPOINTS ==========
  getTickets: () => apiCall('GET_TICKETS'),
  getTicketById: (id) => apiCall('GET_TICKET_BY_ID', { id }),
  respondToTicket: (id, data) => apiCall('RESPOND_TO_TICKET', { id }, { data }),
  updateTicketStatus: (id, data) => apiCall('UPDATE_TICKET_STATUS', { id }, { data }),
  getFAQs: () => apiCall('GET_FAQS'),
  getFAQById: (id) => apiCall('GET_FAQ_BY_ID', { id }),
  createFAQ: (data) => apiCall('CREATE_FAQ', {}, { data }),
  updateFAQ: (id, data) => apiCall('UPDATE_FAQ', { id }, { data }),
  deleteFAQ: (id) => apiCall('DELETE_FAQ', { id }),
  markFAQHelpful: (id) => apiCall('MARK_FAQ_HELPFUL', { id }),
  getFlaggedContent: () => apiCall('GET_FLAGGED_CONTENT'),
  getFlagById: (id) => apiCall('GET_FLAG_BY_ID', { id }),
  resolveFlag: (id, data) => apiCall('RESOLVE_FLAG', { id }, { data }),
  assignFlag: (id, data) => apiCall('ASSIGN_FLAG', { id }, { data }),
  getReviews: () => apiCall('GET_REVIEWS'),
  getAgentReviews: (username) => apiCall('GET_AGENT_REVIEWS', { username }),
  createReview: (data) => apiCall('CREATE_REVIEW', {}, { data }),
  getActivities: () => apiCall('GET_ACTIVITIES'),
  getAgentActivities: (username) => apiCall('GET_AGENT_ACTIVITIES', { username }),
  getSupportAnalytics: () => apiCall('GET_SUPPORT_ANALYTICS'),
  getTeamAnalytics: () => apiCall('GET_TEAM_ANALYTICS'),
  getPendingVerifications: (params = {}) => apiCall('GET_PENDING_VERIFICATIONS', {}, { data: params }),
  submitVerificationRequest: (data) => apiCall('SUBMIT_VERIFICATION_REQUEST', {}, { data }),
  getVerificationStatus: () => apiCall('GET_VERIFICATION_STATUS'),
  reviewVerification: (data) => apiCall('REVIEW_VERIFICATION', {}, { data }),
  updateBrokerStatus: (data) => apiCall('UPDATE_BROKER_STATUS', {}, { data }),
  getBrokerAnalytics: () => apiCall('GET_BROKER_ANALYTICS')

};

// Legacy exports for backward compatibility
export const apiClient = api;
export default api;