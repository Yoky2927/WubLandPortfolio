import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, Receipt, 
  Calendar, DollarSign, CheckCircle, XCircle, Clock,
  CreditCard, FileText, Key, Award, 
  FileSignature, AlertCircle, Wallet,
  Printer, Share2, Building, FileCheck,
  RefreshCw, Plus, ChevronRight
} from "lucide-react";
import { apiCall } from '../utils/api.endpoints'; 
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import ScheduleViewingModal from './ScheduleViewingModal';

const PaymentHistory = ({ userType, userId, theme = 'light' }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  // Schedule states
  const [showPaymentSchedule, setShowPaymentSchedule] = useState(false);
  const [showContractSchedule, setShowContractSchedule] = useState(false);
  const [showTransferSchedule, setShowTransferSchedule] = useState(false);
  
  // Scheduled dates
  const [scheduledDates, setScheduledDates] = useState({
    paymentDate: '',
    contractDate: '',
    transferDate: ''
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, [filters, searchTerm]);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching payment history for user:', userId, 'type:', userType);

      let response;
      let endpoint;
      let params = {};

      if (userType === 'broker') {
        endpoint = 'GET_BROKER_TRANSACTIONS';
        params = { brokerId: userId, ...filters };
        if (searchTerm) params.search = searchTerm;
      } else {
        endpoint = 'GET_TRANSACTIONS';
        params = { userId: userId, ...filters };
        if (searchTerm) params.search = searchTerm;
      }

      response = await apiCall(endpoint, params, {
        data: { limit: 50 }
      });

      // Handle different response structures
      if (response && Array.isArray(response)) {
        setPayments(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setPayments(response.data);
      } else if (response && response.transactions && Array.isArray(response.transactions)) {
        setPayments(response.transactions);
      } else {
        setPayments([]);
        setError('No payment data available');
      }
      
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError('Failed to load payment history. Please try again later.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePayment = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const formattedDate = format(nextWeek, 'yyyy-MM-dd');
    
    setScheduledDates(prev => ({
      ...prev,
      paymentDate: formattedDate
    }));
    
    setShowPaymentSchedule(true);
    toast.success('Payment scheduled for next week. Please proceed with payment gateway.');
  };

  const handleScheduleContract = () => {
    const today = new Date();
    const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const formattedDate = format(twoWeeks, 'yyyy-MM-dd');
    
    setScheduledDates(prev => ({
      ...prev,
      contractDate: formattedDate
    }));
    
    setShowContractSchedule(true);
  };

  const handleScheduleTransfer = () => {
    const today = new Date();
    const threeWeeks = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);
    const formattedDate = format(threeWeeks, 'yyyy-MM-dd');
    
    setScheduledDates(prev => ({
      ...prev,
      transferDate: formattedDate
    }));
    
    setShowTransferSchedule(true);
    toast.success('Ownership transfer scheduled! You will receive keys and documents.');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString || 'Not scheduled';
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'paid':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'pending':
      case 'processing':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'failed':
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'rent':
        return <Building className="w-4 h-4" />;
      case 'deposit':
        return <FileCheck className="w-4 h-4" />;
      case 'purchase':
        return <Key className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type?.toLowerCase()) {
      case 'rent': return 'Rent Payment';
      case 'deposit': return 'Security Deposit';
      case 'purchase': return 'Property Purchase';
      case 'service': return 'Service Fee';
      default: return 'Transaction';
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // In production, this would call an export API endpoint
      const exportData = {
        payments,
        exportedAt: new Date().toISOString(),
        filters,
        summary: {
          totalAmount,
          totalTransactions: payments.length,
          completedPayments,
          pendingPayments
        }
      };

      // Create downloadable JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Transaction history exported successfully');
    } catch (err) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleMakePayment = () => {
    toast.loading('Redirecting to payment gateway...');
    setTimeout(() => {
      toast.dismiss();
      window.open('https://test.chapa.co/checkout/payment/YOUR_TEST_KEY', '_blank');
    }, 1000);
  };

  // Calculate summary statistics
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || p.total_amount || 0), 0);
  const completedPayments = payments.filter(p => 
    ['completed', 'success', 'paid'].includes(p.payment_status?.toLowerCase() || p.status?.toLowerCase())
  ).length;
  const pendingPayments = payments.filter(p => 
    ['pending', 'processing'].includes(p.payment_status?.toLowerCase() || p.status?.toLowerCase())
  ).length;

  return (
    <div className={`min-h-screen p-4 md:p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Payment & Transaction Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Manage payments, schedule property transactions, and track history
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPaymentHistory}
              disabled={loading}
              className={`p-2.5 rounded-lg flex items-center gap-2 ${
                theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:bg-gray-100 border border-gray-200'
              } transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {error && !loading && (
          <div className={`mb-6 p-4 rounded-xl ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30' 
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-medium">Unable to Load Data</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ethiopian Transaction Flow */}
        <div className={`mb-8 p-5 md:p-6 rounded-2xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-amber-500/30' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg'
        } transition-all duration-300 hover:shadow-xl`}>
          <h2 className={`text-xl font-bold mb-6 flex items-center gap-3 ${
            theme === 'dark' ? 'text-amber-300' : 'text-amber-700'
          }`}>
            <Award className="w-6 h-6" />
            Ethiopian Property Transaction Process
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {/* Step 1: Payment */}
            <div className={`p-5 rounded-xl transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-800 hover:to-amber-900/20' 
                : 'bg-gradient-to-br from-white to-gray-50 hover:from-white hover:to-amber-50 border border-gray-200'
            }`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Make Payment</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Secure deposit or payment
                  </p>
                </div>
              </div>
              <div className="mt-6">
                {scheduledDates.paymentDate ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="font-medium">Scheduled</p>
                        <p className="text-sm text-gray-500">{scheduledDates.paymentDate}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setScheduledDates(prev => ({ ...prev, paymentDate: '' }))}
                        className="flex-1 py-2 text-sm text-red-500 hover:text-red-600 border border-red-200 dark:border-red-800 rounded-lg"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={handleMakePayment}
                        className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-medium text-sm"
                      >
                        Pay Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleSchedulePayment}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Schedule Payment
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Contract Signing */}
            <div className={`p-5 rounded-xl transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-800 hover:to-blue-900/20' 
                : 'bg-gradient-to-br from-white to-gray-50 hover:from-white hover:to-blue-50 border border-gray-200'
            }`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <FileSignature className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Sign Contract</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Legal agreement with witnesses
                  </p>
                </div>
              </div>
              <div className="mt-6">
                {scheduledDates.contractDate ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Scheduled</p>
                        <p className="text-sm text-gray-500">{scheduledDates.contractDate}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowContractSchedule(true)}
                      className="w-full py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium text-sm"
                    >
                      View Details
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleScheduleContract}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Schedule Contract
                  </button>
                )}
              </div>
            </div>

            {/* Step 3: Ownership Transfer */}
            <div className={`p-5 rounded-xl transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-800 hover:to-green-900/20' 
                : 'bg-gradient-to-br from-white to-gray-50 hover:from-white hover:to-green-50 border border-gray-200'
            }`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Complete Transfer</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Receive keys & documents
                  </p>
                </div>
              </div>
              <div className="mt-6">
                {scheduledDates.transferDate ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">Scheduled</p>
                        <p className="text-sm text-gray-500">{scheduledDates.transferDate}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setScheduledDates(prev => ({ ...prev, transferDate: '' }))}
                      className="w-full py-2 text-sm text-red-500 hover:text-red-600 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      Reschedule
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleScheduleTransfer}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Schedule Transfer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-5 rounded-xl transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-800 hover:to-emerald-900/20' 
                : 'bg-gradient-to-br from-white to-gray-50 hover:from-white hover:to-emerald-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Payments</div>
                  <div className="text-xl font-bold">{formatCurrency(totalAmount)}</div>
                </div>
              </div>
            </div>
            
            <div className={`p-5 rounded-xl transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-800 hover:to-blue-900/20' 
                : 'bg-gradient-to-br from-white to-gray-50 hover:from-white hover:to-blue-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                  <div className="text-xl font-bold">
                    {completedPayments} <span className="text-sm font-normal text-gray-500">of {payments.length}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`p-5 rounded-xl transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-800 hover:to-amber-900/20' 
                : 'bg-gradient-to-br from-white to-gray-50 hover:from-white hover:to-amber-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Pending Steps</div>
                  <div className="text-xl font-bold">
                    {3 - Object.values(scheduledDates).filter(date => date !== '').length}<span className="text-sm font-normal text-gray-500">/3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className={`p-5 md:p-6 rounded-2xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg'
        } transition-all duration-300`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20'
                  : 'bg-gradient-to-r from-green-100 to-emerald-100'
              }`}>
                <CreditCard className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h5 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Payment History
                </h5>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {payments.length} transaction{payments.length !== 1 ? 's' : ''} in Ethiopian Birr (ETB)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={exporting || payments.length === 0}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 ${
                  exporting || payments.length === 0
                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg'
                }`}
              >
                <Download className="w-5 h-5" />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className={`p-4 md:p-5 rounded-xl ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
              : 'bg-gradient-to-br from-gray-50 to-white border border-gray-200'
          } mb-6`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search transactions by ID, description, or property..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20' 
                        : 'bg-white border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                  />
                </div>
              </div>

              <div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20' 
                      : 'bg-white border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20' 
                      : 'bg-white border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                >
                  <option value="">All Types</option>
                  <option value="rent">Rent</option>
                  <option value="deposit">Deposit</option>
                  <option value="purchase">Purchase</option>
                  <option value="service">Service Fee</option>
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20' 
                      : 'bg-white border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                />
              </div>

              <div>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20' 
                      : 'bg-white border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Loading/Error States */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-lg font-medium mb-2">Loading transactions</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Please wait while we fetch your payment history...
                </p>
              </div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center">
                <CreditCard className="w-12 h-12 text-amber-500" />
              </div>
              <h3 className="text-xl font-medium mb-3">No transactions yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Start by scheduling your first payment above. Your transaction history will appear here.
              </p>
              <button
                onClick={handleSchedulePayment}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
              >
                Schedule First Payment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id || payment.transaction_id}
                  className={`p-4 md:p-5 rounded-xl transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-amber-500/50 hover:from-amber-900/10 hover:to-gray-900' 
                      : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-amber-500 hover:from-amber-50 hover:to-white'
                  } shadow-sm hover:shadow-md cursor-pointer group`}
                  onClick={() => setSelectedPayment(payment)}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20' 
                            : 'bg-gradient-to-r from-amber-100 to-orange-100'
                        }`}>
                          {getTypeIcon(payment.payment_type || payment.type)}
                        </div>
                        <div>
                          <div className="font-medium text-lg">{payment.description || 'Transaction'}</div>
                          <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2 mt-1">
                            <span>{formatDate(payment.created_at || payment.payment_date)}</span>
                            <span>•</span>
                            <span>ID: #{payment.id || payment.transaction_id}</span>
                            {payment.property_title && (
                              <>
                                <span>•</span>
                                <span className="text-amber-600 dark:text-amber-400">{payment.property_title}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${getStatusColor(payment.payment_status || payment.status)}`}>
                          {payment.payment_status || payment.status || 'pending'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {getTypeLabel(payment.payment_type || payment.type)}
                        </span>
                        {payment.payment_method && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Wallet className="w-4 h-4" />
                            {payment.payment_method.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="font-bold text-xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        {formatCurrency(payment.amount || payment.total_amount)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">View Details</span>
                        <ChevronRight className="w-4 h-4 text-amber-500 transform group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modals */}
      {showContractSchedule && (
        <ScheduleViewingModal
          isOpen={showContractSchedule}
          onClose={() => setShowContractSchedule(false)}
          property={{
            title: "Contract Signing Appointment",
            location: "Addis Ababa City Administration, Land Development Bureau"
          }}
          broker={{
            first_name: "Legal",
            last_name: "Officer",
            phone_number: "0912345678",
            email: "legal@wubland.com",
            brokerage_firm: "Ethiopian Property Registry",
            experience_years: "10+",
            total_completed_deals: 500
          }}
          user={{
            name: "Client",
            email: "user@example.com"
          }}
          theme={theme}
        />
      )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl animate-slideUp ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700' 
              : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20'
                      : 'bg-gradient-to-r from-amber-100 to-orange-100'
                  }`}>
                    <CreditCard className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Payment Details</h3>
                    <p className="text-gray-500">Transaction ID: #{selectedPayment.id || selectedPayment.transaction_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Date & Time</p>
                    <p className="font-medium text-lg">{formatDate(selectedPayment.created_at)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Status</p>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedPayment.payment_status || selectedPayment.status)}`}>
                      {selectedPayment.payment_status || selectedPayment.status}
                    </span>
                  </div>

                  {selectedPayment.payment_method && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Payment Method</p>
                      <p className="font-medium text-lg capitalize flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-amber-500" />
                        {selectedPayment.payment_method.replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Amount (ETB)</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {formatCurrency(selectedPayment.amount || selectedPayment.total_amount)}
                    </p>
                  </div>

                  {selectedPayment.reference_id && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Reference ID</p>
                      <p className="font-mono font-medium bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                        {selectedPayment.reference_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedPayment.description && (
                <div className="mb-8">
                  <p className="text-sm text-gray-500 mb-2">Description</p>
                  <p className="font-medium p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    {selectedPayment.description || selectedPayment.notes || 'No description'}
                  </p>
                </div>
              )}

              {/* Ethiopian Compliance Badge */}
              <div className={`p-5 rounded-xl mb-8 ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/30' 
                  : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <FileCheck className="w-6 h-6 text-blue-500" />
                  <div className="font-bold text-lg">Ethiopian Transaction Compliance</div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Tax compliant with NBE regulations</p>
                      <p className="text-sm text-gray-500">Meets all National Bank of Ethiopia requirements</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Valid for Ethiopian legal purposes</p>
                      <p className="text-sm text-gray-500">Recognized by Ethiopian legal system</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Secured transaction record</p>
                      <p className="text-sm text-gray-500">Encrypted and securely stored</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    const receiptWindow = window.open('', '_blank');
                    receiptWindow.document.write(`
                      <html>
                        <head>
                          <title>Receipt - ${selectedPayment.id || selectedPayment.transaction_id}</title>
                          <style>
                            body { font-family: Arial, sans-serif; padding: 40px; }
                            .receipt { max-width: 600px; margin: 0 auto; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .amount { font-size: 32px; font-weight: bold; color: #d97706; margin: 20px 0; }
                            .details { margin: 20px 0; }
                            .footer { margin-top: 40px; text-align: center; color: #666; }
                          </style>
                        </head>
                        <body>
                          <div class="receipt">
                            <div class="header">
                              <h1>Payment Receipt</h1>
                              <p>Transaction ID: ${selectedPayment.id || selectedPayment.transaction_id}</p>
                            </div>
                            <div class="amount">${formatCurrency(selectedPayment.amount || selectedPayment.total_amount)}</div>
                            <div class="details">
                              <p><strong>Date:</strong> ${formatDate(selectedPayment.created_at)}</p>
                              <p><strong>Status:</strong> ${selectedPayment.payment_status || selectedPayment.status}</p>
                              <p><strong>Description:</strong> ${selectedPayment.description || 'Transaction'}</p>
                              ${selectedPayment.reference_id ? `<p><strong>Reference ID:</strong> ${selectedPayment.reference_id}</p>` : ''}
                            </div>
                            <div class="footer">
                              <p>Thank you for your payment</p>
                              <p>This is a system-generated receipt</p>
                            </div>
                          </div>
                        </body>
                      </html>
                    `);
                    receiptWindow.document.close();
                    toast.success('Receipt opened in new window');
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Printer className="w-5 h-5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/payment/${selectedPayment.id || selectedPayment.transaction_id}`;
                    navigator.clipboard.writeText(shareUrl);
                    toast.success('Payment link copied to clipboard');
                  }}
                  className="flex-1 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium flex items-center justify-center gap-3 transition-all duration-300"
                >
                  <Share2 className="w-5 h-5" />
                  Share Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;