import React, { useState, useCallback, useEffect, useRef } from "react";
import {
    Building, Home, LandPlot, Key, CheckCircle,
    X, Check, Minus, Plus, Upload, Image as ImageIcon,
    FileText, Phone, Mail, MapPin, DollarSign,
    Bed, Bath, Layers, Maximize2, Crown, PlusCircle,
    Trash2, Calendar, Star, TrendingUp, AlertCircle,
    Building2, Castle, Warehouse, Car, TreePine,
    Shield, FileCheck, CreditCard, Landmark, Hammer
} from "lucide-react";
import { apiCall } from "../utils/api.endpoints";

const AddCompanyPropertyModal = ({
    theme,
    isOpen,
    onClose,
    onSuccess,
    setToast,
    currentUserId // Add this prop to get the current user ID
}) => {
    const [loading, setLoading] = useState(false);
    
    // Updated state to match your database schema
    const [property, setProperty] = useState({
        // Basic Info
        title: "",
        description: "",
        property_type: "residential",
        property_status: "active",
        address: "",
        city: "",
        state: "",
        region: "",
        neighborhood: "",
        country: "Ethiopia",
        zip_code: "",
        latitude: "",
        longitude: "",
        
        // Specifications
        beds: 1,
        baths: 1,
        sqft: "",
        lot_size: "",
        year_built: new Date().getFullYear(),
        garage_spaces: 0,
        parking_spaces: 0,
        
        // Pricing
        price: "",
        currency: "ETB",
        price_per_sqft: "",
        is_negotiable: true,
        deposit_amount: "",
        monthly_rent: "",
        listing_type: "sale",
        
        // Additional Info
        mls_number: "",
        mls_source: "",
        listing_date: new Date().toISOString().split('T')[0],
        expiration_date: "",
        features: [],
        amenities: [],
        property_tags: [],
        
        // Company specific
        property_source: "company_owned",
        company_project_name: "",
        development_stage: "completed",
        company_ownership_percentage: 100.00,
        
        // Financials
        tax_amount: "",
        hoa_fees: "",
        insurance_amount: "",
        est_payment: "",
        
        // Contact
        contactPhone: "",
        contactEmail: "",
        
        // Listing settings
        is_premium: false,
        is_featured: false,
        availability: "available",
        
        // Additional fields
        balcony: false,
        storageRoom: false,
        gardenArea: "",
        floorNumber: "",
        totalFloors: "",
        areaUnit: "sqm"
    });

    const [imageUploads, setImageUploads] = useState([]);
    const [floorPlans, setFloorPlans] = useState([]);
    const [propertyDocuments, setPropertyDocuments] = useState([]);
    const [activeTab, setActiveTab] = useState("basic");
    
    // Use refs to avoid re-renders
    const modalRef = useRef(null);
    const inputRef = useRef(null);

    const isDark = theme === "dark";

    // Updated property types to match your ENUM
    const propertyTypes = {
        residential: {
            label: "Residential",
            icon: Home,
            subtypes: ["house", "apartment", "condo", "townhouse", "villa", "penthouse", "cottage", "loft"],
            color: "from-blue-500 to-cyan-500"
        },
        commercial: {
            label: "Commercial",
            icon: Building,
            subtypes: ["commercial"],
            color: "from-purple-500 to-pink-500"
        },
        industrial: {
            label: "Industrial",
            icon: Warehouse,
            subtypes: ["industrial"],
            color: "from-orange-500 to-amber-500"
        },
        land: {
            label: "Land",
            icon: LandPlot,
            subtypes: ["land"],
            color: "from-green-500 to-emerald-500"
        }
    };

    // Match your features and amenities
    const featuresOptions = [
        "Swimming Pool", "Garden", "Parking", "Security", "Elevator",
        "Air Conditioning", "Heating", "Furnished", "Pet Friendly",
        "Balcony", "Terrace", "Gym", "Playground", "Concierge",
        "Wheelchair Access", "Storage", "Laundry", "Internet",
        "Smart Home", "CCTV", "Generator", "Water Tank", "Fireplace",
        "Central Heating", "Hardwood Floors", "Walk-in Closet", "Wine Cellar"
    ];

    const amenitiesOptions = [
        "Shopping Mall", "Hospital", "School", "Park", "Restaurant",
        "Supermarket", "Bank", "Pharmacy", "Public Transport",
        "Sports Center", "Cinema", "University", "Airport", "Gym",
        "Swimming Pool", "Playground", "Security", "Parking", "Beach",
        "Golf Course", "Tennis Court", "Clubhouse", "Business Center"
    ];

    const propertyTagsOptions = [
        "Waterfront", "Mountain View", "City View", "Gated Community",
        "New Construction", "Recently Renovated", "Energy Efficient",
        "Luxury", "Affordable", "Investment", "Fixer Upper", "Historic",
        "Modern", "Spacious", "Cozy", "Family Friendly", "Pet Friendly",
        "Senior Living", "Student Housing", "Corporate Housing"
    ];

    const developmentStages = [
        { value: "planning", label: "Planning" },
        { value: "construction", label: "Under Construction" },
        { value: "completed", label: "Completed" },
        { value: "launched", label: "Launched" }
    ];

    const tabs = [
        { id: "basic", label: "Basic Info", icon: Building, color: "from-blue-500 to-cyan-500" },
        { id: "specs", label: "Specifications", icon: Layers, color: "from-emerald-500 to-teal-500" },
        { id: "features", label: "Features", icon: Star, color: "from-amber-500 to-orange-500" },
        { id: "financial", label: "Financial", icon: CreditCard, color: "from-purple-500 to-pink-500" },
        { id: "media", label: "Media", icon: ImageIcon, color: "from-rose-500 to-red-500" },
        { id: "contact", label: "Contact", icon: Phone, color: "from-indigo-500 to-blue-500" }
    ];

    const getActiveTabColor = () => {
        const activeTabConfig = tabs.find(tab => tab.id === activeTab);
        return activeTabConfig ? activeTabConfig.color : "from-amber-500 to-orange-500";
    };

    const getPopupBackground = () => {
        return isDark
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
            : "bg-gradient-to-br from-amber-50 via-white to-gray-100";
    };

    const getCardBackground = () => {
        return isDark
            ? "bg-gray-800/80 border-gray-700"
            : "bg-white border-gray-200";
    };

    const getTextColor = () => {
        return isDark ? "text-white" : "text-gray-900";
    };

    const getSecondaryTextColor = () => {
        return isDark ? "text-gray-300" : "text-gray-600";
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProperty(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleNumberChange = (name, value) => {
        setProperty(prev => ({
            ...prev,
            [name]: typeof value === 'number' ? value : parseFloat(value) || 0
        }));
    };

    const handleFeatureToggle = (feature) => {
        setProperty(prev => ({
            ...prev,
            features: prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature]
        }));
    };

    const handleAmenityToggle = (amenity) => {
        setProperty(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleTagToggle = (tag) => {
        setProperty(prev => ({
            ...prev,
            property_tags: prev.property_tags.includes(tag)
                ? prev.property_tags.filter(t => t !== tag)
                : [...prev.property_tags, tag]
        }));
    };

    // Focus on input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 200);
        }
    }, [isOpen]);

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Image upload handler
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
                        type: 'image',
                        file_size: file.size,
                        mime_type: file.type,
                        width: 0,
                        height: 0
                    };
                }
                return null;
            });

            const uploadedImages = await Promise.all(uploadPromises);
            const validImages = uploadedImages.filter(img => img !== null);

            setImageUploads(prev => [...prev, ...validImages]);

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

    // Floor plan upload handler
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
                    const floorPlan = {
                        url: response.url,
                        caption: `Floor Plan ${floorPlans.length + 1}`,
                        type: 'floor_plan',
                        file_name: file.name,
                        file_size: file.size,
                        mime_type: file.type
                    };
                    return floorPlan;
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

    // Document upload handler
    const handleDocumentUpload = async (files, documentType) => {
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('document', file);
                formData.append('type', documentType);

                const response = await apiCall('UPLOAD_PROPERTY_DOCUMENT', {}, {
                    data: formData,
                    method: 'POST'
                });

                if (response && response.url) {
                    const document = {
                        url: response.url,
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        document_type: documentType,
                        file_name: file.name,
                        file_size: file.size,
                        mime_type: file.type
                    };
                    return document;
                }
                return null;
            });

            const uploadedDocs = await Promise.all(uploadPromises);
            const validDocs = uploadedDocs.filter(doc => doc !== null);

            setPropertyDocuments(prev => [...prev, ...validDocs]);

            setToast({
                show: true,
                message: `${validDocs.length} document(s) uploaded successfully`,
                type: "success",
            });
        } catch (error) {
            console.error('Error uploading documents:', error);
            setToast({
                show: true,
                message: "Failed to upload documents",
                type: "error",
            });
        }
    };

    const removeImage = (index) => {
        setImageUploads(prev => prev.filter((_, i) => i !== index));
    };

    const removeFloorPlan = (index) => {
        setFloorPlans(prev => prev.filter((_, i) => i !== index));
    };

    const removeDocument = (index) => {
        setPropertyDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            // Validate required fields
            if (!property.title || !property.price || !property.address) {
                setToast({
                    show: true,
                    message: "Please fill in all required fields (Title, Price, Address)",
                    type: "warning",
                });
                return;
            }

            // Calculate price per sqft if sqft is provided
            let pricePerSqft = "";
            if (property.sqft && property.price) {
                pricePerSqft = (parseFloat(property.price) / parseFloat(property.sqft)).toFixed(2);
            }

            // Prepare property data matching your database schema
            const propertyData = {
                // Basic Info
                title: property.title,
                description: property.description,
                property_type: property.property_type,
                property_status: property.property_status,
                address: property.address,
                city: property.city,
                state: property.state,
                region: property.region,
                neighborhood: property.neighborhood,
                country: property.country,
                zip_code: property.zip_code,
                latitude: property.latitude ? parseFloat(property.latitude) : null,
                longitude: property.longitude ? parseFloat(property.longitude) : null,
                
                // Specifications
                beds: parseInt(property.beds) || 0,
                baths: parseFloat(property.baths) || 0,
                sqft: property.sqft ? parseFloat(property.sqft) : null,
                lot_size: property.lot_size ? parseFloat(property.lot_size) : null,
                year_built: parseInt(property.year_built) || null,
                garage_spaces: parseInt(property.garage_spaces) || 0,
                parking_spaces: parseInt(property.parking_spaces) || 0,
                
                // Pricing
                price: parseFloat(property.price),
                currency: property.currency,
                price_per_sqft: pricePerSqft ? parseFloat(pricePerSqft) : null,
                is_negotiable: property.is_negotiable,
                deposit_amount: property.deposit_amount ? parseFloat(property.deposit_amount) : null,
                monthly_rent: property.monthly_rent ? parseFloat(property.monthly_rent) : null,
                listing_type: property.listing_type,
                
                // Additional Info
                mls_number: property.mls_number || null,
                mls_source: property.mls_source || null,
                listing_date: property.listing_date,
                expiration_date: property.expiration_date || null,
                features: JSON.stringify(property.features),
                amenities: JSON.stringify(property.amenities),
                property_tags: JSON.stringify(property.property_tags),
                
                // Company specific
                property_source: "company_owned",
                company_project_name: property.company_project_name || null,
                development_stage: property.development_stage,
                company_ownership_percentage: parseFloat(property.company_ownership_percentage) || 100.00,
                
                // Financials
                tax_amount: property.tax_amount ? parseFloat(property.tax_amount) : null,
                hoa_fees: property.hoa_fees ? parseFloat(property.hoa_fees) : null,
                insurance_amount: property.insurance_amount ? parseFloat(property.insurance_amount) : null,
                est_payment: property.est_payment ? parseFloat(property.est_payment) : null,
                
                // Listing settings
                is_premium: property.is_premium,
                is_featured: property.is_featured,
                
                // User references
                owner_user_id: currentUserId,
                created_by_user_id: currentUserId,
                assigned_broker_id: null,
                
                // Default values for analytics
                analytics_metadata: JSON.stringify({}),
                saved_by_users: JSON.stringify([]),
                viewed_by_users: JSON.stringify([]),
                price_history: JSON.stringify([]),
                tax_history: JSON.stringify([]),
                nearby_schools: JSON.stringify([]),
                floor_plans: JSON.stringify(floorPlans),
                
                // Images and documents will be uploaded separately
                images: imageUploads,
                documents: propertyDocuments
            };

            console.log("Submitting property data:", propertyData);

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
                    property_type: "residential",
                    property_status: "active",
                    address: "",
                    city: "",
                    state: "",
                    region: "",
                    neighborhood: "",
                    country: "Ethiopia",
                    zip_code: "",
                    latitude: "",
                    longitude: "",
                    beds: 1,
                    baths: 1,
                    sqft: "",
                    lot_size: "",
                    year_built: new Date().getFullYear(),
                    garage_spaces: 0,
                    parking_spaces: 0,
                    price: "",
                    currency: "ETB",
                    price_per_sqft: "",
                    is_negotiable: true,
                    deposit_amount: "",
                    monthly_rent: "",
                    listing_type: "sale",
                    mls_number: "",
                    mls_source: "",
                    listing_date: new Date().toISOString().split('T')[0],
                    expiration_date: "",
                    features: [],
                    amenities: [],
                    property_tags: [],
                    property_source: "company_owned",
                    company_project_name: "",
                    development_stage: "completed",
                    company_ownership_percentage: 100.00,
                    tax_amount: "",
                    hoa_fees: "",
                    insurance_amount: "",
                    est_payment: "",
                    contactPhone: "",
                    contactEmail: "",
                    is_premium: false,
                    is_featured: false,
                    availability: "available",
                    balcony: false,
                    storageRoom: false,
                    gardenArea: "",
                    floorNumber: "",
                    totalFloors: "",
                    areaUnit: "sqm"
                });
                
                setImageUploads([]);
                setFloorPlans([]);
                setPropertyDocuments([]);

                // Close modal and trigger success callback
                onClose();
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error('Error adding company property:', error);
            setToast({
                show: true,
                message: `Failed: ${error.message || "Unknown error"}`,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    // Basic Info Section
    const renderBasicInfoSection = () => (
        <div className="space-y-6">
            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Property Type
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(propertyTypes).map(([key, config]) => {
                        const Icon = config.icon;
                        const isSelected = property.property_type === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setProperty(prev => ({
                                        ...prev,
                                        property_type: key
                                    }));
                                }}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 hover:scale-[1.02] ${
                                    isSelected
                                        ? `border-white shadow-lg bg-gradient-to-br ${config.color} text-white`
                                        : `${getCardBackground()} hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                                            isDark ? 'border-gray-700' : 'border-gray-200'
                                        }`
                                }`}
                            >
                                <Icon className={`w-6 h-6 mb-2 ${
                                    isSelected ? 'text-white' : (isDark ? 'text-gray-400' : 'text-gray-500')
                                }`} />
                                <span className={`text-sm font-medium ${
                                    isSelected ? 'text-white' : getTextColor()
                                }`}>
                                    {config.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Basic Details
                </h4>
                <div className="space-y-4">
                    <div>
                        <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                            Property Title *
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            name="title"
                            value={property.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Modern 3-Bedroom Apartment in Bole"
                            className={`w-full p-3 rounded-lg border transition-all duration-200 focus:scale-[1.02] ${
                                isDark
                                    ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            }`}
                        />
                    </div>

                    <div>
                        <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={property.description}
                            onChange={handleInputChange}
                            placeholder="Describe the property in detail..."
                            rows="4"
                            className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                                isDark
                                    ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            }`}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                                Price (ETB) *
                            </label>
                            <div className="flex gap-2">
                                <select
                                    name="listing_type"
                                    value={property.listing_type}
                                    onChange={handleInputChange}
                                    className={`w-1/3 p-3 rounded-lg border ${
                                        isDark
                                            ? "bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    }`}
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
                                    className={`flex-1 p-3 rounded-lg border transition-all duration-200 focus:scale-[1.02] ${
                                        isDark
                                            ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    }`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                                Property Status
                            </label>
                            <select
                                name="property_status"
                                value={property.property_status}
                                onChange={handleInputChange}
                                className={`w-full p-3 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                        : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                }`}
                            >
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="sold">Sold</option>
                                <option value="rented">Rented</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Location Details
                </h4>
                <div className="space-y-4">
                    <div>
                        <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                            Full Address *
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={property.address}
                            onChange={handleInputChange}
                            placeholder="Street address, house number"
                            className={`w-full p-3 rounded-lg border transition-all duration-200 focus:scale-[1.02] ${
                                isDark
                                    ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            }`}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                                City *
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={property.city}
                                onChange={handleInputChange}
                                placeholder="City"
                                className={`w-full p-3 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                }`}
                            />
                        </div>

                        <div>
                            <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                                State/Region
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={property.state}
                                onChange={handleInputChange}
                                placeholder="State or Region"
                                className={`w-full p-3 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                }`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                                Neighborhood
                            </label>
                            <input
                                type="text"
                                name="neighborhood"
                                value={property.neighborhood}
                                onChange={handleInputChange}
                                placeholder="Neighborhood or area"
                                className={`w-full p-3 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                }`}
                            />
                        </div>

                        <div>
                            <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                                ZIP/Postal Code
                            </label>
                            <input
                                type="text"
                                name="zip_code"
                                value={property.zip_code}
                                onChange={handleInputChange}
                                placeholder="ZIP code"
                                className={`w-full p-3 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                }`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // SPECIFICATIONS SECTION
    const renderSpecificationsSection = () => (
        <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
            <h4 className={`text-lg font-semibold mb-6 ${getTextColor()}`}>
                Property Specifications
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: "Bedrooms", name: "beds", icon: Bed, value: property.beds, step: 1 },
                    { label: "Bathrooms", name: "baths", icon: Bath, value: property.baths, step: 0.5 },
                    { label: "Garage Spaces", name: "garage_spaces", icon: Car, value: property.garage_spaces, step: 1 },
                    { label: "Parking Spaces", name: "parking_spaces", icon: Car, value: property.parking_spaces, step: 1 }
                ].map((item) => (
                    <div key={item.name} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                            {item.label}
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleNumberChange(item.name, Math.max(0, item.value - item.step))}
                                className={`p-2 rounded-lg transition-colors ${
                                    isDark
                                        ? "bg-gray-600 hover:bg-gray-500 text-white"
                                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                                }`}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className={`px-4 py-2 rounded-lg min-w-[60px] text-center font-medium ${
                                isDark ? "bg-gray-600 text-white" : "bg-white text-gray-900"
                            }`}>
                                {item.value}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleNumberChange(item.name, item.value + item.step)}
                                className={`p-2 rounded-lg transition-colors ${
                                    isDark
                                        ? "bg-gray-600 hover:bg-gray-500 text-white"
                                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                                }`}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                <div>
                    <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                        Square Feet (Sqft)
                    </label>
                    <input
                        type="number"
                        name="sqft"
                        value={property.sqft}
                        onChange={handleInputChange}
                        placeholder="Total area in sqft"
                        className={`w-full p-3 rounded-lg border ${
                            isDark
                                ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        }`}
                    />
                </div>

                <div>
                    <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                        Lot Size (Sqft)
                    </label>
                    <input
                        type="number"
                        name="lot_size"
                        value={property.lot_size}
                        onChange={handleInputChange}
                        placeholder="Lot size in sqft"
                        className={`w-full p-3 rounded-lg border ${
                            isDark
                                ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        }`}
                    />
                </div>

                <div>
                    <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                        Year Built
                    </label>
                    <input
                        type="number"
                        name="year_built"
                        value={property.year_built}
                        onChange={handleInputChange}
                        placeholder="Year"
                        min="1800"
                        max={new Date().getFullYear()}
                        className={`w-full p-3 rounded-lg border ${
                            isDark
                                ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        }`}
                    />
                </div>
            </div>
        </div>
    );

    // FEATURES SECTION
    const renderFeaturesSection = () => (
        <div className="space-y-6">
            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Property Features
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {featuresOptions.map(feature => (
                        <button
                            key={feature}
                            type="button"
                            onClick={() => handleFeatureToggle(feature)}
                            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 justify-center transition-all duration-200 hover:scale-[1.02] ${
                                property.features.includes(feature)
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                                    : `${getCardBackground()} hover:bg-gray-50 dark:hover:bg-gray-700/50`
                            } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                        >
                            <Check className={`w-3 h-3 ${
                                property.features.includes(feature) ? "opacity-100" : "opacity-0"
                            }`} />
                            {feature}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Nearby Amenities
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {amenitiesOptions.map(amenity => (
                        <button
                            key={amenity}
                            type="button"
                            onClick={() => handleAmenityToggle(amenity)}
                            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 justify-center transition-all duration-200 hover:scale-[1.02] ${
                                property.amenities.includes(amenity)
                                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                                    : `${getCardBackground()} hover:bg-gray-50 dark:hover:bg-gray-700/50`
                            } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                        >
                            <Check className={`w-3 h-3 ${
                                property.amenities.includes(amenity) ? "opacity-100" : "opacity-0"
                            }`} />
                            {amenity}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Property Tags
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {propertyTagsOptions.map(tag => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => handleTagToggle(tag)}
                            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 justify-center transition-all duration-200 hover:scale-[1.02] ${
                                property.property_tags.includes(tag)
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                                    : `${getCardBackground()} hover:bg-gray-50 dark:hover:bg-gray-700/50`
                            } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                        >
                            <Check className={`w-3 h-3 ${
                                property.property_tags.includes(tag) ? "opacity-100" : "opacity-0"
                            }`} />
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // FINANCIAL SECTION
    const renderFinancialSection = () => (
        <div className="space-y-6">
            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Financial Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: "Tax Amount (ETB/year)", name: "tax_amount", value: property.tax_amount, placeholder: "Annual property tax" },
                        { label: "HOA Fees (ETB/month)", name: "hoa_fees", value: property.hoa_fees, placeholder: "Monthly HOA fees" },
                        { label: "Insurance Amount (ETB/year)", name: "insurance_amount", value: property.insurance_amount, placeholder: "Annual insurance" },
                        { label: "Estimated Monthly Payment (ETB)", name: "est_payment", value: property.est_payment, placeholder: "Estimated monthly payment" },
                        { label: "Deposit Amount (ETB)", name: "deposit_amount", value: property.deposit_amount, placeholder: "Security deposit" },
                        { label: "Monthly Rent (ETB)", name: "monthly_rent", value: property.monthly_rent, placeholder: "For rental properties" }
                    ].map((field) => (
                        <div key={field.name}>
                            <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                                {field.label}
                            </label>
                            <input
                                type="number"
                                name={field.name}
                                value={field.value}
                                onChange={handleInputChange}
                                placeholder={field.placeholder}
                                className={`w-full p-3 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                }`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Company Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                            Project Name
                        </label>
                        <input
                            type="text"
                            name="company_project_name"
                            value={property.company_project_name}
                            onChange={handleInputChange}
                            placeholder="Company project name"
                            className={`w-full p-3 rounded-lg border ${
                                isDark
                                    ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            }`}
                        />
                    </div>

                    <div>
                        <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                            Development Stage
                        </label>
                        <select
                            name="development_stage"
                            value={property.development_stage}
                            onChange={handleInputChange}
                            className={`w-full p-3 rounded-lg border ${
                                isDark
                                    ? "bg-gray-700/50 border-gray-600 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                                    : "bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            }`}
                        >
                            {developmentStages.map(stage => (
                                <option key={stage.value} value={stage.value}>{stage.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
                            Company Ownership (%)
                        </label>
                        <input
                            type="number"
                            name="company_ownership_percentage"
                            value={property.company_ownership_percentage}
                            onChange={handleInputChange}
                            placeholder="100"
                            min="0"
                            max="100"
                            step="0.01"
                            className={`w-full p-3 rounded-lg border ${
                                isDark
                                    ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            }`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    // MEDIA SECTION
    const renderMediaSection = () => (
        <div className="space-y-6">
            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Property Images
                </h4>
                <div className={`p-8 border-2 border-dashed rounded-xl text-center transition-all duration-200 hover:scale-[1.01] ${
                    isDark
                        ? "border-gray-600 bg-gray-800/50 hover:border-rose-500"
                        : "border-gray-300 bg-gray-50 hover:border-rose-500"
                }`}>
                    <input
                        type="file"
                        id="property-images"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="hidden"
                    />
                    <label htmlFor="property-images" className="cursor-pointer">
                        <Upload className={`w-12 h-12 mx-auto mb-3 ${
                            isDark ? "text-gray-500" : "text-gray-400"
                        }`} />
                        <p className={`text-lg font-medium ${getTextColor()} mb-1`}>
                            Click to upload property images
                        </p>
                        <p className={`text-sm ${getSecondaryTextColor()}`}>
                            Upload up to 20 images (JPEG, PNG, WebP)
                        </p>
                    </label>
                </div>

                {imageUploads.length > 0 && (
                    <div className="mt-4">
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {imageUploads.map((image, index) => (
                                <div key={index} className="relative group">
                                    <div className="aspect-square rounded-lg overflow-hidden">
                                        <img
                                            src={image.thumbnail || image.url}
                                            alt={`Property ${index + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Documents & Plans
                </h4>
                <div className="space-y-4">
                    <div className={`p-6 border-2 border-dashed rounded-xl text-center ${
                        isDark
                            ? "border-gray-600 bg-gray-800/50 hover:border-blue-500"
                            : "border-gray-300 bg-gray-50 hover:border-blue-500"
                    } transition-colors`}>
                        <input
                            type="file"
                            id="floor-plans"
                            multiple
                            accept="image/*,.pdf"
                            onChange={(e) => handleFloorPlanUpload(e.target.files)}
                            className="hidden"
                        />
                        <label htmlFor="floor-plans" className="cursor-pointer">
                            <Maximize2 className={`w-12 h-12 mx-auto mb-3 ${
                                isDark ? "text-gray-500" : "text-gray-400"
                            }`} />
                            <p className={`font-medium ${getTextColor()} mb-1`}>
                                Upload Floor Plans
                            </p>
                            <p className={`text-sm ${getSecondaryTextColor()}`}>
                                JPG, PNG, or PDF files
                            </p>
                        </label>
                    </div>

                    {floorPlans.length > 0 && (
                        <div className="space-y-2">
                            {floorPlans.map((plan, index) => (
                                <div key={index} className={`p-3 rounded-lg border ${
                                    isDark ? "bg-gray-700/30 border-gray-600" : "bg-gray-50 border-gray-200"
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <FileText className={`w-8 h-8 ${
                                            isDark ? "text-blue-400" : "text-blue-600"
                                        }`} />
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${getTextColor()}`}>
                                                {plan.caption}
                                            </p>
                                            <p className={`text-xs ${getSecondaryTextColor()}`}>
                                                {plan.file_name}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFloorPlan(index)}
                                            className="p-2 text-red-500 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // CONTACT SECTION
    const renderContactSection = () => (
        <div className="space-y-6">
            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
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
                                    ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            }`}
                        />
                    </div>

                    <div>
                        <label className={`block mb-2 text-sm ${getSecondaryTextColor()}`}>
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
                                    ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            }`}
                        />
                    </div>
                </div>
            </div>

            <div className={`p-4 rounded-xl border ${getCardBackground()} shadow-sm`}>
                <h4 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>
                    Listing Settings
                </h4>
                <div className="space-y-4">
                    <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                        isDark
                            ? "border-gray-600 bg-gray-800/50 hover:bg-gray-800"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}>
                        <input
                            type="checkbox"
                            name="is_premium"
                            checked={property.is_premium}
                            onChange={handleInputChange}
                            className="w-4 h-4 rounded"
                        />
                        <div>
                            <p className={`font-medium ${getTextColor()}`}>Premium Listing</p>
                            <p className={`text-sm ${getSecondaryTextColor()}`}>
                                Feature this property prominently with enhanced visibility
                            </p>
                        </div>
                        <Star className={`w-5 h-5 ml-auto ${
                            property.is_premium ? "text-amber-500" : (isDark ? "text-gray-500" : "text-gray-400")
                        }`} />
                    </label>

                    <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                        isDark
                            ? "border-gray-600 bg-gray-800/50 hover:bg-gray-800"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}>
                        <input
                            type="checkbox"
                            name="is_featured"
                            checked={property.is_featured}
                            onChange={handleInputChange}
                            className="w-4 h-4 rounded"
                        />
                        <div>
                            <p className={`font-medium ${getTextColor()}`}>Featured Property</p>
                            <p className={`text-sm ${getSecondaryTextColor()}`}>
                                Show in featured section on homepage
                            </p>
                        </div>
                        <TrendingUp className={`w-5 h-5 ml-auto ${
                            property.is_featured ? "text-green-500" : (isDark ? "text-gray-500" : "text-gray-400")
                        }`} />
                    </label>
                </div>
            </div>
        </div>
    );

    const renderActiveSection = () => {
        switch (activeTab) {
            case "basic":
                return renderBasicInfoSection();
            case "specs":
                return renderSpecificationsSection();
            case "features":
                return renderFeaturesSection();
            case "financial":
                return renderFinancialSection();
            case "media":
                return renderMediaSection();
            case "contact":
                return renderContactSection();
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110]" ref={modalRef}>
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div
                    className={`relative rounded-2xl shadow-2xl max-w-6xl w-full mx-auto overflow-hidden border ${
                        isDark ? 'border-gray-600' : 'border-gray-200'
                    } ${getPopupBackground()} max-h-[90vh] overflow-y-auto`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`p-6 relative overflow-hidden bg-gradient-to-r ${getActiveTabColor()}`}>
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
                        </div>

                        <button
                            onClick={onClose}
                            className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
                                isDark
                                    ? 'text-white/80 hover:bg-white/20 hover:text-white'
                                    : 'text-white/90 hover:bg-white/30 hover:text-white'
                            }`}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${
                                    isDark ? 'bg-black/20' : 'bg-white/20'
                                }`}>
                                    <PlusCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Add Company Property</h3>
                                    <p className="text-white/80">
                                        List a property directly under WubLand
                                    </p>
                                </div>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="mt-6 flex overflow-x-auto pb-2 gap-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                                                isActive
                                                    ? "bg-white/20 text-white backdrop-blur-sm"
                                                    : "text-white/70 hover:text-white hover:bg-white/10"
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{tab.label}</span>
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
                        <div className={`mt-8 pt-6 border-t ${
                            isDark ? "border-gray-700" : "border-gray-200"
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-2 h-2 rounded-full transition-all ${
                                                activeTab === tab.id
                                                    ? `bg-gradient-to-r ${tab.color}`
                                                    : (isDark ? "bg-gray-600" : "bg-gray-300")
                                            }`}
                                            title={tab.label}
                                        />
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className={`px-6 py-2 rounded-xl transition-all duration-200 ${
                                            isDark
                                                ? "bg-gray-700 text-white hover:bg-gray-600 hover:scale-105"
                                                : "bg-gray-200 text-gray-800 hover:bg-gray-300 hover:scale-105"
                                        }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading || !property.title || !property.price || !property.address}
                                        className={`px-8 py-2 rounded-xl bg-gradient-to-r ${getActiveTabColor()} text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200 flex items-center gap-2 shadow-lg`}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Adding Property...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                <span>Add Property</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCompanyPropertyModal;