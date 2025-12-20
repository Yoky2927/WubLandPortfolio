// models/propertyViewing.model.js
import pool from '../config/database.js';

class PropertyViewingModel {
  async create(viewingData) {
    const {
      property_id,
      user_id,
      broker_id,
      scheduled_at,
      duration_minutes = 30,
      meeting_type = 'in_person',
      notes = ''
    } = viewingData;
    
    const query = `
      INSERT INTO property_viewings (
        property_id, user_id, broker_id, scheduled_at, 
        duration_minutes, meeting_type, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `;
    
    const values = [
      property_id, user_id, broker_id, scheduled_at,
      duration_minutes, meeting_type, notes
    ];
    
    const [result] = await pool.execute(query, values);
    return this.findById(result.insertId);
  }
  
  async findById(id) {
    const query = `
      SELECT v.*, 
        p.title as property_title,
        p.address as property_address,
        u.username as user_name,
        u.email as user_email,
        b.username as broker_name
      FROM property_viewings v
      LEFT JOIN properties p ON v.property_id = p.id
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN users b ON v.broker_id = b.id
      WHERE v.id = ?
    `;
    const [viewings] = await pool.execute(query, [id]);
    return viewings[0];
  }
  
  async findByBrokerId(brokerId, filters = {}) {
    let whereClauses = ['v.broker_id = ?'];
    const values = [brokerId];
    
    if (filters.status) {
      whereClauses.push('v.status = ?');
      values.push(filters.status);
    }
    
    if (filters.start_date) {
      whereClauses.push('v.scheduled_at >= ?');
      values.push(filters.start_date);
    }
    
    if (filters.end_date) {
      whereClauses.push('v.scheduled_at <= ?');
      values.push(filters.end_date);
    }
    
    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const query = `
      SELECT v.*, 
        p.title as property_title,
        p.address as property_address,
        u.username as user_name,
        u.email as user_email
      FROM property_viewings v
      LEFT JOIN properties p ON v.property_id = p.id
      LEFT JOIN users u ON v.user_id = u.id
      ${where}
      ORDER BY v.scheduled_at ASC
    `;
    
    const [viewings] = await pool.execute(query, values);
    return viewings;
  }
  
  async updateStatus(id, status, notes = '') {
    const query = `
      UPDATE property_viewings 
      SET status = ?, notes = CONCAT(notes, ?), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await pool.execute(query, [status, notes ? `\n${new Date().toISOString()}: ${notes}` : '', id]);
    return this.findById(id);
  }
}

export default new PropertyViewingModel();