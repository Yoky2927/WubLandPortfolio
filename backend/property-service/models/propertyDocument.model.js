// backend/property-service/models/propertyDocument.model.js
import db from "../config/database.js";

class PropertyDocumentModel {
  // Create a new document
  async create(documentData) {
    try {
      const [result] = await db.execute(
        `INSERT INTO property_documents 
        (property_id, document_type, title, description, document_url, 
         file_name, file_size, mime_type, is_public, expiration_date,
         uploaded_by_user_id, verification_status, verification_feedback,
         verified_by_user_id, verified_at, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          documentData.property_id,
          documentData.document_type,
          documentData.title,
          documentData.description,
          documentData.document_url,
          documentData.file_name,
          documentData.file_size,
          documentData.mime_type,
          documentData.is_public ? 1 : 0,
          documentData.expiration_date,
          documentData.uploaded_by_user_id,
          documentData.verification_status || 'pending',
          documentData.verification_feedback,
          documentData.verified_by_user_id,
          documentData.verified_at,
        ]
      );

      return this.findById(result.insertId);
    } catch (error) {
      console.error("Create document error:", error);
      throw error;
    }
  }

  // Find document by ID
  async findById(id) {
    try {
      const [rows] = await db.execute(
        `SELECT pd.*, 
                u.first_name as uploaded_by_first_name,
                u.last_name as uploaded_by_last_name,
                vu.first_name as verified_by_first_name,
                vu.last_name as verified_by_last_name
         FROM property_documents pd
         LEFT JOIN users u ON pd.uploaded_by_user_id = u.id
         LEFT JOIN users vu ON pd.verified_by_user_id = vu.id
         WHERE pd.id = ? AND pd.deleted_at IS NULL`,
        [id]
      );

      return rows[0] || null;
    } catch (error) {
      console.error("Find document by ID error:", error);
      throw error;
    }
  }

  // Find documents by property ID with filters
  async findByPropertyId(propertyId, filters = {}) {
    try {
      let query = `
        SELECT pd.*, 
               u.first_name as uploaded_by_first_name,
               u.last_name as uploaded_by_last_name
        FROM property_documents pd
        LEFT JOIN users u ON pd.uploaded_by_user_id = u.id
        WHERE pd.property_id = ? AND pd.deleted_at IS NULL
      `;
      
      const params = [propertyId];
      let paramIndex = 1;

      // Apply filters
      if (filters.document_type) {
        if (Array.isArray(filters.document_type)) {
          query += ` AND pd.document_type IN (${filters.document_type.map(() => '?').join(',')})`;
          params.push(...filters.document_type);
          paramIndex += filters.document_type.length;
        } else {
          query += ` AND pd.document_type = ?`;
          params.push(filters.document_type);
          paramIndex++;
        }
      }

      if (filters.status) {
        query += ` AND pd.verification_status = ?`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.is_public !== undefined) {
        query += ` AND pd.is_public = ?`;
        params.push(filters.is_public ? 1 : 0);
        paramIndex++;
      }

      if (filters.include_expired !== true) {
        query += ` AND (pd.expiration_date IS NULL OR pd.expiration_date >= CURDATE())`;
      }

      query += ` ORDER BY pd.created_at DESC`;

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      console.error("Find documents by property ID error:", error);
      throw error;
    }
  }

  // Find pending documents for a broker
  async findPendingByBrokerId(brokerId) {
    try {
      const [rows] = await db.execute(
        `SELECT pd.*, 
                p.title as property_title,
                p.address as property_address,
                p.city as property_city,
                u.first_name as uploaded_by_first_name,
                u.last_name as uploaded_by_last_name
         FROM property_documents pd
         JOIN properties p ON pd.property_id = p.id
         LEFT JOIN users u ON pd.uploaded_by_user_id = u.id
         WHERE p.assigned_broker_id = ? 
           AND pd.verification_status = 'pending'
           AND pd.deleted_at IS NULL
         ORDER BY pd.created_at DESC`,
        [brokerId]
      );

      return rows;
    } catch (error) {
      console.error("Find pending documents error:", error);
      throw error;
    }
  }

  // Update document verification
  async updateVerification(id, verificationData) {
    try {
      const updateFields = [];
      const updateValues = [];

      if (verificationData.verification_status !== undefined) {
        updateFields.push("verification_status = ?");
        updateValues.push(verificationData.verification_status);
      }

      if (verificationData.verified_by_user_id !== undefined) {
        updateFields.push("verified_by_user_id = ?");
        updateValues.push(verificationData.verified_by_user_id);
      }

      if (verificationData.verification_feedback !== undefined) {
        updateFields.push("verification_feedback = ?");
        updateValues.push(verificationData.verification_feedback);
      }

      if (verificationData.verified_at !== undefined) {
        updateFields.push("verified_at = ?");
        updateValues.push(verificationData.verified_at);
      }

      updateFields.push("updated_at = NOW()");
      updateValues.push(id);

      await db.execute(
        `UPDATE property_documents SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );

      return this.findById(id);
    } catch (error) {
      console.error("Update verification error:", error);
      throw error;
    }
  }

  // Update document
  async update(id, updates) {
    try {
      const updateFields = [];
      const updateValues = [];

      // Build dynamic update query
      const allowedFields = [
        'title', 'description', 'document_type', 'is_public', 
        'expiration_date', 'file_name', 'file_size', 'mime_type'
      ];

      for (const [field, value] of Object.entries(updates)) {
        if (allowedFields.includes(field)) {
          updateFields.push(`${field} = ?`);
          updateValues.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error("No valid fields to update");
      }

      updateFields.push("updated_at = NOW()");
      updateValues.push(id);

      await db.execute(
        `UPDATE property_documents SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );

      return this.findById(id);
    } catch (error) {
      console.error("Update document error:", error);
      throw error;
    }
  }

  // Soft delete document
  async delete(id) {
    try {
      const [result] = await db.execute(
        `UPDATE property_documents SET deleted_at = NOW() WHERE id = ?`,
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Delete document error:", error);
      throw error;
    }
  }

  // Get document statistics for a property
  async getDocumentStats(propertyId) {
    try {
      const [rows] = await db.execute(
        `SELECT 
          COUNT(*) as total_documents,
          SUM(CASE WHEN verification_status = 'approved' THEN 1 ELSE 0 END) as approved_documents,
          SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending_documents,
          SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected_documents,
          SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_documents,
          SUM(CASE WHEN expiration_date < CURDATE() THEN 1 ELSE 0 END) as expired_documents
         FROM property_documents 
         WHERE property_id = ? AND deleted_at IS NULL`,
        [propertyId]
      );

      return rows[0] || null;
    } catch (error) {
      console.error("Get document stats error:", error);
      throw error;
    }
  }
}

export default new PropertyDocumentModel();