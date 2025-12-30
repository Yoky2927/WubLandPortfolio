// components/BrokerRequestsList.jsx - FIXED WITH REAL BACKEND DATA
import React, { useState, useEffect } from 'react';
import {
  Home,
  User,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  MessageCircle,
  Eye,
  Clock,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  Building,
  Bed,
  Bath,
  Square
} from 'lucide-react';
import { apiCall } from '../utils/api.endpoints';
import { apiClient } from '../utils/api.client';

const BrokerRequestsList = ({ 
  theme, 
  requests: initialRequests = [], 
  onAcceptRequest, 
  onRejectRequest, 
  onMessageClient,
  setToast 
}) => {
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await apiCall('GET_BROKER_REQUESTS', {}, {});
      
      if (response.success) {
        const requestsData = response.data?.requests || response.data || [];
        setRequests(Array.isArray(requestsData) ? requestsData : []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      if (setToast) {
        setToast({
          show: true,
          message: "Failed to load property requests",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleAcceptRequest = async (requestId) => {
    if (!requestId) {
      console.error('No request ID provided');
      return;
    }

    try {
      const response = await apiCall('ACCEPT_PROPERTY_REQUEST', { requestId }, {
        data: { 
          status: 'accepted',
          broker_id: JSON.parse(localStorage.getItem('user'))?.id 
        }
      });
      
      if (response.success) {
        if (onAcceptRequest) {
          onAcceptRequest(requestId);
        } else {
          // Update local state
          setRequests(prev => prev.filter(req => req.id !== requestId));
        }
        
        if (setToast) {
          setToast({
            show: true,
            message: "Request accepted successfully",
            type: "success",
          });
        }
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      if (setToast) {
        setToast({
          show: true,
          message: `Failed to accept request: ${error.message}`,
          type: "error",
        });
      }
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!requestId) {
      console.error('No request ID provided');
      return;
    }

    try {
      const response = await apiCall('REJECT_PROPERTY_REQUEST', { requestId }, {
        data: { status: 'rejected' }
      });
      
      if (response.success) {
        if (onRejectRequest) {
          onRejectRequest(requestId);
        } else {
          // Update local state
          setRequests(prev => prev.filter(req => req.id !== requestId));
        }
        
        if (setToast) {
          setToast({
            show: true,
            message: "Request rejected",
            type: "success",
          });
        }
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      if (setToast) {
        setToast({
          show: true,
          message: `Failed to reject request: ${error.message}`,
          type: "error",
        });
      }
    }
  };

  const handleMessageClient = (clientId) => {
    if (onMessageClient) {
      onMessageClient(clientId);
    } else {
      console.log('Message client:', clientId);
      // Default behavior: redirect to chat
      window.location.href = `/chat/${clientId}`;
    }
  };

  const filteredRequests = requests.filter(request => {
    // Status filter
    if (filter === 'pending' && request.status !== 'pending') return false;
    if (filter === 'assigned' && request.status !== 'assigned') return false;
    if (filter === 'accepted' && request.status !== 'accepted') return false;
    if (filter === 'rejected' && request.status !== 'rejected') return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (request.client_name || request.clientName || '').toLowerCase().includes(searchLower) ||
        (request.property_address || request.address || '').toLowerCase().includes(searchLower) ||
        (request.property_type || request.type || '').toLowerCase().includes(searchLower) ||
        (request.description || '').toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const formatCurrency = (amount) => {
    if (!amount) return 'ETB 0';
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'assigned':
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPropertyTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'house': return <Home className="w-4 h-4" />;
      case 'apartment': return <Building className="w-4 h-4" />;
      case 'commercial': return <Building className="w-4 h-4" />;
      case 'land': return <Square className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`p-4 lg:p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Property Requests</h2>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Review and accept property requests from sellers & landlords
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"} w-5 h-5`} />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              theme === "dark"
                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className={`text-lg font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            {searchTerm || filter !== 'all'
              ? "No matching requests found"
              : "No property requests available"}
          </p>
          <p className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
            {searchTerm || filter !== 'all'
              ? "Try adjusting your search or filter criteria"
              : "New requests will appear here when available"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(request => {
            const requestId = request.id || request.request_id;
            const clientName = request.client_name || request.clientName || request.user?.name || 'Unknown Client';
            const clientId = request.client_id || request.user_id;
            const propertyAddress = request.property_address || request.address || 'Address not specified';
            const propertyType = request.property_type || request.type || 'Property';
            const budget = request.budget || request.price || request.estimated_price;
            const description = request.description || request.notes || '';
            const bedrooms = request.bedrooms || request.beds;
            const bathrooms = request.bathrooms || request.baths;
            const area = request.area || request.square_feet || request.sqft;
            const requestDate = request.created_at || request.request_date;
            const status = request.status || 'pending';

            return (
              <div
                key={requestId}
                className={`p-4 rounded-xl border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(requestDate)}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{clientName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          {getPropertyTypeIcon(propertyType)}
                          <span className="capitalize">{propertyType}</span>
                        </div>
                        {bedrooms && (
                          <div className="flex items-center gap-1">
                            <Bed className="w-4 h-4" /> {bedrooms} beds
                          </div>
                        )}
                        {bathrooms && (
                          <div className="flex items-center gap-1">
                            <Bath className="w-4 h-4" /> {bathrooms} baths
                          </div>
                        )}
                        {area && (
                          <div className="flex items-center gap-1">
                            <Square className="w-4 h-4" /> {area} sqft
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{propertyAddress}</span>
                      </div>
                      {budget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            Budget: {formatCurrency(budget)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {description && (
                      <p className={`text-sm mb-3 line-clamp-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        {description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAcceptRequest(requestId)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(requestId)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                    
                    {clientId && (
                      <button
                        onClick={() => handleMessageClient(clientId)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </button>
                    )}
                    
                    <button
                      onClick={() => window.open(`/dashboard/requests/${requestId}`, '_blank')}
                      className={`px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors ${
                        theme === "dark"
                          ? "border-gray-600 text-gray-300"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredRequests.length > 0 && (
        <div className={`mt-6 pt-6 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex justify-between items-center">
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Showing {filteredRequests.length} of {requests.length} requests
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${
                refreshing ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh List
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerRequestsList;