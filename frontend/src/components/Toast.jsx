import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

const Toast = ({ show, message, type = 'info', onClose, theme, duration = 5000 }) => {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const typeConfig = {
    error: {
      bg: theme === 'dark' ? 'bg-red-900/90' : 'bg-red-50',
      border: theme === 'dark' ? 'border-red-700' : 'border-red-200',
      text: theme === 'dark' ? 'text-red-200' : 'text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />
    },
    success: {
      bg: theme === 'dark' ? 'bg-green-900/90' : 'bg-green-50',
      border: theme === 'dark' ? 'border-green-700' : 'border-green-200',
      text: theme === 'dark' ? 'text-green-200' : 'text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    info: {
      bg: theme === 'dark' ? 'bg-blue-900/90' : 'bg-blue-50',
      border: theme === 'dark' ? 'border-blue-700' : 'border-blue-200',
      text: theme === 'dark' ? 'text-blue-200' : 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-500" />
    },
    warning: {
      bg: theme === 'dark' ? 'bg-yellow-900/90' : 'bg-yellow-50',
      border: theme === 'dark' ? 'border-yellow-700' : 'border-yellow-200',
      text: theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`${config.bg} ${config.border} border rounded-lg shadow-lg p-4 max-w-sm`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {config.icon}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${config.text}`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`ml-4 flex-shrink-0 ${config.text} hover:opacity-70`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;