import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });
        console.log('Full payload:', payload);
        
        // Attach payload directly
        req.user = payload;
        
        // For backward compatibility, add 'id' if it doesn't exist but 'userId' does
        if (payload.userId && !payload.id) {
            req.user.id = payload.userId;
        }
        
        next();
    });
};