// components/BrokerPropertiesList.jsx - FIXED VERSION
import React, { useState } from "react";
import {
  Eye,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Home,
  DollarSign,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const BrokerPropertiesList = ({
  theme,
  user,
  brokerStats,
  brokerProperties = [], // Default to empty array
  isInternal,
  onPropertyAction,
  onRefresh,
  setToast,
}) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedProperty, setExpandedProperty] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedProperties, setSelectedProperties] = useState([]);

  // Ensure brokerProperties is always an array
  const safeBrokerProperties = Array.isArray(brokerProperties) ? brokerProperties : [];
  
  // Apply filters
  const filteredProperties = safeBrokerProperties.filter((property) => {
    // Status filter
    if (filterStatus !== "all" && property.status !== filterStatus) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        property.title?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.property_type?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Apply sorting
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at);
      case "oldest":
        return new Date(a.created_at || a.updated_at) - new Date(b.created_at || b.updated_at);
      case "price_high":
        return (b.price || 0) - (a.price || 0);
      case "price_low":
        return (a.price || 0) - (b.price || 0);
      default:
        return 0;
    }
  });

  const handlePropertyAction = async (propertyId, action, notes = "") => {
    setActionLoading({ ...actionLoading, [propertyId]: true });
    try {
      await onPropertyAction(propertyId, action, notes);
    } catch (error) {
      console.error("Error in property action:", error);
    } finally {
      setActionLoading({ ...actionLoading, [propertyId]: false });
    }
  };

  const togglePropertyExpansion = (propertyId) => {
    setExpandedProperty(expandedProperty === propertyId ? null : propertyId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending_review":
      case "draft":
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case "rejected":
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "pending_review":
      case "draft":
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "rejected":
      case "inactive":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`p-4 lg:p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Property Listings</h2>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Manage and review assigned properties
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className={`px-2 py-1 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
              Total: {safeBrokerProperties.length}
            </span>
            <span className="text-green-600 dark:text-green-400">
              Approved: {safeBrokerProperties.filter(p => p.status === 'approved' || p.status === 'active').length}
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              Pending: {safeBrokerProperties.filter(p => p.status === 'pending_review' || p.status === 'draft' || p.status === 'pending').length}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
              }`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
              }`}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_high">Price: High to Low</option>
            <option value="price_low">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Properties List */}
      <div className="space-y-4">
        {sortedProperties.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {safeBrokerProperties.length === 0 
                ? "No properties assigned yet" 
                : "No properties match your filters"}
            </p>
            {safeBrokerProperties.length === 0 && (
              <button
                onClick={onRefresh}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                Refresh Properties
              </button>
            )}
          </div>
        ) : (
          sortedProperties.map((property) => (
            <div
              key={property.id}
              className={`rounded-xl border overflow-hidden ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}
            >
              {/* Property Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                onClick={() => togglePropertyExpansion(property.id)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(property.status)}`}>
                        {getStatusIcon(property.status)}
                        {property.status?.replace('_', ' ') || 'Unknown'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {property.id || property.property_uuid || 'N/A'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{property.title || 'Untitled Property'}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {property.city || 'Unknown Location'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        {property.property_type || 'Unknown Type'}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(property.price)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePropertyExpansion(property.id);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                    >
                      {expandedProperty === property.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedProperty === property.id && (
                <div className="border-t border-gray-200 dark:border-gray-600 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Property Details */}
                    <div>
                      <h4 className="font-semibold mb-3">Property Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Owner:</span>
                          <span className="font-medium">{property.owner_name || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Address:</span>
                          <span className="font-medium text-right">{property.address || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Listing Type:</span>
                          <span className="font-medium">{property.listing_type || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Beds/Baths:</span>
                          <span className="font-medium">
                            {property.beds || 0} beds • {property.baths || 0} baths
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Size:</span>
                          <span className="font-medium">{property.sqft || 0} sqft</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Created:</span>
                          <span className="font-medium">{formatDate(property.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div>
                      <h4 className="font-semibold mb-3">Actions</h4>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          {(property.status === 'pending_review' || property.status === 'draft' || property.status === 'pending') && (
                            <>
                              <button
                                onClick={() => handlePropertyAction(property.id, 'approve', 'Property looks good')}
                                disabled={actionLoading[property.id]}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {actionLoading[property.id] ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Approve
                              </button>
                              
                              <button
                                onClick={() => handlePropertyAction(property.id, 'reject', 'Needs improvements')}
                                disabled={actionLoading[property.id]}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {actionLoading[property.id] ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Reject
                              </button>
                              
                              <button
                                onClick={() => {
                                  const notes = prompt('Enter change request notes:');
                                  if (notes) {
                                    handlePropertyAction(property.id, 'request_changes', notes);
                                  }
                                }}
                                disabled={actionLoading[property.id]}
                                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {actionLoading[property.id] ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <AlertCircle className="w-4 h-4" />
                                )}
                                Request Changes
                              </button>
                            </>
                          )}
                          
                          {(property.status === 'approved' || property.status === 'active') && (
                            <button
                              onClick={() => handlePropertyAction(property.id, 'reject', 'Property no longer valid')}
                              disabled={actionLoading[property.id]}
                              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {actionLoading[property.id] ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              Revoke Approval
                            </button>
                          )}
                          
                          {(property.status === 'rejected' || property.status === 'inactive') && (
                            <button
                              onClick={() => handlePropertyAction(property.id, 'approve', 'Re-reviewed and approved')}
                              disabled={actionLoading[property.id]}
                              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {actionLoading[property.id] ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Re-approve
                            </button>
                          )}
                        </div>
                        
                        <button
                          onClick={() => {
                            // View property details
                            window.open(`/property/${property.id || property.property_uuid}`, '_blank');
                          }}
                          className="w-full px-4 py-2 border border-amber-500 text-amber-500 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {property.description && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {property.description.length > 300 
                          ? `${property.description.substring(0, 300)}...` 
                          : property.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {sortedProperties.length > 0 && (
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {sortedProperties.length} of {safeBrokerProperties.length} properties
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh List
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerPropertiesList;