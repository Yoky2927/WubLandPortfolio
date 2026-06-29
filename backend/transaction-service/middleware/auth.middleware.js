const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    console.log('🔐 Auth middleware checking request...');
    console.log('🔐 Headers:', req.headers);
    
    const authHeader = req.headers.authorization;
    console.log('🔐 Authorization header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token required' 
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔐 Token present:', !!token);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token required' 
      });
    }

    // Decode without verification first to see what's in the token
    const decodedWithoutVerify = jwt.decode(token);
    console.log('🔐 Decoded token (without verification):', decodedWithoutVerify);
    
    // Now verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    console.log('🔐 Verified token:', decoded);
    
    // Extract user ID from various possible fields
    const userId = decoded.userId || decoded.id || decoded.user_id || decoded.sub;
    
    console.log('🔐 Extracted userId:', userId);
    console.log('🔐 All decoded fields:', Object.keys(decoded));
    
    if (!userId) {
      console.log('❌ ERROR: No userId found in token');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token: No user ID found',
        decoded: decoded // Return decoded for debugging
      });
    }
    
    // Create user object with all necessary fields
    req.user = {
      id: parseInt(userId), // Ensure it's a number
      userId: parseInt(userId),
      email: decoded.email || '',
      role: decoded.role || 'user',
      verification_status: decoded.verification_status || 'pending'
    };
    
    console.log('✅ User authenticated:', req.user);
    next();
  } catch (error) {
    console.error('🔐 Authentication error:', error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 Authorization check for roles:', roles);
    console.log('🔐 User role:', req.user?.role);
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Internal service authentication
const authenticateInternal = (req, res, next) => {
  const token = req.headers['x-internal-token'];
  
  if (!token || token !== process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid internal service token' 
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  authenticateInternal
};