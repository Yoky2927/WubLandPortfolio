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
import { apiCall } from "../utils/api.endpoints"; // Assuming you have this utility

// Contact Agent Popup Component with meeting scheduling
const ContactAgentPopup = ({ agent, property, isOpen, onClose }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("message"); // "message" or "schedule"
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: `I'm interested in ${property?.address}`
  });
  
  // Meeting scheduling state
  const [meetingData, setMeetingData] = useState({
    meetingType: "property_showing",
    date: "",
    startTime: "",
    endTime: "",
    meetingLocation: "property", // "property", "virtual", "office"
    virtualMeetingUrl: "",
    additionalGuests: 0,
    notes: ""
  });
  
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load broker's availability when popup opens
  useEffect(() => {
    if (isOpen && agent?.id) {
      loadBrokerAvailability();
      // Reset form data
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
      // Fetch broker's availability from backend
      const response = await apiCall('GET_BROKER_AVAILABILITY', { id: agent.id });
      
      if (response.success && response.availability) {
        // Generate available time slots based on broker's schedule
        const slots = generateTimeSlots(response.availability);
        setAvailableTimeSlots(slots);
      }
    } catch (error) {
      console.error("Error loading broker availability:", error);
      // Generate default time slots if API fails
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

  const generateTimeSlots = (availability) => {
    // Logic to generate time slots based on broker's availability
    // This is a simplified version - you'd implement based on your actual data structure
    return generateDefaultTimeSlots();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (activeTab === "message") {
        // Send message only
        await sendMessage();
      } else if (activeTab === "schedule") {
        // Schedule meeting
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
    
    // Call your API to send message
    await apiCall('SEND_MESSAGE_TO_AGENT', {}, { data: messageData });
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
      organizerUserId: agent?.id, // The broker
      brokerId: agent?.id,
      status: 'scheduled',
      
      // Attendee data
      attendees: [{
        userId: null, // Will be associated after user creation/login
        attendeeRole: 'client',
        attendeeStatus: 'accepted',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        additionalGuests: meetingData.additionalGuests
      }],
      
      // Client information
      clientInfo: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      }
    };

    // Call your API to create appointment
    await apiCall('CREATE_APPOINTMENT', {}, { data: appointmentData });
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