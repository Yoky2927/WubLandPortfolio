// components/EditPropertyForm.jsx - Matching CreatePropertyForm UI/UX

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Home,
  MapPin,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Upload,
  Calendar,
  Users,
  Building,
  Layers,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Star,
  Bed,
  Bath,
  Ruler,
  Target,
  Globe,
  Lock,
  Check,
  Percent,
  Crown,
  Zap,
  CloudUpload,
  ChevronDown,
  Tag,
  Award,
  Navigation,
  Hash,
  LayoutGrid,
  Maximize2,
  Box,
  FileImage,
  Trash2,
  Grid,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Key,
  Edit,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { API_CONFIG } from "../config/api.config";

const EditPropertyForm = ({ property, isOpen, onClose, onSubmit, theme }) => {
  const [formData, setFormData] = useState({
    // Basic Information
    title: "",
    description: "",
    property_type: "house",
    property_status: "draft",
    listing_type: "sale",

    // Location
    address: "",
    city: "",
    region: "",
    country: "Ethiopia",
    latitude: "",
    longitude: "",
    neighborhood: "",

    // Specifications
    beds: 1,
    baths: 1,
    sqft: "",
    square_meters: "",
    year_built: new Date().getFullYear(),
    lot_size: "",
    garage_spaces: 0,
    parking_spaces: 0,

    // Pricing
    price: "",
    currency: "ETB",
    monthly_rent: "",
    deposit_amount: "",
    tax_amount: "",
    hoa_fees: "",
    insurance_amount: "",
    is_negotiable: true,
    is_exclusive: false,
    is_featured: false,
    is_premium: false,

    // Additional fields
    mls_number: "",
    mls_source: "",
    listing_date: new Date().toISOString().split("T")[0],
    expiration_date: "",

    // Arrays (will be JSON stringified)
    features: [],
    amenities: [],
    property_tags: [],

    // Existing images (for reference)
    existing_images: [],
    existing_floor_plans: [],
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedFloorPlans, setUploadedFloorPlans] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingFloorPlans, setExistingFloorPlans] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [tagsInput, setTagsInput] = useState("");
  const [removedImages, setRemovedImages] = useState([]);
  const [removedFloorPlans, setRemovedFloorPlans] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [floorPlanFiles, setFloorPlanFiles] = useState([]);
  const imageInputRef = useRef(null);
  const floorPlanInputRef = useRef(null);

  // Initialize form with property data
  useEffect(() => {
    if (property) {
      console.log("📝 Initializing edit form with property:", property);
      
      // Parse features and amenities from JSON string if needed
      let featuresArray = [];
      let amenitiesArray = [];
      let tagsArray = [];
      
      if (property.features) {
        featuresArray = Array.isArray(property.features) 
          ? property.features 
          : JSON.parse(property.features || "[]");
      }
      
      if (property.amenities) {
        amenitiesArray = Array.isArray(property.amenities)
          ? property.amenities
          : JSON.parse(property.amenities || "[]");
      }
      
      if (property.property_tags) {
        tagsArray = Array.isArray(property.property_tags)
          ? property.property_tags
          : JSON.parse(property.property_tags || "[]");
      }
      
      // Set form data
      setFormData({
        title: property.title || "",
        description: property.description || "",
        property_type: property.property_type || "house",
        property_status: property.property_status || "draft",
        listing_type: property.listing_type || "sale",
        address: property.address || "",
        city: property.city || "",
        region: property.region || "",
        country: property.country || "Ethiopia",
        latitude: property.latitude || "",
        longitude: property.longitude || "",
        neighborhood: property.neighborhood || "",
        beds: property.beds || 1,
        baths: property.baths || 1,
        sqft: property.sqft || "",
        square_meters: property.square_meters || "",
        year_built: property.year_built || new Date().getFullYear(),
        lot_size: property.lot_size || "",
        garage_spaces: property.garage_spaces || 0,
        parking_spaces: property.parking_spaces || 0,
        price: property.price || "",
        currency: property.currency || "ETB",
        monthly_rent: property.monthly_rent || "",
        deposit_amount: property.deposit_amount || "",
        tax_amount: property.tax_amount || "",
        hoa_fees: property.hoa_fees || "",
        insurance_amount: property.insurance_amount || "",
        is_negotiable: property.is_negotiable !== undefined ? property.is_negotiable : true,
        is_exclusive: property.is_exclusive || false,
        is_featured: property.is_featured || false,
        is_premium: property.is_premium || false,
        mls_number: property.mls_number || "",
        mls_source: property.mls_source || "",
        listing_date: property.listing_date || new Date().toISOString().split("T")[0],
        expiration_date: property.expiration_date || "",
        features: featuresArray,
        amenities: amenitiesArray,
        property_tags: tagsArray,
        existing_images: property.property_images || [],
        existing_floor_plans: [],
      });
      
      // Set feature/amenity selections
      setSelectedFeatures(featuresArray);
      setSelectedAmenities(amenitiesArray);
      setTagsInput(tagsArray.join(", "));
      
      // Process existing images
      if (property.property_images && Array.isArray(property.property_images)) {
        const regularImages = property.property_images.filter(img => 
          !img.caption?.toLowerCase().includes('floor') && 
          !img.alt_text?.toLowerCase().includes('floor')
        );
        
        const floorPlanImages = property.property_images.filter(img => 
          img.caption?.toLowerCase().includes('floor') || 
          img.alt_text?.toLowerCase().includes('floor')
        );
        
        setExistingImages(regularImages.map((img, index) => ({
          id: img.id,
          image_url: img.image_url,
          thumbnail_url: img.thumbnail_url,
          caption: img.caption || "",
          alt_text: img.alt_text || "",
          is_primary: img.is_primary || false,
          image_order: img.image_order || index,
          preview: getAbsoluteImageUrl(img.image_url),
          name: img.alt_text || `Image ${index + 1}`,
          size: "Existing",
          type: "existing",
        })));
        
        setExistingFloorPlans(floorPlanImages.map((img, index) => ({
          id: img.id,
          image_url: img.image_url,
          caption: img.caption || "Floor Plan",
          preview: getAbsoluteImageUrl(img.image_url),
          name: img.alt_text || `Floor Plan ${index + 1}`,
          size: "Existing",
          type: "existing",
        })));
      }
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const getAbsoluteImageUrl = (relativePath) => {
    if (!relativePath) return "";
    
    if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
      return relativePath;
    }
    
    const baseUrl = API_CONFIG.PROPERTY_URL || "http://localhost:5002";
    
    // Handle empty paths or arrays
    if (typeof relativePath !== 'string' || relativePath.trim() === '') {
      return "";
    }
    
    const normalizedPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFeatureToggle = (feature) => {
    setSelectedFeatures((prev) => {
      const newFeatures = prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature];

      setFormData((prevData) => ({
        ...prevData,
        features: newFeatures,
      }));

      return newFeatures;
    });
  };

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities((prev) => {
      const newAmenities = prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity];

      setFormData((prevData) => ({
        ...prevData,
        amenities: newAmenities,
      }));

      return newAmenities;
    });
  };

  const handleTagsChange = (e) => {
    const value = e.target.value;
    setTagsInput(value);

    const tagsArray = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => ({
      ...prev,
      property_tags: tagsArray,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      id: `new-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + "MB",
      type: "new",
      isPrimary: uploadedImages.length === 0 && existingImages.length === 0,
      caption: "",
    }));

    setUploadedImages((prev) => [...prev, ...newImages]);
  };

  const handleFloorPlanUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFloorPlans = files.map((file) => ({
      id: `new-fp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview:
        file.type === "application/pdf"
          ? "https://cdn-icons-png.flaticon.com/512/337/337946.png"
          : URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + "MB",
      type: "new",
      caption: file.name.replace(/\.[^/.]+$/, ""),
    }));

    setUploadedFloorPlans((prev) => [...prev, ...newFloorPlans]);
  };

  const removeNewImage = (id) => {
    const imageToRemove = uploadedImages.find((img) => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removeExistingImage = (id) => {
    setRemovedImages((prev) => [...prev, id]);
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removeNewFloorPlan = (id) => {
    const floorPlanToRemove = uploadedFloorPlans.find((fp) => fp.id === id);
    if (floorPlanToRemove) {
      if (!floorPlanToRemove.preview.includes("flaticon.com")) {
        URL.revokeObjectURL(floorPlanToRemove.preview);
      }
    }
    setUploadedFloorPlans((prev) => prev.filter((fp) => fp.id !== id));
  };

  const removeExistingFloorPlan = (id) => {
    setRemovedFloorPlans((prev) => [...prev, id]);
    setExistingFloorPlans((prev) => prev.filter((fp) => fp.id !== id));
  };

  const setPrimaryImage = (id, type = "new") => {
    if (type === "new") {
      setUploadedImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.id === id,
        }))
      );
    } else {
      setExistingImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.id === id,
        }))
      );
    }
  };

  const updateFloorPlanCaption = (id, caption, type = "new") => {
    if (type === "new") {
      setUploadedFloorPlans((prev) =>
        prev.map((fp) => (fp.id === id ? { ...fp, caption } : fp))
      );
    } else {
      setExistingFloorPlans((prev) =>
        prev.map((fp) => (fp.id === id ? { ...fp, caption } : fp))
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const submitData = new FormData();
      
      // Add updated form fields
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        
        // Skip fields that shouldn't be sent directly
        if (key === "existing_images" || key === "existing_floor_plans" || 
            key === "square_meters" || key === "neighborhood") {
          return;
        }
        
        // Handle arrays
        if (key === "features" || key === "amenities" || key === "property_tags") {
          const arrayData = Array.isArray(value) ? value : [];
          submitData.append(key, JSON.stringify(arrayData));
        }
        // Handle booleans
        else if (
          key === "is_negotiable" ||
          key === "is_exclusive" ||
          key === "is_featured" ||
          key === "is_premium"
        ) {
          submitData.append(key, value ? "true" : "false");
        }
        // Handle numeric fields
        else if (
          key === "price" ||
          key === "beds" ||
          key === "baths" ||
          key === "year_built" ||
          key === "sqft" ||
          key === "lot_size" ||
          key === "garage_spaces" ||
          key === "parking_spaces" ||
          key === "monthly_rent" ||
          key === "deposit_amount" ||
          key === "tax_amount" ||
          key === "hoa_fees" ||
          key === "insurance_amount"
        ) {
          submitData.append(key, value !== undefined && value !== null ? String(value) : "");
        }
        // All other fields
        else {
          submitData.append(key, value !== undefined && value !== null ? String(value) : "");
        }
      });

      // Handle square_meters conversion
      if (formData.square_meters) {
        const sqftValue = parseFloat(formData.square_meters) * 10.764;
        submitData.append("sqft", sqftValue.toFixed(2));
      }

      // Handle neighborhood
      if (formData.neighborhood) {
        const currentAddress = formData.address || "";
        const newAddress =
          currentAddress + (currentAddress ? ", " : "") + formData.neighborhood;
        submitData.set("address", newAddress);

        const currentTags = Array.isArray(formData.property_tags)
          ? [...formData.property_tags, formData.neighborhood]
          : [formData.neighborhood];
        submitData.set("property_tags", JSON.stringify(currentTags));
      }

      // Add removed images/floor plans
      if (removedImages.length > 0) {
        submitData.append("removed_images", JSON.stringify(removedImages));
      }
      
      if (removedFloorPlans.length > 0) {
        submitData.append("removed_floor_plans", JSON.stringify(removedFloorPlans));
      }

      // Add new images
      uploadedImages.forEach((image, index) => {
        if (image.file && image.file instanceof File) {
          submitData.append("new_images", image.file);
          submitData.append(
            `new_image_${index}_is_primary`,
            image.isPrimary ? "1" : "0"
          );
          submitData.append(`new_image_${index}_caption`, image.caption || "");
        }
      });

      // Add new floor plans
      uploadedFloorPlans.forEach((floorPlan, index) => {
        if (floorPlan.file && floorPlan.file instanceof File) {
          submitData.append("new_floor_plans", floorPlan.file);
          submitData.append(
            `new_floor_plan_${index}_caption`,
            floorPlan.caption || "Floor Plan"
          );
        }
      });

      // Update primary images for existing images
      const primaryExistingImage = existingImages.find(img => img.isPrimary);
      if (primaryExistingImage) {
        submitData.append("primary_image_id", primaryExistingImage.id);
      }

      console.log("📤 Updating property:", property.id);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`http://localhost:5002/api/properties/${property.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorText = await response.text();
          errorMessage = `${errorMessage}: ${errorText}`;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Property updated successfully:", data);

      setUploadProgress(100);

      if (onSubmit) {
        await onSubmit(data);
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("❌ Error updating property:", error);
      alert(`Failed to update property: ${error.message}`);
    } finally {
      setIsUploading(false);
      setLoading(false);
    }
  };

  const propertyTypes = [
    { value: "house", label: "House", icon: Home },
    { value: "apartment", label: "Apartment", icon: Building },
    { value: "condo", label: "Condo", icon: Home },
    { value: "villa", label: "Villa", icon: Crown },
    { value: "townhouse", label: "Townhouse", icon: Home },
    { value: "commercial", label: "Commercial", icon: Building },
    { value: "land", label: "Land", icon: Globe },
    { value: "industrial", label: "Industrial", icon: Building },
  ];

  const listingTypes = [
    { value: "sale", label: "For Sale", icon: DollarSign },
    { value: "rent", label: "For Rent", icon: Calendar },
    { value: "lease", label: "For Lease", icon: FileText },
  ];

  const statuses = [
    { value: "draft", label: "Draft", color: "blue" },
    { value: "pending", label: "Pending Review", color: "amber" },
    { value: "active", label: "Active", color: "emerald" },
    { value: "sold", label: "Sold", color: "rose" },
    { value: "rented", label: "Rented", color: "indigo" },
  ];

  const featuresList = [
    "Swimming Pool",
    "Garden",
    "Garage",
    "Security System",
    "Parking",
    "Balcony",
    "Fireplace",
    "Air Conditioning",
    "Heating",
    "Pet Friendly",
    "Furnished",
    "Unfurnished",
    "Smart Home",
    "Solar Panels",
    "Backup Generator",
    "Water Tank",
    "Satellite TV",
    "Fiber Internet",
    "Elevator",
    "Disabled Access",
  ];

  const amenitiesList = [
    "24/7 Security",
    "Swimming Pool",
    "Gym",
    "Parking",
    "Garden",
    "Playground",
    "Clubhouse",
    "BBQ Area",
    "Concierge",
    "Laundry Room",
    "Storage",
    "Pet Area",
    "Bike Storage",
    "EV Charging",
    "Rooftop Terrace",
    "Business Center",
    "Movie Theater",
    "Spa",
    "Tennis Court",
    "Basketball Court",
  ];

  const regions = [
    "Addis Ababa",
    "Oromia",
    "Amhara",
    "Tigray",
    "SNNPR",
    "Afar",
    "Somali",
    "Benishangul-Gumuz",
    "Gambela",
    "Harari",
    "Dire Dawa",
  ];

  const allImages = [...existingImages, ...uploadedImages];
  const allFloorPlans = [...existingFloorPlans, ...uploadedFloorPlans];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`relative w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${
            theme === "dark" ? "border-gray-800" : "border-gray-200"
          } flex justify-between items-center`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                theme === "dark" ? "bg-amber-900/30" : "bg-amber-100"
              } border ${
                theme === "dark" ? "border-amber-800/50" : "border-amber-200"
              }`}
            >
              <Edit
                className={`w-6 h-6 ${
                  theme === "dark" ? "text-amber-400" : "text-amber-600"
                }`}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Edit Property
              </h2>
              <p
                className={`text-sm mt-1 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Step {step} of 4 •{" "}
                {step === 1
                  ? "Basic Information"
                  : step === 2
                  ? "Property Details"
                  : step === 3
                  ? "Pricing & Description"
                  : "Media Upload"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              theme === "dark" ? "text-white" : "text-gray-600"
            }`}
            disabled={loading || isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      num < step
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                        : num === step
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg ring-4 ring-amber-500/20"
                        : theme === "dark"
                        ? "bg-gray-800 text-gray-400 border border-gray-700"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {num < step ? <Check className="w-5 h-5" /> : num}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      num <= step
                        ? theme === "dark"
                          ? "text-gray-300"
                          : "text-gray-700"
                        : theme === "dark"
                        ? "text-gray-500"
                        : "text-gray-400"
                    }`}
                  >
                    {num === 1
                      ? "Basic Info"
                      : num === 2
                      ? "Details"
                      : num === 3
                      ? "Pricing"
                      : "Media"}
                  </span>
                </div>
                {num < 4 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      num < step
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                        : theme === "dark"
                        ? "bg-gray-800"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(90vh-200px)] p-6"
        >
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Basic Info */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"
                    }`}
                  >
                    <Home
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-blue-400" : "text-blue-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Basic Information
                    </h3>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Update the basic details of your property
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Property Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Modern 3BR Apartment in Bole"
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Property Type *
                    </label>
                    <div className="relative">
                      <select
                        name="property_type"
                        value={formData.property_type}
                        onChange={handleChange}
                        className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        {propertyTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Listing Type *
                    </label>
                    <div className="relative">
                      <select
                        name="listing_type"
                        value={formData.listing_type}
                        onChange={handleChange}
                        className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        {listingTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Status *
                    </label>
                    <div className="relative">
                      <select
                        name="property_status"
                        value={formData.property_status}
                        onChange={handleChange}
                        className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center gap-3 mb-6">
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
                  <div>
                    <h3
                      className={`text-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Location Details
                    </h3>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Update property location
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Full Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      placeholder="Street address, house number, building name"
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Addis Ababa"
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Region
                    </label>
                    <div className="relative">
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="">Select Region</option>
                        {regions.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Neighborhood/Sub-city
                    </label>
                    <input
                      type="text"
                      name="neighborhood"
                      value={formData.neighborhood}
                      onChange={handleChange}
                      placeholder="e.g., Bole, CMC, Kazanchis"
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-3 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Latitude (Optional)
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleChange}
                        placeholder="e.g., 9.0320"
                        className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-3 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Longitude (Optional)
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleChange}
                        placeholder="e.g., 38.7469"
                        className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-end pt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Next: Property Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Property Details */}
          {step === 2 && (
            <div className="space-y-8">
              {/* Property Specifications */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-purple-900/30" : "bg-purple-100"
                    }`}
                  >
                    <Building
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-purple-400" : "text-purple-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Property Specifications
                    </h3>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Update property structure and features
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Bedrooms
                    </label>
                    <div className="relative">
                      <Bed className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <input
                        type="number"
                        name="beds"
                        value={formData.beds}
                        onChange={handleChange}
                        min="0"
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Bathrooms
                    </label>
                    <div className="relative">
                      <Bath className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <input
                        type="number"
                        name="baths"
                        value={formData.baths}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Year Built
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <input
                        type="number"
                        name="year_built"
                        value={formData.year_built}
                        onChange={handleChange}
                        min="1800"
                        max={new Date().getFullYear()}
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Area (Square Meters)*
                    </label>
                    <div className="relative">
                      <Ruler className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <input
                        type="number"
                        name="square_meters"
                        value={formData.square_meters}
                        onChange={handleChange}
                        required
                        placeholder="e.g., 150"
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Lot Size (Sqm)
                    </label>
                    <input
                      type="number"
                      name="lot_size"
                      value={formData.lot_size}
                      onChange={handleChange}
                      placeholder="For land/houses"
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Parking Spaces
                    </label>
                    <input
                      type="number"
                      name="parking_spaces"
                      value={formData.parking_spaces}
                      onChange={handleChange}
                      min="0"
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Features & Amenities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Features */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-amber-900/30" : "bg-amber-100"
                      }`}
                    >
                      <Sparkles
                        className={`w-5 h-5 ${
                          theme === "dark" ? "text-amber-400" : "text-amber-600"
                        }`}
                      />
                    </div>
                    <h4
                      className={`font-semibold ${
                        theme === "dark" ? "text-amber-600" : "text-gray-800"
                      }`}
                    >
                      Property Features
                    </h4>
                  </div>
                  <div
                    className={`p-4 rounded-xl border max-h-64 overflow-y-auto ${
                      theme === "dark"
                        ? "border-gray-700 bg-gray-800/30"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-3">
                      {featuresList.map((feature, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedFeatures.includes(feature)}
                              onChange={() => handleFeatureToggle(feature)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-300 ${
                                selectedFeatures.includes(feature)
                                  ? "bg-amber-500 border-amber-500"
                                  : theme === "dark"
                                  ? "border-gray-600 bg-gray-700"
                                  : "border-gray-400 bg-white"
                              }`}
                            >
                              {selectedFeatures.includes(feature) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-700"
                            }`}
                          >
                            {feature}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"
                      }`}
                    >
                      <Award
                        className={`w-5 h-5 ${
                          theme === "dark" ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                    </div>
                    <h4
                      className={`font-semibold ${
                        theme === "dark" ? "text-blue-600" : "text-gray-800"
                      }`}
                    >
                      Building Amenities
                    </h4>
                  </div>
                  <div
                    className={`p-4 rounded-xl border max-h-64 overflow-y-auto ${
                      theme === "dark"
                        ? "border-gray-700 bg-gray-800/30"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-3">
                      {amenitiesList.map((amenity, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedAmenities.includes(amenity)}
                              onChange={() => handleAmenityToggle(amenity)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-300 ${
                                selectedAmenities.includes(amenity)
                                  ? "bg-blue-500 border-blue-500"
                                  : theme === "dark"
                                  ? "border-gray-600 bg-gray-700"
                                  : "border-gray-400 bg-white"
                              }`}
                            >
                              {selectedAmenities.includes(amenity) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-700"
                            }`}
                          >
                            {amenity}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-green-900/30" : "bg-green-100"
                    }`}
                  >
                    <Tag
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-green-400" : "text-green-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Property Tags
                    </h4>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Update keywords separated by commas
                    </p>
                  </div>
                </div>
                <textarea
                  value={tagsInput}
                  onChange={handleTagsChange}
                  placeholder="modern, luxury, pool, garden, furnished, pet-friendly"
                  rows="2"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                />
                {formData.property_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.property_tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1.5 rounded-full text-sm ${
                          theme === "dark"
                            ? "bg-green-900/30 text-green-400 border border-green-800/50"
                            : "bg-green-100 text-green-700 border border-green-200"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                    theme === "dark"
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Next: Pricing & Description
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing & Description */}
          {step === 3 && (
            <div className="space-y-8">
              {/* Pricing Information */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-amber-900/30" : "bg-amber-100"
                    }`}
                  >
                    <DollarSign
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-amber-400" : "text-amber-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Pricing Information
                    </h3>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Update pricing and conditions
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Price * ({formData.currency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 dark:text-gray-300 font-medium">
                        {formData.currency}
                      </span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        placeholder="Enter price amount"
                        className={`w-full pl-16 pr-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        }`}
                      />
                    </div>
                  </div>

                  {formData.listing_type === "rent" && (
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-3 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Monthly Rent ({formData.currency})
                      </label>
                      <input
                        type="number"
                        name="monthly_rent"
                        value={formData.monthly_rent}
                        onChange={handleChange}
                        placeholder="For rental properties"
                        className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  )}

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Deposit Amount ({formData.currency})
                    </label>
                    <input
                      type="number"
                      name="deposit_amount"
                      value={formData.deposit_amount}
                      onChange={handleChange}
                      placeholder="Security deposit"
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Tax Amount ({formData.currency})
                    </label>
                    <input
                      type="number"
                      name="tax_amount"
                      value={formData.tax_amount}
                      onChange={handleChange}
                      placeholder="Annual property tax"
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>

                {/* Pricing Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <label
                    className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      formData.is_negotiable
                        ? theme === "dark"
                          ? "bg-emerald-900/20 border border-emerald-800"
                          : "bg-emerald-50 border border-emerald-200"
                        : theme === "dark"
                        ? "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="is_negotiable"
                        checked={formData.is_negotiable}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                          formData.is_negotiable
                            ? "bg-emerald-500 border-emerald-500"
                            : theme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-400 bg-white"
                        }`}
                      >
                        {formData.is_negotiable && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`font-medium ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Price Negotiable
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Allow buyers to make offers
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      formData.is_exclusive
                        ? theme === "dark"
                          ? "bg-purple-900/20 border border-purple-800"
                          : "bg-purple-50 border border-purple-200"
                        : theme === "dark"
                        ? "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="is_exclusive"
                        checked={formData.is_exclusive}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                          formData.is_exclusive
                            ? "bg-purple-500 border-purple-500"
                            : theme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-400 bg-white"
                        }`}
                      >
                        {formData.is_exclusive && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`font-medium ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Exclusive Listing
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Limited time special offer
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      formData.is_featured
                        ? theme === "dark"
                          ? "bg-amber-900/20 border border-amber-800"
                          : "bg-amber-50 border border-amber-200"
                        : theme === "dark"
                        ? "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                          formData.is_featured
                            ? "bg-amber-500 border-amber-500"
                            : theme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-400 bg-white"
                        }`}
                      >
                        {formData.is_featured && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`font-medium ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Featured Listing
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Highlight on homepage
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      formData.is_premium
                        ? theme === "dark"
                          ? "bg-blue-900/20 border border-blue-800"
                          : "bg-blue-50 border border-blue-200"
                        : theme === "dark"
                        ? "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="is_premium"
                        checked={formData.is_premium}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                          formData.is_premium
                            ? "bg-blue-500 border-blue-500"
                            : theme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-400 bg-white"
                        }`}
                      >
                        {formData.is_premium && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`font-medium ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Premium Listing
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Extra visibility and promotion
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"
                    }`}
                  >
                    <FileText
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-blue-400" : "text-blue-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Property Description
                    </h3>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Update property description
                    </p>
                  </div>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Describe the property features, amenities, unique selling points, nearby attractions, and any special characteristics..."
                  className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                />
              </div>

              {/* MLS Information */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-indigo-900/30" : "bg-indigo-100"
                    }`}
                  >
                    <Hash
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-indigo-400" : "text-indigo-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      MLS Information (Optional)
                    </h3>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Multiple Listing Service details
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      MLS Number
                    </label>
                    <input
                      type="text"
                      name="mls_number"
                      value={formData.mls_number}
                      onChange={handleChange}
                      placeholder="e.g., MLS123456"
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      MLS Source
                    </label>
                    <input
                      type="text"
                      name="mls_source"
                      value={formData.mls_source}
                      onChange={handleChange}
                      placeholder="e.g., WubLand, Other MLS"
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Listing Date
                    </label>
                    <input
                      type="date"
                      name="listing_date"
                      value={formData.listing_date}
                      onChange={handleChange}
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      name="expiration_date"
                      value={formData.expiration_date}
                      onChange={handleChange}
                      min={formData.listing_date}
                      className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                    theme === "dark"
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Next: Media Upload
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Media Upload */}
          {step === 4 && (
            <div className="space-y-8">
              {/* Existing Images Section */}
              {existingImages.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-amber-900/30" : "bg-amber-100"
                      }`}
                    >
                      <ImageIcon
                        className={`w-5 h-5 ${
                          theme === "dark" ? "text-amber-400" : "text-amber-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-semibold ${
                          theme === "dark" ? "text-white" : "text-gray-800"
                        }`}
                      >
                        Existing Images ({existingImages.length})
                      </h3>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Current property images. You can remove or set as primary.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((image, index) => (
                      <div
                        key={image.id}
                        className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                          image.is_primary
                            ? "border-amber-500 ring-2 ring-amber-500/20"
                            : theme === "dark"
                            ? "border-gray-700 hover:border-gray-600"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                          <div className="flex justify-between items-start">
                            {image.is_primary && (
                              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                Primary
                              </span>
                            )}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setPrimaryImage(image.id, "existing")}
                                disabled={image.is_primary}
                                className={`p-1.5 rounded-full transition-colors ${
                                  image.is_primary
                                    ? "bg-amber-500 text-white cursor-default"
                                    : "bg-emerald-500/80 hover:bg-emerald-500 text-white"
                                }`}
                                title={
                                  image.is_primary
                                    ? "Already primary"
                                    : "Set as primary"
                                }
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeExistingImage(image.id)}
                                className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                                title="Remove image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <div
                              className={`p-2 rounded-lg backdrop-blur-sm ${
                                theme === "dark" ? "bg-black/60" : "bg-white/80"
                              }`}
                            >
                              <p
                                className={`text-xs font-medium truncate ${
                                  theme === "dark" ? "text-white" : "text-gray-900"
                                }`}
                              >
                                Existing Image {index + 1}
                              </p>
                              <p
                                className={`text-xs ${
                                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                {image.size}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-white font-medium truncate">
                              {index + 1}. Existing Image
                            </p>
                            {image.is_primary && (
                              <Star className="w-4 h-4 text-amber-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Images */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"
                    }`}
                  >
                    <Upload
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-blue-400" : "text-blue-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Add New Images
                    </h3>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Upload additional property images
                    </p>
                  </div>
                </div>

                {/* Image Upload Area */}
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:border-amber-500 hover:scale-[1.01] ${
                    theme === "dark"
                      ? "border-amber-700 bg-amber-800/30 hover:bg-amber-800/50"
                      : "border-amber-300 bg-amber-50 hover:bg-amber-100"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div
                      className={`p-4 rounded-full ${
                        theme === "dark" ? "bg-amber-900/20" : "bg-amber-200"
                      }`}
                    >
                      <CloudUpload
                        className={`w-8 h-8 ${
                          theme === "dark" ? "text-amber-400" : "text-amber-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h4
                        className={`font-semibold ${
                          theme === "dark" ? "text-amber-400" : "text-amber-600"
                        }`}
                      >
                        Upload New Images
                      </h4>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Click to browse or drag and drop images (JPG, PNG, WEBP)
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          theme === "dark" ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        Maximum file size: 10MB • Recommended: 1920x1080px
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-300 to-amber-600 text-white rounded-lg hover:from-amber-500 hover:to-amber-800 transition-all duration-600"
                    >
                      Select Images
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </div>

                {/* Uploaded New Images Preview */}
                {uploadedImages.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        New Images ({uploadedImages.length})
                      </h4>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-sm ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {uploadedImages.filter((img) => img.isPrimary).length}{" "}
                          primary image
                        </span>
                        {uploadedImages.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(
                                  `Remove all ${uploadedImages.length} new images?`
                                )
                              ) {
                                uploadedImages.forEach((img) =>
                                  URL.revokeObjectURL(img.preview)
                                );
                                setUploadedImages([]);
                              }
                            }}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              theme === "dark"
                                ? "bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800/50"
                                : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            }`}
                          >
                            Remove All
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div
                          key={image.id}
                          className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                            image.isPrimary
                              ? "border-amber-500 ring-2 ring-amber-500/20"
                              : theme === "dark"
                              ? "border-gray-700 hover:border-gray-600"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={image.preview}
                              alt={image.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                            <div className="flex justify-between items-start">
                              {image.isPrimary && (
                                <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  Primary
                                </span>
                              )}
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPrimaryImage(image.id, "new")}
                                  disabled={image.isPrimary}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    image.isPrimary
                                      ? "bg-amber-500 text-white cursor-default"
                                      : "bg-emerald-500/80 hover:bg-emerald-500 text-white"
                                  }`}
                                  title={
                                    image.isPrimary
                                      ? "Already primary"
                                      : "Set as primary"
                                  }
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeNewImage(image.id)}
                                  className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                                  title="Remove image"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                              <div
                                className={`p-2 rounded-lg backdrop-blur-sm ${
                                  theme === "dark" ? "bg-black/60" : "bg-white/80"
                                }`}
                              >
                                <p
                                  className={`text-xs font-medium truncate ${
                                    theme === "dark" ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {image.name}
                                </p>
                                <p
                                  className={`text-xs ${
                                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                                  }`}
                                >
                                  {image.size}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs text-white font-medium truncate">
                                  {index + 1}.{" "}
                                  {image.name.length > 15
                                    ? `${image.name.substring(0, 15)}...`
                                    : image.name}
                                </p>
                                <p className="text-xs text-gray-300">
                                  {image.size}
                                </p>
                              </div>
                              {image.isPrimary && (
                                <Star className="w-4 h-4 text-amber-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Floor Plans */}
              {existingFloorPlans.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-emerald-900/30" : "bg-emerald-100"
                      }`}
                    >
                      <LayoutGrid
                        className={`w-5 h-5 ${
                          theme === "dark"
                            ? "text-emerald-400"
                            : "text-emerald-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-semibold ${
                          theme === "dark" ? "text-white" : "text-gray-800"
                        }`}
                      >
                        Existing Floor Plans ({existingFloorPlans.length})
                      </h3>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Current floor plans. You can update captions or remove.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {existingFloorPlans.map((floorPlan) => (
                      <div
                        key={floorPlan.id}
                        className={`rounded-xl overflow-hidden border transition-all duration-300 group ${
                          theme === "dark"
                            ? "border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        <div className="grid grid-cols-3 gap-0">
                          <div className="col-span-1 bg-gray-100 dark:bg-gray-900 p-4 relative">
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                              <img
                                src={floorPlan.preview}
                                alt={floorPlan.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExistingFloorPlan(floorPlan.id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="col-span-2 p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {floorPlan.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {floorPlan.size}
                                </p>
                              </div>
                            </div>
                            <div className="mb-3">
                              <input
                                type="text"
                                value={floorPlan.caption || ""}
                                onChange={(e) =>
                                  updateFloorPlanCaption(floorPlan.id, e.target.value, "existing")
                                }
                                placeholder="Floor plan caption..."
                                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                  theme === "dark"
                                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Floor Plans */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-teal-900/30" : "bg-teal-100"
                    }`}
                  >
                    <LayoutGrid
                      className={`w-5 h-5 ${
                        theme === "dark" ? "text-teal-400" : "text-teal-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Add New Floor Plans
                    </h3>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Upload additional floor plans
                    </p>
                  </div>
                </div>

                {/* Floor Plan Upload Area */}
                <div
                  onClick={() => floorPlanInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:border-emerald-500 hover:scale-[1.01] ${
                    theme === "dark"
                      ? "border-emerald-700 bg-emerald-800/30 hover:bg-emerald-800/50"
                      : "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div
                      className={`p-4 rounded-full ${
                        theme === "dark" ? "bg-emerald-900/20" : "bg-emerald-200"
                      }`}
                    >
                      <LayoutGrid
                        className={`w-8 h-8 ${
                          theme === "dark"
                            ? "text-emerald-400"
                            : "text-emerald-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h4
                        className={`font-semibold ${
                          theme === "dark"
                            ? "text-emerald-400"
                            : "text-emerald-800"
                        }`}
                      >
                        Upload New Floor Plans
                      </h4>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Click to browse or drag and drop floor plans (JPG, PNG, PDF)
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          theme === "dark" ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        Maximum file size: 20MB • Recommended formats: PDF, SVG, PNG
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-6 py-2.5 bg-gradient-to-r from-green-300 to-emerald-500 text-white rounded-lg hover:from-green-400 hover:to-emerald-600 transition-all duration-300"
                    >
                      Select Floor Plans
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={floorPlanInputRef}
                    onChange={handleFloorPlanUpload}
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                  />
                </div>

                {/* Uploaded New Floor Plans Preview */}
                {uploadedFloorPlans.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        New Floor Plans ({uploadedFloorPlans.length})
                      </h4>
                      {uploadedFloorPlans.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Remove all ${uploadedFloorPlans.length} new floor plans?`
                              )
                            ) {
                              uploadedFloorPlans.forEach((fp) => {
                                if (!fp.preview.includes("flaticon.com")) {
                                  URL.revokeObjectURL(fp.preview);
                                }
                              });
                              setUploadedFloorPlans([]);
                            }
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            theme === "dark"
                              ? "bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800/50"
                              : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          }`}
                        >
                          Remove All Floor Plans
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {uploadedFloorPlans.map((floorPlan) => (
                        <div
                          key={floorPlan.id}
                          className={`rounded-xl overflow-hidden border transition-all duration-300 group ${
                            theme === "dark"
                              ? "border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          <div className="grid grid-cols-3 gap-0">
                            <div className="col-span-1 bg-gray-100 dark:bg-gray-900 p-4 relative">
                              <div className="aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                                <img
                                  src={floorPlan.preview}
                                  alt={floorPlan.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeNewFloorPlan(floorPlan.id)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="col-span-2 p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white truncate">
                                    {floorPlan.name}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {floorPlan.size}
                                  </p>
                                </div>
                              </div>
                              <div className="mb-3">
                                <input
                                  type="text"
                                  value={floorPlan.caption || ""}
                                  onChange={(e) =>
                                    updateFloorPlanCaption(floorPlan.id, e.target.value, "new")
                                  }
                                  placeholder="Floor plan caption..."
                                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                    theme === "dark"
                                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {(isUploading || loading) && (
                <div
                  className={`p-6 rounded-2xl ${
                    theme === "dark"
                      ? "bg-gray-800/50 border border-gray-700"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          theme === "dark"
                            ? "bg-emerald-900/30"
                            : "bg-emerald-100"
                        }`}
                      >
                        <CloudUpload
                          className={`w-5 h-5 ${
                            theme === "dark"
                              ? "text-emerald-400"
                              : "text-emerald-600"
                          }`}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Updating Property
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Processing changes...
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div
                    className={`h-2 rounded-full overflow-hidden ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div
                  className={`p-4 rounded-xl border ${
                    theme === "dark"
                      ? "border-gray-700 bg-gray-800/30"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-blue-900/20" : "bg-blue-100"
                      }`}
                    >
                      <ImageIcon
                        className={`w-4 h-4 ${
                          theme === "dark" ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Images
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {allImages.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    theme === "dark"
                      ? "border-gray-700 bg-gray-800/30"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-emerald-900/20" : "bg-emerald-100"
                      }`}
                    >
                      <LayoutGrid
                        className={`w-4 h-4 ${
                          theme === "dark"
                            ? "text-emerald-400"
                            : "text-emerald-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Floor Plans
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {allFloorPlans.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    theme === "dark"
                      ? "border-gray-700 bg-gray-800/30"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-red-900/20" : "bg-red-100"
                      }`}
                    >
                      <Trash2
                        className={`w-4 h-4 ${
                          theme === "dark" ? "text-red-400" : "text-red-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Removed
                      </p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {removedImages.length + removedFloorPlans.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    theme === "dark"
                      ? "border-gray-700 bg-gray-800/30"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-purple-900/20" : "bg-purple-100"
                      }`}
                    >
                      <FileText
                        className={`w-4 h-4 ${
                          theme === "dark" ? "text-purple-400" : "text-purple-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        New Files
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {uploadedImages.length + uploadedFloorPlans.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Review all changes before saving
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className={`px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                      theme === "dark"
                        ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || isUploading}
                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating Property...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditPropertyForm;