// frontend/src/components/PaymentHistory.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, Receipt, 
  Calendar, DollarSign, CheckCircle, XCircle, Clock,
  ChevronLeft, ChevronRight, ExternalLink, RefreshCw,
  Building, User, CreditCard, FileText, FileCheck,
  Key, Home, Award, Shield, PenTool, FileSignature,
  Users, CalendarCheck, Package, Truck, Handshake,
  Phone, Mail, MapPin, AlertCircle, Wallet,
  Briefcase, Star, Lock, Unlock, CalendarDays,
  ArrowRight, FileSpreadsheet, Printer, Share2,
  Copy, QrCode, Tag, Percent, Calculator, Clock3
} from "lucide-react";
import { apiCall } from '../utils/api.endpoints'; 
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import BookingCalendar from './BookingCalendar';

const PaymentHistory = ({ userType, userId, theme = 'light' }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
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
  
  // User-controlled scheduling
  const [userSchedule, setUserSchedule] = useState({
    payment: {
      date: '',
      time: '',
      amount: '',
      method: 'mobile_money'
    },
    contractSigning: {
      date: '',
      time: '',
      location: '',
      witnesses: 2
    },
    ownershipTransfer: {
      date: '',
      time: '',
      location: '',
      documents: ['title_deed', 'keys', 'utility']
    }
  });
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeScheduleStep, setActiveScheduleStep] = useState('payment');

  useEffect(() => {
    fetchPaymentHistory();
  }, [pagination.page, filters, searchTerm]);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        user_type: userType,
        user_id: userId,
        ...filters
      };

      if (searchTerm.trim()) {
        queryParams.search = searchTerm;
      }

      // Clean up empty filters
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      console.log('Fetching payment history:', queryParams);

      let response;
      
      if (userType === 'broker') {
        response = await apiCall.get('GET_BROKER_TRANSACTIONS', { brokerId: userId }, {
          data: queryParams
        });
      } else if (userType === 'admin') {
        response = await apiCall.get('GET_TRANSACTIONS', {}, {
          data: queryParams
        });
      } else {
        response = await apiCall.get('GET_TRANSACTIONS', {}, {
          data: { ...queryParams, userId: userId }
        });
      }
      
      if (response && response.success) {
        const paymentData = response.data || response.transactions || [];
        setPayments(paymentData);
        
        if (response.pagination) {
          setPagination(response.pagination);
        } else {
          setPagination(prev => ({
            ...prev,
            total: paymentData.length || 0,
            pages: Math.ceil((paymentData.length || 0) / prev.limit)
          }));
        }
      } else {
        setPayments(response || []);
        setPagination(prev => ({
          ...prev,
          total: (response || []).length,
          pages: Math.ceil((response || []).length / prev.limit)
        }));
      }
      
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError(err.message || 'Failed to load payment history');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (step, field, value) => {
    setUserSchedule(prev => ({
      ...prev,
      [step]: {
        ...prev[step],
        [field]: value
      }
    }));
  };

  const handleSaveSchedule = () => {
    toast.success('Schedule saved successfully');
    setShowScheduleModal(false);
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
      return dateString || 'N/A';
    }
  };

  const ScheduleModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full max-w-lg rounded-xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Schedule Transaction Steps</h3>
            <button
              onClick={() => setShowScheduleModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Step Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
              {['payment', 'contract', 'transfer'].map(step => (
                <button
                  key={step}
                  onClick={() => setActiveScheduleStep(step)}
                  className={`px-4 py-2 font-medium border-b-2 ${
                    activeScheduleStep === step
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  {step === 'payment' && 'Payment'}
                  {step === 'contract' && 'Contract'}
                  {step === 'transfer' && 'Transfer'}
                </button>
              ))}
            </div>

            {/* Payment Schedule */}
            {activeScheduleStep === 'payment' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={userSchedule.payment.date}
                    onChange={(e) => handleScheduleChange('payment', 'date', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Time</label>
                  <input
                    type="time"
                    value={userSchedule.payment.time}
                    onChange={(e) => handleScheduleChange('payment', 'time', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select
                    value={userSchedule.payment.method}
                    onChange={(e) => handleScheduleChange('payment', 'method', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
            )}

            {/* Contract Signing */}
            {activeScheduleStep === 'contract' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Signing Date</label>
                  <input
                    type="date"
                    value={userSchedule.contractSigning.date}
                    onChange={(e) => handleScheduleChange('contractSigning', 'date', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signing Location</label>
                  <input
                    type="text"
                    value={userSchedule.contractSigning.location}
                    onChange={(e) => handleScheduleChange('contractSigning', 'location', e.target.value)}
                    placeholder="Enter signing location"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Ownership Transfer */}
            {activeScheduleStep === 'transfer' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Transfer Date</label>
                  <input
                    type="date"
                    value={userSchedule.ownershipTransfer.date}
                    onChange={(e) => handleScheduleChange('ownershipTransfer', 'date', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Transfer Location</label>
                  <input
                    type="text"
                    value={userSchedule.ownershipTransfer.location}
                    onChange={(e) => handleScheduleChange('ownershipTransfer', 'location', e.target.value)}
                    placeholder="Enter transfer location"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Payment History</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              View all transactions in Ethiopian Birr (ETB)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
          </div>
        </div>

        {/* Ethiopian Transaction Flow */}
        <div className={`mb-8 p-6 rounded-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-amber-500/30'
            : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200'
        }`}>
          <h2 className={`text-xl font-bold mb-6 flex items-center gap-3 ${
            theme === 'dark' ? 'text-amber-300' : 'text-amber-700'
          }`}>
            <Award className="w-6 h-6" />
            {userType === 'buyer' ? 'Property Purchase Process' : 'Rental Process'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Payment Step */}
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">1. Make Payment</h3>
                  <p className="text-sm text-gray-500">Complete payment to proceed</p>
                </div>
              </div>
              {userSchedule.payment.date ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>Scheduled: {userSchedule.payment.date}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveScheduleStep('payment');
                    setShowScheduleModal(true);
                  }}
                  className="w-full mt-2 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                >
                  Schedule Payment
                </button>
              )}
            </div>

            {/* Contract Step */}
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">2. Sign Contract</h3>
                  <p className="text-sm text-gray-500">{userType === 'buyer' ? 'Sign purchase agreement' : 'Sign rental agreement'}</p>
                </div>
              </div>
              {userSchedule.contractSigning.date ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>Scheduled: {userSchedule.contractSigning.date}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveScheduleStep('contract');
                    setShowScheduleModal(true);
                  }}
                  className="w-full mt-2 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                >
                  Schedule Signing
                </button>
              )}
            </div>

            {/* Transfer Step */}
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">3. Complete Transfer</h3>
                  <p className="text-sm text-gray-500">{userType === 'buyer' ? 'Get property ownership' : 'Move into property'}</p>
                </div>
              </div>
              {userSchedule.ownershipTransfer.date ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>Scheduled: {userSchedule.ownershipTransfer.date}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveScheduleStep('transfer');
                    setShowScheduleModal(true);
                  }}
                  className="w-full mt-2 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                >
                  Schedule Transfer
                </button>
              )}
            </div>
          </div>

          {/* Booking Calendar */}
          <div className="mt-8">
            <BookingCalendar 
              bookings={[]}
              theme={theme}
              onBookingClick={(booking) => console.log('Booking clicked:', booking)}
            />
          </div>
        </div>

        {/* Payment History Section */}
        <div className={`mb-8 p-6 rounded-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700'
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${theme === 'dark'
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20'
                : 'bg-gradient-to-r from-green-100 to-emerald-100'
              }`}>
                <CreditCard className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h5 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Transaction History
                </h5>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  View all payments and receipts
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} mb-6`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">All Types</option>
                  <option value="rent">Rent</option>
                  <option value="purchase">Purchase</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading/Error States */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchPaymentHistory}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
              >
                Try Again
              </button>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{payment.description || 'Transaction'}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(payment.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatCurrency(payment.amount)}</div>
                      <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                        payment.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {payment.status || 'pending'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {payments.length > 5 && (
                <button
                  onClick={() => {/* Navigate to full history */}}
                  className="w-full py-3 text-center text-amber-600 hover:text-amber-700 border border-amber-200 rounded-lg"
                >
                  View All {payments.length} Transactions
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && <ScheduleModal />}
    </div>
  );
};

export default PaymentHistory;