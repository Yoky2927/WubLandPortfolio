// components/PropertyDetailsModal.jsx - FIXED FOR TEXT VISIBILITY
import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  MapPin,
  DollarSign,
  Home,
  Calendar,
  Layers,
  Maximize2,
  Star,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Trash2,
  Image as ImageIcon,
  Plus,
  Grid,
  CheckCircle,
  AlertCircle,
  Users,
  Bath,
  Bed,
  Ruler,
  Globe,
  Building,
  Tag,
  Award,
  Sparkles,
  Lock,
  Heart,
  Printer,
  Copy,
  ExternalLink,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  Check,
  Upload,
  CloudUpload,
  LayoutGrid,
  Search,
} from "lucide-react";
import { API_CONFIG } from "../config/api.config";

const PropertyDetailsModal = ({ property, isOpen, onClose, theme, onEdit }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedFloorPlans, setUploadedFloorPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const imageInputRef = useRef(null);
  const floorPlanInputRef = useRef(null);

  useEffect(() => {
    // Reset image index when property changes
    setCurrentImageIndex(0);
  }, [property]);

  if (!isOpen || !property) return null;

  // Helper function to get absolute URL for images
  const getAbsoluteImageUrl = (relativePath) => {
    if (!relativePath) return '';
    
    // If it's already a full URL, return as-is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    
    // Use the Property Service URL from config
    const baseUrl = API_CONFIG.PROPERTY_URL || 'http://localhost:5002';
    
    // Ensure the path starts with a slash
    const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    
    return `${baseUrl}${normalizedPath}`;
  };

  // Function to get images with proper URL formatting
  const getImages = () => {
    console.log("🖼️ Getting images for property:", {
      id: property.id,
      property_images: property.property_images,
      images: property.images,
      image_url: property.image_url
    });

    const images = [];
    
    // Case 1: Check property_images array (most likely from backend)
    if (property.property_images && Array.isArray(property.property_images)) {
      console.log(`📸 Found ${property.property_images.length} images in property_images`);
      
      // Sort images by order, with primary images first
      const sortedImages = [...property.property_images].sort((a, b) => {
        if (a.is_primary) return -1;
        if (b.is_primary) return 1;
        return (a.image_order || 0) - (b.image_order || 0);
      });
      
      sortedImages.forEach((img, index) => {
        if (img && img.image_url) {
          const absoluteUrl = getAbsoluteImageUrl(img.image_url);
          console.log(`   Image ${index}: ${img.image_url} -> ${absoluteUrl}`);
          images.push(absoluteUrl);
        }
      });
    }
    
    // Case 2: Check direct images array
    if (property.images && Array.isArray(property.images)) {
      console.log(`📸 Found ${property.images.length} images in images array`);
      
      property.images.forEach((img, index) => {
        if (img && typeof img === 'string') {
          const absoluteUrl = getAbsoluteImageUrl(img);
          images.push(absoluteUrl);
        }
      });
    }
    
    // Case 3: Check single image fields
    if (property.image_url && images.length === 0) {
      const absoluteUrl = getAbsoluteImageUrl(property.image_url);
      console.log(`📸 Found single image_url: ${property.image_url} -> ${absoluteUrl}`);
      images.push(absoluteUrl);
    }
    
    if (property.featured_image && images.length === 0) {
      const absoluteUrl = getAbsoluteImageUrl(property.featured_image);
      console.log(`📸 Found featured_image: ${property.featured_image} -> ${absoluteUrl}`);
      images.push(absoluteUrl);
    }
    
    // If no images found, use fallback
    if (images.length === 0) {
      console.log("⚠️ No images found, using fallback images");
      return [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80",
      ];
    }
    
    console.log(`✅ Returning ${images.length} images`);
    return images;
  };

  const images = getImages();

  // Get floor plans with proper URL formatting
  const getFloorPlans = () => {
    const floorPlans = [];
    
    // Check property_images for floor plans
    if (property.property_images && Array.isArray(property.property_images)) {
      property.property_images.forEach((img) => {
        // Check if it's a floor plan by caption, alt_text, or type
        const isFloorPlan = 
          (img.caption && img.caption.toLowerCase().includes('floor')) ||
          (img.alt_text && img.alt_text.toLowerCase().includes('floor')) ||
          img.image_type === 'floor_plan';
        
        if (isFloorPlan && img.image_url) {
          const absoluteUrl = getAbsoluteImageUrl(img.image_url);
          floorPlans.push({
            id: img.id || Math.random(),
            url: absoluteUrl,
            caption: img.caption || 'Floor Plan',
          });
        }
      });
    }
    
    // Also check separate floor_plans field if exists
    if (property.floor_plans) {
      const floorPlansData = Array.isArray(property.floor_plans) 
        ? property.floor_plans 
        : [property.floor_plans];
      
      floorPlansData.forEach((plan, index) => {
        if (plan && (plan.url || typeof plan === 'string')) {
          const url = typeof plan === 'string' ? plan : plan.url;
          const absoluteUrl = getAbsoluteImageUrl(url);
          floorPlans.push({
            id: index,
            url: absoluteUrl,
            caption: plan.caption || `Floor Plan ${index + 1}`,
          });
        }
      });
    }
    
    // Fallback if no floor plans found
    if (floorPlans.length === 0) {
      return [
        {
          id: 1,
          url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
          caption: "Ground Floor Layout",
        },
        {
          id: 2,
          url: "https://images.unsplash.com/photo-1487956382158-bb926046304a?auto=format&fit=crop&w=800&q=80",
          caption: "Upper Floor Plan",
        },
      ];
    }
    
    return floorPlans;
  };

  const floorPlans = getFloorPlans();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatCurrency = (amount, currency = "ETB") => {
    if (!amount) return `0 ${currency}`;
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Image error handler
  const handleImageError = (e) => {
    console.error("❌ Image failed to load:", e.target.src);
    e.target.onerror = null; // Prevent infinite loop
    
    // Try fallback image using API config if available
    const fallbackUrl = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80";
    e.target.src = fallbackUrl;
  };

  const propertyTypeColors = {
    house:
      "bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    apartment:
      "bg-blue-500/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    commercial:
      "bg-purple-500/20 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    land: "bg-amber-500/20 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    villa:
      "bg-pink-500/20 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  };

  const statusColors = {
    active:
      "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    pending:
      "bg-amber-500/20 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    draft:
      "bg-gray-500/20 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    sold: "bg-rose-500/20 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    rented:
      "bg-indigo-500/20 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  };

  // Text color classes for better visibility
  const textColors = {
    primary: theme === "dark" ? "text-gray-100" : "text-gray-900",
    secondary: theme === "dark" ? "text-gray-300" : "text-gray-700",
    tertiary: theme === "dark" ? "text-gray-400" : "text-gray-600",
    muted: theme === "dark" ? "text-gray-500" : "text-gray-500",
    label: theme === "dark" ? "text-gray-300" : "text-gray-700",
    value: theme === "dark" ? "text-gray-100" : "text-gray-900",
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div
        className={`relative w-full max-w-7xl my-8 rounded-2xl overflow-hidden shadow-2xl ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${
            theme === "dark" ? "border-gray-800" : "border-gray-200"
          } flex justify-between items-center sticky top-0 ${
            theme === "dark" ? "bg-gray-900" : "bg-white"
          } z-10`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                theme === "dark" ? "bg-amber-900/30" : "bg-amber-100"
              } border ${
                theme === "dark" ? "border-amber-800/50" : "border-amber-200"
              }`}
            >
              <Home
                className={`w-6 h-6 ${
                  theme === "dark" ? "text-amber-400" : "text-amber-600"
                }`}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {property.title || "Property Details"}
              </h2>
              <div className="flex items-center gap-3 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    propertyTypeColors[property.property_type] ||
                    propertyTypeColors.house
                  }`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {property.property_type?.charAt(0).toUpperCase() +
                    property.property_type?.slice(1) || "Property"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[property.property_status] || statusColors.draft
                  }`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {property.property_status?.toUpperCase() || "DRAFT"}
                </span>
                <span className={`text-sm ${textColors.muted}`} style={{ fontSize: '0.875rem' }}>
                  ID: {property.id || property.property_uuid?.substring(0, 8)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  window.location.origin + `/property/${property.id}`
                );
                alert("Link copied to clipboard!");
              }}
              className={`p-2 rounded-lg ${
                theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
              } transition-colors ${textColors.tertiary}`}
              title="Copy link"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                window.open(`/property/${property.id}/print`, "_blank")
              }
              className={`p-2 rounded-lg ${
                theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
              } transition-colors ${textColors.tertiary}`}
              title="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${
                theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
              } transition-colors ${textColors.tertiary}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Hero Section */}
          <div className="relative">
            {/* Main Image */}
            <div className="relative h-96 bg-gradient-to-br from-gray-900 to-gray-800">
              {images.length > 0 ? (
                <img
                  src={images[currentImageIndex]}
                  alt={`${property.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Camera className="w-20 h-20 text-gray-400 mb-4" />
                  <p className="text-gray-400" style={{ fontFamily: "'Inter', sans-serif", fontSize: '1rem' }}>No images available</p>
                </div>
              )}

              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-6 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-6 left-6">
                <span className="px-4 py-2 bg-black/70 text-white rounded-full text-sm font-medium backdrop-blur-sm" style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                  {currentImageIndex + 1} / {images.length}
                </span>
              </div>

              {/* Price Badge */}
              <div className="absolute bottom-6 right-6">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl shadow-2xl">
                  <div className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {formatCurrency(property.price, property.currency)}
                  </div>
                  <div className="text-sm opacity-90" style={{ fontFamily: "'Inter', sans-serif', fontSize: '0.875rem'" }}>
                    {property.listing_type === "sale" ? "For Sale" : "For Rent"}
                    {property.monthly_rent &&
                      ` • ${formatCurrency(property.monthly_rent)}/month`}
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="p-4 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                        currentImageIndex === index
                          ? "border-amber-500 ring-2 ring-amber-500/50 scale-105"
                          : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        crossOrigin="anonymous"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Location */}
                <div
                  className={`p-6 rounded-2xl border ${
                    theme === "dark"
                      ? "border-gray-800 bg-gray-800/30"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-green-900/30" : "bg-green-100"
                      }`}
                    >
                      <MapPin
                        className={`w-5 h-5 ${
                          theme === "dark" ? "text-green-400" : "text-green-600"
                        }`}
                      />
                    </div>
                    <h3 className={`text-xl font-bold ${textColors.primary}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      Location
                    </h3>
                  </div>
                  <div className="space-y-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div className="flex items-start gap-3">
                      <MapPin className={`w-5 h-5 mt-0.5 flex-shrink-0 ${textColors.tertiary}`} />
                      <div>
                        <p className={`font-medium text-base ${textColors.primary}`} style={{ fontSize: '1rem' }}>
                          {property.address || "No address provided"}
                        </p>
                        <p className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                          {[property.city, property.region, property.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                    {property.neighborhood && (
                      <div className={`flex items-center gap-2 text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                        <Tag className="w-4 h-4" />
                        <span>Neighborhood: {property.neighborhood}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features Grid */}
                <div
                  className={`p-6 rounded-2xl border ${
                    theme === "dark"
                      ? "border-gray-800 bg-gray-800/30"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"
                      }`}
                    >
                      <Sparkles
                        className={`w-5 h-5 ${
                          theme === "dark" ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                    </div>
                    <h3 className={`text-xl font-bold ${textColors.primary}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      Property Features
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div
                      className={`text-center p-4 rounded-xl ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-white"
                      }`}
                    >
                      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bed className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className={`text-2xl font-bold ${textColors.primary}`} style={{ fontSize: '1.5rem' }}>
                        {property.beds || 0}
                      </div>
                      <div className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                        Bedrooms
                      </div>
                    </div>

                    <div
                      className={`text-center p-4 rounded-xl ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-white"
                      }`}
                    >
                      <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bath className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className={`text-2xl font-bold ${textColors.primary}`} style={{ fontSize: '1.5rem' }}>
                        {property.baths || 0}
                      </div>
                      <div className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                        Bathrooms
                      </div>
                    </div>

                    <div
                      className={`text-center p-4 rounded-xl ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-white"
                      }`}
                    >
                      <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Ruler className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className={`text-2xl font-bold ${textColors.primary}`} style={{ fontSize: '1.5rem' }}>
                        {property.sqft || 0}
                      </div>
                      <div className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                        Square Feet
                      </div>
                      {property.square_meters && (
                        <div className={`text-xs ${textColors.muted} mt-1`} style={{ fontSize: '0.75rem' }}>
                          ≈ {property.square_meters} m²
                        </div>
                      )}
                    </div>

                    <div
                      className={`text-center p-4 rounded-xl ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-white"
                      }`}
                    >
                      <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Building className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className={`text-2xl font-bold ${textColors.primary}`} style={{ fontSize: '1.5rem' }}>
                        {property.year_built || "N/A"}
                      </div>
                      <div className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                        Year Built
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {property.description && (
                  <div
                    className={`p-6 rounded-2xl border ${
                      theme === "dark"
                        ? "border-gray-800 bg-gray-800/30"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`p-2 rounded-lg ${
                          theme === "dark"
                            ? "bg-indigo-900/30"
                            : "bg-indigo-100"
                        }`}
                      >
                        <FileText
                          className={`w-5 h-5 ${
                            theme === "dark"
                              ? "text-indigo-400"
                              : "text-indigo-600"
                          }`}
                        />
                      </div>
                      <h3 className={`text-xl font-bold ${textColors.primary}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        Description
                      </h3>
                    </div>
                    <p className={`whitespace-pre-line leading-relaxed text-base ${textColors.secondary}`} style={{ fontFamily: "'Inter', sans-serif", fontSize: '1rem' }}>
                      {property.description}
                    </p>
                  </div>
                )}

                {/* Floor Plans */}
                {Array.isArray(floorPlans) && floorPlans.length > 0 && (
                  <div
                    className={`p-6 rounded-2xl border ${
                      theme === "dark"
                        ? "border-gray-800 bg-gray-800/30"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            theme === "dark"
                              ? "bg-purple-900/30"
                              : "bg-purple-100"
                          }`}
                        >
                          <LayoutGrid
                            className={`w-5 h-5 ${
                              theme === "dark"
                                ? "text-purple-400"
                                : "text-purple-600"
                            }`}
                          />
                        </div>
                        <h3 className={`text-xl font-bold ${textColors.primary}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
                          Floor Plans
                        </h3>
                      </div>
                      <button
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                          theme === "dark"
                            ? "bg-purple-900/30 hover:bg-purple-900/50"
                            : "bg-purple-100 hover:bg-purple-200"
                        } ${theme === "dark" ? "text-purple-400" : "text-purple-700"}`}
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}
                      >
                        <Download className="w-4 h-4" />
                        Download All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {floorPlans.map((plan, index) => {
                        // Handle different data structures
                        const planData =
                          typeof plan === "object"
                            ? plan
                            : { url: plan, caption: `Floor Plan ${index + 1}` };

                        return (
                          <div
                            key={planData.id || index}
                            className={`rounded-xl overflow-hidden border ${
                              theme === "dark"
                                ? "border-gray-700"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="relative">
                              <img
                                src={
                                  planData.url ||
                                  planData.image_url ||
                                  planData.preview
                                }
                                alt={
                                  planData.caption || `Floor Plan ${index + 1}`
                                }
                                className="w-full h-48 object-cover"
                                onError={handleImageError}
                                crossOrigin="anonymous"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <p className="text-white font-medium" style={{ fontFamily: "'Inter', sans-serif', fontSize: '0.875rem'" }}>
                                  {planData.caption ||
                                    `Floor Plan ${index + 1}`}
                                </p>
                              </div>
                            </div>
                            <div className="p-4 flex justify-between items-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                              <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                                Floor Plan • {index + 1}
                              </span>
                              <button className={`px-3 py-1.5 text-sm rounded-lg ${
                                theme === "dark" 
                                  ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              }`} style={{ fontFamily: "'Inter', sans-serif', fontSize: '0.875rem'" }}>
                                View
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div
                  className={`p-6 rounded-2xl border ${
                    theme === "dark"
                      ? "border-gray-800 bg-gray-800/30"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <h4 className={`font-bold text-lg mb-4 ${textColors.primary}`} style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.125rem' }}>
                    Property Stats
                  </h4>
                  <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                        Property ID
                      </span>
                      <span className="font-mono font-medium" style={{ fontSize: '0.875rem' }}>
                        {property.id || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                        MLS Number
                      </span>
                      <span className="font-medium" style={{ fontSize: '0.875rem' }}>
                        {property.mls_number || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                        Created Date
                      </span>
                      <span className="font-medium" style={{ fontSize: '0.875rem' }}>
                        {new Date(property.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                        Last Updated
                      </span>
                      <span className="font-medium" style={{ fontSize: '0.875rem' }}>
                        {new Date(property.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                        Views
                      </span>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="font-medium" style={{ fontSize: '0.875rem' }}>
                          {property.views_count || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                        Favorites
                      </span>
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-400" />
                        <span className="font-medium" style={{ fontSize: '0.875rem' }}>
                          {property.favorites_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Details */}
                <div
                  className={`p-6 rounded-2xl border ${
                    theme === "dark"
                      ? "border-gray-800 bg-gray-800/30"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <h4 className={`font-bold text-lg mb-4 ${textColors.primary}`} style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.125rem' }}>
                    Pricing Details
                  </h4>
                  <div className="space-y-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {property.deposit_amount && (
                      <div className="flex justify-between">
                        <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                          Deposit
                        </span>
                        <span className="font-medium" style={{ fontSize: '0.875rem' }}>
                          {formatCurrency(
                            property.deposit_amount,
                            property.currency
                          )}
                        </span>
                      </div>
                    )}
                    {property.tax_amount && (
                      <div className="flex justify-between">
                        <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                          Annual Tax
                        </span>
                        <span className="font-medium" style={{ fontSize: '0.875rem' }}>
                          {formatCurrency(
                            property.tax_amount,
                            property.currency
                          )}
                        </span>
                      </div>
                    )}
                    {property.hoa_fees && (
                      <div className="flex justify-between">
                        <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                          HOA Fees
                        </span>
                        <span className="font-medium" style={{ fontSize: '0.875rem' }}>
                          {formatCurrency(property.hoa_fees, property.currency)}
                        </span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm" style={{ fontSize: '0.875rem' }}>Total</span>
                        <span className="text-xl font-bold text-amber-600 dark:text-amber-400" style={{ fontSize: '1.25rem' }}>
                          {formatCurrency(property.price, property.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features & Amenities */}
                {property.features && property.features.length > 0 && (
                  <div
                    className={`p-6 rounded-2xl border ${
                      theme === "dark"
                        ? "border-gray-800 bg-gray-800/30"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <h4 className={`font-bold text-lg mb-4 ${textColors.primary}`} style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.125rem' }}>
                      Features
                    </h4>
                    <div className="flex flex-wrap gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {property.features.slice(0, 8).map((feature, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1.5 rounded-full text-sm ${
                            theme === "dark"
                              ? "bg-gray-800 text-gray-300"
                              : "bg-gray-100 text-gray-700"
                          }`}
                          style={{ fontSize: '0.875rem' }}
                        >
                          {feature}
                        </span>
                      ))}
                      {property.features.length > 8 && (
                        <span
                          className={`px-3 py-1.5 rounded-full text-sm ${
                            theme === "dark"
                              ? "bg-gray-800 text-gray-400"
                              : "bg-gray-100 text-gray-600"
                          }`}
                          style={{ fontSize: '0.875rem' }}
                        >
                          +{property.features.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <button
                    onClick={() => {
                      setEditMode(true);
                      onEdit && onEdit();
                    }}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] shadow-lg font-medium"
                    style={{ fontSize: '0.875rem' }}
                  >
                    <Edit className="w-5 h-5" />
                    Edit Property
                  </button>

                  <button
                    onClick={() =>
                      window.open(`/property/${property.id}/print`, "_blank")
                    }
                    className={`w-full px-6 py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] font-medium ${
                      theme === "dark"
                        ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                    }`}
                    style={{ fontSize: '0.875rem' }}
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        window.location.origin + `/property/${property.id}`
                      );
                      alert("Link copied to clipboard!");
                    }}
                    className={`w-full px-6 py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] font-medium ${
                      theme === "dark"
                        ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                    }`}
                    style={{ fontSize: '0.875rem' }}
                  >
                    <Share2 className="w-5 h-5" />
                    Share Property
                  </button>

                  <button
                    onClick={() =>
                      window.open(`/property/${property.id}`, "_blank")
                    }
                    className={`w-full px-6 py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] font-medium ${
                      theme === "dark"
                        ? "bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-800/50"
                        : "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200"
                    }`}
                    style={{ fontSize: '0.875rem' }}
                  >
                    <ExternalLink className="w-5 h-5" />
                    View Public Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-6 border-t ${
            theme === "dark"
              ? "border-gray-800 bg-gray-900"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex justify-between items-center" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    property.property_status === "active"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                ></div>
                <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                  Status:{" "}
                  <span className="font-medium">
                    {property.property_status}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${textColors.secondary}`} style={{ fontSize: '0.875rem' }}>
                  Listed:{" "}
                  {new Date(
                    property.listing_date || property.created_at
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  alert("Coming soon: Contact owner functionality")
                }
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  theme === "dark"
                    ? "bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400"
                    : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                }`}
                style={{ fontFamily: "'Inter', sans-serif', fontSize: '0.875rem'" }}
              >
                <MessageCircle className="w-4 h-4" />
                Contact Owner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;