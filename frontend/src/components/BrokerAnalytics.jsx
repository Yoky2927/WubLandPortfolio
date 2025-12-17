// components/BrokerAnalytics.jsx - FIXED VERSION
import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Percent,
  Activity,
  Clock,
  Target,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  LineChart as LineChartIcon,
} from "lucide-react";

// Import your API configuration
import { apiRequest } from "../config/api.config";

// Chart components
import DonutChart from "./charts/DonutChart";
import LineChart from "./charts/LineChart";
import RadarChart from "./charts/RadarChart";

const BrokerAnalytics = ({ 
  theme, 
  user, 
  brokerStats, 
  brokerMetrics = {},
  analyticsLoading,
  setToast 
}) => {
  const [timeframe, setTimeframe] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchAnalytics();
    }
  }, [user?.id, timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use your api.config.js utility instead of hardcoded URL
      const response = await apiRequest('BROKER_ANALYTICS', {}, { brokerId: user.id });
      
      if (response.success && response.data) {
        setAnalyticsData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
      setToast({
        show: true,
        message: "Failed to load analytics data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data with proper sizing
  const prepareChartData = () => {
    if (!analyticsData) return {};

    // Property status distribution
    const propertyStatusData = {
      labels: ['Approved', 'Pending', 'Rejected', 'Draft'],
      datasets: [{
        data: [
          analyticsData.propertyStats?.approved || 0,
          analyticsData.propertyStats?.pending || 0,
          analyticsData.propertyStats?.rejected || 0,
          analyticsData.propertyStats?.draft || 0,
        ],
        backgroundColor: [
          '#10B981', // green
          '#F59E0B', // amber
          '#EF4444', // red
          '#6B7280', // gray
        ]
      }]
    };

    // Revenue over time
    const revenueData = {
      labels: analyticsData.revenueTrend?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Revenue (ETB)',
        data: analyticsData.revenueTrend?.data || [0, 0, 0, 0, 0, 0],
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    // Performance metrics for radar chart
    const performanceData = {
      labels: ['Response Rate', 'Approval Rate', 'Client Satisfaction', 'Commission Rate'],
      datasets: [{
        label: 'Performance (%)',
        data: [
          analyticsData.performance?.responseRate || 0,
          analyticsData.performance?.approvalRate || 0,
          analyticsData.performance?.clientSatisfaction || 0,
          analyticsData.performance?.avgCommissionRate || 0,
        ],
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: '#F59E0B',
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    };

    // Prepare user distribution data for RadarChart
    const userDistributionData = {
      labels: performanceData.labels,
      counts: performanceData.datasets[0].data,
      totalUsers: analyticsData.clientStats?.totalClients || 0
    };

    return { propertyStatusData, revenueData, performanceData, userDistributionData };
  };

  const { propertyStatusData, revenueData, performanceData, userDistributionData } = prepareChartData();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading || analyticsLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
        <div className="text-red-500 mb-4">❌ {error}</div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Performance insights and business metrics
          </p>
          {analyticsData?.generatedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {new Date(analyticsData.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === "dark"
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
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-amber-50"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</div>
              <div className="text-2xl lg:text-3xl font-bold mt-1">
                {formatCurrency(analyticsData?.totalRevenue || 0)}
              </div>
              <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                {analyticsData?.recentRevenue ? formatCurrency(analyticsData.recentRevenue) + ' recent' : ''}
              </div>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
              <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-blue-50"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Listings</div>
              <div className="text-2xl lg:text-3xl font-bold mt-1">
                {analyticsData?.totalListings || 0}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {analyticsData?.pendingReviews || 0} pending review
              </div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-green-50"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Approval Rate</div>
              <div className="text-2xl lg:text-3xl font-bold mt-1">
                {analyticsData?.performance?.approvalRate || 0}%
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                {analyticsData?.propertyStats?.approved || 0} approved
              </div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Percent className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-purple-50"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Response Rate</div>
              <div className="text-2xl lg:text-3xl font-bold mt-1">
                {analyticsData?.performance?.responseRate || 0}%
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                Avg: {analyticsData?.avgResponseTime || '0h'} response
              </div>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend Chart */}
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-white"} border ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Revenue Trend</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue over {timeframe}</p>
            </div>
            <LineChartIcon className="w-6 h-6 text-amber-500" />
          </div>
          <div className="h-80">
            <LineChart
              data={revenueData}
              theme={theme}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    grid: {
                      color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    },
                    ticks: {
                      color: theme === 'dark' ? '#fff' : '#666',
                    }
                  },
                  y: {
                    grid: {
                      color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    },
                    ticks: {
                      color: theme === 'dark' ? '#fff' : '#666',
                      callback: function(value) {
                        return formatCurrency(value);
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Property Status Distribution */}
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-white"} border ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Property Status</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Distribution by status</p>
            </div>
            <PieChart className="w-6 h-6 text-blue-500" />
          </div>
          <div className="h-80">
            <DonutChart
              data={propertyStatusData}
              theme={theme}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: theme === 'dark' ? '#fff' : '#666',
                      padding: 20,
                      font: {
                        size: 12
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Performance Radar Chart */}
      <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-white"} border ${theme === "dark" ? "border-gray-600" : "border-gray-200"} mb-8`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Key performance indicators</p>
          </div>
          <Target className="w-6 h-6 text-green-500" />
        </div>
        <div className="h-80">
          <RadarChart
            data={performanceData}
            theme={theme}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              scales: {
                r: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    stepSize: 20,
                    color: theme === 'dark' ? '#fff' : '#666',
                    backdropColor: 'transparent'
                  },
                  grid: {
                    color: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  },
                  angleLines: {
                    color: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  },
                  pointLabels: {
                    color: theme === 'dark' ? '#fff' : '#666',
                    font: {
                      size: 13
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  display: false
                }
              }
            }}
          />
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Client Statistics */}
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
          <h4 className="text-lg font-semibold mb-4">Client Statistics</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Clients</span>
              <span className="font-semibold">{analyticsData?.clientStats?.totalClients || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Active Clients</span>
              <span className="font-semibold">{analyticsData?.clientStats?.activeClients || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">New Clients ({timeframe})</span>
              <span className="font-semibold">{analyticsData?.clientStats?.newClients || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Retention Rate</span>
              <span className="font-semibold">{analyticsData?.clientStats?.retentionRate || 0}%</span>
            </div>
          </div>
        </div>

        {/* Transaction Statistics */}
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
          <h4 className="text-lg font-semibold mb-4">Transaction Statistics</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Transactions</span>
              <span className="font-semibold">{analyticsData?.transactionStats?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Completed</span>
              <span className="font-semibold">{analyticsData?.transactionStats?.completed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pending</span>
              <span className="font-semibold">{analyticsData?.transactionStats?.pending || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Avg Commission</span>
              <span className="font-semibold">{formatCurrency(analyticsData?.transactionStats?.avgCommission || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      {analyticsData?.recentActivities && analyticsData.recentActivities.length > 0 && (
        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-white"} border ${theme === "dark" ? "border-gray-600" : "border-gray-200"} mb-8`}>
          <h4 className="text-lg font-semibold mb-4">Recent Activities</h4>
          <div className="space-y-3">
            {analyticsData.recentActivities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'property' ? 'bg-blue-100 dark:bg-blue-900' :
                    activity.type === 'transaction' ? 'bg-green-100 dark:bg-green-900' :
                    'bg-amber-100 dark:bg-amber-900'
                  }`}>
                    {activity.type === 'property' ? (
                      <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : activity.type === 'transaction' ? (
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activity.detail}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className={`mt-8 p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data timeframe: {timeframe}
            </p>
            {analyticsData?.generatedAt && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Last updated: {new Date(analyticsData.generatedAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const reportData = {
                  broker: `${user?.first_name} ${user?.last_name}`,
                  brokerId: user?.id,
                  timeframe,
                  date: new Date().toISOString(),
                  ...analyticsData
                };
                
                const dataStr = JSON.stringify(reportData, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const link = document.createElement("a");
                link.setAttribute("href", dataUri);
                link.setAttribute("download", `broker_analytics_${user?.id}_${new Date().toISOString().split('T')[0]}.json`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
            
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerAnalytics;