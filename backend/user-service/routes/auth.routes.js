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
  verifyEmailWeb,
  changeRequiredPassword,
  resendVerificationEmail,
  changePassword,
  verifyPasswordChangeToken
} from '../controllers/auth.controller.js';
import { verifyToken, verifyAdmin, protectRoute } from '../middleware/auth.middleware.js';
import { User } from '../models/user.model.js';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/token.js';
import crypto from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken'; // ADD THIS IMPORT

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

// ========== PUBLIC ROUTES ==========
router.post('/signup', signup);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.get('/verify-email-web', verifyEmailWeb);
router.post('/resend-verification', resendVerificationEmail);

// ========== PUBLIC RESEND VERIFICATION ENDPOINT ==========
router.post('/resend-verification-public', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const db = await import("../../shared/db.js").then(mod => mod.default);

    // Find user by email
    const [users] = await db.query(
      "SELECT id, email, first_name, last_name, email_verification_token, email_verification_expires, is_email_verified FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = users[0];

    // Check if already verified
    if (user.is_email_verified === 1) {
      return res.status(400).json({
        success: false,
        message: "Email already verified"
      });
    }

    // Generate new token
    const newVerificationToken = crypto.randomBytes(32).toString('hex');
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update token in database
    await db.query(
      "UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE email = ?",
      [newVerificationToken, newExpiry, email]
    );

    console.log("🔄 Generated new verification token:", newVerificationToken);

    // Send verification email - FIXED: Use the NEW token
    try {
      const response = await fetch('http://localhost:5001/api/email/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'internal-service-token': 'communication-service-secret-12345'
        },
        body: JSON.stringify({
          email: user.email,
          fullName: `${user.first_name || 'User'} ${user.last_name || ''}`.trim() || user.email,
          verificationToken: newVerificationToken // <-- Use the NEW token, not the old one
        })
      });

      if (response.ok) {
        console.log("✅ Resend verification email sent with token");
        return res.json({
          success: true,
          message: "Verification email sent successfully"
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Email service error:", errorData);
        throw new Error(errorData.message || "Failed to send email");
      }
    } catch (emailError) {
      console.error("Email service error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again later."
      });
    }

  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend verification email"
    });
  }
});

// ========== PASSWORD CHANGE ROUTES ==========
router.post('/force-change-password', async (req, res) => {
  try {
    const { passwordChangeToken, newPassword, confirmPassword } = req.body;

    if (!passwordChangeToken) {
      return res.status(400).json({
        success: false,
        message: "Password change token is required"
      });
    }

    // Verify the password change token
    const verification = await verifyPasswordChangeToken(passwordChangeToken);

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: verification.error || "Invalid or expired token"
      });
    }

    // Create a mock req object for the changePassword function
    const mockReq = {
      user: { id: verification.userId },
      body: {
        newPassword,
        confirmPassword,
        isRequiredChange: true
      }
    };

    const mockRes = {
      json: (data) => res.json(data),
      status: (code) => ({ json: (data) => res.status(code).json(data) })
    };

    await changePassword(mockReq, mockRes);

  } catch (error) {
    console.error("Force change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ========== CHANGE PASSWORD FOR ADMIN-CREATED USERS ==========
router.post('/change-password-with-token', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required"
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    // Verify token
    let payload;
    try {
      payload = JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    if (!payload.requiresPasswordChange) {
      return res.status(400).json({
        success: false,
        message: "This token is not for password change"
      });
    }

    const db = await import("../../shared/db.js").then(mod => mod.default);

    // Get user
    const [users] = await db.query(
      "SELECT id, email, password_change_required FROM users WHERE id = ?",
      [payload.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = users[0];

    if (user.password_change_required !== 1) {
      return res.status(400).json({
        success: false,
        message: "Password change not required for this user"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear password change requirement
    await db.query(
      "UPDATE users SET password = ?, password_change_required = 0, last_password_change = NOW() WHERE id = ?",
      [hashedPassword, payload.userId]
    );

    // Generate regular login token
    const [updatedUser] = await db.query(
      "SELECT id, first_name, last_name, username, email, role, privilege_tier, verified, status FROM users WHERE id = ?",
      [payload.userId]
    );

    if (updatedUser.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to get user data"
      });
    }

    const regularToken = generateToken({
      userId: updatedUser[0].id,
      username: updatedUser[0].username,
      role: updatedUser[0].role,
      privilege_tier: updatedUser[0].privilege_tier,
      verified: updatedUser[0].verified === 1,
      status: updatedUser[0].status,
      password_change_required: false
    });

    console.log("✅ Password changed successfully for admin-created user:", payload.userId);

    res.json({
      success: true,
      message: "Password changed successfully",
      token: regularToken,
      user: updatedUser[0]
    });

  } catch (error) {
    console.error("Change password with token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
});

// ========== ACCOUNT STATUS ROUTES ==========
// Check account status (for frontend to display)
router.get('/account/status', verifyToken, async (req, res) => {
  try {
    const status = await User.getStatusDetails(req.user.id);
    if (!status) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      status_details: status
    });
  } catch (error) {
    console.error('Error getting account status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get account status'
    });
  }
});

// Resend verification email (requires authentication)
router.post('/account/resend-verification', verifyToken, async (req, res) => {
  try {
    const db = await import("../../shared/db.js").then(mod => mod.default);

    // Get user details
    const [users] = await db.query(
      "SELECT email, first_name, last_name, email_verification_token, email_verification_expires, is_email_verified FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = users[0];

    // Check if already verified
    if (user.is_email_verified === 1) {
      return res.status(400).json({
        success: false,
        message: "Email already verified"
      });
    }

    // Generate new token
    const newVerificationToken = crypto.randomBytes(32).toString('hex');
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update token in database
    await db.query(
      "UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?",
      [newVerificationToken, newExpiry, req.user.id]
    );

    // Send verification email
    try {
      const response = await fetch('http://localhost:5001/api/email/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'internal-service-token': 'communication-service-secret-12345' // Add this token
        },
        body: JSON.stringify({
          email: user.email,
          fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          token: newVerificationToken  // <-- Should be "token" not "verificationToken"
        })
      });

      if (response.ok) {
        console.log("✅ Resend verification email sent");
        return res.json({
          success: true,
          message: "Verification email sent successfully"
        });
      } else {
        const errorData = await response.text();
        console.error("Email service error:", errorData);
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email"
        });
      }
    } catch (emailError) {
      console.error("Email service error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again later."
      });
    }

  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification email"
    });
  }
});

// Admin: Update user status (admin only)
router.put('/admin/user/:userId/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.id;

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status required: active, inactive, or suspended"
      });
    }

    const success = await User.updateStatus(userId, status, reason || '', adminId);

    if (success) {
      res.json({
        success: true,
        message: `Account status updated to ${status}`,
        status: status,
        updated_at: new Date()
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Admin: Get user status (admin only)
router.get('/admin/user/:userId/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const status = await User.getStatusDetails(userId);

    if (!status) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user_id: userId,
      status_details: status
    });
  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user status'
    });
  }
});

// ========== PROTECTED ROUTES ==========
router.post('/logout', verifyToken, logout);
router.put('/update', verifyToken, updateProfile);
router.get('/check', verifyToken, checkAuth);
router.post('/upload', verifyToken, uploadProfilePicture);
router.put('/role', verifyToken, verifyAdmin, updateRole);
router.put('/username', verifyToken, updateUsername);
router.post('/admin/create-user', verifyToken, verifyAdmin, adminCreateUser);
router.post('/change-required-password', verifyToken, changeRequiredPassword);
router.post('/change-password', verifyToken, changePassword);

// ========== TEST ROUTES ==========
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

// ========== DOCUMENT UPLOAD CONFIGURATION ==========
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'Uploads/verification-documents';
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    // Use a placeholder if user ID isn't available yet
    const userId = req.user?.id || 'unknown';
    cb(null, `doc-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadDocument = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = 'Uploads/verification-documents';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // Use temporary filename - we'll rename it later with actual user ID
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `temp-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
// ========== DEBUG ENDPOINT ==========
router.post('/debug-upload', (req, res) => {
  console.log('=== DEBUG UPLOAD ENDPOINT HIT ===');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);

  // Handle upload directly
  uploadDocument.single('document')(req, res, (err) => {
    if (err) {
      console.error('❌ Debug upload multer error:', err.message);
      console.error('❌ Error code:', err.code);

      return res.status(400).json({
        success: false,
        error: err.message,
        code: err.code
      });
    }

    console.log('✅ Debug upload successful!');
    console.log('✅ File received:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    } : 'NO FILE');

    console.log('✅ Body fields:', req.body);

    res.json({
      success: true,
      message: 'Debug upload successful - multer is working!',
      file: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null,
      body: req.body
    });
  });
});

// ========== VERIFICATION DOCUMENT UPLOAD - FIXED VERSION ==========
router.post('/documents/upload', uploadDocument.single('document'), async (req, res) => {
  console.log('=== VERIFICATION DOCUMENT UPLOAD HIT ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body keys:', Object.keys(req.body));
  console.log('File received?', !!req.file);

  if (req.file) {
    console.log('File details:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    });
  }

  try {
    // First verify the token from headers
    let token = req.cookies?.jwt;

    if (!token && req.headers.authorization) {
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
      }
    }

    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      // Clean up uploaded file if token is invalid
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Decoded token user ID:', decoded.userId || decoded.id);

    // Get user
    const db = await import("../../shared/db.js").then(mod => mod.default);
    const [users] = await db.query(
      "SELECT id, email, first_name, last_name FROM users WHERE id = ?",
      [decoded.userId || decoded.id]
    );

    if (users.length === 0) {
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    console.log('✅ Authenticated user:', user.id, user.email);

    // Now check for file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a file.'
      });
    }

    const documentType = req.body.documentType;
    if (!documentType) {
      // Clean up file
      fs.unlink(req.file.path, () => { });
      return res.status(400).json({
        success: false,
        message: 'documentType is required in form data'
      });
    }

    // Create a new filename with the actual user ID
    const fileExtension = path.extname(req.file.originalname);
    const newFilename = `doc-${user.id}-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    const newPath = path.join('Uploads/verification-documents', newFilename);

    // Rename the file to include user ID
    fs.renameSync(req.file.path, newPath);

    const documentUrl = `/Uploads/verification-documents/${newFilename}`;
    console.log('✅ Generated document URL:', documentUrl);

    const columnMap = {
      kebele_id: 'kebele_id_document',
      proof_of_income: 'proof_of_income_document'
    };

    let query, values;

    if (columnMap[documentType]) {
      query = `UPDATE users SET ${columnMap[documentType]} = ?, verification_status = 'pending' WHERE id = ?`;
      values = [documentUrl, user.id];
    } else {
      // Get existing documents
      const [current] = await db.query(
        "SELECT other_documents FROM users WHERE id = ?",
        [user.id]
      );

      let otherDocuments = [];
      if (current[0] && current[0].other_documents) {
        try {
          const parsed = JSON.parse(current[0].other_documents);
          if (Array.isArray(parsed)) {
            // Filter out any existing document of the same type
            otherDocuments = parsed.filter(doc => {
              // Handle both string and object formats
              if (typeof doc === 'string') {
                try {
                  const parsedDoc = JSON.parse(doc);
                  return parsedDoc.type !== documentType;
                } catch {
                  return true; // Keep if can't parse
                }
              } else if (typeof doc === 'object' && doc !== null) {
                return doc.type !== documentType;
              }
              return true;
            });
          }
        } catch (error) {
          console.error('Error parsing existing documents:', error);
          otherDocuments = [];
        }
      }

      // Create new document object
      const newDocument = {
        type: documentType,
        url: documentUrl,
        filename: req.file.originalname,
        uploaded_at: new Date().toISOString(),
        status: 'pending'
      };

      // Add new document
      otherDocuments.push(newDocument);

      // Update database with PROPER JSON array
      query = `UPDATE users SET other_documents = ?, verification_status = 'pending' WHERE id = ?`;
      values = [JSON.stringify(otherDocuments), user.id];
    }

    console.log('✅ Document saved to DB for user:', user.id);

    res.status(200).json({
      success: true,
      documentUrl,
      documentType,
      message: 'Document uploaded successfully. Awaiting admin verification.'
    });

  } catch (error) {
    console.error('❌ Upload error:', error);

    // Clean up file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => { });
    }

    // Handle specific errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ========== GET USER'S EXISTING DOCUMENTS ==========
router.get('/documents', verifyToken, async (req, res) => {
  try {
    const db = await import("../../shared/db.js").then(mod => mod.default);

    // Get user with all document fields
    const [users] = await db.query(
      "SELECT other_documents, verification_status, kebele_id_document, proof_of_income_document FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    let documents = [];

    // Parse other_documents JSON array
    if (user.other_documents) {
      try {
        const parsedDocs = JSON.parse(user.other_documents);
        if (Array.isArray(parsedDocs)) {
          documents = parsedDocs.map(doc => {
            // If doc is a string, parse it
            if (typeof doc === 'string') {
              try {
                return JSON.parse(doc);
              } catch (parseError) {
                console.error('Error parsing nested doc:', parseError);
                return { type: 'unknown', url: '', uploaded_at: new Date().toISOString(), status: 'pending' };
              }
            }
            return doc;
          }).filter(doc => doc && doc.type); // Filter out invalid docs
        } else if (typeof parsedDocs === 'string') {
          // Handle case where it's a single JSON string
          try {
            const singleDoc = JSON.parse(parsedDocs);
            if (singleDoc.type) {
              documents = [singleDoc];
            }
          } catch (error) {
            console.error('Error parsing single doc:', error);
          }
        }
      } catch (error) {
        console.error('Error parsing other_documents:', error);
        // Try to handle it as a direct array of strings
        try {
          if (typeof user.other_documents === 'string') {
            const maybeArray = JSON.parse(user.other_documents);
            if (Array.isArray(maybeArray)) {
              documents = maybeArray
                .filter(item => item && typeof item === 'string')
                .map(item => {
                  try {
                    return JSON.parse(item);
                  } catch {
                    return null;
                  }
                })
                .filter(Boolean);
            }
          }
        } catch (e) {
          console.error('Secondary parse error:', e);
        }
      }
    }

    // Add specific column documents if they exist
    if (user.kebele_id_document) {
      documents.push({
        type: 'kebele_id',
        url: user.kebele_id_document,
        filename: 'kebele_id.jpg',
        uploaded_at: new Date().toISOString(),
        status: 'pending'
      });
    }

    if (user.proof_of_income_document) {
      documents.push({
        type: 'proof_of_income',
        url: user.proof_of_income_document,
        filename: 'proof_of_income.jpg',
        uploaded_at: new Date().toISOString(),
        status: 'pending'
      });
    }

    // Ensure all documents have status field
    documents = documents.map(doc => ({
      ...doc,
      status: doc.status || 'pending'
    }));

    console.log('📋 Final parsed documents:', documents);

    res.json({
      success: true,
      documents,
      verification_status: user.verification_status || 'unverified'
    });

  } catch (error) {
    console.error('Error getting user documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


export default router;