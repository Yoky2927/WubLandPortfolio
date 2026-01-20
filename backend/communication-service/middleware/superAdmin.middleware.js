// communication-service/middleware/superAdmin.middleware.js
export const verifySuperAdmin = (req, res, next) => {
    try {
      const user = req.user;
  
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
  
      // Check if user is super_admin
      if (user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }
  
      next();
    } catch (error) {
      console.error('Super admin middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in super admin verification'
      });
    }
  };