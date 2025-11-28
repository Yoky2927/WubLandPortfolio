import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Portal from './Portal';
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
  X,
  HelpCircle,
  ExternalLink,
  ChevronRight
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
  onNavigateToSection,
  onClose
}) => {
  const { theme } = useTheme();
  const [showPopup, setShowPopup] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleClosePopup = () => {
    setShowPopup(false);
    if (onClose) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClosePopup();
    }
  };

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
      admin: "bg-gradient-to-br from-red-500 to-red-600",
      support_agent: "bg-gradient-to-br from-teal-500 to-teal-600",
      broker: "bg-gradient-to-br from-blue-500 to-blue-600",
      seller: "bg-gradient-to-br from-green-500 to-green-600",
      buyer: "bg-gradient-to-br from-purple-500 to-purple-600",
      renter: "bg-gradient-to-br from-orange-500 to-orange-600",
      leaser: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      default: "bg-gradient-to-br from-amber-500 to-amber-600"
    };
    return colors[normalizedRole] || colors.default;
  };

  // Updated background colors to match your app's theme
  const getPopupBackground = () => {
    return theme === 'dark' 
      ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      : "bg-gradient-to-br from-amber-50 via-white to-gray-100";
  };

  const getLeftPanelBackground = () => {
    const backgrounds = {
      admin: theme === 'dark' 
        ? "bg-gradient-to-b from-red-900/80 to-red-800/90" 
        : "bg-gradient-to-b from-red-600 to-red-700",
      support_agent: theme === 'dark' 
        ? "bg-gradient-to-b from-teal-900/80 to-teal-800/90" 
        : "bg-gradient-to-b from-teal-600 to-teal-700",
      broker: theme === 'dark' 
        ? "bg-gradient-to-b from-blue-900/80 to-blue-800/90" 
        : "bg-gradient-to-b from-blue-600 to-blue-700",
      seller: theme === 'dark' 
        ? "bg-gradient-to-b from-green-900/80 to-green-800/90" 
        : "bg-gradient-to-b from-green-600 to-green-700",
      buyer: theme === 'dark' 
        ? "bg-gradient-to-b from-purple-900/80 to-purple-800/90" 
        : "bg-gradient-to-b from-purple-600 to-purple-700",
      renter: theme === 'dark' 
        ? "bg-gradient-to-b from-orange-900/80 to-orange-800/90" 
        : "bg-gradient-to-b from-orange-600 to-orange-700",
      leaser: theme === 'dark' 
        ? "bg-gradient-to-b from-indigo-900/80 to-indigo-800/90" 
        : "bg-gradient-to-b from-indigo-600 to-indigo-700",
      default: theme === 'dark' 
        ? "bg-gradient-to-b from-amber-900/80 to-amber-800/90" 
        : "bg-gradient-to-b from-amber-600 to-amber-700"
    };
    return backgrounds[normalizedRole] || backgrounds.default;
  };

  const getCardBackground = () => {
    return theme === 'dark' 
      ? "bg-gray-800/80 border-gray-700" 
      : "bg-white border-gray-200";
  };

  const getHoverCardBackground = () => {
    return theme === 'dark' 
      ? "hover:bg-gray-700/80" 
      : "hover:bg-gray-50";
  };

  const getTextColor = () => {
    return theme === 'dark' ? "text-white" : "text-gray-900";
  };

  const getSecondaryTextColor = () => {
    return theme === 'dark' ? "text-gray-300" : "text-gray-600";
  };

  const getMutedTextColor = () => {
    return theme === 'dark' ? "text-gray-400" : "text-gray-500";
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-40 h-40 text-4xl'
  };

  const handleAvatarClick = () => {
    setShowPopup(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (onLogout) {
        onLogout();
      }
      handleClosePopup();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Role-specific quick actions
  const getQuickActions = () => {
    const baseActions = [
      { 
        icon: Settings, 
        label: 'Settings', 
        action: () => onNavigateToSection('settings'),
        description: 'Manage your account preferences'
      },
      { 
        icon: Edit3, 
        label: 'Edit Profile', 
        action: () => onNavigateToSection('profile'),
        description: 'Update your personal information'
      },
      { 
        icon: HelpCircle, 
        label: 'Help & Support', 
        action: () => onNavigateToSection('help'),
        description: 'Get assistance and guidance'
      }
    ];

    const roleActions = {
      admin: [
        { 
          icon: UsersIcon, 
          label: 'Manage Users', 
          action: () => onNavigateToSection('users'),
          description: 'User management dashboard'
        },
        { 
          icon: Shield, 
          label: 'Admin Panel', 
          action: () => onNavigateToSection('admin'),
          description: 'System administration'
        },
        { 
          icon: BarChart3, 
          label: 'Analytics', 
          action: () => onNavigateToSection('analytics'),
          description: 'View platform statistics'
        }
      ],
      support_agent: [
        { 
          icon: MessageSquare, 
          label: 'Support Tickets', 
          action: () => onNavigateToSection('support'),
          description: 'Handle customer inquiries'
        },
        { 
          icon: UsersIcon, 
          label: 'Client Management', 
          action: () => onNavigateToSection('clients'),
          description: 'Manage client relationships'
        },
        { 
          icon: FileText, 
          label: 'Knowledge Base', 
          action: () => onNavigateToSection('knowledge'),
          description: 'Access support resources'
        }
      ],
      broker: [
        { 
          icon: Home, 
          label: 'My Listings', 
          action: () => onNavigateToSection('listings'),
          description: 'Manage property listings'
        },
        { 
          icon: UsersIcon, 
          label: 'Clients', 
          action: () => onNavigateToSection('clients'),
          description: 'View and manage clients'
        },
        { 
          icon: Calendar, 
          label: 'Schedule', 
          action: () => onNavigateToSection('schedule'),
          description: 'Appointments and viewings'
        }
      ],
      seller: [
        { 
          icon: Home, 
          label: 'My Properties', 
          action: () => onNavigateToSection('properties'),
          description: 'Track your listings'
        },
        { 
          icon: Eye, 
          label: 'Viewings', 
          action: () => onNavigateToSection('viewings'),
          description: 'Property viewing schedule'
        },
        { 
          icon: TrendingUp, 
          label: 'Performance', 
          action: () => onNavigateToSection('performance'),
          description: 'Sales analytics'
        }
      ],
      buyer: [
        { 
          icon: Heart, 
          label: 'Favorites', 
          action: () => onNavigateToSection('favorites'),
          description: 'Saved properties'
        },
        { 
          icon: Home, 
          label: 'Saved Searches', 
          action: () => onNavigateToSection('searches'),
          description: 'Your search criteria'
        },
        { 
          icon: Bell, 
          label: 'Alerts', 
          action: () => onNavigateToSection('alerts'),
          description: 'Property notifications'
        }
      ]
    };

    return [...baseActions, ...(roleActions[normalizedRole] || [])];
  };

  // Role-specific statistics
  const getRoleStats = () => {
    const stats = {
      admin: [
        { label: 'Total Users', value: '1,542', icon: UsersIcon, trend: '+12%' },
        { label: 'System Health', value: '98%', icon: Shield, trend: 'Stable' }
      ],
      support_agent: [
        { label: 'Open Tickets', value: '24', icon: MessageSquare, trend: '-5' },
        { label: 'Satisfaction', value: '94%', icon: Star, trend: '+2%' }
      ],
      broker: [
        { label: 'Active Listings', value: '12', icon: Home, trend: '+3' },
        { label: 'Commission', value: '$45K', icon: TrendingUp, trend: '+18%' }
      ],
      seller: [
        { label: 'Properties', value: '4', icon: Home, trend: '+1' },
        { label: 'Views', value: '156', icon: Eye, trend: '+24%' }
      ],
      buyer: [
        { label: 'Saved Homes', value: '23', icon: Heart, trend: '+5' },
        { label: 'Tours', value: '8', icon: Calendar, trend: '+2' }
      ]
    };

    return stats[normalizedRole] || [
      { label: 'Activity', value: '98%', icon: BarChart3, trend: '+5%' },
      { label: 'Status', value: 'Active', icon: BadgeCheck, trend: 'Online' }
    ];
  };

  const quickActions = getQuickActions();

  return (
    <div className="relative">
      {/* Avatar Display */}
      <div
        className="cursor-pointer transition-all duration-300 hover:scale-105 group relative"
        onClick={handleAvatarClick}
      >
        {userProfilePicture && !imageError ? (
          <div className="relative">
            <img
              src={userProfilePicture}
              alt="Profile"
              className={`${sizeClasses[size]} rounded-full object-cover border-2 ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
              } shadow-lg group-hover:shadow-xl transition-all duration-300`}
              onError={() => setImageError(true)}
            />
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
        ) : (
          <div className="relative">
            <div
              className={`${sizeClasses[size]} ${getRoleColor()} rounded-full flex items-center justify-center text-white font-semibold border-2 ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
              } shadow-lg group-hover:shadow-xl transition-all duration-300`}
            >
              {getInitials()}
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
        )}
        
        {/* Hover effect */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-full transition-all duration-300"></div>
      </div>

      {/* Profile Popup Modal */}
      {showPopup && (
        <Portal>
          <div className="fixed inset-0 z-[9999]">
            <div 
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
              onClick={handleClosePopup}
            >
              <div 
                className="flex items-center justify-center min-h-screen p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`relative rounded-2xl shadow-2xl max-w-4xl w-full mx-auto overflow-hidden border ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                } ${getPopupBackground()}`}>
                  
                  {/* Close Button */}
                  <button
                    onClick={handleClosePopup}
                    className={`absolute top-4 right-4 z-50 p-2 rounded-full transition-all duration-200 ${
                      theme === 'dark' 
                        ? 'text-gray-300 hover:bg-gray-700/80 hover:text-white' 
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="flex flex-col md:flex-row min-h-[500px]">
                    {/* Left Panel - Profile Info */}
                    <div className={`md:w-2/5 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden ${getLeftPanelBackground()}`}>
                      {/* Background pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-center mb-6">
                          {userProfilePicture && !imageError ? (
                            <div className="relative">
                              <img
                                src={userProfilePicture}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-xl"
                                onError={() => setImageError(true)}
                              />
                              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                            </div>
                          ) : (
                            <div className="relative">
                              <div
                                className={`w-24 h-24 ${getRoleColor()} rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white/30 shadow-xl`}
                              >
                                {getInitials()}
                              </div>
                              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                            </div>
                          )}
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-sm">{firstName} {lastName}</h3>
                        <p className="text-white/80 text-sm mb-3 drop-shadow-sm">@{username}</p>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30">
                            {roleDisplay}
                          </span>
                          {verified && (
                            <BadgeCheck className="w-5 h-5 text-blue-300" />
                          )}
                        </div>

                        {/* User Info in Left Panel */}
                        <div className="space-y-3 mt-6">
                          <div className="flex items-center justify-center gap-3 text-white/90">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{email}</span>
                          </div>
                          {phone && (
                            <div className="flex items-center justify-center gap-3 text-white/90">
                              <Phone className="w-4 h-4" />
                              <span className="text-sm">{phone}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-3 text-white/90">
                            <User className="w-4 h-4" />
                            <span className="text-sm">Member since {new Date(created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel - Content */}
                    <div className="md:w-3/5 p-6 flex flex-col">
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {getRoleStats().map((stat, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-xl text-center border transition-all duration-300 ${getCardBackground()} ${getHoverCardBackground()}`}
                          >
                            <stat.icon className={`w-6 h-6 mx-auto mb-2 ${getMutedTextColor()}`} />
                            <div className="text-xl font-bold text-amber-500 mb-1">{stat.value}</div>
                            <div className={`text-xs ${getMutedTextColor()} mb-1`}>{stat.label}</div>
                            <div className={`text-xs font-medium ${
                              stat.trend?.includes('+') ? 'text-green-500' : 
                              stat.trend?.includes('-') ? 'text-red-500' : 'text-blue-500'
                            }`}>
                              {stat.trend}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex-1">
                        <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                          Quick Actions
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {quickActions.slice(0, 4).map((action, index) => (
                            <button
                              key={index}
                              onClick={action.action}
                              className={`p-4 rounded-xl text-left transition-all duration-200 group hover:scale-[1.02] border ${getCardBackground()} ${getHoverCardBackground()} shadow-sm hover:shadow-md`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${
                                  theme === 'dark' 
                                    ? 'bg-gray-700 group-hover:bg-amber-500 group-hover:text-white' 
                                    : 'bg-gray-100 group-hover:bg-amber-500 group-hover:text-white'
                                }`}>
                                  <action.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className={`font-medium text-sm ${getTextColor()}`}>
                                    {action.label}
                                  </div>
                                  <div className={`text-xs ${getSecondaryTextColor()}`}>
                                    {action.description}
                                  </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 ${getMutedTextColor()} group-hover:text-amber-500 transition-colors`} />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={onUploadImage}
                            className="flex-1 bg-amber-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-amber-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                          >
                            <Camera className="w-4 h-4" />
                            Upload Photo
                          </button>
                          
                          <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 border shadow-lg hover:shadow-xl hover:scale-105 ${
                              isLoggingOut
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed border-gray-400'
                                : theme === 'dark'
                                ? 'bg-red-600 hover:bg-red-700 text-white border-red-700'
                                : 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                            }`}
                          >
                            {isLoggingOut ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Logging out...</span>
                              </>
                            ) : (
                              <>
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default ProfileAvatar;