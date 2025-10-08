import { FlaggedContent } from '../models/flaggedContent.model.js';
import { SupportActivity } from '../models/supportActivity.model.js';
import axios from 'axios';

export const getAllFlaggedContent = async (req, res) => {
  try {
    const flags = await FlaggedContent.findAll();
    res.json(flags);
  } catch (error) {
    console.error('Error fetching flagged content:', error);
    res.status(500).json({ error: 'Failed to fetch flagged content' });
  }
};

export const getFlagById = async (req, res) => {
  try {
    const { id } = req.params;
    const flag = await FlaggedContent.findById(id);
    
    if (!flag) {
      return res.status(404).json({ error: 'Flagged content not found' });
    }
    
    res.json(flag);
  } catch (error) {
    console.error('Error fetching flagged content:', error);
    res.status(500).json({ error: 'Failed to fetch flagged content' });
  }
};

export const resolveFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, admin_message, resolved_by } = req.body;

    if (!action || !resolved_by) {
      return res.status(400).json({ error: 'Action and resolved_by are required' });
    }

    const success = await FlaggedContent.resolve(id, action, resolved_by, admin_message);
    
    if (!success) {
      return res.status(404).json({ error: 'Flagged content not found' });
    }

    // Log activity
    await SupportActivity.create(
      resolved_by,
      'flag_resolved',
      id,
      'flag',
      `Resolved flagged content #${id} with action: ${action}`
    );

    // Send automated message to admin for serious actions
    if (action === 'suspend_user' || action === 'warn_user') {
      await sendAdminActionNotification(id, resolved_by, action, admin_message);
    }

    res.json({ success: true, message: 'Flagged content resolved successfully' });
  } catch (error) {
    console.error('Error resolving flagged content:', error);
    res.status(500).json({ error: 'Failed to resolve flagged content' });
  }
};

// Automated admin notification for user actions
const sendAdminActionNotification = async (flagId, agentUsername, action, adminMessage) => {
  try {
    const token = req.headers.authorization;
    const flag = await FlaggedContent.findById(flagId);
    
    if (!flag) return;

    const actionText = action === 'suspend_user' ? 'suspended user' : 'sent warning to user';
    
    const message = `🔒 Support Agent ${agentUsername} has ${actionText} based on flagged content #${flagId}.
    
Flag Details:
- Type: ${flag.content_type}
- Reason: ${flag.reason}
- Severity: ${flag.severity}
- Agent Notes: ${adminMessage || 'No additional notes provided'}

Action taken: ${action}`;

    // Send message to admin via communication service
    await axios.post(
      `${process.env.COMMUNICATION_SERVICE_URL}/messages/send/admin`,
      { text: message },
      { headers: { Authorization: token } }
    );

  } catch (error) {
    console.error('Error sending admin action notification:', error);
  }
};

export const assignFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({ error: 'Assigned_to is required' });
    }

    const success = await FlaggedContent.assignToAgent(id, assigned_to);
    
    if (!success) {
      return res.status(404).json({ error: 'Flagged content not found' });
    }

    res.json({ success: true, message: 'Flagged content assigned successfully' });
  } catch (error) {
    console.error('Error assigning flagged content:', error);
    res.status(500).json({ error: 'Failed to assign flagged content' });
  }
};