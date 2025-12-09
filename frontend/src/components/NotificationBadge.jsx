import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

const NotificationBadge = ({ 
  count = 0, 
  onClick, 
  theme = 'dark', 
  size = 'md',
  pulse = true 
}) => {
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Trigger pulse animation when count changes
  useEffect(() => {
    if (count > 0 && pulse) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [count, pulse]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-300 hover:text-white hover:from-gray-700 hover:to-gray-800 shadow-lg border border-gray-700'
            : 'bg-gradient-to-br from-white to-gray-50 text-gray-600 hover:text-gray-900 hover:from-gray-100 hover:to-gray-200 shadow-lg border border-gray-200'
        } ${isPulsing ? 'ring-2 ring-amber-500 ring-opacity-50' : ''}`}
        aria-label={`Notifications ${count > 0 ? `(${count} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className={`absolute -top-1 -right-1 text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1
            ${theme === 'dark' 
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg' 
              : 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-lg'
            } ${count > 99 ? 'text-[10px] px-0.5' : 'px-1'}`}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      
      {/* Subtle glow effect for dark theme */}
      {theme === 'dark' && count > 0 && (
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md -z-10"></div>
      )}
    </div>
  );
};

export default NotificationBadge;