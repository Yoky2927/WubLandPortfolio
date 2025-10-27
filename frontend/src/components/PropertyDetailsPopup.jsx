import React, { useState, useEffect, useRef } from "react";
import {
  X, MapPin, Bed, Bath, Ruler, Car, Calendar, School,
  Heart, Share2, Download, Home, Building, TrendingUp,
  Layers, ZoomIn, ExternalLink, Star, Clock,
  Users, Shield, Wifi, Coffee, Dumbbell,
  ChevronLeft, ChevronRight, Play, Pause, Eye, Phone, Mail
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// Contact Agent Popup Component
const ContactAgentPopup = ({ agent, property, isOpen, onClose }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: `I'm interested in ${property?.address}`
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        phone: "",
        email: "",
        message: `I'm interested in ${property?.address}`
      });
    }
  }, [isOpen, property]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    alert('Message sent successfully! The agent will contact you soon.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className={`max-w-md w-full rounded-2xl shadow-2xl ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Contact Agent
            </h3>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Agent Info */}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <img 
              src={agent?.photo || "/api/placeholder/60/60"} 
              alt={agent?.name} 
              className="w-14 h-14 rounded-full border-2 border-white shadow-sm"
            />
            <div>
              <h4 className={`font-semibold text-lg ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {agent?.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{agent?.company}</p>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Your phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none transition-all placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>By contacting the agent, you agree to receive communications about this property.</p>
            </div>

            <button 
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            >
              Send Message
            </button>
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
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className={`max-w-md w-full rounded-2xl shadow-2xl ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Schedule Tour
            </h3>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className={`text-sm mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            {property?.address}, {property?.city}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Calendar size={16} className="mr-2 text-amber-500" />
              Select 1-3 preferred times for your tour
            </div>
            
            {/* Date Navigation */}
            <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <button 
                type="button" 
                onClick={() => setSelectedDate(getPrevDay(selectedDate))}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                ← Previous
              </button>
              <span className="font-semibold text-gray-900 dark:text-white">{formatDate(selectedDate)}</span>
              <button 
                type="button" 
                onClick={() => setSelectedDate(getNextDay(selectedDate))}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
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
                  className={`p-4 border rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedTimes.includes(time)
                      ? "bg-amber-500 text-white border-amber-500 shadow-lg"
                      : "border-gray-300 dark:border-gray-600 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            {/* Selected Times Summary */}
            {selectedTimes.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Selected {selectedTimes.length} time{selectedTimes.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {selectedTimes.join(', ')}
                </p>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={selectedTimes.length === 0}
            className={`w-full font-semibold py-4 rounded-xl transition-all duration-200 ${
              selectedTimes.length === 0
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
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

// Modern Property Stats Component
const PropertyStats = ({ beds, baths, sqft, garage, estPayment, theme, formatCurrency }) => (
  <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
    <div className="grid grid-cols-4 gap-4">
      {[
        { icon: Bed, label: "Beds", value: beds, color: "text-amber-500" },
        { icon: Bath, label: "Baths", value: baths, color: "text-amber-500" },
        { icon: Ruler, label: "Sq Ft", value: sqft?.toLocaleString(), color: "text-amber-500" },
        { icon: Car, label: "Garage", value: garage || '-', color: "text-amber-500" }
      ].map((stat, i) => (
        <div key={i} className="text-center group">
          <div className="flex items-center justify-center mb-2">
            <stat.icon size={20} className={`${stat.color} group-hover:scale-110 transition-transform`} />
          </div>
          <div className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            {stat.value}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
    {estPayment && (
      <div className={`mt-4 p-4 text-center border rounded-xl ${
        theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-amber-50 border-amber-200"
      }`}>
        <span className={`text-sm font-semibold ${theme === "dark" ? "text-amber-300" : "text-amber-700"}`}>
          Estimated payment: <strong className="text-base">{formatCurrency(estPayment)}/mo</strong>
        </span>
      </div>
    )}
  </div>
);

// Modern Image Gallery
const ImageGallery = ({
  images, selectedImageIndex, theme, address, progress,
  handlePrevImage, handleNextImage, handleThumbnailClick, toggleAutoPlay, isPlaying
}) => (
  <div className="relative bg-black group">
    {images.length === 0 ? (
      <div className="h-96 flex items-center justify-center bg-gray-900">
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
            className="w-full h-full object-cover transition-transform duration-500"
          />
          
          {/* Counter */}
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm">
            {selectedImageIndex + 1} / {images.length}
          </div>
          
          {/* Play/Pause */}
          {images.length > 1 && (
            <button
              onClick={toggleAutoPlay}
              className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-all duration-300 backdrop-blur-sm hover:scale-110"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          )}
          
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
        </div>

        {/* Progress Bar */}
        {images.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-100 rounded-full" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        )}

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

// Modern Broker Info Component
const BrokerInfo = ({ broker, mlsNumber, source, listedDate, theme, onContactAgent, onRequestTour }) => broker && (
  <div className={`w-full md:w-80 border-t md:border-t-0 md:border-l p-6 ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
    <h3 className={`text-lg font-semibold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
      Contact Agent
    </h3>
    <div className="space-y-6">
      {/* Broker Card */}
      <div className={`p-4 border rounded-xl ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
        <div className="flex items-center space-x-4">
          <img 
            src={broker.photo || "/api/placeholder/80/80"} 
            alt={broker.name} 
            className="w-14 h-14 rounded-full object-cover border-2 border-amber-500 shadow-sm"
          />
          <div>
            <h4 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {broker.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{broker.company}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Licensed Real Estate Agent
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button 
          onClick={onContactAgent}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
        >
          Contact Agent
        </button>
        <button 
          onClick={onRequestTour}
          className="w-full border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg active:scale-95"
        >
          Schedule Tour
        </button>
      </div>

      {/* Listing Details */}
      <div className={`p-4 border rounded-xl ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
        <h5 className="font-semibold mb-3 text-amber-600 dark:text-amber-400">Listing Details</h5>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
            <span className="text-gray-600 dark:text-gray-400">MLS Number</span>
            <span className="font-mono font-semibold">{mlsNumber}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
            <span className="text-gray-600 dark:text-gray-400">Source</span>
            <span className="font-semibold">{source}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600 dark:text-gray-400">Listed</span>
            <span className="font-semibold">{listedDate} days ago</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Modern Features Section
const FeaturesSection = ({ features, theme }) => (
  <div>
    <h3 className={`text-lg font-semibold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
      Features & Amenities
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {features.map((feature, i) => (
        <div key={i} className={`flex items-center space-x-3 p-3 border rounded-xl ${
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        } hover:border-amber-300 transition-colors group`}>
          <div className="w-2 h-2 bg-amber-500 rounded-full group-hover:scale-125 transition-transform"></div>
          <span className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            {feature}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Modern Facts Section
const FactsSection = ({ propertyType, yearBuilt, lotSize, pricePerSqft, theme, formatCurrency }) => (
  <div className={`p-6 border rounded-xl ${
    theme === "dark" ? "border-gray-700" : "border-gray-200"
  }`}>
    <h4 className="font-semibold mb-4 text-amber-600 dark:text-amber-400">Property Details</h4>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400 font-medium">Property Type</span>
        <span className="font-semibold text-gray-900 dark:text-white">{propertyType}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400 font-medium">Year Built</span>
        <span className="font-semibold text-gray-900 dark:text-white">{yearBuilt}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400 font-medium">Lot Size</span>
        <span className="font-semibold text-gray-900 dark:text-white">{lotSize} sqft</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400 font-medium">Price per sqft</span>
        <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(pricePerSqft)}</span>
      </div>
    </div>
  </div>
);

// Modern Stats Section
const StatsSection = ({ listedDate, views, saves, theme }) => (
  <div className="flex items-center space-x-4 text-sm">
    <span className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
      theme === "dark" ? "bg-gray-800 text-amber-300" : "bg-amber-100 text-amber-700"
    }`}>
      <Clock size={14} />
      <span className="font-medium">{listedDate} days</span>
    </span>
    <span className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
      theme === "dark" ? "bg-gray-800 text-amber-300" : "bg-amber-100 text-amber-700"
    }`}>
      <Eye size={14} />
      <span className="font-medium">{views} views</span>
    </span>
    <span className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
      theme === "dark" ? "bg-gray-800 text-amber-300" : "bg-amber-100 text-amber-700"
    }`}>
      <Heart size={14} />
      <span className="font-medium">{saves} saves</span>
    </span>
  </div>
);

// Main Popup Component
const PropertyDetailsPopup = ({ property, isOpen, onClose, onNavigateToProperties }) => {
  const { theme } = useTheme();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showContactAgent, setShowContactAgent] = useState(false);
  const [showRequestTour, setShowRequestTour] = useState(false);
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
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div
            className={`relative w-full max-w-7xl rounded-2xl overflow-hidden shadow-2xl ${
              theme === "dark" ? "bg-gray-900" : "bg-white"
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${
                theme === "dark" ? "hover:bg-gray-800 text-white" : "hover:bg-gray-100 text-gray-600"
              }`}>
                <X size={20} />
              </button>
              
              {/* Centered Logo */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center font-bold text-white shadow-lg">
                  W
                </div>
                <span className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  WubLand
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsFavorite(f => !f)} 
                  className={`p-2 rounded-lg transition-colors ${
                    isFavorite 
                      ? "text-red-500" 
                      : theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                </button>
                <button className={`p-2 rounded-lg transition-colors ${
                  theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
                }`}>
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            {/* Price & Address Section - Reduced Size */}
            <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className={`px-3 py-1 text-xs font-semibold text-white ${
                  propertyStatus === 'for sale'
                    ? "bg-green-500"
                    : "bg-amber-500"
                } rounded-lg shadow-sm`}>
                  {propertyStatus === 'for sale' ? 'FOR SALE' : 'FOR RENT'}
                </div>
                <span className="text-xs text-gray-500">MLS# {mlsNumber}</span>
              </div>
              <h1 className={`text-2xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {formatCurrency(price)}
              </h1>
              <p className={`flex items-center text-base ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                <MapPin size={16} className="mr-2 text-amber-500" />
                {address}, {city}, {region}
              </p>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Left: Gallery + Stats + Tabs */}
              <div className="flex-1">
                <ImageGallery
                  images={images} selectedImageIndex={selectedImageIndex} theme={theme} address={address}
                  progress={progress} handlePrevImage={handlePrevImage} handleNextImage={handleNextImage}
                  handleThumbnailClick={handleThumbnailClick} toggleAutoPlay={toggleAutoPlay} isPlaying={isPlaying}
                />
                
                {/* Modern Property Stats */}
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
                <div className={`border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <nav className="flex space-x-1 px-6 overflow-x-auto">
                    {[
                      { id: "overview", label: "Overview", icon: Home },
                      { id: "features", label: "Features", icon: Star },
                      { id: "price", label: "Price & Tax", icon: TrendingUp },
                      { id: "schools", label: "Schools", icon: School },
                      { id: "floorplans", label: "Floor Plans", icon: Building }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium whitespace-nowrap transition-all duration-200 ${
                          activeTab === tab.id 
                            ? "border-amber-500 text-amber-500" 
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                      >
                        <tab.icon size={16} />
                        <span className="text-sm">{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6 space-y-6">
                  {activeTab === "overview" && (
                    <>
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                          Property Description
                        </h3>
                        <p className={`text-base leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
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
                      <PriceHistorySection priceHistory={priceHistory} theme={theme} formatDate={formatDate} formatCurrency={formatCurrency} />
                      <TaxHistorySection taxHistory={taxHistory} theme={theme} formatCurrency={formatCurrency} />
                    </div>
                  )}

                  {activeTab === "schools" && <SchoolsSection nearbySchools={nearbySchools} theme={theme} />}

                  {activeTab === "floorplans" && (
                    <div className="space-y-6">
                      <h3 className={`text-xl font-semibold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        Floor Plans
                      </h3>
                      {floorPlans.length ? (
                        <>
                          <div className="flex space-x-3 overflow-x-auto pb-4">
                            {floorPlans.map((plan, i) => (
                              <button 
                                key={i} 
                                onClick={() => setSelectedFloorPlan(i)} 
                                className={`px-6 py-3 border font-medium whitespace-nowrap transition-all duration-200 ${
                                  selectedFloorPlan === i 
                                    ? "border-amber-500 bg-amber-500 text-white shadow-lg" 
                                    : theme === "dark" 
                                      ? "border-gray-600 hover:border-gray-400 hover:bg-gray-700" 
                                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                }`}
                              >
                                {plan.name}
                              </button>
                            ))}
                          </div>
                          <div className={`p-6 border rounded-lg ${
                            theme === "dark" ? "border-gray-700" : "border-gray-200"
                          }`}>
                            <div className="flex justify-between items-center mb-6">
                              <div>
                                <h4 className="text-xl font-semibold mb-2">{floorPlans[selectedFloorPlan].name}</h4>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {floorPlans[selectedFloorPlan].sqft} sqft • 
                                  {floorPlans[selectedFloorPlan].beds} beds • 
                                  {floorPlans[selectedFloorPlan].baths} baths
                                </p>
                              </div>
                              <button className="flex items-center space-x-2 px-6 py-3 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white transition-all duration-200 font-medium hover:shadow-lg">
                                <Download size={18} />
                                <span>Download</span>
                              </button>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-lg">
                              <img 
                                src={floorPlans[selectedFloorPlan].image} 
                                alt={floorPlans[selectedFloorPlan].name} 
                                className="w-full h-80 object-contain" 
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className={`text-center py-12 rounded-lg ${
                          theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                        }`}>
                          <Layers size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-semibold mb-2">No floor plans available</p>
                          <p className="text-gray-500">Contact agent for architectural drawings</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar - Fixed width and visible */}
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

      {/* Popup Modals - Now they should work */}
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

export default PropertyDetailsPopup;