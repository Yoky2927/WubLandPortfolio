// backend/property-service/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import axios from 'axios';
import pool from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists in database
    const [users] = await pool.execute(
      'SELECT id, username, email, role, privilege_tier, status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    next(error);
  }
};

// NEW: Role-based authorization middleware
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // If no roles specified, allow any authenticated user
    if (allowedRoles.length === 0) {
      return next();
    }

    // Check if user has one of the allowed roles
    const userRole = req.user.role;
    
    // Role mapping for flexibility
    const roleHierarchy = {
      'super_admin': ['super_admin', 'admin', 'support_admin', 'internal_broker', 'external_broker', 'seller', 'buyer', 'support_agent'],
      'admin': ['admin', 'support_admin', 'internal_broker', 'external_broker', 'seller', 'buyer', 'support_agent'],
      'support_admin': ['support_admin', 'support_agent'],
      'support_agent': ['support_agent'],
      'internal_broker': ['internal_broker'],
      'external_broker': ['external_broker'],
      'broker': ['internal_broker', 'external_broker'], // Generic broker role
      'seller': ['seller'],
      'buyer': ['buyer']
    };

    // Check direct role match
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Check role hierarchy
    for (const allowedRole of allowedRoles) {
      if (roleHierarchy[allowedRole] && roleHierarchy[allowedRole].includes(userRole)) {
        return next();
      }
    }

    // Check generic 'admin' role
    if (userRole === 'super_admin' || userRole === 'admin') {
      const adminAllowed = allowedRoles.some(role => 
        ['admin', 'support_admin', 'support_agent', 'broker', 'seller', 'buyer'].includes(role)
      );
      if (adminAllowed) {
        return next();
      }
    }

    // Check generic 'broker' role
    if ((userRole === 'internal_broker' || userRole === 'external_broker') && 
        allowedRoles.includes('broker')) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
      requiredRoles: allowedRoles,
      userRole: userRole
    });
  };
};

export const verifyUserService = async (userId) => {
  try {
    const response = await axios.get(
      `${process.env.USER_SERVICE_URL}/api/users/${userId}/verify`,
      { timeout: 5000 }
    );
    return response.data.success;
  } catch (error) {
    console.error('User service verification failed:', error.message);
    return false;
  }
};

export const checkOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins and support can access all properties
    const adminRoles = ['super_admin', 'admin', 'support_admin', 'support_agent'];
    if (adminRoles.includes(userRole)) {
      return next();
    }

    // Check if user owns the property
    const [properties] = await pool.execute(
      'SELECT owner_user_id, created_by_user_id FROM properties WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const property = properties[0];
    
    if (property.owner_user_id !== userId && property.created_by_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this property'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// NEW: Check if user is broker for specific property
export const isPropertyBroker = async (req, res, next) => {
  try {
    const { property_id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins can access any property
    const adminRoles = ['super_admin', 'admin', 'support_admin'];
    if (adminRoles.includes(userRole)) {
      return next();
    }

    // Check if user is the assigned broker for this property
    const [properties] = await pool.execute(
      'SELECT assigned_broker_id FROM properties WHERE id = ? AND deleted_at IS NULL',
      [property_id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const property = properties[0];
    
    if (property.assigned_broker_id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not the assigned broker for this property'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// NEW: Check if user can upload documents (owner, broker, or admin)
export const canUploadDocuments = async (req, res, next) => {
  try {
    const { property_id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins can upload to any property
    if (userRole === 'super_admin' || userRole === 'admin') {
      return next();
    }

    // Check property ownership/broker assignment
    const [properties] = await pool.execute(
      'SELECT owner_user_id, assigned_broker_id, created_by_user_id FROM properties WHERE id = ? AND deleted_at IS NULL',
      [property_id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const property = properties[0];
    
    const isOwner = property.owner_user_id === parseInt(userId);
    const isBroker = property.assigned_broker_id === parseInt(userId);
    const isCreator = property.created_by_user_id === parseInt(userId);
    
    if (!isOwner && !isBroker && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload documents for this property'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};