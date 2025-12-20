// backend/property-requests-service/models/propertyRequest.model.js
import pool from '../config/database.js';

class PropertyRequestModel {
  async create(requestData) {
    const {
      user_id,
      user_type,
      property_type,
      location,
      price,
      description,
      verification_method,
      image_url,
      status = 'pending'
    } = requestData;

    const query = `
      INSERT INTO property_requests (
        user_id, user_type, property_type, location, price, 
        description, verification_method, image_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      user_id, user_type, property_type, location, price,
      description, verification_method, image_url, status
    ]);

    return this.findById(result.insertId);
  }

  async findById(id) {
    const query = `
      SELECT pr.*, 
        u.first_name, u.last_name, u.email, u.phone_number,
        u.profile_picture
      FROM property_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.id = ?
    `;
    const [requests] = await pool.execute(query, [id]);
    return requests[0];
  }

  async findByBrokerId(brokerId) {
    const query = `
      SELECT pr.*, 
        u.first_name, u.last_name, u.email, u.phone_number,
        u.profile_picture,
        b.user_id as broker_user_id
      FROM property_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN broker_assignments ba ON pr.id = ba.request_id
      LEFT JOIN brokers b ON ba.broker_id = b.id
      WHERE b.user_id = ? AND pr.status = 'pending'
      ORDER BY pr.created_at DESC
    `;
    const [requests] = await pool.execute(query, [brokerId]);
    return requests;
  }
}

export default new PropertyRequestModel();