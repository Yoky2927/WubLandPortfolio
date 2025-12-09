import { CHART_COLORS } from '../config/chart.config.js';

export const computeUserDistribution = (users = []) => {
  const roles = ['buyer', 'seller', 'renter', 'broker', 'admin', 'support_agent'];
  
  const distribution = roles.map(role => {
    const count = users.filter(u => {
      if (role === 'broker') {
        return u.role && (u.role.includes('broker') || u.role === 'broker');
      }
      return u.role === role;
    }).length;
    
    return {
      role: role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' '),
      count,
      color: getRoleColor(role)
    };
  });
  
  return distribution;
};

export const computeMonthlyGrowth = (transactions = []) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Group transactions by month
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    if (transaction.status === 'completed' || transaction.status === 'success') {
      try {
        const date = new Date(transaction.created_at || transaction.date || transaction.timestamp);
        const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            revenue: 0,
            count: 0,
            month: months[date.getMonth()],
            year: date.getFullYear()
          };
        }
        
        monthlyData[monthYear].revenue += parseFloat(transaction.amount || transaction.value || 0);
        monthlyData[monthYear].count += 1;
      } catch (error) {
        console.warn('Error processing transaction date:', error.message);
      }
    }
  });
  
  // Get last 6 months with data
  const now = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return monthlyData[key] || {
      month: months[date.getMonth()],
      revenue: 0,
      count: 0,
      year: date.getFullYear()
    };
  });
  
  return last6Months;
};

export const generateActivityStream = (users = [], todos = [], transactions = []) => {
  const activities = [];
  
  // User activities
  const newUsers = users
    .filter(u => u.created_at || u.createdAt)
    .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
    .slice(0, 5);
  
  newUsers.forEach(user => {
    activities.push({
      id: `user-${user.id}`,
      type: 'user',
      action: 'New User Joined',
      detail: `${user.first_name || user.name} ${user.last_name || ''} registered as ${user.role}`,
      timestamp: user.created_at || user.createdAt,
      icon: 'Users',
      color: CHART_COLORS.status.active
    });
  });
  
  // Todo activities
  const recentTodos = todos
    .filter(t => t.created_at || t.createdAt)
    .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
    .slice(0, 5);
  
  recentTodos.forEach(todo => {
    activities.push({
      id: `todo-${todo.id}`,
      type: 'todo',
      action: todo.status === 'completed' ? 'Task Completed' : 'Task Added',
      detail: todo.title || todo.name,
      timestamp: todo.created_at || todo.createdAt,
      icon: todo.status === 'completed' ? 'CheckCircle' : 'CheckSquare',
      color: todo.status === 'completed' ? CHART_COLORS.status.active : CHART_COLORS.donut.pending
    });
  });
  
  // Transaction activities
  const recentTransactions = transactions
    .filter(t => (t.status === 'completed' || t.status === 'success') && (t.created_at || t.date))
    .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
    .slice(0, 5);
  
  recentTransactions.forEach(transaction => {
    activities.push({
      id: `transaction-${transaction.id}`,
      type: 'transaction',
      action: 'Transaction Completed',
      detail: `ETB ${(transaction.amount || transaction.value || 0).toLocaleString()} - ${transaction.type || 'payment'}`,
      timestamp: transaction.created_at || transaction.date,
      icon: 'DollarSign',
      color: CHART_COLORS.status.active
    });
  });
  
  // Sort by timestamp and return top 15
  return activities
    .filter(a => a.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 15);
};

export const computePropertyDistribution = (properties = []) => {
  const types = ['Residential', 'Commercial', 'Land', 'Apartment', 'House'];
  
  return types.map(type => {
    const count = properties.filter(p => p.type === type.toLowerCase() || p.type === type).length;
    return {
      type,
      count,
      color: CHART_COLORS.donut[type.toLowerCase()] || CHART_COLORS.donut.residential
    };
  });
};

export const computeTransactionStatus = (transactions = []) => {
  const statuses = ['completed', 'pending', 'cancelled', 'in_review'];
  
  return statuses.map(status => {
    const count = transactions.filter(t => t.status === status).length;
    return {
      status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      count,
      color: CHART_COLORS.donut[status] || CHART_COLORS.donut.completed
    };
  });
};

export const computeLocationAnalytics = (properties = []) => {
  // Group properties by city
  const cityMap = {};
  
  properties.forEach(property => {
    if (!property.city) return;
    
    const city = property.city.toLowerCase();
    
    if (!cityMap[city]) {
      cityMap[city] = {
        name: property.city,
        value: 0,
        properties: []
      };
    }
    
    cityMap[city].value += 1;
    cityMap[city].properties.push({
      id: property.id,
      title: property.title,
      price: property.price,
      type: property.type
    });
  });
  
  // Convert to array and sort
  const cities = Object.values(cityMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  
  // Add coordinates for Ethiopian cities
  const ethiopianCities = {
    'addis ababa': { lat: 9.03, lng: 38.74 },
    'adama': { lat: 8.54, lng: 39.27 },
    'bahir dar': { lat: 11.59, lng: 37.39 },
    'mekele': { lat: 13.49, lng: 39.47 },
    'hawassa': { lat: 7.05, lng: 38.47 },
    'gondar': { lat: 12.6, lng: 37.47 },
    'dire dawa': { lat: 9.6, lng: 41.87 },
    'jimma': { lat: 7.67, lng: 36.83 },
    'arba minch': { lat: 6.04, lng: 37.55 },
    'asosa': { lat: 10.07, lng: 34.53 }
  };
  
  return cities.map(city => ({
    ...city,
    ...(ethiopianCities[city.name.toLowerCase()] || {
      lat: 9.03 + (Math.random() - 0.5) * 2,
      lng: 38.74 + (Math.random() - 0.5) * 2
    })
  }));
};

export const computeDealAnalytics = (transactions = []) => {
  const completedTransactions = transactions.filter(t => 
    t.status === 'completed' || t.status === 'success'
  );
  
  const totalRevenue = completedTransactions.reduce((sum, t) => 
    sum + (parseFloat(t.amount || t.value || 0)), 0
  );
  
  const averageDealValue = completedTransactions.length > 0 
    ? totalRevenue / completedTransactions.length 
    : 0;
  
  // Calculate revenue trend (this month vs last month)
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const thisMonthRevenue = completedTransactions
    .filter(t => {
      const date = new Date(t.created_at || t.date || t.timestamp);
      return date >= thisMonth;
    })
    .reduce((sum, t) => sum + (parseFloat(t.amount || t.value) || 0), 0);
  
  const lastMonthRevenue = completedTransactions
    .filter(t => {
      const date = new Date(t.created_at || t.date || t.timestamp);
      return date >= lastMonth && date < thisMonth;
    })
    .reduce((sum, t) => sum + (parseFloat(t.amount || t.value) || 0), 0);
  
  const revenueTrend = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : thisMonthRevenue > 0 ? 100 : 0;
  
  return {
    totalRevenue,
    averageDealValue,
    completedCount: completedTransactions.length,
    pendingCount: transactions.filter(t => 
      t.status === 'pending' || t.status === 'processing'
    ).length,
    revenueTrend: revenueTrend > 0 ? `+${revenueTrend.toFixed(1)}%` : `${revenueTrend.toFixed(1)}%`,
    revenueData: computeMonthlyGrowth(transactions)
  };
};

const getRoleColor = (role) => {
  const colors = {
    super_admin: '#ef4444', // red-500
    admin: '#8b5cf6', // violet-500
    support_admin: '#3b82f6', // blue-500
    support_lead: '#0ea5e9', // sky-500
    support_agent: '#06b6d4', // cyan-500
    internal_broker: '#f59e0b', // amber-500
    external_broker: '#f97316', // orange-500
    buyer: '#10b981', // emerald-500
    seller: '#eab308', // yellow-500
    landlord: '#14b8a6', // teal-500
    renter: '#ec4899', // pink-500
    user: '#6b7280' // gray-500
  };
  
  return colors[role] || '#6b7280';
};