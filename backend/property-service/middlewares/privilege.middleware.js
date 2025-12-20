// middlewares/privilege.middleware.js
import pool from '../config/database.js';

export const checkListingLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const privilegeTier = req.user.privilege_tier || 'basic';
    
    // Get user's current listing count
    const [result] = await pool.execute(
      `SELECT COUNT(*) as count FROM properties 
       WHERE (owner_user_id = ? OR created_by_user_id = ? OR assigned_broker_id = ?)
       AND deleted_at IS NULL`,
      [userId, userId, userId]
    );
    
    const currentListings = result[0].count;
    
    // Define limits based on role and tier
    const limits = {
      'internal_broker': {
        'basic': 10,
        'standard': 50,
        'premium': 200,
        'enterprise': 1000
      },
      'external_broker': {
        'basic': 5,
        'standard': 20,
        'premium': 100,
        'enterprise': 500
      },
      'admin': { 'basic': 1000 }, // Admins have high limits
      'super_admin': { 'basic': 10000 }
    };
    
    const userLimit = limits[userRole]?.[privilegeTier] || 5;
    
    if (currentListings >= userLimit) {
      return res.status(403).json({
        success: false,
        message: `Listing limit reached. Maximum allowed: ${userLimit}`,
        current: currentListings,
        limit: userLimit,
        tier: privilegeTier
      });
    }
    
    next();
  } catch (error) {
    console.error('Listing limit check error:', error);
    next(); // Allow to continue even if check fails
  }
};

export const canFeatureProperty = (req, res, next) => {
  const user = req.user;
  const allowedRoles = ['internal_broker', 'admin', 'super_admin', 'support_admin'];
  const allowedTiers = ['premium', 'enterprise'];
  
  if (allowedRoles.includes(user.role) && allowedTiers.includes(user.privilege_tier)) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Feature property permission requires premium/enterprise tier'
  });
};