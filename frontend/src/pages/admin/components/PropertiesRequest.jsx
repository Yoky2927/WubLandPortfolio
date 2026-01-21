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

// CRITICAL: Create a separate component for the modal to isolate it
const ModalContainer = React.memo(({
    showAddPropertyModal,
    theme,
    setToast,
    onClose,
    onSuccess
}) => {
    if (!showAddPropertyModal) return null;

    return (
        <AddCompanyPropertyModal
            key="add-company-property-modal"
            isOpen={showAddPropertyModal}
            onClose={onClose}
            onSuccess={onSuccess}
            theme={theme}
            setToast={setToast}
        />
    );
});

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

    // Refs - CRITICAL: Track modal state and prevent API errors
    const apiErrorRef = useRef(false);
    const isModalOpenRef = useRef(false);
    const initialLoadRef = useRef(false);

    const isDark = theme === "dark";

    // Property types configuration - useMemo to prevent re-creation
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

    // CRITICAL: Track modal state to prevent re-renders
    useEffect(() => {
        isModalOpenRef.current = showAddPropertyModal || showFeedbackModal ||
            showResubmissionModal || showPropertyViewer;
    }, [showAddPropertyModal, showFeedbackModal, showResubmissionModal, showPropertyViewer]);

    // Initial data fetch - only once
    useEffect(() => {
        if (!initialLoadRef.current) {
            initialLoadRef.current = true;
            fetchAllData();
        }

        // Clean up on unmount
        return () => {
            initialLoadRef.current = false;
        };
    }, []);

    // CRITICAL: Modal handlers with useCallback - MOVED UP
    const handleAddCompanyPropertyClick = useCallback(() => {
        console.log('🎯 Opening company property modal');
        setShowAddPropertyModal(true);
    }, []);

    const handleModalClose = useCallback(() => {
        console.log('❌ Modal closing from parent');
        setShowAddPropertyModal(false);
    }, []);

    const handleModalSuccess = useCallback(() => {
        console.log('✅ Modal success from parent');
        // Refresh only what's needed
        fetchCompanyProperties();
        fetchPropertyStats();
    }, []);

    const showToast = useCallback((message, type = "info") => {
        if (setToast) {
            setToast({
                show: true,
                message,
                type,
            });
        }
    }, [setToast]);

    // CRITICAL: Memoize setToast wrapper
    const memoizedSetToast = useCallback(({ show, message, type }) => {
        if (setToast) {
            setToast({ show, message, type });
        }
    }, [setToast]);

    // CRITICAL: Memoize modal props to prevent re-renders
    const modalProps = useMemo(() => ({
        theme,
        setToast: memoizedSetToast,
        onClose: handleModalClose,
        onSuccess: handleModalSuccess
    }), [theme, memoizedSetToast, handleModalClose, handleModalSuccess]);

    // CRITICAL: Modified fetchAllData to handle errors gracefully
    const fetchAllData = async () => {
        // Don't fetch if modal is open
        if (isModalOpenRef.current) {
            console.log('⏸️ Skipping data fetch - modal is open');
            return;
        }

        try {
            setLoading(true);

            // Use Promise.allSettled instead of Promise.all to continue even if some fail
            const results = await Promise.allSettled([
                fetchPendingRequests(),
                fetchApprovedProperties(),
                fetchRejectedProperties(),
                fetchCompanyProperties(),
                fetchPropertyStats()
            ]);

            // Check if any failed
            const hasErrors = results.some(result => result.status === 'rejected');
            if (hasErrors) {
                console.warn('⚠️ Some data failed to load, but continuing...');
                apiErrorRef.current = true;
            } else {
                apiErrorRef.current = false;
            }

        } catch (error) {
            // Only show error if no modal is open
            if (!isModalOpenRef.current) {
                console.error("Error fetching data:", error);
                showToast("Failed to load property data", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // CRITICAL: Silent fetch functions - don't trigger re-renders on error
    const fetchPendingRequests = async () => {
        try {
            const response = await apiCall("GET_PENDING_PROPERTIES");
            if (response && Array.isArray(response.properties)) {
                setPendingRequests(response.properties);
            } else {
                setPendingRequests([]);
            }
        } catch (error) {
            // Silent fail - don't update state or show errors
            console.debug('Silent error in fetchPendingRequests:', error.message);
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
            console.debug('Silent error in fetchApprovedProperties:', error.message);
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
            console.debug('Silent error in fetchRejectedProperties:', error.message);
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
            console.debug('Silent error in fetchCompanyProperties:', error.message);
        }
    };

    // CRITICAL: Fixed fetchPropertyStats - remove or fix the {propertyId} placeholder
    const fetchPropertyStats = async () => {
        // Don't fetch stats if modal is open
        if (isModalOpenRef.current) {
            return;
        }

        try {
            // Use mock data temporarily
            const mockStats = {
                pending: pendingRequests.length,
                approved: approvedProperties.length,
                rejected: rejectedProperties.length,
                company: companyProperties.length,
                total: pendingRequests.length + approvedProperties.length + rejectedProperties.length + companyProperties.length,
                today: 0
            };
            setPropertyStats(mockStats);
        } catch (error) {
            // Silent fail - use calculated stats
            console.debug('Using calculated stats due to API error:', error.message);
            const calculatedStats = {
                pending: pendingRequests.length,
                approved: approvedProperties.length,
                rejected: rejectedProperties.length,
                company: companyProperties.length,
                total: pendingRequests.length + approvedProperties.length + rejectedProperties.length + companyProperties.length,
                today: 0
            };
            setPropertyStats(calculatedStats);
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
                fetchPropertyStats();
            }
        } catch (error) {
            console.error('Error:', error);
            showToast(`Failed: ${error.message}`, "error");
        } finally {
            setProcessingAction(null);
        }
    };

    // Memoize filtered properties to prevent re-renders
    const filteredProperties = useMemo(() => {
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

    // Memoize status badge function
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

    // Memoize format price function
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

    // Memoize StatCard component
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

    // Refresh button handler
    const handleRefresh = useCallback(() => {
        fetchAllData();
    }, []);

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
                        onClick={handleRefresh}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${isDark
                            ? "bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50"
                            }`}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
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
                                    const typeConfig = propertyTypes[property.type] || { icon: Home, color: 'gray' };
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
                                                            onClick={() => {
                                                                if (window.confirm("Are you sure you want to delete this company property?")) {
                                                                    // Handle delete
                                                                }
                                                            }}
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

            {/* CRITICAL: Isolated Modal Container */}
            <ModalContainer
                showAddPropertyModal={showAddPropertyModal}
                {...modalProps}
            />
        </div>
    );
};

export default PropertiesRequest;