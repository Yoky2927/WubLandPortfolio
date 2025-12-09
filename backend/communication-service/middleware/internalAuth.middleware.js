// communication-service/middleware/internalAuth.middleware.js
export const verifyInternalToken = (req, res, next) => {
  const internalToken = req.headers['x-internal-token'];
  
  if (!internalToken) {
    return res.status(401).json({
      success: false,
      message: 'Internal token required'
    });
  }

  // Verify the internal token
  if (internalToken !== process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(403).json({
      success: false,
      message: 'Invalid internal token'
    });
  }

  next();
};