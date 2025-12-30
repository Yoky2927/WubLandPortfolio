// frontend/src/utils/api.registry.js - CORRECTED VERSION
export class APIRegistry {
  static API_REGISTRY_URL = 'http://localhost:5008';
  static serviceCache = new Map();
  static registryAvailable = false;
  static initialized = false;

  // Initialize registry once
  static async initialize() {
    if (this.initialized) {
      return this.registryAvailable;
    }
    
    console.log('🚀 Initializing API Registry...');
    
    try {
      // Check if registry is available
      const healthResponse = await fetch(`${this.API_REGISTRY_URL}/health`, {
        timeout: 3000
      }).catch(() => null);
      
      if (healthResponse && healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ API Registry is healthy:', healthData);
        this.registryAvailable = true;
        
        // Try to get endpoints
        await this.fetchEndpoints();
      } else {
        console.warn('⚠️ API Registry health check failed, using fallback');
        this.registryAvailable = false;
        this.getFallbackEndpoints();
      }
      
      this.initialized = true;
      return this.registryAvailable;
      
    } catch (error) {
      console.error('❌ Failed to initialize API Registry:', error);
      this.registryAvailable = false;
      this.getFallbackEndpoints();
      this.initialized = true;
      return false;
    }
  }

  // Fetch endpoints from registry
  static async fetchEndpoints() {
    if (!this.registryAvailable) {
      return this.getFallbackEndpoints();
    }
    
    try {
      // Try different endpoint paths based on your registry
      const endpointsToTry = [
        '/api/registry/endpoints',
        '/api/endpoints',
        '/endpoints',
        '/registry',
        '/services'  // Try this based on health response showing "services"
      ];
      
      for (const endpoint of endpointsToTry) {
        try {
          console.log(`🔍 Trying registry endpoint: ${endpoint}`);
          const response = await fetch(`${this.API_REGISTRY_URL}${endpoint}`, {
            signal: AbortSignal.timeout(3000)
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Found valid endpoint at: ${endpoint}`, data);
            
            // Clear cache
            this.serviceCache.clear();
            
            // Process based on response format
            if (data.endpoints && Array.isArray(data.endpoints)) {
              // Format: { endpoints: [...] }
              data.endpoints.forEach(item => {
                const service = item.service || item.name || 'unknown';
                if (!this.serviceCache.has(service)) {
                  this.serviceCache.set(service, []);
                }
                this.serviceCache.get(service).push({
                  path: item.endpoint || item.path || item.url,
                  method: item.method || 'GET',
                  description: item.description || ''
                });
              });
            } else if (data.services && Array.isArray(data.services)) {
              // Format: { services: [...] }
              data.services.forEach(service => {
                if (service.endpoints && Array.isArray(service.endpoints)) {
                  if (!this.serviceCache.has(service.name)) {
                    this.serviceCache.set(service.name, []);
                  }
                  service.endpoints.forEach(endpoint => {
                    this.serviceCache.get(service.name).push({
                      path: endpoint.path || endpoint.url,
                      method: endpoint.method || 'GET',
                      description: endpoint.description || ''
                    });
                  });
                }
              });
            } else if (Array.isArray(data)) {
              // Format: array directly
              data.forEach(item => {
                const service = item.service || item.name || 'unknown';
                if (!this.serviceCache.has(service)) {
                  this.serviceCache.set(service, []);
                }
                this.serviceCache.get(service).push({
                  path: item.endpoint || item.path || item.url,
                  method: item.method || 'GET',
                  description: item.description || ''
                });
              });
            }
            
            console.log('📡 Registry endpoints loaded successfully');
            return this.serviceCache;
          }
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} failed:`, error.message);
          continue;
        }
      }
      
      // If no endpoint worked, use fallback
      console.warn('⚠️ Could not find valid endpoints endpoint, using fallback');
      return this.getFallbackEndpoints();
      
    } catch (error) {
      console.error('❌ Failed to fetch endpoints:', error);
      return this.getFallbackEndpoints();
    }
  }

  // Get endpoints (with caching)
  static async getServiceEndpoints(forceRefresh = false) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (forceRefresh || this.serviceCache.size === 0) {
      if (this.registryAvailable) {
        await this.fetchEndpoints();
      } else {
        this.getFallbackEndpoints();
      }
    }
    
    return this.serviceCache;
  }

  // Fallback endpoints (static configuration)
  static getFallbackEndpoints() {
    if (this.serviceCache.size === 0) {
      console.log('🔄 Loading fallback endpoints...');
      
      const fallbackConfig = {
        'user-service': [
          { path: '/api/auth/login', method: 'POST', description: 'User login' },
          { path: '/api/auth/register', method: 'POST', description: 'User registration' },
          { path: '/api/auth/check', method: 'GET', description: 'Check authentication' },
          { path: '/api/auth/logout', method: 'POST', description: 'User logout' },
          { path: '/api/auth/upload-profile-picture', method: 'POST', description: 'Upload profile picture' },
          { path: '/api/brokers', method: 'GET', description: 'Get all brokers' },
          { path: '/api/users/brokers', method: 'GET', description: 'Get brokers (alternative)' },
          { path: '/api/users', method: 'GET', description: 'Get all users' },
          { path: '/api/users/{id}', method: 'GET', description: 'Get user by ID' }
        ],
        'property-service': [
          { path: '/api/properties', method: 'GET', description: 'Get all properties' },
          { path: '/api/properties/{id}', method: 'GET', description: 'Get property by ID' },
          { path: '/api/properties/search', method: 'GET', description: 'Search properties' },
          { path: '/api/properties/featured', method: 'GET', description: 'Get featured properties' },
          { path: '/api/properties/requests', method: 'POST', description: 'Create property request' },
          { path: '/api/properties/requests/{id}/upload-image', method: 'POST', description: 'Upload property image' },
          { path: '/api/properties/requests/{id}/assign', method: 'POST', description: 'Assign broker to request' },
          { path: '/api/properties/requests/{id}', method: 'PUT', description: 'Update property request' },
          { path: '/api/properties/{id}/approve', method: 'PUT', description: 'Approve property' },
          { path: '/api/properties/{id}/reject', method: 'PUT', description: 'Reject property' }
        ],
        'communication-service': [
          { path: '/api/notifications', method: 'GET', description: 'Get notifications' },
          { path: '/api/notifications/unread-count', method: 'GET', description: 'Get unread notifications count' },
          { path: '/api/messages', method: 'GET', description: 'Get conversations' },
          { path: '/api/messages/{conversationId}', method: 'GET', description: 'Get messages in conversation' },
          { path: '/api/email/send', method: 'POST', description: 'Send email' }
        ],
        'transaction-service': [
          { path: '/api/transactions', method: 'GET', description: 'Get all transactions' },
          { path: '/api/transactions/{id}', method: 'GET', description: 'Get transaction by ID' },
          { path: '/api/transactions/create', method: 'POST', description: 'Create transaction' },
          { path: '/api/transactions/initiate-payment', method: 'POST', description: 'Initiate payment' }
        ],
        'support-service': [
          { path: '/api/support/tickets', method: 'GET', description: 'Get support tickets' },
          { path: '/api/support/analytics', method: 'GET', description: 'Get support analytics' }
        ],
        'todo-service': [
          { path: '/api/todos', method: 'GET', description: 'Get todos' },
          { path: '/api/todos/{id}', method: 'GET', description: 'Get todo by ID' }
        ],
        'analysis-service': [
          { path: '/api/analytics/dashboard', method: 'GET', description: 'Get dashboard analytics' },
          { path: '/api/analytics/users', method: 'GET', description: 'Get user analytics' },
          { path: '/api/analytics/properties', method: 'GET', description: 'Get property analytics' }
        ]
      };
      
      // Convert to Map
      Object.entries(fallbackConfig).forEach(([service, endpoints]) => {
        this.serviceCache.set(service, endpoints);
      });
      
      console.log('✅ Fallback endpoints loaded');
    }
    
    return this.serviceCache;
  }

  // Get service base URL
  static getServiceBaseUrl(serviceName) {
    const serviceMap = {
      'user-service': 'http://localhost:5000',
      'property-service': 'http://localhost:5002',
      'communication-service': 'http://localhost:5001',
      'transaction-service': 'http://localhost:5006',
      'support-service': 'http://localhost:5005',
      'todo-service': 'http://localhost:5003',
      'analysis-service': 'http://localhost:5004'
    };
    
    const baseUrl = serviceMap[serviceName];
    if (!baseUrl) {
      console.error(`❌ Unknown service: ${serviceName}`);
      throw new Error(`Unknown service: ${serviceName}`);
    }
    
    return baseUrl;
  }

  // Build complete URL
  static buildUrl(serviceName, endpointPath, params = {}) {
    const baseUrl = this.getServiceBaseUrl(serviceName);
    
    // Replace path parameters
    let processedPath = endpointPath;
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      if (processedPath.includes(placeholder)) {
        processedPath = processedPath.replace(placeholder, params[key]);
      }
    });
    
    return `${baseUrl}${processedPath}`;
  }

  // Main API call method
  static async call(serviceName, endpointPath, options = {}) {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    const url = this.buildUrl(serviceName, endpointPath, options.params || {});
    
    console.group(`📡 API Call [${serviceName}]`);
    console.log(`🔵 URL: ${url}`);
    console.log(`🔵 Method: ${options.method || 'GET'}`);
    
    try {
      // Prepare headers
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      // Handle FormData
      let body = options.body || options.data;
      if (body instanceof FormData) {
        delete headers['Content-Type'];
      } else if (body && typeof body === 'object') {
        body = JSON.stringify(body);
      }
      
      // Make the request
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body,
        signal: options.signal
      });
      
      // Parse response
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        responseData = { 
          success: false, 
          message: text || `HTTP ${response.status}: ${response.statusText}` 
        };
      }
      
      console.log(`📥 Response Status: ${response.status}`);
      console.log(`📥 Response Data:`, responseData);
      
      if (!response.ok) {
        // Handle specific errors
        if (response.status === 401) {
          console.warn('🔐 Unauthorized - clearing authentication');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-changed'));
        }
        
        throw new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.groupEnd();
      return responseData;
      
    } catch (error) {
      console.error(`❌ API Call failed:`, error);
      console.groupEnd();
      throw error;
    }
  }

  // Get services list
  static getServices() {
    return Array.from(this.serviceCache.keys());
  }

  // Get endpoints for a specific service
  static getServiceEndpointsList(serviceName) {
    return this.serviceCache.get(serviceName) || [];
  }

  // Test connection to a specific service
  static async testService(serviceName) {
    const baseUrl = this.getServiceBaseUrl(serviceName);
    
    try {
      const response = await fetch(`${baseUrl}/health`, {
        signal: AbortSignal.timeout(3000)
      });
      
      const isHealthy = response.ok;
      console.log(`🩺 ${serviceName}: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      return isHealthy;
      
    } catch (error) {
      console.log(`❌ ${serviceName} test failed:`, error.message);
      return false;
    }
  }
}

// Add fetch timeout polyfill if needed
if (!AbortSignal.timeout) {
  AbortSignal.timeout = function(ms) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new Error(`Timeout after ${ms}ms`)), ms);
    return controller.signal;
  };
}