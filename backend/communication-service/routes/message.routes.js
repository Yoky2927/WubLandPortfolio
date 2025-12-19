import express from 'express';
import { getUsersForSidebar, getMessages, sendMessage, deleteMessage, uploadMiddleware,checkCloudinaryHealth } from '../controllers/message.controller.js';

const router = express.Router();

// Test endpoint for file upload
router.post('/test-upload', uploadMiddleware, (req, res) => {
    console.log('Test upload - File:', req.file);
    console.log('Test upload - Body:', req.body);
    res.json({ success: true, file: req.file, body: req.body });
});

router.get('/health/cloudinary', checkCloudinaryHealth);

router.get('/users', getUsersForSidebar);
router.get('/:id', getMessages);
router.post('/send/:id', uploadMiddleware, sendMessage);
router.delete('/:id', deleteMessage);

export default router;