// communication-service/services/transactionService.js
import axios from 'axios';

class TransactionService {
  constructor() {
    this.baseURL = process.env.TRANSACTION_SERVICE_URL || 'http://localhost:5006';
    this.internalToken = process.env.INTERNAL_SERVICE_TOKEN;
  }

  async getTransaction(transactionId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/transactions/${transactionId}`, {
        headers: {
          'x-internal-token': this.internalToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error.message);
      return null;
    }
  }

  async getRentalTransactions(userId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/transactions/user/${userId}/rentals`, {
        headers: {
          'x-internal-token': this.internalToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching rental transactions:', error.message);
      return [];
    }
  }

  async getOverdueInvoices() {
    try {
      const response = await axios.get(`${this.baseURL}/api/invoices/overdue`, {
        headers: {
          'x-internal-token': this.internalToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching overdue invoices:', error.message);
      return [];
    }
  }

  async getActiveRentals() {
    try {
      const response = await axios.get(`${this.baseURL}/api/transactions/active-rentals`, {
        headers: {
          'x-internal-token': this.internalToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching active rentals:', error.message);
      return [];
    }
  }

  async createInvoice(invoiceData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/invoices`, invoiceData, {
        headers: {
          'x-internal-token': this.internalToken,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error.message);
      throw error;
    }
  }

  async sendPaymentReminder(transactionId, reminderData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/transactions/${transactionId}/send-reminder`, 
        reminderData,
        {
          headers: {
            'x-internal-token': this.internalToken,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending payment reminder:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const transactionService = new TransactionService();

export default transactionService;