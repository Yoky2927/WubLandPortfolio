// frontend/src/components/SuperAdminDashbord.jsx
import React, { Suspense, lazy } from "react";
import {
  Users,
  Crown,
  DollarSign,
  Activity,
  Server,
  Database,
  Shield,
  CheckSquare,
  Edit,
  Trash2,
} from "lucide-react";

// Lazy load components
const LineChart = lazy(() => import("./charts/LineChart"));
const RadarChart = lazy(() => import("./charts/RadarChart"));
const DonutChart = lazy(() => import("./charts/DonutChart"));
const TodoList = lazy(() => import("./TodoList"));
const ChatApp = lazy(() => import("./ChatApp"));
const EthiopiaMap = lazy(() => import("./EthiopiaMap"));
const Loader = lazy(() => import("./Loader"));
const ErrorBoundary = lazy(() => import("./ErrorBoundary"));

// Helper function to calculate days ago
const getTimeAgo = (timestamp) => {
  if (!timestamp) return "Just now";

  const now = new Date();
  const past = new Date(timestamp);
  const diffInMs = now - past;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} min ago`;
    }
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
};

// SystemHealthCard Component
const SystemHealthCard = ({ title, status, value, icon, color, theme }) => (
  <div
    className={`p-6 rounded-xl border ${
      theme === "dark"
        ? "bg-gray-800 border-gray-700"
        : "bg-white border-gray-200"
    } transition-all duration-300 hover:shadow-lg`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>{icon}</div>
      <span
        className={`text-sm font-medium ${
          status === "healthy"
            ? "text-green-500"
            : status === "warning"
            ? "text-yellow-500"
            : "text-red-500"
        }`}
      >
        {status}
      </span>
    </div>
    <h3
      className={`text-2xl font-bold mb-1 ${
        theme === "dark" ? "text-white" : "text-gray-900"
      }`}
    >
      {value}
    </h3>
    <p
      className={`text-sm ${
        theme === "dark" ? "text-gray-400" : "text-gray-600"
      }`}
    >
      {title}
    </p>
  </div>
);

// StatCard Component
const StatCard = ({ icon, title, value, trend, color, subtitle, theme }) => {
  // Safely handle trend value
  const trendString = String(trend || "");
  const isPositive = trendString.includes("+");
  const isNegative = trendString.includes("-");
  const formattedTrend =
    typeof trend === "number" ? `${trend >= 0 ? "+" : ""}${trend}%` : trend;

  return (
    <div
      className={`p-6 rounded-xl border ${
        theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      } transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>{icon}</div>
        <span
          className={`text-sm font-medium ${
            isPositive
              ? "text-green-500"
              : isNegative
              ? "text-red-500"
              : "text-gray-500"
          }`}
        >
          {formattedTrend}
        </span>
      </div>
      <h3
        className={`text-2xl font-bold mb-1 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </h3>
      <p
        className={`text-sm ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {title}
      </p>
      <p
        className={`text-xs mt-2 ${
          theme === "dark" ? "text-gray-500" : "text-gray-400"
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
};

const SuperAdminDashbord = ({
  theme,
  user,
  users,
  analyticsData,
  systemHealth,
  todoItems,
  setTodoItems,
  newTodo,
  setNewTodo,
  newTodoAssignee,
  setNewTodoAssignee,
  newTodoDueDate,
  setNewTodoDueDate,
  showCalendar,
  setShowCalendar,
  calendarRef,
  isChatMaximized,
  setIsChatMaximized,
  showUserInfoModal,
  setShowUserInfoModal,
  setSelectedUser,
  recentActivities,
  usersLast7Days,
}) => {
  // Calculate active users from analytics or users data
  const activeUsersCount =
    analyticsData?.activeUsers ||
    users.filter((u) => u.status === "active" || u.isActive).length;

  // Calculate admin users
  const adminUsersCount = users.filter(
    (u) => u.role === "admin" || u.role === "super_admin"
  ).length;

  // Prepare property distribution data
  const propertyDistributionData = {
    labels: analyticsData?.propertyDistribution?.map((p) => p.type) || [
      "Residential",
      "Commercial",
      "Land",
      "Apartments",
      "Houses",
    ],
    values: analyticsData?.propertyDistribution?.map((p) => p.count) || [
      35, 25, 15, 20, 5,
    ],
    colors: analyticsData?.propertyDistribution?.map((p) => p.color) || [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ef4444",
    ],
  };

  return (
    <ErrorBoundary>
      <div className="mx-0 space-y-6">
        {/* Welcome Header */}
        <div
          className={`p-6 text-center ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
        >
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            } mb-2`}
          >
            Welcome back, Super Admin {user?.first_name}!
          </h1>
          <p
            className={`${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Complete system oversight and administration.
          </p>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SystemHealthCard
            icon={<Server className="w-6 h-6 text-blue-500" />}
            title="API Service"
            status={systemHealth?.apiService?.status || "unknown"}
            value={systemHealth?.apiService?.responseTime || "N/A"}
            color="bg-blue-500"
            theme={theme}
          />
          <SystemHealthCard
            icon={<Database className="w-6 h-6 text-green-500" />}
            title="Database"
            status={systemHealth?.database?.status || "unknown"}
            value={systemHealth?.database?.connections || "N/A"}
            color="bg-green-500"
            theme={theme}
          />
          <SystemHealthCard
            icon={<Activity className="w-6 h-6 text-purple-500" />}
            title="WebSocket"
            status={systemHealth?.websocket?.status || "unknown"}
            value={systemHealth?.websocket?.connections || "N/A"}
            color="bg-purple-500"
            theme={theme}
          />
          <SystemHealthCard
            icon={<Shield className="w-6 h-6 text-amber-500" />}
            title="Security"
            status={systemHealth?.security?.status || "unknown"}
            value={systemHealth?.security?.threatLevel || "N/A"}
            color="bg-amber-500"
            theme={theme}
          />
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Users className="w-6 h-6 text-blue-500" />}
            title="Total Users"
            value={users.length}
            trend={analyticsData?.userTrend || 0}
            color="bg-blue-500"
            subtitle="All platform users"
            theme={theme}
          />
          <StatCard
            icon={<Crown className="w-6 h-6 text-purple-500" />}
            title="Admins"
            value={adminUsersCount}
            trend={5}
            color="bg-purple-500"
            subtitle="Admin users"
            theme={theme}
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6 text-amber-500" />}
            title="Revenue"
            value={`ETB ${(
              (analyticsData?.dealAnalytics?.totalRevenue || 0) / 1000
            ).toFixed(0)}K`}
            trend={analyticsData?.dealAnalytics?.revenueTrend || 23}
            color="bg-amber-500"
            subtitle="This month"
            theme={theme}
          />
          <StatCard
            icon={<Activity className="w-6 h-6 text-green-500" />}
            title="Active Now"
            value={activeUsersCount}
            trend={analyticsData?.activeTrend || 5}
            color="bg-green-500"
            subtitle="Online users"
            theme={theme}
          />
        </div>

        {/* First row of charts - Line and Radar */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              className={`p-6 rounded-xl border ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="h-80">
                <LineChart
                  theme={theme}
                  analyticsData={analyticsData}
                  title="Monthly Performance"
                />
              </div>
            </div>
            <div
              className={`p-6 rounded-xl border ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="h-96">
                <RadarChart
                  theme={theme}
                  analyticsData={analyticsData}
                  title="User Role Distribution"
                />
              </div>
            </div>
          </div>
        </Suspense>

        {/* Row for TodoList (left) and Property Distribution + Recent Activities (right) */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TodoList - ON THE LEFT SIDE */}
            <TodoList
              theme={theme}
              todoItems={todoItems}
              setTodoItems={setTodoItems}
              newTodo={newTodo}
              setNewTodo={setNewTodo}
              newTodoAssignee={newTodoAssignee}
              setNewTodoAssignee={setNewTodoAssignee}
              newTodoDueDate={newTodoDueDate}
              setNewTodoDueDate={setNewTodoDueDate}
              showCalendar={showCalendar}
              setShowCalendar={setShowCalendar}
              calendarRef={calendarRef}
            />
            
            {/* Right side - Vertical stack of Property Chart and Recent Activities */}
            <div className="space-y-6">
              {/* Property Distribution Donut Chart - Reduced height */}
              <div
                className={`p-6 rounded-xl border ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="h-96"> {/* Reduced from h-96 to h-64 */}
                  <DonutChart
                    theme={theme}
                    data={{
                      labels: propertyDistributionData.labels,
                      values: propertyDistributionData.values,
                      colors: propertyDistributionData.colors
                    }}
                    title="Property Type Distribution"
                  />
                </div>
              </div>

              {/* Recent Activities - LENGTHIER version */}
              <div
                className={`p-6 rounded-xl border ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3
                    className={`text-lg font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Recent Activities
                  </h3>
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${
                      theme === "dark"
                        ? "bg-blue-900 text-blue-200"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    Last 7 Days
                  </span>
                </div>

                {/* Users Joined Summary */}
                <div
                  className={`mb-4 p-3 rounded-lg ${
                    theme === "dark" ? "bg-gray-700" : "bg-blue-50"
                  }`}
                >
                  <p
                    className={`text-sm text-center ${
                      theme === "dark" ? "text-blue-300" : "text-blue-700"
                    }`}
                  >
                    📊 <strong>{usersLast7Days} users</strong> joined in the last 7 days
                  </p>
                </div>

                {recentActivities.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {recentActivities.map((activity) => {
                      const activityTime = activity.timestamp 
                        ? getTimeAgo(activity.timestamp)
                        : "Recently";
                      
                      return (
                        <div
                          key={activity.id}
                          className={`p-4 rounded-lg border ${
                            theme === "dark"
                              ? "bg-gray-700 border-gray-600"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                  theme === "dark" ? "bg-blue-900" : "bg-blue-100"
                                }`}
                              >
                                {activity.type === "user" ? (
                                  <Users
                                    className={`w-5 h-5 ${
                                      theme === "dark"
                                        ? "text-blue-300"
                                        : "text-blue-600"
                                    }`}
                                  />
                                ) : activity.type.includes("todo") ? (
                                  activity.icon === "CheckSquare" ? (
                                    <CheckSquare
                                      className={`w-5 h-5 ${
                                        theme === "dark"
                                          ? "text-green-300"
                                          : "text-green-600"
                                      }`}
                                    />
                                  ) : activity.icon === "Edit" ? (
                                    <Edit
                                      className={`w-5 h-5 ${
                                        theme === "dark"
                                          ? "text-yellow-300"
                                          : "text-yellow-600"
                                      }`}
                                    />
                                  ) : (
                                    <Trash2
                                      className={`w-5 h-5 ${
                                        theme === "dark"
                                          ? "text-red-300"
                                          : "text-red-600"
                                      }`}
                                    />
                                  )
                                ) : (
                                  <Activity
                                    className={`w-5 h-5 ${
                                      theme === "dark"
                                        ? "text-blue-300"
                                        : "text-blue-600"
                                    }`}
                                  />
                                )}
                              </div>
                              <div>
                                <p
                                  className={`font-medium ${
                                    theme === "dark" ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {activity.action}
                                </p>
                                <p
                                  className={`text-sm ${
                                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                                  }`}
                                >
                                  {activity.detail}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-sm ${
                                theme === "dark" ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {activityTime}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users
                      className={`w-16 h-16 mx-auto mb-4 ${
                        theme === "dark" ? "text-gray-600" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-lg font-medium mb-2 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      No recent activities
                    </p>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      No user registrations or activities in the past 7 days
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Suspense>

        {/* Row for ChatApp (full width) */}
        <Suspense
          fallback={
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          }
        >
          <div className="grid grid-cols-1 gap-6">
            {/* ChatApp - NOW BELOW TodoList & Property Chart */}
            <ChatApp
              theme={theme}
              user={user}
              isChatMaximized={isChatMaximized}
              setIsChatMaximized={setIsChatMaximized}
              showUserInfoModal={showUserInfoModal}
              setShowUserInfoModal={setShowUserInfoModal}
              setSelectedUser={setSelectedUser}
            />
          </div>
        </Suspense>

        {/* Ethiopia Map */}
        <Suspense
          fallback={
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          }
        >
          <EthiopiaMap data={analyticsData?.locationAnalytics || []} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default SuperAdminDashbord;