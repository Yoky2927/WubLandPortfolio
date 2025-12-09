import { useState, useCallback } from "react";
import { analyticsClient } from "../services/http.service";
import { API_CONFIG } from "../config/api.config";

export const useAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch comprehensive analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Debug: Log the URLs being used
      console.log("=== ANALYTICS DEBUG ===");
      console.log("Analytics URL:", API_CONFIG.ANALYTICS_URL);
      console.log(
        "Dashboard endpoint:",
        API_CONFIG.ENDPOINTS.DASHBOARD_ANALYTICS
      );
      console.log(
        "Full URL:",
        API_CONFIG.ANALYTICS_URL + API_CONFIG.ENDPOINTS.DASHBOARD_ANALYTICS
      );

      const response = await analyticsClient.get(
        API_CONFIG.ENDPOINTS.DASHBOARD_ANALYTICS
      );

      if (response.data) {
        console.log("✅ Analytics data received:", {
          totalUsers: response.data.totalUsers,
          totalProperties: response.data.totalProperties,
          activeUsers: response.data.activeUsers,
        });
        setAnalyticsData(response.data);
        return response.data;
      }
    } catch (err) {
      console.error("❌ Error fetching analytics data:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          baseURL: err.config?.baseURL,
        },
      });
      setError(err.message || "Failed to fetch analytics");

      // Return empty data structure
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

  // Fetch user distribution analytics (if you need separate endpoint)
  const fetchUserDistribution = useCallback(async () => {
    try {
      const response = await analyticsClient.get("/api/analytics/users");
      return response.data;
    } catch (err) {
      console.error("Error fetching user distribution:", err);
      return { byRole: [] };
    }
  }, []);

  // Fetch revenue analytics (if you need separate endpoint)
  const fetchRevenueData = useCallback(async () => {
    try {
      const response = await analyticsClient.get("/api/analytics/transactions");
      return response.data;
    } catch (err) {
      console.error("Error fetching revenue data:", err);
      return { monthlyRevenue: [], totalRevenue: 0 };
    }
  }, []);

  // Fetch active users count (already in main dashboard data)
  const fetchActiveUsers = useCallback(async () => {
    try {
      // Use main dashboard data if available
      if (analyticsData) {
        return {
          count: analyticsData.activeUsers || 0,
          trend: analyticsData.activeTrend || "0%",
        };
      }

      // Otherwise fetch from dashboard endpoint
      const data = await fetchAnalyticsData();
      return {
        count: data?.activeUsers || 0,
        trend: data?.activeTrend || "0%",
      };
    } catch (err) {
      console.error("Error fetching active users:", err);
      return { count: 0, trend: "+0%" };
    }
  }, [analyticsData, fetchAnalyticsData]);

  // Fetch deal analytics (already in main dashboard data)
  const fetchDealAnalytics = useCallback(async () => {
    try {
      // Use main dashboard data if available
      if (analyticsData) {
        return analyticsData.dealAnalytics || {};
      }

      // Otherwise fetch from dashboard endpoint
      const data = await fetchAnalyticsData();
      return data?.dealAnalytics || {};
    } catch (err) {
      console.error("Error fetching deal analytics:", err);
      return {};
    }
  }, [analyticsData, fetchAnalyticsData]);

  // Fetch location analytics for map (already in main dashboard data)
  const fetchLocationAnalytics = useCallback(async () => {
    try {
      // Use main dashboard data if available
      if (analyticsData) {
        return analyticsData.locationAnalytics || [];
      }

      // Otherwise fetch from dashboard endpoint
      const data = await fetchAnalyticsData();
      return data?.locationAnalytics || [];
    } catch (err) {
      console.error("Error fetching location analytics:", err);
      return [];
    }
  }, [analyticsData, fetchAnalyticsData]);

  return {
    analyticsData,
    isLoading,
    error,
    fetchAnalyticsData,
    fetchUserDistribution,
    fetchRevenueData,
    fetchActiveUsers,
    fetchDealAnalytics,
    fetchLocationAnalytics,
    setAnalyticsData,
    refreshAnalytics: fetchAnalyticsData,
  };
};
