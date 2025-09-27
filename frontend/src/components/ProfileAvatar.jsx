import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Settings,
  LogOut,
  Edit3,
  Shield,
  Home,
  MessageSquare,
  BarChart3,
  Users as UsersIcon,
  CreditCard,
  Eye,
  FileText,
  Calendar,
  Bell,
  Star,
  Award,
  BadgeCheck,
  TrendingUp,
  ClipboardList,
  Heart,
  Phone,
  Mail,
  Camera,
  User,
  X
} from 'lucide-react';

const ProfileAvatar = ({
  userProfilePicture,
  firstName,
  lastName,
  username,
  email,
  phone,
  role,
  broker_type,
  status,
  created_at,
  verified,
  size = 'md',
  onLogout,
  onUploadImage,
  onNavigateToSection
}) => {
  const { theme } = useTheme();
  const [showPopup, setShowPopup] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Role normalization with broker types
  const normalizeRole = (role, brokerType) => {
    if (!role) return { normalized: 'default', display: 'User' };

    const roleLower = role.toLowerCase().trim();
    const brokerTypeLower = brokerType ? brokerType.toLowerCase().trim() : '';

    const roleMap = {
      'admin': { normalized: 'admin', display: 'Administrator' },
      'administrator': { normalized: 'admin', display: 'Administrator' },
      'support': { normalized: 'support_agent', display: 'Support Agent' },
      'support_agent': { normalized: 'support_agent', display: 'Support Agent' },
      'support agent': { normalized: 'support_agent', display: 'Support Agent' },
      'agent': { normalized: 'support_agent', display: 'Support Agent' },
      'broker': { 
        normalized: 'broker', 
        display: brokerTypeLower === 'internal' ? 'Internal Broker' : 'External Broker'
      },
      'seller': { normalized: 'seller', display: 'Property Seller' },
      'buyer': { normalized: 'buyer', display: 'Property Buyer' },
      'renter': { normalized: 'renter', display: 'Renter' },
      'leaser': { normalized: 'leaser', display: 'Property Leaser' },
      'lease': { normalized: 'leaser', display: 'Property Leaser' },
      'default': { normalized: 'default', display: 'User' }
    };

    return roleMap[roleLower] || roleMap.default;
  };

  const { normalized: normalizedRole, display: roleDisplay } = normalizeRole(role, broker_type);

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
      renter: "bg-orange-500",
      leaser: "bg-indigo-500",
      default: "bg-amber-500",
    };
    return colors[normalizedRole] || colors.default;
  };

  const getGradientBorder = () => {
    const gradients = {
      admin: "gradient-border-red",
      support_agent: "gradient-border-teal",
      broker: "gradient-border-blue",
      seller: "gradient-border-green",
      buyer: "gradient-border-purple",
      renter: "gradient-border-orange",
      leaser: "gradient-border-indigo",
      default: "gradient-border-amber"
    };
    return gradients[normalizedRole] || gradients.default;
  };

  const getHeaderBg = () => {
    const backgrounds = {
      admin: "bg-red-900/80",
      support_agent: "bg-teal-900/80",
      broker: "bg-blue-900/80",
      seller: "bg-green-900/80",
      buyer: "bg-purple-900/80",
      renter: "bg-orange-900/80",
      leaser: "bg-indigo-900/80",
      default: "bg-amber-900/80"
    };
    return backgrounds[normalizedRole] || backgrounds.default;
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-40 h-40'
  };

  const handleAvatarClick = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClosePopup();
    }
  };

  // Role-specific quick actions
  const getQuickActions = () => {
    const baseActions = [
      { icon: Settings, label: 'Settings', action: () => onNavigateToSection('settings') },
      { icon: Edit3, label: 'Edit Profile', action: () => onNavigateToSection('profile') }
    ];

    const roleActions = {
      admin: [
        { icon: UsersIcon, label: 'Manage Users', action: () => onNavigateToSection('users') },
        { icon: Shield, label: 'Admin Panel', action: () => onNavigateToSection('admin') },
        { icon: BarChart3, label: 'Analytics', action: () => onNavigateToSection('analytics') }
      ],
      support_agent: [
        { icon: MessageSquare, label: 'Support Tickets', action: () => onNavigateToSection('support') },
        { icon: UsersIcon, label: 'Client Management', action: () => onNavigateToSection('clients') },
        { icon: FileText, label: 'Knowledge Base', action: () => onNavigateToSection('knowledge') }
      ],
      broker: [
        { icon: Home, label: 'My Listings', action: () => onNavigateToSection('listings') },
        { icon: UsersIcon, label: 'Clients', action: () => onNavigateToSection('clients') },
        { icon: Calendar, label: 'Schedule', action: () => onNavigateToSection('schedule') }
      ],
      seller: [
        { icon: Home, label: 'My Properties', action: () => onNavigateToSection('properties') },
        { icon: Eye, label: 'Viewings', action: () => onNavigateToSection('viewings') },
        { icon: TrendingUp, label: 'Performance', action: () => onNavigateToSection('performance') }
      ],
      buyer: [
        { icon: Heart, label: 'Favorites', action: () => onNavigateToSection('favorites') },
        { icon: Home, label: 'Saved Searches', action: () => onNavigateToSection('searches') },
        { icon: Bell, label: 'Alerts', action: () => onNavigateToSection('alerts') }
      ]
    };

    return [...baseActions, ...(roleActions[normalizedRole] || [])];
  };

  // Role-specific statistics
  const getRoleStats = () => {
    const stats = {
      admin: [
        { label: 'Total Users', value: '1,542', icon: UsersIcon },
        { label: 'System Health', value: '98%', icon: Shield }
      ],
      support_agent: [
        { label: 'Open Tickets', value: '24', icon: MessageSquare },
        { label: 'Satisfaction', value: '94%', icon: Star }
      ],
      broker: [
        { label: 'Active Listings', value: '12', icon: Home },
        { label: 'Commission', value: '$45K', icon: TrendingUp }
      ],
      seller: [
        { label: 'Properties', value: '4', icon: Home },
        { label: 'Views', value: '156', icon: Eye }
      ],
      buyer: [
        { label: 'Saved Homes', value: '23', icon: Heart },
        { label: 'Tours', value: '8', icon: Calendar }
      ]
    };

    return stats[normalizedRole] || [
      { label: 'Activity', value: '98%', icon: BarChart3 },
      { label: 'Status', value: 'Active', icon: BadgeCheck }
    ];
  };

  return (
    <div className="relative">
      {/* Avatar Display */}
      <div
        className="cursor-pointer transition-all duration-300 hover:scale-105 group"
        onClick={handleAvatarClick}
      >
        {userProfilePicture && !imageError ? (
          <img
            src={userProfilePicture}
            alt="Profile"
            className={`${sizeClasses[size]} rounded-full object-cover border-2 ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            } shadow-lg`}
            onError={() => setImageError(true)}
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

      {/* Profile Popup Modal - FIXED POSITIONING */}
      {showPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div
            className={`relative rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden ${getGradientBorder()} glass-effect`}
          >
            {/* Header */}
            <div className={`p-6 text-center glass-effect ${getHeaderBg()}`}>
              <button
                onClick={handleClosePopup}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex justify-center mb-4">
                {userProfilePicture && !imageError ? (
                  <img
                    src={userProfilePicture}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-amber-400 shadow-lg"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div
                    className={`w-20 h-20 ${getRoleColor()} rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-amber-400 shadow-lg`}
                  >
                    {getInitials()}
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{firstName} {lastName}</h3>
              <p className="text-gray-300 text-sm mb-2">@{username}</p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                {roleDisplay}
              </span>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {getRoleStats().map((stat, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-center ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}
                  >
                    <stat.icon className={`w-4 h-4 mx-auto mb-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <div className="text-lg font-bold text-amber-500">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* User Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {email}
                  </span>
                </div>
                {phone && (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone
                    </span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {phone}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <User className="w-4 h-4 inline mr-2" />
                    Member Since
                  </span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <BadgeCheck className="w-4 h-4 inline mr-2" />
                    Verified
                  </span>
                  <span className={`text-sm font-medium ${
                    verified ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {verified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                {getQuickActions().map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      theme === 'dark'
                        ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex space-x-3">
                <button
                  onClick={onUploadImage}
                  className="flex-1 bg-amber-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Upload Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;