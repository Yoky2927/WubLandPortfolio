import PrivilegeService from '../services/privilege.service.js';

export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const canListDirectly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const canList = PrivilegeService.canListPropertiesDirectly(req.user);
  
  if (!canList) {
    return res.status(403).json({
      success: false,
      message: 'Your role cannot list properties directly. Please submit a property request instead.'
    });
  }

  next();
};

export const canMakeRequests = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const canRequest = PrivilegeService.canMakePropertyRequests(req.user);
  
  if (!canRequest) {
    return res.status(403).json({
      success: false,
      message: 'Your role cannot make property requests'
    });
  }

  next();
};

export const canManageProperty = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins and support can manage all properties
    const adminRoles = ['super_admin', 'admin', 'support_admin', 'support_agent'];
    if (adminRoles.includes(userRole)) {
      return next();
    }

    // Internal/External brokers can manage their assigned properties
    if (userRole.includes('broker')) {
      const [properties] = await pool.execute(
        `SELECT id, assigned_broker_id FROM properties 
         WHERE id = ? AND assigned_broker_id = ? AND deleted_at IS NULL`,
        [id, userId]
      );

      if (properties.length > 0) {
        return next();
      }
    }

    // Property owners can manage their own properties
    const [properties] = await pool.execute(
      'SELECT id, owner_user_id FROM properties WHERE id = ? AND owner_user_id = ? AND deleted_at IS NULL',
      [id, userId]
    );

    if (properties.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to manage this property'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};