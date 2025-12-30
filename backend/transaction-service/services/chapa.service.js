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
      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        {
          amount: paymentData.amount,
          currency: 'ETB',
          email: paymentData.email,
          first_name: paymentData.firstName,
          last_name: paymentData.lastName || '',
          tx_ref: paymentData.transactionRef,
          callback_url: process.env.CALLBACK_URL,
          return_url: process.env.RETURN_URL,
          customization: {
            title: 'Wubland Property Payment',
            description: paymentData.description || 'Property Transaction Payment'
          },
          meta: {
            invoice_id: paymentData.invoiceId,
            property_id: paymentData.propertyId,
            transaction_id: paymentData.transactionId,
            user_id: paymentData.userId
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        checkoutUrl: response.data.data.checkout_url
      };
    } catch (error) {
      console.error('Chapa initialization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
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