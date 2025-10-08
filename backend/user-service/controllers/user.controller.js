import db from "../../shared/db.js";

export const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(`
      SELECT id, first_name, last_name, username, email, role, broker_type, status, profile_picture, 
             created_at, verified 
      FROM users 
      ORDER BY created_at DESC
    `);

        res.status(200).json(users);
    } catch (error) {
        console.error('getAllUsers error:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.query(`
      SELECT id, first_name, last_name, username, email, role, broker_type, status, profile_picture, 
             created_at, verified 
      FROM users 
      WHERE id = ?
    `, [id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(users[0]);
    } catch (error) {
        console.error('getUserById error:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['active', 'inactive', 'suspended'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`
            });
        }

        const [result] = await db.query(
            "UPDATE users SET status = ? WHERE id = ?",
            [status, id]
        );

        if (result.affectedRows > 0) {
            const [updatedUser] = await db.query(
                "SELECT id, first_name, last_name, username, email, role, broker_type, status, profile_picture FROM users WHERE id = ?",
                [id]
            );

            res.status(200).json({
                message: "User status updated successfully",
                user: updatedUser[0]
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error('updateUserStatus error:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: "Cannot delete your own account" });
        }

        const [result] = await db.query(
            "DELETE FROM users WHERE id = ?",
            [id]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ message: "User deleted successfully" });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error('deleteUser error:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const getSupportAgents = async (req, res) => {
    try {
        const [users] = await db.query(`
      SELECT id, first_name, last_name, username, email, role, broker_type, status, profile_picture, 
             created_at, verified 
      FROM users 
      WHERE role IN ('support_agent', 'support_lead', 'support_admin', 'super_admin')
      ORDER BY created_at DESC
    `);

        res.status(200).json(users);
    } catch (error) {
        console.error('getSupportAgents error:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};