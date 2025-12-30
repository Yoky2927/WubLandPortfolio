// controllers/admin.controller.js
import pool from '../config/database.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

class AdminController {
  async getAllPropertiesAdmin(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        broker_id,
        search,
        include_deleted = false
      } = req.query;

      let whereClauses = ['1=1'];
      const values = [];

      if (!include_deleted || include_deleted === 'false') {
        whereClauses.push('p.deleted_at IS NULL');
      }

      if (status) {
        whereClauses.push('p.property_status = ?');
        values.push(status);
      }

      if (broker_id) {
        whereClauses.push('p.assigned_broker_id = ?');
        values.push(parseInt(broker_id));
      }

      if (search) {
        whereClauses.push('(p.title LIKE ? OR p.address LIKE ? OR p.city LIKE ?)');
        const searchValue = `%${search}%`;
        values.push(searchValue, searchValue, searchValue);
      }

      const where = whereClauses.join(' AND ');

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM properties p
        WHERE ${where}
      `;
      const [countResult] = await pool.execute(countQuery, values);
      const total = countResult[0].total;

      // Get paginated results
      const offset = (page - 1) * limit;
      const query = `
        SELECT p.*, 
          u.username as owner_username,
          u.email as owner_email,
          b.username as broker_username,
          b.email as broker_email
        FROM properties p
        LEFT JOIN users u ON p.owner_user_id = u.id
        LEFT JOIN users b ON p.assigned_broker_id = b.id
        WHERE ${where}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [properties] = await pool.execute(query, [...values, parseInt(limit), offset]);

      successResponse(res, 200, "Admin properties retrieved successfully", {
        properties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async adminUpdatePropertyStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const validStatuses = ['draft', 'active', 'pending', 'sold', 'rented', 'inactive', 'rejected'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 400, 'Invalid status');
      }

      // Get property
      const [properties] = await pool.execute('SELECT * FROM properties WHERE id = ?', [id]);
      if (properties.length === 0) {
        return errorResponse(res, 404, 'Property not found');
      }
      const property = properties[0];

      // Parse status history
      let statusHistory = [];
      try {
        statusHistory = property.status_history ? JSON.parse(property.status_history) : [];
      } catch (e) {
        console.warn('Error parsing status history:', e.message);
      }

      statusHistory.push({
        from: property.property_status,
        to: status,
        changed_at: new Date().toISOString(),
        changed_by: req.user.id,
        changed_by_role: req.user.role,
        reason: reason || 'Admin action'
      });

      // Update property
      const updateQuery = `
        UPDATE properties 
        SET property_status = ?, 
            status_history = ?,
            last_modified_by_user_id = ?,
            updated_at = NOW()
        WHERE id = ?
      `;

      await pool.execute(updateQuery, [
        status,
        JSON.stringify(statusHistory),
        req.user.id,
        id
      ]);

      // Get updated property
      const [updatedProperties] = await pool.execute('SELECT * FROM properties WHERE id = ?', [id]);
      const updatedProperty = updatedProperties[0];

      successResponse(res, 200, 'Property status updated successfully', updatedProperty);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getAdminStats(req, res) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN property_status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN property_status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN property_status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN property_status IN ('sold', 'rented') THEN 1 ELSE 0 END) as closed,
          SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as deleted
        FROM properties
      `;

      const [result] = await pool.execute(query);

      successResponse(res, 200, "Admin statistics retrieved successfully", result[0]);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getAdminAllProperties(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        broker_id,
        search
      } = req.query;

      // We'll reuse the same logic as getAllPropertiesAdmin
      let whereClauses = ['1=1'];
      const values = [];

      if (status) {
        whereClauses.push('property_status = ?');
        values.push(status);
      }

      if (broker_id) {
        whereClauses.push('assigned_broker_id = ?');
        values.push(parseInt(broker_id));
      }

      if (search) {
        whereClauses.push('(title LIKE ? OR address LIKE ? OR city LIKE ?)');
        const searchValue = `%${search}%`;
        values.push(searchValue, searchValue, searchValue);
      }

      const where = whereClauses.join(' AND ');

      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM properties WHERE ${where}`;
      const [countResult] = await pool.execute(countQuery, values);
      const total = countResult[0].total;

      // Get paginated results
      const offset = (page - 1) * limit;
      const query = `
        SELECT * FROM properties
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [properties] = await pool.execute(query, [...values, parseInt(limit), offset]);

      successResponse(res, 200, "All properties retrieved successfully", {
        properties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async adminDeleteProperty(req, res) {
    try {
      const { id } = req.params;
      const { permanent = false } = req.body;

      if (permanent) {
        // Permanent delete
        const [result] = await pool.execute('DELETE FROM properties WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, 'Property not found');
        }
        successResponse(res, 200, 'Property permanently deleted');
      } else {
        // Soft delete
        const [result] = await pool.execute(
          'UPDATE properties SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
          [id]
        );
        if (result.affectedRows === 0) {
          return errorResponse(res, 404, 'Property not found or already deleted');
        }
        successResponse(res, 200, 'Property soft deleted successfully');
      }
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async restoreProperty(req, res) {
    try {
      const { id } = req.params;

      const [result] = await pool.execute(
        'UPDATE properties SET deleted_at = NULL, updated_at = NOW() WHERE id = ? AND deleted_at IS NOT NULL',
        [id]
      );

      if (result.affectedRows === 0) {
        return errorResponse(res, 404, 'Property not found or not deleted');
      }

      successResponse(res, 200, 'Property restored successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getStatsSummary(req, res) {
    try {
      // Get total properties by status
      const statusQuery = `
        SELECT 
          COALESCE(property_status, 'unknown') as property_status,
          COUNT(*) as count
        FROM properties 
        WHERE deleted_at IS NULL
        GROUP BY COALESCE(property_status, 'unknown')
      `;

      // Get recent activity
      const activityQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as created,
          SUM(CASE WHEN property_status = 'active' THEN 1 ELSE 0 END) as activated
        FROM properties
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 10
      `;

      // Get broker performance
      const brokerQuery = `
        SELECT 
          assigned_broker_id,
          COUNT(*) as total_properties,
          SUM(CASE WHEN property_status = 'active' THEN 1 ELSE 0 END) as active_properties,
          SUM(CASE WHEN property_status IN ('sold', 'rented') THEN 1 ELSE 0 END) as closed_properties
        FROM properties
        WHERE assigned_broker_id IS NOT NULL 
          AND deleted_at IS NULL
        GROUP BY assigned_broker_id
        ORDER BY active_properties DESC
        LIMIT 5
      `;

      const [statusResults] = await pool.execute(statusQuery);
      const [activityResults] = await pool.execute(activityQuery);
      const [brokerResults] = await pool.execute(brokerQuery);

      // Transform status results
      const statusSummary = {};
      statusResults.forEach(row => {
        statusSummary[row.property_status] = row.count;
      });

      successResponse(res, 200, "Statistics summary retrieved successfully", {
        status: statusSummary,
        recent_activity: activityResults || [],
        broker_performance: brokerResults || [],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Stats summary error:', error);
      errorResponse(res, 500, `Failed to retrieve stats: ${error.message}`);
    }
  }
}

export default new AdminController();