// API Configuration with environment variables
export const API_CONFIG = {
  // Base URLs from environment variables
  BASE_URL: import.meta.env.VITE_USER_API_URL?.replace('/api', '') || 'http://localhost:5000',
  NOTIFICATIONS_URL: import.meta.env.VITE_COMMUNICATION_API_URL?.replace('/api', '') || 'http://localhost:5001',
  
  // Try VITE_ANALYTICS_URL first, then REACT_APP_ANALYSIS_SERVICE_URL as fallback
  ANALYTICS_URL: import.meta.env.VITE_ANALYTICS_URL || import.meta.env.REACT_APP_ANALYSIS_SERVICE_URL || 'http://localhost:5004',
  
  CHAT_URL: import.meta.env.VITE_CHAT_URL || 'http://localhost:5001',
  WS_URL: import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:5001',
  
  // Endpoints
  ENDPOINTS: {
    // Auth endpoints
    CHECK_AUTH: '/api/auth/check',
    LOGOUT: '/api/auth/logout',
    CREATE_USER: '/api/auth/super-admin/create-user',
    UPLOAD_PROFILE: '/api/auth/upload',
    UPDATE_ROLE: '/api/auth/role',
    
    // User management
    USERS: '/api/users',
    USER_STATUS: '/api/users/{id}/status',
    USER_PRIVILEGES: '/api/users/{id}/privileges',
    
    // Analytics - MAIN ENDPOINT
    DASHBOARD_ANALYTICS: '/api/analytics/dashboard',
    
    // Analytics sub-endpoints (optional)
    ANALYTICS_USERS: '/api/analytics/users',
    ANALYTICS_PROPERTIES: '/api/analytics/properties',
    ANALYTICS_TRANSACTIONS: '/api/analytics/transactions',
    ANALYTICS_SYSTEM_HEALTH: '/api/analytics/system-health',
    
    // Activity logging
    ACTIVITY_LOG: '/api/analytics/activity',
    
    // Todo
    TODOS: '/api/todos',
    
    // Notifications
    NOTIFICATIONS: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_READ: '/api/notifications/{id}/read',
    MARK_ALL_READ: '/api/notifications/mark-all-read',
  }
};