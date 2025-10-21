import db from "../../shared/db.js";

export const SupportActivity = {
  create: async (agentUsername, activityType, targetId, targetType, details = null) => {
    const [result] = await db.query(
      `INSERT INTO support_agent_activities (agent_username, activity_type, target_id, target_type, details, timestamp)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [agentUsername, activityType, targetId, targetType, details]
    );
    return result.insertId;
  },

  findRecent: async (limit = 10) => {
    const [activities] = await db.query(`
      SELECT * FROM support_agent_activities 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [limit]);
    return activities;
  },

  findByAgent: async (agentUsername, limit = 20) => {
    const [activities] = await db.query(`
      SELECT * FROM support_agent_activities 
      WHERE agent_username = ?
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [agentUsername, limit]);
    return activities;
  },

  // Add method to get activities by target
  findByTarget: async (targetType, targetId) => {
    const [activities] = await db.query(`
      SELECT * FROM support_agent_activities 
      WHERE target_type = ? AND target_id = ?
      ORDER BY timestamp DESC
    `, [targetType, targetId]);
    return activities;
  }
};