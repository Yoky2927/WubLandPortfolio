import React, { useState } from "react";
import { X, CreditCard, Building, DollarSign, Calendar, Shield } from "lucide-react";

const PaymentModal = ({ isOpen, onClose, onSubmit, userType, theme }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [formData, setFormData] = useState({
    amount: "",
    property_id: "",
    payment_type: userType === "renter" ? "rent" : "down_payment",
    description: "",
    card_number: "",
    expiry_date: "",
    cvv: "",
    save_card: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Format payment data
      const paymentData = {
        amount: parseFloat(formData.amount),
        payment_method: paymentMethod,
        property_id: formData.property_id,
        payment_type: formData.payment_type,
        description: formData.description || `Payment for ${userType === "renter" ? "rent" : "property"}`,
        metadata: {
          user_type: userType,
          payment_date: new Date().toISOString(),
        }
      };

      // Add card details if paying by credit card
      if (paymentMethod === "credit_card") {
        paymentData.card_details = {
          last_four: formData.card_number.slice(-4),
          expiry_month: formData.expiry_date.split("/")[0],
          expiry_year: formData.expiry_date.split("/")[1],
          save_card: formData.save_card,
        };
      }

      await onSubmit(paymentData);
      
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-md rounded-xl shadow-2xl ${
        theme === "dark" ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CreditCard className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {userType === 'renter' ? 'Make Rent Payment' : 'Make Payment'}
              </h2>
              <p className="text-sm text-gray-500">Secure payment processing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount (ETB)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {["credit_card", "bank_transfer", "mobile_money", "cash"].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${
                    paymentMethod === method
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : theme === 'dark'
                        ? "border-gray-700 hover:border-gray-500"
                        : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm capitalize">{method.replace("_", " ")}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card Details (if credit card selected) */}
          {paymentMethod === "credit_card" && (
            <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div>
                <label className="block text-sm font-medium mb-2">Card Number</label>
                <input
                  type="text"
                  name="card_number"
                  value={formData.card_number}
                  onChange={handleChange}
                  placeholder="1234 5678 9012 3456"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Date</label>
                  <input
                    type="text"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleChange}
                    placeholder="123"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="save_card"
                  checked={formData.save_card}
                  onChange={handleChange}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Save card for future payments</span>
              </label>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Payment description..."
              className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>

          {/* Security Note */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              All payments are processed securely using 256-bit SSL encryption. Your payment information is never stored on our servers.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;