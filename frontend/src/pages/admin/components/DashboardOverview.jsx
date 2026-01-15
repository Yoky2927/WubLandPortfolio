// frontend/src/pages/admin/components/DashboardOverview.jsx
import React, { useState, lazy, Suspense } from "react";
import { 
  Users, Home, DollarSign, MessageSquare, 
  Activity, UserPlus, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Clock
} from "lucide-react";

// Lazy load chart components
const LineChart = lazy(() => import("../../../components/charts/LineChart"));
const DonutChart = lazy(() => import("../../../components/charts/DonutChart"));
const EthiopiaMap = lazy(() => import("../../../components/EthiopiaMap"));

const DashboardOverview = ({ 
  theme, user, users, analyticsData, systemHealth, 
  recentActivities, usersLast7Days, setToast 
}) => {
  const [isChatMaximized, setIsChatMaximized] = useState(false);

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalBrokers = users.filter(u => u.role.includes('broker')).length;
  const totalProperties = analyticsData?.properties?.total || 0;
  const totalRevenue = analyticsData?.revenue?.total || 0;
  const avgResponseTime = analyticsData?.support?.avgResponseTime || "2.5";
  
  // Role distribution for chart
  const roleDistribution = {
    labels: ['Brokers', 'Buyers', 'Sellers', 'Support', 'Admins'],
    datasets: [{
      data: [
        users.filter(u => u.role.includes('broker')).length,
        users.filter(u => u.role === 'buyer').length,
        users.filter(u => u.role === 'seller').length,
        users.filter(u => u.role.includes('support')).length,
        users.filter(u => u.role.includes('admin')).length,
      ],
      backgroundColor: [
        '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'
      ]
    }]
  };

  // Revenue chart data
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue (ETB)',
      data: analyticsData?.revenue?.monthly || [0, 0, 0, 0, 0, 0],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    }]
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        } shadow-lg hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${
              theme === "dark" ? "bg-blue-900/50" : "bg-blue-100"
            }`}>
              <Users className={`w-6 h-6 ${
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              }`} />
            </div>
            <span className={`text-sm font-medium ${
              theme === "dark" ? "text-green-400" : "text-green-600"
            }`}>
              <TrendingUp className="inline w-4 h-4 mr-1" />
              +{usersLast7Days} this week
            </span>
          </div>
          <h3 className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            {totalUsers.toLocaleString()}
          </h3>
          <p className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Total Users
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Active: {activeUsers}
              </span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Brokers: {totalBrokers}
              </span>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        } shadow-lg hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${
              theme === "dark" ? "bg-green-900/50" : "bg-green-100"
            }`}>
              <Home className={`w-6 h-6 ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`} />
            </div>
            <span className={`text-sm font-medium ${
              theme === "dark" ? "text-green-400" : "text-green-600"
            }`}>
              <TrendingUp className="inline w-4 h-4 mr-1" />
              +12% growth
            </span>
          </div>
          <h3 className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            {totalProperties.toLocaleString()}
          </h3>
          <p className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Total Properties
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                For Sale: {analyticsData?.properties?.forSale || 0}
              </span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                For Rent: {analyticsData?.properties?.forRent || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        } shadow-lg hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${
              theme === "dark" ? "bg-amber-900/50" : "bg-amber-100"
            }`}>
              <DollarSign className={`w-6 h-6 ${
                theme === "dark" ? "text-amber-400" : "text-amber-600"
              }`} />
            </div>
            <span className={`text-sm font-medium ${
              theme === "dark" ? "text-green-400" : "text-green-600"
            }`}>
              <TrendingUp className="inline w-4 h-4 mr-1" />
              +24% this month
            </span>
          </div>
          <h3 className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            ETB {totalRevenue.toLocaleString()}
          </h3>
          <p className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Total Revenue
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                This Month: ETB {analyticsData?.revenue?.thisMonth || 0}
              </span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Target: ETB 500K
              </span>
            </div>
          </div>
        </div>

        {/* Support Metrics */}
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        } shadow-lg hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${
              theme === "dark" ? "bg-purple-900/50" : "bg-purple-100"
            }`}>
              <MessageSquare className={`w-6 h-6 ${
                theme === "dark" ? "text-purple-400" : "text-purple-600"
              }`} />
            </div>
            <span className={`text-sm font-medium ${
              theme === "dark" ? "text-green-400" : "text-green-600"
            }`}>
              <TrendingDown className="inline w-4 h-4 mr-1" />
              -15% response time
            </span>
          </div>
          <h3 className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            {avgResponseTime}h
          </h3>
          <p className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Avg. Response Time
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Open Tickets: {analyticsData?.support?.openTickets || 0}
              </span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Resolved: {analyticsData?.support?.resolved || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className={`lg:col-span-2 p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Revenue Overview
            </h3>
            <div className="flex gap-2">
              <button className={`px-3 py-1 rounded-lg text-sm ${
                theme === "dark" 
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}>
                Monthly
              </button>
              <button className={`px-3 py-1 rounded-lg text-sm ${
                theme === "dark" 
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}>
                Quarterly
              </button>
            </div>
          </div>
          <div className="h-64">
            <Suspense fallback={
              <div className={`h-full flex items-center justify-center ${
                theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              } rounded animate-pulse`}>
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    Loading chart...
                  </p>
                </div>
              </div>
            }>
              <LineChart data={revenueData} theme={theme} />
            </Suspense>
          </div>
        </div>

        {/* Role Distribution */}
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <h3 className={`text-lg font-semibold mb-6 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            User Distribution
          </h3>
          <div className="h-64">
            <Suspense fallback={
              <div className={`h-full flex items-center justify-center ${
                theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              } rounded animate-pulse`}>
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    Loading chart...
                  </p>
                </div>
              </div>
            }>
              <DonutChart data={roleDistribution} theme={theme} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* System Health & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className={`lg:col-span-2 p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <h3 className={`text-lg font-semibold mb-6 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            System Health
          </h3>
          <div className="space-y-4">
            {systemHealth ? Object.entries(systemHealth).map(([key, service]) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${
                    service.status === 'healthy' 
                      ? 'bg-green-100 text-green-600' 
                      : service.status === 'warning'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {service.status === 'healthy' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                    </h4>
                    <p className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      {service.responseTime || service.connections || service.threatLevel}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  service.status === 'healthy'
                    ? 'bg-green-100 text-green-800'
                    : service.status === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {service.status}
                </span>
              </div>
            )) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  Loading system health...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className={`p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Recent Activities
            </h3>
            <Clock className={`w-5 h-5 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`} />
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivities.length > 0 ? recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className={`p-2 rounded ${
                  activity.type === 'user' 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                    : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                }`}>
                  {activity.type === 'user' ? (
                    <Users className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {activity.action}
                  </p>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {activity.detail}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  No recent activities
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;