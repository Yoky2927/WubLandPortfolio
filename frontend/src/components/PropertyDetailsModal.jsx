import React, { useState, useEffect, useRef } from "react";
import {
  X, MapPin, Calendar, Star, Share2, ChevronLeft, ChevronRight,
  Eye, Heart, Printer, Phone, MessageCircle, Check,
  Bed, Bath, Ruler, Car, CheckCircle, School,
  Home, Building, TrendingUp, Users, DoorClosed,
  Camera, Play, Pause, Grid3x3, Home as HomeIcon,
  Coffee, Wind, Sun, Shield, Award, Target,
  DollarSign, Layers, Clock, ExternalLink, Download,
  ArrowRight, ChevronDown, ChevronUp, Maximize2,
  Image as ImageIcon, Video, Map, Filter, Bookmark,
  Sparkles, Crown, Gem, Mountain, Lock, Unlock, Mail,
  Compass, MapPinned, Briefcase, UserCheck, FileCheck,
  Banknote, Clock as ClockIcon, ShieldCheck, Award as AwardIcon,
  Building2, Landmark, Globe, Users as UsersIcon, Key,
  Smartphone, CreditCard, ShoppingBag, GraduationCap, Hospital
} from "lucide-react";
import { Link } from "react-router-dom";
import BrokerChatInterface from "./BrokerChatInterface";
import ScheduleViewingModal from "./ScheduleViewingModal";
import { apiCall } from "../utils/api.endpoints";

const PropertyDetailsModal = ({ property, isOpen, onClose, theme }) => {
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [broker, setBroker] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [taxHistory, setTaxHistory] = useState([]);
  const [nearbySchools, setNearbySchools] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [roomCategories, setRoomCategories] = useState([]);
  const [showAllImages, setShowAllImages] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brokerProfile, setBrokerProfile] = useState(null);
  const [brokerAvailability, setBrokerAvailability] = useState([]);
  const [propertyImages, setPropertyImages] = useState([]);
  const progressIntervalRef = useRef(null);
  const modalContentRef = useRef(null);

  const isDark = theme === "dark";
  const SLIDE_DURATION = 5000;

  const textColors = {
    primary: isDark ? "text-white" : "text-gray-900",
    secondary: isDark ? "text-gray-300" : "text-gray-700",
    tertiary: isDark ? "text-gray-400" : "text-gray-600",
    muted: isDark ? "text-gray-500" : "text-gray-500",
    accent: "text-amber-500",
    success: "text-green-500",
    error: "text-red-500"
  };

  // Fetch broker details with all fields 
  const fetchBrokerDetails = async (brokerId) => {
    if (!brokerId) {
      const defaultBroker = {
        id: 0,
        first_name: "Property",
        last_name: "Agent",
        email: "agent@wubland.com",
        phone_number: "(xxx) xxx-xxxx",
        profile_picture: null,
        brokerage_firm: "WubLand Real Estate",
        experience_years: "5+",
        commission_rate: "2.5%",
        total_completed_deals: 50,
        average_rating: 4.8
      };

      setBroker(defaultBroker);
      return;
    }

    try {
      setLoading(true);
      const response = await apiCall('GET_BROKER_DETAILS', { id: brokerId });

      console.log('Broker API response:', response);

      if (response.success && response.broker) {
        // Your broker controller returns broker data in response.broker
        const brokerData = response.broker;

        // Format it to match what your PropertyDetailsModal expects
        const formattedBroker = {
          id: brokerData.id,
          first_name: brokerData.name?.split(' ')[0] || "Broker",
          last_name: brokerData.name?.split(' ').slice(1).join(' ') || "",
          email: brokerData.email || "agent@wubland.com",
          phone_number: brokerData.phone_number || "(xxx) xxx-xxxx",
          profile_picture: brokerData.profile_picture || null,
          broker_license_number: brokerData.license_number || "N/A",
          broker_license_expiry: brokerData.license_expiry || "N/A",
          tin_number: brokerData.tin_number || "N/A",
          brokerage_firm: brokerData.brokerage_firm || brokerData.company || "Independent Broker",
          experience_years: brokerData.years_experience || brokerData.experience_years || "5+",
          commission_rate: brokerData.commission_rate || "2.5%",
          service_fee: brokerData.service_fee || "0%",
          total_completed_deals: brokerData.completed_deals || brokerData.total_completed_deals || 50,
          average_rating: brokerData.rating || brokerData.average_rating || 4.8,
          review_count: brokerData.review_count || brokerData.total_reviews || 0,
          specialization: Array.isArray(brokerData.specialization) ? brokerData.specialization :
            (typeof brokerData.specialization === 'string' ?
              JSON.parse(brokerData.specialization) : ["Residential", "Commercial"]),
          service_areas: Array.isArray(brokerData.service_areas) ? brokerData.service_areas :
            (typeof brokerData.service_areas === 'string' ?
              JSON.parse(brokerData.service_areas) : ["Addis Ababa"]),
          languages: Array.isArray(brokerData.languages) ? brokerData.languages :
            (typeof brokerData.languages === 'string' ?
              JSON.parse(brokerData.languages) : ["English", "Amharic"]),
          is_available: brokerData.is_available !== false,
          is_verified: brokerData.is_verified || false,
          broker_type: brokerData.broker_type || "external",
          max_clients: brokerData.max_clients || 10,
          current_active_clients: brokerData.current_active_clients || 3,
          bio_english: brokerData.bio || brokerData.bio_english || "Experienced real estate agent",
          bio_amharic: brokerData.bio_amharic || "የልምድ ያለው የንብረት ወኪል",
          verification_status: brokerData.verification_status || "unverified",
          verification_reason: brokerData.verification_reason || null,
          verified_at: brokerData.verified_at || null
        };

        setBroker(formattedBroker);
      } else {
        // Fallback broker
        setBroker({
          id: brokerId,
          first_name: "Property",
          last_name: "Agent",
          email: "agent@wubland.com",
          phone_number: "(xxx) xxx-xxxx",
          profile_picture: null,
          brokerage_firm: "WubLand Real Estate",
          experience_years: "5+",
          commission_rate: "2.5%",
          total_completed_deals: 50,
          average_rating: 4.8
        });
      }
    } catch (error) {
      console.error("Failed to fetch broker details:", error);
      // Use fallback broker on error
      setBroker({
        id: brokerId || 0,
        first_name: "Property",
        last_name: "Agent",
        email: "agent@wubland.com",
        phone_number: "(xxx) xxx-xxxx",
        profile_picture: null,
        brokerage_firm: "WubLand Real Estate",
        experience_years: "5+",
        commission_rate: "2.5%",
        total_completed_deals: 50,
        average_rating: 4.8
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch property images from backend
  const fetchPropertyImages = async () => {
    if (!property?.id) return;

    try {
      setLoading(true);
      // Get the full property which should include images
      const response = await apiCall('GET_PROPERTY_BY_ID', { id: property.id });

      console.log('Property response with images:', response);

      if (response.success && response.data) {
        const propertyData = response.data;
        const images = propertyData.images || propertyData.property_images || [];

        console.log('Found images:', images);
        setPropertyImages(images);
        organizeImagesByRoom(images);
      } else {
        // Fallback to property.images if available
        const images = property.images || property.property_images || [];
        console.log('Using property.images fallback:', images);
        setPropertyImages(images);
        organizeImagesByRoom(images);
      }
    } catch (error) {
      console.error("Failed to fetch property images:", error);
      const images = property.images || property.property_images || [];
      setPropertyImages(images);
      organizeImagesByRoom(images);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !property) return;

    // Reset states
    setCurrentRoomIndex(0);
    setCurrentImageIndex(0);
    setProgress(0);

    // Fetch broker details if available
    const brokerId = property.assigned_broker_id || property.broker_id || property.broker?.id;
    fetchBrokerDetails(brokerId);

    // Fetch property images
    fetchPropertyImages();

    // Parse JSON fields from database
    try {
      if (property.price_history) {
        const parsed = typeof property.price_history === 'string' ?
          JSON.parse(property.price_history) : property.price_history;
        setPriceHistory(Array.isArray(parsed) ? parsed : []);
      }
      if (property.tax_history) {
        const parsed = typeof property.tax_history === 'string' ?
          JSON.parse(property.tax_history) : property.tax_history;
        setTaxHistory(Array.isArray(parsed) ? parsed : []);
      }
      if (property.nearby_schools) {
        const parsed = typeof property.nearby_schools === 'string' ?
          JSON.parse(property.nearby_schools) : property.nearby_schools;
        setNearbySchools(Array.isArray(parsed) ? parsed : []);
      }
      if (property.floor_plans) {
        const parsed = typeof property.floor_plans === 'string' ?
          JSON.parse(property.floor_plans) : property.floor_plans;
        setFloorPlans(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error("Error parsing JSON fields:", error);
    }

    if (propertyImages?.length > 0) {
      startAutoSlide();
    }

    return () => clearInterval(progressIntervalRef.current);
  }, [property, isOpen]);

  // Update handleSaveProperty function
  const handleSaveProperty = async () => {
    if (!user) {
      alert('Please login to save properties');
      return;
    }
    try {
      setLoading(true);

      // Determine if we're saving or unsaving
      const endpoint = saved ? 'UNSAVE_PROPERTY' : 'SAVE_PROPERTY';

      const response = await apiCall(endpoint, { propertyId: property.id }, {
        method: saved ? 'DELETE' : 'POST',
        data: saved ? null : { save: true }
      });

      if (response.success) {
        setSaved(!saved);

        // Update saves count
        setPropertyStats(prev => ({
          ...prev,
          saves: response.data?.savesCount || (saved ? prev.saves - 1 : prev.saves + 1)
        }));

        toast.success(saved ? "Removed from saved" : "Property saved!");
      }
    } catch (error) {
      console.error("Failed to save property:", error);
      toast.error("Failed to update saved status");
    } finally {
      setLoading(false);
    }
  };

  const [propertyStats, setPropertyStats] = useState({
    views: 0,
    saves: 0,
    daysListed: 0
  });
  const organizeImagesByRoom = (images = propertyImages) => {
    console.log('Organizing images:', images);

    if (!Array.isArray(images) || images.length === 0) {
      const fallbackCategory = {
        name: 'Property Images',
        icon: <Camera size={18} />,
        images: [{
          url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
          caption: 'Property Image',
          room_category: 'other'
        }]
      };
      setRoomCategories([fallbackCategory]);
      return;
    }

    // Create room category mapping with Zillow-style icons
    const roomCategoryMap = {
      'living_room': { name: 'Living Room', icon: <HomeIcon size={18} />, zillowStyle: true },
      'kitchen': { name: 'Kitchen', icon: <Coffee size={18} />, zillowStyle: true },
      'bedroom': { name: 'Bedrooms', icon: <Bed size={18} />, zillowStyle: true },
      'bathroom': { name: 'Bathrooms', icon: <Bath size={18} />, zillowStyle: true },
      'exterior': { name: 'Exterior', icon: <Mountain size={18} />, zillowStyle: true },
      'garden': { name: 'Garden & Outdoor', icon: <Sun size={18} />, zillowStyle: true },
      'balcony': { name: 'Balcony', icon: <Wind size={18} />, zillowStyle: true },
      'garage': { name: 'Garage', icon: <Car size={18} />, zillowStyle: true },
      'pool': { name: 'Pool', icon: <Gem size={18} />, zillowStyle: true },
      'gym': { name: 'Gym', icon: <Target size={18} />, zillowStyle: true },
      'other': { name: 'Other', icon: <Grid3x3 size={18} />, zillowStyle: true }
    };

    // Group images by room_category
    const imagesByRoom = images.reduce((acc, img) => {
      const roomCat = img.room_category || img.room_type || 'other';
      if (!acc[roomCat]) {
        acc[roomCat] = [];
      }

      const imageObj = {
        url: img.image_url || img.url || img.file_path || '',
        caption: img.caption || img.room_name || img.description || '',
        alt_text: img.alt_text || '',
        room_category: roomCat,
        room_name: img.room_name,
        room_description: img.room_description,
        is_primary: img.is_primary || img.is_featured || false,
        id: img.id || img.image_id
      };

      acc[roomCat].push(imageObj);
      return acc;
    }, {});

    // Create categories from grouped images
    let categories = [];

    // Add "All Images" category first (Zillow-style)
    const allImages = images.map(img => ({
      url: img.image_url || img.url || img.file_path || '',
      caption: img.caption || img.room_name || img.description || '',
      alt_text: img.alt_text || '',
      room_category: img.room_category || img.room_type || 'other',
      id: img.id || img.image_id
    })).filter(img => img.url);

    if (allImages.length > 0) {
      categories.push({
        name: 'All Photos',
        icon: <Grid3x3 size={18} />,
        category: 'all',
        images: allImages,
        zillowStyle: true
      });
    }

    // Add room-specific categories
    Object.entries(imagesByRoom).forEach(([roomCat, roomImages]) => {
      if (roomImages.length > 0) {
        const roomInfo = roomCategoryMap[roomCat] || roomCategoryMap['other'];
        const validRoomImages = roomImages.filter(img => img.url && img.url !== '');

        if (validRoomImages.length > 0) {
          categories.push({
            name: roomInfo.name,
            icon: roomInfo.icon,
            category: roomCat,
            images: validRoomImages,
            zillowStyle: true
          });
        }
      }
    });

    // Sort categories: "All Photos" first, then alphabetically
    categories.sort((a, b) => {
      if (a.category === 'all') return -1;
      if (b.category === 'all') return 1;
      return a.name.localeCompare(b.name);
    });

    // Fallback if no categories were created
    if (categories.length === 0) {
      categories = [{
        name: 'Property Photos',
        icon: <Camera size={18} />,
        images: [{
          url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
          caption: 'Property Image',
          room_category: 'other'
        }],
        zillowStyle: true
      }];
    }

    console.log('Final categories:', categories);
    setRoomCategories(categories);
  };

  const startAutoSlide = () => {
    clearInterval(progressIntervalRef.current);
    setProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          handleNextImage();
          return 0;
        }
        return p + (100 / (SLIDE_DURATION / 100));
      });
    }, 100);
  };

  const handleNextImage = () => {
    const currentRoom = roomCategories[currentRoomIndex];
    if (!currentRoom || !currentRoom.images) return;

    setCurrentImageIndex((prev) => {
      if (prev === currentRoom.images.length - 1) {
        // Move to next room if available
        if (currentRoomIndex < roomCategories.length - 1) {
          setCurrentRoomIndex(prevRoom => prevRoom + 1);
          return 0;
        } else {
          // Loop back to first room
          setCurrentRoomIndex(0);
          return 0;
        }
      }
      return prev + 1;
    });
    setProgress(0);
  };

  const handlePrevImage = () => {
    const currentRoom = roomCategories[currentRoomIndex];
    if (!currentRoom || !currentRoom.images) return;

    setCurrentImageIndex((prev) => {
      if (prev === 0) {
        // Move to previous room if available
        if (currentRoomIndex > 0) {
          setCurrentRoomIndex(prevRoom => prevRoom - 1);
          return roomCategories[currentRoomIndex - 1]?.images?.length - 1 || 0;
        } else {
          // Loop to last room
          setCurrentRoomIndex(roomCategories.length - 1);
          return roomCategories[roomCategories.length - 1]?.images?.length - 1 || 0;
        }
      }
      return prev - 1;
    });
    setProgress(0);
  };

  const toggleAutoPlay = () => {
    if (isPlaying) {
      clearInterval(progressIntervalRef.current);
      setIsPlaying(false);
    } else {
      startAutoSlide();
      setIsPlaying(true);
    }
  };

  const getCurrentImage = () => {
    const currentRoom = roomCategories[currentRoomIndex];
    if (!currentRoom || !currentRoom.images || currentRoom.images.length === 0) {
      return "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80";
    }
    const imageIndex = currentImageIndex % currentRoom.images.length;
    return currentRoom.images[imageIndex]?.url ||
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80";
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return 'ETB 0';
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPricePerSqft = () => {
    if (!property?.price || !property?.square_meters) return 'N/A';
    const pricePerSqM = property.price / property.square_meters;
    return `ETB ${pricePerSqM.toLocaleString(undefined, { maximumFractionDigits: 0 })}/m²`;
  };


  const handleShare = () => {
    const url = `${window.location.origin}/property/${property.id}`;
    if (navigator.share) {
      navigator.share({
        title: property?.title || "Property Listing",
        text: `Check out this property: ${property?.title}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  // Enhanced Broker Info Card
  const BrokerInfoCard = () => {
    if (!broker) return null;

    const brokerFullName = `${broker.first_name || ''} ${broker.last_name || ''}`.trim() || "Property Agent";
    const experience = broker.experience_years || "5+";
    const rating = broker.average_rating || 4.8;
    const firm = broker.brokerage_firm || "Independent Broker";
    const completedDeals = broker.total_completed_deals || 50;
    const commissionRate = broker.commission_rate || "2.5%";
    const languages = Array.isArray(broker.languages) ? broker.languages.join(", ") : broker.languages || "English, Amharic";
    const specialization = Array.isArray(broker.specialization) ? broker.specialization.join(", ") : broker.specialization || "Residential, Commercial";
    const serviceAreas = Array.isArray(broker.service_areas) ? broker.service_areas.join(", ") : broker.service_areas || "Addis Ababa";

    return (
      <div className={`p-6 rounded-xl border ${isDark
        ? "border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900"
        : "border-gray-200 bg-gradient-to-br from-white to-gray-50"
        } shadow-lg`}>

        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            {broker.profile_picture ? (
              <img
                src={broker.profile_picture}
                alt={brokerFullName}
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-500 shadow-lg"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                {brokerFullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}

            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
              {broker.is_verified ? (
                <div className="w-3 h-3 bg-green-500 rounded-full" title="Verified Broker">
                  <CheckCircle className="w-2 h-2 text-white" />
                </div>
              ) : broker.is_available !== false ? (
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Online"></div>
              ) : (
                <div className="w-3 h-3 bg-gray-400 rounded-full" title="Offline"></div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h4 className={`font-semibold ${textColors.primary}`}>{brokerFullName}</h4>
            <p className={`text-sm ${textColors.tertiary}`}>{firm}</p>

            <div className="flex items-center mt-1 space-x-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className={`${i < Math.floor(rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                ))}
                <span className={`text-xs ml-1 ${textColors.accent}`}>{rating}/5</span>
              </div>
              <span className={`text-xs ${textColors.tertiary}`}>•</span>
              <span className={`text-xs ${textColors.tertiary}`}>{experience} years</span>
              <span className={`text-xs ${textColors.tertiary}`}>•</span>
              <span className={`text-xs ${textColors.tertiary}`}>{completedDeals} deals</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className={`text-center p-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <div className={`text-xs ${textColors.tertiary}`}>Commission</div>
            <div className={`text-sm font-semibold ${textColors.primary}`}>{commissionRate}</div>
          </div>
          <div className={`text-center p-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <div className={`text-xs ${textColors.tertiary}`}>Clients</div>
            <div className={`text-sm font-semibold ${textColors.primary}`}>
              {broker.current_active_clients || 0}/{broker.max_clients || 10}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className={`text-xs ${textColors.tertiary} mb-1`}>Specializes in:</div>
          <div className="flex flex-wrap gap-1">
            {specialization.split(',').slice(0, 3).map((spec, index) => (
              <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                {spec.trim()}
              </span>
            ))}
            {specialization.split(',').length > 3 && (
              <span className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                +{specialization.split(',').length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className={`text-xs ${textColors.tertiary} mb-1`}>Languages:</div>
          <div className="flex flex-wrap gap-1">
            {languages.split(',').map((lang, index) => (
              <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                {lang.trim()}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className={`text-xs ${textColors.tertiary} mb-1`}>Service Areas:</div>
          <div className={`text-sm ${textColors.secondary}`}>{serviceAreas}</div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowChat(true)}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold Button2 hover:text-white flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} />
            <span>Chat with Broker</span>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="w-full py-3 Button2 font-semibold text-amber-600 hover:text-white flex items-center justify-center gap-2"
          >
            <Calendar size={18} />
            <span>Schedule Tour</span>
          </button>
        </div>
      </div>
    );
  };

  // Contact Agent Section
  const ContactAgentSection = () => {
    if (!broker) return null;

    const brokerFullName = `${broker.first_name || ''} ${broker.last_name || ''}`.trim() || "Property Agent";
    const formattedPhone = broker.phone_number?.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") || "(xxx) xxx-xxxx";
    const email = broker.email || "agent@wubland.com";
    const licenseNumber = broker.broker_license_number || "N/A";
    const tinNumber = broker.tin_number || "N/A";
    const licenseExpiry = broker.broker_license_expiry || "N/A";
    const isVerified = broker.is_verified || false;
    const verificationStatus = broker.verification_status || "unverified";
    const verifiedAt = broker.verified_at;
    const verificationReason = broker.verification_reason;

    return (
      <div className={`p-6 rounded-xl border ${isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"
        }`}>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            {broker.profile_picture ? (
              <img
                src={broker.profile_picture}
                alt={brokerFullName}
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                {brokerFullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}

            {isVerified && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div>
            <h4 className={`font-semibold ${textColors.primary}`}>{brokerFullName}</h4>
            <p className={`text-sm ${textColors.tertiary}`}>
              {broker.brokerage_firm || "Independent Broker"} • {broker.broker_type === "internal" ? "Internal" : "External"} Broker
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className={`w-full py-2.5 px-4 rounded-lg border ${isDark ? "border-gray-600 bg-gray-800/30" : "border-gray-200 bg-gray-50"} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className={`text-sm ${textColors.secondary}`}>Phone</span>
            </div>
            <span className={`font-medium ${textColors.primary}`}>{formattedPhone}</span>
          </div>

          <div className={`w-full py-2.5 px-4 rounded-lg border ${isDark ? "border-gray-600 bg-gray-800/30" : "border-gray-200 bg-gray-50"} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className={`text-sm ${textColors.secondary}`}>Email</span>
            </div>
            <span className={`font-medium ${textColors.primary} text-sm`}>{email}</span>
          </div>

          {licenseNumber !== "N/A" && (
            <div className={`w-full py-2.5 px-4 rounded-lg border ${isDark ? "border-gray-600 bg-gray-800/30" : "border-gray-200 bg-gray-50"} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <AwardIcon className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${textColors.secondary}`}>License #</span>
              </div>
              <span className={`font-medium ${textColors.primary} text-sm`}>{licenseNumber}</span>
            </div>
          )}

          {tinNumber !== "N/A" && (
            <div className={`w-full py-2.5 px-4 rounded-lg border ${isDark ? "border-gray-600 bg-gray-800/30" : "border-gray-200 bg-gray-50"} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${textColors.secondary}`}>TIN #</span>
              </div>
              <span className={`font-medium ${textColors.primary} text-sm`}>{tinNumber}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              navigator.clipboard.writeText(formattedPhone.replace(/\D/g, ''));
              alert('Phone number copied to clipboard!');
            }}
            className="flex-1 py-1.5 text-xs Button2"
          >
            Copy Phone
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(email);
              alert('Email copied to clipboard!');
            }}
            className="flex-1 py-1.5 text-xs Button2"
          >
            Copy Email
          </button>
        </div>

        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${textColors.secondary}`}>Verification Status:</span>
            <span className={`text-sm font-medium ${verificationStatus === 'approved' ? 'text-green-500' :
              verificationStatus === 'pending' ? 'text-amber-500' :
                'text-red-500'
              }`}>
              {verificationStatus === 'approved' ? 'Verified' :
                verificationStatus === 'pending' ? 'Pending Review' :
                  'Not Verified'}
            </span>
          </div>

          {verifiedAt && (
            <div className="flex items-center justify-between">
              <span className={`text-xs ${textColors.tertiary}`}>Verified On:</span>
              <span className={`text-xs ${textColors.tertiary}`}>
                {new Date(verifiedAt).toLocaleDateString()}
              </span>
            </div>
          )}

          {verificationReason && (
            <div className="mt-2">
              <span className={`text-xs ${textColors.tertiary}`}>Notes: {verificationReason}</span>
            </div>
          )}
        </div>

        {broker.bio_english && (
          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h5 className={`text-sm font-semibold mb-2 ${textColors.primary}`}>About the Broker</h5>
            <p className={`text-xs ${textColors.secondary}`}>{broker.bio_english}</p>

            {broker.bio_amharic && (
              <p className={`text-xs mt-2 ${textColors.secondary}`} dir="rtl" lang="am">
                {broker.bio_amharic}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Enhanced Image Gallery Component with Room-Based Navigation
  const ImageGallery = () => {
    if (!roomCategories || roomCategories.length === 0) {
      return (
        <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-6">
          <div className="relative h-[600px] overflow-hidden flex items-center justify-center">
            <div className="text-center text-white">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">No Images Available</p>
              <p className="text-sm mt-2 opacity-70">Contact agent for property photos</p>
            </div>
          </div>
        </div>
      );
    }

    const currentRoom = roomCategories[currentRoomIndex] || roomCategories[0];
    const currentImages = currentRoom?.images || [];
    const totalImages = currentImages.length;

    return (
      <div className="relative bg-black rounded-xl overflow-hidden mb-8">
        {/* Main Image Display */}
        <div className="relative h-[600px] overflow-hidden">
          <img
            src={getCurrentImage()}
            alt={currentImages[currentImageIndex]?.caption || `Property image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80';
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

          {/* Top Controls */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <div className="bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-3">
              <Camera size={16} />
              <span className="font-semibold">{Math.min(currentImageIndex + 1, totalImages)}/{totalImages}</span>
              <span className="text-amber-400">•</span>
              <span className="font-medium">{currentRoom?.name || 'All Photos'}</span>
            </div>

            <div className="flex items-center space-x-2">
              {totalImages > 1 && (
                <button
                  onClick={toggleAutoPlay}
                  className={`bg-black/80 text-white p-2.5 rounded-full transition-all duration-300 hover:scale-110 ${isPlaying ? 'hover:bg-red-500/20' : 'hover:bg-green-500/20'}`}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
              )}
              <button
                className="bg-black/80 text-white p-2.5 rounded-full hover:bg-black/90 transition-colors"
                onClick={() => window.open(getCurrentImage(), '_blank')}
              >
                <ExternalLink size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Arrows */}
          {totalImages > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/80 text-white p-3 rounded-full hover:bg-black/90 transition-all duration-300 backdrop-blur-sm hover:scale-110"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/80 text-white p-3 rounded-full hover:bg-black/90 transition-all duration-300 backdrop-blur-sm hover:scale-110"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Progress Bar */}
          {totalImages > 1 && (
            <div className="absolute bottom-24 left-0 right-0 px-6">
              <div className="h-1 bg-gray-700/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-100 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Room Category Tabs and Thumbnails */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6">
          {/* Room Category Navigation */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
            {roomCategories.map((room, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentRoomIndex(index);
                  setCurrentImageIndex(0);
                  setProgress(0);
                }}
                className={`flex-shrink-0 px-5 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 ${currentRoomIndex === index
                  ? "bg-white text-gray-900 shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  }`}
              >
                {room.icon}
                <span className="text-sm font-medium">{room.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${currentRoomIndex === index
                  ? "bg-gray-100 text-gray-900"
                  : "bg-white/20 text-white"
                  }`}>
                  {room.images?.length || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Image Thumbnails */}
          {currentImages.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold text-white`}>
                  {currentRoom.name} ({currentImages.length} photos)
                </h3>
                {currentImages.length > 8 && (
                  <button
                    onClick={() => setShowAllImages(!showAllImages)}
                    className="text-amber-500 hover:text-amber-600 font-medium text-sm flex items-center gap-1"
                  >
                    {showAllImages ? (
                      <>
                        <ChevronUp size={14} />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        Show All {currentImages.length} Photos
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {currentImages.slice(0, showAllImages ? currentImages.length : 8).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setProgress(0);
                    }}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 relative ${currentImageIndex === index
                      ? "border-amber-500 shadow-lg scale-[1.02]"
                      : "border-transparent hover:border-amber-300"
                      }`}
                  >
                    <img
                      src={img.url}
                      alt={img.caption || `${currentRoom.name} photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    {currentImageIndex === index && (
                      <div className="absolute inset-0 border-2 border-amber-500 rounded-lg pointer-events-none"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Property Stats Component
  const PropertyStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className={`text-center p-5 rounded-xl transition-all duration-300 ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"
        }`}>
        <Bed className="w-7 h-7 mx-auto mb-3 text-amber-500" />
        <div className={`text-2xl font-bold ${textColors.primary}`}>{property?.bedrooms || 0}</div>
        <div className={`text-sm font-medium ${textColors.secondary}`}>Bedrooms</div>
      </div>
      <div className={`text-center p-5 rounded-xl transition-all duration-300 ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"
        }`}>
        <Bath className="w-7 h-7 mx-auto mb-3 text-amber-500" />
        <div className={`text-2xl font-bold ${textColors.primary}`}>{property?.bathrooms || 0}</div>
        <div className={`text-sm font-medium ${textColors.secondary}`}>Bathrooms</div>
      </div>
      <div className={`text-center p-5 rounded-xl transition-all duration-300 ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"
        }`}>
        <Ruler className="w-7 h-7 mx-auto mb-3 text-amber-500" />
        <div className={`text-2xl font-bold ${textColors.primary}`}>
          {property?.square_meters ? property.square_meters.toLocaleString() : '0'}
        </div>
        <div className={`text-sm font-medium ${textColors.secondary}`}>Square Meters</div>
      </div>
      <div className={`text-center p-5 rounded-xl transition-all duration-300 ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"
        }`}>
        <Car className="w-7 h-7 mx-auto mb-3 text-amber-500" />
        <div className={`text-2xl font-bold ${textColors.primary}`}>
          {property?.parking_spots || property?.garage_spaces || 0}
        </div>
        <div className={`text-sm font-medium ${textColors.secondary}`}>Parking</div>
      </div>
    </div>
  );

  // Tabs Navigation
  const TabsNavigation = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'features', label: 'Features', icon: CheckCircle },
      { id: 'price', label: 'Price & Tax', icon: TrendingUp },
      { id: 'schools', label: 'Schools', icon: School },
      { id: 'neighborhood', label: 'Neighborhood', icon: Map },
      { id: 'floorplans', label: 'Floor Plans', icon: Layers }
    ];

    return (
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-5 border-b-2 font-medium whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
            >
              <tab.icon size={16} />
              <span className="font-semibold">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  };

  // Room Categories Section
  const RoomCategoriesSection = () => {
    if (roomCategories.length <= 1) return null;

    return (
      <div className="mb-8" data-room-section>
        <h3 className={`text-xl font-bold mb-4 ${textColors.primary}`}>Photos by Room</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {roomCategories.slice(1).map((room, index) => {
            if (room.images?.length === 0) return null;

            return (
              <button
                key={index}
                onClick={() => {
                  const roomIndex = roomCategories.findIndex(r => r.category === room.category);
                  if (roomIndex !== -1) {
                    setCurrentRoomIndex(roomIndex);
                    setCurrentImageIndex(0);
                    setProgress(0);
                    document.getElementById('image-gallery')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`text-left p-4 rounded-xl transition-all duration-300 hover:shadow-lg ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"
                  }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-white"}`}>
                    {room.icon}
                  </div>
                  <div>
                    <h4 className={`font-semibold ${textColors.primary}`}>{room.name}</h4>
                    <p className={`text-sm ${textColors.tertiary}`}>{room.images?.length || 0} photos</p>
                  </div>
                </div>
                {room.images?.[0] && (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={room.images[0].url}
                      alt={room.images[0].caption || room.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen || !property) return null;

  // Parse features and amenities from database
  const features = Array.isArray(property.features) ? property.features :
    (typeof property.features === 'string' ? JSON.parse(property.features) : []);
  const amenities = Array.isArray(property.amenities) ? property.amenities :
    (typeof property.amenities === 'string' ? JSON.parse(property.amenities) : []);
  const displayedFeatures = showAllFeatures ? features : features.slice(0, 8);

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto">
        <div
          ref={modalContentRef}
          className={`relative w-full max-w-7xl ${isDark ? "bg-gray-900" : "bg-white"} min-h-screen`}
        >
          {/* Close Button - Top Right */}
          <button
            onClick={onClose}
            className={`fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-300 hover:scale-110 ${isDark
              ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-700"
              } shadow-xl`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Main Content - Scrollable */}
          <div className="container mx-auto px-6 py-6">
            {/* Price and Stats */}
            <div className="mb-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-4">
                <div>
                  <h2 className={`text-4xl font-bold ${textColors.primary}`}>
                    {formatCurrency(property.price)}
                  </h2>
                  {property.listing_type === 'rent' && property.monthly_rent && (
                    <p className={`text-lg ${textColors.secondary}`}>
                      {formatCurrency(property.monthly_rent)}/month
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className={`flex items-center gap-2 ${textColors.tertiary}`}>
                    <Eye size={14} />
                    {propertyStats.views} views
                  </span>
                  <span className={`flex items-center gap-2 ${textColors.tertiary}`}>
                    <Bookmark size={14} />
                    {propertyStats.saves} saves
                    {saved && <span className="text-amber-500 ml-1">✓</span>}
                  </span>
                  <span className={`flex items-center gap-2 ${textColors.tertiary}`}>
                    <Clock size={14} />
                    {propertyStats.daysListed} days listed
                  </span>
                </div>
              </div>

              {/* Property Title and Address */}
              <h1 className={`text-2xl font-bold mb-2 ${textColors.primary}`}>
                {property.title}
              </h1>
              <p className={`text-lg ${textColors.secondary} flex items-center gap-2`}>
                <MapPin size={16} />
                {property.address}, {property.city}, {property.region || property.state}
              </p>
            </div>

            {/* Property Badges */}
            <div className="flex items-center gap-3 mb-8">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${property.listing_type === 'rent'
                ? 'bg-blue-500 text-white'
                : 'bg-green-500 text-white'
                }`}>
                {property.listing_type === 'rent' ? 'FOR RENT' : 'FOR SALE'}
              </span>
              {property.is_exclusive && (
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-amber-500 text-white">
                  <Crown className="inline w-3 h-3 mr-1" />
                  Exclusive
                </span>
              )}
              {property.is_premium && (
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-purple-500 text-white">
                  <Gem className="inline w-3 h-3 mr-1" />
                  Premium
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={handleSaveProperty}
                className={`p-3 rounded-lg transition-all duration-300 hover:scale-105 ${isDark
                  ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
                  }`}
                title="Save"
              >
                <Heart className={`w-5 h-5 ${saved ? 'fill-current text-red-500' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className={`p-3 rounded-lg transition-all duration-300 hover:scale-105 ${isDark
                  ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
                  }`}
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.print()}
                className={`p-3 rounded-lg transition-all duration-300 hover:scale-105 ${isDark
                  ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-700"
                  }`}
                title="Print"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>

            {/* Full-width Image Gallery */}
            <div id="image-gallery">
              <ImageGallery />
            </div>

            {/* Property Stats */}
            <PropertyStats />

            {/* Room Categories Section */}
            <RoomCategoriesSection />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Tabs */}
                <TabsNavigation />

                {/* Tab Content */}
                <div className="space-y-8">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <>
                      <div>
                        <h3 className={`text-xl font-bold mb-4 ${textColors.primary}`}>Description</h3>
                        <p className={`whitespace-pre-line leading-relaxed ${textColors.secondary} text-lg`}>
                          {property.description || 'No description available.'}
                        </p>
                      </div>

                      {features.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-xl font-bold ${textColors.primary}`}>Features & Amenities</h3>
                            {features.length > 8 && (
                              <button
                                onClick={() => setShowAllFeatures(!showAllFeatures)}
                                className="text-amber-500 hover:text-amber-600 font-medium"
                              >
                                {showAllFeatures ? 'Show less' : `Show all ${features.length} features`}
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayedFeatures.map((feature, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span className={`${textColors.secondary}`}>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Property Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={`p-5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                          <div className={`text-sm ${textColors.tertiary} mb-2`}>Property Type</div>
                          <div className={`font-semibold text-lg ${textColors.primary}`}>{property.property_type}</div>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                          <div className={`text-sm ${textColors.tertiary} mb-2`}>Year Built</div>
                          <div className={`font-semibold text-lg ${textColors.primary}`}>{property.year_built || 'N/A'}</div>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                          <div className={`text-sm ${textColors.tertiary} mb-2`}>Lot Size</div>
                          <div className={`font-semibold text-lg ${textColors.primary}`}>
                            {property.lot_size ? `${property.lot_size.toLocaleString()} sqm` : 'N/A'}
                          </div>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                          <div className={`text-sm ${textColors.tertiary} mb-2`}>Price/m²</div>
                          <div className={`font-semibold text-lg ${textColors.primary}`}>
                            {formatPricePerSqft()}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Features Tab */}
                  {activeTab === 'features' && (
                    <div className="space-y-8">
                      {amenities.length > 0 && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-4 ${textColors.primary}`}>Amenities</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {amenities.map((amenity, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <Check className="w-4 h-4 text-amber-500" />
                                <span className={`${textColors.secondary}`}>{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Property Information */}
                      <div className="space-y-4">
                        <h4 className={`text-lg font-semibold ${textColors.primary}`}>Property Information</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className={`text-sm ${textColors.tertiary}`}>MLS#</div>
                            <div className={`font-semibold ${textColors.primary}`}>{property.mls_number || 'N/A'}</div>
                          </div>
                          <div>
                            <div className={`text-sm ${textColors.tertiary}`}>Property Status</div>
                            <div className={`font-semibold capitalize ${textColors.primary}`}>{property.property_status || 'Active'}</div>
                          </div>
                          <div>
                            <div className={`text-sm ${textColors.tertiary}`}>Exclusive</div>
                            <div className={`font-semibold ${textColors.primary}`}>{property.is_exclusive ? 'Yes' : 'No'}</div>
                          </div>
                          <div>
                            <div className={`text-sm ${textColors.tertiary}`}>Negotiable</div>
                            <div className={`font-semibold ${textColors.primary}`}>{property.is_negotiable ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price History Tab */}
                  {activeTab === 'price' && (
                    <div className="space-y-8">
                      {priceHistory.length > 0 && (
                        <div>
                          <h3 className={`text-xl font-bold mb-4 ${textColors.primary}`}>Price History</h3>
                          <div className={`rounded-xl overflow-hidden border ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                            <table className="w-full">
                              <thead className={isDark ? "bg-gray-800" : "bg-gray-50"}>
                                <tr>
                                  <th className={`text-left py-4 px-6 text-sm font-semibold ${textColors.primary}`}>Date</th>
                                  <th className={`text-left py-4 px-6 text-sm font-semibold ${textColors.primary}`}>Event</th>
                                  <th className={`text-left py-4 px-6 text-sm font-semibold ${textColors.primary}`}>Price</th>
                                  <th className={`text-left py-4 px-6 text-sm font-semibold ${textColors.primary}`}>Price/m²</th>
                                </tr>
                              </thead>
                              <tbody>
                                {priceHistory.map((entry, index) => (
                                  <tr key={index} className={`border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                                    <td className={`py-4 px-6 ${textColors.secondary}`}>{entry.date}</td>
                                    <td className={`py-4 px-6 ${textColors.secondary}`}>{entry.event}</td>
                                    <td className={`py-4 px-6 ${textColors.primary}`}>{formatCurrency(entry.price)}</td>
                                    <td className={`py-4 px-6 ${textColors.primary}`}>
                                      ETB {entry.price_per_sqft?.toLocaleString() || 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {taxHistory.length > 0 && (
                        <div>
                          <h4 className={`text-lg font-semibold mb-4 ${textColors.primary}`}>Tax History</h4>
                          <div className={`rounded-xl overflow-hidden border ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                            <table className="w-full">
                              <thead className={isDark ? "bg-gray-800" : "bg-gray-50"}>
                                <tr>
                                  <th className={`text-left py-4 px-6 text-sm font-semibold ${textColors.primary}`}>Year</th>
                                  <th className={`text-left py-4 px-6 text-sm font-semibold ${textColors.primary}`}>Property Taxes</th>
                                  <th className={`text-left py-4 px-6 text-sm font-semibold ${textColors.primary}`}>Tax Assessment</th>
                                </tr>
                              </thead>
                              <tbody>
                                {taxHistory.map((entry, index) => (
                                  <tr key={index} className={`border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                                    <td className={`py-4 px-6 ${textColors.primary}`}>{entry.year}</td>
                                    <td className={`py-4 px-6 ${textColors.primary}`}>{formatCurrency(entry.tax_amount)}</td>
                                    <td className={`py-4 px-6 ${textColors.primary}`}>{formatCurrency(entry.assessment)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Schools Tab */}
                  {activeTab === 'schools' && (
                    <div>
                      <h3 className={`text-xl font-bold mb-4 ${textColors.primary}`}>Nearby Schools</h3>
                      {nearbySchools.length > 0 ? (
                        <div className="space-y-4">
                          {nearbySchools.map((school, index) => (
                            <div key={index} className={`p-5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-50"
                              }`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className={`font-semibold ${textColors.primary}`}>{school.name}</h4>
                                  <p className={`text-sm mt-1 ${textColors.tertiary}`}>
                                    {school.level} • {school.distance} km
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <School className="w-5 h-5 text-gray-400" />
                                  <span className={`font-semibold ${textColors.primary}`}>{school.rating}/10</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={`${textColors.tertiary}`}>No school information available</p>
                      )}
                    </div>
                  )}

                  {/* Neighborhood Tab */}
                  {activeTab === 'neighborhood' && (
                    <div>
                      <h3 className={`text-xl font-bold mb-4 ${textColors.primary}`}>Neighborhood</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`p-5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-50"
                          }`}>
                          <div className="text-center">
                            <div className={`text-3xl font-bold mb-2 ${textColors.primary}`}>
                              {property.walk_score || '6'}
                            </div>
                            <div className={`font-semibold ${textColors.secondary}`}>Walk Score</div>
                            <div className={`text-xs mt-2 ${textColors.tertiary}`}>/100</div>
                          </div>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-50"
                          }`}>
                          <div className="text-center">
                            <div className={`text-3xl font-bold mb-2 ${textColors.primary}`}>
                              {property.transit_score || '0'}
                            </div>
                            <div className={`font-semibold ${textColors.secondary}`}>Transit Score</div>
                            <div className={`text-xs mt-2 ${textColors.tertiary}`}>/100</div>
                          </div>
                        </div>
                        <div className={`p-5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-50"
                          }`}>
                          <div className="text-center">
                            <div className={`text-3xl font-bold mb-2 ${textColors.primary}`}>
                              {property.bike_score || '28'}
                            </div>
                            <div className={`font-semibold ${textColors.secondary}`}>Bike Score</div>
                            <div className={`text-xs mt-2 ${textColors.tertiary}`}>/100</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Floor Plans Tab */}
                  {activeTab === 'floorplans' && (
                    <div>
                      <h3 className={`text-xl font-bold mb-4 ${textColors.primary}`}>Floor Plans</h3>
                      {floorPlans.length > 0 ? (
                        <div className="space-y-6">
                          {floorPlans.map((plan, index) => (
                            <div key={index} className={`p-6 rounded-xl border ${isDark ? "border-gray-700" : "border-gray-200"
                              }`}>
                              <h4 className={`font-semibold text-lg mb-2 ${textColors.primary}`}>{plan.name}</h4>
                              <p className={`mb-4 ${textColors.secondary}`}>
                                {plan.sqft || plan.area} m² • {plan.beds} beds • {plan.baths} baths
                              </p>
                              {plan.image && (
                                <img
                                  src={plan.image}
                                  alt={plan.name}
                                  className="w-full h-auto rounded-lg"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={`${textColors.tertiary}`}>No floor plans available</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Action Cards */}
              <div className="space-y-6">
                <BrokerInfoCard />

                {/* View More Properties Card */}
                <div className={`p-6 rounded-xl border ${isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"
                  } shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                  <h4 className={`text-lg font-semibold mb-4 ${textColors.primary} flex items-center gap-2`}>
                    <Map size={20} className="text-amber-500" />
                    Discover More Properties
                  </h4>

                  <div className="space-y-4 mb-6">
                    <div className={`p-3 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-50"
                      } flex items-center gap-3`}>
                      <Building className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className={`text-sm font-medium ${textColors.primary}`}>Similar Properties</p>
                        <p className={`text-xs ${textColors.tertiary}`}>Find homes like this one</p>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-50"
                      } flex items-center gap-3`}>
                      <MapPin className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className={`text-sm font-medium ${textColors.primary}`}>
                          In {property.city || property.region || property.state || 'Ethiopia'}
                        </p>
                        <p className={`text-xs ${textColors.tertiary}`}>Explore local listings</p>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-50"
                      } flex items-center gap-3`}>
                      <Filter className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className={`text-sm font-medium ${textColors.primary}`}>Smart Filters</p>
                        <p className={`text-xs ${textColors.tertiary}`}>Filter by price, bedrooms & more</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/properties?${property.city ? `city=${encodeURIComponent(property.city)}&` : ''
                      }${property.property_type ? `type=${encodeURIComponent(property.property_type)}&` : ''
                      }${property.listing_type ? `listing=${encodeURIComponent(property.listing_type)}` : ''
                      }`}
                    className="block w-full py-3 Button2 text-center group"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Browse Properties
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>

                  <p className={`text-xs mt-3 text-center ${textColors.tertiary}`}>
                    {property.city ? `Explore more in ${property.city}` : 'Discover amazing properties'}
                  </p>
                </div>

                {/* Contact Agent Section */}
                <ContactAgentSection />
              </div>
            </div>

            {/* Footer Info */}
            <div className={`mt-12 pt-8 border-t ${isDark ? "border-gray-700" : "border-gray-200"
              }`}>
              <div className={textColors.tertiary}>
                <p className="mb-2 text-sm">
                  <strong>Source:</strong> {property.mls_source || 'WubLand Real Estate'} •
                  <strong> Property ID:</strong> {property.property_uuid || property.id}
                </p>
                <p className="text-xs">
                  The data relating to real estate for sale on this web site comes in part from the Internet Data Exchange Program.
                  Information is deemed reliable but not guaranteed.
                </p>
                <p className="text-xs mt-2">
                  {property.city && `${property.city}, `}
                  {property.state && `${property.state}, `}
                  {property.country || 'Ethiopia'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      {showChat && broker && user && (
        <BrokerChatInterface
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          user={user}
          broker={broker}
          property={property}
          theme={theme}
        />
      )}

      {/* Schedule Viewing Modal */}
      {showScheduleModal && broker && (
        <ScheduleViewingModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          property={property}
          broker={broker}
          user={user}
          theme={theme}
        />
      )}
    </>
  );
};

export default PropertyDetailsModal;