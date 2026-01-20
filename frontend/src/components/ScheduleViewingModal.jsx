import React, { useState, useRef, useEffect } from "react";
import {
  X, Calendar, Clock, User, Mail, Phone, MessageCircle, CheckCircle,
  AlertCircle, Home, MapPin, Users, Star, ChevronRight,
  ChevronDown, ChevronUp, Building, Loader, Check, AlertTriangle,
  Target, Briefcase, ShieldCheck, FileText, Eye, History,
  Handshake, RefreshCw, ArrowRight, CalendarCheck, CalendarX2,
  Bell, BellOff, Copy, Link, ExternalLink, Info, Edit, Trash2, EyeIcon
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiCall } from "../utils/api.endpoints";
import { useTheme } from "../contexts/ThemeContext";

const ScheduleViewingModal = ({ isOpen, onClose, property, broker, user, theme }) => {
  const { theme: currentTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [brokerDetails, setBrokerDetails] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAvailability, setShowAvailability] = useState(true);
  const [selectedBrokerId, setSelectedBrokerId] = useState(null);
  const [brokerOptions, setBrokerOptions] = useState([]);
  const [showBrokerSelector, setShowBrokerSelector] = useState(false);
  const [userAppointments, setUserAppointments] = useState([]);
  const [existingAppointment, setExistingAppointment] = useState(null);
  const [viewMode, setViewMode] = useState('schedule'); // 'schedule', 'view-existing', 'confirm-existing'
  const [appointmentType, setAppointmentType] = useState('property_viewing');
  const [step, setStep] = useState(1); // 1: Date/Time, 2: Details, 3: Confirm

  const rightColumnRef = useRef(null);
  const isDark = currentTheme === "dark";

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  // Scroll to top of right column when form changes
  useEffect(() => {
    if (rightColumnRef.current) {
      rightColumnRef.current.scrollTop = 0;
    }
  }, [selectedDate, selectedTime, appointmentType, step, viewMode]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch broker details if broker ID is provided
      if (broker?.id) {
        await fetchBrokerDetails(broker.id);
      } else if (property?.broker_id || property?.assigned_broker_id) {
        await fetchBrokerDetails(property.broker_id || property.assigned_broker_id);
      } else {
        setBrokerDetails({
          id: 'default-broker',
          name: "Property Agent",
          email: "agent@wubland.com",
          phone_number: "(xxx) xxx-xxxx",
          profile_picture: null,
          brokerage_firm: "WubLand Real Estate",
          experience_years: "5+",
          commission_rate: "2.5%",
          total_completed_deals: 50,
          average_rating: 4.8,
          is_verified: false,
          is_available: true
        });
      }

      // Fetch property details
      if (property?.id) {
        await fetchPropertyDetails(property.id);
      }

      // Fetch available brokers
      await fetchBrokerOptions();

      // Fetch user's existing appointments for this property
      await fetchUserAppointmentsForProperty();

      // Generate available dates and times
      generateAvailability();

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load schedule data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrokerDetails = async (brokerId) => {
    const brokerIdStr = String(brokerId || '');

    if (!brokerIdStr ||
      brokerIdStr === 'default-broker' ||
      brokerIdStr.includes('default-broker-') ||
      brokerIdStr.includes('broker-') ||
      brokerIdStr.includes('fake-')) {
      setBrokerDetails({
        id: brokerIdStr || 'default-broker',
        name: "Property Agent",
        first_name: "Property",
        last_name: "Agent",
        email: "agent@wubland.com",
        phone_number: "(xxx) xxx-xxxx",
        profile_picture: null,
        brokerage_firm: "WubLand Real Estate",
        experience_years: "5+",
        commission_rate: "2.5%",
        total_completed_deals: 50,
        average_rating: 4.8,
        rating: 4.8,
        is_verified: false,
        is_available: true
      });
      return;
    }

    try {
      const response = await apiCall('GET_BROKER_DETAILS', { id: brokerIdStr });

      if (response) {
        let brokerData = response;
        if (response.data) brokerData = response.data;
        if (response.broker) brokerData = response.broker;

        if (!brokerData.name && (brokerData.first_name || brokerData.last_name)) {
          brokerData.name = `${brokerData.first_name || ''} ${brokerData.last_name || ''}`.trim();
        }

        if (!brokerData.first_name && brokerData.name) {
          const nameParts = brokerData.name.split(' ');
          brokerData.first_name = nameParts[0] || '';
          brokerData.last_name = nameParts.slice(1).join(' ') || '';
        }

        if (brokerData.rating !== undefined && brokerData.rating !== null) {
          brokerData.rating = parseFloat(brokerData.rating);
          if (isNaN(brokerData.rating)) brokerData.rating = 4.8;
        }

        setBrokerDetails(brokerData);
      } else {
        setBrokerDetails(broker);
      }
    } catch (error) {
      console.error("Error fetching broker details:", error);
      setBrokerDetails({
        id: brokerIdStr,
        name: "Property Agent",
        first_name: "Property",
        last_name: "Agent",
        email: "agent@wubland.com",
        phone_number: "(xxx) xxx-xxxx",
        profile_picture: null,
        brokerage_firm: "WubLand Real Estate",
        experience_years: "5+",
        commission_rate: "2.5%",
        total_completed_deals: 50,
        average_rating: 4.8,
        rating: 4.8,
        is_verified: false,
        is_available: true
      });
    }
  };

  const fetchPropertyDetails = async (propertyId) => {
    try {
      const response = await apiCall('GET_PROPERTY_BY_ID', { id: propertyId });
      if (response) {
        setPropertyDetails(response);
      }
    } catch (error) {
      console.log("Could not fetch property details:", error);
    }
  };

  const fetchBrokerOptions = async () => {
    try {
      const response = await apiCall('GET_BROKERS');

      if (response && response.success && response.brokers && Array.isArray(response.brokers)) {
        const formattedBrokers = response.brokers.map(broker => {
          const name = broker.name || `${broker.first_name || ''} ${broker.last_name || ''}`.trim();
          const nameParts = name.split(' ');

          let rating = 4.8;
          if (broker.rating !== undefined && broker.rating !== null) {
            rating = parseFloat(broker.rating);
          } else if (broker.average_rating !== undefined && broker.average_rating !== null) {
            rating = parseFloat(broker.average_rating);
          }

          return {
            id: broker.id,
            name: name,
            first_name: nameParts[0] || name,
            last_name: nameParts.slice(1).join(' ') || '',
            email: broker.email,
            phone_number: broker.phone_number,
            profile_picture: broker.profile_picture,
            rating: isNaN(rating) ? 4.8 : rating,
            brokerage_firm: broker.brokerage_firm || "Independent Broker",
            experience_years: broker.years_experience || broker.experience_years || "5+",
            total_completed_deals: broker.completed_deals || broker.total_completed_deals || 50,
            is_verified: broker.is_verified === 1 || broker.is_verified === true,
            is_available: broker.is_available === 1 || broker.is_available === true,
          };
        });

        setBrokerOptions(formattedBrokers);
      } else {
        setBrokerOptions([]);
      }
    } catch (error) {
      console.error("Error fetching broker options:", error);
      setBrokerOptions([]);
    }
  };

  const fetchUserAppointmentsForProperty = async () => {
    try {
      const response = await apiCall('GET_APPOINTMENTS', {}, {
        data: {
          limit: 50,
          offset: 0
        }
      });

      if (response && response.success && response.data) {
        const propertyId = property?.id || propertyDetails?.id;
        const userId = user?.id;

        const propertyAppointments = response.data.filter(appointment => {
          const isOrganizer = appointment.organizer_user_id === userId;
          const isAttendee = appointment.attendees?.some(attendee => attendee.user_id === userId);
          const isPropertyAppointment = appointment.property_id === propertyId;

          return (isOrganizer || isAttendee) && isPropertyAppointment;
        });

        setUserAppointments(propertyAppointments);

        // Find the most recent scheduled/confirmed appointment
        const existing = propertyAppointments
          .filter(app => app.status === 'scheduled' || app.status === 'confirmed')
          .sort((a, b) => new Date(b.scheduled_date || b.start_time) - new Date(a.scheduled_date || a.start_time))[0];

        if (existing) {
          setExistingAppointment(existing);
          // Auto-show existing appointment view if there's one
          setViewMode('view-existing');
        }
      }
    } catch (error) {
      console.log("Could not fetch user appointments:", error);
    }
  };

  const generateAvailability = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    setAvailableDates(dates);

    const times = [];
    for (let hour = 9; hour <= 17; hour++) {
      const timeStr = hour.toString().padStart(2, '0') + ':00';
      times.push(timeStr);
    }
    setAvailableTimes(times);
  };

  const getCurrentBroker = () => {
    // First, try to use the broker passed as prop
    if (broker && broker.id !== undefined) {
      return broker;
    }

    // Second, try to use the broker details we fetched
    if (brokerDetails && brokerDetails.id !== undefined) {
      return brokerDetails;
    }

    // Third, try to find the selected broker from options
    if (selectedBrokerId && brokerOptions.length > 0) {
      const selectedBroker = brokerOptions.find(b =>
        String(b.id) === String(selectedBrokerId) ||
        String(b._id) === String(selectedBrokerId)
      );
      if (selectedBroker && selectedBroker.id !== undefined) {
        return selectedBroker;
      }
    }

    // Fourth, use the first broker from options
    if (brokerOptions.length > 0 && brokerOptions[0].id !== undefined) {
      return brokerOptions[0];
    }

    // Finally, fall back to default broker
    return {
      id: "default-broker",
      first_name: "Property",
      last_name: "Agent",
      name: "Property Agent",
      email: "agent@wubland.com",
      phone_number: "(xxx) xxx-xxxx",
      rating: 4.8,
      brokerage_firm: "WubLand Real Estate",
      experience_years: "5+",
      total_completed_deals: 50,
      is_verified: false,
      is_available: true,
      profile_picture: null
    };
  };

  const checkExistingAppointment = () => {
    return userAppointments.some(appointment =>
      appointment.status === 'scheduled' || appointment.status === 'confirmed'
    );
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);

    const existingOnDate = userAppointments.find(app => {
      const appDate = app.scheduled_date || app.start_time?.split('T')[0];
      return appDate === date && (app.status === 'scheduled' || app.status === 'confirmed');
    });

    if (existingOnDate) {
      toast.error(`You already have an appointment on this date at ${formatTime(existingOnDate.start_time)}`);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);

    const existingAtTime = userAppointments.find(app => {
      const appTime = app.start_time?.split('T')[1]?.substring(0, 5);
      const appDate = app.scheduled_date || app.start_time?.split('T')[0];
      return appDate === selectedDate && appTime === time && (app.status === 'scheduled' || app.status === 'confirmed');
    });

    if (existingAtTime) {
      toast.error(`You already have an appointment at this time`);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && (!selectedDate || !selectedTime)) {
      toast.error("Please select date and time");
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🔍 Current broker before submit:', {
      broker: getCurrentBroker(),
      brokerId: getCurrentBroker().id,
      brokerIdType: typeof getCurrentBroker().id,
      brokerOptions: brokerOptions,
      selectedBrokerId: selectedBrokerId
    });

    if (!selectedDate || !selectedTime) {
      toast.error("Please select date and time");
      return;
    }

    setIsSubmitting(true);

    const hasExisting = checkForExistingAppointment(selectedDate, selectedTime);

    if (hasExisting) {
      toast.error("You already have an appointment at this time. Please choose a different time.");
      return;
    }

    try {
      const currentBroker = getCurrentBroker();

      // Fix: Convert broker ID to string for the check
      const brokerIdStr = String(currentBroker.id || '');
      const isDefaultBroker = brokerIdStr.includes('default') ||
        brokerIdStr.includes('fake') ||
        brokerIdStr === 'default-broker' ||
        brokerIdStr === '' ||
        brokerIdStr === 'undefined' ||
        brokerIdStr === 'null';

      const appointmentData = {
        title: `${appointmentType === 'property_viewing' ? 'Property Viewing' : 'Consultation'}: ${property?.title || 'Property'}`,
        description: message ||
          `${appointmentType === 'property_viewing' ? 'Property viewing' : 'Consultation'} requested by ${user?.name || user?.first_name || 'User'}. ${message ? 'Additional notes: ' + message : ''}`,
        appointment_type: appointmentType,
        scheduled_date: selectedDate,
        start_time: `${selectedDate}T${selectedTime}:00`,
        end_time: `${selectedDate}T${parseInt(selectedTime.split(':')[0]) + 1}:${selectedTime.split(':')[1]}:00`,
        duration_minutes: 60,
        timezone: 'UTC',
        location_type: appointmentType === 'property_viewing' ? 'property' : 'virtual',
        location_address: property?.location || property?.address || 'Property location',
        virtual_meeting_url: appointmentType === 'consultation' ? 'https://meet.google.com/xxx-xxxx-xxx' : null,
        property_id: property?.id || propertyDetails?.id,
        // Fix: Check if broker ID is a valid, non-default broker ID
        broker_id: !isDefaultBroker && brokerIdStr ? currentBroker.id : null,
        status: 'scheduled',
        max_attendees: 5
      };

      console.log('📅 Appointment data to submit:', appointmentData);

      const response = await apiCall('CREATE_APPOINTMENT', {}, {
        method: 'POST',
        data: appointmentData
      });

      if (response && response.success) {
        setIsSubmitted(true);

        if (user?.id) {
          try {
            await apiCall('ADD_APPOINTEE', { appointmentId: response.data.id }, {
              method: 'POST',
              data: {
                user_id: user.id,
                attendee_role: 'client',
                attendee_status: 'confirmed'
              }
            });
          } catch (attendeeError) {
            console.log("Could not add attendee:", attendeeError);
          }
        }

        toast.success(`${appointmentType === 'property_viewing' ? 'Viewing' : 'Consultation'} scheduled successfully!`);
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(response?.message || "Failed to schedule appointment");
      }
    } catch (error) {
      console.error("Error scheduling appointment:", error);

      // Log the full error response if available
      if (error.response) {
        console.error("Full error response:", error.response);
      }

      if (error.message.includes('409') || error.message.includes('Time slot is not available')) {
        // Show a more specific error message
        const conflictMessage = error.message.includes('already')
          ? "You already have an appointment for this property at this time."
          : "This time slot is already booked. Please choose a different date or time.";

        toast.error(conflictMessage);
      } else if (error.message.includes('500')) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(error.message || "Failed to schedule appointment");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkForExistingAppointment = (date, time) => {
    return userAppointments.some(appointment => {
      const appDate = appointment.scheduled_date || appointment.start_time?.split('T')[0];
      const appTime = appointment.start_time?.split('T')[1]?.substring(0, 5);
      return appDate === date && appTime === time &&
        (appointment.status === 'scheduled' || appointment.status === 'confirmed');
    });
  };
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    if (typeof time === 'string' && time.includes('T')) {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const formatDateTime = (date, time) => {
    return `${formatDate(date)} at ${formatTime(time)}`;
  };

  const handleViewExisting = () => {
    setViewMode('view-existing');
    // Also show the date/time in the calendar
    if (existingAppointment?.scheduled_date) {
      setSelectedDate(existingAppointment.scheduled_date);
      const time = existingAppointment.start_time?.split('T')[1]?.substring(0, 5);
      if (time) {
        setSelectedTime(time);
      }
    }
  };

  const handleScheduleAdditional = () => {
    setViewMode('schedule');
    setStep(1);
    toast.info("You can now schedule an additional appointment");
  };

  const handleCancelExistingAppointment = async () => {
    if (!existingAppointment?.id) return;

    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const response = await apiCall('UPDATE_APPOINTMENT_STATUS',
        { id: existingAppointment.id },
        { data: { status: 'cancelled' } }
      );

      if (response && response.success) {
        toast.success("Appointment cancelled successfully");
        // Refresh appointments
        await fetchUserAppointmentsForProperty();
        setViewMode('schedule');
      } else {
        throw new Error("Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  const handleRescheduleExisting = () => {
    setViewMode('schedule');
    setStep(1);
    // Pre-fill with existing appointment's date/time
    if (existingAppointment?.scheduled_date) {
      setSelectedDate(existingAppointment.scheduled_date);
      const time = existingAppointment.start_time?.split('T')[1]?.substring(0, 5);
      if (time) {
        setSelectedTime(time);
      }
    }
    toast.info("You can now reschedule your appointment");
  };

  if (!isOpen) return null;

  const currentBroker = getCurrentBroker();
  const isBrokerAvailable = currentBroker.is_available !== false;
  const hasExistingAppointment = checkExistingAppointment();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden ${isDark
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-amber-800/30'
          : 'bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200'
          } border-2 transition-all duration-500 max-h-[95vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDark
          ? 'border-amber-800/30 bg-gradient-to-r from-amber-900/20 via-amber-800/20 to-amber-900/20'
          : 'border-amber-200 bg-gradient-to-r from-amber-50/80 via-amber-100/50 to-amber-50/80'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isDark
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20'
                : 'bg-gradient-to-br from-amber-100 to-amber-200'
                }`}>
                <Calendar className={`w-8 h-8 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {viewMode === 'view-existing' ? 'Your Existing Appointment' :
                    viewMode === 'confirm-existing' ? 'Confirm Appointment Details' :
                      'Schedule Appointment'}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Home className={`w-4 h-4 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
                    <span className={`text-sm font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                      {property?.title?.substring(0, 30) || propertyDetails?.title?.substring(0, 30) || 'Property'}...
                    </span>
                  </div>
                  <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-amber-600' : 'bg-amber-800'}`} />
                  {hasExistingAppointment && viewMode !== 'view-existing' && (
                    <button
                      onClick={handleViewExisting}
                      className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View existing appointment
                    </button>
                  )}
                  {viewMode === 'view-existing' && (
                    <button
                      onClick={() => setViewMode('schedule')}
                      className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule new appointment
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl transition-all duration-300 ${isDark
                ? 'hover:bg-amber-900/30 hover:scale-105 text-amber-300'
                : 'hover:bg-amber-100 hover:scale-105 text-amber-600'
                } active:scale-95`}
              disabled={isLoading || isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Column - Fixed width, scrollable */}
          <div className="w-96 flex-shrink-0 p-6 space-y-6 overflow-y-auto border-r border-amber-200 dark:border-amber-800/30">
            {/* MODE SELECTOR */}
            <div className={`p-5 rounded-2xl border ${isDark
              ? 'bg-gradient-to-r from-purple-900/20 to-purple-800/20 border-purple-800/30'
              : 'bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200'
              }`}>
              <h3 className={`font-bold text-lg mb-4 font-inter ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                Appointment Options
              </h3>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setViewMode('schedule')}
                  className={`w-full p-4 rounded-xl text-left transition-all ${viewMode === 'schedule'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg border-amber-500'
                    : isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                    } border`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className={`w-5 h-5 ${viewMode === 'schedule' ? 'text-white' : 'text-amber-500'}`} />
                    <div>
                      <p className="font-semibold">Schedule New</p>
                      <p className="text-sm opacity-80">Book a new appointment</p>
                    </div>
                  </div>
                </button>

                {hasExistingAppointment && (
                  <button
                    type="button"
                    onClick={handleViewExisting}
                    className={`w-full p-4 rounded-xl text-left transition-all ${viewMode === 'view-existing'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-blue-500'
                      : isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                      } border`}
                  >
                    <div className="flex items-center gap-3">
                      <EyeIcon className={`w-5 h-5 ${viewMode === 'view-existing' ? 'text-white' : 'text-blue-500'}`} />
                      <div>
                        <p className="font-semibold">View Existing</p>
                        <p className="text-sm opacity-80">See your scheduled appointment</p>
                      </div>
                    </div>
                  </button>
                )}

                {hasExistingAppointment && (
                  <button
                    type="button"
                    onClick={handleScheduleAdditional}
                    className={`w-full p-4 rounded-xl text-left transition-all ${viewMode === 'schedule' && hasExistingAppointment
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg border-green-500'
                      : isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                      } border`}
                  >
                    <div className="flex items-center gap-3">
                      <CalendarCheck className={`w-5 h-5 ${viewMode === 'schedule' && hasExistingAppointment ? 'text-white' : 'text-green-500'}`} />
                      <div>
                        <p className="font-semibold">Schedule Additional</p>
                        <p className="text-sm opacity-80">Book another time slot</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Property Info Card */}
            <div className={`p-5 rounded-2xl border ${isDark
              ? 'bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-800/30'
              : 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg font-inter ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                    Property Details
                  </h3>
                  <p className={`text-sm font-inter ${isDark ? 'text-blue-400/80' : 'text-blue-600/80'}`}>
                    {property?.property_type || propertyDetails?.property_type || 'Residential'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Price</span>
                  <span className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {property?.price ? `ETB ${property.price.toLocaleString()}` : 'Price on Request'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Bedrooms</span>
                  <span className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {property?.beds || propertyDetails?.bedrooms || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Bathrooms</span>
                  <span className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {property?.baths || propertyDetails?.bathrooms || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                <p className={`text-sm font-inter ${isDark ? 'text-blue-400/80' : 'text-blue-600/80'}`}>
                  <MapPin className="inline w-3 h-3 mr-1" />
                  {property?.location || property?.address || 'Address not specified'}
                </p>
              </div>
            </div>

            {/* Broker Info Card */}
            <div className={`p-5 rounded-2xl border ${isDark
              ? 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-800/30'
              : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-bold text-lg font-inter ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                        Your Agent
                      </h3>
                      <p className={`text-sm font-inter ${isDark ? 'text-amber-400/80' : 'text-amber-600/80'}`}>
                        {currentBroker.brokerage_firm || 'Independent Broker'}
                      </p>
                    </div>
                    {currentBroker.is_verified && (
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                {currentBroker.profile_picture ? (
                  <img
                    src={currentBroker.profile_picture}
                    alt={currentBroker.name || "Agent"}
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-500"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl">
                    {(currentBroker.first_name?.charAt(0) ||
                      currentBroker.name?.charAt(0) ||
                      'A')?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className={`font-bold text-lg font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {currentBroker.name ||
                      `${currentBroker.first_name || ''} ${currentBroker.last_name || ''}`.trim() ||
                      'Property Agent'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className={`text-xs font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        {(() => {
                          const rating = parseFloat(currentBroker.rating || currentBroker.average_rating || 4.8);
                          return isNaN(rating) ? '4.8/5' : `${rating.toFixed(1)}/5`;
                        })()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                    <span className={`text-xs font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      {currentBroker.experience_years ||
                        currentBroker.years_experience ||
                        '5+'} years
                    </span>
                  </div>
                </div>
              </div>

              {/* Broker Contact */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className={`w-4 h-4 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
                  <span className={`text-sm font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    {currentBroker.phone_number || currentBroker.phone || '(xxx) xxx-xxxx'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className={`w-4 h-4 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
                  <span className={`text-sm font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    {currentBroker.email || 'agent@wubland.com'}
                  </span>
                </div>
              </div>
            </div>

            {/* All Appointments Card */}
            {userAppointments.length > 0 && (
              <div className={`p-5 rounded-2xl border ${isDark
                ? 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-800/30'
                : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200'
                }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg font-inter ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                      All Appointments
                    </h3>
                    <p className={`text-sm font-inter ${isDark ? 'text-amber-400/80' : 'text-amber-600/80'}`}>
                      {userAppointments.length} appointment{userAppointments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {userAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`p-3 rounded-lg border ${isDark
                        ? 'bg-gray-800/30 border-gray-700'
                        : 'bg-white border-gray-200'
                        } ${existingAppointment?.id === appointment.id ? 'ring-2 ring-amber-500' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-medium text-sm font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {appointment.title?.substring(0, 30)}...
                          </p>
                          <p className={`text-xs font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-600/80'}`}>
                            {formatDateTime(appointment.scheduled_date, appointment.start_time)}
                          </p>
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isDark
                          ? appointment.status === 'confirmed' ? 'bg-emerald-900/30 text-emerald-300' :
                            appointment.status === 'completed' ? 'bg-blue-900/30 text-blue-300' :
                              appointment.status === 'cancelled' ? 'bg-red-900/30 text-red-300' :
                                'bg-amber-900/30 text-amber-300'
                          : appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                            appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                          }`}>
                          {appointment.status === 'confirmed' ? 'Confirmed' :
                            appointment.status === 'scheduled' ? 'Scheduled' :
                              appointment.status === 'completed' ? 'Completed' : 'Cancelled'}
                        </div>
                      </div>
                      {existingAppointment?.id === appointment.id && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => {
                              setViewMode('view-existing');
                              setSelectedDate(appointment.scheduled_date);
                              const time = appointment.start_time?.split('T')[1]?.substring(0, 5);
                              if (time) setSelectedTime(time);
                            }}
                            className="flex-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setViewMode('schedule');
                              setSelectedDate(appointment.scheduled_date);
                              const time = appointment.start_time?.split('T')[1]?.substring(0, 5);
                              if (time) setSelectedTime(time);
                              toast.info("You can now modify this appointment");
                            }}
                            className="flex-1 px-2 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded"
                          >
                            Modify
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Main Content */}
          <div
            ref={rightColumnRef}
            className="flex-1 overflow-y-auto p-6"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                  <p className={`mt-4 text-lg font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    Loading schedule details...
                  </p>
                </div>
              </div>
            ) : isSubmitted ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-6">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className={`text-2xl font-bold font-montserrat mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Appointment Scheduled!
                </h3>
                <p className={`text-lg mb-6 font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Your appointment has been scheduled for <span className="font-semibold">{formatDate(selectedDate)} at {formatTime(selectedTime)}</span>.
                </p>
                <button
                  onClick={onClose}
                  className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : viewMode === 'view-existing' && existingAppointment ? (
              // VIEW EXISTING APPOINTMENT
              <div className="space-y-6">
                <div className={`rounded-2xl p-6 border ${isDark
                  ? 'bg-gradient-to-br from-blue-900/20 via-blue-800/20 to-blue-900/20 border-blue-800/30'
                  : 'bg-gradient-to-br from-blue-50 via-blue-100/20 to-blue-50 border-blue-200'
                  } shadow-lg`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${isDark
                        ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30'
                        : 'bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-200'
                        }`}>
                        <CalendarCheck className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <h2 className={`text-xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Your Scheduled Appointment
                        </h2>
                        <p className={`text-sm font-inter ${isDark ? 'text-blue-400/80' : 'text-blue-600/80'}`}>
                          View and manage your existing appointment
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-medium ${isDark
                      ? existingAppointment.status === 'confirmed' ? 'bg-emerald-900/30 text-emerald-300' :
                        existingAppointment.status === 'completed' ? 'bg-blue-900/30 text-blue-300' :
                          existingAppointment.status === 'cancelled' ? 'bg-red-900/30 text-red-300' :
                            'bg-amber-900/30 text-amber-300'
                      : existingAppointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        existingAppointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          existingAppointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                      }`}>
                      {existingAppointment.status === 'confirmed' ? 'Confirmed' :
                        existingAppointment.status === 'scheduled' ? 'Scheduled' :
                          existingAppointment.status === 'completed' ? 'Completed' : 'Cancelled'}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="space-y-6">
                    <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      <h3 className={`text-lg font-bold mb-4 font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        Appointment Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Property</p>
                          <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {property?.title || existingAppointment.property_title || 'Property'}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Date & Time</p>
                          <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatDateTime(existingAppointment.scheduled_date, existingAppointment.start_time)}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Appointment Type</p>
                          <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {existingAppointment.appointment_type === 'property_viewing' ? 'Property Viewing' : 'Consultation'}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Duration</p>
                          <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {existingAppointment.duration_minutes || 60} minutes
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Broker</p>
                          <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {existingAppointment.broker_name || 'Agent'}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Location</p>
                          <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {existingAppointment.location_address || property?.address || 'Property Location'}
                          </p>
                        </div>
                      </div>

                      {existingAppointment.description && (
                        <div className="mt-4">
                          <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Notes</p>
                          <p className={`font-inter ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {existingAppointment.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Calendar Visualization */}
                    <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-amber-50 border border-amber-100'}`}>
                      <h3 className={`text-lg font-bold mb-4 font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        Calendar View
                      </h3>

                      <div className="flex items-center justify-center">
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                          <div className="text-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              Selected Date
                            </div>
                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                              {new Date(existingAppointment.scheduled_date).getDate()}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {new Date(existingAppointment.scheduled_date).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {new Date(existingAppointment.scheduled_date).toLocaleDateString('en-US', {
                                weekday: 'long'
                              })}
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-center gap-2">
                              <Clock className="w-4 h-4 text-amber-500" />
                              <span className="font-medium">
                                {formatTime(existingAppointment.start_time)} - {formatTime(existingAppointment.end_time)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-blue-200 dark:border-blue-800/30">
                      <button
                        type="button"
                        onClick={handleRescheduleExisting}
                        className={`flex-1 py-3.5 rounded-xl font-inter transition-all duration-300 ${isDark
                          ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/40 border border-amber-800/30'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                          }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Reschedule
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={handleScheduleAdditional}
                        className={`flex-1 py-3.5 rounded-xl font-inter transition-all duration-300 ${isDark
                          ? 'bg-green-900/30 text-green-300 hover:bg-green-800/40 border border-green-800/30'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                          }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <CalendarCheck className="w-5 h-5" />
                          Schedule Additional
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelExistingAppointment}
                        className={`flex-1 py-3.5 rounded-xl font-inter transition-all duration-300 ${isDark
                          ? 'bg-red-900/30 text-red-300 hover:bg-red-800/40 border border-red-800/30'
                          : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                          }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Trash2 className="w-5 h-5" />
                          Cancel
                        </div>
                      </button>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => setViewMode('schedule')}
                        className={`text-sm font-inter ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} underline`}
                      >
                        ← Back to scheduling
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // SCHEDULE NEW APPOINTMENT
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Step Indicator */}
                {viewMode === 'schedule' && (
                  <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-8">
                      {['Date & Time', 'Details', 'Confirm'].map((stepName, index) => (
                        <div key={stepName} className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${step === index + 1
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white ring-4 ring-amber-500/20'
                            : step > index + 1
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                              : (isDark ? 'bg-gray-800 text-gray-400 ring-2 ring-gray-700' : 'bg-gray-200 text-gray-600 ring-2 ring-gray-200')
                            }`}>
                            {step > index + 1 ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-inter ${step === index + 1
                              ? (isDark ? 'text-amber-300' : 'text-amber-700')
                              : step > index + 1
                                ? (isDark ? 'text-emerald-300' : 'text-emerald-700')
                                : (isDark ? 'text-gray-400' : 'text-gray-600')
                              }`}>
                              Step {index + 1}
                            </p>
                            <p className={`font-semibold font-inter ${step === index + 1
                              ? (isDark ? 'text-white' : 'text-gray-900')
                              : step > index + 1
                                ? (isDark ? 'text-white' : 'text-gray-900')
                                : (isDark ? 'text-gray-400' : 'text-gray-600')
                              }`}>
                              {stepName}
                            </p>
                          </div>
                          {index < 2 && (
                            <ChevronRight className={`w-6 h-6 mx-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 1: Date & Time Selection */}
                {step === 1 && viewMode === 'schedule' && (
                  <div className={`rounded-2xl p-6 border ${isDark
                    ? 'bg-gradient-to-br from-gray-800 via-gray-800/95 to-gray-800 border-amber-800/30'
                    : 'bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200'
                    } shadow-lg`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isDark
                          ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30'
                          : 'bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-200'
                          }`}>
                          <Calendar className={`w-6 h-6 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
                        </div>
                        <div>
                          <h2 className={`text-xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Select Date & Time
                          </h2>
                          <p className={`text-sm font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-600/80'}`}>
                            {hasExistingAppointment ? 'Schedule additional appointment' : 'Choose your preferred appointment slot'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAvailability(!showAvailability)}
                        className={`px-4 py-2 rounded-lg font-inter flex items-center gap-2 ${isDark
                          ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/40 border border-amber-800/30'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                          } transition-colors`}
                      >
                        {showAvailability ? 'Hide' : 'Show'} Calendar
                        {showAvailability ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {showAvailability && (
                      <>
                        {/* Calendar Section */}
                        <div className="mb-8">
                          <h3 className={`text-lg font-semibold mb-4 font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                            Available Dates (Next 30 days)
                            {hasExistingAppointment && (
                              <span className="text-sm font-normal text-amber-500 dark:text-amber-400 ml-2">
                                • Blue dots indicate existing appointments
                              </span>
                            )}
                          </h3>
                          <div className="grid grid-cols-7 gap-2">
                            {/* Day headers */}
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                              <div key={day} className={`text-center text-sm font-medium py-2 ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                                {day}
                              </div>
                            ))}

                            {/* Date buttons */}
                            {availableDates.map((date) => {
                              const dateObj = new Date(date);
                              const dayNum = dateObj.getDate();
                              const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                              const isSelected = selectedDate === date;
                              const isExistingAppointmentDate = existingAppointment?.scheduled_date === date;
                              const hasAppointmentOnDate = userAppointments.some(app => {
                                const appDate = app.scheduled_date || app.start_time?.split('T')[0];
                                return appDate === date && (app.status === 'scheduled' || app.status === 'confirmed');
                              });

                              return (
                                <button
                                  key={date}
                                  type="button"
                                  onClick={() => handleDateSelect(date)}
                                  className={`p-3 rounded-xl transition-all duration-300 ${isSelected
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg scale-105'
                                    : isExistingAppointmentDate
                                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500'
                                      : hasAppointmentOnDate
                                        ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-500/30 border'
                                        : isDark
                                          ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:scale-105'
                                          : 'bg-white text-gray-700 hover:bg-amber-50 hover:scale-105'
                                    } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                                  title={hasAppointmentOnDate ? "You have an appointment on this date" : ""}
                                >
                                  <div className="text-center">
                                    <div className="text-lg font-bold">{dayNum}</div>
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-amber-200/80' : (isDark ? 'text-amber-300/80' : 'text-amber-600/80')}`}>
                                      {monthName}
                                    </div>
                                    {hasAppointmentOnDate && (
                                      <div className="mt-1">
                                        <div className="w-1 h-1 mx-auto rounded-full bg-blue-500"></div>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selected Date Display */}
                        {selectedDate && (
                          <div className={`p-4 rounded-xl mb-6 ${isDark
                            ? 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border border-emerald-800/30'
                            : 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200'
                            }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Calendar className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                <div>
                                  <span className={`font-medium font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                    Selected Date: {formatDate(selectedDate)}
                                  </span>
                                  <p className={`text-sm font-inter ${isDark ? 'text-emerald-400/80' : 'text-emerald-600/80'}`}>
                                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedDate("")}
                                className={`px-3 py-1 rounded-lg text-sm ${isDark
                                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                  }`}
                              >
                                Change
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Time Selection */}
                        {selectedDate && (
                          <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className={`text-lg font-semibold font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                                Select Preferred Time
                              </h3>
                              <span className={`text-sm font-inter ${isDark ? 'text-amber-400/80' : 'text-amber-600/80'}`}>
                                Duration: 1 hour
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {availableTimes.map((time) => {
                                const hour = parseInt(time.split(':')[0]);
                                const timeOfDay = hour < 12 ? 'Morning' : hour < 15 ? 'Afternoon' : 'Evening';
                                const isSelected = selectedTime === time;
                                const isExistingAppointmentTime =
                                  existingAppointment?.scheduled_date === selectedDate &&
                                  existingAppointment?.start_time?.split('T')[1]?.substring(0, 5) === time;
                                const hasAppointmentAtTime = userAppointments.some(app => {
                                  const appTime = app.start_time?.split('T')[1]?.substring(0, 5);
                                  const appDate = app.scheduled_date || app.start_time?.split('T')[0];
                                  return appDate === selectedDate && appTime === time && (app.status === 'scheduled' || app.status === 'confirmed');
                                });

                                return (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => handleTimeSelect(time)}
                                    className={`p-4 rounded-xl transition-all duration-300 ${isSelected
                                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg scale-105'
                                      : isExistingAppointmentTime
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500'
                                        : hasAppointmentAtTime
                                          ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-500/30 border'
                                          : isDark
                                            ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:scale-105'
                                            : 'bg-white text-gray-700 hover:bg-amber-50 hover:scale-105'
                                      } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                                    title={hasAppointmentAtTime ? "You have an appointment at this time" : ""}
                                  >
                                    <div className="text-center">
                                      <Clock className={`mx-auto mb-2 w-5 h-5 ${isSelected ? 'text-white' : (isDark ? 'text-amber-300' : 'text-amber-600')}`} />
                                      <div className="font-semibold font-inter text-lg">
                                        {formatTime(time)}
                                      </div>
                                      <div className={`text-xs mt-1 font-inter ${isSelected
                                        ? 'text-amber-200/80'
                                        : (isDark ? 'text-amber-300/80' : 'text-amber-600/80')
                                        }`}>
                                        {timeOfDay}
                                      </div>
                                      {hasAppointmentAtTime && (
                                        <div className="mt-1">
                                          <div className="w-1 h-1 mx-auto rounded-full bg-blue-500"></div>
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {!selectedDate && showAvailability && (
                      <div className="text-center py-8">
                        <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-amber-500/50' : 'text-amber-400/50'}`} />
                        <p className={`font-inter ${isDark ? 'text-amber-400/80' : 'text-amber-600/80'}`}>
                          Please select a date to see available time slots
                        </p>
                      </div>
                    )}

                    {/* Step Navigation */}
                    <div className="flex justify-end mt-8 pt-6 border-t border-amber-200 dark:border-amber-800/30">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={!selectedDate || !selectedTime}
                        className={`px-8 py-3 rounded-xl font-semibold font-inter flex items-center gap-2 transition-all duration-300 ${(!selectedDate || !selectedTime)
                          ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-50 cursor-not-allowed border border-gray-400'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-xl hover:scale-[1.02] border border-amber-600'
                          } shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
                      >
                        Continue to Details
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Details */}
                {step === 2 && (
                  <div className={`rounded-2xl p-6 border ${isDark
                    ? 'bg-gradient-to-br from-gray-800 via-gray-800/95 to-gray-800 border-purple-800/30'
                    : 'bg-gradient-to-br from-white via-purple-50/30 to-white border-purple-200'
                    } shadow-lg`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-xl ${isDark
                        ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30'
                        : 'bg-gradient-to-r from-purple-100 to-purple-200 border border-purple-200'
                        }`}>
                        <MessageCircle className={`w-6 h-6 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <h2 className={`text-xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Appointment Details
                        </h2>
                        <p className={`text-sm font-inter ${isDark ? 'text-purple-400/80' : 'text-purple-600/80'}`}>
                          Add any special requests or questions
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Selected Date/Time Summary */}
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-blue-50 border border-blue-100'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Selected Date & Time</p>
                            <p className={`font-semibold text-lg font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {formatDate(selectedDate)} at {formatTime(selectedTime)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className={`px-3 py-1 rounded-lg text-sm ${isDark
                              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                              }`}
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      {/* Message Section */}
                      <div>
                        <label className={`block mb-2 font-medium font-inter ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                          Special Requests or Questions
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                          placeholder={`Let the agent know about any special requirements for the ${appointmentType === 'property_viewing' ? 'viewing' : 'consultation'}...`}
                          className={`w-full p-4 rounded-xl border font-inter ${isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                            } focus:outline-none resize-none`}
                        />
                        <div className={`p-3 rounded-lg mt-3 ${isDark ? 'bg-gray-800/30 border border-gray-700' : 'bg-purple-50/50 border border-purple-100'}`}>
                          <p className={`text-sm font-inter ${isDark ? 'text-purple-400/80' : 'text-purple-600/80'}`}>
                            💡 <span className="font-medium">Suggestions:</span> Include accessibility needs, preferred meeting format, specific areas of interest, or any questions about the property.
                          </p>
                        </div>
                      </div>

                      {/* Step Navigation */}
                      <div className="flex justify-between mt-8 pt-6 border-t border-purple-200 dark:border-purple-800/30">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className={`px-6 py-3 rounded-xl font-inter transition-all duration-300 ${isDark
                            ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:scale-[1.02] border border-gray-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-[1.02] border border-gray-300'
                            }`}
                        >
                          Back to Date/Time
                        </button>
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className={`px-8 py-3 rounded-xl font-semibold font-inter flex items-center gap-2 transition-all duration-300 ${'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-xl hover:scale-[1.02] border border-amber-600'
                            } shadow-lg active:scale-95`}
                        >
                          Continue to Confirmation
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Confirmation */}
                {step === 3 && (
                  <div className={`rounded-2xl p-6 border ${isDark
                    ? 'bg-gradient-to-br from-gray-800 via-gray-800/95 to-gray-800 border-emerald-800/30'
                    : 'bg-gradient-to-br from-white via-emerald-50/30 to-white border-emerald-200'
                    } shadow-lg`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-xl ${isDark
                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30'
                        : 'bg-gradient-to-r from-emerald-100 to-emerald-200 border border-emerald-200'
                        }`}>
                        <CheckCircle className={`w-6 h-6 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
                      </div>
                      <div>
                        <h2 className={`text-xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Confirm Appointment Details
                        </h2>
                        <p className={`text-sm font-inter ${isDark ? 'text-emerald-400/80' : 'text-emerald-600/80'}`}>
                          Review your appointment information before submitting
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Appointment Summary */}
                      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-emerald-50 border border-emerald-100'}`}>
                        <h3 className={`text-lg font-bold mb-4 font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                          Appointment Summary
                        </h3>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Property</p>
                              <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {property?.title || propertyDetails?.title || 'Property'}
                              </p>
                            </div>
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Date & Time</p>
                              <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formatDate(selectedDate)} at {formatTime(selectedTime)}
                              </p>
                            </div>
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Appointment Type</p>
                              <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {appointmentType === 'property_viewing' ? 'Property Viewing' : 'Consultation'}
                              </p>
                            </div>
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Duration</p>
                              <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                1 hour
                              </p>
                            </div>
                          </div>

                          {message && (
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Your Message</p>
                              <p className={`font-inter ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                {message}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* User Info */}
                      {user && (
                        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-blue-50 border border-blue-100'}`}>
                          <h3 className={`text-lg font-bold mb-4 font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                            Your Contact Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Name</p>
                              <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {user.name || `${user.first_name} ${user.last_name}` || 'User'}
                              </p>
                            </div>
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Email</p>
                              <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {user.email || 'user@example.com'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Terms */}
                      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-amber-50 border border-amber-100'}`}>
                        <div className="flex items-start gap-3">
                          <FileText className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                          <div>
                            <h4 className={`font-bold text-lg mb-2 font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                              {appointmentType === 'property_viewing' ? 'Viewing Terms' : 'Consultation Terms'}
                            </h4>
                            <ul className={`space-y-2 text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span>Appointments are subject to broker confirmation within 24 hours</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span>{appointmentType === 'property_viewing' ? 'Please arrive 10 minutes before scheduled time' : 'Please join 5 minutes before scheduled time'}</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span>Cancellation requires 24 hours notice</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Existing Appointment Warning (if applicable) */}
                      {hasExistingAppointment && (
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-100 border-amber-200'} border`}>
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                                <span className="font-medium">Note:</span> You already have an existing appointment for this property. This will be an additional appointment.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Final Action Buttons */}
                      <div className="flex gap-4 pt-6 border-t border-emerald-200 dark:border-emerald-800/30">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className={`flex-1 py-3.5 rounded-xl font-inter transition-all duration-300 ${isDark
                            ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:scale-[1.02] border border-gray-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-[1.02] border border-gray-300'
                            }`}
                        >
                          Back to Details
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`flex-1 py-3.5 rounded-xl font-semibold font-inter flex items-center justify-center gap-2 transition-all duration-300 ${isSubmitting
                            ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-50 cursor-not-allowed border border-gray-400'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white hover:shadow-xl hover:scale-[1.02] border border-emerald-600'
                            } shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              Scheduling...
                            </>
                          ) : (
                            <>
                              <Calendar className="w-5 h-5" />
                              Confirm & Schedule
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleViewingModal;