// backend/property-service/models/propertyApplication.model.js
import pool from "../config/database.js";

// Helper functions (same as property model)
function safeJsonParse(str, defaultValue = []) {
  try {
    return str ? JSON.parse(str) : defaultValue;
  } catch (error) {
    console.error("JSON parse error:", error, "String:", str);
    return defaultValue;
  }
}

function safeJsonStringify(data) {
  try {
    if (Array.isArray(data) || typeof data === "object") {
      return JSON.stringify(data);
    }
    return data;
  } catch (error) {
    console.error("JSON stringify error:", error);
    return "[]";
  }
}

class PropertyApplicationModel {
  // Create application
  async create(applicationData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { v4: uuidv4 } = await import("uuid");
      const applicationUuid = uuidv4();
      
      const query = `
        INSERT INTO property_applications 
        (application_uuid, property_id, user_id, application_type, status,
         message, offered_amount, cover_letter, submitted_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
      `;
      
      const values = [
        applicationUuid,
        applicationData.property_id,
        applicationData.user_id,
        applicationData.application_type || 'rent',
        applicationData.status || 'submitted',
        applicationData.message || '',
        applicationData.offered_amount || null,
        applicationData.cover_letter || '',
      ];
      
      const [result] = await connection.execute(query, values);
      const applicationId = result.insertId;
      
      // Update property's application stats
      await connection.execute(
        `UPDATE properties 
         SET inquiries_count = inquiries_count + 1,
             recent_applications = JSON_ARRAY_APPEND(
               COALESCE(recent_applications, '[]'),
               '$',
               ?
             )
         WHERE id = ?`,
        [applicationId, applicationData.property_id]
      );
      
      await connection.commit();
      return await this.findById(applicationId);
      
    } catch (error) {
      await connection.rollback();
      console.error("Error creating application:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Find by ID
  async findById(id) {
    const connection = await pool.getConnection();
    
    try {
      const query = `
        SELECT pa.*, 
               p.title as property_title,
               p.address as property_address,
               p.city as property_city,
               p.price as property_price,
               p.listing_type as property_listing_type,
               u.first_name as applicant_first_name,
               u.last_name as applicant_last_name,
               u.email as applicant_email,
               u.phone_number as applicant_phone,
               b.first_name as broker_first_name,
               b.last_name as broker_last_name,
               b.email as broker_email
        FROM property_applications pa
        JOIN properties p ON pa.property_id = p.id
        JOIN users u ON pa.user_id = u.id
        LEFT JOIN users b ON p.assigned_broker_id = b.id
        WHERE pa.id = ? AND pa.deleted_at IS NULL
      `;
      
      const [rows] = await connection.execute(query, [id]);
      return rows[0] || null;
      
    } catch (error) {
      console.error("Error finding application by ID:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Get user's applications
  async findByUserId(userId, filters = {}, page = 1, limit = 20) {
    const connection = await pool.getConnection();
    
    try {
      let whereClauses = ["pa.user_id = ?", "pa.deleted_at IS NULL"];
      const values = [userId];
      
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          const placeholders = filters.status.map(() => "?").join(",");
          whereClauses.push(`pa.status IN (${placeholders})`);
          values.push(...filters.status);
        } else {
          whereClauses.push("pa.status = ?");
          values.push(filters.status);
        }
      }
      
      if (filters.application_type) {
        whereClauses.push("pa.application_type = ?");
        values.push(filters.application_type);
      }
      
      const where = whereClauses.join(" AND ");
      
      // Count total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM property_applications pa
        WHERE ${where}
      `;
      const [countResult] = await connection.execute(countQuery, values);
      const total = countResult[0].total;
      
      // Get paginated results
      const offset = (page - 1) * limit;
      const query = `
        SELECT pa.*, 
               p.title as property_title,
               p.address as property_address,
               p.city as property_city,
               p.price as property_price,
               p.listing_type as property_listing_type,
               p.main_image as property_image,
               u.first_name as applicant_first_name,
               u.last_name as applicant_last_name
        FROM property_applications pa
        JOIN properties p ON pa.property_id = p.id
        JOIN users u ON pa.user_id = u.id
        WHERE ${where}
        ORDER BY pa.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [applications] = await connection.execute(query, [...values, limit, offset]);
      
      return {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
      
    } catch (error) {
      console.error("Error finding applications by user ID:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Update application
  async update(id, updates) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const allowedFields = [
        'status', 'message', 'offered_amount', 'cover_letter',
        'application_type'
      ];
      
      const updateFields = [];
      const updateValues = [];
      
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
      
      const setClause = updateFields.join(", ");
      const query = `UPDATE property_applications SET ${setClause} WHERE id = ?`;
      
      const [result] = await connection.execute(query, updateValues);
      
      if (result.affectedRows === 0) {
        throw new Error("Application not found");
      }
      
      await connection.commit();
      return await this.findById(id);
      
    } catch (error) {
      await connection.rollback();
      console.error("Error updating application:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Delete (soft delete)
  async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      const query = `
        UPDATE property_applications 
        SET deleted_at = NOW(), updated_at = NOW() 
        WHERE id = ? AND deleted_at IS NULL
      `;
      
      const [result] = await connection.execute(query, [id]);
      return result.affectedRows > 0;
      
    } catch (error) {
      console.error("Error deleting application:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Get application statistics for user
  async getUserStats(userId) {
    const connection = await pool.getConnection();
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END) as withdrawn,
          SUM(CASE WHEN application_type = 'sale' THEN 1 ELSE 0 END) as for_sale,
          SUM(CASE WHEN application_type = 'rent' THEN 1 ELSE 0 END) as for_rent
        FROM property_applications 
        WHERE user_id = ? AND deleted_at IS NULL
      `;
      
      const [rows] = await connection.execute(query, [userId]);
      return rows[0] || {};
      
    } catch (error) {
      console.error("Error getting user application stats:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default new PropertyApplicationModel();