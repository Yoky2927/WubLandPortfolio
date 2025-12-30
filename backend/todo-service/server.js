import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { router as todoRoutes } from './routes/todo.routes.js';
// Since todo-service uses ES modules, you need the .js version or convert to ES
import { ApiDocs, createHealthCheck } from '../shared/api-docs.js';  // Changed to .js

dotenv.config();

const app = express();

app.use(express.json());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Define todo endpoints for documentation
const todoEndpoints = [
  ApiDocs.createRoute('GET', '/api/todos', 'Get todos', true),
  ApiDocs.createRoute('POST', '/api/todos', 'Create todo', true),
  ApiDocs.createRoute('GET', '/api/todos/:id', 'Get todo by ID', true),
  ApiDocs.createRoute('PUT', '/api/todos/:id', 'Update todo', true),
  ApiDocs.createRoute('DELETE', '/api/todos/:id', 'Delete todo', true),
  // Add more routes from your todo.routes.js
];

// API Documentation endpoint
app.get('/api-docs', (req, res) => {
  res.json(ApiDocs.generateDocs('todo', todoEndpoints));
});

// Health endpoint using createHealthCheck
app.get('/health', createHealthCheck('todo'));

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Todo Service is working!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      docs: '/api-docs',
      health: '/health',
      api: '/api/todos'
    }
  });
});

// Routes
app.use('/api/todos', todoRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Todo service error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5003;  // Changed to 5003 since netstat shows it's running there

app.listen(PORT, () => {
  console.log(`✅ Todo Service running on port ${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`🩺 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
});