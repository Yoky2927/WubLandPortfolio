import React, { useState, useEffect, useRef } from "react";
import {
  X, MapPin, Bed, Bath, Ruler, Car, Calendar, School,
  Heart, Share2, Download, Home, Building, TrendingUp,
  Layers, ZoomIn, ExternalLink, Star, Clock,
  Users, Shield, Wifi, Coffee, Dumbbell,
  ChevronLeft, ChevronRight, Play, Pause, Eye, Phone, Mail,
  ArrowRight, Search, Compass, FileText, ChevronDown, ChevronUp,
  Clock as ClockIcon, Video, Home as HomeIcon, Building2
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// Enhanced Contact Agent Popup with meeting scheduling
const ContactAgentPopup = ({ agent, property, isOpen, onClose }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("message");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: `I'm interested in ${property?.address}`
  });
  
  const [meetingData, setMeetingData] = useState({
    meetingType: "property_showing",
    date: "",
    startTime: "",
    endTime: "",
    meetingLocation: "property",
    virtualMeetingUrl: "",
    additionalGuests: 0,
    notes: ""
  });
  
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && agent?.id) {
      loadBrokerAvailability();
      setFormData({
        name: "",
        phone: "",
        email: "",
        message: `I'm interested in ${property?.address}`
      });
      setMeetingData({
        meetingType: "property_showing",
        date: formatDateForInput(new Date()),
        startTime: "09:00",
        endTime: "10:00",
        meetingLocation: "property",
        virtualMeetingUrl: "",
        additionalGuests: 0,
        notes: ""
      });
      setActiveTab("message");
    }
  }, [isOpen, agent?.id, property?.address]);

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  const loadBrokerAvailability = async () => {
    if (!agent?.id) return;
    
    setLoadingSlots(true);
    try {
      // Generate default time slots
      const defaultSlots = generateDefaultTimeSlots();
      setAvailableTimeSlots(defaultSlots);
    } catch (error) {
      console.error("Error loading broker availability:", error);
      const defaultSlots = generateDefaultTimeSlots();
      setAvailableTimeSlots(defaultSlots);
    } finally {
      setLoadingSlots(false);
    }
  };

  const generateDefaultTimeSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour}:00 - ${hour + 1}:00`,
        available: true
      });
    }
    return slots;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (activeTab === "message") {
        await sendMessage();
      } else if (activeTab === "schedule") {
        await scheduleMeeting();
      }
      
      alert('Request sent successfully! The agent will contact you soon.');
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      alert('There was an error sending your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendMessage = async () => {
    const messageData = {
      agentId: agent?.id,
      propertyId: property?.id,
      ...formData,
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending message:', messageData);
    // TODO: Integrate with your API
  };

  const scheduleMeeting = async () => {
    if (!meetingData.date || !meetingData.startTime) {
      alert('Please select a date and time for the meeting.');
      return;
    }

    const appointmentData = {
      appointmentType: meetingData.meetingType,
      title: `${meetingData.meetingType === 'property_showing' ? 'Property Showing' : 'Consultation'} - ${property?.address}`,
      description: formData.message || `Meeting regarding ${property?.address}`,
      startTime: `${meetingData.date}T${meetingData.startTime}:00`,
      endTime: `${meetingData.date}T${meetingData.endTime || (parseInt(meetingData.startTime.split(':')[0]) + 1).toString().padStart(2, '0') + ':00'}:00`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locationType: meetingData.meetingLocation,
      locationAddress: meetingData.meetingLocation === 'property' ? property?.address : '',
      virtualMeetingUrl: meetingData.meetingLocation === 'virtual' ? meetingData.virtualMeetingUrl : '',
      propertyId: property?.id,
      organizerUserId: agent?.id,
      brokerId: agent?.id,
      status: 'scheduled',
      
      clientInfo: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      }
    };

    console.log('Scheduling meeting:', appointmentData);
    // TODO: Integrate with your API
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className={`max-w-2xl w-full rounded-2xl shadow-2xl border ${
          theme === "dark" 
            ? "bg-gray-900 border-gray-700" 
            : "bg-white border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-xl font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Contact {agent?.name}
            </h3>
            <button 
              onClick={onClose} 
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark" 
                  ? "hover:bg-gray-800 text-gray-400 hover:text-white" 
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
              }`}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab("message")}
              className={`pb-3 px-4 font-medium transition-all ${
                activeTab === "message"
                  ? "border-b-2 border-amber-500 text-amber-500"
                  : theme === "dark"
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Mail size={16} className="inline mr-2" />
              Send Message
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`pb-3 px-4 font-medium transition-all ${
                activeTab === "schedule"
                  ? "border-b-2 border-amber-500 text-amber-500"
                  : theme === "dark"
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calendar size={16} className="inline mr-2" />
              Schedule Meeting
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Agent Info */}
          <div className={`flex items-center space-x-4 mb-6 p-4 rounded-xl ${
            theme === "dark" 
              ? "bg-gray-800 border border-gray-700" 
              : "bg-gray-50 border border-gray-200"
          }`}>
            <img 
              src={agent?.photo || "/api/placeholder/60/60"} 
              alt={agent?.name} 
              className="w-14 h-14 rounded-full border-2 border-amber-500 shadow-sm"
            />
            <div className="flex-1">
              <h4 className={`font-semibold text-lg ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {agent?.name}
              </h4>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                {agent?.company}
              </p>
              <div className="flex items-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-amber-500 fill-amber-500" />
                ))}
                <span className="text-xs ml-2 text-amber-600 dark:text-amber-400">4.8/5</span>
                <span className="mx-2 text-gray-500">•</span>
                <span className="text-xs text-green-500 dark:text-green-400 flex items-center">
                  <ClockIcon size={10} className="mr-1" />
                  Usually responds within 2 hours
                </span>
              </div>
            </div>
          </div>

          {/* Content based on active tab */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Contact Information */}
            <div className="space-y-4">
              <h4 className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Your Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl transition-all ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    }`}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl transition-all ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    }`}
                    placeholder="Your phone number"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-4 py-3 border rounded-xl transition-all ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    }`}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Tab-specific content */}
            {activeTab === "message" ? (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows="4"
                  className={`w-full px-4 py-3 border rounded-xl resize-none transition-all ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  }`}
                  required
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Meeting Type */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Meeting Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { value: "property_showing", label: "Property Showing", icon: HomeIcon },
                      { value: "consultation", label: "Consultation", icon: Users },
                      { value: "virtual_tour", label: "Virtual Tour", icon: Video }
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setMeetingData({...meetingData, meetingType: type.value})}
                        className={`p-4 border rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                          meetingData.meetingType === type.value
                            ? "bg-amber-500 text-white border-amber-500 shadow-lg"
                            : theme === "dark"
                              ? "border-gray-600 hover:border-amber-400 hover:bg-gray-800 text-gray-300"
                              : "border-gray-300 hover:border-amber-400 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <type.icon size={16} />
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Date *
                    </label>
                    <input
                      type="date"
                      value={meetingData.date}
                      onChange={(e) => setMeetingData({...meetingData, date: e.target.value})}
                      min={formatDateForInput(new Date())}
                      className={`w-full px-4 py-3 border rounded-xl transition-all ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Time *
                    </label>
                    <select
                      value={meetingData.startTime}
                      onChange={(e) => setMeetingData({...meetingData, startTime: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-xl transition-all ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      }`}
                      required
                    >
                      <option value="">Select time</option>
                      {availableTimeSlots.map((slot, index) => (
                        <option key={index} value={slot.time} disabled={!slot.available}>
                          {slot.label} {slot.available ? '' : '(Unavailable)'}
                        </option>
                      ))}
                    </select>
                    {loadingSlots && (
                      <p className="text-xs text-amber-500 mt-1">Loading available times...</p>
                    )}
                  </div>
                </div>

                {/* Meeting Location */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Meeting Location
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "property", label: "At Property", icon: HomeIcon },
                      { value: "virtual", label: "Virtual", icon: Video },
                      { value: "office", label: "Agent's Office", icon: Building2 }
                    ].map((location) => (
                      <button
                        key={location.value}
                        type="button"
                        onClick={() => setMeetingData({...meetingData, meetingLocation: location.value})}
                        className={`p-4 border rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                          meetingData.meetingLocation === location.value
                            ? "bg-amber-500 text-white border-amber-500 shadow-lg"
                            : theme === "dark"
                              ? "border-gray-600 hover:border-amber-400 hover:bg-gray-800 text-gray-300"
                              : "border-gray-300 hover:border-amber-400 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <location.icon size={16} />
                        <span>{location.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {meetingData.meetingLocation === "virtual" && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Virtual Meeting Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={meetingData.virtualMeetingUrl}
                      onChange={(e) => setMeetingData({...meetingData, virtualMeetingUrl: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-xl transition-all ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      }`}
                      placeholder="Zoom, Google Meet, or other link"
                    />
                  </div>
                )}

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Additional Guests
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={meetingData.additionalGuests}
                      onChange={(e) => setMeetingData({...meetingData, additionalGuests: parseInt(e.target.value) || 0})}
                      className={`w-full px-4 py-3 border rounded-xl transition-all ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Duration
                    </label>
                    <select
                      value={meetingData.endTime}
                      onChange={(e) => setMeetingData({...meetingData, endTime: e.target.value})}
                      className={`w-full px-4 py-3 border rounded-xl transition-all ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      }`}
                    >
                      <option value="">Auto (1 hour)</option>
                      <option value="0.5">30 minutes</option>
                      <option value="1">1 hour</option>
                      <option value="1.5">1.5 hours</option>
                      <option value="2">2 hours</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={meetingData.notes}
                    onChange={(e) => setMeetingData({...meetingData, notes: e.target.value})}
                    rows="3"
                    className={`w-full px-4 py-3 border rounded-xl resize-none transition-all ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    }`}
                    placeholder="Any special requirements or questions..."
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    {activeTab === "message" ? (
                      <>
                        <Mail size={18} className="mr-2" />
                        Send Message
                      </>
                    ) : (
                      <>
                        <Calendar size={18} className="mr-2" />
                        Schedule Meeting
                      </>
                    )}
                  </>
                )}
              </button>
              
              <div className={`text-xs text-center mt-3 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>
                <p>
                  {activeTab === "message" 
                    ? "By contacting the agent, you agree to receive communications about this property."
                    : "The agent will confirm the meeting time and location. You'll receive a confirmation email."}
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Request Tour Popup Component
const RequestTourPopup = ({ property, isOpen, onClose }) => {
  const { theme } = useTheme();
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      setSelectedTimes([]);
      setSelectedDate(new Date());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const availableTimes = [
    "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", 
    "4:00 PM", "5:00 PM", "5:30 PM", "6:00 PM"
  ];

  const toggleTime = (time) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else if (selectedTimes.length < 3) {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTimes.length === 0) {
      alert('Please select at least one time slot');
      return;
    }
    console.log('Tour requested:', { date: selectedDate, times: selectedTimes });
    alert(`Tour requested! The agent will contact you to confirm your ${selectedTimes.length} selected time slot(s).`);
    onClose();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getNextDay = (date) => new Date(date.getTime() + 24 * 60 * 60 * 1000);
  const getPrevDay = (date) => new Date(date.getTime() - 24 * 60 * 60 * 1000);

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className={`max-w-md w-full rounded-2xl shadow-2xl border ${
          theme === "dark" 
            ? "bg-gray-900 border-gray-700" 
            : "bg-white border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-xl font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Schedule Tour
            </h3>
            <button 
              onClick={onClose} 
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark" 
                  ? "hover:bg-gray-800 text-gray-400 hover:text-white" 
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              }`}
            >
              <X size={20} />
            </button>
          </div>
          <p className={`text-sm mt-2 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            {property?.address}, {property?.city}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className={`flex items-center text-sm mb-4 p-3 rounded-lg ${
              theme === "dark" 
                ? "bg-amber-900/30 border border-amber-800/50 text-amber-300" 
                : "bg-amber-50 border border-amber-200 text-amber-800"
            }`}>
              <Calendar size={16} className="mr-2 text-amber-500" />
              Select 1-3 preferred times for your tour
            </div>
            
            {/* Date Navigation */}
            <div className={`flex justify-between items-center mb-4 p-4 rounded-xl ${
              theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-gray-50 border border-gray-200"
            }`}>
              <button 
                type="button" 
                onClick={() => setSelectedDate(getPrevDay(selectedDate))}
                className={`px-4 py-2 text-sm transition-colors ${
                  theme === "dark" 
                    ? "text-gray-400 hover:text-amber-400" 
                    : "text-gray-600 hover:text-amber-600"
                }`}
              >
                ← Previous
              </button>
              <span className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {formatDate(selectedDate)}
              </span>
              <button 
                type="button" 
                onClick={() => setSelectedDate(getNextDay(selectedDate))}
                className={`px-4 py-2 text-sm transition-colors ${
                  theme === "dark" 
                    ? "text-gray-400 hover:text-amber-400" 
                    : "text-gray-600 hover:text-amber-600"
                }`}
              >
                Next →
              </button>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-3">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => toggleTime(time)}
                  className={`p-4 border rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedTimes.includes(time)
                      ? "bg-amber-500 text-white border-amber-500 shadow-lg"
                      : theme === "dark"
                        ? "border-gray-600 hover:border-amber-400 hover:bg-gray-800 text-gray-300"
                        : "border-gray-300 hover:border-amber-400 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            {/* Selected Times Summary */}
            {selectedTimes.length > 0 && (
              <div className={`mt-4 p-4 border rounded-xl ${
                theme === "dark" 
                  ? "bg-amber-900/20 border-amber-800/50 text-amber-300" 
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <p className="text-sm font-medium">
                  Selected {selectedTimes.length} time{selectedTimes.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm opacity-90 mt-1">
                  {selectedTimes.join(', ')}
                </p>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={selectedTimes.length === 0}
            className={`w-full font-semibold py-4 rounded-xl transition-all duration-300 ${
              selectedTimes.length === 0
                ? theme === "dark"
                  ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl active:scale-95'
            }`}
          >
            {selectedTimes.length === 0 ? 'Select Time Slots' : `Request Tour`}
          </button>
        </form>
      </div>
    </div>
  );
};

// Navigation Buttons Component with Homepage Logo
const NavigationButtons = ({ theme, onClose, onNavigateToProperties, property }) => {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Logo matching homepage */}
      <div className="flex items-center py-10 ">
        <img
          src="/vectors/LogoY.svg"
          alt="WubLand Logo"
          className="absolute h-52 w-52 left-[40%] -top-5 " // Match the homepage logo size
        />
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className={`p-2 rounded-lg transition-colors ${
            theme === "dark" 
              ? "hover:bg-gray-800 text-white" 
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

// Modern Image Gallery with improved visibility
const ImageGallery = ({
  images, selectedImageIndex, theme, address, progress,
  handlePrevImage, handleNextImage, handleThumbnailClick, toggleAutoPlay, isPlaying
}) => (
  <div className="relative bg-black group rounded-t-2xl overflow-hidden">
    {images.length === 0 ? (
      <div className="h-96 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center text-white">
          <Layers size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg font-semibold">No Images Available</p>
          <p className="text-sm mt-1 opacity-70">Contact agent for property photos</p>
        </div>
      </div>
    ) : (
      <>
        <div className="relative h-[500px] overflow-hidden">
          <img
            src={images[selectedImageIndex]}
            alt={`${address} - ${selectedImageIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-500 group-"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm flex items-center space-x-2">
              <Camera size={16} />
              <span>{selectedImageIndex + 1} / {images.length}</span>
            </div>
            
            {/* Play/Pause */}
            {images.length > 1 && (
              <button
                onClick={toggleAutoPlay}
                className={`bg-black/70 text-white p-2.5 rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110 ${
                  isPlaying ? 'hover:bg-red-500/20' : 'hover:bg-green-500/20'
                }`}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
            )}
          </div>
          
          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button 
                onClick={handlePrevImage} 
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:scale-110"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={handleNextImage} 
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:scale-110"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          
          {/* Progress Bar */}
          {images.length > 1 && (
            <div className="absolute bottom-20 left-0 right-0 px-4">
              <div className="h-1 bg-gray-600/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-100 rounded-full" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => handleThumbnailClick(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    selectedImageIndex === i 
                      ? "border-amber-500 scale-110 shadow-lg" 
                      : "border-transparent opacity-70 hover:opacity-100 hover:border-amber-300"
                  }`}
                >
                  <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    )}
  </div>
);

// Property Stats Component with consistent styling
const PropertyStats = ({ beds, baths, sqft, garage, estPayment, theme, formatCurrency }) => (
  <div className={`p-6 border-y ${
    theme === "dark" ? "border-gray-700" : "border-gray-200"
  }`}>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { icon: Bed, label: "Beds", value: beds, color: "text-amber-500" },
        { icon: Bath, label: "Baths", value: baths, color: "text-amber-500" },
        { icon: Ruler, label: "Sq Ft", value: sqft?.toLocaleString(), color: "text-amber-500" },
        { icon: Car, label: "Garage", value: garage || '-', color: "text-amber-500" }
      ].map((stat, i) => (
        <div key={i} className={`text-center p-3 rounded-xl transition-all duration-300  ${
          theme === "dark" ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"
        }`}>
          <div className="flex items-center justify-center mb-2">
            <stat.icon size={20} className={`${stat.color}`} />
          </div>
          <div className={`text-lg font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            {stat.value}
          </div>
          <div className={`text-xs ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
    {estPayment && (
      <div className={`mt-4 p-4 text-center border rounded-xl ${
        theme === "dark" 
          ? "bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700" 
          : "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
      }`}>
        <span className={`text-sm font-semibold ${
          theme === "dark" ? "text-amber-300" : "text-amber-700"
        }`}>
          Estimated payment: <strong className="text-base">{formatCurrency(estPayment)}/mo</strong>
        </span>
      </div>
    )}
  </div>
);

// Broker Info Component with consistent theming
const BrokerInfo = ({ broker, mlsNumber, source, listedDate, theme, onContactAgent, onRequestTour }) => broker && (
  <div className={`sticky top-6 w-full md:w-80 border-t md:border-t-0 md:border-l p-6 ${
    theme === "dark" 
      ? "border-gray-700 bg-gradient-to-b from-gray-900 to-gray-800" 
      : "border-gray-200 bg-gradient-to-b from-white to-gray-50"
  }`}>
    <h3 className={`text-lg font-semibold mb-6 ${
      theme === "dark" ? "text-white" : "text-gray-900"
    }`}>
      Contact Agent
    </h3>
    <div className="space-y-6">
      {/* Broker Card */}
      <div className={`p-4 border rounded-xl transition-all duration-300 hover:shadow-lg ${
        theme === "dark" 
          ? "bg-gray-800 border-gray-600 hover:border-amber-500" 
          : "bg-white border-gray-200 hover:border-amber-400"
      }`}>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img 
              src={broker.photo || "/api/placeholder/80/80"} 
              alt={broker.name} 
              className="w-14 h-14 rounded-full object-cover border-2 border-amber-500 shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h4 className={`font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              {broker.name}
            </h4>
            <p className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              {broker.company}
            </p>
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className="text-amber-500 fill-amber-500" />
              ))}
              <span className="text-xs ml-2 text-amber-600 dark:text-amber-400">4.8/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button 
          onClick={onContactAgent}
          className="w-full bg-gradient-to-r from-amber-500 text-white  to-amber-600 hover:from-amber-600 hover:to-amber-700 font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center space-x-2"
        >
          <Phone size={18} />
          <span className="text-white">Contact Agent</span>
        </button>
        <button 
          onClick={onRequestTour}
          className="w-full border-2 border-amber-500  hover:bg-amber-500 hover:text-white text-amber-500 font-semibold py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95 flex items-center justify-center space-x-2"
        >
          <Calendar size={18} />
          <span className="hover:text-white text-amber-500">Schedule Tour</span>
        </button>
      </div>

      {/* Enhanced Property Page Button */}
      <div className={`p-4 border rounded-xl ${
        theme === "dark" 
          ? "bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700" 
          : "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h5 className={`font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Want More Details?
            </h5>
            <p className={`text-sm mt-1 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              View full property page
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
            <ExternalLink size={20} className="text-white" />
          </div>
        </div>
        <button className={`w-full py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
          theme === "dark"
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
        } hover:shadow-md`}>
          <Compass size={16} />
          <span className={`font-medium ${
          theme === "dark"
            ? " text-white"
            : "  text-gray-900 "
        }`}>View Property Page</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Listing Details */}
      <div className={`p-4 border rounded-xl ${
        theme === "dark" 
          ? "bg-gray-800 border-gray-600" 
          : "bg-white border-gray-200"
      }`}>
        <h5 className="font-semibold mb-3 text-amber-600 dark:text-amber-400 flex items-center">
          <FileText size={16} className="mr-2" />
          Listing Details
        </h5>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
            <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>MLS Number</span>
            <span className="font-mono font-semibold">{mlsNumber}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
            <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Source</span>
            <span className="font-semibold">{source}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Listed</span>
            <span className="font-semibold">{listedDate} days ago</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Tabs Component with improved styling
const TabsSection = ({ activeTab, setActiveTab, theme }) => {
  const tabs = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "features", label: "Features", icon: Star },
    { id: "price", label: "Price & Tax", icon: TrendingUp },
    { id: "schools", label: "Schools", icon: School },
    { id: "floorplans", label: "Floor Plans", icon: Building }
  ];

  return (
    <div className={`border-b ${
      theme === "dark" ? "border-gray-700" : "border-gray-200"
    }`}>
      <nav className="flex space-x-1 px-6 overflow-x-auto ">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-3 px-4  border-b-2 font-medium whitespace-nowrap transition-all duration-300 ${
              activeTab === tab.id 
                ? "border-amber-500 text-amber-500 text-lg" 
                : theme === "dark"
                  ? "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <tab.icon size={16} />
            <span className="text-lg text-gray-700">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// Features Section with improved visibility
const FeaturesSection = ({ features, theme }) => (
  <div>
    <h3 className={`text-lg font-semibold mb-6 ${
      theme === "dark" ? "text-white" : "text-gray-900"
    }`}>
      Features & Amenities
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {features.map((feature, i) => (
        <div key={i} className={`flex items-center space-x-3 p-3 border rounded-xl transition-all duration-300 hover:scale-[1.02] ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700 hover:border-amber-500" 
            : "bg-white border-gray-200 hover:border-amber-400"
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            theme === "dark" ? "bg-amber-500" : "bg-amber-400"
          }`}></div>
          <span className={`font-medium ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            {feature}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Facts Section with consistent theming
const FactsSection = ({ propertyType, yearBuilt, lotSize, pricePerSqft, theme, formatCurrency }) => (
  <div className={`p-6 border rounded-xl ${
    theme === "dark" 
      ? "bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700" 
      : "bg-gradient-to-r from-gray-50 to-white border-gray-200"
  }`}>
    <h4 className="font-semibold mb-4 text-amber-600 dark:text-amber-400">Property Details</h4>
    <div className="space-y-4">
      {[
        { label: "Property Type", value: propertyType },
        { label: "Year Built", value: yearBuilt },
        { label: "Lot Size", value: `${lotSize} sqft` },
        { label: "Price per sqft", value: formatCurrency(pricePerSqft), highlight: true }
      ].map((item, i) => (
        <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0 border-gray-200 dark:border-gray-600">
          <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>{item.label}</span>
          <span className={`font-semibold ${
            item.highlight ? 'text-amber-600 dark:text-amber-400' : theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Stats Section with improved visibility
const StatsSection = ({ listedDate, views, saves, theme }) => (
  <div className="flex flex-wrap gap-3">
    <span className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-300  ${
      theme === "dark" 
        ? "bg-gray-800 text-amber-300 hover:bg-gray-700" 
        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
    }`}>
      <Clock size={16} />
      <span className="font-medium text-gray-700">{listedDate} days listed</span>
    </span>
    <span className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-300  ${
      theme === "dark" 
        ? "bg-gray-800 text-amber-300 hover:bg-gray-700" 
        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
    }`}>
      <Eye size={16} />
      <span className="font-medium text-gray-700">{views} views</span>
    </span>
    <span className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-300  ${
      theme === "dark" 
        ? "bg-gray-800 text-amber-300 hover:bg-gray-700" 
        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
    }`}>
      <Heart size={16} />
      <span className="font-medium text-gray-700">{saves} saves</span>
    </span>
  </div>
);

// Price History Section with proper text colors
const PriceHistorySection = ({ priceHistory, theme, formatDate, formatCurrency }) => (
  <div>
    <h3 className={`text-lg font-semibold mb-4 ${
      theme === "dark" ? "text-white" : "text-gray-900"
    }`}>
      Price History
    </h3>
    <div className={`border rounded-xl overflow-hidden ${
      theme === "dark" ? "border-gray-700" : "border-gray-200"
    }`}>
      <div className={`grid grid-cols-3 py-3 px-4 border-b ${
        theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
      }`}>
        <span className={`font-medium text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>Date</span>
        <span className={`font-medium text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>Event</span>
        <span className={`font-medium text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>Price</span>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {priceHistory.map((item, i) => (
          <div key={i} className="grid grid-cols-3 py-3 px-4 hover:bg-gray-50  transition-colors">
            <span className={`text-sm ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>{formatDate(item.date)}</span>
            <span className={`text-sm ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>{item.event}</span>
            <span className={`text-sm font-semibold ${
              item.change ? 'text-green-600 dark:text-green-400' : theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              {formatCurrency(item.price)}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Tax History Section with proper text colors
const TaxHistorySection = ({ taxHistory, theme, formatCurrency }) => (
  <div>
    <h3 className={`text-lg font-semibold mb-4 ${
      theme === "dark" ? "text-white" : "text-gray-900"
    }`}>
      Tax History
    </h3>
    <div className={`border rounded-xl overflow-hidden ${
      theme === "dark" ? "border-gray-700" : "border-gray-200"
    }`}>
      <div className={`grid grid-cols-4 py-3 px-4 border-b ${
        theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
      }`}>
        <span className={`font-medium text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>Year</span>
        <span className={`font-medium text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>Assessment</span>
        <span className={`font-medium text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>Tax</span>
        <span className={`font-medium text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>Change</span>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {taxHistory.map((item, i) => (
          <div key={i} className="grid grid-cols-4 py-3 px-4 hover:bg-gray-50  transition-colors">
            <span className={`text-sm ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>{item.year}</span>
            <span className={`text-sm font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>{formatCurrency(item.assessment)}</span>
            <span className={`text-sm ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>{formatCurrency(item.tax)}</span>
            <span className={`text-sm ${
              item.change?.startsWith('+') ? 'text-green-600 dark:text-green-400' : 
              item.change?.startsWith('-') ? 'text-red-600 dark:text-red-400' : 
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              {item.change || '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Schools Section with proper text colors
const SchoolsSection = ({ nearbySchools, theme }) => (
  <div>
    <h3 className={`text-lg font-semibold mb-4 ${
      theme === "dark" ? "text-white" : "text-gray-900"
    }`}>
      Nearby Schools
    </h3>
    <div className="space-y-4">
      {nearbySchools.map((school, i) => (
        <div key={i} className={`p-4 border rounded-xl ${
          theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {school.name}
              </h4>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                {school.grades} • {school.type} • {school.distance} miles away
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} className={`${
                    j < Math.floor(school.rating / 2) 
                      ? 'text-amber-500 fill-amber-500' 
                      : theme === "dark" ? 'text-gray-600' : 'text-gray-300'
                  }`} />
                ))}
              </div>
              <span className={`text-sm font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>{school.rating}/10</span>
            </div>
          </div>
          {school.description && (
            <p className={`text-sm mt-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}>
              {school.description}
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Floor Plans Section with proper text colors
const FloorPlansSection = ({ floorPlans, selectedFloorPlan, setSelectedFloorPlan, theme }) => (
  <div className="space-y-6">
    <h3 className={`text-lg font-semibold mb-6 ${
      theme === "dark" ? "text-white" : "text-gray-900"
    }`}>
      Floor Plans
    </h3>
    {floorPlans.length ? (
      <>
        <div className="flex space-x-3 overflow-x-auto pb-4">
          {floorPlans.map((plan, i) => (
            <button 
              key={i} 
              onClick={() => setSelectedFloorPlan(i)} 
              className={`px-6 py-3 border font-medium whitespace-nowrap transition-all duration-300 ${
                selectedFloorPlan === i 
                  ? "bg-amber-500 border-amber-500 text-white shadow-lg" 
                  : theme === "dark" 
                    ? "border-gray-600 hover:border-gray-400 hover:bg-gray-700 text-gray-300" 
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700"
              }`}
            >
              {plan.name}
            </button>
          ))}
        </div>
        <div className={`p-6 border rounded-xl ${
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        }`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className={`text-xl font-semibold mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {floorPlans[selectedFloorPlan].name}
              </h4>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                {floorPlans[selectedFloorPlan].sqft} sqft • 
                {floorPlans[selectedFloorPlan].beds} beds • 
                {floorPlans[selectedFloorPlan].baths} baths
              </p>
            </div>
            <button className={`flex items-center space-x-2 px-6 py-3 border font-medium transition-all duration-300 ${
              theme === "dark"
                ? "border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                : "border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
            } hover:shadow-lg`}>
              <Download size={18} />
              <span>Download</span>
            </button>
          </div>
          <div className={`overflow-hidden rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-100"
          }`}>
            <img 
              src={floorPlans[selectedFloorPlan].image} 
              alt={floorPlans[selectedFloorPlan].name} 
              className="w-full h-80 object-contain" 
            />
          </div>
        </div>
      </>
    ) : (
      <div className={`text-center py-12 rounded-xl ${
        theme === "dark" ? "bg-gray-800" : "bg-gray-50"
      }`}>
        <Layers size={48} className="mx-auto mb-4 opacity-50" />
        <p className={`text-lg font-semibold mb-2 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}>No floor plans available</p>
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
          Contact agent for architectural drawings
        </p>
      </div>
    )}
  </div>
);

// Main Popup Component
const PropertyDetailsPopup = ({ property, isOpen, onClose, onNavigateToProperties, brokers = [] }) => {
  const { theme } = useTheme();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showContactAgent, setShowContactAgent] = useState(false);
  const [showRequestTour, setShowRequestTour] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(true);
  const progressIntervalRef = useRef(null);

  const SLIDE_DURATION = 5000;

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `ETB ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `ETB ${(amount / 1000).toFixed(0)}K`;
    }
    return `ETB ${amount}`;
  };
  
  const formatDate = (date) => new Date(date).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' });

  const startAutoSlide = () => {
    clearInterval(progressIntervalRef.current);
    setProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { handleNextImage(); return 0; }
        return p + (100 / (SLIDE_DURATION / 100));
      });
    }, 100);
  };

  const handleNextImage = () => { 
    setSelectedImageIndex(i => (i + 1) % (property?.images?.length || 1)); 
    setProgress(0); 
  };
  
  const handlePrevImage = () => { 
    setSelectedImageIndex(i => (i - 1 + (property?.images?.length || 1)) % (property?.images?.length || 1)); 
    setProgress(0); 
  };
  
  const handleThumbnailClick = (i) => { 
    setSelectedImageIndex(i); 
    setProgress(0); 
  };
  
  const toggleAutoPlay = () => setIsPlaying(p => !p);

  useEffect(() => {
    if (isOpen && isPlaying && property?.images?.length > 1) startAutoSlide();
    return () => clearInterval(progressIntervalRef.current);
  }, [isOpen, isPlaying, selectedImageIndex, property?.images?.length]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { 
      document.body.style.overflow = "unset"; 
      clearInterval(progressIntervalRef.current); 
    };
  }, [isOpen]);

  if (!isOpen || !property) return null;

  const {
    price, address, city, region, beds, baths, sqft, garage, propertyType, yearBuilt, lotSize, pricePerSqft,
    description, images = [], features = [], floorPlans = [], priceHistory = [], taxHistory = [], nearbySchools = [],
    broker, listedDate, views, saves, mlsNumber, source, propertyStatus, estPayment
  } = property;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md" onClick={onClose}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div
            className={`relative w-full max-w-7xl rounded-2xl overflow-hidden shadow-2xl border ${
              theme === "dark" 
                ? "bg-gray-900 border-gray-800" 
                : "bg-white border-gray-200"
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header with Navigation Buttons */}
            <div className={`p-6 border-b ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <NavigationButtons 
                theme={theme} 
                onClose={onClose} 
                onNavigateToProperties={onNavigateToProperties} 
                property={property}
              />
            </div>

            {/* Price & Address Section */}
            <div className={`p-6 border-b ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`px-3 py-1 text-xs font-semibold text-white ${
                      propertyStatus === 'for sale'
                        ? "bg-gradient-to-r from-green-500 to-green-600"
                        : "bg-gradient-to-r from-amber-500 to-amber-600"
                    } rounded-lg shadow-sm`}>
                      {propertyStatus === 'for sale' ? 'FOR SALE' : 'FOR RENT'}
                    </div>
                    <span className={`text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}>
                      MLS# {mlsNumber}
                    </span>
                  </div>
                  <h1 className={`text-2xl font-bold mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {formatCurrency(price)}
                  </h1>
                  <p className={`flex items-center text-base ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    <MapPin size={16} className="mr-2 text-amber-500" />
                    {address}, {city}, {region}
                  </p>
                </div>
                
                {/* Action Buttons */}
                {showActionButtons && (
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setIsFavorite(f => !f)} 
                      className={`p-2.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                        isFavorite 
                          ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                          : theme === "dark" 
                            ? "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700"
                            : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-300"
                      }`}
                    >
                      <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                    <button className={`p-2.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                      theme === "dark" 
                        ? "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700"
                        : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}>
                      <Share2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Left: Gallery + Stats + Tabs */}
              <div className="flex-1">
                <ImageGallery
                  images={images} selectedImageIndex={selectedImageIndex} theme={theme} address={address}
                  progress={progress} handlePrevImage={handlePrevImage} handleNextImage={handleNextImage}
                  handleThumbnailClick={handleThumbnailClick} toggleAutoPlay={toggleAutoPlay} isPlaying={isPlaying}
                />
                
                {/* Property Stats */}
                <PropertyStats 
                  beds={beds} 
                  baths={baths} 
                  sqft={sqft} 
                  garage={garage} 
                  estPayment={estPayment} 
                  theme={theme} 
                  formatCurrency={formatCurrency} 
                />

                {/* Tabs */}
                <TabsSection 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  theme={theme} 
                />

                {/* Tab Content */}
                <div className="p-6 space-y-8">
                  {activeTab === "overview" && (
                    <>
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                          Property Description
                        </h3>
                        <p className={`text-base leading-relaxed ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>
                          {description}
                        </p>
                      </div>
                      
                      <FactsSection 
                        propertyType={propertyType}
                        yearBuilt={yearBuilt}
                        lotSize={lotSize}
                        pricePerSqft={pricePerSqft}
                        theme={theme}
                        formatCurrency={formatCurrency}
                      />
                      
                      <StatsSection 
                        listedDate={listedDate}
                        views={views}
                        saves={saves}
                        theme={theme}
                      />
                    </>
                  )}

                  {activeTab === "features" && (
                    <FeaturesSection features={features} theme={theme} />
                  )}
                  
                  {activeTab === "price" && (
                    <div className="space-y-8">
                      <PriceHistorySection 
                        priceHistory={priceHistory} 
                        theme={theme} 
                        formatDate={formatDate} 
                        formatCurrency={formatCurrency} 
                      />
                      <TaxHistorySection 
                        taxHistory={taxHistory} 
                        theme={theme} 
                        formatCurrency={formatCurrency} 
                      />
                    </div>
                  )}

                  {activeTab === "schools" && (
                    <SchoolsSection nearbySchools={nearbySchools} theme={theme} />
                  )}

                  {activeTab === "floorplans" && (
                    <FloorPlansSection 
                      floorPlans={floorPlans} 
                      selectedFloorPlan={selectedFloorPlan} 
                      setSelectedFloorPlan={setSelectedFloorPlan} 
                      theme={theme} 
                    />
                  )}
                </div>
              </div>

              {/* Right Sidebar */}
              <BrokerInfo 
                broker={broker} 
                mlsNumber={mlsNumber} 
                source={source} 
                listedDate={listedDate} 
                theme={theme} 
                onContactAgent={() => setShowContactAgent(true)}
                onRequestTour={() => setShowRequestTour(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Popup Modals */}
      <ContactAgentPopup 
        agent={broker}
        property={property}
        isOpen={showContactAgent}
        onClose={() => setShowContactAgent(false)}
      />

      <RequestTourPopup 
        property={property}
        isOpen={showRequestTour}
        onClose={() => setShowRequestTour(false)}
      />
    </>
  );
};

// Missing Camera icon component
const Camera = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default PropertyDetailsPopup;