import { User } from '../models/user.model.js';
import { ChatMessage } from '../models/chatMessage.model.js';
import { io, getReceiverSocketId } from '../utils/socket.js';

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';



// Add this function to check Cloudinary health
export const checkCloudinaryHealth = async (req, res) => {
    try {
        const cloudinary = (await import('cloudinary')).v2;
        
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const result = await cloudinary.api.ping();
        res.json({ 
            status: 'ok', 
            cloudinary: result.status === 'ok' ? 'connected' : 'error',
            message: result
        });
    } catch (error) {
        console.error('Cloudinary health check failed:', error);
        res.status(500).json({ 
            status: 'error', 
            cloudinary: 'disconnected',
            error: error.message 
        });
    }
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept all file types
        cb(null, true);
    }
});

export const uploadMiddleware = upload.single('file');

export const getUsersForSidebar = async (req, res) => {
    try {
        const users = await User.findAll(req.user.id);
        res.status(200).json(users);
    } catch (error) {
        console.error('Error in getUsersForSidebar:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user.id;
        const messages = await ChatMessage.find(myId, userToChatId);
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error in getMessages:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        console.log('=== REQUEST DETAILS ===');
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Request file:', req.file);
        console.log('Request headers content-type:', req.headers['content-type']);
        
        const { text } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.id;
        const file = req.file;

        console.log('sendMessage - Sender ID:', senderId);
        console.log('sendMessage - Receiver ID:', receiverId);
        console.log('sendMessage - Text:', text);
        console.log('sendMessage - File:', file ? `${file.originalname} (${file.size} bytes, ${file.mimetype})` : 'No file');

        // Prevent self-messaging
        if (senderId === receiverId) {
            return res.status(400).json({ error: 'Cannot send message to yourself' });
        }

        // Validate sender
        const sender = await User.findById(senderId);
        if (!sender) {
            console.error('Sender not found for ID:', senderId);
            return res.status(400).json({ error: 'Sender not found' });
        }

        // Message limit for non-premium users
        if (sender.broker_type !== 'internal' && !sender.is_premium) {
            const today = new Date().toISOString().split('T')[0];
            const messageCount = await ChatMessage.getTodayMessageCount(senderId, today);
            if (messageCount >= 15) {
                return res.status(403).json({ error: 'Message limit reached. Upgrade to premium for unlimited messages.' });
            }
        }

        // Validate receiver
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            console.error('Receiver not found for ID:', receiverId);
            return res.status(400).json({ error: 'Receiver not found' });
        }

        let fileUrl = null;
        let fileName = null;
        let fileType = null;

        // Handle file upload
        if (file) {
            try {
                // Determine file type
                const extension = file.originalname.split('.').pop().toLowerCase();
                const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
                const archiveExtensions = ['zip', 'rar', '7z'];

                if (imageExtensions.includes(extension)) {
                    fileType = 'image';
                } else if (documentExtensions.includes(extension)) {
                    fileType = 'document';
                } else if (archiveExtensions.includes(extension)) {
                    fileType = 'archive';
                } else {
                    fileType = 'other';
                }

                fileName = file.originalname;

                // Upload to Cloudinary
                const uploadResponse = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'chat_files',
                            resource_type: 'auto', // Auto-detect resource type
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );

                    uploadStream.end(file.buffer);
                });

                fileUrl = uploadResponse.secure_url;
                console.log('File uploaded to Cloudinary:', fileUrl);

            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError.message);
                return res.status(500).json({ error: 'Failed to upload file' });
            }
        }

        const newMessage = await ChatMessage.create({
            senderId,
            receiverId,
            text: text || '',
            file: fileUrl,
            fileName: fileName,
            fileType: fileType,
            status: 'sent',
        });

        // Update last message time for both users
        await User.updateLastMessageTime(senderId);
        await User.updateLastMessageTime(receiverId);

        // Emit to receiver via socket.io
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
            console.log('Message emitted to receiver socket:', receiverSocketId);
        } else {
            console.log('No socket found for receiver ID:', receiverId);
        }

        console.log('Message created successfully:', newMessage);
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error in sendMessage:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.user.id;

        console.log('deleteMessage - Message ID:', messageId);
        console.log('deleteMessage - User ID:', userId);

        const message = await ChatMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.sender_id !== userId) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }

        const success = await ChatMessage.delete(messageId);
        if (!success) {
            return res.status(500).json({ error: 'Failed to delete message' });
        }

        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error in deleteMessage:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};