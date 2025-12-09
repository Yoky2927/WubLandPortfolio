import express from 'express';
import axios from 'axios'; // Add this import
import { 
  getDashboardAnalytics,
  getUserAnalytics,
  getPropertyAnalytics,
  getTransactionAnalytics,
  getSystemHealth
} from '../controllers/analytics.controller.js';

const router = express.Router();

// Main dashboard endpoint
router.get('/dashboard', getDashboardAnalytics);

// Individual analytics endpoints
router.get('/users', getUserAnalytics);
router.get('/properties', getPropertyAnalytics);
router.get('/transactions', getTransactionAnalytics);
router.get('/system-health', getSystemHealth);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'analysis-service',
    timestamp: new Date().toISOString()
  });
});

// Test token endpoint
router.get('/test-token', async (req, res) => {
  try {
    // Test getting token
    const loginData = {
      username: process.env.ANALYSIS_SERVICE_USERNAME || 'yokabd_admin',
      password: process.env.ANALYSIS_SERVICE_PASSWORD || 'Admin@123'
    };
    
    console.log('Testing login with:', loginData.username);
    
    const response = await axios.post(
      'http://localhost:5000/api/auth/login',
      loginData,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    console.log('Login response status:', response.status);
    
    if (response.data.token) {
      res.json({
        success: true,
        tokenLength: response.data.token.length,
        tokenPreview: response.data.token.substring(0, 50) + '...',
        user: response.data.user,
        message: 'Token obtained successfully'
      });
    } else {
      res.json({
        success: false,
        message: 'No token in response',
        responseData: response.data
      });
    }
    
  } catch (error) {
    console.error('Test token error:', error.message);
    
    let errorDetails = {};
    if (error.response) {
      errorDetails = {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      };
    } else if (error.request) {
      errorDetails = { message: 'No response received' };
    } else {
      errorDetails = { message: error.message };
    }
    
    res.status(500).json({
      error: 'Failed to get token',
      message: error.message,
      details: errorDetails
    });
  }
});

// Test user fetch endpoint
router.get('/test-users', async (req, res) => {
  try {
    // 1. First get token
    const loginData = {
      username: process.env.ANALYSIS_SERVICE_USERNAME || 'yokabd_admin',
      password: process.env.ANALYSIS_SERVICE_PASSWORD || 'Admin@123'
    };
    
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post(
      'http://localhost:5000/api/auth/login',
      loginData,
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    
    if (!loginResponse.data.token) {
      return res.status(500).json({
        error: 'No token received',
        loginResponse: loginResponse.data
      });
    }
    
    const token = loginResponse.data.token;
    console.log('Step 2: Got token, length:', token.length);
    
    // 2. Fetch users with the token
    console.log('Step 3: Fetching users...');
    const usersResponse = await axios.get(
      'http://localhost:5000/api/users',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: (status) => status < 500
      }
    );
    
    console.log('Step 4: Users response status:', usersResponse.status);
    
    res.json({
      success: true,
      steps: {
        login: 'success',
        tokenObtained: true,
        tokenLength: token.length,
        fetchUsers: usersResponse.status
      },
      usersCount: Array.isArray(usersResponse.data) ? usersResponse.data.length : 'not array',
      sampleUser: Array.isArray(usersResponse.data) && usersResponse.data.length > 0 ? usersResponse.data[0] : null,
      fullResponse: usersResponse.data
    });
    
  } catch (error) {
    console.error('Test users error:', error.message);
    
    const errorResponse = {
      error: 'Failed to test user fetch',
      message: error.message
    };
    
    if (error.response) {
      errorResponse.response = {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      };
    }
    
    res.status(500).json(errorResponse);
  }
});

export default router;