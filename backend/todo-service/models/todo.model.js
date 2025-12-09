// todo-service/models/todo.model.js
import db from '../../shared/db.js';

export default class Todo {
    // Get all todos
    static async getAll() {
        try {
            console.log('Fetching all todos from database...');
            
            const [rows] = await db.query(
                `SELECT 
                    id, 
                    todo_uuid,
                    user_id, 
                    title, 
                    description, 
                    todo_type,
                    category, 
                    priority, 
                    status, 
                    due_date, 
                    completed_at, 
                    estimated_hours, 
                    actual_hours, 
                    tags,
                    order_index, 
                    parent_todo_id, 
                    assigned_to, 
                    created_by, 
                    department,
                    reminder_sent,
                    reminder_date,
                    related_property_id,
                    related_transaction_id,
                    related_user_id,
                    created_at, 
                    updated_at 
                 FROM todos 
                 WHERE deleted_at IS NULL
                 ORDER BY order_index ASC, created_at DESC`
            );
            
            console.log(`Found ${rows.length} todos`);
            return rows;
        } catch (error) {
            console.error('Database error in Todo.getAll:', error);
            throw new Error('Failed to fetch todos');
        }
    }

    // Create a new todo
    static async create({ 
        title, 
        description = null, 
        user_id, 
        category = 'other', 
        priority = 'medium', 
        status = 'pending',
        due_date = null, 
        estimated_hours = null,
        assigned_to = null,
        created_by,
        department = 'administration',
        todo_type = 'general',
        related_property_id = null,
        related_transaction_id = null,
        related_user_id = null
    }) {
        try {
            console.log('Creating todo in database...');
            console.log('Parameters:', { 
                title, user_id, category, priority, 
                created_by, department, todo_type 
            });

            // Validate required fields
            if (!title || !user_id || !created_by) {
                throw new Error('Title, user_id, and created_by are required');
            }

            // Generate UUID
            const todo_uuid = this.generateUUID();
            
            // Get next order index
            const maxOrderResult = await db.query(
                'SELECT COALESCE(MAX(order_index), 0) as max_order FROM todos WHERE user_id = ?',
                [user_id]
            );
            const nextOrder = maxOrderResult[0][0]?.max_order + 1 || 1;

            const [result] = await db.query(
                `INSERT INTO todos (
                    todo_uuid,
                    title, 
                    description, 
                    user_id, 
                    category, 
                    priority, 
                    status,
                    todo_type,
                    due_date, 
                    estimated_hours, 
                    assigned_to, 
                    created_by, 
                    department,
                    order_index,
                    related_property_id,
                    related_transaction_id,
                    related_user_id,
                    created_at, 
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    todo_uuid,
                    title, 
                    description, 
                    user_id,
                    category, 
                    priority, 
                    status,
                    todo_type,
                    due_date, 
                    estimated_hours,
                    assigned_to, 
                    created_by, 
                    department,
                    nextOrder,
                    related_property_id,
                    related_transaction_id,
                    related_user_id
                ]
            );

            console.log('Todo created with ID:', result.insertId);

            const [newTodo] = await db.query(
                `SELECT * FROM todos WHERE id = ?`, 
                [result.insertId]
            );

            return newTodo[0];
        } catch (error) {
            console.error('Database error in Todo.create:', error);
            
            // Check for specific database errors
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new Error('Referenced user does not exist');
            }
            if (error.code === 'ER_BAD_NULL_ERROR') {
                throw new Error('Required field is missing');
            }
            
            throw new Error(`Failed to create todo: ${error.message}`);
        }
    }

    // Update a todo
    static async update(id, { 
        title, 
        description, 
        category, 
        priority, 
        status, 
        due_date, 
        estimated_hours,
        actual_hours,
        assigned_to,
        department,
        completed,
        todo_type = null,
        related_property_id = null,
        related_transaction_id = null,
        related_user_id = null
    }) {
        try {
            console.log(`Updating todo ID: ${id}`);

            let query = 'UPDATE todos SET ';
            const params = [];
            const updates = [];
            
            // Add each field to update
            if (title !== undefined) {
                updates.push('title = ?');
                params.push(title);
            }
            if (description !== undefined) {
                updates.push('description = ?');
                params.push(description);
            }
            if (category !== undefined) {
                updates.push('category = ?');
                params.push(category);
            }
            if (priority !== undefined) {
                updates.push('priority = ?');
                params.push(priority);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }
            if (due_date !== undefined) {
                updates.push('due_date = ?');
                params.push(due_date);
            }
            if (estimated_hours !== undefined) {
                updates.push('estimated_hours = ?');
                params.push(estimated_hours);
            }
            if (actual_hours !== undefined) {
                updates.push('actual_hours = ?');
                params.push(actual_hours);
            }
            if (assigned_to !== undefined) {
                updates.push('assigned_to = ?');
                params.push(assigned_to);
            }
            if (department !== undefined) {
                updates.push('department = ?');
                params.push(department);
            }
            if (todo_type !== undefined) {
                updates.push('todo_type = ?');
                params.push(todo_type);
            }
            if (related_property_id !== undefined) {
                updates.push('related_property_id = ?');
                params.push(related_property_id);
            }
            if (related_transaction_id !== undefined) {
                updates.push('related_transaction_id = ?');
                params.push(related_transaction_id);
            }
            if (related_user_id !== undefined) {
                updates.push('related_user_id = ?');
                params.push(related_user_id);
            }
            
            // Handle completion
            if (completed !== undefined) {
                if (completed) {
                    updates.push('status = "completed", completed_at = NOW()');
                } else {
                    updates.push('status = "pending", completed_at = NULL');
                }
            }
            
            if (updates.length === 0) {
                throw new Error('No fields to update');
            }
            
            updates.push('updated_at = NOW()');
            query += updates.join(', ') + ' WHERE id = ? AND deleted_at IS NULL';
            params.push(id);

            console.log('Update query:', query);
            console.log('Update params:', params);

            const [result] = await db.query(query, params);
            
            if (result.affectedRows === 0) {
                throw new Error('Todo not found or already deleted');
            }

            const [updatedTodo] = await db.query(
                'SELECT * FROM todos WHERE id = ?', 
                [id]
            );

            return updatedTodo[0];
        } catch (error) {
            console.error('Database error in Todo.update:', error);
            throw new Error(`Failed to update todo: ${error.message}`);
        }
    }

    // Delete a todo (soft delete)
    static async delete(id) {
        try {
            console.log(`Soft deleting todo ID: ${id}`);

            const [result] = await db.query(
                'UPDATE todos SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
                [id]
            );
            
            if (result.affectedRows === 0) {
                throw new Error('Todo not found or already deleted');
            }

            // Get todo before deletion for response
            const [deletedTodo] = await db.query(
                'SELECT id, title FROM todos WHERE id = ?',
                [id]
            );

            // Reindex remaining todos
            await this.reindexTodos();

            return deletedTodo[0];
        } catch (error) {
            console.error('Database error in Todo.delete:', error);
            throw new Error(`Failed to delete todo: ${error.message}`);
        }
    }

    // Reorder todos
    static async reorder(todos) {
        const connection = await db.getConnection();
        
        try {
            console.log('Reordering todos:', todos);
            
            await connection.beginTransaction();

            for (let i = 0; i < todos.length; i++) {
                await connection.query(
                    'UPDATE todos SET order_index = ? WHERE id = ? AND deleted_at IS NULL',
                    [i + 1, todos[i].id]
                );
            }

            await connection.commit();
            console.log('Todos reordered successfully');
        } catch (error) {
            await connection.rollback();
            console.error('Database error in Todo.reorder:', error);
            throw new Error('Failed to reorder todos');
        } finally {
            connection.release();
        }
    }

    // Get todos by user
    static async getByUser(userId) {
        try {
            console.log(`Fetching todos for user ID: ${userId}`);

            const [rows] = await db.query(
                `SELECT 
                    id,
                    todo_uuid,
                    title, 
                    description, 
                    category, 
                    priority, 
                    status, 
                    due_date, 
                    completed_at, 
                    estimated_hours, 
                    actual_hours,
                    assigned_to, 
                    created_by, 
                    department,
                    todo_type,
                    related_property_id,
                    related_transaction_id,
                    related_user_id,
                    created_at, 
                    updated_at
                 FROM todos 
                 WHERE deleted_at IS NULL 
                   AND (user_id = ? OR assigned_to = ? OR created_by = ?)
                 ORDER BY 
                     CASE priority 
                         WHEN 'urgent' THEN 1
                         WHEN 'high' THEN 2
                         WHEN 'medium' THEN 3
                         WHEN 'low' THEN 4
                     END,
                     due_date ASC NULLS LAST,
                     created_at DESC`,
                [userId, userId, userId]
            );

            console.log(`Found ${rows.length} todos for user ${userId}`);
            return rows;
        } catch (error) {
            console.error('Database error in Todo.getByUser:', error);
            throw new Error('Failed to fetch user todos');
        }
    }

    // Get todo by ID
    static async getById(id) {
        try {
            console.log(`Fetching todo ID: ${id}`);

            const [rows] = await db.query(
                'SELECT * FROM todos WHERE id = ? AND deleted_at IS NULL',
                [id]
            );

            if (rows.length === 0) {
                throw new Error('Todo not found');
            }

            return rows[0];
        } catch (error) {
            console.error('Database error in Todo.getById:', error);
            throw new Error(`Failed to fetch todo: ${error.message}`);
        }
    }

    // Get todos by status
    static async getByStatus(status) {
        try {
            console.log(`Fetching todos with status: ${status}`);

            const [rows] = await db.query(
                `SELECT * FROM todos 
                 WHERE status = ? AND deleted_at IS NULL
                 ORDER BY due_date ASC, priority ASC, created_at DESC`,
                [status]
            );

            return rows;
        } catch (error) {
            console.error('Database error in Todo.getByStatus:', error);
            throw new Error('Failed to fetch todos by status');
        }
    }

    // Get todos by category
    static async getByCategory(category) {
        try {
            console.log(`Fetching todos with category: ${category}`);

            const [rows] = await db.query(
                `SELECT * FROM todos 
                 WHERE category = ? AND deleted_at IS NULL
                 ORDER BY priority ASC, due_date ASC`,
                [category]
            );

            return rows;
        } catch (error) {
            console.error('Database error in Todo.getByCategory:', error);
            throw new Error('Failed to fetch todos by category');
        }
    }

    // Get todos by department
    static async getByDepartment(department) {
        try {
            console.log(`Fetching todos with department: ${department}`);

            const [rows] = await db.query(
                `SELECT * FROM todos 
                 WHERE department = ? AND deleted_at IS NULL
                 ORDER BY priority ASC, due_date ASC`,
                [department]
            );

            return rows;
        } catch (error) {
            console.error('Database error in Todo.getByDepartment:', error);
            throw new Error('Failed to fetch todos by department');
        }
    }

    // Complete a todo
    static async complete(id) {
        try {
            console.log(`Completing todo ID: ${id}`);

            const [result] = await db.query(
                'UPDATE todos SET status = "completed", completed_at = NOW(), updated_at = NOW() WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                throw new Error('Todo not found');
            }

            return await this.getById(id);
        } catch (error) {
            console.error('Database error in Todo.complete:', error);
            throw new Error(`Failed to complete todo: ${error.message}`);
        }
    }

    // Reindex all todos (internal method)
    static async reindexTodos() {
        try {
            console.log('Reindexing todos...');

            const [todos] = await db.query(
                'SELECT id FROM todos WHERE deleted_at IS NULL ORDER BY order_index ASC, created_at ASC'
            );
            
            for (let i = 0; i < todos.length; i++) {
                await db.query(
                    'UPDATE todos SET order_index = ? WHERE id = ?',
                    [i + 1, todos[i].id]
                );
            }

            console.log(`Reindexed ${todos.length} todos`);
        } catch (error) {
            console.error('Database error in Todo.reindexTodos:', error);
            throw new Error('Failed to reindex todos');
        }
    }

    // Helper method to generate UUID
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Search todos
    static async search(searchTerm, userId = null) {
        try {
            console.log(`Searching todos with term: "${searchTerm}" for user: ${userId}`);

            let query = `
                SELECT * FROM todos 
                WHERE deleted_at IS NULL 
                  AND (title LIKE ? OR description LIKE ?)
            `;
            
            const params = [`%${searchTerm}%`, `%${searchTerm}%`];

            if (userId) {
                query += ' AND (user_id = ? OR assigned_to = ? OR created_by = ?)';
                params.push(userId, userId, userId);
            }

            query += ' ORDER BY created_at DESC LIMIT 50';

            const [rows] = await db.query(query, params);
            return rows;
        } catch (error) {
            console.error('Database error in Todo.search:', error);
            throw new Error('Failed to search todos');
        }
    }

    // Get todos statistics
    static async getStats(userId = null) {
        try {
            console.log('Getting todo statistics for user:', userId);

            let query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                    SUM(CASE WHEN due_date < CURDATE() AND status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as overdue,
                    SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
                    SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high,
                    SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium,
                    SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low
                FROM todos 
                WHERE deleted_at IS NULL
            `;

            const params = [];

            if (userId) {
                query += ' AND (user_id = ? OR assigned_to = ? OR created_by = ?)';
                params.push(userId, userId, userId);
            }

            const [stats] = await db.query(query, params);
            return stats[0];
        } catch (error) {
            console.error('Database error in Todo.getStats:', error);
            throw new Error('Failed to get todo statistics');
        }
    }
}