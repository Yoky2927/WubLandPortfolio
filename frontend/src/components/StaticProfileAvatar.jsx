// components/StaticProfileAvatar.jsx
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const StaticProfileAvatar = ({
  userProfilePicture,
  firstName,
  lastName,
  username,
  email,
  role,
  broker_type,
  size = 'xl'
}) => {
  const { theme } = useTheme();

  const normalizeRole = (role, brokerType) => {
    if (!role) return { normalized: 'default', display: 'User' };
    const roleLower = role.toLowerCase().trim();
    const brokerTypeLower = brokerType ? brokerType.toLowerCase().trim() : '';
    
    const roleMap = {
      'admin': { normalized: 'admin', display: 'Administrator' },
      'support_agent': { normalized: 'support_agent', display: 'Support Agent' },
      'broker': { 
        normalized: 'broker', 
        display: brokerTypeLower === 'internal' ? 'Internal Broker' : 'External Broker'
      },
      'seller': { normalized: 'seller', display: 'Property Seller' },
      'buyer': { normalized: 'buyer', display: 'Property Buyer' },
      'default': { normalized: 'default', display: 'User' }
    };
    return roleMap[roleLower] || roleMap.default;
  };

  const { display: roleDisplay } = normalizeRole(role, broker_type);

  const getInitials = () => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleColor = () => {
    const colors = {
      admin: "bg-red-600",
      support_agent: "bg-teal-500",
      broker: "bg-blue-500",
      seller: "bg-green-500",
      buyer: "bg-purple-500",
      default: "bg-amber-500",
    };
    return colors[role?.toLowerCase()] || colors.default;
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-40 h-40'
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="relative">
        {userProfilePicture ? (
          <img
            src={userProfilePicture}
            alt="Profile"
            className={`${sizeClasses[size]} rounded-full object-cover border-2 ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            } shadow-lg`}
          />
        ) : (
          <div
            className={`${sizeClasses[size]} ${getRoleColor()} rounded-full flex items-center justify-center text-white font-semibold border-2 ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            } shadow-lg`}
          >
            {getInitials()}
          </div>
        )}
      </div>
      
      <div className="text-center mt-3">
        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
          {firstName} {lastName}
        </p>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate mt-1`}>
          @{username}
        </p>
        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} truncate mt-1`}>
          {email}
        </p>
        <p className={`text-xs ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} mt-1`}>
          {roleDisplay}
        </p>
      </div>
    </div>
  );
};

export default StaticProfileAvatar;