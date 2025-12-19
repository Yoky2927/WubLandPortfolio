// backend/user-service/controllers/auth.controller.js

import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/token.js";
import db from "../../shared/db.js";
import path from "path";
import fs from "fs";

export const signup = async (req, res) => {
  const { firstName, lastName, username, email, password, role, broker_type } = req.body;

  console.log('Received signup data:', { firstName, lastName, username, email, password, role, broker_type });

  try {
    if (!firstName || !lastName || !username || !email || !password || !role) {
      console.log('Missing fields:', { firstName, lastName, username, email, password, role });
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) return res.status(400).json({ message: "Password must be 8+ chars" });

    const existingUser = await User.findByEmail(email);
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    let allowedRoles = ['user', 'broker', 'seller', 'buyer', 'renter'];
    let finalBrokerType = null;

    if (req.user && req.user.role === 'admin') {
      allowedRoles = allowedRoles.concat(['admin', 'support_agent']);
      if (role === 'broker') {
        if (!broker_type || !['internal', 'external'].includes(broker_type)) {
          return res.status(400).json({ message: "Invalid broker type. Must be 'internal' or 'external'" });
        }
        finalBrokerType = broker_type;
      }
    } else {
      if (role === 'broker') {
        finalBrokerType = 'external';
      }
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Invalid role for registration' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = await User.create(firstName, lastName, username, email, hashedPassword, role, finalBrokerType);
    const createdUser = await User.findById(newUserId);

    generateToken(createdUser, res);
    res.status(201).json({ ...createdUser, password: undefined, token: req.cookies.jwt });
  } catch (error) {
    console.error("signup error details:", error);
    res.status(500).json({ message: "Internal Server Error", details: error.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findByUsername(username);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user, res);

    res.status(200).json({
      ...user,
      password: undefined,
      token: token
    });
  } catch (error) {
    console.error("login error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("logout error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  const { firstName, lastName, username } = req.body;
  try {
    if (!firstName || !lastName || !username) return res.status(400).json({ message: "All fields required" });

    const success = await User.updateProfile(req.user.id, firstName, lastName, username);
    if (!success) return res.status(400).json({ message: "Update failed" });

    const updatedUser = await User.findById(req.user.id);
    res.status(200).json({ ...updatedUser, password: undefined });
  } catch (err) {
    console.error("updateProfile error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateUsername = async (req, res) => {
  try {
    const { newUsername } = req.body;
    const userId = req.user.id;

    if (!newUsername) {
      return res.status(400).json({ message: "New username is required" });
    }

    const [existingUser] = await db.query("SELECT id FROM users WHERE username = ? AND id != ?", [
      newUsername,
      userId
    ]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already taken" });
    }

    if (!/^[a-zA-Z0-9]{3,20}$/.test(newUsername)) {
      return res.status(400).json({ message: "Username must be 3-20 characters, alphanumeric only" });
    }

    const [result] = await db.query(
        "UPDATE users SET username = ? WHERE id = ?",
        [newUsername, userId]
    );

    if (result.affectedRows > 0) {
      const updatedUser = await User.findById(userId);
      console.log(`✅ Username updated for user ${userId} to ${newUsername}`);
      res.status(200).json({
        message: "Username updated successfully",
        user: { ...updatedUser, password: undefined }
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("updateUsername error:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    res.status(200).json({ ...req.user, password: undefined });
  } catch (err) {
    console.error("checkAuth error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { userId, newRole, broker_type } = req.body;

    // Validate input
    if (!userId || !newRole) {
      return res.status(400).json({ message: "User ID and new role are required" });
    }

    // Validate role
    const validRoles = ['user', 'broker', 'seller', 'buyer', 'renter', 'admin', 'support_agent'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ message: `Invalid role. Valid roles are: ${validRoles.join(', ')}` });
    }

    // Restrict admin and support_agent roles to admin users only
    if (['admin', 'support_agent'].includes(newRole) && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can assign admin or support_agent roles" });
    }

    let setBrokerType = null;
    if (newRole === 'broker') {
        if (!broker_type || !['internal', 'external'].includes(broker_type)) {
            setBrokerType = 'external';
        } else {
            setBrokerType = broker_type;
        }
    }

    // Update role and broker_type in database
    const [result] = await db.query(
        "UPDATE users SET role = ?, broker_type = ? WHERE id = ?",
        [newRole, setBrokerType, userId]
    );

    if (result.affectedRows > 0) {
      const updatedUser = await User.findById(userId);
      console.log(`✅ Role updated for user ${userId} to ${newRole}${setBrokerType ? ` (broker_type: ${setBrokerType})` : ''}`);
      res.status(200).json({
        message: "User role updated successfully",
        user: { ...updatedUser, password: undefined }
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("updateRole error:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    console.log('📤 Upload profile picture request received');
    console.log('📤 Request files:', req.files);

    if (!req.files || !req.files.profilePicture) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const profilePicture = req.files.profilePicture;

    if (!profilePicture.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: "Please upload an image file" });
    }

    if (profilePicture.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "File size should be less than 5MB" });
    }

    // FIX: Define fileName before using it
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = profilePicture.name.split('.').pop();
    const fileName = `profile-${req.user.id}-${uniqueSuffix}.${fileExtension}`;

    const uploadPath = path.join(process.cwd(), 'Uploads', 'profile-pictures', fileName);

    const uploadDir = path.dirname(uploadPath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await profilePicture.mv(uploadPath);

    if (!fs.existsSync(uploadPath)) {
      throw new Error('File was not created successfully');
    }

    const profilePictureUrl = `http://localhost:5000/Uploads/profile-pictures/${fileName}`;

    const [result] = await db.query(
        "UPDATE users SET profile_picture = ? WHERE id = ?",
        [profilePictureUrl, req.user.id]
    );

    if (result.affectedRows > 0) {
      // FIX: Use the correct User model method to get updated user
      const updatedUser = await User.findById(req.user.id);
      res.status(200).json({
        message: "Profile picture updated successfully",
        profilePictureUrl,
        user: { ...updatedUser, password: undefined }
      });
    } else {
      res.status(400).json({ message: "Failed to update profile picture" });
    }
  } catch (error) {
    console.error("uploadProfilePicture error:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const adminCreateUser = async (req, res) => {
  const { firstName, lastName, username, email, password, role, broker_type } = req.body;

  console.log('Admin creating user:', { firstName, lastName, username, email, password, role, broker_type });

  try {
    if (!firstName || !lastName || !username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) return res.status(400).json({ message: "Password must be 8+ chars" });

    const existingUser = await User.findByEmail(email);
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    // Define client roles vs employee roles
    const clientRoles = ['user', 'buyer', 'seller', 'renter', 'broker']; // brokers can be external (clients)
    const employeeRoles = ['admin', 'support_agent'];
    
    let finalBrokerType = null;

    // Handle broker type
    if (role === 'broker') {
      if (!broker_type || !['internal', 'external'].includes(broker_type)) {
        return res.status(400).json({ message: "Invalid broker type. Must be 'internal' or 'external'" });
      }
      finalBrokerType = broker_type;
      
      // If creating an internal broker, it's an employee role
      if (broker_type === 'internal') {
        // No warning for internal brokers (employees)
      } else {
        // External brokers are clients - show warning
        return res.status(200).json({ 
          warning: true,
          message: "You are creating a client role (External Broker). Are you sure you want to proceed?",
          role: role,
          userType: "client"
        });
      }
    }

    // Check if it's a client role and show warning
    if (clientRoles.includes(role) && role !== 'broker') {
      return res.status(200).json({ 
        warning: true,
        message: `You are creating a client role (${role}). Clients should typically register themselves. Are you sure you want to proceed?`,
        role: role,
        userType: "client"
      });
    }

    // If employee role or confirmed client creation, proceed
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = await User.create(firstName, lastName, username, email, hashedPassword, role, finalBrokerType);
    const createdUser = await User.findById(newUserId);

    res.status(201).json({ 
      success: true,
      message: "User created successfully",
      user: { ...createdUser, password: undefined },
      warning: false
    });
  } catch (error) {
    console.error("adminCreateUser error:", error);
    res.status(500).json({ message: "Internal Server Error", details: error.message });
  }
};