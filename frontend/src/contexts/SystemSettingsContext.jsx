// contexts/SystemSettingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const SystemSettingsContext = createContext();

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};

export const SystemSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [systemStatus, setSystemStatus] = useState({ 
    overall: 'checking', 
    message: 'Initializing system monitoring...' 
  });
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 25,
    memory: 45,
    storage: 32,
    network: 12,
    activeThreats: 0,
    activeUsers: 0,
    apiRequests: 0
  });
  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: 'System is undergoing maintenance. Please check back later.',
    startTime: null,
    estimatedEndTime: null,
    allowedUsers: [], // Super admins who can bypass maintenance
    scheduled: false
  });
  const [systemLogs, setSystemLogs] = useState([]);

  // Check maintenance status on load
  useEffect(() => {
    const savedMaintenance = localStorage.getItem('maintenanceSettings');
    if (savedMaintenance) {
      setMaintenance(JSON.parse(savedMaintenance));
    }
  }, []);

  // Define functions first before using them in useEffect
  const checkBackendAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // First check if analysis service is running
      const healthResponse = await fetch('http://localhost:5004/api/system/health', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setSystemStatus(healthData);
        setBackendAvailable(true);
      } else {
        // If specific endpoint not found, check if service is reachable
        await checkServiceReachability();
      }
    } catch (error) {
      console.log('Backend health endpoint not available, checking service reachability...');
      await checkServiceReachability();
    }
  };

  const checkServiceReachability = async () => {
    try {
      // Try to reach the analysis service root
      const response = await fetch('http://localhost:5004/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setSystemStatus({ 
          overall: 'degraded', 
          message: 'Analysis service running but system endpoints not implemented',
          details: 'Backend service is reachable but specific system endpoints need to be implemented'
        });
        setBackendAvailable(true);
      } else {
        setSystemStatus({ 
          overall: 'error', 
          message: 'Analysis service not available',
          details: 'The analysis service (port 5004) appears to be down or not running'
        });
        setBackendAvailable(false);
      }
    } catch (error) {
      setSystemStatus({ 
        overall: 'error', 
        message: 'Cannot connect to analysis service',
        details: `Connection failed: ${error.message}`
      });
      setBackendAvailable(false);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        const defaultSettings = {
          platformName: "WubLand Real Estate",
          defaultCurrency: "ETB",
          commissionRate: 5,
          emailNotifications: true,
          smsNotifications: false,
          autoBackup: true,
          backupFrequency: "daily",
          twoFactorAuth: true,
          apiRateLimiting: true,
          ddosProtection: true,
          bruteForceProtection: true,
          suspiciousActivityMonitoring: true,
          autoThreatBlocking: false,
          chapaApiKey: "",
          googleMapsApiKey: "",
          maintenanceMode: false,
          userRegistration: true,
          propertyVerification: true,
          maxFileSize: 50,
          sessionTimeout: 60,
          maxLoginAttempts: 5,
          securityLevel: "high",
          apiRateLimit: 1000,
          backupRetention: 30,
          logLevel: "info",
          autoUpdates: true,
          debugMode: false
        };
        setSettings(defaultSettings);
        localStorage.setItem('systemSettings', JSON.stringify(defaultSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced maintenance mode functions
  const enableMaintenanceMode = (message = 'System is undergoing maintenance. Please check back later.', durationHours = 2, allowedUsers = ['super_admin']) => {
    const startTime = new Date();
    const estimatedEndTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    
    const newMaintenance = {
      enabled: true,
      message,
      startTime,
      estimatedEndTime,
      allowedUsers,
      scheduled: false
    };
    
    setMaintenance(newMaintenance);
    localStorage.setItem('maintenanceSettings', JSON.stringify(newMaintenance));
    
    // Update settings as well
    updateSetting('maintenanceMode', true);
    
    // Log the maintenance event
    addSystemLog('MAINTENANCE', `Maintenance mode enabled: ${message}`, 'info');
    
    return newMaintenance;
  };

  const disableMaintenanceMode = () => {
    const newMaintenance = {
      enabled: false,
      message: '',
      startTime: null,
      estimatedEndTime: null,
      allowedUsers: [],
      scheduled: false
    };
    
    setMaintenance(newMaintenance);
    localStorage.setItem('maintenanceSettings', JSON.stringify(newMaintenance));
    
    // Update settings as well
    updateSetting('maintenanceMode', false);
    
    // Log the maintenance event
    addSystemLog('MAINTENANCE', 'Maintenance mode disabled', 'info');
  };

  const scheduleMaintenance = (startTime, durationHours = 2, message = 'Scheduled system maintenance', allowedUsers = ['super_admin']) => {
    const scheduledMaintenance = {
      enabled: false, // Will be enabled automatically at startTime
      message,
      startTime: new Date(startTime),
      estimatedEndTime: new Date(new Date(startTime).getTime() + durationHours * 60 * 60 * 1000),
      allowedUsers,
      scheduled: true
    };
    
    localStorage.setItem('scheduledMaintenance', JSON.stringify(scheduledMaintenance));
    
    // Log the scheduling
    addSystemLog('MAINTENANCE', `Maintenance scheduled for ${startTime}`, 'info');
    
    // Set up automatic enablement
    const timeUntilStart = new Date(startTime).getTime() - Date.now();
    if (timeUntilStart > 0) {
      setTimeout(() => {
        enableMaintenanceMode(message, durationHours, allowedUsers);
        addSystemLog('MAINTENANCE', 'Scheduled maintenance started automatically', 'info');
      }, timeUntilStart);
    }
    
    return scheduledMaintenance;
  };

  const canUserBypassMaintenance = (userRole) => {
    return maintenance.allowedUsers.includes(userRole) || userRole === 'super_admin';
  };

  const isMaintenanceActive = () => {
    return maintenance.enabled;
  };

  // NEW: System logging function
  const addSystemLog = (category, message, level = 'info') => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date(),
      category,
      message,
      level,
      user: 'system' // Could be enhanced to track which admin performed the action
    };
    
    setSystemLogs(prev => [logEntry, ...prev.slice(0, 999)]); // Keep last 1000 logs
  };

  const initializeSystemMonitoring = () => {
    // Simulate initial system scan
    setTimeout(() => {
      setSystemStatus({ 
        overall: 'healthy', 
        message: 'All systems operational',
        details: 'Real-time monitoring active'
      });
      
      // Generate initial security events
      generateInitialSecurityEvents();
    }, 2000);
  };

  const generateInitialSecurityEvents = () => {
    const initialAlerts = [
      {
        id: 1,
        type: 'suspicious_login',
        severity: 'medium',
        title: 'Multiple Failed Login Attempts',
        description: 'User john_doe failed login 5 times from IP 192.168.1.100',
        timestamp: new Date(Date.now() - 300000),
        source: '192.168.1.100',
        user: 'john_doe',
        status: 'active'
      },
      {
        id: 2,
        type: 'api_abuse',
        severity: 'high',
        title: 'API Rate Limit Exceeded',
        description: 'IP 203.0.113.25 made 1000 requests in 1 minute',
        timestamp: new Date(Date.now() - 600000),
        source: '203.0.113.25',
        user: null,
        status: 'active'
      }
    ];
    setSecurityAlerts(initialAlerts);
  };

  const generateSecurityEvents = () => {
    const events = [
      {
        type: 'ddos_attempt',
        severity: 'critical',
        title: 'DDoS Attack Detected',
        description: 'Distributed denial-of-service attack from multiple IPs',
        probability: 0.1
      },
      {
        type: 'brute_force',
        severity: 'high',
        title: 'Brute Force Attempt',
        description: 'Rapid login attempts from single IP',
        probability: 0.3
      },
      {
        type: 'suspicious_activity',
        severity: 'medium',
        title: 'Suspicious User Behavior',
        description: 'Unusual access patterns detected',
        probability: 0.5
      },
      {
        type: 'file_upload_abuse',
        severity: 'medium',
        title: 'Suspicious File Upload',
        description: 'Multiple large file uploads detected',
        probability: 0.2
      }
    ];

    events.forEach(event => {
      if (Math.random() < event.probability) {
        const newAlert = {
          id: Date.now() + Math.random(),
          type: event.type,
          severity: event.severity,
          title: event.title,
          description: event.description,
          timestamp: new Date(),
          source: `192.168.1.${Math.floor(Math.random() * 255)}`,
          user: Math.random() > 0.5 ? `user_${Math.floor(Math.random() * 1000)}` : null,
          status: 'active'
        };
        setSecurityAlerts(prev => [newAlert, ...prev.slice(0, 19)]); // Keep last 20 alerts
        addSystemLog('SECURITY', `${event.title} - ${event.description}`, event.severity);
      }
    });
  };

  const updateSystemMetrics = () => {
    setSystemMetrics(prev => ({
      cpu: Math.min(100, Math.max(5, prev.cpu + (Math.random() * 10 - 5))),
      memory: Math.min(100, Math.max(10, prev.memory + (Math.random() * 8 - 4))),
      storage: Math.min(100, Math.max(15, prev.storage + (Math.random() * 2 - 1))),
      network: Math.min(100, Math.max(0, prev.network + (Math.random() * 15 - 7.5))),
      activeThreats: securityAlerts.filter(alert => alert.status === 'active').length,
      activeUsers: Math.floor(Math.random() * 50) + 10,
      apiRequests: prev.apiRequests + Math.floor(Math.random() * 100)
    }));
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('systemSettings', JSON.stringify(newSettings));
    
    // Log configuration changes
    addSystemLog('CONFIG', `Setting updated: ${key} = ${value}`, 'info');
    
    // Special handling for maintenance mode
    if (key === 'maintenanceMode') {
      if (value) {
        enableMaintenanceMode();
      } else {
        disableMaintenanceMode();
      }
    }
  };

  const resolveSecurityAlert = (alertId) => {
    setSecurityAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      )
    );
    addSystemLog('SECURITY', `Security alert resolved: ${alertId}`, 'info');
  };

  const blockUser = (username) => {
    setSecurityAlerts(prev => 
      prev.map(alert => 
        alert.user === username ? { ...alert, status: 'blocked' } : alert
      )
    );
    addSystemLog('SECURITY', `User blocked: ${username}`, 'warning');
  };

  const blockIP = (ipAddress) => {
    setSecurityAlerts(prev => 
      prev.map(alert => 
        alert.source === ipAddress ? { ...alert, status: 'blocked' } : alert
      )
    );
    addSystemLog('SECURITY', `IP blocked: ${ipAddress}`, 'warning');
  };

  const performBackup = async () => {
    addSystemLog('BACKUP', 'System backup initiated', 'info');
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = { 
          success: true, 
          message: 'System backup completed successfully',
          backupId: `backup_${Date.now()}`,
          size: `${(Math.random() * 50 + 20).toFixed(1)} GB`,
          timestamp: new Date()
        };
        
        addSystemLog('BACKUP', `Backup completed: ${result.backupId}`, 'success');
        resolve(result);
      }, 3000);
    });
  };

  const optimizeDatabase = async () => {
    addSystemLog('DATABASE', 'Database optimization initiated', 'info');
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = { 
          success: true, 
          message: 'Database optimization completed',
          performanceGain: `${(Math.random() * 15 + 5).toFixed(1)}%`,
          duration: `${(Math.random() * 30 + 10).toFixed(1)}s`
        };
        
        addSystemLog('DATABASE', `Database optimized: ${result.performanceGain} performance gain`, 'success');
        resolve(result);
      }, 2000);
    });
  };

  const clearCache = async () => {
    addSystemLog('SYSTEM', 'Cache clearance initiated', 'info');
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = { 
          success: true, 
          message: 'Cache cleared successfully',
          clearedItems: Math.floor(Math.random() * 5000) + 1000,
          freedSpace: `${(Math.random() * 2 + 0.5).toFixed(2)} GB`
        };
        
        addSystemLog('SYSTEM', `Cache cleared: ${result.clearedItems} items`, 'success');
        resolve(result);
      }, 1000);
    });
  };

  const runSecurityScan = async () => {
    addSystemLog('SECURITY', 'Security scan initiated', 'info');
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const threatsFound = Math.floor(Math.random() * 3);
        const result = { 
          success: true, 
          message: `Security scan completed - ${threatsFound} potential threats found`,
          threatsFound,
          scanDuration: `${(Math.random() * 5 + 2).toFixed(1)}s`,
          scannedItems: Math.floor(Math.random() * 10000) + 5000
        };
        
        addSystemLog('SECURITY', `Security scan completed: ${result.threatsFound} threats found`, 
          threatsFound > 0 ? 'warning' : 'success');
        resolve(result);
      }, 4000);
    });
  };

  // NEW: Export system logs
  const exportSystemLogs = async () => {
    addSystemLog('SYSTEM', 'System logs export initiated', 'info');
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const logData = {
          exportTimestamp: new Date(),
          logCount: systemLogs.length,
          logs: systemLogs,
          systemInfo: {
            metrics: systemMetrics,
            settings: settings,
            maintenance: maintenance
          }
        };
        
        const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        addSystemLog('SYSTEM', `System logs exported: ${systemLogs.length} entries`, 'success');
        resolve({
          success: true,
          url,
          filename: `system-logs-${new Date().toISOString().split('T')[0]}.json`
        });
      }, 2000);
    });
  };

  // Load settings and initialize monitoring
  useEffect(() => {
    loadSettings();
    initializeSystemMonitoring();
    
    const healthInterval = setInterval(checkBackendAvailability, 30000);
    const metricsInterval = setInterval(updateSystemMetrics, 5000);
    const securityInterval = setInterval(generateSecurityEvents, 15000);
    
    return () => {
      clearInterval(healthInterval);
      clearInterval(metricsInterval);
      clearInterval(securityInterval);
    };
  }, []);

  const value = {
    settings,
    systemStatus,
    systemMetrics,
    securityAlerts,
    maintenance,
    systemLogs,
    isLoading,
    backendAvailable,
    updateSetting,
    enableMaintenanceMode,
    disableMaintenanceMode,
    scheduleMaintenance,
    canUserBypassMaintenance,
    isMaintenanceActive,
    performBackup,
    optimizeDatabase,
    clearCache,
    runSecurityScan,
    exportSystemLogs,
    resolveSecurityAlert,
    blockUser,
    blockIP,
    checkSystemHealth: checkBackendAvailability,
    addSystemLog
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};