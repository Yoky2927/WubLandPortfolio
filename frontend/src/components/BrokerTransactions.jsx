// components/BrokerTransactions.jsx - FIXED WITH REAL BACKEND DATA
import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Home,
  FileText,
  Shield,
  Percent
} from "lucide-react";
import { apiCall } from "../utils/api.endpoints";
import { apiClient } from "../utils/api.client";

const BrokerTransactions = ({ 
  theme, 
  user, 
  brokerStats, 
  setToast,
  brokerId 
}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeframe, setTimeframe] = useState("monthly");
  const [refreshing, setRefreshing] = useState(false);
  const [transactionStats, setTransactionStats] = useState({
    totalRevenue: 0,
    pendingRevenue: 0,
    avgCommission: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0
  });

  useEffect(() => {
    if (brokerId) {
      fetchTransactions();
    }
  }, [brokerId, timeframe]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Try broker-specific endpoint first, then fallback to general
      let response;
      try {
        response = await apiCall('BROKER_TRANSACTIONS', { brokerId: brokerId || user?.id }, {
          params: { timeframe }
        });
      } catch (error) {
        console.log('Trying alternative transaction endpoint...');
        response = await apiCall('GET_BROKER_TRANSACTIONS', { brokerId: brokerId || user?.id }, {
          params: { timeframe }
        });
      }
      
      if (response.success) {
        const transactionsData = response.data?.transactions || response.data || [];
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
        calculateStats(Array.isArray(transactionsData) ? transactionsData : []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (setToast) {
        setToast({
          show: true,
          message: "Failed to load transactions",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (transactionsData) => {
    if (!Array.isArray(transactionsData)) return;
    
    const completedTransactions = transactionsData.filter(t => 
      t.transaction_status === 'completed' || 
      t.status === 'completed' ||
      t.status === 'approved'
    );
    
    const pendingTransactions = transactionsData.filter(t => 
      t.transaction_status === 'pending' || 
      t.status === 'pending' ||
      t.status === 'processing'
    );
    
    const failedTransactions = transactionsData.filter(t => 
      t.transaction_status === 'failed' || 
      t.status === 'failed' ||
      t.status === 'cancelled' ||
      t.status === 'rejected'
    );
    
    const totalRevenue = completedTransactions.reduce((sum, t) => 
      sum + (parseFloat(t.commission_amount) || parseFloat(t.amount) || 0), 0
    );
    
    const pendingRevenue = pendingTransactions.reduce((sum, t) => 
      sum + (parseFloat(t.commission_amount) || parseFloat(t.amount) || 0), 0
    );
    
    const avgCommission = completedTransactions.length > 0 
      ? completedTransactions.reduce((sum, t) => 
          sum + (parseFloat(t.commission_amount) || parseFloat(t.amount) || 0), 0) / completedTransactions.length
      : 0;

    setTransactionStats({
      totalRevenue,
      pendingRevenue,
      avgCommission,
      completedCount: completedTransactions.length,
      pendingCount: pendingTransactions.length,
      failedCount: failedTransactions.length
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const status = transaction.transaction_status || transaction.status || '';
    
    // Status filter
    if (filter === "completed" && !['completed', 'approved'].includes(status)) return false;
    if (filter === "pending" && !['pending', 'processing'].includes(status)) return false;
    if (filter === "failed" && !['failed', 'cancelled', 'rejected'].includes(status)) return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (transaction.transaction_id || transaction.id || '').toLowerCase().includes(searchLower) ||
        (transaction.property_title || transaction.property?.title || '').toLowerCase().includes(searchLower) ||
        (transaction.client_name || transaction.buyer_name || transaction.user?.name || '').toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const formatCurrency = (amount) => {
    if (!amount) return 'ETB 0';
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    const statusValue = status || '';
    switch(statusValue.toLowerCase()) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "failed":
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    const statusValue = status || '';
    switch(statusValue.toLowerCase()) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
      case "processing":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "failed":
      case "cancelled":
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const handleExportTransactions = async () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + ["Transaction ID,Property,Client,Amount,Date,Status,Commission Rate"]
          .concat(transactions.map(t => {
            const transactionId = t.transaction_id || t.id;
            const propertyTitle = t.property_title || t.property?.title || 'N/A';
            const clientName = t.client_name || t.buyer_name || t.user?.name || 'N/A';
            const amount = parseFloat(t.amount) || parseFloat(t.commission_amount) || 0;
            const date = t.transaction_date || t.created_at || 'N/A';
            const status = t.transaction_status || t.status || 'N/A';
            const commissionRate = t.commission_rate || t.commission_percentage || 'N/A';
            
            return `${transactionId},"${propertyTitle}","${clientName}",${amount},"${date}",${status},${commissionRate}`;
          }))
          .join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (setToast) {
        setToast({
          show: true,
          message: "Transactions exported successfully",
          type: "success",
        });
      }
    } catch (error) {
      console.error('Error exporting transactions:', error);
      if (setToast) {
        setToast({
          show: true,
          message: "Failed to export transactions",
          type: "error",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className={`p-4 lg:p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Transaction Management</h2>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Track and manage your property transactions
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            } w-5 h-5`} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="all">All Transactions</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="quarterly">This Quarter</option>
            <option value="yearly">This Year</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 transition-colors ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-green-50"} border ${theme === "dark" ? "border-gray-600" : "border-green-100"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Commission</div>
              <div className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                {formatCurrency(transactionStats.totalRevenue)}
              </div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            {transactionStats.completedCount} completed transactions
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-yellow-50"} border ${theme === "dark" ? "border-gray-600" : "border-yellow-100"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Pending Commission</div>
              <div className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                {formatCurrency(transactionStats.pendingRevenue)}
              </div>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            {transactionStats.pendingCount} pending transactions
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-blue-50"} border ${theme === "dark" ? "border-gray-600" : "border-blue-100"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Avg. Commission</div>
              <div className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                {formatCurrency(transactionStats.avgCommission)}
              </div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Based on {transactionStats.completedCount} completed transactions
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={`rounded-lg border overflow-hidden ${
        theme === "dark" ? "border-gray-700" : "border-gray-200"
      }`}>
        <div className={`overflow-x-auto ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
          <table className="w-full">
            <thead className={`${
              theme === "dark" ? "bg-gray-700" : "bg-gray-50"
            }`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Transaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No transactions found</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const transactionId = transaction.transaction_id || transaction.id;
                  const propertyTitle = transaction.property_title || transaction.property?.title || 'N/A';
                  const propertyType = transaction.property_type || transaction.property?.property_type || 'N/A';
                  const clientName = transaction.client_name || transaction.buyer_name || transaction.user?.name || 'N/A';
                  const clientEmail = transaction.client_email || transaction.buyer_email || transaction.user?.email || '';
                  const amount = parseFloat(transaction.amount) || parseFloat(transaction.commission_amount) || 0;
                  const commissionRate = transaction.commission_rate || transaction.commission_percentage;
                  const date = transaction.transaction_date || transaction.created_at;
                  const status = transaction.transaction_status || transaction.status || 'N/A';

                  return (
                    <tr key={transactionId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{transactionId}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.type || 'Property Transaction'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{propertyTitle}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {propertyType}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{clientName}</div>
                        {clientEmail && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {clientEmail}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(amount)}
                        </div>
                        {commissionRate && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {commissionRate}% commission
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(date)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getStatusIcon(status)}
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => window.open(`/dashboard/transactions/${transactionId}`, '_blank')}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleExportTransactions}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Download Receipt"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className={`mt-6 p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Timeframe: {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Commission This {timeframe}</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(transactionStats.totalRevenue)}</div>
            </div>
            <button
              onClick={handleExportTransactions}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerTransactions;