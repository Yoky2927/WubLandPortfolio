// components/MaintenanceMode.jsx
import React, { useState } from 'react';
import { useSystemSettings } from '../contexts/SystemSettingsContext';
import { useToast } from '../contexts/ToastContext';
import { Calendar, Clock, AlertTriangle, Settings, Zap, Ban } from 'lucide-react';

const MaintenanceMode = ({ theme }) => {
  const { 
    maintenance, 
    enableMaintenanceMode, 
    disableMaintenanceMode, 
    scheduleMaintenance 
  } = useSystemSettings();
  const { addToast } = useToast();
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    message: 'System is undergoing scheduled maintenance. We apologize for any inconvenience.',
    duration: 2, // hours
    scheduled: false,
    scheduleTime: ''
  });

  const handleEnableMaintenance = () => {
    if (maintenanceForm.scheduled && maintenanceForm.scheduleTime) {
      const scheduled = scheduleMaintenance(
        maintenanceForm.scheduleTime,
        maintenanceForm.duration,
        maintenanceForm.message
      );
      addToast(`Maintenance scheduled for ${new Date(scheduled.startTime).toLocaleString()}`, 'info');
    } else {
      const maintenanceSettings = enableMaintenanceMode(
        maintenanceForm.message,
        maintenanceForm.duration
      );
      addToast('Maintenance mode enabled. Regular users will be redirected.', 'warning');
    }
    
    // Reset form
    setMaintenanceForm({
      message: 'System is undergoing scheduled maintenance. We apologize for any inconvenience.',
      duration: 2,
      scheduled: false,
      scheduleTime: ''
    });
  };

  const handleDisableMaintenance = () => {
    disableMaintenanceMode();
    addToast('Maintenance mode disabled. System is now accessible to all users.', 'success');
  };

  const getTimeRemaining = () => {
    if (!maintenance.enabled || !maintenance.estimatedEndTime) return null;
    
    const now = new Date();
    const endTime = new Date(maintenance.estimatedEndTime);
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Maintenance should be complete';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className={`p-6 rounded-xl border backdrop-blur-sm ${
      theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <Settings className={`w-6 h-6 ${
          maintenance.enabled ? 'text-yellow-500' : 'text-gray-500'
        }`} />
        <h3 className={`text-lg font-semibold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Maintenance Mode
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          maintenance.enabled 
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {maintenance.enabled ? 'ACTIVE' : 'INACTIVE'}
        </div>
      </div>

      {maintenance.enabled ? (
        <div className="space-y-4">
          {/* Current Maintenance Status */}
          <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${
            theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h4 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Maintenance Active
              </h4>
            </div>
            <p className={`text-sm mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {maintenance.message}
            </p>
            {maintenance.startTime && (
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Started: {new Date(maintenance.startTime).toLocaleString()}
              </div>
            )}
            {maintenance.estimatedEndTime && (
              <div className={`text-xs font-medium ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                {getTimeRemaining()}
              </div>
            )}
          </div>

          <button
            onClick={handleDisableMaintenance}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Disable Maintenance Mode
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Maintenance Configuration */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Maintenance Message
            </label>
            <textarea
              value={maintenanceForm.message}
              onChange={(e) => setMaintenanceForm(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Enter maintenance message for users..."
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Estimated Duration (hours)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={maintenanceForm.duration}
              onChange={(e) => setMaintenanceForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Schedule Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="scheduleMaintenance"
              checked={maintenanceForm.scheduled}
              onChange={(e) => setMaintenanceForm(prev => ({ ...prev, scheduled: e.target.checked }))}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="scheduleMaintenance" className={`text-sm ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Schedule for later
            </label>
          </div>

          {maintenanceForm.scheduled && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Schedule Time
              </label>
              <input
                type="datetime-local"
                value={maintenanceForm.scheduleTime}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, scheduleTime: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          )}

          <button
            onClick={handleEnableMaintenance}
            className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
          >
            {maintenanceForm.scheduled ? (
              <>
                <Calendar className="w-4 h-4" />
                Schedule Maintenance
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                Enable Maintenance Mode Now
              </>
            )}
          </button>

          <div className={`p-3 rounded-lg border ${
            theme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
              }`}>
                Note for Super Admins
              </span>
            </div>
            <p className={`text-xs ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>
              When maintenance mode is active, regular users will see a maintenance page. 
              Super admins can still access the system normally to perform updates and maintenance tasks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceMode;