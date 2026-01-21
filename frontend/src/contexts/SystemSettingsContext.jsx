// contexts/SystemSettingsContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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
    overall: 'healthy', 
    message: 'All systems operational'
  });
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(true);
  
  // REMOVE systemMetrics - it's causing unnecessary API calls
  // REMOVE maintenance state - not needed for modal
  // REMOVE systemLogs - not needed for modal
  
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

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('systemSettings', JSON.stringify(newSettings));
  };

  // REMOVE all API checking functions
  // REMOVE all interval functions
  // REMOVE all maintenance functions
  
  // Load settings only - NO API CALLS
  useEffect(() => {
    loadSettings();
  }, []);

  const value = {
    settings,
    systemStatus,
    securityAlerts,
    isLoading,
    backendAvailable,
    updateSetting,
    // Remove all other functions that make API calls
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};