// frontend/src/utils/api.client.js
class APIClient {
  constructor() {
    this.services = {
      'user': 'http://localhost:5000',
      'property': 'http://localhost:5002',
      'communication': 'http://localhost:5001',
      'transaction': 'http://localhost:5006',
      'support': 'http://localhost:5005',
      'todo': 'http://localhost:5003',
      'analysis': 'http://localhost:5004'
    };
  }

  // Get service URL
  getServiceUrl(service) {
    const url = this.services[service];
    if (!url) {
      throw new Error(`Unknown service: ${service}`);
    }
    return url;
  }

  // Build full URL
  buildUrl(service, endpoint) {
    const baseUrl = this.getServiceUrl(service);
    return `${baseUrl}${endpoint}`;
  }

  // Main API call method
  async call(service, endpoint, options = {}) {
    const url = this.buildUrl(service, endpoint);
    
    console.group(`📡 API Call [${service}]`);
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
        delete headers['Content-Type']; // Let browser set it
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

  // Shortcut methods
  async get(service, endpoint, options = {}) {
    return this.call(service, endpoint, { ...options, method: 'GET' });
  }

  async post(service, endpoint, data, options = {}) {
    return this.call(service, endpoint, { ...options, method: 'POST', data });
  }

  async put(service, endpoint, data, options = {}) {
    return this.call(service, endpoint, { ...options, method: 'PUT', data });
  }

  async delete(service, endpoint, options = {}) {
    return this.call(service, endpoint, { ...options, method: 'DELETE' });
  }

  // Test all services
  async testServices() {
    const results = {};
    
    for (const [service, url] of Object.entries(this.services)) {
      try {
        const response = await fetch(`${url}/health`, {
          signal: AbortSignal.timeout(2000)
        });
        results[service] = {
          healthy: response.ok,
          status: response.status,
          url
        };
        console.log(`✅ ${service}: ${response.ok ? 'Healthy' : 'Unhealthy'}`);
      } catch (error) {
        results[service] = {
          healthy: false,
          error: error.message,
          url
        };
        console.log(`❌ ${service}: ${error.message}`);
      }
    }
    
    return results;
  }
}

// Create and export a singleton instance
export const apiClient = new APIClient();