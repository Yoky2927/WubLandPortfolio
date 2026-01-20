import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../utils/api.endpoints';
import { toast } from 'react-hot-toast';
import {
  X, Calendar, Clock, User, Phone, Mail, Home,
  MapPin, MessageCircle, CheckCircle, AlertCircle,
  ChevronRight, ChevronLeft, Check, Loader, Video,
  Camera, Users, FileText, Shield, Star, Briefcase,
  CalendarCheck, CalendarX2, Bell, BellOff, ExternalLink,
  Info, ArrowRight, Clock as ClockIcon
} from 'lucide-react';

const AppointmentSchedulerModal = ({ isOpen, onClose, broker, propertyData, onSchedule }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('property_inspection');
  const [appointmentMode, setAppointmentMode] = useState('in_person');
  const [clientDetails, setClientDetails] = useState({
    name: '',
    phone: '',
    email: '',
    additional_attendees: 0,
    special_requirements: ''
  });
  const [brokerAvailability, setBrokerAvailability] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [confirmationDetails, setConfirmationDetails] = useState(null);

  useEffect(() => {
    if (isOpen && broker) {
      fetchBrokerAvailability();
    }
  }, [isOpen, broker]);

  const fetchBrokerAvailability = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('GET_BROKER_AVAILABILITY', { brokerId: broker.id });
      
      if (response.success) {
        setBrokerAvailability(response.data?.availability || []);
        
        // Generate next 14 days availability
        const slots = generateAvailableSlots(response.data?.availability || []);
        setAvailableSlots(slots);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Could not load broker availability');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAvailableSlots = (availability) => {
    const slots = [];
    const today = new Date();
    
    // Generate next 14 days
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      const daySlots = [];
      
      // Generate time slots (9 AM to 5 PM)
      for (let hour = 9; hour <= 17; hour++) {
        const timeSlot = {
          time: `${hour.toString().padStart(2, '0')}:00`,
          available: Math.random() > 0.3, // Mock availability
          booked: false
        };
        
        // Check broker's actual availability
        const isAvailable = availability.some(avail => 
          avail.date === dateStr && 
          avail.start_time <= timeSlot.time && 
          avail.end_time >= `${hour + 1}:00`
        );
        
        if (isAvailable) {
          daySlots.push(timeSlot);
        }
      }
      
      if (daySlots.length > 0) {
        slots.push({
          date: dateStr,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          slots: daySlots
        });
      }
    }
    
    return slots;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setStep(2);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleClientDetailsChange = (field, value) => {
    setClientDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScheduleAppointment = async () => {
    try {
      setIsScheduling(true);
      
      const appointmentData = {
        broker_id: broker.id,
        property_id: propertyData?.id,
        appointment_type: appointmentType,
        appointment_mode: appointmentMode,
        scheduled_date: selectedDate,
        start_time: `${selectedDate}T${selectedTime}:00`,
        end_time: `${selectedDate}T${parseInt(selectedTime) + 1}:00`,
        duration_minutes: 60,
        client_details: clientDetails,
        status: 'scheduled',
        notes: clientDetails.special_requirements,
        location: appointmentMode === 'in_person' 
          ? propertyData?.location || 'Property Location'
          : 'Virtual Meeting'
      };
      
      const response = await apiCall('SCHEDULE_APPOINTMENT', {}, {
        data: appointmentData
      });
      
      if (response.success) {
        const confirmation = {
          id: response.data?.appointment_id,
          ...appointmentData,
          confirmation_code: `APT-${Date.now().toString().slice(-6)}`,
          broker: broker,
          property: propertyData
        };
        
        setConfirmationDetails(confirmation);
        setStep(4);
        
        toast.success('Appointment scheduled successfully!');
        
        if (onSchedule) {
          onSchedule(selectedDate, selectedTime, confirmation);
        }
      }
    } catch (error) {
      console.error('Scheduling error:', error);
      toast.error('Failed to schedule appointment');
    } finally {
      setIsScheduling(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CalendarCheck className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold">Schedule Inspection Appointment</h3>
        <p className="text-gray-500 mt-2">Select your preferred date and time</p>
      </div>
      
      {/* Broker Info */}
      <div className={`p-4 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-100'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white text-xl font-bold">
            {broker.name?.charAt(0) || 'B'}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg">{broker.name}</h4>
            <p className="text-gray-500 text-sm">{broker.brokerage_firm || 'WubLand Real Estate'}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm">{broker.average_rating || 4.8}</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span className="text-sm">{broker.total_completed_deals || 50} deals</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Property Info */}
      <div className={`p-4 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-amber-50 border-amber-100'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <Home className="w-5 h-5 text-amber-500" />
          <h4 className="font-bold">Property Details</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-gray-500">Property</p>
            <p className="font-medium">{propertyData?.title || 'Property'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium">{propertyData?.location}</p>
          </div>
        </div>
      </div>
      
      {/* Appointment Type */}
      <div className="space-y-4">
        <h4 className="font-bold text-lg">Appointment Type</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'property_inspection', label: 'Property Inspection', icon: Home, desc: 'Physical property assessment' },
            { id: 'document_review', label: 'Document Review', icon: FileText, desc: 'Legal documents verification' },
            { id: 'consultation', label: 'Consultation', icon: Users, desc: 'General discussion' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setAppointmentType(type.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                appointmentType === type.id
                  ? 'border-amber-400 bg-amber-400/10'
                  : theme === 'dark'
                    ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  appointmentType === type.id ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <type.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{type.label}</span>
              </div>
              <p className="text-sm text-gray-500">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Appointment Mode */}
      <div className="space-y-4">
        <h4 className="font-bold text-lg">Appointment Mode</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'in_person', label: 'In Person', icon: MapPin, desc: 'Meet at property location' },
            { id: 'virtual', label: 'Virtual', icon: Video, desc: 'Video call meeting' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setAppointmentMode(mode.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                appointmentMode === mode.id
                  ? 'border-amber-400 bg-amber-400/10'
                  : theme === 'dark'
                    ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  appointmentMode === mode.id ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <mode.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{mode.label}</span>
              </div>
              <p className="text-sm text-gray-500">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>
      
      <button
        onClick={() => setStep(2)}
        className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg flex items-center justify-center gap-2"
      >
        Select Date & Time
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setStep(1)}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-2xl font-bold">Select Date</h3>
          <p className="text-gray-500">Choose your preferred appointment date</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableSlots.map((day) => (
            <button
              key={day.date}
              onClick={() => handleDateSelect(day.date)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                selectedDate === day.date
                  ? 'border-amber-400 bg-amber-400/10'
                  : theme === 'dark'
                    ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-sm text-gray-500 mb-1">{day.dayName}</div>
              <div className="text-2xl font-bold mb-2">
                {new Date(day.date).getDate()}
              </div>
              <div className="text-sm text-gray-600">
                {new Date(day.date).toLocaleDateString('en-US', { month: 'short' })}
              </div>
              <div className="mt-2 text-xs text-green-500">
                {day.slots.filter(s => s.available).length} slots available
              </div>
            </button>
          ))}
        </div>
      )}
      
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          Back
        </button>
        <button
          onClick={() => selectedDate && setStep(3)}
          disabled={!selectedDate}
          className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          Next: Select Time
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const selectedDay = availableSlots.find(day => day.date === selectedDate);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setStep(2)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-2xl font-bold">Select Time</h3>
            <p className="text-gray-500">
              {formatDate(selectedDate)} • {selectedDay?.slots.filter(s => s.available).length} slots available
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {selectedDay?.slots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => handleTimeSelect(slot.time)}
              disabled={!slot.available || slot.booked}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedTime === slot.time
                  ? 'border-amber-400 bg-amber-400/10'
                  : slot.available && !slot.booked
                    ? theme === 'dark'
                      ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    : 'border-gray-300 bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="font-medium">{formatTime(slot.time)}</div>
              <div className="text-xs mt-1">
                {slot.booked ? 'Booked' : slot.available ? 'Available' : 'Unavailable'}
              </div>
            </button>
          ))}
        </div>
        
        <div className={`p-4 rounded-xl border ${
          theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold">Duration & Reminders</h4>
          </div>
          <ul className="space-y-2 text-sm">
            <li>• Appointment duration: 1 hour</li>
            <li>• You'll receive reminders 24 hours and 1 hour before</li>
            <li>• Please arrive 10 minutes early for in-person meetings</li>
            <li>• Virtual meeting link will be sent 30 minutes before</li>
          </ul>
        </div>
        
        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setStep(2)}
            className="px-6 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            Back
          </button>
          <button
            onClick={() => setStep(4)}
            disabled={!selectedTime}
            className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            Next: Client Details
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setStep(3)}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-2xl font-bold">Client Details</h3>
          <p className="text-gray-500">Please provide your contact information</p>
        </div>
      </div>
      
      {/* Appointment Summary */}
      <div className={`p-4 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-amber-50 border-amber-100'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">{formatDate(selectedDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Time</p>
            <p className="font-medium">{formatTime(selectedTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium capitalize">{appointmentType.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Mode</p>
            <p className="font-medium capitalize">{appointmentMode.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
      
      {/* Client Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name *</label>
            <input
              type="text"
              value={clientDetails.name}
              onChange={(e) => handleClientDetailsChange('name', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number *</label>
            <input
              type="tel"
              value={clientDetails.phone}
              onChange={(e) => handleClientDetailsChange('phone', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
              placeholder="09xxxxxxxx"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Email Address *</label>
          <input
            type="email"
            value={clientDetails.email}
            onChange={(e) => handleClientDetailsChange('email', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
            }`}
            placeholder="your.email@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Additional Attendees</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleClientDetailsChange('additional_attendees', Math.max(0, clientDetails.additional_attendees - 1))}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-2xl font-bold">{clientDetails.additional_attendees}</span>
            <button
              onClick={() => handleClientDetailsChange('additional_attendees', clientDetails.additional_attendees + 1)}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
            >
              +
            </button>
            <span className="text-gray-500 ml-4">Maximum 3 additional attendees</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Special Requirements or Questions</label>
          <textarea
            rows="3"
            value={clientDetails.special_requirements}
            onChange={(e) => handleClientDetailsChange('special_requirements', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
            }`}
            placeholder="Any special requirements, accessibility needs, or questions..."
          />
        </div>
      </div>
      
      {/* Terms & Conditions */}
      <div className={`p-4 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100 border-gray-200'
      }`}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-2">Terms & Conditions</p>
            <ul className="space-y-1 text-gray-600 dark:text-gray-300">
              <li>• Appointment may be rescheduled up to 24 hours in advance</li>
              <li>• Please arrive on time for your scheduled slot</li>
              <li>• Bring valid ID and any relevant documents</li>
              <li>• Virtual meetings require stable internet connection</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setStep(3)}
          className="px-6 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleScheduleAppointment}
          disabled={!clientDetails.name || !clientDetails.phone || !clientDetails.email || isScheduling}
          className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          {isScheduling ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <CalendarCheck className="w-5 h-5" />
              Schedule Appointment
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-6">
        <CheckCircle className="w-12 h-12 text-white" />
      </div>
      
      <h3 className="text-2xl font-bold">Appointment Scheduled!</h3>
      <p className="text-gray-500">Your appointment has been confirmed</p>
      
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Confirmation Code</p>
            <p className="text-2xl font-bold text-amber-600">{confirmationDetails?.confirmation_code}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">
                {formatDate(selectedDate)} at {formatTime(selectedTime)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Broker</p>
              <p className="font-medium">{broker.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mode</p>
              <p className="font-medium capitalize">{appointmentMode.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">1 hour</p>
            </div>
          </div>
          
          {appointmentMode === 'virtual' && (
            <div className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-5 h-5 text-blue-500" />
                <p className="font-medium">Virtual Meeting</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Meeting link will be sent to {clientDetails.email} 30 minutes before the appointment.
              </p>
            </div>
          )}
          
          <div className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-500" />
              <p className="font-medium">Reminders Will Be Sent</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              You'll receive email and SMS reminders 24 hours and 1 hour before your appointment.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => {
            // Add to calendar functionality
            const calendarEvent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Property Inspection with ${broker.name}
DTSTART:${selectedDate.replace(/-/g, '')}T${selectedTime.replace(':', '')}00
DTEND:${selectedDate.replace(/-/g, '')}T${parseInt(selectedTime) + 1}0000
LOCATION:${propertyData?.location || 'Property Location'}
DESCRIPTION:Property inspection for ${propertyData?.title}
END:VEVENT
END:VCALENDAR`;
            
            const blob = new Blob([calendarEvent], { type: 'text/calendar' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'appointment.ics';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            toast.success('Calendar event downloaded!');
          }}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg flex items-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          Add to Calendar
        </button>
        
        <button
          onClick={onClose}
          className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg"
        >
          Done
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col ${
          theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100'
            }`}>
              <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Schedule Appointment</h2>
              <p className="text-sm text-gray-500">Step {step} of 5</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-800">
          <div 
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>
      </div>
    </div>
  );
};

export default AppointmentSchedulerModal;