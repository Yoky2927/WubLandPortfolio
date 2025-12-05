import db from "../../shared/db.js";

export const getAllUsers = async (req, res) => {
    try {
        console.log("🔍 getAllUsers called by user:", req.user?.id, req.user?.username);
        
        const [users] = await db.query(`
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.username, 
                u.email, 
                u.role, 
                u.status, 
                u.profile_picture, 
                u.created_at, 
                u.verified,
                u.privilege_tier,
                u.phone_number,
                bp.broker_type,
                u.message_count,
                u.last_activity
            FROM users u
            LEFT JOIN broker_profiles bp ON u.id = bp.user_id
            ORDER BY u.created_at DESC
        `);

        console.log("🔍 Retrieved users count:", users.length);
        if (users.length > 0) {
            console.log("🔍 Sample user:", {
                id: users[0].id,
                name: `${users[0].first_name} ${users[0].last_name}`,
                role: users[0].role,
                broker_type: users[0].broker_type
            });
        }

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
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.username, 
                u.email, 
                u.role, 
                u.status, 
                u.profile_picture, 
                u.created_at, 
                u.verified,
                u.privilege_tier,
                u.phone_number,
                bp.broker_type
            FROM users u
            LEFT JOIN broker_profiles bp ON u.id = bp.user_id
            WHERE u.id = ?
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
            const [updatedUser] = await db.query(`
                SELECT 
                    u.id, 
                    u.first_name, 
                    u.last_name, 
                    u.username, 
                    u.email, 
                    u.role, 
                    u.status, 
                    u.profile_picture,
                    u.privilege_tier,
                    bp.broker_type
                FROM users u
                LEFT JOIN broker_profiles bp ON u.id = bp.user_id
                WHERE u.id = ?
            `, [id]);

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

        // First delete from broker_profiles if exists (due to foreign key constraint)
        await db.query(
            "DELETE FROM broker_profiles WHERE user_id = ?",
            [id]
        );

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
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.username, 
                u.email, 
                u.role, 
                u.status, 
                u.profile_picture, 
                u.created_at, 
                u.verified,
                u.privilege_tier,
                bp.broker_type
            FROM users u
            LEFT JOIN broker_profiles bp ON u.id = bp.user_id
            WHERE u.role IN ('support_agent', 'support_lead', 'support_admin', 'super_admin')
            ORDER BY u.created_at DESC
        `);

        res.status(200).json(users);
    } catch (error) {
        console.error('getSupportAgents error:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const updateUserPrivileges = async (req, res) => {
    try {
        const { id } = req.params;
        const { privileges } = req.body;

        // Update feature_flags in users table
        const [result] = await db.query(
            "UPDATE users SET feature_flags = ? WHERE id = ?",
            [JSON.stringify(privileges), id]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({
                message: "User privileges updated successfully"
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error('updateUserPrivileges error:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, broker_type, privilege_tier } = req.body;

        // Validate role
        const validRoles = ['super_admin', 'admin', 'support_admin', 'support_lead', 
                           'support_agent', 'internal_broker', 'external_broker', 
                           'buyer', 'seller', 'landlord', 'renter', 'user'];
        
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                message: `Invalid role. Valid roles are: ${validRoles.join(', ')}`
            });
        }

        // Start transaction
        await db.query("START TRANSACTION");

        try {
            // Update user role and privilege_tier
            const [userResult] = await db.query(
                "UPDATE users SET role = ?, privilege_tier = ? WHERE id = ?",
                [role, privilege_tier || 'basic', id]
            );

            if (userResult.affectedRows === 0) {
                await db.query("ROLLBACK");
                return res.status(404).json({ message: "User not found" });
            }

            // Handle broker_type for broker roles
            if (role.includes('broker')) {
                if (!broker_type || !['internal', 'external'].includes(broker_type)) {
                    await db.query("ROLLBACK");
                    return res.status(400).json({
                        message: "Broker type is required for broker roles. Must be 'internal' or 'external'"
                    });
                }

                // Check if broker profile exists
                const [existingProfile] = await db.query(
                    "SELECT id FROM broker_profiles WHERE user_id = ?",
                    [id]
                );

                if (existingProfile.length > 0) {
                    // Update existing broker profile
                    await db.query(
                        "UPDATE broker_profiles SET broker_type = ?, updated_at = NOW() WHERE user_id = ?",
                        [broker_type, id]
                    );
                } else {
                    // Create new broker profile
                    await db.query(
                        `INSERT INTO broker_profiles (user_id, broker_type, created_at, updated_at) 
                         VALUES (?, ?, NOW(), NOW())`,
                        [id, broker_type]
                    );
                }
            } else {
                // Remove broker profile if user is no longer a broker
                await db.query(
                    "DELETE FROM broker_profiles WHERE user_id = ?",
                    [id]
                );
            }

            await db.query("COMMIT");

            // Get updated user with broker_type
            const [updatedUser] = await db.query(`
                SELECT 
                    u.id, 
                    u.first_name, 
                    u.last_name, 
                    u.username, 
                    u.email, 
                    u.role, 
                    u.status, 
                    u.profile_picture,
                    u.privilege_tier,
                    bp.broker_type
                FROM users u
                LEFT JOIN broker_profiles bp ON u.id = bp.user_id
                WHERE u.id = ?
            `, [id]);

            res.status(200).json({
                message: "User role updated successfully",
                user: updatedUser[0]
            });

        } catch (error) {
            await db.query("ROLLBACK");
            throw error;
        }

    } catch (error) {
        console.error('updateUserRole error:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const getUserCounts = async (req, res) => {
    try {
        const [counts] = await db.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_users,
                SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_users,
                SUM(CASE WHEN role LIKE '%broker%' THEN 1 ELSE 0 END) as total_brokers,
                SUM(CASE WHEN role LIKE '%admin%' THEN 1 ELSE 0 END) as total_admins,
                SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified_users
            FROM users
        `);

        res.status(200).json(counts[0]);
    } catch (error) {
        console.error('getUserCounts error:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};