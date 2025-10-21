import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import db from '../shared/db.js';
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
  console.log('WebSocket client connected to analysis service');
  socket.on('disconnect', () => console.log('WebSocket client disconnected'));
});

// API Routes
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const users = await fetchUsersFromUserService(req.headers.authorization);
    const totalUsers = users.length;
    const userDistribution = computeUserDistribution(users);
    const revenueData = await computeRevenueData(users);
    const activeUsers = users.filter(u => u.status === 'active').length;
    const totalProperties = await fetchTotalProperties();
    const dealAnalytics = await computeDealAnalytics();
    const locationAnalytics = computeLocationAnalytics(users);
    const recentActivities = await fetchRecentActivities();

    const data = {
      revenueData,
      userDistribution,
      dealAnalytics,
      locationAnalytics,
      recentActivities,
      totalUsers,
      totalProperties,
      activeUsers,
      userTrend: computeUserTrend(users),
    };

    res.json(data);
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

app.post('/api/analytics/activity', async (req, res) => {
  try {
    const { type, admin, target, targetType, details } = req.body;
    if (!type || !admin || !target) {
      return res.status(400).json({ error: 'Missing required fields: type, admin, target' });
    }

    const newActivity = {
      id: Date.now(),
      type,
      admin,
      target,
      targetType: targetType || 'system',
      details,
      timestamp: new Date(),
      icon: getActivityIcon(type),
    };

    const [result] = await db.query(
      'INSERT INTO admin_activities (activity_type, admin_user_id, target_type, target_id, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [type, admin.id || admin, targetType || 'system', target.id || target, details || `Admin action: ${type}`, newActivity.timestamp]
    );

    newActivity.id = result.insertId;
    io.emit('activity_update', newActivity);
    res.json({ success: true, activity: newActivity });
  } catch (error) {
    console.error('Error logging activity:', error.message);
    res.status(500).json({ error: 'Failed to log activity', details: error.message });
  }
});

// Support-specific analytics
app.get('/api/analytics/support', async (req, res) => {
  try {
    const supportData = {
      ticketMetrics: await getTicketMetrics(),
      agentPerformance: await getAgentPerformance(),
      responseTimeAnalytics: await getResponseTimeAnalytics(),
      customerSatisfaction: await getCustomerSatisfaction(),
      faqEffectiveness: await getFAQEffectiveness()
    };
    
    res.json(supportData);
  } catch (error) {
    console.error('Support analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch support analytics' });
  }
});

// Helper Functions
const fetchUsersFromUserService = async (authHeader) => {
  try {
    const response = await axios.get(`${process.env.USER_SERVICE_URL || 'http://localhost:5000'}/api/users`, {
      headers: { Authorization: authHeader || `Bearer ${process.env.ADMIN_TOKEN}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users from user-service:', error.message);
    // Fallback to database if user service is unavailable
    const [users] = await db.query(`
      SELECT id, first_name, last_name, username, email, role, status, created_at, city, country 
      FROM users 
      ORDER BY created_at DESC
    `);
    return users;
  }
};

const computeUserDistribution = (users) => {
  const roles = ['Buyers', 'Sellers', 'Renters', 'Brokers', 'Admins', 'Support Agents', 'Users'];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280', '#9CA3AF'];
  const roleMap = {
    buyer: 0,
    seller: 1,
    renter: 2,
    broker: 3,
    admin: 4,
    support_agent: 5,
    support_lead: 5,
    support_admin: 5,
    super_admin: 4,
    user: 6,
  };

  const distribution = roles.map((role, i) => ({ role, count: 0, color: colors[i] }));

  users.forEach(user => {
    const index = roleMap[user.role] ?? 6;
    distribution[index].count++;
  });

  return distribution;
};

const computeRevenueData = async (users) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  return months.map((month, index) => {
    const userCount = users.filter(
      u => new Date(u.created_at).getMonth() === index && new Date(u.created_at).getFullYear() === currentYear
    ).length;
    
    return {
      month,
      userCount,
      revenue: userCount * 10000,
      rental: Math.floor(userCount * 3000),
      sales: Math.floor(userCount * 7000),
    };
  });
};

const computeUserTrend = (users) => {
  const lastWeekUsers = users.filter(
    u => new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  const prevWeekUsers = users.filter(
    u => new Date(u.created_at) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
         new Date(u.created_at) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  ).length;
  
  return prevWeekUsers > 0
    ? `+${Math.round(((lastWeekUsers - prevWeekUsers) / prevWeekUsers) * 100)}%`
    : lastWeekUsers > 0 ? '+100%' : '0%';
};

const fetchTotalProperties = async () => {
  try {
    // Check if properties table exists
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'properties'
    `, [process.env.DB_NAME]);
    
    if (tables.length > 0) {
      const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM properties WHERE status = "active"');
      return count;
    }
    return 178; // Mock data if properties table doesn't exist
  } catch (error) {
    console.error('Error fetching properties:', error.message);
    return 178; // Mock data
  }
};

const computeDealAnalytics = async () => {
  try {
    // Mock data - replace with actual transaction service integration
    return {
      rental: { made: 45, completed: 38, pending: 7 },
      sales: { made: 32, completed: 28, pending: 4 },
      totalRevenue: 2850000,
    };
  } catch (error) {
    console.error('Error computing deal analytics:', error.message);
    return { rental: { made: 0, completed: 0, pending: 0 }, sales: { made: 0, completed: 0, pending: 0 }, totalRevenue: 0 };
  }
};

const computeLocationAnalytics = (users) => {
  const regions = ['Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 'Mekele', 'Other'];
  const colors = ['#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F', '#6B7280'];
  const regionMap = {
    'addis ababa': 0,
    'dire dawa': 1,
    'hawassa': 2,
    'bahir dar': 3,
    'mekele': 4,
  };

  const locationData = regions.map((region, i) => ({ region, deals: 0, revenue: 0, color: colors[i] }));

  users.forEach(user => {
    const region = (user.city || user.region || 'other').toLowerCase();
    const index = regionMap[region] ?? 5;
    locationData[index].deals++;
    locationData[index].revenue += 10000; // Mock revenue
  });

  return locationData;
};

const fetchRecentActivities = async () => {
  try {
    const [activities] = await db.query(`
      SELECT id, activity_type as type, admin_user_id as admin, target_type, target_id as target, description, timestamp 
      FROM admin_activities 
      ORDER BY timestamp DESC LIMIT 10
    `);
    
    return activities.map(activity => ({
      ...activity,
      icon: getActivityIcon(activity.type),
      timestamp: new Date(activity.timestamp).toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching activities:', error.message);
    return [];
  }
};

const getActivityIcon = (type) => {
  const icons = {
    user_created: 'Users',
    user_updated: 'Edit',
    user_deleted: 'Trash2',
    todo_created: 'CheckSquare',
    todo_updated: 'Edit',
    todo_deleted: 'Trash2',
    property_created: 'Home',
    property_updated: 'Edit',
    property_deleted: 'Trash2',
    ticket_created: 'MessageSquare',
    ticket_updated: 'Edit',
    ticket_resolved: 'CheckCircle',
    article_created: 'FileText',
    article_updated: 'Edit',
    flag_created: 'Flag',
    flag_resolved: 'CheckCircle',
  };
  return icons[type] || 'Activity';
};

const getTicketMetrics = async () => {
  try {
    const [[{ totalTickets }]] = await db.query('SELECT COUNT(*) as totalTickets FROM support_tickets');
    const [[{ openTickets }]] = await db.query('SELECT COUNT(*) as openTickets FROM support_tickets WHERE status IN ("open", "in_progress")');
    const [[{ resolvedToday }]] = await db.query('SELECT COUNT(*) as resolvedToday FROM support_tickets WHERE DATE(resolved_at) = CURDATE()');
    const [[{ highPriorityTickets }]] = await db.query('SELECT COUNT(*) as highPriorityTickets FROM support_tickets WHERE priority IN ("high", "urgent") AND status IN ("open", "in_progress")');
    
    return {
      totalTickets: totalTickets || 0,
      openTickets: openTickets || 0,
      resolvedToday: resolvedToday || 0,
      averageResolutionTime: "4.2h",
      highPriorityTickets: highPriorityTickets || 0
    };
  } catch (error) {
    console.error('Error fetching ticket metrics:', error);
    return {
      totalTickets: 156,
      openTickets: 23,
      resolvedToday: 12,
      averageResolutionTime: "4.2h",
      highPriorityTickets: 8
    };
  }
};

const getAgentPerformance = async () => {
  try {
    const [performance] = await db.query(`
      SELECT 
        u.username as agent,
        COUNT(st.id) as tickets_resolved,
        AVG(uf.rating) as satisfaction
      FROM users u
      LEFT JOIN support_tickets st ON u.username = st.assigned_to AND st.status = 'resolved'
      LEFT JOIN user_feedback uf ON st.id = uf.ticket_id
      WHERE u.role IN ('support_agent', 'support_lead', 'support_admin')
      GROUP BY u.id, u.username
    `);
    
    return performance.map(p => ({
      agent: p.agent,
      ticketsResolved: p.tickets_resolved || 0,
      satisfaction: parseFloat(p.satisfaction) || 4.5
    }));
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    return [
      { agent: 'support_agent1', ticketsResolved: 45, satisfaction: 4.8 },
      { agent: 'support_agent2', ticketsResolved: 38, satisfaction: 4.6 },
      { agent: 'support_agent3', ticketsResolved: 52, satisfaction: 4.9 }
    ];
  }
};

const getResponseTimeAnalytics = async () => {
  // Mock implementation
  return {
    averageFirstResponse: "2.3h",
    averageResolution: "4.2h",
    slaCompliance: "92%"
  };
};

const getCustomerSatisfaction = async () => {
  try {
    const [[{ avgRating }]] = await db.query('SELECT AVG(rating) as avgRating FROM user_feedback');
    return {
      averageRating: parseFloat(avgRating) || 4.7,
      totalFeedback: await db.query('SELECT COUNT(*) as count FROM user_feedback').then(([[{ count }]]) => count || 0),
      positiveRate: "94%"
    };
  } catch (error) {
    return {
      averageRating: 4.7,
      totalFeedback: 124,
      positiveRate: "94%"
    };
  }
};

const getFAQEffectiveness = async () => {
  try {
    const [[{ totalViews }]] = await db.query('SELECT SUM(views) as totalViews FROM knowledge_base_articles');
    const [[{ helpfulVotes }]] = await db.query('SELECT SUM(helpful_votes) as helpfulVotes FROM knowledge_base_articles');
    
    return {
      totalViews: totalViews || 0,
      helpfulRate: totalViews ? `${Math.round((helpfulVotes / totalViews) * 100)}%` : "0%",
      articlesPublished: await db.query('SELECT COUNT(*) as count FROM knowledge_base_articles WHERE status = "published"').then(([[{ count }]]) => count || 0)
    };
  } catch (error) {
    return {
      totalViews: 1245,
      helpfulRate: "85%",
      articlesPublished: 15
    };
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'analysis-service' });
});

const PORT = process.env.PORT || 5004;
server.listen(PORT, () => {
  console.log(`📊 Analysis service running on port ${PORT}`);
});