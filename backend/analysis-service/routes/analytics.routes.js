// routes/analytics.routes.js
import express from 'express';
import {
  getDashboardAnalytics,
  getSystemHealth
} from '../controllers/shared.controllers.js';

// Import broker controllers
import {
  getBrokerAnalytics,
  getBrokerStatistics,
  getBrokerProperties,
  getBrokerClients,
  handlePropertyAction
} from '../controllers/broker.controllers.js';

// Import admin controllers
import {
  getAdminAnalytics,
  getUserAnalytics,
  getPropertyAnalytics,
  getTransactionAnalytics
} from '../controllers/admin.controllers.js';

// Import support controllers
import {
  getSupportAnalytics,
  getUserVerificationQueue,
  getFlaggedContentQueue
} from '../controllers/support.controllers.js';

const router = express.Router();

// ========================
// HEALTH AND STATUS ENDPOINTS
// ========================

router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'analysis-service',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['broker-analytics', 'admin-analytics', 'support-analytics', 'shared-analytics']
  });
});

router.get('/status', (req, res) => {
  res.json({
    service: 'analysis-service',
    status: 'operational',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ========================
// SHARED ANALYTICS ENDPOINTS (All roles)
// ========================

router.get('/dashboard', getDashboardAnalytics);
router.get('/system-health', getSystemHealth);

// ========================
// BROKER-SPECIFIC ENDPOINTS
// ========================

// Main broker analytics endpoint
router.get('/broker/:brokerId', getBrokerAnalytics);

// Broker quick statistics
router.get('/broker/statistics/:brokerId', getBrokerStatistics);

// Broker properties management
router.get('/broker/properties', getBrokerProperties);

// Broker clients
router.get('/broker/clients/:brokerId', getBrokerClients);

// Property actions
router.post('/broker/property/:propertyId/action', handlePropertyAction);

// ========================
// ADMIN-SPECIFIC ENDPOINTS
// ========================

// Admin comprehensive analytics
router.get('/admin/analytics', getAdminAnalytics);

// Detailed analytics by category
router.get('/admin/analytics/users', getUserAnalytics);
router.get('/admin/analytics/properties', getPropertyAnalytics);
router.get('/admin/analytics/transactions', getTransactionAnalytics);

// ========================
// SUPPORT-SPECIFIC ENDPOINTS
// ========================

// Support agent analytics
router.get('/support/analytics', getSupportAnalytics);

// Support queues
router.get('/support/verification-queue', getUserVerificationQueue);
router.get('/support/flagged-content-queue', getFlaggedContentQueue);

// ========================
// SERVICE CONNECTIVITY TEST
// ========================

router.get('/test/connectivity', async (req, res) => {
  try {
    const testUrls = [
      { name: 'User Service', url: process.env.USER_SERVICE_URL || 'http://localhost:5000' },
      { name: 'Property Service', url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:5002' },
      { name: 'Transaction Service', url: process.env.TRANSACTION_SERVICE_URL || 'http://localhost:5001' },
      { name: 'Todo Service', url: process.env.TODO_SERVICE_URL || 'http://localhost:5003' }
    ];
    
    const results = await Promise.allSettled(
      testUrls.map(async ({ name, url }) => {
        try {
          const healthUrl = `${url}/health`;
          const response = await fetch(healthUrl, { timeout: 5000 });
          return {
            name,
            url,
            status: response.ok ? 'connected' : 'error',
            statusCode: response.status
          };
        } catch (error) {
          return {
            name,
            url,
            status: 'disconnected',
            error: error.message
          };
        }
      })
    );
    
    res.json({
      success: true,
      connectivity: results.map(r => r.value),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Connectivity test failed',
      message: error.message
    });
  }
});

// ========================
// ROLE-BASED ACCESS CONTROL MIDDLEWARE
// ========================

// Add this middleware to protect routes
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // This would check the user's role from JWT token
    // For now, just pass through
    next();
  };
};

// Apply role-based middleware (example)
router.get('/admin/*', requireRole(['admin', 'super_admin']));
router.get('/support/*', requireRole(['support_admin', 'support_lead', 'support_agent']));
router.get('/broker/*', requireRole(['internal_broker', 'external_broker']));

export default router;