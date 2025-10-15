// components/EnhancedSystemSettings.jsx
import React, { useState } from 'react';
import { useSystemSettings } from '../contexts/SystemSettingsContext';
import { useToast } from '../contexts/ToastContext';
import { Database, Activity, Trash2 } from 'lucide-react';

const EnhancedSystemSettings = ({ theme }) => {
  const { 
    settings, 
    systemStatus, 
    backendAvailable,
    updateSetting, 
    performBackup, 
    optimizeDatabase, 
    clearCache,
    checkSystemHealth 
  } = useSystemSettings();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState({});

  const handleToggle = async (key, value) => {
    try {
      updateSetting(key, value);
      addToast(`${key.replace(/([A-Z])/g, ' $1')} ${value ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      addToast(`Failed to update ${key}`, 'error');
    }
  };

  const handleInputChange = (key, value) => {
    updateSetting(key, value);
  };

  const handleAction = async (action, actionFunction, successMessage) => {
    setIsLoading(prev => ({ ...prev, [action]: true }));
    try {
      const result = await actionFunction();
      if (result.success) {
        addToast(successMessage, 'success');
      } else {
        addToast(result.message, 'error');
      }
    } catch (error) {
      addToast(`Action failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'healthy': return 'All Systems Operational';
      case 'degraded': return 'Partial Outage';
      case 'error': return 'System Issues';
      default: return 'Checking Status...';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Banner */}
      <div className={`p-4 rounded-lg border ${
        systemStatus.overall === 'healthy' 
          ? 'bg-green-50 border-green-200' 
          : systemStatus.overall === 'degraded'
          ? 'bg-yellow-50 border-yellow-200'
          : systemStatus.overall === 'checking'
          ? 'bg-blue-50 border-blue-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              systemStatus.overall === 'healthy' ? 'bg-green-500' :
              systemStatus.overall === 'degraded' ? 'bg-yellow-500' : 
              systemStatus.overall === 'checking' ? 'bg-blue-500' : 'bg-red-500'
            }`}></div>
            <div>
              <h3 className="font-semibold">System Status</h3>
              <p className="text-sm">{systemStatus.message}</p>
              {systemStatus.details && (
                <p className="text-xs mt-1 text-gray-600">{systemStatus.details}</p>
              )}
              <p className="text-xs mt-1">
                Backend: <span className={backendAvailable ? 'text-green-600' : 'text-red-600'}>
                  {backendAvailable ? 'Available' : 'Unavailable'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={checkSystemHealth}
            className="px-3 py-1 text-sm bg-white border rounded-md hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Platform Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Platform Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Platform Name</label>
              <input
                type="text"
                value={settings.platformName || ''}
                onChange={(e) => handleInputChange('platformName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Default Currency</label>
              <select
                value={settings.defaultCurrency || 'ETB'}
                onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="ETB">Ethiopian Birr (ETB)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Commission Rate (%) - Current: {settings.commissionRate}%
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={settings.commissionRate || 5}
                onChange={(e) => handleInputChange('commissionRate', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>
            <button 
              onClick={() => addToast('Platform settings saved!', 'success')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Platform Settings
            </button>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className={`p-6 rounded-xl border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Feature Management
          </h3>
          <div className="space-y-4">
            {[
              { key: 'userRegistration', label: 'User Registration', description: 'Allow new users to register' },
              { key: 'propertyVerification', label: 'Property Verification', description: 'Require property verification' },
              { key: 'maintenanceMode', label: 'Maintenance Mode', description: 'Put site in maintenance mode' },
              { key: 'emailNotifications', label: 'Email Notifications', description: 'Send email alerts' },
              { key: 'smsNotifications', label: 'SMS Notifications', description: 'Send SMS for critical alerts' },
              { key: 'autoBackup', label: 'Auto Backup', description: 'Automatic daily backups' },
              { key: 'twoFactorAuth', label: 'Two-Factor Authentication', description: 'Require 2FA for admins' },
              { key: 'apiRateLimiting', label: 'API Rate Limiting', description: 'Limit API requests' },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="text-xs text-gray-500">{description}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings[key] || false}
                    onChange={(e) => handleToggle(key, e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Database Management */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Database Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleAction('backup', performBackup, 'Backup completed successfully!')}
            disabled={isLoading.backup}
            className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 disabled:opacity-50"
          >
            <Database className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm font-medium">
              {isLoading.backup ? 'Backing up...' : 'Backup Database'}
            </span>
          </button>
          <button 
            onClick={() => handleAction('optimize', optimizeDatabase, 'Database optimized successfully!')}
            disabled={isLoading.optimize}
            className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-50 transition-colors text-green-600 disabled:opacity-50"
          >
            <Activity className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm font-medium">
              {isLoading.optimize ? 'Optimizing...' : 'Optimize Database'}
            </span>
          </button>
          <button 
            onClick={() => handleAction('clearCache', clearCache, 'Cache cleared successfully!')}
            disabled={isLoading.clearCache}
            className="p-4 border-2 border-dashed border-red-300 rounded-lg hover:bg-red-50 transition-colors text-red-600 disabled:opacity-50"
          >
            <Trash2 className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm font-medium">
              {isLoading.clearCache ? 'Clearing...' : 'Clear Cache'}
            </span>
          </button>
        </div>
      </div>

      {/* API Management */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          API & Integration Settings
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chapa Payment API Key</label>
              <input
                type="password"
                value={settings.chapaApiKey || ''}
                onChange={(e) => handleInputChange('chapaApiKey', e.target.value)}
                placeholder="••••••••••••••••"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Google Maps API Key</label>
              <input
                type="password"
                value={settings.googleMapsApiKey || ''}
                onChange={(e) => handleInputChange('googleMapsApiKey', e.target.value)}
                placeholder="••••••••••••••••"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
          <button 
            onClick={() => addToast('API keys updated!', 'success')}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Update API Keys
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSystemSettings;