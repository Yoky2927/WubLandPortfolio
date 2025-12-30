const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Payment {
  static async create(paymentData) {
    const paymentUuid = uuidv4();

    const [result] = await db.execute(
      `INSERT INTO payments (
        payment_uuid, payment_type, payment_status,
        invoice_id, amount, currency, processing_fee, net_amount,
        payment_method, payment_method_details,
        from_user_id, to_user_id, transaction_id,
        payment_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentUuid,
        paymentData.payment_type,
        'pending',
        paymentData.invoice_id || null,
        paymentData.amount,
        paymentData.currency || 'ETB',
        paymentData.processing_fee || 0,
        paymentData.net_amount || paymentData.amount,
        paymentData.payment_method,
        JSON.stringify(paymentData.payment_method_details || {}),
        paymentData.from_user_id,
        paymentData.to_user_id,
        paymentData.transaction_id || null,
        paymentData.payment_date || new Date(),
        paymentData.notes || ''
      ]
    );

    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT p.*, 
              i.invoice_number,
              u1.first_name as from_first_name,
              u1.last_name as from_last_name,
              u2.first_name as to_first_name,
              u2.last_name as to_last_name
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id = i.id
       LEFT JOIN users u1 ON p.from_user_id = u1.id
       LEFT JOIN users u2 ON p.to_user_id = u2.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, status, transactionId = null, receiptUrl = null) {
    const [result] = await db.execute(
      `UPDATE payments 
       SET payment_status = ?,
           transaction_id = COALESCE(?, transaction_id),
           receipt_url = COALESCE(?, receipt_url),
           processed_at = CASE 
             WHEN ? IN ('completed', 'failed') THEN NOW() 
             ELSE processed_at 
           END,
           updated_at = NOW()
       WHERE id = ?`,
      [status, transactionId, receiptUrl, status, id]
    );

    return result.affectedRows > 0;
  }

  static async findByUser(userId, type = 'from') {
    const column = type === 'from' ? 'from_user_id' : 'to_user_id';
    const [rows] = await db.execute(
      `SELECT p.*, 
              i.invoice_number
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id = i.id
       WHERE p.${column} = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async findByInvoice(invoiceId) {
    const [rows] = await db.execute(
      `SELECT * FROM payments 
       WHERE invoice_id = ?
       ORDER BY created_at DESC`,
      [invoiceId]
    );
    return rows;
  }

  static async findByTransactionRef(transactionRef) {
    const [rows] = await db.execute(
      `SELECT * FROM payments 
     WHERE transaction_id = ? OR payment_method_details LIKE ?`,
      [transactionRef, `%${transactionRef}%`]
    );
    return rows[0] || null;
  }

}

module.exports = Payment;