import nodemailer from "nodemailer";
import 'dotenv/config';

class EmailService {
  constructor() {
    const password = process.env.EMAIL_APP_PASSWORD;
    const user = process.env.EMAIL_USER;

    // --- EMAIL DEBUG START --- (Your debug logs)
    console.log("--- EMAIL DEBUG START ---");
    console.log("User:", user);
    console.log("Password Length:", password ? password.length : "MISSING");
    console.log("--- EMAIL DEBUG END ---");
    // --- EMAIL DEBUG END ---

    this.transporter = nodemailer.createTransport({
      // 🚨 CRITICAL CHANGE: Use explicit host/port for maximum compatibility
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Port 587 uses STARTTLS, so secure is false
      requireTLS: true, // This enables STARTTLS
      auth: {
        user: user,
        pass: password,
      },
    });
  }

  // Send security alerts to admins
  async sendSecurityAlert(alertData) {
    const {
      type,
      severity,
      description,
      ip,
      userAgent,
      actionTaken,
      timestamp,
    } = alertData;

    const subject = `🚨 Security Alert: ${type} - ${severity.toUpperCase()}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: #dc2626; color: white; padding: 24px; text-align: center; }
          .header h2 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
          .content { padding: 32px; }
          .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin: 16px 0; }
          .detail { margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail:last-child { border-bottom: none; }
          .detail strong { color: #1f2937; display: inline-block; width: 120px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          .logo { font-size: 20px; font-weight: bold; color: #f59e0b; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">WUBLAND</div>
            <h2>Security Alert</h2>
          </div>
          <div class="content">
            <div class="alert-box">
              <h3 style="color: #dc2626; margin-bottom: 16px;">${type}</h3>
              <div class="detail"><strong>Severity:</strong> <span style="color: #dc2626; font-weight: 600;">${severity.toUpperCase()}</span></div>
              <div class="detail"><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</div>
              <div class="detail"><strong>Description:</strong> ${description}</div>
              <div class="detail"><strong>IP Address:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${ip}</code></div>
              <div class="detail"><strong>User Agent:</strong> <small>${userAgent}</small></div>
              <div class="detail"><strong>Action Taken:</strong> ${actionTaken}</div>
            </div>
          </div>
          <div class="footer">
            This is an automated security alert from WubLand System.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAILS,
        subject,
        html,
      });
      console.log(`Security alert sent: ${type}`);
    } catch (error) {
      console.error("Error sending security alert:", error);
    }
  }

  // Send payment reminders to renters
  async sendPaymentReminder(renterData) {
    const { email, fullName, amount, dueDate, propertyAddress, leaseId } = renterData;

    const subject = `💰 Rent Payment Reminder - Due ${dueDate}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: #10b981; color: white; padding: 24px; text-align: center; }
          .header h2 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
          .content { padding: 32px; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #1f2937; }
          .payment-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; margin: 20px 0; }
          .payment-card h3 { color: #065f46; margin-bottom: 16px; font-size: 18px; }
          .payment-detail { margin: 12px 0; display: flex; justify-content: space-between; }
          .payment-detail strong { color: #374151; }
          .button { display: inline-block; padding: 14px 32px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; transition: background-color 0.2s; margin: 16px 0; }
          .button:hover { background: #d97706; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          .logo { font-size: 20px; font-weight: bold; color: #f59e0b; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">WUBLAND</div>
            <h2>Rent Payment Reminder</h2>
          </div>
          <div class="content">
            <p class="greeting">Hello <strong>${fullName}</strong>,</p>
            <p style="color: #6b7280; margin-bottom: 20px;">This is a friendly reminder that your rent payment is due soon.</p>
            
            <div class="payment-card">
              <h3>Payment Details</h3>
              <div class="payment-detail"><strong>Amount:</strong> <span style="color: #065f46; font-weight: 600;">$${amount}</span></div>
              <div class="payment-detail"><strong>Due Date:</strong> <span style="color: #dc2626; font-weight: 600;">${dueDate}</span></div>
              <div class="payment-detail"><strong>Property:</strong> ${propertyAddress}</div>
              <div class="payment-detail"><strong>Lease ID:</strong> <code style="background: #ecfdf5; padding: 4px 8px; border-radius: 4px;">${leaseId}</code></div>
            </div>
            
            <p style="color: #6b7280; margin: 20px 0;">Please make your payment before the due date to avoid late fees.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.APP_URL}/payments" class="button">Make Payment Now</a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; margin-top: 20px;">If you have already made the payment, please disregard this message.</p>
          </div>
          <div class="footer">
            This is an automated message from WubLand. Please do not reply to this email.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html,
      });
      console.log(`Payment reminder sent to: ${email}`);
    } catch (error) {
      console.error("Error sending payment reminder:", error);
    }
  }

  // Send email verification
  async sendVerificationEmail(userData, verificationToken) {
    const { email, fullName } = userData;
    const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email-web?token=${verificationToken}`;

    const subject = "Verify Your WubLand Account";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: #f59e0b; color: white; padding: 24px; text-align: center; }
          .header h2 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
          .content { padding: 32px; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #1f2937; }
          .welcome-text { color: #6b7280; margin-bottom: 24px; }
          .verification-box { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; padding: 16px 40px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; transition: background-color 0.2s; margin: 16px 0; }
          .button:hover { background: #d97706; }
          .link-box { background: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0; word-break: break-all; }
          .link-box code { color: #374151; font-size: 14px; }
          .expiry-note { color: #dc2626; font-size: 14px; margin: 16px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          .logo { font-size: 20px; font-weight: bold; color: white; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">WUBLAND</div>
            <h2>Verify Your Email Address</h2>
          </div>
          <div class="content">
            <p class="greeting">Hello <strong>${fullName}</strong>,</p>
            <p class="welcome-text">Welcome to WubLand! We're excited to have you on board. Please verify your email address to complete your registration and start exploring our platform.</p>
            
            <div class="verification-box">
              <p style="margin-bottom: 20px; color: #92400e;">Click the button below to verify your email address:</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">Or copy and paste this link in your browser:</p>
              <div class="link-box">
                <code>${verificationUrl}</code>
              </div>
            </div>
            
            <p class="expiry-note">⚠️ This verification link will expire in 24 hours.</p>
            
            <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">If you didn't create an account with WubLand, please ignore this email.</p>
          </div>
          <div class="footer">
            Welcome to the WubLand community! 🎉
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html,
      });
      console.log(`Verification email sent to: ${email}`);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  // Send password change requirement for employees
  async sendPasswordChangeRequired(employeeData) {
    const { email, fullName } = employeeData;

    const subject = "Action Required: Password Change Required";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: #f59e0b; color: white; padding: 24px; text-align: center; }
          .header h2 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
          .content { padding: 32px; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #1f2937; }
          .security-box { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 24px; margin: 20px 0; }
          .button { display: inline-block; padding: 14px 32px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; transition: background-color 0.2s; margin: 16px 0; }
          .button:hover { background: #d97706; }
          .warning { color: #dc2626; font-weight: 600; margin: 16px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          .logo { font-size: 20px; font-weight: bold; color: white; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">WUBLAND</div>
            <h2>Password Change Required</h2>
          </div>
          <div class="content">
            <p class="greeting">Hello <strong>${fullName}</strong>,</p>
            
            <div class="security-box">
              <p style="color: #92400e; margin-bottom: 16px;">For security reasons, you are required to change your password before accessing your dashboard.</p>
              <p style="color: #6b7280; margin-bottom: 20px;">This is a standard security measure for all internal employees to ensure the highest level of account protection.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.APP_URL}/change-password" class="button">Change Password Now</a>
              </div>
            </div>
            
            <p class="warning">⚠️ You will not be able to access your dashboard until you change your password.</p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you have any questions, please contact the IT support team.</p>
          </div>
          <div class="footer">
            WubLand Security Team
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html,
      });
      console.log(`Password change required email sent to: ${email}`);
    } catch (error) {
      console.error("Error sending password change email:", error);
    }
  }
}

export default new EmailService();