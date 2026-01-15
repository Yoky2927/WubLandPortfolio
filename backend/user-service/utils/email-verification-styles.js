export const verificationStyles = {
    // Common styles for all verification pages - Clean White/Amber Theme
    common: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #ffffff;
      color: #1f2937;
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
      line-height: 1.6;
    }
    
    /* Floating decorative elements */
    .floating-element {
      position: absolute;
      pointer-events: none;
      z-index: 0;
      opacity: 0.03;
      transition: transform 30s ease-in-out;
      animation: float 30s infinite ease-in-out;
    }
    
    @keyframes float {
      0%, 100% { 
        transform: translate(0, 0) rotate(0deg); 
      }
      33% { 
        transform: translate(40px, -30px) rotate(3deg); 
      }
      66% { 
        transform: translate(-20px, 40px) rotate(-2deg); 
      }
    }
    
    /* Main container - Very relaxed and spacious */
    .main-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      position: relative;
      z-index: 1;
    }
    
    /* Content card - Wide and airy */
    .content-card {
      width: 100%;
      max-width: 520px;
      background: #ffffff;
      border-radius: 32px;
      padding: 56px 40px;
      position: relative;
      z-index: 2;
      text-align: center;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.04),
        0 1px 4px rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(245, 158, 11, 0.08);
    }
    
    /* Icon container */
    .icon-wrapper {
      width: 100px;
      height: 100px;
      margin: 0 auto 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .icon-circle {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(251, 191, 36, 0.02));
      border: 1px solid rgba(245, 158, 11, 0.1);
    }
    
    .svg-icon {
      width: 48px;
      height: 48px;
      position: relative;
      z-index: 1;
    }
    
    /* Typography */
    h1 {
      font-size: 36px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1f2937;
      letter-spacing: -0.5px;
      line-height: 1.3;
    }
    
    .subtitle {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 32px;
      line-height: 1.6;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }
    
    /* Buttons */
    .action-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      text-decoration: none;
      padding: 16px 36px;
      border-radius: 14px;
      font-weight: 500;
      font-size: 16px;
      border: none;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 16px rgba(245, 158, 11, 0.15);
    }
    
    .action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
    }
    
    .button-outline {
      background: transparent;
      color: #f59e0b;
      border: 1.5px solid rgba(245, 158, 11, 0.3);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    
    .button-outline:hover {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.02);
    }
    
    /* Button container */
    .button-group {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 40px;
    }
    
    /* Footer info */
    .footer-info {
      margin-top: 48px;
      padding-top: 32px;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      color: #9ca3af;
      font-size: 14px;
    }
    
    .brand {
      color: #f59e0b;
      font-weight: 600;
      font-size: 18px;
      margin-bottom: 8px;
    }
    
    /* Utility classes */
    .spacer-lg {
      height: 40px;
    }
    
    .spacer-md {
      height: 24px;
    }
    
    @media (max-width: 640px) {
      .main-container {
        padding: 24px 16px;
      }
      
      .content-card {
        padding: 48px 32px;
        border-radius: 28px;
      }
      
      h1 {
        font-size: 32px;
      }
      
      .subtitle {
        font-size: 16px;
      }
      
      .button-group {
        flex-direction: column;
        gap: 12px;
      }
      
      .action-button {
        width: 100%;
      }
      
      .icon-wrapper {
        width: 80px;
        height: 80px;
      }
      
      .svg-icon {
        width: 40px;
        height: 40px;
      }
    }
  `,

    // Success specific styles
    success: `
    .user-details {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.03), rgba(251, 191, 36, 0.01));
      border: 1px solid rgba(245, 158, 11, 0.08);
      border-radius: 20px;
      padding: 28px;
      margin: 32px 0;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 16px 0;
      color: #4b5563;
      font-size: 16px;
    }
    
    .detail-value {
      color: #f59e0b;
      font-weight: 500;
    }
    
    .redirect-message {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 20px;
      margin: 32px 0;
      color: #6b7280;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    
    .countdown {
      color: #f59e0b;
      font-weight: 600;
      font-size: 18px;
    }
  `,

    // Error specific styles
    error: `
    .error-actions {
      margin-top: 32px;
    }
    
    .support-link {
      color: #6b7280;
      font-size: 14px;
      margin-top: 24px;
      display: block;
    }
  `
};

// SVG Icons
export const svgIcons = {
    success: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#10b981" fill-opacity="0.1"/>
      <path d="M17.3334 8.5L10.0001 15.8333L6.66675 12.5" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 8.5L10 14.5L8 12.5" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

    error: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#ef4444" fill-opacity="0.1"/>
      <path d="M8 8L16 16" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 8L8 16" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

    search: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#6b7280" fill-opacity="0.1"/>
      <circle cx="11" cy="11" r="6" stroke="#6b7280" stroke-width="2"/>
      <path d="M16 16L20 20" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

    warning: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#f59e0b" fill-opacity="0.1"/>
      <path d="M12 8V12" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 16H12.01" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

    clock: `
    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#f59e0b" fill-opacity="0.1"/>
      <circle cx="12" cy="12" r="9" stroke="#f59e0b" stroke-width="2"/>
      <path d="M12 6V12L16 14" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

    user: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="#f59e0b"/>
      <path d="M10 12C5.58172 12 2 15.5817 2 20H18C18 15.5817 14.4183 12 10 12Z" fill="#f59e0b"/>
    </svg>
  `,

    email: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0H2C0.9 0 0.01 0.9 0.01 2L0 18C0 19.1 0.9 20 2 20H18C19.1 20 20 19.1 20 18V2C20 0.9 19.1 0 18 0ZM18 4L10 9L2 4V2L10 7L18 2V4Z" fill="#f59e0b"/>
    </svg>
  `,

    arrowRight: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="currentColor"/>
    </svg>
  `
};

// Main verification function with new design
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

        const [users] = await db.query(
            "SELECT id, email, first_name, last_name, email_verification_expires, is_email_verified FROM users WHERE email_verification_token = ?",
            [token]
        );

        console.log('🔍 verifyEmailWeb - Users found:', users.length);

        if (users.length === 0) {
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

        const user = users[0];
        console.log('🔍 verifyEmailWeb - User found:', {
            id: user.id,
            email: user.email,
            is_email_verified: user.is_email_verified,
            expires: user.email_verification_expires
        });

        // Check if already verified
        if (user.is_email_verified === 1) {
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

        // Update user as verified
        const [updateResult] = await db.query(
            "UPDATE users SET is_email_verified = 1, verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?",
            [user.id]
        );

        console.log(`✅ verifyEmailWeb - Email verified for user ID: ${user.id}, Rows updated: ${updateResult.affectedRows}`);

        // SUCCESS PAGE
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
          
          /* Success page specific animations */
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
          
          .confetti {
            position: absolute;
            width: 12px;
            height: 12px;
            background: linear-gradient(135deg, #f59e0b, #fbbf24);
            border-radius: 50%;
            opacity: 0;
            z-index: 1;
          }
          
          @keyframes confettiFall {
            0% {
              transform: translateY(-100px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
        </style>
      </head>
      <body>
        <!-- Floating decorative elements -->
        <div class="floating-element" style="width: 220px; height: 220px; top: 5%; left: 4%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.04), rgba(251, 191, 36, 0.02)); border-radius: 50%;"></div>
        <div class="floating-element" style="width: 160px; height: 160px; top: 15%; right: 6%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.03), rgba(251, 191, 36, 0.01)); border-radius: 40px;"></div>
        <div class="floating-element" style="width: 140px; height: 140px; bottom: 10%; left: 7%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.02), rgba(251, 191, 36, 0.005)); border-radius: 35px;"></div>
        
        <!-- Confetti elements -->
        <div class="confetti" style="left: 10%; animation: confettiFall 3s linear infinite;"></div>
        <div class="confetti" style="left: 20%; animation: confettiFall 4s linear infinite 0.5s;"></div>
        <div class="confetti" style="left: 30%; animation: confettiFall 3.5s linear infinite 1s;"></div>
        <div class="confetti" style="left: 40%; animation: confettiFall 4.5s linear infinite 1.5s;"></div>
        <div class="confetti" style="left: 60%; animation: confettiFall 3s linear infinite 2s;"></div>
        <div class="confetti" style="left: 70%; animation: confettiFall 4s linear infinite 2.5s;"></div>
        <div class="confetti" style="left: 80%; animation: confettiFall 3.5s linear infinite 3s;"></div>
        <div class="confetti" style="left: 90%; animation: confettiFall 4.2s linear infinite 3.5s;"></div>
        
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
                <span>Welcome, <span class="detail-value">${user.first_name || 'there'}</span>!</span>
              </div>
              
              <div class="detail-item">
                ${svgIcons.email}
                <span><span class="detail-value">${user.email}</span> is now verified</span>
              </div>
            </div>
            
            <p class="subtitle">
              Your WUBLAND account is now fully activated. You can start managing your real estate portfolio immediately.
            </p>
            
            <div class="redirect-message">
              <span>You'll be redirected in <span id="countdown" class="countdown">8</span> seconds...</span>
            </div>
            
            <div class="button-group">
              <a href="http://localhost:5173/login-register" class="action-button">
                <span>Start Exploring</span>
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
          
          // Add more confetti on click
          document.querySelector('.content-card').addEventListener('click', (e) => {
            if (e.target.tagName === 'A') return;
            
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            const hue = Math.random() * 60 + 30;
confetti.style.background = 'linear-gradient(135deg, ' + 
  'hsl(' + hue + ', 100%, 60%), ' +
  'hsl(' + (hue + 10) + ', 100%, 70%)' +
  ')';

const duration = 2 + Math.random() * 3;
confetti.style.animation = 'confettiFall ' + duration + 's linear forwards';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
              confetti.remove();
            }, 5000);
          });
        </script>
      </body>
      </html>
    `);

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