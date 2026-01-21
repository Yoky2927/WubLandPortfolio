import { Ticket } from '../models/ticket.model.js';
import { TicketResponse } from '../models/ticketResponse.model.js';
import { SupportActivity } from '../models/supportActivity.model.js';
import axios from 'axios';

export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll();
    res.json(tickets);
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

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
};

export const respondToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, status, priority } = req.body;

    if (!response) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    // Get the authenticated user's info
    const responderId = req.user.id;
    const responderUsername = req.user.username;

    if (!responderId) {
      return res.status(400).json({ error: 'User authentication information missing' });
    }

    // Create response - NOW PASSING responderId
    await TicketResponse.create(id, responderId, response, false);

    // Rest of the controller remains the same...
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
      responderUsername,
      'ticket_response',
      id,
      'ticket',
      `Responded to ticket #${id}`
    );

    // Get updated ticket with responses
    const updatedTicket = await Ticket.findById(id);

    // Send notification to user via communication service
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5000';

      // Get user details for notification
      const userResponse = await axios.get(
        `${userServiceUrl}/api/users/${updatedTicket.user_id}`,
        { headers: { Authorization: req.headers.authorization } }
      );

      // Send notification
      if (userResponse.data) {
        const notificationPayload = {
          user_id: updatedTicket.user_id,
          title: 'Ticket Update',
          message: `Support agent ${responderUsername} has responded to your ticket: "${updatedTicket.subject}"`,
          notification_type: 'ticket_update',
          action_url: `/support/tickets/${id}`,
          related_entity_type: 'ticket',
          related_entity_id: id
        };

        await axios.post(
          `${process.env.COMMUNICATION_SERVICE_URL}/api/notifications`,
          notificationPayload,
          { headers: { Authorization: req.headers.authorization } }
        );
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't fail the response if notification fails
    }

    // Emit real-time update
    req.io.emit('ticket_updated', { ticketId: id, status, priority });

    res.json({
      success: true,
      message: 'Response sent successfully',
      ticket: updatedTicket
    });
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
      'ticket_status_updated',
      id,
      'ticket',
      `Updated ticket #${id} status to ${status}`
    );

    // Emit real-time update
    req.io.emit('ticket_status_updated', { ticketId: id, status });

    res.json({
      success: true,
      message: 'Ticket status updated successfully'
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
};

// New endpoint for users to create tickets
export const createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority = 'medium' } = req.body;
    const userId = req.user.id;

    if (!subject || !description || !category) {
      return res.status(400).json({
        error: 'Subject, description, and category are required'
      });
    }

    const ticketId = await Ticket.create(userId, subject, description, category, priority);

    // Log activity
    await SupportActivity.create(
      req.user.username,
      'ticket_created',
      ticketId,
      'ticket',
      `Created new ticket: ${subject}`
    );

    // Emit real-time update for support agents
    req.io.emit('new_ticket', {
      ticketId,
      subject,
      priority,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticketId,
      ticketNumber: `TICKET-${Date.now().toString().slice(-6)}`
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

export const assignTicketToAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({ error: 'Assigned_to is required' });
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

    // Emit real-time update
    req.io.emit('ticket_assigned', { ticketId: id, assigned_to });

    res.json({
      success: true,
      message: 'Ticket assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({ error: 'Failed to assign ticket' });
  }
};

// New endpoint for users to get their own tickets
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const tickets = await Ticket.findByUserId(userId);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }


};