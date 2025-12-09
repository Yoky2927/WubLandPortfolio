import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Service URLs from environment variables
const SERVICES = {
  USER: process.env.USER_SERVICE_URL || "http://localhost:5000",
  PROPERTY: process.env.PROPERTY_SERVICE_URL || "http://localhost:5002",
  TRANSACTION: process.env.TRANSACTION_SERVICE_URL || "http://localhost:5001",
  TODO: process.env.TODO_SERVICE_URL || "http://localhost:5003",
};

// Store for admin token (cached)
let adminToken = null;
let tokenExpiry = null;

// Function to get a valid admin token
const getAdminToken = async () => {
  // Return cached token if still valid (5 minutes)
  if (adminToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log("📝 Using cached admin token");
    return adminToken;
  }

  try {
    console.log("🔐 Getting new admin token...");

    const loginData = {
      username: process.env.ANALYSIS_SERVICE_USERNAME || "yokabd_admin",
      password: process.env.ANALYSIS_SERVICE_PASSWORD || "Admin@123",
    };

    console.log("Logging in with:", loginData.username);

    const response = await axios.post(
      `${SERVICES.USER}/api/auth/login`,
      loginData,
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.data.token) {
      adminToken = response.data.token;
      tokenExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
      console.log("✅ Admin token obtained successfully");
      return adminToken;
    } else {
      console.error("❌ No token in login response:", response.data);
      throw new Error("No token received from login");
    }
  } catch (error) {
    console.error("❌ Failed to get admin token:", error.message);
    if (error.response) {
      console.error(
        "Login response:",
        error.response.status,
        error.response.data
      );
    }
    throw error;
  }
};

// Helper to fetch data from services
const fetchServiceData = async (service, endpoint) => {
  try {
    const token = await getAdminToken();
    const url = `${SERVICES[service]}${endpoint}`;

    console.log(`📡 Fetching: ${url}`);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Service-Request": "analysis-service",
      },
      timeout: 15000,
      validateStatus: (status) => status < 500, // Don't throw for client errors
    });

    console.log(
      `✅ ${service}: ${response.status} - ${
        Array.isArray(response.data)
          ? response.data.length + " items"
          : "data received"
      }`
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.warn(
        `⚠️ ${service} returned ${response.status}:`,
        response.data?.message || ""
      );
      return [];
    }
  } catch (error) {
    console.error(`❌ Failed to fetch from ${service}:`, error.message);

    if (error.code === "ECONNREFUSED") {
      console.error(
        `🔌 ${service} service not running at ${SERVICES[service]}`
      );
    } else if (error.response) {
      console.error(
        `📉 ${service} error ${error.response.status}:`,
        error.response.data
      );
    }

    return [];
  }
};

// Transform user data for radar chart
const computeUserDistribution = (users = []) => {
  // Define all roles we want to track
  const roles = [
    { key: "buyer", display: "Buyer" },
    { key: "seller", display: "Seller" },
    { key: "renter", display: "Renter" },
    { key: "landlord", display: "Landlord" },
    { key: "broker", display: "Broker" }, // Will include internal_broker and external_broker
    { key: "support", display: "Support" }, // Will include all support roles
    { key: "admin", display: "Admin" }, // Regular admin
    { key: "super_admin", display: "Super Admin" },
  ];

  const distribution = roles.map(({ key, display }) => {
    let count = 0;

    users.forEach((user) => {
      const userRole = user.role ? user.role.toLowerCase() : "";

      switch (key) {
        case "buyer":
          if (userRole === "buyer") count++;
          break;
        case "seller":
          if (userRole === "seller") count++;
          break;
        case "renter":
          if (userRole === "renter") count++;
          break;
        case "landlord":
          if (userRole === "landlord") count++;
          break;
        case "broker":
          if (userRole.includes("broker")) count++;
          break;
        case "support":
          if (userRole.includes("support")) count++;
          break;
        case "admin":
          if (userRole === "admin") count++;
          break;
        case "super_admin":
          if (userRole === "super_admin") count++;
          break;
      }
    });

    return {
      role: display,
      count,
      color: getRoleColor(key),
    };
  });

  console.log("Computed user distribution:", distribution);
  return distribution;
};

// Update getRoleColor to handle all roles:
const getRoleColor = (role) => {
  const colors = {
    buyer: "#10b981", // emerald-500
    seller: "#eab308", // yellow-500
    renter: "#ec4899", // pink-500
    landlord: "#14b8a6", // teal-500
    broker: "#f59e0b", // amber-500
    support: "#06b6d4", // cyan-500
    admin: "#8b5cf6", // violet-500
    super_admin: "#ef4444", // red-500
  };

  return colors[role] || "#6b7280";
};

// Add this function right after the getRoleColor function
const calculateUserGrowth = (users = []) => {
  if (!users.length) return 0;
  
  // Sort users by creation date
  const sortedUsers = [...users].sort((a, b) => {
    const dateA = new Date(a.created_at || a.createdAt || Date.now());
    const dateB = new Date(b.created_at || b.createdAt || Date.now());
    return dateA - dateB;
  });
  
  // Get users from last 30 days and previous 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(now.getDate() - 60);
  
  // Count users in last 30 days
  const recentUsers = sortedUsers.filter(user => {
    const userDate = new Date(user.created_at || user.createdAt || now);
    return userDate > thirtyDaysAgo && userDate <= now;
  }).length;
  
  // Count users in previous 30 days
  const previousUsers = sortedUsers.filter(user => {
    const userDate = new Date(user.created_at || user.createdAt || now);
    return userDate > sixtyDaysAgo && userDate <= thirtyDaysAgo;
  }).length;
  
  // Calculate growth percentage
  if (previousUsers === 0) {
    return recentUsers > 0 ? 100 : 0;
  }
  
  const growth = ((recentUsers - previousUsers) / previousUsers) * 100;
  return Math.round(growth * 100) / 100; // Round to 2 decimal places
};

// Main dashboard controller
export const getDashboardAnalytics = async (req, res) => {
  try {
    console.log("=== DASHBOARD ANALYTICS REQUEST ===");

    // Fetch data from all services in parallel
    const [users, properties, transactions, todos] = await Promise.all([
      fetchServiceData("USER", "/api/users"),
      fetchServiceData("PROPERTY", "/api/properties"),
      fetchServiceData("TRANSACTION", "/api/transactions"),
      fetchServiceData("TODO", "/api/todos"),
    ]);

    console.log(
      `📊 Results: ${users.length} users, ${properties.length} properties, ${transactions.length} transactions, ${todos.length} todos`
    );

    // Transform data
    const userDistribution = computeUserDistribution(users);
    const userTrend = calculateUserGrowth(users);

    // Calculate active users
    const activeUsers = users.filter(
      (u) => u.status === "active" || u.isActive
    ).length;

    // Prepare response
    const dashboardData = {
      // Top Stat Cards
      totalUsers: users.length,
      totalProperties: properties.length,
      activeUsers,
      totalRevenue: 0, // Will update when transaction service works
      userTrend,
      activeTrend:
        activeUsers > 0
          ? `+${Math.round((activeUsers / users.length) * 100)}%`
          : "0%",

      // Charts
      revenueData: [], // Will update when transaction service works
      userDistribution,

      // Property type distribution
      propertyDistribution: [
        {
          type: "Residential",
          count: properties.filter((p) => p.type === "residential").length,
          color: "#3b82f6",
        },
        {
          type: "Commercial",
          count: properties.filter((p) => p.type === "commercial").length,
          color: "#10b981",
        },
        {
          type: "Land",
          count: properties.filter((p) => p.type === "land").length,
          color: "#f59e0b",
        },
        {
          type: "Apartments",
          count: properties.filter((p) => p.type === "apartment").length,
          color: "#8b5cf6",
        },
        {
          type: "Houses",
          count: properties.filter((p) => p.type === "house").length,
          color: "#ef4444",
        },
      ],

      // Transaction status
      transactionStatus: [
        {
          status: "Completed",
          count: transactions.filter((t) => t.status === "completed").length,
          color: "#10b981",
        },
        {
          status: "Pending",
          count: transactions.filter((t) => t.status === "pending").length,
          color: "#f59e0b",
        },
        {
          status: "Cancelled",
          count: transactions.filter((t) => t.status === "cancelled").length,
          color: "#ef4444",
        },
        {
          status: "In Review",
          count: transactions.filter((t) => t.status === "review").length,
          color: "#8b5cf6",
        },
      ],

      // Activity Feed
      recentActivities: [],

      // Map Data
      locationAnalytics: [],

      // Deal Analytics
      dealAnalytics: {
        totalRevenue: 0,
        averageDealValue: 0,
        completedCount: 0,
        pendingCount: 0,
        revenueTrend: "0%",
        revenueData: [],
      },

      // Additional Stats
      additionalStats: {
        verifiedUsers: users.filter((u) => u.verified || u.isVerified).length,
        availableProperties: properties.filter((p) => p.status === "available")
          .length,
        pendingTransactions: transactions.filter((t) => t.status === "pending")
          .length,
        completedTodos: todos.filter((t) => t.status === "completed").length,
        usersLast7Days: users.filter((u) => {
          const userDate = new Date(u.created_at || u.createdAt);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return userDate > sevenDaysAgo;
        }).length,
      },
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("❌ Error in getDashboardAnalytics:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard analytics",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Individual analytics endpoints
export const getUserAnalytics = async (req, res) => {
  try {
    const users = await fetchServiceData("USER", "/api/users");

    res.json({
      total: users.length,
      byRole: computeUserDistribution(users),
      activeUsers: users.filter((u) => u.status === "active").length,
      verifiedUsers: users.filter((u) => u.verified).length,
      usersLast7Days: users.filter((u) => {
        const userDate = new Date(u.created_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return userDate > sevenDaysAgo;
      }).length,
    });
  } catch (error) {
    console.error("Error in getUserAnalytics:", error);
    res.status(500).json({ error: "Failed to fetch user analytics" });
  }
};

export const getPropertyAnalytics = async (req, res) => {
  try {
    const properties = await fetchServiceData("PROPERTY", "/api/properties");

    res.json({
      total: properties.length,
      byType: [
        {
          type: "Residential",
          count: properties.filter((p) => p.type === "residential").length,
        },
        {
          type: "Commercial",
          count: properties.filter((p) => p.type === "commercial").length,
        },
        {
          type: "Land",
          count: properties.filter((p) => p.type === "land").length,
        },
        {
          type: "Apartment",
          count: properties.filter((p) => p.type === "apartment").length,
        },
      ],
      byStatus: {
        available: properties.filter((p) => p.status === "available").length,
        sold: properties.filter((p) => p.status === "sold").length,
        rented: properties.filter((p) => p.status === "rented").length,
        pending: properties.filter((p) => p.status === "pending").length,
      },
      totalValue: properties.reduce(
        (sum, p) => sum + (parseFloat(p.price) || 0),
        0
      ),
    });
  } catch (error) {
    console.error("Error in getPropertyAnalytics:", error);
    res.status(500).json({ error: "Failed to fetch property analytics" });
  }
};

export const getTransactionAnalytics = async (req, res) => {
  try {
    const transactions = await fetchServiceData(
      "TRANSACTION",
      "/api/transactions"
    );

    res.json({
      total: transactions.length,
      byStatus: {
        completed: transactions.filter((t) => t.status === "completed").length,
        pending: transactions.filter((t) => t.status === "pending").length,
        cancelled: transactions.filter((t) => t.status === "cancelled").length,
        failed: transactions.filter((t) => t.status === "failed").length,
      },
      totalRevenue: transactions
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
    });
  } catch (error) {
    console.error("Error in getTransactionAnalytics:", error);
    res.status(500).json({ error: "Failed to fetch transaction analytics" });
  }
};

export const getSystemHealth = async (req, res) => {
  try {
    // Test each service
    const healthChecks = await Promise.allSettled([
      axios
        .get(`${SERVICES.USER}/health`, { timeout: 5000 })
        .then((res) => ({ service: "user", status: "healthy", data: res.data }))
        .catch(() => ({ service: "user", status: "unhealthy" })),

      axios
        .get(`${SERVICES.PROPERTY}/health`, { timeout: 5000 })
        .then((res) => ({
          service: "property",
          status: "healthy",
          data: res.data,
        }))
        .catch(() => ({ service: "property", status: "unhealthy" })),

      axios
        .get(`${SERVICES.TRANSACTION}/health`, { timeout: 5000 })
        .then((res) => ({
          service: "transaction",
          status: "healthy",
          data: res.data,
        }))
        .catch(() => ({ service: "transaction", status: "unhealthy" })),

      axios
        .get(`${SERVICES.TODO}/health`, { timeout: 5000 })
        .then((res) => ({ service: "todo", status: "healthy", data: res.data }))
        .catch(() => ({ service: "todo", status: "unhealthy" })),
    ]);

    const services = healthChecks.map(
      (h) => h.value || { service: "unknown", status: "unhealthy" }
    );
    const healthyServices = services.filter(
      (s) => s.status === "healthy"
    ).length;

    res.json({
      overallHealth:
        healthyServices === services.length ? "healthy" : "degraded",
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
