// frontend/src/components/BrokerProfileModal.jsx - UPDATED VERSION
import React from 'react';
import {
  X,
  Star,
  Phone,
  Mail,
  MapPin,
  Award,
  Clock,
  CheckCircle2,
  Users,
  ShieldCheck,
  Calendar,
  MessageCircle,
  Home,
  TrendingUp,
  Languages,
  BadgeCheck,
  Building,
  DollarSign,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const BrokerProfileModal = ({ broker, isOpen, onClose, onSelect, theme }) => {
  if (!isOpen || !broker) return null;

  console.log("📊 BrokerProfileModal received broker:", broker);

  // Safely extract broker data with defaults
  const brokerData = {
    name: broker.name || `${broker.first_name || ''} ${broker.last_name || ''}`.trim() || 'Broker',
    profile_picture: broker.profile_picture || null,
    broker_type: broker.broker_type || (broker.role?.includes('internal') ? 'internal' : 'external'),
    rating: broker.average_rating || broker.rating || 4.5,
    years_experience: broker.experience_years || broker.years_experience || 5,
    completed_deals: broker.total_completed_deals || broker.completed_deals || 50,
    commission_rate: broker.commission_rate || '2.5%',
    current_active_clients: broker.current_active_clients || 10,
    bio: broker.bio || broker.description || `Professional real estate broker with ${broker.experience_years || 5} years of experience specializing in residential and commercial properties.`,
    
    // Arrays with fallbacks
    specialization: Array.isArray(broker.specialization) 
      ? broker.specialization 
      : (typeof broker.specialization === 'string' 
          ? JSON.parse(broker.specialization) 
          : ['Residential', 'Commercial', 'Luxury Properties']),
    
    service_areas: Array.isArray(broker.service_areas) 
      ? broker.service_areas 
      : ['Addis Ababa', 'Bole', 'Cazanchise', 'Megenagna'],
    
    languages: Array.isArray(broker.languages) 
      ? broker.languages 
      : ['Amharic', 'English'],
    
    // Contact info
    phone_number: broker.phone_number || broker.phone || '+251 9X XXX XXXX',
    email: broker.email || 'broker@example.com',
    
    // Verification
    is_verified: broker.is_verified || broker.verified || false,
    license_number: broker.license_number || broker.broker_license_number || 'ET-BR-2024-001',
    brokerage_firm: broker.brokerage_firm || 'Independent Broker',
    is_available: broker.is_available !== undefined ? broker.is_available : true
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getRoleGradient = () => {
    return brokerData.broker_type === 'internal' 
      ? 'from-blue-500/20 to-blue-600/20'
      : 'from-green-500/20 to-green-600/20';
  };

  const getHeaderBg = () => {
    return brokerData.broker_type === 'internal'
      ? 'bg-gradient-to-r from-blue-900/90 to-blue-800/90'
      : 'bg-gradient-to-r from-green-900/90 to-green-800/90';
  };

  const getPopupBackground = () => {
    return theme === 'dark' 
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
      : 'bg-gradient-to-br from-amber-50 via-white to-gray-100';
  };

  const getCardBackground = () => {
    return theme === 'dark' 
      ? 'bg-gray-800/80 border-gray-700' 
      : 'bg-white border-gray-200';
  };

  const getTextColor = () => {
    return theme === 'dark' ? 'text-white' : 'text-gray-900';
  };

  const getSecondaryTextColor = () => {
    return theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className={`relative rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border ${
          theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
        } ${getPopupBackground()}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient background */}
        <div className={`p-8 relative overflow-hidden rounded-t-2xl ${getHeaderBg()}`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-6 right-6 p-2 rounded-full transition-all duration-200 ${
              theme === 'dark' 
                ? 'text-gray-300 hover:bg-gray-700/80 hover:text-white' 
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl">
                  {brokerData.profile_picture ? (
                    <img
                      src={brokerData.profile_picture}
                      alt={brokerData.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <Users className="w-12 h-12 text-white" />
                  )}
                </div>
                {brokerData.is_verified && (
                  <BadgeCheck className="absolute -top-2 -right-2 w-8 h-8 text-blue-400 bg-white rounded-full" />
                )}
              </div>

              {/* Profile Info */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{brokerData.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm border border-white/30">
                    {brokerData.broker_type === 'internal' ? 'Internal Broker' : 'External Broker'}
                  </span>
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                    <Star className="w-4 h-4 text-yellow-300 fill-current" />
                    <span className="text-white text-sm ml-1">{brokerData.rating.toFixed(1)}</span>
                  </div>
                  {brokerData.brokerage_firm && (
                    <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                      <Building className="w-4 h-4 text-white" />
                      <span className="text-white text-sm ml-1">{brokerData.brokerage_firm}</span>
                    </div>
                  )}
                </div>
                <p className="text-white/80 text-lg">
                  {brokerData.years_experience} years experience • {brokerData.completed_deals} completed deals • {brokerData.commission_rate} commission
                </p>
                {brokerData.is_available && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-sm">Available for new clients</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - 2/3 width */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio Section */}
              <div className={`p-6 rounded-2xl border ${getCardBackground()} transition-all duration-300`}>
                <h3 className={`text-xl font-semibold mb-4 flex items-center gap-3 ${getTextColor()}`}>
                  <MessageCircle className="w-5 h-5 text-amber-500" />
                  About Me
                </h3>
                <p className={`text-lg leading-relaxed ${getSecondaryTextColor()}`}>
                  {brokerData.bio}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-5 rounded-xl border text-center transition-all duration-300 ${getCardBackground()}`}>
                  <Clock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-amber-500 mb-1">{brokerData.years_experience}</div>
                  <div className={`text-sm ${getSecondaryTextColor()}`}>Years Experience</div>
                </div>
                <div className={`p-5 rounded-xl border text-center transition-all duration-300 ${getCardBackground()}`}>
                  <Award className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-amber-500 mb-1">{brokerData.completed_deals}</div>
                  <div className={`text-sm ${getSecondaryTextColor()}`}>Completed Deals</div>
                </div>
                <div className={`p-5 rounded-xl border text-center transition-all duration-300 ${getCardBackground()}`}>
                  <DollarSign className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-amber-500 mb-1">{brokerData.commission_rate}</div>
                  <div className={`text-sm ${getSecondaryTextColor()}`}>Commission Rate</div>
                </div>
                <div className={`p-5 rounded-xl border text-center transition-all duration-300 ${getCardBackground()}`}>
                  <Target className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-amber-500 mb-1">{brokerData.current_active_clients}</div>
                  <div className={`text-sm ${getSecondaryTextColor()}`}>Active Clients</div>
                </div>
              </div>

              {/* Specialization */}
              <div className={`p-6 rounded-2xl border ${getCardBackground()} transition-all duration-300`}>
                <h3 className={`text-xl font-semibold mb-4 flex items-center gap-3 ${getTextColor()}`}>
                  <Home className="w-5 h-5 text-amber-500" />
                  Specialization
                </h3>
                <div className="flex flex-wrap gap-3">
                  {brokerData.specialization.map((spec, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full text-sm font-medium shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Service Areas */}
              <div className={`p-6 rounded-2xl border ${getCardBackground()} transition-all duration-300`}>
                <h3 className={`text-xl font-semibold mb-4 flex items-center gap-3 ${getTextColor()}`}>
                  <MapPin className="w-5 h-5 text-amber-500" />
                  Service Areas
                </h3>
                <div className="flex flex-wrap gap-3">
                  {brokerData.service_areas.map((area, index) => (
                    <span
                      key={index}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 hover:scale-105 ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-amber-400'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-amber-400'
                      }`}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className={`p-6 rounded-2xl border ${getCardBackground()} transition-all duration-300`}>
                <h3 className={`text-xl font-semibold mb-4 ${getTextColor()}`}>
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className={`p-3 rounded-xl border ${
                    theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-600' : 'bg-amber-100'
                      }`}>
                        <Phone className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${getTextColor()}`}>Phone</div>
                        <div className={getSecondaryTextColor()}>{brokerData.phone_number}</div>
                      </div>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-600' : 'bg-amber-100'
                      }`}>
                        <Mail className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${getTextColor()}`}>Email</div>
                        <div className={getSecondaryTextColor()}>{brokerData.email}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className={`p-6 rounded-2xl border ${getCardBackground()} transition-all duration-300`}>
                <h3 className={`text-xl font-semibold mb-4 flex items-center gap-3 ${getTextColor()}`}>
                  <Languages className="w-5 h-5 text-amber-500" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {brokerData.languages.map((lang, index) => (
                    <span
                      key={index}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        theme === 'dark'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {lang === 'amharic' ? 'Amharic' : 
                       lang === 'english' ? 'English' : 
                       lang === 'tigrigna' ? 'Tigrigna' : 
                       lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verification & License */}
              <div className={`p-6 rounded-2xl border ${getCardBackground()} transition-all duration-300`}>
                <h3 className={`text-xl font-semibold mb-4 ${getTextColor()}`}>
                  Verification
                </h3>
                <div className="space-y-3">
                  {brokerData.is_verified && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      <div>
                        <div className={`text-sm font-medium ${getTextColor()}`}>Verified Broker</div>
                        <div className="text-sm text-green-500">Platform verified</div>
                      </div>
                    </div>
                  )}
                  {brokerData.license_number && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <BadgeCheck className="w-5 h-5 text-amber-500" />
                      <div>
                        <div className={`text-sm font-medium ${getTextColor()}`}>Professional License</div>
                        <div className={getSecondaryTextColor()}>{brokerData.license_number}</div>
                      </div>
                    </div>
                  )}
                  {!brokerData.is_verified && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-500/10 border border-gray-500/20">
                      <AlertCircle className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className={`text-sm font-medium ${getTextColor()}`}>Verification</div>
                        <div className="text-sm text-gray-500">Pending verification</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className={`p-6 rounded-2xl border ${getCardBackground()} transition-all duration-300`}>
                <h3 className={`text-xl font-semibold mb-4 ${getTextColor()}`}>
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={getSecondaryTextColor()}>Response Rate</span>
                    <span className="font-semibold text-amber-500">95%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={getSecondaryTextColor()}>Average Deal Time</span>
                    <span className="font-semibold text-amber-500">21 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={getSecondaryTextColor()}>Client Satisfaction</span>
                    <span className="font-semibold text-amber-500">98%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={getSecondaryTextColor()}>Repeat Clients</span>
                    <span className="font-semibold text-amber-500">35%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onClose}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 border ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/70'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Close Profile
            </button>
            <button
              onClick={() => {
                console.log("✅ Selecting broker from modal:", brokerData.name);
                if (onSelect) {
                  onSelect();
                } else {
                  console.error("❌ onSelect prop is not defined!");
                }
              }}
              className="flex-1 bg-amber-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-amber-600 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Select This Broker</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerProfileModal;