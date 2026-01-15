import nodemailer from "nodemailer";
import 'dotenv/config';

// SVG Icons for emails
const svgIcons = {
  check: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 13.5L4.5 10.5L3.09 11.91L7.5 16.33L17.5 6.33L16.09 4.92L7.5 13.5Z" fill="currentColor"/>
    </svg>
  `,
  
  lock: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 8H14V6C14 3.24 11.76 1 9 1C6.24 1 4 3.24 4 6V8H3C2.45 8 2 8.45 2 9V18C2 18.55 2.45 19 3 19H15C15.55 19 16 18.55 16 18V9C16 8.45 15.55 8 15 8ZM9 14C8.45 14 8 13.55 8 13C8 12.45 8.45 12 9 12C9.55 12 10 12.45 10 13C10 13.55 9.55 14 9 14ZM12 8H6V6C6 4.34 7.34 3 9 3C10.66 3 12 4.34 12 6V8Z" fill="currentColor"/>
    </svg>
  `,
  
  email: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0H2C0.9 0 0.01 0.9 0.01 2L0 18C0 19.1 0.9 20 2 20H18C19.1 20 20 19.1 20 18V2C20 0.9 19.1 0 18 0ZM18 4L10 9L2 4V2L10 7L18 2V4Z" fill="currentColor"/>
    </svg>
  `,
  
  security: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0L0 3V9C0 14.55 3.84 19.74 10 20C16.16 19.74 20 14.55 20 9V3L10 0ZM10 18C5.65 18.2 2 13.84 2 9V4.3L10 1.5L18 4.3V9C18 13.84 14.35 18.2 10 18Z" fill="currentColor"/>
    </svg>
  `,
  
  payment: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0H2C0.89 0 0 0.89 0 2V18C0 19.11 0.89 20 2 20H18C19.11 20 20 19.11 20 18V2C20 0.89 19.11 0 18 0ZM18 18H2V8H18V18ZM18 4H2V2H18V4Z" fill="currentColor"/>
    </svg>
  `,
  
  alert: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
    </svg>
  `,
  
  arrowRight: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="currentColor"/>
    </svg>
  `
};

// Email template generator
class EmailTemplates {
  // Minimalist common styles
  static getCommonStyles() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: #f8fafc;
        color: #334155;
        line-height: 1.6;
        padding: 40px 20px;
      }
      
      .email-wrapper {
        max-width: 600px;
        margin: 0 auto;
      }
      
      .email-container {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
      }
      
      .header {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        padding: 40px 30px;
        text-align: center;
      }
      
      .logo {
        font-size: 32px;
        font-weight: 800;
        color: white;
        margin-bottom: 16px;
        letter-spacing: -0.5px;
      }
      
      .header h1 {
        font-size: 28px;
        font-weight: 700;
        color: white;
        margin-bottom: 8px;
      }
      
      .header p {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 400;
      }
      
      .content {
        padding: 40px;
      }
      
      .greeting {
        font-size: 18px;
        font-weight: 500;
        color: #475569;
        margin-bottom: 24px;
      }
      
      .greeting strong {
        color: #f59e0b;
      }
      
      .section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        margin: 24px 0;
      }
      
      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
      }
      
      .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin: 24px 0;
      }
      
      .feature-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }
      
      .feature-icon {
        width: 24px;
        height: 24px;
        color: #f59e0b;
      }
      
      .feature-text {
        font-size: 14px;
        color: #475569;
      }
      
      .notice {
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 8px;
        padding: 16px;
        margin: 24px 0;
        color: #92400e;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .footer {
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        padding: 30px 40px;
        text-align: center;
      }
      
      .brand {
        color: #f59e0b;
        font-weight: 700;
        font-size: 20px;
        margin-bottom: 12px;
      }
      
      .footer-text {
        color: #64748b;
        font-size: 14px;
        line-height: 1.5;
      }
      
      @media (max-width: 640px) {
        .content {
          padding: 24px;
        }
        
        .header {
          padding: 30px 20px;
        }
        
        .feature-grid {
          grid-template-columns: 1fr;
        }
        
        .btn {
          width: 100%;
          padding: 16px 24px;
        }
      }
    `;
  }

  // Verification email template
  static getVerificationEmail(fullName, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - WUBLAND</title>
        <style>${this.getCommonStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="logo">WUBLAND</div>
              <h1>Welcome to WUBLAND</h1>
              <p>Let's verify your email address</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello <strong>${fullName}</strong>,</p>
              
              <p style="color: #475569; margin-bottom: 24px;">
                Welcome to WUBLAND! We're excited to have you join our community. 
                To ensure the security of your account, please verify your email address.
              </p>
              
              <div class="section">
                <div class="section-title">
                  ${svgIcons.lock}
                  Email Verification Required
                </div>
                
                <p style="color: #64748b; margin-bottom: 24px;">
                  Click the button below to confirm your email address and activate your account.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${verificationUrl}" class="btn">
                    <span>Verify Email Address</span>
                    ${svgIcons.arrowRight}
                  </a>
                </div>
                
                <div class="notice">
                  ${svgIcons.alert}
                  This verification link will expire in 24 hours
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="brand">WUBLAND</div>
              <p class="footer-text">
                Real Estate Portfolio Management Platform<br>
                If you didn't create an account, please ignore this email.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Security alert template
  static getSecurityAlert(type, severity, description, ip, userAgent, actionTaken, timestamp) {
    const colors = this.getSeverityColors(severity);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Alert - WUBLAND</title>
        <style>
          ${this.getCommonStyles()}
          
          .header {
            background: ${colors.gradient} !important;
          }
          
          .severity-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: ${colors.background};
            color: ${colors.text};
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 20px;
            border: 1px solid ${colors.border};
          }
          
          .alert-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin: 20px 0;
          }
          
          .alert-item {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
          }
          
          .alert-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .alert-value {
            font-size: 14px;
            color: #1e293b;
            font-weight: 500;
          }
          
          .ip-address {
            font-family: 'Courier New', monospace;
            background: #f1f5f9;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="logo">WUBLAND</div>
              <h1>Security Alert</h1>
              <p>Immediate attention required</p>
            </div>
            
            <div class="content">
              <div class="severity-badge">
                ${svgIcons.alert}
                ${severity.toUpperCase()} SEVERITY
              </div>
              
              <div class="section">
                <div class="section-title" style="color: ${colors.text};">
                  ${type}
                </div>
                
                <p style="color: #475569; margin-bottom: 20px;">
                  ${description}
                </p>
                
                <div class="alert-grid">
                  <div class="alert-item">
                    <div class="alert-label">Time</div>
                    <div class="alert-value">${new Date(timestamp).toLocaleString()}</div>
                  </div>
                  
                  <div class="alert-item">
                    <div class="alert-label">IP Address</div>
                    <div class="ip-address">${ip}</div>
                  </div>
                  
                  <div class="alert-item">
                    <div class="alert-label">Action Taken</div>
                    <div class="alert-value" style="color: #059669;">${actionTaken}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="brand">WUBLAND</div>
              <p class="footer-text">
                This is an automated security alert from WubLand System Protection.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Payment reminder template
  static getPaymentReminder(fullName, amount, dueDate, propertyAddress) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder - WUBLAND</title>
        <style>
          ${this.getCommonStyles()}
          
          .payment-card {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(217, 119, 6, 0.02));
            border: 1px solid rgba(245, 158, 11, 0.1);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
          }
          
          .amount {
            font-size: 32px;
            font-weight: 700;
            color: #f59e0b;
            margin-bottom: 8px;
          }
          
          .due-date {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #fee2e2;
            color: #dc2626;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="logo">WUBLAND</div>
              <h1>Payment Reminder</h1>
              <p>Friendly reminder about your upcoming payment</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello <strong>${fullName}</strong>,</p>
              
              <p style="color: #475569; margin-bottom: 24px;">
                This is a friendly reminder about your upcoming rent payment.
              </p>
              
              <div class="payment-card">
                <div class="section-title">
                  ${svgIcons.payment}
                  Payment Details
                </div>
                
                <div class="amount">$${amount}</div>
                <div class="due-date">Due: ${dueDate}</div>
                
                <p style="color: #64748b; margin-top: 16px; font-size: 14px;">
                  Property: ${propertyAddress}
                </p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.APP_URL}/payments" class="btn">
                  <span>Make Payment</span>
                  ${svgIcons.arrowRight}
                </a>
              </div>
              
              <div class="notice">
                ${svgIcons.alert}
                Please make your payment before the due date to avoid late fees.
              </div>
            </div>
            
            <div class="footer">
              <div class="brand">WUBLAND</div>
              <p class="footer-text">
                This is an automated message from WubLand.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Password change required template
  static getPasswordChangeRequired(fullName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Change Required - WUBLAND</title>
        <style>
          ${this.getCommonStyles()}
          
          .urgent-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #dc2626;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
            margin: 16px 0;
          }
          
          .requirements {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          
          .requirement-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
            color: #475569;
            font-size: 14px;
          }
          
          .requirement-item::before {
            content: '✓';
            color: #10b981;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="logo">WUBLAND</div>
              <h1>Password Change Required</h1>
              <p>Security protocol activation</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello <strong>${fullName}</strong>,</p>
              
              <div class="urgent-badge">
                ${svgIcons.alert}
                IMMEDIATE ACTION REQUIRED
              </div>
              
              <p style="color: #475569; margin-bottom: 20px;">
                For enhanced security, you are required to change your password before accessing the dashboard.
              </p>
              
              <div class="requirements">
                <div class="requirement-item">Minimum 12 characters</div>
                <div class="requirement-item">Uppercase and lowercase letters</div>
                <div class="requirement-item">Include numbers and special characters</div>
                <div class="requirement-item">Cannot be similar to previous passwords</div>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.APP_URL}/change-password" class="btn">
                  <span>Change Password Now</span>
                  ${svgIcons.arrowRight}
                </a>
              </div>
              
              <div class="notice">
                ${svgIcons.alert}
                You will not be able to access company resources until you complete this password change.
              </div>
            </div>
            
            <div class="footer">
              <div class="brand">WUBLAND</div>
              <p class="footer-text">
                WubLand Security Team - Protecting Our Digital Environment
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Helper for severity colors
  static getSeverityColors(severity) {
    const colors = {
      critical: {
        text: "#dc2626",
        background: "#fee2e2",
        border: "#fecaca",
        gradient: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
      },
      high: {
        text: "#ea580c",
        background: "#ffedd5",
        border: "#fed7aa",
        gradient: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)"
      },
      medium: {
        text: "#d97706",
        background: "#fef3c7",
        border: "#fde68a",
        gradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)"
      },
      low: {
        text: "#059669",
        background: "#d1fae5",
        border: "#a7f3d0",
        gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)"
      }
    };
    
    return colors[severity.toLowerCase()] || colors.medium;
  }
}

// Main Email Service Class
class EmailService {
  constructor() {
    const password = process.env.EMAIL_APP_PASSWORD;
    const user = process.env.EMAIL_USER;

    console.log("📧 Email Service Initialized");

    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: user,
        pass: password,
      },
    });
  }

  // Send verification email
  async sendVerificationEmail(userData, verificationToken) {
    const { email, fullName } = userData;
    const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email-web?token=${verificationToken}`;

    const html = EmailTemplates.getVerificationEmail(fullName, verificationUrl);

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "🔐 Verify Your WUBLAND Account",
        html,
      });
      console.log(`✅ Verification email sent to: ${email}`);
      return { success: true, email };
    } catch (error) {
      console.error("❌ Error sending verification email:", error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  // Send security alert
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

    const html = EmailTemplates.getSecurityAlert(
      type,
      severity,
      description,
      ip,
      userAgent,
      actionTaken,
      timestamp
    );

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAILS,
        subject: `Security Alert: ${type} - ${severity.toUpperCase()}`,
        html,
      });
      console.log(`✅ Security alert sent: ${type}`);
      return { success: true };
    } catch (error) {
      console.error("❌ Error sending security alert:", error);
      return { success: false, error: error.message };
    }
  }

  // Send payment reminder
  async sendPaymentReminder(renterData) {
    const { email, fullName, amount, dueDate, propertyAddress } = renterData;

    const html = EmailTemplates.getPaymentReminder(
      fullName,
      amount,
      dueDate,
      propertyAddress
    );

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Payment Reminder - Due ${dueDate}`,
        html,
      });
      console.log(`✅ Payment reminder sent to: ${email}`);
      return { success: true, email };
    } catch (error) {
      console.error("❌ Error sending payment reminder:", error);
      return { success: false, error: error.message };
    }
  }

  // Send password change required
  async sendPasswordChangeRequired(employeeData) {
    const { email, fullName } = employeeData;

    const html = EmailTemplates.getPasswordChangeRequired(fullName);

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Action Required: Password Change Required",
        html,
      });
      console.log(`✅ Password change required email sent to: ${email}`);
      return { success: true, email };
    } catch (error) {
      console.error("❌ Error sending password change email:", error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();