// components/PaymentModal.jsx - UPDATED VERSION
import React, { useState, useEffect } from "react";
import { X, CreditCard, Building, DollarSign, Calendar, Shield, Clock, CheckCircle, Wallet, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { directApi } from "../utils/api.endpoints"; // Make sure this is imported

const PaymentModal = ({ isOpen, onClose, onSubmit, userType, theme, property, invoiceId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: "",
    property_id: "",
    payment_type: userType === "renter" ? "rent" : "down_payment",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setIsLoading(false);
    }
  }, [isOpen]);

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
      let invoiceIdToUse = invoiceId;

      // If no invoiceId provided, create a test invoice
      if (!invoiceIdToUse) {
        toast.loading('Creating invoice...');

        const invoiceResponse = await directApi.createTestInvoice({
          amount: parseFloat(formData.amount),
          property_id: property?.id,
          description: formData.description || `Payment for ${property?.title || 'property'}`
        });

        toast.dismiss();

        if (!invoiceResponse.success) {
          throw new Error('Failed to create invoice');
        }

        invoiceIdToUse = invoiceResponse.data.id;
        toast.success('Invoice created successfully');
      }

      // Now initialize payment with the invoice ID
      const paymentResponse = await directApi.initializePayment(invoiceIdToUse, {
        amount: parseFloat(formData.amount),
        description: formData.description || `Payment for ${property?.title || 'property'}`,
        userType: userType,
        property_title: property?.title,
        location: property?.location,
      });

      if (paymentResponse.success && paymentResponse.data.checkoutUrl) {
        // Redirect to Chapa checkout
        window.location.href = paymentResponse.data.checkoutUrl;
      } else {
        toast.error(paymentResponse.message || "Failed to initialize payment");
      }

    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl animate-slideUp ${theme === "dark"
          ? "bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
          : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
        }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {userType === 'renter' ? 'Make Rent Payment' : 'Make Payment'}
                </h2>
                <p className="text-sm text-gray-500">Secure payment processing via Chapa</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${step === currentStep
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    : step < currentStep
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}>
                  {step < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                <span className="text-xs mt-2 text-gray-500">
                  {step === 1 ? "Details" : step === 2 ? "Payment" : "Confirm"}
                </span>
              </div>
            ))}
            <div className="flex-1 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700 relative -top-4">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Property Info */}
              {property && (
                <div className={`p-4 rounded-xl ${theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30'
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
                  }`}>
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{property.title}</h4>
                      <p className="text-sm text-gray-500">{property.location}</p>
                    </div>
                  </div>
                </div>
              )}

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
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                        : 'bg-white border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      }`}
                    required
                  />
                </div>
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Payment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'rent', label: 'Rent', icon: <Building className="w-4 h-4" /> },
                    { value: 'deposit', label: 'Deposit', icon: <FileText className="w-4 h-4" /> },
                    { value: 'down_payment', label: 'Down Payment', icon: <DollarSign className="w-4 h-4" /> },
                    { value: 'service', label: 'Service Fee', icon: <Wallet className="w-4 h-4" /> },
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_type: type.value }))}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 ${formData.payment_type === type.value
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : theme === 'dark'
                            ? "border-gray-700 hover:border-gray-500"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                    >
                      {type.icon}
                      <span className="text-sm">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Payment description..."
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      : 'bg-white border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                    }`}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Chapa Payment Info */}
              <div className={`p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/30`}>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-2">
                      Payment via Chapa
                    </h4>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      You will be redirected to Chapa's secure payment gateway. Chapa supports Ethiopian Birr (ETB) payments via mobile money, bank transfer, and cards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods Supported */}
              <div>
                <label className="block text-sm font-medium mb-2">Available Payment Methods</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">ETB</span>
                    </div>
                    <span className="text-xs">Bank Transfer</span>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-xs">Mobile Money</span>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="text-xs">Cards</span>
                  </div>
                </div>
              </div>

              {/* Ethiopian Currency Note */}
              <div className={`p-4 rounded-xl ${theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30'
                  : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
                }`}>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Ethiopian Currency (ETB)
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      All payments are processed in Ethiopian Birr (ETB). If you're using a foreign card, currency conversion will be applied by your bank.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/30">
                <h4 className="font-medium text-green-700 dark:text-green-300 mb-3">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
                    <span className="font-medium">ETB {parseFloat(formData.amount || 0).toLocaleString('en-ET')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Payment Type</span>
                    <span className="font-medium capitalize">{formData.payment_type?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gateway</span>
                    <span className="font-medium">Chapa</span>
                  </div>
                  <div className="pt-2 border-t border-green-200 dark:border-green-700/30">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-green-600 dark:text-green-400">
                        ETB {parseFloat(formData.amount || 0).toLocaleString('en-ET')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ethiopian Payment Note */}
              <div className={`p-4 rounded-xl ${theme === 'dark'
                  ? 'bg-gradient-to-r from-amber-50/10 to-orange-50/10 border border-amber-700/30'
                  : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
                }`}>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                      Secure Ethiopian Transaction
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Your payment is processed through Chapa, Ethiopia's leading payment gateway. All transactions are secure, encrypted, and compliant with NBE regulations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmation */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="w-4 h-4 mt-1 rounded text-green-500 focus:ring-green-500"
                  />
                  <div>
                    <p className="text-sm font-medium">Confirm Payment</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      I authorize this payment to be processed through Chapa. I understand that I will be redirected to Chapa's secure payment gateway to complete this transaction.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Proceed to Chapa
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;