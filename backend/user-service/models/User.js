const { pool } = require('../shared/db');

class User {
    static async create({ email, password, role }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, role]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async updateVerification(id, verified) {
        const [result] = await pool.execute(
            'UPDATE users SET verified = ? WHERE id = ?',
            [verified, id]
        );
        return result.affectedRows;
    }
}

module.exports = User;