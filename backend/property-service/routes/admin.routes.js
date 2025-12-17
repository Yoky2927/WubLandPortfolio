// routes/admin.routes.js (property-service)
import express from 'express';
import PropertyController from '../controllers/property.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// All admin property routes require admin privileges
router.use(authenticate, checkRole(['admin', 'super_admin', 'support_admin']));

// Get all properties (including deleted)
router.get('/properties', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      status,
      broker_id,
      search
    } = req.query;

    let whereClauses = ['1=1']; // Get all properties
    const values = [];
    
    if (status) {
      whereClauses.push('p.property_status = ?');
      values.push(status);
    }
    
    if (broker_id) {
      whereClauses.push('p.assigned_broker_id = ?');
      values.push(broker_id);
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
    
    const [properties] = await pool.execute(query, [...values, limit, offset]);
    
    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update property status (admin override)
router.patch('/properties/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    const validStatuses = ['draft', 'active', 'pending', 'sold', 'rented', 'inactive', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const property = await PropertyModel.findById(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Add status to history with admin note
    const statusHistory = property.status_history ? JSON.parse(property.status_history) : [];
    statusHistory.push({
      from: property.property_status,
      to: status,
      changed_at: new Date().toISOString(),
      changed_by: req.user.id,
      changed_by_role: req.user.role,
      reason: reason || 'Admin action'
    });
    
    const updatedProperty = await PropertyModel.update(id, {
      property_status: status,
      status_history: statusHistory,
      last_modified_by_user_id: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Property status updated successfully',
      data: updatedProperty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Admin property statistics
router.get('/properties/stats', async (req, res) => {
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
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;