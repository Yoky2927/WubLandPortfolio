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
    console.log("findByUsername result:", rows[0]); // Log the query result
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.query(
      `
    SELECT id, first_name, last_name, username, email, password, role, 
           broker_type, profile_picture, status, created_at, verified
    FROM users 
    WHERE id = ?
  `,
      [id]
    );
    console.log("findById result:", rows[0]);
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
    verified = 0
  ) => {
    const [result] = await db.query(
      `INSERT INTO users (first_name, last_name, username, email, password, role, broker_type, verified, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        firstName,
        lastName,
        username,
        email,
        hashedPassword,
        role,
        broker_type,
        verified,
      ]
    );
    return result.insertId;
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
};
