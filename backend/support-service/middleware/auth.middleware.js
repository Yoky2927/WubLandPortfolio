import jwt from 'jsonwebtoken';
import axios from 'axios';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Support Service - Auth Check:');
  console.log('🔐 URL:', req.url);
  console.log('🔐 Method:', req.method);
  console.log('🔐 Token exists:', !!token);
  console.log('🔐 JWT Secret exists:', !!process.env.JWT_SECRET);

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Try to verify with local secret first
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Local JWT verification successful');
      console.log('✅ User role:', user.role);
      console.log('✅ User ID:', user.userId);
      req.user = user;
      return next();
    } catch (localError) {
      console.log('❌ Local JWT verification failed:', localError.message);
      
      // If local verification fails, validate with user service
      console.log('🔄 Trying user service validation...');
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5000';
      
      try {
        const response = await axios.get(`${userServiceUrl}/api/auth/check`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.id) {
          console.log('✅ User service validation successful');
          console.log('✅ User role from user service:', response.data.role);
          req.user = response.data;
          return next();
        } else {
          console.log('❌ User service returned invalid data');
          return res.status(403).json({ error: 'Invalid token data from user service' });
        }
      } catch (userServiceError) {
        console.log('❌ User service validation failed:', userServiceError.message);
        console.log('❌ User service response status:', userServiceError.response?.status);
        console.log('❌ User service response data:', userServiceError.response?.data);
        
        return res.status(403).json({ 
          error: 'Token validation failed',
          details: userServiceError.response?.data?.message || userServiceError.message
        });
      }
    }
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      details: error.message 
    });
  }
};

// Keep your existing role functions...
export const requireSupportAgent = (req, res, next) => {
  const supportRoles = ['support_agent', 'support_lead', 'support_admin', 'super_admin', 'admin'];
  console.log('🔐 Checking support agent access - User role:', req.user?.role);
  
  if (!req.user || !supportRoles.includes(req.user.role)) {
    console.log('❌ Support agent access denied');
    return res.status(403).json({ error: 'Support agent role required' });
  }
  console.log('✅ Support agent access granted');
  next();
};
export const requireSupportLead = (req, res, next) => {
  const leadRoles = ['support_lead', 'support_admin', 'super_admin', 'admin'];
  console.log('🔐 Checking support lead access - User role:', req.user?.role);
  
  if (!req.user || !leadRoles.includes(req.user.role)) {
    console.log('❌ Support lead access denied');
    return res.status(403).json({ error: 'Support lead role required' });
  }
  console.log('✅ Support lead access granted');
  next();
};

export const requireSupportAdmin = (req, res, next) => {
  const adminRoles = ['support_admin', 'super_admin', 'admin'];
  console.log('🔐 Checking support admin access - User role:', req.user?.role);
  
  if (!req.user || !adminRoles.includes(req.user.role)) {
    console.log('❌ Support admin access denied');
    return res.status(403).json({ error: 'Support admin role required' });
  }
  console.log('✅ Support admin access granted');
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    console.log('❌ Super admin access denied');
    return res.status(403).json({ error: 'Super admin role required' });
  }
  console.log('✅ Super admin access granted');
  next();
};

export const requireAdmin = (req, res, next) => {
  const adminRoles = ['admin', 'support_admin', 'super_admin'];
  if (!req.user || !adminRoles.includes(req.user.role)) {
    console.log('❌ Admin access denied');
    return res.status(403).json({ error: 'Admin role required' });
  }
  console.log('✅ Admin access granted');
  next();
};