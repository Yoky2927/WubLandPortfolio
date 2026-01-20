// communication-service/routes/announcement.routes.js
import express from 'express';
import AnnouncementController from '../controllers/announcement.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { verifySuperAdmin } from '../middleware/superAdmin.middleware.js';

const router = express.Router();

// ========== PUBLIC ROUTES (No authentication required) ==========
router.get('/public', AnnouncementController.getPublicAnnouncements);

// ========== USER ROUTES (Require regular user authentication) ==========
router.get('/user/my', verifyToken, AnnouncementController.getUserAnnouncements);
router.post('/:id/view', verifyToken, AnnouncementController.markAsViewed);
router.post('/:id/click', verifyToken, AnnouncementController.markAsClicked);

// ========== SUPER ADMIN ROUTES (Require super_admin authentication) ==========
router.use(verifyToken, verifySuperAdmin); // This only applies to routes below

// Announcement CRUD operations - Super Admin only
router.post('/', AnnouncementController.createAnnouncement);
router.get('/', AnnouncementController.getAnnouncements);
router.get('/analytics', AnnouncementController.getAnnouncementAnalytics);
router.get('/:id', AnnouncementController.getAnnouncementById);
router.put('/:id', AnnouncementController.updateAnnouncement);
router.delete('/:id', AnnouncementController.deleteAnnouncement);

// Announcement actions - Super Admin only
router.post('/:id/send', AnnouncementController.sendAnnouncement);
router.post('/:id/schedule', AnnouncementController.scheduleAnnouncement);
router.get('/:id/stats', AnnouncementController.getAnnouncementStats);

export default router;