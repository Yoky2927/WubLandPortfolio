// components/PaymentModal.jsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect } from "react";
import { 
  X, CreditCard, Building, DollarSign, Calendar, 
  Shield, Clock, CheckCircle, Wallet, FileText, AlertCircle 
} from "lucide-react";
import { toast } from "react-hot-toast";
import { directApi, apiCall } from "../utils/api.endpoints";

const PaymentModal = ({ isOpen, onClose, onSubmit, userType, theme, property }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [invoiceId, setInvoiceId] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    property_id: property?.id || "",
    payment_type: userType === "renter" ? "rent" : "down_payment",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setIsLoading(false);
      setInvoiceCreated(false);
      setInvoiceId(null);
      
      // Set initial amount based on property
      if (property?.price) {
        setFormData(prev => ({
          ...prev,
          amount: property.price.toString(),
          property_id: property.id,
          description: `Payment for ${property.title}`
        }));
      }
    }
  }, [isOpen, property]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Step 1: Create Invoice
  const createInvoice = async () => {
    try {
      setIsLoading(true);
      
      // Validate form data
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        toast.error("Please enter a valid amount");
        return false;
      }

      if (!property?.id) {
        toast.error("Property information is missing");
        return false;
      }

      // Create invoice dynamically
      const invoiceResponse = await apiCall(
        "CREATE_INVOICE_FOR_PROPERTY",
        {},
        {
          method: "POST",
          data: {
            property_id: property.id,
            amount: parseFloat(formData.amount),
            invoice_type: userType === "renter" ? "rent" : "sale",
            description: formData.description || `Payment for ${property.title}`,
            metadata: {
              user_type: userType,
              payment_for: userType === "buyer" ? "property_purchase" : "rental_deposit",
              property_title: property.title,
              property_location: property.location
            }
          }
        }
      );

      if (invoiceResponse.success && invoiceResponse.data?.id) {
        setInvoiceId(invoiceResponse.data.id);
        setInvoiceCreated(true);
        toast.success("Invoice created successfully");
        return true;
      } else {
        toast.error(invoiceResponse.message || "Failed to create invoice");
        return false;
      }

    } catch (error) {
      console.error("Create invoice error:", error);
      toast.error(error.message || "Failed to create invoice");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Initialize Payment with Chapa
  const initializePayment = async () => {
    try {
      if (!invoiceId) {
        toast.error("Invoice not created yet");
        return;
      }

      setIsLoading(true);
      
      // Get user info from localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      const paymentResponse = await directApi.initializePayment(invoiceId, {
        amount: parseFloat(formData.amount),
        description: formData.description,
        userType: userType,
        property_title: property?.title,
        location: property?.location,
        user_id: user.id,
        user_email: user.email || 'yokabd@gmail.com'
      });

      console.log("Payment response:", paymentResponse);

      if (paymentResponse.success && paymentResponse.data?.checkoutUrl) {
        // Store the transaction reference before redirecting
        if (paymentResponse.data.transactionRef) {
          localStorage.setItem('lastTransactionRef', paymentResponse.data.transactionRef);
        }
        
        // Store current page for return
        localStorage.setItem('lastPageBeforePayment', window.location.pathname);
        
        // Redirect to Chapa checkout
        window.location.href = paymentResponse.data.checkoutUrl;
        
        // Show success message
        toast.success("Redirecting to secure payment...");
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1000);
        
      } else {
        throw new Error(paymentResponse.message || "Failed to initialize payment");
      }

    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error(error.message || "Payment initialization failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Create invoice before moving to payment step
      const success = await createInvoice();
      if (success) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 3) {
      await initializePayment();
    }
  };

  if (!isOpen) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl animate-slideUp ${
        isDark 
          ? "bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
          : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
      }`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
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
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step === currentStep
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
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
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
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
                <div className={`p-4 rounded-xl ${
                  isDark 
                    ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30'
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{property.title}</h4>
                      <p className="text-sm text-gray-500">{property.location}</p>
                      <p className="text-lg font-bold text-amber-600 mt-1">
                        {property.currency || 'ETB'} {property.price?.toLocaleString() || '0'}
                      </p>
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
                    min="1"
                    step="0.01"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                        : 'bg-white border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
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
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 ${
                        formData.payment_type === type.value
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                          : isDark
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
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      : 'bg-white border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Invoice Created Successfully */}
              {invoiceCreated && invoiceId && (
                <div className={`p-4 rounded-xl ${
                  isDark 
                    ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30'
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-700 dark:text-green-300 mb-1">
                        Invoice Created Successfully!
                      </h4>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Invoice #{invoiceId} has been created. Ready to proceed with payment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Chapa Payment Info */}
              <div className={`p-4 rounded-xl ${
                isDark 
                  ? 'bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-700/30'
                  : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
              }`}>
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

              {/* Payment Summary */}
              <div className={`p-4 rounded-xl ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30'
                  : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
              }`}>
                <h4 className="font-medium mb-3">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Property</span>
                    <span className="font-medium">{property?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="font-bold text-amber-600">
                      ETB {parseFloat(formData.amount || 0).toLocaleString('en-ET')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Payment Type</span>
                    <span className="font-medium capitalize">{formData.payment_type?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Final Confirmation */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/30">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-700 dark:text-green-300 mb-1">
                      Ready to Pay
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Click "Proceed to Payment" to complete your transaction securely through Chapa.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Invoice:</span>
                    <span className="font-mono">#{invoiceId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gateway:</span>
                    <span className="font-medium">Chapa (ETB)</span>
                  </div>
                  <div className="pt-3 border-t border-green-200 dark:border-green-700/30">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-green-600 dark:text-green-400">
                        ETB {parseFloat(formData.amount || 0).toLocaleString('en-ET')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms Confirmation */}
              <div className={`p-4 rounded-xl ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30'
                  : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="w-4 h-4 mt-1 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <p className="text-sm font-medium">I agree to the terms</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      I authorize this payment to be processed through Chapa. I understand that I will be redirected to Chapa's secure payment gateway.
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
                disabled={isLoading}
                className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading || (currentStep === 1 && (!formData.amount || parseFloat(formData.amount) <= 0))}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Continue"}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || !invoiceId}
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
                    Proceed to Payment
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