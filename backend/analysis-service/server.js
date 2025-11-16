const express = require('express');
const cors = require('cors');
require('dotenv').config();

const analysisRoutes = require('./routes/analysisRoutes');
const { pool } = require('../shared/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'analysis-service',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/analysis', analysisRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Test database connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
})();

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`🚀 Analysis Service running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/api/analysis/dashboard`);
    console.log(`📈 Reports: http://localhost:${PORT}/api/analysis/reports`);
});

module.exports = app;

