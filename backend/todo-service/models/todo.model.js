import db from '../../shared/db.js';

export default class Todo {
    static async getAll() {
        const [rows] = await db.query(
            'SELECT id, text, completed, due_date, assignee, created_by, order_index FROM todos ORDER BY order_index ASC'
        );
        return rows;
    }

    static async create({ text, completed, due_date, assignee, created_by }) {
        const [result] = await db.query(
            `INSERT INTO todos (text, completed, due_date, assignee, created_by, order_index)
             VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(t.order_index) + 1, 1) FROM (SELECT order_index FROM todos) AS t))`,
            [text, completed, due_date || null, assignee, created_by]
        );
        const [newTodo] = await db.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
        return newTodo[0];
    }

    static async update(id, { completed }) {
        const [result] = await db.query(
            'UPDATE todos SET completed = ? WHERE id = ?',
            [completed, id]
        );
        if (result.affectedRows === 0) throw new Error('Todo not found');
        const [updatedTodo] = await db.query('SELECT * FROM todos WHERE id = ?', [id]);
        return updatedTodo[0];
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM todos WHERE id = ?', [id]);
        if (result.affectedRows === 0) throw new Error('Todo not found');
        // Reindex order_index
        await db.query(
            'UPDATE todos SET order_index = new_order_index FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) AS new_order_index FROM todos) AS reindex WHERE todos.id = reindex.id'
        );
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
}