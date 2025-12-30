const Chapa = require('chapa-nodejs');
require('dotenv').config();

// Initialize Chapa with secret key
const chapa = new Chapa(process.env.CHAPA_SECRET_KEY);

module.exports = {
  chapa,
  initializePayment: async (paymentData) => {
    try {
      const response = await chapa.initialize({
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
        }
      });
      return response;
    } catch (error) {
      console.error('Chapa initialization error:', error);
      throw error;
    }
  },
  verifyPayment: async (transactionRef) => {
    try {
      const response = await chapa.verify(transactionRef);
      return response;
    } catch (error) {
      console.error('Chapa verification error:', error);
      throw error;
    }
  }
};