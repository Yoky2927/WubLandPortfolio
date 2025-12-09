import dotenv from 'dotenv';

dotenv.config();

export const SERVICES = {
  USER: process.env.USER_SERVICE_URL || 'http://localhost:5000',
  PROPERTY: process.env.PROPERTY_SERVICE_URL || 'http://localhost:5002',
  TRANSACTION: process.env.TRANSACTION_SERVICE_URL || 'http://localhost:5001',
  TODO: process.env.TODO_SERVICE_URL || 'http://localhost:5003',
  COMMUNICATION: process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:5005'
};

export const CACHE_CONFIG = {
  TTL: parseInt(process.env.CACHE_TTL) || 300000,
  ENABLED: process.env.NODE_ENV !== 'development'
};

export const RATE_LIMIT = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
};