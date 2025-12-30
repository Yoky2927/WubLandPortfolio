// routes/admin.routes.js (CLEAN VERSION - NO DATABASE LOGIC!)
import express from 'express';
import AdminController from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, checkRole(['admin', 'super_admin', 'support_admin']));

// Get all properties (admin view - includes deleted)
router.get('/all', AdminController.getAdminAllProperties);

// Get all properties with filters (admin view)
router.get('/properties', AdminController.getAllPropertiesAdmin);

// Update property status (admin override)
router.patch('/properties/:id/status', AdminController.adminUpdatePropertyStatus);

// Admin property statistics
router.get('/properties/stats', AdminController.getAdminStats);

// Statistics summary (for dashboard)
router.get('/properties/stats/summary', AdminController.getStatsSummary);

// Admin delete property (soft or permanent)
router.delete('/properties/:id', AdminController.adminDeleteProperty);

// Restore deleted property
router.post('/properties/:id/restore', AdminController.restoreProperty);

export default router;