const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Invoice {
  static generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  static async create(invoiceData) {
    const invoiceUuid = uuidv4();
    const invoiceNumber = this.generateInvoiceNumber();
    
    const [result] = await db.execute(
      `INSERT INTO invoices (
        invoice_uuid, invoice_number, invoice_type, invoice_status,
        from_user_id, to_user_id, property_id, transaction_id,
        amount, tax_amount, total_amount, currency, paid_amount, balance_due,
        invoice_date, due_date, line_items, notes, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceUuid,
        invoiceNumber,
        invoiceData.invoice_type,
        'draft',
        invoiceData.from_user_id,
        invoiceData.to_user_id,
        invoiceData.property_id || null,
        invoiceData.transaction_id || null,
        invoiceData.amount,
        invoiceData.tax_amount || 0,
        invoiceData.total_amount || invoiceData.amount,
        invoiceData.currency || 'ETB',
        0,
        invoiceData.total_amount || invoiceData.amount,
        invoiceData.invoice_date || new Date(),
        invoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        JSON.stringify(invoiceData.line_items || []),
        invoiceData.notes || '',
        invoiceData.created_by_user_id
      ]
    );
    
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT i.*, 
              u1.first_name as from_first_name,
              u1.last_name as from_last_name,
              u2.first_name as to_first_name,
              u2.last_name as to_last_name,
              p.title as property_title
       FROM invoices i
       LEFT JOIN users u1 ON i.from_user_id = u1.id
       LEFT JOIN users u2 ON i.to_user_id = u2.id
       LEFT JOIN properties p ON i.property_id = p.id
       WHERE i.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, status, paidAmount = 0) {
    const invoice = await this.findById(id);
    if (!invoice) return null;

    const newBalance = Math.max(0, invoice.balance_due - paidAmount);
    const isPaid = newBalance === 0;
    
    const [result] = await db.execute(
      `UPDATE invoices 
       SET invoice_status = ?,
           paid_amount = paid_amount + ?,
           balance_due = ?,
           paid_date = CASE 
             WHEN ? = 0 THEN NOW() 
             ELSE paid_date 
           END,
           updated_at = NOW()
       WHERE id = ?`,
      [
        isPaid ? 'paid' : status,
        paidAmount,
        newBalance,
        newBalance,
        id
      ]
    );
    
    return result.affectedRows > 0;
  }

  static async findByUser(userId, type = 'from') {
    const column = type === 'from' ? 'from_user_id' : 'to_user_id';
    const [rows] = await db.execute(
      `SELECT i.*, 
              p.title as property_title
       FROM invoices i
       LEFT JOIN properties p ON i.property_id = p.id
       WHERE i.${column} = ?
       ORDER BY i.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async findByTransaction(transactionId) {
    const [rows] = await db.execute(
      `SELECT * FROM invoices 
       WHERE transaction_id = ?
       ORDER BY created_at DESC`,
      [transactionId]
    );
    return rows;
  }
}

module.exports = Invoice;