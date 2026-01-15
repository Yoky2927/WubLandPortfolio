import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MessageCircle,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const ScheduleViewingModal = ({ isOpen, onClose, property, broker, user, theme }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 1500);
  };

  const getBrokerInfo = () => {
    // Default fallback values
    const defaultBroker = {
      first_name: "Property",
      last_name: "Agent",
      profile_picture: null,
      phone_number: "(xxx) xxx-xxxx",
      email: "agent@wubland.com",
      rating: 4.8,
      brokerage_firm: "WubLand Real Estate",
      experience_years: "5+",
      total_completed_deals: 50,
      languages: ["English", "Amharic"],
      is_available: false,
      commission_rate: "2.5%",
      service_fee: "0%",
      license_number: "N/A",
      license_expiry: "N/A",
      tin_number: "N/A",
      specialization: ["Residential", "Commercial"],
      service_areas: ["Addis Ababa", "Other Regions"],
      bio: "Experienced real estate agent",
      bio_amharic: "የልምድ ያለው የንብረት ወኪል",
      bio_english: "Experienced real estate agent"
    };

    // Merge provided broker data with defaults
    const mergedBroker = { ...defaultBroker, ...broker };
    
    // Format name properly
    const fullName = broker?.first_name && broker?.last_name 
      ? `${broker.first_name} ${broker.last_name}`
      : broker?.name || broker?.full_name || `${mergedBroker.first_name} ${mergedBroker.last_name}`;
    
    // Format phone number
    const phone = broker?.phone_number || broker?.phone || mergedBroker.phone_number;
    const formattedPhone = phone?.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") || mergedBroker.phone_number;
    
    // Format experience
    const experience = broker?.experience_years || broker?.years_experience || mergedBroker.experience_years;
    
    // Format rating
    const rating = broker?.rating || broker?.average_rating || mergedBroker.rating;
    
    // Format brokerage firm
    const firm = broker?.brokerage_firm || broker?.firm_name || mergedBroker.brokerage_firm;
    
    return {
      full_name: fullName,
      profile_picture: broker?.profile_picture || broker?.avatar || mergedBroker.profile_picture,
      phone_number: formattedPhone,
      email: broker?.email || mergedBroker.email,
      rating: rating,
      brokerage_firm: firm,
      experience_years: experience,
      total_completed_deals: broker?.total_completed_deals || broker?.total_sales || mergedBroker.total_completed_deals,
      languages: broker?.languages || mergedBroker.languages,
      is_available: broker?.is_available || broker?.is_online || mergedBroker.is_available,
      commission_rate: broker?.commission_rate || mergedBroker.commission_rate,
      service_fee: broker?.service_fee || mergedBroker.service_fee,
      license_number: broker?.license_number || mergedBroker.license_number,
      license_expiry: broker?.license_expiry || mergedBroker.license_expiry,
      tin_number: broker?.tin_number || mergedBroker.tin_number,
      specialization: broker?.specialization || mergedBroker.specialization,
      service_areas: broker?.service_areas || mergedBroker.service_areas,
      bio: broker?.bio || broker?.bio_english || mergedBroker.bio,
      bio_amharic: broker?.bio_amharic || mergedBroker.bio_amharic,
      bio_english: broker?.bio_english || mergedBroker.bio_english,
      broker_type: broker?.broker_type || "external",
      is_verified: broker?.is_verified || broker?.verified || false,
      verified_at: broker?.verified_at || null,
      max_clients: broker?.max_clients || 10,
      current_active_clients: broker?.current_active_clients || 0
    };
  };

  const brokerInfo = getBrokerInfo();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-md rounded-xl shadow-2xl ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
        {/* Header */}
        <div className={`p-6 border-b ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"}`}>
                <Calendar className={`w-5 h-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Schedule a Viewing</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">{property?.title || "Property Tour"}</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Request Submitted!</h3>
              <p className="text-gray-600 dark:text-gray-300">The agent will contact you shortly to confirm the viewing.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property & Agent Info */}
              <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
                <div className="flex items-center gap-3">
                  {brokerInfo.profile_picture ? (
                    <img src={brokerInfo.profile_picture} alt={brokerInfo.full_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      {brokerInfo.full_name?.charAt(0) || "A"}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{brokerInfo.full_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {brokerInfo.brokerage_firm} • {brokerInfo.experience_years} years experience
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-amber-500">★ {brokerInfo.rating}/5</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">• {brokerInfo.total_completed_deals} deals</span>
                    </div>
                  </div>
                </div>
                
                {/* Broker Verification Badge */}
                {brokerInfo.is_verified && (
                  <div className="mt-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Verified Broker</span>
                  </div>
                )}
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Select Date
                  </div>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${theme === "dark"
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Preferred Time
                  </div>
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${theme === "dark"
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Select a time</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Additional Notes (Optional)
                  </div>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Any special requests or questions for the agent..."
                  className={`w-full px-4 py-3 rounded-lg border ${theme === "dark"
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                />
              </div>

              {/* User Info (pre-filled if available) */}
              {user && (
                <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Contact Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{user.name || "User"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{user.email || "user@example.com"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Broker Contact Info Summary */}
              <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-blue-900/20 border border-blue-800/30" : "bg-blue-50 border border-blue-200"}`}>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Broker Contact Information</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{brokerInfo.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{brokerInfo.email}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedDate || !selectedTime}
                className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isSubmitting || !selectedDate || !selectedTime
                    ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Scheduling...
                  </>
                ) : (
                  "Schedule Viewing"
                )}
              </button>

              {/* Note */}
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                The agent will confirm the appointment within 24 hours
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleViewingModal;