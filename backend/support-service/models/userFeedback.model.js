import db from "../../shared/db.js";

export const UserFeedback = {
  create: async (userId, ticketId, rating, feedbackText, respondedToBy) => {
    const [result] = await db.query(
      `INSERT INTO user_feedback (user_id, ticket_id, rating, feedback_text, responded_to_by, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, ticketId, rating, feedbackText, respondedToBy]
    );
    return result.insertId;
  },

  findAll: async () => {
    const [feedback] = await db.query(`
      SELECT 
        uf.*,
        u.username as user_username,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        st.subject as ticket_subject,
        st.ticket_number
      FROM user_feedback uf
      LEFT JOIN users u ON uf.user_id = u.id
      LEFT JOIN support_tickets st ON uf.ticket_id = st.id
      ORDER BY uf.created_at DESC
    `);
    return feedback;
  },

  findByAgent: async (agentUsername) => {
    const [feedback] = await db.query(`
      SELECT 
        uf.*,
        u.username as user_username,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        st.subject as ticket_subject,
        st.ticket_number
      FROM user_feedback uf
      LEFT JOIN users u ON uf.user_id = u.id
      LEFT JOIN support_tickets st ON uf.ticket_id = st.id
      WHERE uf.responded_to_by = ?
      ORDER BY uf.created_at DESC
    `, [agentUsername]);
    return feedback;
  },

  getAverageRating: async (agentUsername) => {
    const [result] = await db.query(`
      SELECT 
        AVG(rating) as average_rating, 
        COUNT(*) as total_feedback,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM user_feedback 
      WHERE responded_to_by = ?
    `, [agentUsername]);
    
    return {
      averageRating: parseFloat(result[0]?.average_rating) || 0,
      totalFeedback: result[0]?.total_feedback || 0,
      ratingDistribution: {
        fiveStar: result[0]?.five_star || 0,
        fourStar: result[0]?.four_star || 0,
        threeStar: result[0]?.three_star || 0,
        twoStar: result[0]?.two_star || 0,
        oneStar: result[0]?.one_star || 0
      }
    };
  },

  // Add method to get feedback by ticket
  findByTicket: async (ticketId) => {
    const [feedback] = await db.query(`
      SELECT * FROM user_feedback 
      WHERE ticket_id = ?
    `, [ticketId]);
    return feedback[0];
  }
};