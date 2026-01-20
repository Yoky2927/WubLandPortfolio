const axios = require('axios');
const crypto = require('crypto'); // This is now built-in, no need to install

class ChapaService {
  constructor() {
    this.baseURL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
    this.secretKey = process.env.CHAPA_SECRET_KEY;
    this.publicKey = process.env.CHAPA_PUBLIC_KEY;
    this.webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
  }

  async initializePayment(paymentData) {
    try {
      console.log('Chapa Service - Received paymentData:', {
        hasEmail: !!paymentData.email,
        email: paymentData.email,
        amount: paymentData.amount,
        firstName: paymentData.firstName
      });

      // Generate shorter transaction reference
      const shortTxRef = `wbl-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Validate and sanitize email
      let userEmail = paymentData.email || 'user@example.com';

      // Basic email validation and sanitization
      if (!this.isValidEmail(userEmail)) {
        console.log('Invalid email detected, using fallback:', userEmail);
        userEmail = 'yokabd@gmail.com'; // Use a guaranteed valid email for testing
      }

      // Ensure email is lowercase and trimmed
      userEmail = userEmail.toLowerCase().trim();

      // In initializePayment method
      const payload = {
        amount: paymentData.amount,
        currency: 'ETB',
        email: userEmail,
        first_name: paymentData.firstName || 'User',
        last_name: paymentData.lastName || '',
        tx_ref: shortTxRef,
        callback_url: process.env.CALLBACK_URL,
        // Force return URL with full path and parameters
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-payment?tx_ref=${shortTxRef}&invoice=${paymentData.invoiceId}&user=${paymentData.userId}`,
        customization: {
          title: 'Wubland',
          description: 'Property Payment'
        }
      };

      console.log('🚀 Chapa payload return_url:', payload.return_url);
      console.log('Chapa Service - Sending payload:', {
        email: payload.email,
        emailLength: payload.email.length,
        tx_ref: payload.tx_ref,
        tx_refLength: payload.tx_ref.length
      });

      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('Chapa Service - Response received:', {
        status: response.status,
        hasCheckoutUrl: !!response.data?.data?.checkout_url
      });

      return {
        success: true,
        data: response.data,
        checkoutUrl: response.data.data.checkout_url
      };
    } catch (error) {
      console.error('Chapa initialization error DETAILS:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          data: error.config?.data ? JSON.parse(error.config.data) : null
        }
      });

      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Add robust email validation
  isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // Trim and lowercase
    email = email.trim().toLowerCase();

    // Basic email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Additional checks
    if (email.length > 254) return false; // Max email length
    if (email.includes('..')) return false; // No double dots
    if (email.startsWith('.') || email.endsWith('.')) return false; // No dots at start/end

    return emailRegex.test(email);
  }

  async verifyPayment(transactionRef) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${transactionRef}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Chapa verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  verifyWebhookSignature(body, signature) {
    try {
      console.log('Verifying signature:', {
        receivedSignature: signature,
        webhookSecret: this.webhookSecret?.substring(0, 10) + '...',
        bodyType: typeof body
      });

      // Convert body to string if it's an object
      const data = typeof body === 'string' ? body : JSON.stringify(body);

      const hash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(data)
        .digest('hex');

      console.log('Generated hash:', hash);
      console.log('Match:', hash === signature);

      return hash === signature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  async processWebhookEvent(event) {
    try {
      const { tx_ref, status, amount, currency, event: eventType } = event;

      console.log('Processing webhook event:', {
        tx_ref,
        status,
        eventType,
        amount,
        currency
      });

      // Check both status and event type
      const isSuccess = (status === 'success') ||
        (eventType === 'charge.success') ||
        (eventType && eventType.includes('success'));

      if (isSuccess) {
        return {
          success: true,
          transactionRef: tx_ref,
          status: 'completed',
          amount,
          currency
        };
      } else {
        return {
          success: false,
          transactionRef: tx_ref,
          status: 'failed',
          amount,
          currency
        };
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }
}

module.exports = new ChapaService();