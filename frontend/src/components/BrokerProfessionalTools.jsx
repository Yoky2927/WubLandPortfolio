// frontend/src/components/BrokerProfessionalTools.jsx
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { apiCall } from "../utils/api.endpoints";
import EthiopiaMap from "./EthiopiaMap";
import {
  MapPin,
  FileText,
  Signature,
  Camera,
  Upload,
  CheckCircle,
  X,
  Calendar,
  Clock,
  User,
  Home,
  DollarSign,
  MessageCircle,
  Download,
  Printer,
  Send,
  Shield,
  Lock,
  File,
  UserCheck,
  Briefcase,
  Landmark,
  Receipt,
  ClipboardCheck,
  AlertCircle,
  FileCheck,
  Archive,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";

const BrokerProfessionalTools = ({ brokerId, propertyRequestId, onComplete, clientData = null }) => {
  const { theme } = useTheme();
  const [activeStep, setActiveStep] = useState(1);
  const [meetingData, setMeetingData] = useState({
    // Step 1: Basic Information
    client_name: clientData?.name || "",
    client_phone: clientData?.phone || "",
    client_email: clientData?.email || "",
    client_id_number: "",
    client_marital_status: "single", // Important for Ethiopian property law
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_time: new Date().toTimeString().slice(0,5),
    meeting_location: "",
    
    // Step 2: Property Details
    property_type: "",
    property_location: "",
    property_description: "",
    asking_price: "",
    price_currency: "ETB",
    
    // Step 3: Ownership Verification
    ownership_type: "leasehold", // leasehold or building_ownership
    title_deed_number: "",
    cadastral_number: "",
    sub_city_office: "",
    
    // Step 4: Exclusive Agreement
    agreement_type: "exclusive_listing",
    duration_months: 6,
    commission_rate: "2.5", // Standard Ethiopian brokerage commission
    earnest_money: "",
    earnest_money_currency: "ETB",
    
    // Step 5: Required Documents Checklist
    documents: {
      id_card: { required: true, uploaded: false, url: null },
      title_deed: { required: true, uploaded: false, url: null },
      tax_clearance: { required: true, uploaded: false, url: null },
      marital_certificate: { required: true, uploaded: false, url: null },
      utility_clearance: { required: true, uploaded: false, url: null },
      cadastral_map: { required: true, uploaded: false, url: null },
    },
    
    // Step 6: Digital Signatures
    client_signature: "",
    broker_signature: "",
    witness_name: "",
    witness_signature: "",
    
    // Step 7: Government Registration
    dara_office: "", // Documents Authentication and Registration Service
    woreda_office: "",
    registration_number: "",
  });
  
  const [signatureData, setSignatureData] = useState({
    client: "",
    broker: "",
    witness: "",
  });
  
  const [isCapturingSignature, setIsCapturingSignature] = useState(false);
  const [currentSignatureType, setCurrentSignatureType] = useState("client");
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 9.145, lng: 40.4897 });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState({});
  const [agreementTemplates, setAgreementTemplates] = useState([]);
  
  const signatureCanvasRef = useRef(null);
  const fileInputRefs = useRef({});
  const [canvasContext, setCanvasContext] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Ethiopian government offices by region
  const ethiopianOffices = {
    dara_offices: [
      "Addis Ababa DARA Main Office",
      "Addis Ababa Branch - Bole",
      "Addis Ababa Branch - Kirkos",
      "Addis Ababa Branch - Arada",
      "Addis Ababa Branch - Yeka",
      "Addis Ababa Branch - Gulele",
      "Dire Dawa DARA Office",
      "Bahir Dar DARA Office",
      "Hawassa DARA Office",
      "Mekele DARA Office",
      "Adama DARA Office",
      "Jimma DARA Office",
      "Gondar DARA Office",
    ],
    woreda_offices: [
      "01 Woreda - Addis Ababa",
      "02 Woreda - Addis Ababa",
      "03 Woreda - Addis Ababa",
      "04 Woreda - Addis Ababa",
      "05 Woreda - Addis Ababa",
      "06 Woreda - Addis Ababa",
      "07 Woreda - Addis Ababa",
      "08 Woreda - Addis Ababa",
      "09 Woreda - Addis Ababa",
      "10 Woreda - Addis Ababa",
    ]
  };

  // Agreement templates for Ethiopian context
  const ethiopianAgreementTemplates = [
    {
      id: "exclusive_listing_6m",
      name: "Exclusive Listing Agreement - 6 Months",
      description: "Standard exclusive right to sell/rent for 6 months",
      commission: "2.5%",
      duration: "6 months",
      template_file: "templates/exclusive_listing_6m.pdf"
    },
    {
      id: "purchase_agreement_sale",
      name: "Purchase Agreement (የቤት ግዢ ስምምነት)",
      description: "Full purchase agreement for property transfer",
      commission: "2.5%",
      duration: "N/A",
      template_file: "templates/purchase_agreement.pdf"
    },
    {
      id: "residential_lease_12m",
      name: "Residential Lease Agreement - 12 Months",
      description: "Standard rental agreement compliant with Proclamation No. 1320/2024",
      commission: "1 month rent",
      duration: "12 months",
      template_file: "templates/residential_lease.pdf"
    },
    {
      id: "commercial_lease_24m",
      name: "Commercial Lease Agreement - 24 Months",
      description: "Commercial property lease with business terms",
      commission: "1 month rent",
      duration: "24 months",
      template_file: "templates/commercial_lease.pdf"
    },
    {
      id: "earnest_money_receipt",
      name: "Earnest Money Receipt",
      description: "Official receipt for deposit/payment",
      commission: "N/A",
      duration: "N/A",
      template_file: "templates/earnest_money.pdf"
    }
  ];

  // Initialize canvas
  useEffect(() => {
    if (signatureCanvasRef.current && isCapturingSignature) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = theme === 'dark' ? '#ffffff' : '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setCanvasContext(ctx);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [isCapturingSignature, theme]);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading("Getting your location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMeetingData(prev => ({
            ...prev,
            latitude,
            longitude
          }));
          setMapCoordinates({ lat: latitude, lng: longitude });
          toast.dismiss();
          toast.success("Location captured successfully!");
        },
        (error) => {
          toast.dismiss();
          toast.error("Unable to get location. Please enable location services.");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  // Handle signature capture
  const startSignature = (type) => {
    setCurrentSignatureType(type);
    setIsCapturingSignature(true);
  };

  const handleMouseDown = (e) => {
    if (!canvasContext) return;
    setIsDrawing(true);
    const rect = signatureCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvasContext.beginPath();
    canvasContext.moveTo(x, y);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !canvasContext) return;
    const rect = signatureCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvasContext.lineTo(x, y);
    canvasContext.stroke();
  };

  const handleMouseUp = () => {
    if (!canvasContext) return;
    setIsDrawing(false);
    canvasContext.closePath();
  };

  const clearSignature = () => {
    if (canvasContext && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = () => {
    if (signatureCanvasRef.current) {
      const dataUrl = signatureCanvasRef.current.toDataURL();
      setSignatureData(prev => ({
        ...prev,
        [currentSignatureType]: dataUrl
      }));
      setMeetingData(prev => ({
        ...prev,
        [`${currentSignatureType}_signature`]: dataUrl
      }));
      setIsCapturingSignature(false);
      toast.success("Signature saved!");
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (documentType) => {
    const fileInput = fileInputRefs.current[documentType];
    if (!fileInput?.files[0]) {
      toast.error("Please select a file first");
      return;
    }

    const file = fileInput.files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      toast.error("File size should be less than 10MB");
      return;
    }

    try {
      setUploadingDocuments(prev => ({ ...prev, [documentType]: true }));
      
      const formData = new FormData();
      formData.append("document", file);
      formData.append("document_type", documentType);
      formData.append("property_request_id", propertyRequestId);
      formData.append("broker_id", brokerId);

      const response = await apiCall('UPLOAD_DOCUMENT', {}, {
        data: formData
      });

      if (response.success && response.data?.document_url) {
        setMeetingData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [documentType]: {
              ...prev.documents[documentType],
              uploaded: true,
              url: response.data.document_url
            }
          }
        }));
        
        toast.success(`${documentType.replace('_', ' ').toUpperCase()} uploaded successfully!`);
        
        // Clear file input
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload ${documentType}: ${error.message}`);
    } finally {
      setUploadingDocuments(prev => ({ ...prev, [documentType]: false }));
    }
  };

  // Generate Ethiopian compliant agreement
  const generateEthiopianAgreement = async (templateId) => {
    try {
      setIsGeneratingPDF(true);
      
      const agreementData = {
        property_request_id: propertyRequestId,
        broker_id: brokerId,
        client_info: {
          name: meetingData.client_name,
          phone: meetingData.client_phone,
          id_number: meetingData.client_id_number,
          marital_status: meetingData.client_marital_status,
        },
        property_details: {
          type: meetingData.property_type,
          location: meetingData.property_location,
          asking_price: meetingData.asking_price,
          currency: meetingData.price_currency,
          ownership_type: meetingData.ownership_type,
          title_deed_number: meetingData.title_deed_number,
          cadastral_number: meetingData.cadastral_number,
        },
        agreement_details: {
          type: meetingData.agreement_type,
          duration_months: meetingData.duration_months,
          commission_rate: meetingData.commission_rate,
          earnest_money: meetingData.earnest_money,
          dara_office: meetingData.dara_office,
          woreda_office: meetingData.woreda_office,
        },
        signatures: {
          client: meetingData.client_signature,
          broker: meetingData.broker_signature,
          witness: meetingData.witness_signature,
        },
        uploaded_documents: Object.entries(meetingData.documents)
          .filter(([_, doc]) => doc.uploaded)
          .map(([type, doc]) => ({ type, url: doc.url }))
      };

      const response = await apiCall('GENERATE_ETHIOPIAN_AGREEMENT', { templateId }, {
        data: agreementData
      });

      if (response.success && response.data?.pdf_url) {
        // Save to property_documents table
        await savePropertyDocument({
          document_type: 'sales_contract', // or 'lease_agreement' based on type
          title: `Ethiopian ${templateId.replace('_', ' ')}`,
          document_url: response.data.pdf_url,
          is_public: false,
          metadata: {
            agreement_type: templateId,
            registration_office: meetingData.dara_office,
            commission_rate: meetingData.commission_rate,
            generated_date: new Date().toISOString(),
          }
        });

        toast.success("Ethiopian compliant agreement generated successfully!");
        setActiveStep(7);
      }
    } catch (error) {
      console.error("Error generating agreement:", error);
      toast.error("Failed to generate agreement");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Save to property_documents table
  const savePropertyDocument = async (documentData) => {
    try {
      const fullData = {
        ...documentData,
        property_id: propertyRequestId ? parseInt(propertyRequestId) : null,
        uploaded_by_user_id: brokerId,
        related_client_id: clientData?.id || null,
      };

      const response = await apiCall('SAVE_PROPERTY_DOCUMENT', {}, {
        data: fullData
      });

      if (response.success) {
        console.log("Document saved successfully:", response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
      throw error;
    }
  };

  // Check if all required documents are uploaded
  const checkDocumentsComplete = () => {
    const requiredDocs = Object.entries(meetingData.documents)
      .filter(([_, doc]) => doc.required)
      .every(([_, doc]) => doc.uploaded);
    
    return requiredDocs;
  };

  const handleInputChange = (field, value) => {
    setMeetingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentChange = (documentType, field, value) => {
    setMeetingData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: {
          ...prev.documents[documentType],
          [field]: value
        }
      }
    }));
  };

  const nextStep = () => {
    if (activeStep < 7) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1: // Client Information (Ethiopian Specific)
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-500" />
                <h4 className="font-semibold">Ethiopian Legal Requirements</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                According to Ethiopian property law, valid identification and marital status verification are mandatory for all property transactions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client Full Name (Amharic/English) *</label>
                <input
                  type="text"
                  value={meetingData.client_name}
                  onChange={(e) => handleInputChange('client_name', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="Enter client's legal name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ID Number *</label>
                <input
                  type="text"
                  value={meetingData.client_id_number}
                  onChange={(e) => handleInputChange('client_id_number', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="National ID or Passport Number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={meetingData.client_phone}
                  onChange={(e) => handleInputChange('client_phone', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="09xxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Marital Status *</label>
                <select
                  value={meetingData.client_marital_status}
                  onChange={(e) => handleInputChange('client_marital_status', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Meeting Location *</label>
              <input
                type="text"
                value={meetingData.meeting_location}
                onChange={(e) => handleInputChange('meeting_location', e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                placeholder="Café, office, or property address"
              />
            </div>
          </div>
        );

      case 2: // Property Details with Ethiopian Specifics
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Property Type *</label>
                <select
                  value={meetingData.property_type}
                  onChange={(e) => handleInputChange('property_type', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option value="">Select Type</option>
                  <option value="residential_house">Residential House</option>
                  <option value="apartment">Apartment/Condo</option>
                  <option value="villa">Villa</option>
                  <option value="commercial">Commercial Building</option>
                  <option value="land">Land/Plot</option>
                  <option value="mixed_use">Mixed Use</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ownership Type *</label>
                <select
                  value={meetingData.ownership_type}
                  onChange={(e) => handleInputChange('ownership_type', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option value="leasehold">Leasehold (ግብርና)</option>
                  <option value="building_ownership">Building Ownership</option>
                  <option value="condominium">Condominium</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Property Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={meetingData.property_location}
                  onChange={(e) => handleInputChange('property_location', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="Sub-city, woreda, kebele, specific address"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title Deed Number *</label>
                <input
                  type="text"
                  value={meetingData.title_deed_number}
                  onChange={(e) => handleInputChange('title_deed_number', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="Enter title deed number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Asking Price (ETB) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={meetingData.asking_price}
                    onChange={(e) => handleInputChange('asking_price', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Enter asking price in ETB"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Property Description</label>
              <textarea
                rows="4"
                value={meetingData.property_description}
                onChange={(e) => handleInputChange('property_description', e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                placeholder="Describe key features, condition, amenities..."
              />
            </div>
          </div>
        );

      case 3: // Geolocation & Cadastral Information
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Property Geolocation & Cadastral Info</h3>
              <button
                onClick={getCurrentLocation}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                <MapPin className="w-4 h-4" />
                Use My Location
              </button>
            </div>
            
            <div className="h-96 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
              <EthiopiaMap
                coordinates={mapCoordinates}
                onPinDrop={setMapCoordinates}
                theme={theme}
                height="100%"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cadastral Number</label>
                <input
                  type="text"
                  value={meetingData.cadastral_number || ''}
                  onChange={(e) => handleInputChange('cadastral_number', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="Cadastral/survey number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sub-City Land Office</label>
                <input
                  type="text"
                  value={meetingData.sub_city_office || ''}
                  onChange={(e) => handleInputChange('sub_city_office', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="Responsible government office"
                />
              </div>
            </div>
          </div>
        );

      case 4: // Required Documents Upload (Ethiopian Legal)
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h4 className="font-semibold">Ethiopian Legal Document Requirements</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                According to Ethiopian property law and Directive No. 7/2024, the following documents are mandatory for property transactions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(meetingData.documents).map(([docType, doc]) => (
                <div key={docType} className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-amber-400" />
                      <div>
                        <h4 className="font-semibold capitalize">{docType.replace('_', ' ')}</h4>
                        <p className="text-xs text-gray-500">
                          {doc.required ? 'Required' : 'Optional'}
                        </p>
                      </div>
                    </div>
                    {doc.uploaded ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={el => fileInputRefs.current[docType] = el}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={() => handleDocumentUpload(docType)}
                    />
                    
                    {doc.uploaded ? (
                      <div className="space-y-2">
                        <p className="text-sm text-green-500">✓ Uploaded</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(doc.url, '_blank')}
                            className="flex-1 text-center py-2 rounded-lg border border-amber-400 text-amber-400 hover:bg-amber-400/10"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              fileInputRefs.current[docType]?.click();
                            }}
                            className="flex-1 text-center py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white"
                          >
                            Replace
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRefs.current[docType]?.click()}
                        disabled={uploadingDocuments[docType]}
                        className={`w-full py-2 px-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center justify-center gap-2`}
                      >
                        {uploadingDocuments[docType] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload Document
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Document Checklist Status
              </h4>
              <div className="space-y-2">
                {Object.entries(meetingData.documents).map(([docType, doc]) => (
                  <div key={docType} className="flex items-center justify-between">
                    <span className="capitalize">{docType.replace('_', ' ')}</span>
                    <span className={doc.uploaded ? "text-green-500" : "text-red-500"}>
                      {doc.uploaded ? "✓ Complete" : "✗ Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5: // Agreement Selection
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h4 className="font-semibold">Select Ethiopian Agreement Template</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Choose the appropriate legal agreement template for your transaction. All templates comply with Ethiopian Civil Code and recent directives.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ethiopianAgreementTemplates.map((template) => (
                <div key={template.id} className={`p-4 rounded-lg border cursor-pointer hover:border-amber-400 transition-colors ${
                  meetingData.agreement_type === template.id 
                    ? 'border-amber-400 bg-amber-400/10' 
                    : theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
                onClick={() => handleInputChange('agreement_type', template.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    </div>
                    {meetingData.agreement_type === template.id && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">Commission:</span>
                      <span className="font-semibold">{template.commission}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-semibold">{template.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Agreement Duration (Months) *</label>
                <select
                  value={meetingData.duration_months}
                  onChange={(e) => handleInputChange('duration_months', parseInt(e.target.value))}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                  <option value={24}>24 Months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Commission Rate *</label>
                <select
                  value={meetingData.commission_rate}
                  onChange={(e) => handleInputChange('commission_rate', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option value="1.5">1.5%</option>
                  <option value="2.0">2.0%</option>
                  <option value="2.5">2.5% (Standard)</option>
                  <option value="3.0">3.0%</option>
                  <option value="3.5">3.5%</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Earnest Money (Deposit)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={meetingData.earnest_money}
                  onChange={(e) => handleInputChange('earnest_money', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="Amount in ETB (usually 10-30% of price)"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Standard earnest money is 10-30% of the property price for sales, or 1-3 months rent for rentals.
              </p>
            </div>
          </div>
        );

      case 6: // Digital Signatures & Witness
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Client Signature */}
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Client Signature
                </h4>
                {signatureData.client ? (
                  <div className="text-center">
                    <div className="h-32 border rounded-lg mb-4 flex items-center justify-center">
                      <img src={signatureData.client} alt="Client Signature" className="max-h-28" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startSignature('client')}
                        className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg"
                      >
                        Resign
                      </button>
                      <button
                        onClick={() => setSignatureData(prev => ({ ...prev, client: '' }))}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startSignature('client')}
                    className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:border-amber-400 transition-colors"
                  >
                    <Signature className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-500">Client to sign</span>
                  </button>
                )}
              </div>

              {/* Broker Signature */}
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Broker Signature
                </h4>
                {signatureData.broker ? (
                  <div className="text-center">
                    <div className="h-32 border rounded-lg mb-4 flex items-center justify-center">
                      <img src={signatureData.broker} alt="Broker Signature" className="max-h-28" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startSignature('broker')}
                        className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg"
                      >
                        Resign
                      </button>
                      <button
                        onClick={() => setSignatureData(prev => ({ ...prev, broker: '' }))}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startSignature('broker')}
                    className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:border-amber-400 transition-colors"
                  >
                    <Signature className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-500">You to sign</span>
                  </button>
                )}
              </div>

              {/* Witness Signature */}
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Witness (Optional)
                </h4>
                {signatureData.witness ? (
                  <div className="text-center">
                    <div className="h-32 border rounded-lg mb-4 flex items-center justify-center">
                      <img src={signatureData.witness} alt="Witness Signature" className="max-h-28" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startSignature('witness')}
                        className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg"
                      >
                        Resign
                      </button>
                      <button
                        onClick={() => setSignatureData(prev => ({ ...prev, witness: '' }))}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => startSignature('witness')}
                      className="w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:border-amber-400 transition-colors mb-2"
                    >
                      <Signature className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-gray-500 text-sm">Witness sign</span>
                    </button>
                    <input
                      type="text"
                      value={meetingData.witness_name}
                      onChange={(e) => handleInputChange('witness_name', e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg border text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      placeholder="Witness name"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Government Registration Info */}
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Landmark className="w-5 h-5" />
                Government Registration Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">DARA Office *</label>
                  <select
                    value={meetingData.dara_office}
                    onChange={(e) => handleInputChange('dara_office', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Select DARA Office</option>
                    {ethiopianOffices.dara_offices.map(office => (
                      <option key={office} value={office}>{office}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Woreda Office</label>
                  <select
                    value={meetingData.woreda_office}
                    onChange={(e) => handleInputChange('woreda_office', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Select Woreda Office</option>
                    {ethiopianOffices.woreda_offices.map(office => (
                      <option key={office} value={office}>{office}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Note: All property sales agreements must be authenticated by DARA (Documents Authentication and Registration Service) to be legally valid in Ethiopia.
              </p>
            </div>
          </div>
        );

      case 7: // Document Generation & Submission
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Ready for Government Submission!</h3>
              <p className="text-gray-500 mb-6">
                Your Ethiopian property agreement has been generated and is ready for government authentication.
              </p>
            </div>

            <div className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">Ethiopian Property Agreement</h4>
                  <p className="text-sm text-gray-500">
                    Compliant with Civil Code and Directive No. 7/2024
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateEthiopianAgreement(meetingData.agreement_type)}
                    disabled={isGeneratingPDF || !checkDocumentsComplete()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4" />
                        Generate Final PDF
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Agreement ID:</span>
                    <p className="font-mono">ETH-{propertyRequestId?.slice(-8)}-{new Date().getFullYear()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Registration Office:</span>
                    <p>{meetingData.dara_office || 'Not specified'}</p>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h5 className="font-semibold mb-2 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4" />
                    Next Steps for Legal Authentication
                  </h5>
                  <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <span>Print 3 copies of the generated agreement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <span>Take all parties to the selected DARA office with original documents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <span>Submit for notary authentication (የንጉሥ ማህተም)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">4.</span>
                      <span>Register with local Woreda Housing Office (for rentals)</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-500" />
                <h4 className="font-semibold">Digital Document Vault</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                All uploaded documents and the final agreement have been securely stored in the property documents vault.
                Access them anytime from your broker dashboard.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Ethiopian Property Professional Tools</h2>
          <p className="text-gray-500">Compliant with Ethiopian property laws and regulations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${theme === 'dark' ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
            Step {activeStep} of 7
          </span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8 relative">
        {['Client Info', 'Property', 'Location', 'Documents', 'Agreement', 'Signatures', 'Generate'].map((label, index) => (
          <div key={index} className="flex flex-col items-center relative z-10">
            <button
              onClick={() => setActiveStep(index + 1)}
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${activeStep > index + 1
                ? 'border-green-500 bg-green-500 text-white'
                : activeStep === index + 1
                ? 'border-amber-400 bg-amber-400 text-white'
                : 'border-gray-300 dark:border-gray-600 text-gray-400'
                }`}
            >
              {index + 1}
            </button>
            <span className="text-xs mt-2 text-center w-20">{label}</span>
          </div>
        ))}
        <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-300 dark:bg-gray-600 -z-10"></div>
      </div>

      {/* Step Content */}
      <div className="mb-6">
        {renderStepContent()}
      </div>

      {/* Signature Capture Modal */}
      {isCapturingSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-xl max-w-md w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {currentSignatureType === 'client' ? 'Client' : 
                 currentSignatureType === 'broker' ? 'Your' : 'Witness'} Signature
              </h3>
              <button
                onClick={() => setIsCapturingSignature(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <canvas
              ref={signatureCanvasRef}
              width={400}
              height={200}
              className="w-full h-48 border rounded-lg mb-4 touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={(e) => {
                e.preventDefault();
                handleMouseDown(e.touches[0]);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                handleMouseMove(e.touches[0]);
              }}
              onTouchEnd={handleMouseUp}
            />
            
            <div className="flex gap-2">
              <button
                onClick={clearSignature}
                className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
              >
                Clear
              </button>
              <button
                onClick={saveSignature}
                className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg"
              >
                Save Signature
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Draw your signature in the box above
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={prevStep}
          disabled={activeStep === 1}
          className={`px-6 py-2 rounded-lg ${activeStep === 1
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
        >
          Previous
        </button>
        
        <div className="flex gap-2">
          {activeStep === 7 ? (
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Process
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={activeStep === 4 && !checkDocumentsComplete()}
              className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg disabled:opacity-50"
            >
              {activeStep === 4 && !checkDocumentsComplete() 
                ? 'Upload Required Documents First' 
                : 'Next Step'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrokerProfessionalTools;