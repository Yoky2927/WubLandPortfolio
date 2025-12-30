// frontend/config/api.config.js - UPDATED WITH API REGISTRY INTEGRATION
import { APIRegistry } from '../../src/utils/api.registry';

export const API_CONFIG = {
  // Base URLs from environment variables
  BASE_URL: import.meta.env.VITE_USER_API_URL?.replace('/api', '') || 'http://localhost:5000',
  ANALYTICS_URL: import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:5004',
  PROPERTY_URL: import.meta.env.VITE_PROPERTY_API_URL || 'http://localhost:5002',
  TRANSACTION_URL: import.meta.env.VITE_TRANSACTION_API_URL || 'http://localhost:5006',
  COMMUNICATION_URL: import.meta.env.VITE_COMMUNICATION_URL || 'http://localhost:5001',
  CHAT_URL: import.meta.env.VITE_CHAT_URL || 'http://localhost:5001',
  WS_URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:5001',
  SUPPORT_URL: import.meta.env.VITE_SUPPORT_API_URL || 'http://localhost:5005',
  TODO_URL: import.meta.env.VITE_TODO_URL || 'http://localhost:5003',
  API_REGISTRY_URL: import.meta.env.VITE_API_REGISTRY_URL || 'http://localhost:5008',
  
  // Endpoints - Make sure all are defined
  ENDPOINTS: {
    // Auth endpoints (user-service: 5000)
    CHECK_AUTH: '/api/auth/check',
    LOGOUT: '/api/auth/logout',
    CREATE_USER: '/api/auth/super-admin/create-user',
    UPLOAD_PROFILE: '/api/auth/upload-profile-picture',
    UPDATE_ROLE: '/api/auth/role',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    
    // User management (user-service: 5000)
    USERS: '/api/users',
    USER_STATUS: '/api/users/{id}/status',
    USER_PRIVILEGES: '/api/users/{id}/privileges',
    USER_BY_ID: '/api/users/{id}',
    BROKERS: '/api/brokers',
    BROKERS_ALT: '/api/users/brokers',
    
    // Analytics endpoints (analysis-service: 5004)
    DASHBOARD_ANALYTICS: '/api/analytics/dashboard',
    ANALYTICS_USERS: '/api/analytics/users',
    ANALYTICS_PROPERTIES: '/api/analytics/properties',
    ANALYTICS_TRANSACTIONS: '/api/analytics/transactions',
    ANALYTICS_SYSTEM_HEALTH: '/api/analytics/system-health',
    
    // Broker-specific analytics endpoints (analysis-service: 5004)
    BROKER_ANALYTICS: '/api/analytics/broker/{brokerId}',
    BROKER_STATS: '/api/analytics/broker/statistics/{brokerId}',
    BROKER_CLIENTS: '/api/analytics/broker/clients/{brokerId}',
    
    // Broker-specific property endpoints (property-service: 5002)
    BROKER_PROPERTIES: '/api/properties/broker/listings',
    BROKER_PROPERTY_ACTION: '/api/properties/{propertyId}/action',
    
    // Property endpoints (property-service: 5002)
    PROPERTIES: '/api/properties',
    PROPERTY_BY_ID: '/api/properties/{id}',
    PROPERTY_SEARCH: '/api/properties/search',
    FEATURED_PROPERTIES: '/api/properties/featured',
    RECENT_PROPERTIES: '/api/properties/recent',
    PREMIUM_PROPERTIES: '/api/properties/premium',
    
    // Property requests (property-service: 5002)
    PROPERTY_REQUESTS: '/api/properties/requests',
    PROPERTY_REQUESTS_MY: '/api/properties/requests/my',
    PROPERTY_REQUESTS_PENDING: '/api/properties/requests/pending',
    PROPERTY_REQUEST_ASSIGN: '/api/properties/requests/{id}/assign',
    PROPERTY_REQUEST_UPLOAD_IMAGE: '/api/properties/requests/{id}/upload-image',
    PROPERTY_REQUEST_UPDATE: '/api/properties/requests/{id}',
    
    // Admin property endpoints (property-service: 5002)
    ADMIN_PROPERTIES: '/api/properties/admin/all',
    ADMIN_PROPERTY_STATUS: '/api/properties/admin/{id}/status',
    
    // Property management (property-service: 5002)
    APPROVE_PROPERTY: '/api/properties/{id}/approve',
    REJECT_PROPERTY: '/api/properties/{id}/reject',
    REQUEST_CHANGES: '/api/properties/{id}/request-changes',
    PROPERTY_IMAGES: '/api/properties/{id}/images',
    
    // Transaction endpoints (transaction-service: 5006)
    TRANSACTIONS: '/api/transactions',
    TRANSACTION_BY_ID: '/api/transactions/{id}',
    BROKER_TRANSACTIONS: '/api/transactions/broker/{brokerId}',
    TRANSACTION_CREATE: '/api/transactions/create',
    TRANSACTION_INITIATE_PAYMENT: '/api/transactions/initiate-payment',
    TRANSACTION_VERIFY_PAYMENT: '/api/transactions/verify-payment',
    
    // Broker profiles (user-service: 5000)
    BROKER_PROFILES: '/api/brokers',
    BROKER_PROFILE_BY_ID: '/api/brokers/{id}',
    
    // Activity logging (analysis-service: 5004)
    ACTIVITY_LOG: '/api/analytics/activity',
    
    // Todo (todo-service: 5003)
    TODOS: '/api/todos',
    TODO_BY_ID: '/api/todos/{id}',
    
    // Notifications (communication-service: 5001)
    NOTIFICATIONS: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_READ: '/api/notifications/{id}/read',
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    CREATE_NOTIFICATION: '/api/notifications',
    
    // Messages/Chat (communication-service: 5001)
    CHAT_CONVERSATIONS: '/api/messages',
    CHAT_MESSAGES: '/api/messages/{conversationId}',
    
    // Email (communication-service: 5001)
    EMAIL_SEND: '/api/email/send',
    
    // Internal notifications (communication-service: 5001)
    INTERNAL_NOTIFICATIONS: '/api/internal/notifications',
    
    // Support (support-service: 5005)
    SUPPORT_TICKETS: '/api/support/tickets',
    SUPPORT_ANALYTICS: '/api/support/analytics',
    
    // Documents (property-service: 5002)
    DOCUMENTS: '/api/properties/documents',
    UPLOAD_DOCUMENT: '/api/properties/documents/upload',
    
    // Admin analytics (analysis-service: 5004)
    ADMIN_ANALYTICS: '/api/analytics/admin/analytics',
    ADMIN_USERS_ANALYTICS: '/api/analytics/admin/analytics/users',
    ADMIN_PROPERTIES_ANALYTICS: '/api/analytics/admin/analytics/properties',
    ADMIN_TRANSACTIONS_ANALYTICS: '/api/analytics/admin/analytics/transactions',
    
    // Support analytics (support-service: 5005)
    SUPPORT_VERIFICATION_QUEUE: '/api/support/analytics/verification-queue',
    SUPPORT_FLAGGED_CONTENT_QUEUE: '/api/support/analytics/flagged-content-queue',
    
    // API Registry endpoints
    REGISTRY_HEALTH: '/api/registry/health',
    REGISTRY_ENDPOINTS: '/api/registry/endpoints',
    REGISTRY_SERVICES: '/api/registry/services',
  },
  
  // NEW: Service name mapping for API registry
  SERVICE_MAP: {
    'user-service': 'user',
    'property-service': 'property',
    'communication-service': 'communication',
    'transaction-service': 'transaction',
    'support-service': 'support',
    'todo-service': 'todo',
    'analysis-service': 'analysis'
  },
  
  // NEW: Get endpoint service mapping
  getEndpointService: function(endpointKey) {
    const serviceMapping = {
      // User service (5000)
      'CHECK_AUTH': 'user-service',
      'LOGOUT': 'user-service',
      'LOGIN': 'user-service',
      'REGISTER': 'user-service',
      'UPLOAD_PROFILE': 'user-service',
      'USERS': 'user-service',
      'USER_BY_ID': 'user-service',
      'BROKERS': 'user-service',
      'BROKERS_ALT': 'user-service',
      'BROKER_PROFILES': 'user-service',
      'BROKER_PROFILE_BY_ID': 'user-service',
      
      // Property service (5002)
      'PROPERTIES': 'property-service',
      'PROPERTY_BY_ID': 'property-service',
      'PROPERTY_SEARCH': 'property-service',
      'FEATURED_PROPERTIES': 'property-service',
      'RECENT_PROPERTIES': 'property-service',
      'PREMIUM_PROPERTIES': 'property-service',
      'PROPERTY_REQUESTS': 'property-service',
      'PROPERTY_REQUESTS_MY': 'property-service',
      'PROPERTY_REQUESTS_PENDING': 'property-service',
      'PROPERTY_REQUEST_ASSIGN': 'property-service',
      'PROPERTY_REQUEST_UPLOAD_IMAGE': 'property-service',
      'PROPERTY_REQUEST_UPDATE': 'property-service',
      'APPROVE_PROPERTY': 'property-service',
      'REJECT_PROPERTY': 'property-service',
      'PROPERTY_IMAGES': 'property-service',
      'DOCUMENTS': 'property-service',
      'UPLOAD_DOCUMENT': 'property-service',
      'BROKER_PROPERTIES': 'property-service',
      'BROKER_PROPERTY_ACTION': 'property-service',
      
      // Communication service (5001)
      'NOTIFICATIONS': 'communication-service',
      'UNREAD_COUNT': 'communication-service',
      'MARK_READ': 'communication-service',
      'MARK_ALL_READ': 'communication-service',
      'CREATE_NOTIFICATION': 'communication-service',
      'CHAT_CONVERSATIONS': 'communication-service',
      'CHAT_MESSAGES': 'communication-service',
      'EMAIL_SEND': 'communication-service',
      'INTERNAL_NOTIFICATIONS': 'communication-service',
      
      // Transaction service (5006)
      'TRANSACTIONS': 'transaction-service',
      'TRANSACTION_BY_ID': 'transaction-service',
      'BROKER_TRANSACTIONS': 'transaction-service',
      'TRANSACTION_CREATE': 'transaction-service',
      'TRANSACTION_INITIATE_PAYMENT': 'transaction-service',
      'TRANSACTION_VERIFY_PAYMENT': 'transaction-service',
      
      // Support service (5005)
      'SUPPORT_TICKETS': 'support-service',
      'SUPPORT_ANALYTICS': 'support-service',
      'SUPPORT_VERIFICATION_QUEUE': 'support-service',
      'SUPPORT_FLAGGED_CONTENT_QUEUE': 'support-service',
      
      // Todo service (5003)
      'TODOS': 'todo-service',
      'TODO_BY_ID': 'todo-service',
      
      // Analysis service (5004)
      'DASHBOARD_ANALYTICS': 'analysis-service',
      'ANALYTICS_USERS': 'analysis-service',
      'ANALYTICS_PROPERTIES': 'analysis-service',
      'ANALYTICS_TRANSACTIONS': 'analysis-service',
      'ANALYTICS_SYSTEM_HEALTH': 'analysis-service',
      'BROKER_ANALYTICS': 'analysis-service',
      'BROKER_STATS': 'analysis-service',
      'BROKER_CLIENTS': 'analysis-service',
      'ACTIVITY_LOG': 'analysis-service',
      'ADMIN_ANALYTICS': 'analysis-service',
      'ADMIN_USERS_ANALYTICS': 'analysis-service',
      'ADMIN_PROPERTIES_ANALYTICS': 'analysis-service',
      'ADMIN_TRANSACTIONS_ANALYTICS': 'analysis-service',
    };
    
    return serviceMapping[endpointKey] || 'user-service'; // Default to user-service
  },
  
  // ENHANCED: Build URL with API registry integration
  getUrl: async function(endpointKey, params = {}, options = {}) {
    // Get the endpoint template
    let endpoint = this.ENDPOINTS[endpointKey];
    if (!endpoint) {
      console.error(`❌ Endpoint "${endpointKey}" not found in API_CONFIG.ENDPOINTS`);
      console.log(`   Available endpoints:`, Object.keys(this.ENDPOINTS).sort());
      return '';
    }
    
    // Replace path parameters
    let processedEndpoint = endpoint;
    Object.keys(params).forEach(key => {
      processedEndpoint = processedEndpoint.replace(`{${key}}`, params[key]);
    });
    
    // Determine which service this endpoint belongs to
    const serviceName = this.getEndpointService(endpointKey);
    const serviceShortName = this.SERVICE_MAP[serviceName] || serviceName;
    
    console.group(`🔗 Building URL [${endpointKey}]`);
    console.log(`   Service: ${serviceName} (${serviceShortName})`);
    console.log(`   Endpoint: ${processedEndpoint}`);
    console.log(`   Parameters:`, params);
    
    try {
      // Try to get URL from API registry first (if not disabled)
      if (!options.disableRegistry) {
        try {
          const registryUrl = await this.getUrlFromRegistry(serviceName, processedEndpoint);
          if (registryUrl) {
            console.log(`   ✅ Using API Registry URL: ${registryUrl}`);
            console.groupEnd();
            return registryUrl;
          }
        } catch (registryError) {
          console.warn(`   ⚠️ API Registry unavailable, using fallback: ${registryError.message}`);
        }
      }
      
      // Fallback: Use static service mapping
      const baseUrl = this.getServiceBaseUrl(serviceName);
      const finalUrl = `${baseUrl}${processedEndpoint}`;
      
      console.log(`   🔄 Using fallback URL: ${finalUrl}`);
      console.groupEnd();
      
      return finalUrl;
      
    } catch (error) {
      console.error(`   ❌ Error building URL:`, error);
      console.groupEnd();
      return '';
    }
  },
  
  // NEW: Get URL from API registry
  getUrlFromRegistry: async function(serviceName, endpointPath) {
    try {
      // Initialize registry if needed
      await APIRegistry.getServiceEndpoints();
      
      // Get the service URL from registry
      const servicePorts = {
        'user-service': 5000,
        'property-service': 5002,
        'communication-service': 5001,
        'transaction-service': 5006,
        'support-service': 5005,
        'todo-service': 5003,
        'analysis-service': 5004
      };
      
      const port = servicePorts[serviceName];
      if (!port) {
        throw new Error(`Unknown service: ${serviceName}`);
      }
      
      return `http://localhost:${port}${endpointPath}`;
      
    } catch (error) {
      console.warn(`API Registry error for ${serviceName}:`, error);
      return null;
    }
  },
  
  // Get base URL for a service (fallback method)
  getServiceBaseUrl: function(serviceName) {
    const serviceMap = {
      'user-service': this.BASE_URL,
      'property-service': this.PROPERTY_URL,
      'communication-service': this.COMMUNICATION_URL,
      'transaction-service': this.TRANSACTION_URL,
      'support-service': this.SUPPORT_URL,
      'todo-service': this.TODO_URL,
      'analysis-service': this.ANALYTICS_URL
    };
    
    const baseUrl = serviceMap[serviceName];
    if (!baseUrl) {
      console.warn(`Service ${serviceName} not found in service map, using default`);
      return this.BASE_URL;
    }
    
    return baseUrl;
  },
  
  // NEW: Get service URL directly
  getServiceUrl: function(serviceShortName, path = '') {
    const services = {
      'user': this.BASE_URL,
      'property': this.PROPERTY_URL,
      'communication': this.COMMUNICATION_URL,
      'transaction': this.TRANSACTION_URL,
      'support': this.SUPPORT_URL,
      'todo': this.TODO_URL,
      'analysis': this.ANALYTICS_URL
    };
    
    if (!services[serviceShortName]) {
      console.warn(`Service ${serviceShortName} not found in config`);
      return null;
    }
    
    return `${services[serviceShortName]}${path}`;
  },
  
  // NEW: Make API call with enhanced features
  async apiCall(endpointKey, options = {}) {
    const {
      params = {},
      data,
      method = 'GET',
      headers = {},
      disableRegistry = false
    } = options;
    
    try {
      // Build URL with registry integration
      const url = await this.getUrl(endpointKey, params, { disableRegistry });
      
      if (!url) {
        throw new Error(`Failed to build URL for ${endpointKey}`);
      }
      
      // Prepare request headers
      const token = localStorage.getItem('token');
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };
      
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
      
      // Handle FormData (for file uploads)
      let body;
      if (data instanceof FormData) {
        body = data;
        delete requestHeaders['Content-Type']; // Let browser set content-type for FormData
      } else if (data) {
        body = JSON.stringify(data);
      }
      
      console.group(`📡 API Call [${endpointKey}]`);
      console.log(`   URL: ${url}`);
      console.log(`   Method: ${method}`);
      console.log(`   Headers:`, requestHeaders);
      console.log(`   Body:`, data instanceof FormData ? '[FormData]' : data);
      
      // Make the request
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body,
        credentials: 'include'
      });
      
      // Handle response
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        responseData = { 
          success: false, 
          message: text || `HTTP ${response.status} ${response.statusText}` 
        };
      }
      
      console.log(`   Response Status: ${response.status}`);
      console.log(`   Response Data:`, responseData);
      
      if (!response.ok) {
        // Handle auth errors
        if (response.status === 401) {
          console.warn('Authentication error, clearing local storage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-changed'));
        }
        
        throw new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.groupEnd();
      return responseData;
      
    } catch (error) {
      console.error(`❌ API Call failed [${endpointKey}]:`, error);
      console.groupEnd();
      
      // Re-throw with better context
      throw new Error(`API Error [${endpointKey}]: ${error.message}`);
    }
  },
  
  // NEW: Make direct service call (compatible with APIRegistry pattern)
  async serviceCall(serviceShortName, endpointPath, options = {}) {
    const serviceNameMap = {
      'user': 'user-service',
      'property': 'property-service',
      'communication': 'communication-service',
      'transaction': 'transaction-service',
      'support': 'support-service',
      'todo': 'todo-service',
      'analysis': 'analysis-service'
    };
    
    const serviceName = serviceNameMap[serviceShortName];
    if (!serviceName) {
      throw new Error(`Unknown service: ${serviceShortName}`);
    }
    
    // Find the endpoint key that matches this path
    let endpointKey = null;
    for (const [key, value] of Object.entries(this.ENDPOINTS)) {
      if (value === endpointPath) {
        endpointKey = key;
        break;
      }
    }
    
    if (endpointKey) {
      // Use the standard apiCall with the found endpoint key
      return this.apiCall(endpointKey, options);
    } else {
      // Direct call with custom endpoint
      const baseUrl = this.getServiceUrl(serviceShortName);
      const url = `${baseUrl}${endpointPath}`;
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      console.log(`📡 Direct Service Call [${serviceShortName}]: ${url}`);
      
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.data ? JSON.stringify(options.data) : undefined
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}`);
      }
      
      return responseData;
    }
  },
  
  // NEW: Test API registry connection
  async testRegistryConnection() {
    try {
      console.log('🔄 Testing API Registry connection...');
      const response = await fetch(`${this.API_REGISTRY_URL}${this.ENDPOINTS.REGISTRY_HEALTH}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Registry is healthy:', data);
        return { success: true, data };
      } else {
        console.warn('⚠️ API Registry returned non-OK status:', response.status);
        return { success: false, status: response.status };
      }
    } catch (error) {
      console.warn('❌ API Registry connection failed:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  // NEW: Get all services from registry
  async getRegistryServices() {
    try {
      const response = await fetch(`${this.API_REGISTRY_URL}${this.ENDPOINTS.REGISTRY_SERVICES}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.services || [];
      }
      
      return [];
    } catch (error) {
      console.warn('Failed to get services from registry:', error);
      return [];
    }
  }
};