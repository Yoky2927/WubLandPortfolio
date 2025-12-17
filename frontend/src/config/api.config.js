// api.config.js - Fixed routing for broker properties
export const API_CONFIG = {
  // Base URLs from environment variables
  BASE_URL: import.meta.env.VITE_USER_API_URL?.replace('/api', '') || 'http://localhost:5000',
  ANALYTICS_URL: import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:5004',
  PROPERTY_URL: import.meta.env.VITE_PROPERTY_API_URL || 'http://localhost:5002',
  TRANSACTION_URL: import.meta.env.VITE_TRANSACTION_API_URL || 'http://localhost:5001',
  CHAT_URL: import.meta.env.VITE_CHAT_URL || 'http://localhost:5001',
  WS_URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:5001',
  SUPPORT_URL: import.meta.env.VITE_SUPPORT_API_URL || 'http://localhost:5005',
  
  // Endpoints - Make sure all are defined
  ENDPOINTS: {
    // Auth endpoints
    CHECK_AUTH: '/api/auth/check',
    LOGOUT: '/api/auth/logout',
    CREATE_USER: '/api/auth/super-admin/create-user',
    UPLOAD_PROFILE: '/api/auth/upload',
    UPDATE_ROLE: '/api/auth/role',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    
    // User management
    USERS: '/api/users',
    USER_STATUS: '/api/users/{id}/status',
    USER_PRIVILEGES: '/api/users/{id}/privileges',
    USER_BY_ID: '/api/users/{id}',
    
    // Analytics endpoints (analysis-service)
    DASHBOARD_ANALYTICS: '/api/analytics/dashboard',
    ANALYTICS_USERS: '/api/analytics/users',
    ANALYTICS_PROPERTIES: '/api/analytics/properties',
    ANALYTICS_TRANSACTIONS: '/api/analytics/transactions',
    ANALYTICS_SYSTEM_HEALTH: '/api/analytics/system-health',
    
    // Broker-specific analytics endpoints (analysis-service)
    BROKER_ANALYTICS: '/api/analytics/broker/{brokerId}',
    BROKER_STATS: '/api/analytics/broker/statistics/{brokerId}',
    BROKER_CLIENTS: '/api/analytics/broker/clients/{brokerId}',
    
    // Broker-specific property endpoints (property-service)
    BROKER_PROPERTIES: '/api/properties/broker/listings',
    BROKER_PROPERTY_ACTION: '/api/properties/{propertyId}/action',
    
    // Property endpoints (property-service)
    PROPERTIES: '/api/properties',
    PROPERTY_BY_ID: '/api/properties/{id}',
    PROPERTY_SEARCH: '/api/properties/search',
    FEATURED_PROPERTIES: '/api/properties/featured',
    RECENT_PROPERTIES: '/api/properties/recent',
    PREMIUM_PROPERTIES: '/api/properties/premium',
    
    // Admin property endpoints (property-service)
    ADMIN_PROPERTIES: '/api/properties/admin/all',
    ADMIN_PROPERTY_STATUS: '/api/properties/admin/{id}/status',
    
    // Property management (property-service)
    APPROVE_PROPERTY: '/api/properties/{id}/approve',
    REJECT_PROPERTY: '/api/properties/{id}/reject',
    REQUEST_CHANGES: '/api/properties/{id}/request-changes',
    PROPERTY_IMAGES: '/api/properties/{id}/images',
    
    // Transaction endpoints
    TRANSACTIONS: '/api/transactions',
    TRANSACTION_BY_ID: '/api/transactions/{id}',
    BROKER_TRANSACTIONS: '/api/transactions/broker/{brokerId}',
    
    // Broker profiles
    BROKER_PROFILES: '/api/brokers',
    BROKER_PROFILE_BY_ID: '/api/brokers/{id}',
    
    // Activity logging
    ACTIVITY_LOG: '/api/analytics/activity',
    
    // Todo
    TODOS: '/api/todos',
    TODO_BY_ID: '/api/todos/{id}',
    
    // Notifications
    NOTIFICATIONS: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_READ: '/api/notifications/{id}/read',
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    CREATE_NOTIFICATION: '/api/notifications',
    
    // Chat
    CHAT_CONVERSATIONS: '/api/chat/conversations',
    CHAT_MESSAGES: '/api/chat/conversations/{conversationId}/messages',
    
    // Support
    SUPPORT_TICKETS: '/api/support/tickets',
    SUPPORT_ANALYTICS: '/api/support/analytics',
    
    // Documents
    DOCUMENTS: '/api/documents',
    UPLOAD_DOCUMENT: '/api/documents/upload',
    
    // Admin analytics
    ADMIN_ANALYTICS: '/api/analytics/admin/analytics',
    ADMIN_USERS_ANALYTICS: '/api/analytics/admin/analytics/users',
    ADMIN_PROPERTIES_ANALYTICS: '/api/analytics/admin/analytics/properties',
    ADMIN_TRANSACTIONS_ANALYTICS: '/api/analytics/admin/analytics/transactions',
    
    // Support analytics
    SUPPORT_VERIFICATION_QUEUE: '/api/analytics/support/verification-queue',
    SUPPORT_FLAGGED_CONTENT_QUEUE: '/api/analytics/support/flagged-content-queue',
  },
  
  // Helper function to build complete URLs with debugging
  getUrl: function(endpointKey, params = {}) {
    // Get the endpoint template
    let endpoint = this.ENDPOINTS[endpointKey];
    if (!endpoint) {
      console.error(`❌ CRITICAL ERROR: Endpoint "${endpointKey}" not found in API_CONFIG.ENDPOINTS`);
      console.log(`   Available endpoints:`, Object.keys(this.ENDPOINTS).sort());
      return '';
    }
    
    // Debug info
    console.group(`🔗 Building URL for ${endpointKey}`);
    console.log(`   Template: ${endpoint}`);
    console.log(`   Parameters:`, params);
    
    // Replace path parameters
    let processedEndpoint = endpoint;
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      if (processedEndpoint.includes(placeholder)) {
        processedEndpoint = processedEndpoint.replace(placeholder, params[key]);
        console.log(`   Replaced ${placeholder} with ${params[key]}`);
      }
    });
    
    // Check for remaining placeholders
    const remainingPlaceholders = processedEndpoint.match(/\{[^}]+\}/g);
    if (remainingPlaceholders) {
      console.warn(`   ⚠️ Warning: Unreplaced placeholders: ${remainingPlaceholders.join(', ')}`);
    }
    
    // Determine which base URL to use - FIXED ROUTING
    let baseUrl = this.BASE_URL;
    
    // Analytics endpoints go to analysis service
    if (endpointKey.includes('ANALYTICS') || 
        (endpointKey.includes('BROKER_') && 
         !endpointKey.includes('BROKER_PROPERTY') &&
         !endpointKey.includes('BROKER_PROFILE') &&
         !endpointKey.includes('BROKER_TRANSACTIONS'))) {
      baseUrl = this.ANALYTICS_URL;
      console.log(`   📊 Using Analytics Service: ${baseUrl}`);
    }
    // ALL property-related endpoints (including broker properties) go to property service
    else if (endpointKey.includes('PROPERTY') || 
             endpointKey.includes('BROKER_PROPERTY') ||
             endpointKey.includes('FEATURED') ||
             endpointKey.includes('RECENT') ||
             endpointKey.includes('PREMIUM') ||
             endpointKey.includes('APPROVE_PROPERTY') ||
             endpointKey.includes('REJECT_PROPERTY') ||
             endpointKey.includes('REQUEST_CHANGES')) {
      baseUrl = this.PROPERTY_URL;
      console.log(`   🏠 Using Property Service: ${baseUrl}`);
    }
    // Transaction endpoints go to transaction service
    else if (endpointKey.includes('TRANSACTION')) {
      baseUrl = this.TRANSACTION_URL;
      console.log(`   💰 Using Transaction Service: ${baseUrl}`);
    }
    // Support endpoints go to support service
    else if (endpointKey.includes('SUPPORT')) {
      baseUrl = this.SUPPORT_URL;
      console.log(`   🛟 Using Support Service: ${baseUrl}`);
    }
    // Chat endpoints
    else if (endpointKey.includes('CHAT')) {
      baseUrl = this.CHAT_URL;
      console.log(`   💬 Using Chat Service: ${baseUrl}`);
    }
    // Broker profiles (user service)
    else if (endpointKey.includes('BROKER_PROFILE')) {
      console.log(`   👤 Using User Service for broker profiles: ${baseUrl}`);
    }
    // Auth and user endpoints go to user service
    else {
      console.log(`   👤 Using User Service (default): ${baseUrl}`);
    }
    
    const finalUrl = `${baseUrl}${processedEndpoint}`;
    console.log(`   ✅ Final URL: ${finalUrl}`);
    console.groupEnd();
    
    return finalUrl;
  }
};