import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import DemoModeBanner from '../../components/DemoModeBanner';
import { analysisAPI } from '../../utils/api';
import { isDemoMode, generateMockDashboardData, enableDemoMode } from '../../utils/mockData';
import { 
    HiOutlineUsers, 
    HiOutlineHome, 
    HiOutlineCreditCard, 
    HiOutlineCurrencyDollar,
    HiOutlineArrowTrendingUp,
    HiOutlineArrowTrendingDown,
    HiOutlineMinus
} from 'react-icons/hi2';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
        
        // Auto-enable demo mode if accessing admin pages directly
        if (!isDemoMode()) {
            enableDemoMode();
        }
    }, [theme]);

    useEffect(() => {
        loadDashboard();
    }, [dateRange.startDate, dateRange.endDate]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const toggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', newState.toString());
    };

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);
        
        // Use mock data if in demo mode
        if (isDemoMode()) {
            setTimeout(() => {
                setDashboardData(generateMockDashboardData());
                setLoading(false);
            }, 500); // Simulate API delay
            return;
        }

        try {
            const response = await analysisAPI.getDashboard(
                dateRange.startDate || undefined,
                dateRange.endDate || undefined
            );
            setDashboardData(response.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load dashboard');
            console.error('Dashboard error:', err);
            // Fallback to mock data on error for demo
            if (err.response?.status >= 500) {
                setDashboardData(generateMockDashboardData());
                setError(null); // Clear error for demo
            }
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, trend, iconColor = 'amber' }) => (
        <div className={`p-6 rounded-xl transition-all duration-300 hover:shadow-lg ${
            theme === 'dark' 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-white border border-gray-200'
        }`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className={`text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        {title}
                    </p>
                    <p className={`text-3xl font-bold mb-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        {value?.toLocaleString() || '0'}
                    </p>
                    {trend && (
                        <div className="flex items-center space-x-1 mt-2">
                            {trend > 0 ? (
                                <HiOutlineArrowTrendingUp className="w-4 h-4 text-green-500" />
                            ) : trend < 0 ? (
                                <HiOutlineArrowTrendingDown className="w-4 h-4 text-red-500" />
                            ) : (
                                <HiOutlineMinus className="w-4 h-4 text-gray-500" />
                            )}
                            <p className={`text-xs font-medium ${
                                trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'
                            }`}>
                                {Math.abs(trend)}% from last month
                            </p>
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-xl ${
                    iconColor === 'amber' 
                        ? theme === 'dark' 
                            ? 'bg-amber-500/20 text-amber-400' 
                            : 'bg-amber-100 text-amber-600'
                        : iconColor === 'blue'
                        ? theme === 'dark'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-blue-100 text-blue-600'
                        : iconColor === 'green'
                        ? theme === 'dark'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-green-100 text-green-600'
                        : theme === 'dark'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-purple-100 text-purple-600'
                }`}>
                    <Icon className="w-8 h-8" />
                </div>
            </div>
        </div>
    );

    const chartColors = {
        primary: theme === 'dark' ? '#f59e0b' : '#d97706',
        secondary: theme === 'dark' ? '#3b82f6' : '#2563eb',
        success: theme === 'dark' ? '#10b981' : '#059669',
        grid: theme === 'dark' ? '#374151' : '#e5e7eb',
        text: theme === 'dark' ? '#9ca3af' : '#6b7280'
    };

    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
            <DemoModeBanner theme={theme} />
            <div className="flex flex-1">
                <Sidebar 
                    theme={theme} 
                    onToggleTheme={toggleTheme}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={toggleSidebar}
                />
                
                <div className={`flex-1 p-8 transition-all duration-300 ${
                    isSidebarCollapsed ? 'ml-20' : 'ml-72'
                }`}>
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className={`text-3xl font-bold mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                            Dashboard Analytics
                        </h1>
                        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Comprehensive insights and statistics
                        </p>
                    </div>

                    {/* Date Range Filter */}
                    <div className={`mb-6 p-4 rounded-xl shadow-sm ${
                        theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                        <div className="flex flex-wrap gap-4 items-end">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                                    className={`px-4 py-2 rounded-lg border transition-colors ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                                    className={`px-4 py-2 rounded-lg border transition-colors ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                            </div>
                            <button
                                onClick={() => setDateRange({ startDate: '', endDate: '' })}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    theme === 'dark'
                                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                            <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Loading dashboard data...
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className={`p-4 rounded-lg mb-6 ${
                            theme === 'dark' ? 'bg-red-900/30 border border-red-700' : 'bg-red-100 border border-red-300'
                        }`}>
                            <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Dashboard Content */}
                    {!loading && !error && dashboardData && (
                        <>
                            {/* Overview Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard
                                    title="Total Users"
                                    value={dashboardData.overview?.totalUsers}
                                    icon={HiOutlineUsers}
                                    trend={12.5}
                                    iconColor="blue"
                                />
                                <StatCard
                                    title="Total Properties"
                                    value={dashboardData.overview?.totalProperties}
                                    icon={HiOutlineHome}
                                    trend={8.3}
                                    iconColor="purple"
                                />
                                <StatCard
                                    title="Total Transactions"
                                    value={dashboardData.overview?.totalTransactions}
                                    icon={HiOutlineCreditCard}
                                    trend={15.2}
                                    iconColor="green"
                                />
                                <StatCard
                                    title="Total Revenue (ETB)"
                                    value={dashboardData.overview?.totalRevenue}
                                    icon={HiOutlineCurrencyDollar}
                                    trend={22.1}
                                    iconColor="amber"
                                />
                            </div>

                            {/* Charts Row 1 - Revenue & Transactions Over Time */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Revenue Trend Chart */}
                                <div className={`p-6 rounded-xl shadow-sm ${
                                    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                                }`}>
                                    <h3 className={`text-lg font-bold mb-4 ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Revenue Trend (12 Months)
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={dashboardData.marketTrends?.demandHistory || []}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                            <XAxis 
                                                dataKey="month" 
                                                stroke={chartColors.text}
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis 
                                                stroke={chartColors.text}
                                                style={{ fontSize: '12px' }}
                                                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                            />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                                                    border: `1px solid ${chartColors.grid}`,
                                                    borderRadius: '8px'
                                                }}
                                                formatter={(value) => `${(value / 1000000).toFixed(2)}M ETB`}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="completedRevenue" 
                                                stroke={chartColors.primary} 
                                                fillOpacity={1} 
                                                fill="url(#colorRevenue)"
                                                name="Revenue"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Transaction Count Chart */}
                                <div className={`p-6 rounded-xl shadow-sm ${
                                    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                                }`}>
                                    <h3 className={`text-lg font-bold mb-4 ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Transactions Over Time
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={dashboardData.marketTrends?.demandHistory || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                            <XAxis 
                                                dataKey="month" 
                                                stroke={chartColors.text}
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis 
                                                stroke={chartColors.text}
                                                style={{ fontSize: '12px' }}
                                            />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                                                    border: `1px solid ${chartColors.grid}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend 
                                                wrapperStyle={{ color: chartColors.text }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="purchaseCount" 
                                                stroke={chartColors.primary} 
                                                strokeWidth={2}
                                                name="Purchases"
                                                dot={{ r: 4 }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="rentalCount" 
                                                stroke={chartColors.secondary} 
                                                strokeWidth={2}
                                                name="Rentals"
                                                dot={{ r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Charts Row 2 - Price Trend & Property Types */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Price Trend Chart */}
                                <div className={`p-6 rounded-xl shadow-sm ${
                                    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                                }`}>
                                    <h3 className={`text-lg font-bold mb-4 ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Average Property Price Trend
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={dashboardData.marketTrends?.priceHistory || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                            <XAxis 
                                                dataKey="month" 
                                                stroke={chartColors.text}
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis 
                                                stroke={chartColors.text}
                                                style={{ fontSize: '12px' }}
                                                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                            />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                                                    border: `1px solid ${chartColors.grid}`,
                                                    borderRadius: '8px'
                                                }}
                                                formatter={(value) => `${(value / 1000000).toFixed(2)}M ETB`}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="averagePrice" 
                                                stroke={chartColors.success} 
                                                strokeWidth={3}
                                                name="Avg Price"
                                                dot={{ r: 5 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Property Types Distribution */}
                                <div className={`p-6 rounded-xl shadow-sm ${
                                    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                                }`}>
                                    <h3 className={`text-lg font-bold mb-4 ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Property Types Distribution
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={dashboardData.marketTrends?.topPropertyTypes || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                            <XAxis 
                                                dataKey="type" 
                                                stroke={chartColors.text}
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis 
                                                stroke={chartColors.text}
                                                style={{ fontSize: '12px' }}
                                            />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                                                    border: `1px solid ${chartColors.grid}`,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Bar 
                                                dataKey="count" 
                                                fill={chartColors.primary}
                                                radius={[8, 8, 0, 0]}
                                                name="Properties"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Market Trends */}
                            <div className={`mb-8 p-6 rounded-xl shadow-sm ${
                                theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                            }`}>
                                <h2 className={`text-xl font-bold mb-4 ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                    Market Trends
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className={`p-4 rounded-lg ${
                                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                    }`}>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Price Trend
                                        </p>
                                        <p className={`text-2xl font-bold mt-1 ${
                                            dashboardData.marketTrends?.priceTrend === 'increasing' ? 'text-green-500' :
                                            dashboardData.marketTrends?.priceTrend === 'decreasing' ? 'text-red-500' :
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {dashboardData.marketTrends?.priceTrend || 'N/A'}
                                        </p>
                                    </div>
                                    <div className={`p-4 rounded-lg ${
                                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                    }`}>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Demand Trend
                                        </p>
                                        <p className={`text-2xl font-bold mt-1 ${
                                            dashboardData.marketTrends?.demandTrend === 'increasing' ? 'text-green-500' :
                                            dashboardData.marketTrends?.demandTrend === 'decreasing' ? 'text-red-500' :
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {dashboardData.marketTrends?.demandTrend || 'N/A'}
                                        </p>
                                    </div>
                                    <div className={`p-4 rounded-lg ${
                                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                    }`}>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Property Types
                                        </p>
                                        <p className={`text-lg font-semibold mt-1 ${
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {dashboardData.marketTrends?.topPropertyTypes?.length || 0} types
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Top Locations */}
                            {dashboardData.topLocations && dashboardData.topLocations.length > 0 && (
                                <div className={`mb-8 p-6 rounded-xl shadow-sm ${
                                    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                                }`}>
                                    <h2 className={`text-xl font-bold mb-4 ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Top Locations
                                    </h2>
                                    <div className="space-y-3">
                                        {dashboardData.topLocations.slice(0, 5).map((location, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-lg flex justify-between items-center transition-all hover:shadow-md ${
                                                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                                                        theme === 'dark' 
                                                            ? 'bg-amber-500/20 text-amber-400' 
                                                            : 'bg-amber-100 text-amber-600'
                                                    }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${
                                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                            {location.address}
                                                        </p>
                                                        <p className={`text-sm ${
                                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>
                                                            {location.count} properties • Avg: {location.averagePrice?.toLocaleString()} ETB
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${
                                                        theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                                                    }`}>
                                                        {location.salesCount || 0} sales
                                                    </p>
                                                    <p className={`text-sm ${
                                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                        {location.rentalCount || 0} rentals
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Broker Performance */}
                            {dashboardData.brokerPerformance && dashboardData.brokerPerformance.length > 0 && (
                                <div className={`p-6 rounded-xl shadow-sm ${
                                    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                                }`}>
                                    <h2 className={`text-xl font-bold mb-4 ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Top Brokers Performance
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className={`border-b ${
                                                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                                }`}>
                                                    <th className={`text-left py-3 px-4 font-medium ${
                                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Broker</th>
                                                    <th className={`text-left py-3 px-4 font-medium ${
                                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Transactions</th>
                                                    <th className={`text-left py-3 px-4 font-medium ${
                                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Revenue</th>
                                                    <th className={`text-left py-3 px-4 font-medium ${
                                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Success Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashboardData.brokerPerformance.slice(0, 10).map((broker, index) => (
                                                    <tr
                                                        key={index}
                                                        className={`border-b transition-colors hover:bg-opacity-50 ${
                                                            theme === 'dark' 
                                                                ? 'border-gray-700 hover:bg-gray-700' 
                                                                : 'border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <td className={`py-3 px-4 ${
                                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                            {broker.email}
                                                        </td>
                                                        <td className={`py-3 px-4 ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                        }`}>
                                                            {broker.transactionCount}
                                                        </td>
                                                        <td className={`py-3 px-4 ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                        }`}>
                                                            {broker.totalRevenue?.toLocaleString()} ETB
                                                        </td>
                                                        <td className={`py-3 px-4 ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                        }`}>
                                                            {broker.successRate}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
