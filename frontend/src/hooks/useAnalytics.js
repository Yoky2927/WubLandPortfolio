// hooks/useAnalytics.js
import { useState, useCallback } from "react";
import { analyticsClient } from "../services/http.service";
import API_CONFIG from "../config/api.config";

export const useAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [brokerAnalytics, setBrokerAnalytics] = useState(null);
  const [supportAnalytics, setSupportAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ======================
  // ADMIN ANALYTICS
  // ======================

  // Fetch comprehensive admin analytics data
  const fetchAdminAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("📊 Fetching admin analytics...");
      console.log("URL:", API_CONFIG.ANALYTICS_URL + API_CONFIG.ENDPOINTS.DASHBOARD_ANALYTICS);

      const response = await analyticsClient.get(
        API_CONFIG.ENDPOINTS.DASHBOARD_ANALYTICS
      );

      if (response.data) {
        console.log("✅ Admin analytics data received:", {
          totalUsers: response.data.totalUsers,
          totalProperties: response.data.totalProperties,
          activeUsers: response.data.activeUsers,
        });
        setAnalyticsData(response.data);
        return response.data;
      }
    } catch (err) {
      console.error("❌ Error fetching admin analytics:", err);
      setError(err.message || "Failed to fetch admin analytics");

      // Return empty admin data structure
      return {
        totalUsers: 0,
        totalProperties: 0,
        activeUsers: 0,
        totalRevenue: 0,
        userTrend: "0%",
        activeTrend: "0%",
        revenueData: [],
        userDistribution: [],
        propertyDistribution: [],
        transactionStatus: [],
        recentActivities: [],
        locationAnalytics: [],
        dealAnalytics: {
          totalRevenue: 0,
          averageDealValue: 0,
          completedCount: 0,
          pendingCount: 0,
          revenueTrend: "0%",
          revenueData: [],
        },
        additionalStats: {
          verifiedUsers: 0,
          availableProperties: 0,
          pendingTransactions: 0,
          completedTodos: 0,
          usersLast7Days: 0,
        },
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ======================
  // BROKER ANALYTICS
  // ======================

  // Fetch broker-specific analytics
  const fetchBrokerAnalytics = useCallback(async (brokerId, timeframe = "monthly") => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`📊 Fetching broker analytics for ID: ${brokerId}, timeframe: ${timeframe}`);

      const response = await analyticsClient.get(
        `/brokers/${brokerId}/analytics?timeframe=${timeframe}`
      );

      if (response.data) {
        console.log("✅ Broker analytics data received:", {
          totalListings: response.data.totalListings,
          pendingReviews: response.data.pendingReviews,
          totalRevenue: response.data.totalRevenue,
        });
        setBrokerAnalytics(response.data);
        return response.data;
      }
    } catch (err) {
      console.error("❌ Error fetching broker analytics:", err);
      setError(err.message || "Failed to fetch broker analytics");

      // Return empty broker data structure
      return {
        brokerId: brokerId,
        totalListings: 0,
        pendingReviews: 0,
        approvedListings: 0,
        rejectedListings: 0,
        activeClients: 0,
        totalRevenue: 0,
        responseRate: 0,
        avgResponseTime: "0h",
        totalTransactions: 0,
        completedTransactions: 0,
        pendingTransactions: 0,
        propertyStats: {
          approved: 0,
          pending: 0,
          rejected: 0,
          draft: 0,
        },
        performance: {
          responseRate: 0,
          approvalRate: 0,
          clientSatisfaction: 0,
          avgCommissionRate: 0,
        },
        revenueTrend: {
          labels: [],
          data: [],
        },
        clientStats: {
          totalClients: 0,
          activeClients: 0,
          newClients: 0,
          retentionRate: 0,
        },
        transactionStats: {
          total: 0,
          completed: 0,
          pending: 0,
          avgCommission: 0,
        },
        recentActivities: [],
        commissionData: [],
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch broker transactions
  const fetchBrokerTransactions = useCallback(async (brokerId, timeframe = "monthly") => {
    try {
      console.log(`📊 Fetching broker transactions for ID: ${brokerId}`);

      const response = await analyticsClient.get(
        `/brokers/${brokerId}/transactions?timeframe=${timeframe}`
      );

      return response.data || { transactions: [], stats: {} };
    } catch (err) {
      console.error("❌ Error fetching broker transactions:", err);
      return { transactions: [], stats: {} };
    }
  }, []);

  // Fetch broker commission analytics
  const fetchBrokerCommissionAnalytics = useCallback(async (brokerId) => {
    try {
      console.log(`📊 Fetching commission analytics for broker ID: ${brokerId}`);

      const response = await analyticsClient.get(
        `/brokers/${brokerId}/commissions`
      );

      return response.data || { commissions: [], totalCommission: 0, trends: [] };
    } catch (err) {
      console.error("❌ Error fetching commission analytics:", err);
      return { commissions: [], totalCommission: 0, trends: [] };
    }
  }, []);

  // ======================
  // SUPPORT ANALYTICS
  // ======================

  // Fetch support agent analytics
  const fetchSupportAnalytics = useCallback(async (supportId, timeframe = "weekly") => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`📊 Fetching support analytics for ID: ${supportId}`);

      const response = await analyticsClient.get(
        `/support/${supportId}/analytics?timeframe=${timeframe}`
      );

      if (response.data) {
        console.log("✅ Support analytics data received:", {
          totalTickets: response.data.totalTickets,
          resolvedTickets: response.data.resolvedTickets,
          avgResponseTime: response.data.avgResponseTime,
        });
        setSupportAnalytics(response.data);
        return response.data;
      }
    } catch (err) {
      console.error("❌ Error fetching support analytics:", err);
      setError(err.message || "Failed to fetch support analytics");

      // Return empty support data structure
      return {
        supportId: supportId,
        totalTickets: 0,
        resolvedTickets: 0,
        pendingTickets: 0,
        escalatedTickets: 0,
        avgResponseTime: "0h",
        resolutionRate: 0,
        customerSatisfaction: 0,
        ticketStats: {
          byPriority: [],
          byCategory: [],
          byStatus: [],
        },
        performance: {
          ticketsResolved: 0,
          avgResolutionTime: "0h",
          firstContactResolution: 0,
        },
        recentTickets: [],
        activityLog: [],
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ======================
  // SHARED ANALYTICS
  // ======================

  // Fetch user distribution analytics
  const fetchUserDistribution = useCallback(async () => {
    try {
      const response = await analyticsClient.get("/users/distribution");
      return response.data || { byRole: [] };
    } catch (err) {
      console.error("❌ Error fetching user distribution:", err);
      return { byRole: [] };
    }
  }, []);

  // Fetch revenue analytics
  const fetchRevenueData = useCallback(async () => {
    try {
      const response = await analyticsClient.get("/revenue");
      return response.data || { monthlyRevenue: [], totalRevenue: 0 };
    } catch (err) {
      console.error("❌ Error fetching revenue data:", err);
      return { monthlyRevenue: [], totalRevenue: 0 };
    }
  }, []);

  // Fetch location analytics for map
  const fetchLocationAnalytics = useCallback(async () => {
    try {
      const response = await analyticsClient.get("/locations");
      return response.data || [];
    } catch (err) {
      console.error("❌ Error fetching location analytics:", err);
      return [];
    }
  }, []);

  // ======================
  // UTILITY FUNCTIONS
  // ======================

  // Get analytics based on user role
  const fetchRoleBasedAnalytics = useCallback(async (userRole, userId) => {
    switch (userRole) {
      case "super_admin":
      case "admin":
        return await fetchAdminAnalytics();
      
      case "internal_broker":
      case "external_broker":
        if (userId) {
          return await fetchBrokerAnalytics(userId);
        }
        break;
      
      case "support_agent":
      case "support_lead":
      case "support_admin":
        if (userId) {
          return await fetchSupportAnalytics(userId);
        }
        break;
      
      default:
        return null;
    }
  }, [fetchAdminAnalytics, fetchBrokerAnalytics, fetchSupportAnalytics]);

  // Refresh all analytics
  const refreshAnalytics = useCallback(async (userRole = null, userId = null) => {
    if (userRole && userId) {
      return await fetchRoleBasedAnalytics(userRole, userId);
    }
    return await fetchAdminAnalytics();
  }, [fetchRoleBasedAnalytics, fetchAdminAnalytics]);

  return {
    // Data states
    analyticsData,
    brokerAnalytics,
    supportAnalytics,
    isLoading,
    error,

    // Admin functions
    fetchAdminAnalytics,
    
    // Broker functions
    fetchBrokerAnalytics,
    fetchBrokerTransactions,
    fetchBrokerCommissionAnalytics,
    
    // Support functions
    fetchSupportAnalytics,
    
    // Shared functions
    fetchUserDistribution,
    fetchRevenueData,
    fetchLocationAnalytics,
    
    // Utility functions
    fetchRoleBasedAnalytics,
    refreshAnalytics,
    setAnalyticsData,
    setBrokerAnalytics,
    setSupportAnalytics,
  };
};