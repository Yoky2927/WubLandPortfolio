// src/pages/PaymentVerificationPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Loader, CreditCard, Home, AlertCircle, 
  ArrowLeft, Shield, Sparkles, Clock, ExternalLink, Download,
  FileText, Building, Banknote, UserCheck, ChevronRight,
  RefreshCw, Info, HelpCircle, Calendar, Globe, Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { directApi } from '../utils/api.endpoints';
import { useTheme } from '../contexts/ThemeContext';

const PaymentVerificationPage = () => {
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [verificationTime, setVerificationTime] = useState(0);

  const isDark = theme === "dark";

  // Get transaction reference from URL parameters
  const getTransactionRef = useCallback(() => {
    const txRef = searchParams.get('tx_ref') || 
                  searchParams.get('transaction_ref') || 
                  searchParams.get('reference') ||
                  searchParams.get('trxref');
    
    console.log('🔍 Payment verification - Transaction ref:', txRef);
    console.log('All URL params:', Object.fromEntries(searchParams.entries()));
    
    return txRef;
  }, [searchParams]);

  // Function to verify payment
  const verifyPayment = useCallback(async (txRef) => {
    if (!txRef) {
      console.log('❌ No transaction reference found');
      setError('No transaction reference found in URL');
      setStatus('failed');
      return;
    }

    console.log('💰 Verifying payment with ref:', txRef);
    setIsLoading(true);

    try {
      // Call the verification API
      const response = await directApi.verifyPayment(txRef);
      console.log('✅ Payment verification response:', response);

      if (response.success) {
        setStatus('success');
        setPaymentData(response.data);
        setError(null);
        
        toast.success('Payment completed successfully!', {
          duration: 5000,
          icon: '🎉',
          style: {
            background: isDark ? '#064e3b' : '#d1fae5',
            color: isDark ? '#a7f3d0' : '#065f46',
            border: isDark ? '1px solid #047857' : '1px solid #10b981'
          }
        });

        // Automatically redirect after 10 seconds
        setTimeout(() => {
          const fromPage = localStorage.getItem('lastPageBeforePayment') || '/dashboard';
          navigate(fromPage);
        }, 10000);

      } else {
        setStatus('failed');
        setError(response.error || 'Payment verification failed');
        
        toast.error('Payment verification failed', {
          duration: 5000,
          icon: '❌',
          style: {
            background: isDark ? '#7f1d1d' : '#fef2f2',
            color: isDark ? '#fecaca' : '#991b1b',
            border: isDark ? '1px solid #991b1b' : '1px solid #fecaca'
          }
        });
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setStatus('failed');
      setError(err.message || 'Payment verification failed');
      
      toast.error('Payment verification failed', {
        duration: 5000,
        icon: '⚠️',
        style: {
          background: isDark ? '#7f1d1d' : '#fef2f2',
          color: isDark ? '#fecaca' : '#991b1b',
          border: isDark ? '1px solid #991b1b' : '1px solid #fecaca'
        }
      });
      
      // Auto-retry logic (max 3 retries)
      if (retryCount < 3) {
        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);
        
        toast.info(`Retrying verification... (${nextRetryCount}/3)`, {
          duration: 3000,
          icon: '🔄'
        });
        
        // Wait 3 seconds before retrying
        setTimeout(() => {
          verifyPayment(txRef);
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, isDark, retryCount]);

  // Handle initial verification
  useEffect(() => {
    const txRef = getTransactionRef();
    
    if (txRef) {
      // Start verification timer
      const timer = setInterval(() => {
        setVerificationTime(prev => prev + 1);
      }, 1000);

      // Start verification process
      const timeoutId = setTimeout(() => {
        verifyPayment(txRef);
      }, 2000);

      return () => {
        clearInterval(timer);
        clearTimeout(timeoutId);
      };
    } else {
      setError('No transaction reference found in URL');
      setStatus('failed');
    }
  }, [getTransactionRef, verifyPayment]);

  // Handle manual retry
  const handleRetry = () => {
    const txRef = getTransactionRef();
    if (txRef) {
      setRetryCount(0);
      setVerificationTime(0);
      setStatus('verifying');
      setError(null);
      verifyPayment(txRef);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    const fromPage = localStorage.getItem('lastPageBeforePayment') || '/dashboard';
    navigate(fromPage);
  };

  // Handle go home
  const handleGoHome = () => {
    navigate('/');
  };

  // Format currency
  const formatCurrency = (amount, currency = 'ETB') => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ET', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Modal Container */}
      <div className={`w-full max-w-4xl rounded-3xl shadow-2xl ${isDark 
        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-amber-800/30' 
        : 'bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200'
      } border-2 transition-all duration-500 overflow-hidden`}>
        
        {/* Header with gradient */}
        <div className={`p-8 border-b ${isDark 
          ? 'border-amber-800/30 bg-gradient-to-r from-amber-900/20 via-amber-800/20 to-amber-900/20' 
          : 'border-amber-200 bg-gradient-to-r from-amber-50/80 via-amber-100/50 to-amber-50/80'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isDark 
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20' 
                : 'bg-gradient-to-br from-amber-100 to-amber-200'
              }`}>
                <CreditCard className={`w-8 h-8 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Payment Verification
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
                    <span className={`text-sm font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                      Verifying... ({verificationTime}s)
                    </span>
                  </div>
                  <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-amber-600' : 'bg-amber-800'}`} />
                  <div className={`text-sm font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                    Transaction Security
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleGoBack}
              className={`p-3 rounded-xl transition-all duration-300 ${isDark 
                ? 'hover:bg-amber-900/30 hover:scale-105 text-amber-300' 
                : 'hover:bg-amber-100 hover:scale-105 text-amber-600'
              } active:scale-95`}
              disabled={isLoading}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {status === 'verifying' && (
            <div className="text-center space-y-8 py-8">
              <div className="relative">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 flex items-center justify-center">
                  <div className="w-24 h-24 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-12 h-12 text-amber-500" />
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-4 font-montserrat bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                  Verifying Your Payment
                </h3>
                <p className={`text-gray-600 dark:text-gray-300 mb-4 font-inter`}>
                  Please wait while we verify your transaction with Chapa.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-inter text-amber-700 dark:text-amber-300">
                    Secure verification in progress...
                  </span>
                </div>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className={`p-4 rounded-xl border ${isDark 
                  ? 'bg-amber-900/10 border-amber-800/30' 
                  : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                      Transaction Reference:
                    </span>
                    <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-300">
                      {getTransactionRef()?.substring(0, 20)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                      Elapsed Time:
                    </span>
                    <span className="text-sm font-inter text-amber-700 dark:text-amber-300">
                      {verificationTime} seconds
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-sm font-inter text-amber-600 dark:text-amber-400">
                  <div className="flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    <span>This may take a few moments</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && paymentData && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center mb-6">
                  <CheckCircle className="w-16 h-16 text-emerald-500" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 font-montserrat bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  Payment Successful! 🎉
                </h3>
                <p className={`text-gray-600 dark:text-gray-300 mb-6 font-inter`}>
                  Your payment has been processed successfully and verified.
                </p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-inter text-emerald-700 dark:text-emerald-300">
                    Transaction verified and completed
                  </span>
                </div>
              </div>

              {/* Transaction Details */}
              <div className={`rounded-2xl border p-6 ${isDark 
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-amber-800/30' 
                : 'bg-gradient-to-r from-amber-50 to-amber-100/30 border-amber-200'
              }`}>
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h4 className={`font-semibold font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                    Transaction Details
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-900/20' : 'bg-amber-100/50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-800" />
                        <span className={`text-sm font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                          Amount Paid
                        </span>
                      </div>
                      <p className="text-2xl font-bold font-montserrat text-amber-700 dark:text-amber-300">
                        {formatCurrency(paymentData.amount || paymentData.payment?.amount || 0)}
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-900/20' : 'bg-amber-100/50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-800" />
                        <span className={`text-sm font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                          Date & Time
                        </span>
                      </div>
                      <p className="text-lg font-inter text-amber-700 dark:text-amber-300">
                        {formatDate(paymentData.created_at || new Date())}
                      </p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-900/20' : 'bg-amber-100/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-800" />
                      <span className={`text-sm font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                        Transaction Reference
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm text-amber-700 dark:text-amber-300">
                        {paymentData.transaction_ref || getTransactionRef()}
                      </p>
                      <button
                        onClick={() => navigator.clipboard.writeText(paymentData.transaction_ref || getTransactionRef())}
                        className="p-2 rounded-lg bg-amber-200 dark:bg-amber-900/30 hover:bg-amber-300 dark:hover:bg-amber-900/50"
                      >
                        <span className="text-xs font-inter text-amber-700 dark:text-amber-300">Copy</span>
                      </button>
                    </div>
                  </div>

                  {paymentData.invoice && (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-900/20' : 'bg-amber-100/50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-amber-600 dark:text-amber-800" />
                        <span className={`text-sm font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                          Invoice Details
                        </span>
                      </div>
                      <p className="font-inter text-amber-700 dark:text-amber-300">
                        Invoice #{paymentData.invoice?.invoice_number || 'N/A'}
                      </p>
                    </div>
                  )}

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-100/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className={`text-sm font-inter ${isDark ? 'text-emerald-800/80' : 'text-emerald-600/80'}`}>
                        Status
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="font-semibold font-inter text-emerald-700 dark:text-emerald-300">
                          Completed
                        </span>
                      </div>
                      <span className="text-xs font-inter px-2 py-1 rounded-full bg-emerald-200 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${isDark 
                  ? 'bg-blue-900/10 border-blue-800/30' 
                  : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className={`text-sm font-inter ${isDark ? 'text-blue-300/80' : 'text-blue-700/80'}`}>
                      You will be redirected in 10 seconds...
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={handleGoBack}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-inter font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                  </button>
                  
                  <button
                    onClick={handleGoHome}
                    className="py-3 px-4 rounded-xl border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 font-inter font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Go to Home
                  </button>
                  
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-inter font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 flex items-center justify-center mb-6">
                  <XCircle className="w-16 h-16 text-red-500" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 font-montserrat bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  Payment Failed
                </h3>
                <p className={`text-gray-600 dark:text-gray-300 mb-6 font-inter`}>
                  {error || 'Your payment could not be processed. Please try again.'}
                </p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-inter text-red-700 dark:text-red-300">
                    Verification unsuccessful
                  </span>
                </div>
              </div>

              {/* Error Details */}
              <div className={`rounded-2xl border p-6 ${isDark 
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-red-800/30' 
                : 'bg-gradient-to-r from-red-50 to-rose-50/30 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h4 className={`font-semibold font-inter ${isDark ? 'text-red-200' : 'text-red-800'}`}>
                    What went wrong?
                  </h4>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    <p className={`text-sm font-inter ${isDark ? 'text-red-300/80' : 'text-red-700/80'}`}>
                      The payment could not be verified with our payment processor.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    <p className={`text-sm font-inter ${isDark ? 'text-red-300/80' : 'text-red-700/80'}`}>
                      Your funds are safe and have not been charged.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    <p className={`text-sm font-inter ${isDark ? 'text-red-300/80' : 'text-red-700/80'}`}>
                      You can try the payment again or contact support for assistance.
                    </p>
                  </div>
                </div>

                {getTransactionRef() && (
                  <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-red-900/20' : 'bg-red-100/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className={`text-sm font-inter ${isDark ? 'text-red-800/80' : 'text-red-600/80'}`}>
                        Transaction Reference
                      </span>
                    </div>
                    <p className="font-mono text-sm text-red-700 dark:text-red-300">
                      {getTransactionRef()}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-inter font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleGoBack}
                  className="py-3 px-4 rounded-xl border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 font-inter font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>
                
                <button
                  onClick={() => navigate('/help')}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-inter font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Get Help
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${isDark 
          ? 'border-amber-800/30 bg-gradient-to-r from-gray-900/50 to-gray-800/50' 
          : 'border-amber-200 bg-gradient-to-r from-white to-amber-50/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
                <Globe className="w-4 h-4 text-amber-600 dark:text-amber-800" />
              </div>
              <div>
                <p className={`text-sm font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                  Powered by Chapa • Secure Payment Gateway
                </p>
                <p className={`text-xs font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                  {status === 'verifying' ? 'Verification in progress...' : 
                   status === 'success' ? 'Payment verified successfully' : 
                   'Verification failed'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span className={`text-xs font-inter ${isDark ? 'text-emerald-400/80' : 'text-emerald-600/80'}`}>
                SSL Secured
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationPage;