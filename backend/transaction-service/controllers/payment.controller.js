const Payment = require('../models/Payment.model');
const Invoice = require('../models/Invoice.model');
const ChapaService = require('../services/chapa.service');
const db = require('../config/database');

class PaymentController {
  async initializePayment(req, res) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user.id || req.user.userId;

      console.log('PaymentController - User info:', {
        userId: userId,
        userEmail: req.user.email,
        hasEmail: !!req.user.email,
        userObject: req.user
      });

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

      // Get user details from database
      let userEmail = 'yokabdbi@gmail.com'; // Default fallback
      let userFirstName = 'User';

      try {
        // Fetch user details from database
        const [userRows] = await db.execute(
          'SELECT email, first_name FROM users WHERE id = ?',
          [userId]
        );

        if (userRows.length > 0) {
          userEmail = userRows[0].email || userEmail;
          userFirstName = userRows[0].first_name || userFirstName;
        }
      } catch (dbError) {
        console.log('Could not fetch user details from DB, using defaults:', dbError.message);
      }

      console.log('PaymentController - Using:', {
        email: userEmail,
        firstName: userFirstName,
        amount: invoice.balance_due
      });

      // Generate unique transaction reference
      const transactionRef = `wbl-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Initialize Chapa payment
      const chapaResponse = await ChapaService.initializePayment({
        amount: invoice.balance_due.toString(),
        email: userEmail,
        firstName: userFirstName,
        lastName: req.user.last_name || '',
        transactionRef: transactionRef,
        invoiceId: invoiceId,
        propertyId: invoice.property_id,
        userId: userId,
        description: `Payment for invoice ${invoice.invoice_number}`
      });

      if (!chapaResponse.success) {
        console.error('Chapa response failed:', chapaResponse.error);
        return res.status(500).json({
          success: false,
          message: 'Failed to initialize payment',
          error: chapaResponse.error?.message || 'Chapa API error'
        });
      }

      console.log('🎉 Chapa payment initialized successfully!', {
        hasCheckoutUrl: !!chapaResponse.checkoutUrl,
        tx_ref: chapaResponse.data?.data?.tx_ref || transactionRef,
        checkoutUrl: chapaResponse.checkoutUrl?.substring(0, 50) + '...'
      });

      // Get transaction reference from Chapa response or use our generated one
      const txRef = chapaResponse.data?.data?.tx_ref || transactionRef;

      try {
        // Create payment record
        const paymentData = {
          payment_type: 'deposit',
          invoice_id: parseInt(invoiceId),
          amount: parseFloat(invoice.balance_due),
          currency: invoice.currency || 'ETB',
          payment_method: 'chapa',
          payment_method_details: JSON.stringify({
            provider: 'chapa',
            transaction_ref: txRef,
            checkout_url: chapaResponse.checkoutUrl
          }),
          from_user_id: parseInt(userId),
          to_user_id: parseInt(invoice.to_user_id) || 1,
          transaction_id: txRef,
          notes: `Payment initialized for invoice ${invoice.invoice_number}`,
          payment_status: 'processing'
        };

        console.log('Creating payment record with:', paymentData);

        const newPayment = await Payment.create(paymentData);
        console.log('✅ Created payment record:', newPayment.id);

      } catch (dbError) {
        console.error('Database error creating payment:', dbError.message);
        // Don't fail the payment if DB update fails
        // Log the error but continue
      }

      // Return success with checkout URL
      return res.json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          checkoutUrl: chapaResponse.checkoutUrl,
          transactionRef: txRef
        }
      });

    } catch (error) {
      console.error('Initialize payment error:', error);

      // If we have a checkout URL despite other errors, return it
      if (error.chapaResponse?.checkoutUrl) {
        console.log('Returning checkout URL despite other errors');
        return res.json({
          success: true,
          message: 'Payment initialized (with warnings)',
          data: {
            checkoutUrl: error.chapaResponse.checkoutUrl,
            warning: 'Payment initialized but some operations failed'
          }
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error initializing payment',
        error: error.message
      });
    }
  }

  async verifyPayment(req, res) {
    try {
      console.log('🔍 VERIFY PAYMENT REQUEST DETAILS:');
      console.log('Full URL:', req.originalUrl);
      console.log('Query params:', req.query);
      console.log('Request method:', req.method);
      console.log('Headers:', req.headers);

      const transactionRef = req.query.transaction_ref;

      console.log('Extracted transactionRef:', transactionRef);
      console.log('Type:', typeof transactionRef);

      if (!transactionRef) {
        console.log('❌ ERROR: No transactionRef found in query params');
        console.log('All query params:', JSON.stringify(req.query, null, 2));

        return res.status(400).json({
          success: false,
          message: 'Transaction reference is required',
          receivedParams: req.query // Include what we actually got
        });
      }

      console.log('✅ Transaction ref found:', transactionRef);

      // Rest of your verification code...
    } catch (error) {
      console.error('Verify payment error:', error);
      return res.status(500).json({
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

      return res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Get payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching payment',
        error: error.message
      });
    }
  }

  async getUserPayments(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { type } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const payments = await Payment.findByUser(userId, type || 'sent');

      return res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Get user payments error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user payments',
        error: error.message
      });
    }
  }

  // Helper method to test payment without invoice
  async testPayment(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { amount = 100 } = req.body;

      // Generate test invoice
      const testInvoice = await Invoice.create({
        invoice_type: 'sale',
        from_user_id: userId,
        to_user_id: 1, // Admin user
        amount: parseFloat(amount),
        currency: 'ETB',
        line_items: [{
          description: 'Test Payment',
          amount: parseFloat(amount),
          quantity: 1
        }],
        notes: 'Test invoice for payment integration',
        created_by_user_id: userId
      });

      console.log('Created test invoice:', testInvoice.id);

      // Call initializePayment with the test invoice
      req.params = { invoiceId: testInvoice.id };
      return this.initializePayment(req, res);

    } catch (error) {
      console.error('Test payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating test payment',
        error: error.message
      });
    }
  }
}

module.exports = new PaymentController();