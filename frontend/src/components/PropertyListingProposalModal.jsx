import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../utils/api.endpoints';
import { toast } from 'react-hot-toast';
import {
  X, FileText, Home, DollarSign, MapPin, Calendar, Clock,
  User, CheckCircle, Edit, Camera, Image as ImageIcon,
  ChevronRight, ChevronLeft, Download, Send, Printer,
  MessageCircle, Star, TrendingUp, Shield, Eye, Check,
  AlertCircle, Loader, ExternalLink, FileCheck, Target,
  BarChart3, Building, Bed, Bath, Square, Users, Phone,
  Mail, ArrowRight, ThumbsUp, ThumbsDown, FileSignature
} from 'lucide-react';

const PropertyListingProposalModal = ({ isOpen, onClose, proposal, propertyData, broker, onApprove }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalData, setProposalData] = useState({
    // Basic Info
    title: proposal?.title || `Listing Proposal for ${propertyData?.title}`,
    reference_number: `PROP-${Date.now().toString().slice(-8)}`,
    created_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    
    // Property Details
    property_id: propertyData?.id || null,
    property_type: propertyData?.property_type || 'residential',
    location: propertyData?.location || '',
    address: propertyData?.address || '',
    city: propertyData?.city || '',
    
    // Pricing Strategy
    asking_price: proposal?.price || propertyData?.price || 0,
    price_currency: 'ETB',
    commission_rate: proposal?.commission_rate || '2.5%',
    commission_amount: 0,
    earnest_money_percentage: 10,
    earnest_money_amount: 0,
    
    // Listing Details
    listing_duration: 90, // days
    listing_type: proposal?.listing_type || 'exclusive',
    marketing_plan: [
      'Professional Photography',
      'Virtual Tour',
      'MLS Listing',
      'Social Media Promotion',
      'Open House Events',
      'Broker Network Marketing'
    ],
    
    // Property Features
    bedrooms: propertyData?.beds || 0,
    bathrooms: propertyData?.baths || 0,
    square_feet: propertyData?.sqft || 0,
    lot_size: propertyData?.lot_size || '',
    year_built: propertyData?.year_built || '',
    property_condition: 'good',
    
    // Amenities & Features
    amenities: propertyData?.amenities || [],
    features: propertyData?.features || [],
    
    // Market Analysis
    comparable_properties: [],
    market_trend: 'stable',
    days_on_market_estimate: 45,
    expected_offers: 'within_range',
    
    // Broker Services
    broker_services: [
      'Property Valuation & Pricing Strategy',
      'Professional Marketing & Advertising',
      'Showing Coordination & Open Houses',
      'Offer Negotiation & Contract Preparation',
      'Closing Process Management',
      'Post-Sale Support'
    ],
    
    // Terms & Conditions
    terms: [
      'Exclusive right to sell for listing duration',
      'Commission payable upon successful closing',
      'Marketing expenses covered by broker',
      'Regular updates and reporting',
      'Flexible showing schedule',
      'Digital signature acceptance'
    ],
    
    // Broker Information
    broker_name: broker?.name || '',
    broker_license: broker?.license_number || '',
    brokerage_firm: broker?.brokerage_firm || 'WubLand Real Estate',
    broker_phone: broker?.phone || '',
    broker_email: broker?.email || '',
    broker_experience: broker?.years_experience || '5+ years',
    
    // Client Acceptance
    client_acceptance: false,
    client_signature: '',
    acceptance_date: '',
    
    // Digital Assets
    photos: [],
    videos: [],
    documents: [],
    
    // Status
    status: 'draft', // draft, submitted, approved, rejected
    submitted_at: '',
    approved_at: '',
    
    // Ethiopian Specific
    cadastral_verified: false,
    title_deed_verified: false,
    property_tax_cleared: false,
    dara_office: 'Addis Ababa DARA Main Office'
  });
  
  const [editableFields, setEditableFields] = useState({});
  const [clientFeedback, setClientFeedback] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  useEffect(() => {
    if (isOpen && proposal) {
      // Calculate commission amount
      const price = parseFloat(proposalData.asking_price) || 0;
      const commissionRate = parseFloat(proposalData.commission_rate) || 2.5;
      const commissionAmount = (price * commissionRate) / 100;
      const earnestAmount = (price * proposalData.earnest_money_percentage) / 100;
      
      setProposalData(prev => ({
        ...prev,
        commission_amount: commissionAmount,
        earnest_money_amount: earnestAmount,
        ...proposal
      }));
      
      loadComparableProperties();
    }
  }, [isOpen, proposal]);

  const loadComparableProperties = async () => {
    try {
      const response = await apiCall('GET_COMPARABLE_PROPERTIES', {
        location: propertyData?.location,
        propertyType: propertyData?.property_type
      });
      
      if (response.success) {
        setProposalData(prev => ({
          ...prev,
          comparable_properties: response.data || []
        }));
      }
    } catch (error) {
      console.log('Could not load comparable properties');
    }
  };

  const handleInputChange = (field, value) => {
    setProposalData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Recalculate amounts if price or commission changes
      if (field === 'asking_price' || field === 'commission_rate') {
        const price = parseFloat(field === 'asking_price' ? value : prev.asking_price) || 0;
        const commissionRate = parseFloat(field === 'commission_rate' ? value : prev.commission_rate) || 2.5;
        const commissionAmount = (price * commissionRate) / 100;
        const earnestAmount = (price * prev.earnest_money_percentage) / 100;
        
        updated.commission_amount = commissionAmount;
        updated.earnest_money_amount = earnestAmount;
      }
      
      return updated;
    });
  };

  const handleArrayChange = (field, value, action = 'toggle') => {
    setProposalData(prev => {
      const currentArray = prev[field] || [];
      let newArray;
      
      if (action === 'toggle') {
        if (currentArray.includes(value)) {
          newArray = currentArray.filter(item => item !== value);
        } else {
          newArray = [...currentArray, value];
        }
      } else if (action === 'add') {
        newArray = [...currentArray, value];
      } else if (action === 'remove') {
        newArray = currentArray.filter(item => item !== value);
      }
      
      return { ...prev, [field]: newArray };
    });
  };

  const toggleEditField = (field) => {
    setEditableFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const saveFieldEdit = (field) => {
    toggleEditField(field);
    toast.success('Field updated');
  };

  const handleSubmitProposal = async (action) => {
    try {
      setIsSubmitting(true);
      
      const submissionData = {
        ...proposalData,
        status: action === 'approve' ? 'approved' : 'rejected',
        client_feedback: clientFeedback,
        client_signature: signatureData,
        acceptance_date: action === 'approve' ? new Date().toISOString() : null,
        submitted_at: new Date().toISOString()
      };
      
      const response = await apiCall('SUBMIT_PROPOSAL_RESPONSE', {}, {
        data: submissionData
      });
      
      if (response.success) {
        toast.success(`Proposal ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        
        if (action === 'approve' && onApprove) {
          onApprove(submissionData);
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(`Failed to ${action} proposal`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('GENERATE_PROPOSAL_PDF', {}, {
        data: proposalData
      });
      
      if (response.success && response.data?.pdf_url) {
        window.open(response.data.pdf_url, '_blank');
        toast.success('PDF generated successfully!');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-block p-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 mb-4">
          <FileText className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-bold">Property Listing Proposal</h3>
        <p className="text-gray-500">Professional marketing and sales strategy</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm">
            {proposalData.reference_number}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-sm">
            Valid until: {new Date(proposalData.valid_until).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Property Summary */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-amber-50 border-amber-100'
      }`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900">
            <Home className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold">Property Summary</h4>
            <p className="text-gray-500">{proposalData.title}</p>
          </div>
          <button
            onClick={() => setActiveTab('details')}
            className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:underline"
          >
            View Details
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Asking Price</p>
            <p className="text-xl font-bold text-amber-600">
              {formatCurrency(proposalData.asking_price)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Commission</p>
            <p className="text-xl font-bold text-blue-600">
              {proposalData.commission_rate}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Listing Duration</p>
            <p className="text-xl font-bold text-green-600">
              {proposalData.listing_duration} days
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Property Type</p>
            <p className="text-xl font-bold text-purple-600">
              {proposalData.property_type}
            </p>
          </div>
        </div>
      </div>

      {/* Broker Information */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-100'
      }`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-lg font-bold">Your Broker</h4>
            <p className="text-gray-500">Professional representation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {broker?.name?.charAt(0) || 'B'}
          </div>
          <div className="flex-1">
            <h5 className="font-bold text-lg">{broker?.name}</h5>
            <p className="text-gray-500">{broker?.brokerage_firm}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{broker?.average_rating || 4.8}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span>{broker?.total_completed_deals || 50} deals</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Verified</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('broker')}
            className="px-4 py-2 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
          >
            View Profile
          </button>
        </div>
      </div>

      {/* Key Benefits */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-green-50 border-green-100'
      }`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="text-lg font-bold">Key Benefits</h4>
            <p className="text-gray-500">Why choose this proposal</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Professional photography & virtual tour',
            'MLS & online platform exposure',
            'Expert pricing strategy',
            'Skilled negotiation',
            'Secure transaction process',
            'Regular updates & communication'
          ].map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Marketing Plan Preview */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-purple-50 border-purple-100'
      }`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="text-lg font-bold">Marketing Plan</h4>
            <p className="text-gray-500">Comprehensive property promotion</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {proposalData.marketing_plan.slice(0, 6).map((item, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {idx + 1}
                  </span>
                </div>
                <span className="font-medium">{item}</span>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setActiveTab('marketing')}
          className="w-full mt-4 py-2 text-center text-purple-600 dark:text-purple-400 hover:underline"
        >
          View Complete Marketing Plan
        </button>
      </div>

      {/* Call to Action */}
      <div className="text-center p-6 rounded-xl border-2 border-amber-400 bg-amber-400/10">
        <h4 className="text-xl font-bold mb-2">Ready to Move Forward?</h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Review the complete proposal and take the next step
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setActiveTab('details')}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg flex items-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Review Full Proposal
          </button>
          <button
            onClick={() => setActiveTab('acceptance')}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg flex items-center gap-2"
          >
            <ThumbsUp className="w-5 h-5" />
            Proceed to Acceptance
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-2xl font-bold">Property Details</h3>
            <p className="text-gray-500">Complete property information</p>
          </div>
        </div>
        <button
          onClick={() => setEditableFields(prev => ({ ...prev, details: !prev.details }))}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          {editableFields.details ? 'Cancel Edit' : 'Edit Details'}
        </button>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl border ${
          theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Home className="w-5 h-5" />
            Property Specifications
          </h4>
          <div className="space-y-4">
            {[
              { label: 'Property Type', value: proposalData.property_type, field: 'property_type' },
              { label: 'Bedrooms', value: proposalData.bedrooms, field: 'bedrooms', icon: Bed },
              { label: 'Bathrooms', value: proposalData.bathrooms, field: 'bathrooms', icon: Bath },
              { label: 'Square Feet', value: proposalData.square_feet, field: 'square_feet', icon: Square },
              { label: 'Year Built', value: proposalData.year_built, field: 'year_built', icon: Building },
              { label: 'Property Condition', value: proposalData.property_condition, field: 'property_condition' }
            ].map(({ label, value, field, icon: Icon }) => (
              <div key={field} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4 text-gray-400" />}
                  <span className="text-gray-600 dark:text-gray-300">{label}</span>
                </div>
                {editableFields.details ? (
                  <input
                    type={typeof value === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="w-32 px-3 py-1 border rounded text-right"
                  />
                ) : (
                  <span className="font-medium">{value || 'N/A'}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${
          theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Details
          </h4>
          <div className="space-y-4">
            {[
              { label: 'Address', value: proposalData.address, field: 'address' },
              { label: 'City', value: proposalData.city, field: 'city' },
              { label: 'Location', value: proposalData.location, field: 'location' },
              { label: 'Cadastral Verified', value: proposalData.cadastral_verified ? 'Yes' : 'No', field: 'cadastral_verified' },
              { label: 'Title Deed Verified', value: proposalData.title_deed_verified ? 'Yes' : 'No', field: 'title_deed_verified' },
              { label: 'Property Tax Cleared', value: proposalData.property_tax_cleared ? 'Yes' : 'No', field: 'property_tax_cleared' }
            ].map(({ label, value, field }) => (
              <div key={field} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">{label}</span>
                {editableFields.details ? (
                  <div className="flex items-center gap-2">
                    {field.includes('_verified') || field.includes('_cleared') ? (
                      <select
                        value={proposalData[field]}
                        onChange={(e) => handleInputChange(field, e.target.value === 'true')}
                        className="px-3 py-1 border rounded"
                      >
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className="w-48 px-3 py-1 border rounded"
                      />
                    )}
                  </div>
                ) : (
                  <span className={`font-medium ${field.includes('_verified') || field.includes('_cleared') ? 
                    (proposalData[field] ? 'text-green-600' : 'text-red-600') : ''
                  }`}>
                    {value || 'N/A'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Amenities & Features */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-100'
      }`}>
        <h4 className="text-lg font-bold mb-4">Amenities & Features</h4>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">Select Amenities</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Swimming Pool', 'Garden', 'Parking', 'Security System',
                'Air Conditioning', 'Heating', 'Balcony', 'Fireplace',
                'Hardwood Floors', 'Modern Kitchen', 'Walk-in Closet',
                'Laundry Room', 'Storage', 'Pet Friendly', 'Wheelchair Access'
              ].map(amenity => (
                <button
                  key={amenity}
                  onClick={() => handleArrayChange('amenities', amenity, 'toggle')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    proposalData.amenities?.includes(amenity)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-2">Additional Features</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Energy Efficient', 'Smart Home', 'Renovated Kitchen',
                'Updated Bathrooms', 'New Roof', 'Solar Panels',
                'Water Well', 'Generator', 'Water Tank', 'Furnished'
              ].map(feature => (
                <button
                  key={feature}
                  onClick={() => handleArrayChange('features', feature, 'toggle')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    proposalData.features?.includes(feature)
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border border-green-300 dark:border-green-700'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editableFields.details && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setEditableFields(prev => ({ ...prev, details: false }))}
            className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => saveFieldEdit('details')}
            className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );

  const renderPricingTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-2xl font-bold">Pricing & Commission</h3>
            <p className="text-gray-500">Financial terms and breakdown</p>
          </div>
        </div>
        <button
          onClick={() => setEditableFields(prev => ({ ...prev, pricing: !prev.pricing }))}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          {editableFields.pricing ? 'Cancel Edit' : 'Edit Pricing'}
        </button>
      </div>

      {/* Asking Price */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-amber-50 border-amber-100'
      }`}>
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Asking Price
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">Property Value</span>
            {editableFields.pricing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={proposalData.asking_price}
                  onChange={(e) => handleInputChange('asking_price', e.target.value)}
                  className="w-48 px-4 py-2 border rounded text-right text-lg font-bold"
                />
                <span className="font-bold">ETB</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-amber-600">
                {formatCurrency(proposalData.asking_price)}
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            Based on market analysis and comparable properties in the area
          </div>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-100'
      }`}>
        <h4 className="text-lg font-bold mb-4">Commission Breakdown</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Commission Rate</p>
              <p className="text-sm text-gray-500">Standard industry rate</p>
            </div>
            {editableFields.pricing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={parseFloat(proposalData.commission_rate)}
                  onChange={(e) => handleInputChange('commission_rate', e.target.value)}
                  className="w-24 px-3 py-2 border rounded text-right"
                />
                <span className="font-bold">%</span>
              </div>
            ) : (
              <span className="text-xl font-bold text-blue-600">
                {proposalData.commission_rate}%
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Commission Amount</p>
              <p className="text-sm text-gray-500">Payable upon successful sale</p>
            </div>
            <span className="text-xl font-bold">
              {formatCurrency(proposalData.commission_amount)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Earnest Money</p>
              <p className="text-sm text-gray-500">{proposalData.earnest_money_percentage}% of asking price</p>
            </div>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(proposalData.earnest_money_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Market Comparison */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-green-50 border-green-100'
      }`}>
        <h4 className="text-lg font-bold mb-4">Market Comparison</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">Average Price in Area</span>
            <span className="font-bold">
              {formatCurrency(proposalData.asking_price * 0.9)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">Highest Sale in Area</span>
            <span className="font-bold">
              {formatCurrency(proposalData.asking_price * 1.2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">Days on Market Estimate</span>
            <span className="font-bold">{proposalData.days_on_market_estimate} days</span>
          </div>
        </div>
      </div>

      {/* Comparable Properties */}
      {proposalData.comparable_properties.length > 0 && (
        <div className={`p-6 rounded-xl border ${
          theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h4 className="text-lg font-bold mb-4">Comparable Properties</h4>
          <div className="space-y-3">
            {proposalData.comparable_properties.slice(0, 3).map((prop, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{prop.address}</p>
                  <p className="text-sm text-gray-500">{prop.property_type} • {prop.bedrooms} bed</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(prop.price)}</p>
                  <p className="text-sm text-gray-500">Sold {prop.days_on_market} days ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editableFields.pricing && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setEditableFields(prev => ({ ...prev, pricing: false }))}
            className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => saveFieldEdit('pricing')}
            className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );

  const renderMarketingTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-2xl font-bold">Marketing Plan</h3>
          <p className="text-gray-500">Comprehensive property promotion strategy</p>
        </div>
      </div>

      {/* Marketing Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            title: 'Online Presence',
            items: [
              'MLS Listing',
              'WubLand Platform',
              'Social Media (Facebook, Instagram)',
              'Real Estate Portals',
              'Email Marketing',
              'Broker Network'
            ],
            color: 'blue'
          },
          {
            title: 'Visual Marketing',
            items: [
              'Professional Photography',
              'Virtual Tour',
              'Drone Footage',
              'Video Walkthrough',
              'Floor Plans',
              'Property Brochure'
            ],
            color: 'purple'
          },
          {
            title: 'Traditional Marketing',
            items: [
              'Open Houses',
              'Broker Tours',
              'Print Advertising',
              'Signage',
              'Direct Mail',
              'Local Publications'
            ],
            color: 'green'
          },
          {
            title: 'Targeted Marketing',
            items: [
              'Investor Network',
              'Relocation Services',
              'Corporate Partnerships',
              'International Buyers',
              'First-time Homebuyers',
              'Luxury Market'
            ],
            color: 'amber'
          }
        ].map((section) => (
          <div key={section.title} className={`p-6 rounded-xl border ${
            theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h4 className="text-lg font-bold mb-4">{section.title}</h4>
            <ul className="space-y-2">
              {section.items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-${section.color}-500`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-amber-50 border-amber-100'
      }`}>
        <h4 className="text-lg font-bold mb-4">Marketing Timeline</h4>
        <div className="space-y-4">
          {[
            { week: 'Week 1', tasks: ['Professional photos', 'MLS listing', 'Social media launch'] },
            { week: 'Week 2-4', tasks: ['Open houses', 'Broker tours', 'Email campaigns'] },
            { week: 'Week 5-8', tasks: ['Price review', 'Additional marketing', 'Showings'] },
            { week: 'Week 9-12', tasks: ['Offer negotiations', 'Closing preparation', 'Post-sale'] }
          ].map((period) => (
            <div key={period.week} className="flex gap-4">
              <div className="w-24 flex-shrink-0">
                <div className="font-bold text-amber-600">{period.week}</div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {period.tasks.map((task, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm border">
                      {task}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBrokerTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-2xl font-bold">Broker Profile</h3>
          <p className="text-gray-500">Your professional representative</p>
        </div>
      </div>

      {/* Broker Card */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - Profile */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {broker?.name?.charAt(0) || 'B'}
              </div>
              <div>
                <h4 className="text-2xl font-bold">{broker?.name}</h4>
                <p className="text-gray-500">{broker?.brokerage_firm}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold">{broker?.average_rating || 4.8}</span>
                    <span className="text-gray-500">({broker?.total_reviews || 42} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{broker?.phone || '+251 9X XXX XXXX'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span>{broker?.email || 'broker@wubland.com'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <span>{broker?.total_completed_deals || 50} completed deals</span>
              </div>
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-gray-400" />
                <span>{broker?.years_experience || '5+'} years experience</span>
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="md:w-1/3">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm text-gray-500">Specialization</p>
                <p className="font-bold">{broker?.specialization || 'Residential Properties'}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="font-bold">92%</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <p className="text-sm text-gray-500">Average Days on Market</p>
                <p className="font-bold">45 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Broker Services */}
        <div className="mt-6 pt-6 border-t">
          <h5 className="font-bold mb-3">Services Included</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {proposalData.broker_services.map((service, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials (Mock) */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <h4 className="text-lg font-bold mb-4">Client Testimonials</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Sarah M.', review: 'Professional and efficient. Sold my property in 30 days!' },
            { name: 'Michael T.', review: 'Excellent negotiation skills. Got 15% above asking price.' },
            { name: 'Lisa K.', review: 'Made the whole process smooth and stress-free.' },
            { name: 'David P.', review: 'Highly recommended. Great communication throughout.' }
          ].map((testimonial, idx) => (
            <div key={idx} className="p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="italic">"{testimonial.review}"</p>
              <p className="font-medium mt-2">- {testimonial.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAcceptanceTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-2xl font-bold">Accept Proposal</h3>
          <p className="text-gray-500">Review and accept the listing agreement</p>
        </div>
      </div>

      {/* Summary */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-amber-50 border-amber-100'
      }`}>
        <h4 className="text-lg font-bold mb-4">Proposal Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Property</p>
            <p className="font-medium">{proposalData.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Asking Price</p>
            <p className="font-medium text-amber-600">
              {formatCurrency(proposalData.asking_price)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Commission</p>
            <p className="font-medium">{proposalData.commission_rate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Listing Duration</p>
            <p className="font-medium">{proposalData.listing_duration} days</p>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-100'
      }`}>
        <h4 className="text-lg font-bold mb-4">Terms & Conditions</h4>
        <div className="space-y-3">
          {proposalData.terms.map((term, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>{term}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Client Feedback */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h4 className="text-lg font-bold mb-4">Your Feedback</h4>
        <textarea
          rows="4"
          value={clientFeedback}
          onChange={(e) => setClientFeedback(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border mb-4 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}
          placeholder="Any comments, questions, or special requests..."
        />
        
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="accept_terms"
            checked={proposalData.client_acceptance}
            onChange={(e) => handleInputChange('client_acceptance', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="accept_terms" className="text-sm">
            I have read and agree to the terms and conditions of this listing agreement
          </label>
        </div>
      </div>

      {/* Digital Signature */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <h4 className="text-lg font-bold mb-4">Digital Signature</h4>
        {showSignature ? (
          <div className="space-y-4">
            <div className="h-32 border-2 border-dashed rounded-lg flex items-center justify-center">
              {signatureData ? (
                <img src={signatureData} alt="Signature" className="max-h-28" />
              ) : (
                <p className="text-gray-500">Draw your signature above</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignature(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  // In a real app, this would capture signature from canvas
                  setSignatureData('data:image/png;base64,...');
                  setShowSignature(false);
                  toast.success('Signature saved');
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg"
              >
                Save Signature
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSignature(true)}
            className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:border-amber-400 transition-colors"
          >
            <FileSignature className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-gray-500">Click to add your signature</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => handleSubmitProposal('reject')}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ThumbsDown className="w-5 h-5" />
          Reject Proposal
        </button>
        
        <button
          onClick={() => handleSubmitProposal('approve')}
          disabled={isSubmitting || !proposalData.client_acceptance || !signatureData}
          className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ThumbsUp className="w-5 h-5" />
              Accept & Sign Agreement
            </>
          )}
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col ${
          theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              theme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100'
            }`}>
              <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Property Listing Proposal</h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-gray-500">{proposalData.reference_number}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">Prepared by: {broker?.name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={generatePDF}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <div className="flex min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'details', label: 'Property Details', icon: Home },
              { id: 'pricing', label: 'Pricing', icon: DollarSign },
              { id: 'marketing', label: 'Marketing', icon: BarChart3 },
              { id: 'broker', label: 'Broker', icon: User },
              { id: 'acceptance', label: 'Acceptance', icon: FileCheck }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-amber-400 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'pricing' && renderPricingTab()}
          {activeTab === 'marketing' && renderMarketingTab()}
          {activeTab === 'broker' && renderBrokerTab()}
          {activeTab === 'acceptance' && renderAcceptanceTab()}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${
          theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Proposal valid until: {new Date(proposalData.valid_until).toLocaleDateString()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => setActiveTab('acceptance')}
                className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg flex items-center gap-2"
              >
                <FileCheck className="w-5 h-5" />
                Review & Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyListingProposalModal;