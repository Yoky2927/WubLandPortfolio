import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
    },
});

// Used to store online users
const userSocketMap = {}; // {userId: socketId}

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

    // Send updated online users to everyone
    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    socket.on('disconnect', () => {
        console.log('A user disconnected', socket.id);
        if (userId) delete userSocketMap[userId];
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });

    // Message-related handlers
    socket.on('newMessage', (data) => {
        const receiverSocketId = getReceiverSocketId(data.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', data);
        }
    });

    socket.on('typing', (data) => {
        const receiverSocketId = getReceiverSocketId(data.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('userTyping', { userId: data.userId });
        }
    });

    socket.on('stopTyping', (data) => {
        const receiverSocketId = getReceiverSocketId(data.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('userStoppedTyping');
        }
    });

    socket.on('messageRead', async (data) => {
        const { messageId, receiverId } = data;
        await ChatMessage.updateStatus(messageId, 'read'); // Update status in DB
        const senderSocketId = getReceiverSocketId(receiverId); // senderId should be receiverId here?
        if (senderSocketId) {
            io.to(senderSocketId).emit('messageRead', { messageId });
        }
    });

    // Notification handler (for future one-way notifications)
    socket.on('newNotification', (data) => {
        const receiverSocketId = getReceiverSocketId(data.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newNotification', data);
        }
    });
});

export { io, app, server };