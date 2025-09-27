import express from 'express';
import { signup, login, logout, updateProfile, checkAuth, uploadProfilePicture, updateRole, updateUsername,adminCreateUser } from '../controllers/auth.controller.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public signup (for regular users/clients)
router.post('/signup', signup);

// Admin-only user creation (with special handling)
router.post('/admin/create-user', verifyToken, verifyAdmin, adminCreateUser);


router.post('/login', login);
router.post('/logout', logout);
router.put('/update', verifyToken, updateProfile);
router.get('/check', verifyToken, checkAuth);
router.post('/upload', verifyToken, uploadProfilePicture);
router.put('/role', verifyToken, verifyAdmin, updateRole);
router.put('/username', verifyToken, updateUsername); // New endpoint

export default router;