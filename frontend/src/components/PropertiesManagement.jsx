import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Bed, 
  Bath, 
  Square, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Star,
  TrendingUp,
  Download,
  Share2,
  Users,
  Building,
  Layers
} from 'lucide-react';
import { httpClient } from "../services/http.service";
import { API_CONFIG } from "../config/api.config";

const PropertiesManagement = ({ theme }) => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyStats, setPropertyStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    sold: 0,
    rented: 0,
    totalValue: 0
  });
  const [analyticsData, setAnalyticsData] = useState(null);

  // Fetch properties data
  useEffect(() => {
    fetchProperties();
    fetchPropertyAnalytics();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.PROPERTIES);
      if (response.data) {
        setProperties(response.data);
        calculateStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPropertyAnalytics = async () => {
    try {
      const response = await httpClient.get('/analytics/properties');
      if (response.data) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching property analytics:', error);
      // Fallback mock data
      setAnalyticsData({
        byType: {
          residential: 35,
          commercial: 25,
          land: 15,
          apartment: 20,
          house: 5
        },
        byStatus: {
          active: 60,
          pending: 20,
          sold: 15,
          rented: 5
        },
        priceDistribution: {
          '0-500k': 30,
          '500k-1M': 25,
          '1M-2M': 20,
          '2M-5M': 15,
          '5M+': 10
        },
        locationDistribution: {
          'Addis Ababa': 40,
          'Dire Dawa': 15,
          'Bahir Dar': 10,
          'Hawassa': 8,
          'Mekelle': 7,
          'Other': 20
        }
      });
    }
  };

  const calculateStats = (propertiesData) => {
    const stats = {
      total: propertiesData.length,
      active: propertiesData.filter(p => p.status === 'active').length,
      pending: propertiesData.filter(p => p.status === 'pending').length,
      sold: propertiesData.filter(p => p.status === 'sold').length,
      rented: propertiesData.filter(p => p.status === 'rented').length,
      totalValue: propertiesData.reduce((sum, p) => sum + (p.price || 0), 0)
    };
    setPropertyStats(stats);
  };

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearch = 
        property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || property.property_type === filterType;
      const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [properties, searchTerm, filterType, filterStatus]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'rented': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'residential': return <Home className="w-4 h-4" />;
      case 'commercial': return <Building className="w-4 h-4" />;
      case 'apartment': return <Layers className="w-4 h-4" />;
      case 'house': return <Home className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  const handleViewProperty = (property) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await httpClient.delete(`${API_CONFIG.ENDPOINTS.PROPERTIES}/${propertyId}`);
        fetchProperties();
      } catch (error) {
        console.error('Error deleting property:', error);
      }
    }
  };

  const PropertyCard = ({ property }) => (
    <div className={`border rounded-xl p-4 transition-all duration-300 hover:shadow-lg ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="relative mb-4">
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-300 dark:bg-gray-700">
          {property.images?.[0] ? (
            <img 
              src={property.images[0]} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
          )}
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          {property.is_featured && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> Featured
            </span>
          )}
          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(property.status)}`}>
            {property.status}
          </span>
        </div>
      </div>
      
      <h3 className={`font-semibold mb-2 truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        {property.title}
      </h3>
      
      <div className="flex items-center gap-1 mb-2 text-sm text-gray-500 dark:text-gray-400">
        <MapPin className="w-4 h-4" />
        <span className="truncate">{property.city}, {property.neighborhood}</span>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {formatCurrency(property.price)}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1">
            <Bed className="w-4 h-4" /> {property.beds || '-'}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-4 h-4" /> {property.baths || '-'}
          </span>
          <span className="flex items-center gap-1">
            <Square className="w-4 h-4" /> {property.sqft ? `${property.sqft} sqft` : '-'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1">
          {getTypeIcon(property.property_type)}
          <span className="capitalize">{property.property_type}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(property.created_at)}</span>
        </div>
      </div>
      
      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleViewProperty(property)}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" /> View
        </button>
        <button className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteProperty(property.id)}
          className="p-2 rounded-lg border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Property Management
          </h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage all property listings and analytics
          </p>
        </div>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-green-500">+12%</span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {propertyStats.total}
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Properties
          </p>
        </div>

        <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-green-500">+8%</span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(propertyStats.totalValue)}
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Value
          </p>
        </div>

        <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium text-green-500">+15%</span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {propertyStats.active}
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Active Listings
          </p>
        </div>

        <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-green-500">+5%</span>
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {propertyStats.pending}
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Pending Sales
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} w-5 h-5`} />
            <input
              type="text"
              placeholder="Search properties by title, address, or city..."
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                  : 'bg-white text-black border-gray-300 placeholder-gray-500'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-black border-gray-300'
              }`}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
            </select>
            
            <select
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-black border-gray-300'
              }`}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
            
            <button className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
              <Filter className="w-4 h-4" /> More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`h-64 rounded-xl animate-pulse ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className={`text-center py-12 rounded-xl border-2 border-dashed ${
          theme === 'dark'
            ? 'border-gray-600 text-gray-400 bg-gray-800/50'
            : 'border-gray-300 text-gray-500 bg-gray-50'
        }`}>
          <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No properties found</p>
          <p className="text-sm">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No properties available'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertiesManagement;