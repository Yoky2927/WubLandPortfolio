const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
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