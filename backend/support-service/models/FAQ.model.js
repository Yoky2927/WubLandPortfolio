import db from "../../shared/db.js";

export const FAQ = {
  // Get all FAQs - UPDATED to use 'faqs' table
  findAll: async () => {
    const [faqs] = await db.query(`
      SELECT f.*, u.username as author_username
      FROM faqs f
      LEFT JOIN users u ON f.author_username COLLATE utf8mb4_unicode_ci = u.username
      WHERE f.is_published = TRUE
      ORDER BY f.updated_at DESC
    `);
    return faqs;
  },

  // Find FAQ by ID - FIXED
  findById: async (id) => {
    const [faqs] = await db.query(`
      SELECT f.*, u.username as author_username
      FROM faqs f
      LEFT JOIN users u ON f.author_username COLLATE utf8mb4_unicode_ci = u.username
      WHERE f.id = ? AND f.is_published = TRUE
    `, [id]);
    return faqs[0] || null;
  },

  // Create new FAQ - UPDATED
  create: async (title, content, category, authorUsername, videoUrl = null) => {
    const [result] = await db.query(
      `INSERT INTO faqs (title, content, category, author_username, video_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, content, category, authorUsername, videoUrl]
    );
    return result.insertId;
  },

  // Update FAQ - UPDATED
  update: async (id, title, content, category, videoUrl = null) => {
    const [result] = await db.query(
      `UPDATE faqs 
       SET title = ?, content = ?, category = ?, video_url = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, content, category, videoUrl, id]
    );
    return result.affectedRows > 0;
  },

  // Delete FAQ - UPDATED
  delete: async (id) => {
    const [result] = await db.query(
      `DELETE FROM faqs WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  // Increment views - UPDATED
  incrementViews: async (id) => {
    const [result] = await db.query(
      `UPDATE faqs SET views = views + 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  // Add helpful vote - UPDATED (note: helpful_count not helpful_votes)
  addHelpfulVote: async (id) => {
    const [result] = await db.query(
      `UPDATE faqs SET helpful_count = helpful_count + 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
};