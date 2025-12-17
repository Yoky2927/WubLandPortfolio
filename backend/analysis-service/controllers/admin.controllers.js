// controllers/admin.controllers.js
import { fetchServiceData } from '../services/index.js';

// Admin dashboard analytics
export const getAdminAnalytics = async (req, res) => {
  try {
    const { timeframe = 'monthly' } = req.query;
    
    console.log(`👑 Admin analytics requested, timeframe: ${timeframe}`);

    const { users, properties, transactions, todos } = await Promise.all([
      fetchServiceData("USER", "/api/users"),
      fetchServiceData("PROPERTY", "/api/properties"),
      fetchServiceData("TRANSACTION", "/api/transactions"),
      fetchServiceData("TODO", "/api/todos")
    ]);
    
    // User distribution by role
    const userDistribution = {};
    users.forEach(user => {
      const role = user.role || 'user';
      userDistribution[role] = (userDistribution[role] || 0) + 1;
    });
    
    // Property distribution
    const propertyDistribution = {};
    properties.forEach(property => {
      const type = property.property_type || 'unknown';
      propertyDistribution[type] = (propertyDistribution[type] || 0) + 1;
    });
    
    // Revenue calculations
    const revenueData = transactions
      .filter(t => t.status === 'completed' || t.status === 'closed')
      .map(t => ({
        amount: parseFloat(t.final_price) || parseFloat(t.offer_price) || 0,
        date: t.created_at || t.updated_at,
        type: t.transaction_type
      }));
    
    const totalRevenue = revenueData.reduce((sum, r) => sum + r.amount, 0);
    
    // Recent activities
    const recentActivities = [
      ...users.slice(-5).map(user => ({
        id: user.id,
        type: 'user',
        action: 'User Registered',
        detail: `${user.first_name} ${user.last_name} - ${user.role}`,
        time: new Date(user.created_at).toLocaleDateString(),
        icon: 'Users'
      })),
      ...properties.slice(-5).map(property => ({
        id: property.id,
        type: 'property',
        action: 'Property Listed',
        detail: `${property.title} in ${property.city}`,
        time: new Date(property.created_at).toLocaleDateString(),
        icon: 'Home'
      })),
      ...transactions.slice(-5).map(transaction => ({
        id: transaction.id,
        type: 'transaction',
        action: 'Transaction Completed',
        detail: `ETB ${(transaction.final_price || transaction.offer_price || 0).toLocaleString()}`,
        time: new Date(transaction.created_at).toLocaleDateString(),
        icon: 'CreditCard'
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
    
    const analyticsData = {
      // Summary stats
      totalUsers: users.length,
      totalProperties: properties.length,
      totalTransactions: transactions.length,
      totalRevenue,
      
      // Distributions
      userDistribution,
      propertyDistribution,
      
      // Performance metrics
      systemMetrics: {
        activeUsers: users.filter(u => u.status === 'active').length,
        verifiedUsers: users.filter(u => u.verified || u.is_verified).length,
        pendingProperties: properties.filter(p => 
          p.status === 'pending_review' || p.status === 'draft' || p.status === 'pending'
        ).length,
        pendingTransactions: transactions.filter(t => 
          t.status === 'pending' || t.status === 'under_contract'
        ).length,
      },
      
      // Financial overview
      financialOverview: {
        totalRevenue,
        averageTransactionValue: transactions.length > 0 
          ? totalRevenue / transactions.length 
          : 0,
        revenueTrend: '+12.5%', // Placeholder
      },
      
      // Recent activities
      recentActivities,
      
      // Broker performance (top 5)
      topBrokers: users
        .filter(u => u.role && u.role.includes('broker'))
        .slice(0, 5)
        .map(broker => ({
          id: broker.id,
          name: `${broker.first_name} ${broker.last_name}`,
          email: broker.email,
          brokerType: broker.broker_type,
          completedDeals: transactions.filter(t => 
            t.broker_id === broker.id && 
            (t.status === 'completed' || t.status === 'closed')
          ).length,
          totalCommission: transactions
            .filter(t => t.broker_id === broker.id && (t.status === 'completed' || t.status === 'closed'))
            .reduce((sum, t) => sum + (parseFloat(t.commission_amount) || 0), 0)
        })),
      
      // Metadata
      timeframe,
      generatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: analyticsData
    });
    
  } catch (error) {
    console.error("❌ Error in getAdminAnalytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin analytics",
      message: error.message
    });
  }
};

// User analytics for admin
export const getUserAnalytics = async (req, res) => {
  try {
    const users = await fetchServiceData("USER", "/api/users");
    
    const userStats = {
      total: users.length,
      byRole: {},
      activeUsers: users.filter(u => u.status === "active").length,
      verifiedUsers: users.filter(u => u.verified || u.is_verified).length,
      usersLast7Days: users.filter(u => {
        const userDate = new Date(u.created_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return userDate > sevenDaysAgo;
      }).length,
    };
    
    // Count by role
    users.forEach(user => {
      const role = user.role || 'user';
      userStats.byRole[role] = (userStats.byRole[role] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    console.error("Error in getUserAnalytics:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch user analytics" 
    });
  }
};

// Property analytics for admin
export const getPropertyAnalytics = async (req, res) => {
  try {
    const properties = await fetchServiceData("PROPERTY", "/api/properties");
    
    const propertyStats = {
      total: properties.length,
      byType: {},
      byStatus: {
        active: properties.filter(p => p.status === 'active').length,
        pending: properties.filter(p => 
          p.status === 'pending_review' || p.status === 'draft' || p.status === 'pending'
        ).length,
        sold: properties.filter(p => p.status === 'sold' || p.status === 'approved').length,
        rented: properties.filter(p => p.status === 'rented').length,
      },
      totalValue: properties.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0),
    };
    
    // Count by type
    properties.forEach(property => {
      const type = property.property_type || 'unknown';
      propertyStats.byType[type] = (propertyStats.byType[type] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: propertyStats
    });
  } catch (error) {
    console.error("Error in getPropertyAnalytics:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch property analytics" 
    });
  }
};

// Transaction analytics for admin
export const getTransactionAnalytics = async (req, res) => {
  try {
    const transactions = await fetchServiceData("TRANSACTION", "/api/transactions");
    
    const transactionStats = {
      total: transactions.length,
      byStatus: {
        completed: transactions.filter(t => t.status === 'completed' || t.status === 'closed').length,
        pending: transactions.filter(t => t.status === 'pending' || t.status === 'under_contract').length,
        cancelled: transactions.filter(t => t.status === 'cancelled' || t.status === 'rejected').length,
        draft: transactions.filter(t => t.status === 'draft').length,
      },
      totalRevenue: transactions
        .filter(t => t.status === 'completed' || t.status === 'closed')
        .reduce((sum, t) => sum + (parseFloat(t.final_price) || parseFloat(t.offer_price) || 0), 0),
    };
    
    res.json({
      success: true,
      data: transactionStats
    });
  } catch (error) {
    console.error("Error in getTransactionAnalytics:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch transaction analytics" 
    });
  }
};