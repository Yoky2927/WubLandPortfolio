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