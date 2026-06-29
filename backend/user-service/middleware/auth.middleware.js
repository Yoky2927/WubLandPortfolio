// user-service/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Store processed request IDs to avoid duplicate logging
const processedRequests = new Map();
const CLEANUP_INTERVAL = 60000; // 1 minute

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [requestId, timestamp] of processedRequests.entries()) {
    if (now - timestamp > CLEANUP_INTERVAL) {
      processedRequests.delete(requestId);
    }
  }
}, CLEANUP_INTERVAL);

// Helper to check if we should log for this request
function shouldLog(req, type) {
  const requestId = req.requestId;
  const logKey = `${requestId}_${type}`;
  
  if (processedRequests.has(logKey)) {
    return false;
  }
  
  processedRequests.set(logKey, Date.now());
  return true;
}

// Generate or get request ID
function getRequestId(req) {
  if (!req.requestId) {
    req.requestId = req.headers['x-request-id'] || crypto.randomBytes(4).toString('hex');
  }
  return req.requestId;
}

export const verifyToken = async (req, res, next) => {
  // Set request ID
  const requestId = getRequestId(req);
  
  try {
    // Only log in development and only once per request
    if (process.env.NODE_ENV === 'development' && shouldLog(req, 'verifyToken_start')) {
      console.log(`[${requestId}] === VERIFY TOKEN ===`);
    }

    // Get token
    let token = req.cookies?.jwt;

    if (!token && req.headers.authorization) {
      if (req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
        if (process.env.NODE_ENV === 'development' && shouldLog(req, 'token_source')) {
          console.log(`[${requestId}] Token from Authorization header`);
        }
      }
    }

    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      console.log(`[${requestId}] ❌ No token provided`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (process.env.NODE_ENV === 'development' && shouldLog(req, 'token_decoded')) {
      console.log(`[${requestId}] 🔐 Decoded token user ID:`, decoded.userId);
    }

    // Import database
    const db = await import("../../shared/db.js").then(mod => mod.default);
    
    if (process.env.NODE_ENV === 'development' && shouldLog(req, 'db_import')) {
      console.log(`[${requestId}] ✅ Database imported successfully`);
    }

    const userId = decoded.userId;
    
    // Only log user lookup in development and not too frequently
    if (process.env.NODE_ENV === 'development' && shouldLog(req, 'user_lookup')) {
      console.log(`[${requestId}] Looking for user with ID:`, userId);
    }

    const [users] = await db.query(
      "SELECT id, username, email, role, status, verified FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      console.log(`[${requestId}] ❌ User not found in database. User ID:`, userId);
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    
    // Only log user found once per request
    if (process.env.NODE_ENV === 'development' && shouldLog(req, 'user_found')) {
      console.log(`[${requestId}] ✅ User found:`, user.id, user.username, user.role);
    }

    // Attach ALL user properties to req.user
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      verified: user.verified
    };

    // Log only once per request
    if (process.env.NODE_ENV === 'development' && shouldLog(req, 'user_set')) {
      console.log(`[${requestId}] ✅ req.user object set`);
    }

    next();

  } catch (error) {
    console.error(`[${requestId}] ❌ Token verification error:`, error.message);

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
  const requestId = getRequestId(req);
  
  try {
    if (process.env.NODE_ENV === 'development' && shouldLog(req, 'protectRoute')) {
      console.log(`[${requestId}] 🔐 PROTECT ROUTE ===`);
    }

    const token = req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) return res.status(401).json({ message: "Unauthorized - No Token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const db = await import("../../shared/db.js").then(mod => mod.default);
    const userId = decoded.userId;

    const [users] = await db.query(
      `SELECT id, first_name, last_name, username, email, role, 
              privilege_tier, status, profile_picture, verified,
              is_email_verified, password_change_required, 
              created_by_user_id, last_login, login_attempts
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      console.log(`[${requestId}] ❌ User not found in protectRoute`);
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      verified: user.verified,
      privilege_tier: user.privilege_tier,
      password_change_required: user.password_change_required,
      ...(user.role.includes('broker') ? { broker_type: await getBrokerType(user.id) } : {})
    };

    next();
  } catch (err) {
    console.error(`[${requestId}] ❌ protectRoute error:`, err.message);

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

// Enhanced role verification with reduced logging
export const verifyAdmin = async (req, res, next) => {
  const requestId = getRequestId(req);
  
  // Only log in development and once per request
  if (process.env.NODE_ENV === 'development' && shouldLog(req, 'verifyAdmin')) {
    console.log(`[${requestId}] 🟡 VERIFY ADMIN CALLED`);
  }

  const adminRoles = ['admin', 'super_admin', 'support_admin'];

  // Check if req.user exists
  if (!req.user) {
    console.log(`[${requestId}] ❌ verifyAdmin: req.user is undefined`);
    return res.status(401).json({ message: 'User not found' });
  }

  if (!adminRoles.includes(req.user.role)) {
    // Always log access denied for security
    console.log(`[${requestId}] ❌ verifyAdmin: Access denied for role:`, req.user.role);
    return res.status(403).json({
      message: 'Admin access required',
      userRole: req.user.role,
      allowedRoles: adminRoles
    });
  }

  // Only log success in development
  if (process.env.NODE_ENV === 'development' && shouldLog(req, 'verifyAdmin_success')) {
    console.log(`[${requestId}] ✅ verifyAdmin passed`);
  }
  
  next();
};

export const verifySupportStaff = async (req, res, next) => {
  const requestId = getRequestId(req);
  
  try {
    if (process.env.NODE_ENV === 'development' && shouldLog(req, 'verifySupportStaff')) {
      console.log(`[${requestId}] === VERIFY SUPPORT STAFF ===`);
    }

    const supportRoles = ['support_agent', 'support_lead', 'support_admin', 'super_admin', 'admin'];

    if (!supportRoles.includes(req.user?.role)) {
      console.log(`[${requestId}] ❌ Access denied. User role not in allowed roles:`, req.user?.role);
      return res.status(403).json({
        message: 'Support staff access required',
        userRole: req.user?.role,
        allowedRoles: supportRoles
      });
    }

    if (process.env.NODE_ENV === 'development' && shouldLog(req, 'verifySupportStaff_success')) {
      console.log(`[${requestId}] ✅ Support staff verification passed`);
    }
    
    next();
  } catch (error) {
    console.error(`[${requestId}] ❌ verifySupportStaff error:`, error);
    res.status(500).json({ message: 'Role verification failed' });
  }
};

export const verifySupportLead = async (req, res, next) => {
  const requestId = getRequestId(req);
  const leadRoles = ['support_lead', 'support_admin', 'super_admin'];
  
  if (!leadRoles.includes(req.user.role)) {
    console.log(`[${requestId}] ❌ verifySupportLead failed for role:`, req.user.role);
    return res.status(403).json({ message: 'Support lead access required' });
  }
  
  next();
};

export const verifySupportAdmin = async (req, res, next) => {
  const requestId = getRequestId(req);
  const adminRoles = ['support_admin', 'super_admin'];
  
  if (!adminRoles.includes(req.user.role)) {
    console.log(`[${requestId}] ❌ verifySupportAdmin failed for role:`, req.user.role);
    return res.status(403).json({ message: 'Support admin access required' });
  }
  
  next();
};

// Add a cleanup function for testing
export const clearProcessedRequests = () => {
  processedRequests.clear();
};