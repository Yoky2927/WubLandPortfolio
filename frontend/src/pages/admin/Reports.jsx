import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import DemoModeBanner from '../../components/DemoModeBanner';
import { analysisAPI, downloadPDF } from '../../utils/api';
import { getUser } from '../../utils/api';
import { isDemoMode, generateMockSalesReport, generateMockRentalReport, generateMockUserActivityReport, enableDemoMode } from '../../utils/mockData';

const Reports = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [activeTab, setActiveTab] = useState('sales');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const user = getUser();

    useEffect(() => {
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
        
        // Auto-enable demo mode if accessing admin pages directly
        if (!isDemoMode()) {
            enableDemoMode();
        }
    }, [theme]);

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

    const loadReport = async (type) => {
        setLoading(true);
        setError(null);
        setReportData(null);

        // Use mock data if in demo mode
        if (isDemoMode()) {
            setTimeout(() => {
                let mockData;
                switch (type) {
                    case 'sales':
                        mockData = generateMockSalesReport();
                        break;
                    case 'rental':
                        mockData = generateMockRentalReport();
                        break;
                    case 'user-activity':
                        if (user?.role !== 'admin' && !isDemoMode()) {
                            setError('Access denied. Admin role required.');
                            setLoading(false);
                            return;
                        }
                        mockData = generateMockUserActivityReport();
                        break;
                    default:
                        setLoading(false);
                        return;
                }
                setReportData(mockData);
                setLoading(false);
            }, 500); // Simulate API delay
            return;
        }

        try {
            let response;
            switch (type) {
                case 'sales':
                    response = await analysisAPI.getSalesReport(
                        dateRange.startDate || undefined,
                        dateRange.endDate || undefined
                    );
                    break;
                case 'rental':
                    response = await analysisAPI.getRentalReport(
                        dateRange.startDate || undefined,
                        dateRange.endDate || undefined
                    );
                    break;
                case 'user-activity':
                    if (user?.role !== 'admin') {
                        setError('Access denied. Admin role required.');
                        return;
                    }
                    response = await analysisAPI.getUserActivityReport(
                        dateRange.startDate || undefined,
                        dateRange.endDate || undefined
                    );
                    break;
                default:
                    return;
            }

            if (response.data) {
                setReportData(response.data.data || response.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load report');
            console.error('Report error:', err);
            // Fallback to mock data on error for demo
            if (err.response?.status >= 500) {
                let mockData;
                switch (type) {
                    case 'sales':
                        mockData = generateMockSalesReport();
                        break;
                    case 'rental':
                        mockData = generateMockRentalReport();
                        break;
                    case 'user-activity':
                        mockData = generateMockUserActivityReport();
                        break;
                }
                if (mockData) {
                    setReportData(mockData);
                    setError(null);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport(activeTab);
    }, [activeTab, dateRange.startDate, dateRange.endDate]);

    const handleExportPDF = async () => {
        try {
            setLoading(true);
            let response;
            const filename = `${activeTab}-report-${Date.now()}.pdf`;

            switch (activeTab) {
                case 'sales':
                    response = await analysisAPI.getSalesReport(
                        dateRange.startDate || undefined,
                        dateRange.endDate || undefined,
                        'pdf'
                    );
                    break;
                case 'rental':
                    response = await analysisAPI.getRentalReport(
                        dateRange.startDate || undefined,
                        dateRange.endDate || undefined,
                        'pdf'
                    );
                    break;
                case 'user-activity':
                    response = await analysisAPI.getUserActivityReport(
                        dateRange.startDate || undefined,
                        dateRange.endDate || undefined,
                        'pdf'
                    );
                    break;
                default:
                    return;
            }

            downloadPDF(response.data, filename);
        } catch (err) {
            setError('Failed to export PDF');
            console.error('PDF export error:', err);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'sales', label: 'Sales Report', icon: '💰' },
        { id: 'rental', label: 'Rental Report', icon: '🏠' },
        ...(user?.role === 'admin' || isDemoMode() ? [{ id: 'user-activity', label: 'User Activity', icon: '👥' }] : []),
    ];

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
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className={`text-3xl font-bold mb-2 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                                Reports & Analytics
                            </h1>
                            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Generate and view detailed reports
                            </p>
                        </div>
                        {reportData && (
                            <button
                                onClick={handleExportPDF}
                                disabled={loading}
                                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                    theme === 'dark'
                                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                                        : 'bg-amber-500 text-white hover:bg-amber-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading ? 'Exporting...' : '📥 Export PDF'}
                            </button>
                        )}
                    </div>

                    {/* Date Range Filter */}
                    <div className={`mb-6 p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
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

                    {/* Tabs */}
                    <div className={`mb-6 flex space-x-2 border-b ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? theme === 'dark'
                                            ? 'border-amber-500 text-amber-400'
                                            : 'border-amber-600 text-amber-600'
                                        : theme === 'dark'
                                            ? 'border-transparent text-gray-400 hover:text-gray-300'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                            <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Loading report...
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

                    {/* Report Content */}
                    {!loading && !error && reportData && (
                        <div className={`p-6 rounded-lg ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <h2 className={`text-2xl font-bold mb-6 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                                {reportData.title || `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`}
                            </h2>

                            {/* Sales Report */}
                            {activeTab === 'sales' && reportData.summary && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <StatCard
                                            theme={theme}
                                            title="Total Properties"
                                            value={reportData.summary.total}
                                        />
                                        <StatCard
                                            theme={theme}
                                            title="Completed Transactions"
                                            value={reportData.summary.completed}
                                        />
                                        <StatCard
                                            theme={theme}
                                            title="Total Revenue"
                                            value={`${reportData.summary.totalRevenue?.toLocaleString()} ETB`}
                                        />
                                        <StatCard
                                            theme={theme}
                                            title="Average Price"
                                            value={`${reportData.summary.averagePrice?.toLocaleString()} ETB`}
                                        />
                                    </div>

                                    {reportData.monthlyBreakdown && reportData.monthlyBreakdown.length > 0 && (
                                        <Section theme={theme} title="Monthly Breakdown">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className={`border-b ${
                                                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                                    }`}>
                                                        <th className={`text-left py-2 px-4 font-medium ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>Month</th>
                                                        <th className={`text-left py-2 px-4 font-medium ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>Properties</th>
                                                        <th className={`text-left py-2 px-4 font-medium ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.monthlyBreakdown.map((item, index) => (
                                                        <tr key={index} className={`border-b ${
                                                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                                        }`}>
                                                            <td className={`py-2 px-4 ${
                                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                            }`}>{item.month}</td>
                                                            <td className={`py-2 px-4 ${
                                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                            }`}>{item.count}</td>
                                                            <td className={`py-2 px-4 ${
                                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                            }`}>{item.revenue?.toLocaleString()} ETB</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Section>
                                    )}

                                    {reportData.topLocations && reportData.topLocations.length > 0 && (
                                        <Section theme={theme} title="Top Locations">
                                            <div className="space-y-3">
                                                {reportData.topLocations.map((location, index) => (
                                                    <div
                                                        key={index}
                                                        className={`p-4 rounded-lg flex justify-between items-center ${
                                                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                                        }`}
                                                    >
                                                        <div>
                                                            <p className={`font-medium ${
                                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                            }`}>
                                                                {index + 1}. {location.address}
                                                            </p>
                                                            <p className={`text-sm ${
                                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                            }`}>
                                                                {location.count} properties
                                                            </p>
                                                        </div>
                                                        <p className={`font-bold ${
                                                            theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                                                        }`}>
                                                            {location.revenue?.toLocaleString()} ETB
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </Section>
                                    )}
                                </div>
                            )}

                            {/* Rental Report */}
                            {activeTab === 'rental' && reportData.summary && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <StatCard
                                            theme={theme}
                                            title="Total Rentals"
                                            value={reportData.summary.total}
                                        />
                                        <StatCard
                                            theme={theme}
                                            title="Completed Rentals"
                                            value={reportData.summary.completed}
                                        />
                                        <StatCard
                                            theme={theme}
                                            title="Total Revenue"
                                            value={`${reportData.summary.totalRevenue?.toLocaleString()} ETB`}
                                        />
                                        <StatCard
                                            theme={theme}
                                            title="Average Rent"
                                            value={`${reportData.summary.averageRent?.toLocaleString()} ETB`}
                                        />
                                    </div>

                                    {reportData.monthlyBreakdown && (
                                        <Section theme={theme} title="Monthly Breakdown">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className={`border-b ${
                                                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                                    }`}>
                                                        <th className={`text-left py-2 px-4 font-medium ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>Month</th>
                                                        <th className={`text-left py-2 px-4 font-medium ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>Rentals</th>
                                                        <th className={`text-left py-2 px-4 font-medium ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.monthlyBreakdown.map((item, index) => (
                                                        <tr key={index} className={`border-b ${
                                                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                                        }`}>
                                                            <td className={`py-2 px-4 ${
                                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                            }`}>{item.month}</td>
                                                            <td className={`py-2 px-4 ${
                                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                            }`}>{item.count}</td>
                                                            <td className={`py-2 px-4 ${
                                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                            }`}>{item.revenue?.toLocaleString()} ETB</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Section>
                                    )}
                                </div>
                            )}

                            {/* User Activity Report */}
                            {activeTab === 'user-activity' && reportData.statistics && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <StatCard
                                            theme={theme}
                                            title="Total Users"
                                            value={reportData.statistics.totalUsers}
                                        />
                                        <StatCard
                                            theme={theme}
                                            title="Active Users"
                                            value={reportData.statistics.activeUsers}
                                        />
                                        <StatCard
                                            theme={theme}
                                            title="New Users"
                                            value={reportData.statistics.newUsers}
                                        />
                                        <StatCard
                                            theme={theme}
                                            title="Total Transactions"
                                            value={reportData.statistics.totalTransactions}
                                        />
                                    </div>

                                    {reportData.roleBreakdown && (
                                        <Section theme={theme} title="Users by Role">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {Object.entries(reportData.roleBreakdown).map(([role, count]) => (
                                                    <div
                                                        key={role}
                                                        className={`p-4 rounded-lg ${
                                                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                                        }`}
                                                    >
                                                        <p className={`text-sm ${
                                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>
                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </p>
                                                        <p className={`text-2xl font-bold mt-1 ${
                                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                            {count}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </Section>
                                    )}

                                    {reportData.topActiveUsers && reportData.topActiveUsers.length > 0 && (
                                        <Section theme={theme} title="Top Active Users">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className={`border-b ${
                                                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                                    }`}>
                                                        <th className={`text-left py-2 px-4 font-medium ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>Email</th>
                                                        <th className={`text-left py-2 px-4 font-medium ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>Role</th>
                                                        <th className={`text-left py-2 px-4 font-medium ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>Transactions</th>
                                                        <th className={`text-left py-2 px-4 font-medium ${
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>Total Spent</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.topActiveUsers.map((user, index) => (
                                                        <tr key={index} className={`border-b ${
                                                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                                        }`}>
                                                            <td className={`py-2 px-4 ${
                                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                            }`}>{user.email}</td>
                                                            <td className={`py-2 px-4 ${
                                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                            }`}>{user.role}</td>
                                                            <td className={`py-2 px-4 ${
                                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                            }`}>{user.transactionCount}</td>
                                                            <td className={`py-2 px-4 ${
                                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                            }`}>{user.totalSpent?.toLocaleString()} ETB</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Section>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};

const StatCard = ({ theme, title, value }) => (
    <div className={`p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
    }`}>
        <p className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
            {title}
        </p>
        <p className={`text-2xl font-bold mt-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
            {value}
        </p>
    </div>
);

const Section = ({ title, children, theme }) => (
    <div>
        <h3 className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
            {title}
        </h3>
        {children}
    </div>
);

export default Reports;

