// backend/user-service/controllers/auth.controller.js

import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/token.js";
import db from "../../shared/db.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Simple fallback email service
const FallbackEmailService = {
  sendVerificationEmail: async () =>
    console.log(
      "📧 Email service not configured - verification email would be sent"
    ),
  sendPasswordChangeRequired: async () =>
    console.log(
      "📧 Email service not configured - password change email would be sent"
    ),
  sendSecurityAlert: async () =>
    console.log(
      "📧 Email service not configured - security alert would be sent"
    ),
};

let EmailService = FallbackEmailService;

// Function to initialize email service (will be called when needed)
const initializeEmailService = async () => {
  if (EmailService === FallbackEmailService) {
    try {
      // Use dynamic import for ES modules
      const emailModule = await import(
        "../../communication-service/utils/emailService.js"
      );
      EmailService = emailModule.default || FallbackEmailService;
      console.log("✅ Email service initialized successfully");
    } catch (error) {
      console.warn(
        "⚠️ Email service not available, using fallback:",
        error.message
      );
      EmailService = FallbackEmailService;
    }
  }
};

export const signup = async (req, res) => {
  const { firstName, lastName, username, email, password, role, broker_type } =
    req.body;

  console.log("Received signup data:", {
    firstName,
    lastName,
    username,
    email,
    role,
    broker_type,
  });

  try {
    // 1. Validation and Checks
    await initializeEmailService();

    if (!firstName || !lastName || !username || !email || !password || !role) {
      console.log("Missing fields:", {
        firstName,
        lastName,
        username,
        email,
        role,
      });
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be 8+ chars" });

    // Check if user already exists (even unverified ones)
    const existingUser = await User.findByEmail(email);
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    let allowedRoles = ["user", "broker", "seller", "buyer", "renter"];
    let finalBrokerType = null;

    // Enhanced role permissions
    if (req.user) {
      if (req.user.role === "admin" || req.user.role === "super_admin") {
        allowedRoles = allowedRoles.concat([
          "admin",
          "support_agent",
          "support_lead",
        ]);
      }
      if (
        req.user.role === "support_admin" ||
        req.user.role === "super_admin"
      ) {
        allowedRoles = allowedRoles.concat(["support_admin"]);
      }
    }

    // 🚨 FIXED: Proper broker type handling
    if (role === "broker") {
      // For public signup (no req.user), default to 'external'
      if (!req.user) {
        finalBrokerType = "external";
      } 
      // For admin creation, validate the provided broker_type
      else {
        if (!broker_type || !["internal", "external"].includes(broker_type)) {
          return res
            .status(400)
            .json({
              message: "Invalid broker type. Must be 'internal' or 'external'",
            });
        }
        finalBrokerType = broker_type;
      }
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Invalid role for registration" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🚨 CRITICAL CHANGE: For public signup, don't create user in DB yet
    if (!req.user) {
      // 1. Prepare Verification Token
      const emailVerificationToken = crypto.randomBytes(32).toString("hex");
      const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const emailVerificationExpires = expiryDate
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      // 2. Create a temporary pending registration record instead of actual user
      await createPendingRegistration(
        firstName,
        lastName,
        username,
        email,
        hashedPassword,
        role,
        finalBrokerType,
        emailVerificationToken,
        emailVerificationExpires
      );

      // 3. Send verification email
      await EmailService.sendVerificationEmail(
        { email, fullName: `${firstName} ${lastName}` },
        emailVerificationToken
      );

      // 4. Final Response for Public Signup
      return res.status(201).json({
        success: true,
        message:
          "Registration initiated. Please check your email to verify your account and complete registration.",
        requiresVerification: true,
      });
    } else {
      // --- ADMIN CREATION LOGIC (No changes needed, auto-verified) ---
      const isEmailVerified = 1;

      // Create user immediately for admin-created users
      const newUserResult = await User.create(
        firstName,
        lastName,
        username,
        email,
        hashedPassword,
        role,
        finalBrokerType,
        isEmailVerified,
        null, // No token needed for admin-created, verified user
        null // No expiry needed for admin-created, verified user
      );
      const newUserId = newUserResult.insertId;

      const createdUser = await User.findById(newUserId);

      // Admin created user response:
      generateToken(createdUser, res);
      return res.status(201).json({
        ...createdUser,
        password: undefined,
        token: req.cookies?.jwt,
        message: "User created successfully",
      });
    }
  } catch (error) {
    // This catch block handles:
    // 1. Database errors
    // 2. Validation errors
    // 3. EmailService errors
    console.error("signup error details:", error);
    
    // If email fails, delete any pending registration that might have been created
    if (!req.user) {
      try {
        await deletePendingRegistration(email);
      } catch (deleteError) {
        console.error("Error cleaning up pending registration:", deleteError);
      }
    }
    
    res
      .status(500)
      .json({ message: "Internal Server Error", details: error.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("User-Agent");

  try {
    // Initialize email service if needed
    await initializeEmailService();

    const user = await User.findByUsername(username);
    if (!user) {
      await logFailedLoginAttempt(
        null,
        username,
        ip,
        userAgent,
        "User not found"
      );
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if account is locked
    const isLocked = await User.isAccountLocked(user.id);
    if (isLocked) {
      return res.status(423).json({
        message:
          "Account temporarily locked due to too many failed attempts. Try again in 30 minutes.",
      });
    }

    // Check email verification (STRICTER VERSION)
    if (!user.is_email_verified && !user.verified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in. Check your inbox for the verification link.",
        requiresVerification: true,
        email: user.email,
      });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Handle failed login attempt
      const { locked } = await User.handleFailedLogin(user.id);

      await logFailedLoginAttempt(
        user.id,
        username,
        ip,
        userAgent,
        "Invalid password"
      );

      if (locked) {
        // Send security alert for account lock
        try {
          await EmailService.sendSecurityAlert({
            type: "Account Locked Due to Failed Login Attempts",
            severity: "high",
            description: `Account ${user.email} locked after multiple failed login attempts from IP ${ip}`,
            ip,
            userAgent,
            actionTaken: "Account locked for 30 minutes",
            timestamp: new Date(),
          });
        } catch (emailError) {
          console.error("Failed to send security alert:", emailError);
        }
      }

      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Reset login attempts on successful login
    await User.resetLoginAttempts(user.id);

    // Check if password change is required for internal employees
    const internalRoles = [
      "admin",
      "support_admin",
      "support_lead",
      "support_agent",
      "broker",
    ];
    const isInternalEmployee =
      internalRoles.includes(user.role) && user.broker_type !== "external";

    if (isInternalEmployee && user.password_change_required) {
      const tempToken = generateToken(
        {
          userId: user.id,
          requiresPasswordChange: true,
        },
        res,
        "1h" // 1 hour expiry for password change
      );

      // Send password change required email
      try {
        await EmailService.sendPasswordChangeRequired({
          email: user.email,
          fullName: `${user.first_name} ${user.last_name}`,
        });
      } catch (emailError) {
        console.error("Failed to send password change email:", emailError);
      }

      return res.status(200).json({
        success: true,
        requiresPasswordChange: true,
        tempToken,
        message: "Password change required before accessing dashboard",
      });
    }

    // Generate regular token for successful login - FIXED: Don't pass the entire user object
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      broker_type: user.broker_type,
      privilege_tier: user.privilege_tier
    }, res);

    // Update last login time
    await User.updateLastLogin(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`,
        username: user.username,
        email: user.email,
        role: user.role,
        broker_type: user.broker_type,
        profile_picture: user.profile_picture,
        is_email_verified: user.is_email_verified || user.verified,
        privilege_tier: user.privilege_tier,
        // Add privilege info separately to avoid circular dependency
        privileges: await getPrivilegeInfo(user)
      },
    });
  } catch (error) {
    console.error("login error:", error.message);
    console.error("login error stack:", error.stack);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Helper function to get privilege info without circular dependency
async function getPrivilegeInfo(user) {
  try {
    const privilegeService = await import('../services/privilege.service.js');
    return privilegeService.default.getBasicPrivilegeInfo(user);
  } catch (error) {
    console.error("Error getting privilege info:", error);
    return {
      can_list_directly: ['internal_broker', 'external_broker', 'admin', 'super_admin'].includes(user.role),
      can_make_requests: ['seller', 'landlord'].includes(user.role),
      features: []
    };
  }
}

// NEW: Updated Email verification endpoint
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // 🚨 CRITICAL CHANGE: Find in pending registrations instead of users
    const pendingRegistration = await getPendingRegistrationByToken(token);
    if (!pendingRegistration) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // 🚨 CRITICAL CHANGE: Create the actual user account now
    const newUserResult = await User.create(
      pendingRegistration.first_name,
      pendingRegistration.last_name,
      pendingRegistration.username,
      pendingRegistration.email,
      pendingRegistration.password,
      pendingRegistration.role,
      pendingRegistration.broker_type,
      1, // is_email_verified = 1 (verified)
      null, // Clear token
      null  // Clear expiry
    );

    // Delete the pending registration
    await deletePendingRegistration(pendingRegistration.email);

    // Generate session token and log the user in automatically
    const newUser = await User.findById(newUserResult.insertId);
    const authToken = generateToken(newUser, res);

    res.json({
      success: true,
      message:
        "Email verified successfully! Your account has been created and you have been automatically logged in.",
      token: authToken,
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        fullName: `${newUser.first_name} ${newUser.last_name}`,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        broker_type: newUser.broker_type,
        profile_picture: newUser.profile_picture,
        is_email_verified: true,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during email verification",
    });
  }
};

// NEW: Updated Web verification endpoint
export const verifyEmailWeb = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect(
        `${process.env.CLIENT_URL}/verification-failed?reason=missing_token`
      );
    }

    // 🚨 CRITICAL CHANGE: Find in pending registrations instead of users
    const pendingRegistration = await getPendingRegistrationByToken(token);
    if (!pendingRegistration) {
      return res.redirect(
        `${process.env.CLIENT_URL}/verification-failed?reason=invalid_or_expired`
      );
    }

    // 🚨 CRITICAL CHANGE: Create the actual user account now
    const newUserResult = await User.create(
      pendingRegistration.first_name,
      pendingRegistration.last_name,
      pendingRegistration.username,
      pendingRegistration.email,
      pendingRegistration.password,
      pendingRegistration.role,
      pendingRegistration.broker_type,
      1, // is_email_verified = 1 (verified)
      null, // Clear token
      null  // Clear expiry
    );

    // Delete the pending registration
    await deletePendingRegistration(pendingRegistration.email);

    // Generate session token
    const newUser = await User.findById(newUserResult.insertId);
    generateToken(newUser, res);

    // Redirect to success page or dashboard
    return res.redirect(`${process.env.CLIENT_URL}/dashboard?verified=true`);
  } catch (error) {
    console.error("Email verification error:", error);
    return res.redirect(
      `${process.env.CLIENT_URL}/verification-failed?reason=server_error`
    );
  }
};

// NEW: Change required password for employees
export const changeRequiredPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and reset security flags
    await User.updatePassword(userId, hashedPassword);

    res.json({
      success: true,
      message:
        "Password changed successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during password change",
    });
  }
};

// NEW: Resend verification email
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Initialize email service if needed
    await initializeEmailService();

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    if (user.is_email_verified || user.verified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const emailVerificationExpires = expiryDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    await User.setVerificationToken(
      user.id,
      emailVerificationToken,
      emailVerificationExpires
    );

    // Send verification email
    try {
      await EmailService.sendVerificationEmail(
        { email: user.email, fullName: `${user.first_name} ${user.last_name}` },
        emailVerificationToken
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }

    res.json({
      success: true,
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Helper function to log security events
async function logFailedLoginAttempt(
  userId,
  identifier,
  ip,
  userAgent,
  reason
) {
  try {
    await db.query(
      `INSERT INTO security_logs 
        (type, severity, description, ip_address, user_agent, user_id, action_taken) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "failed_login",
        "medium",
        `Failed login attempt for ${identifier}: ${reason}`,
        ip,
        userAgent,
        userId,
        "Login attempt logged",
      ]
    );
  } catch (error) {
    console.error("Error logging failed login attempt:", error);
  }
}

// Keep all your existing functions below (they should work as-is)
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
    if (!firstName || !lastName || !username)
      return res.status(400).json({ message: "All fields required" });

    const success = await User.updateProfile(
      req.user.id,
      firstName,
      lastName,
      username
    );
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

    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [newUsername, userId]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already taken" });
    }

    if (!/^[a-zA-Z0-9]{3,20}$/.test(newUsername)) {
      return res
        .status(400)
        .json({
          message: "Username must be 3-20 characters, alphanumeric only",
        });
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
        user: { ...updatedUser, password: undefined },
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("updateUsername error:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
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
      return res
        .status(400)
        .json({ message: "User ID and new role are required" });
    }

    // Validate role
    const validRoles = [
      "user",
      "broker",
      "seller",
      "buyer",
      "renter",
      "admin",
      "support_agent",
      "support_lead",
      "support_admin",
    ];
    if (!validRoles.includes(newRole)) {
      return res
        .status(400)
        .json({
          message: `Invalid role. Valid roles are: ${validRoles.join(", ")}`,
        });
    }

    // Restrict admin and support roles to admin users only
    if (
      ["admin", "support_agent", "support_lead", "support_admin"].includes(
        newRole
      ) &&
      !["admin", "super_admin"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Only admins can assign admin or support roles" });
    }

    let setBrokerType = null;
    if (newRole === "broker") {
      if (!broker_type || !["internal", "external"].includes(broker_type)) {
        setBrokerType = "external";
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
      console.log(
        `✅ Role updated for user ${userId} to ${newRole}${
          setBrokerType ? ` (broker_type: ${setBrokerType})` : ""
        }`
      );
      res.status(200).json({
        message: "User role updated successfully",
        user: { ...updatedUser, password: undefined },
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("updateRole error:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    console.log("📤 Upload profile picture request received");
    console.log("📤 Request files:", req.files);

    if (!req.files || !req.files.profilePicture) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const profilePicture = req.files.profilePicture;

    if (!profilePicture.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "Please upload an image file" });
    }

    if (profilePicture.size > 5 * 1024 * 1024) {
      return res
        .status(400)
        .json({ message: "File size should be less than 5MB" });
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = profilePicture.name.split(".").pop();
    const fileName = `profile-${req.user.id}-${uniqueSuffix}.${fileExtension}`;

    const uploadPath = path.join(
      process.cwd(),
      "Uploads",
      "profile-pictures",
      fileName
    );

    const uploadDir = path.dirname(uploadPath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await profilePicture.mv(uploadPath);

    if (!fs.existsSync(uploadPath)) {
      throw new Error("File was not created successfully");
    }

    const profilePictureUrl = `http://localhost:5000/Uploads/profile-pictures/${fileName}`;

    const [result] = await db.query(
      "UPDATE users SET profile_picture = ? WHERE id = ?",
      [profilePictureUrl, req.user.id]
    );

    if (result.affectedRows > 0) {
      const updatedUser = await User.findById(req.user.id);
      res.status(200).json({
        message: "Profile picture updated successfully",
        profilePictureUrl,
        user: { ...updatedUser, password: undefined },
      });
    } else {
      res.status(400).json({ message: "Failed to update profile picture" });
    }
  } catch (error) {
    console.error("uploadProfilePicture error:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const adminCreateUser = async (req, res) => {
  const { firstName, lastName, username, email, password, role, broker_type } =
    req.body;

  console.log("Admin creating user:", {
    firstName,
    lastName,
    username,
    email,
    role,
    broker_type,
  });

  try {
    if (!firstName || !lastName || !username || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be 8+ chars" });

    const existingUser = await User.findByEmail(email);
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Define client roles vs employee roles
    const clientRoles = ["user", "buyer", "seller", "renter", "broker"]; // brokers can be external (clients)
    const employeeRoles = [
      "admin",
      "support_agent",
      "support_lead",
      "support_admin",
    ];

    let finalBrokerType = null;

    // Handle broker type
    if (role === "broker") {
      if (!broker_type || !["internal", "external"].includes(broker_type)) {
        return res
          .status(400)
          .json({
            message: "Invalid broker type. Must be 'internal' or 'external'",
          });
      }
      finalBrokerType = broker_type;

      // If creating an internal broker, it's an employee role
      if (broker_type === "internal") {
        // No warning for internal brokers (employees)
      } else {
        // External brokers are clients - show warning
        return res.status(200).json({
          warning: true,
          message:
            "You are creating a client role (External Broker). Are you sure you want to proceed?",
          role: role,
          userType: "client",
        });
      }
    }

    // Check if it's a client role and show warning
    if (clientRoles.includes(role) && role !== "broker") {
      return res.status(200).json({
        warning: true,
        message: `You are creating a client role (${role}). Clients should typically register themselves. Are you sure you want to proceed?`,
        role: role,
        userType: "client",
      });
    }

    // If employee role or confirmed client creation, proceed
    const hashedPassword = await bcrypt.hash(password, 10);

    // Call the updated User.create with full parameters, setting verified to 1 and token/expiry to null.
    const newUserResult = await User.create(
      firstName,
      lastName,
      username,
      email,
      hashedPassword,
      role,
      finalBrokerType,
      1, // is_email_verified = 1 (Auto-verify)
      null,
      null
    );
    const newUserId = newUserResult.insertId;

    // Auto-verify admin-created users by setting email verification
    await User.verifyEmail(newUserId);

    // For internal employees, require password change on first login
    if (
      employeeRoles.includes(role) ||
      (role === "broker" && finalBrokerType === "internal")
    ) {
      await User.requirePasswordChange(newUserId);
    }

    const createdUser = await User.findById(newUserId);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: { ...createdUser, password: undefined },
      warning: false,
    });
  } catch (error) {
    console.error("adminCreateUser error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", details: error.message });
  }
};

// Helper function to create pending registration
async function createPendingRegistration(
  firstName,
  lastName,
  username,
  email,
  hashedPassword,
  role,
  broker_type,
  emailVerificationToken,
  emailVerificationExpires
) {
  try {
    // Create a pending_registrations table or use a temporary storage
    // For now, we'll store in a separate table
    await db.query(
      `INSERT INTO pending_registrations 
       (first_name, last_name, username, email, password, role, broker_type, 
        email_verification_token, email_verification_expires, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        firstName,
        lastName,
        username,
        email,
        hashedPassword,
        role,
        broker_type,
        emailVerificationToken,
        emailVerificationExpires,
      ]
    );
    console.log("✅ Pending registration created for:", email);
  } catch (error) {
    console.error("Error creating pending registration:", error);
    throw error;
  }
}

// Helper function to delete pending registration
async function deletePendingRegistration(email) {
  try {
    await db.query("DELETE FROM pending_registrations WHERE email = ?", [email]);
    console.log("✅ Pending registration deleted for:", email);
  } catch (error) {
    console.error("Error deleting pending registration:", error);
  }
}

// Helper function to get pending registration by token
async function getPendingRegistrationByToken(token) {
  try {
    const [rows] = await db.query(
      `SELECT * FROM pending_registrations 
       WHERE email_verification_token = ? 
       AND email_verification_expires > NOW()`,
      [token]
    );
    return rows[0];
  } catch (error) {
    console.error("Error getting pending registration:", error);
    return null;
  }
}