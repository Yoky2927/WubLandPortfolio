const { pool } = require('../../shared/db');
const Report = require('../models/Report');
const { generatePDF } = require('../utils/pdfGenerator');

/**
 * Get Sales Report
 * Generates comprehensive sales data including revenue, transactions, and trends
 */
exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, format } = req.query;
        
        // Build date filter
        let dateFilter = '';
        const params = [];
        if (startDate && endDate) {
            dateFilter = 'WHERE t.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        // Get total sales statistics
        const [salesStats] = await pool.execute(
            `SELECT 
                COUNT(*) as totalProperties,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completedTransactions,
                SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as totalRevenue,
                AVG(CASE WHEN t.status = 'completed' THEN t.amount ELSE NULL END) as averagePrice
            FROM transactions t
            INNER JOIN properties p ON t.property_id = p.id
            WHERE t.type = 'purchase' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}`,
            params
        );

        // Get monthly breakdown
        const [monthlyBreakdown] = await pool.execute(
            `SELECT 
                DATE_FORMAT(t.created_at, '%Y-%m') as month,
                COUNT(*) as count,
                SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as revenue
            FROM transactions t
            INNER JOIN properties p ON t.property_id = p.id
            WHERE t.type = 'purchase' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
            GROUP BY DATE_FORMAT(t.created_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12`,
            params
        );

        // Get top locations by sales
        const [topLocations] = await pool.execute(
            `SELECT 
                p.address,
                COUNT(*) as count,
                SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as revenue
            FROM transactions t
            INNER JOIN properties p ON t.property_id = p.id
            WHERE t.type = 'purchase' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
            GROUP BY p.address
            ORDER BY count DESC
            LIMIT 10`,
            params
        );

        // Get sales by status
        const [statusBreakdown] = await pool.execute(
            `SELECT 
                t.status,
                COUNT(*) as count,
                SUM(t.amount) as totalAmount
            FROM transactions t
            WHERE t.type = 'purchase' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
            GROUP BY t.status`,
            params
        );

        const reportData = {
            title: 'Sales Report',
            type: 'sales',
            period: { startDate, endDate },
            summary: {
                total: salesStats[0]?.totalProperties || 0,
                completed: salesStats[0]?.completedTransactions || 0,
                totalRevenue: salesStats[0]?.totalRevenue || 0,
                averagePrice: salesStats[0]?.averagePrice || 0
            },
            monthlyBreakdown: monthlyBreakdown.map(row => ({
                month: row.month,
                count: row.count,
                revenue: parseFloat(row.revenue || 0)
            })),
            topLocations: topLocations.map(row => ({
                address: row.address,
                count: row.count,
                revenue: parseFloat(row.revenue || 0)
            })),
            statusBreakdown: statusBreakdown.map(row => ({
                status: row.status,
                count: row.count,
                totalAmount: parseFloat(row.totalAmount || 0)
            })),
            generatedAt: new Date().toISOString()
        };

        // Save report to database
        const reportId = await Report.create({
            type: 'sales_rent',
            data: reportData
        });

        // If PDF format requested
        if (format === 'pdf') {
            const pdfBuffer = await generatePDF(reportData, 'sales');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=sales-report-${Date.now()}.pdf`);
            return res.send(pdfBuffer);
        }

        res.json({
            success: true,
            reportId,
            data: reportData
        });

    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ error: 'Failed to generate sales report', details: error.message });
    }
};

/**
 * Get Rental Report
 * Generates rental statistics and trends
 */
exports.getRentalReport = async (req, res) => {
    try {
        const { startDate, endDate, format } = req.query;
        
        let dateFilter = '';
        const params = [];
        if (startDate && endDate) {
            dateFilter = 'WHERE t.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        // Get rental statistics
        const [rentalStats] = await pool.execute(
            `SELECT 
                COUNT(*) as totalRentals,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completedRentals,
                SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as totalRevenue,
                AVG(CASE WHEN t.status = 'completed' THEN t.amount ELSE NULL END) as averageRent
            FROM transactions t
            INNER JOIN properties p ON t.property_id = p.id
            WHERE t.type = 'rent' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}`,
            params
        );

        // Get monthly breakdown
        const [monthlyBreakdown] = await pool.execute(
            `SELECT 
                DATE_FORMAT(t.created_at, '%Y-%m') as month,
                COUNT(*) as count,
                SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as revenue
            FROM transactions t
            INNER JOIN properties p ON t.property_id = p.id
            WHERE t.type = 'rent' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
            GROUP BY DATE_FORMAT(t.created_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12`,
            params
        );

        // Get top rental locations
        const [topLocations] = await pool.execute(
            `SELECT 
                p.address,
                COUNT(*) as count,
                SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as revenue,
                AVG(CASE WHEN t.status = 'completed' THEN t.amount ELSE NULL END) as averageRent
            FROM transactions t
            INNER JOIN properties p ON t.property_id = p.id
            WHERE t.type = 'rent' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
            GROUP BY p.address
            ORDER BY count DESC
            LIMIT 10`,
            params
        );

        // Get rental properties by status
        const [propertyStatus] = await pool.execute(
            `SELECT 
                p.status,
                COUNT(*) as count,
                AVG(p.price) as averagePrice
            FROM properties p
            WHERE p.type = 'rent' ${dateFilter ? 'AND p.created_at BETWEEN ? AND ?' : ''}
            GROUP BY p.status`,
            dateFilter ? [startDate, endDate] : []
        );

        const reportData = {
            title: 'Rental Report',
            type: 'rental',
            period: { startDate, endDate },
            summary: {
                total: rentalStats[0]?.totalRentals || 0,
                completed: rentalStats[0]?.completedRentals || 0,
                totalRevenue: rentalStats[0]?.totalRevenue || 0,
                averageRent: rentalStats[0]?.averageRent || 0
            },
            monthlyBreakdown: monthlyBreakdown.map(row => ({
                month: row.month,
                count: row.count,
                revenue: parseFloat(row.revenue || 0)
            })),
            topLocations: topLocations.map(row => ({
                address: row.address,
                count: row.count,
                revenue: parseFloat(row.revenue || 0),
                averageRent: parseFloat(row.averageRent || 0)
            })),
            propertyStatus: propertyStatus.map(row => ({
                status: row.status,
                count: row.count,
                averagePrice: parseFloat(row.averagePrice || 0)
            })),
            generatedAt: new Date().toISOString()
        };

        const reportId = await Report.create({
            type: 'sales_rent',
            data: reportData
        });

        if (format === 'pdf') {
            const pdfBuffer = await generatePDF(reportData, 'rental');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=rental-report-${Date.now()}.pdf`);
            return res.send(pdfBuffer);
        }

        res.json({
            success: true,
            reportId,
            data: reportData
        });

    } catch (error) {
        console.error('Error generating rental report:', error);
        res.status(500).json({ error: 'Failed to generate rental report', details: error.message });
    }
};

/**
 * Get User Activity Report
 * Analyzes user behavior and activity patterns
 */
exports.getUserActivityReport = async (req, res) => {
    try {
        const { startDate, endDate, format } = req.query;
        
        let dateFilter = '';
        const params = [];
        if (startDate && endDate) {
            dateFilter = 'WHERE created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        // Get user statistics
        const [userStats] = await pool.execute(
            `SELECT 
                COUNT(*) as totalUsers,
                COUNT(CASE WHEN verified = 1 THEN 1 END) as verifiedUsers,
                COUNT(CASE WHEN role = 'user' THEN 1 END) as regularUsers,
                COUNT(CASE WHEN role = 'broker' THEN 1 END) as brokers,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
            FROM users ${dateFilter}`,
            params
        );

        // Get users by role
        const [roleBreakdown] = await pool.execute(
            `SELECT role, COUNT(*) as count
            FROM users ${dateFilter}
            GROUP BY role`,
            params
        );

        // Get user registration trends
        const [registrationTrends] = await pool.execute(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as newUsers
            FROM users ${dateFilter}
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12`,
            params
        );

        // Get active users (users with transactions)
        const [activeUsers] = await pool.execute(
            `SELECT COUNT(DISTINCT user_id) as activeUsers
            FROM transactions
            ${dateFilter ? `WHERE created_at BETWEEN ? AND ?` : ''}`,
            dateFilter ? [startDate, endDate] : []
        );

        // Get transaction activity by users
        const [userTransactionActivity] = await pool.execute(
            `SELECT 
                u.id,
                u.email,
                u.role,
                COUNT(t.id) as transactionCount,
                SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as totalSpent
            FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id
            ${dateFilter ? `WHERE (t.created_at BETWEEN ? AND ? OR t.id IS NULL)` : ''}
            GROUP BY u.id, u.email, u.role
            ORDER BY transactionCount DESC
            LIMIT 20`,
            dateFilter ? [startDate, endDate] : []
        );

        // Get recent activity timeline
        const [recentActivity] = await pool.execute(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as transactionCount
            FROM transactions
            ${dateFilter ? `WHERE created_at BETWEEN ? AND ?` : ''}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30`,
            dateFilter ? [startDate, endDate] : []
        );

        const reportData = {
            title: 'User Activity Report',
            type: 'user_activity',
            period: { startDate, endDate },
            statistics: {
                totalUsers: userStats[0]?.totalUsers || 0,
                verifiedUsers: userStats[0]?.verifiedUsers || 0,
                activeUsers: activeUsers[0]?.activeUsers || 0,
                newUsers: registrationTrends.reduce((sum, row) => sum + (parseInt(row.newUsers) || 0), 0),
                totalTransactions: userTransactionActivity.reduce((sum, row) => sum + (parseInt(row.transactionCount) || 0), 0)
            },
            roleBreakdown: roleBreakdown.reduce((acc, row) => {
                acc[row.role] = row.count;
                return acc;
            }, {}),
            registrationTrends: registrationTrends.map(row => ({
                month: row.month,
                newUsers: parseInt(row.newUsers || 0)
            })),
            topActiveUsers: userTransactionActivity.map(row => ({
                userId: row.id,
                email: row.email,
                role: row.role,
                transactionCount: parseInt(row.transactionCount || 0),
                totalSpent: parseFloat(row.totalSpent || 0)
            })),
            userActivity: recentActivity.map(row => ({
                date: row.date,
                description: `${row.transactionCount} transactions`
            })),
            generatedAt: new Date().toISOString()
        };

        const reportId = await Report.create({
            type: 'payment_tracking',
            data: reportData
        });

        if (format === 'pdf') {
            const pdfBuffer = await generatePDF(reportData, 'user_activity');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=user-activity-report-${Date.now()}.pdf`);
            return res.send(pdfBuffer);
        }

        res.json({
            success: true,
            reportId,
            data: reportData
        });

    } catch (error) {
        console.error('Error generating user activity report:', error);
        res.status(500).json({ error: 'Failed to generate user activity report', details: error.message });
    }
};

/**
 * Get Dashboard Analytics
 * Comprehensive dashboard with insights, trends, and top locations
 */
exports.getDashboard = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = '';
        const params = [];
        if (startDate && endDate) {
            dateFilter = 'WHERE created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        // Get overview statistics
        let overviewQuery = `SELECT 
                (SELECT COUNT(*) FROM users ${dateFilter}) as totalUsers,
                (SELECT COUNT(*) FROM properties ${dateFilter}) as totalProperties,
                (SELECT COUNT(*) FROM transactions ${dateFilter}) as totalTransactions,
                (SELECT SUM(amount) FROM transactions WHERE status = 'completed'`;
        
        let overviewParams = [...params];
        if (dateFilter) {
            overviewQuery += ` AND created_at BETWEEN ? AND ?`;
            overviewParams.push(startDate, endDate);
        }
        overviewQuery += `) as totalRevenue`;
        
        const [overview] = await pool.execute(overviewQuery, overviewParams);

        // Get top locations by property count
        const [topLocations] = await pool.execute(
            `SELECT 
                address,
                COUNT(*) as count,
                AVG(price) as averagePrice,
                SUM(CASE WHEN type = 'sale' THEN 1 ELSE 0 END) as salesCount,
                SUM(CASE WHEN type = 'rent' THEN 1 ELSE 0 END) as rentalCount
            FROM properties
            ${dateFilter}
            GROUP BY address
            ORDER BY count DESC
            LIMIT 10`,
            params
        );

        // Get market trends - price analysis
        const [priceTrends] = await pool.execute(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                AVG(price) as averagePrice,
                MIN(price) as minPrice,
                MAX(price) as maxPrice,
                COUNT(*) as propertyCount
            FROM properties
            ${dateFilter}
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12`,
            params
        );

        // Get demand analysis - transaction trends
        const [demandTrends] = await pool.execute(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as transactionCount,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completedRevenue,
                SUM(CASE WHEN type = 'purchase' THEN 1 ELSE 0 END) as purchaseCount,
                SUM(CASE WHEN type = 'rent' THEN 1 ELSE 0 END) as rentalCount
            FROM transactions
            ${dateFilter}
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12`,
            params
        );

        // Get property type distribution
        const [propertyTypes] = await pool.execute(
            `SELECT 
                type,
                COUNT(*) as count,
                AVG(price) as averagePrice
            FROM properties
            ${dateFilter}
            GROUP BY type`,
            params
        );

        // Get top brokers by performance
        const [brokerPerformance] = await pool.execute(
            `SELECT 
                u.id,
                u.email,
                COUNT(t.id) as transactionCount,
                SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as totalRevenue,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completedCount
            FROM users u
            INNER JOIN transactions t ON u.id = t.broker_id
            ${dateFilter ? `WHERE t.created_at BETWEEN ? AND ?` : ''}
            GROUP BY u.id, u.email
            ORDER BY completedCount DESC, totalRevenue DESC
            LIMIT 10`,
            dateFilter ? [startDate, endDate] : []
        );

        // Calculate price trend direction
        let priceTrend = 'stable';
        if (priceTrends.length >= 2) {
            const recent = parseFloat(priceTrends[0].averagePrice);
            const previous = parseFloat(priceTrends[1].averagePrice);
            if (recent > previous * 1.05) priceTrend = 'increasing';
            else if (recent < previous * 0.95) priceTrend = 'decreasing';
        }

        // Calculate demand trend
        let demandTrend = 'stable';
        if (demandTrends.length >= 2) {
            const recent = demandTrends[0].transactionCount;
            const previous = demandTrends[1].transactionCount;
            if (recent > previous * 1.1) demandTrend = 'increasing';
            else if (recent < previous * 0.9) demandTrend = 'decreasing';
        }

        const reportData = {
            title: 'Dashboard Analytics',
            type: 'dashboard',
            period: { startDate, endDate },
            overview: {
                totalUsers: overview[0]?.totalUsers || 0,
                totalProperties: overview[0]?.totalProperties || 0,
                totalTransactions: overview[0]?.totalTransactions || 0,
                totalRevenue: parseFloat(overview[0]?.totalRevenue || 0)
            },
            topLocations: topLocations.map(row => ({
                address: row.address,
                count: row.count,
                averagePrice: parseFloat(row.averagePrice || 0),
                salesCount: row.salesCount,
                rentalCount: row.rentalCount
            })),
            marketTrends: {
                priceTrend,
                demandTrend,
                priceHistory: priceTrends.map(row => ({
                    month: row.month,
                    averagePrice: parseFloat(row.averagePrice || 0),
                    minPrice: parseFloat(row.minPrice || 0),
                    maxPrice: parseFloat(row.maxPrice || 0),
                    propertyCount: row.propertyCount
                })),
                demandHistory: demandTrends.map(row => ({
                    month: row.month,
                    transactionCount: row.transactionCount,
                    completedRevenue: parseFloat(row.completedRevenue || 0),
                    purchaseCount: row.purchaseCount,
                    rentalCount: row.rentalCount
                })),
                topPropertyTypes: propertyTypes.map(row => ({
                    type: row.type,
                    count: row.count,
                    averagePrice: parseFloat(row.averagePrice || 0)
                }))
            },
            brokerPerformance: brokerPerformance.map(row => ({
                brokerId: row.id,
                email: row.email,
                transactionCount: row.transactionCount,
                totalRevenue: parseFloat(row.totalRevenue || 0),
                completedCount: row.completedCount,
                successRate: row.transactionCount > 0 
                    ? ((row.completedCount / row.transactionCount) * 100).toFixed(2) + '%'
                    : '0%'
            })),
            generatedAt: new Date().toISOString()
        };

        const reportId = await Report.create({
            type: 'broker_performance',
            data: reportData
        });

        res.json({
            success: true,
            reportId,
            data: reportData
        });

    } catch (error) {
        console.error('Error generating dashboard:', error);
        res.status(500).json({ error: 'Failed to generate dashboard', details: error.message });
    }
};

/**
 * Get specific report by ID
 */
exports.getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const { format } = req.query;
        
        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        if (format === 'pdf') {
            const pdfBuffer = await generatePDF(report.data, report.type);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=report-${id}.pdf`);
            return res.send(pdfBuffer);
        }

        res.json({
            success: true,
            report
        });

    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Failed to fetch report', details: error.message });
    }
};

/**
 * Get all saved reports
 */
exports.getAllReports = async (req, res) => {
    try {
        const { type, limit = 50, offset = 0 } = req.query;
        
        let reports;
        if (type) {
            reports = await Report.findByType(type);
        } else {
            reports = await Report.findAll(parseInt(limit), parseInt(offset));
        }

        res.json({
            success: true,
            count: reports.length,
            reports
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
    }
};

/**
 * Delete a report
 */
exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deleted = await Report.delete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json({
            success: true,
            message: 'Report deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ error: 'Failed to delete report', details: error.message });
    }
};

