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
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
  console.log('WebSocket client connected');
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
    const { type, admin, target } = req.body;
    if (!type || !admin || !target) {
      return res.status(400).json({ error: 'Missing required fields: type, admin, target' });
    }

    const newActivity = {
      id: Date.now(),
      type,
      admin,
      target,
      timestamp: new Date(),
      icon: getActivityIcon(type),
    };

    const [result] = await db.query(
      'INSERT INTO admin_activities (type, admin_username, target, timestamp) VALUES (?, ?, ?, ?)',
      [type, admin, target, newActivity.timestamp]
    );

    newActivity.id = result.insertId;
    io.emit('activity_update', newActivity); // Emit to all connected clients
    res.json({ success: true, activity: newActivity });
  } catch (error) {
    console.error('Error logging activity:', error.message);
    res.status(500).json({ error: 'Failed to log activity', details: error.message });
  }
});

// Helper Functions
const fetchUsersFromUserService = async (authHeader) => {
  try {
    const response = await axios.get('http://localhost:5000/api/users', {
      headers: { Authorization: authHeader || `Bearer ${process.env.ADMIN_TOKEN}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users from user-service:', error.message);
    return [];
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
    user: 6,
  };

  return users.reduce((dist, user) => {
    const index = roleMap[user.role] ?? 6;
    dist[index].count++;
    return dist;
  }, roles.map((role, i) => ({ role, count: 0, color: colors[i] })));
};

const computeRevenueData = async (users) => {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']; // Sep 2025 to Feb 2026
  const currentYear = 2025;
  const nextYear = 2026;

  return months.map((month, index) => {
    const monthIndex = 8 + index; // September (8) to February (13, maps to 1 for next year)
    const year = monthIndex > 11 ? nextYear : currentYear;
    const adjustedMonth = monthIndex > 11 ? monthIndex - 12 : monthIndex;
    const userCount = users.filter(
      u => new Date(u.created_at).getMonth() === adjustedMonth && new Date(u.created_at).getFullYear() === year
    ).length;
    return {
      month,
      userCount,
      revenue: userCount * 10000, // Simplified; replace with transaction-service
      rental: Math.floor(userCount * 3000), // Mock
      sales: Math.floor(userCount * 7000), // Mock
    };
  });
};

const computeUserTrend = (users) => {
  const lastWeekUsers = users.filter(
    u => new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const prevWeekUsers = users.filter(
    u =>
      new Date(u.created_at) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
      new Date(u.created_at) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  ).length;
  return prevWeekUsers > 0
    ? `+${Math.round((lastWeekUsers / prevWeekUsers) * 100)}%`
    : '+0%';
};

const fetchTotalProperties = async () => {
  try {
    // Replace with property-service if available
    return 178; // Mock
  } catch (error) {
    console.error('Error fetching properties:', error.message);
    return 0;
  }
};

const computeDealAnalytics = async () => {
  try {
    // Replace with transaction-service if available
    return {
      rental: { made: 45, completed: 38, pending: 7 },
      sales: { made: 32, completed: 28, pending: 4 },
      totalRevenue: 2850000, // Mock
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
    hawassa: 2,
    'bahir dar': 3,
    mekele: 4,
  };

  return users.reduce((loc, user) => {
    const region = (user.region || 'other').toLowerCase();
    const index = regionMap[region] ?? 5;
    loc[index].deals++;
    loc[index].revenue += 10000; // Mock
    return loc;
  }, regions.map((region, i) => ({ region, deals: 0, revenue: 0, color: colors[i] })));
};

const fetchRecentActivities = async () => {
  try {
    const [activities] = await db.query(
      'SELECT id, type, admin_username AS admin, target, timestamp, details FROM admin_activities ORDER BY timestamp DESC LIMIT 10'
    );
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
  };
  return icons[type] || 'Activity';
};

const PORT = process.env.PORT || 5004;
server.listen(PORT, () => {
  console.log(`📊 Analysis service running on port ${PORT}`);
});