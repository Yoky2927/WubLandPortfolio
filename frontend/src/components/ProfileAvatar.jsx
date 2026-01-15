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
  ChevronRight,
  Building,
  Clock,
  Target,
  CheckCircle,
  DollarSign,
  MapPin
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
  userType = 'buyer',
  progress = {},
  stats = {},
  size = 'md',
  onLogout,
  onUploadImage,
  onEditProfile,
  onNavigateToSection,
  onClose
}) => {
  const { theme } = useTheme();
  const [showPopup, setShowPopup] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(username);

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

  // Enhanced role handling with userType support
  const normalizeRole = (role, brokerType, userTypeParam) => {
    if (!role && !userTypeParam) return { normalized: 'default', display: 'User' };

    const roleLower = role ? role.toLowerCase().trim() : '';
    const userTypeLower = userTypeParam ? userTypeParam.toLowerCase().trim() : '';
    const brokerTypeLower = brokerType ? brokerType.toLowerCase().trim() : '';

    // Priority: userType > role > broker_type
    const effectiveRole = userTypeLower || roleLower || brokerTypeLower;

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
      'leaser': { normalized: 'leaser', display: 'Property Leaser' },
      'buyer': { normalized: 'buyer', display: 'Property Buyer' },
      'renter': { normalized: 'renter', display: 'Renter' },
      'default': { normalized: 'default', display: 'User' }
    };

    return roleMap[effectiveRole] || roleMap.default;
  };

  const { normalized: normalizedRole, display: roleDisplay } = normalizeRole(role, broker_type, userType);

  const getInitials = () => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleColor = () => {
    const colors = {
      admin: "bg-gradient-to-br from-red-500 to-red-600",
      support_agent: "bg-gradient-to-br from-teal-500 to-teal-600",
      broker: "bg-gradient-to-br from-blue-500 to-blue-600",
      seller: "bg-gradient-to-br from-green-500 to-green-600",
      leaser: "bg-gradient-to-br from-green-500 to-green-600",
      buyer: "bg-gradient-to-br from-purple-500 to-purple-600",
      renter: "bg-gradient-to-br from-orange-500 to-orange-600",
      default: "bg-gradient-to-br from-amber-500 to-amber-600"
    };
    return colors[normalizedRole] || colors.default;
  };

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
      leaser: theme === 'dark' 
        ? "bg-gradient-to-b from-green-900/80 to-green-800/90" 
        : "bg-gradient-to-b from-green-600 to-green-700",
      buyer: theme === 'dark' 
        ? "bg-gradient-to-b from-purple-900/80 to-purple-800/90" 
        : "bg-gradient-to-b from-purple-600 to-purple-700",
      renter: theme === 'dark' 
        ? "bg-gradient-to-b from-orange-900/80 to-orange-800/90" 
        : "bg-gradient-to-b from-orange-600 to-orange-700",
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

  const handleUsernameSave = () => {
    if (newUsername.trim() && onEditProfile) {
      onEditProfile({ username: newUsername.trim() });
      setEditingUsername(false);
    }
  };

  // Progress steps for Buyer/Renter
  const getProgressSteps = () => {
    const baseSteps = [
      { id: 1, name: 'Profile Setup', icon: User, description: 'Complete your profile', status: progress?.step1 || 'pending' },
      { id: 2, name: 'Document Upload', icon: FileText, description: 'Upload required documents', status: progress?.step2 || 'pending' },
      { id: 3, name: 'Property Search', icon: Home, description: 'Find properties', status: progress?.step3 || 'pending' },
      { id: 4, name: 'Application', icon: ClipboardList, description: 'Submit application', status: progress?.step4 || 'pending' },
      { id: 5, name: 'Payment', icon: CreditCard, description: 'Make payment', status: progress?.step5 || 'pending' },
      { id: 6, name: 'Agreement', icon: Award, description: 'Sign agreement', status: progress?.step6 || 'pending' },
      { id: 7, name: 'Completion', icon: CheckCircle, description: userType === 'buyer' ? 'Move in' : 'Rent starts', status: progress?.step7 || 'pending' }
    ];

    return baseSteps;
  };

  const progressSteps = getProgressSteps();
  const currentStep = progress?.currentStep || 1;
  const completedSteps = progress?.completedSteps || 0;
  const totalSteps = progressSteps.length;

  // Enhanced stats with defaults
  const userStats = {
    savedProperties: stats?.savedProperties || 0,
    activeApplications: stats?.activeApplications || 0,
    completedTours: stats?.completedTours || 0,
    pendingDocuments: stats?.pendingDocuments || 0,
    ...stats
  };

  // Enhanced quick actions based on user type
  const getQuickActions = () => {
    const baseActions = [
      { 
        icon: Edit3, 
        label: 'Edit Profile', 
        action: () => onEditProfile && onEditProfile(),
        description: 'Update your personal information'
      },
      { 
        icon: Settings, 
        label: 'Settings', 
        action: () => onNavigateToSection('settings'),
        description: 'Manage your account preferences'
      },
      { 
        icon: HelpCircle, 
        label: 'Help & Support', 
        action: () => onNavigateToSection('help'),
        description: 'Get assistance and guidance'
      }
    ];

    const userTypeActions = {
      buyer: [
        { 
          icon: Heart, 
          label: 'Saved Homes', 
          action: () => onNavigateToSection('saved'),
          description: `${userStats.savedProperties} saved properties`
        },
        { 
          icon: Calendar, 
          label: 'Scheduled Tours', 
          action: () => onNavigateToSection('tours'),
          description: `${userStats.completedTours} completed tours`
        },
        { 
          icon: FileText, 
          label: 'Applications', 
          action: () => onNavigateToSection('applications'),
          description: `${userStats.activeApplications} active applications`
        },
        { 
          icon: Building, 
          label: 'Browse Properties', 
          action: () => onNavigateToSection('properties'),
          description: 'Find your dream home'
        }
      ],
      renter: [
        { 
          icon: Heart, 
          label: 'Saved Rentals', 
          action: () => onNavigateToSection('saved'),
          description: `${userStats.savedProperties} saved rentals`
        },
        { 
          icon: Calendar, 
          label: 'Viewings', 
          action: () => onNavigateToSection('tours'),
          description: `${userStats.completedTours} completed viewings`
        },
        { 
          icon: FileText, 
          label: 'Rental Applications', 
          action: () => onNavigateToSection('applications'),
          description: `${userStats.activeApplications} active applications`
        },
        { 
          icon: CreditCard, 
          label: 'Rent Payments', 
          action: () => onNavigateToSection('payments'),
          description: 'View payment history'
        }
      ]
    };

    return [...baseActions, ...(userTypeActions[userType] || [])];
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
            {/* Progress indicator */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-md">
              {currentStep}
            </div>
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
            {/* Progress indicator */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-md">
              {currentStep}
            </div>
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

                  <div className="flex flex-col md:flex-row min-h-[600px]">
                    {/* Left Panel - Profile Info */}
                    <div className={`md:w-2/5 p-8 flex flex-col text-center relative overflow-hidden ${getLeftPanelBackground()}`}>
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
                        
                        {/* Username editing */}
                        <div className="mb-4">
                          {editingUsername ? (
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="px-3 py-1 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-center"
                                autoFocus
                              />
                              <button
                                onClick={handleUsernameSave}
                                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUsername(false);
                                  setNewUsername(username);
                                }}
                                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-white/80 text-sm drop-shadow-sm">@{username}</p>
                              <button
                                onClick={() => setEditingUsername(true)}
                                className="p-1 rounded-full hover:bg-white/20 text-white/60 hover:text-white"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 mb-6">
                          <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30">
                            {roleDisplay}
                          </span>
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30">
                            {userType === 'buyer' ? 'Buyer' : 'Renter'}
                          </span>
                        </div>

                        {/* User Info */}
                        <div className="space-y-3 mt-4">
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
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Member since {new Date(created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Section in Left Panel */}
                      <div className="mt-8 pt-6 border-t border-white/20">
                        <h4 className="text-white font-semibold mb-4 text-left">Your Journey Progress</h4>
                        <div className="space-y-3">
                          {progressSteps.slice(0, 4).map((step, index) => (
                            <div 
                              key={step.id} 
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                index < currentStep 
                                  ? 'bg-white/20' 
                                  : 'bg-white/10'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                index < currentStep 
                                  ? 'bg-white text-green-600' 
                                  : index === currentStep - 1
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-white/20 text-white/60'
                              }`}>
                                {index < currentStep ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <step.icon className="w-4 h-4" />
                                )}
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-white">{step.name}</p>
                                <p className="text-xs text-white/70">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-center">
                          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                            <div 
                              className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-white">
                            Step {currentStep} of {totalSteps} • {Math.round((completedSteps / totalSteps) * 100)}% Complete
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel - Content */}
                    <div className="md:w-3/5 p-6 flex flex-col">
                      {/* Stats Overview */}
                      <div className="mb-6">
                        <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                          Quick Stats
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`p-4 rounded-xl border ${getCardBackground()} ${getHoverCardBackground()} transition-all duration-300`}>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                                <Heart className="w-5 h-5 text-red-500" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-amber-500">{userStats.savedProperties}</div>
                                <div className={`text-sm ${getSecondaryTextColor()}`}>Saved Properties</div>
                              </div>
                            </div>
                          </div>
                          <div className={`p-4 rounded-xl border ${getCardBackground()} ${getHoverCardBackground()} transition-all duration-300`}>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <Calendar className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-amber-500">{userStats.completedTours}</div>
                                <div className={`text-sm ${getSecondaryTextColor()}`}>Completed Tours</div>
                              </div>
                            </div>
                          </div>
                          <div className={`p-4 rounded-xl border ${getCardBackground()} ${getHoverCardBackground()} transition-all duration-300`}>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <FileText className="w-5 h-5 text-green-500" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-amber-500">{userStats.activeApplications}</div>
                                <div className={`text-sm ${getSecondaryTextColor()}`}>Active Applications</div>
                              </div>
                            </div>
                          </div>
                          <div className={`p-4 rounded-xl border ${getCardBackground()} ${getHoverCardBackground()} transition-all duration-300`}>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                                <Shield className="w-5 h-5 text-yellow-500" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-amber-500">{userStats.pendingDocuments}</div>
                                <div className={`text-sm ${getSecondaryTextColor()}`}>Pending Docs</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex-1">
                        <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                          Quick Actions
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {quickActions.map((action, index) => (
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
                                  <div className={`font-medium ${getTextColor()}`}>
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