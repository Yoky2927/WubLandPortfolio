// communication-service/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import db from '../config/database.js'; // Add database import

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

        // Fetch user from DB including role
        const [users] = await db.query(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [decoded.userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        const user = users[0];
        
        // Attach user info to request including role
        req.user = { 
            id: user.id, 
            username: user.username,
            email: user.email,
            role: user.role 
        };
        
        console.log('🔑 verifyToken - User authenticated:', req.user);
        next();
    } catch (error) {
        console.error('❌ verifyToken error:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        return res.status(401).json({ message: `Authentication failed: ${error.message}` });
    }
};