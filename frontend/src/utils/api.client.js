// src/utils/api.client.js - SIMPLE VERSION
// Re-export from api.endpoints.js for compatibility

// Import everything from api.endpoints.js
import { apiCall, api } from './api.endpoints.js';

// Export everything
export { apiCall, api};

// Export api as apiClient for backward compatibility
export { api as apiClient };

// Default export
export default api;