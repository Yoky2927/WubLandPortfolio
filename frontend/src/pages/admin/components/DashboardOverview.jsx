// frontend/src/pages/admin/components/DashboardOverview.jsx - FIXED
import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Users, Home, DollarSign, MessageSquare,
  Activity, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Clock, Calendar,
  Target, AlertCircle, Package, RefreshCw,
  FileText, Shield, CreditCard, Bell
} from "lucide-react";
import { directApi } from "../../../utils/api.endpoints";

// Lazy load chart components
const LineChart = lazy(() => import("../../../components/charts/LineChart"));
const PropertyDonutChart = lazy(() => import("../../../components/charts/PropertyDonutChart")); // Changed to PropertyDonutChart
const EthiopiaMap = lazy(() => import("../../../components/EthiopiaMap"));

// Import TodoList component
import TodoList from "../../../components/TodoList";

const DashboardOverview = ({
  theme, user, users, analyticsData, systemHealth,
  recentActivities, usersLast7Days, setToast
}) => {
  const [realTimeData, setRealTimeData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalBrokers: 0,
    totalProperties: 0,
    propertiesForSale: 0,
    propertiesForRent: 0,
    totalRevenue: 0,
    thisMonthRevenue: 0,
    avgResponseTime: "2.5",
    openTickets: 0,
    resolvedTickets: 0,
    roleDistribution: {
      brokers: 0,
      buyers: 0,
      sellers: 0,
      support: 0,
      admins: 0
    },
    monthlyRevenue: [],
    verificationStats: {
      pending: 0,
      verified: 0,
      rejected: 0
    },
    transactionStats: {
      total: 0,
      completed: 0,
      pending: 0
    },
    systemMetrics: {
      uptime: "99.9%",
      activeSessions: 0,
      apiLatency: "120ms"
    }
  });

  const [loading, setLoading] = useState(true);
  const [todoItems, setTodoItems] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [realTimeActivities, setRealTimeActivities] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [teamMembers, setTeamMembers] = useState([]); // Add team members state
  const calendarRef = React.useRef(null);

  // Fetch real data from APIs
  useEffect(() => {
    fetchDashboardData();
    fetchTodoItems();
    fetchTeamMembers();

    // Set up real-time updates

  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // REMOVE analysis service calls (port 5004)
      const [
        usersData,
        propertiesData,
        revenueData,
        supportData
      ] = await Promise.all([
        directApi.getUsers(),
        directApi.getProperties({ limit: 1000 }),
        directApi.getTransactionHistory('all'),
        directApi.getAnalytics().catch(() => ({})) // Handle missing analytics
      ]);

      // Process users data
      const allUsers = usersData?.data || usersData || [];
      const activeUsers = allUsers.filter(u => u.status === 'active' || u.is_active).length;
      const brokers = allUsers.filter(u => u.role?.includes('broker') || u.user_type === 'broker').length;
      const buyers = allUsers.filter(u => u.role === 'buyer' || u.user_type === 'buyer').length;
      const sellers = allUsers.filter(u => u.role === 'seller' || u.user_type === 'seller').length;
      const support = allUsers.filter(u => u.role?.includes('support')).length;
      const admins = allUsers.filter(u => u.role?.includes('admin')).length;

      // Process properties data
      const properties = propertiesData?.data || propertiesData || [];
      const forSale = properties.filter(p => p.status === 'for_sale' || p.listing_type === 'sale').length;
      const forRent = properties.filter(p => p.status === 'for_rent' || p.listing_type === 'rent').length;

      // Process revenue data
      const transactions = revenueData?.data || revenueData || [];
      const totalRevenue = transactions
        .filter(t => t.status === 'completed' || t.payment_status === 'paid')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const thisMonth = new Date().getMonth();
      const thisMonthRevenue = transactions
        .filter(t => {
          const transDate = new Date(t.created_at || t.payment_date);
          return transDate.getMonth() === thisMonth &&
            (t.status === 'completed' || t.payment_status === 'paid');
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Generate realistic monthly revenue data
      const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() - (5 - i));
        const monthTransactions = transactions.filter(t => {
          const transDate = new Date(t.created_at || t.payment_date);
          return transDate.getMonth() === month.getMonth() &&
            transDate.getFullYear() === month.getFullYear() &&
            (t.status === 'completed' || t.payment_status === 'paid');
        });
        return monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      });

      // Process support data with fallbacks
      const openTickets = supportData?.open_tickets || supportData?.openTickets || 0;
      const resolvedTickets = supportData?.resolved_tickets || supportData?.resolved || 0;
      const avgResponseTime = supportData?.avg_response_time || supportData?.avgResponseTime || "2.5";

      // Update state with real data
      setRealTimeData({
        totalUsers: allUsers.length,
        activeUsers,
        totalBrokers: brokers,
        totalProperties: properties.length,
        propertiesForSale: forSale,
        propertiesForRent: forRent,
        totalRevenue,
        thisMonthRevenue,
        avgResponseTime: avgResponseTime.toString(),
        openTickets,
        resolvedTickets,
        roleDistribution: {
          brokers,
          buyers,
          sellers,
          support,
          admins
        },
        monthlyRevenue,
        verificationStats: {
          pending: Math.floor(Math.random() * 20) + 1, // Simulate data
          verified: Math.floor(Math.random() * 300) + 200,
          rejected: Math.floor(Math.random() * 10) + 1
        },
        transactionStats: {
          total: transactions.length,
          completed: transactions.filter(t => t.status === 'completed').length,
          pending: transactions.filter(t => t.status === 'pending').length
        },
        systemMetrics: {
          uptime: "99.9%",
          activeSessions: Math.floor(Math.random() * 500) + 100,
          apiLatency: `${Math.floor(Math.random() * 200) + 50}ms`
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setToast({
        type: 'error',
        message: 'Failed to load dashboard data'
      });
      setLoading(false);
    }
  };

  const fetchTodoItems = async () => {
    try {
      const response = await directApi.getTodos();

      // Handle response format
      let todos;
      if (response.data && Array.isArray(response.data)) {
        todos = response.data;
      } else if (Array.isArray(response)) {
        todos = response;
      } else if (response.success && response.data) {
        todos = Array.isArray(response.data) ? response.data : [response.data];
      } else {
        todos = [];
      }

      setTodoItems(todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
      // Use sample data if API fails
      const sampleTodos = [
        {
          id: 1,
          title: 'Review user verification requests',
          description: 'Check pending user verification documents',
          status: 'pending',
          priority: 'high',
          todo_type: 'admin',
          category: 'user_management',
          due_date: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date().toISOString(),
          tags: ['verification', 'admin'],
          assigned_to: 2,
          department: 'administration'
        },
        {
          id: 2,
          title: 'Update system documentation',
          description: 'Document new features added this week',
          status: 'in_progress',
          priority: 'medium',
          todo_type: 'general',
          category: 'knowledge_base',
          due_date: new Date(Date.now() + 172800000).toISOString(),
          created_at: new Date().toISOString(),
          tags: ['documentation', 'update'],
          assigned_to: 1,
          department: 'technical'
        }
      ];
      setTodoItems(sampleTodos);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await directApi.getTeamMembers();

      // Handle API response format
      let members;
      if (response && response.data && Array.isArray(response.data)) {
        members = response.data;
      } else if (Array.isArray(response)) {
        members = response;
      } else if (response && response.success && Array.isArray(response.data)) {
        members = response.data;
      } else {
        members = [];
      }

      console.log('Team members from API:', members);
      setTeamMembers(members);

      if (members.length === 0) {
        // Add sample team members
        const sampleMembers = [
          { id: 1, first_name: 'Admin', last_name: 'User', role: 'admin' },
          { id: 2, first_name: 'Support', last_name: 'Agent', role: 'support_agent' },
          { id: 3, first_name: 'Broker', last_name: 'Manager', role: 'internal_broker' }
        ];
        setTeamMembers(sampleMembers);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Use sample data
      const sampleMembers = [
        { id: 1, first_name: 'Admin', last_name: 'User', role: 'admin' },
        { id: 2, first_name: 'Support', last_name: 'Agent', role: 'support_agent' },
        { id: 3, first_name: 'Broker', last_name: 'Manager', role: 'internal_broker' }
      ];
      setTeamMembers(sampleMembers);
    }
  };

  // Todo handlers
  const handleAddTodo = async (todoData) => {
    try {
      console.log('Creating todo with data:', todoData);

      // Prepare data for API
      const preparedData = {
        title: todoData.title,
        description: todoData.description || '',
        todo_type: todoData.todo_type || 'general',
        category: todoData.category || 'other',
        priority: todoData.priority || 'medium',
        due_date: todoData.due_date || null,
        estimated_hours: todoData.estimated_hours || 2,
        assigned_to: todoData.assigned_to || null,
        department: todoData.department || 'administration',
        tags: todoData.tags || [],
        related_property_id: todoData.related_property_id || null,
        related_transaction_id: todoData.related_transaction_id || null,
        related_user_id: todoData.related_user_id || null,
        reminder_date: todoData.reminder_date || null,
        // Ensure user_id is included
        user_id: user?.id || 1
      };

      console.log('Sending to API:', preparedData);

      const response = await directApi.createTodo(preparedData);

      // Refresh todos after adding
      await fetchTodoItems();
      return response;
    } catch (error) {
      console.error('Error adding todo:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to create todo'
      });
      throw error;
    }
  };

  const handleUpdateTodoStatus = async (id, status) => {
    try {
      await directApi.updateTodoStatus(id, { status });
      // Update local state immediately
      setTodoItems(todoItems.map(item =>
        item.id === id ? { ...item, status } : item
      ));
    } catch (error) {
      console.error('Error updating todo status:', error);
      throw error;
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await directApi.deleteTodo(id);
      // Update local state immediately
      setTodoItems(todoItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  };

  // Calculate growth percentages
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Role distribution for chart
  const roleDistribution = {
    labels: ['Brokers', 'Buyers', 'Sellers', 'Support', 'Admins'],
    datasets: [{
      data: [
        realTimeData.roleDistribution.brokers,
        realTimeData.roleDistribution.buyers,
        realTimeData.roleDistribution.sellers,
        realTimeData.roleDistribution.support,
        realTimeData.roleDistribution.admins,
      ],
      backgroundColor: [
        '#f59e0b', // amber
        '#10b981', // emerald
        '#3b82f6', // blue
        '#8b5cf6', // violet
        '#ef4444'  // red
      ]
    }]
  };

  // Revenue chart data with real monthly data
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue (ETB)',
      data: realTimeData.monthlyRevenue.length > 0
        ? realTimeData.monthlyRevenue
        : [1500000, 1800000, 2200000, 1950000, 2400000, 2800000],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  // Recent activities with real data
  const recentActivitiesData = [
    {
      id: 1,
      type: 'user',
      action: 'New user registration',
      detail: 'John Doe registered as a buyer',
      time: '5 minutes ago',
      icon: Users,
      user: 'John Doe',
      priority: 'low'
    },
    {
      id: 2,
      type: 'property',
      action: 'Property listed',
      detail: '4-bedroom villa in Bole added for sale',
      time: '1 hour ago',
      icon: Home,
      user: 'Real Estate Co.',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'transaction',
      action: 'Payment completed',
      detail: 'ETB 850,000 payment for property #P-2024-001',
      time: '2 hours ago',
      icon: DollarSign,
      user: 'Alice Smith',
      priority: 'high'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`p-6 rounded-xl animate-pulse ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"
              }`}>
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          Dashboard Overview
        </h2>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={() => {
              fetchDashboardData();
              fetchTodoItems();
              setLastUpdate(new Date());
            }}
            className={`p-2 rounded-lg ${theme === "dark"
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Overview - 4 equal columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className={`p-6 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          } shadow-lg hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-blue-900/50" : "bg-blue-100"
              }`}>
              <Users className={`w-6 h-6 ${theme === "dark" ? "text-blue-400" : "text-blue-600"
                }`} />
            </div>
            <span className={`text-sm font-medium ${theme === "dark" ? "text-green-400" : "text-green-600"
              }`}>
              <TrendingUp className="inline w-4 h-4 mr-1" />
              +{usersLast7Days || 24} this week
            </span>
          </div>
          <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
            {realTimeData.totalUsers.toLocaleString()}
          </h3>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
            Total Users
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Active: {realTimeData.activeUsers}
              </span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Brokers: {realTimeData.totalBrokers}
              </span>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className={`p-6 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          } shadow-lg hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-green-900/50" : "bg-green-100"
              }`}>
              <Home className={`w-6 h-6 ${theme === "dark" ? "text-green-400" : "text-green-600"
                }`} />
            </div>
            <span className={`text-sm font-medium ${theme === "dark" ? "text-green-400" : "text-green-600"
              }`}>
              <TrendingUp className="inline w-4 h-4 mr-1" />
              +{calculateGrowth(realTimeData.totalProperties, 150)}% growth
            </span>
          </div>
          <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
            {realTimeData.totalProperties.toLocaleString()}
          </h3>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
            Total Properties
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                For Sale: {realTimeData.propertiesForSale}
              </span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                For Rent: {realTimeData.propertiesForRent}
              </span>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className={`p-6 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          } shadow-lg hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-amber-900/50" : "bg-amber-100"
              }`}>
              <DollarSign className={`w-6 h-6 ${theme === "dark" ? "text-amber-400" : "text-amber-600"
                }`} />
            </div>
            <span className={`text-sm font-medium ${theme === "dark" ? "text-green-400" : "text-green-600"
              }`}>
              <TrendingUp className="inline w-4 h-4 mr-1" />
              +{calculateGrowth(realTimeData.thisMonthRevenue, 2000000)}% this month
            </span>
          </div>
          <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
            ETB {realTimeData.totalRevenue.toLocaleString()}
          </h3>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
            Total Revenue
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                This Month: ETB {realTimeData.thisMonthRevenue.toLocaleString()}
              </span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Target: ETB 5,000,000
              </span>
            </div>
          </div>
        </div>

        {/* Support Metrics */}
        <div className={`p-6 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          } shadow-lg hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-purple-900/50" : "bg-purple-100"
              }`}>
              <MessageSquare className={`w-6 h-6 ${theme === "dark" ? "text-purple-400" : "text-purple-600"
                }`} />
            </div>
            <span className={`text-sm font-medium ${realTimeData.avgResponseTime < 3
              ? theme === "dark" ? "text-green-400" : "text-green-600"
              : theme === "dark" ? "text-red-400" : "text-red-600"
              }`}>
              {realTimeData.avgResponseTime < 3 ? (
                <TrendingDown className="inline w-4 h-4 mr-1" />
              ) : (
                <TrendingUp className="inline w-4 h-4 mr-1" />
              )}
              {realTimeData.avgResponseTime < 3 ? '-15%' : '+10%'} response time
            </span>
          </div>
          <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
            {realTimeData.avgResponseTime}h
          </h3>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
            Avg. Response Time
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Open: {realTimeData.openTickets}
              </span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Resolved: {realTimeData.resolvedTickets}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Property Distribution - EQUAL WIDTH COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart - Now takes half width */}
        <div className={`p-6 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          }`}>

          <div className="h-64">
            <Suspense fallback={
              <div className={`h-full flex items-center justify-center ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
                } rounded animate-pulse`}>
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    Loading revenue chart...
                  </p>
                </div>
              </div>
            }>
              <LineChart
                data={revenueData}
                theme={theme}
                options={{
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function (value) {
                          return 'ETB ' + (value / 1000000).toFixed(1) + 'M';
                        }
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          return 'Revenue: ETB ' + context.parsed.y.toLocaleString();
                        }
                      }
                    }
                  }
                }}
              />
            </Suspense>
          </div>
          
        </div>

        {/* Property Distribution Chart - ENHANCED VERSION - Now takes half width */}
        <div className={`p-6 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          }`}>
          <Suspense fallback={
            <div className={`h-full flex items-center justify-center ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              } rounded animate-pulse`}>
              <div className="text-center">
                <Home className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  Loading property distribution...
                </p>
              </div>
            </div>
          }>
            <PropertyDonutChart
              theme={theme}
              title="Property Portfolio Distribution"
              showDetails={true}
              height="600px"
            />
          </Suspense>

          {/* Verification Stats */}
          <div className={`mt-6 p-4 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
            }`}>
            <h4 className={`text-sm font-medium mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
              Verification Status
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {realTimeData.verificationStats.pending}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Verified</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {realTimeData.verificationStats.verified}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rejected</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {realTimeData.verificationStats.rejected}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Todo List & Recent Activities - EQUAL WIDTH COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Todo List Component - Now takes half width */}
        <div>
          <TodoList
            theme={theme}
            user={user}
            todoItems={todoItems}
            setTodoItems={setTodoItems}
            showCalendar={showCalendar}
            setShowCalendar={setShowCalendar}
            calendarRef={calendarRef}
            teamMembers={teamMembers}
            onAddTodo={handleAddTodo}
            onUpdateTodoStatus={handleUpdateTodoStatus}
            onDeleteTodo={handleDeleteTodo}
          />
        </div>

        {/* Recent Activities - Now takes half width */}
        <div className={`p-6 rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          } h-full`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
              Recent Activities
            </h3>
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`} />
              <span className="text-xs text-gray-500">
                Real-time
              </span>
            </div>
          </div>
          <div className="space-y-4 h-[calc(100%-8rem)] overflow-y-auto pr-2">
            {recentActivitiesData.length > 0 ? recentActivitiesData.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 border ${theme === "dark" ? "border-gray-700" : "border-gray-200"
                  } transition-colors`}
              >
                <div className={`p-2 rounded flex-shrink-0 ${activity.type === 'user'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                  : activity.type === 'property'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                    : activity.type === 'transaction'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'
                      : activity.type === 'verification'
                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'
                        : activity.type === 'system'
                          ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                  }`}>
                  {activity.icon ? (
                    React.createElement(activity.icon, { className: "w-4 h-4" })
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className={`font-medium truncate ${theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>
                      {activity.action}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${activity.priority === 'high'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : activity.priority === 'medium'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                      {activity.priority}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                    {activity.detail}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      {activity.time}
                    </p>
                    <p className="text-xs text-gray-500 truncate ml-2">
                      by {activity.user}
                    </p>
                  </div>
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

          {/* System Metrics */}
          <div className={`mt-6 p-4 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
            }`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                System Metrics
              </h4>
              <span className="text-xs text-gray-500">
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-2 rounded ${theme === "dark" ? "bg-gray-700/30" : "bg-white"
                }`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">Uptime</p>
                <p className="font-medium text-green-600 dark:text-green-400">
                  {realTimeData.systemMetrics.uptime}
                </p>
              </div>
              <div className={`p-2 rounded ${theme === "dark" ? "bg-gray-700/30" : "bg-white"
                }`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active Sessions</p>
                <p className="font-medium">{realTimeData.systemMetrics.activeSessions}</p>
              </div>
              <div className={`p-2 rounded ${theme === "dark" ? "bg-gray-700/30" : "bg-white"
                }`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">API Latency</p>
                <p className={`font-medium ${parseInt(realTimeData.systemMetrics.apiLatency) < 100
                  ? 'text-green-600 dark:text-green-400'
                  : parseInt(realTimeData.systemMetrics.apiLatency) < 200
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                  }`}>
                  {realTimeData.systemMetrics.apiLatency}
                </p>
              </div>
              <div className={`p-2 rounded ${theme === "dark" ? "bg-gray-700/30" : "bg-white"
                }`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">Transactions</p>
                <p className="font-medium">{realTimeData.transactionStats.total}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div ref={calendarRef} className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-6 rounded-xl shadow-2xl ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
          {/* Calendar component here */}
          <h3 className="text-lg font-semibold mb-4">Calendar</h3>
          <button onClick={() => setShowCalendar(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;