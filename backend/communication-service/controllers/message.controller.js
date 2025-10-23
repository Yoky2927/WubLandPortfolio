import { User } from "../models/user.model.js";
import { ChatMessage, GroupChat } from "../models/chatMessage.model.js"; // Add GroupChat import
import { io, getReceiverSocketId } from "../utils/socket.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import db from "../../shared/db.js"; 

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Add this function to check Cloudinary health
export const checkCloudinaryHealth = async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({
      status: "ok",
      cloudinary: result.status === "ok" ? "connected" : "error",
      message: result,
    });
  } catch (error) {
    console.error("Cloudinary health check failed:", error);
    res.status(500).json({
      status: "error",
      cloudinary: "disconnected",
      error: error.message,
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
  },
});

export const uploadMiddleware = upload.single("file");

export const getUsersForSidebar = async (req, res) => {
  try {
    console.log("🔍 getUsersForSidebar called - User ID:", req.user?.id);
    console.log("🔍 Request user object:", req.user);

    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Test if User model is working
    console.log("🔍 Testing User.findAll...");
    const users = await User.findAll({
      excludeId: req.user.id,
      currentUserId: req.user.id,
    });

    console.log("✅ Found users:", users?.length);
    console.log("📊 Sample user:", users?.[0]);

    if (!users) {
      return res.status(500).json({ error: "No users returned from database" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error in getUsersForSidebar:", error.message);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const currentUserId = req.user.id;

    console.log(
      "📨 Getting messages between:",
      currentUserId,
      "and",
      otherUserId
    );

    const messages = await ChatMessage.find(currentUserId, otherUserId);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    console.log("=== REQUEST DETAILS ===");
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Request file:", req.file);
    console.log("Request headers content-type:", req.headers["content-type"]);

    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user.id;
    const file = req.file;

    console.log("sendMessage - Sender ID:", senderId);
    console.log("sendMessage - Receiver ID:", receiverId);
    console.log("sendMessage - Text:", text);
    console.log(
      "sendMessage - File:",
      file
        ? `${file.originalname} (${file.size} bytes, ${file.mimetype})`
        : "No file"
    );

    // Prevent self-messaging
    if (senderId == receiverId) {
      return res.status(400).json({ error: "Cannot send message to yourself" });
    }

    // Validate sender
    const sender = await User.findById(senderId);
    if (!sender) {
      console.error("Sender not found for ID:", senderId);
      return res.status(400).json({ error: "Sender not found" });
    }

    // Message limit for non-premium users
    if (!["premium", "enterprise"].includes(sender.privilege_tier)) {
      const today = new Date().toISOString().split("T")[0];
      const messageCount = await ChatMessage.getTodayMessageCount(
        senderId,
        today
      );
      if (messageCount >= 15) {
        return res.status(403).json({
          error:
            "Message limit reached. Upgrade to premium for unlimited messages.",
        });
      }
    }

    // Validate receiver
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      console.error("Receiver not found for ID:", receiverId);
      return res.status(400).json({ error: "Receiver not found" });
    }

    let fileUrl = null;
    let fileName = null;
    let fileType = null;
    let fileSize = null;

    // Handle file upload
    if (file) {
      try {
        // Determine file type based on both extension and mime type
        const extension = file.originalname.split(".").pop().toLowerCase();
        const mimeType = file.mimetype;

        console.log("📁 File upload details:", {
          originalName: file.originalname,
          extension: extension,
          mimeType: mimeType,
          size: file.size,
        });

        // Enhanced file type detection
        const imageExtensions = [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "svg",
          "jfif",
          "pjpeg",
          "pjp",
          "bmp",
          "ico",
          "tiff",
          "tif",
        ];
        const imageMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/svg+xml",
          "image/bmp",
          "image/x-windows-bmp",
          "image/tiff",
          "image/x-tiff",
        ];

        const documentExtensions = ["pdf", "doc", "docx", "txt", "rtf"];
        const archiveExtensions = ["zip", "rar", "7z", "tar", "gz"];

        if (
          imageExtensions.includes(extension) ||
          imageMimeTypes.includes(mimeType)
        ) {
          fileType = "image";
        } else if (documentExtensions.includes(extension)) {
          fileType = "document";
        } else if (archiveExtensions.includes(extension)) {
          fileType = "archive";
        } else {
          fileType = "other";
        }

        fileName = file.originalname;

        console.log("☁️ Uploading to Cloudinary with type:", fileType);

        // FIXED: Use proper resource_type for images
        const resourceType = fileType === "image" ? "image" : "auto";

        // Upload to Cloudinary
        const uploadResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "chat_files",
              resource_type: resourceType,
              // Add quality optimization for images
              quality: "auto",
              fetch_format: "auto",
            },
            (error, result) => {
              if (error) {
                console.error("❌ Cloudinary upload error:", error);
                reject(error);
              } else {
                console.log(
                  "✅ Cloudinary upload successful:",
                  result.secure_url
                );
                resolve(result);
              }
            }
          );

          uploadStream.end(file.buffer);
        });

        fileUrl = uploadResponse.secure_url;
        console.log("✅ File uploaded to Cloudinary:", fileUrl);
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError.message);
        return res.status(500).json({ error: "Failed to upload file" });
      }
    }

    // Find or create conversation
    const conversationId = await ChatMessage.findOrCreateConversation(
      senderId,
      receiverId,
      senderId
    );

    // Create the message
    const newMessage = await ChatMessage.create({
      conversationId,
      senderId,
      text: text || "",
      fileUrl: fileUrl,
      fileName: fileName,
      fileType: fileType,
      fileSize: fileSize,
      status: "sent",
    });

    // Update conversation last message time
    await ChatMessage.updateConversationLastMessage(conversationId);

    // Update last message time for both users
    await User.updateLastMessageTime(senderId);
    await User.updateLastMessageTime(receiverId);

    // Emit to receiver via socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      console.log("📤 Message emitted to receiver socket:", receiverSocketId);
    } else {
      console.log("📵 No socket found for receiver ID:", receiverId);
    }

    // Also emit to sender for real-time update
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }

    console.log("✅ Message created successfully:", newMessage.id);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error in sendMessage:", error.message);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user.id;

    console.log("deleteMessage - Message ID:", messageId);
    console.log("deleteMessage - User ID:", userId);

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.sender_id !== userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own messages" });
    }

    const success = await ChatMessage.delete(messageId);
    if (!success) {
      return res.status(500).json({ error: "Failed to delete message" });
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const debugUsers = async (req, res) => {
  try {
    console.log("Debug users endpoint called");

    // Test database connection
    const testUsers = await User.findAll();
    console.log("Raw users from DB:", testUsers);

    res.json({
      success: true,
      count: testUsers?.length || 0,
      users: testUsers,
      currentUserId: req.user?.id,
    });
  } catch (error) {
    console.error("Debug users error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, userIds } = req.body;
    const createdBy = req.user.id; // This should come from the authenticated user

    console.log("🆕 Creating group:", { name, userIds, createdBy });

    if (!name || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        error: "Group name and user IDs are required",
        details: "Please provide a group name and at least one user ID",
      });
    }

    if (userIds.length === 0) {
      return res.status(400).json({
        error: "At least one user must be selected for the group",
      });
    }

    // Validate that the creator exists
    const creator = await User.findById(createdBy);
    if (!creator) {
      return res.status(400).json({
        error: "Group creator not found",
        details: "Your user account could not be found",
      });
    }

    console.log("✅ Group creator:", creator.full_name);

    // Validate that all user IDs exist
    const validUsers = [];
    const invalidUsers = [];

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (user) {
          validUsers.push(userId);
          console.log(`✅ Valid user: ${user.full_name} (ID: ${userId})`);
        } else {
          invalidUsers.push(userId);
          console.log(`❌ Invalid user ID: ${userId}`);
        }
      } catch (error) {
        invalidUsers.push(userId);
        console.log(`❌ Error checking user ${userId}:`, error.message);
      }
    }

    if (invalidUsers.length > 0) {
      console.warn("⚠️ Invalid user IDs:", invalidUsers);
      // Continue with valid users only
    }

    if (validUsers.length === 0) {
      return res.status(400).json({
        error: "No valid users found to add to the group",
      });
    }

    console.log("✅ Valid users for group:", validUsers);

    // Create the group
    const groupData = {
      name: name.trim(),
      participants: validUsers,
      createdBy: createdBy,
    };

    const groupId = await GroupChat.createGroup(groupData);
    console.log("✅ Group created with ID:", groupId);

    // Get full group details with participants
    const groupDetails = await GroupChat.getGroupDetails(groupId);

    if (!groupDetails) {
      throw new Error("Failed to retrieve group details after creation");
    }

    console.log("✅ Group details retrieved");

    // Notify all participants via socket
    const allParticipants = [...validUsers, createdBy];
    console.log("📢 Notifying participants:", allParticipants);

    for (const participantId of allParticipants) {
      const socketId = getReceiverSocketId(participantId);
      if (socketId) {
        io.to(socketId).emit("groupCreated", groupDetails);
        console.log(`✅ Notified user ${participantId} via socket`);
      } else {
        console.log(`📵 User ${participantId} is not connected via socket`);
      }
    }

    console.log("🎉 Group created successfully!");
    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: groupDetails,
    });
  } catch (error) {
    console.error("❌ Error in createGroup:", error.message);
    console.error("❌ Stack trace:", error.stack);

    // Provide more specific error messages
    if (error.message.includes("already in the group")) {
      return res.status(400).json({
        error: "User is already in the group",
        details: error.message,
      });
    }

    if (
      error.message.includes("duplicate") ||
      error.message.includes("Duplicate")
    ) {
      return res.status(400).json({
        error: "Group with this name may already exist",
        details: "Please choose a different group name",
      });
    }

    res.status(500).json({
      error: "Failed to create group",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("🔍 Getting groups for user:", userId);

    const groups = await GroupChat.getUserGroups(userId);
    res.status(200).json(groups);
  } catch (error) {
    console.error("❌ Error in getUserGroups:", error.message);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    console.log("📨 Getting messages for group:", groupId);

    // Check if user is in group
    const isMember = await GroupChat.isUserInGroup(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    console.log("🔍 Executing database query for messages...");
    
    // FIX: Use db.execute with proper query
    const [messages] = await db.execute(
      `SELECT 
        cm.id,
        cm.conversation_id,
        cm.sender_id,
        cm.message_type,
        cm.text,
        cm.image_url,
        cm.file_url,
        cm.file_name,
        cm.file_size,
        cm.file_type,
        cm.status,
        cm.read_by,
        cm.reply_to_message_id,
        cm.metadata,
        cm.created_at,
        cm.updated_at,
        u.first_name,
        u.last_name,
        u.profile_picture as profile_pic,
        u.role
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.conversation_id = ?
      ORDER BY cm.created_at ASC`,
      [groupId]
    );

    console.log(`✅ Found ${messages.length} messages for group ${groupId}`);
    
    if (messages.length > 0) {
      console.log("🔍 First message sample:", {
        id: messages[0].id,
        text: messages[0].text,
        sender: messages[0].first_name + ' ' + messages[0].last_name,
        created_at: messages[0].created_at
      });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error in getGroupMessages:", error.message);
    console.error("❌ Full error:", error);
    res.status(500).json({ 
      error: "Failed to fetch group messages",
      details: error.message 
    });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;
    const senderId = req.user.id;
    const file = req.file;

    console.log("📤 Sending message to group:", { groupId, senderId, text });

    // Check if user is in group
    const isMember = await GroupChat.isUserInGroup(groupId, senderId);
    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    let fileUrl = null;
    let fileName = null;
    let fileType = null;
    let fileSize = null;

    // Handle file upload (same as direct messages)
    if (file) {
      try {
        // Your existing file upload logic here
        const uploadResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "chat_files",
              resource_type: "auto",
              quality: "auto",
              fetch_format: "auto",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });

        fileUrl = uploadResponse.secure_url;
        fileName = file.originalname;
        fileSize = file.size;

        // Determine file type
        const extension = file.originalname.split(".").pop().toLowerCase();
        const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
        const documentExtensions = ["pdf", "doc", "docx", "txt"];

        if (imageExtensions.includes(extension)) fileType = "image";
        else if (documentExtensions.includes(extension)) fileType = "document";
        else fileType = "other";
      } catch (uploadError) {
        console.error("❌ File upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload file" });
      }
    }

    // Create the message
    const newMessage = await ChatMessage.create({
      conversationId: groupId,
      senderId: senderId,
      text: text || "",
      fileUrl: fileUrl,
      fileName: fileName,
      fileType: fileType,
      fileSize: fileSize,
      status: "sent",
    });

    // Update conversation last message time
    await ChatMessage.updateConversationLastMessage(groupId);

    // Get group participants to notify
    const groupDetails = await GroupChat.getGroupDetails(groupId);

    // Emit to all group participants
    for (const participant of groupDetails.participants) {
      const socketId = getReceiverSocketId(participant.id);
      if (socketId) {
        io.to(socketId).emit("newGroupMessage", {
          ...newMessage,
          groupId: groupId,
        });
      }
    }

    console.log("✅ Group message sent successfully");
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error in sendGroupMessage:", error.message);
    res.status(500).json({ error: "Failed to send group message" });
  }
};
