const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Transaction {
  static async create(transactionData) {
    const transactionUuid = uuidv4();
    
    const [result] = await db.execute(
      `INSERT INTO transactions (
        transaction_uuid, transaction_type, transaction_status,
        property_id, buyer_user_id, seller_user_id, broker_id,
        offer_price, final_price, deposit_amount,
        commission_amount, commission_rate, tax_amount, fees_amount,
        currency, terms, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionUuid,
        transactionData.transaction_type,
        'draft',
        transactionData.property_id,
        transactionData.buyer_user_id || null,
        transactionData.seller_user_id,
        transactionData.broker_id || null,
        transactionData.offer_price,
        transactionData.final_price || transactionData.offer_price,
        transactionData.deposit_amount || 0,
        transactionData.commission_amount || 0,
        transactionData.commission_rate || 2.5,
        transactionData.tax_amount || 0,
        transactionData.fees_amount || 0,
        transactionData.currency || 'ETB',
        JSON.stringify(transactionData.terms || {}),
        transactionData.created_by_user_id
      ]
    );
    
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT t.*, 
              p.title as property_title,
              p.property_type,
              p.listing_type,
              u1.first_name as buyer_first_name,
              u1.last_name as buyer_last_name,
              u2.first_name as seller_first_name,
              u2.last_name as seller_last_name,
              u3.first_name as broker_first_name,
              u3.last_name as broker_last_name
       FROM transactions t
       LEFT JOIN properties p ON t.property_id = p.id
       LEFT JOIN users u1 ON t.buyer_user_id = u1.id
       LEFT JOIN users u2 ON t.seller_user_id = u2.id
       LEFT JOIN users u3 ON t.broker_id = u3.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, status) {
    const [result] = await db.execute(
      `UPDATE transactions 
       SET transaction_status = ?, 
           status_changed_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [status, id]
    );
    
    return result.affectedRows > 0;
  }

  static async finalize(id, finalData) {
    const [result] = await db.execute(
      `UPDATE transactions 
       SET final_price = ?,
           deposit_amount = ?,
           commission_amount = ?,
           tax_amount = ?,
           fees_amount = ?,
           closing_date = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        finalData.final_price,
        finalData.deposit_amount || 0,
        finalData.commission_amount || 0,
        finalData.tax_amount || 0,
        finalData.fees_amount || 0,
        finalData.closing_date || null,
        id
      ]
    );
    
    return result.affectedRows > 0;
  }

  static async findByUser(userId, role = 'buyer') {
    const column = role === 'buyer' ? 'buyer_user_id' : 'seller_user_id';
    const [rows] = await db.execute(
      `SELECT t.*, 
              p.title as property_title,
              p.property_type
       FROM transactions t
       JOIN properties p ON t.property_id = p.id
       WHERE t.${column} = ?
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async findByProperty(propertyId) {
    const [rows] = await db.execute(
      `SELECT t.*, 
              u1.first_name as buyer_first_name,
              u1.last_name as buyer_last_name,
              u2.first_name as seller_first_name,
              u2.last_name as seller_last_name
       FROM transactions t
       LEFT JOIN users u1 ON t.buyer_user_id = u1.id
       LEFT JOIN users u2 ON t.seller_user_id = u2.id
       WHERE t.property_id = ?
       ORDER BY t.created_at DESC`,
      [propertyId]
    );
    return rows;
  }
}

module.exports = Transaction;