import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ChatMessage } from "../models/chatMessage.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  },
});

// Used to store online users
const userSocketMap = {}; // {userId: socketId}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`👤 User ${userId} mapped to socket ${socket.id}`);
    console.log("📊 Current online users:", Object.keys(userSocketMap));
  }

  // Send updated online users to everyone
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      console.log(`👤 User ${userId} removed from online users`);
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
  socket.on("joinGroups", (data) => {
    const { groupIds } = data;
    if (groupIds && Array.isArray(groupIds)) {
      groupIds.forEach((groupId) => {
        socket.join(`group_${groupId}`);
        console.log(`👥 User ${socket.id} joined group ${groupId}`);
      });
    }
  });

  socket.on("newGroupMessage", (data) => {
    // Broadcast to all group members except sender
    socket.to(`group_${data.groupId}`).emit("newGroupMessage", data);
  });

  socket.on("groupTyping", (data) => {
    socket.to(`group_${data.groupId}`).emit("userGroupTyping", {
      userId: data.userId,
      userName: data.userName,
      groupId: data.groupId,
    });
  });

  socket.on("groupStopTyping", (data) => {
    socket.to(`group_${data.groupId}`).emit("userGroupStopTyping", {
      userId: data.userId,
      groupId: data.groupId,
    });
  });

  // Message-related handlers
  socket.on("newMessage", (data) => {
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", data);
    }
  });

  socket.on("typing", (data) => {
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { userId: data.userId });
    }
  });

  socket.on("stopTyping", (data) => {
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping");
    }
  });

  socket.on("messageRead", async (data) => {
    const { messageId, receiverId } = data;
    await ChatMessage.updateStatus(messageId, "read");
    const senderSocketId = getReceiverSocketId(receiverId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageRead", { messageId });
    }
  });

  // Notification handler
  socket.on("newNotification", (data) => {
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newNotification", data);
    }
  });
});

export { io, app, server };
