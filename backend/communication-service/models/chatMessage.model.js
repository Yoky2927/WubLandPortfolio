import db from "../../shared/db.js";
import 'dotenv/config';

const ChatMessage = {
    find: async (senderId, receiverId) => {
        const [rows] = await db.execute(
            'SELECT * FROM chat_messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC',
            [senderId, receiverId, receiverId, senderId]
        );
        return rows;
    },

    create: async (data) => {
        const [result] = await db.execute(
            'INSERT INTO chat_messages (sender_id, receiver_id, text, file, file_name, file_type, created_at, status) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)',
            [
                data.senderId, 
                data.receiverId, 
                data.text || '', 
                data.file || null,
                data.fileName || null,
                data.fileType || null,
                data.status || 'sent'
            ]
        );

        return {
            id: result.insertId,
            ...data,
            created_at: new Date(),
            status: data.status || 'sent'
        };
    },

    findById: async (id) => {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM chat_messages WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding message by ID:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const [result] = await db.execute(
                'DELETE FROM chat_messages WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    },

    getTodayMessageCount: async (userId, date) => {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM chat_messages WHERE sender_id = ? AND DATE(created_at) = ?',
            [userId, date]
        );
        return rows[0].count;
    },

    updateStatus: async (messageId, status) => {
        const [result] = await db.execute(
            'UPDATE chat_messages SET status = ? WHERE id = ?',
            [status, messageId]
        );
        return result.affectedRows > 0;
    }
};

export { ChatMessage };