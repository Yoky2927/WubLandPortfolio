import db from "../../shared/db.js";

export const FlaggedContent = {
  // Get all flagged content
  findAll: async () => {
    const [flags] = await db.query(`
      SELECT 
        fc.*,
        u_reporter.username as reported_by_username,
        u_assigned.username as assigned_to_username,
        u_resolved.username as resolved_by_username
      FROM flagged_content fc
      LEFT JOIN users u_reporter ON fc.reported_by_user_id = u_reporter.id
      LEFT JOIN users u_assigned ON fc.assigned_to = u_assigned.username
      LEFT JOIN users u_resolved ON fc.resolved_by = u_resolved.username
      WHERE fc.status != 'resolved'
      ORDER BY 
        CASE fc.severity 
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        fc.created_at DESC
    `);
    return flags;
  },

  // Find flagged content by ID
  findById: async (id) => {
    const [flags] = await db.query(`
      SELECT 
        fc.*,
        u_reporter.username as reported_by_username,
        u_assigned.username as assigned_to_username,
        u_resolved.username as resolved_by_username
      FROM flagged_content fc
      LEFT JOIN users u_reporter ON fc.reported_by_user_id = u_reporter.id
      LEFT JOIN users u_assigned ON fc.assigned_to = u_assigned.username
      LEFT JOIN users u_resolved ON fc.resolved_by = u_resolved.username
      WHERE fc.id = ?
    `, [id]);
    return flags[0] || null;
  },

  // Create new flagged content
  create: async (contentType, contentId, reportedByUserId, reason, severity = 'medium') => {
    const [result] = await db.query(
      `INSERT INTO flagged_content (content_type, content_id, reported_by_user_id, reason, severity, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [contentType, contentId, reportedByUserId, reason, severity]
    );
    return result.insertId;
  },

  // Resolve flagged content
  resolve: async (id, action, resolvedBy, adminMessage = null) => {
    let status = 'resolved';
    
    // Map action to status
    if (action === 'approve') status = 'approved';
    else if (action === 'reject') status = 'rejected';
    else if (action === 'suspend_user') status = 'action_taken';
    else if (action === 'warn_user') status = 'action_taken';

    const [result] = await db.query(
      `UPDATE flagged_content 
       SET status = ?, resolved_by = ?, resolved_at = NOW(), details = ?
       WHERE id = ?`,
      [status, resolvedBy, adminMessage, id]
    );
    return result.affectedRows > 0;
  },

  // Assign flagged content to agent
  assignToAgent: async (id, agentUsername) => {
    const [result] = await db.query(
      `UPDATE flagged_content SET assigned_to = ? WHERE id = ?`,
      [agentUsername, id]
    );
    return result.affectedRows > 0;
  }
};