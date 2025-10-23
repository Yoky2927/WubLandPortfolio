import express from 'express';
import { 
    getUsersForSidebar, 
    getMessages, 
    sendMessage, 
    deleteMessage, 
    uploadMiddleware,
    checkCloudinaryHealth,
    debugUsers,
    // Add group routes
    createGroup,
    getUserGroups,
    getGroupMessages,
    sendGroupMessage
} from '../controllers/message.controller.js';
import { GroupChat } from '../models/chatMessage.model.js'; // ADD THIS IMPORT
import db from '../../shared/db.js'; // Import the database connection

const router = express.Router();

// Existing routes
router.get('/health/cloudinary', checkCloudinaryHealth);
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', service: 'communication-service' });
});

router.get('/users', getUsersForSidebar);
router.get('/:id', getMessages);
router.post('/send/:id', uploadMiddleware, sendMessage);
router.delete('/:id', deleteMessage);
router.get('/debug/users', debugUsers);

// Group chat routes
router.post('/groups/create', createGroup);
router.get('/groups/list', getUserGroups);
router.get('/groups/:groupId/messages', getGroupMessages);
router.post('/groups/:groupId/send', uploadMiddleware, sendGroupMessage);

// Debug endpoint for group creation
router.post('/groups/debug-create', async (req, res) => {
  try {
    const { name, userIds, createdBy } = req.body;
    
    console.log("🔧 DEBUG - Group creation attempt:", { name, userIds, createdBy });
    
    // Test database connection
    const [testResult] = await db.execute('SELECT 1 as test');
    console.log("✅ Database connection test:", testResult);

    // Test users table
    const [users] = await db.execute('SELECT id, first_name, last_name FROM users LIMIT 5');
    console.log("✅ Users table test - sample users:", users);

    // Test chat_conversations table
    const [conversations] = await db.execute('SELECT COUNT(*) as count FROM chat_conversations');
    console.log("✅ Conversations table test - total conversations:", conversations[0].count);

    res.json({
      success: true,
      database: "connected",
      users_sample: users,
      conversations_count: conversations[0].count,
      received_data: { name, userIds, createdBy }
    });
  } catch (error) {
    console.error("❌ Debug endpoint error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      sql: error.sql
    });
  }
});

// Add these routes to your message.routes.js

// Get group details with participants
router.get('/groups/:groupId/details', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is in group
    const isMember = await GroupChat.isUserInGroup(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const groupDetails = await GroupChat.getGroupDetails(groupId);
    res.status(200).json(groupDetails);
  } catch (error) {
    console.error("❌ Error in getGroupDetails:", error);
    res.status(500).json({ error: "Failed to fetch group details" });
  }
});

// Add users to group
router.post('/groups/:groupId/add-users', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body;
    const addedBy = req.user.id;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: "User IDs are required" });
    }

    // Check if current user is group admin
    const groupDetails = await GroupChat.getGroupDetails(groupId);
    const currentUserRole = groupDetails.participants.find(p => p.id === addedBy)?.participant_role;
    
    if (currentUserRole !== 'admin') {
      return res.status(403).json({ error: "Only group admins can add users" });
    }

    // Add each user to the group
    for (const userId of userIds) {
      await GroupChat.addUserToGroup(groupId, userId, addedBy);
    }

    const updatedGroupDetails = await GroupChat.getGroupDetails(groupId);
    res.status(200).json({
      success: true,
      message: "Users added to group successfully",
      group: updatedGroupDetails
    });
  } catch (error) {
    console.error("❌ Error in addUsersToGroup:", error);
    res.status(500).json({ error: "Failed to add users to group" });
  }
});

// Remove user from group
router.post('/groups/:groupId/remove-user', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const removedBy = req.user.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if current user is group admin or removing themselves
    const groupDetails = await GroupChat.getGroupDetails(groupId);
    const currentUserRole = groupDetails.participants.find(p => p.id === removedBy)?.participant_role;
    
    if (currentUserRole !== 'admin' && removedBy !== userId) {
      return res.status(403).json({ error: "Only group admins can remove other users" });
    }

    await GroupChat.removeUserFromGroup(groupId, userId, removedBy);

    const updatedGroupDetails = await GroupChat.getGroupDetails(groupId);
    res.status(200).json({
      success: true,
      message: "User removed from group",
      group: updatedGroupDetails
    });
  } catch (error) {
    console.error("❌ Error in removeUserFromGroup:", error);
    res.status(500).json({ error: "Failed to remove user from group" });
  }
});

export default router;