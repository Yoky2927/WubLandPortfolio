import React, { useState, useRef, useEffect } from "react";
import {
  X, Upload, File, AlertCircle, CheckCircle, Globe,
  UserCheck, Building, Award, Loader, Eye, Clock,
  AlertTriangle, Shield, FileCheck, FileX, Sparkles,
  ChevronRight, ChevronLeft, Info, HelpCircle,
  FolderOpen, ShieldAlert, Filter,
  Archive, Search, Download, ExternalLink,
  FileText, FileImage, RotateCw,
  Home, User, Briefcase, Landmark, Banknote, FileSpreadsheet,
  CreditCard, FileSignature, FileKey, FileDigit,
  Camera, FileArchive, FileClock, FileQuestion,
  ShieldCheck, ShieldOff, UploadCloud, RefreshCw,
  Mail, Phone, MapPin, CreditCard as Card,
  FileUp, FileDown, FilePlus, FileMinus,
  Check, UserCircle, Building2, FileType,
  Image, FileJson, FileCode, Lock, Unlock,
  Calendar, EyeOff, FileSearch, FileBarChart,
  ListTodo, CheckSquare, Square, ArrowRight,
  MessageCircle, BookOpen, FileWarning
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiCall } from "../utils/api.endpoints";
import { useTheme } from "../contexts/ThemeContext";

const DocumentUploadModal = ({
  isOpen,
  onClose,
  onSubmit,
  requiredDocuments = [],
  ethiopianMode = false,
  uploadProgress = 0,
  documentType: propDocumentType = "",
  existingDocuments: propExistingDocuments = [],
  isVerificationInProgress = false,
  hasSubmittedDocuments = false,
  resubmissionDocument = null, // NEW: Document that needs resubmission
  resubmissionFeedback = "", // NEW: Admin feedback for resubmission
  userDocuments = [] // NEW: User's current documents for status checking
}) => {
  const { theme } = useTheme();
  const [existingDocuments, setExistingDocuments] = useState(propExistingDocuments);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState(propDocumentType);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [isCheckingDocuments, setIsCheckingDocuments] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [userRole, setUserRole] = useState('buyer');
  const [activeCategory, setActiveCategory] = useState('all');
  const [documentOptions, setDocumentOptions] = useState({ allDocuments: [], categories: {}, isBrokerOrAdmin: false });
  const [documentRequirements, setDocumentRequirements] = useState({
    required: [],
    uploaded: [],
    missing: [],
    uploadedDocs: [],
    needsResubmission: [] // NEW: Documents needing resubmission
  });
  const [uploadProgressState, setUploadProgressState] = useState(0);
  const [isUploadDisabled, setIsUploadDisabled] = useState(false);
  const [isResubmissionMode, setIsResubmissionMode] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState(resubmissionFeedback || "");
  const fileInputRef = useRef(null);

  const isDark = theme === "dark";

  // Auto-close modal when verification is in progress
  useEffect(() => {
    if (isOpen && hasSubmittedDocuments && isVerificationInProgress) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hasSubmittedDocuments, isVerificationInProgress, onClose]);

  // Initialize document options based on user role and ethiopian mode
  const initializeDocumentOptions = (role = 'buyer') => {
    const isBrokerOrAdmin = ['broker', 'admin', 'support_admin', 'support_agent', 'support_lead'].includes(role);

    // Base types for ALL users
    const baseTypes = [
      {
        value: 'id_card',
        label: 'National ID Card',
        description: 'Government issued ID card',
        icon: 'IdCard',
        color: 'amber',
        category: 'personal',
        required: true,
        forAllUsers: true
      },
      {
        value: 'passport',
        label: 'Passport',
        description: 'International passport (for diaspora/foreigners)',
        icon: 'Globe',
        color: 'amber',
        category: 'personal',
        forAllUsers: true
      },
      {
        value: 'proof_of_income',
        label: 'Proof of Income',
        description: 'Salary slip or bank statement (last 3 months)',
        icon: 'FileSpreadsheet',
        color: 'amber',
        category: 'financial',
        required: true,
        forAllUsers: true
      },
      {
        value: 'bank_statement',
        label: 'Bank Statement',
        description: 'Recent 3 months bank statement',
        icon: 'FileBarChart',
        color: 'amber',
        category: 'financial',
        forAllUsers: true
      },
      {
        value: 'utility_bill',
        label: 'Utility Bill',
        description: 'Proof of current address',
        icon: 'FileText',
        color: 'amber',
        category: 'personal',
        forAllUsers: true
      },
    ];

    // Ethiopian-specific documents
    const ethiopianTypes = [
      {
        value: 'kebele_id',
        label: 'Kebele ID',
        description: 'For Ethiopian citizens living in Ethiopia',
        icon: 'IdCard',
        color: 'amber',
        category: 'personal',
        required: ethiopianMode,
        forAllUsers: true
      },
      {
        value: 'yellow_card',
        label: 'Yellow Card',
        description: 'Foreign national residence permit',
        icon: 'FileKey',
        color: 'amber',
        category: 'personal',
        forAllUsers: true
      },
    ];

    // Role-specific documents
    const roleBasedTypes = {
      seller: [
        {
          value: 'property_deed',
          label: 'Property Deed/Title',
          description: 'Property ownership document',
          icon: 'FileArchive',
          color: 'amber',
          category: 'property',
          required: false
        },
        {
          value: 'property_tax_receipt',
          label: 'Property Tax Receipt',
          description: 'Recent property tax payment receipt',
          icon: 'FileText',
          color: 'amber',
          category: 'property',
          required: false
        },
      ],
      landlord: [
        {
          value: 'rental_agreement',
          label: 'Existing Rental Agreement',
          description: 'Copy of current rental agreement',
          icon: 'FileSignature',
          color: 'amber',
          category: 'rental',
          required: false
        },
        {
          value: 'property_photos',
          label: 'Property Photos',
          description: 'Recent photos of the property',
          icon: 'Camera',
          color: 'amber',
          category: 'property',
          required: false
        },
      ],
      buyer: [
        {
          value: 'employment_letter',
          label: 'Employment Letter',
          description: 'Current employment confirmation letter',
          icon: 'FileText',
          color: 'amber',
          category: 'financial',
          required: false
        },
        {
          value: 'reference_letter',
          label: 'Reference Letter',
          description: 'Personal or professional reference',
          icon: 'FileQuestion',
          color: 'amber',
          category: 'personal',
          required: false
        },
      ],
      renter: [
        {
          value: 'employment_letter',
          label: 'Employment Letter',
          description: 'Current employment confirmation',
          icon: 'FileText',
          color: 'amber',
          category: 'financial',
          required: false
        },
        {
          value: 'previous_rental_reference',
          label: 'Previous Rental Reference',
          description: 'Reference from previous landlord',
          icon: 'FileClock',
          color: 'amber',
          category: 'rental',
          required: false
        },
      ],
      broker: [
        {
          value: 'broker_license',
          label: 'Broker License',
          description: 'Valid real estate broker license',
          icon: 'Award',
          color: 'amber',
          category: 'professional',
          required: true
        },
        {
          value: 'tin_certificate',
          label: 'TIN Certificate',
          description: 'Tax identification certificate',
          icon: 'FileDigit',
          color: 'amber',
          category: 'professional',
          required: true
        },
        {
          value: 'business_license',
          label: 'Business License',
          description: 'Business registration certificate',
          icon: 'Building',
          color: 'amber',
          category: 'professional',
          required: true
        },
        {
          value: 'power_of_attorney',
          label: 'Power of Attorney',
          description: 'Legal authorization document',
          icon: 'FileKey',
          color: 'amber',
          category: 'legal',
          required: false
        },
      ]
    };

    // Get user's role-specific documents
    const userRoleDocuments = roleBasedTypes[role] || [];

    // Combine documents based on user type
    let allDocuments = [...baseTypes, ...(ethiopianMode ? ethiopianTypes : [])];

    // Add role-specific documents
    allDocuments = [...allDocuments, ...userRoleDocuments];

    // Filter out broker-specific documents for non-brokers
    if (!isBrokerOrAdmin) {
      allDocuments = allDocuments.filter(doc => !doc.category?.includes('professional'));
    }

    // Organize into categories for display
    const categories = {
      'all': {
        label: 'All Documents',
        icon: <File className="w-4 h-4" />,
        documents: allDocuments
      },
      'personal': {
        label: 'Personal Identification',
        icon: <User className="w-4 h-4" />,
        documents: allDocuments.filter(doc => doc.category === 'personal')
      },
      'financial': {
        label: 'Financial Documents',
        icon: <Banknote className="w-4 h-4" />,
        documents: allDocuments.filter(doc => doc.category === 'financial')
      },
      'property': {
        label: 'Property Documents',
        icon: <Home className="w-4 h-4" />,
        documents: allDocuments.filter(doc => doc.category === 'property')
      },
      'rental': {
        label: 'Rental Documents',
        icon: <FileSignature className="w-4 h-4" />,
        documents: allDocuments.filter(doc => doc.category === 'rental')
      },
      'legal': {
        label: 'Legal Documents',
        icon: <FileKey className="w-4 h-4" />,
        documents: allDocuments.filter(doc => doc.category === 'legal')
      },
    };

    // Add Professional category only for brokers/admin
    if (isBrokerOrAdmin) {
      categories['professional'] = {
        label: 'Professional License',
        icon: <Briefcase className="w-4 h-4" />,
        documents: allDocuments.filter(doc => doc.category === 'professional')
      };
    }

    // Filter out empty categories
    const filteredCategories = Object.entries(categories)
      .filter(([_, data]) => data.documents.length > 0)
      .reduce((acc, [key, data]) => {
        acc[key] = data;
        return acc;
      }, {});

    return {
      allDocuments,
      categories: filteredCategories,
      isBrokerOrAdmin
    };
  };

  // Get user role from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = user?.role || 'buyer';
      setUserRole(role);
      const options = initializeDocumentOptions(role);
      setDocumentOptions(options);

      // Check if resubmission mode is active
      if (resubmissionDocument) {
        setIsResubmissionMode(true);
        setDocumentType(resubmissionDocument);
        console.log('🔄 Resubmission mode activated for:', resubmissionDocument);

        // Show admin feedback if available
        if (resubmissionFeedback) {
          setAdminFeedback(resubmissionFeedback);
          toast.info(`Please resubmit: ${resubmissionFeedback}`, {
            duration: 6000,
            icon: '📄'
          });
        }
      }

      // Initialize document requirements based on role and ethiopian mode
      const requiredDocs = getRequiredDocuments(role, ethiopianMode);
      setDocumentRequirements(prev => ({
        ...prev,
        required: requiredDocs
      }));

      fetchExistingDocuments();
      setShowGuide(true);
      setTimeout(() => setShowGuide(false), 5000);
    }
  }, [isOpen, ethiopianMode, resubmissionDocument, resubmissionFeedback]);

  // Get required documents based on user role and location
  const getRequiredDocuments = (role, isEthiopian) => {
    const baseDocuments = ['proof_of_income'];

    if (isEthiopian) {
      return ['kebele_id', ...baseDocuments];
    } else {
      return ['id_card', ...baseDocuments];
    }
  };

  // Update document options when userRole changes
  useEffect(() => {
    const options = initializeDocumentOptions(userRole);
    setDocumentOptions(options);
  }, [userRole, ethiopianMode]);

  // Sync propDocumentType with state
  useEffect(() => {
    if (propDocumentType) {
      setDocumentType(propDocumentType);
    }
  }, [propDocumentType]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedFile(null);
        setDocumentType(propDocumentType || "");
        setUploadStatus(null);
        setValidationError("");
        setPreviewUrl(null);
        setSearchQuery("");
        setActiveCategory('all');
        setUploadProgressState(0);
        setIsResubmissionMode(false);
        setAdminFeedback("");
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 300);
    }
  }, [isOpen, propDocumentType]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Fetch user's existing documents
  const fetchExistingDocuments = async () => {
    try {
      setIsCheckingDocuments(true);

      // Try multiple endpoints
      let response;
      let documents = [];

      // Try GET_VERIFICATION_STATUS first
      try {
        response = await apiCall('GET_VERIFICATION_STATUS', {}, {
          method: 'GET'
        });

        if (response.success) {
          // Extract documents from response
          if (response.documents && Array.isArray(response.documents)) {
            documents = response.documents;
          } else if (response.data && Array.isArray(response.data)) {
            documents = response.data;
          }

          console.log('✅ Got documents from GET_VERIFICATION_STATUS:', documents);
        }
      } catch (error) {
        console.log('GET_VERIFICATION_STATUS failed:', error);
      }

      // If no documents from first attempt, try GET_USER_DOCUMENTS
      if (documents.length === 0) {
        try {
          response = await apiCall('GET_USER_DOCUMENTS', {}, {
            method: 'GET'
          });

          if (response.success && response.documents) {
            documents = response.documents;
            console.log('✅ Got documents from GET_USER_DOCUMENTS:', documents);
          }
        } catch (error) {
          console.log('GET_USER_DOCUMENTS failed:', error);
        }
      }

      // Parse documents
      const parsedDocuments = documents.map(doc => {
        if (typeof doc === 'string') {
          try {
            return JSON.parse(doc);
          } catch (error) {
            console.error('Failed to parse document string:', error);
            return null;
          }
        }
        return doc;
      }).filter(doc => doc && doc.type);

      // Update existing documents state
      setExistingDocuments(parsedDocuments);

      // Update document requirements
      const requiredDocs = getRequiredDocuments(userRole, ethiopianMode);
      const uploadedTypes = parsedDocuments
        .filter(doc => doc.status === 'approved' || doc.status === 'submitted' || doc.status === 'reviewing')
        .map(doc => doc.type || doc.document_type);

      const missingTypes = requiredDocs.filter(type =>
        !uploadedTypes.includes(type)
      );

      // Find documents needing resubmission
      const needsResubmission = parsedDocuments
        .filter(doc => doc.status === 'needs_resubmission')
        .map(doc => doc.type || doc.document_type);

      setDocumentRequirements({
        required: requiredDocs,
        uploaded: uploadedTypes,
        missing: missingTypes,
        uploadedDocs: parsedDocuments,
        needsResubmission: needsResubmission
      });

      console.log('📋 Updated document requirements:', {
        required: requiredDocs,
        uploaded: uploadedTypes,
        missing: missingTypes,
        needsResubmission: needsResubmission
      });

      // Check if user has submitted all required documents
      const hasAllRequired = missingTypes.length === 0;
      const hasSubmitted = parsedDocuments.some(doc =>
        doc.status === 'submitted' || doc.status === 'reviewing'
      );

      setIsUploadDisabled(hasAllRequired && hasSubmitted);

    } catch (error) {
      console.error('Error fetching documents:', error);
      setExistingDocuments([]);
    } finally {
      setIsCheckingDocuments(false);
    }
  };

  // Get appropriate icon for document type
  const getDocumentIcon = (iconName) => {
    const iconMap = {
      'IdCard': <UserCheck className="w-5 h-5" />,
      'Globe': <Globe className="w-5 h-5" />,
      'FileText': <FileText className="w-5 h-5" />,
      'FileArchive': <FileArchive className="w-5 h-5" />,
      'FileClock': <FileClock className="w-5 h-5" />,
      'FileImage': <FileImage className="w-5 h-5" />,
      'FileQuestion': <FileQuestion className="w-5 h-5" />,
      'FileSpreadsheet': <FileSpreadsheet className="w-5 h-5" />,
      'FileDigit': <FileDigit className="w-5 h-5" />,
      'FileKey': <FileKey className="w-5 h-5" />,
      'FileSignature': <FileSignature className="w-5 h-5" />,
      'Award': <Award className="w-5 h-5" />,
      'Building': <Building className="w-5 h-5" />,
      'Landmark': <Landmark className="w-5 h-5" />,
      'Banknote': <Banknote className="w-5 h-5" />,
      'CreditCard': <Card className="w-5 h-5" />,
      'Camera': <Camera className="w-5 h-5" />,
      'Home': <Home className="w-5 h-5" />,
      'Briefcase': <Briefcase className="w-5 h-5" />,
      'User': <User className="w-5 h-5" />,
      'FileCheck': <FileCheck className="w-5 h-5" />,
      'Shield': <Shield className="w-5 h-5" />,
      'UserCircle': <UserCircle className="w-5 h-5" />,
      'Building2': <Building2 className="w-5 h-5" />,
      'FileType': <FileType className="w-5 h-5" />,
      'Image': <Image className="w-5 h-5" />,
      'Calendar': <Calendar className="w-5 h-5" />,
      'FileSearch': <FileSearch className="w-5 h-5" />,
      'FileBarChart': <FileBarChart className="w-5 h-5" />,
      'ListTodo': <ListTodo className="w-5 h-5" />,
      'BookOpen': <BookOpen className="w-5 h-5" />,
      'MessageCircle': <MessageCircle className="w-5 h-5" />,
      'FileWarning': <FileWarning className="w-5 h-5" />
    };

    return iconMap[iconName] || <File className="w-5 h-5" />;
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const iconMap = {
      'personal': <User className="w-4 h-4" />,
      'financial': <Banknote className="w-4 h-4" />,
      'property': <Home className="w-4 h-4" />,
      'rental': <FileSignature className="w-4 h-4" />,
      'professional': <Briefcase className="w-4 h-4" />,
      'legal': <FileKey className="w-4 h-4" />,
      'all': <File className="w-4 h-4" />
    };
    return iconMap[category] || <File className="w-4 h-4" />;
  };

  // Check if current document type is already uploaded
  const isDocumentAlreadyUploaded = () => {
    return existingDocuments.some(doc =>
      (doc.type === documentType || doc.document_type === documentType) &&
      doc.status !== 'rejected' &&
      doc.status !== 'archived'
    );
  };

  // Check if document needs resubmission
  const isDocumentNeedsResubmission = () => {
    return existingDocuments.some(doc =>
      (doc.type === documentType || doc.document_type === documentType) &&
      doc.status === 'needs_resubmission'
    );
  };
  const fetchDocumentFeedback = async (documentType) => {
  try {
    // Find the document that needs resubmission
    const doc = existingDocuments.find(d => 
      (d.type === documentType || d.document_type === documentType) &&
      d.status === 'needs_resubmission'
    );
    
    if (doc) {
      // Set the feedback from the document
      setAdminFeedback(doc.review_notes || doc.rejection_reason || '');
      
      // If there are specific instructions, parse them
      if (doc.specific_instructions) {
        try {
          const instructions = JSON.parse(doc.specific_instructions);
          if (Array.isArray(instructions) && instructions.length > 0) {
            setAdminFeedback(prev => prev + '\n\nSpecific instructions:\n' + 
              instructions.map((inst, idx) => `${idx + 1}. ${inst}`).join('\n'));
          }
        } catch (error) {
          console.error('Error parsing instructions:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching document feedback:', error);
  }
};

  // Get uploaded document info for current type
  const getUploadedDocument = () => {
    return existingDocuments.find(doc =>
      doc.type === documentType || doc.document_type === documentType
    );
  };

  // Get document status badge with better styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return {
          text: 'Verified',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          badgeColor: 'bg-gradient-to-r from-emerald-500 to-green-500'
        };
      case 'rejected':
        return {
          text: 'Rejected',
          icon: <FileX className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />,
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-700 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800',
          badgeColor: 'bg-gradient-to-r from-red-500 to-rose-500'
        };
      case 'needs_resubmission':
        return {
          text: 'Resubmission Required',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-800" />,
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-700 dark:text-amber-300',
          borderColor: 'border-amber-200 dark:border-amber-800',
          badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-500'
        };
      case 'pending_review':
      case 'submitted':
      case 'reviewing':
        return {
          text: 'Under Review',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-800" />,
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-700 dark:text-amber-300',
          borderColor: 'border-amber-200 dark:border-amber-800',
          badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-500'
        };
      case 'pending':
        return {
          text: 'Pending',
          icon: <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800',
          badgeColor: 'bg-gradient-to-r from-blue-500 to-cyan-500'
        };
      default:
        return {
          text: 'Uploaded',
          icon: <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800',
          badgeColor: 'bg-gradient-to-r from-blue-500 to-cyan-500'
        };
    }
  };

  const handleFileSelect = (e) => {
    // Prevent file selection if upload is disabled
    if (isUploadDisabled && documentRequirements.missing.length === 0) {
      toast.error("All required documents have been submitted. Please wait for verification.");
      return;
    }

    const file = e.target.files[0];
    setValidationError("");
    setPreviewUrl(null);

    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setValidationError("File size exceeds 10MB limit");
        toast.error("Please select a file smaller than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
        'image/svg+xml'
      ];
      if (!allowedTypes.includes(file.type)) {
        setValidationError("Only PDF, JPEG, PNG, WebP, and SVG files are allowed");
        toast.error("Please select a valid file format");
        return;
      }

      setSelectedFile(file);
      setUploadStatus(null);

      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }

      // Auto-detect document type from filename if not set
      if (!documentType && documentOptions.allDocuments.length > 0) {
        const filename = file.name.toLowerCase();
        const matchedType = documentOptions.allDocuments.find(option =>
          filename.includes(option.value) ||
          option.label.toLowerCase().includes(filename.split('.')[0])
        );
        if (matchedType) {
          setDocumentType(matchedType.value);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent submission if all required documents are submitted
    if (isUploadDisabled && documentRequirements.missing.length === 0) {
      toast.error("All required documents have been submitted. Please wait for verification.");
      return;
    }

    setValidationError("");
    setUploadStatus(null);

    if (!selectedFile) {
      setValidationError("Please select a file to upload");
      toast.error("Please select a file to upload");
      return;
    }

    if (!documentType) {
      setValidationError("Please select a document type");
      toast.error("Please select a document type");
      return;
    }

    // Check if this is a resubmission
    const isResubmission = isDocumentAlreadyUploaded() || isResubmissionMode;
    const existingDoc = getUploadedDocument();
    const needsResubmission = isDocumentNeedsResubmission();

    if (isResubmission && !needsResubmission) {
      const confirmed = window.confirm(
        `You already have this document uploaded.\n\n` +
        `• Type: ${getDocumentTypeLabel(documentType)}\n` +
        `• Uploaded: ${existingDoc?.uploaded_at ? new Date(existingDoc.uploaded_at).toLocaleDateString() : 'Unknown date'}\n` +
        `• Status: ${existingDoc?.status || 'pending'}\n\n` +
        `Do you want to replace it with a new file? This will be marked as a resubmission.`
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setIsLoading(true);
      setUploadStatus({ type: 'info', message: 'Preparing upload...' });

      // Start upload progress simulation
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setUploadProgressState(progress);
        if (progress >= 90) clearInterval(progressInterval);
      }, 100);

      // Step 1: Create FormData with proper field names
      const uploadFormData = new FormData();
      uploadFormData.append('document', selectedFile);
      uploadFormData.append('documentType', documentType);
      uploadFormData.append('isResubmission', isResubmission.toString());

      // Add resubmission specific data
      if (isResubmissionMode) {
        uploadFormData.append('resubmissionOf', resubmissionDocument);
        uploadFormData.append('adminFeedback', adminFeedback);
      }

      // Debug log
      console.log('📤 Uploading file:', {
        filename: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        documentType: documentType,
        isResubmission: isResubmission,
        isResubmissionMode: isResubmissionMode,
        resubmissionDocument: resubmissionDocument
      });

      // Use verification document upload endpoint
      setUploadStatus({ type: 'info', message: isResubmissionMode ? 'Uploading resubmission...' : 'Uploading verification document...' });

      const response = await apiCall('UPLOAD_VERIFICATION_DOCUMENT', {}, {
        method: 'POST',
        body: uploadFormData
      });

      clearInterval(progressInterval);
      setUploadProgressState(100);

      if (response.success) {
        const missingCount = response.missingDocuments?.length || documentRequirements.missing.length - 1;
        const isLastRequired = missingCount === 0;

        setUploadStatus({
          type: 'success',
          message: isResubmissionMode
            ? 'Resubmission uploaded! Verification will be reviewed again.'
            : isLastRequired
              ? 'All required documents uploaded! Verification in progress.'
              : `Document uploaded! ${missingCount} more document(s) needed.`
        });

        toast.success(
          isResubmissionMode
            ? 'Resubmission uploaded! Our team will review it again.'
            : isLastRequired
              ? 'All documents submitted! Verification will be reviewed within 24-48 hours.'
              : `Document uploaded! Please upload remaining document(s).`,
          {
            duration: 4000,
            icon: isResubmissionMode ? '🔄' : (isLastRequired ? '⏳' : '📄'),
            style: {
              background: isDark ? '#1f2937' : '#ffffff',
              color: isDark ? '#f3f4f6' : '#111827',
              border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
            }
          }
        );

        // Pass data to parent component
        if (onSubmit) {
          setTimeout(() => {
            onSubmit({
              type: documentType,
              url: response.document?.url || response.documentUrl,
              status: 'pending',
              message: response.message,
              isReplacement: isResubmission,
              isResubmission: isResubmission,
              isResubmissionMode: isResubmissionMode,
              resubmissionDocument: resubmissionDocument,
              adminFeedback: adminFeedback,
              filename: selectedFile.name,
              verificationStatus: isLastRequired ? 'submitted' : 'pending',
              requiresAdminReview: true,
              progress: response.progress
            });

            // Only close if all required documents are uploaded or it's a resubmission
            if (isLastRequired || isResubmissionMode) {
              onClose();
            }
          }, 1500);
        } else {
          setTimeout(() => {
            if (isLastRequired || isResubmissionMode) {
              onClose();
            }
          }, 2000);
        }

        // Refresh existing documents
        await fetchExistingDocuments();

        // Reset form if not last document
        if (!isLastRequired && !isResubmissionMode) {
          setTimeout(() => {
            setSelectedFile(null);
            setPreviewUrl(null);
            setUploadProgressState(0);
            setUploadStatus(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }, 1000);
        }

      } else {
        throw new Error(response.message || 'Failed to upload verification document');
      }

    } catch (error) {
      console.error('Document upload failed:', error);
      setUploadProgressState(0);

      let errorMessage = 'Failed to upload document. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setUploadStatus({
        type: 'error',
        message: errorMessage
      });
      setValidationError(errorMessage);

      toast.error(errorMessage, {
        duration: 5000,
        style: {
          background: isDark ? '#7f1d1d' : '#fef2f2',
          color: isDark ? '#fecaca' : '#991b1b',
          border: isDark ? '1px solid #991b1b' : '1px solid #fecaca'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError("");
    setUploadProgressState(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent drop if upload is disabled
    if (isUploadDisabled && documentRequirements.missing.length === 0) {
      toast.error("All required documents have been submitted. Please wait for verification.");
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const event = { target: { files: [file] } };
      handleFileSelect(event);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const getDocumentTypeLabel = (value) => {
    const option = documentOptions.allDocuments.find(opt => opt.value === value);
    return option ? option.label : value.replace('_', ' ');
  };

  // Filter documents based on active filter and search
  const filteredDocuments = existingDocuments.filter(doc => {
    if (!doc || (!doc.type && !doc.document_type)) return false;

    const docType = doc.type || doc.document_type;
    const docStatus = doc.status || 'pending';

    // Apply filter
    if (activeFilter === 'uploaded') {
      if (!(docStatus === 'verified' || docStatus === 'pending_review' || docStatus === 'submitted' || docStatus === 'reviewing')) return false;
    } else if (activeFilter === 'pending') {
      if (docStatus !== 'needs_resubmission') return false;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const typeStr = docType.toLowerCase();
      const filename = (doc.filename || doc.document_filename || '').toLowerCase();
      const status = docStatus.toLowerCase();
      const feedback = (doc.feedback || doc.rejection_reason || '').toLowerCase();

      return typeStr.includes(query) ||
        filename.includes(query) ||
        status.includes(query) ||
        feedback.includes(query);
    }

    return true;
  });

  // Calculate document stats
  const documentStats = {
    total: existingDocuments.length,
    verified: existingDocuments.filter(d => d.status === 'verified').length,
    pending: existingDocuments.filter(d =>
      d.status === 'pending_review' ||
      d.status === 'pending' ||
      d.status === 'submitted' ||
      d.status === 'reviewing'
    ).length,
    rejected: existingDocuments.filter(d => d.status === 'rejected').length,
    needs_resubmission: existingDocuments.filter(d => d.status === 'needs_resubmission').length,
  };

  // Get current category documents
  const currentCategoryDocs = activeCategory === 'all'
    ? documentOptions.allDocuments
    : (documentOptions.categories[activeCategory]?.documents || []);

  // Get upload button text
  const getUploadButtonText = () => {
    if (isLoading) return 'Uploading...';
    if (isUploadDisabled && documentRequirements.missing.length === 0) return 'All Documents Submitted';

    const isRequired = documentRequirements.required.includes(documentType);
    const isAlreadyUploaded = isDocumentAlreadyUploaded();
    const needsResubmission = isDocumentNeedsResubmission();

    if (needsResubmission || isResubmissionMode) {
      return 'Submit Resubmission';
    }

    if (isAlreadyUploaded) {
      return 'Replace Document';
    }

    if (isRequired && documentRequirements.missing.includes(documentType)) {
      return `Upload ${getDocumentTypeLabel(documentType)} (Required)`;
    }

    return 'Upload Document';
  };

  if (!isOpen) return null;

  const isAlreadyUploaded = isDocumentAlreadyUploaded();
  const needsResubmission = isDocumentNeedsResubmission();
  const uploadedDoc = getUploadedDocument();
  const statusBadge = uploadedDoc ? getStatusBadge(uploadedDoc.status) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Guide Toast */}
      {showGuide && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[101] animate-slideDown">
          <div className={`px-6 py-4 rounded-xl shadow-2xl ${isDark ? 'bg-gradient-to-r from-amber-900/90 to-amber-800/90 text-amber-100' : 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800'} border ${isDark ? 'border-amber-700' : 'border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Upload your verification documents</p>
                <p className="text-sm opacity-90">You need to upload {documentRequirements.required.length} required documents</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESTRICTION TOAST */}
      {(isOpen && isUploadDisabled && documentRequirements.missing.length === 0) && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[101] animate-slideDown">
          <div className={`px-6 py-4 rounded-xl shadow-2xl ${isDark ? 'bg-gradient-to-r from-emerald-900/90 to-emerald-800/90 text-emerald-100' : 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800'} border ${isDark ? 'border-emerald-700' : 'border-emerald-200'}`}>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">All Documents Submitted!</p>
                <p className="text-sm opacity-90">Your verification is now in progress. Please wait 24-48 hours.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <div
        className={`relative w-full max-w-6xl rounded-3xl shadow-2xl ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-amber-800/30' : 'bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200'} border-2 transition-all duration-500 animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        {/* Header with gradient */}
        <div className={`p-8 border-b ${isDark ? 'border-amber-800/30 bg-gradient-to-r from-amber-900/20 via-amber-800/20 to-amber-900/20' : 'border-amber-200 bg-gradient-to-r from-amber-50/80 via-amber-100/50 to-amber-50/80'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20' : 'bg-gradient-to-br from-amber-100 to-amber-200'}`}>
                <FolderOpen className={`w-8 h-8 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isResubmissionMode ? 'Document Resubmission' : 'Document Center'}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <ListTodo className={`w-4 h-4 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
                    <span className={`text-sm font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                      {documentRequirements.uploaded.length} of {documentRequirements.required.length} required documents
                    </span>
                  </div>
                  <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-amber-600' : 'bg-amber-800'}`} />
                  {isResubmissionMode && (
                    <>
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                        <span className={`text-sm font-inter ${isDark ? 'text-orange-300/80' : 'text-orange-700/80'}`}>
                          Resubmission Required
                        </span>
                      </div>
                      <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-orange-600' : 'bg-orange-800'}`} />
                    </>
                  )}
                  <div className={`text-sm font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                    {ethiopianMode ? 'Ethiopian Requirements' : 'Standard Requirements'}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl transition-all duration-300 ${isDark ? 'hover:bg-amber-900/30 hover:scale-105 text-amber-300' : 'hover:bg-amber-100 hover:scale-105 text-amber-600'} active:scale-95`}
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex">
          {/* Left Column - Document Type Selection & Requirements */}
          <div className="w-80 p-6 space-y-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
            {/* Resubmission Banner */}
            {isResubmissionMode && (
              <div className={`p-5 rounded-2xl border ${isDark
                ? 'bg-gradient-to-r from-orange-900/20 to-amber-900/20 border-orange-700/30'
                : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
                }`}>
                <div className="flex items-start gap-4">
                  <AlertCircle className={`w-6 h-6 ${isDark ? 'text-orange-400' : 'text-orange-600'} flex-shrink-0`} />
                  <div>
                    <p className={`font-bold font-inter ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>
                      Resubmission Required
                    </p>
                    <p className={`text-sm font-inter mt-1 ${isDark ? 'text-orange-400/80' : 'text-orange-700/80'}`}>
                      Please upload a corrected version of your {getDocumentTypeLabel(resubmissionDocument)}
                    </p>
                    {adminFeedback && (
                      <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                        <div className="flex items-start gap-2">
                          <MessageCircle className={`w-4 h-4 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                          <div>
                            <p className={`text-sm font-inter font-medium ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                              Admin Feedback:
                            </p>
                            <p className={`text-sm font-inter ${isDark ? 'text-orange-400/80' : 'text-orange-700/80'}`}>
                              {adminFeedback}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Requirements Checklist */}
            <div className={`p-4 rounded-xl ${isDark
              ? 'bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-800/30'
              : 'bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200'
              }`}>
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`font-semibold font-inter ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                  Verification Requirements
                </h3>
              </div>

              <div className="space-y-2">
                {documentRequirements.required.map((docType, index) => {
                  const isUploaded = documentRequirements.uploaded.includes(docType);
                  const isCurrent = documentType === docType;
                  const needsResubmission = documentRequirements.needsResubmission.includes(docType);
                  const label = getDocumentTypeLabel(docType);

                  return (
                    <div
                      key={index}
                      className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${isCurrent
                        ? isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-100 border border-blue-300'
                        : isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                        } ${needsResubmission ? 'ring-1 ring-orange-500/50' : ''}`}
                      onClick={() => setDocumentType(docType)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {needsResubmission ? (
                            <AlertCircle className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                          ) : isUploaded ? (
                            <CheckCircle className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                          ) : (
                            <Square className={`w-4 h-4 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} />
                          )}
                          <span className={`text-sm font-inter ${isDark
                            ? needsResubmission ? 'text-orange-300' :
                              isUploaded ? 'text-green-300' :
                                isCurrent ? 'text-blue-300' : 'text-gray-300'
                            : needsResubmission ? 'text-orange-700' :
                              isUploaded ? 'text-green-700' :
                                isCurrent ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                            {label}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${isDark
                          ? needsResubmission ? 'bg-orange-900/30 text-orange-300' :
                            isUploaded ? 'bg-green-900/30 text-green-300' : 'bg-amber-900/30 text-amber-300'
                          : needsResubmission ? 'bg-orange-100 text-orange-700' :
                            isUploaded ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {needsResubmission ? 'Resubmit' : isUploaded ? '✓ Uploaded' : 'Required'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {documentRequirements.missing.length > 0 && (
                <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <p className={`text-sm font-inter mb-2 ${isDark ? 'text-blue-300/80' : 'text-blue-700/80'}`}>
                    <span className="font-semibold">Still needed:</span> {documentRequirements.missing.length} of {documentRequirements.required.length}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {documentRequirements.missing.map((type, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded text-xs cursor-pointer ${isDark
                          ? 'bg-amber-900/40 text-amber-300 hover:bg-amber-900/60'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        onClick={() => setDocumentType(type)}
                      >
                        {getDocumentTypeLabel(type)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {documentRequirements.needsResubmission.length > 0 && (
                <div className="mt-4 pt-3 border-t border-orange-200 dark:border-orange-800">
                  <p className={`text-sm font-inter mb-2 ${isDark ? 'text-orange-300/80' : 'text-orange-700/80'}`}>
                    <span className="font-semibold">Needs Resubmission:</span> {documentRequirements.needsResubmission.length} document(s)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {documentRequirements.needsResubmission.map((type, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded text-xs cursor-pointer ${isDark
                          ? 'bg-orange-900/40 text-orange-300 hover:bg-orange-900/60'
                          : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          }`}
                        onClick={() => {
                          setDocumentType(type);
                          setIsResubmissionMode(true);
                        }}
                      >
                        {getDocumentTypeLabel(type)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Document Type Selection */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                <Filter className="w-5 h-5" />
                Document Type
              </h3>

              {/* Category Tabs */}
              <div className="flex flex-col gap-2 mb-4">
                {Object.entries(documentOptions.categories).map(([key, categoryData]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(key)}
                    className={`py-3 px-4 rounded-xl text-left transition-all duration-300 font-inter ${activeCategory === key
                      ? isDark
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-300 shadow-lg'
                        : 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300 text-amber-800 shadow-lg'
                      : isDark
                        ? 'text-gray-400 hover:text-amber-300 hover:bg-gray-800/50 hover:border-amber-800/30'
                        : 'text-gray-600 hover:text-amber-800 hover:bg-amber-50/50 hover:border-amber-200'
                      } border`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {categoryData.icon}
                        <span className="font-medium">{categoryData.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <span className={`text-xs ml-6 ${activeCategory === key
                      ? isDark ? 'text-amber-800/80' : 'text-amber-700/80'
                      : isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                      {categoryData.documents.length} documents
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Type List */}
            <div className="space-y-2">
              {currentCategoryDocs.map((doc) => {
                const isRequired = documentRequirements.required.includes(doc.value);
                const isUploaded = documentRequirements.uploaded.includes(doc.value);
                const isMissing = documentRequirements.missing.includes(doc.value);
                const needsResubmission = documentRequirements.needsResubmission.includes(doc.value);

                return (
                  <button
                    key={doc.value}
                    type="button"
                    onClick={() => {
                      setDocumentType(doc.value);
                      if (needsResubmission) {
                        setIsResubmissionMode(true);
                      }
                    }}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-300 ${documentType === doc.value
                      ? isDark
                        ? 'bg-gradient-to-r from-amber-500/15 to-amber-600/15 border border-amber-500/30'
                        : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-300'
                      : isDark
                        ? 'hover:bg-gray-800/50 border border-transparent hover:border-amber-800/30'
                        : 'hover:bg-amber-50/50 border border-transparent hover:border-amber-200'
                      } border ${needsResubmission ? 'ring-1 ring-orange-500/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${needsResubmission
                        ? (isDark ? 'bg-orange-900/30' : 'bg-orange-100')
                        : (isDark ? 'bg-amber-900/30' : 'bg-amber-100')
                        }`}>
                        {getDocumentIcon(doc.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <p className={`font-medium font-inter ${documentType === doc.value
                            ? isDark ? 'text-amber-300' : 'text-amber-800'
                            : isDark ? 'text-gray-300' : 'text-gray-800'
                            }`}>
                            {doc.label}
                          </p>
                          <div className="flex gap-1">
                            {needsResubmission && (
                              <div className="relative group">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDocumentType(doc.value);
                                    setIsResubmissionMode(true);

                                    // Fetch and set specific feedback
                                    fetchDocumentFeedback(doc.value);
                                  }}
                                  className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 ${isDark
                                    ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300 hover:from-orange-500/30 hover:to-orange-600/30 hover:text-orange-200 hover:shadow-lg'
                                    : 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 hover:from-orange-200 hover:to-orange-300 hover:text-orange-800 hover:shadow-md'
                                    }`}
                                >
                                  <div className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Resubmit</span>
                                  </div>
                                </button>

                                {/* Feedback tooltip on hover */}
                                {existingDoc?.review_notes && (
                                  <div className={`absolute z-50 hidden group-hover:block min-w-[200px] max-w-[300px] p-3 rounded-lg shadow-xl ${isDark
                                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 border border-orange-700/50 text-orange-200'
                                    : 'bg-gradient-to-r from-white to-gray-50 border border-orange-300 text-orange-800'
                                    } bottom-full left-1/2 transform -translate-x-1/2 mb-2`}>
                                    <div className="text-xs font-medium mb-1 flex items-center gap-1">
                                      <MessageCircle className="w-3 h-3" />
                                      Admin Feedback:
                                    </div>
                                    <div className="text-xs">
                                      {existingDoc.review_notes.length > 150
                                        ? `${existingDoc.review_notes.substring(0, 150)}...`
                                        : existingDoc.review_notes}
                                    </div>
                                    <div className={`text-[10px] mt-2 pt-1 border-t ${isDark ? 'border-orange-700/30 text-orange-400/70' : 'border-orange-200 text-orange-600/70'}`}>
                                      Click to resubmit with corrections
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {isRequired && !needsResubmission && (
                              <span className={`text-xs px-2 py-1 rounded-full ${isUploaded
                                ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                                : isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {isUploaded ? '✓' : 'Required'}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`text-xs mt-1 font-inter ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {doc.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Middle Column - Upload Area */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
            {/* File Upload Area */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                  {isResubmissionMode ? 'Upload Corrected Document' : 'Upload Document'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(true)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-amber-900/30 text-amber-300' : 'hover:bg-amber-100 text-amber-600'} transition-colors`}
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Restriction Notice */}
              {isUploadDisabled && documentRequirements.missing.length === 0 && !isResubmissionMode && (
                <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold font-inter text-emerald-700 dark:text-emerald-300">All Documents Submitted!</p>
                      <p className="text-sm font-inter text-emerald-600 dark:text-emerald-400 mt-1">
                        You have submitted all required documents. Your verification is now in progress.
                        Please wait 24-48 hours for the verification process to complete.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Document Info */}
              {documentType && (
                <div className={`mb-6 p-4 rounded-xl ${isDark
                  ? 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border border-amber-800/30'
                  : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${needsResubmission || isResubmissionMode
                        ? (isDark ? 'bg-orange-900/30' : 'bg-orange-100')
                        : (isDark ? 'bg-amber-900/30' : 'bg-amber-100')
                        }`}>
                        {getDocumentIcon(documentOptions.allDocuments.find(d => d.value === documentType)?.icon || 'File')}
                      </div>
                      <div>
                        <p className={`font-semibold font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                          {getDocumentTypeLabel(documentType)}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {isResubmissionMode && (
                            <span className={`text-xs font-inter ${isDark ? 'text-orange-300/80' : 'text-orange-700/80'}`}>
                              <FileWarning className="inline w-3 h-3 mr-1" />
                              Resubmission Required
                            </span>
                          )}
                          <span className={`text-xs font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                            {documentRequirements.required.includes(documentType) ? 'Required Document' : 'Optional Document'}
                          </span>
                          <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-amber-600' : 'bg-amber-800'}`} />
                          <span className={`text-xs font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                            {isDocumentAlreadyUploaded() ? 'Already Uploaded' : 'Not Uploaded Yet'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isDocumentAlreadyUploaded() && uploadedDoc && (
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-inter ${statusBadge.bgColor} border ${statusBadge.borderColor}`}>
                        {statusBadge.icon}
                        <span className={statusBadge.textColor}>{statusBadge.text}</span>
                      </div>
                    )}
                  </div>

                  {/* Show admin feedback for resubmission */}
                  {isResubmissionMode && adminFeedback && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                      <div className="flex items-start gap-2">
                        <MessageCircle className={`w-4 h-4 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                        <div>
                          <p className={`text-xs font-medium font-inter ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                            Admin Feedback:
                          </p>
                          <p className={`text-xs font-inter ${isDark ? 'text-orange-400/80' : 'text-orange-700/80'}`}>
                            {adminFeedback}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div
                onClick={() => !isLoading && !(isUploadDisabled && documentRequirements.missing.length === 0) && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`border-3 border-dashed rounded-2xl p-10 text-center transition-all duration-500 ${isLoading || (isUploadDisabled && documentRequirements.missing.length === 0)
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:border-amber-800 hover:shadow-2xl hover:scale-[1.01] cursor-pointer'
                  } ${selectedFile
                    ? isDark
                      ? 'border-amber-800 bg-gradient-to-br from-amber-900/10 to-amber-800/10'
                      : 'border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100/30'
                    : isDark
                      ? 'border-amber-600/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50'
                      : 'border-amber-300 bg-gradient-to-br from-gray-50 to-white'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.svg"
                  disabled={isLoading || (isUploadDisabled && documentRequirements.missing.length === 0)}
                />

                {selectedFile ? (
                  <div className="space-y-6">
                    {previewUrl && showPreview ? (
                      <div className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden border-2 border-amber-300 dark:border-amber-600 shadow-xl group">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPreview(!showPreview);
                          }}
                          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mx-auto w-32 h-32 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center shadow-lg">
                        <File className="w-16 h-16 text-amber-600 dark:text-amber-800" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className={`text-xl font-bold font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                        {selectedFile.name}
                      </p>
                      <div className="flex items-center justify-center gap-4 text-sm font-inter">
                        <span className={isDark ? 'text-amber-300/80' : 'text-amber-700/80'}>
                          <FileUp className="inline w-4 h-4 mr-1" />
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className={isDark ? 'text-amber-500' : 'text-amber-500'}>•</span>
                        <span className={isDark ? 'text-amber-300/80' : 'text-amber-700/80'}>
                          <FileType className="inline w-4 h-4 mr-1" />
                          {selectedFile.type.split('/')[1].toUpperCase()}
                        </span>
                        <span className={isDark ? 'text-amber-500' : 'text-amber-500'}>•</span>
                        <span className={isDark ? 'text-amber-300/80' : 'text-amber-700/80'}>
                          <Calendar className="inline w-4 h-4 mr-1" />
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        disabled={isLoading || (isUploadDisabled && documentRequirements.missing.length === 0)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        disabled={isLoading || !previewUrl || (isUploadDisabled && documentRequirements.missing.length === 0)}
                        className={`px-4 py-2 rounded-lg font-inter ${previewUrl
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          } transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showPreview ? 'Hide' : 'Show'} Preview
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className={`mx-auto w-24 h-24 rounded-2xl flex items-center justify-center ${(isUploadDisabled && documentRequirements.missing.length === 0)
                      ? 'bg-gradient-to-br from-emerald-300 to-emerald-400 dark:from-emerald-700 dark:to-emerald-800'
                      : isResubmissionMode
                        ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 animate-pulse-slow'
                        : 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 animate-pulse-slow'
                      }`}>
                      {(isUploadDisabled && documentRequirements.missing.length === 0) ? (
                        <CheckCircle className={`w-12 h-12 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      ) : isResubmissionMode ? (
                        <FileWarning className={`w-12 h-12 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                      ) : (
                        <Upload className={`w-12 h-12 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
                      )}
                    </div>
                    <div>
                      <p className={`text-xl font-bold mb-3 font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                        {(isUploadDisabled && documentRequirements.missing.length === 0)
                          ? 'All Documents Submitted'
                          : isResubmissionMode
                            ? 'Upload Corrected Document'
                            : isLoading ? 'Processing...' : 'Drag & Drop or Click to Browse'
                        }
                      </p>
                      <p className={`text-sm font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                        {(isUploadDisabled && documentRequirements.missing.length === 0)
                          ? 'Your verification is now in progress. Please wait 24-48 hours.'
                          : isResubmissionMode
                            ? 'Upload a corrected version of this document as per admin feedback'
                            : <>
                              <FileText className="inline w-4 h-4 mr-1" />
                              Supports PDF, JPG, PNG, WebP, SVG •
                              <Shield className="inline w-4 h-4 mx-1" />
                              Max 10MB
                            </>
                        }
                      </p>
                    </div>
                    {!(isUploadDisabled && documentRequirements.missing.length === 0) && (
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isResubmissionMode
                        ? (isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-900')
                        : (isDark ? 'bg-amber-900/30 text-amber-600' : 'bg-amber-100 text-amber-900')
                        }`}>
                        <Upload className="w-4 h-4" />
                        <span className="text-sm font-inter">
                          {isResubmissionMode ? 'Browse Corrected File' : 'Browse Files'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Upload Progress with Animation */}
              {(isLoading || uploadProgressState > 0) && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      {isLoading ? 'Uploading your document...' : 'Upload complete!'}
                    </span>
                    <span className={`text-sm font-bold font-inter ${isDark ? 'text-amber-800' : 'text-amber-600'}`}>
                      {uploadProgressState}%
                    </span>
                  </div>
                  <div className={`h-3 rounded-full ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'} overflow-hidden`}>
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgressState}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Validation Error */}
              {validationError && (
                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium font-inter text-red-700 dark:text-red-300">Upload Error</p>
                      <p className="text-sm font-inter text-red-600 dark:text-red-400 mt-1">
                        {validationError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Status */}
              {uploadStatus && (
                <div className={`mt-6 p-5 rounded-2xl border ${uploadStatus.type === 'success'
                  ? `bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800`
                  : uploadStatus.type === 'error'
                    ? `bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800`
                    : `bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800`
                  }`}>
                  <div className="flex items-start gap-4">
                    {uploadStatus.type === 'success' ? (
                      <CheckCircle className="w-6 h-6 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    ) : uploadStatus.type === 'error' ? (
                      <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0" />
                    ) : (
                      <Loader className="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0 animate-spin" />
                    )}
                    <div>
                      <p className={`font-medium font-inter ${uploadStatus.type === 'success'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : uploadStatus.type === 'error'
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-blue-700 dark:text-blue-300'
                        }`}>
                        {uploadStatus.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-amber-200 dark:border-amber-800/30">
              <button
                type="button"
                onClick={() => fetchExistingDocuments()}
                disabled={isLoading}
                className={`flex-1 py-3.5 rounded-xl font-inter transition-all duration-300 ${isDark
                  ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/40 hover:scale-[1.02]'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200 hover:scale-[1.02]'
                  } flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Documents
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedFile || !documentType || (isUploadDisabled && documentRequirements.missing.length === 0)}
                className={`flex-1 py-3.5 rounded-xl font-semibold font-inter flex items-center justify-center gap-2 transition-all duration-300 ${(isUploadDisabled && documentRequirements.missing.length === 0)
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-50 cursor-not-allowed'
                  : isResubmissionMode
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-xl hover:scale-[1.02]'
                    : isAlreadyUploaded
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-xl hover:scale-[1.02]'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-xl hover:scale-[1.02]'
                  } shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (isUploadDisabled && documentRequirements.missing.length === 0) ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    All Documents Submitted
                  </>
                ) : (
                  <>
                    {isResubmissionMode ? <FileWarning className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    {getUploadButtonText()}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Document List */}
          <div className="w-96 flex flex-col">
            {/* Header with Stats */}
            <div className="p-6 border-b border-amber-200 dark:border-amber-800/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                  Your Documents
                </h3>
                <div className={`text-xs px-3 py-1.5 rounded-full font-inter ${isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                  {filteredDocuments.length} shown
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className={`text-xs font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>Verified</span>
                  </div>
                  <p className={`text-2xl font-bold font-montserrat ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{documentStats.verified}</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className={`text-xs font-inter ${isDark ? 'text-amber-500/80' : 'text-amber-700/80'}`}>Pending</span>
                  </div>
                  <p className={`text-2xl font-bold font-montserrat ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{documentStats.pending}</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className={`text-xs font-inter ${isDark ? 'text-orange-500/80' : 'text-orange-700/80'}`}>Resubmission</span>
                  </div>
                  <p className={`text-2xl font-bold font-montserrat ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{documentStats.needs_resubmission}</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className={`text-xs font-inter ${isDark ? 'text-red-500/80' : 'text-red-700/80'}`}>Rejected</span>
                  </div>
                  <p className={`text-2xl font-bold font-montserrat ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{documentStats.rejected}</p>
                </div>
              </div>

              {/* Progress Bar for Required Documents */}
              {documentRequirements.required.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                      Required Documents Progress
                    </span>
                    <span className={`text-xs font-bold font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                      {documentRequirements.uploaded.length}/{documentRequirements.required.length}
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'} overflow-hidden`}>
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                      style={{ width: `${(documentRequirements.uploaded.length / documentRequirements.required.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Search */}
              <div>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-inter ${isDark ? 'bg-amber-900/20 border-amber-800/30 text-amber-200 placeholder-amber-800/50' : 'bg-amber-50 border-amber-200 text-amber-800 placeholder-amber-600/50'} border focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                  />
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-amber-200 dark:border-amber-800/30">
              {['all', 'uploaded', 'pending', 'needs_resubmission'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`flex-1 py-3.5 text-sm font-medium font-inter transition-all duration-300 ${activeFilter === filter
                    ? isDark
                      ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border-b-2 border-amber-500'
                      : 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-b-2 border-amber-500'
                    : isDark
                      ? 'text-amber-800/70 hover:text-amber-300 hover:bg-amber-900/30'
                      : 'text-amber-600/70 hover:text-amber-800 hover:bg-amber-50'
                    }`}
                >
                  {filter === 'uploaded' ? (
                    <span className="flex items-center justify-center gap-2">
                      <FileCheck className="w-4 h-4" /> Uploaded
                    </span>
                  ) : filter === 'pending' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" /> Pending
                    </span>
                  ) : filter === 'needs_resubmission' ? (
                    <span className="flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Resubmission
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <File className="w-4 h-4" /> All
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isCheckingDocuments ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-amber-500 mb-4" />
                  <p className={`text-sm font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                    Loading your documents...
                  </p>
                </div>
              ) : filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc, index) => {
                  if (!doc) return null;
                  const docType = doc.type || doc.document_type;
                  const docStatus = doc.status || 'pending';
                  const docStatusBadge = getStatusBadge(docStatus);
                  const docTypeDisplay = getDocumentTypeLabel(docType);
                  const isActive = docType === documentType;
                  const isImage = doc.url && (doc.url.includes('.jpg') || doc.url.includes('.png') || doc.url.includes('.jpeg'));
                  const needsResubmission = doc.status === 'needs_resubmission';
                  const hasFeedback = doc.feedback || doc.rejection_reason;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl transition-all duration-300 cursor-pointer group border ${isActive
                        ? 'ring-2 ring-amber-500 dark:ring-amber-500 shadow-lg scale-[1.02] border-amber-300 dark:border-amber-600'
                        : isDark
                          ? 'bg-amber-900/10 hover:bg-amber-900/20 hover:scale-[1.01] border-amber-800/30'
                          : 'bg-amber-50 hover:bg-amber-100 hover:scale-[1.01] border-amber-200'
                        } hover:shadow-md ${needsResubmission ? 'ring-1 ring-orange-500/30' : ''}`}
                      onClick={() => {
                        setDocumentType(docType);
                        if (needsResubmission) {
                          setIsResubmissionMode(true);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg ${isActive
                          ? (needsResubmission ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-amber-100 dark:bg-amber-900/30')
                          : (needsResubmission ? 'bg-orange-100/50 dark:bg-orange-900/20' : 'bg-amber-100/50 dark:bg-amber-900/20')
                          }`}>
                          {isImage ? (
                            <FileImage className={`w-5 h-5 ${needsResubmission ? 'text-orange-600 dark:text-orange-800' : 'text-amber-600 dark:text-amber-800'}`} />
                          ) : (
                            <FileText className={`w-5 h-5 ${needsResubmission ? 'text-orange-600 dark:text-orange-800' : 'text-amber-600 dark:text-amber-800'}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className={`font-medium font-inter truncate ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                                {docTypeDisplay}
                              </p>
                              {needsResubmission && hasFeedback && (
                                <div className={`mt-1 p-2 rounded text-xs ${isDark
                                  ? 'bg-orange-900/20 text-orange-300 border border-orange-800/30'
                                  : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                                  <div className="flex items-start gap-1">
                                    <MessageCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">Admin:</span>
                                    <span className="ml-1 truncate">{hasFeedback}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-inter ${docStatusBadge.bgColor} border ${docStatusBadge.borderColor}`}>
                              {docStatusBadge.icon}
                              <span className={docStatusBadge.textColor}>{docStatusBadge.text}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className={`text-xs font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                                <Calendar className="inline w-3 h-3 mr-1" />
                                {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Unknown'}
                              </span>
                              {(doc.size && doc.size > 0) && (
                                <span className={`text-xs font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                                  <FileUp className="inline w-3 h-3 mr-1" />
                                  {(doc.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              )}
                            </div>
                            {doc.url && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = doc.url.startsWith('http') ? doc.url : `http://localhost:5000/${doc.url}`;
                                    window.open(url, '_blank');
                                  }}
                                  className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-colors"
                                  title="View Document"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = doc.url.startsWith('http') ? doc.url : `http://localhost:5000/${doc.url}`;
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = doc.filename || doc.document_filename || 'document';
                                    link.click();
                                  }}
                                  className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {isActive && (
                        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-2 text-sm font-inter text-amber-600 dark:text-amber-800">
                            {needsResubmission ? (
                              <>
                                <AlertCircle className="w-4 h-4" />
                                <span>Click to resubmit this document</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>Currently selected • Click again to deselect</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Archive className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-amber-800/50' : 'text-amber-600/50'}`} />
                  <p className={`text-lg font-medium mb-2 font-inter ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                    No documents found
                  </p>
                  <p className={`text-sm font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                    {searchQuery ? 'Try a different search' : 'Upload your first document'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer with Progress */}
        <div className={`p-6 border-t ${isDark ? 'border-amber-800/30 bg-gradient-to-r from-gray-900/50 to-gray-800/50' : 'border-amber-200 bg-gradient-to-r from-white to-amber-50/30'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1.5 rounded-full font-inter ${isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                <span className="text-sm">
                  {isResubmissionMode
                    ? `Resubmitting ${getDocumentTypeLabel(resubmissionDocument)}`
                    : (isUploadDisabled && documentRequirements.missing.length === 0)
                      ? 'All Documents Submitted'
                      : selectedFile
                        ? `Ready to ${isResubmissionMode ? 'resubmit' : 'upload'} ${getDocumentTypeLabel(documentType)}`
                        : 'Select a file and document type'
                  }
                </span>
              </div>
              {selectedFile && !(isUploadDisabled && documentRequirements.missing.length === 0) && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isResubmissionMode || needsResubmission ? 'bg-orange-500' : isAlreadyUploaded ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className={`text-sm font-inter ${isDark ? 'text-amber-800/80' : 'text-amber-600/80'}`}>
                    {isResubmissionMode ? 'Resubmission' : isAlreadyUploaded ? 'Will replace existing' : 'New document'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`px-6 py-3 rounded-xl border font-medium font-inter transition-all duration-300 ${isDark
                  ? 'border-amber-800/50 hover:bg-amber-900/30 text-amber-300 hover:scale-105'
                  : 'border-amber-300 hover:bg-amber-100 text-amber-700 hover:scale-105'
                  } disabled:opacity-50 active:scale-95`}
              >
                {documentRequirements.missing.length > 0 || isResubmissionMode ? 'Continue Later' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add CSS animations
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes slideDown {
  from { transform: translate(-50%, -20px); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}

@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.group:hover .group-hover\:block {
  display: block !important;
}

/* Add animation for tooltip */
@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

.group:hover .group-hover\:block {
  animation: fadeIn 0.2s ease-out;
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.animate-scaleIn {
  animation: scaleIn 0.3s ease-out;
}

.animate-slideDown {
  animation: slideDown 0.3s ease-out;
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default DocumentUploadModal;