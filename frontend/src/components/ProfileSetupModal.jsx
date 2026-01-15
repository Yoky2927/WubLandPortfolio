import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../utils/api.endpoints';
import DocumentUploadModal from './DocumentUploadModal';
import { toast } from 'react-hot-toast';

// Clean icon imports
import {
  X, User, Shield, CheckCircle,
  MapPin, Home, DollarSign, Calendar, Upload, ArrowRight,
  Check, Briefcase, Award, Banknote,
  Phone, Mail, Map, CreditCard, Building, Users,
  IdCard, UserCheck,
  Loader, AlertCircle, Key, Wallet,
  Clock, Heart, Star,
  ShieldCheck, ShieldAlert,
  House, Factory, Store, School, Hotel,
  Church, AlertTriangle, Sparkles,
  Info, FileCheck,
  Bed, Bath, Car,
  Coffee, ShoppingBag, GraduationCap, Hospital,
  FileUp, FileImage, FileArchive, FileClock, FileQuestion,
  Landmark, UserCircle, FileText
} from 'lucide-react';

// Ethiopian regions data
import ethiopianRegions from '../data/ethiopian-regions';

const ProfileSetupModal = ({ isOpen, onClose, user, onComplete, userType = 'buyer', ethiopianMode = true }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // State variables
  const [selectedRegion, setSelectedRegion] = useState('');
  const [cities, setCities] = useState([]);
  const [subCities, setSubCities] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  const isDark = theme === 'dark';

  // Determine user type
  const determineUserType = useCallback(() => {
    if (user?.role) {
      if (user.role.includes('broker')) return 'broker';
      if (user.role === 'seller' || user.role === 'landlord') return 'seller';
      if (user.role === 'buyer') return 'buyer';
      if (user.role === 'renter') return 'renter';
    }
    return userType || 'user';
  }, [user, userType]);

  const actualUserType = determineUserType();

  // Generate kebele ID
  const generateKebeleId = useCallback(() => {
    const regionCode = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const zoneCode = Math.floor(Math.random() * 100).toString().padStart(3, '0');
    const personalCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${regionCode}/${zoneCode}/${personalCode}`;
  }, []);

  // Profile data state
  const [profileData, setProfileData] = useState(() => {
    const userPhone = user?.phone || user?.phone_number || '';
    
    return {
      // Personal Info
      full_name: user?.full_name || user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || '',
      email: user?.email || '',
      phone: userPhone,
      phone_country_code: user?.phone_country_code || '+251',
      date_of_birth: user?.date_of_birth || '',
      gender: user?.gender || '',

      // Ethiopian-specific fields
      kebele_id: user?.kebele_id || generateKebeleId(),
      passport_number: user?.passport_number || '',
      nationality: user?.nationality || 'Ethiopian',
      living_abroad: user?.living_abroad || false,

      // Contact Info
      emergency_contact_name: user?.emergency_contact_name || '',
      emergency_contact_phone: user?.emergency_contact_phone || '',
      emergency_contact_relationship: user?.emergency_contact_relationship || '',
      alternative_phone: user?.alternative_phone || '',

      // Address
      region: user?.region || '',
      city: user?.city || '',
      sub_city: user?.sub_city || '',
      woreda: user?.woreda || '',
      kebele_address: user?.kebele_address || '',
      current_address: user?.current_address || user?.address || '',
      postal_code: user?.postal_code || '',

      // Preferences
      preferred_regions: user?.preferred_regions || [],
      preferred_cities: user?.preferred_cities || [],
      budget_min: user?.budget_min || '',
      budget_max: user?.budget_max || '',
      currency: user?.currency || 'ETB',
      property_type: user?.property_type || '',
      bedrooms: user?.bedrooms || '',
      bathrooms: user?.bathrooms || '',
      investment_purpose: user?.investment_purpose || '',
      
      rental_duration: user?.rental_duration || '',
      family_size: user?.family_size || '',
      pet_friendly: user?.pet_friendly || false,
      furnished: user?.furnished || false,
      employment_status: user?.employment_status || '',
      monthly_income: user?.monthly_income || '',
      
      property_type_owned: user?.property_type_owned || '',
      property_location: user?.property_location || '',
      property_value_estimate: user?.property_value_estimate || '',
      ownership_duration: user?.ownership_duration || '',
      property_ownership_proof: user?.property_ownership_proof || '',
      
      timeline: user?.timeline || '',
      financing_method: user?.financing_method || '',
      required_amenities: user?.required_amenities || [],
      preferred_features: user?.preferred_features || [],

      // Broker Info
      broker_license_number: user?.broker_license_number || '',
      broker_license_expiry: user?.broker_license_expiry || '',
      tin_number: user?.tin_number || '',
      brokerage_firm: user?.brokerage_firm || '',
      experience_years: user?.experience_years || '',
      commission_rate: user?.commission_rate || '',
      specialization: user?.specialization || [],
      service_areas: user?.service_areas || [],

      // Verification Documents
      id_document: user?.id_document || null,
      id_document_status: user?.id_document_status || 'pending',
      proof_of_income: user?.proof_of_income || null,
      proof_of_income_status: user?.proof_of_income_status || 'pending',
      reference_letter: user?.reference_letter || null,
      kebele_id_document: user?.kebele_id_document || null,
      kebele_id_status: user?.kebele_id_status || 'pending',
      passport_document: user?.passport_document || null,
      broker_license_doc: user?.broker_license_doc || null,
      tax_certificate: user?.tax_certificate || null,

      // Profile completion
      profile_complete: user?.profile_complete || false,
      verification_status: user?.verification_status || 'unverified',
      profile_completion_percentage: user?.profile_completion_percentage || 0
    };
  });

  // Check if profile is already completed
  useEffect(() => {
    if (user) {
      const completed = user.profile_complete || localStorage.getItem('profile_completed') === 'true';
      setHasSubmitted(completed);
    }
  }, [user]);

  // Check missing fields
  const checkMissingFields = useCallback(() => {
    const requiredFields = [
      { key: 'full_name', label: 'Full Name' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'date_of_birth', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'region', label: 'Region' },
      { key: 'city', label: 'City' }
    ];

    const missing = requiredFields.filter(field => {
      const value = profileData[field.key];
      return !value || (typeof value === 'string' && value.trim() === '');
    }).map(field => field.label);

    setMissingFields(missing);
    return missing.length === 0;
  }, [profileData]);

  // Fetch existing documents
  const fetchExistingDocuments = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      let response;
      let documents = [];
      
      try {
        response = await apiCall('GET_MY_DOCUMENTS', {}, { method: 'GET' });
        if (response.success && response.documents) {
          documents = response.documents;
        }
      } catch (error) {
        console.log('GET_MY_DOCUMENTS failed:', error);
      }
      
      if (documents.length === 0) {
        try {
          response = await apiCall('GET_VERIFICATION_STATUS', {}, { method: 'GET' });
          if (response.success && response.documents) {
            documents = response.documents;
          }
        } catch (error) {
          console.log('GET_VERIFICATION_STATUS failed:', error);
        }
      }
      
      const parsedDocuments = documents.map(doc => ({
        id: doc.id || Date.now(),
        type: doc.type || doc.document_type,
        url: doc.url || doc.document_url,
        filename: doc.filename || doc.document_filename,
        status: doc.status || 'pending',
        uploaded_at: doc.uploaded_at || doc.created_at,
        size: doc.size || 0
      })).filter(doc => doc && doc.type);

      setExistingDocuments(parsedDocuments);
      setDocumentUploaded(parsedDocuments.length > 0);
      
      return parsedDocuments;
    } catch (error) {
      console.error('Error fetching documents:', error);
      setExistingDocuments([]);
      return [];
    }
  }, [isOpen]);

  // Initialize modal
  useEffect(() => {
    if (isOpen) {
      if (profileData.region) {
        setSelectedRegion(profileData.region);
        updateCities(profileData.region);
      }
      
      fetchExistingDocuments();
      checkMissingFields();
    }
  }, [isOpen, profileData.region, fetchExistingDocuments, checkMissingFields]);

  // Auto-fill function
  const autoFillMissingData = () => {
    const autoFilled = { ...profileData };
    let changesMade = false;
    
    const fieldsToFill = [
      { key: 'full_name', value: user?.full_name || user?.name || `${user?.first_name || 'User'} ${user?.last_name || 'Name'}`.trim() || 'John Doe' },
      { key: 'phone', value: user?.phone || user?.phone_number || '+251900000000' },
      { key: 'date_of_birth', value: '1990-01-01' },
      { key: 'gender', value: 'other' },
      { key: 'region', value: 'addis_ababa' },
      { key: 'city', value: 'Addis Ababa' },
      { key: 'current_address', value: 'Addis Ababa, Ethiopia' },
      { key: 'emergency_contact_name', value: 'Family Member' },
      { key: 'emergency_contact_phone', value: autoFilled.phone || '+251911223344' },
      { key: 'emergency_contact_relationship', value: 'Family' },
      { key: 'alternative_phone', value: autoFilled.phone || '+251922334455' }
    ];

    fieldsToFill.forEach(field => {
      const currentValue = autoFilled[field.key];
      const isEmpty = !currentValue || (typeof currentValue === 'string' && currentValue.trim() === '');
      
      if (isEmpty) {
        autoFilled[field.key] = field.value;
        changesMade = true;
      }
    });

    if (changesMade) {
      setProfileData(autoFilled);
      
      if (autoFilled.region && autoFilled.region !== selectedRegion) {
        setSelectedRegion(autoFilled.region);
        updateCities(autoFilled.region);
      }
      
      setTimeout(() => {
        checkMissingFields();
      }, 100);
      
      toast.success('Missing data auto-filled successfully!', {
        icon: '✨',
        duration: 3000
      });
    } else {
      toast.info('All required fields are already filled!', {
        icon: '✅',
        duration: 2000
      });
    }
  };

  // Update cities based on region
  const updateCities = useCallback((region) => {
    if (!region) {
      setCities([]);
      setSubCities([]);
      return;
    }

    const regionData = ethiopianRegions[region];
    if (regionData?.cities) {
      setCities(regionData.cities);
      setSubCities([]);
    } else {
      setCities([]);
    }
  }, []);

  // Update sub-cities based on city
  const updateSubCities = useCallback((cityValue) => {
    if (!selectedRegion || !cityValue) {
      setSubCities([]);
      return;
    }

    const regionData = ethiopianRegions[selectedRegion];
    const city = regionData?.cities?.find(c => c.value === cityValue);
    setSubCities(city?.subCities || []);
  }, [selectedRegion]);

  // Handle region change
  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    setProfileData(prev => ({ ...prev, region, city: '', sub_city: '', woreda: '' }));
    updateCities(region);
  };

  // Handle city change
  const handleCityChange = (city) => {
    setProfileData(prev => ({ ...prev, city, sub_city: '', woreda: '' }));
    updateSubCities(city);
  };

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  // Get required documents
  const getRequiredDocuments = useCallback(() => {
    const hasKebeleId = existingDocuments.some(doc => doc.type === 'kebele_id');
    const hasIdCard = existingDocuments.some(doc => doc.type === 'id_card');
    const hasPassport = existingDocuments.some(doc => doc.type === 'passport');
    const hasProofIncome = existingDocuments.some(doc => doc.type === 'proof_of_income');

    const isEthiopianInEthiopia = profileData.nationality === 'Ethiopian' && !profileData.living_abroad;

    const baseDocs = [
      {
        id: 'kebele_id',
        name: 'Kebele ID',
        description: 'For Ethiopian citizens living in Ethiopia',
        required: isEthiopianInEthiopia,
        optional: !isEthiopianInEthiopia,
        status: hasKebeleId ? 'pending_review' : 'missing',
        uploaded: hasKebeleId,
        icon: IdCard,
        statusColor: hasKebeleId ? 'amber' : 'red'
      },
      {
        id: 'id_card',
        name: 'National ID',
        description: 'Government issued ID card',
        required: !isEthiopianInEthiopia,
        optional: isEthiopianInEthiopia,
        status: hasIdCard ? 'pending_review' : 'missing',
        uploaded: hasIdCard,
        icon: UserCheck,
        statusColor: hasIdCard ? 'amber' : 'red'
      },
      {
        id: 'passport',
        name: 'Passport',
        description: 'For diaspora/foreign nationals',
        required: profileData.living_abroad || profileData.nationality !== 'Ethiopian',
        optional: profileData.nationality === 'Ethiopian' && !profileData.living_abroad,
        status: hasPassport ? 'pending_review' : 'missing',
        uploaded: hasPassport,
        icon: UserCheck,
        statusColor: hasPassport ? 'amber' : 'red'
      },
      {
        id: 'proof_of_income',
        name: 'Proof of Income',
        description: '3 months salary slip or bank statement',
        required: ['buyer', 'renter', 'seller', 'landlord'].includes(actualUserType),
        optional: actualUserType === 'broker',
        status: hasProofIncome ? 'pending_review' : 'missing',
        uploaded: hasProofIncome,
        icon: Banknote,
        statusColor: hasProofIncome ? 'amber' : 'red'
      },
    ];

    if (actualUserType === 'broker') {
      baseDocs.push({
        id: 'broker_license',
        name: 'Broker License',
        description: 'Valid broker license document',
        required: true,
        uploaded: false,
        status: 'missing',
        icon: Award,
        statusColor: 'red'
      });
    }

    return baseDocs;
  }, [existingDocuments, profileData.nationality, profileData.living_abroad, actualUserType]);

  // Calculate completion percentage
  const calculateCompletionPercentage = useCallback(() => {
    const commonRequiredFields = [
      'full_name', 'phone', 'date_of_birth', 'gender',
      'region', 'city'
    ];

    let fieldScore = 0;
    commonRequiredFields.forEach(field => {
      const value = profileData[field];
      if (value && (typeof value === 'string' ? value.trim() !== '' : true)) {
        fieldScore += 1;
      }
    });
    
    const fieldCompletion = (fieldScore / commonRequiredFields.length) * 50;
    
    const requiredDocs = getRequiredDocuments().filter(doc => doc.required);
    const hasIdentification = existingDocuments.some(doc => 
      ['id_card', 'passport', 'kebele_id'].includes(doc.type)
    );
    
    let docScore = 0;
    
    requiredDocs.forEach(doc => {
      if (existingDocuments.some(existingDoc => existingDoc.type === doc.id)) {
        docScore += 1;
      }
    });
    
    if (hasIdentification) {
      docScore += 1;
    }
    
    const docCompletion = (docScore / Math.max(requiredDocs.length + 1, 1)) * 50;
    
    const totalCompletion = Math.min(fieldCompletion + docCompletion, 100);
    
    return Math.round(totalCompletion);
  }, [profileData, getRequiredDocuments, existingDocuments]);

  const completionPercentage = useMemo(() => calculateCompletionPercentage(), [calculateCompletionPercentage]);

  const handleProfileUpdate = async () => {
    const allFieldsFilled = checkMissingFields();
    
    if (!allFieldsFilled || hasSubmitted) {
      if (!allFieldsFilled) {
        toast.error(`Please fill in: ${missingFields.join(', ')}`);
      } else {
        toast.error('Profile already completed');
      }
      return;
    }

    setIsLoading(true);

    const nameParts = profileData.full_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const baseData = {
      first_name: firstName,
      last_name: lastName,
      username: user?.username || 'user_' + Date.now(),
      
      full_name: profileData.full_name,
      phone: profileData.phone,
      phone_country_code: profileData.phone_country_code,
      date_of_birth: profileData.date_of_birth,
      gender: profileData.gender,

      nationality: profileData.nationality,
      living_abroad: profileData.living_abroad,
      kebele_id: profileData.kebele_id,
      passport_number: profileData.passport_number,

      region: profileData.region,
      city: profileData.city,
      sub_city: profileData.sub_city,
      woreda: profileData.woreda,
      kebele_address: profileData.kebele_address,
      current_address: profileData.current_address,
      postal_code: profileData.postal_code,

      emergency_contact_name: profileData.emergency_contact_name,
      emergency_contact_phone: profileData.emergency_contact_phone,
      emergency_contact_relationship: profileData.emergency_contact_relationship,
      alternative_phone: profileData.alternative_phone,

      profile_complete: true,
      profile_completion_percentage: completionPercentage,
      verification_status: 'pending',
      setup_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const flexibleUserData = {
      preferred_regions: profileData.preferred_regions,
      preferred_cities: profileData.preferred_cities,
      budget_min: profileData.budget_min,
      budget_max: profileData.budget_max,
      currency: profileData.currency || 'ETB',
      property_type: profileData.property_type,
      bedrooms: profileData.bedrooms,
      bathrooms: profileData.bathrooms,
      investment_purpose: profileData.investment_purpose,
      
      rental_duration: profileData.rental_duration,
      family_size: profileData.family_size,
      pet_friendly: profileData.pet_friendly,
      furnished: profileData.furnished,
      employment_status: profileData.employment_status,
      monthly_income: profileData.monthly_income,
      
      property_type_owned: profileData.property_type_owned,
      property_location: profileData.property_location,
      property_value_estimate: profileData.property_value_estimate,
      ownership_duration: profileData.ownership_duration,
      property_ownership_proof: profileData.property_ownership_proof,
      
      timeline: profileData.timeline,
      financing_method: profileData.financing_method
    };

    const brokerData = actualUserType === 'broker' ? {
      broker_license_number: profileData.broker_license_number,
      broker_license_expiry: profileData.broker_license_expiry,
      tin_number: profileData.tin_number,
      brokerage_firm: profileData.brokerage_firm,
      experience_years: profileData.experience_years,
      commission_rate: profileData.commission_rate,
      specialization: profileData.specialization,
      service_areas: profileData.service_areas
    } : {};

    const updatedData = { ...baseData, ...flexibleUserData, ...brokerData };

    let apiSuccess = false;
    try {
      const response = await apiCall('UPDATE_PROFILE', {}, {
        data: updatedData
      });

      if (response && response.success) {
        apiSuccess = true;
        toast.success('Profile completed successfully!');
        setHasSubmitted(true);

        if (response.data) {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...currentUser,
            ...response.data
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

      } else {
        toast.error(response?.message || 'Failed to save profile to server');
      }

    } catch (error) {
      console.error('API Error:', error);
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = {
      ...currentUser,
      ...updatedData
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem('profile_completed', 'true');
    localStorage.setItem('profile_completion_percentage', completionPercentage.toString());
    localStorage.setItem('profile_completed_at', new Date().toISOString());

    if (!apiSuccess) {
      toast.success('Profile saved locally! Some features may be limited.', {
        icon: '💾',
        duration: 4000
      });
    }

    if (onComplete) {
      try {
        onComplete(updatedUser);
      } catch (callbackError) {
        console.error('Callback error:', callbackError);
      }
    }

    setIsLoading(false);
    onClose();
  };

  const openUploadModal = (documentType) => {
    setUploadDocumentType(documentType);
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = async (uploadedDoc) => {
    try {
      setIsLoading(true);
      setUploadProgress(30);

      await fetchExistingDocuments();
      setUploadProgress(70);

      toast.success('Document uploaded successfully!', {
        duration: 3000,
        icon: '📄'
      });

      setIsUploadModalOpen(false);

    } catch (error) {
      console.error('Error handling uploaded document:', error);
      toast.error('Failed to update document status');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Render Profile Tab
  const renderProfileTab = () => (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-2xl ${isDark ? 'bg-gradient-to-br from-amber-900/80 to-amber-800/80' : 'bg-gradient-to-br from-amber-100 to-amber-200'}`}>
          <User className={`w-6 h-6 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
        </div>
        <div>
          <h4 className={`text-lg font-semibold font-inter ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
            Personal Information
          </h4>
          <p className={`text-sm font-inter ${isDark ? 'text-amber-200/80' : 'text-amber-700/80'}`}>
            Tell us about yourself
          </p>
        </div>
      </div>

      {missingFields.length > 0 && (
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-gradient-to-br from-amber-950/50 to-amber-900/30 border-amber-800' : 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <div>
              <p className={`font-medium font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                Missing Required Fields
              </p>
              <p className={`text-sm font-inter mt-1 ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                Please fill in: <span className="font-semibold">{missingFields.join(', ')}</span>
              </p>
              <button
                onClick={autoFillMissingData}
                className={`mt-2 px-3 py-1.5 text-sm rounded-lg transition-colors font-inter ${isDark ? 'bg-amber-900/50 text-amber-300 hover:bg-amber-800/50' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
              >
                Click here to auto-fill missing fields
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
            Full Name *
          </label>
          <input
            type="text"
            value={profileData.full_name}
            onChange={(e) => handleFieldChange('full_name', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100 placeholder-amber-400/50' : 'bg-white border-amber-300 text-amber-900 placeholder-amber-600/50'} focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all`}
            placeholder="Enter your full name"
            required
            disabled={hasSubmitted}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
            Email
          </label>
          <input
            type="email"
            value={profileData.email}
            disabled
            className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/50 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-700'} cursor-not-allowed`}
          />
          <p className={`text-xs font-inter mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            Email cannot be changed
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
            Phone Number *
          </label>
          <div className="flex gap-2">
            <div className="w-24">
              <select
                value={profileData.phone_country_code}
                onChange={(e) => handleFieldChange('phone_country_code', e.target.value)}
                className={`w-full px-3 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
                disabled={hasSubmitted}
              >
                <option value="+251">🇪🇹 +251</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+971">🇦🇪 +971</option>
              </select>
            </div>
            <div className="flex-1">
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100 placeholder-amber-400/50' : 'bg-white border-amber-300 text-amber-900 placeholder-amber-600/50'} focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                placeholder="9XX XXX XXX"
                required
                disabled={hasSubmitted}
              />
            </div>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
            Date of Birth *
          </label>
          <input
            type="date"
            value={profileData.date_of_birth}
            onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'} focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
            required
            disabled={hasSubmitted}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
            Gender *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['male', 'female', 'other'].map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => !hasSubmitted && handleFieldChange('gender', gender)}
                className={`px-4 py-3 rounded-lg border transition-all font-inter ${profileData.gender === gender
                  ? 'border-amber-500 bg-gradient-to-r from-amber-100 to-amber-200/50 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-600 dark:text-amber-400'
                  : isDark
                    ? 'bg-amber-950/30 border-amber-800 text-amber-300 hover:border-amber-700'
                    : 'bg-white border-amber-300 text-amber-700 hover:border-amber-400'
                  } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={hasSubmitted}
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 border-t border-amber-200 dark:border-amber-800 pt-6 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-gradient-to-br from-amber-900/50 to-amber-800/50' : 'bg-gradient-to-br from-amber-100 to-amber-200'}`}>
              <Phone className={`w-5 h-5 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            </div>
            <h4 className={`text-lg font-semibold font-inter ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
              Emergency Contact Information
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={profileData.emergency_contact_name}
                onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100 placeholder-amber-400/50' : 'bg-white border-amber-300 text-amber-900 placeholder-amber-600/50'}`}
                placeholder="Full name of emergency contact"
                disabled={hasSubmitted}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={profileData.emergency_contact_phone}
                onChange={(e) => handleFieldChange('emergency_contact_phone', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100 placeholder-amber-400/50' : 'bg-white border-amber-300 text-amber-900 placeholder-amber-600/50'}`}
                placeholder="Phone number"
                disabled={hasSubmitted}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                Relationship
              </label>
              <select
                value={profileData.emergency_contact_relationship}
                onChange={(e) => handleFieldChange('emergency_contact_relationship', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
                disabled={hasSubmitted}
              >
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="child">Child</option>
                <option value="friend">Friend</option>
                <option value="relative">Relative</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                Alternative Phone
              </label>
              <input
                type="tel"
                value={profileData.alternative_phone}
                onChange={(e) => handleFieldChange('alternative_phone', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100 placeholder-amber-400/50' : 'bg-white border-amber-300 text-amber-900 placeholder-amber-600/50'}`}
                placeholder="Alternative phone number"
                disabled={hasSubmitted}
              />
            </div>
          </div>
        </div>

        {ethiopianMode && (
          <>
            <div>
              <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                Nationality
              </label>
              <select
                value={profileData.nationality}
                onChange={(e) => handleFieldChange('nationality', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
                disabled={hasSubmitted}
              >
                <option value="Ethiopian">Ethiopian 🇪🇹</option>
                <option value="Diaspora">Ethiopian Diaspora</option>
                <option value="Foreigner">Foreigner</option>
              </select>
            </div>

            {profileData.nationality === 'Ethiopian' && (
              <div>
                <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                  Living Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => !hasSubmitted && handleFieldChange('living_abroad', false)}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all font-inter ${!profileData.living_abroad
                      ? 'border-amber-500 bg-gradient-to-r from-amber-100 to-amber-200/50 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-600 dark:text-amber-400'
                      : isDark
                        ? 'bg-amber-950/30 border-amber-800 text-amber-300 hover:border-amber-700'
                        : 'bg-white border-amber-300 text-amber-700 hover:border-amber-400'
                      } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={hasSubmitted}
                  >
                    In Ethiopia
                  </button>
                  <button
                    type="button"
                    onClick={() => !hasSubmitted && handleFieldChange('living_abroad', true)}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-all font-inter ${profileData.living_abroad
                      ? 'border-amber-500 bg-gradient-to-r from-amber-100 to-amber-200/50 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-600 dark:text-amber-400'
                      : isDark
                        ? 'bg-amber-950/30 border-amber-800 text-amber-300 hover:border-amber-700'
                        : 'bg-white border-amber-300 text-amber-700 hover:border-amber-400'
                      } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={hasSubmitted}
                  >
                    Abroad
                  </button>
                </div>
              </div>
            )}

            {profileData.nationality === 'Ethiopian' && !profileData.living_abroad && (
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                  Kebele ID Number
                </label>
                <input
                  type="text"
                  value={profileData.kebele_id}
                  onChange={(e) => handleFieldChange('kebele_id', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100 placeholder-amber-400/50' : 'bg-white border-amber-300 text-amber-900 placeholder-amber-600/50'}`}
                  placeholder="ኢት/ግ/ር/ቁ"
                  disabled={hasSubmitted}
                />
              </div>
            )}

            {(profileData.nationality !== 'Ethiopian' || profileData.living_abroad) && (
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                  Passport Number
                </label>
                <input
                  type="text"
                  value={profileData.passport_number}
                  onChange={(e) => handleFieldChange('passport_number', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100 placeholder-amber-400/50' : 'bg-white border-amber-300 text-amber-900 placeholder-amber-600/50'}`}
                  placeholder="For diaspora/foreign nationals"
                  disabled={hasSubmitted}
                />
              </div>
            )}
          </>
        )}
      </div>

      {ethiopianMode && (
        <div className="mt-8 pt-8 border-t border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-gradient-to-br from-amber-900/80 to-amber-800/80' : 'bg-gradient-to-br from-amber-100 to-amber-200'}`}>
              <MapPin className={`w-6 h-6 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            </div>
            <div>
              <h4 className={`text-lg font-semibold font-inter ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
                Address in Ethiopia
              </h4>
              <p className={`text-sm font-inter ${isDark ? 'text-amber-200/80' : 'text-amber-700/80'}`}>
                Your location in Ethiopia
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                Region (ክልል) *
              </label>
              <select
                value={profileData.region}
                onChange={(e) => handleRegionChange(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
                required
                disabled={hasSubmitted}
              >
                <option value="">Select Region</option>
                {Object.entries(ethiopianRegions).map(([key, region]) => (
                  <option key={key} value={key}>{region.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                City/Zone (ከተማ/ዞን) *
              </label>
              <select
                value={profileData.city}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={!profileData.region || hasSubmitted}
                className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'} disabled:opacity-50`}
                required
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city.value} value={city.value}>{city.label}</option>
                ))}
              </select>
            </div>

            {profileData.region === 'addis_ababa' && cities.length > 0 ? (
              <div>
                <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                  Sub-city (ክፍለ ከተማ)
                </label>
                <select
                  value={profileData.sub_city}
                  onChange={(e) => handleFieldChange('sub_city', e.target.value)}
                  disabled={!profileData.city || hasSubmitted}
                  className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'} disabled:opacity-50`}
                >
                  <option value="">Select Sub-city</option>
                  {subCities.map(subCity => (
                    <option key={subCity.value} value={subCity.value}>{subCity.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                  Woreda (ወረዳ)
                </label>
                <input
                  type="text"
                  value={profileData.woreda}
                  onChange={(e) => handleFieldChange('woreda', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100 placeholder-amber-400/50' : 'bg-white border-amber-300 text-amber-900 placeholder-amber-600/50'}`}
                  placeholder="Enter woreda"
                  disabled={hasSubmitted}
                />
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                Kebele (ቀበሌ)
              </label>
              <input
                type="text"
                value={profileData.kebele_address}
                onChange={(e) => handleFieldChange('kebele_address', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100 placeholder-amber-400/50' : 'bg-white border-amber-300 text-amber-900 placeholder-amber-600/50'}`}
                placeholder="Enter kebele"
                disabled={hasSubmitted}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                Complete Address
              </label>
              <textarea
                value={profileData.current_address}
                onChange={(e) => handleFieldChange('current_address', e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100 placeholder-amber-400/50' : 'bg-white border-amber-300 text-amber-900 placeholder-amber-600/50'}`}
                placeholder="House number, street name, landmark, etc."
                disabled={hasSubmitted}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // NEW: Render Preferences Tab
  const renderPreferencesTab = () => {
    const isFlexibleUser = ['buyer', 'renter', 'seller', 'landlord'].includes(actualUserType);

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-gradient-to-br from-amber-900/80 to-amber-800/80' : 'bg-gradient-to-br from-amber-100 to-amber-200'}`}>
            <Home className={`w-6 h-6 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
          </div>
          <div>
            <h4 className={`text-lg font-semibold font-inter ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
              Property Preferences & Requirements
            </h4>
            <p className={`text-sm font-inter ${isDark ? 'text-amber-200/80' : 'text-amber-700/80'}`}>
              {isFlexibleUser 
                ? 'Tell us what you\'re looking for or what you have to offer' 
                : 'Set your property preferences'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Preferred Regions in Ethiopia
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(ethiopianRegions).slice(0, 8).map(([key, region]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (hasSubmitted) return;
                    const regions = profileData.preferred_regions || [];
                    if (regions.includes(key)) {
                      setProfileData({
                        ...profileData,
                        preferred_regions: regions.filter(r => r !== key)
                      });
                    } else {
                      setProfileData({
                        ...profileData,
                        preferred_regions: [...regions, key]
                      });
                    }
                  }}
                  className={`px-3 py-3 rounded-lg border transition-all text-sm font-inter ${(profileData.preferred_regions || []).includes(key)
                    ? 'border-amber-500 bg-gradient-to-r from-amber-100 to-amber-200/50 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-600 dark:text-amber-400'
                    : isDark
                      ? 'bg-amber-950/30 border-amber-800 text-amber-300 hover:border-amber-700'
                      : 'bg-white border-amber-300 text-amber-700 hover:border-amber-400'
                  } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={hasSubmitted}
                >
                  {region.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Budget Range ({profileData.currency})
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  value={profileData.budget_min}
                  onChange={(e) => handleFieldChange('budget_min', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
                  placeholder="Minimum"
                  disabled={hasSubmitted}
                />
                <p className={`text-xs font-inter mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Minimum</p>
              </div>
              <div>
                <input
                  type="number"
                  value={profileData.budget_max}
                  onChange={(e) => handleFieldChange('budget_max', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
                  placeholder="Maximum"
                  disabled={hasSubmitted}
                />
                <p className={`text-xs font-inter mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Maximum</p>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Currency
            </label>
            <select
              value={profileData.currency}
              onChange={(e) => handleFieldChange('currency', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
              disabled={hasSubmitted}
            >
              <option value="ETB">ETB - Ethiopian Birr</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Property Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { value: 'apartment', label: 'Apartment', icon: Building },
                { value: 'house', label: 'House/Villa', icon: Home },
                { value: 'condo', label: 'Condominium', icon: Users },
                { value: 'studio', label: 'Studio', icon: Home },
                { value: 'commercial', label: 'Commercial', icon: Briefcase },
                { value: 'land', label: 'Land Plot', icon: Map },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => !hasSubmitted && handleFieldChange('property_type', type.value)}
                  className={`px-4 py-3 rounded-lg border transition-all flex items-center justify-center gap-2 font-inter ${profileData.property_type === type.value
                    ? 'border-amber-500 bg-gradient-to-r from-amber-100 to-amber-200/50 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-600 dark:text-amber-400'
                    : isDark
                      ? 'bg-amber-950/30 border-amber-800 text-amber-300 hover:border-amber-700'
                      : 'bg-white border-amber-300 text-amber-700 hover:border-amber-400'
                  } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={hasSubmitted}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Bedrooms
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5+'].map((bed) => (
                <button
                  key={bed}
                  type="button"
                  onClick={() => !hasSubmitted && handleFieldChange('bedrooms', bed)}
                  className={`px-3 py-3 rounded-lg border transition-all font-inter ${profileData.bedrooms === bed
                    ? 'border-amber-500 bg-gradient-to-r from-amber-100 to-amber-200/50 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-600 dark:text-amber-400'
                    : isDark
                      ? 'bg-amber-950/30 border-amber-800 text-amber-300 hover:border-amber-700'
                      : 'bg-white border-amber-300 text-amber-700 hover:border-amber-400'
                  } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={hasSubmitted}
                >
                  {bed}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Bathrooms
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4+'].map((bath) => (
                <button
                  key={bath}
                  type="button"
                  onClick={() => !hasSubmitted && handleFieldChange('bathrooms', bath)}
                  className={`px-3 py-3 rounded-lg border transition-all font-inter ${profileData.bathrooms === bath
                    ? 'border-amber-500 bg-gradient-to-r from-amber-100 to-amber-200/50 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-600 dark:text-amber-400'
                    : isDark
                      ? 'bg-amber-950/30 border-amber-800 text-amber-300 hover:border-amber-700'
                      : 'bg-white border-amber-300 text-amber-700 hover:border-amber-400'
                  } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={hasSubmitted}
                >
                  {bath}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Purpose
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Personal Use', 'Rental Income', 'Commercial Use', 'Investment'].map((purpose) => (
                <button
                  key={purpose}
                  type="button"
                  onClick={() => !hasSubmitted && handleFieldChange('investment_purpose', purpose)}
                  className={`px-3 py-3 rounded-lg border transition-all font-inter ${profileData.investment_purpose === purpose
                    ? 'border-amber-500 bg-gradient-to-r from-amber-100 to-amber-200/50 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-600 dark:text-amber-400'
                    : isDark
                      ? 'bg-amber-950/30 border-amber-800 text-amber-300 hover:border-amber-700'
                      : 'bg-white border-amber-300 text-amber-700 hover:border-amber-400'
                  } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={hasSubmitted}
                >
                  {purpose}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Rental Duration (Optional)
            </label>
            <select
              value={profileData.rental_duration}
              onChange={(e) => handleFieldChange('rental_duration', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
              disabled={hasSubmitted}
            >
              <option value="">Not Applicable</option>
              <option value="short_term">Short Term (1-6 months)</option>
              <option value="6_months">6 Months</option>
              <option value="1_year">1 Year</option>
              <option value="2_years">2 Years</option>
              <option value="long_term">Long Term</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Family Size (Optional)
            </label>
            <input
              type="number"
              value={profileData.family_size}
              onChange={(e) => handleFieldChange('family_size', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
              placeholder="Number of people"
              min="1"
              max="20"
              disabled={hasSubmitted}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Additional Requirements
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-inter">
                <input
                  type="checkbox"
                  checked={profileData.pet_friendly}
                  onChange={(e) => handleFieldChange('pet_friendly', e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  disabled={hasSubmitted}
                />
                <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>Pet Friendly</span>
              </label>
              <label className="flex items-center gap-2 font-inter">
                <input
                  type="checkbox"
                  checked={profileData.furnished}
                  onChange={(e) => handleFieldChange('furnished', e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  disabled={hasSubmitted}
                />
                <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>Furnished</span>
              </label>
            </div>
          </div>

          {['seller', 'landlord'].includes(actualUserType) && (
            <div>
              <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                Property Details (If selling/leasing)
              </label>
              <input
                type="text"
                value={profileData.property_location}
                onChange={(e) => handleFieldChange('property_location', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
                placeholder="Location of property"
                disabled={hasSubmitted}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Timeline (Optional)
            </label>
            <select
              value={profileData.timeline}
              onChange={(e) => handleFieldChange('timeline', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
              disabled={hasSubmitted}
            >
              <option value="">No specific timeline</option>
              <option value="immediate">Immediate (Within 1 month)</option>
              <option value="1_3_months">1-3 Months</option>
              <option value="3_6_months">3-6 Months</option>
              <option value="6_12_months">6-12 Months</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
              Financing Method (Optional)
            </label>
            <select
              value={profileData.financing_method}
              onChange={(e) => handleFieldChange('financing_method', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border font-inter ${isDark ? 'bg-amber-950/30 border-amber-800 text-amber-100' : 'bg-white border-amber-300 text-amber-900'}`}
              disabled={hasSubmitted}
            >
              <option value="">Select if applicable</option>
              <option value="cash">Cash</option>
              <option value="mortgage">Mortgage</option>
              <option value="installment">Installment Plan</option>
              <option value="mixed">Mixed (Cash + Mortgage)</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  // Render Verification Tab
  const renderVerificationTab = () => {
    const requiredDocuments = getRequiredDocuments();
    
    const getDocumentStatus = (docId) => {
      const doc = existingDocuments.find(d => d.type === docId);
      if (!doc) return 'missing';
      return doc.status || 'pending';
    };

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-gradient-to-br from-amber-900/80 to-amber-800/80' : 'bg-gradient-to-br from-amber-100 to-amber-200'}`}>
            <Shield className={`w-6 h-6 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
          </div>
          <div>
            <h4 className={`text-lg font-semibold font-inter ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
              Identity Verification
            </h4>
            <p className={`text-sm font-inter ${isDark ? 'text-amber-200/80' : 'text-amber-700/80'}`}>
              Upload required documents for verification
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-amber-950/30 to-amber-900/20 border-amber-800' : 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className={`text-sm font-medium font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                Verification Progress
              </span>
              <p className={`text-xs font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-600/80'}`}>
                Complete all steps to get verified
              </p>
            </div>
            <span className={`text-2xl font-bold font-inter ${completionPercentage >= 70 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {completionPercentage}%
            </span>
          </div>
          <div className={`h-3 rounded-full ${isDark ? 'bg-amber-900/50' : 'bg-amber-200'} overflow-hidden`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${completionPercentage >= 70 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-xs font-inter ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>0%</span>
            <span className={`text-xs font-inter ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>50%</span>
            <span className={`text-xs font-inter ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>100%</span>
          </div>
        </div>

        {/* Documents Grid */}
        <div>
          <h4 className={`text-lg font-semibold mb-4 font-inter ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
            Required Documents
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredDocuments.map((doc) => {
              const Icon = doc.icon;
              const status = getDocumentStatus(doc.id);
              const isUploaded = existingDocuments.some(d => d.type === doc.id);
              const isVerified = status === 'verified';
              
              return (
                <div
                  key={doc.id}
                  className={`p-5 rounded-2xl border-2 transition-all duration-300 ${isDark 
                    ? isVerified 
                      ? 'border-green-600/50 bg-gradient-to-br from-green-900/20 to-green-800/10' 
                      : isUploaded 
                        ? 'border-amber-600/50 bg-gradient-to-br from-amber-900/30 to-amber-800/20' 
                        : 'border-amber-800/50 bg-gradient-to-br from-amber-950/30 to-amber-900/20'
                    : isVerified 
                      ? 'border-green-500/50 bg-gradient-to-br from-green-50 to-green-100/50' 
                      : isUploaded 
                        ? 'border-amber-400/50 bg-gradient-to-br from-amber-50 to-amber-100/50' 
                        : 'border-amber-300/50 bg-gradient-to-br from-white to-amber-50/50'
                  } hover:scale-[1.02] hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${isDark 
                        ? isVerified 
                          ? 'bg-gradient-to-br from-green-800/50 to-green-900/30' 
                          : 'bg-gradient-to-br from-amber-800/50 to-amber-900/30'
                        : isVerified 
                          ? 'bg-gradient-to-br from-green-100 to-green-200/50' 
                          : 'bg-gradient-to-br from-amber-100 to-amber-200/50'
                      }`}>
                        <Icon className={`w-5 h-5 ${isDark 
                          ? isVerified ? 'text-green-400' : 'text-amber-400'
                          : isVerified ? 'text-green-600' : 'text-amber-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className={`font-semibold font-inter ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
                          {doc.name}
                        </h4>
                        <p className={`text-xs font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                          {doc.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium font-inter ${isVerified
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                        : isUploaded
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                      }`}>
                        {isVerified ? 'Verified' : isUploaded ? 'Uploaded' : 'Required'}
                      </span>
                      {doc.required && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-inter ${isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                          Required
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      {isVerified ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className={`text-sm font-medium font-inter ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            Verified
                          </span>
                        </>
                      ) : isUploaded ? (
                        <>
                          <Loader className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
                          <span className={`text-sm font-medium font-inter ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            Under Review
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className={`text-sm font-medium font-inter ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            Not Uploaded
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openUploadModal(doc.id)}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm font-inter ${isVerified
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/60'
                        : isUploaded
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/60'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-md'
                      }`}
                      disabled={hasSubmitted}
                    >
                      {isUploaded ? 'Re-upload' : 'Upload'}
                    </button>
                  </div>

                  {doc.required && !isUploaded && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <p className={`text-xs font-inter ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                          This document is <span className="font-semibold">required</span> for verification. Please upload a clear, legible copy.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification Requirements */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-amber-950/30 to-amber-900/20 border-amber-800' : 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <FileText className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <h4 className={`font-semibold font-inter ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
              Document Requirements & Tips
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className={`text-sm font-semibold mb-2 font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                📄 Accepted Formats
              </h5>
              <ul className="space-y-1 text-sm font-inter">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>PDF documents</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>JPG, PNG images</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>Maximum size: 10MB</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h5 className={`text-sm font-semibold mb-2 font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                ⚡ Quick Tips
              </h5>
              <ul className="space-y-1 text-sm font-inter">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>Ensure documents are clear</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>Avoid glare and shadows</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>Check expiration dates</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
            <p className={`text-sm font-inter flex items-start gap-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>Note:</strong> Verification usually takes 24-48 hours. You'll receive a notification once your documents are verified.</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const getTabs = () => {
    const baseTabs = [
      { id: 'profile', label: 'Personal Info', icon: User },
      { id: 'preferences', label: 'Preferences', icon: Home },
      { id: 'verification', label: 'Verification', icon: Shield }
    ];

    if (actualUserType === 'broker') {
      baseTabs.splice(2, 0, { id: 'broker', label: 'Broker Info', icon: Briefcase });
    }

    return baseTabs;
  };

  const tabs = getTabs();

  // Check if profile is complete
  const isProfileComplete = useMemo(() => {
    const fieldsComplete = missingFields.length === 0;
    const hasIdentification = existingDocuments.some(doc => 
      ['id_card', 'passport', 'kebele_id'].includes(doc.type)
    );
    const isComplete = fieldsComplete && hasIdentification && completionPercentage >= 70;
    
    return isComplete;
  }, [missingFields, existingDocuments, completionPercentage]);

  if (!isOpen) return null;

  return (
    <>
      {/* HIGH TRANSPARENCY AMBER BACKGROUND */}
      <div className={`fixed inset-0 ${isDark ? 'bg-amber-950/98' : 'bg-amber-50/98'} flex items-center justify-center z-50 p-4 backdrop-blur-sm`}>
        <div className={`max-w-4xl w-full rounded-3xl shadow-2xl ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-900' : 'bg-gradient-to-br from-white via-white to-white'} border-2 ${isDark ? 'border-amber-700/30' : 'border-amber-300/50'} max-h-[90vh] overflow-hidden flex flex-col`}>
          {/* Header */}
          <div className={`p-8 border-b ${isDark ? 'border-amber-800/30' : 'border-amber-200/50'} ${isDark ? 'bg-gradient-to-r from-amber-900/20 via-amber-800/20 to-amber-900/20' : 'bg-gradient-to-r from-amber-50/80 via-amber-100/50 to-amber-50/80'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
                  Complete Your Profile
                </h3>
                <p className={`text-sm font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                  {ethiopianMode ? 'Ethiopian Real Estate Platform' : 'Complete your profile to get started'}
                </p>
                {hasSubmitted && (
                  <p className={`text-xs font-inter mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    <Check className="inline w-3 h-3 mr-1" />
                    Profile already submitted. You can update optional information.
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className={`p-3 rounded-xl transition-all duration-300 ${isDark ? 'hover:bg-amber-900/30 hover:scale-105 text-amber-300' : 'hover:bg-amber-100 hover:scale-105 text-amber-600'} active:scale-95`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium font-inter ${isDark ? 'text-amber-100' : 'text-amber-800'}`}>
                  Profile Completion
                </span>
                <span className={`text-sm font-bold font-inter ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  {completionPercentage}%
                </span>
                {completionPercentage < 100 && !hasSubmitted && missingFields.length > 0 && (
                  <button
                    onClick={autoFillMissingData}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-inter hover:font-medium"
                  >
                    Auto-fill missing data
                  </button>
                )}
              </div>
              <div className={`h-2 rounded-full ${isDark ? 'bg-amber-900/50' : 'bg-amber-200'} overflow-hidden`}>
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg transition-all whitespace-nowrap flex-1 mx-1 font-inter ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                    : isDark
                      ? 'text-amber-300 hover:text-amber-100 hover:bg-amber-900/30'
                      : 'text-amber-600 hover:text-amber-900 hover:bg-amber-100'
                    }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'preferences' && renderPreferencesTab()}
            {activeTab === 'verification' && renderVerificationTab()}
          </div>

          {/* Footer */}
          <div className={`p-6 border-t ${isDark ? 'border-amber-800/30' : 'border-amber-200/50'} ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-900' : 'bg-gradient-to-br from-amber-50 to-amber-100/30'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isProfileComplete && !hasSubmitted
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : hasSubmitted
                    ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                  }`}>
                  {isProfileComplete && !hasSubmitted ? (
                    <Check className="w-6 h-6" />
                  ) : hasSubmitted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span className="font-bold text-xl">{completionPercentage}%</span>
                  )}
                </div>
                <div>
                  <span className={`font-medium font-inter ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>
                    {hasSubmitted ? 'Profile Submitted' : isProfileComplete ? 'Ready to Submit!' : 'Complete your profile'}
                  </span>
                  <p className={`text-sm font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                    {ethiopianMode ? 'Required for Ethiopian transactions' : `${completionPercentage}% complete`}
                  </p>
                  {missingFields.length > 0 && !hasSubmitted && (
                    <p className={`text-xs font-inter ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      <AlertCircle className="inline w-3 h-3 mr-1" />
                      Missing: {missingFields.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className={`px-5 py-2.5 rounded-lg border font-medium font-inter transition-all duration-300 ${isDark
                    ? 'border-amber-800 hover:bg-amber-900/30 text-amber-100 hover:scale-105'
                    : 'border-amber-300 hover:bg-amber-100 text-amber-700 hover:scale-105'
                    } active:scale-95`}
                >
                  {hasSubmitted ? 'Close' : 'Cancel'}
                </button>
                <button
                  onClick={handleProfileUpdate}
                  disabled={!isProfileComplete || isLoading || hasSubmitted}
                  className={`px-6 py-2.5 rounded-lg font-semibold font-inter flex items-center gap-2 transition-all ${!isProfileComplete || isLoading || hasSubmitted
                    ? 'bg-amber-300 dark:bg-amber-800/50 text-amber-500 dark:text-amber-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                    } active:scale-95`}
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {hasSubmitted ? 'Update Profile' : isProfileComplete ? 'Submit Profile' : 'Save Progress'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleUploadSubmit}
        requiredDocuments={getRequiredDocuments()}
        ethiopianMode={ethiopianMode}
        uploadProgress={uploadProgress}
        documentType={uploadDocumentType}
        existingDocuments={existingDocuments}
        isVerificationInProgress={profileData.verification_status === 'pending' || profileData.verification_status === 'reviewing'}
        hasSubmittedDocuments={documentUploaded}
      />
    </>
  );
};

export default ProfileSetupModal;