import React, { useState, useCallback } from "react";
import {
    Building, Home, LandPlot, Key, CheckCircle,
    X, Check, Minus, Plus, Upload, Image as ImageIcon,
    FileText, Phone, Mail, MapPin, DollarSign,
    Bed, Bath, Layers, Maximize2, Crown, PlusCircle,
    Trash2, Calendar, Star, TrendingUp, AlertCircle,
    Building2, Castle, Warehouse
} from "lucide-react";
import { apiCall } from "../utils/api.endpoints";

const AddCompanyPropertyModal = ({
    theme,
    isOpen,
    onClose,
    onSuccess,
    setToast
}) => {
    console.log('🔧 Modal rendering, isOpen:', isOpen);
    
    const [loading, setLoading] = useState(false);
    const [property, setProperty] = useState({
        title: "",
        description: "",
        type: "residential",
        subType: "apartment",
        price: "",
        location: "",
        address: "",
        city: "",
        region: "",
        bedrooms: 1,
        bathrooms: 1,
        area: "",
        areaUnit: "sqm",
        floorNumber: "",
        totalFloors: "",
        yearBuilt: new Date().getFullYear(),
        features: [],
        amenities: [],
        images: [],
        contactPhone: "",
        contactEmail: "",
        isPremium: false,
        isFeatured: false,
        listingType: "sale",
        availability: "available",
        parkingSpaces: 0,
        gardenArea: "",
        balcony: false,
        storageRoom: false
    });

    const [imageUploads, setImageUploads] = useState([]);
    const [floorPlans, setFloorPlans] = useState([]);
    const [activeTab, setActiveTab] = useState("basic");

    const isDark = theme === "dark";

    // Property types configuration
    const propertyTypes = {
        residential: {
            label: "Residential",
            icon: Home,
            subtypes: ["apartment", "villa", "condo", "townhouse", "penthouse", "studio"],
            color: "blue"
        },
        commercial: {
            label: "Commercial",
            icon: Building,
            subtypes: ["office", "retail", "warehouse", "industrial", "mixed-use"],
            color: "purple"
        },
        land: {
            label: "Land",
            icon: LandPlot,
            subtypes: ["residential_land", "commercial_land", "agricultural", "investment"],
            color: "green"
        },
        rental: {
            label: "Rental",
            icon: Key,
            subtypes: ["short_term", "long_term", "vacation", "student"],
            color: "orange"
        }
    };

    // Features and amenities options
    const featuresOptions = [
        "Swimming Pool", "Garden", "Parking", "Security", "Elevator",
        "Air Conditioning", "Heating", "Furnished", "Pet Friendly",
        "Balcony", "Terrace", "Gym", "Playground", "Concierge",
        "Wheelchair Access", "Storage", "Laundry", "Internet",
        "Smart Home", "CCTV", "Generator", "Water Tank"
    ];

    const amenitiesOptions = [
        "Shopping Mall", "Hospital", "School", "Park", "Restaurant",
        "Supermarket", "Bank", "Pharmacy", "Public Transport",
        "Sports Center", "Cinema", "University", "Airport", "Gym",
        "Swimming Pool", "Playground", "Security", "Parking"
    ];

    // Navigation tabs
    const tabs = [
        { id: "basic", label: "Basic Info", icon: Building },
        { id: "specs", label: "Specifications", icon: Layers },
        { id: "features", label: "Features", icon: Star },
        { id: "media", label: "Media", icon: ImageIcon },
        { id: "contact", label: "Contact", icon: Phone }
    ];

    // FIXED: Use useCallback for handleInputChange
    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        console.log('📝 Input change:', name, value);

        setProperty(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    // FIXED: Handle number input changes
    const handleNumberChange = useCallback((name, value) => {
        console.log('🔢 Number change:', name, value);
        
        setProperty(prev => ({
            ...prev,
            [name]: typeof value === 'number' ? value : parseFloat(value) || 0
        }));
    }, []);

    // FIXED: Handle feature toggle
    const handleFeatureToggle = useCallback((feature) => {
        console.log('⭐ Feature toggle:', feature);
        
        setProperty(prev => ({
            ...prev,
            features: prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature]
        }));
    }, []);

    // FIXED: Handle amenity toggle
    const handleAmenityToggle = useCallback((amenity) => {
        console.log('🏙️ Amenity toggle:', amenity);
        
        setProperty(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    }, []);

    // FIXED: Handle image upload
    const handleImageUpload = async (files) => {
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('image', file);

                const response = await apiCall('UPLOAD_PROPERTY_IMAGE', {}, {
                    data: formData,
                    method: 'POST'
                });

                if (response && response.url) {
                    return {
                        url: response.url,
                        thumbnail: response.thumbnail || response.url,
                        caption: file.name,
                        type: 'image'
                    };
                }
                return null;
            });

            const uploadedImages = await Promise.all(uploadPromises);
            const validImages = uploadedImages.filter(img => img !== null);

            setImageUploads(prev => [...prev, ...validImages]);
            setProperty(prev => ({
                ...prev,
                images: [...prev.images, ...validImages]
            }));

            setToast({
                show: true,
                message: `${validImages.length} image(s) uploaded successfully`,
                type: "success",
            });
        } catch (error) {
            console.error('Error uploading images:', error);
            setToast({
                show: true,
                message: "Failed to upload images",
                type: "error",
            });
        }
    };

    // FIXED: Handle floor plan upload
    const handleFloorPlanUpload = async (files) => {
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('floorPlan', file);

                const response = await apiCall('UPLOAD_FLOOR_PLAN', {}, {
                    data: formData,
                    method: 'POST'
                });

                if (response && response.url) {
                    return {
                        url: response.url,
                        caption: `Floor Plan ${floorPlans.length + 1}`,
                        type: 'floorPlan'
                    };
                }
                return null;
            });

            const uploadedPlans = await Promise.all(uploadPromises);
            const validPlans = uploadedPlans.filter(plan => plan !== null);

            setFloorPlans(prev => [...prev, ...validPlans]);

            setToast({
                show: true,
                message: `${validPlans.length} floor plan(s) uploaded successfully`,
                type: "success",
            });
        } catch (error) {
            console.error('Error uploading floor plans:', error);
            setToast({
                show: true,
                message: "Failed to upload floor plans",
                type: "error",
            });
        }
    };

    // FIXED: Remove image
    const removeImage = (index) => {
        setImageUploads(prev => prev.filter((_, i) => i !== index));
        setProperty(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // FIXED: Remove floor plan
    const removeFloorPlan = (index) => {
        setFloorPlans(prev => prev.filter((_, i) => i !== index));
    };

    // FIXED: Submit property
    const handleSubmit = async () => {
        try {
            setLoading(true);

            // Validate required fields
            if (!property.title || !property.price || !property.location) {
                setToast({
                    show: true,
                    message: "Please fill in all required fields",
                    type: "warning",
                });
                return;
            }

            // Prepare property data with floor plans
            const propertyData = {
                ...property,
                floorPlans: floorPlans,
                isCompanyProperty: true,
                status: 'approved',
                listedBy: 'company',
                listedAt: new Date().toISOString(),
                images: imageUploads
            };

            const response = await apiCall('ADD_COMPANY_PROPERTY', {}, {
                data: propertyData,
                method: 'POST'
            });

            if (response && response.success) {
                setToast({
                    show: true,
                    message: "Company property listed successfully!",
                    type: "success",
                });

                // Reset form
                setProperty({
                    title: "",
                    description: "",
                    type: "residential",
                    subType: "apartment",
                    price: "",
                    location: "",
                    address: "",
                    city: "",
                    region: "",
                    bedrooms: 1,
                    bathrooms: 1,
                    area: "",
                    areaUnit: "sqm",
                    floorNumber: "",
                    totalFloors: "",
                    yearBuilt: new Date().getFullYear(),
                    features: [],
                    amenities: [],
                    images: [],
                    contactPhone: "",
                    contactEmail: "",
                    isPremium: false,
                    isFeatured: false,
                    listingType: "sale",
                    availability: "available",
                    parkingSpaces: 0,
                    gardenArea: "",
                    balcony: false,
                    storageRoom: false
                });
                setImageUploads([]);
                setFloorPlans([]);

                // Close modal and trigger success callback
                onClose();
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error('Error adding company property:', error);
            setToast({
                show: true,
                message: `Failed: ${error.message}`,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    // FIXED: Property Type Section with proper event handling
    const PropertyTypeSection = () => (
        <div className="mb-6">
            <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                Property Type
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(propertyTypes).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = property.type === key;

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => {
                                console.log('🏠 Type selected:', key);
                                setProperty(prev => ({ 
                                    ...prev, 
                                    type: key, 
                                    subType: config.subtypes[0] 
                                }));
                            }}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                                isSelected
                                    ? isDark
                                        ? "border-blue-500 bg-blue-900/20"
                                        : "border-blue-500 bg-blue-50"
                                    : isDark
                                        ? "border-gray-700 bg-gray-800/50 hover:bg-gray-700/50"
                                        : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                        >
                            <Icon className={`w-6 h-6 mb-2 ${
                                isSelected
                                    ? isDark ? "text-blue-400" : "text-blue-600"
                                    : isDark ? "text-gray-400" : "text-gray-500"
                            }`} />
                            <span className={`text-sm font-medium ${
                                isSelected
                                    ? isDark ? "text-blue-300" : "text-blue-700"
                                    : isDark ? "text-gray-300" : "text-gray-700"
                            }`}>
                                {config.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {property.type && (
                <div className="mt-4">
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Sub Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {propertyTypes[property.type]?.subtypes.map(subtype => (
                            <button
                                key={subtype}
                                type="button"
                                onClick={() => {
                                    console.log('🔧 Subtype selected:', subtype);
                                    setProperty(prev => ({ ...prev, subType: subtype }));
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                                    property.subType === subtype
                                        ? isDark
                                            ? "bg-amber-600 text-white"
                                            : "bg-amber-100 text-amber-700"
                                        : isDark
                                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {subtype.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // FIXED: Basic Info Section with controlled inputs
    const BasicInfoSection = () => (
        <div className="mb-6">
            <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                Basic Information
            </h3>
            <div className="space-y-4">
                <div>
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Property Title *
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={property.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Modern 3-Bedroom Apartment in City Center"
                        className={`w-full p-3 rounded-lg border ${
                            isDark
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                        } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                    />
                </div>

                <div>
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={property.description}
                        onChange={handleInputChange}
                        placeholder="Describe the property in detail..."
                        rows="4"
                        className={`w-full p-3 rounded-lg border ${
                            isDark
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                        } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            Price *
                        </label>
                        <div className="flex gap-2">
                            <select
                                name="listingType"
                                value={property.listingType}
                                onChange={handleInputChange}
                                className={`w-1/3 p-3 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700 border-gray-600 text-white focus:border-amber-500"
                                        : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                                } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                            >
                                <option value="sale">For Sale</option>
                                <option value="rent">For Rent</option>
                                <option value="lease">For Lease</option>
                            </select>
                            <input
                                type="number"
                                name="price"
                                value={property.price}
                                onChange={handleInputChange}
                                placeholder="Enter price"
                                className={`flex-1 p-3 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                                } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            Location *
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={property.location}
                            onChange={handleInputChange}
                            placeholder="e.g., Bole, Addis Ababa"
                            className={`w-full p-3 rounded-lg border ${
                                isDark
                                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                            } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            Full Address
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={property.address}
                            onChange={handleInputChange}
                            placeholder="Street address, house number"
                            className={`w-full p-3 rounded-lg border ${
                                isDark
                                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                            } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                        />
                    </div>

                    <div>
                        <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            City/Region
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={property.city}
                            onChange={handleInputChange}
                            placeholder="City and region"
                            className={`w-full p-3 rounded-lg border ${
                                isDark
                                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                            } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    // FIXED: Specifications Section
    const SpecificationsSection = () => (
        <div className="mb-6">
            <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Bedrooms
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleNumberChange('bedrooms', Math.max(0, property.bedrooms - 1))}
                            className={`p-2 rounded-lg ${
                                isDark
                                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            } transition-colors`}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className={`px-4 py-2 rounded-lg min-w-[60px] text-center ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                            {property.bedrooms}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleNumberChange('bedrooms', property.bedrooms + 1)}
                            className={`p-2 rounded-lg ${
                                isDark
                                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            } transition-colors`}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div>
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Bathrooms
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleNumberChange('bathrooms', Math.max(0.5, property.bathrooms - 0.5))}
                            className={`p-2 rounded-lg ${
                                isDark
                                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            } transition-colors`}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className={`px-4 py-2 rounded-lg min-w-[60px] text-center ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                            {property.bathrooms}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleNumberChange('bathrooms', property.bathrooms + 0.5)}
                            className={`p-2 rounded-lg ${
                                isDark
                                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            } transition-colors`}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div>
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Total Area
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            name="area"
                            value={property.area}
                            onChange={handleInputChange}
                            placeholder="Size"
                            className={`flex-1 p-3 rounded-lg border ${
                                isDark
                                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                            } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                        />
                        <select
                            name="areaUnit"
                            value={property.areaUnit}
                            onChange={handleInputChange}
                            className={`w-1/3 p-3 rounded-lg border ${
                                isDark
                                    ? "bg-gray-700 border-gray-600 text-white focus:border-amber-500"
                                    : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                            } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                        >
                            <option value="sqm">Sq m</option>
                            <option value="sqft">Sq ft</option>
                            <option value="hectare">Hectare</option>
                            <option value="acre">Acre</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Year Built
                    </label>
                    <input
                        type="number"
                        name="yearBuilt"
                        value={property.yearBuilt}
                        onChange={handleInputChange}
                        placeholder="Year"
                        min="1800"
                        max={new Date().getFullYear()}
                        className={`w-full p-3 rounded-lg border ${
                            isDark
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                        } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                    />
                </div>

                <div>
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Floor Number
                    </label>
                    <input
                        type="number"
                        name="floorNumber"
                        value={property.floorNumber}
                        onChange={handleInputChange}
                        placeholder="Floor number"
                        min="0"
                        className={`w-full p-3 rounded-lg border ${
                            isDark
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                        } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                    />
                </div>

                <div>
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Total Floors
                    </label>
                    <input
                        type="number"
                        name="totalFloors"
                        value={property.totalFloors}
                        onChange={handleInputChange}
                        placeholder="Total floors in building"
                        min="1"
                        className={`w-full p-3 rounded-lg border ${
                            isDark
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                        } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                    />
                </div>

                <div>
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Parking Spaces
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleNumberChange('parkingSpaces', Math.max(0, property.parkingSpaces - 1))}
                            className={`p-2 rounded-lg ${
                                isDark
                                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            } transition-colors`}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className={`px-4 py-2 rounded-lg min-w-[60px] text-center ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                            {property.parkingSpaces}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleNumberChange('parkingSpaces', property.parkingSpaces + 1)}
                            className={`p-2 rounded-lg ${
                                isDark
                                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            } transition-colors`}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Garden Area (optional)
                    </label>
                    <input
                        type="text"
                        name="gardenArea"
                        value={property.gardenArea}
                        onChange={handleInputChange}
                        placeholder="e.g., 100 sqm garden"
                        className={`w-full p-3 rounded-lg border ${
                            isDark
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                        } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <label className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        <input
                            type="checkbox"
                            name="balcony"
                            checked={property.balcony}
                            onChange={handleInputChange}
                            className="w-4 h-4 rounded"
                        />
                        <span>Balcony</span>
                    </label>
                    <label className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        <input
                            type="checkbox"
                            name="storageRoom"
                            checked={property.storageRoom}
                            onChange={handleInputChange}
                            className="w-4 h-4 rounded"
                        />
                        <span>Storage Room</span>
                    </label>
                </div>
            </div>
        </div>
    );

    // FIXED: Features Section
    const FeaturesSection = () => (
        <div className="mb-6">
            <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                Features & Amenities
            </h3>

            <div className="mb-6">
                <h4 className={`text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Property Features
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {featuresOptions.map(feature => (
                        <button
                            key={feature}
                            type="button"
                            onClick={() => handleFeatureToggle(feature)}
                            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 justify-center transition-all ${
                                property.features.includes(feature)
                                    ? isDark
                                        ? "bg-amber-600 text-white"
                                        : "bg-amber-100 text-amber-700 border-amber-300"
                                    : isDark
                                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                            } border`}
                        >
                            <Check className={`w-3 h-3 ${property.features.includes(feature) ? "opacity-100" : "opacity-0"}`} />
                            {feature}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h4 className={`text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Nearby Amenities
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {amenitiesOptions.map(amenity => (
                        <button
                            key={amenity}
                            type="button"
                            onClick={() => handleAmenityToggle(amenity)}
                            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 justify-center transition-all ${
                                property.amenities.includes(amenity)
                                    ? isDark
                                        ? "bg-blue-600 text-white"
                                        : "bg-blue-100 text-blue-700 border-blue-300"
                                    : isDark
                                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                            } border`}
                        >
                            <Check className={`w-3 h-3 ${property.amenities.includes(amenity) ? "opacity-100" : "opacity-0"}`} />
                            {amenity}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // FIXED: Media Section
    const MediaSection = () => (
        <div className="mb-6">
            <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                Property Media
            </h3>

            {/* Property Images */}
            <div className="mb-6">
                <h4 className={`text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Property Images
                </h4>
                <div className={`p-6 border-2 border-dashed rounded-xl text-center ${
                    isDark
                        ? "border-gray-600 bg-gray-800/50"
                        : "border-gray-300 bg-gray-50"
                } hover:border-amber-500 transition-colors`}>
                    <input
                        type="file"
                        id="property-images"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="hidden"
                    />
                    <label htmlFor="property-images" className="cursor-pointer">
                        <Upload className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                        <p className={isDark ? "text-gray-300" : "text-gray-700"}>
                            Click to upload property images
                        </p>
                        <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                            Upload up to 20 images (JPEG, PNG, WebP)
                        </p>
                    </label>
                </div>

                {imageUploads.length > 0 && (
                    <div className="mt-4">
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {imageUploads.map((image, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={image.thumbnail || image.url}
                                        alt={`Property ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-2 rounded-b-lg truncate">
                                        {image.caption}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            {imageUploads.length} image(s) uploaded
                        </p>
                    </div>
                )}
            </div>

            {/* Floor Plans */}
            <div>
                <h4 className={`text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Floor Plans & Layouts
                </h4>
                <div className={`p-6 border-2 border-dashed rounded-xl text-center ${
                    isDark
                        ? "border-gray-600 bg-gray-800/50"
                        : "border-gray-300 bg-gray-50"
                } hover:border-blue-500 transition-colors`}>
                    <input
                        type="file"
                        id="floor-plans"
                        multiple
                        accept="image/*,.pdf"
                        onChange={(e) => handleFloorPlanUpload(e.target.files)}
                        className="hidden"
                    />
                    <label htmlFor="floor-plans" className="cursor-pointer">
                        <Maximize2 className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                        <p className={isDark ? "text-gray-300" : "text-gray-700"}>
                            Click to upload floor plans
                        </p>
                        <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                            Upload floor layouts and blueprints (JPG, PNG, PDF)
                        </p>
                    </label>
                </div>

                {floorPlans.length > 0 && (
                    <div className="mt-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {floorPlans.map((plan, index) => (
                                <div key={index} className={`p-3 rounded-lg border ${
                                    isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <FileText className={`w-8 h-8 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                                {plan.caption}
                                            </p>
                                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                Floor plan {index + 1}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFloorPlan(index)}
                                            className="p-1 text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            {floorPlans.length} floor plan(s) uploaded
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    // FIXED: Contact Section
    const ContactSection = () => (
        <div className="mb-6">
            <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Contact Phone
                    </label>
                    <input
                        type="tel"
                        name="contactPhone"
                        value={property.contactPhone}
                        onChange={handleInputChange}
                        placeholder="+251 91 234 5678"
                        className={`w-full p-3 rounded-lg border ${
                            isDark
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                        } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                    />
                </div>

                <div>
                    <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Contact Email
                    </label>
                    <input
                        type="email"
                        name="contactEmail"
                        value={property.contactEmail}
                        onChange={handleInputChange}
                        placeholder="contact@wubland.com"
                        className={`w-full p-3 rounded-lg border ${
                            isDark
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-amber-500"
                        } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                    />
                </div>
            </div>

            <div className="mt-6">
                <h4 className={`text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Listing Settings
                </h4>
                <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                        isDark
                            ? "border-gray-600 bg-gray-800/50 hover:bg-gray-800"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                    } transition-colors`}>
                        <input
                            type="checkbox"
                            name="isPremium"
                            checked={property.isPremium}
                            onChange={handleInputChange}
                            className="w-4 h-4 rounded"
                        />
                        <div>
                            <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Premium Listing</p>
                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                Feature this property prominently with enhanced visibility
                            </p>
                        </div>
                        <Star className={`w-5 h-5 ml-auto ${
                            property.isPremium ? "text-amber-500" : isDark ? "text-gray-500" : "text-gray-400"
                        }`} />
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                        isDark
                            ? "border-gray-600 bg-gray-800/50 hover:bg-gray-800"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                    } transition-colors`}>
                        <input
                            type="checkbox"
                            name="isFeatured"
                            checked={property.isFeatured}
                            onChange={handleInputChange}
                            className="w-4 h-4 rounded"
                        />
                        <div>
                            <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Featured Property</p>
                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                Show in featured section on homepage
                            </p>
                        </div>
                        <TrendingUp className={`w-5 h-5 ml-auto ${
                            property.isFeatured ? "text-green-500" : isDark ? "text-gray-500" : "text-gray-400"
                        }`} />
                    </label>

                    <div>
                        <label className={`block mb-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            Availability Status
                        </label>
                        <select
                            name="availability"
                            value={property.availability}
                            onChange={handleInputChange}
                            className={`w-full p-3 rounded-lg border ${
                                isDark
                                    ? "bg-gray-700 border-gray-600 text-white focus:border-amber-500"
                                    : "bg-white border-gray-300 text-gray-900 focus:border-amber-500"
                            } focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors`}
                        >
                            <option value="available">Available</option>
                            <option value="reserved">Reserved</option>
                            <option value="sold">Sold</option>
                            <option value="rented">Rented</option>
                            <option value="under_construction">Under Construction</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render active section
    const renderActiveSection = () => {
        console.log('🔄 Rendering active section:', activeTab);
        
        switch (activeTab) {
            case "basic":
                return (
                    <>
                        <PropertyTypeSection />
                        <BasicInfoSection />
                    </>
                );
            case "specs":
                return <SpecificationsSection />;
            case "features":
                return <FeaturesSection />;
            case "media":
                return <MediaSection />;
            case "contact":
                return <ContactSection />;
            default:
                return null;
        }
    };

    if (!isOpen) {
        console.log('❌ Modal not open, returning null');
        return null;
    }

    console.log('✅ Modal open, rendering content');

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Background overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={(e) => {
                    console.log('🖱️ Background clicked');
                    e.stopPropagation();
                    onClose();
                }}
            />

            <div
                className={`relative max-w-6xl w-full rounded-xl shadow-2xl ${
                    isDark ? "bg-gray-800" : "bg-white"
                } max-h-[90vh] overflow-y-auto`}
                onClick={(e) => {
                    console.log('🖱️ Modal content clicked');
                    e.stopPropagation();
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`sticky top-0 z-10 p-6 border-b ${
                    isDark ? "border-gray-700 bg-gray-800/90" : "border-gray-200 bg-white/90"
                } backdrop-blur-sm`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                                isDark ? "bg-amber-900/30" : "bg-amber-100"
                            }`}>
                                <PlusCircle className={`w-6 h-6 ${
                                    isDark ? "text-amber-400" : "text-amber-600"
                                }`} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${
                                    isDark ? "text-white" : "text-gray-900"
                                }`}>
                                    Add Company Property
                                </h3>
                                <p className={`text-sm ${
                                    isDark ? "text-gray-400" : "text-gray-600"
                                }`}>
                                    List a property directly under WubLand
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                console.log('❌ Close button clicked');
                                onClose();
                            }}
                            className={`p-2 rounded-lg ${
                                isDark
                                    ? "hover:bg-gray-700 text-gray-400"
                                    : "hover:bg-gray-100 text-gray-600"
                            } transition-colors`}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mt-4">
                        <div className="flex overflow-x-auto pb-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => {
                                            console.log('📌 Tab clicked:', tab.id);
                                            setActiveTab(tab.id);
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg mr-2 transition-all ${
                                            isActive
                                                ? isDark
                                                    ? "bg-amber-600 text-white"
                                                    : "bg-amber-100 text-amber-700"
                                                : isDark
                                                    ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="whitespace-nowrap">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {renderActiveSection()}

                    {/* Navigation buttons */}
                    <div className={`flex items-center justify-between mt-8 pt-6 border-t ${
                        isDark ? "border-gray-700" : "border-gray-200"
                    }`}>
                        <div className="flex gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-3 h-3 rounded-full ${
                                        activeTab === tab.id
                                            ? "bg-amber-600"
                                            : isDark
                                                ? "bg-gray-600"
                                                : "bg-gray-300"
                                    }`}
                                    title={tab.label}
                                />
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    console.log('❌ Cancel button clicked');
                                    onClose();
                                }}
                                className={`px-4 py-2 rounded-lg ${
                                    isDark
                                        ? "bg-gray-700 text-white hover:bg-gray-600"
                                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                } transition-colors`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || !property.title || !property.price || !property.location}
                                className={`px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Adding Property...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Add Property
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCompanyPropertyModal;