import express from 'express';
import { 
  signup, 
  login, 
  logout, 
  updateProfile, 
  checkAuth, 
  uploadProfilePicture, 
  updateRole, 
  updateUsername,
  adminCreateUser,
  verifyEmail,
  verifyEmailWeb, // ✅ ADD THIS IMPORT
  changeRequiredPassword,
  resendVerificationEmail
} from '../controllers/auth.controller.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js'; // ✅ REMOVE verifyEmail, verifyEmailWeb from here
import { User } from '../models/user.model.js'; // ✅ ADD THIS for the upload route
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/profile-pictures');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `profile-${req.user?.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/verify-email', verifyEmail); // API endpoint (JSON response)
router.get('/verify-email-web', verifyEmailWeb); // Web redirect endpoint (browser redirect)
router.post('/resend-verification', resendVerificationEmail);

// Protected routes
router.post('/logout', verifyToken, logout);
router.put('/update', verifyToken, updateProfile);
router.get('/check', verifyToken, checkAuth);
router.post('/upload', verifyToken, uploadProfilePicture);
router.put('/role', verifyToken, verifyAdmin, updateRole);
router.put('/username', verifyToken, updateUsername);
router.post('/admin/create-user', verifyToken, verifyAdmin, adminCreateUser);
router.post('/change-required-password', verifyToken, changeRequiredPassword);

// Keep your existing upload route for compatibility (FIXED VERSION)
router.post('/upload-profile', verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const profilePictureUrl = `${req.protocol}://${req.get('host')}/Uploads/profile-pictures/${req.file.filename}`;

    // Update user's profile picture in the database
    const success = await User.updateProfilePicture(req.user.id, profilePictureUrl);
    if (success) {
      res.status(200).json({ profilePictureUrl });
    } else {
      res.status(500).json({ message: 'Failed to update profile picture' });
    }
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Failed to update profile picture' });
  }
});

export default router;