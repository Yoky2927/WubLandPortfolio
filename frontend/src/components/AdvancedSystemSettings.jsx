// components/AdvancedSystemSettings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSystemSettings } from '../contexts/SystemSettingsContext';
import { useToast } from '../contexts/ToastContext';
import { useCursorGlow } from '../hooks/useCursorGlow';
import { 
  Database, 
  Activity, 
  Trash2, 
  Shield, 
  AlertTriangle, 
  Cpu, 
  HardDrive,
  Network,
  MemoryStick,
  Zap,
  Lock,
  Ban,
  CheckCircle2,
  RefreshCw,
  Server,
  Settings,
  ShieldCheck,
  Wrench,
  Calendar,
  Clock,
  Users,
  Key,
  Bell,
  Eye,
  EyeOff,
  Download,
  Upload,
  RotateCw,
  Archive,
  FileText,
  ShieldAlert,
  Network as NetworkIcon
} from 'lucide-react';

// Import Maintenance Mode Component
import MaintenanceMode from './MaintenanceMode';

const AdvancedSystemSettings = ({ theme }) => {
  useCursorGlow(); // Apply cursor glow effect

  const { 
    settings, 
    systemStatus, 
    systemMetrics,
    securityAlerts,
    resolveSecurityAlert,
    blockUser,
    blockIP,
    performBackup,
    optimizeDatabase,
    clearCache,
    runSecurityScan,
    updateSetting,
    enableMaintenanceMode,
    disableMaintenanceMode,
    scheduleMaintenance,
    maintenance
  } = useSystemSettings();
  
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState({});
  const [serverStatus, setServerStatus] = useState({
    'user-service': 'checking',
    'communication-service': 'checking',
    'todo-service': 'checking', 
    'analysis-service': 'checking',
    'support-service': 'checking',
    'property-service': 'checking',
    'transaction-service': 'checking'
  });

  const [systemConfig, setSystemConfig] = useState({
    maxFileSize: 50,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    apiRateLimit: 1000,
    backupRetention: 30,
    logLevel: 'info',
    emailNotifications: true,
    smsNotifications: false,
    autoUpdates: true,
    debugMode: false
  });

  // Ensure checkAllServers is declared before use
  const checkAllServers = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, servers: true }));
    
    const servers = [
      { name: 'User Service', key: 'user-service', port: 5000, description: 'Authentication & User Management' },
      { name: 'Communication', key: 'communication-service', port: 5001, description: 'Real-time Chat & Messaging' },
      { name: 'Property Service', key: 'property-service', port: 5002, description: 'Property Listings & Management' },
      { name: 'Todo Service', key: 'todo-service', port: 5003, description: 'Task Management & Workflows' },
      { name: 'Analysis', key: 'analysis-service', port: 5004, description: 'Analytics & Reporting' },
      { name: 'Support', key: 'support-service', port: 5005, description: 'Customer Support & Tickets' },
      { name: 'Transaction', key: 'transaction-service', port: 5006, description: 'Payment Processing & Transactions' }
    ];

    const statusUpdates = await Promise.all(
      servers.map(async (server) => {
        try {
          const response = await fetch(`http://localhost:${server.port}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!response.ok) throw new Error('Service unavailable');
          const data = await response.json();
          return { [server.key]: 'online', details: data };
        } catch {
          return { [server.key]: 'offline', details: null };
        }
      })
    );

    setServerStatus((prev) => ({
      ...prev,
      ...Object.assign({}, ...statusUpdates)
    }));

    setIsLoading((prev) => ({ ...prev, servers: false }));
  }, []);

  // Initialize server status check on component mount
  useEffect(() => {
    checkAllServers();
  }, [checkAllServers]);

  // ADDED: Missing action handler function
  const handleAction = async (action, actionFunction, successMessage) => {
    setIsLoading((prev) => ({ ...prev, [action]: true }));
    try {
      const result = await actionFunction();
      addToast(successMessage, { appearance: 'success' });
      return result;
    } catch (error) {
      addToast('Action failed. Please try again.', { appearance: 'error' });
      throw error;
    } finally {
      setIsLoading((prev) => ({ ...prev, [action]: false }));
    }
  };

  // ADDED: Missing security action handler
  const handleSecurityAction = (alert, action) => {
    if (action === 'block_user' && alert.user) {
      blockUser(alert.user);
      addToast(`User ${alert.user} has been blocked`, 'security');
    } else if (action === 'block_ip') {
      blockIP(alert.source);
      addToast(`IP ${alert.source} has been blocked`, 'security');
    } else if (action === 'resolve') {
      resolveSecurityAlert(alert.id);
      addToast('Security alert resolved', 'info');
    }
  };

  // NEW: System configuration handlers
  const handleConfigChange = (key, value) => {
    setSystemConfig(prev => ({
      ...prev,
      [key]: value
    }));
    updateSetting(key, value);
  };

  // NEW: Export system logs
  const exportSystemLogs = async () => {
    return handleAction('exportLogs', async () => {
      // Simulate log export
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'System logs exported successfully',
            fileUrl: 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
              timestamp: new Date().toISOString(),
              logs: securityAlerts,
              metrics: systemMetrics,
              settings: systemConfig
            }, null, 2))
          });
        }, 2000);
      });
    }, 'System logs exported successfully');
  };

  // NEW: System diagnostics
  const runSystemDiagnostics = async () => {
    return handleAction('diagnostics', async () => {
      await checkAllServers();
      
      // Simulate comprehensive diagnostics
      return new Promise((resolve) => {
        setTimeout(() => {
          const issues = [];
          if (systemMetrics.cpu > 80) issues.push('High CPU usage detected');
          if (systemMetrics.memory > 90) issues.push('High memory usage');
          if (securityAlerts.filter(a => a.status === 'active').length > 0) {
            issues.push('Active security alerts need attention');
          }
          
          resolve({
            success: true,
            issues,
            recommendations: issues.length === 0 ? ['All systems optimal'] : [
              'Consider scaling resources',
              'Review security configurations',
              'Monitor system performance'
            ]
          });
        }, 3000);
      });
    }, 'System diagnostics completed');
  };

  const ServerStatusCard = ({ server }) => {
    const { setIsHovering, glowStyle } = useCursorGlow();

    return (
      <div
        className={`relative p-4 rounded-xl border-2 overflow-hidden transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white/80 border-gray-200'
        } ${
          serverStatus[server.key] === 'online' 
            ? 'hover:border-green-400/50' 
            : serverStatus[server.key] === 'offline'
            ? 'hover:border-red-400/50'
            : 'hover:border-yellow-400/50'
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={glowStyle}
      >
        {/* Cursor-following amber glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at var(--glow-x) var(--glow-y), 
                         rgba(251, 191, 36, 0.1), transparent 40%)`,
            opacity: glowStyle['--glow-x'] ? 1 : 0,
          }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {server.name}
            </span>
            <div className={`w-3 h-3 rounded-full ${
              serverStatus[server.key] === 'online' ? 'bg-green-500 animate-pulse' : 
              serverStatus[server.key] === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
            }`} />
          </div>
          <div className={`text-xs ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Port {server.port} • {server.description}
          </div>
          <div className={`text-sm font-semibold mt-1 ${
            serverStatus[server.key] === 'online' ? 'text-green-500' : 
            serverStatus[server.key] === 'offline' ? 'text-red-500' : 'text-yellow-500'
          }`}>
            {serverStatus[server.key] === 'online' ? 'Online' : 
             serverStatus[server.key] === 'offline' ? 'Offline' : 'Checking...'}
          </div>
        </div>
      </div>
    );
  };

  // NEW: System Configuration Panel
  const SystemConfiguration = () => (
    <div className={`p-6 rounded-2xl border-2 backdrop-blur-lg ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${
          theme === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
        }`}>
          <Settings className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h3 className={`text-xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            System Configuration
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Configure system behavior and limits
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Security Settings */}
        <div className="space-y-4">
          <h4 className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Security</h4>
          
          <div>
            <label className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Max Login Attempts</label>
            <input
              type="number"
              value={systemConfig.maxLoginAttempts}
              onChange={(e) => handleConfigChange('maxLoginAttempts', parseInt(e.target.value))}
              className={`w-full mt-1 px-3 py-2 border rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              min="1"
              max="10"
            />
          </div>

          <div>
            <label className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Session Timeout (min)</label>
            <input
              type="number"
              value={systemConfig.sessionTimeout}
              onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
              className={`w-full mt-1 px-3 py-2 border rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              min="5"
              max="240"
            />
          </div>
        </div>

        {/* File & Storage Settings */}
        <div className="space-y-4">
          <h4 className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Storage</h4>
          
          <div>
            <label className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Max File Size (MB)</label>
            <input
              type="number"
              value={systemConfig.maxFileSize}
              onChange={(e) => handleConfigChange('maxFileSize', parseInt(e.target.value))}
              className={`w-full mt-1 px-3 py-2 border rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Backup Retention (days)</label>
            <input
              type="number"
              value={systemConfig.backupRetention}
              onChange={(e) => handleConfigChange('backupRetention', parseInt(e.target.value))}
              className={`w-full mt-1 px-3 py-2 border rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              min="1"
              max="365"
            />
          </div>
        </div>

        {/* API & Performance Settings */}
        <div className="space-y-4">
          <h4 className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Performance</h4>
          
          <div>
            <label className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>API Rate Limit</label>
            <input
              type="number"
              value={systemConfig.apiRateLimit}
              onChange={(e) => handleConfigChange('apiRateLimit', parseInt(e.target.value))}
              className={`w-full mt-1 px-3 py-2 border rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              min="100"
              max="10000"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Auto Updates</label>
            <button
              onClick={() => handleConfigChange('autoUpdates', !systemConfig.autoUpdates)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                systemConfig.autoUpdates 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                systemConfig.autoUpdates ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>Debug Mode</label>
            <button
              onClick={() => handleConfigChange('debugMode', !systemConfig.debugMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                systemConfig.debugMode 
                  ? 'bg-yellow-500' 
                  : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                systemConfig.debugMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );




  // Server monitoring section
  const ServerMonitor = () => (
    <div className={`p-6 rounded-2xl border-2 backdrop-blur-lg ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${
            theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
          }`}>
            <Server className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Microservices Status
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Real-time service health monitoring
            </p>
          </div>
        </div>
        <button
          onClick={checkAllServers}
          disabled={isLoading.servers}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:opacity-50`}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading.servers ? 'animate-spin' : ''}`} />
          {isLoading.servers ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ServerStatusCard server={{ name: 'User Service', key: 'user-service', port: 5000, description: 'Authentication & User Management' }} />
        <ServerStatusCard server={{ name: 'Communication', key: 'communication-service', port: 5001, description: 'Real-time Chat & Messaging' }} />
        <ServerStatusCard server={{ name: 'Property Service', key: 'property-service', port: 5002, description: 'Property Listings & Management' }} />
        <ServerStatusCard server={{ name: 'Todo Service', key: 'todo-service', port: 5003, description: 'Task Management & Workflows' }} />
        <ServerStatusCard server={{ name: 'Analysis', key: 'analysis-service', port: 5004, description: 'Analytics & Reporting' }} />
        <ServerStatusCard server={{ name: 'Support', key: 'support-service', port: 5005, description: 'Customer Support & Tickets' }} />
        <ServerStatusCard server={{ name: 'Transaction', key: 'transaction-service', port: 5006, description: 'Payment Processing & Transactions' }} />
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Online & Running
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Offline
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Checking
          </span>
        </div>
      </div>
    </div>
  );

  // Quick actions panel
  const QuickActions = () => (
    <div className={`p-6 rounded-2xl border-2 backdrop-blur-lg ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${
          theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
        }`}>
          <Zap className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <h3 className={`text-xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            System Actions
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Quick system operations and maintenance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => handleAction('backup', performBackup, 'Backup completed successfully')}
          disabled={isLoading.backup}
          className={`p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
            theme === 'dark'
              ? 'border-blue-400/30 hover:border-blue-400 bg-blue-900/20'
              : 'border-blue-300 hover:border-blue-400 bg-blue-50'
          } disabled:opacity-50`}
        >
          <div className="flex items-center gap-3">
            <Database className={`w-6 h-6 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <div className="text-left">
              <div className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {isLoading.backup ? 'Backing up...' : 'Backup'}
              </div>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                System backup
              </div>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleAction('optimize', optimizeDatabase, 'Database optimized successfully')}
          disabled={isLoading.optimize}
          className={`p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
            theme === 'dark'
              ? 'border-green-400/30 hover:border-green-400 bg-green-900/20'
              : 'border-green-300 hover:border-green-400 bg-green-50'
          } disabled:opacity-50`}
        >
          <div className="flex items-center gap-3">
            <Activity className={`w-6 h-6 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`} />
            <div className="text-left">
              <div className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {isLoading.optimize ? 'Optimizing...' : 'Optimize'}
              </div>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Database
              </div>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleAction('clearCache', clearCache, 'Cache cleared successfully')}
          disabled={isLoading.clearCache}
          className={`p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
            theme === 'dark'
              ? 'border-red-400/30 hover:border-red-400 bg-red-900/20'
              : 'border-red-300 hover:border-red-400 bg-red-50'
          } disabled:opacity-50`}
        >
          <div className="flex items-center gap-3">
            <Trash2 className={`w-6 h-6 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`} />
            <div className="text-left">
              <div className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {isLoading.clearCache ? 'Clearing...' : 'Clear Cache'}
              </div>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Temporary files
              </div>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleAction('securityScan', runSecurityScan, 'Security scan completed')}
          disabled={isLoading.securityScan}
          className={`p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
            theme === 'dark'
              ? 'border-purple-400/30 hover:border-purple-400 bg-purple-900/20'
              : 'border-purple-300 hover:border-purple-400 bg-purple-50'
          } disabled:opacity-50`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className={`w-6 h-6 ${
              theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <div className="text-left">
              <div className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {isLoading.securityScan ? 'Scanning...' : 'Security Scan'}
              </div>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Threat detection
              </div>
            </div>
          </div>
        </button>

        {/* NEW: Additional Actions */}
        <button 
          onClick={exportSystemLogs}
          disabled={isLoading.exportLogs}
          className={`p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
            theme === 'dark'
              ? 'border-orange-400/30 hover:border-orange-400 bg-orange-900/20'
              : 'border-orange-300 hover:border-orange-400 bg-orange-50'
          } disabled:opacity-50`}
        >
          <div className="flex items-center gap-3">
            <Download className={`w-6 h-6 ${
              theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
            }`} />
            <div className="text-left">
              <div className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {isLoading.exportLogs ? 'Exporting...' : 'Export Logs'}
              </div>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                System logs
              </div>
            </div>
          </div>
        </button>

        <button 
          onClick={runSystemDiagnostics}
          disabled={isLoading.diagnostics}
          className={`p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
            theme === 'dark'
              ? 'border-cyan-400/30 hover:border-cyan-400 bg-cyan-900/20'
              : 'border-cyan-300 hover:border-cyan-400 bg-cyan-50'
          } disabled:opacity-50`}
        >
          <div className="flex items-center gap-3">
            <Wrench className={`w-6 h-6 ${
              theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
            }`} />
            <div className="text-left">
              <div className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {isLoading.diagnostics ? 'Running...' : 'Diagnostics'}
              </div>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                System check
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">


      {/* Server Monitoring */}
      <ServerMonitor />

      {/* Maintenance Mode Section */}
      <MaintenanceMode theme={theme} />

      {/* System Configuration */}
      <SystemConfiguration />

      {/* Quick Actions */}
      <QuickActions />

      {/* Security Alerts */}
      {securityAlerts.filter(alert => alert.status === 'active').length > 0 && (
        <div className={`p-6 rounded-2xl border-2 backdrop-blur-lg ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-red-900/20 to-gray-800 border-red-700/50' 
            : 'bg-gradient-to-br from-red-50 to-white border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
              }`}>
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Security Alerts
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {securityAlerts.filter(alert => alert.status === 'active').length} active threats
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {securityAlerts.filter(alert => alert.status === 'active').map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border-l-4 ${
                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                } ${
                  alert.severity === 'critical' ? 'border-l-red-500' :
                  alert.severity === 'high' ? 'border-l-orange-500' :
                  alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'high' ? 'bg-orange-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <span className={`text-sm font-semibold capitalize ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <h4 className={`font-semibold mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {alert.title}
                    </h4>
                    <p className={`text-sm mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {alert.description}
                    </p>
                    <div className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Source: {alert.source} {alert.user && `• User: ${alert.user}`}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {alert.user && (
                      <button
                        onClick={() => handleSecurityAction(alert, 'block_user')}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Block User"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleSecurityAction(alert, 'block_ip')}
                      className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                      title="Block IP"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSecurityAction(alert, 'resolve')}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Resolve Alert"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSystemSettings;