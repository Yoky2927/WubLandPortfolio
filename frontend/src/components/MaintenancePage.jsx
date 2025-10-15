// components/MaintenancePage.jsx
import React from 'react';
import { useSystemSettings } from '../contexts/SystemSettingsContext';
import { Settings, Clock, RefreshCw, Mail } from 'lucide-react';

const MaintenancePage = ({ theme }) => {
  const { maintenance } = useSystemSettings();

  const getTimeRemaining = () => {
    if (!maintenance.estimatedEndTime) return null;
    
    const now = new Date();
    const endTime = new Date(maintenance.estimatedEndTime);
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Maintenance complete - refreshing shortly';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `Estimated ${hours}h ${minutes}m remaining`;
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full p-8 rounded-2xl border-2 backdrop-blur-lg text-center ${
        theme === 'dark' 
          ? 'bg-gray-800/80 border-gray-700 text-white' 
          : 'bg-white/80 border-gray-200 text-gray-900'
      }`}>
        {/* Animated Icon */}
        <div className="relative mb-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-100'
          }`}>
            <Settings className="w-10 h-10 text-yellow-500 animate-spin" />
          </div>
          <div className={`absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 animate-spin`} 
               style={{ animationDuration: '2s' }} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-4">
          System Maintenance
        </h1>

        {/* Message */}
        <p className={`text-lg mb-6 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {maintenance.message || 'We are performing scheduled maintenance to improve your experience.'}
        </p>

        {/* Progress/Time Information */}
        {maintenance.startTime && (
          <div className={`p-4 rounded-lg mb-6 ${
            theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">Maintenance Progress</span>
            </div>
            {getTimeRemaining() && (
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {getTimeRemaining()}
              </p>
            )}
            <p className={`text-xs mt-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Started: {new Date(maintenance.startTime).toLocaleString()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              theme === 'dark'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Check Again
          </button>

          <button
            onClick={() => window.location.href = 'mailto:support@wubland.com'}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 border transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                : 'border-gray-300 hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </button>
        </div>

        {/* Footer Note */}
        <p className={`text-xs mt-6 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Thank you for your patience. We're working hard to bring you an improved experience.
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;