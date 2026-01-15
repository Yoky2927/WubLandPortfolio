import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import EthiopiaPropertyMap from "../../components/EthiopiaPropertyMap";
import PropertyDetailsModel from "../../components/PropertyDetailsModal";
import PropertyCardWithChat from "../../components/PropertyCard.jsx";
import Loader from "../../components/Loader";
import ThemeToggle from "../../components/ThemeToggle.jsx";
import Footer from "../../components/Footer";
import { apiCall } from "../../utils/api.endpoints";
import {
  Search,
  Grid,
  List,
  X,
  Shield,
  User,
  Map,
  Sparkles,
  Compass,
  AlertCircle,
  Filter,
  SlidersHorizontal,
  Menu,
  Star,
  Home,
  MapPin,
  ChevronDown,
  ChevronUp,
  Heart,
  ShoppingBag,
  Building,
  Lock,
} from "lucide-react";

const Properties = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // State variables
  const [allProperties, setAllProperties] = useState([]);
  const [recommendedProperties, setRecommendedProperties] = useState([]);
  const [exploreProperties, setExploreProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileView, setMobileView] = useState("list");
  const [error, setError] = useState(null);
  const [savedProperties, setSavedProperties] = useState([]);
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [savingProperty, setSavingProperty] = useState(null);
  const [showRecommended, setShowRecommended] = useState(true);
  const [showExplore, setShowExplore] = useState(true);
  const [brokers, setBrokers] = useState([]);
  const [hasRecommendedError, setHasRecommendedError] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    type: "",
    priceRange: [0, 50000000],
    beds: "",
    baths: "",
    propertyStatus: "",
    city: "",
    minSqft: "",
    maxSqft: "",
  });

  // Initialize user data - DON'T REDIRECT FOR UNREGISTERED USERS
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsVerified(parsedUser.is_verified || false);

        // Auto-set property status filter based on user role
        if (parsedUser.role === 'buyer') {
          setFilters(prev => ({ ...prev, propertyStatus: 'sale' }));
        } else if (parsedUser.role === 'renter') {
          setFilters(prev => ({ ...prev, propertyStatus: 'rent' }));
        }
        console.log("✅ User found:", parsedUser.email);
      } catch (e) {
        console.error("Failed to parse user data:", e);
        setUser(null); // Set user to null if parsing fails
      }
    } else {
      console.log("👤 No user found, showing public properties");
      setUser(null); // Explicitly set user to null
    }
  }, [navigate]);

  // Fetch saved properties (only for logged-in users)
  const fetchSavedProperties = async () => {
    if (!user) return;

    try {
      const response = await apiCall('GET_SAVED_PROPERTIES');
      if (response && response.success && response.data) {
        const savedIds = response.data.map(property => property.id || property.property_id);
        setSavedProperties(savedIds);
      }
    } catch (error) {
      console.log('Could not fetch saved properties:', error);
    }
  };

  // Save property function
  const handleSaveProperty = async (propertyId, isCurrentlySaved) => {
    if (!user) {
      // Show login modal or message instead of redirecting
      const shouldLogin = window.confirm("Please login to save properties. Would you like to login now?");
      if (shouldLogin) {
        navigate("/login-register", {
          state: { returnUrl: "/properties", message: "Please login to save properties" }
        });
      }
      return;
    }

    setSavingProperty(propertyId);
    try {
      const method = isCurrentlySaved ? 'DELETE' : 'POST';
      const response = await apiCall('SAVE_PROPERTY', { propertyId }, {
        method: method,
        data: isCurrentlySaved ? {} : { save: true } // Only send body for POST
      });

      console.log('💾 Save response:', response);

      if (response && response.success) {
        if (isCurrentlySaved) {
          setSavedProperties(prev => prev.filter(id => id !== propertyId));
          toast.success("Property removed from saved list");
        } else {
          setSavedProperties(prev => [...prev, propertyId]);
          toast.success("Property saved!");
        }

        // Update the property card if needed
        setProperties(prev => prev.map(p => {
          if (p.id === propertyId) {
            return {
              ...p,
              saves: response.data?.savesCount || p.saves + (isCurrentlySaved ? -1 : 1),
              isSaved: !isCurrentlySaved
            };
          }
          return p;
        }));
      } else {
        toast.error(response?.message || "Failed to save property");
      }
    } catch (error) {
      console.error('❌ Error saving property:', error);
      toast.error(error.message || "Failed to save property");
      if (error.message.includes('401') || error.message.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        const shouldLogin = window.confirm("Your session has expired. Would you like to login again?");
        if (shouldLogin) {
          navigate("/login-register", {
            state: { returnUrl: "/properties", message: "Session expired. Please login again." }
          });
        }
      }
    } finally {
      setSavingProperty(null);
    }
  };

  // Transform property data
  const transformProperty = (property, index) => {
    let images = [];

    if (property.property_image_url) {
      images = [property.property_image_url];
    } else if (property.images && Array.isArray(property.images)) {
      images = property.images.map(img =>
        typeof img === 'object' ? img.image_url || img.url || img : img
      );
    } else if (property.image_url) {
      images = [property.image_url];
    } else if (property.photos && Array.isArray(property.photos)) {
      images = property.photos;
    }

    // Process image URLs
    const processedImages = images.map(img => {
      if (!img || img.trim() === '') return null;
      if (img.startsWith('http')) return img;
      if (img.startsWith('/uploads/') || img.startsWith('/property-images/')) {
        return `http://localhost:5002${img}`;
      }
      return `http://localhost:5002/uploads/property-images/${img}`;
    }).filter(Boolean);

    if (processedImages.length === 0) {
      processedImages.push('https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80');
    }

    const listing_type = property.listing_type || property.property_status || 'sale';
    const property_type = property.property_type || 'house';
    const city = property.city || 'Addis Ababa';

    return {
      id: property.id || property._id || `property-${index}`,
      title: property.title || property.property_title || `${property_type} in ${city}`,
      description: property.description || `${property_type} in ${city}`,
      property_type: property_type,
      listing_type: listing_type === 'rent' ? 'rent' : 'sale',
      price: property.price || 0,
      location: property.address || property.full_address || city,
      city: city,
      region: property.region || '',
      beds: property.beds || property.bedrooms || 0,
      baths: property.baths || property.bathrooms || 0,
      sqft: parseFloat(property.sqft) || parseFloat(property.area) || 0,
      images: processedImages,
      is_featured: property.is_featured || false,
      main_image: processedImages[0] || '',
      features: property.features || [],
      amenities: property.amenities || [],
      garage: property.garage || 0,
      created_at: property.created_at || new Date().toISOString(),
      views: property.views || 0,
      saves: property.saves || 0,
      broker: property.broker || null,
      currency: property.currency || 'ETB',
    };
  };

  // Fetch brokers
  const fetchBrokers = async () => {
    try {
      const response = await apiCall('GET_BROKERS');
      if (response && Array.isArray(response)) {
        setBrokers(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setBrokers(response.data);
      }
    } catch (error) {
      console.log('Could not fetch brokers:', error);
    }
  };

  // Fetch all properties - ALLOW FOR UNREGISTERED USERS
  const fetchAllProperties = async () => {
    setLoading(true);
    setError(null);
    setHasRecommendedError(false);

    try {
      // Fetch all properties (available to everyone)
      console.log('🔄 Fetching all properties...');
      const propertiesResponse = await apiCall('GET_PROPERTIES');

      // Try to fetch recommended properties ONLY for logged-in users
      let recommendedResponse = null;
      let recommendedError = false;

      if (user && (user.role === 'buyer' || user.role === 'renter')) {
        try {
          console.log('🔄 Trying to fetch recommended properties for logged-in user...');
          recommendedResponse = await apiCall('GET_RECOMMENDED_PROPERTIES');
          console.log('✅ Recommended properties fetched successfully');
        } catch (recError) {
          console.log('⚠️ Could not fetch recommended properties:', recError.message);
          recommendedError = true;
          setHasRecommendedError(true);
        }
      }

      let propertiesData = [];
      let recommendedData = [];

      // Process all properties response
      if (propertiesResponse) {
        console.log('📊 Properties response structure:', {
          success: propertiesResponse.success,
          hasData: !!propertiesResponse.data,
          hasProperties: !!propertiesResponse.data?.properties,
          isArray: Array.isArray(propertiesResponse)
        });

        if (propertiesResponse.success && propertiesResponse.data && Array.isArray(propertiesResponse.data.properties)) {
          propertiesData = propertiesResponse.data.properties;
        } else if (propertiesResponse.success && Array.isArray(propertiesResponse.data)) {
          propertiesData = propertiesResponse.data;
        } else if (Array.isArray(propertiesResponse)) {
          propertiesData = propertiesResponse;
        } else if (propertiesResponse.data && Array.isArray(propertiesResponse.data)) {
          propertiesData = propertiesResponse.data;
        }
      }

      console.log(`✅ Found ${propertiesData.length} total properties`);

      // Process recommended properties (if available and user is logged in)
      if (user && recommendedResponse && !recommendedError) {
        console.log('📊 Recommended properties response:', recommendedResponse);
        if (recommendedResponse.success && recommendedResponse.data && Array.isArray(recommendedResponse.data)) {
          recommendedData = recommendedResponse.data;
        } else if (Array.isArray(recommendedResponse)) {
          recommendedData = recommendedResponse;
        } else if (recommendedResponse.data && Array.isArray(recommendedResponse.data)) {
          recommendedData = recommendedResponse.data;
        }
        console.log(`✅ Found ${recommendedData.length} recommended properties`);
      }

      // Transform all properties
      const transformedProperties = propertiesData.map(transformProperty).filter(Boolean);
      const transformedRecommended = recommendedData.map(transformProperty).filter(Boolean);

      // Apply user role filter for unverified users (only if logged in)
      let filteredProperties = transformedProperties;
      if (user && !isVerified) {
        if (user.role === 'buyer') {
          filteredProperties = transformedProperties.filter(p => p.listing_type === 'sale');
          console.log(`👑 Filtered for unverified buyer: ${filteredProperties.length} properties`);
        } else if (user.role === 'renter') {
          filteredProperties = transformedProperties.filter(p => p.listing_type === 'rent');
          console.log(`🔑 Filtered for unverified renter: ${filteredProperties.length} properties`);
        }
      }

      setAllProperties(filteredProperties);

      // Set recommended properties (only for logged-in users)
      setRecommendedProperties(transformedRecommended);

      // Set explore properties
      if (user && transformedRecommended.length > 0) {
        // For logged-in users with recommendations: show non-recommended properties
        const recommendedIds = new Set(transformedRecommended.map(p => p.id));
        const exploreProps = filteredProperties.filter(p => !recommendedIds.has(p.id));
        setExploreProperties(exploreProps);
        console.log(`🗺️ Explore properties for logged-in user: ${exploreProps.length} (excluding ${transformedRecommended.length} recommended)`);
      } else {
        // For unregistered users OR users without recommendations: show all properties
        setExploreProperties(filteredProperties);
        console.log(`🗺️ Showing all ${filteredProperties.length} properties in Explore section`);
      }

      // Fetch saved properties and brokers (only if logged in)
      if (user) {
        fetchSavedProperties();
      }
      fetchBrokers();

    } catch (error) {
      console.error('❌ Error fetching properties:', error);
      setError(`Error fetching properties: ${error.message}`);
      setAllProperties([]);
      setRecommendedProperties([]);
      setExploreProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAllProperties();
  }, [user, isVerified]);

  // Apply filters when they change
  const applyFilters = (properties) => {
    return properties.filter((property) => {
      const matchesSearch =
        searchTerm === "" ||
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !filters.type || property.property_type === filters.type;
      const matchesStatus = !filters.propertyStatus || property.listing_type === filters.propertyStatus;
      const matchesCity = !filters.city || property.city === filters.city;
      const matchesBeds = !filters.beds || property.beds >= parseInt(filters.beds);
      const matchesBaths = !filters.baths || property.baths >= parseInt(filters.baths);
      const matchesPrice = property.price >= filters.priceRange[0] && property.price <= filters.priceRange[1];
      const matchesMinSqft = !filters.minSqft || property.sqft >= parseInt(filters.minSqft);
      const matchesMaxSqft = !filters.maxSqft || property.sqft <= parseInt(filters.maxSqft);

      return matchesSearch && matchesType && matchesStatus && matchesCity &&
        matchesBeds && matchesBaths && matchesPrice && matchesMinSqft && matchesMaxSqft;
    });
  };

  // Filter properties when filters change
  useEffect(() => {
    const filteredAll = applyFilters(allProperties);
    const filteredRecommended = applyFilters(recommendedProperties);

    if (user && filteredRecommended.length > 0) {
      const recommendedIds = new Set(filteredRecommended.map(p => p.id));
      const filteredExplore = filteredAll.filter(p => !recommendedIds.has(p.id));
      setExploreProperties(filteredExplore);
    } else {
      // For unregistered users OR users without recommendations: show all filtered properties
      setExploreProperties(filteredAll);
    }
  }, [filters, searchTerm, allProperties, recommendedProperties, user]);

  // Get unique cities
  const cities = [...new Set(allProperties.map(p => p.city).filter(Boolean))];

  // Clear filters
  const clearFilters = () => {
    setFilters({
      type: "",
      priceRange: [0, 50000000],
      beds: "",
      baths: "",
      propertyStatus: user?.role === 'buyer' ? 'sale' : user?.role === 'renter' ? 'rent' : "",
      city: "",
      minSqft: "",
      maxSqft: "",
    });
    setSearchTerm("");
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "ETB 0";
    if (amount >= 1000000) return `ETB ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `ETB ${(amount / 1000).toFixed(0)}K`;
    return `ETB ${amount.toLocaleString()}`;
  };

  // Top Navigation Component
  const TopNavigation = () => {
    const currentPath = window.location.pathname;

    return (
      <nav className={`${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border-b shadow-sm sticky top-0 z-50`}>
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Left Links */}
            <div className="hidden lg:flex items-center space-x-6">
              <a
                href="/"
                className={`font-medium ${currentPath === "/" ? "text-amber-400" : theme === "dark" ? "text-gray-300" : "text-gray-600"} nav-link`}
              >
                Home
              </a>
              <a
                href="/properties"
                className={`font-medium ${currentPath === "/properties" ? "text-amber-400" : theme === "dark" ? "text-gray-300" : "text-gray-600"} nav-link`}
              >
                Properties
              </a>
              <a
                href="/help"
                className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"} nav-link`}
              >
                Help
              </a>
              <a
                href="/"
                className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"} nav-link`}
              >
                About Us
              </a>
              {user && (
                <span className={`font-medium px-3 py-1 text-sm ${theme === "dark"
                  ? "bg-amber-900/30 text-amber-300"
                  : "bg-amber-100 text-amber-700"}`}>
                  {user.role === 'buyer' ? 'Buyer' : 'Renter'}
                </span>
              )}
            </div>

            {/* Logo */}
            <div className="flex-1 lg:flex-none flex justify-center lg:justify-center">
              <a href="/" className="flex items-center space-x-3">
                <span className={`text-3xl font-bold ${theme === "dark" ? "text-amber-500" : "text-amber-500"}`}>
                  WubLand
                </span>
              </a>
            </div>

            {/* Right Links */}
            <div className="hidden lg:flex items-center space-x-4">
              <a
                href="/post-property"
                className="Button2 px-4 py-2 font-semibold hover:scale-105 transition-all duration-300 text-sm"
              >
                Post Property
              </a>
              <a
                href="/find-agent"
                className={`Button2 border border-amber-400 ${theme === "dark" ? "text-amber-300" : "text-amber-800"} hover:bg-amber-400 hover:text-black px-4 py-2 font-semibold hover:scale-105 transition-all duration-300 text-sm`}
              >
                Find an Agent
              </a>
              {user ? (
                <a
                  href="/buyer-renter"
                  className={`flex items-center nav-link gap-2 px-4 py-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"} font-semibold`}
                >
                  <User className="w-4 h-4 text-amber-500" />
                  Dashboard
                </a>
              ) : (
                <a
                  href="/login-register"
                  className="Button2 px-4 py-2 font-semibold hover:scale-105 transition-all duration-300 text-sm"
                >
                  Sign In
                </a>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg border"
            >
              <Menu
                size={24}
                className={theme === "dark" ? "text-white" : "text-gray-700"}
              />
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className={`lg:hidden border-t ${theme === "dark" ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"} px-4 py-4`}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <a href="/" className={`p-2 rounded-lg text-center font-medium ${currentPath === "/" ? theme === "dark" ? "bg-amber-400 text-black" : "bg-amber-400 text-black" : theme === "dark" ? "bg-gray-800 text-amber-400" : "bg-gray-100 text-amber-600"}`}>
                  Home
                </a>
                <a href="/properties" className={`p-2 rounded-lg text-center font-medium ${currentPath === "/properties" ? theme === "dark" ? "bg-amber-400 text-black" : "bg-amber-400 text-black" : theme === "dark" ? "bg-gray-800 text-amber-400" : "bg-gray-100 text-amber-600"}`}>
                  Properties
                </a>
                <a href="/help" className={`p-2 rounded-lg text-center font-medium ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  Help
                </a>
                <a href="/buyer-renter" className={`p-2 rounded-lg text-center font-medium ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  Dashboard
                </a>
                {user && (
                  <div className={`p-2 rounded-lg text-center font-medium col-span-2 ${theme === "dark"
                    ? "bg-amber-900/30 text-amber-300"
                    : "bg-amber-100 text-amber-700"}`}>
                    {user.role === 'buyer' ? 'Buyer' : 'Renter'}
                  </div>
                )}
                <a href="/post-property" className="Button2 p-2 rounded-lg text-center font-medium col-span-2">
                  Post Property
                </a>
                <a href="/find-agent" className="Button2 border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black p-2 rounded-lg text-center font-medium col-span-2">
                  Find an Agent
                </a>
                {user ? (
                  <a href="/buyer-renter" className="Button2 p-2 rounded-lg text-center font-medium col-span-2">
                    Go to Dashboard
                  </a>
                ) : (
                  <a href="/login-register" className="Button2 p-2 rounded-lg text-center font-medium col-span-2">
                    Sign In
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  };

  // Mobile View Toggle
  const MobileViewToggle = () => (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className={`flex rounded-xl overflow-hidden shadow-lg ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
        <button
          onClick={() => setMobileView("list")}
          className={`flex-1 py-3 flex items-center justify-center space-x-2 font-semibold ${mobileView === "list" ? "bg-amber-400 text-black" : theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
        >
          <List size={18} />
          <span>List</span>
        </button>
        <button
          onClick={() => setMobileView("map")}
          className={`flex-1 py-3 flex items-center justify-center space-x-2 font-semibold ${mobileView === "map" ? "bg-amber-400 text-black" : theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
        >
          <Map size={18} />
          <span>Map</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"} flex flex-col`}>
      <ThemeToggle theme={theme} />
      <TopNavigation />
      <MobileViewToggle />

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Map Sidebar - Reduced width */}
        <div className={`hidden lg:block w-full lg:w-2/5 xl:w-2/5 h-[calc(100vh-140px)] sticky top-0 ${mobileView === "map" ? "block" : "hidden"}`}>
          <div className="h-full bg-gray-200 dark:bg-gray-800">
            <EthiopiaPropertyMap
              properties={exploreProperties}
              onPropertyClick={(property) => {
                setSelectedProperty(property);
                setIsPopupOpen(true);
              }}
            />
          </div>
        </div>

        {/* Properties List - Increased width */}
        <div className={`flex-1 flex flex-col ${mobileView === "map" ? "hidden lg:flex" : "flex"}`}>
          <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                <div>
                  <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Properties in Ethiopia
                  </h1>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      <Home className="inline w-4 h-4 mr-1" />
                      {exploreProperties.length} Properties Available
                    </span>
                    {!user && (
                      <span className={`text-sm ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
                        <Lock className="inline w-4 h-4 mr-1" />
                        Sign in for personalized recommendations
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Search and Filters Bar */}
              <div className={`mb-8 rounded-xl p-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-lg`}>
                <div className="flex flex-col lg:flex-row gap-3 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search properties by city, address, or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"} focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold text-sm ${showFilters ? "bg-amber-500 text-white" : theme === "dark" ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                  >
                    <SlidersHorizontal size={18} />
                    <span>Filters</span>
                    {Object.values(filters).some(v => v !== "" && v !== 0) && (
                      <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">Active</span>
                    )}
                  </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <div className={`mt-4 p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">Property Type</label>
                        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"}`}>
                          <option value="">All Types</option>
                          <option value="house">House</option>
                          <option value="apartment">Apartment</option>
                          <option value="villa">Villa</option>
                          <option value="commercial">Commercial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">Bedrooms</label>
                        <select value={filters.beds} onChange={(e) => setFilters({ ...filters, beds: e.target.value })} className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"}`}>
                          <option value="">Any</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                          <option value="4">4+</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">Bathrooms</label>
                        <select value={filters.baths} onChange={(e) => setFilters({ ...filters, baths: e.target.value })} className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"}`}>
                          <option value="">Any</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">Status</label>
                        <select value={filters.propertyStatus} onChange={(e) => setFilters({ ...filters, propertyStatus: e.target.value })} className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"}`}>
                          <option value="">All</option>
                          <option value="sale">For Sale</option>
                          <option value="rent">For Rent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">City</label>
                        <select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"}`}>
                          <option value="">All Cities</option>
                          {cities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">Price Range (ETB)</label>
                        <div className="flex items-center space-x-2">
                          <input type="number" value={filters.priceRange[0]} onChange={(e) => setFilters({ ...filters, priceRange: [Number(e.target.value), filters.priceRange[1]] })} className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"}`} placeholder="Min" />
                          <span className="text-gray-500">-</span>
                          <input type="number" value={filters.priceRange[1]} onChange={(e) => setFilters({ ...filters, priceRange: [filters.priceRange[0], Number(e.target.value)] })} className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"}`} placeholder="Max" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        Showing {exploreProperties.length} properties
                        {user && recommendedProperties.length > 0 && ` (${recommendedProperties.length} recommended)`}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={clearFilters} className="px-3 py-1 text-sm border border-amber-500 text-amber-600 dark:text-amber-400 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30">
                          Clear
                        </button>
                        <button onClick={() => setShowFilters(false)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm rounded">
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SIMPLE HEADERS - H2 SIZE */}

              {/* RECOMMENDED FOR YOU SECTION (Only show for logged-in users with recommendations) */}
              {user && recommendedProperties.length > 0 && !hasRecommendedError && (
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      Recommended For You
                    </h2>
                    <span className={`px-3 py-1 text-sm rounded-full ${theme === "dark" ? "bg-amber-800/50 text-amber-300" : "bg-amber-200 text-amber-700"}`}>
                      {recommendedProperties.length} properties
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {recommendedProperties.map((property) => (
                      <div key={property.id} className="transform transition-transform duration-300 hover:scale-[1.02]">
                        <PropertyCardWithChat
                          property={property}
                          theme={theme}
                          onViewDetails={(prop) => {
                            setSelectedProperty(prop);
                            setIsPopupOpen(true);
                          }}
                          onSave={handleSaveProperty}
                          onApply={() => {
                            setSelectedProperty(property);
                            setIsPopupOpen(true);
                          }}
                          isSaved={savedProperties.includes(property.id)}
                          broker={property.broker || brokers[Math.floor(Math.random() * brokers.length)]}
                          user={user}
                          isVerified={isVerified}
                          isSaving={savingProperty === property.id}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ALL PROPERTIES SECTION (Simple H2 header) */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {user && recommendedProperties.length > 0 ? "Explore More Properties" : "All Properties"}
                  </h2>
                  <span className={`px-3 py-1 text-sm rounded-full ${theme === "dark" ? "bg-blue-800/50 text-blue-300" : "bg-blue-200 text-blue-700"}`}>
                    {exploreProperties.length} properties
                  </span>
                </div>

                {exploreProperties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {exploreProperties.map((property) => (
                      <div key={property.id} className="transform transition-transform duration-300 hover:scale-[1.02]">
                        <PropertyCardWithChat
                          property={property}
                          theme={theme}
                          onViewDetails={(prop) => {
                            setSelectedProperty(prop);
                            setIsPopupOpen(true);
                          }}
                          onSave={handleSaveProperty}
                          onApply={() => {
                            setSelectedProperty(property);
                            setIsPopupOpen(true);
                          }}
                          isSaved={savedProperties.includes(property.id)}
                          broker={property.broker || brokers[Math.floor(Math.random() * brokers.length)]}
                          user={user}
                          isVerified={isVerified}
                          isSaving={savingProperty === property.id}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 rounded-xl ${theme === "dark" ? "bg-gray-800/30" : "bg-blue-50/50"}`}>
                    <Compass className="mx-auto text-blue-400 mb-3" size={48} />
                    <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      No Properties Available
                    </h3>
                    <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      No properties are currently available. Try adjusting your filters or check back later.
                    </p>
                  </div>
                )}
              </div>



              {/* No Properties Found Fallback */}
              {exploreProperties.length === 0 && (
                <div className={`text-center py-12 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-lg border border-amber-200 dark:border-amber-800`}>
                  <AlertCircle className="mx-auto text-amber-500 mb-3" size={48} />
                  <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    No Properties Found
                  </h3>
                  <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Try adjusting your search or filters to find more properties.
                  </p>
                  <button onClick={clearFilters} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg">
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto hidden lg:block">
            <Footer />
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      {mobileView === "list" && (
        <div className="lg:hidden">
          <Footer />
        </div>
      )}

      {/* Property Details Modal */}
      <PropertyDetailsModel
        property={selectedProperty}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        brokers={brokers}
      />
    </div>
  );
};

export default Properties;