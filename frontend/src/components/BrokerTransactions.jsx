// components/BrokerTransactions.jsx
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
} from "lucide-react";

const BrokerTransactions = ({ 
  theme, 
  user, 
  brokerStats, 
  setToast 
}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeframe, setTimeframe] = useState("monthly");

  useEffect(() => {
    fetchTransactions();
  }, [timeframe]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5004/api/analytics/broker/${user?.id}/transactions?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setToast({
        show: true,
        message: "Failed to load transactions",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Status filter
    if (filter === "completed" && transaction.status !== "completed") return false;
    if (filter === "pending" && transaction.status !== "pending") return false;
    if (filter === "failed" && transaction.status !== "failed") return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.propertyTitle?.toLowerCase().includes(searchLower) ||
        transaction.clientName?.toLowerCase().includes(searchLower) ||
        transaction.transactionId?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const calculateStats = () => {
    const totalRevenue = transactions.reduce((sum, t) => 
      t.status === "completed" ? sum + (t.commissionAmount || 0) : sum, 0
    );
    
    const pendingRevenue = transactions.reduce((sum, t) => 
      t.status === "pending" ? sum + (t.commissionAmount || 0) : sum, 0
    );
    
    const avgCommission = transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + (t.commissionAmount || 0), 0) / transactions.length
      : 0;

    return { totalRevenue, pendingRevenue, avgCommission };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Transaction Management</h2>
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
            onClick={fetchTransactions}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-green-50"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Commission</div>
              <div className="text-3xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            {transactions.filter(t => t.status === "completed").length} completed transactions
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-yellow-50"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Pending Commission</div>
              <div className="text-3xl font-bold mt-1">{formatCurrency(stats.pendingRevenue)}</div>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            {transactions.filter(t => t.status === "pending").length} pending transactions
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-blue-50"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Avg. Commission</div>
              <div className="text-3xl font-bold mt-1">{formatCurrency(stats.avgCommission)}</div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Based on {transactions.length} total transactions
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
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
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium">{transaction.transactionId}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{transaction.propertyTitle}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.propertyType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{transaction.clientName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.clientEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold">{formatCurrency(transaction.commissionAmount)}</div>
                      <div className="text-xs text-gray-500">
                        {transaction.commissionRate}% commission
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(transaction.status)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          title="Download Receipt"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Commission This {timeframe}</div>
              <div className="text-lg font-bold">{formatCurrency(stats.totalRevenue)}</div>
            </div>
            <button
              onClick={() => {
                // Export transactions to CSV
                const csvContent = "data:text/csv;charset=utf-8," 
                  + ["Transaction ID,Property,Client,Amount,Date,Status"]
                    .concat(transactions.map(t => 
                      `${t.transactionId},"${t.propertyTitle}","${t.clientName}",${t.commissionAmount},"${t.date}",${t.status}`
                    ))
                    .join("\n");
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
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