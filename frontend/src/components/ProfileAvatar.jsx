import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Portal from './Portal';
import { 
  Settings, LogOut, Edit3, Shield, Home, MessageSquare, BarChart3, 
  Users as UsersIcon, CreditCard, Eye, FileText, Calendar, Bell, 
  Star, Award, BadgeCheck, TrendingUp, ClipboardList, Heart, 
  Phone, Mail, Camera, User, X, HelpCircle, ExternalLink, 
  ChevronRight, Building, Clock, Target, CheckCircle, DollarSign, 
  MapPin, Upload, Search, FileCheck, Home as HomeIcon, 
  FileText as FileTextIcon, ClipboardCheck, Key, Package, 
  Briefcase, Headphones, Lock, Globe, Building2, ListChecks,
  PieChart, AlertCircle, Users, Wrench, Megaphone, Wallet,
  FileBarChart, Layers, ShieldCheck, Settings2, Database,
  Tag, BellRing, FileDigit, TrendingDown, Activity, Cpu,
  Server, Globe2, ShieldAlert, DatabaseBackup, Network,
  FileWarning, Clock4, Target as TargetIcon, Star as StarIcon
} from 'lucide-react';
import { api } from '../utils/api.endpoints';

const ProfileAvatar = ({
  userProfilePicture, firstName, lastName, username, email, phone, 
  role, broker_type, status, created_at, verified,
  actorType = 'buyer',
  progress = {}, stats = {}, size = 'md', onLogout, onUploadImage, 
  onEditProfile, onNavigateToSection, onClose, userId
}) => {
  const { theme } = useTheme();
  const [showPopup, setShowPopup] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [actorStats, setActorStats] = useState({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [currentStep, setCurrentStep] = useState(progress?.currentStep || 1);
  const [apiError, setApiError] = useState(null);
  const [verificationProgress, setVerificationProgress] = useState({
    currentStep: 1,
    totalSteps: 5,
    percentage: 20
  });

  // Enhanced actor type detection
  const detectActorType = () => {
    // Check if we have explicit actorType prop
    if (actorType && actorType !== 'buyer') {
      return actorType;
    }

    // Check role from props (this might come from API)
    if (role) {
      return role.toLowerCase();
    }

    // Check localStorage for user data as fallback
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.role) {
        return userData.role.toLowerCase();
      }
      
      if (userData.userType) {
        return userData.userType.toLowerCase();
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }

    return 'buyer';
  };

  const detectedActorType = detectActorType();
  
  // Normalize actor type with priority: props > localStorage > default
  const normalizeActorType = (detectedType, brokerType) => {
    const detectedTypeLower = detectedType?.toLowerCase().trim() || '';
    const brokerTypeLower = brokerType?.toLowerCase().trim() || '';

    // Priority mapping - check exact matches first
    const typeMap = {
      // Property Consumers
      'buyer': { normalized: 'buyer', display: 'Property Buyer', category: 'consumer' },
      'renter': { normalized: 'renter', display: 'Renter', category: 'consumer' },
      'tenant': { normalized: 'renter', display: 'Renter', category: 'consumer' },
      
      // Property Providers
      'seller': { normalized: 'seller', display: 'Property Seller', category: 'provider' },
      'landlord': { normalized: 'seller', display: 'Property Seller', category: 'provider' },
      'leaser': { normalized: 'leaser', display: 'Property Leaser', category: 'provider' },
      'lessor': { normalized: 'leaser', display: 'Property Leaser', category: 'provider' },
      
      // Brokers
      'broker': { normalized: 'broker', display: brokerTypeLower === 'internal' ? 'Internal Broker' : 'External Broker', category: 'broker' },
      'agent': { normalized: 'broker', display: 'Real Estate Agent', category: 'broker' },
      'realtor': { normalized: 'broker', display: 'Realtor', category: 'broker' },
      
      // Support
      'supportagent': { normalized: 'support_agent', display: 'Support Agent', category: 'support' },
      'support_agent': { normalized: 'support_agent', display: 'Support Agent', category: 'support' },
      'support agent': { normalized: 'support_agent', display: 'Support Agent', category: 'support' },
      'customer_support': { normalized: 'support_agent', display: 'Support Agent', category: 'support' },
      'helpdesk': { normalized: 'support_agent', display: 'Support Agent', category: 'support' },
      'support': { normalized: 'support_agent', display: 'Support Agent', category: 'support' },
      
      // Administration
      'admin': { normalized: 'admin', display: 'Administrator', category: 'admin' },
      'administrator': { normalized: 'admin', display: 'Administrator', category: 'admin' },
      'superadmin': { normalized: 'superadmin', display: 'Super Administrator', category: 'admin' },
      'super_admin': { normalized: 'superadmin', display: 'Super Administrator', category: 'admin' },
      'system_admin': { normalized: 'superadmin', display: 'Super Administrator', category: 'admin' },
      'super': { normalized: 'superadmin', display: 'Super Administrator', category: 'admin' },
      
      // Check for partial matches
      ...(detectedTypeLower.includes('admin') && { 
        [detectedTypeLower]: { normalized: 'admin', display: 'Administrator', category: 'admin' } 
      }),
      ...(detectedTypeLower.includes('support') && { 
        [detectedTypeLower]: { normalized: 'support_agent', display: 'Support Agent', category: 'support' } 
      }),
      ...(detectedTypeLower.includes('broker') && { 
        [detectedTypeLower]: { normalized: 'broker', display: 'Broker', category: 'broker' } 
      }),
      ...(detectedTypeLower.includes('seller') && { 
        [detectedTypeLower]: { normalized: 'seller', display: 'Property Seller', category: 'provider' } 
      }),
      ...(detectedTypeLower.includes('leaser') && { 
        [detectedTypeLower]: { normalized: 'leaser', display: 'Property Leaser', category: 'provider' } 
      }),
      
      'default': { normalized: 'default', display: 'User', category: 'user' }
    };

    // First try exact match
    const exactMatch = typeMap[detectedTypeLower];
    if (exactMatch) {
      return exactMatch;
    }

    // Try to find partial match
    for (const [key, value] of Object.entries(typeMap)) {
      if (detectedTypeLower.includes(key) && key !== 'default') {
        return value;
      }
    }

    // Check if it's a broker by broker_type
    if (brokerTypeLower && (brokerTypeLower === 'internal' || brokerTypeLower === 'external')) {
      return {
        normalized: 'broker',
        display: brokerTypeLower === 'internal' ? 'Internal Broker' : 'External Broker',
        category: 'broker'
      };
    }

    return typeMap.default;
  };

  const { normalized: normalizedActorType, display: actorDisplay, category: actorCategory } = 
    normalizeActorType(detectedActorType, broker_type);

  const isInternalBroker = normalizedActorType === 'broker' && broker_type === 'internal';
  const isExternalBroker = normalizedActorType === 'broker' && broker_type === 'external';

  // Fetch actor-specific stats when popup opens
  useEffect(() => {
    if (showPopup) {
      fetchActorStats();
      if (isExternalBroker) {
        fetchVerificationProgress();
      }
    }
  }, [showPopup, normalizedActorType]);

  const handleClosePopup = () => {
    setShowPopup(false);
    onClose?.();
  };

  // Fetch actor-specific stats
  const fetchActorStats = async () => {
    setIsLoadingStats(true);
    setApiError(null);
    
    try {
      const statsConfig = {
        // Consumer Stats (Buyers/Renters)
        buyer: async () => {
          const [savedCount, activeAppCount, pendingDocCount] = await Promise.all([
            fetchSavedProperties(),
            fetchActiveApplications(),
            fetchPendingDocuments()
          ]);
          
          setActorStats({
            savedProperties: savedCount,
            activeApplications: activeAppCount,
            pendingDocuments: pendingDocCount
          });
          calculateConsumerProgress(savedCount, activeAppCount, pendingDocCount);
        },
        
        renter: async () => {
          const [savedCount, activeAppCount, pendingDocCount] = await Promise.all([
            fetchSavedProperties(),
            fetchActiveApplications(),
            fetchPendingDocuments()
          ]);
          
          setActorStats({
            savedProperties: savedCount,
            activeApplications: activeAppCount,
            pendingDocuments: pendingDocCount
          });
          calculateConsumerProgress(savedCount, activeAppCount, pendingDocCount);
        },
        
        // Provider Stats (Sellers/Leasers) - NO PROGRESS SECTION
        seller: async () => {
          const [listedProperties, inquiries, pendingOffers] = await Promise.all([
            fetchListedProperties(),
            fetchPropertyInquiries(),
            fetchPendingOffers()
          ]);
          
          setActorStats({
            listedProperties,
            activeInquiries: inquiries,
            pendingOffers
          });
        },
        
        leaser: async () => {
          const [listedProperties, inquiries, pendingLeases] = await Promise.all([
            fetchListedProperties(),
            fetchPropertyInquiries(),
            fetchPendingLeases()
          ]);
          
          setActorStats({
            listedProperties,
            activeInquiries: inquiries,
            pendingLeases
          });
        },
        
        // Broker Stats - Internal only, no progress for internal
        broker: async () => {
          if (isInternalBroker) {
            const [managedProperties, activeDeals, commissions] = await Promise.all([
              fetchManagedProperties(),
              fetchActiveDeals(),
              fetchCommissions()
            ]);
            
            setActorStats({
              managedProperties,
              activeDeals,
              pendingCommissions: commissions
            });
          }
          // External brokers get verification progress instead
        },
        
        // Support Agent Stats - NO PROGRESS SECTION
        support_agent: async () => {
          const [openTickets, resolvedToday, avgResponseTime] = await Promise.all([
            fetchOpenTickets(),
            fetchResolvedToday(),
            fetchAvgResponseTime()
          ]);
          
          setActorStats({
            openTickets,
            resolvedToday,
            avgResponseTime: `${avgResponseTime}m`
          });
        },
        
        // Admin Stats - NO PROGRESS SECTION
        admin: async () => {
          const [totalUsers, activeListings, pendingApprovals] = await Promise.all([
            fetchTotalUsers(),
            fetchActiveListings(),
            fetchPendingApprovals()
          ]);
          
          setActorStats({
            totalUsers,
            activeListings,
            pendingApprovals
          });
        },
        
        // Super Admin Stats - NO PROGRESS SECTION
        superadmin: async () => {
          const [totalUsers, systemHealth, securityAlerts, apiUsage] = await Promise.all([
            fetchTotalUsers(),
            fetchSystemHealth(),
            fetchSecurityAlerts(),
            fetchApiUsage()
          ]);
          
          setActorStats({
            totalUsers,
            systemHealth: `${systemHealth}%`,
            securityAlerts,
            apiUsage: `${apiUsage}/min`
          });
        }
      };

      const fetchFunction = statsConfig[normalizedActorType];
      if (fetchFunction) {
        await fetchFunction();
      }
      
    } catch (error) {
      console.error('Failed to fetch actor stats:', error);
      setApiError(`Failed to fetch stats: ${error.message}`);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch verification progress for external brokers
  const fetchVerificationProgress = async () => {
    try {
      const response = await api.get('GET_BROKER_VERIFICATION_STATUS');
      const progressData = response?.progress || {
        currentStep: 1,
        totalSteps: 5,
        percentage: 20,
        steps: [
          { id: 1, name: 'Profile Submission', status: 'completed' },
          { id: 2, name: 'Document Upload', status: 'in-progress' },
          { id: 3, name: 'Background Check', status: 'pending' },
          { id: 4, name: 'License Verification', status: 'pending' },
          { id: 5, name: 'Approval', status: 'pending' }
        ]
      };
      setVerificationProgress(progressData);
    } catch (error) {
      console.error('Failed to fetch verification progress:', error);
    }
  };

  // Helper fetch functions (simplified)
  const fetchSavedProperties = async () => {
    try {
      const response = await api.get('GET_SAVED_PROPERTIES');
      return Array.isArray(response) ? response.length : (response?.properties || response?.data || []).length;
    } catch {
      return 0;
    }
  };

  const fetchActiveApplications = async () => {
    try {
      const response = await api.get('GET_APPLICATIONS');
      const apps = Array.isArray(response) ? response : (response?.applications || response?.data || []);
      return apps.filter(app => ['pending', 'reviewing', 'approved', 'submitted'].includes(app.status?.toLowerCase())).length;
    } catch {
      return 0;
    }
  };

  const fetchPendingDocuments = async () => {
    try {
      const response = await api.get('GET_MY_DOCUMENTS');
      const docs = Array.isArray(response) ? response : (response?.documents || response?.data || []);
      return docs.filter(doc => doc.status?.toLowerCase() === 'pending').length;
    } catch {
      return 0;
    }
  };

  // Calculate progress for consumers only (buyers, renters)
  const calculateConsumerProgress = (savedCount, activeAppCount, pendingDocCount) => {
    if (!['buyer', 'renter'].includes(normalizedActorType)) return;
    
    let step = 1;
    if (pendingDocCount > 0) step = 2;
    if (savedCount > 0) step = 3;
    if (activeAppCount > 0) step = 4;
    
    setCurrentStep(Math.min(step, 4));
  };

  const getInitials = () => `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

  // Actor-specific colors
  const actorColors = {
    // Consumers
    buyer: "bg-gradient-to-br from-purple-500 to-purple-600",
    renter: "bg-gradient-to-br from-orange-500 to-orange-600",
    
    // Providers
    seller: "bg-gradient-to-br from-green-500 to-green-600",
    leaser: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    
    // Brokers
    broker: "bg-gradient-to-br from-blue-500 to-blue-600",
    
    // Support
    support_agent: "bg-gradient-to-br from-teal-500 to-teal-600",
    
    // Admins
    admin: "bg-gradient-to-br from-red-500 to-red-600",
    superadmin: "bg-gradient-to-br from-violet-500 to-violet-600",
    
    default: "bg-gradient-to-br from-amber-500 to-amber-600"
  };

  const getActorColor = () => actorColors[normalizedActorType] || actorColors.default;

  // Get gradient colors for left side circles (from BrokerProfileModal)
  const getLeftSideGradient = () => {
    const gradients = {
      buyer: "bg-gradient-to-br from-purple-400 to-purple-600",
      renter: "bg-gradient-to-br from-orange-400 to-orange-600",
      seller: "bg-gradient-to-br from-green-400 to-green-600",
      leaser: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      broker: "bg-gradient-to-br from-blue-400 to-blue-600",
      support_agent: "bg-gradient-to-br from-teal-400 to-teal-600",
      admin: "bg-gradient-to-br from-red-400 to-red-600",
      superadmin: "bg-gradient-to-br from-violet-400 to-violet-600",
      default: "bg-gradient-to-br from-amber-400 to-amber-600"
    };
    return gradients[normalizedActorType] || gradients.default;
  };

  const getPopupBackground = () => theme === 'dark' 
    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
    : "bg-gradient-to-br from-amber-50 via-white to-gray-100";

  const getLeftPanelBackground = () => {
    const backgrounds = {
      buyer: theme === 'dark' ? "bg-gradient-to-b from-purple-900/80 to-purple-800/90" : "bg-gradient-to-b from-purple-600 to-purple-700",
      renter: theme === 'dark' ? "bg-gradient-to-b from-orange-900/80 to-orange-800/90" : "bg-gradient-to-b from-orange-600 to-orange-700",
      seller: theme === 'dark' ? "bg-gradient-to-b from-green-900/80 to-green-800/90" : "bg-gradient-to-b from-green-600 to-green-700",
      leaser: theme === 'dark' ? "bg-gradient-to-b from-emerald-900/80 to-emerald-800/90" : "bg-gradient-to-b from-emerald-600 to-emerald-700",
      broker: theme === 'dark' ? "bg-gradient-to-b from-blue-900/80 to-blue-800/90" : "bg-gradient-to-b from-blue-600 to-blue-700",
      support_agent: theme === 'dark' ? "bg-gradient-to-b from-teal-900/80 to-teal-800/90" : "bg-gradient-to-b from-teal-600 to-teal-700",
      admin: theme === 'dark' ? "bg-gradient-to-b from-red-900/80 to-red-800/90" : "bg-gradient-to-b from-red-600 to-red-700",
      superadmin: theme === 'dark' ? "bg-gradient-to-b from-violet-900/80 to-violet-800/90" : "bg-gradient-to-b from-violet-600 to-violet-700",
      default: theme === 'dark' ? "bg-gradient-to-b from-amber-900/80 to-amber-800/90" : "bg-gradient-to-b from-amber-600 to-amber-700"
    };
    return backgrounds[normalizedActorType] || backgrounds.default;
  };

  const getCardBackground = () => theme === 'dark' ? "bg-gray-800/80 border-gray-700" : "bg-white border-gray-200";
  const getHoverCardBackground = () => theme === 'dark' ? "hover:bg-gray-700/80" : "hover:bg-gray-50";
  const getTextColor = () => theme === 'dark' ? "text-white" : "text-gray-900";
  const getSecondaryTextColor = () => theme === 'dark' ? "text-gray-300" : "text-gray-600";
  const getMutedTextColor = () => theme === 'dark' ? "text-gray-400" : "text-gray-500";

  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-lg', xl: 'w-40 h-40 text-4xl' };

  const handleAvatarClick = () => setShowPopup(true);

  // Progress steps only for consumers
  const getProgressSteps = () => {
    if (!['buyer', 'renter'].includes(normalizedActorType)) return [];
    
    return [
      { id: 1, name: 'Profile Setup', icon: User, activeIcon: User, description: 'Complete your profile', status: 'completed' },
      { id: 2, name: 'Document Upload', icon: Upload, activeIcon: FileCheck, description: 'Upload required documents', status: actorStats.pendingDocuments > 0 ? 'pending' : 'completed' },
      { id: 3, name: 'Property Search', icon: Search, activeIcon: HomeIcon, description: normalizedActorType === 'buyer' ? 'Find homes to buy' : 'Find rentals', status: actorStats.savedProperties > 0 ? 'completed' : 'pending' },
      { id: 4, name: 'Application', icon: FileTextIcon, activeIcon: ClipboardCheck, description: 'Submit application', status: actorStats.activeApplications > 0 ? 'completed' : 'pending' },
      { id: 5, name: 'Payment', icon: CreditCard, activeIcon: CreditCard, description: normalizedActorType === 'buyer' ? 'Make down payment' : 'Pay security deposit', status: 'pending' },
      { id: 6, name: 'Agreement', icon: Award, activeIcon: Award, description: 'Sign agreement', status: 'pending' },
      { id: 7, name: 'Completion', icon: CheckCircle, activeIcon: CheckCircle, description: normalizedActorType === 'buyer' ? 'Move in' : 'Rent starts', status: 'pending' }
    ];
  };

  // Actor-specific quick actions
  const getQuickActions = () => {
    const baseActions = [
      { icon: Edit3, label: 'Edit Profile', action: () => onEditProfile?.(), description: 'Update personal information' },
      { icon: HelpCircle, label: 'Help & Support', action: () => handleHelpSupport(), description: 'Get assistance' }
    ];

    const actorSpecificActions = {
      buyer: [
        { icon: Heart, label: 'Saved Homes', action: () => onNavigateToSection?.('saved'), description: `${actorStats.savedProperties || 0} saved properties` },
        { icon: FileText, label: 'Applications', action: () => onNavigateToSection?.('applications'), description: `${actorStats.activeApplications || 0} active applications` },
        { icon: Home, label: 'Schedule Tour', action: () => onNavigateToSection?.('tours'), description: 'Visit properties' },
        { icon: CreditCard, label: 'Payment History', action: () => onNavigateToSection?.('payments'), description: 'View all payments' }
      ],
      
      renter: [
        { icon: Heart, label: 'Saved Rentals', action: () => onNavigateToSection?.('saved'), description: `${actorStats.savedProperties || 0} saved rentals` },
        { icon: FileText, label: 'Rental Applications', action: () => onNavigateToSection?.('applications'), description: `${actorStats.activeApplications || 0} active applications` },
        { icon: Key, label: 'My Leases', action: () => onNavigateToSection?.('leases'), description: 'View rental agreements' },
        { icon: Calendar, label: 'Rent Schedule', action: () => onNavigateToSection?.('schedule'), description: 'Payment calendar' }
      ],
      
      seller: [
        { icon: Building, label: 'My Listings', action: () => onNavigateToSection?.('listings'), description: `${actorStats.listedProperties || 0} properties listed` },
        { icon: MessageSquare, label: 'Inquiries', action: () => onNavigateToSection?.('inquiries'), description: `${actorStats.activeInquiries || 0} active inquiries` },
        { icon: DollarSign, label: 'Offers Received', action: () => onNavigateToSection?.('offers'), description: `${actorStats.pendingOffers || 0} pending offers` },
        { icon: TrendingUp, label: 'Market Insights', action: () => onNavigateToSection?.('insights'), description: 'Property valuation' }
      ],
      
      leaser: [
        { icon: Building2, label: 'Rental Listings', action: () => onNavigateToSection?.('listings'), description: `${actorStats.listedProperties || 0} rentals listed` },
        { icon: MessageSquare, label: 'Rental Inquiries', action: () => onNavigateToSection?.('inquiries'), description: `${actorStats.activeInquiries || 0} active inquiries` },
        { icon: Key, label: 'Lease Management', action: () => onNavigateToSection?.('leases'), description: `${actorStats.pendingLeases || 0} pending leases` },
        { icon: Calendar, label: 'Tenant Management', action: () => onNavigateToSection?.('tenants'), description: 'Manage tenants' }
      ],
      
      // INTERNAL BROKERS: No saved homes section
      broker: isInternalBroker ? [
        { icon: Package, label: 'Managed Properties', action: () => onNavigateToSection?.('properties'), description: `${actorStats.managedProperties || 0} properties` },
        { icon: Briefcase, label: 'Active Deals', action: () => onNavigateToSection?.('deals'), description: `${actorStats.activeDeals || 0} active deals` },
        { icon: CreditCard, label: 'Commissions', action: () => onNavigateToSection?.('commissions'), description: `${actorStats.pendingCommissions || 0} pending commissions` },
        { icon: UsersIcon, label: 'Client Portfolio', action: () => onNavigateToSection?.('clients'), description: 'Manage clients' }
      ] : [
        // External brokers might have different actions during verification
        { icon: FileWarning, label: 'Verification Status', action: () => onNavigateToSection?.('verification'), description: 'Check approval progress' },
        { icon: Shield, label: 'Upload Documents', action: () => onNavigateToSection?.('documents'), description: 'Submit required docs' },
        { icon: Clock4, label: 'Background Check', action: () => onNavigateToSection?.('background'), description: 'View verification status' }
      ],
      
      support_agent: [
        { icon: Headphones, label: 'Open Tickets', action: () => onNavigateToSection?.('tickets'), description: `${actorStats.openTickets || 0} tickets open` },
        { icon: ClipboardCheck, label: 'Resolved Today', action: () => onNavigateToSection?.('resolved'), description: `${actorStats.resolvedToday || 0} resolved today` },
        { icon: Clock, label: 'Performance', action: () => onNavigateToSection?.('performance'), description: `${actorStats.avgResponseTime || '0m'} avg response` },
        { icon: BellRing, label: 'High Priority', action: () => onNavigateToSection?.('priority'), description: 'Urgent tickets' }
      ],
      
      admin: [
        { icon: Users, label: 'User Management', action: () => onNavigateToSection?.('users'), description: `${actorStats.totalUsers || 0} total users` },
        { icon: ListChecks, label: 'Approvals', action: () => onNavigateToSection?.('approvals'), description: `${actorStats.pendingApprovals || 0} pending approvals` },
        { icon: PieChart, label: 'Analytics', action: () => onNavigateToSection?.('analytics'), description: 'Platform insights' },
        { icon: FileBarChart, label: 'Reports', action: () => onNavigateToSection?.('reports'), description: 'Generate reports' }
      ],
      
      superadmin: [
        { icon: ShieldCheck, label: 'System Health', action: () => onNavigateToSection?.('system'), description: `${actorStats.systemHealth || '100%'}` },
        { icon: ShieldAlert, label: 'Security Dashboard', action: () => onNavigateToSection?.('security'), description: `${actorStats.securityAlerts || 0} active alerts` },
        { icon: DatabaseBackup, label: 'API Monitoring', action: () => onNavigateToSection?.('api'), description: `${actorStats.apiUsage || '0'} requests/min` },
        { icon: Cpu, label: 'System Settings', action: () => onNavigateToSection?.('settings'), description: 'Configure platform' }
      ]
    };

    return [...baseActions, ...(actorSpecificActions[normalizedActorType] || [])];
  };

  // Actor-specific stats display
  const renderStatsOverview = () => {
    if (isLoadingStats) {
      return (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className={`text-sm ${getSecondaryTextColor()}`}>Loading stats...</p>
        </div>
      );
    }

    const statsConfigs = {
      buyer: [
        { value: actorStats.savedProperties || 0, label: 'Properties Saved', icon: Heart, color: 'purple' },
        { value: actorStats.activeApplications || 0, label: 'Active Applications', icon: FileText, color: 'green' },
        { value: actorStats.pendingDocuments || 0, label: 'Pending Docs', icon: Shield, color: 'yellow' }
      ],
      renter: [
        { value: actorStats.savedProperties || 0, label: 'Rentals Saved', icon: Heart, color: 'orange' },
        { value: actorStats.activeApplications || 0, label: 'Rental Apps', icon: FileText, color: 'green' },
        { value: actorStats.pendingDocuments || 0, label: 'Pending Docs', icon: Shield, color: 'yellow' }
      ],
      seller: [
        { value: actorStats.listedProperties || 0, label: 'Listings', icon: Building, color: 'green' },
        { value: actorStats.activeInquiries || 0, label: 'Inquiries', icon: MessageSquare, color: 'blue' },
        { value: actorStats.pendingOffers || 0, label: 'Pending Offers', icon: DollarSign, color: 'yellow' }
      ],
      leaser: [
        { value: actorStats.listedProperties || 0, label: 'Listings', icon: Building2, color: 'emerald' },
        { value: actorStats.activeInquiries || 0, label: 'Inquiries', icon: MessageSquare, color: 'blue' },
        { value: actorStats.pendingLeases || 0, label: 'Pending Leases', icon: Key, color: 'yellow' }
      ],
      broker: isInternalBroker ? [
        { value: actorStats.managedProperties || 0, label: 'Properties', icon: Package, color: 'blue' },
        { value: actorStats.activeDeals || 0, label: 'Active Deals', icon: Briefcase, color: 'green' },
        { value: actorStats.pendingCommissions || 0, label: 'Commissions', icon: CreditCard, color: 'yellow' }
      ] : [
        { value: verificationProgress.percentage || 0, label: 'Verification', icon: TargetIcon, color: 'blue', suffix: '%' },
        { value: verificationProgress.currentStep || 0, label: 'Current Step', icon: StarIcon, color: 'green', suffix: `/${verificationProgress.totalSteps || 5}` },
        { value: 'Pending', label: 'Status', icon: Clock4, color: 'yellow' }
      ],
      support_agent: [
        { value: actorStats.openTickets || 0, label: 'Open Tickets', icon: Headphones, color: 'teal' },
        { value: actorStats.resolvedToday || 0, label: 'Resolved Today', icon: ClipboardCheck, color: 'green' },
        { value: actorStats.avgResponseTime || '0m', label: 'Avg Response', icon: Clock, color: 'blue' }
      ],
      admin: [
        { value: actorStats.totalUsers || 0, label: 'Total Users', icon: Users, color: 'red' },
        { value: actorStats.activeListings || 0, label: 'Active Listings', icon: Home, color: 'green' },
        { value: actorStats.pendingApprovals || 0, label: 'Pending Approvals', icon: ListChecks, color: 'yellow' }
      ],
      superadmin: [
        { value: actorStats.systemHealth || '100%', label: 'System Health', icon: Activity, color: 'violet' },
        { value: actorStats.securityAlerts || 0, label: 'Security Alerts', icon: ShieldAlert, color: 'red' },
        { value: actorStats.apiUsage || '0/min', label: 'API Usage', icon: Network, color: 'blue' }
      ]
    };

    const currentStats = statsConfigs[normalizedActorType];
    if (!currentStats) return null;

    return (
      <div className="grid grid-cols-3 gap-4 mb-8">
        {currentStats.map((stat, index) => (
          <div key={index} className={`p-4 rounded-xl border ${getCardBackground()} ${getHoverCardBackground()} transition-all duration-300`}>
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/20 mb-3`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
              </div>
              <div className="text-2xl font-bold text-amber-500">
                {stat.value}{stat.suffix || ''}
              </div>
              <div className={`text-sm ${getSecondaryTextColor()}`}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Actor-specific header title
  const getHeaderTitle = () => {
    const titles = {
      buyer: 'Your Home Buying Journey',
      renter: 'Your Rental Journey',
      seller: 'Seller Dashboard',
      leaser: 'Lease Manager',
      broker: isInternalBroker ? 'Broker Dashboard' : 'Broker Verification',
      support_agent: 'Support Agent Console',
      admin: 'Administrator Panel',
      superadmin: 'System Control Panel'
    };
    return titles[normalizedActorType] || 'Profile Overview';
  };

  const showProgress = ['buyer', 'renter'].includes(normalizedActorType);
  const progressSteps = getProgressSteps();
  const quickActions = getQuickActions();
  const completedSteps = Math.max(currentStep - 1, 0);
  const totalSteps = 7;
  const progressPercentage = showProgress ? Math.round((currentStep / totalSteps) * 100) : 0;

  // Avatar badge content based on actor type
  const getAvatarBadge = () => {
    if (showProgress) return currentStep;
    if (isExternalBroker) return verificationProgress.currentStep;
    
    const badgeIcons = {
      seller: <DollarSign className="w-3 h-3" />,
      leaser: <Key className="w-3 h-3" />,
      broker: <Briefcase className="w-3 h-3" />,
      support_agent: <Headphones className="w-3 h-3" />,
      admin: <Shield className="w-3 h-3" />,
      superadmin: <ShieldCheck className="w-3 h-3" />
    };
    
    const badgeIcon = badgeIcons[normalizedActorType];
    
    return badgeIcon || null;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.post('LOGOUT');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (onLogout) onLogout();
      handleClosePopup();
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (onLogout) onLogout();
      handleClosePopup();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleUsernameSave = async () => {
    const trimmedUsername = newUsername.trim();
    if (trimmedUsername && trimmedUsername !== username) {
      setIsUpdatingUsername(true);
      try {
        await api.put('UPDATE_PROFILE', {}, { 
          username: trimmedUsername,
          firstName,
          lastName,
          email
        });
        
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.username = trimmedUsername;
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (onEditProfile) {
          await onEditProfile({ username: trimmedUsername });
        }
        
        setEditingUsername(false);
        alert('Username updated successfully!');
      } catch (error) {
        console.error('Failed to update username:', error);
        alert('Failed to update username. Please try again.');
      } finally {
        setIsUpdatingUsername(false);
      }
    } else {
      setEditingUsername(false);
    }
  };

  const handleHelpSupport = async () => {
    try {
      await api.post('CREATE_SUPPORT_TICKET', {}, {
        subject: 'Help Request',
        description: 'I need assistance with the platform',
        priority: 'medium',
        category: 'general'
      });
      
      if (onNavigateToSection) {
        onNavigateToSection('help');
      } else {
        alert('Support ticket created! Our team will contact you soon.');
      }
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      if (onNavigateToSection) {
        onNavigateToSection('help');
      } else {
        alert('Please contact support at support@example.com');
      }
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);
    formData.append('userId', userId);

    try {
      await api.post('UPLOAD_PROFILE', {}, formData);
      
      const imageUrl = URL.createObjectURL(file);
      
      if (onUploadImage) {
        onUploadImage(imageUrl);
      }
      
      alert('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    }
  };

  const formatMemberSince = (dateString) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  return (
    <div className="relative">
      {/* Avatar Display */}
      <div className="cursor-pointer transition-all duration-300 hover:scale-105 group relative" onClick={handleAvatarClick}>
        {userProfilePicture && !imageError ? (
          <div className="relative">
            <img
              src={userProfilePicture}
              alt="Profile"
              className={`${sizeClasses[size]} rounded-full object-cover border-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'} shadow-lg group-hover:shadow-xl transition-all duration-300`}
              onError={() => setImageError(true)}
            />
            {(showProgress || getAvatarBadge()) && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-md">
                {getAvatarBadge()}
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className={`${sizeClasses[size]} ${getActorColor()} rounded-full flex items-center justify-center text-white font-semibold border-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
              {getInitials()}
            </div>
            {(showProgress || getAvatarBadge()) && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-md">
                {getAvatarBadge()}
              </div>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-full transition-all duration-300"></div>
      </div>

      {/* Profile Popup Modal */}
      {showPopup && (
        <Portal>
          <div className="fixed inset-0 z-[9999]">
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={handleClosePopup}>
              <div className="flex items-center justify-center min-h-screen p-4" onClick={(e) => e.stopPropagation()}>
                <div className={`relative rounded-2xl shadow-2xl max-w-5xl w-full mx-auto overflow-hidden border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} ${getPopupBackground()}`}>
                  {/* CLOSE BUTTON - Top Right (Fixed) */}
                  <button 
                    onClick={handleClosePopup}
                    className={`absolute top-4 right-4 z-50 p-2 rounded-full transition-all duration-200 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700/80 hover:text-white' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
                  >
                    <X className="w-6 h-6" />
                  </button>

                  {/* AESTHETIC CIRCLES on Left Side (from BrokerProfileModal) */}
                  <div className="absolute left-0 top-0 h-full w-2 flex flex-col items-center justify-between py-6">
                    <div className={`w-8 h-8 rounded-full ${getLeftSideGradient()} opacity-80 shadow-lg`}></div>
                    <div className={`w-8 h-8 rounded-full ${getLeftSideGradient()} opacity-80 shadow-lg`}></div>
                  </div>

                  <div className="flex flex-col md:flex-row min-h-[600px]">
                    {/* Left Panel - Profile Info - CENTERED */}
                    <div className={`md:w-2/5 p-8 flex flex-col relative overflow-hidden ${getLeftPanelBackground()}`}>
                      <div className="relative z-10 flex flex-col items-center justify-center h-full">
                        {/* Center the entire profile section */}
                        <div className="flex flex-col items-center justify-center flex-1 w-full">
                          {/* Additional decorative circles in the background */}
                          <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/5 blur-xl"></div>
                          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5 blur-xl"></div>
                          
                          {/* Centered Profile Image */}
                          <div className="flex justify-center mb-8">
                            {userProfilePicture && !imageError ? (
                              <div className="relative">
                                <img 
                                  src={userProfilePicture} 
                                  alt="Profile" 
                                  className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-2xl" 
                                  onError={() => setImageError(true)} 
                                />
                                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className={`w-32 h-32 ${getActorColor()} rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30 shadow-2xl`}>
                                  {getInitials()}
                                </div>
                                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                              </div>
                            )}
                          </div>

                          {/* Centered User Info */}
                          <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-sm">{firstName} {lastName}</h3>
                            
                            {/* Username editor */}
                            <div className="mb-6">
                              {editingUsername ? (
                                <div className="flex items-center justify-center gap-2 mb-4">
                                  <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="px-3 py-1 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-center"
                                    autoFocus
                                    disabled={isUpdatingUsername}
                                  />
                                  <button onClick={handleUsernameSave} disabled={isUpdatingUsername} className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white disabled:opacity-50">
                                    {isUpdatingUsername ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                                  </button>
                                  <button onClick={() => { setEditingUsername(false); setNewUsername(username); }} className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2 mb-4">
                                  <p className="text-white/80 text-sm drop-shadow-sm">@{username}</p>
                                  <button onClick={() => setEditingUsername(true)} className="p-1 rounded-full hover:bg-white/20 text-white/60 hover:text-white">
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {/* Actor Type Badges */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                              <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30">
                                {actorDisplay}
                              </span>
                              {normalizedActorType === 'admin' && (
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30">
                                  Administrator
                                </span>
                              )}
                              {normalizedActorType === 'superadmin' && (
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30">
                                  Super Admin
                                </span>
                              )}
                              {isInternalBroker && (
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30">
                                  Internal
                                </span>
                              )}
                              {isExternalBroker && (
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30">
                                  External
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Centered Contact Info */}
                          <div className="space-y-3 w-full max-w-xs">
                            <div className="flex items-center gap-3 text-white/90">
                              <Mail className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm truncate">{email}</span>
                            </div>
                            {phone && (
                              <div className="flex items-center gap-3 text-white/90">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">{phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-white/90">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm">Member since {formatMemberSince(created_at)}</span>
                            </div>
                            {verified && (
                              <div className="flex items-center gap-3 text-white/90">
                                <BadgeCheck className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">Verified Account</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel - Actor-Specific Content */}
                    <div className="md:w-3/5 p-6 flex flex-col">
                      {/* Header Title */}
                      <h4 className={`text-xl font-bold mb-6 ${getTextColor()}`}>{getHeaderTitle()}</h4>

                      {/* Progress Section for Consumers */}
                      {showProgress && progressSteps.length > 0 && (
                        <div className="mb-8">
                          {isLoadingStats ? (
                            <div className="text-center py-8">
                              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                              <p className={`text-sm ${getSecondaryTextColor()}`}>Loading progress...</p>
                            </div>
                          ) : (
                            <>
                              {/* Progress Bar */}
                              <div className="relative mb-8">
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-sm font-medium ${getTextColor()}`}>
                                    Step {currentStep} of {totalSteps}
                                  </span>
                                  <span className={`text-sm font-medium ${getTextColor()}`}>
                                    {progressPercentage}% Complete
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                  <div 
                                    className="bg-gradient-to-r from-amber-400 to-amber-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Stats Overview */}
                              {renderStatsOverview()}

                              {/* Horizontal Progress Steps */}
                              <div className="relative">
                                <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-300 dark:bg-gray-700 -z-10"></div>
                                
                                <div className="flex justify-between">
                                  {progressSteps.slice(0, 4).map((step, index) => {
                                    const isCompleted = index < currentStep;
                                    const isCurrent = index === currentStep - 1;
                                    
                                    return (
                                      <div key={step.id} className="flex flex-col items-center w-24">
                                        <div className={`relative mb-3 ${isCompleted ? 'scale-110' : ''}`}>
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                            isCompleted 
                                              ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-600' 
                                              : isCurrent 
                                              ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-600 animate-pulse'
                                              : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                                          }`}>
                                            {isCompleted ? (
                                              <step.activeIcon className="w-5 h-5 text-white" />
                                            ) : (
                                              <step.icon className={`w-5 h-5 ${
                                                isCurrent 
                                                  ? 'text-white' 
                                                  : 'text-gray-500 dark:text-gray-400'
                                              }`} />
                                            )}
                                          </div>
                                          {isCompleted && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                              <CheckCircle className="w-3 h-3 text-white" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-center">
                                          <p className={`text-xs font-semibold mb-1 ${
                                            isCompleted || isCurrent 
                                              ? getTextColor() 
                                              : getSecondaryTextColor()
                                          }`}>
                                            {step.name}
                                          </p>
                                          <p className={`text-xs ${getMutedTextColor()}`}>
                                            {step.description}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Stats Overview for Non-Consumers */}
                      {!showProgress && (
                        <div className="mb-8">
                          {renderStatsOverview()}
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex-1 mb-6">
                        <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Quick Actions</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {quickActions.map((action, index) => (
                            <button
                              key={index}
                              onClick={action.action}
                              className={`p-4 rounded-xl text-left transition-all duration-200 group hover:scale-[1.02] border ${getCardBackground()} ${getHoverCardBackground()} shadow-sm hover:shadow-md`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 group-hover:bg-amber-500 group-hover:text-white' : 'bg-gray-100 group-hover:bg-amber-500 group-hover:text-white'}`}>
                                  <action.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className={`font-medium ${getTextColor()}`}>{action.label}</div>
                                  <div className={`text-xs ${getSecondaryTextColor()}`}>{action.description}</div>
                                </div>
                                <ChevronRight className={`w-4 h-4 ${getMutedTextColor()} group-hover:text-amber-500 transition-colors`} />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700">
                        {apiError && (
                          <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          <label className="flex-1 bg-amber-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-amber-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer">
                            <Camera className="w-4 h-4" />
                            Upload Photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePictureUpload}
                              className="hidden"
                            />
                          </label>
                          
                          <button onClick={handleLogout} disabled={isLoggingOut} className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 border shadow-lg hover:shadow-xl hover:scale-105 ${isLoggingOut ? 'bg-gray-400 text-gray-200 cursor-not-allowed border-gray-400' : theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white border-red-700' : 'bg-red-500 hover:bg-red-600 text-white border-red-600'}`}>
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