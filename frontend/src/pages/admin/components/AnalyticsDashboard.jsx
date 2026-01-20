// frontend/src/pages/admin/components/AnalyticsDashboard.jsx
import React, { useState, lazy, Suspense, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Home, DollarSign, MessageSquare, Eye, Clock, Download, RefreshCw, ChevronDown, PieChart, LineChart as LineChartIcon, CreditCard } from 'lucide-react';
import { directApi } from '../../../utils/api.endpoints';

const LineChart = lazy(() => import('../../../components/charts/LineChart'));
const DonutChart = lazy(() => import('../../../components/charts/DonutChart'));
const RadarChart = lazy(() => import('../../../components/charts/RadarChart'));
const TransactionDonutChart = lazy(() => import('../../../components/charts/TransactionDonutChart'));

const ChartLoadingFallback = ({ theme, message, icon: Icon }) => (
  <div className={`h-full flex flex-col items-center justify-center ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-100"} rounded-lg animate-pulse`}>
    <Icon className={`w-12 h-12 mb-3 ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`} />
    <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{message}</p>
  </div>
);

const StatCard = ({ title, value, icon: Icon, change, trend, color, theme }) => (
  <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} shadow-lg hover:shadow-xl transition-shadow`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${theme === "dark" ? `bg-${color}-900/50` : `bg-${color}-100`}`}>
        <Icon className={`w-6 h-6 ${theme === "dark" ? `text-${color}-400` : `text-${color}-600`}`} />
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium ${trend === 'up' ? (theme === "dark" ? "text-green-400" : "text-green-600") : (theme === "dark" ? "text-red-400" : "text-red-600")}`}>
          {trend === 'up' ? <TrendingUp className="inline w-4 h-4 mr-1" /> : <TrendingDown className="inline w-4 h-4 mr-1" />}
          {change}%
        </span>
      </div>
    </div>
    <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
      {typeof value === 'number' && value > 9999 ? `${(value / 1000).toFixed(1)}K` : value?.toLocaleString() || '0'}
    </h3>
    <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{title}</p>
  </div>
);

const AnalyticsDashboard = ({ theme, setToast }) => {
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, activeProperties: 0, totalRevenue: 0, avgResponseTime: 0, userGrowth: 0, listingGrowth: 0, revenueGrowth: 0 });
  const [revenueData, setRevenueData] = useState({ labels: [], datasets: [{ label: 'Revenue (ETB)', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true }] });
  const [propertyDistribution, setPropertyDistribution] = useState({ labels: [], datasets: [{ data: [], backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'] }] });
  const [roleDistribution, setRoleDistribution] = useState({ labels: [], datasets: [{ data: [], backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'] }] });
  const [topBrokers, setTopBrokers] = useState([]);
  const [metrics, setMetrics] = useState({ avgPropertyViews: 0, avgTimeOnSite: 0, bounceRate: 0, avgSalePrice: 0, avgRentPrice: 0, commissionRate: 0, openTickets: 0, resolutionRate: 0, customerSatisfaction: 0 });
  const [transactionStats, setTransactionStats] = useState({ total: 0, completed: 0, pending: 0, cancelled: 0, totalRevenue: 0 });

  const formatCurrency = (amount) => `ETB ${amount?.toLocaleString() || '0'}`;
  const formatPercentage = (value) => `${value || 0}%`;

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [usersRes, propertiesRes, transactionsRes, todosRes] = await Promise.allSettled([
        directApi.getUsers(),
        directApi.getProperties(),
        directApi.getTransactions(),
        directApi.getTodos()
      ]);

      const users = usersRes.status === 'fulfilled' ? (usersRes.value?.data || usersRes.value || []) : [];
      const properties = propertiesRes.status === 'fulfilled' ? (propertiesRes.value?.data || propertiesRes.value || []) : [];
      const transactions = transactionsRes.status === 'fulfilled' ? (transactionsRes.value?.data || transactionsRes.value || []) : [];
      const todos = todosRes.status === 'fulfilled' ? (todosRes.value?.data || todosRes.value || []) : [];

      const activeProperties = properties.filter(p => p.status === 'active' || p.status === 'available').length;
      const completedTransactions = transactions.filter(t => t.status === 'completed' || t.status === 'closed');
      const pendingTransactions = transactions.filter(t => t.status === 'pending' || t.status === 'processing');
      const cancelledTransactions = transactions.filter(t => t.status === 'cancelled' || t.status === 'failed');
      const totalRevenue = completedTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
      const brokers = users.filter(u => u.role?.includes('broker'));
      const brokerPerformance = brokers.map(broker => ({
        id: broker.id,
        name: `${broker.first_name || ''} ${broker.last_name || ''}`.trim() || broker.username || 'Unknown',
        listings: properties.filter(p => p.assigned_broker_id === broker.id || p.broker_id === broker.id).length,
        sales: completedTransactions.filter(t => t.broker_id === broker.id).length,
        revenue: completedTransactions.filter(t => t.broker_id === broker.id).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
        rating: broker.rating || 4.0
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      const propertyTypes = {};
      properties.forEach(property => {
        const type = property.property_type || property.type || 'Unknown';
        propertyTypes[type] = (propertyTypes[type] || 0) + 1;
      });

      const roleCounts = {};
      users.forEach(user => {
        const role = user.role || 'user';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      const currentMonth = new Date().getMonth();
      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyRevenue = monthLabels.map((_, index) => {
        const monthIndex = (currentMonth - 11 + index) % 12;
        return completedTransactions.filter(t => {
          try {
            const date = new Date(t.created_at || t.date);
            return date.getMonth() === monthIndex;
          } catch { return false; }
        }).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      });

      const saleProperties = properties.filter(p => p.listing_type === 'sale');
      const rentProperties = properties.filter(p => p.listing_type === 'rent');
      const avgSalePrice = saleProperties.length > 0 ? saleProperties.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) / saleProperties.length : 0;
      const avgRentPrice = rentProperties.length > 0 ? rentProperties.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) / rentProperties.length : 0;
      
      const pendingTodos = todos.filter(t => t.status === 'pending');
      const completedTodos = todos.filter(t => t.status === 'completed');
      const resolutionRate = todos.length > 0 ? (completedTodos.length / todos.length) * 100 : 0;

      setStats({
        totalUsers: users.length,
        activeProperties,
        totalRevenue,
        avgResponseTime: 2.5,
        userGrowth: users.length > 0 ? Math.round((users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length / users.length) * 100) : 0,
        listingGrowth: properties.length > 0 ? Math.round((properties.filter(p => new Date(p.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length / properties.length) * 100) : 0,
        revenueGrowth: totalRevenue > 0 && monthlyRevenue[monthlyRevenue.length - 2] > 0 ? Math.round(((monthlyRevenue[monthlyRevenue.length - 1] - monthlyRevenue[monthlyRevenue.length - 2]) / monthlyRevenue[monthlyRevenue.length - 2]) * 100) : 0
      });

      setTransactionStats({
        total: transactions.length,
        completed: completedTransactions.length,
        pending: pendingTransactions.length,
        cancelled: cancelledTransactions.length,
        totalRevenue
      });

      setRevenueData({
        labels: monthLabels,
        datasets: [{
          label: 'Revenue (ETB)',
          data: monthlyRevenue,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true
        }]
      });

      setPropertyDistribution({
        labels: Object.keys(propertyTypes),
        datasets: [{
          data: Object.values(propertyTypes),
          backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444']
        }]
      });

      setRoleDistribution({
        labels: Object.keys(roleCounts),
        datasets: [{
          data: Object.values(roleCounts),
          backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444']
        }]
      });

      setTopBrokers(brokerPerformance);

      setMetrics({
        avgPropertyViews: properties.length > 0 ? Math.round(properties.reduce((sum, p) => sum + (p.views || 0), 0) / properties.length) : 0,
        avgTimeOnSite: '4m 32s',
        bounceRate: 32,
        avgSalePrice,
        avgRentPrice,
        commissionRate: 2.5,
        openTickets: pendingTodos.length,
        resolutionRate: Math.round(resolutionRate),
        customerSatisfaction: 4.7
      });

      if (setToast) {
        setToast({ show: true, message: "Analytics data loaded successfully", type: "success" });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      if (setToast) {
        setToast({ show: true, message: "Failed to load analytics data", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchAnalyticsData();
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className={`text-2xl lg:text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Analytics Dashboard</h2>
          <p className={`mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Insights and performance metrics across the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} disabled={loading} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${theme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"} disabled:opacity-50`}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <div className="relative">
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className={`px-4 py-2 rounded-lg border appearance-none ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
          <button className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${theme === "dark" ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600" : "bg-white text-black border-gray-300 hover:bg-gray-100"}`}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} change={stats.userGrowth} trend="up" color="blue" theme={theme} />
        <StatCard title="Active Properties" value={stats.activeProperties} icon={Home} change={stats.listingGrowth} trend="up" color="green" theme={theme} />
        <StatCard title="Total Revenue" value={stats.totalRevenue} icon={DollarSign} change={stats.revenueGrowth} trend="up" color="amber" theme={theme} />
        <StatCard title="Avg. Response Time" value={stats.avgResponseTime} icon={Clock} change={-15} trend="down" color="purple" theme={theme} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          
          <div className="h-80">
            <Suspense fallback={<ChartLoadingFallback theme={theme} message="Loading revenue chart..." icon={LineChartIcon} />}>
              <LineChart data={revenueData} theme={theme} />
            </Suspense>
          </div>
        </div>

        {/* Role Radar Chart */}
        <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>

          <div className="h-96">
            <Suspense fallback={<ChartLoadingFallback theme={theme} message="Loading role analysis..." icon={PieChart} />}>
              <RadarChart analyticsData={{ userDistribution: roleDistribution.labels.map((label, i) => ({ role: label, count: roleDistribution.datasets[0].data[i] })) }} theme={theme} />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Distribution Chart */}
        <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Property Type Distribution</h3>
            <div className={`px-3 py-1 rounded-lg text-sm ${theme === "dark" ? "bg-amber-900/50 text-amber-400" : "bg-amber-100 text-amber-800"}`}>
              <Home className="inline w-4 h-4 mr-1" />
              {stats.activeProperties} active
            </div>
          </div>
          <div className="h-64">
            <Suspense fallback={<ChartLoadingFallback theme={theme} message="Loading property distribution..." icon={PieChart} />}>
              <DonutChart data={propertyDistribution} theme={theme} />
            </Suspense>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {propertyDistribution.labels.map((label, index) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: propertyDistribution.datasets[0].backgroundColor[index] }} />
                  <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>{label}</span>
                </div>
                <span className="text-sm font-medium">{propertyDistribution.datasets[0].data[index]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Distribution Chart */}
        <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Transaction Metrics</h3>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Status distribution and financial metrics</p>
            </div>
            <div className={`px-3 py-1 rounded-lg text-sm ${theme === "dark" ? "bg-green-900/50 text-green-400" : "bg-green-100 text-green-800"}`}>
              <CreditCard className="inline w-4 h-4 mr-1" />
              {transactionStats.total} total
            </div>
          </div>
          <div className="h-64">
            <Suspense fallback={<ChartLoadingFallback theme={theme} message="Loading transaction metrics..." icon={CreditCard} />}>
              <DonutChart data={{
                labels: ['Completed', 'Pending', 'Cancelled'],
                datasets: [{
                  data: [transactionStats.completed || 0, transactionStats.pending || 0, transactionStats.cancelled || 0],
                  backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                }]
              }} theme={theme} />
            </Suspense>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Completed</span>
              </div>
              <span className="text-sm font-medium">{transactionStats.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Pending</span>
              </div>
              <span className="text-sm font-medium">{transactionStats.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Cancelled</span>
              </div>
              <span className="text-sm font-medium">{transactionStats.cancelled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Brokers */}
      <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Top Performing Brokers</h3>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Based on revenue and successful transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <button className={`px-3 py-1 rounded-lg text-sm ${theme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>This Month</button>
            <button className={`px-3 py-1 rounded-lg text-sm ${theme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>All Time</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <th className={`py-3 text-left font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Broker</th>
                <th className={`py-3 text-left font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Active Listings</th>
                <th className={`py-3 text-left font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Successful Sales</th>
                <th className={`py-3 text-left font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Revenue</th>
                <th className={`py-3 text-left font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Rating</th>
                <th className={`py-3 text-left font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topBrokers.map((broker) => (
                <tr key={broker.id} className={`border-b ${theme === "dark" ? "border-gray-800 hover:bg-gray-750" : "border-gray-100 hover:bg-gray-50"}`}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                        {broker.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium">{broker.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min((broker.listings / 50) * 100, 100)}%` }} />
                      </div>
                      <span>{broker.listings}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="font-medium">{broker.sales}</span>
                    <span className={`text-sm ml-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      ({broker.listings > 0 ? ((broker.sales / broker.listings) * 100).toFixed(1) : 0}% success rate)
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(broker.revenue)}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <div className="text-amber-500">★</div>
                      <span className="font-medium">{broker.rating}</span>
                      <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>/5.0</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button className={`p-2 rounded ${theme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className={`p-2 rounded ${theme === "dark" ? "bg-blue-900/50 text-blue-400 hover:bg-blue-800/50" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}`}>
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h4 className={`font-medium mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Platform Metrics</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Avg. Property Views</span>
              <span className="font-medium">{metrics.avgPropertyViews}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Avg. Time on Site</span>
              <span className="font-medium">{metrics.avgTimeOnSite}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Bounce Rate</span>
              <span className="font-medium text-green-600">{formatPercentage(metrics.bounceRate)}</span>
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h4 className={`font-medium mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Financial Metrics</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Avg. Sale Price</span>
              <span className="font-medium">{formatCurrency(metrics.avgSalePrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Avg. Rent Price</span>
              <span className="font-medium">{formatCurrency(metrics.avgRentPrice)}/month</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Commission Rate</span>
              <span className="font-medium">{formatPercentage(metrics.commissionRate)}</span>
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h4 className={`font-medium mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Support Metrics</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Open Tickets</span>
              <span className="font-medium">{metrics.openTickets}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Resolution Rate</span>
              <span className="font-medium text-green-600">{formatPercentage(metrics.resolutionRate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Customer Satisfaction</span>
              <span className="font-medium">{metrics.customerSatisfaction}/5.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;