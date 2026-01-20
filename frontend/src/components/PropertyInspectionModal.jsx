import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../utils/api.endpoints';
import { toast } from 'react-hot-toast';
import {
  X, Eye, CheckCircle, AlertCircle, FileText, Camera, Home,
  MapPin, Calendar, Clock, User, Shield, Check, ChevronRight,
  ClipboardCheck, FileCheck, Upload, Download, Image as ImageIcon,
  MessageCircle, Phone, Mail, Target, AlertTriangle, Star,
  ChevronDown, ChevronUp, Loader, FilePlus, ArrowRight
} from 'lucide-react';
import BrokerProfessionalTools from './BrokerProfessionalTools';

const PropertyInspectionModal = ({ isOpen, onClose, propertyData, broker, onComplete }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('inspection');
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionReport, setInspectionReport] = useState({
    property_id: propertyData?.id || null,
    broker_id: broker?.id || null,
    inspection_date: new Date().toISOString().split('T')[0],
    inspection_time: new Date().toTimeString().slice(0, 5),
    
    // Property Condition
    overall_condition: 'good', // poor, fair, good, excellent
    age_of_property: '',
    maintenance_status: 'well_maintained',
    
    // Dimensions & Measurements
    actual_area: propertyData?.sqft || '',
    area_unit: 'sqft',
    room_dimensions: {},
    
    // Structural Assessment
    structural_issues: [],
    foundation_condition: 'good',
    roof_condition: 'good',
    wall_condition: 'good',
    
    // Systems & Utilities
    electrical_condition: 'functional',
    plumbing_condition: 'functional',
    hvac_condition: 'functional',
    water_supply: 'reliable',
    
    // Legal & Documentation Verification
    title_deed_verified: false,
    property_tax_paid: false,
    utility_bills_cleared: false,
    encroachment_issues: false,
    
    // Safety & Compliance
    safety_hazards: [],
    building_code_compliance: 'partial',
    fire_safety: 'basic',
    security_features: [],
    
    // Amenities & Features Verification
    amenities_verified: propertyData?.amenities || [],
    additional_features: [],
    
    // Environmental Factors
    noise_level: 'moderate',
    sunlight_exposure: 'good',
    drainage: 'adequate',
    flood_risk: 'low',
    
    // Market Assessment
    estimated_market_value: propertyData?.price || '',
    value_adjustment_factors: [],
    rental_potential: '',
    
    // Photos & Documentation
    photos: [],
    videos: [],
    documents: [],
    
    // Recommendations
    recommended_repairs: [],
    suggested_improvements: [],
    immediate_attention_needed: false,
    
    // Final Assessment
    inspection_rating: 0,
    broker_comments: '',
    recommendation: 'list_as_is', // list_as_is, needs_repairs, not_recommended
    
    // Ethiopian Specific
    cadastral_verified: false,
    sub_city_office_verified: '',
    land_use_permit_verified: false,
    construction_permit_verified: false
  });
  
  const [uploadedFiles, setUploadedFiles] = useState({
    photos: [],
    videos: [],
    documents: []
  });
  const [showBrokerTools, setShowBrokerTools] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && propertyData) {
      loadPreviousInspections();
    }
  }, [isOpen, propertyData]);

  const loadPreviousInspections = async () => {
    try {
      const response = await apiCall('GET_PROPERTY_INSPECTIONS', { 
        propertyId: propertyData?.id 
      });
      if (response.success && response.data?.length > 0) {
        // Load last inspection data
        const lastInspection = response.data[0];
        setInspectionReport(prev => ({
          ...prev,
          ...lastInspection
        }));
      }
    } catch (error) {
      console.log('No previous inspections found');
    }
  };

  const handleInputChange = (field, value) => {
    setInspectionReport(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, value, action = 'toggle') => {
    setInspectionReport(prev => {
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

  const handleFileUpload = async (fileType, files) => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append(fileType, file);
      });
      formData.append('property_id', propertyData?.id);
      formData.append('broker_id', broker?.id);
      formData.append('inspection_id', inspectionReport.id || 'new');
      
      const response = await apiCall(`UPLOAD_INSPECTION_${fileType.toUpperCase()}`, {}, {
        data: formData
      });
      
      if (response.success) {
        const uploadedUrls = response.data?.urls || [];
        setUploadedFiles(prev => ({
          ...prev,
          [fileType]: [...prev[fileType], ...uploadedUrls]
        }));
        
        setInspectionReport(prev => ({
          ...prev,
          [fileType]: [...prev[fileType], ...uploadedUrls.map(url => ({
            url,
            type: fileType,
            uploaded_at: new Date().toISOString()
          }))]
        }));
        
        toast.success(`${files.length} ${fileType} uploaded successfully!`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${fileType}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateInspectionRating = () => {
    let rating = 0;
    let criteriaCount = 0;
    
    // Condition assessment (30%)
    const conditionScores = {
      'excellent': 30,
      'good': 20,
      'fair': 10,
      'poor': 0
    };
    rating += conditionScores[inspectionReport.overall_condition] || 0;
    criteriaCount++;
    
    // Structural (25%)
    const structuralScores = {
      foundation: { 'excellent': 10, 'good': 7, 'fair': 4, 'poor': 0 },
      roof: { 'excellent': 8, 'good': 6, 'fair': 3, 'poor': 0 },
      walls: { 'excellent': 7, 'good': 5, 'fair': 2, 'poor': 0 }
    };
    
    if (inspectionReport.foundation_condition) {
      rating += structuralScores.foundation[inspectionReport.foundation_condition] || 0;
      criteriaCount++;
    }
    if (inspectionReport.roof_condition) {
      rating += structuralScores.roof[inspectionReport.roof_condition] || 0;
      criteriaCount++;
    }
    if (inspectionReport.wall_condition) {
      rating += structuralScores.walls[inspectionReport.wall_condition] || 0;
      criteriaCount++;
    }
    
    // Systems (20%)
    const systemScores = {
      'functional': 7,
      'partial': 4,
      'needs_repair': 2,
      'non_functional': 0
    };
    
    ['electrical_condition', 'plumbing_condition', 'hvac_condition'].forEach(sys => {
      if (inspectionReport[sys]) {
        rating += systemScores[inspectionReport[sys]] || 0;
        criteriaCount++;
      }
    });
    
    // Legal compliance (15%)
    const legalPoints = 5;
    ['title_deed_verified', 'property_tax_paid', 'utility_bills_cleared'].forEach(legal => {
      if (inspectionReport[legal]) {
        rating += legalPoints;
        criteriaCount++;
      }
    });
    
    // Safety (10%)
    if (inspectionReport.fire_safety === 'adequate') rating += 10;
    else if (inspectionReport.fire_safety === 'basic') rating += 5;
    criteriaCount++;
    
    // Normalize to 0-100 scale
    return criteriaCount > 0 ? Math.round((rating / (criteriaCount * 10)) * 100) : 0;
  };

  const handleSubmitInspection = async () => {
    try {
      setIsSubmitting(true);
      
      // Calculate final rating
      const rating = calculateInspectionRating();
      const finalReport = {
        ...inspectionReport,
        inspection_rating: rating,
        submitted_at: new Date().toISOString(),
        broker_name: broker?.name || broker?.first_name,
        broker_license: broker?.license_number
      };
      
      const response = await apiCall('SUBMIT_INSPECTION_REPORT', {}, {
        data: finalReport
      });
      
      if (response.success) {
        toast.success('Inspection report submitted successfully!');
        if (onComplete) {
          onComplete(finalReport);
        }
        onClose();
      } else {
        throw new Error(response.message || 'Failed to submit inspection');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit inspection report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderConditionBadge = (condition) => {
    const colors = {
      'excellent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'good': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'fair': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'poor': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[condition]}`}>
        {condition?.charAt(0).toUpperCase() + condition?.slice(1)}
      </span>
    );
  };

  const renderInspectionTab = () => (
    <div className="space-y-6">
      {/* Property Summary */}
      <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-100'}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
            <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Property Being Inspected</h3>
            <p className="text-gray-600 dark:text-gray-300">{propertyData?.title}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium">{propertyData?.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium">{propertyData?.property_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Asking Price</p>
            <p className="font-medium text-amber-600">ETB {propertyData?.price?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium">{broker?.name || 'Property Owner'}</p>
          </div>
        </div>
      </div>

      {/* Overall Condition */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" />
          Overall Condition Assessment
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['excellent', 'good', 'fair', 'poor'].map(condition => (
            <button
              key={condition}
              onClick={() => handleInputChange('overall_condition', condition)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                inspectionReport.overall_condition === condition
                  ? 'border-amber-400 bg-amber-400/10'
                  : theme === 'dark'
                    ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{condition === 'excellent' ? '⭐️' : 
                                           condition === 'good' ? '👍' : 
                                           condition === 'fair' ? '⚠️' : '❌'}</div>
              <p className="font-medium capitalize">{condition}</p>
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Property Age (Years)</label>
            <input
              type="number"
              value={inspectionReport.age_of_property}
              onChange={(e) => handleInputChange('age_of_property', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Maintenance Status</label>
            <select
              value={inspectionReport.maintenance_status}
              onChange={(e) => handleInputChange('maintenance_status', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
            >
              <option value="well_maintained">Well Maintained</option>
              <option value="adequate">Adequate</option>
              <option value="needs_attention">Needs Attention</option>
              <option value="neglected">Neglected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Structural Assessment */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Structural Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { field: 'foundation_condition', label: 'Foundation', icon: '🏗️' },
            { field: 'roof_condition', label: 'Roof', icon: '🏠' },
            { field: 'wall_condition', label: 'Walls', icon: '🧱' }
          ].map(({ field, label, icon }) => (
            <div key={field} className={`p-4 rounded-xl border ${
              theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{icon}</span>
                <span className="font-medium">{label}</span>
              </div>
              <select
                value={inspectionReport[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Select Condition</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Systems Check */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Systems & Utilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { field: 'electrical_condition', label: 'Electrical', icon: '⚡' },
            { field: 'plumbing_condition', label: 'Plumbing', icon: '💧' },
            { field: 'hvac_condition', label: 'HVAC', icon: '🌡️' },
            { field: 'water_supply', label: 'Water Supply', icon: '🚰' }
          ].map(({ field, label, icon }) => (
            <div key={field} className={`p-4 rounded-xl border ${
              theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <span className="font-medium">{label}</span>
                </div>
                {inspectionReport[field] && (
                  <div className={`w-2 h-2 rounded-full ${
                    inspectionReport[field].includes('functional') ? 'bg-green-500' :
                    inspectionReport[field].includes('partial') ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                )}
              </div>
              <select
                value={inspectionReport[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Select Status</option>
                <option value="functional">Functional</option>
                <option value="partial">Partially Functional</option>
                <option value="needs_repair">Needs Repair</option>
                <option value="non_functional">Non-Functional</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Verification */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Legal & Documentation Verification
        </h3>
        
        <div className={`p-4 rounded-xl border ${
          theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-amber-50 border-amber-100'
        }`}>
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
            ⚖️ Ethiopian Property Law Compliance Check
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { field: 'title_deed_verified', label: 'Title Deed', desc: 'የባለቤትነት ማስረጃ' },
              { field: 'property_tax_paid', label: 'Property Tax', desc: 'የንብረት ግብር' },
              { field: 'utility_bills_cleared', label: 'Utility Bills', desc: 'የመገልገያ ሂሳቦች' },
              { field: 'encroachment_issues', label: 'No Encroachment', desc: 'የመሬት ከልማት' }
            ].map(({ field, label, desc }) => (
              <label key={field} className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={inspectionReport[field]}
                    onChange={(e) => handleInputChange(field, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-600 peer-checked:border-green-500 peer-checked:bg-green-500 transition-all duration-200 flex items-center justify-center">
                    {inspectionReport[field] && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Assessment */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Safety & Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Fire Safety</label>
            <select
              value={inspectionReport.fire_safety}
              onChange={(e) => handleInputChange('fire_safety', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
            >
              <option value="">Select Level</option>
              <option value="adequate">Adequate (Extinguishers, Alarms)</option>
              <option value="basic">Basic (Smoke Detectors)</option>
              <option value="insufficient">Insufficient</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Building Code Compliance</label>
            <select
              value={inspectionReport.building_code_compliance}
              onChange={(e) => handleInputChange('building_code_compliance', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
            >
              <option value="">Select Status</option>
              <option value="full">Full Compliance</option>
              <option value="partial">Partial Compliance</option>
              <option value="non_compliant">Non-Compliant</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Safety Hazards (Select all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {[
              'Electrical Hazards', 'Structural Cracks', 'Slippery Floors',
              'Poor Lighting', 'Inadequate Railings', 'Mold/Moisture',
              'Pest Infestation', 'Gas Leak Risk', 'Other'
            ].map(hazard => (
              <button
                key={hazard}
                onClick={() => handleArrayChange('safety_hazards', hazard, 'toggle')}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  inspectionReport.safety_hazards?.includes(hazard)
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border border-red-300 dark:border-red-700'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                }`}
              >
                {hazard}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Market Assessment */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Market Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Estimated Market Value (ETB)</label>
            <input
              type="number"
              value={inspectionReport.estimated_market_value}
              onChange={(e) => handleInputChange('estimated_market_value', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
              placeholder="Based on condition and location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Rental Potential (Monthly ETB)</label>
            <input
              type="number"
              value={inspectionReport.rental_potential}
              onChange={(e) => handleInputChange('rental_potential', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
              placeholder="If applicable"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Value Adjustment Factors</label>
          <div className="flex flex-wrap gap-2">
            {[
              'Prime Location', 'Recent Renovation', 'Good Schools Nearby',
              'Public Transport', 'Security Features', 'Modern Amenities',
              'Parking Space', 'Garden/Yard', 'Storage Space', 'View/Scenery'
            ].map(factor => (
              <button
                key={factor}
                onClick={() => handleArrayChange('value_adjustment_factors', factor, 'toggle')}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  inspectionReport.value_adjustment_factors?.includes(factor)
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border border-green-300 dark:border-green-700'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                }`}
              >
                {factor}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Photos & Documentation */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Photos & Documentation
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['photos', 'videos', 'documents'].map((type) => (
            <div key={type} className={`p-4 rounded-xl border ${
              theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {type === 'photos' ? <Camera className="w-5 h-5" /> :
                 type === 'videos' ? <FileText className="w-5 h-5" /> :
                 <FilePlus className="w-5 h-5" />}
                <h4 className="font-medium capitalize">{type}</h4>
              </div>
              
              <label className="block">
                <input
                  type="file"
                  multiple
                  accept={type === 'photos' ? 'image/*' : 
                         type === 'videos' ? 'video/*' : 
                         '.pdf,.doc,.docx,.txt'}
                  onChange={(e) => handleFileUpload(type, e.target.files)}
                  className="hidden"
                />
                <div className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-colors ${
                  theme === 'dark' ? 'border-gray-700 hover:border-amber-500' : 'border-gray-300 hover:border-amber-400'
                }`}>
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-500">Upload {type}</span>
                  <span className="text-xs text-gray-400 mt-1">
                    {type === 'photos' ? 'JPG, PNG (Max 10MB)' :
                     type === 'videos' ? 'MP4, MOV (Max 50MB)' :
                     'PDF, DOC (Max 20MB)'}
                  </span>
                </div>
              </label>
              
              {uploadedFiles[type]?.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 mb-2">
                    Uploaded: {uploadedFiles[type].length} {type}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles[type].slice(0, 3).map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded overflow-hidden">
                        {type === 'photos' ? (
                          <img src={url} alt={`${type} ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {uploadedFiles[type].length > 3 && (
                      <div className="w-16 h-16 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-sm">+{uploadedFiles[type].length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Recommendations & Final Assessment</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Final Recommendation</label>
            <select
              value={inspectionReport.recommendation}
              onChange={(e) => handleInputChange('recommendation', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
            >
              <option value="list_as_is">✅ List As Is</option>
              <option value="needs_minor_repairs">⚠️ Needs Minor Repairs</option>
              <option value="needs_major_repairs">🛠️ Needs Major Repairs</option>
              <option value="not_recommended">❌ Not Recommended</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Inspection Rating</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  style={{ width: `${calculateInspectionRating()}%` }}
                />
              </div>
              <span className="text-lg font-bold">{calculateInspectionRating()}/100</span>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Broker Comments</label>
          <textarea
            rows="4"
            value={inspectionReport.broker_comments}
            onChange={(e) => handleInputChange('broker_comments', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
            }`}
            placeholder="Provide detailed comments about the property condition, recommendations for the client, and any other observations..."
          />
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="immediate_attention"
            checked={inspectionReport.immediate_attention_needed}
            onChange={(e) => handleInputChange('immediate_attention_needed', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="immediate_attention" className="text-sm">
            <span className="font-medium text-red-600">⚠️ Immediate attention needed</span> - 
            <span className="text-gray-500"> Requires urgent repairs or safety measures</span>
          </label>
        </div>
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
              <Eye className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Property Inspection Report</h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-gray-500">{propertyData?.title}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">Broker: {broker?.name}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex">
            <button
              onClick={() => setActiveTab('inspection')}
              className={`flex-1 py-4 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'inspection'
                  ? 'border-amber-400 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Inspection Form
              </div>
            </button>
            <button
              onClick={() => setShowBrokerTools(!showBrokerTools)}
              className={`flex-1 py-4 text-center font-medium border-b-2 transition-colors ${
                showBrokerTools
                  ? 'border-amber-400 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                Professional Tools
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showBrokerTools ? (
            <BrokerProfessionalTools
              brokerId={broker?.id}
              propertyRequestId={propertyData?.id}
              clientData={propertyData}
              onComplete={(agreement) => {
                toast.success('Agreement prepared successfully!');
                setShowBrokerTools(false);
              }}
            />
          ) : (
            renderInspectionTab()
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${
          theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowBrokerTools(!showBrokerTools)}
                className={`px-6 py-2 rounded-lg font-medium ${
                  theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {showBrokerTools ? 'Back to Inspection' : 'Professional Tools'}
              </button>
              
              {!showBrokerTools && (
                <button
                  onClick={handleSubmitInspection}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Inspection Report
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyInspectionModal;