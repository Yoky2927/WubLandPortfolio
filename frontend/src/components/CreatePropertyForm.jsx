// components/CreatePropertyForm.jsx - CORRECTED VERSION

import React, { useState, useRef } from "react";
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
  // CORRECTED ICONS - Use available ones
  LayoutGrid, // Use this instead of FloorPlan
  Maximize2, // Correct name
  Box,
  FileImage,
  Trash2,
  Grid, // Alternative for floor plans
} from "lucide-react";
import { API_CONFIG } from "../config/api.config";
import { httpClient } from "../services/http.service";
import axios from "axios"; // Add this import

const CreatePropertyForm = ({ isOpen, onClose, onSubmit, theme, brokerId }) => {
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

    // Additional fields from model
    mls_number: "",
    mls_source: "",
    listing_date: new Date().toISOString().split("T")[0],
    expiration_date: "",

    // Arrays (will be JSON stringified)
    features: [],
    amenities: [],
    property_tags: [],

    // User IDs
    owner_user_id: brokerId,
    assigned_broker_id: brokerId,
    created_by_user_id: brokerId,
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedFloorPlans, setUploadedFloorPlans] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [tagsInput, setTagsInput] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [floorPlanFiles, setFloorPlanFiles] = useState([]);
  const imageInputRef = useRef(null);
  const floorPlanInputRef = useRef(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle features selection
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

  // Handle amenities selection
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

  // Handle tags input
  const handleTagsChange = (e) => {
    const value = e.target.value;
    setTagsInput(value);

    // Convert comma-separated tags to array
    const tagsArray = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => ({
      ...prev,
      property_tags: tagsArray,
    }));
  };

  // Handle regular image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file, // ✅ Store the actual File object
      preview: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + "MB",
      type: "image",
      isPrimary: uploadedImages.length === 0,
      caption: "",
    }));

    setUploadedImages((prev) => [...prev, ...newImages]);
  };

  // Handle floor plan upload
  const handleFloorPlanUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFloorPlans = files.map((file) => ({
      id: `fp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file, // ✅ Store the actual File object
      preview:
        file.type === "application/pdf"
          ? "https://cdn-icons-png.flaticon.com/512/337/337946.png"
          : URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + "MB",
      type: "floor_plan",
      caption: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for caption
    }));

    setUploadedFloorPlans((prev) => [...prev, ...newFloorPlans]);
  };

  // Remove regular image
  const removeImage = (id) => {
    const imageToRemove = uploadedImages.find((img) => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
      const newImages = uploadedImages.filter((img) => img.id !== id);
      setUploadedImages(newImages);
      setImageFiles((prev) =>
        prev.filter((_, index) => {
          const imgIndex = uploadedImages.findIndex((img) => img.id === id);
          return index !== imgIndex;
        })
      );
    }
  };

  // Remove floor plan
  const removeFloorPlan = (id) => {
    const floorPlanToRemove = uploadedFloorPlans.find((fp) => fp.id === id);
    if (floorPlanToRemove) {
      if (!floorPlanToRemove.preview.includes("flaticon.com")) {
        URL.revokeObjectURL(floorPlanToRemove.preview);
      }
      const newFloorPlans = uploadedFloorPlans.filter((fp) => fp.id !== id);
      setUploadedFloorPlans(newFloorPlans);
      setFloorPlanFiles((prev) =>
        prev.filter((_, index) => {
          const fpIndex = uploadedFloorPlans.findIndex((fp) => fp.id === id);
          return index !== fpIndex;
        })
      );
    }
  };

  // Set primary image
  const setPrimaryImage = (id) => {
    setUploadedImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  // Update floor plan caption
  const updateFloorPlanCaption = (id, caption) => {
    setUploadedFloorPlans((prev) =>
      prev.map((fp) => (fp.id === id ? { ...fp, caption } : fp))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // ========== DEBUG CODE ==========
      console.log("🔍 FORM DATA BEFORE PROCESSING:", formData);
      // ========== END DEBUG ==========

      // Prepare FormData
      const submitData = new FormData();

      // DEBUG: Log all form data keys
      console.log("🔍 All formData keys:", Object.keys(formData));

      // Add ALL form fields
      Object.keys(formData).forEach((key) => {
        const value = formData[key];

        // Skip these - they're handled specially or shouldn't be sent
        if (key === "square_meters" || key === "neighborhood") {
          return;
        }

        // Handle array fields (features, amenities, property_tags)
        if (
          key === "features" ||
          key === "amenities" ||
          key === "property_tags"
        ) {
          const arrayData = Array.isArray(value) ? value : [];
          submitData.append(key, JSON.stringify(arrayData));
          console.log(`📝 Added ${key}:`, JSON.stringify(arrayData));
        }
        // Handle boolean fields
        else if (
          key === "is_negotiable" ||
          key === "is_exclusive" ||
          key === "is_featured" ||
          key === "is_premium"
        ) {
          submitData.append(key, value ? "true" : "false");
          console.log(`📝 Added ${key}:`, value ? "true" : "false");
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
          // Convert to string, handle empty values
          const stringValue =
            value !== undefined && value !== null ? String(value) : "";
          submitData.append(key, stringValue);
          console.log(`📝 Added ${key}:`, stringValue);
        }
        // Handle all other fields
        else {
          const stringValue =
            value !== undefined && value !== null ? String(value) : "";
          submitData.append(key, stringValue);
          console.log(`📝 Added ${key}:`, stringValue);
        }
      });

      // Handle square_meters conversion to sqft
      if (formData.square_meters) {
        const sqftValue = parseFloat(formData.square_meters) * 10.764;
        submitData.append("sqft", sqftValue.toFixed(2));
        console.log(
          `📝 Added sqft (from square_meters):`,
          sqftValue.toFixed(2)
        );
      }

      // Handle neighborhood
      if (formData.neighborhood) {
        const currentAddress = formData.address || "";
        const newAddress =
          currentAddress + (currentAddress ? ", " : "") + formData.neighborhood;
        submitData.set("address", newAddress);
        console.log(`📝 Updated address with neighborhood:`, newAddress);

        // Add neighborhood to tags
        const currentTags = Array.isArray(formData.property_tags)
          ? [...formData.property_tags, formData.neighborhood]
          : [formData.neighborhood];
        submitData.set("property_tags", JSON.stringify(currentTags));
        console.log(`📝 Updated property_tags:`, JSON.stringify(currentTags));
      }

      // REQUIRED FIELDS CHECK - Add any missing required fields
      const requiredFields = [
        "title",
        "price",
        "address",
        "city",
        "listing_type",
      ];
      const missingFields = [];

      requiredFields.forEach((field) => {
        if (!submitData.has(field) || !submitData.get(field)) {
          missingFields.push(field);
          console.warn(`⚠️ Missing required field: ${field}`);
        }
      });

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Add images
      console.log(`📸 Adding ${uploadedImages.length} images`);
      uploadedImages.forEach((image, index) => {
        if (image.file && image.file instanceof File) {
          submitData.append("images", image.file);
          submitData.append(
            `image_${index}_is_primary`,
            image.isPrimary ? "1" : "0"
          );
          submitData.append(`image_${index}_caption`, image.caption || "");
          console.log(`📸 Added image ${index}: ${image.file.name}`);
        }
      });

      // Add floor plans
      console.log(`📐 Adding ${uploadedFloorPlans.length} floor plans`);
      uploadedFloorPlans.forEach((floorPlan, index) => {
        if (floorPlan.file && floorPlan.file instanceof File) {
          submitData.append("floor_plans", floorPlan.file);
          submitData.append(
            `floor_plan_${index}_caption`,
            floorPlan.caption || "Floor Plan"
          );
          console.log(`📐 Added floor plan ${index}: ${floorPlan.file.name}`);
        }
      });

      // Final debug log
      console.log("📤 FINAL FormData contents:");
      for (let [key, value] of submitData.entries()) {
        if (value instanceof File) {
          console.log(
            `${key}: ${value.name} (${value.size} bytes, ${value.type})`
          );
        } else if (typeof value === "string" && value.length > 100) {
          console.log(`${key}: ${value.substring(0, 100)}...`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Get token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Use hardcoded URL temporarily
      const testUrl = "http://localhost:5002/api/properties";
      console.log("🚀 Sending to:", testUrl);

      // Send request
      const response = await fetch(testUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      // Check response
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorText = await response.text();
          errorMessage = `${errorMessage}: ${errorText}`;
        } catch (e) {
          // If we can't read the response text
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      const data = await response.json();
      console.log("✅ Property created successfully:", data);

      setUploadProgress(100);

      // Call parent onSubmit if provided
      if (onSubmit) {
        await onSubmit(data);
      }

      // Reset and close
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1000);
    } catch (error) {
      console.error("❌ Error creating property:", error);

      let errorMessage = "Failed to create property";
      if (error.message.includes("Missing required fields")) {
        errorMessage = error.message;
      } else if (error.message.includes("No authentication token")) {
        errorMessage = "Please login again. Your session may have expired.";
      } else if (error.message.includes("HTTP 404")) {
        errorMessage =
          "Server endpoint not found. Please check if backend is running.";
      } else if (error.message.includes("HTTP 500")) {
        errorMessage = "Server error. Please try again later.";
      } else {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsUploading(false);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      property_type: "house",
      property_status: "draft",
      listing_type: "sale",
      address: "",
      city: "",
      region: "",
      country: "Ethiopia",
      latitude: "",
      longitude: "",
      neighborhood: "",
      beds: 1,
      baths: 1,
      sqft: "",
      square_meters: "",
      year_built: new Date().getFullYear(),
      lot_size: "",
      garage_spaces: 0,
      parking_spaces: 0,
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
      mls_number: "",
      mls_source: "",
      listing_date: new Date().toISOString().split("T")[0],
      expiration_date: "",
      features: [],
      amenities: [],
      property_tags: [],
      owner_user_id: brokerId,
      assigned_broker_id: brokerId,
      created_by_user_id: brokerId,
    });
    setSelectedFeatures([]);
    setSelectedAmenities([]);
    setTagsInput("");
    setUploadedImages([]);
    setUploadedFloorPlans([]);
    setImageFiles([]);
    setFloorPlanFiles([]);
    setStep(1);
    setLoading(false);
    setIsUploading(false);
    setUploadProgress(0);
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
              <Home
                className={`w-6 h-6 ${
                  theme === "dark" ? "text-amber-400" : "text-amber-600"
                }`}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Create New Property
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
                      Start with the basic details of your property
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
                      Initial Status *
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
                      Where is your property located?
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
                      Details about the property structure and features
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
                      Add keywords separated by commas (e.g., modern, luxury,
                      pool, garden)
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
                      Set the price and conditions for your listing
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
                      Describe what makes your property special
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

          {/* STEP 4: Media Upload (NEW STEP) */}
          {step === 4 && (
            <div className="space-y-8">
              {/* Property Images */}
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
                      Property Images
                    </h3>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Upload high-quality photos of your property (Recommended:
                      5-10 images)
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
                        Upload Property Images
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

                {/* Uploaded Images Preview */}
                {uploadedImages.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Uploaded Images ({uploadedImages.length})
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
                                  `Remove all ${uploadedImages.length} images?`
                                )
                              ) {
                                uploadedImages.forEach((img) =>
                                  URL.revokeObjectURL(img.preview)
                                );
                                setUploadedImages([]);
                                setImageFiles([]);
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
                          {/* Image Preview */}
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={image.preview}
                              alt={image.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>

                          {/* Overlay with controls */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                            {/* Top controls */}
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
                                  onClick={() => setPrimaryImage(image.id)}
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
                                  {image.isPrimary ? (
                                    <Star className="w-3.5 h-3.5" />
                                  ) : (
                                    <Star className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeImage(image.id)}
                                  className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                                  title="Remove image"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Bottom info */}
                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                              <div
                                className={`p-2 rounded-lg backdrop-blur-sm ${
                                  theme === "dark"
                                    ? "bg-black/60"
                                    : "bg-white/80"
                                }`}
                              >
                                <p
                                  className={`text-xs font-medium truncate ${
                                    theme === "dark"
                                      ? "text-white"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {image.name}
                                </p>
                                <p
                                  className={`text-xs ${
                                    theme === "dark"
                                      ? "text-gray-300"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {image.size}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Static info (always visible) */}
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

                          {/* Remove button for small screens */}
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute top-2 right-2 md:hidden p-1.5 bg-red-500 text-white rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Image ordering hint */}
                    {uploadedImages.length > 1 && (
                      <div
                        className={`mt-4 p-3 rounded-lg text-sm ${
                          theme === "dark"
                            ? "bg-blue-900/20 text-blue-300 border border-blue-800/50"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            Drag and drop images to reorder (coming soon). First
                            image is the primary thumbnail.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Floor Plans */}
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
                      Floor Plans
                    </h3>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Upload floor plans, blueprints, or layout diagrams
                      (Optional but recommended)
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
                        theme === "dark"
                          ? "bg-emerald-900/20"
                          : "bg-emerald-200"
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
                        Upload Floor Plans
                      </h4>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Click to browse or drag and drop floor plans (JPG, PNG,
                        PDF, SVG)
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          theme === "dark" ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        Maximum file size: 20MB • Recommended formats: PDF, SVG,
                        PNG
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

                {/* Uploaded Floor Plans Preview */}
                {uploadedFloorPlans.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Uploaded Floor Plans ({uploadedFloorPlans.length})
                      </h4>
                      {uploadedFloorPlans.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Remove all ${uploadedFloorPlans.length} floor plans?`
                              )
                            ) {
                              uploadedFloorPlans.forEach((fp) => {
                                if (!fp.preview.includes("flaticon.com")) {
                                  URL.revokeObjectURL(fp.preview);
                                }
                              });
                              setUploadedFloorPlans([]);
                              setFloorPlanFiles([]);
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
                      {uploadedFloorPlans.map((floorPlan, index) => (
                        <div
                          key={floorPlan.id}
                          className={`rounded-xl overflow-hidden border transition-all duration-300 group ${
                            theme === "dark"
                              ? "border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          <div className="grid grid-cols-3 gap-0">
                            {/* Preview */}
                            <div className="col-span-1 bg-gray-100 dark:bg-gray-900 p-4 relative">
                              <div className="aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                                <img
                                  src={floorPlan.preview}
                                  alt={floorPlan.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {/* Quick remove button */}
                              <button
                                type="button"
                                onClick={() => removeFloorPlan(floorPlan.id)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                title="Remove floor plan"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Info & Controls */}
                            <div className="col-span-2 p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white truncate">
                                    {index + 1}. {floorPlan.name}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {floorPlan.size}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeFloorPlan(floorPlan.id)
                                    }
                                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Remove floor plan"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Caption Input */}
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Caption
                                </label>
                                <input
                                  type="text"
                                  value={floorPlan.caption || ""}
                                  onChange={(e) =>
                                    updateFloorPlanCaption(
                                      floorPlan.id,
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., Ground Floor Layout, Upper Floor Plan"
                                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                    theme === "dark"
                                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                                  }`}
                                />
                              </div>

                              {/* File Type Indicator & Remove Button */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      floorPlan.name
                                        .toLowerCase()
                                        .endsWith(".pdf")
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    }`}
                                  >
                                    {floorPlan.name
                                      .toLowerCase()
                                      .endsWith(".pdf")
                                      ? "PDF"
                                      : "IMAGE"}
                                  </div>
                                  <div
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      theme === "dark"
                                        ? "bg-gray-800 text-gray-400"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    Floor Plan
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      confirm(`Remove "${floorPlan.name}"?`)
                                    ) {
                                      removeFloorPlan(floorPlan.id);
                                    }
                                  }}
                                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                    theme === "dark"
                                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                                  }`}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress (Only shown when submitting) */}
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
                          Uploading Files
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Processing{" "}
                          {uploadedImages.length + uploadedFloorPlans.length}{" "}
                          files...
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        theme === "dark" ? "bg-blue-900/20" : "bg-amber-100"
                      }`}
                    >
                      <ImageIcon
                        className={`w-4 h-4 ${
                          theme === "dark" ? "text-amber-400" : "text-amber-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-white dark:text-gray-500">
                        Images
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          theme === "dark" ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {uploadedImages.length}
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
                        theme === "dark"
                          ? "bg-emerald-900/20"
                          : "bg-emerald-100"
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
                      <p className="text-sm text-white dark:text-gray-400">
                        Floor Plans
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          theme === "dark" ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {uploadedFloorPlans.length}
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
                          theme === "dark"
                            ? "text-purple-400"
                            : "text-purple-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-white dark:text-gray-400">
                        Total Files
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          theme === "dark" ? "text-white" : "text-gray-500"
                        }`}
                      >
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
                      {uploadedImages.length === 0
                        ? "Warning: No images uploaded. Properties with images get more views."
                        : uploadedImages.length < 3
                        ? "Tip: Add more images for better presentation"
                        : "Ready to create your property listing!"}
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
                        Creating Property...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Create Property
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

export default CreatePropertyForm;
