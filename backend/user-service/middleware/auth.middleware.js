// user-service/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const verifyToken = async (req, res, next) => {
  try {
    console.log('=== VERIFY TOKEN ===');

    // Get token
    let token = req.cookies?.jwt;

    if (!token && req.headers.authorization) {
      if (req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
        console.log('Token from Authorization header');
      }
    }

    console.log('Token exists:', !!token);

    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Decoded token user ID:', decoded.userId);

    // FIXED: Use the correct path
    const db = await import("../../shared/db.js").then(mod => mod.default);
    console.log('✅ Database imported successfully from ../../shared/db.js');

    const userId = decoded.userId;
    console.log('Looking for user with ID:', userId);

    const [users] = await db.query(
      "SELECT id, username, email, role, status, verified FROM users WHERE id = ?",
      [userId]
    );

    console.log('Database query result:', users.length, 'users found');

    if (users.length === 0) {
      console.log('❌ User not found in database. User ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    console.log('✅ User found:', user.id, user.username, user.role);

    // IMPORTANT: Attach ALL user properties to req.user
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      verified: user.verified
    };

    console.log('✅ req.user object set:', req.user);

    next();

  } catch (error) {
    console.error('❌ Token verification error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
};


export const protectRoute = async (req, res, next) => {
  try {
    console.log('🔐 PROTECT ROUTE ===');

    const token = req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');
    console.log('Token exists:', !!token);

    if (!token) return res.status(401).json({ message: "Unauthorized - No Token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token user ID:', decoded.userId);

    const db = await import("../../shared/db.js").then(mod => mod.default);
    console.log('✅ Database imported successfully in protectRoute');

    const userId = decoded.userId;

    // FIX: Query for ALL necessary fields like verifyToken does
    const [users] = await db.query(
      `SELECT id, first_name, last_name, username, email, role, 
              privilege_tier, status, profile_picture, verified,
              is_email_verified, password_change_required, 
              created_by_user_id, last_login, login_attempts
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      console.log('❌ User not found in protectRoute');
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    console.log('✅ User authenticated:', user.id, user.username);

    // FIX: Make sure req.user has ALL necessary properties
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      verified: user.verified,
      privilege_tier: user.privilege_tier,
      password_change_required: user.password_change_required,
      // Add broker_type if user is a broker
      ...(user.role.includes('broker') ? { broker_type: await getBrokerType(user.id) } : {})
    };

    console.log('✅ req.user set in protectRoute:', req.user);
    next();
  } catch (err) {
    console.error("❌ protectRoute error:", err.message);

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }

    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
};

// Helper function to get broker type
async function getBrokerType(userId) {
  try {
    const db = await import("../../shared/db.js").then(mod => mod.default);
    const [brokerProfiles] = await db.query(
      "SELECT broker_type FROM broker_profiles WHERE user_id = ?",
      [userId]
    );
    return brokerProfiles.length > 0 ? brokerProfiles[0].broker_type : null;
  } catch (error) {
    console.error("Error getting broker type:", error);
    return null;
  }
}

// Add this alias for authenticateToken
export const authenticateToken = protectRoute;

// Enhanced role verification
export const verifyAdmin = async (req, res, next) => {
  console.log('🟡 VERIFY ADMIN CALLED');
  console.log('🟡 req.user:', req.user);
  console.log('🟡 req.user.id:', req.user?.id);
  console.log('🟡 req.user.role:', req.user?.role);

  const adminRoles = ['admin', 'super_admin', 'support_admin'];

  // Check if req.user exists
  if (!req.user) {
    console.log('❌ verifyAdmin: req.user is undefined');
    return res.status(401).json({ message: 'User not found' });
  }

  if (!adminRoles.includes(req.user.role)) {
    console.log('❌ verifyAdmin: Access denied for role:', req.user.role);
    console.log('❌ Allowed roles:', adminRoles);
    return res.status(403).json({
      message: 'Admin access required',
      userRole: req.user.role,
      allowedRoles: adminRoles
    });
  }

  console.log('✅ verifyAdmin passed');
  next();
};

export const verifySupportStaff = async (req, res, next) => {
  try {
    console.log('=== VERIFY SUPPORT STAFF ===');
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?.id);

    const supportRoles = ['support_agent', 'support_lead', 'support_admin', 'super_admin', 'admin'];

    if (!supportRoles.includes(req.user?.role)) {
      console.log('❌ Access denied. User role not in allowed roles:', req.user?.role);
      console.log('Allowed roles:', supportRoles);
      return res.status(403).json({
        message: 'Support staff access required',
        userRole: req.user?.role,
        allowedRoles: supportRoles
      });
    }

    console.log('✅ Support staff verification passed');
    next();
  } catch (error) {
    console.error('❌ verifySupportStaff error:', error);
    res.status(500).json({ message: 'Role verification failed' });
  }
};

export const verifySupportLead = async (req, res, next) => {
  const leadRoles = ['support_lead', 'support_admin', 'super_admin'];
  if (!leadRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Support lead access required' });
  }
  next();
};

export const verifySupportAdmin = async (req, res, next) => {
  const adminRoles = ['support_admin', 'super_admin'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Support admin access required' });
  }
  next();
};