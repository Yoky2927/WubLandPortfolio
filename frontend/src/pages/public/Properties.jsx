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
  MapPin,
  Grid,
  List,
  SlidersHorizontal,
  Bed,
  Bath,
  Square,
  Car,
  Home,
  Heart,
  Menu,
  Map,
  Ruler,
} from "lucide-react";

// Import API endpoints
import { apiCall, directApiCall } from "../../utils/api.endpoints";

const Properties = () => {
  const { theme } = useTheme();
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
  const [error, setError] = useState(null);

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
 
  useEffect(() => {
  const testApiDirectly = async () => {
    console.log('🧪 Testing API directly...');
    try {
      const response = await fetch('http://localhost:5002/api/properties');
      console.log('📡 Raw response status:', response.status);
      console.log('📡 Raw response headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('📡 Raw response length:', text.length);
      console.log('📡 Raw response (first 1000 chars):', text.substring(0, 1000));
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(text);
        console.log('📡 Parsed JSON structure:');
        console.log('- Type:', typeof json);
        console.log('- Keys:', Object.keys(json));
        console.log('- First 500 chars of JSON:', JSON.stringify(json).substring(0, 500));
        
        if (json && typeof json === 'object') {
          // Check what's inside
          console.log('🔍 Exploring JSON structure:');
          exploreObject(json, 0);
        }
      } catch (parseError) {
        console.log('❌ Failed to parse as JSON:', parseError.message);
      }
    } catch (error) {
      console.log('❌ Direct API test failed:', error);
    }
  };

  // Helper function to explore object structure
  const exploreObject = (obj, depth) => {
    if (depth > 2) return; // Limit depth
    
    for (const key in obj) {
      const value = obj[key];
      console.log(`${'  '.repeat(depth)}${key}: ${typeof value} ${Array.isArray(value) ? `[${value.length}]` : ''}`);
      
      if (typeof value === 'object' && value !== null && depth < 2) {
        if (Array.isArray(value) && value.length > 0) {
          console.log(`${'  '.repeat(depth+1)}First item in array:`, JSON.stringify(value[0]).substring(0, 200));
        } else if (Object.keys(value).length > 0) {
          exploreObject(value, depth + 1);
        }
      }
    }
  };

  testApiDirectly();
}, []);

  // Debug fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      console.log('🔄 Starting to fetch properties...');

      try {
        // First, let's test the property service
        console.log('🔍 Testing property service connection...');
        try {
          const testResponse = await fetch('http://localhost:5002/health');
          console.log('✅ Property service health check:', testResponse.status);
        } catch (testError) {
          console.error('❌ Property service not reachable:', testError.message);
        }

        // Try multiple endpoints with better debugging
        const endpoints = [
          {
            name: 'GET_PROPERTIES',
            method: () => apiCall('GET_PROPERTIES')
          },
          {
            name: 'Direct API call',
            method: async () => {
              const response = await fetch('http://localhost:5002/api/properties', {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                },
              });
              return response.json();
            }
          },
          {
            name: 'Search endpoint',
            method: async () => {
              const response = await fetch('http://localhost:5002/api/properties/search', {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                },
              });
              return response.json();
            }
          },
        ];

        let propertiesData = [];
        let lastError = null;
        let successfulEndpoint = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`\n📡 Trying endpoint: ${endpoint.name}`);
            const response = await endpoint.method();
            console.log(`📦 Raw response from ${endpoint.name}:`, response);
            console.log(`📦 Response type:`, typeof response);
            console.log(`📦 Is array?`, Array.isArray(response));

            if (response && typeof response === 'object') {
              console.log(`📦 Response keys:`, Object.keys(response));
            }

            // Handle different response structures more carefully
            if (Array.isArray(response)) {
              propertiesData = response;
              successfulEndpoint = endpoint.name;
              console.log(`✅ Found ${propertiesData.length} properties as direct array`);
              break;
            }
            // Check for common response formats
            else if (response && response.data) {
              console.log(`📊 Found 'data' property:`, response.data);
              if (Array.isArray(response.data)) {
                propertiesData = response.data;
                successfulEndpoint = endpoint.name;
                console.log(`✅ Found ${propertiesData.length} properties in response.data`);
                break;
              } else if (response.data && response.data.properties && Array.isArray(response.data.properties)) {
                propertiesData = response.data.properties;
                successfulEndpoint = endpoint.name;
                console.log(`✅ Found ${propertiesData.length} properties in response.data.properties`);
                break;
              }
            }
            else if (response && response.properties && Array.isArray(response.properties)) {
              propertiesData = response.properties;
              successfulEndpoint = endpoint.name;
              console.log(`✅ Found ${propertiesData.length} properties in response.properties`);
              break;
            }
            else if (response && response.success && response.data) {
              console.log(`📊 Found success response with data:`, response.data);
              if (Array.isArray(response.data)) {
                propertiesData = response.data;
                successfulEndpoint = endpoint.name;
                console.log(`✅ Found ${propertiesData.length} properties in success.data`);
                break;
              } else if (response.data && Array.isArray(response.data.properties)) {
                propertiesData = response.data.properties;
                successfulEndpoint = endpoint.name;
                console.log(`✅ Found ${propertiesData.length} properties in success.data.properties`);
                break;
              }
            }
            // Last resort: try to find any array in the response
            else if (response && typeof response === 'object') {
              for (const key in response) {
                if (Array.isArray(response[key])) {
                  propertiesData = response[key];
                  successfulEndpoint = endpoint.name;
                  console.log(`✅ Found ${propertiesData.length} properties in key: ${key}`);
                  break;
                }
              }
              if (propertiesData.length > 0) break;
            }

            console.log(`⚠️ ${endpoint.name} returned data but no array found`);
          } catch (error) {
            console.log(`❌ ${endpoint.name} failed:`, error.message);
            lastError = error;
          }
        }

        console.log(`\n🎯 Successful endpoint: ${successfulEndpoint || 'None'}`);
        console.log(`📊 Total properties found: ${propertiesData.length}`);

        // Log the first property if available
        if (propertiesData.length > 0) {
          console.log(`\n📋 Sample property data:`, JSON.stringify(propertiesData[0], null, 2));
        }

        if (propertiesData.length === 0) {
          console.warn('⚠️ No properties found from any API endpoint');
          console.warn('Last error:', lastError?.message);
          setError('No properties available in the database. Check if property service has data.');

          // Also try to fetch the raw response for debugging
          try {
            const debugResponse = await fetch('http://localhost:5002/api/properties');
            const debugText = await debugResponse.text();
            console.log(`🔍 Raw API response (first 500 chars):`, debugText.substring(0, 500));
          } catch (debugError) {
            console.log('Debug fetch failed:', debugError.message);
          }
        }

        // Transform the data with better error handling
        const transformedProperties = propertiesData.map((property, index) => {
          try {
            // Get first image or fallback
            let images = [];
            if (property.images && Array.isArray(property.images) && property.images.length > 0) {
              images = property.images;
            } else if (property.photos && Array.isArray(property.photos) && property.photos.length > 0) {
              images = property.photos;
            } else if (property.image_url) {
              images = [property.image_url];
            } else {
              // Use Unsplash fallback based on index
              const fallbacks = [
                'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
              ];
              images = [fallbacks[index % fallbacks.length]];
            }

            // Ensure image URLs are valid
            const processedImages = images.map(img => {
              if (!img || img.trim() === '' || img === 'null' || img === 'undefined') {
                return 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
              }
              if (img.startsWith('http')) return img;
              if (img.startsWith('/')) return img;
              return `/${img}`;
            });

            return {
              id: property.id || property._id || `property-${index}`,
              title: property.title || property.property_title || property.name || `Property ${index + 1}`,
              description: property.description || property.property_description || 'Property description not available',
              property_type: property.property_type || property.type || 'house',
              propertyStatus: property.listing_type === 'rent' || property.property_status === 'rent' || property.status === 'rent' ? 'for rent' : 'for sale',
              price: parseFloat(property.price) || property.asking_price || property.list_price || 0,
              pricePerSqft: parseFloat(property.price_per_sqft) || 0,
              address: property.address || property.location || property.full_address || 'Address not specified',
              city: property.city || 'Addis Ababa',
              state: property.state || '',
              region: property.region || property.neighborhood || '',
              beds: property.beds || property.bedrooms || property.num_bedrooms || 0,
              baths: property.baths || property.bathrooms || property.num_bathrooms || 0,
              sqft: parseFloat(property.sqft) || parseFloat(property.area) || property.square_feet || 0,
              lotSize: property.lot_size ? parseFloat(property.lot_size) : 0,
              yearBuilt: property.year_built || property.year_constructed,
              garage: property.garage_spaces || property.parking_spaces || property.num_parking || 0,
              images: processedImages,
              is_featured: property.is_featured || false,
              is_premium: property.is_premium || false,
              created_at: property.created_at,
              updated_at: property.updated_at,
              // Additional fields that might be needed
              broker: property.broker || property.assigned_broker || null,
              mlsNumber: property.mls_number || property.mlsNumber || 'N/A',
              source: property.mls_source || property.source || 'WubLand',
              views: property.views_count || property.views || 0,
              saves: property.saves_count || property.saves || 0,
            };
          } catch (transformError) {
            console.error(`❌ Error transforming property ${index}:`, transformError);
            return null;
          }
        }).filter(Boolean); // Remove null entries

        console.log(`✅ Successfully transformed ${transformedProperties.length} properties`);

        if (transformedProperties.length > 0) {
          console.log(`📋 First transformed property:`, transformedProperties[0]);
        }

        setProperties(transformedProperties);
        setFilteredProperties(transformedProperties);

      } catch (error) {
        console.error('❌ Error in fetchProperties:', error);
        setError(`Error fetching properties: ${error.message}`);
        setProperties([]);
        setFilteredProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Fetch brokers
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        console.log('🔄 Fetching brokers...');
        const response = await directApiCall('http://localhost:5000/api/brokers');

        if (response && Array.isArray(response)) {
          setBrokers(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          setBrokers(response.data);
        } else if (response && response.brokers && Array.isArray(response.brokers)) {
          setBrokers(response.brokers);
        } else {
          setBrokers([]);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch brokers:', error.message);
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
        !filters.type || property.property_type === filters.type;

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
    if (!amount || isNaN(amount)) return "ETB 0";
    if (amount >= 1000000) {
      return `ETB ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `ETB ${(amount / 1000).toFixed(0)}K`;
    }
    return `ETB ${amount.toLocaleString()}`;
  };

  // Get unique cities from properties for filter dropdown
  const cities = [...new Set(properties.map(p => p.city).filter(Boolean))];

  // Top Navigation Component - Fixed layout
  const TopNavigation = () => {
    const currentPath = window.location.pathname;

    return (
      <nav className={`${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border-b shadow-sm sticky top-0 z-50`}>
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Left Links - Adjusted to be more centered */}
            <div className="hidden lg:flex items-center space-x-6">
              <a
                href="/"
                className={`font-medium ${currentPath === "/" ? "text-amber-400" : theme === "dark" ? "text-gray-300" : "text-gray-600"} hover:text-amber-500 transition-colors nav-link`}
              >
                Home
              </a>
              <a
                href="/properties"
                className={`font-medium ${currentPath === "/properties" ? "text-amber-400" : theme === "dark" ? "text-gray-300" : "text-gray-600"} hover:text-amber-500 transition-colors nav-link`}
              >
                Properties
              </a>
              <a
                href="/help"
                className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"} hover:text-amber-500 transition-colors nav-link`}
              >
                Help
              </a>
              <a
                href="/about"
                className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"} hover:text-amber-500 transition-colors nav-link`}
              >
                About Us
              </a>
              <a
                href="/login-register"
                className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"} hover:text-amber-500 transition-colors nav-link`}
              >
                Sign In
              </a>
            </div>

            {/* Logo - More centered */}
            <div className="flex-1 lg:flex-none flex justify-center lg:justify-center">
              <a href="/" className="flex items-center space-x-3">
                <span className={`text-3xl font-bold ${theme === "dark" ? "text-amber-500 hover:text-amber-800" : "text-amber-500"}`}>
                  WubLand
                </span>
              </a>
            </div>

            {/* Right Links - More compact */}
            <div className="hidden lg:flex items-center space-x-4">
              <a
                href="/buy"
                className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"} hover:text-amber-500 transition-colors nav-link whitespace-nowrap text-sm`}
              >
                Buy
              </a>
              <a
                href="/sell"
                className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"} hover:text-amber-500 transition-colors nav-link whitespace-nowrap text-sm`}
              >
                Sell
              </a>
              <a
                href="/broker-register"
                className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"} hover:text-amber-500 transition-colors nav-link whitespace-nowrap text-sm`}
              >
                Register as Broker
              </a>
              <a
                href="/post-property"
                className="Button2 px-4 py-2 font-semibold hover:scale-105 transition-all duration-300 text-sm"
              >
                Post your Property
              </a>
              <a
                href="/find-agent"
                className={`Button2 border border-amber-400 ${theme === "dark" ? "text-amber-300" : "text-amber-800"} hover:bg-amber-400 hover:text-black px-4 py-2 font-semibold hover:scale-105 transition-all duration-300 text-sm`}
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
                <a href="/about" className={`p-2 rounded-lg text-center font-medium ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  About Us
                </a>
                <a href="/login-register" className={`p-2 rounded-lg text-center font-medium ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  Sign In
                </a>
                <a href="/buy" className={`p-2 rounded-lg text-center font-medium ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  Buy
                </a>
                <a href="/sell" className={`p-2 rounded-lg text-center font-medium ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  Sell
                </a>
                <a href="/broker-register" className={`p-2 rounded-lg text-center font-medium ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  Register Broker
                </a>
                <a href="/post-property" className="Button2 p-2 rounded-lg text-center font-medium col-span-2">
                  Post Property
                </a>
                <a href="/find-agent" className="Button2 border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black p-2 rounded-lg text-center font-medium col-span-2">
                  Find an Agent
                </a>
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
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading properties from database...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Connecting to property service on http://localhost:5002
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"} flex flex-col`}>
      {/* Theme Toggle */}
      <ThemeToggle theme={theme} />

      {/* Top Navigation */}
      <TopNavigation />

      {/* Mobile View Toggle */}
      <MobileViewToggle />

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Map Sidebar */}
        <div className={`hidden lg:block w-full lg:w-1/2 xl:w-1/2 h-[calc(100vh-140px)] sticky top-0 ${mobileView === "map" ? "block" : "hidden"}`}>
          <div className="h-full bg-gray-200 dark:bg-gray-800">
            <EthiopiaPropertyMap
              properties={filteredProperties}
              onPropertyClick={handlePropertyClick}
            />
          </div>
        </div>

        {/* Properties List */}
        <div className={`flex-1 flex flex-col ${mobileView === "map" ? "hidden lg:flex" : "flex"}`}>
          <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Properties in Ethiopia
                  </h1>
                  <p className={`mt-2 text-base ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {error ? error : `Discover your next home from ${properties.length} verified listings`}
                  </p>
                </div>
                <div className="hidden lg:flex items-center space-x-4">
                  <div className="flex border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${viewMode === "grid" ? "bg-amber-400 text-black" : theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${viewMode === "list" ? "bg-amber-400 text-black" : theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
                    >
                      <List size={18} />
                    </button>
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
                      placeholder="Search by city, neighborhood, or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"} focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold text-sm ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                  >
                    <SlidersHorizontal size={18} />
                    <span>Filters</span>
                    {Object.values(filters).some((v) => v !== "" && v !== 0) && (
                      <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </button>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className={`mt-4 p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Property Type */}
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                          Property Type
                        </label>
                        <select
                          value={filters.type}
                          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-amber-500`}
                        >
                          <option value="">All Types</option>
                          <option value="house">House</option>
                          <option value="apartment">Apartment</option>
                          <option value="villa">Villa</option>
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
                          onChange={(e) => setFilters({ ...filters, beds: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-amber-500`}
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
                          onChange={(e) => setFilters({ ...filters, baths: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-amber-500`}
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
                          onChange={(e) => setFilters({ ...filters, propertyStatus: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-amber-500`}
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
                          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-amber-500`}
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
                          onChange={(e) => setFilters({ ...filters, minSqft: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-amber-500`}
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
                          onChange={(e) => setFilters({ ...filters, maxSqft: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-amber-500`}
                          placeholder="Max"
                        />
                      </div>

                      {/* Price Range */}
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                          Price Range (ETB)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={filters.priceRange[0]}
                            onChange={(e) => setFilters({ ...filters, priceRange: [Number(e.target.value), filters.priceRange[1]] })}
                            className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-amber-500`}
                            placeholder="Min"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="number"
                            value={filters.priceRange[1]}
                            onChange={(e) => setFilters({ ...filters, priceRange: [filters.priceRange[0], Number(e.target.value)] })}
                            className={`w-full p-2 rounded-lg border text-sm ${theme === "dark" ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-amber-500`}
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
                        className="Button2 px-4 py-2 text-sm"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="flex justify-between items-center mb-6">
                <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Showing {filteredProperties.length} of {properties.length} properties
                </p>
              </div>

              {filteredProperties.length > 0 ? (
                viewMode === "grid" ? (
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
                )
              ) : (
                <div className={`text-center py-12 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-lg`}>
                  <Search size={48} className="mx-auto text-gray-400 mb-3" />
                  <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    No Properties Found
                  </h3>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {error ? error : "Try adjusting your search or filters to find more properties."}
                  </p>
                  <button
                    onClick={clearFilters}
                    className="Button2 mt-4 px-4 py-2"
                  >
                    Clear Filters
                  </button>
                </div>
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

// Property Card (Grid View) - Fixed
const PropertyCard = ({ property, theme, onPropertyClick, formatCurrency }) => (
  <div
    className={`group relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer h-full flex flex-col ${theme === "dark"
        ? "bg-gray-800 border border-gray-700"
        : "bg-white border border-gray-200"
      }`}
  >
    {/* Image Container */}
    <div className="relative h-48 overflow-hidden">
      <img
        src={property.images[0]}
        alt={property.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        onError={(e) => {
          e.target.src = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${property.propertyStatus === "for sale"
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : "bg-gradient-to-r from-orange-500 to-orange-600"
            }`}
        >
          {property.propertyStatus === "for sale" ? "FOR SALE" : "FOR RENT"}
        </span>
      </div>

      {/* Property Type Badge */}
      <div className="absolute bottom-3 left-3">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme === "dark" ? "bg-black/70 text-white" : "bg-white/90 text-gray-800"
          }`}>
          <Home size={12} className="inline mr-1" />
          {property.property_type || "Property"}
        </span>
      </div>
    </div>

    {/* Content Container */}
    <div className="flex-1 p-4 flex flex-col">
      <div className="flex-1" onClick={() => onPropertyClick(property)}>
        <h3 className={`text-lg font-bold mb-2 line-clamp-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          {property.title}
        </h3>
        <div className="flex items-center text-sm mb-3 text-gray-500 dark:text-gray-400">
          <MapPin size={14} className="mr-1 flex-shrink-0" />
          <span className={`font-medium ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`}>{property.address}, {property.city}</span>
        </div>
        {property.description && (
          <p className={`text-sm line-clamp-2 mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            {property.description}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="mb-4">
        <p className={`font-bold text-xl ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`}>
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
          <Bed size={18} className={`mb-1 ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`} />
          <span className={`font-medium ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`}>{property.beds || 0}</span>
          <span className={`mb-1 ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`} >Beds</span>
        </div>
        <div className="flex flex-col items-center">
          <Bath size={18} className={`mb-1 ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`} />
          <span className={`mb-1 ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`}>{property.baths || 0}</span>
          <span className={`mb-1 ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`}>Baths</span>
        </div>
        <div className="flex flex-col items-center">
           <Ruler size={18} className={`mb-1 ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`} />
          <span className={`mb-1 ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`}>{(property.sqft / 1000).toFixed(1)}K</span>
          <span className={`mb-1 ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`}>Sqft</span>
        </div>
        <div className="flex flex-col items-center">
          <Car size={18} className={`mb-1 ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`} />
          <span className={`font-medium ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`}>{property.garage || 0}</span>
          <span className={`mb-1 ${theme === "dark"
        ? "text-amber-400"
        : "text-amber-900"
      }`}>Garage</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onPropertyClick(property)}
          className="Button2 w-full text-center py-2 hover:scale-105 transition-all duration-300"
        >
          View Details
        </button>
      </div>
    </div>
  </div>
);

// Property Card (List View) - Fixed
const PropertyListCard = ({ property, theme, onPropertyClick, formatCurrency }) => (
  <div
    className={`group rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl ${theme === "dark"
        ? "bg-gray-800 border border-gray-700"
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
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent md:from-black/5" />
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${property.propertyStatus === "for sale"
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
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"
                    }`}>
                    <Home size={12} className="inline mr-1" />
                    {property.property_type || "Property"}
                  </span>
                  {property.is_featured && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
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
            <div className="flex items-center text-sm mb-4 text-gray-500 dark:text-gray-400">
              <MapPin size={16} className="mr-2 flex-shrink-0" />
              <span>{property.address}, {property.city}</span>
            </div>

            {/* Description */}
            <p className={`text-sm line-clamp-2 mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              {property.description || "No description available"}
            </p>
          </div>

          {/* Features & Actions */}
          <div className="space-y-4">
            {/* Features */}
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className={`flex items-center justify-center p-2 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                <Bed size={16} className="mr-2 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="font-bold">{property.beds || 0}</div>
                  <div className="text-xs text-gray-500">Beds</div>
                </div>
              </div>
              <div className={`flex items-center justify-center p-2 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                <Bath size={16} className="mr-2 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="font-bold">{property.baths || 0}</div>
                  <div className="text-xs text-gray-500">Baths</div>
                </div>
              </div>
              <div className={`flex items-center justify-center p-2 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                <Square size={16} className="mr-2 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="font-bold">{(property.sqft / 1000).toFixed(1)}K</div>
                  <div className="text-xs text-gray-500">Sqft</div>
                </div>
              </div>
              <div className={`flex items-center justify-center p-2 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                <Car size={16} className="mr-2 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="font-bold">{property.garage || 0}</div>
                  <div className="text-xs text-gray-500">Garage</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => onPropertyClick(property)}
                className="Button2 flex-1 text-center py-3 hover:scale-105 transition-all duration-300"
              >
                View Details
              </button>
              <button
                onClick={() => onPropertyClick(property)}
                className="Button2 border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black flex-1 text-center py-3 hover:scale-105 transition-all duration-300"
              >
                Contact Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Properties;