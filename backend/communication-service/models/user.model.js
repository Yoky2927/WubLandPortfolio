import db from "../../shared/db.js";
import 'dotenv/config';

const User = {
    findAll: async (options = {}) => {
        try {
            console.log("🔍 User.findAll called with options:", options);
            
            const excludeId = options.excludeId || options.currentUserId;
            
            if (!excludeId) {
                throw new Error("excludeId is required");
            }

            const [rows] = await db.execute(
                'SELECT id, CONCAT(first_name, " ", last_name) AS full_name, email, profile_picture AS profile_pic, role, broker_type, is_premium, last_message_time FROM users WHERE id != ?',
                [excludeId]
            );
            
            console.log("✅ User.findAll returned:", rows?.length, "users");
            return rows;
        } catch (error) {
            console.error("❌ Error in User.findAll:", error.message);
            throw error;
        }
    },

    findById: async (id) => {
        try {
            console.log("🔍 User.findById called with id:", id);
            const [rows] = await db.execute(
                'SELECT id, CONCAT(first_name, " ", last_name) AS full_name, email, profile_picture AS profile_pic, role, broker_type, is_premium FROM users WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error("❌ Error in User.findById:", error.message);
            throw error;
        }
    },

    updateLastMessageTime: async (userId) => {
        try {
            const [result] = await db.execute(
                'UPDATE users SET last_message_time = NOW() WHERE id = ?',
                [userId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error("❌ Error in updateLastMessageTime:", error.message);
            throw error;
        }
    }
};

export { User };