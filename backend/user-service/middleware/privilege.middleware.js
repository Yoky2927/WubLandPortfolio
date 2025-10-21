// user-service/middleware/privilege.middleware.js
import privilegeService from '../services/privilege.service.js';

export const requirePermission = (resource, action) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const hasPermission = privilegeService.hasPermission(
        req.user, 
        resource, 
        action,
        req.body // pass context if needed
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: `${resource}.${action}`,
          user_role: req.user.role,
          user_broker_type: req.user.broker_type,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({ 
        error: 'Permission verification failed',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

export const checkResourceLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      const limits = privilegeService.getUserLimits(req.user);
      const resourceLimit = limits[resourceType];
      
      if (!resourceLimit) {
        return next(); // No limit defined for this resource
      }

      // You would implement actual usage tracking here
      const currentUsage = await getCurrentResourceUsage(req.user.id, resourceType);
      
      if (currentUsage >= resourceLimit.max) {
        return res.status(403).json({
          error: 'Resource limit exceeded',
          resource: resourceType,
          limit: resourceLimit.max,
          current: currentUsage,
          upgrade_required: true,
          code: 'RESOURCE_LIMIT_EXCEEDED'
        });
      }

      next();
    } catch (error) {
      console.error('Resource limit check error:', error);
      res.status(500).json({ 
        error: 'Resource limit verification failed',
        code: 'LIMIT_CHECK_ERROR'
      });
    }
  };
};

// Helper function to get current resource usage
async function getCurrentResourceUsage(userId, resourceType) {
  // Implement based on your tracking system
  // This would query your database for current usage
  return 0; // Placeholder
}