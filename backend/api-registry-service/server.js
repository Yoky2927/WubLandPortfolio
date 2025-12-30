// backend/api-registry-service/server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 5008;

app.use(cors());
app.use(express.json());

// CORRECT Microservices configuration - match actual ports from your netstat
const SERVICES = {
  user: { port: 5000, name: 'User Service', basePath: '/api' },
  property: { port: 5002, name: 'Property Service', basePath: '/api/properties' },
  communication: { port: 5001, name: 'Communication Service', basePath: '/api' },
  transaction: { port: 5006, name: 'Transaction Service', basePath: '/api/transactions' },
  support: { port: 5005, name: 'Support Service', basePath: '/api/support' },
  todo: { port: 5003, name: 'Todo Service', basePath: '/api/todos' },
  analysis: { port: 5004, name: 'Analysis Service', basePath: '/api/analytics' }
};

// Store discovered endpoints
let serviceRegistry = {};

// Discover endpoints from a service
async function discoverService(serviceName, config) {
  try {
    // Try /api-docs endpoint first
    const response = await axios.get(`http://localhost:${config.port}/api-docs`, {
      timeout: 3000
    });
    
    serviceRegistry[serviceName] = {
      ...config,
      ...response.data,
      status: 'online',
      lastChecked: new Date().toISOString()
    };
    
    console.log(`✅ ${serviceName}: ${response.data.endpoints?.length || 0} endpoints`);
    return true;
  } catch (error) {
    try {
      // Fallback to /health endpoint
      const healthResponse = await axios.get(`http://localhost:${config.port}/health`, {
        timeout: 2000
      });
      
      serviceRegistry[serviceName] = {
        ...config,
        endpoints: [],
        status: 'online',
        lastChecked: new Date().toISOString(),
        health: healthResponse.data,
        fallback: true
      };
      
      console.log(`⚠️ ${serviceName}: Using fallback (health endpoint only)`);
      return true;
    } catch (healthError) {
      serviceRegistry[serviceName] = {
        ...config,
        status: 'offline',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
      console.log(`❌ ${serviceName}: ${error.message}`);
      return false;
    }
  }
}

// Discover all services on startup
async function discoverAllServices() {
  console.log('🔄 Discovering microservices...');
  
  const promises = Object.entries(SERVICES).map(([name, config]) => 
    discoverService(name, config)
  );
  
  await Promise.all(promises);
  console.log('✅ Discovery complete\n');
  
  // Refresh every 30 seconds
  setTimeout(discoverAllServices, 30000);
}

// API Registry endpoints
app.get('/api/registry', (req, res) => {
  const summary = Object.entries(serviceRegistry).map(([name, service]) => ({
    name: service.name,
    port: service.port,
    status: service.status,
    endpointCount: service.endpoints?.length || 0,
    basePath: service.basePath,
    lastChecked: service.lastChecked,
    fallback: service.fallback || false
  }));
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    services: summary
  });
});

app.get('/api/registry/:service', (req, res) => {
  const { service } = req.params;
  
  if (!serviceRegistry[service]) {
    return res.status(404).json({
      success: false,
      message: `Service ${service} not found`
    });
  }
  
  res.json({
    success: true,
    data: serviceRegistry[service]
  });
});

app.get('/api/registry/search/endpoints', (req, res) => {
  const { q, method, service } = req.query;
  let results = [];
  
  Object.entries(serviceRegistry).forEach(([svcName, svc]) => {
    if (service && svcName !== service) return;
    
    svc.endpoints?.forEach(endpoint => {
      if (method && endpoint.method !== method.toUpperCase()) return;
      if (q && !endpoint.path.toLowerCase().includes(q.toLowerCase()) && 
          !endpoint.description?.toLowerCase().includes(q.toLowerCase())) return;
      
      results.push({
        service: svcName,
        serviceName: svc.name,
        method: endpoint.method,
        path: endpoint.path,
        fullUrl: `http://localhost:${svc.port}${endpoint.path}`,
        description: endpoint.description,
        authRequired: endpoint.authRequired,
        roles: endpoint.roles
      });
    });
  });
  
  res.json({
    success: true,
    count: results.length,
    data: results
  });
});

app.get('/api/registry/lookup', (req, res) => {
  const { path } = req.query;
  
  if (!path) {
    return res.status(400).json({
      success: false,
      message: 'Path query parameter is required'
    });
  }
  
  const matches = [];
  
  Object.entries(serviceRegistry).forEach(([svcName, svc]) => {
    svc.endpoints?.forEach(endpoint => {
      if (path.includes(endpoint.path) || endpoint.path.includes(path)) {
        matches.push({
          service: svcName,
          serviceName: svc.name,
          method: endpoint.method,
          path: endpoint.path,
          fullUrl: `http://localhost:${svc.port}${endpoint.path}`,
          description: endpoint.description
        });
      }
    });
  });
  
  res.json({
    success: true,
    data: matches
  });
});

// Test all services endpoint
app.get('/api/registry/test/all', async (req, res) => {
  const testResults = [];
  
  for (const [name, config] of Object.entries(SERVICES)) {
    try {
      const healthResponse = await axios.get(`http://localhost:${config.port}/health`, {
        timeout: 2000
      });
      
      testResults.push({
        service: name,
        port: config.port,
        status: 'online',
        health: healthResponse.data
      });
    } catch (error) {
      testResults.push({
        service: name,
        port: config.port,
        status: 'offline',
        error: error.message
      });
    }
  }
  
  res.json({
    success: true,
    data: testResults
  });
});

// Health endpoint
app.get('/health', (req, res) => {
  const onlineServices = Object.values(serviceRegistry).filter(s => s.status === 'online').length;
  const totalServices = Object.keys(SERVICES).length;
  
  res.json({
    service: 'api-registry',
    serviceName: 'API Registry',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      online: onlineServices,
      total: totalServices,
      percentage: Math.round((onlineServices / totalServices) * 100)
    }
  });
});

// Start the registry
app.listen(PORT, async () => {
  console.log(`📚 API Registry running on http://localhost:${PORT}`);
  console.log(`🔗 Endpoints:`);
  console.log(`   - GET  /api/registry          - Service summary`);
  console.log(`   - GET  /api/registry/:service - Service details`);
  console.log(`   - GET  /api/registry/search/endpoints - Search endpoints`);
  console.log(`   - GET  /api/registry/lookup   - Lookup endpoint by path`);
  console.log(`   - GET  /api/registry/test/all - Test all services`);
  console.log(`   - GET  /health                - Registry health\n`);
  
  await discoverAllServices();
});