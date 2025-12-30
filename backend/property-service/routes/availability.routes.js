// backend/property-service/routes/availability.routes.js
import express from 'express';
import AvailabilityController from '../controllers/availability.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js'; // Changed from auth.js

const router = express.Router();

// Set/update availability
router.post('/availability',
  authenticate,
  authorize(['internal_broker', 'external_broker', 'admin', 'super_admin']),
  AvailabilityController.setAvailability
);

// Get broker availability
router.get('/brokers/:broker_id/availability',
  authenticate,
  AvailabilityController.getAvailability
);

// Get my availability
router.get('/availability/me',
  authenticate,
  authorize(['internal_broker', 'external_broker', 'admin', 'super_admin']),
  AvailabilityController.getMyAvailability
);

// Check availability at specific time
router.post('/brokers/:broker_id/availability/check',
  AvailabilityController.checkAvailability
);

// Update weekly schedule
router.put('/availability/weekly',
  authenticate,
  authorize(['internal_broker', 'external_broker', 'admin', 'super_admin']),
  AvailabilityController.updateWeeklyAvailability
);

// Delete availability slot
router.delete('/availability/:id',
  authenticate,
  authorize(['internal_broker', 'external_broker', 'admin', 'super_admin']),
  AvailabilityController.deleteAvailability
);

export default router;