// communication-service/models/todo.model.js - FIXED VERSION
import db from '../../shared/db.js';
import crypto from 'crypto';

class TodoModel {
  // Create a new todo - FIXED VERSION
  static async createTodo(todoData) {
    try {
      const todoUuid = todoData.todo_uuid || crypto.randomUUID();

      const {
        user_id,
        title,
        description = null,
        todo_type = 'general',
        category = 'other',
        priority = 'medium',
        due_date = null,
        estimated_hours = null,
        assigned_to = null,
        assigned_by = null,
        department = 'administration',
        tags = [],
        attachments = [],
        related_property_id = null,
        related_transaction_id = null,
        related_user_id = null,
        parent_todo_id = null,
        reminder_date = null
      } = todoData;

      // FIX: Convert empty strings to null for foreign key fields
      const sanitizedRelatedPropertyId = related_property_id === "" || 
                                        related_property_id === "null" || 
                                        related_property_id === null ? 
                                        null : parseInt(related_property_id);
      
      const sanitizedRelatedTransactionId = related_transaction_id === "" || 
                                           related_transaction_id === "null" || 
                                           related_transaction_id === null ? 
                                           null : parseInt(related_transaction_id);
      
      const sanitizedRelatedUserId = related_user_id === "" || 
                                    related_user_id === "null" || 
                                    related_user_id === null ? 
                                    null : parseInt(related_user_id);
      
      const sanitizedAssignedTo = assigned_to === "" || 
                                  assigned_to === "null" || 
                                  assigned_to === null ? 
                                  null : parseInt(assigned_to);
      
      const sanitizedAssignedBy = assigned_by === "" || 
                                  assigned_by === "null" || 
                                  assigned_by === null ? 
                                  null : parseInt(assigned_by);
      
      const sanitizedParentTodoId = parent_todo_id === "" || 
                                    parent_todo_id === "null" || 
                                    parent_todo_id === null ? 
                                    null : parseInt(parent_todo_id);

      const query = `
        INSERT INTO todos (
          todo_uuid, user_id, title, description, todo_type, category,
          priority, due_date, estimated_hours, assigned_to, assigned_by,
          department, tags, attachments, related_property_id,
          related_transaction_id, related_user_id, parent_todo_id,
          reminder_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        todoUuid,
        user_id,
        title,
        description,
        todo_type,
        category,
        priority,
        due_date,
        estimated_hours,
        sanitizedAssignedTo,      // Use sanitized value
        sanitizedAssignedBy,      // Use sanitized value
        department,
        JSON.stringify(tags),
        JSON.stringify(attachments),
        sanitizedRelatedPropertyId,      // Use sanitized value
        sanitizedRelatedTransactionId,   // Use sanitized value
        sanitizedRelatedUserId,          // Use sanitized value
        sanitizedParentTodoId,           // Use sanitized value
        reminder_date,
        user_id // created_by
      ];

      console.log('🔍 Creating todo with sanitized values:', {
        title,
        user_id,
        sanitizedRelatedPropertyId,
        sanitizedRelatedTransactionId,
        sanitizedRelatedUserId
      });

      const [result] = await db.execute(query, values);
      console.log('✅ Todo created with ID:', result.insertId);
      
      return result.insertId;

    } catch (error) {
      console.error('❌ Error creating todo:', error.message);
      console.error('📊 Todo data that caused error:', {
        title: todoData.title,
        user_id: todoData.user_id,
        related_property_id: todoData.related_property_id,
        related_transaction_id: todoData.related_transaction_id,
        related_user_id: todoData.related_user_id
      });
      throw error;
    }
  }

  // Get todo by ID
  static async getTodoById(todoId) {
    try {
      const query = `
        SELECT t.*, 
          u.first_name as creator_first_name, u.last_name as creator_last_name,
          u.email as creator_email, u.profile_picture as creator_profile_pic,
          a.first_name as assignee_first_name, a.last_name as assignee_last_name,
          a.email as assignee_email, a.profile_picture as assignee_profile_pic,
          p.title as related_property_title, p.property_uuid,
          tr.transaction_uuid, tr.transaction_type,
          ru.first_name as related_user_first_name, ru.last_name as related_user_last_name,
          COUNT(DISTINCT c.id) as comment_count
        FROM todos t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.assigned_to = a.id
        LEFT JOIN properties p ON t.related_property_id = p.id
        LEFT JOIN transactions tr ON t.related_transaction_id = tr.id
        LEFT JOIN users ru ON t.related_user_id = ru.id
        LEFT JOIN todo_comments c ON t.id = c.todo_id
        WHERE t.id = ? AND t.deleted_at IS NULL
        GROUP BY t.id
      `;

      const [rows] = await db.execute(query, [todoId]);
      return rows[0] || null;

    } catch (error) {
      console.error('Error getting todo:', error);
      throw error;
    }
  }

  // Get todos for a user
  static async getUserTodos(userId, filters = {}) {
    try {
      let query = `
        SELECT t.*, 
          u.first_name as creator_first_name, u.last_name as creator_last_name,
          a.first_name as assignee_first_name, a.last_name as assignee_last_name,
          p.title as related_property_title,
          tr.transaction_type,
          COUNT(DISTINCT c.id) as comment_count
        FROM todos t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.assigned_to = a.id
        LEFT JOIN properties p ON t.related_property_id = p.id
        LEFT JOIN transactions tr ON t.related_transaction_id = tr.id
        LEFT JOIN todo_comments c ON t.id = c.todo_id
        WHERE t.deleted_at IS NULL 
      `;

      const values = [];

      // Get user role to check if admin
      const [userRows] = await db.execute(
        'SELECT role FROM users WHERE id = ?',
        [userId]
      );

      const userRole = userRows[0]?.role;
      const isAdmin = ['super_admin', 'admin', 'support_admin'].includes(userRole);

      if (isAdmin) {
        // Admin users can see ALL todos
        query += ' AND 1=1'; // Always true condition
      } else {
        // Regular users only see their own todos
        query += ' AND (t.user_id = ? OR t.assigned_to = ? OR t.assigned_by = ?)';
        values.push(userId, userId, userId);
      }

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query += ' AND t.status = ?';
        values.push(filters.status);
      }

      if (filters.priority && filters.priority !== 'all') {
        query += ' AND t.priority = ?';
        values.push(filters.priority);
      }

      if (filters.category && filters.category !== 'all') {
        query += ' AND t.category = ?';
        values.push(filters.category);
      }

      if (filters.todo_type && filters.todo_type !== 'all') {
        query += ' AND t.todo_type = ?';
        values.push(filters.todo_type);
      }

      if (filters.department && filters.department !== 'all') {
        query += ' AND t.department = ?';
        values.push(filters.department);
      }

      if (filters.assigned_to) {
        query += ' AND t.assigned_to = ?';
        values.push(filters.assigned_to);
      }

      if (filters.start_date) {
        query += ' AND t.due_date >= ?';
        values.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ' AND t.due_date <= ?';
        values.push(filters.end_date);
      }

      if (filters.search) {
        query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
        values.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      // Group and order
      query += ' GROUP BY t.id';

      // Order by
      if (filters.order_by === 'due_date') {
        query += ' ORDER BY t.due_date ASC';
      } else if (filters.order_by === 'priority') {
        query += ' ORDER BY FIELD(t.priority, "urgent", "high", "medium", "low")';
      } else {
        query += ' ORDER BY t.created_at DESC';
      }

      // Limit and offset
      if (filters.limit) {
        query += ' LIMIT ?';
        values.push(filters.limit);
      }

      if (filters.offset) {
        query += ' OFFSET ?';
        values.push(filters.offset);
      }

      console.log('🔍 Todo query:', query);
      console.log('📊 Query values:', values);

      const [rows] = await db.execute(query, values);
      console.log(`✅ Found ${rows.length} todos for user ${userId} (role: ${userRole})`);

      return rows;

    } catch (error) {
      console.error('Error getting user todos:', error);
      throw error;
    }
  }

  // Get team members (for assignment)
  static async getTeamMembers(userId, department = null) {
    try {
      let query = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.profile_picture,
          u.role, u.privilege_tier, bp.brokerage_firm
        FROM users u
        LEFT JOIN broker_profiles bp ON u.id = bp.user_id
        WHERE u.deleted_at IS NULL 
          AND u.status = 'active'
          AND u.id != ?
      `;

      const values = [userId];

      if (department) {
        // Map department to roles
        const roleMap = {
          'administration': ['admin', 'super_admin'],
          'support': ['support_admin', 'support_agent', 'support_lead'],
          'brokerage': ['internal_broker', 'external_broker'],
          'technical': ['admin', 'super_admin'],
          'financial': ['admin'],
          'sales': ['internal_broker', 'external_broker'],
          'marketing': ['admin']
        };

        const roles = roleMap[department] || [];
        if (roles.length > 0) {
          query += ' AND u.role IN (' + roles.map(() => '?').join(',') + ')';
          values.push(...roles);
        }
      }

      query += ' ORDER BY u.first_name, u.last_name';

      const [rows] = await db.execute(query, values);
      return rows;

    } catch (error) {
      console.error('Error getting team members:', error);
      throw error;
    }
  }

  // Update todo
  static async updateTodo(todoId, updates) {
    try {
      const allowedFields = [
        'title', 'description', 'todo_type', 'category', 'priority',
        'status', 'due_date', 'estimated_hours', 'actual_hours',
        'assigned_to', 'assigned_by', 'assigned_at', 'department',
        'tags', 'attachments', 'comments', 'metadata',
        'related_property_id', 'related_transaction_id', 'related_user_id',
        'parent_todo_id', 'order_index', 'reminder_sent',
        'reminder_date', 'completed_at', 'analytics_metadata'
      ];

      const setClauses = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          setClauses.push(`${key} = ?`);
          
          // Handle JSON fields
          if (['tags', 'attachments', 'comments', 'metadata', 'analytics_metadata'].includes(key)) {
            values.push(JSON.stringify(value));
          } 
          // Handle foreign key fields - convert empty strings to null
          else if (['related_property_id', 'related_transaction_id', 'related_user_id', 'assigned_to', 'assigned_by', 'parent_todo_id'].includes(key)) {
            const sanitizedValue = value === "" || value === "null" || value === null ? null : value;
            values.push(sanitizedValue);
          }
          else {
            values.push(value);
          }
        }
      }

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      setClauses.push('updated_at = CURRENT_TIMESTAMP');

      const query = `
        UPDATE todos 
        SET ${setClauses.join(', ')}
        WHERE id = ? AND deleted_at IS NULL
      `;

      values.push(todoId);
      const [result] = await db.execute(query, values);

      return result.affectedRows > 0;

    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  }

  // Delete todo (soft delete)
  static async deleteTodo(todoId, userId) {
    try {
      const query = `
        UPDATE todos 
        SET deleted_at = CURRENT_TIMESTAMP, 
            status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND (user_id = ? OR assigned_to = ?) AND deleted_at IS NULL
      `;

      const [result] = await db.execute(query, [todoId, userId, userId]);
      return result.affectedRows > 0;

    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  }

  // Update todo status
  static async updateTodoStatus(todoId, status, userId = null) {
    try {
      let query;
      let values;

      if (userId) {
        query = `
          UPDATE todos 
          SET status = ?, 
              updated_at = CURRENT_TIMESTAMP,
              completed_at = CASE 
                WHEN ? = 'completed' THEN CURRENT_TIMESTAMP 
                ELSE completed_at 
              END
          WHERE id = ? AND (user_id = ? OR assigned_to = ?) AND deleted_at IS NULL
        `;
        values = [status, status, todoId, userId, userId];
      } else {
        query = `
          UPDATE todos 
          SET status = ?, 
              updated_at = CURRENT_TIMESTAMP,
              completed_at = CASE 
                WHEN ? = 'completed' THEN CURRENT_TIMESTAMP 
                ELSE completed_at 
              END
          WHERE id = ? AND deleted_at IS NULL
        `;
        values = [status, status, todoId];
      }

      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;

    } catch (error) {
      console.error('Error updating todo status:', error);
      throw error;
    }
  }

  // Get todo statistics
  static async getTodoStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
          SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low,
          SUM(CASE WHEN assigned_to = ? THEN 1 ELSE 0 END) as assigned_to_me,
          SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) as created_by_me,
          AVG(CASE WHEN status = 'completed' THEN completion_duration_days ELSE NULL END) as avg_completion_days,
          SUM(CASE WHEN due_date < CURDATE() AND status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as overdue
        FROM todos
        WHERE deleted_at IS NULL 
          AND (user_id = ? OR assigned_to = ? OR assigned_by = ?)
      `;

      const [rows] = await db.execute(query, [userId, userId, userId, userId, userId]);
      return rows[0] || {};

    } catch (error) {
      console.error('Error getting todo stats:', error);
      throw error;
    }
  }

  // Add comment to todo
  static async addTodoComment(todoId, commentData) {
    try {
      const { user_id, comment, attachments = [] } = commentData;

      // Get current comments
      const [todo] = await db.execute(
        'SELECT comments FROM todos WHERE id = ?',
        [todoId]
      );

      const currentComments = todo[0]?.comments ? JSON.parse(todo[0].comments) : [];

      // Add new comment
      const newComment = {
        id: Date.now(), // Simple ID generation
        user_id,
        comment: comment.trim(),
        attachments,
        created_at: new Date().toISOString()
      };

      const updatedComments = [...currentComments, newComment];

      // Update todo
      await db.execute(
        `UPDATE todos 
         SET comments = ?,
             last_comment_at = NOW(),
             comment_count = comment_count + 1,
             updated_at = NOW()
         WHERE id = ?`,
        [JSON.stringify(updatedComments), todoId]
      );

      return newComment.id;
    } catch (error) {
      console.error('Error adding todo comment:', error);
      throw error;
    }
  }

  // Get todo comments
  static async getTodoComments(todoId) {
    try {
      const [todo] = await db.execute(
        `SELECT t.comments,
                u.first_name, u.last_name, u.profile_picture, u.role
         FROM todos t
         LEFT JOIN users u ON JSON_EXTRACT(t.comments, '$[*].user_id') LIKE CONCAT('%"', u.id, '"%')
         WHERE t.id = ?`,
        [todoId]
      );

      if (!todo[0]?.comments) return [];

      const comments = JSON.parse(todo[0].comments);

      // Sort by created_at
      return comments.sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      );
    } catch (error) {
      console.error('Error getting todo comments:', error);
      throw error;
    }
  }

  // Get upcoming todos
  static async getUpcomingTodos(userId, limit = 10) {
    try {
      const query = `
        SELECT t.*, 
          u.first_name as creator_first_name, u.last_name as creator_last_name,
          a.first_name as assignee_first_name, a.last_name as assignee_last_name
        FROM todos t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.assigned_to = a.id
        WHERE t.deleted_at IS NULL 
          AND t.status IN ('pending', 'in_progress')
          AND (t.user_id = ? OR t.assigned_to = ? OR t.assigned_by = ?)
          AND (t.due_date IS NULL OR t.due_date >= CURDATE())
        ORDER BY 
          FIELD(t.priority, 'urgent', 'high', 'medium', 'low'),
          t.due_date ASC,
          t.created_at DESC
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [userId, userId, userId, limit]);
      return rows;

    } catch (error) {
      console.error('Error getting upcoming todos:', error);
      throw error;
    }
  }

  // Search todos
  static async searchTodos(userId, searchTerm, filters = {}) {
    try {
      let query = `
        SELECT t.*, 
          u.first_name as creator_first_name, u.last_name as creator_last_name,
          a.first_name as assignee_first_name, a.last_name as assignee_last_name,
          p.title as related_property_title
        FROM todos t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.assigned_to = a.id
        LEFT JOIN properties p ON t.related_property_id = p.id
        WHERE t.deleted_at IS NULL 
          AND (t.user_id = ? OR t.assigned_to = ? OR t.assigned_by = ?)
          AND (
            t.title LIKE ? OR 
            t.description LIKE ? OR
            JSON_SEARCH(t.tags, 'all', ?, NULL, '$[*]') IS NOT NULL
          )
      `;

      const values = [
        userId, userId, userId,
        `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`
      ];

      if (filters.status) {
        query += ' AND t.status = ?';
        values.push(filters.status);
      }

      if (filters.priority) {
        query += ' AND t.priority = ?';
        values.push(filters.priority);
      }

      query += ' ORDER BY t.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        values.push(filters.limit);
      }

      const [rows] = await db.execute(query, values);
      return rows;

    } catch (error) {
      console.error('Error searching todos:', error);
      throw error;
    }
  }
}

// Create todo_comments table if it doesn't exist
const createTodoCommentsTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS todo_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        todo_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT NOT NULL,
        attachments JSON DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_todo_id (todo_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await db.execute(query);
    console.log('✅ todo_comments table ready');
  } catch (error) {
    console.error('Error creating todo_comments table:', error);
  }
};

// Initialize table on import
createTodoCommentsTable();

export default TodoModel;