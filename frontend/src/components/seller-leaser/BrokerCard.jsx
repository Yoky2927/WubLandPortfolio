import React from 'react';
import { Users, Star, CheckCircle, Award, HelpCircle, MessageCircle } from 'lucide-react';

const BrokerCard = ({ 
  broker, 
  isCompact = false, 
  theme, 
  isSelected, 
  onSelect, 
  onView,
  showTopRatedBadge = false 
}) => {
  const rating = broker.average_rating || 4.5;
  const experienceYears = broker.experience_years || 5;
  const completedDeals = broker.total_completed_deals || 50;
  const commissionRate = broker.commission_rate || '2.5%';

  // Handle card click - goes to view details
  const handleCardClick = (e) => {
    e.stopPropagation();
    console.log("🖱️ Broker card clicked for view:", broker.id);
    if (onView) {
      onView();
    }
  };

  // Handle select button click
  const handleSelectClick = (e) => {
    e.stopPropagation();
    console.log("✅ Broker select button clicked:", broker.id);
    if (onSelect) {
      onSelect();
    }
  };

  // Handle view button click
  const handleViewClick = (e) => {
    e.stopPropagation();
    console.log("👁️ Broker view button clicked:", broker.id);
    if (onView) {
      onView();
    }
  };

  return (
    <div
      className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-300 group
        ${isSelected
          ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-lg'
          : theme === "dark"
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-amber-400 hover:shadow-xl'
            : 'bg-gradient-to-br from-white to-gray-50 border-gray-300 hover:border-amber-400 hover:shadow-xl'
        }`}
      onClick={handleCardClick}
    >
      {/* Top-rated badge */}
      {showTopRatedBadge && (
        <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 z-10 px-4 py-1 rounded-full ${theme === "dark" ? "bg-gradient-to-r from-amber-600 to-amber-800" : "bg-gradient-to-r from-amber-500 to-amber-600"
          }`}>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-white" />
            <span className="text-xs font-semibold text-white">Top-Rated Broker</span>
          </div>
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-2 rounded-full shadow-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Broker header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar */}
        <div className="relative">
          <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${isSelected ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
            }`}>
            {broker.profile_picture ? (
              <img
                src={broker.profile_picture}
                alt={broker.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500">
                <Users className="w-7 h-7 text-white" />
              </div>
            )}
          </div>
          
          {/* Online status */}
          {broker.is_available && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          )}
        </div>

        {/* Broker info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold truncate ${theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                {broker.name || "Unknown Broker"}
              </h3>
              <p className={`text-sm truncate ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                {broker.brokerage_firm || 'Independent Broker'}
              </p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${theme === "dark" ? "bg-amber-900/50" : "bg-amber-100"
              }`}>
              <Star className="w-3 h-3 text-amber-500 fill-current" />
              <span className={`text-sm font-bold ${theme === "dark" ? "text-amber-300" : "text-amber-700"
                }`}>
                {rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
              }`}>
              {experienceYears} years
            </span>
            {broker.specialization?.[0] && (
              <span className={`text-xs px-2 py-1 rounded-full ${theme === "dark" ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"
                }`}>
                {broker.specialization[0]}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${broker.is_available
                ? theme === "dark" 
                  ? "bg-green-900/50 text-green-300" 
                  : "bg-green-100 text-green-700"
                : theme === "dark"
                  ? "bg-red-900/50 text-red-300"
                  : "bg-red-100 text-red-700"
              }`}>
              {broker.is_available ? 'Available' : 'Busy'}
            </span>
          </div>
        </div>
      </div>

      {!isCompact && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`p-3 rounded-lg text-center transition-all duration-300 group-hover:scale-105 ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              }`}>
              <div className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                {completedDeals}+
              </div>
              <div className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                Completed Deals
              </div>
            </div>
            <div className={`p-3 rounded-lg text-center transition-all duration-300 group-hover:scale-105 ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              }`}>
              <div className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                {commissionRate}
              </div>
              <div className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                Commission
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              className={`flex-1 Button2  hover:text-white mx-10 font-semibold transition-all duration-300 group/select relative overflow-hidden
                ${isSelected
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 hover:shadow-lg'
                }`}
              onClick={handleSelectClick}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSelected ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Selected
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 group-hover/select:rotate-12 transition-transform" />
                    Select Broker
                  </>
                )}
              </span>
              {!isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/select:translate-x-[100%] transition-transform duration-700"></div>
              )}
            </button>
            <button
              className={`px-4 py-2.5 Button2 hover:text-white font-semibold transition-all duration-300 hover:scale-105 ${theme === "dark"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg"
                }`}
              onClick={handleViewClick}
            >
              View
            </button>
          </div>
        </>
      )}

      {/* Compact mode action */}
      {isCompact && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            className={`w-full py-2 rounded-lg font-medium transition-colors ${isSelected
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            onClick={handleSelectClick}
          >
            {isSelected ? 'Selected ✓' : 'Select'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BrokerCard;