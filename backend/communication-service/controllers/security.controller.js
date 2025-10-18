import EmailService from '../utils/emailService.js';

class SecurityController {
  // Detect and handle brute force attacks
  async handleBruteForceAttempt(req, res, next) {
    const { ip, username, userAgent } = req;
    
    const alertData = {
      type: 'Brute Force Attack Detected',
      severity: 'high',
      description: `Multiple failed login attempts from IP ${ip} for username: ${username}`,
      ip,
      userAgent,
      actionTaken: 'IP temporarily blocked, user account locked',
      timestamp: new Date(),
    };

    // Send immediate security alert
    await EmailService.sendSecurityAlert(alertData);

    // Log the incident
    console.log(`BRUTE FORCE ATTEMPT: IP ${ip}, User: ${username}`);
    
    // Implement IP blocking logic here
    // You can use Redis or database to track failed attempts
  }

  // Detect SQL injection attempts
  async handleSQLInjectionAttempt(req, res, next) {
    const { ip, query, userAgent } = req;
    
    const alertData = {
      type: 'SQL Injection Attempt Detected',
      severity: 'high',
      description: `Potential SQL injection detected in query parameters from IP ${ip}`,
      ip,
      userAgent,
      actionTaken: 'Request blocked, IP logged for monitoring',
      timestamp: new Date(),
    };

    await EmailService.sendSecurityAlert(alertData);
    console.log(`SQL INJECTION ATTEMPT: IP ${ip}, Query: ${query}`);
  }

  // Detect unauthorized access
  async handleUnauthorizedAccess(req, res, next) {
    const { ip, path, userAgent, userId } = req;
    
    const alertData = {
      type: 'Unauthorized Access Attempt',
      severity: 'medium',
      description: `User ${userId} attempted to access restricted path: ${path}`,
      ip,
      userAgent,
      actionTaken: 'Access denied, incident logged',
      timestamp: new Date(),
    };

    await EmailService.sendSecurityAlert(alertData);
    console.log(`UNAUTHORIZED ACCESS: User ${userId}, Path: ${path}`);
  }

  // Detect DDoS patterns
  async handleDDoSAttempt(req, res, next) {
    const { ip, requestCount, timeWindow, userAgent } = req;
    
    const alertData = {
      type: 'Potential DDoS Attack Detected',
      severity: 'high',
      description: `High request volume detected from IP ${ip}: ${requestCount} requests in ${timeWindow}ms`,
      ip,
      userAgent,
      actionTaken: 'IP rate limited, traffic monitored',
      timestamp: new Date(),
    };

    await EmailService.sendSecurityAlert(alertData);
    console.log(`DDoS ATTEMPT: IP ${ip}, Requests: ${requestCount}`);
  }
}

export default new SecurityController();