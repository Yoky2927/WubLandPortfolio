export const errorHandler = (err, req, res, next) => {
  console.error('Analytics Service Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.message.includes('unavailable')) {
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};