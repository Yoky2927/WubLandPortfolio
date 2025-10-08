import { Ticket} from '../models/ticket.model.js';
import { TicketResponse } from '../models/ticketResponse.model.js';
import { SupportActivity } from '../models/supportActivity.model.js';
import axios from 'axios';

export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll();
    
    // Fetch user details from user service for each ticket
    const ticketsWithUserDetails = await Promise.all(
      tickets.map(async (ticket) => {
        try {
          const userResponse = await req.services.makeAuthenticatedRequest(
            `${req.services.userService}/api/users/${ticket.user_id}`
          );
          return {
            ...ticket,
            user_first_name: userResponse.first_name,
            user_last_name: userResponse.last_name,
            user_email: userResponse.email,
            user_username: userResponse.username
          };
        } catch (error) {
          return ticket; // Return ticket without user details if fetch fails
        }
      })
    );
    
    res.json(ticketsWithUserDetails);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Fetch user details
    try {
      const userResponse = await req.services.makeAuthenticatedRequest(
        `${req.services.userService}/api/users/${ticket.user_id}`
      );
      ticket.user_first_name = userResponse.first_name;
      ticket.user_last_name = userResponse.last_name;
      ticket.user_email = userResponse.email;
      ticket.user_username = userResponse.username;
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
};

export const respondToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, status, priority, responder_username } = req.body;

    if (!response || !responder_username) {
      return res.status(400).json({ error: 'Response text and responder username are required' });
    }

    // Create response
    await TicketResponse.create(id, responder_username, response, false);

    // Update ticket status if provided
    if (status) {
      await Ticket.updateStatus(id, status);
    }

    // Update priority if provided
    if (priority) {
      await Ticket.updatePriority(id, priority);
    }

    // Log activity
    await SupportActivity.create(
      responder_username,
      'response_sent',
      id,
      'ticket',
      `Responded to ticket #${id}`
    );

    // Send notification to user via communication service
    try {
      const ticket = await Ticket.findById(id);
      await axios.post(
        `${req.services.communicationService}/api/notifications/send`,
        {
          user_id: ticket.user_id,
          title: 'Ticket Update',
          message: `Support agent ${responder_username} has responded to your ticket`,
          type: 'ticket_update'
        },
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    // Emit real-time update
    req.io.emit('ticket_updated', { ticketId: id, status, priority });

    res.json({ success: true, message: 'Response sent successfully' });
  } catch (error) {
    console.error('Error responding to ticket:', error);
    res.status(500).json({ error: 'Failed to send response' });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const success = await Ticket.updateStatus(id, status);
    
    if (!success) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Log activity
    await SupportActivity.create(
      req.user.username,
      'ticket_updated',
      id,
      'ticket',
      `Updated ticket #${id} status to ${status}`
    );

    // Emit real-time update
    req.io.emit('ticket_status_updated', { ticketId: id, status });

    res.json({ success: true, message: 'Ticket status updated successfully' });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
};

// Support lead only - assign ticket to agent
export const assignTicketToAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({ error: 'Assigned_to is required' });
    }

    // Verify the assigned user is a support agent
    try {
      const userResponse = await req.services.makeAuthenticatedRequest(
        `${req.services.userService}/api/users/username/${assigned_to}`
      );
      
      if (!['support_agent', 'support_lead', 'support_admin'].includes(userResponse.role)) {
        return res.status(400).json({ error: 'Can only assign tickets to support staff' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid support agent username' });
    }

    const success = await Ticket.assignToAgent(id, assigned_to);
    
    if (!success) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Log activity
    await SupportActivity.create(
      req.user.username,
      'ticket_assigned',
      id,
      'ticket',
      `Assigned ticket #${id} to ${assigned_to}`
    );

    res.json({ success: true, message: 'Ticket assigned successfully' });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({ error: 'Failed to assign ticket' });
  }
};