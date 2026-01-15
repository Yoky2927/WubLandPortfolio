import EmailService from '../utils/emailService.js'; // Your existing EmailService

// Middleware to verify internal service token
const verifyServiceToken = (req, res, next) => {
  const token = req.headers['internal-service-token'] || req.headers['authorization'];
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN || 'communication-service-secret-12345';

  if (!token || token !== expectedToken) {
    console.warn('Unauthorized service token attempt');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized service request'
    });
  }
  next();
};

export const sendVerificationEmail = async (req, res) => {
  try {
    const { email, fullName, verificationToken } = req.body;  // <-- Changed to verificationToken

    console.log('📧 Received verification email request:', { email, fullName, verificationToken });

    if (!email || !verificationToken) {  // <-- Changed to verificationToken
      return res.status(400).json({
        success: false,
        message: 'Email and token are required'
      });
    }

    // Use your existing EmailService
    await EmailService.sendVerificationEmail(
      { email, fullName },
      verificationToken  // <-- Changed to verificationToken
    );

    console.log(`✅ Verification email sent to: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      email: email
    });
  } catch (error) {
    console.error('❌ Error sending verification email:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message
    });
  }
};

export const sendPasswordChangeEmail = async (req, res) => {
  try {
    const { email, fullName } = req.body;

    console.log('📧 Received password change email request:', { email, fullName });

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Use your existing EmailService
    await EmailService.sendPasswordChangeRequired({ email, fullName });

    console.log(`✅ Password change email sent to: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Password change email sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending password change email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password change email',
      error: error.message
    });
  }
};

export const sendSecurityAlert = async (req, res) => {
  try {
    const { type, description, ip, userAgent, actionTaken, email, severity } = req.body;

    console.log('📧 Received security alert request:', { email, type, severity });

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for security alerts'
      });
    }

    // Use your existing EmailService
    await EmailService.sendSecurityAlert({
      type: type || 'Security Alert',
      severity: severity || 'medium',
      description: description || 'Security event detected',
      ip: ip || 'Unknown',
      userAgent: userAgent || 'Unknown',
      actionTaken: actionTaken || 'Alert triggered',
      timestamp: new Date()
    });

    console.log(`✅ Security alert sent to: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Security alert sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending security alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send security alert',
      error: error.message
    });
  }
};

// Test endpoints
export const testEmailConnection = async (req, res) => {
  try {
    console.log('📧 Testing email connection...');

    // Test by sending a verification email to yourself
    const testEmail = process.env.EMAIL_USER;
    const testToken = 'test-token-' + Date.now();

    await EmailService.sendVerificationEmail(
      { email: testEmail, fullName: 'Test Admin' },
      testToken
    );

    console.log(`✅ Test email sent to: ${testEmail}`);

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      to: testEmail
    });
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

export const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    service: 'communication-service-email',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      sendVerification: 'POST /api/email/send-verification',
      sendPasswordChange: 'POST /api/email/send-password-change',
      sendSecurityAlert: 'POST /api/email/send-security-alert'
    }
  });
};