import React, { useState, useRef, useEffect } from "react";
import {
  Eye, FileEdit, CheckCircle, XCircle, AlertCircle, RefreshCw, Search, Home,
  DollarSign, MapPin, ChevronDown, ChevronUp, Image as ImageIcon, Plus, Camera,
  Edit, Trash2, Download, Share2, Star, User, Calendar, Layers, Maximize2,
  Filter, X, Upload, Grid, List, Clock, Heart, MessageSquare, Zap, Shield,
  TrendingUp, Check, Sparkles, ChevronLeft, ChevronRight, CloudUpload, Building,
  Bath, Ruler, Globe, Crown, Bed, Lock, Users, Key
} from "lucide-react";
import { api } from "../utils/api.endpoints";

const BrokerPropertiesList = ({
  theme,
  user,
  brokerStats,
  brokerProperties = [],
  isInternal,
  onPropertyAction,
  onRefresh,
  setToast,
  onCreateProperty,
  onViewDetails,
  onUploadImages,
}) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedProperty, setExpandedProperty] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedPropertyForImages, setSelectedPropertyForImages] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch broker properties on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchBrokerProperties();
    }
  }, [user?.id]);

  // Also use passed properties if available
  useEffect(() => {
    if (Array.isArray(brokerProperties) && brokerProperties.length > 0) {
      setProperties(brokerProperties);
    }
  }, [brokerProperties]);

  // Fetch broker properties from API
  const fetchBrokerProperties = async () => {
    try {
      setLoading(true);
      const response = await api.getBrokerListings();
      
      console.log("Broker properties response:", response);
      
      let propertiesData = [];
      if (response?.data?.properties) {
        propertiesData = response.data.properties;
      } else if (response?.data?.data?.properties) {
        propertiesData = response.data.data.properties;
      } else if (Array.isArray(response?.data)) {
        propertiesData = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        propertiesData = response.data.data;
      } else if (Array.isArray(response)) {
        propertiesData = response;
      } else if (response?.properties) {
        propertiesData = response.properties;
      }

      console.log("Extracted properties:", propertiesData);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      
    } catch (error) {
      console.error('Error fetching broker properties:', error);
      if (setToast) {
        setToast({
          show: true,
          message: "Failed to load properties",
          type: "error",
        });
      }
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get status from backend property_status field
  const getPropertyStatus = (property) => {
    return property.property_status || property.status || 'draft';
  };

  // Format status display
  const formatStatusDisplay = (status) => {
    const statusMap = {
      'active': 'Active',
      'pending': 'Pending Review',
      'draft': 'Draft',
      'rejected': 'Rejected',
      'inactive': 'Inactive',
      'sold': 'Sold',
      'rented': 'Rented',
      'approved': 'Approved',
      'pending_review': 'Pending Review'
    };
    return statusMap[status] || status.replace('_', ' ');
  };

  // Get property image - handles various image formats
  const getPropertyImage = (property) => {
    // Check property_images array
    if (property.property_images && Array.isArray(property.property_images) && property.property_images.length > 0) {
      const primaryImage = property.property_images.find(img => img.is_primary) || property.property_images[0];
      return primaryImage.image_url || primaryImage.url || primaryImage.image;
    }
    
    // Check images array
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      return property.images[0];
    }
    
    // Check single image fields
    if (property.image_url) {
      return property.image_url;
    }
    
    if (property.featured_image) {
      return property.featured_image;
    }
    
    if (property.image) {
      return property.image;
    }
    
    // Fallback image based on property type
    return `https://images.unsplash.com/photo-${property.property_type === 'apartment' ? '1560448204-e02f11c3d0e2' : 
      property.property_type === 'house' ? '1518780664697-55e3ad937233' :
      property.property_type === 'villa' ? '1613490493576-7fde63acd4e1' :
      '1545324418-cc1a3fa10c00'}?auto=format&fit=crop&w=800&q=80`;
  };

  // Format price with proper currency
  const formatCurrency = (amount, currency = 'ETB') => {
    if (!amount && amount !== 0) return `0 ${currency}`;
    
    const formatter = new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    return formatter.format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Function to handle property actions using real API
  const handlePropertyAction = async (propertyId, action) => {
    if (!propertyId) {
      console.error('No property ID provided');
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [propertyId]: true }));
    
    try {
      // Use the propertyAction endpoint
      const response = await api.propertyAction(propertyId, { action });
      
      if (response?.success || response?.data?.success) {
        if (onPropertyAction) {
          onPropertyAction(propertyId, action);
        }
        
        if (setToast) {
          setToast({
            show: true,
            message: `Property ${action}d successfully`,
            type: "success",
          });
        }
        
        // Refresh properties list
        fetchBrokerProperties();
        
        // Call parent refresh if provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(response?.message || 'Action failed');
      }
    } catch (error) {
      console.error("Action failed:", error);
      if (setToast) {
        setToast({
          show: true,
          message: `Failed to ${action} property: ${error.message}`,
          type: "error",
        });
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  // Function to handle property deletion
  const handleDeleteProperty = async (propertyId) => {
    if (!propertyId) {
      console.error('No property ID provided');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [propertyId]: true }));
    
    try {
      const response = await api.deleteProperty(propertyId);
      
      if (response?.success || response?.data?.success) {
        if (setToast) {
          setToast({
            show: true,
            message: "Property deleted successfully",
            type: "success",
          });
        }
        
        // Refresh properties list
        fetchBrokerProperties();
        
        // Call parent refresh if provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(response?.message || 'Delete failed');
      }
    } catch (error) {
      console.error("Delete failed:", error);
      if (setToast) {
        setToast({
          show: true,
          message: `Failed to delete property: ${error.message}`,
          type: "error",
        });
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  // Function to toggle property expansion
  const togglePropertyExpansion = (propertyId) => {
    setExpandedProperty(prev => prev === propertyId ? null : propertyId);
  };

  // Function to handle property edit - call parent function
  const handleEditProperty = (property) => {
    if (onViewDetails) {
      onViewDetails(property);
    }
  };

  // Function to handle create property - call parent function
  const handleCreateProperty = () => {
    if (onCreateProperty) {
      onCreateProperty();
    }
  };

  // Handle image upload using real API
  const handleImageUpload = async () => {
    if (!selectedFiles.length || !selectedPropertyForImages?.id) {
      if (setToast) {
        setToast({
          show: true,
          message: "Please select files to upload",
          type: "warning",
        });
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Use the api.uploadPropertyImages function
      const response = await api.updateProperty(selectedPropertyForImages.id, formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setShowImageUpload(false);
        setSelectedFiles([]);
        setUploadProgress(0);
        setIsUploading(false);
        
        if (response?.success) {
          if (setToast) {
            setToast({
              show: true,
              message: "Images uploaded successfully!",
              type: "success",
            });
          }
          
          // Refresh properties list
          fetchBrokerProperties();
          
          // Call parent refresh if provided
          if (onRefresh) {
            onRefresh();
          }
          
          // Call parent upload images function if provided
          if (onUploadImages) {
            onUploadImages(selectedPropertyForImages.id, selectedFiles);
          }
        } else {
          throw new Error(response?.message || 'Upload failed');
        }
      }, 500);

    } catch (error) {
      console.error("Upload failed:", error);
      if (setToast) {
        setToast({
          show: true,
          message: `Upload failed: ${error.message}`,
          type: "error",
        });
      }
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file selection for upload
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      if (setToast) {
        setToast({
          show: true,
          message: "Please select image files only",
          type: "warning",
        });
      }
      return;
    }
    
    setSelectedFiles(imageFiles);
  };

  // Remove selected file
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Apply filters
  const filteredProperties = properties.filter((property) => {
    const status = getPropertyStatus(property);
    
    if (filterStatus !== "all") {
      const statusMap = {
        'pending': ['pending', 'pending_review', 'draft'],
        'approved': ['active', 'approved'],
        'rejected': ['rejected', 'inactive'],
        'draft': ['draft'],
        'active': ['active'],
        'sold': ['sold'],
        'rented': ['rented']
      };
      
      const statuses = statusMap[filterStatus] || [filterStatus];
      if (!statuses.includes(status)) {
        return false;
      }
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (property.title || '').toLowerCase().includes(query) ||
        (property.address || '').toLowerCase().includes(query) ||
        (property.city || '').toLowerCase().includes(query) ||
        (property.property_type || '').toLowerCase().includes(query) ||
        (property.description || '').toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Apply sorting
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    const statusA = getPropertyStatus(a);
    const statusB = getPropertyStatus(b);
    
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0);
      case "oldest":
        return new Date(a.created_at || a.updated_at || 0) - new Date(b.created_at || b.updated_at || 0);
      case "price_high":
        return (b.price || 0) - (a.price || 0);
      case "price_low":
        return (a.price || 0) - (b.price || 0);
      case "status":
        return statusA.localeCompare(statusB);
      default:
        return 0;
    }
  });

  // Status color mapping
  const getStatusColor = (status) => {
    const actualStatus = status.toLowerCase();
    switch (actualStatus) {
      case "approved":
      case "active":
        return {
          bg: theme === "dark" ? "bg-emerald-900/30" : "bg-emerald-50",
          text: theme === "dark" ? "text-emerald-300" : "text-emerald-700",
          icon: "text-emerald-500",
          border: theme === "dark" ? "border-emerald-800" : "border-emerald-200"
        };
      case "pending_review":
      case "pending":
        return {
          bg: theme === "dark" ? "bg-amber-900/30" : "bg-amber-50",
          text: theme === "dark" ? "text-amber-300" : "text-amber-700",
          icon: "text-amber-500",
          border: theme === "dark" ? "border-amber-800" : "border-amber-200"
        };
      case "draft":
        return {
          bg: theme === "dark" ? "bg-blue-900/30" : "bg-blue-50",
          text: theme === "dark" ? "text-blue-300" : "text-blue-700",
          icon: "text-blue-500",
          border: theme === "dark" ? "border-blue-800" : "border-blue-200"
        };
      case "rejected":
      case "inactive":
        return {
          bg: theme === "dark" ? "bg-rose-900/30" : "bg-rose-50",
          text: theme === "dark" ? "text-rose-300" : "text-rose-700",
          icon: "text-rose-500",
          border: theme === "dark" ? "border-rose-800" : "border-rose-200"
        };
      case "sold":
      case "rented":
        return {
          bg: theme === "dark" ? "bg-purple-900/30" : "bg-purple-50",
          text: theme === "dark" ? "text-purple-300" : "text-purple-700",
          icon: "text-purple-500",
          border: theme === "dark" ? "border-purple-800" : "border-purple-200"
        };
      default:
        return {
          bg: theme === "dark" ? "bg-gray-800" : "bg-gray-100",
          text: theme === "dark" ? "text-gray-300" : "text-gray-700",
          icon: "text-gray-500",
          border: theme === "dark" ? "border-gray-700" : "border-gray-300"
        };
    }
  };

  // Status icon mapping
  const getStatusIcon = (status) => {
    const actualStatus = status.toLowerCase();
    switch (actualStatus) {
      case "approved":
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "pending_review":
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "draft":
        return <FileEdit className="w-4 h-4" />;
      case "rejected":
      case "inactive":
        return <XCircle className="w-4 h-4" />;
      case "sold":
      case "rented":
        return <Shield className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Calculate stats from properties
  const calculatePropertyStats = () => {
    const stats = {
      total: properties.length,
      active: properties.filter(p => getPropertyStatus(p) === 'active').length,
      pending: properties.filter(p => ['pending', 'draft'].includes(getPropertyStatus(p))).length,
      withoutImages: properties.filter(p => 
        !p.images && 
        !p.image_url && 
        !p.featured_image && 
        !p.image &&
        (!p.property_images || p.property_images.length === 0)
      ).length,
      totalValue: properties.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0),
      sold: properties.filter(p => getPropertyStatus(p) === 'sold').length,
      rented: properties.filter(p => getPropertyStatus(p) === 'rented').length
    };
    
    return stats;
  };

  const propertyStats = calculatePropertyStats();

  // Handle refresh
  const handleRefresh = () => {
    fetchBrokerProperties();
    if (onRefresh) {
      onRefresh();
    }
  };

  if (loading) {
    return (
      <div className={`p-4 lg:p-6 rounded-2xl ${theme === "dark" ? "bg-gray-900/50" : "bg-white"} border ${theme === "dark" ? "border-gray-800" : "border-gray-200"} shadow-lg`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Loading properties...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-6 rounded-2xl ${theme === "dark" ? "bg-gray-900/50" : "bg-white"} border ${theme === "dark" ? "border-gray-800" : "border-gray-200"} shadow-lg`}>
      {/* Header with Stats and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Property Listings
              </h2>
              <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Manage and track all your property listings in one place
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className={`px-3 py-1.5 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
              <span className={`font-semibold ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>{propertyStats.total}</span>
              <span className={`ml-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Total</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  Active: <span className={`font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{propertyStats.active}</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  Pending: <span className={`font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{propertyStats.pending}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRefresh}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 ${theme === "dark" ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700" : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"} hover:scale-105`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            onClick={handleCreateProperty}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span className={` ${theme === "dark" ? "text-white" : "text-white"}`}>Create Listing</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { 
            label: "Active Listings", 
            value: propertyStats.active,
            icon: Home,
            color: "from-emerald-500 to-teal-500",
            bgColor: theme === "dark" ? "bg-emerald-900/20" : "bg-emerald-50",
            borderColor: theme === "dark" ? "border-emerald-800/50" : "border-emerald-200",
            textColor: theme === "dark" ? "text-white" : "text-black"
          },
          { 
            label: "Pending Review", 
            value: propertyStats.pending,
            icon: Clock,
            color: "from-amber-500 to-orange-500",
            bgColor: theme === "dark" ? "bg-amber-900/20" : "bg-amber-50",
            borderColor: theme === "dark" ? "border-amber-800/50" : "border-amber-200",
            textColor: theme === "dark" ? "text-white" : "text-black"
          },
          { 
            label: "Without Images", 
            value: propertyStats.withoutImages,
            icon: Camera,
            color: "from-blue-500 to-indigo-500",
            bgColor: theme === "dark" ? "bg-blue-900/20" : "bg-blue-50",
            borderColor: theme === "dark" ? "border-blue-800/50" : "border-blue-200",
            textColor: theme === "dark" ? "text-white" : "text-black"
          },
          { 
            label: "Total Value", 
            value: formatCurrency(propertyStats.totalValue),
            icon: TrendingUp,
            color: "from-purple-500 to-pink-500",
            bgColor: theme === "dark" ? "bg-purple-900/20" : "bg-purple-50",
            borderColor: theme === "dark" ? "border-purple-800/50" : "border-purple-200",
            textColor: theme === "dark" ? "text-white" : "text-black"
          }
        ].map((stat, index) => (
          <div 
            key={index}
            className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${stat.bgColor} ${stat.borderColor}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {stat.label}
                </p>
                <p className={`text-xl lg:text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className={`p-4 rounded-xl mb-8 ${theme === "dark" ? "bg-gray-900/30 border border-gray-800" : "bg-gray-50 border border-gray-200"}`}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
              <input
                type="text"
                placeholder="Search properties by title, address, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
              />
            </div>
          </div>
          
          {/* Filters and View Toggle */}
          <div className="flex flex-wrap gap-3">
            {/* View Mode Toggle */}
            <div className={`flex rounded-xl overflow-hidden border ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`}>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-3 transition-all ${viewMode === "grid" ? theme === "dark" ? "bg-amber-600 text-white" : "bg-amber-500 text-white" : theme === "dark" ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-3 transition-all ${viewMode === "list" ? theme === "dark" ? "bg-amber-600 text-white" : "bg-amber-500 text-white" : theme === "dark" ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent min-w-[140px] ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
            
            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-transparent min-w-[160px] ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_high">Price: High to Low</option>
              <option value="price_low">Price: Low to High</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties Grid/List */}
      {sortedProperties.length === 0 ? (
        <div className="text-center py-16">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
            <Home className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl lg:text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            No Properties Found
          </h3>
          <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            {properties.length === 0 
              ? "You haven't created any properties yet. Start by creating your first listing!" 
              : "No properties match your current filters."}
          </p>
          {properties.length === 0 && (
            <button
              onClick={handleCreateProperty}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 mx-auto transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Create Your First Listing</span>
            </button>
          )}
        </div>
      ) : (
        <div className={`${viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" : "flex flex-col"} gap-6`}>
          {sortedProperties.map((property) => {
            const status = getPropertyStatus(property);
            const statusDisplay = formatStatusDisplay(status);
            const statusColors = getStatusColor(status);
            const propertyImage = getPropertyImage(property);
            const hasImages = property.images || property.image_url || property.featured_image || property.image || (property.property_images && property.property_images.length > 0);
            const propertyId = property.id || property.property_id;
            
            return (
              <div
                key={propertyId}
                className={`rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${theme === "dark" ? "bg-gray-900/50 border-gray-800 hover:border-gray-700" : "bg-white border-gray-200 hover:border-gray-300"}`}
              >
                {/* Property Card Header with Image */}
                <div className="relative">
                  {/* Property Image */}
                  <div className="h-56 w-full relative overflow-hidden">
                    <img
                      src={propertyImage}
                      alt={property.title || 'Property'}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://images.unsplash.com/photo-${property.property_type === 'apartment' ? '1560448204-e02f11c3d0e2' : 
                          property.property_type === 'house' ? '1518780664697-55e3ad937233' :
                          property.property_type === 'villa' ? '1613490493576-7fde63acd4e1' :
                          '1545324418-cc1a3fa10c00'}?auto=format&fit=crop&w=800&q=80`;
                      }}
                    />
                    
                    {/* Image Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 backdrop-blur-sm ${statusColors.bg} ${statusColors.text} ${statusColors.border} border`}>
                            {getStatusIcon(status)}
                            {statusDisplay}
                          </span>
                          {property.is_featured && (
                            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white backdrop-blur-sm flex items-center gap-2">
                              <Sparkles className="w-3 h-3" />
                              Featured
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {!hasImages && (
                            <button
                              onClick={() => {
                                setSelectedPropertyForImages(property);
                                setShowImageUpload(true);
                              }}
                              className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
                              title="Upload Images"
                            >
                              <Camera className="w-4 h-4 text-white" />
                            </button>
                          )}
                          <button
                            onClick={() => onViewDetails && onViewDetails(property)}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">
                              {property.title || 'Untitled Property'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-200">
                              <MapPin className="w-4 h-4" />
                              <span>{property.city || 'Unknown Location'}</span>
                              {property.neighborhood && (
                                <span className="text-gray-300">• {property.neighborhood}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                              {formatCurrency(property.price, property.currency)}
                            </div>
                            {property.listing_type && (
                              <div className="text-sm text-gray-300">
                                For {property.listing_type === 'sale' ? 'Sale' : 'Rent'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-5">
                  {/* Property Features */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
                        <Home className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Type</div>
                        <div className={`font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>{property.property_type || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
                        <Layers className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Area</div>
                        <div className={`font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>{property.sqft || property.square_feet || property.area || 'N/A'} sqft</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Beds</div>
                        <div className={`font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>{property.beds || property.bedrooms || 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
                        <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Baths</div>
                        <div className={`font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>{property.baths || property.bathrooms || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{property.views_count || property.views || 0}</div>
                      <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Views</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{property.saves_count || property.favorites || 0}</div>
                      <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Saves</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{property.inquiries_count || property.inquiries || 0}</div>
                      <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Inquiries</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => onViewDetails && onViewDetails(property)}
                      className="flex-1 px-4 py-2.5 border border-amber-500 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    
                    <button
                      onClick={() => togglePropertyExpansion(propertyId)}
                      className={`px-4 py-2.5 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center transition-all duration-300 hover:scale-105 ${theme === "dark" ? "border-gray-700 text-gray-400" : "border-gray-300 text-gray-600"}`}
                    >
                      {expandedProperty === propertyId ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Actions */}
                  {expandedProperty === propertyId && (
                    <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-800 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {status === 'pending' && (
                          <>
                            <button
                              onClick={() => handlePropertyAction(propertyId, 'approve')}
                              disabled={actionLoading[propertyId]}
                              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-sm flex items-center justify-center gap-2 transition-all duration-300"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            
                            <button
                              onClick={() => handlePropertyAction(propertyId, 'reject')}
                              disabled={actionLoading[propertyId]}
                              className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 text-sm flex items-center justify-center gap-2 transition-all duration-300"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => {
                            setSelectedPropertyForImages(property);
                            setShowImageUpload(true);
                          }}
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 text-sm flex items-center justify-center gap-2 transition-all duration-300"
                        >
                          <Camera className="w-4 h-4" />
                          Upload Images
                        </button>
                        
                        <button
                          onClick={() => handleEditProperty(property)}
                          className="px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 text-sm flex items-center justify-center gap-2 transition-all duration-300"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => window.open(`/property/${propertyId}`, '_blank')}
                          className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 text-sm flex items-center justify-center gap-2 transition-all duration-300"
                        >
                          <Eye className="w-4 h-4" />
                          View Public
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProperty(propertyId)}
                          disabled={actionLoading[propertyId]}
                          className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 disabled:opacity-50 text-sm flex items-center justify-center gap-2 transition-all duration-300"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                      
                      <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Created: {formatDate(property.created_at)}
                        </div>
                        {property.updated_at && (
                          <div className="flex items-center gap-2 mt-1">
                            <RefreshCw className="w-4 h-4" />
                            Updated: {formatDate(property.updated_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {sortedProperties.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className={`text-sm mb-4 sm:mb-0 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Showing <span className={`font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{sortedProperties.length}</span> of <span className={`font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{properties.length}</span> properties
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className={`px-4 py-2.5 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-all duration-300 hover:scale-105 ${theme === "dark" ? "border-gray-700 text-gray-400" : "border-gray-300 text-gray-600"}`}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh List
            </button>
            
            <button
              onClick={handleCreateProperty}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Add New Property
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Image Upload Modal */}
      {showImageUpload && selectedPropertyForImages && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`relative rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${theme === "dark" ? "bg-gray-900" : "bg-white"} shadow-2xl`}>
            {/* Header */}
            <div className={`p-6 border-b ${theme === "dark" ? "border-gray-800" : "border-gray-200"} flex justify-between items-center`}>
              <div>
                <h3 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Upload Images</h3>
                <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Add images to "{selectedPropertyForImages.title}"
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImageUpload(false);
                  setSelectedFiles([]);
                  setUploadProgress(0);
                  setIsUploading(false);
                }}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Upload Area */}
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center mb-6 transition-all duration-300 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/10'} ${theme === "dark" ? "border-gray-700 bg-gray-900/30" : "border-gray-300 bg-gray-50"}`}
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h4 className={`font-semibold text-lg mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Upload Property Images'}
                </h4>
                <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Drag & drop images here or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <button
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${isUploading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover:shadow-lg'}`}
                  disabled={isUploading}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  Browse Files
                </button>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Uploading...</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{uploadProgress}%</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-6">
                  <h4 className={`font-medium mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Selected Files ({selectedFiles.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          disabled={isUploading}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className={`text-xs mt-2 truncate ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guidelines */}
              <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-blue-900/20 border border-blue-800/50" : "bg-blue-50 border border-blue-200"}`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Upload Guidelines
                </h4>
                <ul className={`text-sm space-y-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  <li>• Use high-quality images (min. 1200x800 pixels)</li>
                  <li>• Include interior, exterior, and amenities photos</li>
                  <li>• Maximum file size: 10MB per image</li>
                  <li>• Supported formats: JPG, PNG, WebP</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t ${theme === "dark" ? "border-gray-800 bg-gray-900/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowImageUpload(false);
                    setSelectedFiles([]);
                    setUploadProgress(0);
                    setIsUploading(false);
                  }}
                  className={`flex-1 px-4 py-3 border rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 ${theme === "dark" ? "border-gray-700 text-gray-400" : "border-gray-300 text-gray-600"}`}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImageUpload}
                  disabled={isUploading || selectedFiles.length === 0}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isUploading || selectedFiles.length === 0 ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover:shadow-lg'}`}
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </div>
                  ) : (
                    `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerPropertiesList;