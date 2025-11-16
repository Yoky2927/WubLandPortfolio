const { pool } = require('../../shared/db');

class Report {
    /**
     * Save a generated report to the database
     */
    static async create({ type, data }) {
        const [result] = await pool.execute(
            'INSERT INTO reports (type, data) VALUES (?, ?)',
            [type, JSON.stringify(data)]
        );
        return result.insertId;
    }

    /**
     * Get all reports by type
     */
    static async findByType(type) {
        const [rows] = await pool.execute(
            'SELECT * FROM reports WHERE type = ? ORDER BY generated_at DESC',
            [type]
        );
        return rows.map(row => ({
            ...row,
            data: JSON.parse(row.data)
        }));
    }

    /**
     * Get report by ID
     */
    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM reports WHERE id = ?',
            [id]
        );
        if (rows.length === 0) return null;
        return {
            ...rows[0],
            data: JSON.parse(rows[0].data)
        };
    }

    /**
     * Get all reports with pagination
     */
    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(
            'SELECT * FROM reports ORDER BY generated_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        return rows.map(row => ({
            ...row,
            data: JSON.parse(row.data)
        }));
    }

    /**
     * Delete a report
     */
    static async delete(id) {
        const [result] = await pool.execute(
            'DELETE FROM reports WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }
}

module.exports = Report;

