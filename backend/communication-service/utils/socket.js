import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ChatMessage } from "../models/chatMessage.model.js";
import NotificationModel from "../models/notification.model.js";

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

// Function declarations (without export keyword)
function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

function getOnlineUsers() {
  return Object.keys(userSocketMap);
}

function isUserOnline(userId) {
  return !!userSocketMap[userId];
}

function emitNotification(userId, notification) {
  try {
    const receiverSocketId = getReceiverSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newNotification", {
        type: "notification",
        data: notification,
        timestamp: new Date().toISOString(),
      });
      console.log(`📢 Notification sent to user ${userId} via socket`);
      return true;
    } else {
      console.log(`📵 User ${userId} is not connected via socket`);
      return false;
    }
  } catch (error) {
    console.error("Error emitting notification:", error);
    return false;
  }
}

function emitToNotificationRoom(userId, notification) {
  try {
    io.to(`notifications:${userId}`).emit("notification", {
      ...notification,
      timestamp: new Date().toISOString(),
    });
    console.log(`📢 Notification sent to user ${userId}'s notification room`);
    return true;
  } catch (error) {
    console.error("Error emitting to notification room:", error);
    return false;
  }
}

function broadcastToUsers(userIds, notification) {
  try {
    userIds.forEach(userId => {
      emitNotification(userId, notification);
      emitToNotificationRoom(userId, notification);
    });
    console.log(`📢 Notification broadcasted to ${userIds.length} users`);
    return true;
  } catch (error) {
    console.error("Error broadcasting to users:", error);
    return false;
  }
}

function broadcastToAllOnlineUsers(notification) {
  try {
    const onlineUserIds = getOnlineUsers();
    broadcastToUsers(onlineUserIds, notification);
    console.log(`📢 Notification broadcasted to all ${onlineUserIds.length} online users`);
    return onlineUserIds.length;
  } catch (error) {
    console.error("Error broadcasting to all online users:", error);
    return 0;
  }
}

async function broadcastToRole(role, notification) {
  try {
    // This would require fetching user IDs by role from database
    console.log(`📢 Role-based broadcast to ${role} users`);
    // Implementation would query database for users with specific role
    return 0;
  } catch (error) {
    console.error("Error broadcasting to role:", error);
    return 0;
  }
}

async function sendNotificationCountUpdate(userId) {
  try {
    const count = await getUnreadNotificationCount(userId);
    const userSocketId = getReceiverSocketId(userId);
    
    if (userSocketId) {
      io.to(userSocketId).emit("notification:count", { 
        unreadCount: count,
        timestamp: new Date().toISOString()
      });
    }
    
    // Also emit to notification room
    io.to(`notifications:${userId}`).emit("notification:count", {
      unreadCount: count,
      timestamp: new Date().toISOString()
    });
    
    return count;
  } catch (error) {
    console.error("Error sending notification count update:", error);
    return 0;
  }
}

// Helper functions (not exported)
async function markNotificationAsRead(notificationId, userId) {
  try {
    const success = await NotificationModel.markAsRead(notificationId, userId);
    if (success) {
      console.log(`✅ Notification ${notificationId} marked as read by user ${userId}`);
      
      const userSocketId = getReceiverSocketId(userId);
      if (userSocketId) {
        io.to(userSocketId).emit("notification:updated", {
          notificationId,
          isRead: true,
          readAt: new Date().toISOString()
        });
      }
      
      io.to(`notifications:${userId}`).emit("notification:updated", {
        notificationId,
        isRead: true,
        readAt: new Date().toISOString()
      });
    }
    return success;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

async function markAllNotificationsAsRead(userId) {
  try {
    const count = await NotificationModel.markAllAsRead(userId);
    console.log(`✅ ${count} notifications marked as read for user ${userId}`);
    
    const userSocketId = getReceiverSocketId(userId);
    if (userSocketId) {
      io.to(userSocketId).emit("notifications:all-read", {
        count,
        timestamp: new Date().toISOString()
      });
    }
    
    io.to(`notifications:${userId}`).emit("notifications:all-read", {
      count,
      timestamp: new Date().toISOString()
    });
    
    return count;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return 0;
  }
}

async function getUnreadNotificationCount(userId) {
  try {
    const count = await NotificationModel.getUnreadCount(userId);
    return count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}

async function archiveNotification(notificationId, userId) {
  try {
    const success = await NotificationModel.archiveNotification(notificationId, userId);
    if (success) {
      console.log(`✅ Notification ${notificationId} archived by user ${userId}`);
      await sendNotificationCountUpdate(userId);
    }
    return success;
  } catch (error) {
    console.error("Error archiving notification:", error);
    return false;
  }
}

async function deleteNotification(notificationId, userId) {
  try {
    const success = await NotificationModel.deleteNotification(notificationId, userId);
    if (success) {
      console.log(`✅ Notification ${notificationId} deleted by user ${userId}`);
      await sendNotificationCountUpdate(userId);
    }
    return success;
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`👤 User ${userId} mapped to socket ${socket.id}`);
    console.log("📊 Current online users:", Object.keys(userSocketMap));
    
    // Send initial notification count
    setTimeout(async () => {
      await sendNotificationCountUpdate(userId);
    }, 1000);
  }

  // Send updated online users to everyone
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // User joins their notification room by default
  if (userId) {
    socket.join(`notifications:${userId}`);
    console.log(`📢 User ${userId} joined notification room`);
  }

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      socket.leave(`notifications:${userId}`);
      console.log(`👤 User ${userId} removed from online users`);
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });

  // Group chat handlers
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

  // Notification handlers
  socket.on("subscribe:notifications", () => {
    if (userId) {
      socket.join(`notifications:${userId}`);
      console.log(`📢 User ${userId} subscribed to notifications`);
      sendNotificationCountUpdate(userId);
    }
  });

  socket.on("unsubscribe:notifications", () => {
    if (userId) {
      socket.leave(`notifications:${userId}`);
      console.log(`📢 User ${userId} unsubscribed from notifications`);
    }
  });

  socket.on("notification:read", async (data) => {
    try {
      const { notificationId } = data;
      console.log(`📢 User ${userId} marking notification ${notificationId} as read`);
      
      const success = await markNotificationAsRead(notificationId, userId);
      
      socket.emit("notification:read:response", {
        success,
        notificationId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error marking notification as read via socket:", error);
      socket.emit("notification:read:error", {
        error: error.message,
        notificationId: data.notificationId
      });
    }
  });

  socket.on("notification:mark-all-read", async () => {
    try {
      console.log(`📢 User ${userId} marking all notifications as read`);
      
      const count = await markAllNotificationsAsRead(userId);
      
      socket.emit("notification:mark-all-read:response", {
        success: true,
        count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error marking all notifications as read via socket:", error);
      socket.emit("notification:mark-all-read:error", {
        error: error.message
      });
    }
  });

  socket.on("notification:get-count", async () => {
    try {
      const count = await getUnreadNotificationCount(userId);
      socket.emit("notification:count", { 
        unreadCount: count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error getting notification count:", error);
      socket.emit("notification:count:error", {
        error: error.message
      });
    }
  });

  socket.on("notification:archive", async (data) => {
    try {
      const { notificationId } = data;
      const success = await archiveNotification(notificationId, userId);
      
      socket.emit("notification:archive:response", {
        success,
        notificationId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error archiving notification:", error);
      socket.emit("notification:archive:error", {
        error: error.message,
        notificationId: data.notificationId
      });
    }
  });

  socket.on("notification:delete", async (data) => {
    try {
      const { notificationId } = data;
      const success = await deleteNotification(notificationId, userId);
      
      socket.emit("notification:delete:response", {
        success,
        notificationId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      socket.emit("notification:delete:error", {
        error: error.message,
        notificationId: data.notificationId
      });
    }
  });

  // Admin broadcast notifications (requires admin check)
  socket.on("notification:broadcast", async (data) => {
    try {
      const { roles, message, title, type = "info", priority = "medium" } = data;
      
      console.log(`📢 Admin broadcast attempt: ${title} to roles: ${roles}`);
      
      const onlineUsers = getOnlineUsers();
      const notification = {
        title,
        message,
        type,
        priority,
        actionUrl: data.actionUrl,
        broadcast: true,
        broadcastBy: userId
      };
      
      broadcastToUsers(onlineUsers, notification);
      
      socket.emit("notification:broadcast:response", {
        success: true,
        recipients: onlineUsers.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error broadcasting notification:", error);
      socket.emit("notification:broadcast:error", {
        error: error.message
      });
    }
  });

  // Request notification refresh
  socket.on("notification:refresh", async () => {
    try {
      await sendNotificationCountUpdate(userId);
      
      const recentNotifications = await NotificationModel.getUserNotifications(userId, {
        limit: 10,
        offset: 0
      });
      
      socket.emit("notification:refresh:response", {
        success: true,
        notifications: recentNotifications,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error refreshing notifications:", error);
      socket.emit("notification:refresh:error", {
        error: error.message
      });
    }
  });
});

// Fix the EventEmitter memory leak warning
import EventEmitter from 'events';
EventEmitter.defaultMaxListeners = 20;

// Single export statement at the end
export { 
  io, 
  app, 
  server,
  getReceiverSocketId,
  getOnlineUsers,
  isUserOnline,
  emitNotification,
  emitToNotificationRoom,
  broadcastToUsers,
  broadcastToAllOnlineUsers,
  broadcastToRole,
  sendNotificationCountUpdate
};