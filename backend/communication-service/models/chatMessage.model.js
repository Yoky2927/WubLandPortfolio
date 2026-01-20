// communication-service/models/chatMessage.model.js
import db from "../../shared/db.js";
import { User } from "./user.model.js";
import "dotenv/config";

const ChatMessage = {
  // Find or create conversation and get messages
  find: async (currentUserId, otherUserId) => {
    try {
      console.log(
        "🔍 Finding messages between:",
        currentUserId,
        "and",
        otherUserId
      );

      // First, find the conversation between these two users
      const [conversations] = await db.execute(
        `SELECT c.id 
                 FROM chat_conversations c
                 JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
                 JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
                 WHERE c.conversation_type = 'direct'
                 AND cp1.user_id = ? AND cp2.user_id = ?
                 AND cp1.is_active = TRUE AND cp2.is_active = TRUE`,
        [currentUserId, otherUserId]
      );

      if (conversations.length === 0) {
        console.log("📭 No conversation found between users");
        return []; // No conversation exists
      }

      const conversationId = conversations[0].id;
      console.log("💬 Found conversation ID:", conversationId);

      // Get messages for this conversation
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
        [conversationId]
      );

      console.log("📨 Found", messages.length, "messages");
      return messages;
    } catch (error) {
      console.error("❌ Error in ChatMessage.find:", error.message);
      throw error;
    }
  },

  // Create a new message in a conversation
  create: async (data) => {
    try {
      console.log("📝 Creating message with data:", {
        conversationId: data.conversationId,
        senderId: data.senderId,
        text: data.text,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
      });

      const messageUuid = generateUUID();

      const [result] = await db.execute(
        `INSERT INTO chat_messages 
                 (conversation_id, sender_id, message_type, text, file_url, file_name, file_size, file_type, status, message_uuid, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, // ✅ ADD placeholder for message_uuid
        [
          data.conversationId,
          data.senderId,
          data.fileUrl ? "file" : "text",
          data.text || "",
          data.fileUrl || null,
          data.fileName || null,
          data.fileSize || null,
          data.fileType || null,
          data.status || "sent",
          messageUuid,
        ]
      );

      // Get the created message with user details
      const [messages] = await db.execute(
        `SELECT 
                    cm.*,
                    u.first_name,
                    u.last_name,
                    u.profile_picture as profile_pic,
                    u.role
                 FROM chat_messages cm
                 JOIN users u ON cm.sender_id = u.id
                 WHERE cm.id = ?`,
        [result.insertId]
      );

      const newMessage = messages[0];
      console.log("✅ Message created successfully:", newMessage.id);
      return newMessage;
    } catch (error) {
      console.error("❌ Error in ChatMessage.create:", error.message);
      throw error;
    }
  },

  // Find or create conversation between two users
  findOrCreateConversation: async (user1Id, user2Id, createdBy) => {
    try {
      console.log(
        "🔍 Finding or creating conversation between:",
        user1Id,
        "and",
        user2Id
      );

      // Try to find existing conversation
      const [conversations] = await db.execute(
        `SELECT c.id 
         FROM chat_conversations c
         JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
         JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
         WHERE c.conversation_type = 'direct'
         AND cp1.user_id = ? AND cp2.user_id = ?
         AND cp1.is_active = TRUE AND cp2.is_active = TRUE`,
        [user1Id, user2Id]
      );

      if (conversations.length > 0) {
        console.log("💬 Found existing conversation:", conversations[0].id);
        return conversations[0].id;
      }

      // Create new conversation
      console.log("🆕 Creating new conversation");
      const conversationUuid = generateUUID();
      const [conversationResult] = await db.execute(
        `INSERT INTO chat_conversations (conversation_uuid, conversation_type, created_by, created_at) 
         VALUES (?, 'direct', ?, NOW())`,
        [conversationUuid, createdBy]
      );

      const conversationId = conversationResult.insertId;

      // Add both users as participants
      await db.execute(
        `INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) 
         VALUES (?, ?, 'member', NOW(), TRUE)`,
        [conversationId, user1Id]
      );

      await db.execute(
        `INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) 
         VALUES (?, ?, 'member', NOW(), TRUE)`,
        [conversationId, user2Id]
      );

      console.log("✅ Created new conversation:", conversationId);
      return conversationId;
    } catch (error) {
      console.error("❌ Error in findOrCreateConversation:", error.message);
      throw error;
    }
  },

  getConversationParticipants: async (conversationId) => {
    try {
      const [participants] = await db.execute(
        `SELECT cp.user_id as id,
                CONCAT(u.first_name, ' ', u.last_name) as full_name,
                u.email,
                u.profile_picture as profile_pic,
                u.role,
                cp.role as participant_role
         FROM conversation_participants cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.conversation_id = ? AND cp.is_active = TRUE`,
        [conversationId]
      );
      return participants;
    } catch (error) {
      console.error("Error getting conversation participants:", error);
      throw error;
    }
  },

  // Update conversation last message time
  updateConversationLastMessage: async (conversationId) => {
    try {
      await db.execute(
        `UPDATE chat_conversations 
                 SET last_message_at = NOW(), updated_at = NOW() 
                 WHERE id = ?`,
        [conversationId]
      );
    } catch (error) {
      console.error(
        "❌ Error updating conversation last message:",
        error.message
      );
      throw error;
    }
  },

  findById: async (id) => {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM chat_messages WHERE id = ?",
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error("Error finding message by ID:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const [result] = await db.execute(
        "DELETE FROM chat_messages WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  },

  getTodayMessageCount: async (userId, date) => {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count 
             FROM chat_messages cm
             JOIN chat_conversations cc ON cm.conversation_id = cc.id
             JOIN conversation_participants cp ON cc.id = cp.conversation_id
             WHERE cp.user_id = ? AND DATE(cm.created_at) = ? AND cp.is_active = TRUE`,
      [userId, date]
    );
    return rows[0].count;
  },

  updateStatus: async (messageId, status) => {
    const [result] = await db.execute(
      "UPDATE chat_messages SET status = ? WHERE id = ?",
      [status, messageId]
    );
    return result.affectedRows > 0;
  },
};

// Helper function to generate UUID
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Group-related methods
const GroupChat = {
  // Create a new group
  createGroup: async (groupData) => {
    try {
      console.log("🆕 Creating group in database:", groupData.name);

      const conversationUuid = generateUUID();
      const [conversationResult] = await db.execute(
        `INSERT INTO chat_conversations 
             (conversation_uuid, title, conversation_type, created_by, created_at) 
             VALUES (?, ?, 'group', ?, NOW())`,
        [conversationUuid, groupData.name, groupData.createdBy]
      );

      const conversationId = conversationResult.insertId;
      console.log("✅ Conversation created with ID:", conversationId);

      // Add all participants including the creator
      const allParticipants = [
        ...new Set([...groupData.participants, groupData.createdBy]),
      ];
      console.log("👥 Adding participants:", allParticipants);

      for (const participantId of allParticipants) {
        const role = participantId === groupData.createdBy ? "admin" : "member";
        console.log(`➡️ Adding user ${participantId} as ${role}`);

        await db.execute(
          `INSERT INTO conversation_participants 
                 (conversation_id, user_id, role, joined_at, is_active) 
                 VALUES (?, ?, ?, NOW(), TRUE)`,
          [conversationId, participantId, role]
        );
      }

      // Create a welcome system message
      await db.execute(
        `INSERT INTO chat_messages 
             (conversation_id, sender_id, message_type, text, status, created_at) 
             VALUES (?, ?, 'system', ?, 'sent', NOW())`,
        [
          conversationId,
          groupData.createdBy,
          `Group "${groupData.name}" was created`,
        ]
      );

      console.log("✅ Group setup completed for ID:", conversationId);
      return conversationId;
    } catch (error) {
      console.error(
        "❌ Error in createGroup database operation:",
        error.message
      );
      console.error("❌ SQL Error:", error.sql);
      throw error;
    }
  },

  // Get all groups for a user
  getUserGroups: async (userId) => {
    try {
      console.log("🔍 Getting groups for user:", userId);

      const [groups] = await db.execute(
        `SELECT 
                cc.id,
                cc.conversation_uuid,
                cc.title as name,
                cc.conversation_type,
                cc.created_by,
                cc.created_at,
                cc.last_message_at,
                COUNT(DISTINCT cp.user_id) as participant_count
             FROM chat_conversations cc
             JOIN conversation_participants cp ON cc.id = cp.conversation_id
             WHERE cp.user_id = ? 
             AND cp.is_active = TRUE
             AND cc.conversation_type = 'group'
             GROUP BY cc.id
             ORDER BY cc.last_message_at DESC, cc.created_at DESC`,
        [userId]
      );

      console.log("✅ Found", groups.length, "groups for user");
      return groups;
    } catch (error) {
      console.error("❌ Error in getUserGroups:", error.message);
      throw error;
    }
  },

  // Get group details with participants
  getGroupDetails: async (groupId) => {
    try {
      const [group] = await db.execute(
        `SELECT 
                    cc.*,
                    COUNT(DISTINCT cp.user_id) as participant_count
                 FROM chat_conversations cc
                 LEFT JOIN conversation_participants cp ON cc.id = cp.conversation_id AND cp.is_active = TRUE
                 WHERE cc.id = ?
                 GROUP BY cc.id`,
        [groupId]
      );

      if (group.length === 0) return null;

      const [participants] = await db.execute(
        `SELECT 
                    cp.user_id as id,
                    CONCAT(u.first_name, ' ', u.last_name) as full_name,
                    u.email,
                    u.profile_picture as profile_pic,
                    u.role,
                    cp.role as participant_role
                 FROM conversation_participants cp
                 JOIN users u ON cp.user_id = u.id
                 WHERE cp.conversation_id = ? AND cp.is_active = TRUE`,
        [groupId]
      );

      return {
        ...group[0],
        participants: participants,
      };
    } catch (error) {
      console.error("❌ Error in getGroupDetails:", error.message);
      throw error;
    }
  },

  // Add user to group
  addUserToGroup: async (groupId, userId, addedBy) => {
    try {
      // Check if user is already in group
      const [existing] = await db.execute(
        `SELECT id FROM conversation_participants 
                 WHERE conversation_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, userId]
      );

      if (existing.length > 0) {
        throw new Error("User is already in the group");
      }

      await db.execute(
        `INSERT INTO conversation_participants 
                 (conversation_id, user_id, role, joined_at, is_active) 
                 VALUES (?, ?, 'member', NOW(), TRUE)`,
        [groupId, userId]
      );

      // Create system message
      const addedUser = await User.findById(userId);
      await ChatMessage.create({
        conversationId: groupId,
        senderId: addedBy,
        text: `${addedUser.full_name} was added to the group`,
        messageType: "system",
      });

      return true;
    } catch (error) {
      console.error("❌ Error in addUserToGroup:", error.message);
      throw error;
    }
  },


  // Remove user from group
  removeUserFromGroup: async (groupId, userId, removedBy) => {
    try {
      await db.execute(
        `UPDATE conversation_participants 
                 SET is_active = FALSE, left_at = NOW() 
                 WHERE conversation_id = ? AND user_id = ?`,
        [groupId, userId]
      );

      // Create system message
      const removedUser = await User.findById(userId);
      await ChatMessage.create({
        conversationId: groupId,
        senderId: removedBy,
        text: `${removedUser.full_name} was removed from the group`,
        messageType: "system",
      });

      return true;
    } catch (error) {
      console.error("❌ Error in removeUserFromGroup:", error.message);
      throw error;
    }
  },


  // Check if user is in group
  isUserInGroup: async (groupId, userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT id FROM conversation_participants 
                 WHERE conversation_id = ? AND user_id = ? AND is_active = TRUE`,
        [groupId, userId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error("❌ Error in isUserInGroup:", error.message);
      throw error;
    }
  },
};

export { ChatMessage, GroupChat };