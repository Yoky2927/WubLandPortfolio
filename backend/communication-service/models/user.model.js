// communication-service/models/user.model.js
import db from "../../shared/db.js";
import "dotenv/config";

const User = {
  findAll: async (options = {}) => {
    try {
      console.log("🔍 User.findAll called with options:", options);

      const excludeId = options.excludeId || options.currentUserId;

      if (!excludeId) {
        throw new Error("excludeId is required");
      }

      // Get users who are not the current user
      const [rows] = await db.execute(
        `SELECT 
                    id, 
                    CONCAT(first_name, " ", last_name) AS full_name, 
                    email, 
                    profile_picture AS profile_pic, 
                    role, 
                    privilege_tier, 
                    last_message_time,
                    created_at
                 FROM users 
                 WHERE id != ? AND status = 'active'
                 ORDER BY first_name, last_name`,
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
        `SELECT 
                    id, 
                    CONCAT(first_name, " ", last_name) AS full_name, 
                    email, 
                    profile_picture AS profile_pic, 
                    role, 
                    privilege_tier,
                    last_message_time
                 FROM users 
                 WHERE id = ? AND status = 'active'`,
        [id]
      );

      const user = rows[0];
      if (user) {
        // Calculate is_premium based on privilege_tier for backward compatibility
        user.is_premium = ["premium", "enterprise"].includes(
          user.privilege_tier
        );
      }

      return user;
    } catch (error) {
      console.error("❌ Error in User.findById:", error.message);
      throw error;
    }
  },

  updateLastMessageTime: async (userId) => {
    try {
      const [result] = await db.execute(
        "UPDATE users SET last_message_time = NOW() WHERE id = ?",
        [userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("❌ Error in updateLastMessageTime:", error.message);
      throw error;
    }
  },

  findByRoles: async (roles) => {
    try {
      console.log("🔍 User.findByRoles called with roles:", roles);

      if (!Array.isArray(roles) || roles.length === 0) {
        throw new Error("roles array is required");
      }

      // Create placeholders for the roles array
      const placeholders = roles.map(() => "?").join(",");

      // Get users with specified roles
      const [rows] = await db.execute(
        `SELECT 
                    id, 
                    CONCAT(first_name, " ", last_name) AS full_name, 
                    email, 
                    profile_picture AS profile_pic, 
                    role, 
                    privilege_tier, 
                    last_message_time,
                    created_at
                 FROM users 
                 WHERE role IN (${placeholders}) AND status = 'active'
                 ORDER BY first_name, last_name`,
        roles // Spread the array as separate parameters
      );

      console.log("✅ User.findByRoles returned:", rows?.length, "users");
      return rows;
    } catch (error) {
      console.error("❌ Error in User.findByRoles:", error.message);
      console.error("❌ Full error:", error);
      throw error;
    }
  },

  findByRole: async (role) => {
    try {
      console.log("🔍 User.findByRole called with role:", role);

      const [rows] = await db.execute(
        `SELECT 
                    id, 
                    CONCAT(first_name, " ", last_name) AS full_name, 
                    email, 
                    profile_picture AS profile_pic, 
                    role, 
                    privilege_tier, 
                    last_message_time,
                    created_at
                 FROM users 
                 WHERE role = ? AND status = 'active'
                 ORDER BY first_name, last_name`,
        [role]
      );

      console.log("✅ User.findByRole returned:", rows?.length, "users");
      return rows;
    } catch (error) {
      console.error("❌ Error in User.findByRole:", error.message);
      throw error;
    }
  },

  findAdminsAndSupport: async () => {
    try {
      console.log("🔍 User.findAdminsAndSupport called");

      const [rows] = await db.execute(
        `SELECT 
                    id, 
                    CONCAT(first_name, " ", last_name) AS full_name, 
                    email, 
                    profile_picture AS profile_pic, 
                    role, 
                    privilege_tier, 
                    last_message_time,
                    created_at
                 FROM users 
                 WHERE role IN ('super_admin', 'admin', 'support_admin', 'support_lead', 'support_agent') 
                   AND status = 'active'
                 ORDER BY 
                    CASE role
                        WHEN 'super_admin' THEN 1
                        WHEN 'admin' THEN 2
                        WHEN 'support_admin' THEN 3
                        WHEN 'support_lead' THEN 4
                        WHEN 'support_agent' THEN 5
                        ELSE 6
                    END,
                    first_name, last_name`,
        []
      );

      console.log(
        "✅ User.findAdminsAndSupport returned:",
        rows?.length,
        "users"
      );
      return rows;
    } catch (error) {
      console.error("❌ Error in User.findAdminsAndSupport:", error.message);
      throw error;
    }
  },

  findBrokers: async (brokerType = null) => {
    try {
      console.log("🔍 User.findBrokers called with type:", brokerType);

      let query = `SELECT 
            u.id, 
            CONCAT(u.first_name, " ", u.last_name) AS full_name, 
            u.email, 
            u.profile_picture AS profile_pic, 
            u.role, 
            b.broker_type,
            u.privilege_tier, 
            u.last_message_time,
            u.created_at
         FROM users u
         LEFT JOIN broker_profiles b ON u.id = b.user_id
         WHERE u.role IN ('internal_broker', 'external_broker') 
           AND u.status = 'active'`;

      const params = [];

      if (brokerType) {
        query += " AND b.broker_type = ?";
        params.push(brokerType);
      }

      query += " ORDER BY u.first_name, u.last_name";

      const [rows] = await db.execute(query, params);

      console.log("✅ User.findBrokers returned:", rows?.length, "users");
      return rows;
    } catch (error) {
      console.error("❌ Error in User.findBrokers:", error.message);
      throw error;
    }
  },

  findByRolesWithBrokerType: async (roles, brokerType = null) => {
    try {
      console.log(
        "🔍 User.findByRolesWithBrokerType called with roles:",
        roles,
        "brokerType:",
        brokerType
      );

      if (!Array.isArray(roles) || roles.length === 0) {
        throw new Error("roles array is required");
      }

      // Check if we're looking for brokers and need to filter by broker_type
      const hasBrokerRoles = roles.some(
        (role) => role === "internal_broker" || role === "external_broker"
      );

      // Create placeholders for the roles array
      const placeholders = roles.map(() => "?").join(",");
      const params = [...roles];

      let query = `SELECT 
            u.id, 
            CONCAT(u.first_name, " ", u.last_name) AS full_name, 
            u.email, 
            u.profile_picture AS profile_pic, 
            u.role, 
            b.broker_type,
            u.privilege_tier, 
            u.last_message_time,
            u.created_at
         FROM users u
         LEFT JOIN broker_profiles b ON u.id = b.user_id
         WHERE u.role IN (${placeholders}) 
           AND u.status = 'active'`;

      // Add broker_type filter if specified and we're looking for brokers
      if (brokerType && hasBrokerRoles) {
        // More complex query to include non-brokers when filtering by broker type
        query = `SELECT 
            u.id, 
            CONCAT(u.first_name, " ", u.last_name) AS full_name, 
            u.email, 
            u.profile_picture AS profile_pic, 
            u.role, 
            b.broker_type,
            u.privilege_tier, 
            u.last_message_time,
            u.created_at
         FROM users u
         LEFT JOIN broker_profiles b ON u.id = b.user_id
         WHERE u.status = 'active'
           AND (
             (u.role IN ('internal_broker', 'external_broker') AND b.broker_type = ?)
             OR 
             (u.role NOT IN ('internal_broker', 'external_broker') AND u.role IN (${placeholders}))
           )`;
        
        params.unshift(brokerType);
      }

      query += " ORDER BY u.first_name, u.last_name";

      console.log("Executing query with params:", params);
      const [rows] = await db.execute(query, params);

      console.log(
        "✅ User.findByRolesWithBrokerType returned:",
        rows?.length,
        "users"
      );
      return rows;
    } catch (error) {
      console.error(
        "❌ Error in User.findByRolesWithBrokerType:",
        error.message
      );
      throw error;
    }
  },
};

export { User };
