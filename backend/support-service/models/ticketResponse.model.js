import db from "../../shared/db.js";

export const TicketResponse = {
  // Create response for ticket
  create: async (ticketId, responderUsername, responseText, internalNote = false) => {
    const [result] = await db.query(
      `INSERT INTO ticket_responses (ticket_id, responder_username, response_text, internal_note, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [ticketId, responderUsername, responseText, internalNote]
    );
    return result.insertId;
  },

  // Get responses for ticket
  findByTicketId: async (ticketId) => {
    const [responses] = await db.query(`
      SELECT tr.*, u.username as responder_username
      FROM ticket_responses tr
      LEFT JOIN users u ON tr.responder_username = u.username
      WHERE tr.ticket_id = ?
      ORDER BY tr.created_at ASC
    `, [ticketId]);
    return responses;
  }
};