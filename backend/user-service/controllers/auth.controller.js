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

// Helper to get broker_type from broker_profiles
async function getBrokerType(userId) {
  try {
    const [brokerProfiles] = await db.query(
      "SELECT broker_type FROM broker_profiles WHERE user_id = ?",
      [userId]
    );
    return brokerProfiles.length > 0 ? brokerProfiles[0].broker_type : null;
  } catch (error) {
    console.error("Error getting broker type:", error);
    return null;
  }
}

// Helper to check if user is internal employee (uses broker_type from broker_profiles)
async function isInternalEmployee(userId, role) {
  if (!["admin", "support_admin", "support_lead", "support_agent", "broker"].includes(role)) {
    return false;
  }

  // For brokers, check broker_type from broker_profiles
  if (role === "broker") {
    const brokerType = await getBrokerType(userId);
    return brokerType === "internal";
  }

  // For other internal roles, they're always internal
  return true;
}

export const signup = async (req, res) => {
  const { firstName, lastName, username, email, password, role, broker_type } =
    req.body;

  console.log("📝 Received signup data:", {
    firstName,
    lastName,
    username,
    email,
    role,
    broker_type,
  });

  try {
    await initializeEmailService();

    if (!firstName || !lastName || !username || !email || !password || !role) {
      console.log("❌ Missing fields:", {
        firstName,
        lastName,
        username,
        email,
        role,
      });
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters long" });

    const existingUser = await User.findByEmail(email);
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Map frontend role names to backend database role names
    const roleMapping = {
      // Client roles (for self-registration)
      "broker": "external_broker",      // Frontend "broker" = backend "external_broker"
      "external_broker": "external_broker", // Direct mapping if frontend uses this
      "seller": "seller",
      "buyer": "buyer",
      "landlord": "landlord",           // Changed from "leaser" to "landlord"
      "renter": "renter",
      "user": "user"
    };

    // Admin-only roles (not available for self-registration)
    const adminOnlyRoles = [
      "super_admin", "admin", "support_admin",
      "support_lead", "support_agent", "internal_broker"
    ];

    let finalRole = roleMapping[role];
    let finalBrokerType = null;

    console.log("🔍 Role mapping:", { frontendRole: role, backendRole: finalRole });

    // If role not found in mapping and we're not an admin creating users
    if (!finalRole && !req.user) {
      return res.status(400).json({
        message: "Invalid role selected. Please choose a valid account type."
      });
    }

    // For admin-created users, allow any valid role
    if (req.user) {
      // Check if admin is allowed to create this role
      const isAdminOrSuperAdmin = ["admin", "super_admin"].includes(req.user.role);
      const isSupportAdmin = req.user.role === "support_admin";

      if (isAdminOrSuperAdmin) {
        // Admin/Super admin can create any role
        finalRole = role; // Use the role directly
      } else if (isSupportAdmin) {
        // Support admin can only create support roles
        const allowedSupportRoles = ["support_agent", "support_lead"];
        if (allowedSupportRoles.includes(role)) {
          finalRole = role;
        } else {
          return res.status(403).json({
            message: "You are not authorized to create this role type."
          });
        }
      } else {
        return res.status(403).json({
          message: "You are not authorized to create users."
        });
      }
    }

    // Handle broker type logic
    if (finalRole === "external_broker" || finalRole === "internal_broker") {
      if (!req.user) {
        // Self-registration: always external broker
        finalBrokerType = "external";
        finalRole = "external_broker"; // Ensure correct role
      } else {
        // Admin creating broker
        if (!broker_type || !["internal", "external"].includes(broker_type)) {
          return res.status(400).json({
            message: "Invalid broker type. Must be 'internal' or 'external'",
          });
        }
        finalBrokerType = broker_type;
        finalRole = broker_type === "internal" ? "internal_broker" : "external_broker";
      }
    } else if (finalRole === "broker") {
      // Handle legacy "broker" role name
      if (!req.user) {
        finalBrokerType = "external";
        finalRole = "external_broker";
      } else {
        if (!broker_type || !["internal", "external"].includes(broker_type)) {
          return res.status(400).json({
            message: "Invalid broker type. Must be 'internal' or 'external'",
          });
        }
        finalBrokerType = broker_type;
        finalRole = broker_type === "internal" ? "internal_broker" : "external_broker";
      }
    }

    console.log("✅ Final role after processing:", finalRole);
    console.log("✅ Final broker type:", finalBrokerType);

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!req.user) {
      // SELF-REGISTRATION (Public signup)
      console.log("👤 Processing self-registration...");

      const emailVerificationToken = crypto.randomBytes(32).toString("hex");
      const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const emailVerificationExpires = expiryDate
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      await createPendingRegistration(
        firstName,
        lastName,
        username,
        email,
        hashedPassword,
        finalRole, // Use the mapped role
        finalBrokerType,
        emailVerificationToken,
        emailVerificationExpires
      );

      await EmailService.sendVerificationEmail(
        { email, fullName: `${firstName} ${lastName}` },
        emailVerificationToken
      );

      console.log("✅ Self-registration initiated for:", email);

      return res.status(201).json({
        success: true,
        message:
          "Registration initiated. Please check your email to verify your account and complete registration.",
        requiresVerification: true,
      });
    } else {
      // ADMIN CREATING USER
      console.log("👔 Admin creating user...");

      const isEmailVerified = 1;

      // Create user WITHOUT broker_type in users table
      const newUserResult = await User.create(
        firstName,
        lastName,
        username,
        email,
        hashedPassword,
        finalRole, // Use the final role
        null, // Don't pass broker_type to users table
        isEmailVerified,
        null,
        null
      );
      const newUserId = newUserResult.insertId;

      // If user is a broker, create broker profile
      if ((finalRole === "external_broker" || finalRole === "internal_broker") && finalBrokerType) {
        await db.query(
          `INSERT INTO broker_profiles (user_id, broker_type, created_at) 
           VALUES (?, ?, NOW())`,
          [newUserId, finalBrokerType]
        );
        console.log("✅ Broker profile created:", { userId: newUserId, brokerType: finalBrokerType });
      }

      const createdUser = await User.findById(newUserId);

      // Generate token WITHOUT broker_type
      generateToken({
        id: createdUser.id,
        username: createdUser.username,
        role: createdUser.role,
        privilege_tier: createdUser.privilege_tier || 'basic'
      }, res);

      console.log("✅ User created successfully:", createdUser.username);

      return res.status(201).json({
        ...createdUser,
        password: undefined,
        token: req.cookies?.jwt,
        message: "User created successfully",
      });
    }
  } catch (error) {
    console.error("❌ signup error details:", error);
    console.error("❌ Error stack:", error.stack);

    if (!req.user) {
      try {
        await deletePendingRegistration(email);
        console.log("✅ Cleaned up pending registration for:", email);
      } catch (deleteError) {
        console.error("❌ Error cleaning up pending registration:", deleteError);
      }
    }

    res.status(500).json({
      message: "Internal Server Error",
      details: error.message
    });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("User-Agent");

  console.log("🔍 LOGIN ATTEMPT:", { username, ip, userAgent });

  try {
    await initializeEmailService();

    const user = await User.findByUsername(username);
    console.log("🔍 User found:", user ? {
      id: user.id,
      username: user.username,
      role: user.role,
      is_email_verified: user.is_email_verified,
      verified: user.verified
    } : "NOT FOUND");

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

    console.log("🔍 Checking account lock status...");
    const isLocked = await User.isAccountLocked(user.id);
    if (isLocked) {
      console.log("🔍 Account is locked for user:", user.id);
      return res.status(423).json({
        message:
          "Account temporarily locked due to too many failed attempts. Try again in 30 minutes.",
      });
    }

    console.log("🔍 Checking email verification...");
    if (!user.is_email_verified && !user.verified) {
      console.log("🔍 User email not verified");
      return res.status(403).json({
        message:
          "Please verify your email before logging in. Check your inbox for the verification link.",
        requiresVerification: true,
        email: user.email,
      });
    }

    console.log("🔍 Comparing passwords...");
    const isValid = await bcrypt.compare(password, user.password);
    console.log("🔍 Password valid?", isValid);

    if (!isValid) {
      const { locked } = await User.handleFailedLogin(user.id);
      console.log("🔍 Password invalid, locked?", locked);

      await logFailedLoginAttempt(
        user.id,
        username,
        ip,
        userAgent,
        "Invalid password"
      );

      if (locked) {
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

    await User.resetLoginAttempts(user.id);
    console.log("🔍 Login attempts reset");

    // Check if password change is required - get broker_type from broker_profiles
    console.log("🔍 Checking if internal employee...");
    console.log("🔍 User role:", user.role);
    console.log("🔍 User ID:", user.id);

    const internal = await isInternalEmployee(user.id, user.role);
    console.log("🔍 Is internal employee?", internal);
    console.log("🔍 Password change required?", user.password_change_required);

    if (internal && user.password_change_required) {
      console.log("🔍 Password change required for internal employee");
      const tempToken = generateToken(
        {
          userId: user.id,
          requiresPasswordChange: true,
        },
        res,
        "1h"
      );

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

    console.log("🔍 Generating token...");
    // Generate token WITHOUT broker_type
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      privilege_tier: user.privilege_tier
    }, res);

    // Get broker_type separately if needed
    const brokerType = await getBrokerType(user.id);
    console.log("🔍 Broker type:", brokerType);

    await User.updateLastLogin(user.id);
    console.log("🔍 Last login updated");

    console.log("🔍 LOGIN SUCCESSFUL for user:", user.username);

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
        broker_type: brokerType, // From broker_profiles
        profile_picture: user.profile_picture,
        is_email_verified: user.is_email_verified || user.verified,
        privilege_tier: user.privilege_tier,
        privileges: await getPrivilegeInfo(user)
      },
    });
  } catch (error) {
    console.error("❌ login error:", error.message);
    console.error("❌ login error stack:", error.stack);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// Helper function to get privilege info
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

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const pendingRegistration = await getPendingRegistrationByToken(token);
    if (!pendingRegistration) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Create user WITHOUT broker_type
    const newUserResult = await User.create(
      pendingRegistration.first_name,
      pendingRegistration.last_name,
      pendingRegistration.username,
      pendingRegistration.email,
      pendingRegistration.password,
      pendingRegistration.role,
      null, // Don't pass broker_type
      1,
      null,
      null
    );

    // If user is a broker, create broker profile
    if (pendingRegistration.role === "broker" && pendingRegistration.broker_type) {
      await db.query(
        `INSERT INTO broker_profiles (user_id, broker_type, created_at) 
         VALUES (?, ?, NOW())`,
        [newUserResult.insertId, pendingRegistration.broker_type]
      );
    }

    await deletePendingRegistration(pendingRegistration.email);

    const newUser = await User.findById(newUserResult.insertId);
    const authToken = generateToken(newUser, res);

    const brokerType = await getBrokerType(newUser.id);

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
        broker_type: brokerType,
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

export const verifyEmailWeb = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect(
        `${process.env.CLIENT_URL}/verification-failed?reason=missing_token`
      );
    }

    const pendingRegistration = await getPendingRegistrationByToken(token);
    if (!pendingRegistration) {
      return res.redirect(
        `${process.env.CLIENT_URL}/verification-failed?reason=invalid_or_expired`
      );
    }

    const newUserResult = await User.create(
      pendingRegistration.first_name,
      pendingRegistration.last_name,
      pendingRegistration.username,
      pendingRegistration.email,
      pendingRegistration.password,
      pendingRegistration.role,
      null,
      1,
      null,
      null
    );

    if (pendingRegistration.role === "broker" && pendingRegistration.broker_type) {
      await db.query(
        `INSERT INTO broker_profiles (user_id, broker_type, created_at) 
         VALUES (?, ?, NOW())`,
        [newUserResult.insertId, pendingRegistration.broker_type]
      );
    }

    await deletePendingRegistration(pendingRegistration.email);

    const newUser = await User.findById(newUserResult.insertId);
    generateToken(newUser, res);

    return res.redirect(`${process.env.CLIENT_URL}/dashboard?verified=true`);
  } catch (error) {
    console.error("Email verification error:", error);
    return res.redirect(
      `${process.env.CLIENT_URL}/verification-failed?reason=server_error`
    );
  }
};

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

    const hashedPassword = await bcrypt.hash(newPassword, 12);
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

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

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

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const emailVerificationExpires = expiryDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    await User.setVerificationToken(
      user.id,
      emailVerificationToken,
      emailVerificationExpires
    );

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

export const logout = (req, res) => {
  try {
    // Clear JWT cookie with explicit settings
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV !== 'development'
    });

    // Also clear any other auth cookies that might exist
    res.clearCookie('token');
    res.clearCookie('auth_token');

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
      redirect: true  // Signal frontend to redirect
    });
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
    // Get broker_type separately
    const brokerType = await getBrokerType(req.user.id);
    const userWithBrokerType = {
      ...req.user,
      broker_type: brokerType,
      password: undefined
    };
    res.status(200).json(userWithBrokerType);
  } catch (err) {
    console.error("checkAuth error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { userId, newRole, broker_type } = req.body;

    if (!userId || !newRole) {
      return res
        .status(400)
        .json({ message: "User ID and new role are required" });
    }

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

    const [result] = await db.query(
      "UPDATE users SET role = ? WHERE id = ?",
      [newRole, userId]
    );

    if (result.affectedRows > 0) {
      if (newRole === "broker" && setBrokerType) {
        await db.query(
          `INSERT INTO broker_profiles (user_id, broker_type, created_at) 
           VALUES (?, ?, NOW()) 
           ON DUPLICATE KEY UPDATE broker_type = ?`,
          [userId, setBrokerType, setBrokerType]
        );
      }

      const updatedUser = await User.findById(userId);
      console.log(
        `✅ Role updated for user ${userId} to ${newRole}${setBrokerType ? ` (broker_type: ${setBrokerType})` : ""
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
  console.log("📤 =========== UPLOAD START ===========");
  console.log("📤 Request user ID:", req.user?.id);
  console.log("📤 Request user:", req.user?.username);
  console.log("📤 Content-Type:", req.headers['content-type']);
  console.log("📤 Request has files:", !!req.files);

  try {
    // Check if middleware parsed the file
    if (!req.files || !req.files.profilePicture) {
      console.log("❌ No files received by middleware");
      console.log("❌ Available files:", req.files ? Object.keys(req.files) : 'none');
      console.log("❌ Request body keys:", Object.keys(req.body || {}));

      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please select an image file.",
        error: "FILE_NOT_RECEIVED"
      });
    }

    const profilePicture = req.files.profilePicture;
    console.log("✅ File received successfully:", {
      name: profilePicture.name,
      size: profilePicture.size,
      mimetype: profilePicture.mimetype,
      encoding: profilePicture.encoding,
      md5: profilePicture.md5
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!profilePicture.mimetype.startsWith("image/")) {
      console.log("❌ Not an image file:", profilePicture.mimetype);
      return res.status(400).json({
        success: false,
        message: "Please upload an image file (JPEG, PNG, GIF, WebP, SVG)",
        error: "INVALID_FILE_TYPE",
        receivedType: profilePicture.mimetype
      });
    }

    // Validate specific image types
    if (!allowedTypes.includes(profilePicture.mimetype.toLowerCase())) {
      console.log("❌ Unsupported image type:", profilePicture.mimetype);
      return res.status(400).json({
        success: false,
        message: "Unsupported image format. Use JPEG, PNG, GIF, WebP, or SVG.",
        error: "UNSUPPORTED_FORMAT",
        receivedType: profilePicture.mimetype
      });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (profilePicture.size > maxSize) {
      console.log("❌ File too large:", profilePicture.size, "bytes");
      return res.status(400).json({
        success: false,
        message: "File size should be less than 10MB",
        error: "FILE_TOO_LARGE",
        receivedSize: profilePicture.size,
        maxSize: maxSize
      });
    }

    if (profilePicture.size === 0) {
      console.log("❌ File is empty (0 bytes)");
      return res.status(400).json({
        success: false,
        message: "File is empty",
        error: "EMPTY_FILE"
      });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(profilePicture.name) ||
      (profilePicture.mimetype === 'image/jpeg' ? '.jpg' :
        profilePicture.mimetype === 'image/png' ? '.png' :
          profilePicture.mimetype === 'image/gif' ? '.gif' :
            profilePicture.mimetype === 'image/webp' ? '.webp' : '.jpg');

    const safeFileName = profilePicture.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `profile-${req.user.id}-${uniqueSuffix}${fileExtension}`;

    console.log("📤 Generated filename:", fileName);

    // Define upload path
    const uploadPath = path.join(
      process.cwd(),
      "Uploads",
      "profile-pictures",
      fileName
    );

    // Create directory if it doesn't exist
    const uploadDir = path.dirname(uploadPath);
    if (!fs.existsSync(uploadDir)) {
      console.log("📁 Creating upload directory:", uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("✅ Upload directory created");
    }

    // Save file using mv() method
    console.log("📤 Saving file to:", uploadPath);

    try {
      await profilePicture.mv(uploadPath);
      console.log("✅ File saved successfully");
    } catch (mvError) {
      console.error("❌ File move error:", mvError.message);
      console.error("❌ Move error stack:", mvError.stack);
      return res.status(500).json({
        success: false,
        message: "Failed to save file",
        error: "FILE_SAVE_ERROR",
        details: mvError.message
      });
    }

    // Verify file was created
    if (!fs.existsSync(uploadPath)) {
      console.error("❌ File was not created at:", uploadPath);
      return res.status(500).json({
        success: false,
        message: "File was not saved properly",
        error: "FILE_NOT_CREATED"
      });
    }

    // Get file stats to confirm
    const stats = fs.statSync(uploadPath);
    console.log("✅ File verified:", {
      size: stats.size,
      created: stats.birthtime,
      path: uploadPath
    });

    // Create URL (use relative path)
    const profilePictureUrl = `/Uploads/profile-pictures/${fileName}`;
    const fullUrl = `http://localhost:5000${profilePictureUrl}`;
    console.log("✅ File URL:", profilePictureUrl);
    console.log("✅ Full URL:", fullUrl);

    // Update database
    console.log("📤 Updating database for user:", req.user.id);

    try {
      const [result] = await db.query(
        "UPDATE users SET profile_picture = ? WHERE id = ?",
        [profilePictureUrl, req.user.id]
      );

      console.log("📤 Database result:", {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      });

      if (result.affectedRows > 0) {
        // Get updated user
        const [updatedUser] = await db.query(
          `SELECT id, first_name, last_name, username, email, role, 
                  profile_picture, created_at, status, verified 
           FROM users WHERE id = ?`,
          [req.user.id]
        );

        console.log("✅ Database updated successfully");
        console.log("✅ Updated user profile picture:", updatedUser[0]?.profile_picture);

        // SUCCESS RESPONSE
        return res.status(200).json({
          success: true,
          message: "Profile picture updated successfully",
          profilePictureUrl: profilePictureUrl,
          fullUrl: fullUrl,
          user: updatedUser[0]
        });

      } else {
        console.log("❌ Database update failed - no rows affected");
        return res.status(400).json({
          success: false,
          message: "Failed to update profile picture in database",
          error: "DATABASE_UPDATE_FAILED"
        });
      }
    } catch (dbError) {
      console.error("❌ Database error:", dbError.message);
      console.error("❌ Database error stack:", dbError.stack);
      return res.status(500).json({
        success: false,
        message: "Database error while updating profile",
        error: "DATABASE_ERROR",
        details: dbError.message
      });
    }

  } catch (error) {
    console.error("❌ uploadProfilePicture CRITICAL error:", error.message);
    console.error("❌ Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Internal server error during upload",
      error: "INTERNAL_ERROR",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    console.log("📤 =========== UPLOAD END ===========");
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

    const clientRoles = ["user", "buyer", "seller", "renter", "broker"];
    const employeeRoles = [
      "admin",
      "support_agent",
      "support_lead",
      "support_admin",
    ];

    let finalBrokerType = null;

    if (role === "broker") {
      if (!broker_type || !["internal", "external"].includes(broker_type)) {
        return res
          .status(400)
          .json({
            message: "Invalid broker type. Must be 'internal' or 'external'",
          });
      }
      finalBrokerType = broker_type;

      if (broker_type === "internal") {
        // No warning for internal brokers
      } else {
        return res.status(200).json({
          warning: true,
          message:
            "You are creating a client role (External Broker). Are you sure you want to proceed?",
          role: role,
          userType: "client",
        });
      }
    }

    if (clientRoles.includes(role) && role !== "broker") {
      return res.status(200).json({
        warning: true,
        message: `You are creating a client role (${role}). Clients should typically register themselves. Are you sure you want to proceed?`,
        role: role,
        userType: "client",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user WITHOUT broker_type
    const newUserResult = await User.create(
      firstName,
      lastName,
      username,
      email,
      hashedPassword,
      role,
      null, // Don't pass broker_type
      1,
      null,
      null
    );
    const newUserId = newUserResult.insertId;

    await User.verifyEmail(newUserId);

    // If user is a broker, create broker profile
    if (role === "broker" && finalBrokerType) {
      await db.query(
        `INSERT INTO broker_profiles (user_id, broker_type, created_at) 
         VALUES (?, ?, NOW())`,
        [newUserId, finalBrokerType]
      );
    }

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

async function deletePendingRegistration(email) {
  try {
    await db.query("DELETE FROM pending_registrations WHERE email = ?", [email]);
    console.log("✅ Pending registration deleted for:", email);
  } catch (error) {
    console.error("Error deleting pending registration:", error);
  }
}

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