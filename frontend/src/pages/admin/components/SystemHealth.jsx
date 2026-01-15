// frontend/src/pages/admin/components/SystemHealth.jsx
import React, { useState, useEffect } from "react";
import {
  Server,
  Database,
  Activity,
  Shield,
  Cpu,
  HardDrive,
  Network,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  Download,
  Bell,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Users
} from "lucide-react";
import { httpClient } from "../../../services/http.service";

const SystemHealth = ({ theme, setToast }) => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [services, setServices] = useState({});

  const fetchSystemHealth = async () => {
    try {
      setRefreshing(true);
      
      // Define all microservices
      const microservices = {
        USER_SERVICE: { name: "User Service", url: "http://localhost:5000/api/health" },
        PROPERTY_SERVICE: { name: "Property Service", url: "http://localhost:5002/api/health" },
        COMMUNICATION_SERVICE: { name: "Communication Service", url: "http://localhost:5001/api/health" },
        TRANSACTION_SERVICE: { name: "Transaction Service", url: "http://localhost:5006/api/health" },
        SUPPORT_SERVICE: { name: "Support Service", url: "http://localhost:5005/api/health" },
        TODO_SERVICE: { name: "Todo Service", url: "http://localhost:5003/api/health" },
        REGISTRY_SERVICE: { name: "Registry Service", url: "http://localhost:5008/api/health" }
      };

      // Check each service
      const serviceStatuses = {};
      for (const [key, service] of Object.entries(microservices)) {
        try {
          const response = await httpClient.get(service.url, { timeout: 3000 });
          serviceStatuses[key] = {
            ...service,
            status: "healthy",
            responseTime: response.responseTime || "N/A",
            details: response.data || {}
          };
        } catch (error) {
          serviceStatuses[key] = {
            ...service,
            status: "error",
            responseTime: "N/A",
            error: error.message
          };
        }
      }

      setServices(serviceStatuses);

      // Get overall system health
      const response = await httpClient.get("http://localhost:5000/api/system/health");
      setSystemHealth(response.data || response);
      
      // Fetch additional metrics
      try {
        const metricsResponse = await httpClient.get("http://localhost:5000/api/system/metrics");
        setMetrics(metricsResponse.data || metricsResponse);
      } catch (error) {
        setMetrics({
          requestsPerMinute: 0,
          errorRate: 0,
          activeUsers: 0,
          avgResponseTime: 0,
        });
      }
      
      // Fetch recent logs
      try {
        const logsResponse = await httpClient.get("http://localhost:5000/api/system/logs");
        setLogs(logsResponse.data || logsResponse || []);
      } catch (error) {
        setLogs([]);
      }
      
    } catch (error) {
      console.error("Error fetching system health:", error);
      
      // Fallback mock data for services
      const mockServices = {
        USER_SERVICE: { name: "User Service", url: "http://localhost:5000", status: "unknown" },
        PROPERTY_SERVICE: { name: "Property Service", url: "http://localhost:5002", status: "unknown" },
        COMMUNICATION_SERVICE: { name: "Communication Service", url: "http://localhost:5001", status: "unknown" },
        TRANSACTION_SERVICE: { name: "Transaction Service", url: "http://localhost:5006", status: "unknown" },
        SUPPORT_SERVICE: { name: "Support Service", url: "http://localhost:5005", status: "unknown" },
        TODO_SERVICE: { name: "Todo Service", url: "http://localhost:5003", status: "unknown" },
        REGISTRY_SERVICE: { name: "Registry Service", url: "http://localhost:5008", status: "unknown" }
      };
      setServices(mockServices);
      
      // Fallback for other data
      setSystemHealth({
        overall: "unknown",
        lastUpdated: new Date().toISOString(),
      });
      
      setMetrics({
        requestsPerMinute: 0,
        errorRate: 0,
        activeUsers: 0,
        avgResponseTime: 0,
      });
      
      setLogs([]);
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchSystemHealth();
    setToast({
      show: true,
      message: "System health data refreshed",
      type: "success",
    });
  };

  const toggleDetails = (service) => {
    setShowDetails(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'warning': return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30';
      case 'error': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'unknown': return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'error': return <XCircle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'info': return 'text-blue-600 dark:text-blue-400';
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'info': return <Bell className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatUptime = (uptime) => {
    if (!uptime) return 'N/A';
    if (typeof uptime === 'string') return uptime;
    
    const seconds = parseInt(uptime);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Microservices Health Dashboard
          </h2>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Last updated: {formatTimestamp(systemHealth?.lastUpdated)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Microservices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(services).map(([key, service]) => (
          <div
            key={key}
            className={`p-4 rounded-xl border transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(service.status)}`}>
                  {getStatusIcon(service.status)}
                </div>
                <div>
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {service.name}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Status: <span className="font-medium capitalize">{service.status}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleDetails(key)}
                className={`p-1 rounded ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {showDetails[key] ? '▲' : '▼'}
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  URL
                </span>
                <span className={`font-medium text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {service.url}
                </span>
              </div>
              {service.responseTime && service.responseTime !== "N/A" && (
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Response Time
                  </span>
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {service.responseTime}
                  </span>
                </div>
              )}
            </div>

            {/* Detailed Info */}
            {showDetails[key] && (
              <div className="mt-4 pt-4 border-t border-dashed border-gray-600 dark:border-gray-700 space-y-2">
                {service.error && (
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Error
                    </span>
                    <span className={`font-medium text-red-500 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                      {service.error}
                    </span>
                  </div>
                )}
                {service.details && service.details.uptime && (
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Uptime
                    </span>
                    <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {formatUptime(service.details.uptime)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Performance Metrics - Simplified */}
      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Performance Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Activity className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Requests/Min
              </span>
            </div>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {metrics?.requestsPerMinute || 0}
            </p>
          </div>

          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-4 h-4 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Error Rate
              </span>
            </div>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {metrics?.errorRate || 0}%
            </p>
          </div>

          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Users className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Active Users
              </span>
            </div>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {metrics?.activeUsers || 0}
            </p>
          </div>

          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Avg Response
              </span>
            </div>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {metrics?.avgResponseTime || 0}ms
            </p>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Recent System Logs
          </h3>
          <button
            onClick={() => {
              setToast({
                show: true,
                message: "Log export feature coming soon",
                type: "info",
              });
            }}
            className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-900/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className={`p-2 rounded ${getLogColor(log.type)}`}>
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1">
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {log.message}
                  </p>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    {formatTimestamp(log.timestamp)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(log.type)}`}>
                  {log.type}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                No system logs available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;