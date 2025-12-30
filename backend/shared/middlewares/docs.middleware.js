// backend/shared/middlewares/docs.middleware.js
export function createDocsMiddleware(serviceName, routeDefinitions = []) {
  return (req, res, next) => {
    if (req.path === '/api-docs/routes') {
      return res.json({
        service: serviceName,
        version: '1.0.0',
        basePath: req.baseUrl,
        endpoints: routeDefinitions
      });
    }
    next();
  };
}

// Helper to define routes
export function defineRoute(method, path, description, authRequired = false, roles = []) {
  return {
    method,
    path,
    description,
    authRequired,
    roles,
    example: `// Example request
fetch('http://localhost:PORT${path}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json',
    ${authRequired ? "'Authorization': 'Bearer YOUR_TOKEN'," : ""}
  },
  ${['POST', 'PUT', 'PATCH'].includes(method) ? "body: JSON.stringify({})," : ""}
})`
  };
}

// Health check endpoint generator
export function createHealthCheck(serviceName) {
  return (req, res) => {
    res.json({
      service: serviceName,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      endpoints: `http://localhost:${req.socket.localPort}/api-docs/routes`
    });
  };
}