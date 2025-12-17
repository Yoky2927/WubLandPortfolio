import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigation } from "../../contexts/NavigationContext";
import EthiopiaPropertyMap from "../../components/EthiopiaPropertyMap";
import PropertyDetailsPopup from "../../components/PropertyDetailsPopup";
import Loader from "../../components/Loader";
import ThemeToggle from "../../components/ThemeToggle.jsx";
import Footer from "../../components/Footer";
import {
  Search,
  Filter,
  MapPin,
  Grid,
  List,
  SlidersHorizontal,
  Bed,
  Bath,
  Square,
  Car,
  Home,
  Building,
  Star,
  ChevronDown,
  X,
  Heart,
  Share2,
  Eye,
  User,
  Phone,
  Menu,
  Map,
  Ruler,
} from "lucide-react";

// API Service imports
import { httpClient } from "../../services/http.service";
import { API_CONFIG } from "../../config/api.config";

const Properties = () => {
  const { theme, toggleTheme } = useTheme();
  const { isNavigating } = useNavigation();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileView, setMobileView] = useState("list");
  const [brokers, setBrokers] = useState([]);

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

  // Helper function to parse JSON strings
  const parseJSONField = (field) => {
    if (!field) return [];
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return [];
      }
    }
    return field || [];
  };

  // Fetch properties from API - NO SAMPLE DATA
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      console.log('🔄 Fetching properties from property-service API...');
      
      try {
        let url;
        let params = {
          page: 1,
          limit: 100,
          property_status: 'active'
        };

        // If there's a search term or filters, use search endpoint
        if (searchTerm || Object.values(filters).some(f => f)) {
          url = API_CONFIG.getUrl('PROPERTY_SEARCH');
          
          // Add search term
          if (searchTerm) {
            params.q = searchTerm;
          }
          
          // Add filters
          if (filters.propertyStatus) {
            params.listing_type = filters.propertyStatus === 'for rent' ? 'rent' : 'sale';
          }
          if (filters.type) {
            params.property_type = filters.type;
          }
          if (filters.beds) {
            params.beds = filters.beds;
          }
          if (filters.baths) {
            params.baths = filters.baths;
          }
          if (filters.city) {
            params.city = filters.city;
          }
          if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000000) {
            params.min_price = filters.priceRange[0];
            params.max_price = filters.priceRange[1];
          }
          if (filters.minSqft > 0) {
            params.min_sqft = filters.minSqft;
          }
          
          console.log('🔍 Using search endpoint with filters:', params);
        } else {
          // Use general properties endpoint
          url = API_CONFIG.getUrl('PROPERTIES');
          console.log('🏠 Using general properties endpoint');
        }

        console.log(`📡 API Call: ${url}`);
        const response = await httpClient.get(url, { params });

        if (response.data?.success) {
          let propertiesData = [];
          
          // Handle different response structures
          if (response.data.data?.properties && Array.isArray(response.data.data.properties)) {
            propertiesData = response.data.data.properties;
          } else if (Array.isArray(response.data.data)) {
            propertiesData = response.data.data;
          } else if (response.data.properties && Array.isArray(response.data.properties)) {
            propertiesData = response.data.properties;
          } else if (Array.isArray(response.data)) {
            propertiesData = response.data;
          }
          
          console.log(`✅ Fetched ${propertiesData.length} properties from API`);

          // Transform API data to match frontend structure
          // In the transform function in Properties.jsx
const transformedProperties = propertiesData.map(property => {
  const parseJSONField = (field) => {
    if (!field) return [];
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.error('Error parsing JSON:', field, e);
        return [];
      }
    }
    return field || [];
  };

  return {
    id: property.id,
    title: property.title,
    description: property.description,
    propertyType: property.property_type,
    propertyStatus: property.listing_type === 'rent' ? 'for rent' : 'for sale',
    price: parseFloat(property.price) || 0,
    pricePerSqft: parseFloat(property.price_per_sqft) || 0,
    address: property.address,
    city: property.city,
    state: property.state,
    region: property.region || property.neighborhood || '',
    beds: property.beds || 0,
    baths: property.baths || 0,
    sqft: parseFloat(property.sqft) || 0,
    lotSize: property.lot_size ? parseFloat(property.lot_size) : 0,
    yearBuilt: property.year_built,
    garage: property.garage_spaces || property.parking_spaces || 0,
    images: ['/images/default-property.jpg'],
    amenities: parseJSONField(property.amenities),
    features: parseJSONField(property.features),
    
    // Broker information
    broker: property.assigned_broker_id ? {
      id: property.assigned_broker_id,
      name: property.broker_username || 'Broker',
      email: property.broker_email || '',
      phone: '',
      profilePicture: ''
    } : null,
    
    // Location coordinates
    latitude: parseFloat(property.latitude) || 9.1450,
    longitude: parseFloat(property.longitude) || 40.4897,
    
    // Metadata
    created_at: property.created_at,
    updated_at: property.updated_at,
    is_featured: property.is_featured || false,
    is_premium: property.is_premium || false,
    
    // Frontend-specific fields
    mlsNumber: property.mls_number || 'N/A',
    source: property.mls_source || 'WubLand',
    listedDate: property.created_at ? Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    views: property.views_count || 0,
    saves: property.saves_count || 0,
    estPayment: property.est_payment || null,
    averageRating: parseFloat(property.average_rating) || 0,
    totalReviews: property.total_reviews || 0,
    
    // ✅ NOW USING REAL DATA FROM DATABASE
    priceHistory: parseJSONField(property.price_history) || [],
    taxHistory: parseJSONField(property.tax_history) || [],
    nearbySchools: parseJSONField(property.nearby_schools) || [],
    floorPlans: parseJSONField(property.floor_plans) || []
  };
});

          setProperties(transformedProperties);
          setFilteredProperties(transformedProperties);
          
          if (transformedProperties.length > 0) {
            console.log('📋 First property:', transformedProperties[0]);
            console.log('📍 Coordinates:', transformedProperties[0].latitude, transformedProperties[0].longitude);
          }
        } else {
          console.warn('⚠️ API response not successful');
          // NO SAMPLE DATA - empty arrays
          setProperties([]);
          setFilteredProperties([]);
        }
      } catch (error) {
        console.error("❌ Error fetching properties:", error);
        // NO SAMPLE DATA - empty arrays
        setProperties([]);
        setFilteredProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchTerm, filters]);

  // Fetch brokers from API
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const url = API_CONFIG.getUrl('BROKER_PROFILES');
        const response = await httpClient.get(url);
        
        if (response.data?.success) {
          setBrokers(response.data.data || []);
        } else {
          setBrokers([]);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch brokers');
        setBrokers([]);
      }
    };

    fetchBrokers();
  }, []);

  // Filter properties when filters or search changes
  useEffect(() => {
    let filtered = properties.filter((property) => {
      const matchesSearch =
        searchTerm === "" ||
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType =
        !filters.type || property.propertyType === filters.type;
      
      const matchesStatus =
        !filters.propertyStatus ||
        property.propertyStatus === filters.propertyStatus;
      
      const matchesCity = !filters.city || property.city === filters.city;
      
      const matchesBeds =
        !filters.beds || property.beds >= parseInt(filters.beds);
      
      const matchesBaths =
        !filters.baths || property.baths >= parseInt(filters.baths);
      
      const matchesPrice =
        property.price >= filters.priceRange[0] &&
        property.price <= filters.priceRange[1];
      
      const matchesMinSqft =
        !filters.minSqft || property.sqft >= parseInt(filters.minSqft);
      
      const matchesMaxSqft =
        !filters.maxSqft || property.sqft <= parseInt(filters.maxSqft);
      
      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesCity &&
        matchesBeds &&
        matchesBaths &&
        matchesPrice &&
        matchesMinSqft &&
        matchesMaxSqft
      );
    });
    
    setFilteredProperties(filtered);
  }, [properties, filters, searchTerm]);

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    setIsPopupOpen(true);
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      priceRange: [0, 50000000],
      beds: "",
      baths: "",
      propertyStatus: "",
      city: "",
      minSqft: "",
      maxSqft: "",
    });
    setSearchTerm("");
  };

  const formatCurrency = (amount) => {
    if (!amount) return "ETB 0";
    if (amount >= 1000000) {
      return `ETB ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `ETB ${(amount / 1000).toFixed(0)}K`;
    }
    return `ETB ${amount.toLocaleString()}`;
  };

  // Get unique cities from properties for filter dropdown
  const cities = [...new Set(properties.map(p => p.city).filter(Boolean))];

  // Top Navigation Component
  const TopNavigation = () => {
    // Get current path to determine active link
    const currentPath = window.location.pathname;

    return (
      <nav
        className={`border-b ${
          theme === "dark"
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
        } shadow-sm`}
      >
        {/* Main Navigation */}
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Left Links */}
            <div className="hidden lg:flex items-center space-x-8 flex-1 justify-start">
              <a
                href="/"
                className={`font-medium nav-link ${
                  currentPath === "/"
                    ? "text-amber-400"
                    : theme === "dark"
                    ? "text-gray-300"
                    : "text-gray-600"
                } hover:text-amber-500 transition-colors`}
              >
                Home
              </a>
              <a
                href="/properties"
                className={`font-medium nav-link ${
                  currentPath === "/properties"
                    ? "text-amber-400"
                    : theme === "dark"
                    ? "text-gray-300"
                    : "text-gray-600"
                } hover:text-amber-500 transition-colors`}
              >
                Properties
              </a>
              <a
                href="/help"
                className={`font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                } nav-link hover:text-amber-500 transition-colors`}
              >
                Help
              </a>
              <a
                href="/about"
                className={`font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                } hover:text-amber-500 transition-colors nav-link`}
              >
                About Us
              </a>
              <a
                href="/login-register"
                className={`font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                } nav-link hover:text-amber-500 transition-colors`}
              >
                Sign In
              </a>
            </div>

            {/* Logo - Centered */}
            <div className="flex-1 flex justify-center">
              <a href="/" className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center font-bold text-black text-lg`}
                >
                  W
                </div>
                <span
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  WubLand
                </span>
              </a>
            </div>

            {/* Right Links */}
            <div className="hidden lg:flex items-center space-x-4 flex-1 justify-end">
              <a
                href="/buy"
                className={`font-medium nav-link ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                } hover:text-amber-500 transition-colors whitespace-nowrap`}
              >
                Buy
              </a>
              <a
                href="/sell"
                className={`font-medium nav-link ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                } hover:text-amber-500 transition-colors whitespace-nowrap`}
              >
                Sell
              </a>
              <a
                href="/broker-register"
                className={`font-medium nav-link ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                } hover:text-amber-500 transition-colors whitespace-nowrap`}
              >
                Register as Broker
              </a>
              <a
                href="/post-property"
                className={`bg-amber-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-amber-500 transition-colors text-sm whitespace-nowrap`}
              >
                Post your Property
              </a>
              <a
                href="/find-agent"
                className={`border border-amber-400 ${
                  theme === "dark" ? "text-amber-400" : "text-amber-600"
                } px-4 py-2 rounded-lg font-semibold hover:bg-amber-400 hover:text-black transition-colors text-sm whitespace-nowrap`}
              >
                Find an Agent
              </a>
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
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden border-t ${
              theme === "dark"
                ? "border-gray-700 bg-gray-900"
                : "border-gray-200 bg-white"
            } px-4 py-4`}
          >
            {/* Mobile Navigation Links */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <a
                href="/"
                className={`p-2 rounded-lg text-center font-medium ${
                  currentPath === "/"
                    ? `${
                        theme === "dark"
                          ? "bg-amber-400 text-black"
                          : "bg-amber-400 text-black"
                      }`
                    : `${
                        theme === "dark"
                          ? "bg-gray-800 text-amber-400"
                          : "bg-gray-100 text-amber-600"
                      }`
                }`}
              >
                Home
              </a>
              <a
                href="/properties"
                className={`p-2 rounded-lg text-center font-medium ${
                  currentPath === "/properties"
                    ? `${
                        theme === "dark"
                          ? "bg-amber-400 text-black"
                          : "bg-amber-400 text-black"
                      }`
                    : `${
                        theme === "dark"
                          ? "bg-gray-800 text-amber-400"
                          : "bg-gray-100 text-amber-600"
                      }`
                }`}
              >
                Properties
              </a>
              <a
                href="/help"
                className={`p-2 rounded-lg text-center font-medium ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Help
              </a>
              <a
                href="/about"
                className={`p-2 rounded-lg text-center font-medium ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                About Us
              </a>
              <a
                href="/signin"
                className={`p-2 rounded-lg text-center font-medium ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Sign In
              </a>
              <a
                href="/buy"
                className={`p-2 rounded-lg text-center font-medium ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Buy
              </a>
              <a
                href="/sell"
                className={`p-2 rounded-lg text-center font-medium ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Sell
              </a>
              <a
                href="/broker-register"
                className={`p-2 rounded-lg text-center font-medium ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Register Broker
              </a>
              <a
                href="/post-property"
                className={`p-2 rounded-lg text-center font-medium bg-amber-400 text-black`}
              >
                Post Property
              </a>
              <a
                href="/find-agent"
                className={`p-2 rounded-lg text-center font-medium border border-amber-400 ${
                  theme === "dark" ? "text-amber-400" : "text-amber-600"
                } col-span-2`}
              >
                Find an Agent
              </a>
            </div>
          </div>
        )}
      </nav>
    );
  };

  // Mobile View Toggle
  const MobileViewToggle = () => (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
      <div
        className={`flex rounded-xl overflow-hidden shadow-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <button
          onClick={() => setMobileView("list")}
          className={`flex-1 py-3 flex items-center justify-center space-x-2 font-semibold ${
            mobileView === "list"
              ? "bg-amber-400 text-black"
              : theme === "dark"
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          <List size={18} />
          <span>List</span>
        </button>
        <button
          onClick={() => setMobileView("map")}
          className={`flex-1 py-3 flex items-center justify-center space-x-2 font-semibold ${
            mobileView === "map"
              ? "bg-amber-400 text-black"
              : theme === "dark"
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          <Map size={18} />
          <span>Map</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader message="Loading properties from database..." />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gradient-to-r from-gray-900 via-black to-gray-900"
          : "bg-gray-100"
      } flex flex-col`}
    >
      {/* Theme Toggle */}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {/* Top Navigation */}
      <TopNavigation />

      {/* Mobile View Toggle */}
      <MobileViewToggle />

      {/* Main Content with Footer on Right Side */}
      <div className="flex flex-1">
        {/* Map Sidebar - Hidden on mobile by default */}
        <div
          className={`hidden lg:block w-full lg:w-1/2 xl:w-1/2 h-[calc(100vh-140px)] sticky top-0 ${
            mobileView === "map" ? "block" : "hidden"
          }`}
        >
          <div className="h-full bg-gray-200 dark:bg-gray-800">
            <EthiopiaPropertyMap
              properties={filteredProperties}
              onPropertyClick={handlePropertyClick}
            />
          </div>
        </div>

        {/* Properties List with Footer */}
        <div
          className={`flex-1 flex flex-col ${
            mobileView === "map" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Properties Content - Scrollable */}
          <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1
                    className={`text-3xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Properties in Ethiopia
                  </h1>
                  <p
                    className={`mt-2 text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Discover your next home from {properties.length} verified listings
                  </p>
                </div>
                <div className="hidden lg:flex items-center space-x-4">
                  <div className="flex border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${
                        viewMode === "grid"
                          ? "bg-amber-400 text-black"
                          : theme === "dark"
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${
                        viewMode === "list"
                          ? "bg-amber-400 text-black"
                          : theme === "dark"
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search and Filters Bar */}
              <div
                className={`mb-8 rounded-xl p-4 ${
                  theme === "dark" ? "bg-gray-800/50" : "bg-white"
                } shadow-lg backdrop-blur-sm`}
              >
                <div className="flex flex-col lg:flex-row gap-3 items-center">
                  <div className="flex-1 relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="City, neighborhood, or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold text-sm ${
                      theme === "dark"
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}
                  >
                    <SlidersHorizontal size={18} />
                    <span>Filters</span>
                    {Object.values(filters).some(
                      (v) => v !== "" && v !== 0
                    ) && (
                      <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </button>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div
                    className={`mt-4 p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
                    } backdrop-blur-sm`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Property Type */}
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                          Property Type
                        </label>
                        <select
                          value={filters.type}
                          onChange={(e) =>
                            setFilters({ ...filters, type: e.target.value })
                          }
                          className={`w-full p-2 rounded-lg border text-sm ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:ring-2 focus:ring-amber-500`}
                        >
                          <option value="">All Types</option>
                          <option value="villa">Villa</option>
                          <option value="apartment">Apartment</option>
                          <option value="house">House</option>
                          <option value="commercial">Commercial</option>
                        </select>
                      </div>
                      
                      {/* Beds */}
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                          Beds
                        </label>
                        <select
                          value={filters.beds}
                          onChange={(e) =>
                            setFilters({ ...filters, beds: e.target.value })
                          }
                          className={`w-full p-2 rounded-lg border text-sm ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:ring-2 focus:ring-amber-500`}
                        >
                          <option value="">Any</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                          <option value="4">4+</option>
                          <option value="5">5+</option>
                        </select>
                      </div>
                      
                      {/* Baths */}
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                          Baths
                        </label>
                        <select
                          value={filters.baths}
                          onChange={(e) =>
                            setFilters({ ...filters, baths: e.target.value })
                          }
                          className={`w-full p-2 rounded-lg border text-sm ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:ring-2 focus:ring-amber-500`}
                        >
                          <option value="">Any</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                          <option value="4">4+</option>
                        </select>
                      </div>
                      
                      {/* Status */}
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                          Status
                        </label>
                        <select
                          value={filters.propertyStatus}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              propertyStatus: e.target.value,
                            })
                          }
                          className={`w-full p-2 rounded-lg border text-sm ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:ring-2 focus:ring-amber-500`}
                        >
                          <option value="">All</option>
                          <option value="for sale">For Sale</option>
                          <option value="for rent">For Rent</option>
                        </select>
                      </div>
                      
                      {/* City */}
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                          City
                        </label>
                        <select
                          value={filters.city}
                          onChange={(e) =>
                            setFilters({ ...filters, city: e.target.value })
                          }
                          className={`w-full p-2 rounded-lg border text-sm ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:ring-2 focus:ring-amber-500`}
                        >
                          <option value="">All Cities</option>
                          {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Min Sqft */}
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                          Min Sqft
                        </label>
                        <input
                          type="number"
                          value={filters.minSqft}
                          onChange={(e) =>
                            setFilters({ ...filters, minSqft: e.target.value })
                          }
                          className={`w-full p-2 rounded-lg border text-sm ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:ring-2 focus:ring-amber-500`}
                          placeholder="Min"
                        />
                      </div>
                      
                      {/* Max Sqft */}
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                          Max Sqft
                        </label>
                        <input
                          type="number"
                          value={filters.maxSqft}
                          onChange={(e) =>
                            setFilters({ ...filters, maxSqft: e.target.value })
                          }
                          className={`w-full p-2 rounded-lg border text-sm ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:ring-2 focus:ring-amber-500`}
                          placeholder="Max"
                        />
                      </div>
                      
                      {/* Price Range */}
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                          Price Range
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={filters.priceRange[0]}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                priceRange: [
                                  Number(e.target.value),
                                  filters.priceRange[1],
                                ],
                              })
                            }
                            className={`w-full p-2 rounded-lg border text-sm ${
                              theme === "dark"
                                ? "bg-gray-600 border-gray-500 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 focus:ring-amber-500`}
                            placeholder="Min"
                          />
                          <span>-</span>
                          <input
                            type="number"
                            value={filters.priceRange[1]}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                priceRange: [
                                  filters.priceRange[0],
                                  Number(e.target.value),
                                ],
                              })
                            }
                            className={`w-full p-2 rounded-lg border text-sm ${
                              theme === "dark"
                                ? "bg-gray-600 border-gray-500 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:ring-2 focus:ring-amber-500`}
                            placeholder="Max"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {filteredProperties.length} properties found
                      </span>
                      <button
                        onClick={clearFilters}
                        className="text-amber-600 hover:text-amber-700 font-semibold text-xs"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results */}
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Showing {filteredProperties.length} of {properties.length} properties
                    </p>
                  </div>
                  
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredProperties.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          theme={theme}
                          onPropertyClick={handlePropertyClick}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredProperties.map((property) => (
                        <PropertyListCard
                          key={property.id}
                          property={property}
                          theme={theme}
                          onPropertyClick={handlePropertyClick}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                  )}
                  
                  {filteredProperties.length === 0 && (
                    <div
                      className={`text-center py-12 rounded-xl ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-white"
                      } shadow-lg backdrop-blur-sm`}
                    >
                      <Search
                        size={48}
                        className="mx-auto text-gray-400 mb-3"
                      />
                      <h3
                        className={`text-lg font-semibold mb-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        No Properties Found
                      </h3>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Try adjusting your search or filters to find more properties.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer - Only on the right side */}
          <div className="mt-auto hidden lg:block">
            <Footer />
          </div>
        </div>
      </div>

      {/* Mobile Footer - Only shown in list view */}
      {mobileView === "list" && (
        <div className="lg:hidden">
          <Footer />
        </div>
      )}

      <PropertyDetailsPopup
        property={selectedProperty}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        brokers={brokers}
      />
    </div>
  );
};

// Property Card (Grid View)
const PropertyCard = ({ property, theme, onPropertyClick, formatCurrency }) => (
  <div
    onClick={() => onPropertyClick(property)}
    className={`group relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer h-full flex flex-col ${
      theme === "dark"
        ? "bg-gradient-to-br from-gray-800/80 to-gray-900 border border-gray-700"
        : "bg-white border border-gray-200"
    }`}
  >
    {/* Image Container */}
    <div className="relative h-48 overflow-hidden">
      <img
        src={property.images[0]}
        alt={property.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${
            property.propertyStatus === "for sale"
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : "bg-gradient-to-r from-orange-500 to-orange-600"
          }`}
        >
          {property.propertyStatus === "for sale" ? "FOR SALE" : "FOR RENT"}
        </span>
      </div>
      
      {/* Favorite Button */}
      <button className="absolute top-3 left-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
        <Heart size={18} className="text-gray-600" />
      </button>
      
      {/* Property Type Badge */}
      <div className="absolute bottom-3 left-3">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          theme === "dark" ? "bg-black/70 text-white" : "bg-white/90 text-gray-800"
        }`}>
          <Home size={12} className="inline mr-1" />
          {property.propertyType}
        </span>
      </div>
    </div>

    {/* Content Container */}
    <div className="flex-1 p-4 flex flex-col">
      <div className="flex-1">
        <h3
          className={`text-lg font-bold mb-2 line-clamp-1 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {property.title}
        </h3>
        <p className="flex items-center text-sm mb-3 text-gray-500 dark:text-gray-400">
          <MapPin size={14} className={`mr-1 flex-shrink-0 ${
            theme === "dark" ? "text-white" : "text-gray-600"
          }`}/>
          <span className={`line-clamp-1 ${
            theme === "dark" ? "text-white" : "text-gray-600"
          }`}>{property.address}, {property.city}</span>
        </p>
      </div>

      {/* Price */}
      <div className="mb-4">
        <p className="text-amber-600 font-bold text-xl">
          {formatCurrency(property.price)}
        </p>
        {property.pricePerSqft && property.pricePerSqft > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatCurrency(property.pricePerSqft)}/sqft
          </p>
        )}
      </div>

      {/* Features */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex flex-col items-center">
          <Bed size={18} className="mb-1 text-amber-600" />
          <span className={`font-medium ${
            theme === "dark" ? "text-white" : "text-gray-600"
          }`}>{property.beds}</span>
          <span className={`text-xs ${
            theme === "dark" ? "text-white" : "text-gray-600"
          }`}>Beds</span>
        </div>
        <div className="flex flex-col items-center">
          <Bath size={18} className="mb-1 text-amber-600" />
          <span className={`font-medium ${
            theme === "dark" ? "text-white" : "text-gray-600"
          }`}>{property.baths}</span>
          <span className={`text-xs ${
            theme === "dark" ? "text-white" : "text-gray-600"
          }`}>Baths</span>
        </div>
        <div className="flex flex-col items-center">
          <Ruler size={18} className="mb-1 text-amber-600" />
          <span className={`font-medium ${
            theme === "dark" ? "text-white" : "text-gray-600"
          }`}>{(property.sqft / 1000).toFixed(1)}K</span>
          <span className={`text-xs ${
            theme === "dark" ? "text-white" : "text-gray-600"
          }`}>Sqft</span>
        </div>
        <div className="flex flex-col items-center">
          <Car size={18} className="mb-1 text-amber-600" />
          <span className={`font-medium ${
            theme === "dark" ? "text-white" : "text-gray-600"
          }`}>{property.garage || 0}</span>
          <span className={`text-xs ${
            theme === "dark" ? "text-white" : "text-gray-600"
          }`}>Garage</span>
        </div>
      </div>
    </div>
  </div>
);

// Property Card (List View)
const PropertyListCard = ({ property, theme, onPropertyClick, formatCurrency }) => (
  <div
    onClick={() => onPropertyClick(property)}
    className={`group rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer ${
      theme === "dark"
        ? "bg-gradient-to-br from-gray-800/80 to-gray-900 border border-gray-700"
        : "bg-white border border-gray-200"
    }`}
  >
    <div className="flex flex-col md:flex-row">
      {/* Image Container */}
      <div className="relative md:w-64 lg:w-72 flex-shrink-0">
        <div className="h-56 md:h-full">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent md:from-black/5" />
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${
              property.propertyStatus === "for sale"
                ? "bg-gradient-to-r from-green-500 to-green-600"
                : "bg-gradient-to-r from-orange-500 to-orange-600"
            }`}
          >
            {property.propertyStatus === "for sale" ? "FOR SALE" : "FOR RENT"}
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 p-5">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"
                  }`}>
                    <Home size={12} className="inline mr-1" />
                    {property.propertyType}
                  </span>
                  {property.is_featured && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <h3
                  className={`text-xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {property.title}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-amber-500 font-bold text-2xl">
                  {formatCurrency(property.price)}
                </p>
                {property.pricePerSqft && property.pricePerSqft > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(property.pricePerSqft)}/sqft
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <p
              className={`flex items-center text-sm mb-4 ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <MapPin size={16} className="mr-2 flex-shrink-0" />
              {property.address}, {property.city}
            </p>

            {/* Description */}
            <p
              className={`text-sm line-clamp-2 mb-4 ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {property.description || "No description available"}
            </p>
          </div>

          {/* Features & Actions */}
          <div className="space-y-4">
            {/* Features */}
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className={`flex items-center justify-center p-2 rounded-lg ${
                theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              }`}>
                <Bed size={16} className="mr-2" />
                <div>
                  <div className="font-bold">{property.beds}</div>
                  <div className="text-xs text-gray-500">Beds</div>
                </div>
              </div>
              <div className={`flex items-center justify-center p-2 rounded-lg ${
                theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              }`}>
                <Bath size={16} className="mr-2" />
                <div>
                  <div className="font-bold">{property.baths}</div>
                  <div className="text-xs text-gray-500">Baths</div>
                </div>
              </div>
              <div className={`flex items-center justify-center p-2 rounded-lg ${
                theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              }`}>
                <Square size={16} className="mr-2" />
                <div>
                  <div className="font-bold">{(property.sqft / 1000).toFixed(1)}K</div>
                  <div className="text-xs text-gray-500">Sqft</div>
                </div>
              </div>
              <div className={`flex items-center justify-center p-2 rounded-lg ${
                theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              }`}>
                <Car size={16} className="mr-2" />
                <div>
                  <div className="font-bold">{property.garage || 0}</div>
                  <div className="text-xs text-gray-500">Garage</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-3 rounded-lg transition-colors text-sm">
                View Details
              </button>
              <button className="flex-1 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white font-semibold px-4 py-3 rounded-lg transition-colors text-sm">
                Contact Agent
              </button>
              <button className={`p-3 rounded-lg ${
                theme === "dark" 
                  ? "bg-gray-700 hover:bg-gray-600 text-white" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}>
                <Heart size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Properties;