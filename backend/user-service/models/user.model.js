import db from "../../shared/db.js";

export const User = {
  findByEmail: async (email) => {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  },

  findByUsername: async (username) => {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.query(`
      SELECT id, first_name, last_name, username, email, password, role, 
             broker_type, profile_picture, status, created_at, verified,
             is_email_verified, email_verification_token, email_verification_expires,
             password_change_required, last_password_change, login_attempts, lock_until,
             privilege_tier, feature_flags, last_login, last_activity
      FROM users 
      WHERE id = ?
    `, [id]);
    return rows[0];
  },

  create: async (
    firstName,
    lastName,
    username,
    email,
    hashedPassword,
    role,
    broker_type = null,
    is_email_verified = 0,
    emailVerificationToken = null,
    emailVerificationExpires = null
  ) => {
    const [result] = await db.query(
      `INSERT INTO users (first_name, last_name, username, email, password, role, broker_type, 
                          is_email_verified, verified, email_verification_token, email_verification_expires, 
                          privilege_tier, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'basic', NOW())`,
      [
        firstName,
        lastName,
        username,
        email,
        hashedPassword,
        role,
        broker_type,
        is_email_verified,
        is_email_verified,
        emailVerificationToken,
        emailVerificationExpires,
      ]
    );
    return { insertId: result.insertId, emailVerificationToken };
  },

  // Add missing methods for support service
  findByRole: async (role) => {
    const [rows] = await db.query(
      "SELECT id, first_name, last_name, username, email, role, broker_type, status, profile_picture FROM users WHERE role = ?",
      [role]
    );
    return rows;
  },

  findByUsername: async (username) => {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    return rows[0];
  },

  updateLastActivity: async (userId) => {
    const [result] = await db.query(
      "UPDATE users SET last_activity = NOW() WHERE id = ?",
      [userId]
    );
    return result.affectedRows > 0;
  },

  // Keep all existing methods from your current file...
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

  findByVerificationToken: async (token) => {
    const [rows] = await db.query(
      `SELECT * FROM users 
       WHERE email_verification_token = ? 
       AND email_verification_expires > NOW()`,
      [token]
    );
    return rows[0];
  },

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
  
  // Add to User model in user.model.js
updateLastLogin: async (userId) => {
  const [result] = await db.query(
    `UPDATE users 
     SET last_login = NOW(), last_activity = NOW() 
     WHERE id = ?`,
    [userId]
  );
  return result.affectedRows > 0;
},

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

  requirePasswordChange: async (userId) => {
    const [result] = await db.query(
      `UPDATE users SET password_change_required = TRUE WHERE id = ?`,
      [userId]
    );
    return result.affectedRows > 0;
  }
};