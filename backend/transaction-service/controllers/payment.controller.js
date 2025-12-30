const Payment = require('../models/Payment.model');
const Invoice = require('../models/Invoice.model');
const ChapaService = require('../services/chapa.service');
const { v4: uuidv4 } = require('uuid');

class PaymentController {
  async initializePayment(req, res) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user.id;

      // Get invoice details
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Verify user owns the invoice
      if (invoice.from_user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to pay this invoice'
        });
      }

      // Create payment record
      const transactionRef = `wbl-${uuidv4()}-${Date.now()}`;
      const payment = await Payment.create({
        payment_type: 'deposit',
        invoice_id: invoiceId,
        amount: invoice.balance_due,
        currency: invoice.currency,
        net_amount: invoice.balance_due,
        payment_method: 'mobile_money',
        payment_method_details: {
          provider: 'chapa',
          transaction_ref: transactionRef
        },
        from_user_id: invoice.from_user_id,
        to_user_id: invoice.to_user_id,
        transaction_id: invoice.transaction_id,
        notes: `Payment for invoice #${invoice.invoice_number}`
      });

      // Initialize Chapa payment
      const chapaResponse = await ChapaService.initializePayment({
        amount: invoice.balance_due.toString(),
        email: req.user.email || 'user@example.com',
        firstName: req.user.first_name || 'User',
        lastName: req.user.last_name || '',
        transactionRef: transactionRef,
        invoiceId: invoiceId,
        propertyId: invoice.property_id,
        transactionId: invoice.transaction_id,
        userId: userId,
        description: `Payment for invoice ${invoice.invoice_number}`
      });

      if (!chapaResponse.success) {
        await Payment.updateStatus(payment.id, 'failed');
        
        return res.status(500).json({
          success: false,
          message: 'Failed to initialize payment',
          error: chapaResponse.error
        });
      }

      await Payment.updateStatus(
        payment.id,
        'processing',
        transactionRef
      );

      res.json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          payment,
          checkoutUrl: chapaResponse.checkoutUrl
        }
      });
    } catch (error) {
      console.error('Initialize payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing payment',
        error: error.message
      });
    }
  }

  async verifyPayment(req, res) {
    try {
      const { transactionRef } = req.query;

      const verification = await ChapaService.verifyPayment(transactionRef);

      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
          error: verification.error
        });
      }

      const chapaData = verification.data.data;
      const payment = await Payment.findByTransactionRef(transactionRef);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment record not found'
        });
      }

      if (chapaData.status === 'success') {
        await Payment.updateStatus(
          payment.id,
          'completed',
          transactionRef,
          chapaData.receipt_url
        );

        await Invoice.updateStatus(
          payment.invoice_id,
          'paid',
          payment.amount
        );

        res.json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            payment,
            invoice: await Invoice.findById(payment.invoice_id)
          }
        });
      } else {
        await Payment.updateStatus(payment.id, 'failed');

        res.status(400).json({
          success: false,
          message: 'Payment failed',
          data: chapaData
        });
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying payment',
        error: error.message
      });
    }
  }

  async getPayment(req, res) {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment',
        error: error.message
      });
    }
  }

  async getUserPayments(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.query;

      const payments = await Payment.findByUser(userId, type || 'sent');

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Get user payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user payments',
        error: error.message
      });
    }
  }
}

module.exports = new PaymentController();