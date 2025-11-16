const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Expect "Bearer <token>"
    if (!token) return res.status(403).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
};

/**
 * Middleware to check if user has admin role
 */
module.exports.adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

/**
 * Middleware to allow admin or broker roles
 */
module.exports.adminOrBroker = (req, res, next) => {
    if (!['admin', 'broker'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin or broker access required' });
    }
    next();
};

