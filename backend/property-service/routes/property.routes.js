// routes/property.routes.js
import express from 'express';
import PropertyController from '../controllers/property.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { checkRole, canManageProperty } from '../middlewares/role.middleware.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'property-service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});



// ================= PUBLIC ROUTES =================
router.get('/', PropertyController.getAllProperties);
router.get('/search', PropertyController.searchProperties);
router.get('/featured', PropertyController.getFeaturedProperties);
router.get('/recent', PropertyController.getRecentProperties);
router.get('/premium', PropertyController.getPremiumProperties);
router.get('/:id', PropertyController.getPropertyById);

// ================= BROKER ROUTES =================
router.get(
  '/broker/listings',
  authenticate,
  checkRole(['internal_broker', 'external_broker']),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, brokerId } = req.query;
      
      console.log(`📋 Broker ${brokerId || req.user.id} requesting listings`);
      
      // If brokerId is provided in query, use it, otherwise use authenticated user
      const targetBrokerId = brokerId || req.user.id;
      
      const filters = {};
      if (status && status !== 'all') filters.property_status = status;
      
      const result = await PropertyController.getBrokerListings(
        targetBrokerId,
        filters,
        parseInt(page),
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.post(
  '/:id/action',
  authenticate,
  checkRole(['internal_broker', 'external_broker']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { action, notes, brokerId } = req.body;
      
      const property = await PropertyController.getPropertyById(id);
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      // Verify broker is assigned to this property
      const actualBrokerId = brokerId || req.user.id;
      if (property.assigned_broker_id !== parseInt(actualBrokerId)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to manage this property'
        });
      }
      
      let newStatus;
      switch(action) {
        case 'approve':
          newStatus = 'active';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'request_changes':
          newStatus = 'pending_changes';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action'
          });
      }
      
      const updatedProperty = await PropertyController.updateProperty(id, {
        property_status: newStatus,
        status_notes: notes || ''
      });
      
      res.json({
        success: true,
        message: `Property ${action}d successfully`,
        data: updatedProperty
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ================= ADMIN ROUTES =================
router.get(
  '/admin/all',
  authenticate,
  checkRole(['admin', 'super_admin', 'support_admin']),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, status, search } = req.query;
      
      const filters = {};
      if (status && status !== 'all') filters.property_status = status;
      if (search) filters.search = search;
      
      const result = await PropertyController.getAllProperties(
        filters,
        parseInt(page),
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ================= CRUD ROUTES =================
router.post('/', authenticate, PropertyController.createProperty);
router.put('/:id', authenticate, canManageProperty, PropertyController.updateProperty);
router.delete('/:id', authenticate, checkRole(['admin', 'super_admin']), PropertyController.deleteProperty);
router.patch('/:id/status', authenticate, canManageProperty, PropertyController.updatePropertyStatus);
router.patch('/:id/price', authenticate, canManageProperty, PropertyController.updatePropertyPrice);

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

export default router;