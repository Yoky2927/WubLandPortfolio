// middlewares/privilege.middleware.js
import pool from '../config/database.js';

// FIRST: Check if user can post at all (role-based)
export const canPostProperties = (req, res, next) => {
  const user = req.user;
  
  // Only these roles can post properties directly
  const canPostRoles = [
    'internal_broker',
    'external_broker', 
    'admin',
    'super_admin',
    'support_admin'
  ];
  
  if (!canPostRoles.includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: `Your role (${user.role}) cannot post properties directly. Please contact a broker.`
    });
  }
  
  next();
};

// SECOND: Check listing limits (tier-based)
export const checkListingLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const privilegeTier = req.user.privilege_tier || 'basic';
    
    // Get user's ACTIVE listing count (not draft)
    const [result] = await pool.execute(
      `SELECT COUNT(*) as count FROM properties 
       WHERE created_by_user_id = ? 
       AND property_status IN ('active', 'pending', 'draft')
       AND deleted_at IS NULL`,
      [userId]
    );
    
    const currentListings = result[0].count;
    
    // Define STRICT limits - especially for external brokers
    const limits = {
      'internal_broker': {
        'basic': 10,
        'standard': 50,
        'premium': 200,
        'enterprise': 1000
      },
      'external_broker': {
        'basic': 3,      // Start with only 3!
        'standard': 10,  // Upgrade to standard for 10
        'premium': 25,   // Premium for 25
        'enterprise': 100
      },
      'admin': { 
        'basic': 1000,
        'standard': 5000,
        'premium': 10000,
        'enterprise': 50000
      },
      'super_admin': { 
        'basic': 10000,
        'standard': 50000,
        'premium': 100000,
        'enterprise': 1000000
      },
      'support_admin': {
        'basic': 100,
        'standard': 500,
        'premium': 2000,
        'enterprise': 10000
      }
    };
    
    const userLimit = limits[userRole]?.[privilegeTier] || 
                     (userRole === 'external_broker' ? 3 : 10); // Defaults
    
    if (currentListings >= userLimit) {
      return res.status(403).json({
        success: false,
        message: `Listing limit reached. Maximum allowed: ${userLimit}`,
        current: currentListings,
        limit: userLimit,
        tier: privilegeTier,
        upgradeMessage: userRole === 'external_broker' && currentListings >= 3 
          ? 'Contact support to upgrade your tier for more listings' 
          : null
      });
    }
    
    // Add limit info to request for logging
    req.limitInfo = {
      current: currentListings,
      limit: userLimit,
      remaining: userLimit - currentListings
    };
    
    next();
  } catch (error) {
    console.error('Listing limit check error:', error);
    // For safety, allow but log
    console.warn('Failed to check listing limit, allowing post');
    next();
  }
};

// THIRD: Check if user can feature properties
export const canFeatureProperty = (req, res, next) => {
  const user = req.user;
  
  // Only premium/enterprise brokers/admins can feature
  const allowedRoles = ['internal_broker', 'admin', 'super_admin', 'support_admin'];
  const allowedTiers = ['premium', 'enterprise'];
  
  if (allowedRoles.includes(user.role) && allowedTiers.includes(user.privilege_tier)) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Featuring properties requires premium/enterprise tier',
    requiredTier: 'premium',
    currentTier: user.privilege_tier || 'basic'
  });
};

// FOURTH: Check if user can post premium listings
export const canPostPremium = (req, res, next) => {
  const user = req.user;
  
  // Only specific roles with premium/enterprise can post premium
  const allowedRoles = ['internal_broker', 'admin', 'super_admin'];
  const allowedTiers = ['premium', 'enterprise'];
  
  if (allowedRoles.includes(user.role) && allowedTiers.includes(user.privilege_tier)) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Posting premium listings requires internal broker/admin with premium/enterprise tier',
    requiredRole: 'internal_broker or admin',
    requiredTier: 'premium',
    currentRole: user.role,
    currentTier: user.privilege_tier || 'basic'
  });
};

// FIFTH: Broker verification check (for external brokers)
export const requireBrokerVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Only check for external brokers
    if (userRole !== 'external_broker') {
      return next();
    }
    
    // Check if broker is verified
    const [result] = await pool.execute(
      `SELECT is_verified FROM broker_profiles WHERE user_id = ?`,
      [userId]
    );
    
    if (result.length === 0 || !result[0].is_verified) {
      return res.status(403).json({
        success: false,
        message: 'External brokers must be verified before posting properties',
        verificationRequired: true,
        instructions: 'Complete your broker profile and await verification'
      });
    }
    
    next();
  } catch (error) {
    console.error('Verification check error:', error);
    next(); // Allow for now if check fails
  }
};