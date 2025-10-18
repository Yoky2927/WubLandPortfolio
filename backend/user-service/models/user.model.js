// backend/user-service/models/user.model.js
import db from "../../shared/db.js";

export const User = {
  findByEmail: async (email) => {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  },

  findByUsername: async (username) => {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    console.log("findByUsername result:", rows[0]);
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `
    SELECT id, first_name, last_name, username, email, password, role, 
           broker_type, profile_picture, status, created_at, verified,
           is_email_verified, email_verification_token, email_verification_expires,
           password_change_required, last_password_change, login_attempts, lock_until
    FROM users 
    WHERE id = ?
  `,
      [id]
    );
    console.log("findById result:", rows[0]);
    return rows[0];
  },

  // 💡 FIXED: Updated 'create' to handle verification token and expiry in a single DB call,
  // and to return the new ID and token.
  create: async (
    firstName,
    lastName,
    username,
    email,
    hashedPassword,
    role,
    broker_type = null,
    is_email_verified = 0, // 0 for public signup, 1 for admin
    emailVerificationToken = null, // NEW PARAMETER
    emailVerificationExpires = null // NEW PARAMETER
  ) => {
    const [result] = await db.query(
      // NOTE: We now explicitly set is_email_verified, verified, token, and expiry.
      `INSERT INTO users (first_name, last_name, username, email, password, role, broker_type, is_email_verified, verified, email_verification_token, email_verification_expires, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
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
    // Return an object with the ID and token
    return { insertId: result.insertId, emailVerificationToken };
  },

  updateProfile: async (id, firstName, lastName, username) => {
    const [result] = await db.query(
      "UPDATE users SET first_name = ?, last_name = ?, username = ? WHERE id = ?",
      [firstName, lastName, username, id]
    );
    return result.affectedRows > 0;
  },

  // ADD THIS METHOD FOR PROFILE PICTURE UPDATES
  updateProfilePicture: async (id, profilePictureUrl) => {
    const [result] = await db.query(
      "UPDATE users SET profile_picture = ? WHERE id = ?",
      [profilePictureUrl, id]
    );
    return result.affectedRows > 0;
  },

  // NEW: Email verification methods
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

  // NEW: Password and security methods
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

  handleFailedLogin: async (userId) => {
    // Get current attempts
    const user = await User.findById(userId);
    const newAttempts = (user.login_attempts || 0) + 1;
    
    let lockUntil = null;
    if (newAttempts >= 5) {
      // Lock for 30 minutes
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