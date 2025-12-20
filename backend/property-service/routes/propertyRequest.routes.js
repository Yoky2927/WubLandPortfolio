// backend/property-requests-service/routes/propertyRequest.routes.js
import express from 'express';
import PropertyRequestController from '../controllers/propertyRequest.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// Submit property request (for sellers/leasers)
router.post('/submit', authenticate, PropertyRequestController.submitRequest);

// Get broker's assigned requests
router.get('/broker/requests', 
  authenticate, 
  checkRole(['internal_broker', 'external_broker']),
  PropertyRequestController.getBrokerRequests
);

// Accept/Reject request
router.post('/:id/action',
  authenticate,
  checkRole(['internal_broker', 'external_broker']),
  PropertyRequestController.handleRequestAction
);

export default router;