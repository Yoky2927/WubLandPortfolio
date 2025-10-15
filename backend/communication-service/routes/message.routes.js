import express from 'express';
import { getUsersForSidebar, getMessages, sendMessage, deleteMessage, uploadMiddleware,checkCloudinaryHealth,debugUsers } from '../controllers/message.controller.js';

const router = express.Router();

// Test endpoint for file upload
router.post('/test-upload', uploadMiddleware, (req, res) => {
    console.log('Test upload - File:', req.file);
    console.log('Test upload - Body:', req.body);
    res.json({ success: true, file: req.file, body: req.body });
});

router.get('/health/cloudinary', checkCloudinaryHealth);

router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'communication-service',
    timestamp: new Date().toISOString()
  });
});

router.get('/users', getUsersForSidebar);
router.get('/:id', getMessages);
router.post('/send/:id', uploadMiddleware, sendMessage);
router.delete('/:id', deleteMessage);
router.get('/debug/users', debugUsers);

export default router;