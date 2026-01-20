import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    Home, Building, CheckCircle, XCircle, Eye,
    AlertCircle, Search, Filter, Calendar, MapPin,
    DollarSign, Bed, Bath, Layers, Maximize2,
    Edit, Trash2, Upload, ExternalLink, Download,
    FileText, Image, Users, Clock, RefreshCw,
    Check, X, Loader2, ChevronRight, ZoomIn,
    ZoomOut, RotateCw, Star, TrendingUp, ThumbsUp,
    ThumbsDown, MessageCircle, Archive, Send,
    FileCheck, Shield, Lock, Unlock, Globe,
    Phone, Mail, User, Building2, Crown,
    PlusCircle, Settings, Grid, List, Hash,
    MoreVertical, Heart, Share2, Copy, Award,
    Award as VerifiedBadge, FileSearch, History,
    Key, CreditCard, Home as HomeIcon, Warehouse,
    LandPlot, Hotel, Castle, TreePine, Waves,
    Mountain, Building as Apartment,
    Minus, Plus
} from "lucide-react";
import { apiCall } from "../../../utils/api.endpoints";
import AddCompanyPropertyModal from "../../../components/AddCompanyPropertyModal";

const PropertiesRequest = ({ theme, setToast }) => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [approvedProperties, setApprovedProperties] = useState([]);
    const [rejectedProperties, setRejectedProperties] = useState([]);
    const [companyProperties, setCompanyProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterPrice, setFilterPrice] = useState("all");
    const [filterLocation, setFilterLocation] = useState("all");
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [propertyImages, setPropertyImages] = useState([]);
    const [propertyDocuments, setPropertyDocuments] = useState([]);
    const [showPropertyViewer, setShowPropertyViewer] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showResubmissionModal, setShowResubmissionModal] = useState(false);
    const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [actionType, setActionType] = useState(null);
    const [processingAction, setProcessingAction] = useState(null);
    const [activeTab, setActiveTab] = useState("pending");
    const [selectedImage, setSelectedImage] = useState(null);
    const [propertyStats, setPropertyStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        company: 0,
        total: 0,
        today: 0
    });

    // Form states for adding company property
    const [newProperty, setNewProperty] = useState({
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
        yearBuilt: new Date().getFullYear(),
        features: [],
        amenities: [],
        images: [],
        documents: [],
        contactPhone: "",
        contactEmail: "",
        isPremium: false,
        isFeatured: false,
        listingType: "sale", // sale, rent, lease
        availability: "available"
    });

    const [imageUploads, setImageUploads] = useState([]);
    const [documentUploads, setDocumentUploads] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});

    // Refs - CRITICAL FIX: Add refs to prevent re-renders
    const isFetching = useRef(false);
    const lastFetchTime = useRef(0);
    const modalMountedRef = useRef(false);
    const ignoreApiErrorsRef = useRef(false);

    const isDark = theme === "dark";

    // Color configuration - useMemo to prevent re-creation
    const colors = useMemo(() => ({
        primary: isDark ? "amber-400" : "amber-600",
        primaryBg: isDark ? "amber-400/10" : "amber-50",
        primaryHover: isDark ? "amber-500" : "amber-700",
        success: isDark ? "green-400" : "green-600",
        successBg: isDark ? "green-400/10" : "green-50",
        danger: isDark ? "red-400" : "red-600",
        dangerBg: isDark ? "red-400/10" : "red-50",
        warning: isDark ? "orange-400" : "orange-600",
        warningBg: isDark ? "orange-400/10" : "orange-50",
        info: isDark ? "blue-400" : "blue-600",
        infoBg: isDark ? "blue-400/10" : "blue-50",
    }), [isDark]);

    // Property types configuration - useMemo
    const propertyTypes = useMemo(() => ({
        residential: {
            label: "Residential",
            icon: Home,
            subtypes: ["apartment", "villa", "condo", "townhouse", "penthouse"],
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
    }), []);

    // Features and amenities options - useMemo
    const featuresOptions = useMemo(() => [
        "Swimming Pool", "Garden", "Parking", "Security", "Elevator",
        "Air Conditioning", "Heating", "Furnished", "Pet Friendly",
        "Balcony", "Terrace", "Gym", "Playground", "Concierge",
        "Wheelchair Access", "Storage", "Laundry", "Internet"
    ], []);

    const amenitiesOptions = useMemo(() => [
        "Shopping Mall", "Hospital", "School", "Park", "Restaurant",
        "Supermarket", "Bank", "Pharmacy", "Public Transport",
        "Sports Center", "Cinema", "University", "Airport"
    ], []);

    // CRITICAL FIX: Modified useEffect to ignore API errors when modal is open
    useEffect(() => {
        fetchAllData();

        const interval = setInterval(() => {
            // Don't fetch stats if modal is open
            if (!showAddPropertyModal && !showPropertyViewer && !showFeedbackModal && !showResubmissionModal) {
                fetchPropertyStats();
            }
        }, 300000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    // CRITICAL FIX: Add useEffect to track modal state
    useEffect(() => {
        if (showAddPropertyModal) {
            modalMountedRef.current = true;
            ignoreApiErrorsRef.current = true; // Ignore API errors when modal is open
        } else {
            // Small delay before re-enabling API calls
            const timer = setTimeout(() => {
                modalMountedRef.current = false;
                ignoreApiErrorsRef.current = false;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showAddPropertyModal]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchPendingRequests(),
                fetchApprovedProperties(),
                fetchRejectedProperties(),
                fetchCompanyProperties(),
                fetchPropertyStats()
            ]);
        } catch (error) {
            // CRITICAL: Don't show toast if modal is open
            if (!ignoreApiErrorsRef.current) {
                console.error("Error fetching data:", error);
                showToast("Failed to load property data", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await apiCall("GET_PENDING_PROPERTIES");
            if (response && Array.isArray(response.properties)) {
                setPendingRequests(response.properties);
            } else {
                setPendingRequests([]);
            }
        } catch (error) {
            // CRITICAL: Silently fail if modal is open
            if (!ignoreApiErrorsRef.current) {
                console.error("Error fetching pending requests:", error);
                setPendingRequests([]);
            }
        }
    };

    const fetchApprovedProperties = async () => {
        try {
            const response = await apiCall("GET_APPROVED_PROPERTIES");
            if (Array.isArray(response?.properties || response)) {
                const properties = Array.isArray(response) ? response : response.properties;
                setApprovedProperties(properties);
            } else {
                setApprovedProperties([]);
            }
        } catch (error) {
            if (!ignoreApiErrorsRef.current) {
                console.error("Error fetching approved properties:", error);
                setApprovedProperties([]);
            }
        }
    };

    const fetchRejectedProperties = async () => {
        try {
            const response = await apiCall("GET_REJECTED_PROPERTIES");
            if (Array.isArray(response?.properties || response)) {
                const properties = Array.isArray(response) ? response : response.properties;
                setRejectedProperties(properties);
            } else {
                setRejectedProperties([]);
            }
        } catch (error) {
            if (!ignoreApiErrorsRef.current) {
                console.error("Error fetching rejected properties:", error);
                setRejectedProperties([]);
            }
        }
    };

    const fetchCompanyProperties = async () => {
        try {
            const response = await apiCall("GET_COMPANY_PROPERTIES");
            if (Array.isArray(response?.properties || response)) {
                const properties = Array.isArray(response) ? response : response.properties;
                setCompanyProperties(properties);
            } else {
                setCompanyProperties([]);
            }
        } catch (error) {
            if (!ignoreApiErrorsRef.current) {
                console.error("Error fetching company properties:", error);
                setCompanyProperties([]);
            }
        }
    };

    const fetchPropertyStats = async () => {
        // CRITICAL: Don't fetch if modal is open
        if (modalMountedRef.current || ignoreApiErrorsRef.current) {
            return;
        }
        
        try {
            const response = await apiCall("GET_PROPERTY_STATS");
            if (response && response.stats) {
                const stats = response.stats;
                setPropertyStats({
                    pending: parseInt(stats.pending) || 0,
                    approved: parseInt(stats.approved) || 0,
                    rejected: parseInt(stats.rejected) || 0,
                    company: parseInt(stats.company) || 0,
                    total: parseInt(stats.total) || 0,
                    today: parseInt(stats.today) || 0
                });
            }
        } catch (error) {
            if (!ignoreApiErrorsRef.current) {
                console.error("Error fetching property stats:", error);
            }
        }
    };

    const fetchPropertyDetails = async (propertyId) => {
        try {
            const response = await apiCall("GET_PROPERTY_DETAILS", { id: propertyId });
            if (response && response.property) {
                return response.property;
            }
            return null;
        } catch (error) {
            console.error("Error fetching property details:", error);
            return null;
        }
    };

    const handleViewProperty = async (property) => {
        setSelectedProperty(property);
        setProcessingAction(property.id);

        try {
            const details = await fetchPropertyDetails(property.id);
            if (details) {
                setPropertyImages(details.images || []);
                setPropertyDocuments(details.documents || []);
            }
            setShowPropertyViewer(true);
        } catch (error) {
            console.error("Error loading property details:", error);
        } finally {
            setProcessingAction(null);
        }
    };

    const handleOpenFeedbackModal = (property, type) => {
        setSelectedProperty(property);
        setActionType(type);

        // Generate auto message
        if (type === 'approve') {
            setFeedbackText(`Congratulations! Your property listing "${property.title}" has been approved and is now live on WubLand. You can view it at: wubland.com/properties/${property.id}`);
        } else if (type === 'reject') {
            setFeedbackText(`Dear ${property.broker_name || 'Broker'},\n\nYour property listing "${property.title}" could not be approved at this time. The submitted information requires further verification.\n\nPlease review the following areas:\n- Property images quality\n- Document completeness\n- Price verification\n\nContact support for specific details.`);
        } else {
            setFeedbackText("");
        }

        if (type === 'resubmission') {
            setShowResubmissionModal(true);
        } else {
            setShowFeedbackModal(true);
        }
    };

    const handlePropertyAction = async (action) => {
        if (!selectedProperty || !actionType) return;

        try {
            setProcessingAction(`${actionType}-${selectedProperty.id}`);

            let endpointKey;
            let payload = {
                feedback: feedbackText.trim(),
                propertyId: selectedProperty.id
            };

            if (actionType === 'approve') {
                endpointKey = 'APPROVE_PROPERTY';
                payload = {
                    ...payload,
                    status: 'approved',
                    approvedBy: 'admin',
                    approvedAt: new Date().toISOString()
                };
            } else if (actionType === 'reject') {
                endpointKey = 'REJECT_PROPERTY';
                payload = {
                    ...payload,
                    status: 'rejected',
                    rejectedBy: 'admin',
                    rejectedAt: new Date().toISOString()
                };
            } else if (actionType === 'resubmission') {
                endpointKey = 'REQUEST_PROPERTY_RESUBMISSION';
                payload = {
                    ...payload,
                    status: 'needs_resubmission',
                    resubmissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                };
            }

            const response = await apiCall(endpointKey, {}, {
                data: payload,
                method: 'POST'
            });

            if (response && response.success) {
                // Update local state
                if (actionType === 'approve') {
                    setPendingRequests(prev => prev.filter(p => p.id !== selectedProperty.id));
                    setApprovedProperties(prev => [selectedProperty, ...prev]);
                    setRejectedProperties(prev => prev.filter(p => p.id !== selectedProperty.id));
                } else if (actionType === 'reject') {
                    setPendingRequests(prev => prev.filter(p => p.id !== selectedProperty.id));
                    setRejectedProperties(prev => [selectedProperty, ...prev]);
                    setApprovedProperties(prev => prev.filter(p => p.id !== selectedProperty.id));
                } else if (actionType === 'resubmission') {
                    setPendingRequests(prev => prev.map(p =>
                        p.id === selectedProperty.id
                            ? { ...p, status: 'needs_resubmission' }
                            : p
                    ));
                }

                showToast(
                    `Property ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'marked for resubmission'} successfully.`,
                    "success"
                );

                // Close modals
                setShowFeedbackModal(false);
                setShowResubmissionModal(false);
                setFeedbackText("");
                setActionType(null);
                setSelectedProperty(null);

                // Refresh stats
                await fetchPropertyStats();
            }
        } catch (error) {
            console.error('Error:', error);
            showToast(`Failed: ${error.message}`, "error");
        } finally {
            setProcessingAction(null);
        }
    };

    // CRITICAL FIX: Wrap this function with useCallback
    const handleAddCompanyPropertyClick = useCallback(() => {
        console.log('🎯 Opening company property modal');
        setShowAddPropertyModal(true);
    }, []);

    const handleAddCompanyProperty = async () => {
        try {
            setProcessingAction('add-property');

            // Validate required fields
            if (!newProperty.title || !newProperty.price || !newProperty.location) {
                showToast("Please fill in all required fields", "warning");
                return;
            }

            // Prepare property data
            const propertyData = {
                ...newProperty,
                isCompanyProperty: true,
                status: 'approved',
                listedBy: 'company',
                listedAt: new Date().toISOString(),
                images: imageUploads,
                documents: documentUploads
            };

            const response = await apiCall('ADD_COMPANY_PROPERTY', {}, {
                data: propertyData,
                method: 'POST'
            });

            if (response && response.success) {
                showToast("Company property listed successfully!", "success");

                // Reset form
                setNewProperty({
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
                    yearBuilt: new Date().getFullYear(),
                    features: [],
                    amenities: [],
                    images: [],
                    documents: [],
                    contactPhone: "",
                    contactEmail: "",
                    isPremium: false,
                    isFeatured: false,
                    listingType: "sale",
                    availability: "available"
                });
                setImageUploads([]);
                setDocumentUploads([]);
                setShowAddPropertyModal(false);

                // Refresh company properties
                await fetchCompanyProperties();
                await fetchPropertyStats();
            }
        } catch (error) {
            console.error('Error adding company property:', error);
            showToast(`Failed: ${error.message}`, "error");
        } finally {
            setProcessingAction(null);
        }
    };

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
                        caption: file.name
                    };
                }
                return null;
            });

            const uploadedImages = await Promise.all(uploadPromises);
            const validImages = uploadedImages.filter(img => img !== null);

            setImageUploads(prev => [...prev, ...validImages]);
            setNewProperty(prev => ({
                ...prev,
                images: [...prev.images, ...validImages]
            }));

            showToast(`${validImages.length} image(s) uploaded successfully`, "success");
        } catch (error) {
            console.error('Error uploading images:', error);
            showToast("Failed to upload images", "error");
        }
    };

    const handleDocumentUpload = async (files) => {
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('document', file);

                const response = await apiCall('UPLOAD_PROPERTY_DOCUMENT', {}, {
                    data: formData,
                    method: 'POST'
                });

                if (response && response.url) {
                    return {
                        url: response.url,
                        name: file.name,
                        type: file.type,
                        size: file.size
                    };
                }
                return null;
            });

            const uploadedDocs = await Promise.all(uploadPromises);
            const validDocs = uploadedDocs.filter(doc => doc !== null);

            setDocumentUploads(prev => [...prev, ...validDocs]);
            setNewProperty(prev => ({
                ...prev,
                documents: [...prev.documents, ...validDocs]
            }));

            showToast(`${validDocs.length} document(s) uploaded successfully`, "success");
        } catch (error) {
            console.error('Error uploading documents:', error);
            showToast("Failed to upload documents", "error");
        }
    };

    const handleDeleteCompanyProperty = async (propertyId) => {
        if (!confirm("Are you sure you want to delete this company property?")) return;

        try {
            setProcessingAction(`delete-${propertyId}`);

            const response = await apiCall('DELETE_COMPANY_PROPERTY', { id: propertyId }, {
                method: 'DELETE'
            });

            if (response && response.success) {
                setCompanyProperties(prev => prev.filter(p => p.id !== propertyId));
                showToast("Property deleted successfully", "success");
                await fetchPropertyStats();
            }
        } catch (error) {
            console.error('Error deleting property:', error);
            showToast(`Failed: ${error.message}`, "error");
        } finally {
            setProcessingAction(null);
        }
    };

    const showToast = (message, type = "info") => {
        if (setToast) {
            setToast({
                show: true,
                message,
                type,
            });
        }
    };

    const getCurrentProperties = () => {
        switch (activeTab) {
            case 'pending':
                return pendingRequests.filter(property =>
                    ['pending', 'submitted', 'reviewing', 'needs_resubmission'].includes(property.status)
                );
            case 'approved': return approvedProperties;
            case 'rejected': return rejectedProperties;
            case 'company': return companyProperties;
            default: return [];
        }
    };

    // CRITICAL FIX: Memoize filteredProperties to prevent re-renders
    const filteredProperties = useMemo(() => {
        const currentProperties = getCurrentProperties();
        return currentProperties.filter(property => {
            const matchesSearch = searchTerm === "" ||
                (property.title && property.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (property.location && property.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (property.broker_name && property.broker_name.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesType = filterType === "all" || property.type === filterType;

            // Price filter logic
            let matchesPrice = true;
            if (filterPrice !== "all" && property.price) {
                const price = parseFloat(property.price);
                switch (filterPrice) {
                    case "under-100k": matchesPrice = price < 100000; break;
                    case "100k-500k": matchesPrice = price >= 100000 && price <= 500000; break;
                    case "500k-1m": matchesPrice = price > 500000 && price <= 1000000; break;
                    case "over-1m": matchesPrice = price > 1000000; break;
                }
            }

            return matchesSearch && matchesType && matchesPrice;
        });
    }, [pendingRequests, approvedProperties, rejectedProperties, companyProperties, activeTab, searchTerm, filterType, filterPrice]);

    const getStatusBadge = useCallback((status) => {
        const configs = {
            pending: {
                icon: Clock,
                label: 'Pending Review',
                color: 'amber',
                bg: isDark ? 'bg-amber-900/30' : 'bg-amber-100',
                textColor: isDark ? 'text-amber-300' : 'text-amber-800'
            },
            approved: {
                icon: CheckCircle,
                label: 'Approved',
                color: 'green',
                bg: isDark ? 'bg-green-900/30' : 'bg-green-100',
                textColor: isDark ? 'text-green-300' : 'text-green-800'
            },
            rejected: {
                icon: XCircle,
                label: 'Rejected',
                color: 'red',
                bg: isDark ? 'bg-red-900/30' : 'bg-red-100',
                textColor: isDark ? 'text-red-300' : 'text-red-800'
            },
            company: {
                icon: Crown,
                label: 'Company Listed',
                color: 'purple',
                bg: isDark ? 'bg-purple-900/30' : 'bg-purple-100',
                textColor: isDark ? 'text-purple-300' : 'text-purple-800'
            },
            needs_resubmission: {
                icon: AlertCircle,
                label: 'Needs Resubmission',
                color: 'orange',
                bg: isDark ? 'bg-orange-900/30' : 'bg-orange-100',
                textColor: isDark ? 'text-orange-300' : 'text-orange-800'
            }
        };

        return configs[status] || configs['pending'];
    }, [isDark]);

    const getPropertyTypeIcon = useCallback((type) => {
        const typeConfigs = {
            'residential': { icon: Home, color: 'blue' },
            'commercial': { icon: Building, color: 'purple' },
            'land': { icon: LandPlot, color: 'green' },
            'rental': { icon: Key, color: 'orange' },
            'apartment': { icon: Apartment, color: 'blue' },
            'villa': { icon: Castle, color: 'amber' },
            'office': { icon: Building2, color: 'gray' }
        };

        return typeConfigs[type] || { icon: Home, color: 'gray' };
    }, []);

    const formatPrice = useCallback((price) => {
        if (!price) return 'N/A';
        const num = parseFloat(price);
        if (num >= 1000000) {
            return `$${(num / 1000000).toFixed(2)}M`;
        } else if (num >= 1000) {
            return `$${(num / 1000).toFixed(1)}K`;
        }
        return `$${num.toLocaleString()}`;
    }, []);

    // Feedback Modal
    const FeedbackModal = useCallback(() => {
        if (!showFeedbackModal || !selectedProperty || actionType === 'resubmission') return null;

        const actionLabels = {
            'approve': {
                title: 'Approve Property Listing',
                icon: CheckCircle,
                color: 'green',
                description: 'Approve this property for public listing'
            },
            'reject': {
                title: 'Reject Property Listing',
                icon: XCircle,
                color: 'red',
                description: 'Reject this property listing request'
            }
        };

        const actionLabel = actionLabels[actionType];
        if (!actionLabel) return null;

        const Icon = actionLabel.icon;

        return (
            <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
                <div className={`max-w-md w-full rounded-xl shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"} p-6 max-h-[90vh] overflow-y-auto`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${isDark ? `bg-${actionLabel.color}-900/30` : `bg-${actionLabel.color}-100`}`}>
                            <Icon className={`w-6 h-6 ${isDark ? `text-${actionLabel.color}-400` : `text-${actionLabel.color}-600`}`} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                {actionLabel.title}
                            </h3>
                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                {selectedProperty.title} • {formatPrice(selectedProperty.price)}
                            </p>
                            <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                                Submitted by: {selectedProperty.broker_name || 'Unknown Broker'}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className={`block ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                {actionType === 'approve'
                                    ? 'Optional approval message:'
                                    : 'Reason for rejection:'}
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    if (actionType === 'approve') {
                                        setFeedbackText(`Congratulations! Your property listing "${selectedProperty.title}" has been approved and is now live on WubLand. You can view it at: wubland.com/properties/${selectedProperty.id}`);
                                    } else if (actionType === 'reject') {
                                        setFeedbackText(`Dear ${selectedProperty.broker_name || 'Broker'},\n\nYour property listing "${selectedProperty.title}" could not be approved at this time. Please review the submitted information and resubmit with proper documentation.`);
                                    }
                                }}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${isDark
                                    ? actionType === 'approve' ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                                    : actionType === 'approve' ? "bg-green-100 hover:bg-green-200 text-green-700" : "bg-red-100 hover:bg-red-200 text-red-700"
                                    }`}
                            >
                                <MessageCircle className="w-3 h-3" />
                                Auto Message
                            </button>
                        </div>
                        <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder={
                                actionType === 'approve'
                                    ? 'e.g., Property approved. Listing is now live.'
                                    : 'e.g., Images are blurry, documents missing...'
                            }
                            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 ${isDark
                                ? `bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-${actionType === 'approve' ? 'green' : 'red'}-500`
                                : `bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-${actionType === 'approve' ? 'green' : 'red'}-500`
                                }`}
                            rows="4"
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => {
                                setShowFeedbackModal(false);
                                setFeedbackText("");
                                setActionType(null);
                                setSelectedProperty(null);
                            }}
                            className={`px-4 py-2 rounded-lg ${isDark
                                ? "bg-gray-700 text-white hover:bg-gray-600"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handlePropertyAction()}
                            disabled={processingAction}
                            className={`px-4 py-2 rounded-lg ${actionType === 'approve'
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"
                                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {processingAction ? (
                                <Loader2 className="w-5 h-5 animate-spin inline" />
                            ) : (
                                actionType === 'approve' ? "Approve Property" : "Reject Property"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }, [showFeedbackModal, selectedProperty, actionType, isDark, formatPrice, feedbackText, processingAction, handlePropertyAction]);

    // Resubmission Modal
    const ResubmissionModal = useCallback(() => {
        if (!showResubmissionModal || !selectedProperty) return null;

        const [resubmissionFeedback, setResubmissionFeedback] = useState("");
        const [selectedIssues, setSelectedIssues] = useState([]);

        const issues = [
            { id: 'images', label: 'Low Quality Images', description: 'Images are blurry or poorly lit' },
            { id: 'documents', label: 'Missing Documents', description: 'Required legal documents missing' },
            { id: 'price', label: 'Price Verification', description: 'Price needs market verification' },
            { id: 'description', label: 'Incomplete Description', description: 'Property description is insufficient' },
            { id: 'location', label: 'Location Details', description: 'Address or location information incomplete' },
            { id: 'features', label: 'Features Missing', description: 'Property features not properly listed' }
        ];

        useEffect(() => {
            if (selectedProperty) {
                const autoMessage = `Dear ${selectedProperty.broker_name || 'Broker'},\n\nYour property listing "${selectedProperty.title}" requires resubmission with the following improvements:\n\n`;
                setResubmissionFeedback(autoMessage);
            }
        }, [selectedProperty]);

        const handleIssueToggle = (issueId) => {
            setSelectedIssues(prev =>
                prev.includes(issueId)
                    ? prev.filter(id => id !== issueId)
                    : [...prev, issueId]
            );
        };

        const handleSubmitResubmission = async () => {
            if (!selectedProperty) return;

            try {
                setProcessingAction(`resubmission-${selectedProperty.id}`);

                const payload = {
                    propertyId: selectedProperty.id,
                    feedback: resubmissionFeedback.trim(),
                    issues: selectedIssues,
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'needs_resubmission'
                };

                const response = await apiCall('REQUEST_PROPERTY_RESUBMISSION', {}, {
                    data: payload,
                    method: 'POST'
                });

                if (response && response.success) {
                    setPendingRequests(prev => prev.map(property =>
                        property.id === selectedProperty.id
                            ? { ...property, status: 'needs_resubmission' }
                            : property
                    ));

                    showToast("Resubmission request sent successfully", "success");

                    setShowResubmissionModal(false);
                    setResubmissionFeedback("");
                    setSelectedIssues([]);
                    setActionType(null);
                    setSelectedProperty(null);

                    await fetchPropertyStats();
                }
            } catch (error) {
                console.error('Error:', error);
                showToast(`Failed: ${error.message}`, "error");
            } finally {
                setProcessingAction(null);
            }
        };

        return (
            <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                <div className={`max-w-2xl w-full rounded-xl shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"} p-6 max-h-[90vh] overflow-y-auto`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${isDark ? `bg-orange-900/30` : `bg-orange-100`}`}>
                            <AlertCircle className={`w-6 h-6 ${isDark ? `text-orange-400` : `text-orange-600`}`} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                Request Property Resubmission
                            </h3>
                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                {selectedProperty.title} • {formatPrice(selectedProperty.price)}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className={`font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            Select issues that need to be addressed:
                        </h4>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {issues.map((issue) => (
                                <div
                                    key={issue.id}
                                    onClick={() => handleIssueToggle(issue.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedIssues.includes(issue.id)
                                        ? isDark ? 'bg-orange-900/20 border-orange-600' : 'bg-orange-50 border-orange-300'
                                        : isDark ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIssues.includes(issue.id)}
                                            onChange={() => handleIssueToggle(issue.id)}
                                            className="w-4 h-4 rounded"
                                        />
                                        <div>
                                            <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                                {issue.label}
                                            </p>
                                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                {issue.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className={`block mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            Detailed instructions for resubmission:
                        </label>
                        <textarea
                            value={resubmissionFeedback}
                            onChange={(e) => setResubmissionFeedback(e.target.value)}
                            placeholder="Provide specific instructions for the broker..."
                            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 ${isDark
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                                }`}
                            rows="4"
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => {
                                setShowResubmissionModal(false);
                                setResubmissionFeedback("");
                                setSelectedIssues([]);
                                setActionType(null);
                                setSelectedProperty(null);
                            }}
                            className={`px-4 py-2 rounded-lg ${isDark
                                ? "bg-gray-700 text-white hover:bg-gray-600"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmitResubmission}
                            disabled={!resubmissionFeedback.trim() || processingAction || selectedIssues.length === 0}
                            className={`px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {processingAction ? (
                                <Loader2 className="w-5 h-5 animate-spin inline" />
                            ) : (
                                `Request Resubmission (${selectedIssues.length} issues)`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }, [showResubmissionModal, selectedProperty, isDark, formatPrice, processingAction, showToast, fetchPropertyStats]);

    // Property Viewer Modal
    const PropertyViewerModal = useCallback(() => {
        if (!showPropertyViewer || !selectedProperty) return null;

        const [zoomLevel, setZoomLevel] = useState(1);
        const [rotation, setRotation] = useState(0);
        const [fullscreen, setFullscreen] = useState(false);
        const [activeImageIndex, setActiveImageIndex] = useState(0);

        const statusConfig = getStatusBadge(selectedProperty.status);
        const typeConfig = getPropertyTypeIcon(selectedProperty.type);
        const StatusIcon = statusConfig.icon;
        const TypeIcon = typeConfig.icon;

        const handleDownload = (url, filename) => {
            if (!url) return;
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        const handleViewImage = (image, index) => {
            if (!image) return;
            setSelectedImage({
                url: image.url || image,
                thumbnail: image.thumbnail || image.url || image,
                caption: image.caption || `Image ${index + 1}`
            });
            setActiveImageIndex(index);
            setZoomLevel(1);
            setRotation(0);
        };

        const handleNextImage = () => {
            if (propertyImages.length === 0) return;
            const nextIndex = (activeImageIndex + 1) % propertyImages.length;
            handleViewImage(propertyImages[nextIndex], nextIndex);
        };

        const handlePrevImage = () => {
            if (propertyImages.length === 0) return;
            const prevIndex = (activeImageIndex - 1 + propertyImages.length) % propertyImages.length;
            handleViewImage(propertyImages[prevIndex], prevIndex);
        };

        return (
            <>
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
                    onClick={() => {
                        setShowPropertyViewer(false);
                        setSelectedProperty(null);
                        setSelectedImage(null);
                    }}
                />

                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className={`w-full max-w-6xl rounded-2xl shadow-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} flex flex-col max-h-[90vh] overflow-hidden`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
                                    <FileSearch className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                                </div>
                                <div className="flex-1">
                                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedProperty.title}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {formatPrice(selectedProperty.price)} • {selectedProperty.location}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? `bg-${typeConfig.color}-900/30 text-${typeConfig.color}-300` : `bg-${typeConfig.color}-100 text-${typeConfig.color}-800`}`}>
                                            <TypeIcon className="w-3 h-3 inline mr-1" />
                                            {selectedProperty.type}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.bg} ${statusConfig.textColor}`}>
                                            <StatusIcon className="w-3 h-3 inline mr-1" />
                                            {statusConfig.label}
                                        </span>
                                        {selectedProperty.broker_name && (
                                            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                                                <User className="w-3 h-3 inline mr-1" />
                                                {selectedProperty.broker_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {activeTab === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleOpenFeedbackModal(selectedProperty, 'approve')}
                                            disabled={processingAction}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleOpenFeedbackModal(selectedProperty, 'resubmission')}
                                            disabled={processingAction}
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                            Request Fix
                                        </button>
                                        <button
                                            onClick={() => handleOpenFeedbackModal(selectedProperty, 'reject')}
                                            disabled={processingAction}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        setShowPropertyViewer(false);
                                        setSelectedProperty(null);
                                        setSelectedImage(null);
                                    }}
                                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex">
                            {/* Left sidebar - Images & Details */}
                            <div className={`w-96 border-r ${isDark ? 'border-gray-800' : 'border-gray-200'} overflow-y-auto`}>
                                <div className="p-6">
                                    {/* Property Images */}
                                    <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        Property Images ({propertyImages.length})
                                    </h3>

                                    {propertyImages.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Image className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-400'}`} />
                                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                                No images available
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 mb-6">
                                            {propertyImages.map((image, index) => (
                                                <div
                                                    key={index}
                                                    className="relative group cursor-pointer"
                                                    onClick={() => handleViewImage(image, index)}
                                                >
                                                    <img
                                                        src={image.thumbnail || image.url || image}
                                                        alt={`Property ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-lg"
                                                    />
                                                    <div className={`absolute inset-0 rounded-lg border-2 ${activeImageIndex === index ? 'border-amber-500' : 'border-transparent'}`} />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Property Details */}
                                    <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        Property Details
                                    </h3>

                                    <div className="space-y-3">
                                        <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Price</span>
                                            <span className="font-semibold text-amber-500">{formatPrice(selectedProperty.price)}</span>
                                        </div>

                                        <div className={`grid grid-cols-2 gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <div className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                                                <Bed className="w-4 h-4" />
                                                <span>{selectedProperty.bedrooms || 0} Bedrooms</span>
                                            </div>
                                            <div className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                                                <Bath className="w-4 h-4" />
                                                <span>{selectedProperty.bathrooms || 0} Bathrooms</span>
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                                            <Layers className="w-4 h-4" />
                                            <span>{selectedProperty.area || 'N/A'} {selectedProperty.areaUnit || 'sqm'}</span>
                                        </div>

                                        {selectedProperty.description && (
                                            <div>
                                                <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Description
                                                </h4>
                                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {selectedProperty.description}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Documents */}
                                    {propertyDocuments.length > 0 && (
                                        <>
                                            <h3 className={`font-semibold mt-6 mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                Documents ({propertyDocuments.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {propertyDocuments.map((doc, index) => (
                                                    <div
                                                        key={index}
                                                        className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="w-5 h-5" />
                                                            <div>
                                                                <p className={isDark ? 'text-white' : 'text-gray-900'}>{doc.name || `Document ${index + 1}`}</p>
                                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                    {doc.type || 'PDF'} • {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDownload(doc.url, doc.name)}
                                                            className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Main content - Image viewer */}
                            <div className="flex-1 flex flex-col">
                                {selectedImage ? (
                                    <>
                                        <div className={`p-4 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {selectedImage.caption}
                                                    </h3>
                                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        Image {activeImageIndex + 1} of {propertyImages.length}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {propertyImages.length > 1 && (
                                                        <>
                                                            <button
                                                                onClick={handlePrevImage}
                                                                className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                                                title="Previous image"
                                                            >
                                                                <ChevronRight className="w-4 h-4 rotate-180" />
                                                            </button>
                                                            <button
                                                                onClick={handleNextImage}
                                                                className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                                                title="Next image"
                                                            >
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3))}
                                                        className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                                        disabled={zoomLevel >= 3}
                                                    >
                                                        <ZoomIn className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.5))}
                                                        className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                                        disabled={zoomLevel <= 0.5}
                                                    >
                                                        <ZoomOut className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setRotation(r => (r + 90) % 360)}
                                                        className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                                    >
                                                        <RotateCw className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(selectedImage.url, selectedImage.caption)}
                                                        className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setFullscreen(!fullscreen)}
                                                        className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                                    >
                                                        <Maximize2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                                            <div className={`relative ${fullscreen ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : ''}`}>
                                                {fullscreen && (
                                                    <button
                                                        onClick={() => setFullscreen(false)}
                                                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg z-10"
                                                    >
                                                        <X className="w-6 h-6" />
                                                    </button>
                                                )}
                                                <img
                                                    src={selectedImage.url}
                                                    alt={selectedImage.caption}
                                                    className={`transition-all duration-200 ${fullscreen ? 'max-w-full max-h-full object-contain' : 'max-w-full max-h-full'}`}
                                                    style={{
                                                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                                        <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                                            <Image className={`w-20 h-20 mx-auto mb-6 ${isDark ? 'text-gray-700' : 'text-gray-400'}`} />
                                            <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                Select an image to preview
                                            </h3>
                                            <p className={`text-sm mb-6 max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Click on any property image from the list to view it here in high resolution.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }, [showPropertyViewer, selectedProperty, propertyImages, propertyDocuments, isDark, activeTab, processingAction, getStatusBadge, getPropertyTypeIcon, formatPrice, handleOpenFeedbackModal]);

    // Stat Card Component
    const StatCard = useCallback(({ label, value, icon: Icon, color, isDark }) => (
        <div className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{label}</p>
                    <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
                </div>
                <div className={`p-2 rounded-lg ${isDark ? `bg-${color}-900/30` : `bg-${color}-100`}`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
            </div>
        </div>
    ), []);

    // CRITICAL FIX: Handle modal close with useCallback
    const handleModalClose = useCallback(() => {
        console.log('❌ Modal closing from parent');
        setShowAddPropertyModal(false);
    }, []);

    // CRITICAL FIX: Handle modal success with useCallback
    const handleModalSuccess = useCallback(() => {
        console.log('✅ Modal success from parent');
        fetchCompanyProperties();
        fetchPropertyStats();
    }, [fetchCompanyProperties, fetchPropertyStats]);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? "bg-amber-400/10" : "bg-amber-100"}`}>
                            <Building className={`w-6 h-6 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                        </div>
                        <h2 className={`text-2xl lg:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                            Properties Management
                        </h2>
                    </div>
                    <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Review broker submissions and manage company property listings
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchAllData}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${isDark
                            ? "bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50"
                            }`}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    {/* CRITICAL FIX: Use the useCallback wrapped function */}
                    <button
                        onClick={handleAddCompanyPropertyClick}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Add Company Property
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <StatCard
                    label="Total Properties"
                    value={propertyStats.total}
                    icon={Home}
                    color="blue"
                    isDark={isDark}
                />
                <StatCard
                    label="Pending Review"
                    value={propertyStats.pending}
                    icon={Clock}
                    color="amber"
                    isDark={isDark}
                />
                <StatCard
                    label="Approved"
                    value={propertyStats.approved}
                    icon={CheckCircle}
                    color="green"
                    isDark={isDark}
                />
                <StatCard
                    label="Rejected"
                    value={propertyStats.rejected}
                    icon={XCircle}
                    color="red"
                    isDark={isDark}
                />
                <StatCard
                    label="Company Listed"
                    value={propertyStats.company}
                    icon={Crown}
                    color="purple"
                    isDark={isDark}
                />
                <StatCard
                    label="Today"
                    value={propertyStats.today}
                    icon={Calendar}
                    color="orange"
                    isDark={isDark}
                />
            </div>

            {/* Tabs */}
            <div className={`p-1 rounded-xl border ${isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"}`}>
                <div className="flex space-x-1">
                    {['pending', 'approved', 'rejected', 'company'].map((tab) => {
                        const isActive = activeTab === tab;
                        const configs = {
                            pending: { icon: Clock, label: 'Pending', color: 'amber', count: propertyStats.pending },
                            approved: { icon: CheckCircle, label: 'Approved', color: 'green', count: propertyStats.approved },
                            rejected: { icon: XCircle, label: 'Rejected', color: 'red', count: propertyStats.rejected },
                            company: { icon: Crown, label: 'Company', color: 'purple', count: propertyStats.company }
                        };
                        const config = configs[tab];
                        const Icon = config.icon;

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? `bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 text-white shadow-lg`
                                    : isDark
                                        ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{config.label}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${isActive
                                    ? "bg-white/20"
                                    : isDark
                                        ? "bg-gray-700 text-gray-300"
                                        : "bg-gray-200 text-gray-700"
                                    }`}>
                                    {config.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-600"} w-5 h-5`} />
                    <input
                        type="text"
                        placeholder="Search by title, location, or broker..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 ${isDark
                            ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:border-amber-500"
                            : "bg-white text-black border-gray-300 placeholder-gray-500 focus:border-amber-500"
                            }`}
                    />
                </div>
                <div className="flex gap-3 flex-wrap">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 ${isDark
                            ? "bg-gray-700 text-white border-gray-600"
                            : "bg-white text-black border-gray-300"
                            }`}
                    >
                        <option value="all">All Types</option>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="land">Land</option>
                        <option value="rental">Rental</option>
                    </select>
                    <select
                        value={filterPrice}
                        onChange={(e) => setFilterPrice(e.target.value)}
                        className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 ${isDark
                            ? "bg-gray-700 text-white border-gray-600"
                            : "bg-white text-black border-gray-300"
                            }`}
                    >
                        <option value="all">All Prices</option>
                        <option value="under-100k">Under $100K</option>
                        <option value="100k-500k">$100K - $500K</option>
                        <option value="500k-1m">$500K - $1M</option>
                        <option value="over-1m">Over $1M</option>
                    </select>
                </div>
            </div>

            {/* Properties List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
                    <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Loading properties data...
                    </p>
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className={`text-center py-16 rounded-xl border-2 border-dashed transition-colors duration-200 ${isDark
                    ? "border-gray-700 text-gray-400 bg-gray-800/50"
                    : "border-gray-300 text-gray-500 bg-gray-50"
                    }`}>
                    <Building className="w-20 h-20 mx-auto mb-4 opacity-50" />
                    <h3 className={`text-lg font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        No {activeTab} properties found
                    </h3>
                    <p className="text-sm opacity-75">
                        {searchTerm || filterType !== "all" || filterPrice !== "all"
                            ? "Try adjusting your search or filter criteria"
                            : `No properties with ${activeTab} status`}
                    </p>
                    {activeTab === 'company' && (
                        <button
                            onClick={handleAddCompanyPropertyClick}
                            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                            Add Your First Company Property
                        </button>
                    )}
                </div>
            ) : (
                <div className={`rounded-xl overflow-hidden border transition-all duration-200 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={`transition-colors duration-200 ${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}>
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                                        Property
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                                        Details
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                                        Status & Broker
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y transition-colors duration-200 ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
                                {filteredProperties.map((property) => {
                                    const statusConfig = getStatusBadge(property.status);
                                    const typeConfig = getPropertyTypeIcon(property.type);
                                    const StatusIcon = statusConfig.icon;
                                    const TypeIcon = typeConfig.icon;

                                    return (
                                        <tr key={property.id} className={`transition-all duration-200 ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                                                        <TypeIcon className="w-8 h-8" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium truncate">{property.title}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? `bg-${typeConfig.color}-900/30 text-${typeConfig.color}-300` : `bg-${typeConfig.color}-100 text-${typeConfig.color}-800`}`}>
                                                                <TypeIcon className="w-3 h-3 inline mr-1" />
                                                                {property.type}
                                                            </span>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                                                                {formatPrice(property.price)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-gray-500" />
                                                        <span className="text-sm truncate max-w-[200px]">{property.location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <Bed className="w-4 h-4" />
                                                            {property.bedrooms || 0} Beds
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Bath className="w-4 h-4" />
                                                            {property.bathrooms || 0} Baths
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Layers className="w-4 h-4" />
                                                            {property.area || 'N/A'} {property.areaUnit || 'sqm'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.bg} ${statusConfig.textColor}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        <span>{statusConfig.label}</span>
                                                    </div>
                                                    {property.broker_name && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <User className="w-4 h-4 text-gray-500" />
                                                            <span>{property.broker_name}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="w-4 h-4 text-gray-500" />
                                                        {property.submitted_at ? new Date(property.submitted_at).toLocaleDateString() :
                                                            property.created_at ? new Date(property.created_at).toLocaleDateString() : 'Unknown'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewProperty(property)}
                                                        disabled={processingAction === property.id}
                                                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                                                        title="View Details"
                                                    >
                                                        {processingAction === property.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                        Review
                                                    </button>

                                                    {activeTab === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleOpenFeedbackModal(property, 'approve')}
                                                                disabled={processingAction === `approve-${property.id}`}
                                                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                                                                title="Approve"
                                                            >
                                                                {processingAction === `approve-${property.id}` ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Check className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenFeedbackModal(property, 'resubmission')}
                                                                disabled={processingAction === `resubmission-${property.id}`}
                                                                className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                                                                title="Request Fix"
                                                            >
                                                                <AlertCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenFeedbackModal(property, 'reject')}
                                                                disabled={processingAction === `reject-${property.id}`}
                                                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                                                                title="Reject"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {activeTab === 'company' && (
                                                        <button
                                                            onClick={() => handleDeleteCompanyProperty(property.id)}
                                                            disabled={processingAction === `delete-${property.id}`}
                                                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            {processingAction === `delete-${property.id}` ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            <ResubmissionModal />
            <FeedbackModal />
            {/* CRITICAL FIX: Use the useCallback wrapped handlers and add key */}
            <AddCompanyPropertyModal
                key={`add-property-modal-${showAddPropertyModal}`}
                isOpen={showAddPropertyModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                theme={theme}
                setToast={setToast}
            />
            <PropertyViewerModal />
        </div>
    );
};

export default PropertiesRequest;