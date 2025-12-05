// utils/token.js
import jwt from "jsonwebtoken";

export const generateToken = (user, res, expiresIn = '7d') => {
    console.log('User object passed to generateToken:', user);

    let payload;
    
    // Handle different payload structures
    if (typeof user === 'object' && user.userId && user.requiresPasswordChange) {
        // Special case for password change tokens
        payload = {
            userId: user.userId,
            requiresPasswordChange: true
        };
        console.log('Generated Password Change Token Payload:', payload);
    } else {
        // Regular user token - REMOVE broker_type as it's not in users table
        payload = { 
            userId: user.id, 
            username: user.username,
            role: user.role,
            privilege_tier: user.privilege_tier || 'basic'
            // REMOVED: broker_type: user.broker_type,
        };
        console.log('Generated Regular Token Payload:', payload);
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

    // Only set cookie if response object is provided
    if (res) {
        res.cookie('jwt', token, {
            maxAge: expiresIn === '1h' ? 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV !== 'development'
        });
    }

    return token;
};

export const verifyToken = async (req, res, next) => {
    const token = req.cookies?.jwt || req.headers?.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database WITHOUT broker_type
        const db = await import("../shared/db.js").then(mod => mod.default);
        const [users] = await db.query(
            "SELECT id, first_name, last_name, username, email, role, privilege_tier, status, profile_picture, verified FROM users WHERE id = ?",
            [decoded.userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'User not found.' });
        }
        
        const user = users[0];
        
        // If we need broker_type for brokers, fetch it separately
        if (user.role.includes('broker')) {
            const [brokerProfiles] = await db.query(
                "SELECT broker_type FROM broker_profiles WHERE user_id = ?",
                [user.id]
            );
            if (brokerProfiles.length > 0) {
                user.broker_type = brokerProfiles[0].broker_type;
            }
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('❌ verifyToken error:', error.message);
        return res.status(401).json({ message: 'Invalid token.' });
    }
};