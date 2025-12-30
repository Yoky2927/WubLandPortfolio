// backend/shared/api-docs.js - ES Module version
class ApiDocs {
  static services = {
    user: { port: 5000, name: 'User Service', basePath: '/api' },
    property: { port: 5002, name: 'Property Service', basePath: '/api/properties' },
    communication: { port: 5001, name: 'Communication Service', basePath: '/api' },
    transaction: { port: 5006, name: 'Transaction Service', basePath: '/api/transactions' },  // 5006
    support: { port: 5005, name: 'Support Service', basePath: '/api/support' },
    todo: { port: 5003, name: 'Todo Service', basePath: '/api/todos' },  // 5003
    analysis: { port: 5004, name: 'Analysis Service', basePath: '/api/analytics' }
  };

  static generateDocs(serviceName, endpoints) {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found in configuration`);
    }
    
    return {
      service: serviceName,
      serviceName: service.name,
      version: '1.0.0',
      basePath: service.basePath,
      port: service.port,
      timestamp: new Date().toISOString(),
      endpoints: endpoints.map(ep => ({
        method: ep.method,
        path: ep.path,
        description: ep.description,
        authRequired: ep.authRequired || false,
        roles: ep.roles || [],
        fullUrl: `http://localhost:${service.port}${ep.path}`
      })),
      healthCheck: `http://localhost:${service.port}/health`,
      testEndpoint: `http://localhost:${service.port}/test`
    };
  }

  static createRoute(method, path, description, authRequired = false, roles = []) {
    return {
      method: method.toUpperCase(),
      path,
      description,
      authRequired,
      roles
    };
  }
}

function createHealthCheck(serviceName) {
  return (req, res) => {
    const service = ApiDocs.services[serviceName];
    res.json({
      service: serviceName,
      serviceName: service?.name || serviceName,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: service?.port || 'unknown',
      docs: `http://localhost:${service?.port || 'unknown'}/api-docs`,
      test: `http://localhost:${service?.port || 'unknown'}/test`
    });
  };
}

// Export for ES Modules
export { ApiDocs, createHealthCheck };

// Export for CommonJS (for transaction-service)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiDocs, createHealthCheck };
}