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
// Add to auth.routes.js
router.post('/test-login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid password" });
    }
    
    // Test token generation with minimal user object
    const testToken = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    }, res);
    
    res.json({
      success: true,
      message: "Test login successful",
      token: testToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Test login error:", error);
    res.status(500).json({ message: "Test failed", error: error.message });
  }
});

// Keep your existing upload route for compatibility (FIXED VERSION)
router.post('/upload-profile', verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const profilePictureUrl = `${req.protocol}://${req.get('host')}/Uploads/profile-pictures/${req.file.filename}`;

    // Update user's profile picture in the database
    const db = await import("../../shared/db.js").then(mod => mod.default);
    const [result] = await db.query(
      "UPDATE users SET profile_picture = ? WHERE id = ?",
      [profilePictureUrl, req.user.id]
    );

    if (result.affectedRows > 0) {
      res.status(200).json({ 
        success: true,
        profilePictureUrl,
        message: 'Profile picture updated successfully' 
      });
    } else {
      res.status(500).json({ message: 'Failed to update profile picture' });
    }
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Failed to update profile picture' });
  }
});

export default router;