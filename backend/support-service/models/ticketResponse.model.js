import db from "../../shared/db.js";

export const TicketResponse = {
  // Create response for ticket - UPDATED to use responder_id
  create: async (ticketId, responderId, responseText, internalNote = false) => {
    // First check if this is the first response
    const [existingResponses] = await db.query(
      `SELECT COUNT(*) as count FROM ticket_responses WHERE ticket_id = ?`,
      [ticketId]
    );
    
    const isFirstResponse = existingResponses[0].count === 0;
    
    // Insert the response with responder_id instead of responder_username
    const [result] = await db.query(
      `INSERT INTO ticket_responses (ticket_id, responder_id, message, response_type, is_first_response, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        ticketId, 
        responderId, 
        responseText, 
        internalNote ? 'internal_note' : 'public', 
        isFirstResponse
      ]
    );
    
    // Update ticket's first_response_at if this is the first response
    if (isFirstResponse) {
      await db.query(
        `UPDATE support_tickets SET first_response_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [ticketId]
      );
    } else {
      await db.query(
        `UPDATE support_tickets SET updated_at = NOW() WHERE id = ?`,
        [ticketId]
      );
    }
    
    return result.insertId;
  },

  // Get responses for ticket - UPDATED to join on responder_id
  findByTicketId: async (ticketId) => {
    const [responses] = await db.query(`
      SELECT tr.*, u.username as responder_username, u.profile_picture as responder_profile_picture
      FROM ticket_responses tr
      LEFT JOIN users u ON tr.responder_id = u.id  -- Changed to responder_id
      WHERE tr.ticket_id = ?
      ORDER BY tr.created_at ASC
    `, [ticketId]);
    return responses;
  },

  // Mark response as read by customer
  markAsRead: async (responseId) => {
    const [result] = await db.query(
      `UPDATE ticket_responses SET read_by_customer = TRUE, read_at = NOW() WHERE id = ?`,
      [responseId]
    );
    return result.affectedRows > 0;
  },

  // Helper method to get responder username from ID (optional)
  getResponderInfo: async (responderId) => {
    const [users] = await db.query(
      `SELECT username, profile_picture FROM users WHERE id = ?`,
      [responderId]
    );
    return users[0] || null;
  }
};