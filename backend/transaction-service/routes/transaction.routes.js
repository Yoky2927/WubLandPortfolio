const express = require('express');
const router = express.Router();
const { authenticate, authorize, authenticateInternal } = require('../middleware/auth.middleware'); // FIXED PATH
const rateLimit = require('express-rate-limit');

// Controllers
const offerController = require('../controllers/offer.controller');
const paymentController = require('../controllers/payment.controller');
const webhookController = require('../controllers/webhook.controller');

// Rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many payment attempts, please try again later'
});

// Offer Routes
router.post('/offers', authenticate, offerController.createOffer);
router.get('/offers/:id', authenticate, offerController.getOffer);
router.put('/offers/:id/accept', authenticate, offerController.acceptOffer);
router.put('/offers/:id/reject', authenticate, offerController.rejectOffer);
router.get('/properties/:propertyId/offers', authenticate, offerController.getPropertyOffers);
router.get('/user/offers', authenticate, offerController.getUserOffers);

router.post('/test/create-invoice', authenticate, async (req, res) => {
  try {
    const Invoice = require('../models/Invoice.model');
    
    const invoice = await Invoice.create({
      invoice_type: 'sale',
      from_user_id: req.user.id,
      to_user_id: 1, // Default admin user
      property_id: req.body.property_id || null,
      transaction_id: req.body.transaction_id || null,
      amount: req.body.amount || 1000,
      line_items: [
        {
          description: 'Test Payment',
          amount: req.body.amount || 1000,
          quantity: 1
        }
      ],
      notes: 'Test invoice for payment integration',
      created_by_user_id: req.user.id
    });

    res.json({
      success: true,
      message: 'Test invoice created',
      data: invoice
    });
  } catch (error) {
    console.error('Test invoice creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test invoice',
      error: error.message
    });
  }
});

// Payment Routes
router.post('/invoices/:invoiceId/pay', authenticate, paymentLimiter, paymentController.initializePayment);
router.get('/payments/verify', paymentController.verifyPayment);
router.get('/payments/:id', authenticate, paymentController.getPayment);
router.get('/user/payments', authenticate, paymentController.getUserPayments);

// Webhook Routes (public - called by Chapa)
router.post('/webhook/chapa', webhookController.handleChapaWebhook);
router.get('/webhook/health', webhookController.healthCheck);

// Internal API Routes
router.post('/internal/create-invoice', authenticateInternal, async (req, res) => {
  const Invoice = require('../models/Invoice.model');
  
  try {
    const invoice = await Invoice.create(req.body);
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/internal/transaction/:id', authenticateInternal, async (req, res) => {
  const Transaction = require('../models/Transaction.model');
  
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;