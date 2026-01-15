// frontend/src/pages/admin/components/AnalyticsDashboard.jsx
import React, { useState, lazy, Suspense } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  DollarSign,
  MessageSquare,
  Eye,
  Clock,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  PieChart,
  LineChart as LineChartIcon,
  BarChart,
  Activity,
  Target
} from "lucide-react";

// Lazy load chart components
const LineChart = lazy(() => import("../../../components/charts/LineChart"));
const BarChartComponent = lazy(() => import("../../../components/charts/BarChart"));
const DonutChart = lazy(() => import("../../../components/charts/DonutChart"));
const RadarChart = lazy(() => import("../../../components/charts/RadarChart"));

const AnalyticsDashboard = ({ theme, analyticsData, fetchAnalyticsData, setToast }) => {
  const [timeRange, setTimeRange] = useState("month");
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState("line");

  // Mock data for demonstration - replace with real data from analyticsData
  const stats = {
    totalUsers: 1245,
    activeUsers: 892,
    newUsers: 45,
    userGrowth: 12.5,
    
    totalProperties: 567,
    activeListings: 432,
    newListings: 23,
    listingGrowth: 8.3,
    
    totalRevenue: 2450000,
    monthlyRevenue: 450000,
    revenueGrowth: 24.7,
    avgTransaction: 125000,
    
    totalMessages: 1234,
    avgResponseTime: 2.5,
    supportTickets: 89,
    resolutionRate: 94.5,
  };

  // Revenue data for charts
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Revenue (ETB)',
      data: [150000, 180000, 210000, 195000, 230000, 280000, 310000, 295000, 320000, 350000, 380000, 450000],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
    }]
  };

  // User growth data
  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'New Users',
      data: [45, 52, 48, 67, 59, 72, 85, 78, 92, 88, 95, 112],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
    }]
  };

  // Property type distribution
  const propertyDistribution = {
    labels: ['Residential', 'Commercial', 'Land', 'Industrial', 'Agricultural'],
    datasets: [{
      data: [45, 25, 15, 10, 5],
      backgroundColor: [
        '#f59e0b',
        '#10b981',
        '#3b82f6',
        '#8b5cf6',
        '#ef4444'
      ]
    }]
  };

  // User role distribution
  const roleDistribution = {
    labels: ['Brokers', 'Buyers', 'Sellers', 'Support', 'Admins'],
    datasets: [{
      data: [180, 320, 120, 25, 12],
      backgroundColor: [
        '#f59e0b',
        '#10b981',
        '#3b82f6',
        '#8b5cf6',
        '#ef4444'
      ]
    }]
  };

  // Top performing brokers
  const topBrokers = [
    { id: 1, name: "Michael Bekele", listings: 45, sales: 12, revenue: 1250000, rating: 4.9 },
    { id: 2, name: "Sarah Tesfaye", listings: 38, sales: 9, revenue: 980000, rating: 4.8 },
    { id: 3, name: "David Alemayehu", listings: 32, sales: 8, revenue: 850000, rating: 4.7 },
    { id: 4, name: "Hana Mohammed", listings: 28, sales: 7, revenue: 720000, rating: 4.6 },
    { id: 5, name: "Samuel Girma", listings: 25, sales: 6, revenue: 650000, rating: 4.5 },
  ];

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchAnalyticsData();
      setToast({
        show: true,
        message: "Analytics data refreshed successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error refreshing analytics:", error);
      setToast({
        show: true,
        message: "Failed to refresh analytics data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `ETB ${amount.toLocaleString()}`;
  };

  const StatCard = ({ title, value, icon: Icon, change, trend, color }) => (
    <div className={`p-6 rounded-xl border ${
      theme === "dark" 
        ? "bg-gray-800 border-gray-700" 
        : "bg-white border-gray-200"
    } shadow-lg hover:shadow-xl transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${
          theme === "dark" ? `bg-${color}-900/50` : `bg-${color}-100`
        }`}>
          <Icon className={`w-6 h-6 ${
            theme === "dark" ? `text-${color}-400` : `text-${color}-600`
          }`} />
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium ${
            trend === 'up' 
              ? theme === "dark" ? "text-green-400" : "text-green-600"
              : theme === "dark" ? "text-red-400" : "text-red-600"
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="inline w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="inline w-4 h-4 mr-1" />
            )}
            {change}%
          </span>
        </div>
      </div>
      <h3 className={`text-2xl font-bold ${
        theme === "dark" ? "text-white" : "text-gray-900"
      }`}>
        {typeof value === 'number' && value > 9999 
          ? `${(value / 1000).toFixed(1)}K` 
          : value.toLocaleString()}
      </h3>
      <p className={`text-sm ${
        theme === "dark" ? "text-gray-400" : "text-gray-600"
      }`}>
        {title}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className={`text-2xl lg:text-3xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Analytics Dashboard
          </h2>
          <p className={`mt-1 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Insights and performance metrics across the platform
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`px-4 py-2 rounded-lg border appearance-none ${
                theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-black border-gray-300"
              }`}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
          
          <button className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
            theme === "dark"
              ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              : "bg-white text-black border-gray-300 hover:bg-gray-100"
          }`}>
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          change={stats.userGrowth}
          trend="up"
          color="blue"
        />
        
        <StatCard
          title="Active Properties"
          value={stats.activeListings}
          icon={Home}
          change={stats.listingGrowth}
          trend="up"
          color="green"
        />
        
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          icon={DollarSign}
          change={stats.revenueGrowth}
          trend="up"
          color="amber"
        />
        
        <StatCard
          title="Avg. Response Time"
          value={stats.avgResponseTime}
          icon={Clock}
          change={-15}
          trend="down"
          color="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Revenue Overview
              </h3>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Monthly revenue trends
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-lg text-sm ${
                theme === "dark" 
                  ? "bg-gray-700 text-gray-300" 
                  : "bg-gray-100 text-gray-700"
              }`}>
                <DollarSign className="inline w-4 h-4 mr-1" />
                {formatCurrency(stats.monthlyRevenue)} this month
              </div>
            </div>
          </div>
          <div className="h-64">
            <Suspense fallback={
              <div className={`h-full flex items-center justify-center ${
                theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              } rounded animate-pulse`}>
                <div className="text-center">
                  <LineChartIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    Loading revenue chart...
                  </p>
                </div>
              </div>
            }>
              <LineChart data={revenueData} theme={theme} />
            </Suspense>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                User Growth
              </h3>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                New user registrations
              </p>
            </div>
            <div className={`px-3 py-1 rounded-lg text-sm ${
              theme === "dark" 
                ? "bg-blue-900/50 text-blue-400" 
                : "bg-blue-100 text-blue-800"
            }`}>
              <Users className="inline w-4 h-4 mr-1" />
              +{stats.newUsers} this month
            </div>
          </div>
          <div className="h-64">
            <Suspense fallback={
              <div className={`h-full flex items-center justify-center ${
                theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              } rounded animate-pulse`}>
                <div className="text-center">
                  <BarChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    Loading user growth chart...
                  </p>
                </div>
              </div>
            }>
              <BarChartComponent data={userGrowthData} theme={theme} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Distribution */}
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <h3 className={`text-lg font-semibold mb-6 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Property Type Distribution
          </h3>
          <div className="h-64">
            <Suspense fallback={
              <div className={`h-full flex items-center justify-center ${
                theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              } rounded animate-pulse`}>
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    Loading property distribution...
                  </p>
                </div>
              </div>
            }>
              <DonutChart data={propertyDistribution} theme={theme} />
            </Suspense>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {propertyDistribution.labels.map((label, index) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: propertyDistribution.datasets[0].backgroundColor[index] }}
                  />
                  <span className={`text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {label}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {propertyDistribution.datasets[0].data[index]}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Role Distribution */}
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <h3 className={`text-lg font-semibold mb-6 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            User Role Distribution
          </h3>
          <div className="h-64">
            <Suspense fallback={
              <div className={`h-full flex items-center justify-center ${
                theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              } rounded animate-pulse`}>
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    Loading role distribution...
                  </p>
                </div>
              </div>
            }>
              <DonutChart data={roleDistribution} theme={theme} />
            </Suspense>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {roleDistribution.labels.map((label, index) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: roleDistribution.datasets[0].backgroundColor[index] }}
                  />
                  <span className={`text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {label}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {roleDistribution.datasets[0].data[index]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className={`p-6 rounded-xl border ${
        theme === "dark" 
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-gray-200"
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Top Performing Brokers
            </h3>
            <p className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              Based on revenue and successful transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className={`px-3 py-1 rounded-lg text-sm ${
              theme === "dark" 
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
              This Month
            </button>
            <button className={`px-3 py-1 rounded-lg text-sm ${
              theme === "dark" 
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
              All Time
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}>
                <th className={`py-3 text-left font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>Broker</th>
                <th className={`py-3 text-left font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>Active Listings</th>
                <th className={`py-3 text-left font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>Successful Sales</th>
                <th className={`py-3 text-left font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>Revenue</th>
                <th className={`py-3 text-left font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>Rating</th>
                <th className={`py-3 text-left font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topBrokers.map((broker) => (
                <tr key={broker.id} className={`border-b ${
                  theme === "dark" 
                    ? "border-gray-800 hover:bg-gray-750" 
                    : "border-gray-100 hover:bg-gray-50"
                }`}>
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
                        <div 
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${(broker.listings / 50) * 100}%` }}
                        />
                      </div>
                      <span>{broker.listings}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="font-medium">{broker.sales}</span>
                    <span className={`text-sm ml-2 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      ({((broker.sales / broker.listings) * 100).toFixed(1)}% success rate)
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(broker.revenue)}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <div className="text-amber-500">★</div>
                      <span className="font-medium">{broker.rating}</span>
                      <span className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        /5.0
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button className={`p-2 rounded ${
                        theme === "dark"
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className={`p-2 rounded ${
                        theme === "dark"
                          ? "bg-blue-900/50 text-blue-400 hover:bg-blue-800/50"
                          : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      }`}>
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
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <h4 className={`font-medium mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Platform Metrics
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Avg. Property Views
              </span>
              <span className="font-medium">1,245</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Avg. Time on Site
              </span>
              <span className="font-medium">4m 32s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Bounce Rate
              </span>
              <span className="font-medium text-green-600">32%</span>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <h4 className={`font-medium mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Transaction Metrics
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Avg. Sale Price
              </span>
              <span className="font-medium">{formatCurrency(1250000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Avg. Rent Price
              </span>
              <span className="font-medium">{formatCurrency(15000)}/month</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Commission Rate
              </span>
              <span className="font-medium">2.5%</span>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <h4 className={`font-medium mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Support Metrics
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Open Tickets
              </span>
              <span className="font-medium">{stats.supportTickets}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Resolution Rate
              </span>
              <span className="font-medium text-green-600">{stats.resolutionRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Customer Satisfaction
              </span>
              <span className="font-medium">4.7/5.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;