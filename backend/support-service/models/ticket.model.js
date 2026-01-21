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
        u.profile_picture as user_profile_picture,
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

    // Get responses for each ticket - FIXED
    const ticketsWithResponses = await Promise.all(
      tickets.map(async (ticket) => {
        const [responses] = await db.query(`
          SELECT tr.*, u.username as responder_username, u.profile_picture as responder_profile_picture
          FROM ticket_responses tr
          LEFT JOIN users u ON tr.responder_id = u.id
          WHERE tr.ticket_id = ?
          ORDER BY tr.created_at ASC
        `, [ticket.id]);

        return {
          ...ticket,
          responses: responses || []
        };
      })
    );

    return ticketsWithResponses;
  },

  // Updated findById function:
  findById: async (id) => {
    const [tickets] = await db.query(`
      SELECT 
        st.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        u.username as user_username,
        u.profile_picture as user_profile_picture
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      WHERE st.id = ?
    `, [id]);

    if (tickets.length === 0) return null;

    const ticket = tickets[0];

    // Get responses for this ticket - FIXED
    const [responses] = await db.query(`
      SELECT tr.*, u.username as responder_username, u.profile_picture as responder_profile_picture
      FROM ticket_responses tr
      LEFT JOIN users u ON tr.responder_id = u.id
      WHERE tr.ticket_id = ?
      ORDER BY tr.created_at ASC
    `, [id]);

    ticket.responses = responses;
    return ticket;
  },

  // Create new ticket (for users creating tickets)
  create: async (userId, subject, description, category, priority = 'medium') => {
    // Generate ticket number
    const ticketNumber = `TICKET-${Date.now().toString().slice(-6)}`;

    const [result] = await db.query(
      `INSERT INTO support_tickets (ticket_number, user_id, subject, description, category, priority, status, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'open', 'web', NOW(), NOW())`,
      [ticketNumber, userId, subject, description, category, priority]
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

  // Get tickets by user ID
  findByUserId: async (userId) => {
    const [tickets] = await db.query(`
      SELECT st.*, COUNT(tr.id) as response_count
      FROM support_tickets st
      LEFT JOIN ticket_responses tr ON st.id = tr.ticket_id
      WHERE st.user_id = ?
      GROUP BY st.id
      ORDER BY st.created_at DESC
    `, [userId]);
    return tickets;
  },

  // Get tickets by status
  findByStatus: async (status) => {
    const [tickets] = await db.query(`
      SELECT st.*, 
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      WHERE st.status = ?
      ORDER BY 
        CASE st.priority 
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        st.created_at DESC
    `, [status]);
    return tickets;
  }
};