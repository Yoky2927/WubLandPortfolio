import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js'; // adjust path

export const verifyToken = async (req, res, next) => {
    try {
        // Try cookies first, then Authorization header
        let token = null;

        if (req.cookies?.jwt) {
            token = req.cookies.jwt;
            console.log('🔑 verifyToken - Token source: cookie');
        } else if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('🔑 verifyToken - Token source: header');
        }

        console.log('🔑 verifyToken - Received token:', token ? `"${token}"` : 'No token');

        // No token at all
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔑 verifyToken - Decoded token:', decoded);

        // Fetch user from DB (minimal fields for communication)
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach to request (only id and basic info)
        req.user = { id: user.id, fullName: user.full_name, profilePic: user.profile_pic };
        next();
    } catch (error) {
        console.error('❌ verifyToken error:', error.message);
        return res.status(401).json({ message: `Invalid token: ${error.message}` });
    }
};