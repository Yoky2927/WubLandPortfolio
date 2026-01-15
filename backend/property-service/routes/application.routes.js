// backend/property-service/routes/application.routes.js
import express from 'express';
import ApplicationController from '../controllers/applicationController.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

console.log('✅ Application routes loading...');

// All routes require authentication
router.use(authenticate);

// Create application
router.post('/applications', ApplicationController.createApplication);

// Get user's applications
router.get('/applications', ApplicationController.getUserApplications);

// Get application by ID
router.get('/applications/:id', ApplicationController.getApplicationById);

// Update application
router.put('/applications/:id', ApplicationController.updateApplication);

// Delete application
router.delete('/applications/:id', ApplicationController.deleteApplication);

// Get application statistics
router.get('/applications/stats', ApplicationController.getApplicationStats);

console.log('✅ Application routes loaded successfully');

export default router;