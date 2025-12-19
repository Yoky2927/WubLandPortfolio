import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../contexts/ThemeContext";
import {
  Home,
  DollarSign,
  MapPin,
  TrendingUp,
  Building2,
  School,
  Navigation,
  BarChart3,
} from "lucide-react";

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

const EthiopiaMapFree = ({ locationData }) => {
  const { theme } = useTheme();
  const ethiopiaCenter = [9.145, 40.4897];

  // Enhanced location data with real estate metrics
  const popularLocations =
    locationData && locationData.length > 0
      ? locationData.map((loc) => ({
          name: loc.region,
          position: getCoordinatesForRegion(loc.region),
          sales: loc.sales || Math.floor(loc.deals * 0.6),
          rentals: loc.rentals || Math.floor(loc.deals * 0.3),
          commercial: loc.commercial || Math.floor(loc.deals * 0.1),
          totalDeals: loc.deals,
          revenue: loc.revenue,
          type: getPrimaryDealType(loc),
          intensity: Math.min(loc.deals / 15, 1),
          properties: Math.floor(loc.deals * 1.5),
          trend: ["up", "stable", "down"][Math.floor(Math.random() * 3)],
          subCities: getSubCities(loc.region),
          landmarks: getLandmarks(loc.region),
        }))
      : [
          {
            name: "Addis Ababa",
            position: [9.0054, 38.7636],
            sales: 85,
            rentals: 25,
            commercial: 10,
            totalDeals: 120,
            revenue: 1500000,
            type: "sales",
            intensity: 1.0,
            properties: 180,
            trend: "up",
            subCities: [
              "Bole",
              "Kirkos",
              "Arada",
              "Lideta",
              "Yeka",
              "Gulele",
              "Kolfe",
            ],
            landmarks: [
              "Addis Ababa University",
              "Unity Park",
              "Mercedes-Benz Arena",
              "Sheraton Addis",
            ],
          },
          {
            name: "Dire Dawa",
            position: [9.6009, 41.8501],
            sales: 20,
            rentals: 20,
            commercial: 5,
            totalDeals: 45,
            revenue: 450000,
            type: "rental",
            intensity: 0.8,
            properties: 68,
            trend: "stable",
            subCities: ["Gurgura", "Dechatu"],
            landmarks: [
              "Dire Dawa Airport",
              "Kefira Market",
              "Ethio-Djibouti Railway",
            ],
          },
          {
            name: "Hawassa",
            position: [7.0473, 38.4625],
            sales: 15,
            rentals: 12,
            commercial: 5,
            totalDeals: 32,
            revenue: 320000,
            type: "commercial",
            intensity: 0.7,
            properties: 48,
            trend: "up",
            subCities: ["Hawassa Zuria", "Tabor"],
            landmarks: [
              "Hawassa University",
              "Lake Hawassa",
              "Hawassa Industrial Park",
            ],
          },
          {
            name: "Bahir Dar",
            position: [11.6, 37.3833],
            sales: 10,
            rentals: 15,
            commercial: 3,
            totalDeals: 28,
            revenue: 280000,
            type: "rental",
            intensity: 0.6,
            properties: 42,
            trend: "stable",
            subCities: ["Bahir Dar Zuria"],
            landmarks: ["Lake Tana", "Blue Nile Falls", "Bahir Dar University"],
          },
          {
            name: "Mekele",
            position: [13.4963, 39.4756],
            sales: 12,
            rentals: 8,
            commercial: 2,
            totalDeals: 22,
            revenue: 220000,
            type: "sales",
            intensity: 0.5,
            properties: 33,
            trend: "down",
            subCities: ["Quiha", "Wukro"],
            landmarks: [
              "Mekele University",
              "Alula Aba Nega Airport",
              "Mekele Industrial Park",
            ],
          },
          {
            name: "Adama",
            position: [8.5414, 39.2685],
            sales: 15,
            rentals: 10,
            commercial: 10,
            totalDeals: 35,
            revenue: 350000,
            type: "commercial",
            intensity: 0.7,
            properties: 53,
            trend: "up",
            subCities: ["Adama Zuria"],
            landmarks: [
              "Adama Science and Technology University",
              "Adama Industrial Park",
            ],
          },
        ];

  const getCoordinatesForRegion = (region) => {
    const coordinates = {
      "Addis Ababa": [9.0054, 38.7636],
      "Dire Dawa": [9.6009, 41.8501],
      Hawassa: [7.0473, 38.4625],
      "Bahir Dar": [11.6, 37.3833],
      Mekele: [13.4963, 39.4756],
      Adama: [8.5414, 39.2685],
      Gondar: [12.6, 37.4667],
      Jimma: [7.6667, 36.8333],
      Other: [8.5, 39.5],
    };
    return coordinates[region] || [9.145, 40.4897];
  };

  const getSubCities = (region) => {
    const subCities = {
      "Addis Ababa": [
        "Bole",
        "Kirkos",
        "Arada",
        "Lideta",
        "Yeka",
        "Gulele",
        "Kolfe",
      ],
      "Dire Dawa": ["Gurgura", "Dechatu"],
      Hawassa: ["Hawassa Zuria", "Tabor"],
      "Bahir Dar": ["Bahir Dar Zuria"],
      Mekele: ["Quiha", "Wukro"],
      Adama: ["Adama Zuria"],
      Gondar: ["Gondar Zuria"],
      Jimma: ["Jimma Zuria"],
    };
    return subCities[region] || [];
  };

  const getLandmarks = (region) => {
    const landmarks = {
      "Addis Ababa": [
        "Addis Ababa University",
        "Unity Park",
        "Mercedes-Benz Arena",
        "Sheraton Addis",
      ],
      "Dire Dawa": [
        "Dire Dawa Airport",
        "Kefira Market",
        "Ethio-Djibouti Railway",
      ],
      Hawassa: [
        "Hawassa University",
        "Lake Hawassa",
        "Hawassa Industrial Park",
      ],
      "Bahir Dar": ["Lake Tana", "Blue Nile Falls", "Bahir Dar University"],
      Mekele: [
        "Mekele University",
        "Alula Aba Nega Airport",
        "Mekele Industrial Park",
      ],
      Adama: [
        "Adama Science and Technology University",
        "Adama Industrial Park",
      ],
    };
    return landmarks[region] || [];
  };

  const getPrimaryDealType = (location) => {
    const { sales = 0, rentals = 0, commercial = 0 } = location;
    if (sales >= rentals && sales >= commercial) return "sales";
    if (rentals >= sales && rentals >= commercial) return "rental";
    return "commercial";
  };

  // Map layers with better visibility
  const tileLayers = {
    light: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  };

  // Get colors based on theme and deal type
  const getColors = (type) => {
    const baseColors = {
      sales: { light: "#dc2626", dark: "#ef4444" }, // Red for sales
      rental: { light: "#059669", dark: "#10b981" }, // Green for rentals
      commercial: { light: "#7c3aed", dark: "#8b5cf6" }, // Purple for commercial
    };

    return {
      marker: theme === "dark" ? baseColors[type].dark : baseColors[type].light,
      circle:
        theme === "dark"
          ? `${baseColors[type].dark}40`
          : `${baseColors[type].light}30`,
      popup:
        theme === "dark"
          ? `${baseColors[type].dark}20`
          : `${baseColors[type].light}15`,
    };
  };

  // Perfect custom marker icons with meaningful real estate icons
  const createCustomIcon = (type) => {
    const colors = getColors(type);

    // Get proper SVG paths for real estate related icons
    const getIconSVG = () => {
      switch (type) {
        case "sales": // House with dollar sign
          return '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><circle cx="12" cy="10" r="1"/><path d="M12 7v3"/>';
        case "rental": // Key icon for rentals
          return '<circle cx="8" cy="8" r="6"/><path d="M15 15l4.5 4.5"/><path d="M15 9a6 6 0 0 1-6 6"/><circle cx="15" cy="9" r="1"/>';
        case "commercial": // Building icon for commercial
          return '<rect x="2" y="7" width="20" height="15" rx="1"/><path d="M6 7V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/><path d="M10 12h4"/><path d="M10 16h4"/><path d="M6 12h1"/><path d="M6 16h1"/><path d="M17 12h1"/><path d="M17 16h1"/>';
        default: // Default home icon
          return '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
      }
    };

    return L.divIcon({
      html: `
        <div style="
          background: ${colors.marker};
          width: 42px;
          height: 42px;
          border: 3px solid ${theme === "dark" ? "#1f2937" : "#ffffff"};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${theme === "dark" ? "#1f2937" : "#ffffff"};
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
          font-weight: bold;
          cursor: pointer;
        " class="marker-hover">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${getIconSVG()}
          </svg>
        </div>
      `,
      className: "custom-marker",
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });
  };

  // Enhanced popup content with better padding and close button visibility
  const PopupContent = ({ location }) => {
    const colors = getColors(location.type);
    const { theme } = useTheme();

    const getTypeIcon = () => {
      switch (location.type) {
        case "sales":
          return <Home size={18} />;
        case "rental":
          return <DollarSign size={18} />;
        case "commercial":
          return <Building2 size={18} />;
        default:
          return <MapPin size={18} />;
      }
    };

    const getTrendIcon = () => {
      switch (location.trend) {
        case "up":
          return <TrendingUp size={16} className="text-green-500" />;
        case "down":
          return (
            <TrendingUp
              size={16}
              className="text-red-500 transform rotate-180"
            />
          );
        default:
          return <div className="w-4 h-0.5 bg-gray-400" />;
      }
    };

    return (
      // REMOVED the scrollable wrapper - Leaflet popup content will handle scrolling
      <div
        className={`w-full ${theme === "dark" ? "dark-popup" : "light-popup"}`}
      >
        <div
          className={`p-6 rounded-xl backdrop-blur-sm border-2 w-full ${
            theme === "dark"
              ? "bg-gray-900/98 border-gray-500 text-white"
              : "bg-white/98 border-gray-300 text-gray-900"
          }`}
          style={{
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            minWidth: "300px",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`p-2 rounded-lg flex-shrink-0 ${
                  theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                }`}
              >
                {getTypeIcon()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-lg truncate">{location.name}</h4>
                <div
                  className={`flex items-center gap-2 text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  <MapPin size={14} />
                  <span className="capitalize truncate">
                    {location.type} Properties
                  </span>
                </div>
              </div>
            </div>
            {getTrendIcon()}
          </div>

          {/* Real Estate Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-red-500/10">
              <div className="text-lg font-bold text-red-500">
                {location.sales}
              </div>
              <div className="text-xs text-gray-500 truncate">
                Properties Sold
              </div>
            </div>
            <div className="text-center p-2 rounded-lg bg-green-500/10">
              <div className="text-lg font-bold text-green-500">
                {location.rentals}
              </div>
              <div className="text-xs text-gray-500 truncate">Rentals</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-purple-500/10">
              <div className="text-lg font-bold text-purple-500">
                {location.commercial}
              </div>
              <div className="text-xs text-gray-500 truncate">Commercial</div>
            </div>
          </div>

          {/* Total Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div
                className={`text-xl font-bold ${
                  theme === "dark" ? "text-amber-400" : "text-amber-600"
                }`}
              >
                {location.totalDeals}
              </div>
              <div className="text-xs text-gray-500">Total Deals</div>
            </div>
            <div className="text-center">
              <div
                className={`text-xl font-bold ${
                  theme === "dark" ? "text-green-400" : "text-green-600"
                }`}
              >
                ETB {(location.revenue / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-gray-500">Revenue</div>
            </div>
          </div>

          {/* Sub-cities */}
          {location.subCities.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                <Navigation size={14} />
                Active Areas
              </div>
              <div className="flex flex-wrap gap-1">
                {location.subCities.slice(0, 4).map((subCity, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded text-xs ${
                      theme === "dark"
                        ? "bg-gray-800 text-gray-300"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {subCity}
                  </span>
                ))}
                {location.subCities.length > 4 && (
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      theme === "dark"
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    +{location.subCities.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Landmarks */}
          {location.landmarks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                <School size={14} />
                Key Landmarks
              </div>
              <div className="space-y-1">
                {location.landmarks.slice(0, 3).map((landmark, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full ${
                        theme === "dark" ? "bg-gray-600" : "bg-gray-400"
                      }`}
                    />
                    <span className="truncate">{landmark}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom popup style for better close button visibility
  const popupStyle = {
    padding: "0",
    margin: "10px",
  };

  return (
    <div
      className={`p-6 rounded-xl border ${
        theme === "dark"
          ? "bg-gray-800/80 border-gray-700"
          : "bg-white/95 border-gray-200"
      } backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3
          className={`text-xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          WubLands Common Real Estate and Residential Activity Map
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span
              className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
            >
              Properties Sold
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span
              className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
            >
              Rentals
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span
              className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
            >
              Commercial
            </span>
          </div>
        </div>
      </div>

      <MapContainer
        center={ethiopiaCenter}
        zoom={6}
        style={{
          height: "600px",
          width: "100%",
          borderRadius: "0.75rem",
          border: "2px solid",
          borderColor: theme === "dark" ? "#4b5563" : "#e5e7eb",
        }}
        className="z-0 relative"
      >
        {/* Tile Layer */}
        <TileLayer
          url={theme === "dark" ? tileLayers.dark : tileLayers.light}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Activity circles */}
        {popularLocations.map((location, index) => {
          const colors = getColors(location.type);
          const radius = location.intensity * 50000;

          return (
            <Circle
              key={`circle-${index}`}
              center={location.position}
              radius={radius}
              pathOptions={{
                fillColor: colors.marker,
                fillOpacity: 0.1,
                color: colors.marker,
                opacity: 0.3,
                weight: 2,
                dashArray: "8, 8",
              }}
            />
          );
        })}

        {/* Markers */}
        {popularLocations.map((location, index) => (
          <Marker
            key={index}
            position={location.position}
            icon={createCustomIcon(location.type)}
          >
            <Popup
              className="custom-popup rounded-xl border-0"
              style={{
                padding: "0",
                margin: "10px",
                maxWidth: "420px", // Control popup max width
              }}
              autoClose={false}
              closeOnEscapeKey={true}
              closeButton={true}
              maxWidth={420} // React-Leaflet specific prop
              minWidth={300} // React-Leaflet specific prop
            >
              <PopupContent location={location} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Controls Legend */}
      <div
        className={`mt-4 p-4 rounded-lg ${
          theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
        }`}
      >
        <div className="flex items-center gap-4 text-sm">
          <BarChart3
            size={16}
            className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
          />
          <span
            className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
          >
            <strong>Map Controls:</strong> Zoom with scroll wheel • Click
            markers for details • Drag to navigate
          </span>
        </div>
      </div>
    </div>
  );
};

export default EthiopiaMapFree;
