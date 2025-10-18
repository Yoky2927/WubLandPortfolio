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
        // Regular user token
        payload = { 
            userId: user.id, 
            username: user.username,
            role: user.role // ✅ CRITICAL!
        };
        console.log('Generated Regular Token Payload:', payload);
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

    // Only set cookie if response object is provided
    if (res) {
        res.cookie('jwt', token, {
            maxAge: expiresIn === '1h' ? 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 1 hour or 7 days
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV !== 'development'
        });
    }

    return token;
};