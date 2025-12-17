// controllers/shared.controllers.js
import { 
  fetchServiceData,
  extractArrayFromResponse 
} from '../services/index.js';

// Dashboard analytics for all roles
export const getDashboardAnalytics = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard analytics');
    
    // Use fetchServiceData
    const [propertiesResponse, transactionsResponse, usersResponse] = await Promise.all([
      fetchServiceData("PROPERTY", "/api/properties"),
      fetchServiceData("TRANSACTION", "/api/transactions"),
      fetchServiceData("USER", "/api/users")
    ]);
    
    // Extract arrays from responses
    const properties = extractArrayFromResponse(propertiesResponse, 'properties');
    const transactions = extractArrayFromResponse(transactionsResponse, 'transactions');
    const users = extractArrayFromResponse(usersResponse, 'users');
    
    console.log(`✅ PROPERTY: ${properties.length} items`);
    console.log(`✅ TRANSACTION: ${transactions.length} items`);
    console.log(`✅ USER: ${users.length} items`);
    
    // Calculate dashboard stats
    const totalProperties = properties.length;
    const activeProperties = properties.filter(p => 
      (p.property_status || p.status) === 'active'
    ).length;
    
    const totalUsers = users.length;
    const activeUsers = users.filter(u => 
      u.status === 'active' || u.is_active === true
    ).length;
    
    // Calculate revenue from transactions
    const totalRevenue = transactions
      .filter(t => {
        const status = t.transaction_status || t.status;
        return status === 'completed' || status === 'closed';
      })
      .reduce((sum, t) => {
        const commission = parseFloat(t.commission_amount) || 0;
        const price = parseFloat(t.final_price) || parseFloat(t.offer_price) || parseFloat(t.price) || 0;
        return sum + (commission || price * 0.025);
      }, 0);
    
    // Recent activities
    const recentProperties = properties
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        status: p.property_status || p.status,
        city: p.city,
        price: p.price,
        created_at: p.created_at
      }));
    
    const dashboardData = {
      overview: {
        totalProperties,
        activeProperties,
        totalUsers,
        activeUsers,
        totalRevenue,
        pendingApprovals: properties.filter(p => {
          const status = p.property_status || p.status;
          return status === 'pending' || status === 'draft';
        }).length
      },
      propertyBreakdown: {
        byType: groupBy(properties, 'property_type'),
        byStatus: groupBy(properties, p => p.property_status || p.status),
        byCity: groupBy(properties, 'city')
      },
      userBreakdown: {
        byRole: groupBy(users, 'role'),
        byStatus: groupBy(users, u => u.status || (u.is_active ? 'active' : 'inactive'))
      },
      recentActivities: recentProperties,
      generatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('❌ Error in getDashboardAnalytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics',
      message: error.message
    });
  }
};

// Helper function to group data
function groupBy(array, key) {
  if (typeof key === 'function') {
    return array.reduce((result, item) => {
      const value = key(item) || 'Unknown';
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  } else {
    return array.reduce((result, item) => {
      const value = item[key] || 'Unknown';
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }
}

// Health check endpoint
export const getSystemHealth = async (req, res) => {
  try {
    const healthChecks = await Promise.allSettled([
      fetchServiceData("USER", "/health").then(data => ({ service: "user", status: "healthy" }))
        .catch(() => ({ service: "user", status: "unhealthy" })),
      fetchServiceData("PROPERTY", "/health").then(() => ({ service: "property", status: "healthy" }))
        .catch(() => ({ service: "property", status: "unhealthy" })),
      fetchServiceData("TRANSACTION", "/health").then(() => ({ service: "transaction", status: "healthy" }))
        .catch(() => ({ service: "transaction", status: "unhealthy" })),
      fetchServiceData("TODO", "/health").then(() => ({ service: "todo", status: "healthy" }))
        .catch(() => ({ service: "todo", status: "unhealthy" }))
    ]);
    
    const services = healthChecks.map(h => h.value || { service: "unknown", status: "unhealthy" });
    const healthyServices = services.filter(s => s.status === "healthy").length;
    
    res.json({
      overallHealth: healthyServices === services.length ? "healthy" : "degraded",
      services,
      healthyCount: healthyServices,
      totalServices: services.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in getSystemHealth:", error);
    res.status(500).json({
      error: "Failed to check system health",
      message: error.message,
    });
  }
};