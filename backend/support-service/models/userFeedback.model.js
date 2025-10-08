import db from "../../shared/db.js";

export const UserFeedback = {
  // Create feedback
  create: async (userId, ticketId, rating, feedbackText, respondedToBy) => {
    const [result] = await db.query(
      `INSERT INTO user_feedback (user_id, ticket_id, rating, feedback_text, responded_to_by, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, ticketId, rating, feedbackText, respondedToBy]
    );
    return result.insertId;
  },

  // Get all feedback
  findAll: async () => {
    const [feedback] = await db.query(`
      SELECT 
        uf.*,
        u.username as user_username,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        st.subject as ticket_subject
      FROM user_feedback uf
      LEFT JOIN users u ON uf.user_id = u.id
      LEFT JOIN support_tickets st ON uf.ticket_id = st.id
      ORDER BY uf.created_at DESC
    `);
    return feedback;
  },

  // Get feedback by support agent
  findByAgent: async (agentUsername) => {
    const [feedback] = await db.query(`
      SELECT 
        uf.*,
        u.username as user_username,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        st.subject as ticket_subject
      FROM user_feedback uf
      LEFT JOIN users u ON uf.user_id = u.id
      LEFT JOIN support_tickets st ON uf.ticket_id = st.id
      WHERE uf.responded_to_by = ?
      ORDER BY uf.created_at DESC
    `, [agentUsername]);
    return feedback;
  },

  // Calculate average rating for agent
  getAverageRating: async (agentUsername) => {
    const [result] = await db.query(`
      SELECT AVG(rating) as average_rating, COUNT(*) as total_feedback
      FROM user_feedback 
      WHERE responded_to_by = ?
    `, [agentUsername]);
    
    return {
      averageRating: result[0]?.average_rating || 0,
      totalFeedback: result[0]?.total_feedback || 0
    };
  }
};