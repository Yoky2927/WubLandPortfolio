// middlewares/error.middleware.js
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(`❌ Error: ${err.message}`);
  console.error(`   Path: ${req.originalUrl}`);
  console.error(`   Method: ${req.method}`);
  console.error(`   Stack: ${err.stack}`);
  
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};