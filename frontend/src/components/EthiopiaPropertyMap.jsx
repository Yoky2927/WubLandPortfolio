import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../contexts/ThemeContext";
import {
  Home,
  DollarSign,
  MapPin,
  TrendingUp,
  Building2,
  Eye,
  Filter,
  Layers,
  Navigation,
  Maximize2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import PropertyDetailsModel from "./PropertyDetailsModal";
// REMOVE THIS: import { sampleProperties } from "../data/sampleProperties";

// Fix for default markers
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Map controller component for better UX
const MapController = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

const EthiopiaPropertyMap = ({
  properties = [],
  onPropertyClick,
  userRole = "user",
}) => {
  const { theme } = useTheme();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [mapView, setMapView] = useState("standard");
  const [priceFilter, setPriceFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState([3.0245, 40.489673]);
  const [mapZoom, setMapZoom] = useState(6);
  const [activePopup, setActivePopup] = useState(null);
  const mapRef = useRef();

  const ethiopiaCenter = [3.0245, 40.489673];

  // Use passed properties - NO MORE sampleProperties
  const displayProperties = properties;

  const tileLayers = {
    light: {
      standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      satellite:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      minimal: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    },
    dark: {
      standard: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      satellite:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      minimal: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    },
  };

  // Filter properties based on selected filters
  const filteredProperties = displayProperties.filter((property) => {
    const priceMatch =
      priceFilter === "all" ||
      (priceFilter === "low" && property.price < 5000000) ||
      (priceFilter === "medium" &&
        property.price >= 5000000 &&
        property.price <= 15000000) ||
      (priceFilter === "high" && property.price > 15000000);

    const typeMatch =
      propertyTypeFilter === "all" ||
      property.propertyType.toLowerCase().includes(propertyTypeFilter);

    return priceMatch && typeMatch;
  });

  // Create price-based marker icons with improved design
  const createPriceIcon = (property) => {
    const price = property.price;
    let size = 28; // Slightly increased for better visibility
    let color = "#10b981"; // Green for lower price
    let glowColor = "rgba(16, 185, 129, 0.3)";

    if (price > 20000000) {
      size = 40;
      color = "#dc2626"; // Red for high price
      glowColor = "rgba(220, 38, 38, 0.3)";
    } else if (price > 10000000) {
      size = 34;
      color = "#f59e0b"; // Amber for medium price
      glowColor = "rgba(245, 158, 11, 0.3)";
    }

    const formatPrice = (price) => {
      if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)}M`;
      if (price >= 1000) return `ETB ${(price / 1000).toFixed(0)}K`;
      return `ETB ${price}`;
    };

    // Calculate font size based on marker size
    let fontSize = "7px";
    if (size > 34) {
      fontSize = "9px";
    } else if (size > 28) {
      fontSize = "8px";
    }

    // Format price for display inside marker
    const displayPrice = formatPrice(property.price).replace("ETB ", "");

    return L.divIcon({
      html: `
      <div class="marker-container" style="position: relative;">
        <div class="marker-glow" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size * 1.8}px;
          height: ${size * 1.8}px;
          background: ${glowColor};
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
        <div style="
          background: ${color};
          width: ${size}px;
          height: ${size}px;
          border: 3px solid ${theme === "dark" ? "#1f2937" : "#ffffff"};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${theme === "dark" ? "#1f2937" : "#ffffff"};
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-weight: bold;
          font-size: ${fontSize};
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          z-index: 2;
          text-align: center;
          line-height: 1;
          padding: 2px;
          overflow: hidden;
        " class="marker-hover" title="${property.title} - ${formatPrice(property.price)}">
          ${displayPrice}
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        .marker-hover:hover {
          transform: scale(1.1);
        }
      </style>
    `,
      className: "custom-marker",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const handleMarkerClick = (property, marker) => {
    // Close any previously active popup
    if (activePopup) {
      activePopup.closePopup();
    }
    
    // Open the new popup and set it as active
    marker.openPopup();
    setActivePopup(marker);
    
    // Set the selected property for the detailed popup
    setSelectedProperty(property);
  };

  const handleViewDetails = (property, event) => {
    // Prevent event propagation to avoid triggering marker click
    event.stopPropagation();
    
    // Close the small popup
    if (activePopup) {
      activePopup.closePopup();
      setActivePopup(null);
    }
    
    // Open the detailed popup only once
    setSelectedProperty(property);
    setIsPopupOpen(true);
    
    if (onPropertyClick) {
      onPropertyClick(property);
    }
  };

  const resetToEthiopiaView = () => {
    setMapCenter(ethiopiaCenter);
    setMapZoom(6);
  };

  const PopupContent = ({ property }) => {
    const { theme } = useTheme();

    const formatCurrency = (amount) => {
      if (!amount) return "ETB 0";
      if (amount >= 1000000) return `ETB ${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `ETB ${(amount / 1000).toFixed(0)}K`;
      return `ETB ${amount.toLocaleString()}`;
    };

    return (
      <div
        className={`p-4 rounded-xl shadow-lg max-w-xs border ${
          theme === "dark"
            ? "bg-gray-800 border-gray-600 text-white"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-bold text-sm mb-1 line-clamp-1">
              {property.title}
            </h4>
            <p className="text-amber-400 font-bold text-lg">
              {formatCurrency(property.price)}
            </p>
          </div>
          <button
            onClick={(e) => handleViewDetails(property, e)}
            className="flex items-center space-x-1 bg-amber-400  px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-500 transition-all duration-200 shadow-md hover:shadow-lg ml-2"
          >
            <Eye size={12} />
            <span className="text-black">View</span>
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="text-xs opacity-90 line-clamp-1">
              {property.address}, {property.city}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs opacity-75">
            <span>{property.beds || 0} beds</span>
            <span>{property.baths || 0} baths</span>
            <span>{(property.sqft || 0)?.toLocaleString()} sqft</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span
              className={`px-2 py-1 rounded-lg text-xs font-bold text-white ${
                property.propertyStatus === "for sale"
                  ? "bg-gradient-to-r from-green-500 to-green-600"
                  : "bg-gradient-to-r from-orange-500 to-orange-600"
              }`}
            >
              {property.propertyStatus === "for sale" ? "FOR SALE" : "FOR RENT"}
            </span>
            <span className="text-gray-500 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {property.propertyType}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Effect to close popup when clicking on map
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      const closePopupOnMapClick = () => {
        if (activePopup) {
          activePopup.closePopup();
          setActivePopup(null);
        }
      };

      map.on('click', closePopupOnMapClick);

      return () => {
        map.off('click', closePopupOnMapClick);
      };
    }
  }, [activePopup]);

  // Add coordinates fallback for properties without coordinates
  const getPropertyCoordinates = (property) => {
    // Use latitude/longitude if available
    if (property.latitude && property.longitude) {
      return [parseFloat(property.latitude), parseFloat(property.longitude)];
    }
    
    // Fallback to coordinates property if available
    if (property.coordinates && Array.isArray(property.coordinates)) {
      return property.coordinates;
    }
    
    // Default to Ethiopia center
    return ethiopiaCenter;
  };

  return (
    <>
      <div className="h-full w-full relative ">
        {/* Map Container - Full Height and Width */}
        <div className="relative w-full h-[calc(100vh-10px)]">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{
              height: "200%",
              width: "100%",
            }}
            className="z-0"
            zoomControl={false} // Disable default zoom control
            ref={mapRef}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              url={
                theme === "dark"
                  ? tileLayers.dark[mapView]
                  : tileLayers.light[mapView]
              }
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Property Markers */}
            {filteredProperties.map((property) => (
              <Marker
                key={property.id}
                position={getPropertyCoordinates(property)}
                icon={createPriceIcon(property)}
                eventHandlers={{
                  click: (e) => {
                    handleMarkerClick(property, e.target);
                  },
                }}
              >
                <Popup 
                  className="custom-popup" 
                  closeButton={false}
                  autoClose={false}
                  closeOnEscapeKey={false}
                >
                  <PopupContent property={property} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Custom Zoom Controls at Bottom */}
          <div className="leaflet-bottom leaflet-left">
            <div className="leaflet-control-zoom leaflet-bar leaflet-control">
              <a
                className="leaflet-control-zoom-in"
                href="#"
                title="Zoom in"
                role="button"
                aria-label="Zoom in"
                style={{
                  display: "block",
                  backgroundColor: theme === "dark" ? "#374151" : "white",
                  color: theme === "dark" ? "white" : "#333",
                  borderBottom: `1px solid ${
                    theme === "dark" ? "#4B5563" : "#e5e7eb"
                  }`,
                }}
              >
                +
              </a>
              <a
                className="leaflet-control-zoom-out"
                href="#"
                title="Zoom out"
                role="button"
                aria-label="Zoom out"
                style={{
                  display: "block",
                  backgroundColor: theme === "dark" ? "#374151" : "white",
                  color: theme === "dark" ? "white" : "#333",
                }}
              >
                -
              </a>
            </div>
          </div>

          {/* Header Section - Solid background overlay */}
          <div
            className={`absolute top-0 left-0 right-0 z-10 p-3 border-b ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className=" flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex-shrink-0">
            
                <p
                  className={`text-xs absolute left-12 top-5 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Explore {filteredProperties.length} properties on the map
                </p>
              </div>

              {/* Map Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Price Legend */}
                <div
                  className={`flex items-center gap-3 text-xs px-3 py-1.5 rounded-lg ${
                    theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full shadow"></div>
                    <span
                      className={
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }
                    >
                      High
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-amber-400 rounded-full shadow"></div>
                    <span
                      className={
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }
                    >
                      Medium
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow"></div>
                    <span
                      className={
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }
                    >
                      Lower
                    </span>
                  </div>
                </div>

                {/* View Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      theme === "dark"
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-white hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    <Filter size={14} />
                    <span>Filter</span>
                  </button>

                  <select
                    value={mapView}
                    onChange={(e) => setMapView(e.target.value)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-700"
                    }`}
                  >
                    <option value="standard">Standard</option>
                    <option value="satellite">Satellite</option>
                    <option value="minimal">Minimal</option>
                  </select>

                  <button
                    onClick={resetToEthiopiaView}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      theme === "dark"
                        ? "bg-amber-400 text-black hover:bg-amber-500"
                        : "bg-amber-400  hover:bg-amber-500"
                    }`}
                  >
                    <Navigation size={14} />
                    <span className="text-black">Reset View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {isFilterOpen && (
              <div
                className={`mt-3 p-3 rounded-lg border ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Price Range
                    </label>
                    <select
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      <option value="all">All Prices</option>
                      <option value="low">Under ETB 5M</option>
                      <option value="medium">ETB 5M - 15M</option>
                      <option value="high">Over ETB 15M</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Property Type
                    </label>
                    <select
                      value={propertyTypeFilter}
                      onChange={(e) => setPropertyTypeFilter(e.target.value)}
                      className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      <option value="all">All Types</option>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="villa">Villa</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Overlay Info - Moved to Bottom Right */}
          <div
            className={`absolute bottom-4 right-4 px-3 py-2 rounded-lg text-sm font-medium ${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-700"
            }`}
          >
             {filteredProperties.length} properties
          </div>
        </div>
      </div>

      {/* Property Details Popup */}
      <PropertyDetailsModel
        property={selectedProperty}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onNavigateToProperties={() => (window.location.href = "/properties")}
      />
    </>
  );
};

export default EthiopiaPropertyMap;