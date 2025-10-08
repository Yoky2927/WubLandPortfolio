import db from "../../shared/db.js";

export const FAQ = {
  // Get all FAQs
  findAll: async () => {
    const [faqs] = await db.query(`
      SELECT kba.*, u.username as author_username
      FROM knowledge_base_articles kba
      LEFT JOIN users u ON kba.author_username = u.username
      WHERE kba.is_published = TRUE
      ORDER BY kba.updated_at DESC
    `);
    return faqs;
  },

  // Find FAQ by ID
  findById: async (id) => {
    const [faqs] = await db.query(`
      SELECT kba.*, u.username as author_username
      FROM knowledge_base_articles kba
      LEFT JOIN users u ON kba.author_username = u.username
      WHERE kba.id = ? AND kba.is_published = TRUE
    `, [id]);
    return faqs[0] || null;
  },

  // Create new FAQ
  create: async (title, content, category, authorUsername, videoUrl = null) => {
    const [result] = await db.query(
      `INSERT INTO knowledge_base_articles (title, content, category, author_username, video_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, content, category, authorUsername, videoUrl]
    );
    return result.insertId;
  },

  // Update FAQ
  update: async (id, title, content, category, videoUrl = null) => {
    const [result] = await db.query(
      `UPDATE knowledge_base_articles 
       SET title = ?, content = ?, category = ?, video_url = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, content, category, videoUrl, id]
    );
    return result.affectedRows > 0;
  },

  // Delete FAQ
  delete: async (id) => {
    const [result] = await db.query(
      `DELETE FROM knowledge_base_articles WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  // Increment views
  incrementViews: async (id) => {
    const [result] = await db.query(
      `UPDATE knowledge_base_articles SET views = views + 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  // Add helpful vote
  addHelpfulVote: async (id) => {
    const [result] = await db.query(
      `UPDATE knowledge_base_articles SET helpful_votes = helpful_votes + 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
};