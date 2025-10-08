import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');
    console.log('🔐 Received token:', token ? `"${token}"` : 'No token');

    if (!token) return res.status(401).json({ message: "Unauthorized - No Token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Decoded token:', decoded);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    delete user.password;
    req.user = user;
    next();
  } catch (err) {
    console.error("❌ protectRoute error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'Please sign up or log in to access this service' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ verifyToken error:', error.message);
    return res.status(401).json({ message: `Invalid token: ${error.message}` });
  }
};

// Enhanced role verification
export const verifyAdmin = async (req, res, next) => {
  const adminRoles = ['admin', 'super_admin', 'support_admin'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const verifySupportStaff = async (req, res, next) => {
  const supportRoles = ['support_agent', 'support_lead', 'support_admin', 'super_admin'];
  if (!supportRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Support staff access required' });
  }
  next();
};

export const verifySupportLead = async (req, res, next) => {
  const leadRoles = ['support_lead', 'support_admin', 'super_admin'];
  if (!leadRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Support lead access required' });
  }
  next();
};

export const verifySupportAdmin = async (req, res, next) => {
  const adminRoles = ['support_admin', 'super_admin'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Support admin access required' });
  }
  next();
};