// routes/transaction.routes.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const { authenticate, authorize, authenticateInternal } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

// IMPORT DATABASE CONNECTION
const db = require('../config/database');

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

// Test Invoice Creation
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

// Dynamic Invoice Creation for Properties - FIXED QUERY
router.post('/invoices/create-for-property', authenticate, async (req, res) => {
  try {
    const { property_id, amount, invoice_type, description, metadata } = req.body;
    const userId = req.user.id;
    
    console.log('Creating invoice for property:', {
      userId,
      property_id,
      amount,
      invoice_type
    });

    // FIXED QUERY: Using owner_user_id instead of user_id
    const [propertyRows] = await db.execute(
      'SELECT id, owner_user_id, title, price FROM properties WHERE id = ?',
      [property_id]
    );
    
    if (propertyRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    const property = propertyRows[0];
    
    // Determine who pays whom based on invoice type
    let from_user_id, to_user_id;
    
    if (invoice_type === 'rent') {
      // Renter pays landlord
      from_user_id = userId; // Renter
      to_user_id = property.owner_user_id; // Landlord
    } else if (invoice_type === 'sale') {
      // Buyer pays seller
      from_user_id = userId; // Buyer
      to_user_id = property.owner_user_id; // Seller
    } else if (invoice_type === 'deposit') {
      // Buyer pays deposit to seller
      from_user_id = userId; // Buyer
      to_user_id = property.owner_user_id; // Seller
    } else {
      // Default: user pays platform
      from_user_id = userId;
      to_user_id = 1; // Platform admin user
    }
    
    // Create the invoice
    const Invoice = require('../models/Invoice.model');
    const invoice = await Invoice.create({
      invoice_type: invoice_type,
      from_user_id: from_user_id,
      to_user_id: to_user_id,
      property_id: property_id,
      amount: parseFloat(amount),
      currency: 'ETB',
      line_items: [{
        description: description || `Payment for ${property.title}`,
        amount: parseFloat(amount),
        quantity: 1
      }],
      notes: metadata ? JSON.stringify(metadata) : '',
      created_by_user_id: userId
    });
    
    console.log('Invoice created:', invoice.id);
    
    return res.json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
    
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
});

// Create invoice without property (for general payments)
router.post('/invoices/create', authenticate, async (req, res) => {
  try {
    const { amount, invoice_type, description, to_user_id, metadata } = req.body;
    const userId = req.user.id;
    
    const Invoice = require('../models/Invoice.model');
    const invoice = await Invoice.create({
      invoice_type: invoice_type || 'general',
      from_user_id: userId,
      to_user_id: to_user_id || 1, // Default to admin
      amount: parseFloat(amount),
      currency: 'ETB',
      line_items: [{
        description: description || 'Payment',
        amount: parseFloat(amount),
        quantity: 1
      }],
      notes: metadata ? JSON.stringify(metadata) : '',
      created_by_user_id: userId
    });
    
    return res.json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
    
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
});

// ADD: Direct payment initialization endpoint (creates invoice + payment in one step)
router.post('/payments/initialize', authenticate, paymentLimiter, async (req, res) => {
  try {
    const { property_id, amount, invoice_type, description, metadata } = req.body;
    const userId = req.user.id;
    
    console.log('Initializing payment:', {
      userId,
      property_id,
      amount,
      invoice_type
    });

    // 1. Create invoice
    let property = null;
    let to_user_id = 1; // Default to admin
    
    if (property_id) {
      // Get property owner
      const [propertyRows] = await db.execute(
        'SELECT id, owner_user_id, title, price FROM properties WHERE id = ?',
        [property_id]
      );
      
      if (propertyRows.length > 0) {
        property = propertyRows[0];
        to_user_id = property.owner_user_id;
      }
    }
    
    const Invoice = require('../models/Invoice.model');
    const invoice = await Invoice.create({
      invoice_type: invoice_type || 'sale',
      from_user_id: userId,
      to_user_id: to_user_id,
      property_id: property_id || null,
      amount: parseFloat(amount),
      currency: 'ETB',
      line_items: [{
        description: description || (property ? `Payment for ${property.title}` : 'Payment'),
        amount: parseFloat(amount),
        quantity: 1
      }],
      notes: metadata ? JSON.stringify(metadata) : '',
      created_by_user_id: userId
    });
    
    console.log('Invoice created:', invoice.id);
    
    // 2. Now initialize payment with the invoice
    // We need to call the payment controller's initializePayment method
    // To do this properly, we should either:
    // a) Call the controller method directly, or
    // b) Make the initializePayment function available
    
    // For simplicity, let's redirect to the existing endpoint
    req.params = { invoiceId: invoice.id };
    return paymentController.initializePayment(req, res);
    
  } catch (error) {
    console.error('Initialize payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error initializing payment',
      error: error.message
    });
  }
});

// Test endpoint
router.get('/test/auth-check', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Auth check passed',
    user: req.user
  });
});

module.exports = router;