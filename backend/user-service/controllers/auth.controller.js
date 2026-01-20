// backend/user-service/controllers/auth.controller.js

import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/token.js";
import db from "../../shared/db.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import axios from "axios"; // Added for inter-service communication
import jwt from 'jsonwebtoken';
import { verificationStyles, svgIcons } from '../utils/email-verification-styles.js';

// Email Service interface - will call Communication-Service API instead of direct import
class EmailServiceClient {
  constructor() {
    // FIX: Change from 5003 to 5001 (your communication-service port)
    this.baseURL = process.env.COMMUNICATION_SERVICE_URL || "http://localhost:5001";
    console.log(`📧 EmailServiceClient configured with baseURL: ${this.baseURL}`);
  }

  async sendVerificationEmail(emailData, token) {
    try {
      console.log(`📧 Attempting to send verification email to: ${emailData.email}`);
      console.log(`📧 Calling: ${this.baseURL}/api/email/send-verification`);

      const response = await axios.post(
        `${this.baseURL}/api/email/send-verification`,
        {
          email: emailData.email,
          fullName: emailData.fullName,
          verificationToken: token  // ← CHANGE THIS from 'token' to 'verificationToken'
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Internal-Service-Token': process.env.INTERNAL_SERVICE_TOKEN || 'communication-service-secret-12345'
          }
        }
      );

      console.log(`✅ Email API response:`, response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to send verification email via API:", error.message);
      if (error.response) {
        console.error("❌ Response status:", error.response.status);
        console.error("❌ Response data:", error.response.data);
      }
      console.error("❌ URL attempted:", `${this.baseURL}/api/email/send-verification`);
      return null;
    }
  }

  async sendPasswordChangeRequired(emailData) {
    try {
      console.log(`📧 Attempting to send password change email to: ${emailData.email}`);

      const response = await axios.post(
        `${this.baseURL}/api/email/send-password-change`,
        {
          email: emailData.email,
          fullName: emailData.fullName
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Internal-Service-Token': process.env.INTERNAL_SERVICE_TOKEN || 'communication-service-secret-12345'
          }
        }
      );

      console.log(`✅ Password change email sent:`, response.data);
      return response.data;
    } catch (error) {
      console.warn("Failed to send password change email via API:", error.message);
      return null;
    }
  }

  async sendSecurityAlert(alertData) {
    try {
      console.log(`📧 Attempting to send security alert to: ${alertData.email}`);

      const response = await axios.post(
        `${this.baseURL}/api/email/send-security-alert`,
        alertData,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Internal-Service-Token': process.env.INTERNAL_SERVICE_TOKEN || 'communication-service-secret-12345'
          }
        }
      );

      console.log(`✅ Security alert sent:`, response.data);
      return response.data;
    } catch (error) {
      console.warn("Failed to send security alert via API:", error.message);
      return null;
    }
  }
}

// Initialize email service client
const emailService = new EmailServiceClient();

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

// Helper function to get resource usage via API calls instead of direct DB queries
async function getCurrentResourceUsage(userId, resourceType) {
  switch (resourceType) {
    case 'listings':
      // Call Property-Service API
      try {
        const response = await axios.get(
          `${process.env.PROPERTY_SERVICE_URL || "http://localhost:5002"}/api/properties/user/${userId}/count`
        );
        return response.data.count || 0;
      } catch (error) {
        console.warn("Failed to get listing count via API:", error.message);
        return 0;
      }

    case 'messages':
      // Call Communication-Service API
      try {
        const response = await axios.get(
          `${process.env.COMMUNICATION_SERVICE_URL || "http://localhost:5003"}/api/messages/user/${userId}/count`
        );
        return response.data.count || 0;
      } catch (error) {
        console.warn("Failed to get message count via API:", error.message);
        return 0;
      }

    default:
      return 0;
  }
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

      // Use API call instead of direct import
      await emailService.sendVerificationEmail(
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
    const user = await User.findByUsername(username);
    console.log("🔍 User found:", user ? {
      id: user.id,
      username: user.username,
      role: user.role,
      is_email_verified: user.is_email_verified,
      verified: user.verified,
      password_change_required: user.password_change_required,
      status: user.status
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

    // ========== ACCOUNT STATUS CHECKS ==========
    console.log("🔍 Checking account status...");

    // 1. Check if account is suspended
    if (user.status === 'suspended') {
      console.log("🔴 Account suspended for user:", user.id);
      return res.status(403).json({
        success: false,
        message: "Account suspended. Please contact support.",
        account_status: 'suspended',
        status_details: {
          status: 'suspended',
          reason: 'Account suspended by administrator',
          contact_support: true,
          support_email: 'support@wubland.com'
        },
        user_info: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      });
    }

    // 2. Check if account is inactive
    if (user.status === 'inactive') {
      console.log("🔴 Account inactive for user:", user.id);
      return res.status(403).json({
        success: false,
        message: "Account inactive. Please contact support to reactivate.",
        account_status: 'inactive',
        status_details: {
          status: 'inactive',
          reason: 'Account has been deactivated',
          contact_support: true,
          reactivation_required: true,
          support_email: 'support@wubland.com'
        },
        user_info: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      });
    }

    // 3. Check email verification for CLIENT roles only
    // 3. Check email verification for CLIENT roles only
    const clientRoles = ['user', 'buyer', 'seller', 'renter', 'landlord'];
    if (clientRoles.includes(user.role)) {
      // For clients, check if they're verified
      const isVerified = user.is_email_verified === 1;

      if (!isVerified) {
        console.log("🔴 Client account not verified:", user.id);
        return res.status(403).json({
          success: false,
          message: "Please verify your email before logging in. Check your inbox for the verification link.",
          account_status: 'unverified',
          status_details: {
            status: 'unverified',
            reason: 'Email verification required',
            requires_verification: true,
            verification_type: 'email',
            can_resend: true
          },
          user_info: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
          },
          requiresVerification: true,
          email: user.email,
          role: user.role
        });
      }
    }

    // ========== PASSWORD CHANGE CHECK ==========
    console.log("🔍 Checking password change requirement:", user.password_change_required);

    // Check ALL admin-created users (not just certain roles)
    // Since we're setting password_change_required for all admin-created users
    if (user.password_change_required === 1) {
      console.log("🔴 Password change required for user (admin-created)");

      // Create special token for password change
      const changePasswordToken = jwt.sign(
        {
          userId: user.id,
          requiresPasswordChange: true,
          email: user.email,
          initialLogin: true,
          type: 'password_change'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        success: true,
        requiresPasswordChange: true,
        changePasswordToken: changePasswordToken,
        message: "Password change required before accessing dashboard",
        status_details: {
          status: 'password_change_required',
          reason: 'Admin-created account requires password change',
          requires_password_change: true,
          token_expires_in: '1 hour'
        },
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          // Add verification status for frontend
          is_verified: user.is_email_verified,
          requires_email_verification: user.role === 'buyer' || user.role === 'seller' || user.role === 'renter' || user.role === 'landlord' || user.role === 'user'
        }
      });
    }

    // ========== NORMAL LOGIN ==========
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
          await emailService.sendSecurityAlert({
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

    // Reset login attempts
    await User.resetLoginAttempts(user.id);
    console.log("🔍 Login attempts reset");

    // Generate normal token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      privilege_tier: user.privilege_tier,
      verified: user.verified,
      status: user.status,
      password_change_required: user.password_change_required
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
        broker_type: brokerType,
        profile_picture: user.profile_picture,
        is_email_verified: user.is_email_verified || user.verified,
        verified: user.verified,
        privilege_tier: user.privilege_tier,
        status: user.status,
        password_change_required: user.password_change_required,
        created_by_user_id: user.created_by_user_id,
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
      'basic', // privilege_tier
      'active', // status
      null, // phone_number
      isEmailVerified,
      verified, // verified flag
      null, // emailVerificationToken
      null, // emailVerificationExpires
      null  // verification_status = NULL (not pending)
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

// Main verification function with new design
// In your auth.controller.js - REPLACE the existing verifyEmailWeb function with this:

export const verifyEmailWeb = async (req, res) => {
  try {
    const { token } = req.query;
    console.log('🔍 verifyEmailWeb - Token received:', token);

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed - WUBLAND</title>
          <style>
            ${verificationStyles.common}
            ${verificationStyles.error}
          </style>
        </head>
        <body>
          <!-- Floating decorative elements -->
          <div class="floating-element" style="width: 180px; height: 180px; top: 10%; left: 5%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.03), rgba(251, 191, 36, 0.01)); border-radius: 50%;"></div>
          <div class="floating-element" style="width: 120px; height: 120px; top: 20%; right: 8%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.02), rgba(251, 191, 36, 0.005)); border-radius: 30px;"></div>
          <div class="floating-element" style="width: 100px; height: 100px; bottom: 15%; left: 10%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.03), rgba(251, 191, 36, 0.01)); border-radius: 40px;"></div>
          
          <div class="main-container">
            <div class="content-card">
              <div class="icon-wrapper">
                <div class="icon-circle"></div>
                ${svgIcons.error}
              </div>
              
              <h1>Missing Verification Link</h1>
              
              <p class="subtitle">
                No verification token was found. Please use the link from the verification email we sent you.
              </p>
              
              <div class="spacer-md"></div>
              
              <a href="http://localhost:5173/login-register" class="action-button">
                <span>Go to Login</span>
                ${svgIcons.arrowRight}
              </a>
              
              <div class="footer-info">
                <div class="brand">WUBLAND</div>
                <p>Need help? Contact us at support@wubland.com</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Check users table first
    const [users] = await db.query(
      "SELECT id, email, first_name, last_name, email_verification_expires, is_email_verified FROM users WHERE email_verification_token = ?",
      [token]
    );

    // If not found in users, check pending_registrations
    let user = null;
    let fromPending = false;
    let userData = null;

    if (users.length > 0) {
      user = users[0];
      console.log('🔍 verifyEmailWeb - User found in users table:', {
        id: user.id,
        email: user.email,
        is_email_verified: user.is_email_verified,
        expires: user.email_verification_expires
      });
    } else {
      const [pending] = await db.query(
        "SELECT * FROM pending_registrations WHERE email_verification_token = ?",
        [token]
      );
      if (pending.length > 0) {
        userData = pending[0];
        user = {
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email_verification_expires: userData.email_verification_expires
        };
        fromPending = true;
        console.log('🔍 verifyEmailWeb - User found in pending_registrations:', {
          email: user.email,
          first_name: user.first_name,
          expires: user.email_verification_expires
        });
      }
    }

    if (!user) {
      console.log('🔍 verifyEmailWeb - No user found with token');
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Token - WUBLAND</title>
          <style>
            ${verificationStyles.common}
            ${verificationStyles.error}
          </style>
        </head>
        <body>
          <!-- Floating decorative elements -->
          <div class="floating-element" style="width: 160px; height: 160px; top: 12%; left: 7%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.03), rgba(251, 191, 36, 0.01)); border-radius: 50%;"></div>
          <div class="floating-element" style="width: 140px; height: 140px; bottom: 18%; right: 6%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.02), rgba(251, 191, 36, 0.005)); border-radius: 35px;"></div>
          
          <div class="main-container">
            <div class="content-card">
              <div class="icon-wrapper">
                <div class="icon-circle"></div>
                ${svgIcons.search}
              </div>
              
              <h1>Invalid Verification Link</h1>
              
              <p class="subtitle">
                This verification link is invalid or has already been used. Please request a new verification email from your account settings.
              </p>
              
              <div class="spacer-md"></div>
              
              <a href="http://localhost:5173/login-register" class="action-button">
                <span>Request New Link</span>
                ${svgIcons.arrowRight}
              </a>
              
              <div class="footer-info">
                <div class="brand">WUBLAND</div>
                <p>Verification links are valid for 24 hours only</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Check if already verified (for users table only)
    if (!fromPending && user.is_email_verified === 1) {
      console.log('🔍 verifyEmailWeb - User already verified');
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Already Verified - WUBLAND</title>
          <style>
            ${verificationStyles.common}
          </style>
        </head>
        <body>
          <!-- Floating decorative elements -->
          <div class="floating-element" style="width: 200px; height: 200px; top: 8%; left: 6%; background: linear-gradient(135deg, rgba(34, 197, 94, 0.03), rgba(21, 128, 61, 0.01)); border-radius: 50%;"></div>
          <div class="floating-element" style="width: 120px; height: 120px; bottom: 20%; right: 8%; background: linear-gradient(135deg, rgba(34, 197, 94, 0.02), rgba(21, 128, 61, 0.005)); border-radius: 30px;"></div>
          
          <div class="main-container">
            <div class="content-card">
              <div class="icon-wrapper">
                <div class="icon-circle"></div>
                ${svgIcons.success}
              </div>
              
              <h1>Already Verified</h1>
              
              <p class="subtitle">
                Your email has already been verified. You can now access all features of your WUBLAND account.
              </p>
              
              <div class="spacer-md"></div>
              
              <a href="http://localhost:5173/login-register" class="action-button">
                <span>Login to Continue</span>
                ${svgIcons.arrowRight}
              </a>
              
              <div class="footer-info">
                <div class="brand">WUBLAND</div>
                <p>Ready to manage your real estate portfolio?</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Check if token is expired
    if (user.email_verification_expires && new Date(user.email_verification_expires) < new Date()) {
      console.log('🔍 verifyEmailWeb - Token expired');
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Token Expired - WUBLAND</title>
          <style>
            ${verificationStyles.common}
          </style>
        </head>
        <body>
          <!-- Floating decorative elements -->
          <div class="floating-element" style="width: 180px; height: 180px; top: 12%; right: 5%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.03), rgba(251, 191, 36, 0.01)); border-radius: 50%;"></div>
          <div class="floating-element" style="width: 140px; height: 140px; bottom: 15%; left: 8%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.02), rgba(251, 191, 36, 0.005)); border-radius: 40px;"></div>
          
          <div class="main-container">
            <div class="content-card">
              <div class="icon-wrapper">
                <div class="icon-circle"></div>
                ${svgIcons.clock}
              </div>
              
              <h1>Verification Link Expired</h1>
              
              <p class="subtitle">
                This verification link has expired. Please request a new verification email from the login page.
              </p>
              
              <div class="spacer-md"></div>
              
              <a href="http://localhost:5173/login-register" class="action-button">
                <span>Request New Link</span>
                ${svgIcons.arrowRight}
              </a>
              
              <div class="footer-info">
                <div class="brand">WUBLAND</div>
                <p>For security, verification links expire after 24 hours</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Process verification based on source
    if (fromPending) {
      console.log('🔍 verifyEmailWeb - Processing pending registration...');

      const newUserResult = await User.create(
        userData.first_name, // Use userData, not pendingRegistration
        userData.last_name,
        userData.username,
        userData.email,
        userData.password,
        userData.role,
        'basic', // privilege_tier
        'active', // status
        null, // phone_number
        1, // isEmailVerified (set to 1 since we're verifying)
        0, // verified (set to 0)
        null, // emailVerificationToken
        null, // emailVerificationExpires
        null  // verification_status = NULL (not pending)
      );

      // If user is a broker, create broker profile
      if ((userData.role === "broker" || userData.role.includes("broker")) && userData.broker_type) {
        await db.query(
          `INSERT INTO broker_profiles (user_id, broker_type, created_at) 
           VALUES (?, ?, NOW())`,
          [newUserResult.insertId, userData.broker_type]
        );
      }
      // Delete from pending_registrations
      await deletePendingRegistration(userData.email);

      // Get the newly created user
      const newUser = await User.findById(newUserResult.insertId);
      const brokerType = await getBrokerType(newUser.id);

      console.log(`✅ verifyEmailWeb - Pending registration completed for: ${user.email}`);

      // SUCCESS PAGE for pending registration
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Complete - WUBLAND</title>
          <meta http-equiv="refresh" content="8;url=http://localhost:5173/login-register" />
          <style>
            ${verificationStyles.common}
            ${verificationStyles.success}
            
            @keyframes gentlePulse {
              0%, 100% { 
                transform: scale(1);
                opacity: 1;
              }
              50% { 
                transform: scale(1.02);
                opacity: 0.95;
              }
            }
            
            .content-card {
              animation: gentlePulse 3s ease-in-out infinite;
            }
          </style>
        </head>
        <body>
          <!-- Floating decorative elements -->
          <div class="floating-element" style="width: 220px; height: 220px; top: 5%; left: 4%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.04), rgba(251, 191, 36, 0.02)); border-radius: 50%;"></div>
          <div class="floating-element" style="width: 160px; height: 160px; top: 15%; right: 6%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.03), rgba(251, 191, 36, 0.01)); border-radius: 40px;"></div>
          <div class="floating-element" style="width: 140px; height: 140px; bottom: 10%; left: 7%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.02), rgba(251, 191, 36, 0.005)); border-radius: 35px;"></div>
          
          <div class="main-container">
            <div class="content-card">
              <div class="icon-wrapper">
                <div class="icon-circle"></div>
                ${svgIcons.success}
              </div>
              
              <h1>Registration Complete!</h1>
              
              <div class="user-details">
                <div class="detail-item">
                  ${svgIcons.user}
                  <span>Welcome, <span class="detail-value">${user.first_name || 'there'}</span>!</span>
                </div>
                
                <div class="detail-item">
                  ${svgIcons.email}
                  <span><span class="detail-value">${user.email}</span> is now verified</span>
                </div>
              </div>
              
              <p class="subtitle">
                Your account has been created successfully! You can now login and start using all features of WUBLAND.
              </p>
              
              <div class="redirect-message">
                <span>You'll be redirected to login in <span id="countdown" class="countdown">8</span> seconds...</span>
              </div>
              
              <div class="button-group">
                <a href="http://localhost:5173/login-register" class="action-button">
                  <span>Login Now</span>
                  ${svgIcons.arrowRight}
                </a>
                
                <a href="http://localhost:5173" class="action-button button-outline">
                  <span>Visit Homepage</span>
                </a>
              </div>
              
              <div class="footer-info">
                <div class="brand">WUBLAND</div>
                <p>Real Estate Portfolio Management Platform</p>
                <p style="margin-top: 8px; font-size: 13px; color: #d1d5db;">
                  You will be automatically redirected to login
                </p>
              </div>
            </div>
          </div>
          
          <script>
            let countdown = 8;
            const countdownElement = document.getElementById('countdown');
            
            const timer = setInterval(() => {
              countdown--;
              countdownElement.textContent = countdown;
              
              if (countdown <= 0) {
                clearInterval(timer);
                window.location.href = 'http://localhost:5173/login-register';
              }
            }, 1000);
          </script>
        </body>
        </html>
      `);
    } else {
      // Update user as verified (from users table)
      console.log('🔍 verifyEmailWeb - Updating existing user verification...');
      const [updateResult] = await db.query(
        "UPDATE users SET is_email_verified = 1, verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?",
        [user.id]
      );

      console.log(`✅ verifyEmailWeb - Email verified for user ID: ${user.id}, Rows updated: ${updateResult.affectedRows}`);

      // Get broker type for display
      const brokerType = await getBrokerType(user.id);

      // SUCCESS PAGE for existing user verification
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verified - WUBLAND</title>
          <meta http-equiv="refresh" content="8;url=http://localhost:5173/login-register" />
          <style>
            ${verificationStyles.common}
            ${verificationStyles.success}
            
            @keyframes gentlePulse {
              0%, 100% { 
                transform: scale(1);
                opacity: 1;
              }
              50% { 
                transform: scale(1.02);
                opacity: 0.95;
              }
            }
            
            .content-card {
              animation: gentlePulse 3s ease-in-out infinite;
            }
          </style>
        </head>
        <body>
          <!-- Floating decorative elements -->
          <div class="floating-element" style="width: 220px; height: 220px; top: 5%; left: 4%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.04), rgba(251, 191, 36, 0.02)); border-radius: 50%;"></div>
          <div class="floating-element" style="width: 160px; height: 160px; top: 15%; right: 6%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.03), rgba(251, 191, 36, 0.01)); border-radius: 40px;"></div>
          <div class="floating-element" style="width: 140px; height: 140px; bottom: 10%; left: 7%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.02), rgba(251, 191, 36, 0.005)); border-radius: 35px;"></div>
          
          <div class="main-container">
            <div class="content-card">
              <div class="icon-wrapper">
                <div class="icon-circle"></div>
                ${svgIcons.success}
              </div>
              
              <h1>Email Verified Successfully!</h1>
              
              <div class="user-details">
                <div class="detail-item">
                  ${svgIcons.user}
                  <span>Welcome back, <span class="detail-value">${user.first_name || 'there'}</span>!</span>
                </div>
                
                <div class="detail-item">
                  ${svgIcons.email}
                  <span><span class="detail-value">${user.email}</span> is now verified</span>
                </div>
              </div>
              
              <p class="subtitle">
                Your email verification is complete! You can now access all features of your WUBLAND account.
              </p>
              
              <div class="redirect-message">
                <span>You'll be redirected to login in <span id="countdown" class="countdown">8</span> seconds...</span>
              </div>
              
              <div class="button-group">
                <a href="http://localhost:5173/login-register" class="action-button">
                  <span>Login to Continue</span>
                  ${svgIcons.arrowRight}
                </a>
                
                <a href="http://localhost:5173" class="action-button button-outline">
                  <span>Visit Homepage</span>
                </a>
              </div>
              
              <div class="footer-info">
                <div class="brand">WUBLAND</div>
                <p>Real Estate Portfolio Management Platform</p>
                <p style="margin-top: 8px; font-size: 13px; color: #d1d5db;">
                  You will be automatically redirected to continue
                </p>
              </div>
            </div>
          </div>
          
          <script>
            let countdown = 8;
            const countdownElement = document.getElementById('countdown');
            
            const timer = setInterval(() => {
              countdown--;
              countdownElement.textContent = countdown;
              
              if (countdown <= 0) {
                clearInterval(timer);
                window.location.href = 'http://localhost:5173/login-register';
              }
            }, 1000);
          </script>
        </body>
        </html>
      `);
    }

  } catch (error) {
    console.error('❌ verifyEmailWeb - Email verification error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Server Error - WUBLAND</title>
        <style>
          ${verificationStyles.common}
          ${verificationStyles.error}
        </style>
      </head>
      <body>
        <!-- Floating decorative elements -->
        <div class="floating-element" style="width: 180px; height: 180px; top: 15%; left: 8%; background: linear-gradient(135deg, rgba(239, 68, 68, 0.03), rgba(220, 38, 38, 0.01)); border-radius: 50%;"></div>
        <div class="floating-element" style="width: 120px; height: 120px; bottom: 20%; right: 10%; background: linear-gradient(135deg, rgba(239, 68, 68, 0.02), rgba(220, 38, 38, 0.005)); border-radius: 30px;"></div>
        
        <div class="main-container">
          <div class="content-card">
            <div class="icon-wrapper">
              <div class="icon-circle"></div>
              ${svgIcons.warning}
            </div>
            
            <h1>Server Error</h1>
            
            <p class="subtitle">
              An unexpected error occurred during email verification. Our team has been notified and is working to resolve the issue.
            </p>
            
            <div class="spacer-md"></div>
            
            <a href="http://localhost:5173/login-register" class="action-button">
              <span>Return to Login</span>
              ${svgIcons.arrowRight}
            </a>
            
            <div class="footer-info">
              <div class="brand">WUBLAND</div>
              <p>Please try again in a few minutes</p>
              <p style="margin-top: 4px; font-size: 13px; color: #d1d5db;">
                For immediate assistance, contact support@wubland.com
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
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
        message: "Email is required"
      });
    }

    const db = await import("../../shared/db.js").then(mod => mod.default);

    // IMPORTANT: Check users table FIRST - this should have priority
    const [users] = await db.query(
      "SELECT id, email, first_name, last_name, email_verification_token, email_verification_expires, is_email_verified FROM users WHERE email = ?",
      [email]
    );

    const [pending] = await db.query(
      "SELECT email, first_name, last_name, email_verification_token, email_verification_expires FROM pending_registrations WHERE email = ?",
      [email]
    );

    // If user doesn't exist anywhere
    if (users.length === 0 && pending.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // IMPORTANT: Always prioritize existing user over pending registration
    let userInfo;
    let source = 'users'; // Track where user info comes from

    if (users.length > 0) {
      // User exists in users table (active or pending verification)
      userInfo = users[0];
      source = 'users';

      // If already verified
      if (userInfo.is_email_verified === 1) {
        return res.status(400).json({
          success: false,
          message: "Email already verified"
        });
      }
    } else {
      // Only use pending registration if no user exists
      userInfo = pending[0];
      source = 'pending';
    }

    // Generate NEW verification token
    const newVerificationToken = crypto.randomBytes(32).toString('hex');
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log("🔄 Generated new verification token:", newVerificationToken);
    console.log("📧 Using user info from:", source, userInfo.first_name, userInfo.last_name);

    // Update the appropriate table
    if (source === 'users') {
      await db.query(
        "UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE email = ?",
        [newVerificationToken, newExpiry, email]
      );
    } else {
      await db.query(
        "UPDATE pending_registrations SET email_verification_token = ?, email_verification_expires = ? WHERE email = ?",
        [newVerificationToken, newExpiry, email]
      );
    }

    // Send verification email with NEW token
    try {
      const response = await fetch('http://localhost:5001/api/email/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'internal-service-token': 'communication-service-secret-12345'
        },
        body: JSON.stringify({
          email: email,
          fullName: `${userInfo.first_name || 'User'} ${userInfo.last_name || ''}`.trim() || email,
          verificationToken: newVerificationToken
        })
      });

      if (response.ok) {
        console.log("✅ Resend verification email sent with NEW token");
        return res.json({
          success: true,
          message: "Verification email sent successfully"
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Email service error:", errorData);
        throw new Error(errorData.message || "Failed to send email");
      }
    } catch (emailError) {
      console.error("Email service error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again later."
      });
    }

  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend verification email"
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
  try {
    console.log('📝 Update profile request for user:', req.user.id);
    console.log('📦 Received data keys:', Object.keys(req.body));

    // Extract ALL possible fields from your frontend form
    const {
      // Personal Info (from frontend)
      full_name,
      firstName, first_name,
      lastName, last_name,
      username,
      email,
      phone, phone_number,
      phone_country_code,
      date_of_birth,
      gender,

      // Ethiopian-specific fields
      kebele_id,
      passport_number,
      nationality,
      living_abroad,

      // Contact Info
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      alternative_phone,

      // Address
      region,
      city,
      sub_city,
      woreda,
      kebele_address,
      current_address,
      address, // For backward compatibility
      postal_code,

      // Property Preferences
      preferred_regions,
      preferred_cities,
      budget_min,
      budget_max,
      currency,
      property_type,
      bedrooms,
      bathrooms,
      preferred_locations,

      // Investment preferences
      investment_purpose,
      timeline,
      financing_method,

      // Renter preferences
      rental_duration,
      family_size,
      pet_friendly,
      furnished,

      // Broker-specific fields
      broker_license_number,
      broker_license_expiry,
      tin_number,
      brokerage_firm,
      experience_years,
      commission_rate,

      // Verification Documents
      id_document,
      id_document_status,
      proof_of_income,
      proof_of_income_status,
      reference_letter,
      kebele_id_status,
      passport_document,
      broker_license_doc,
      tax_certificate,

      // Profile completion
      profile_complete,
      profile_completion_percentage,
      verification_status,
      setup_completed_at
    } = req.body;

    // Handle name variations
    let finalFirstName = first_name || firstName;
    let finalLastName = last_name || lastName;

    // If full_name is provided, split it
    if (full_name && (!finalFirstName || !finalLastName)) {
      const nameParts = full_name.trim().split(' ');
      finalFirstName = nameParts[0] || '';
      finalLastName = nameParts.slice(1).join(' ') || '';
    }

    // Basic validation
    if (!finalFirstName || !finalLastName || !username) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and username are required"
      });
    }

    // Build update object
    const updates = {
      first_name: finalFirstName,
      last_name: finalLastName,
      username: username,

      // Personal info
      phone_number: phone || phone_number,
      phone_country_code: phone_country_code || '+251',
      date_of_birth: date_of_birth,
      gender: gender,

      // Ethiopian info
      kebele_id: kebele_id,
      passport_number: passport_number,
      nationality: nationality || 'Ethiopian',
      living_abroad: living_abroad ? 1 : 0,

      // Address info
      region: region,
      city: city,
      sub_city: sub_city,
      woreda: woreda,
      kebele_address: kebele_address,
      current_address: current_address || address,
      postal_code: postal_code,

      // Contact info
      emergency_contact_name: emergency_contact_name,
      emergency_contact_phone: emergency_contact_phone,
      emergency_contact_relationship: emergency_contact_relationship,
      alternative_phone: alternative_phone,

      // Preferences - store as JSON
      preferred_regions: preferred_regions ? JSON.stringify(preferred_regions) : null,
      preferred_cities: preferred_cities ? JSON.stringify(preferred_cities) : null,
      preferred_locations: preferred_locations ? JSON.stringify(preferred_locations) : null,
      budget_min: budget_min ? parseFloat(budget_min) : null,
      budget_max: budget_max ? parseFloat(budget_max) : null,
      currency: currency || 'ETB',
      property_type: property_type,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      investment_purpose: investment_purpose,
      timeline: timeline,
      financing_method: financing_method,
      rental_duration: rental_duration,
      family_size: family_size ? parseInt(family_size) : null,
      pet_friendly: pet_friendly ? 1 : 0,
      furnished: furnished ? 1 : 0,

      // Broker info
      broker_license_number: broker_license_number,
      broker_license_expiry: broker_license_expiry,
      tin_number: tin_number,
      brokerage_firm: brokerage_firm,
      experience_years: experience_years ? parseInt(experience_years) : null,
      commission_rate: commission_rate,

      // Document status
      id_document_status: id_document_status || 'pending',
      proof_of_income_status: proof_of_income_status || 'pending',
      kebele_id_status: kebele_id_status || 'pending',

      // Profile completion
      profile_complete: profile_complete ? 1 : 0,
      profile_completion_percentage: profile_completion_percentage ? parseInt(profile_completion_percentage) : 0,
      verification_status: verification_status || 'pending',
      setup_completed_at: setup_completed_at || new Date().toISOString().slice(0, 19).replace('T', ' '),

      // Always update timestamp
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    // Clean up undefined/null values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined || updates[key] === null || updates[key] === '') {
        delete updates[key];
      }
    });

    console.log('🔄 Updates to apply:', updates);

    // Update database
    const db = await import("../../shared/db.js").then(mod => mod.default);

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Update user
      const [result] = await db.query(
        `UPDATE users SET ? WHERE id = ?`,
        [updates, req.user.id]
      );

      if (result.affectedRows === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Commit transaction
      await db.query('COMMIT');

      // Get updated user
      const [updatedUsers] = await db.query(
        `SELECT 
          id, first_name, last_name, username, email, phone_number, phone_country_code,
          date_of_birth, gender, nationality, living_abroad, kebele_id, passport_number,
          region, city, sub_city, woreda, kebele_address, current_address, postal_code,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, alternative_phone,
          preferred_regions, preferred_cities, preferred_locations,
          budget_min, budget_max, currency, property_type, bedrooms, bathrooms,
          investment_purpose, timeline, financing_method,
          rental_duration, family_size, pet_friendly, furnished,
          broker_license_number, broker_license_expiry, tin_number, brokerage_firm, experience_years, commission_rate,
          profile_complete, profile_completion_percentage, verification_status, setup_completed_at,
          profile_picture, role, status, verified, created_at, updated_at
         FROM users WHERE id = ?`,
        [req.user.id]
      );

      if (updatedUsers.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found after update"
        });
      }

      let user = updatedUsers[0];

      // Parse JSON fields
      if (user.preferred_regions) {
        try {
          user.preferred_regions = JSON.parse(user.preferred_regions);
        } catch (e) {
          user.preferred_regions = [];
        }
      }

      if (user.preferred_cities) {
        try {
          user.preferred_cities = JSON.parse(user.preferred_cities);
        } catch (e) {
          user.preferred_cities = [];
        }
      }

      if (user.preferred_locations) {
        try {
          user.preferred_locations = JSON.parse(user.preferred_locations);
        } catch (e) {
          user.preferred_locations = [];
        }
      }

      // Add full_name for frontend compatibility
      user.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      user.phone = user.phone_number;
      user.living_abroad = user.living_abroad === 1;
      user.pet_friendly = user.pet_friendly === 1;
      user.furnished = user.furnished === 1;
      user.profile_complete = user.profile_complete === 1;

      console.log('✅ Profile updated successfully for user:', req.user.id);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: user
      });

    } catch (dbError) {
      await db.query('ROLLBACK');
      throw dbError;
    }

  } catch (err) {
    console.error("❌ updateProfile error:", err.message);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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
    console.log('🔍 checkAuth called for user:', req.user.id);

    // Fetch COMPLETE user data from database including profile_picture
    const db = await import("../../shared/db.js").then(mod => mod.default);

    const [users] = await db.query(`
      SELECT 
        id, first_name, last_name, username, email, role, status,
        profile_picture, created_at, verified, is_email_verified,
        password_change_required, last_login, privilege_tier,
        phone_number, verification_status, setup_completed_at,
        profile_completion_percentage
      FROM users 
      WHERE id = ?
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // Get broker_type separately
    const brokerType = await getBrokerType(req.user.id);

    const userWithBrokerType = {
      ...user,
      broker_type: brokerType,
      password: undefined,
      // Add account status information
      account_status: {
        status: user.status || 'active',
        is_email_verified: user.is_email_verified || user.verified,
        password_change_required: user.password_change_required || false,
        last_login: user.last_login,
        account_age: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) + ' days'
      }
    };

    console.log('✅ checkAuth returning user with profile_picture:', userWithBrokerType.profile_picture);
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
  console.log("🟢 CREATE USER: Starting user creation...");

  // Get ALL possible field names
  const {
    // From frontend
    first_name, last_name, username, email, password, role,
    privilege_tier = 'basic', status = 'active', phone = '', broker_type = '',

    // Backward compatibility
    firstName, lastName
  } = req.body;

  // Use the right field names
  const finalFirstName = first_name || firstName;
  const finalLastName = last_name || lastName;
  const finalPhone = phone || '';

  console.log("🟢 CREATE USER: Data received:", {
    firstName: finalFirstName,
    lastName: finalLastName,
    username,
    email,
    role,
    privilege_tier,
    status,
    phone: finalPhone,
    broker_type,
    passwordLength: password ? password.length : 0
  });

  try {
    // ========== BASIC VALIDATION ==========
    if (!finalFirstName || !finalLastName || !username || !email || !password || !role) {
      console.log("🔴 CREATE USER: Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields: first_name, last_name, username, email, password, role"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    // ========== CHECK FOR EXISTING USER ==========
    console.log("🟢 CREATE USER: Checking for existing user...");

    // Check email
    const [existingEmail] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingEmail.length > 0) {
      console.log("🔴 CREATE USER: Email already exists");
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Check username
    const [existingUsername] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existingUsername.length > 0) {
      console.log("🔴 CREATE USER: Username already exists");
      return res.status(400).json({
        success: false,
        message: "Username already exists"
      });
    }

    console.log("🟢 CREATE USER: No existing user found");

    // ========== HANDLE CONFIRMATION FOR CLIENT ROLES ==========
    const clientRoles = ['user', 'buyer', 'seller', 'renter', 'landlord'];

    // If it's a client role and no confirmation header, return warning
    if (req.headers['x-confirm'] !== 'true' && clientRoles.includes(role)) {
      console.log("🟡 CREATE USER: Sending warning for client role");
      return res.status(200).json({
        warning: true,
        message: `You are creating a ${role}. Clients should register themselves. Proceed?`,
        role: role
      });
    }

    // ========== CREATE THE USER ==========
    console.log("🟢 CREATE USER: Creating user in database...");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🟢 CREATE USER: Password hashed");

    // Start transaction
    console.log("🟢 CREATE USER: Starting database transaction...");
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
      console.log("🟢 CREATE USER: Transaction started");

      // Define which users require password change
      const passwordChangeRoles = [
        'admin', 'support_admin', 'support_lead', 'support_agent',
        'super_admin', 'internal_broker', 'external_broker',
        'buyer', 'renter', 'seller', 'landlord', 'user'
      ];

      const shouldRequirePasswordChange = passwordChangeRoles.includes(role);

      // For email verification:
      // 1. Staff/admin roles should be marked as verified (since admin created them)
      // 2. Client roles should be unverified (need to verify their email)
      const staffRoles = [
        'super_admin', 'admin', 'support_admin', 'support_lead',
        'support_agent', 'internal_broker', 'external_broker'
      ];

      const isStaffRole = staffRoles.includes(role);
      const isClientRole = clientRoles.includes(role);

      console.log("🟢 CREATE USER: Role classification:", {
        role,
        isStaffRole,
        isClientRole,
        shouldRequirePasswordChange
      });

      // Generate email verification token for client roles
      let emailVerificationToken = null;
      let emailVerificationExpires = null;

      if (isClientRole) {
        // Generate verification token for client users
        emailVerificationToken = crypto.randomBytes(32).toString('hex');
        emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        console.log("🟢 CREATE USER: Generated verification token for client");
      }

      // INSERT USER DIRECTLY
      const [userResult] = await connection.query(
        `INSERT INTO users 
         (first_name, last_name, username, email, password, role, 
          privilege_tier, status, phone_number, 
          is_email_verified, verified, password_change_required,
          email_verification_token, email_verification_expires,
          verification_status, // Add this field
          created_by_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          finalFirstName,
          finalLastName,
          username,
          email,
          hashedPassword,
          role,
          privilege_tier,
          status,
          finalPhone,
          isStaffRole ? 1 : 0, // is_email_verified: staff=1, client=0
          isStaffRole ? 1 : 0, // verified: staff=1, client=0
          shouldRequirePasswordChange ? 1 : 0, // password_change_required
          emailVerificationToken, // email_verification_token
          emailVerificationExpires, // email_verification_expires
          null, // verification_status = NULL (not pending)
          req.user.id // created_by_user_id
        ]
      );

      const userId = userResult.insertId;
      console.log("✅ CREATE USER: User inserted with ID:", userId);
      console.log("✅ Email verification:", isStaffRole ? "Verified (staff)" : "Pending (client)");
      console.log("✅ Password change required:", shouldRequirePasswordChange);

      // If broker role, create broker profile
      if (role.includes('broker') && broker_type) {
        console.log("🟢 CREATE USER: Creating broker profile...");
        await connection.query(
          `INSERT INTO broker_profiles (user_id, broker_type, created_at, updated_at) 
           VALUES (?, ?, NOW(), NOW())`,
          [userId, broker_type]
        );
        console.log("✅ CREATE USER: Broker profile created");
      }

      // Commit transaction
      await connection.commit();
      console.log("✅ CREATE USER: Transaction committed");
      connection.release();

      // ========== GET THE CREATED USER ==========
      console.log("🟢 CREATE USER: Fetching created user...");
      const [createdUser] = await db.query(`
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
          u.is_email_verified,
          u.password_change_required,
          u.email_verification_token,
          u.email_verification_expires,
          u.created_by_user_id,
          u.privilege_tier,
          u.phone_number,
          bp.broker_type
        FROM users u
        LEFT JOIN broker_profiles bp ON u.id = bp.user_id
        WHERE u.id = ?
      `, [userId]);

      if (!createdUser || createdUser.length === 0) {
        console.log("🔴 CREATE USER: Failed to fetch created user");
        throw new Error("Failed to retrieve created user");
      }

      const user = createdUser[0];
      console.log("✅ CREATE USER: User created successfully:", user);

      // ========== SEND EMAIL FOR CLIENT USERS ==========
      if (isClientRole && emailVerificationToken) {
        try {
          // Send email via communication service
          const response = await fetch('http://localhost:5001/api/email/send-verification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'internal-service-token': 'communication-service-secret-12345'
            },
            body: JSON.stringify({
              email: user.email,
              fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
              verificationToken: emailVerificationToken
            })
          });

          if (response.ok) {
            console.log("✅ CREATE USER: Verification email sent to client");
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.warn("⚠️ CREATE USER: Failed to send verification email:", errorData);
          }
        } catch (emailError) {
          console.error("⚠️ CREATE USER: Email service error:", emailError.message);
          // Don't fail the whole process if email fails
        }
      }

      // ========== SEND SUCCESS RESPONSE ==========
      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: user,
        warning: false,
        password_change_required: shouldRequirePasswordChange,
        email_verification_sent: isClientRole,
        is_verified: isStaffRole
      });

    } catch (dbError) {
      // Rollback on error
      console.error("🔴 CREATE USER: Database error:", dbError);
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      throw dbError;
    }

  } catch (error) {
    console.error("🔴 CREATE USER: Critical error:", error);

    // Handle specific errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
        error: error.message
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: "Invalid data reference",
        error: error.message
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
      code: error.code
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword, isRequiredChange = false } = req.body;
    const userId = req.user?.id;

    console.log("🔐 CHANGE PASSWORD:", {
      userId,
      isRequiredChange,
      hasCurrentPassword: !!currentPassword
    });

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }

    // Password validation
    const passwordErrors = [];
    if (!/\d/.test(newPassword)) passwordErrors.push("at least one number");
    if (!/[A-Z]/.test(newPassword)) passwordErrors.push("at least one uppercase letter");
    if (!/[a-z]/.test(newPassword)) passwordErrors.push("at least one lowercase letter");
    if (!/[!@#$%^&*]/.test(newPassword)) passwordErrors.push("at least one special character");

    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Password must contain: ${passwordErrors.join(', ')}`
      });
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // If this is NOT a required password change (normal password change), verify current password
    if (!isRequiredChange) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required"
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect"
        });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password in database
    const db = await import("../../shared/db.js").then(mod => mod.default);
    await db.query(
      `UPDATE users 
             SET password = ?, 
                 password_change_required = FALSE,
                 last_password_change = NOW(),
                 login_attempts = 0,
                 lock_until = NULL,
                 updated_at = NOW()
             WHERE id = ?`,
      [hashedPassword, userId]
    );

    console.log("✅ Password changed successfully for user:", userId);

    // If this was a required password change, generate a proper login token
    if (isRequiredChange) {
      // Generate new login token
      const newUserData = await User.findById(userId);
      const newToken = generateToken({
        id: newUserData.id,
        username: newUserData.username,
        role: newUserData.role,
        privilege_tier: newUserData.privilege_tier || 'basic',
        verified: newUserData.verified || false,
        status: newUserData.status || 'active',
        password_change_required: false,
        created_by_user_id: newUserData.created_by_user_id
      }, res);

      // Get broker type
      const brokerType = await getBrokerType(userId);

      return res.json({
        success: true,
        message: "Password changed successfully. You are now logged in.",
        token: newToken,
        user: {
          id: newUserData.id,
          first_name: newUserData.first_name,
          last_name: newUserData.last_name,
          username: newUserData.username,
          email: newUserData.email,
          role: newUserData.role,
          broker_type: brokerType,
          verified: newUserData.verified,
          status: newUserData.status,
          password_change_required: false
        },
        redirect: true
      });
    }

    // For normal password changes, just return success
    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("❌ Change password error:", error.message);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error during password change"
    });
  }
};

export const verifyPasswordChangeToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Check if this is a password change token
    if (!decoded.requiresPasswordChange) {
      throw new Error("Not a password change token");
    }

    return {
      valid: true,
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (error) {
    console.error("❌ Password change token verification error:", error.message);
    return {
      valid: false,
      error: error.message
    };
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

async function cleanupExpiredTokens() {
  try {
    console.log('🧹 Starting expired token cleanup...');
    const db = await import("../../shared/db.js").then(mod => mod.default);

    // Clean expired tokens from users table
    const [usersResult] = await db.query(
      "UPDATE users SET email_verification_token = NULL, email_verification_expires = NULL WHERE email_verification_expires < NOW()"
    );

    console.log(`🧹 Cleared ${usersResult.affectedRows} expired tokens from users table`);

    // Clean expired pending registrations
    const [pendingResult] = await db.query(
      "DELETE FROM pending_registrations WHERE email_verification_expires < NOW()"
    );

    console.log(`🧹 Deleted ${pendingResult.affectedRows} expired pending registrations`);

    // Clean expired password reset tokens
    const [passwordResult] = await db.query(
      "DELETE FROM password_reset_tokens WHERE expires_at < NOW()"
    );

    console.log(`🧹 Deleted ${passwordResult.affectedRows} expired password reset tokens`);

    return {
      usersCleared: usersResult.affectedRows,
      pendingCleared: pendingResult.affectedRows,
      passwordCleared: passwordResult.affectedRows
    };

  } catch (error) {
    console.error('❌ Error cleaning up expired tokens:', error);
    throw error;
  }
}

// Run cleanup every hour (60 * 60 * 1000 ms = 1 hour)
if (process.env.NODE_ENV !== 'test') {
  // Run immediately on startup
  setTimeout(() => {
    cleanupExpiredTokens().catch(console.error);
  }, 30000); // Wait 30 seconds after server starts

  // Then run every hour
  setInterval(() => {
    cleanupExpiredTokens().catch(console.error);
  }, 60 * 60 * 1000); // Every hour
}


