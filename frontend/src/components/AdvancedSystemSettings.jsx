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
  Clock
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
    runSecurityScan
  } = useSystemSettings(); // FIXED: Changed from useToast() to useSystemSettings()
  
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

  // Ensure checkAllServers is declared before use
  const checkAllServers = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, servers: true }));
    
    const servers = [
      { name: 'user-service', url: 'http://localhost:5000/health' },
      { name: 'communication-service', url: 'http://localhost:5001/health' },
      { name: 'todo-service', url: 'http://localhost:5003/health' },
      { name: 'analysis-service', url: 'http://localhost:5004/health' },
      { name: 'support-service', url: 'http://localhost:5005/health' },
      { name: 'property-service', url: 'http://localhost:5002/health' },
      { name: 'transaction-service', url: 'http://localhost:5006/health' }
    ];

    const statusUpdates = await Promise.all(
      servers.map(async (server) => {
        try {
          const response = await fetch(server.url);
          if (!response.ok) throw new Error('Service unavailable');
          return { [server.name]: 'online' };
        } catch {
          return { [server.name]: 'offline' };
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
      await actionFunction();
      addToast(successMessage, { appearance: 'success' });
    } catch {
      addToast('Action failed. Please try again.', { appearance: 'error' });
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
            Port {server.port}
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
        <ServerStatusCard server={{ name: 'User Service', key: 'user-service', port: 5000 }} />
        <ServerStatusCard server={{ name: 'Communication', key: 'communication-service', port: 5001 }} />
        <ServerStatusCard server={{ name: 'Todo Service', key: 'todo-service', port: 5003 }} />
        <ServerStatusCard server={{ name: 'Analysis', key: 'analysis-service', port: 5004 }} />
        <ServerStatusCard server={{ name: 'Support', key: 'support-service', port: 5005 }} />
        <ServerStatusCard server={{ name: 'Property Service', key: 'property-service', port: 5002 }} />
        <ServerStatusCard server={{ name: 'Transaction', key: 'transaction-service', port: 5006 }} />
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
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Server Monitoring */}
      <ServerMonitor />

      {/* Maintenance Mode Section */}
      <MaintenanceMode theme={theme} />

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