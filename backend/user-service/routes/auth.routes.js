import express from 'express';
import { signup, login, logout, updateProfile, checkAuth, uploadProfilePicture, updateRole, updateUsername,adminCreateUser } from '../controllers/auth.controller.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/profile-pictures');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Public signup (for regular users/clients)
router.post('/signup', signup);

// Admin-only user creation (with special handling)
router.post('/admin/create-user', verifyToken, verifyAdmin, adminCreateUser);

router.post('/login', login);
router.post('/logout', logout);
router.put('/update', verifyToken, updateProfile);
router.get('/check', verifyToken, checkAuth);
router.post('/upload', verifyToken, uploadProfilePicture);
router.post('/upload-profile', upload.single('profilePicture'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const profilePictureUrl = `${req.protocol}://${req.get('host')}/Uploads/profile-pictures/${req.file.filename}`;

  // Update user's profile picture in the database
  User.updateProfilePicture(req.user.id, profilePictureUrl)
    .then(() => {
      res.status(200).json({ profilePictureUrl });
    })
    .catch((error) => {
      console.error('Error updating profile picture:', error);
      res.status(500).json({ message: 'Failed to update profile picture' });
    });
});
router.put('/role', verifyToken, verifyAdmin, updateRole);
router.put('/username', verifyToken, updateUsername); // New endpoint

export default router;