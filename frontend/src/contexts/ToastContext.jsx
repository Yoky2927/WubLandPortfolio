// contexts/ToastContext.jsx (Updated)
import React, { createContext, useContext, useState } from 'react';
import { useTheme } from './ThemeContext'; // Add this import

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const { theme } = useTheme(); // Get current theme

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const toast = { id, message, type, duration, progress: 100 };
    setToasts(prev => [...prev, toast]);
    
    // Progress animation
    const interval = setInterval(() => {
      setToasts(prev => prev.map(t => 
        t.id === id ? { ...t, progress: Math.max(0, t.progress - (100 / (duration / 50))) } : t
      ));
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastStyles = (type) => {
    const baseStyles = {
      success: theme === 'dark' 
        ? 'bg-green-900/90 border-green-600 text-green-100' 
        : 'bg-green-50 border-green-200 text-green-800',
      error: theme === 'dark'
        ? 'bg-red-900/90 border-red-600 text-red-100'
        : 'bg-red-50 border-red-200 text-red-800',
      warning: theme === 'dark'
        ? 'bg-yellow-900/90 border-yellow-600 text-yellow-100'
        : 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: theme === 'dark'
        ? 'bg-blue-900/90 border-blue-600 text-blue-100'
        : 'bg-blue-50 border-blue-200 text-blue-800',
      security: theme === 'dark'
        ? 'bg-purple-900/90 border-purple-600 text-purple-100'
        : 'bg-purple-50 border-purple-200 text-purple-800'
    };
    return baseStyles[type] || baseStyles.info;
  };

  const getToastIcon = (type) => {
    const icons = {
      success: (
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ),
      error: (
        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ),
      warning: (
        <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      ),
      security: (
        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      ),
      info: (
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    };
    return icons[type] || icons.info;
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border-2 backdrop-blur-lg shadow-2xl transform transition-all duration-300 animate-in slide-in-from-right-8 ${getToastStyles(toast.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getToastIcon(toast.type)}
                  <span className="font-semibold text-sm capitalize">{toast.type}</span>
                </div>
                <p className="text-sm">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2 overflow-hidden">
              <div 
                className="h-full bg-current transition-all duration-50"
                style={{ 
                  width: `${toast.progress}%`,
                  opacity: 0.6
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};