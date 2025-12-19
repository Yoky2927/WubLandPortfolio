import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { verifyToken } from './middleware/auth.middleware.js';
import messageRoutes from './routes/message.routes.js';
import { app, server, io } from './utils/socket.js'; // Use exported app, server, io
import express from 'express';
import multer from 'multer';


const upload = multer({ dest: 'uploads/' }); // Adjust for Cloudinary

// CORS configuration
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Content-Length'] // Added Content-Length
};


app.use(express.json({ limit: '10mb' })); // Increase to 10MB for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // For form data if needed
app.use(cookieParser());
app.use(cors(corsOptions)); // Apply CORS middleware
app.use(express.json()); // Ensure express.json is applied (moved from utils/socket.js if needed)

// Routes
app.use('/api/messages', verifyToken, messageRoutes);

// Ensure Socket.IO CORS is consistent (already handled in utils/socket.js)
// No need to reconfigure io.on here unless adding specific handlers

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Communication service running on port ${PORT}`);
});