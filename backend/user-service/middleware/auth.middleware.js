import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');
    console.log('🔐 Received token:', token ? `"${token}"` : 'No token');
    console.log('🔐 Token length:', token ? token.length : 0);

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
    // Extract token from cookies or Authorization header
    const token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];
    console.log('🔑 verifyToken - Token source:', req.cookies?.jwt ? 'cookie' : req.headers.authorization ? 'header' : 'none');
    console.log('🔑 verifyToken - Received token:', token ? `"${token}"` : 'No token');

    // Check if token is missing or explicitly null/undefined
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'Please sign up or log in to access this service' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔑 verifyToken - Decoded token:', decoded);

    // Fetch user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ verifyToken error:', error.message);
    return res.status(401).json({ message: `Invalid token: ${error.message}` });
  }
};

export const verifyAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

