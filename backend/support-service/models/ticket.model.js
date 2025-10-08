import db from "../../shared/db.js";

export const Ticket = {
  // Get all tickets with user information
  findAll: async () => {
    const [tickets] = await db.query(`
      SELECT 
        st.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        u.username as user_username,
        COUNT(tr.id) as response_count
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      LEFT JOIN ticket_responses tr ON st.id = tr.ticket_id
      GROUP BY st.id
      ORDER BY 
        CASE st.priority 
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        st.created_at DESC
    `);
    return tickets;
  },

  // Find ticket by ID with responses
  findById: async (id) => {
    const [tickets] = await db.query(`
      SELECT 
        st.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        u.username as user_username
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      WHERE st.id = ?
    `, [id]);

    if (tickets.length === 0) return null;

    const ticket = tickets[0];
    
    // Get responses for this ticket
    const [responses] = await db.query(`
      SELECT tr.*, u.username as responder_username
      FROM ticket_responses tr
      LEFT JOIN users u ON tr.responder_username = u.username
      WHERE tr.ticket_id = ?
      ORDER BY tr.created_at ASC
    `, [id]);

    ticket.responses = responses;
    return ticket;
  },

  // Create new ticket
  create: async (userId, subject, description, category, priority = 'medium') => {
    const [result] = await db.query(
      `INSERT INTO support_tickets (user_id, subject, description, category, priority, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'open', NOW(), NOW())`,
      [userId, subject, description, category, priority]
    );
    return result.insertId;
  },

  // Update ticket status
  updateStatus: async (id, status) => {
    const [result] = await db.query(
      `UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows > 0;
  },

  // Update ticket priority
  updatePriority: async (id, priority) => {
    const [result] = await db.query(
      `UPDATE support_tickets SET priority = ?, updated_at = NOW() WHERE id = ?`,
      [priority, id]
    );
    return result.affectedRows > 0;
  },

  // Assign ticket to support agent
  assignToAgent: async (id, agentUsername) => {
    const [result] = await db.query(
      `UPDATE support_tickets SET assigned_to = ?, updated_at = NOW() WHERE id = ?`,
      [agentUsername, id]
    );
    return result.affectedRows > 0;
  },

  // Resolve ticket
  resolve: async (id) => {
    const [result] = await db.query(
      `UPDATE support_tickets SET status = 'resolved', resolved_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
};