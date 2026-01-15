import db from "../../shared/db.js";
import crypto from 'crypto';

export const User = {
  // ========== FIND METHODS ==========
  findByEmail: async (email) => {
    const [rows] = await db.query(`
      SELECT id, first_name, last_name, username, email, password, role, 
             profile_picture, status, created_at, verified,
             is_email_verified, email_verification_token, email_verification_expires,
             password_change_required, last_password_change, login_attempts, lock_until,
             privilege_tier, feature_flags, last_login, last_activity
      FROM users 
      WHERE email = ?
    `, [email]);
    return rows[0];
  },

  findByUsername: async (username) => {
    const [rows] = await db.query(`
      SELECT id, first_name, last_name, username, email, password, role, 
             profile_picture, status, created_at, verified,
             is_email_verified, email_verification_token, email_verification_expires,
             password_change_required, last_password_change, login_attempts, lock_until,
             privilege_tier, feature_flags, last_login, last_activity
      FROM users 
      WHERE username = ?
    `, [username]);
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.query(`
      SELECT id, first_name, last_name, username, email, password, role, 
             profile_picture, status, created_at, verified,
             is_email_verified, email_verification_token, email_verification_expires,
             password_change_required, last_password_change, login_attempts, lock_until,
             privilege_tier, feature_flags, last_login, last_activity
      FROM users 
      WHERE id = ?
    `, [id]);
    return rows[0];
  },

  findByRole: async (role) => {
    const [rows] = await db.query(
      "SELECT id, first_name, last_name, username, email, role, broker_type, status, profile_picture FROM users WHERE role = ?",
      [role]
    );
    return rows;
  },

  findByVerificationToken: async (token) => {
    const [rows] = await db.query(
      `SELECT * FROM users 
       WHERE email_verification_token = ? 
       AND email_verification_expires > NOW()`,
      [token]
    );
    return rows[0];
  },

  // ========== CREATE METHODS ==========
  create: async (
    firstName,
    lastName,
    username,
    email,
    hashedPassword,
    role,
    privilege_tier = 'basic',
    status = 'active',
    phone_number = null,
    is_email_verified = 0,
    emailVerificationToken = null,
    emailVerificationExpires = null
  ) => {
    const [result] = await db.query(
      `INSERT INTO users 
       (first_name, last_name, username, email, password, role, 
        privilege_tier, status, phone_number,
        is_email_verified, verified, email_verification_token, email_verification_expires, 
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        firstName,
        lastName,
        username,
        email,
        hashedPassword,
        role,
        privilege_tier,
        status,
        phone_number,
        is_email_verified,
        is_email_verified, // For verified field
        emailVerificationToken,
        emailVerificationExpires,
      ]
    );
    return { insertId: result.insertId, emailVerificationToken };
  },

  createBrokerProfile: async (userId, brokerType) => {
    try {
      const [result] = await db.query(
        `INSERT INTO broker_profiles 
         (user_id, broker_type, created_at, updated_at) 
         VALUES (?, ?, NOW(), NOW())`,
        [userId, brokerType]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error creating broker profile:", error);
      return false;
    }
  },

  // ========== UPDATE METHODS ==========
  updateProfile: async (id, firstName, lastName, username) => {
    const [result] = await db.query(
      "UPDATE users SET first_name = ?, last_name = ?, username = ? WHERE id = ?",
      [firstName, lastName, username, id]
    );
    return result.affectedRows > 0;
  },

  updateProfilePicture: async (id, profilePictureUrl) => {
    const [result] = await db.query(
      "UPDATE users SET profile_picture = ? WHERE id = ?",
      [profilePictureUrl, id]
    );
    return result.affectedRows > 0;
  },

  updateUser: async (id, updates) => {
    // Dynamically build the update query
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const values = fields.map(field => updates[field]);
    values.push(id);

    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const [result] = await db.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  },

  updateLastLogin: async (userId) => {
    const [result] = await db.query(
      `UPDATE users 
       SET last_login = NOW(), last_activity = NOW() 
       WHERE id = ?`,
      [userId]
    );
    return result.affectedRows > 0;
  },

  updateLastActivity: async (userId) => {
    const [result] = await db.query(
      "UPDATE users SET last_activity = NOW() WHERE id = ?",
      [userId]
    );
    return result.affectedRows > 0;
  },

  // ========== VERIFICATION METHODS ==========
  verifyEmail: async (userId) => {
    const [result] = await db.query(
      `UPDATE users 
       SET is_email_verified = TRUE, 
           email_verification_token = NULL, 
           email_verification_expires = NULL,
           verified = 1 
       WHERE id = ?`,
      [userId]
    );
    return result.affectedRows > 0;
  },

  setVerificationToken: async (userId, token, expiresAt) => {
    const [result] = await db.query(
      `UPDATE users 
       SET email_verification_token = ?, 
           email_verification_expires = ? 
       WHERE id = ?`,
      [token, expiresAt, userId]
    );
    return result.affectedRows > 0;
  },

  // ========== PASSWORD METHODS ==========
  updatePassword: async (userId, hashedPassword) => {
    const [result] = await db.query(
      `UPDATE users 
       SET password = ?, 
           password_change_required = FALSE,
           last_password_change = NOW(),
           login_attempts = 0,
           lock_until = NULL 
       WHERE id = ?`,
      [hashedPassword, userId]
    );
    return result.affectedRows > 0;
  },

  requirePasswordChange: async (userId) => {
    const [result] = await db.query(
      `UPDATE users SET password_change_required = TRUE WHERE id = ?`,
      [userId]
    );
    return result.affectedRows > 0;
  },

  // ========== SECURITY METHODS ==========
  handleFailedLogin: async (userId) => {
    const user = await User.findById(userId);
    const newAttempts = (user.login_attempts || 0) + 1;

    let lockUntil = null;
    if (newAttempts >= 5) {
      lockUntil = new Date(Date.now() + 30 * 60 * 1000);
    }

    const [result] = await db.query(
      `UPDATE users 
       SET login_attempts = ?, lock_until = ? 
       WHERE id = ?`,
      [newAttempts, lockUntil, userId]
    );

    return { locked: !!lockUntil, lockUntil };
  },

  resetLoginAttempts: async (userId) => {
    const [result] = await db.query(
      `UPDATE users 
       SET login_attempts = 0, lock_until = NULL 
       WHERE id = ?`,
      [userId]
    );
    return result.affectedRows > 0;
  },

  isAccountLocked: async (userId) => {
    const [rows] = await db.query(
      `SELECT lock_until FROM users 
       WHERE id = ? AND lock_until > NOW()`,
      [userId]
    );
    return rows.length > 0;
  },

  // ========== BROKER METHODS ==========
  findBrokerProfile: async (userId) => {
    const [rows] = await db.query(
      "SELECT * FROM broker_profiles WHERE user_id = ?",
      [userId]
    );
    return rows[0];
  },

  findByIdWithBroker: async (id) => {
    const [rows] = await db.query(`
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
    return rows[0];
  },

  // ========== LIST METHODS ==========
  getAllUsers: async () => {
    const [rows] = await db.query(`
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
      ORDER BY u.created_at DESC
    `);
    return rows;
  },

  // ========== ACCOUNT STATUS METHODS ==========
  // Check if user can login based on status
  canLogin: async (userId) => {
    const [rows] = await db.query(
      `SELECT status, is_email_verified, verified, role 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) return { canLogin: false, reason: 'User not found' };

    const user = rows[0];
    const clientRoles = ['user', 'buyer', 'seller', 'renter', 'landlord'];

    // Check suspended status
    if (user.status === 'suspended') {
      return {
        canLogin: false,
        reason: 'Account suspended',
        status: 'suspended',
        contact_support: true
      };
    }

    // Check inactive status
    if (user.status === 'inactive') {
      return {
        canLogin: false,
        reason: 'Account inactive',
        status: 'inactive',
        contact_support: true,
        reactivation_required: true
      };
    }

    // Check email verification for clients
    if (clientRoles.includes(user.role)) {
      const isVerified = user.is_email_verified || user.verified;
      if (!isVerified) {
        return {
          canLogin: false,
          reason: 'Email verification required',
          status: 'unverified',
          requires_verification: true
        };
      }
    }

    return { canLogin: true, status: user.status || 'active' };
  },

  // Get user status with details
  getStatusDetails: async (userId) => {
    const [rows] = await db.query(
      `SELECT status, is_email_verified, verified, role, 
              created_at, last_login, login_attempts, lock_until,
              password_change_required, last_password_change
       FROM users WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) return null;

    const user = rows[0];
    const clientRoles = ['user', 'buyer', 'seller', 'renter', 'landlord'];

    return {
      account_status: user.status || 'active',
      is_email_verified: user.is_email_verified || user.verified,
      is_locked: user.lock_until && new Date(user.lock_until) > new Date(),
      lock_until: user.lock_until,
      login_attempts: user.login_attempts || 0,
      password_change_required: user.password_change_required || false,
      last_password_change: user.last_password_change,
      last_login: user.last_login,
      created_at: user.created_at,
      account_age_days: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)),
      requires_email_verification: clientRoles.includes(user.role) && !(user.is_email_verified || user.verified)
    };
  },

  // Update user status
  updateStatus: async (userId, newStatus, reason = '', adminId = null) => {
    const validStatuses = ['active', 'inactive', 'suspended'];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const [result] = await db.query(
      `UPDATE users 
       SET status = ?, 
           updated_at = NOW(),
           last_modified_by_user_id = ?
       WHERE id = ?`,
      [newStatus, adminId, userId]
    );

    if (result.affectedRows > 0) {
      // Log the status change
      await db.query(
        `INSERT INTO security_logs 
         (type, severity, description, user_id, action_taken) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          'account_status_change',
          newStatus === 'suspended' ? 'high' : 'medium',
          `Account status changed to ${newStatus}: ${reason}`,
          userId,
          `Status updated to ${newStatus}`
        ]
      );
    }

    return result.affectedRows > 0;
  },

  // Resend verification email for unverified clients
  resendVerification: async (userId) => {
    const [rows] = await db.query(
      `SELECT email, first_name, last_name, is_email_verified, verified, role 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = rows[0];
    const clientRoles = ['user', 'buyer', 'seller', 'renter', 'landlord'];

    // Only resend for client roles that need verification
    if (!clientRoles.includes(user.role) || (user.is_email_verified || user.verified)) {
      return {
        success: false,
        message: 'User does not require email verification'
      };
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const emailVerificationExpires = expiryDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    await db.query(
      `UPDATE users 
       SET email_verification_token = ?, 
           email_verification_expires = ? 
       WHERE id = ?`,
      [emailVerificationToken, emailVerificationExpires, userId]
    );

    // Note: You'll need to implement actual email sending here
    // This is just a placeholder - you should use your email service
    console.log(`📧 Verification email would be sent to: ${user.email}`);
    console.log(`📧 Token: ${emailVerificationToken}`);

    return {
      success: true,
      message: 'Verification email sent successfully'
    };
  }
  // ========== END ACCOUNT STATUS METHODS ==========
};