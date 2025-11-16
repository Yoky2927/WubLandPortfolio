// Mock data generator for demo purposes
// TODO: Remove this when real authentication is working

export const generateMockDashboardData = () => {
    return {
        title: "Dashboard Analytics",
        type: "dashboard",
        period: { startDate: null, endDate: null },
        overview: {
            totalUsers: 1523,
            totalProperties: 2847,
            totalTransactions: 3421,
            totalRevenue: 87500000 // 87.5 million ETB
        },
        topLocations: [
            { address: "Bole, Addis Ababa", count: 245, averagePrice: 3500000, salesCount: 180, rentalCount: 65 },
            { address: "Cazanchise, Addis Ababa", count: 198, averagePrice: 2800000, salesCount: 142, rentalCount: 56 },
            { address: "4 Kilo, Addis Ababa", count: 176, averagePrice: 3200000, salesCount: 128, rentalCount: 48 },
            { address: "Mexico, Addis Ababa", count: 154, averagePrice: 2400000, salesCount: 110, rentalCount: 44 },
            { address: "Piassa, Addis Ababa", count: 132, averagePrice: 2900000, salesCount: 95, rentalCount: 37 },
            { address: "Saris, Addis Ababa", count: 118, averagePrice: 2600000, salesCount: 85, rentalCount: 33 },
            { address: "Gerji, Addis Ababa", count: 105, averagePrice: 3100000, salesCount: 76, rentalCount: 29 },
            { address: "Summit, Addis Ababa", count: 98, averagePrice: 2700000, salesCount: 71, rentalCount: 27 },
            { address: "Ayat, Addis Ababa", count: 87, averagePrice: 3300000, salesCount: 63, rentalCount: 24 },
            { address: "CMC, Addis Ababa", count: 76, averagePrice: 2500000, salesCount: 55, rentalCount: 21 }
        ],
        marketTrends: {
            priceTrend: "increasing",
            demandTrend: "stable",
            priceHistory: [
                { month: "2024-01", averagePrice: 2850000, minPrice: 1200000, maxPrice: 8500000, propertyCount: 195 },
                { month: "2024-02", averagePrice: 2920000, minPrice: 1250000, maxPrice: 8800000, propertyCount: 203 },
                { month: "2024-03", averagePrice: 2980000, minPrice: 1300000, maxPrice: 9200000, propertyCount: 218 },
                { month: "2024-04", averagePrice: 3050000, minPrice: 1350000, maxPrice: 9500000, propertyCount: 234 },
                { month: "2024-05", averagePrice: 3120000, minPrice: 1400000, maxPrice: 9800000, propertyCount: 247 },
                { month: "2024-06", averagePrice: 3180000, minPrice: 1450000, maxPrice: 10000000, propertyCount: 256 },
                { month: "2024-07", averagePrice: 3250000, minPrice: 1500000, maxPrice: 10500000, propertyCount: 271 },
                { month: "2024-08", averagePrice: 3300000, minPrice: 1550000, maxPrice: 11000000, propertyCount: 284 },
                { month: "2024-09", averagePrice: 3350000, minPrice: 1600000, maxPrice: 11500000, propertyCount: 298 },
                { month: "2024-10", averagePrice: 3400000, minPrice: 1650000, maxPrice: 12000000, propertyCount: 312 },
                { month: "2024-11", averagePrice: 3450000, minPrice: 1700000, maxPrice: 12500000, propertyCount: 328 },
                { month: "2024-12", averagePrice: 3500000, minPrice: 1750000, maxPrice: 13000000, propertyCount: 342 }
            ],
            demandHistory: [
                { month: "2024-01", transactionCount: 268, completedRevenue: 24500000, purchaseCount: 142, rentalCount: 126 },
                { month: "2024-02", transactionCount: 275, completedRevenue: 25200000, purchaseCount: 148, rentalCount: 127 },
                { month: "2024-03", transactionCount: 289, completedRevenue: 26800000, purchaseCount: 155, rentalCount: 134 },
                { month: "2024-04", transactionCount: 301, completedRevenue: 28100000, purchaseCount: 162, rentalCount: 139 },
                { month: "2024-05", transactionCount: 312, completedRevenue: 29500000, purchaseCount: 168, rentalCount: 144 },
                { month: "2024-06", transactionCount: 324, completedRevenue: 30800000, purchaseCount: 175, rentalCount: 149 },
                { month: "2024-07", transactionCount: 338, completedRevenue: 32200000, purchaseCount: 183, rentalCount: 155 },
                { month: "2024-08", transactionCount: 351, completedRevenue: 33500000, purchaseCount: 190, rentalCount: 161 },
                { month: "2024-09", transactionCount: 364, completedRevenue: 34800000, purchaseCount: 197, rentalCount: 167 },
                { month: "2024-10", transactionCount: 378, completedRevenue: 36200000, purchaseCount: 205, rentalCount: 173 },
                { month: "2024-11", transactionCount: 391, completedRevenue: 37500000, purchaseCount: 212, rentalCount: 179 },
                { month: "2024-12", transactionCount: 405, completedRevenue: 38900000, purchaseCount: 220, rentalCount: 185 }
            ],
            topPropertyTypes: [
                { type: "sale", count: 1847, averagePrice: 3200000 },
                { type: "rent", count: 1000, averagePrice: 25000 }
            ]
        },
        brokerPerformance: [
            { brokerId: 1, email: "broker1@wubland.com", transactionCount: 145, totalRevenue: 12500000, completedCount: 138, successRate: "95.17%" },
            { brokerId: 2, email: "broker2@wubland.com", transactionCount: 132, totalRevenue: 11800000, completedCount: 126, successRate: "95.45%" },
            { brokerId: 3, email: "broker3@wubland.com", transactionCount: 128, totalRevenue: 11200000, completedCount: 122, successRate: "95.31%" },
            { brokerId: 4, email: "broker4@wubland.com", transactionCount: 119, totalRevenue: 10500000, completedCount: 114, successRate: "95.80%" },
            { brokerId: 5, email: "broker5@wubland.com", transactionCount: 108, totalRevenue: 9800000, completedCount: 103, successRate: "95.37%" },
            { brokerId: 6, email: "broker6@wubland.com", transactionCount: 97, totalRevenue: 8900000, completedCount: 93, successRate: "95.88%" },
            { brokerId: 7, email: "broker7@wubland.com", transactionCount: 86, totalRevenue: 8100000, completedCount: 82, successRate: "95.35%" },
            { brokerId: 8, email: "broker8@wubland.com", transactionCount: 75, totalRevenue: 7200000, completedCount: 72, successRate: "96.00%" },
            { brokerId: 9, email: "broker9@wubland.com", transactionCount: 64, totalRevenue: 6500000, completedCount: 61, successRate: "95.31%" },
            { brokerId: 10, email: "broker10@wubland.com", transactionCount: 53, totalRevenue: 5800000, completedCount: 51, successRate: "96.23%" }
        ],
        generatedAt: new Date().toISOString()
    };
};

export const generateMockSalesReport = () => {
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', 
                    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];
    
    return {
        title: "Sales Report",
        type: "sales",
        period: { startDate: null, endDate: null },
        summary: {
            total: 1847,
            completed: 1756,
            totalRevenue: 5624000000, // 5.6 billion ETB
            averagePrice: 3200000
        },
        monthlyBreakdown: months.map((month, idx) => ({
            month,
            count: Math.floor(Math.random() * 50) + 140 + idx * 3,
            revenue: Math.floor(Math.random() * 5000000) + 20000000 + idx * 2000000
        })),
        topLocations: [
            { address: "Bole, Addis Ababa", count: 180, revenue: 576000000 },
            { address: "4 Kilo, Addis Ababa", count: 128, revenue: 409600000 },
            { address: "Cazanchise, Addis Ababa", count: 142, revenue: 397600000 },
            { address: "Gerji, Addis Ababa", count: 76, revenue: 235600000 },
            { address: "Mexico, Addis Ababa", count: 110, revenue: 264000000 },
            { address: "Piassa, Addis Ababa", count: 95, revenue: 275500000 },
            { address: "Saris, Addis Ababa", count: 85, revenue: 221000000 },
            { address: "Summit, Addis Ababa", count: 71, revenue: 191700000 },
            { address: "Ayat, Addis Ababa", count: 63, revenue: 207900000 },
            { address: "CMC, Addis Ababa", count: 55, revenue: 137500000 }
        ],
        statusBreakdown: [
            { status: "completed", count: 1756, totalAmount: 5624000000 },
            { status: "pending", count: 68, totalAmount: 217600000 },
            { status: "failed", count: 23, totalAmount: 73600000 }
        ],
        generatedAt: new Date().toISOString()
    };
};

export const generateMockRentalReport = () => {
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', 
                    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];
    
    return {
        title: "Rental Report",
        type: "rental",
        period: { startDate: null, endDate: null },
        summary: {
            total: 1000,
            completed: 945,
            totalRevenue: 236250000, // 250,000 ETB average monthly rent
            averageRent: 25000
        },
        monthlyBreakdown: months.map((month, idx) => ({
            month,
            count: Math.floor(Math.random() * 20) + 75 + idx * 2,
            revenue: Math.floor(Math.random() * 500000) + 1800000 + idx * 150000
        })),
        topLocations: [
            { address: "Bole, Addis Ababa", count: 65, revenue: 16250000, averageRent: 25000 },
            { address: "Cazanchise, Addis Ababa", count: 56, revenue: 14000000, averageRent: 25000 },
            { address: "4 Kilo, Addis Ababa", count: 48, revenue: 12000000, averageRent: 25000 },
            { address: "Mexico, Addis Ababa", count: 44, revenue: 11000000, averageRent: 25000 },
            { address: "Piassa, Addis Ababa", count: 37, revenue: 9250000, averageRent: 25000 },
            { address: "Saris, Addis Ababa", count: 33, revenue: 8250000, averageRent: 25000 },
            { address: "Gerji, Addis Ababa", count: 29, revenue: 7250000, averageRent: 25000 },
            { address: "Summit, Addis Ababa", count: 27, revenue: 6750000, averageRent: 25000 },
            { address: "Ayat, Addis Ababa", count: 24, revenue: 6000000, averageRent: 25000 },
            { address: "CMC, Addis Ababa", count: 21, revenue: 5250000, averageRent: 25000 }
        ],
        propertyStatus: [
            { status: "approved", count: 800, averagePrice: 25000 },
            { status: "pending", count: 150, averagePrice: 24000 },
            { status: "rejected", count: 50, averagePrice: 22000 }
        ],
        generatedAt: new Date().toISOString()
    };
};

export const generateMockUserActivityReport = () => {
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', 
                    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];
    
    return {
        title: "User Activity Report",
        type: "user_activity",
        period: { startDate: null, endDate: null },
        statistics: {
            totalUsers: 1523,
            verifiedUsers: 1421,
            activeUsers: 1287,
            newUsers: 456,
            totalTransactions: 3421
        },
        roleBreakdown: {
            user: 1200,
            broker: 245,
            admin: 5,
            support_agent: 73
        },
        registrationTrends: months.map((month, idx) => ({
            month,
            newUsers: Math.floor(Math.random() * 15) + 30 + idx * 2
        })),
        topActiveUsers: [
            { userId: 1, email: "user1@example.com", role: "user", transactionCount: 12, totalSpent: 38400000 },
            { userId: 2, email: "user2@example.com", role: "user", transactionCount: 10, totalSpent: 32000000 },
            { userId: 3, email: "user3@example.com", role: "user", transactionCount: 9, totalSpent: 28800000 },
            { userId: 4, email: "user4@example.com", role: "user", transactionCount: 8, totalSpent: 25600000 },
            { userId: 5, email: "user5@example.com", role: "user", transactionCount: 7, totalSpent: 22400000 },
            { userId: 6, email: "broker1@wubland.com", role: "broker", transactionCount: 145, totalSpent: 0 },
            { userId: 7, email: "broker2@wubland.com", role: "broker", transactionCount: 132, totalSpent: 0 },
            { userId: 8, email: "user8@example.com", role: "user", transactionCount: 6, totalSpent: 19200000 },
            { userId: 9, email: "user9@example.com", role: "user", transactionCount: 5, totalSpent: 16000000 },
            { userId: 10, email: "user10@example.com", role: "user", transactionCount: 5, totalSpent: 16000000 }
        ],
        userActivity: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: `${Math.floor(Math.random() * 50) + 10} transactions`
        })),
        generatedAt: new Date().toISOString()
    };
};

// Set demo mode in localStorage
export const enableDemoMode = () => {
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('token', 'demo-token-12345');
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'admin', email: 'demo@admin.com' }));
};

export const disableDemoMode = () => {
    localStorage.removeItem('demoMode');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const isDemoMode = () => {
    return localStorage.getItem('demoMode') === 'true';
};

