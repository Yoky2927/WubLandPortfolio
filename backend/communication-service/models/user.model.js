import db from "../../shared/db.js";
import 'dotenv/config';

const User = {
    findAll: async (excludeId) => {
        const [rows] = await db.execute(
            'SELECT id, CONCAT(first_name, " ", last_name) AS full_name, email, profile_picture AS profile_pic, role, broker_type, is_premium, last_message_time FROM users WHERE id != ?',
            [excludeId]
        );
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            'SELECT id, CONCAT(first_name, " ", last_name) AS full_name, email, profile_picture AS profile_pic, role, broker_type, is_premium FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    // Add the missing method
    updateLastMessageTime: async (userId) => {
        const [result] = await db.execute(
            'UPDATE users SET last_message_time = NOW() WHERE id = ?',
            [userId]
        );
        return result.affectedRows > 0;
    }
};

export { User };