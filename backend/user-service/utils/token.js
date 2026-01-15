// utils/token.js
import jwt from "jsonwebtoken";

export const generateToken = (user, res = null, expiresIn = '7d') => { // <-- Make res optional with default null
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
        // Regular user token - Include ALL necessary fields
        payload = { 
            userId: user.id || user.userId, // <-- Handle both id and userId
            username: user.username,
            role: user.role,
            privilege_tier: user.privilege_tier || 'basic',
            // Add these new fields for account status tracking
            verified: user.verified === 1 || user.verified === true, // <-- Handle both number and boolean
            status: user.status || 'active',
            password_change_required: user.password_change_required || false,
            created_by_user_id: user.created_by_user_id || null
        };
        console.log('Generated Regular Token Payload:', payload);
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

    // Only set cookie if response object is provided AND has cookie method
    if (res && typeof res.cookie === 'function') {
        res.cookie('jwt', token, {
            maxAge: expiresIn === '1h' ? 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV !== 'development'
        });
        console.log('✅ Cookie set for token');
    } else {
        console.log('⚠️ No valid response object provided, skipping cookie set');
    }

    return token;
};

// NEW FUNCTION: Generate password change specific token
export const generatePasswordChangeToken = (userId, email) => {
    const payload = {
        userId: userId,
        email: email,
        requiresPasswordChange: true,
        initialLogin: true,
        type: 'password_change'
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated Password Change Token for user:', userId);
    return token;
};

// NEW FUNCTION: Verify password change token
export const verifyPasswordChangeToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if this is a password change token
        if (!decoded.requiresPasswordChange || decoded.type !== 'password_change') { // <-- Fixed comparison
            throw new Error("Not a password change token");
        }

        return {
            valid: true,
            userId: decoded.userId,
            email: decoded.email
        };
    } catch (error) {
        console.error("❌ Password change token verification error:", error.message);
        return {
            valid: false,
            error: error.message
        };
    }
};

export const verifyToken = async (req, res, next) => {
    const token = req.cookies?.jwt || req.headers?.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database WITH ALL NECESSARY FIELDS
        const db = await import("../shared/db.js").then(mod => mod.default);
        const [users] = await db.query(
            `SELECT id, first_name, last_name, username, email, role, 
                    privilege_tier, status, profile_picture, verified,
                    is_email_verified, password_change_required, 
                    created_by_user_id, last_login, login_attempts
             FROM users WHERE id = ?`,
            [decoded.userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'User not found.' });
        }
        
        const user = users[0];
        
        // Check account status
        if (user.status === 'suspended') {
            return res.status(403).json({ 
                message: 'Account suspended. Please contact support.',
                account_status: 'suspended'
            });
        }
        
        if (user.status === 'inactive') {
            return res.status(403).json({ 
                message: 'Account inactive. Please contact support to reactivate.',
                account_status: 'inactive'
            });
        }
        
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