const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Contract {
  static async create(contractData) {
    const contractUuid = uuidv4();
    
    const [result] = await db.execute(
      `INSERT INTO contracts (
        contract_uuid, transaction_id, contract_type, contract_status,
        title, description, contract_url, effective_date, expiration_date,
        terms_and_conditions, signatory_data, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contractUuid,
        contractData.transaction_id,
        contractData.contract_type,
        'draft',
        contractData.title,
        contractData.description || '',
        contractData.contract_url || null,
        contractData.effective_date || null,
        contractData.expiration_date || null,
        contractData.terms_and_conditions || '',
        JSON.stringify(contractData.signatory_data || []),
        contractData.created_by_user_id
      ]
    );
    
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT c.*, 
              t.transaction_uuid,
              t.property_id,
              t.buyer_user_id,
              t.seller_user_id
       FROM contracts c
       JOIN transactions t ON c.transaction_id = t.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, status) {
    const [result] = await db.execute(
      `UPDATE contracts 
       SET contract_status = ?, 
           updated_at = NOW()
       WHERE id = ?`,
      [status, id]
    );
    
    return result.affectedRows > 0;
  }

  static async addSignature(contractId, signatoryData) {
    const contract = await this.findById(contractId);
    if (!contract) return null;

    const signatories = JSON.parse(contract.signatory_data || '[]');
    signatories.push({
      ...signatoryData,
      signed_at: new Date().toISOString()
    });

    const [result] = await db.execute(
      `UPDATE contracts 
       SET signatory_data = ?,
           fully_signed_at = CASE 
             WHEN ? >= 2 THEN NOW() 
             ELSE fully_signed_at 
           END,
           updated_at = NOW()
       WHERE id = ?`,
      [JSON.stringify(signatories), signatories.length, contractId]
    );
    
    return result.affectedRows > 0;
  }

  static async findByTransaction(transactionId) {
    const [rows] = await db.execute(
      `SELECT * FROM contracts 
       WHERE transaction_id = ?
       ORDER BY created_at DESC`,
      [transactionId]
    );
    return rows;
  }
}

module.exports = Contract;