const db = require('../config/database');

class Offer {
  static async create(offerData) {
    const [result] = await db.execute(
      `INSERT INTO offers (
        offer_type, offer_status, property_id, transaction_id,
        offered_price, offered_deposit, offer_terms, expiration_date,
        offered_by_user_id, owner_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        offerData.offer_type,
        'pending',
        offerData.property_id,
        offerData.transaction_id || null,
        offerData.offered_price,
        offerData.offered_deposit || 0,
        offerData.offer_terms || '',
        offerData.expiration_date || null,
        offerData.offered_by_user_id,
        offerData.owner_user_id
      ]
    );
    
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT * FROM offers WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, status, responseNotes = null) {
    const [result] = await db.execute(
      `UPDATE offers 
       SET offer_status = ?, 
           response_notes = ?,
           responded_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [status, responseNotes, id]
    );
    
    return result.affectedRows > 0;
  }

  static async findByProperty(propertyId) {
    const [rows] = await db.execute(
      `SELECT o.*, 
              u1.first_name as buyer_first_name,
              u1.last_name as buyer_last_name,
              u2.first_name as seller_first_name,
              u2.last_name as seller_last_name
       FROM offers o
       LEFT JOIN users u1 ON o.offered_by_user_id = u1.id
       LEFT JOIN users u2 ON o.owner_user_id = u2.id
       WHERE o.property_id = ?
       ORDER BY o.created_at DESC`,
      [propertyId]
    );
    return rows;
  }

  static async findByUser(userId, type = 'offered') {
    const column = type === 'offered' ? 'offered_by_user_id' : 'owner_user_id';
    const [rows] = await db.execute(
      `SELECT o.*, 
              p.title as property_title,
              p.property_type,
              p.listing_type
       FROM offers o
       JOIN properties p ON o.property_id = p.id
       WHERE o.${column} = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return rows;
  }
}

module.exports = Offer;