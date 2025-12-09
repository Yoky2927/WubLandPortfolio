import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Calendar,
  User,
  Home,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Download,
  FileText,
  AlertCircle,
  Users,
  Percent,
  Shield
} from 'lucide-react';
import { httpClient } from "../services/http.service";
import { API_CONFIG } from "../config/api.config";

const TransactionsManagement = ({ theme }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionStats, setTransactionStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    totalValue: 0,
    avgTransaction: 0
  });
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    fetchTransactions();
    fetchTransactionAnalytics();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.TRANSACTIONS);
      if (response.data) {
        setTransactions(response.data);
        calculateStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactionAnalytics = async () => {
    try {
      const response = await httpClient.get('/analytics/transactions');
      if (response.data) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching transaction analytics:', error);
      // Fallback mock data
      setAnalyticsData({
        monthlyTrend: [1200000, 1800000, 1500000, 2200000, 1900000, 2500000],
        byType: {
          sale: 60,
          rental: 30,
          lease: 10
        },
        byStatus: {
          completed: 70,
          pending: 20,
          cancelled: 10
        },
        topBrokers: [
          { name: 'John Doe', volume: 8500000 },
          { name: 'Jane Smith', volume: 7200000 },
          { name: 'Mike Johnson', volume: 5800000 }
        ]
      });
    }
  };

  const calculateStats = (transactionsData) => {
    const completed = transactionsData.filter(t => t.status === 'completed').length;
    const pending = transactionsData.filter(t => t.status === 'pending').length;
    const cancelled = transactionsData.filter(t => t.status === 'cancelled').length;
    const totalValue = transactionsData.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    setTransactionStats({
      total: transactionsData.length,
      completed,
      pending,
      cancelled,
      totalValue,
      avgTransaction: transactionsData.length > 0 ? totalValue / transactionsData.length : 0
    });
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.seller_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
      const matchesType = filterType === 'all' || transaction.type === filterType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [transactions, searchTerm, filterStatus, filterType]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'sale': return <Home className="w-4 h-4" />;
      case 'rental': return <CreditCard className="w-4 h-4" />;
      case 'lease': return <FileText className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleUpdateStatus = async (transactionId, newStatus) => {
    try {
      await httpClient.patch(`${API_CONFIG.ENDPOINTS.TRANSACTIONS}/${transactionId}`, {
        status: newStatus
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const TransactionRow = ({ transaction }) => (
    <tr className={`border-b transition-colors hover:bg-opacity-50 ${
      theme === 'dark' 
        ? 'border-gray-700 hover:bg-gray-750' 
        : 'border-gray-200 hover:bg-gray-50'
    }`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {getTypeIcon(transaction.type)}
          <div>
            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {transaction.reference || `TRX-${transaction.id}`}
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatDate(transaction.date)}
            </p>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          <p className="font-medium">{transaction.buyer_name}</p>
          <p className="text-sm opacity-75">{transaction.seller_name}</p>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          <p className="font-medium">{transaction.property_title}</p>
          <p className="text-sm">{transaction.property_type}</p>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {formatCurrency(transaction.amount)}
        </p>
        {transaction.commission && (
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Commission: {formatCurrency(transaction.commission)}
          </p>
        )}
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(transaction.status)}`}>
            {getStatusIcon(transaction.status)}
            {transaction.status}
          </span>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleViewTransaction(transaction)}
            className={`p-2 rounded-lg ${
              theme === 'dark'
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>
          
          {transaction.status === 'pending' && (
            <>
              <button
                onClick={() => handleUpdateStatus(transaction.id, 'completed')}
                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleUpdateStatus(transaction.id, 'cancelled')}
                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Transaction Management
          </h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Monitor and manage all property transactions
          </p>
        </div>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> New Transaction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-green-500">+18%</span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(transactionStats.totalValue)}
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Volume
          </p>
        </div>

        <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-green-500">+12%</span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {transactionStats.completed}
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Completed
          </p>
        </div>

        <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium text-green-500">+8%</span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(transactionStats.avgTransaction)}
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Average Transaction
          </p>
        </div>

        <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-yellow-500">+3%</span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {transactionStats.pending}
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Pending Approval
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} w-5 h-5`} />
            <input
              type="text"
              placeholder="Search by reference, buyer, seller..."
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                  : 'bg-white text-black border-gray-300 placeholder-gray-500'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-black border-gray-300'
              }`}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="sale">Sales</option>
              <option value="rental">Rentals</option>
              <option value="lease">Leases</option>
            </select>
            
            <select
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-black border-gray-300'
              }`}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="approved">Approved</option>
            </select>
            
            <select
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-black border-gray-300'
              }`}
              defaultValue="30days"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                <th className="px-6 py-4 text-left font-semibold">Transaction</th>
                <th className="px-6 py-4 text-left font-semibold">Parties</th>
                <th className="px-6 py-4 text-left font-semibold">Property</th>
                <th className="px-6 py-4 text-left font-semibold">Amount</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-8">
                      <div className={`h-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    </td>
                  </tr>
                ))
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No transactions found</p>
                      <p className="text-sm">
                        {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                          ? 'Try adjusting your search or filter criteria'
                          : 'No transactions available'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length > 0 && (
          <div className={`px-6 py-4 border-t flex justify-between items-center ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
            <div className="flex gap-2">
              <button className={`px-3 py-1 rounded-lg text-sm ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
                Previous
              </button>
              <button className={`px-3 py-1 rounded-lg text-sm ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsManagement;