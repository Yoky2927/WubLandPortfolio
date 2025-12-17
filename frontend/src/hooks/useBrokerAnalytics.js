// hooks/useBrokerAnalytics.js
import { useState, useCallback } from "react";
import { analyticsClient } from "../services/http.service";

export const useBrokerAnalytics = (brokerId) => {
  const [brokerAnalytics, setBrokerAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState("monthly");

  // Fetch broker analytics
  const fetchBrokerAnalytics = useCallback(async (brokerId, timeframe = "monthly") => {
    if (!brokerId) return null;

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
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          data: [0, 0, 0, 0, 0, 0],
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
    if (!brokerId) return { transactions: [], stats: {} };

    try {
      console.log(`📊 Fetching broker transactions for ID: ${brokerId}`);

      const response = await analyticsClient.get(
        `/brokers/${brokerId}/transactions?timeframe=${timeframe}`
      );

      const data = response.data || { transactions: [], stats: {} };
      setTransactions(data.transactions || []);
      return data;
    } catch (err) {
      console.error("❌ Error fetching broker transactions:", err);
      setTransactions([]);
      return { transactions: [], stats: {} };
    }
  }, []);

  // Fetch broker commission analytics
  const fetchBrokerCommissionAnalytics = useCallback(async (brokerId) => {
    if (!brokerId) return { commissions: [], totalCommission: 0, trends: [] };

    try {
      console.log(`📊 Fetching commission analytics for broker ID: ${brokerId}`);

      const response = await analyticsClient.get(
        `/brokers/${brokerId}/commissions`
      );

      const data = response.data || { commissions: [], totalCommission: 0, trends: [] };
      setCommissions(data.commissions || []);
      return data;
    } catch (err) {
      console.error("❌ Error fetching commission analytics:", err);
      setCommissions([]);
      return { commissions: [], totalCommission: 0, trends: [] };
    }
  }, []);

  // Fetch all broker data
  const fetchBrokerData = useCallback(async () => {
    if (!brokerId) return null;

    try {
      setIsLoading(true);
      
      const [analyticsData, transactionsData, commissionsData] = await Promise.all([
        fetchBrokerAnalytics(brokerId, timeframe),
        fetchBrokerTransactions(brokerId, timeframe),
        fetchBrokerCommissionAnalytics(brokerId),
      ]);

      const result = {
        analytics: analyticsData,
        transactions: transactionsData.transactions || [],
        commissions: commissionsData.commissions || [],
      };

      return result;
    } catch (error) {
      console.error("Error fetching all broker data:", error);
      setError(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [brokerId, timeframe, fetchBrokerAnalytics, fetchBrokerTransactions, fetchBrokerCommissionAnalytics]);

  // Update timeframe
  const updateTimeframe = useCallback((newTimeframe) => {
    setTimeframe(newTimeframe);
  }, []);

  return {
    // Data
    brokerAnalytics,
    transactions,
    commissions,
    timeframe,
    isLoading,
    error,
    
    // Methods
    fetchBrokerData,
    updateTimeframe,
    refreshBrokerAnalytics: () => fetchBrokerAnalytics(brokerId, timeframe),
    refreshTransactions: () => fetchBrokerTransactions(brokerId, timeframe),
    refreshCommissions: () => fetchBrokerCommissionAnalytics(brokerId),
    
    // Individual fetchers (for direct use)
    fetchBrokerAnalytics: () => fetchBrokerAnalytics(brokerId, timeframe),
    fetchBrokerTransactions: () => fetchBrokerTransactions(brokerId, timeframe),
    fetchBrokerCommissionAnalytics: () => fetchBrokerCommissionAnalytics(brokerId),
  };
};