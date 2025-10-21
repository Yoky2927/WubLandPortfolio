// todo-service/models/todo.model.js
import db from '../../shared/db.js';

export default class Todo {
    static async getAll() {
        const [rows] = await db.query(
            `SELECT id, user_id, title, description, category, priority, status, 
                    due_date, completed_at, estimated_hours, actual_hours, tags,
                    order_index, parent_todo_id, assigned_to, created_by, department,
                    created_at, updated_at 
             FROM todos 
             ORDER BY order_index ASC`
        );
        return rows;
    }

    static async create({ 
        title, 
        description, 
        user_id, 
        category = 'other', 
        priority = 'medium', 
        status = 'pending',
        due_date = null, 
        estimated_hours = null,
        assigned_to = null,
        created_by,
        department = 'administration'
    }) {
        const [result] = await db.query(
            `INSERT INTO todos (title, description, user_id, category, priority, status, 
                              due_date, estimated_hours, assigned_to, created_by, department,
                              order_index, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                    (SELECT COALESCE(MAX(t.order_index) + 1, 1) FROM (SELECT order_index FROM todos) AS t), 
                    NOW(), NOW())`,
            [
                title, 
                description || null, 
                user_id,
                category, 
                priority, 
                status,
                due_date, 
                estimated_hours,
                assigned_to, 
                created_by, 
                department
            ]
        );
        const [newTodo] = await db.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
        return newTodo[0];
    }

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
        completed
    }) {
        let query = 'UPDATE todos SET ';
        const params = [];
        const updates = [];
        
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
        if (completed !== undefined) {
            if (completed) {
                updates.push('status = "completed", completed_at = NOW()');
            } else {
                updates.push('status = "pending", completed_at = NULL');
            }
        }
        
        updates.push('updated_at = NOW()');
        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) throw new Error('Todo not found');
        const [updatedTodo] = await db.query('SELECT * FROM todos WHERE id = ?', [id]);
        return updatedTodo[0];
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM todos WHERE id = ?', [id]);
        if (result.affectedRows === 0) throw new Error('Todo not found');
        
        // Reindex order_index
        const [todos] = await db.query('SELECT id FROM todos ORDER BY order_index ASC');
        for (let i = 0; i < todos.length; i++) {
            await db.query('UPDATE todos SET order_index = ? WHERE id = ?', [i + 1, todos[i].id]);
        }
        
        return { id };
    }

    static async reorder(todos) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            for (let i = 0; i < todos.length; i++) {
                await connection.query('UPDATE todos SET order_index = ? WHERE id = ?', [i + 1, todos[i].id]);
            }
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get todos by user
    static async getByUser(userId) {
        const [rows] = await db.query(
            `SELECT id, title, description, category, priority, status, 
                    due_date, completed_at, estimated_hours, actual_hours,
                    assigned_to, created_by, department, created_at, updated_at
             FROM todos 
             WHERE user_id = ? OR assigned_to = ? OR created_by = ?
             ORDER BY 
                 CASE priority 
                     WHEN 'urgent' THEN 1
                     WHEN 'high' THEN 2
                     WHEN 'medium' THEN 3
                     WHEN 'low' THEN 4
                 END,
                 due_date ASC, created_at DESC`,
            [userId, userId, userId]
        );
        return rows;
    }
}