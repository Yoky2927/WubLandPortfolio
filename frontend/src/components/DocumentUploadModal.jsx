import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  File,
  AlertCircle,
  CheckCircle,
  Globe,
  UserCheck,
  Building,
  Award,
  Loader,
  Eye,
  Clock,
  AlertTriangle,
  Shield,
  FileCheck,
  FileX,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Info,
  HelpCircle,
  FolderOpen,
  ShieldAlert,
  Filter,
  Archive,
  Search,
  Download,
  ExternalLink,
  FileText,
  FileImage,
  RotateCw,
  Home,
  User,
  Briefcase,
  Landmark,
  Banknote,
  FileSpreadsheet,
  CreditCard,
  FileSignature,
  FileKey,
  FileDigit,
  Camera,
  FileArchive,
  FileClock,
  FileQuestion,
  ShieldCheck,
  ShieldOff,
  UploadCloud,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  CreditCard as Card,
  FileUp,
  FileDown,
  FilePlus,
  FileMinus,
  Check,
  UserCircle,
  Building2,
  FileType,
  Image,
  FileJson,
  FileCode,
  Lock,
  Unlock,
  Calendar,
  EyeOff,
  FileSearch,
  FileBarChart,
  ListTodo,
  CheckSquare,
  Square,
  ArrowRight,
  MessageCircle,
  BookOpen,
  FileWarning,
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
  resubmissionDocument = null,
  resubmissionFeedback = "",
  userDocuments = [],
}) => {
  const { theme } = useTheme();
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState(propDocumentType || "");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [isCheckingDocuments, setIsCheckingDocuments] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [userRole, setUserRole] = useState("buyer");
  const [activeCategory, setActiveCategory] = useState("all");
  const [documentOptions, setDocumentOptions] = useState({
    allDocuments: [],
    categories: {},
    isBrokerOrAdmin: false,
  });
  const [documentRequirements, setDocumentRequirements] = useState({
    required: [],
    uploaded: [],
    missing: [],
    uploadedDocs: [],
    needsResubmission: [],
  });
  const [uploadProgressState, setUploadProgressState] = useState(0);
  const [isUploadDisabled, setIsUploadDisabled] = useState(false);
  const [isResubmissionMode, setIsResubmissionMode] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState(
    resubmissionFeedback || ""
  );
  const fileInputRef = useRef(null);
  const documentListRef = useRef(null);

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
  const initializeDocumentOptions = (role = "buyer") => {
    const isBrokerOrAdmin = [
      "broker",
      "admin",
      "support_admin",
      "support_agent",
      "support_lead",
    ].includes(role);

    const baseTypes = [
      {
        value: "id_card",
        label: "National ID Card",
        description: "Government issued ID card",
        icon: "IdCard",
        color: "amber",
        category: "personal",
        required: true,
        forAllUsers: true,
      },
      {
        value: "passport",
        label: "Passport",
        description: "International passport (for diaspora/foreigners)",
        icon: "Globe",
        color: "amber",
        category: "personal",
        forAllUsers: true,
      },
      {
        value: "proof_of_income",
        label: "Proof of Income",
        description: "Salary slip or bank statement (last 3 months)",
        icon: "FileSpreadsheet",
        color: "amber",
        category: "financial",
        required: true,
        forAllUsers: true,
      },
      {
        value: "bank_statement",
        label: "Bank Statement",
        description: "Recent 3 months bank statement",
        icon: "FileBarChart",
        color: "amber",
        category: "financial",
        forAllUsers: true,
      },
      {
        value: "utility_bill",
        label: "Utility Bill",
        description: "Proof of current address",
        icon: "FileText",
        color: "amber",
        category: "personal",
        forAllUsers: true,
      },
    ];

    const ethiopianTypes = [
      {
        value: "kebele_id",
        label: "Kebele ID",
        description: "For Ethiopian citizens living in Ethiopia",
        icon: "IdCard",
        color: "amber",
        category: "personal",
        required: ethiopianMode,
        forAllUsers: true,
      },
      {
        value: "yellow_card",
        label: "Yellow Card",
        description: "Foreign national residence permit",
        icon: "FileKey",
        color: "amber",
        category: "personal",
        forAllUsers: true,
      },
    ];

    const roleBasedTypes = {
      seller: [
        {
          value: "property_deed",
          label: "Property Deed/Title",
          description: "Property ownership document",
          icon: "FileArchive",
          color: "amber",
          category: "property",
          required: false,
        },
        {
          value: "property_tax_receipt",
          label: "Property Tax Receipt",
          description: "Recent property tax payment receipt",
          icon: "FileText",
          color: "amber",
          category: "property",
          required: false,
        },
      ],
      landlord: [
        {
          value: "rental_agreement",
          label: "Existing Rental Agreement",
          description: "Copy of current rental agreement",
          icon: "FileSignature",
          color: "amber",
          category: "rental",
          required: false,
        },
        {
          value: "property_photos",
          label: "Property Photos",
          description: "Recent photos of the property",
          icon: "Camera",
          color: "amber",
          category: "property",
          required: false,
        },
      ],
      buyer: [
        {
          value: "employment_letter",
          label: "Employment Letter",
          description: "Current employment confirmation letter",
          icon: "FileText",
          color: "amber",
          category: "financial",
          required: false,
        },
        {
          value: "reference_letter",
          label: "Reference Letter",
          description: "Personal or professional reference",
          icon: "FileQuestion",
          color: "amber",
          category: "personal",
          required: false,
        },
      ],
      renter: [
        {
          value: "employment_letter",
          label: "Employment Letter",
          description: "Current employment confirmation",
          icon: "FileText",
          color: "amber",
          category: "financial",
          required: false,
        },
        {
          value: "previous_rental_reference",
          label: "Previous Rental Reference",
          description: "Reference from previous landlord",
          icon: "FileClock",
          color: "amber",
          category: "rental",
          required: false,
        },
      ],
      broker: [
        {
          value: "broker_license",
          label: "Broker License",
          description: "Valid real estate broker license",
          icon: "Award",
          color: "amber",
          category: "professional",
          required: true,
        },
        {
          value: "tin_certificate",
          label: "TIN Certificate",
          description: "Tax identification certificate",
          icon: "FileDigit",
          color: "amber",
          category: "professional",
          required: true,
        },
        {
          value: "business_license",
          label: "Business License",
          description: "Business registration certificate",
          icon: "Building",
          color: "amber",
          category: "professional",
          required: true,
        },
        {
          value: "power_of_attorney",
          label: "Power of Attorney",
          description: "Legal authorization document",
          icon: "FileKey",
          color: "amber",
          category: "legal",
          required: false,
        },
      ],
    };

    const userRoleDocuments = roleBasedTypes[role] || [];
    let allDocuments = [...baseTypes, ...(ethiopianMode ? ethiopianTypes : [])];
    allDocuments = [...allDocuments, ...userRoleDocuments];

    if (!isBrokerOrAdmin) {
      allDocuments = allDocuments.filter(
        (doc) => !doc.category?.includes("professional")
      );
    }

    const categories = {
      all: {
        label: "All Documents",
        icon: <File className="w-4 h-4" />,
        documents: allDocuments,
      },
      personal: {
        label: "Personal Identification",
        icon: <User className="w-4 h-4" />,
        documents: allDocuments.filter((doc) => doc.category === "personal"),
      },
      financial: {
        label: "Financial Documents",
        icon: <Banknote className="w-4 h-4" />,
        documents: allDocuments.filter((doc) => doc.category === "financial"),
      },
      property: {
        label: "Property Documents",
        icon: <Home className="w-4 h-4" />,
        documents: allDocuments.filter((doc) => doc.category === "property"),
      },
      rental: {
        label: "Rental Documents",
        icon: <FileSignature className="w-4 h-4" />,
        documents: allDocuments.filter((doc) => doc.category === "rental"),
      },
      legal: {
        label: "Legal Documents",
        icon: <FileKey className="w-4 h-4" />,
        documents: allDocuments.filter((doc) => doc.category === "legal"),
      },
    };

    if (isBrokerOrAdmin) {
      categories["professional"] = {
        label: "Professional License",
        icon: <Briefcase className="w-4 h-4" />,
        documents: allDocuments.filter(
          (doc) => doc.category === "professional"
        ),
      };
    }

    const filteredCategories = Object.entries(categories)
      .filter(([_, data]) => data.documents.length > 0)
      .reduce((acc, [key, data]) => {
        acc[key] = data;
        return acc;
      }, {});

    return {
      allDocuments,
      categories: filteredCategories,
      isBrokerOrAdmin,
    };
  };

  const fetchExistingDocumentsDebounced = useCallback(
  debounce(async () => {
    await fetchExistingDocuments();
  }, 1000),
  []
);
  // Get user role from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const role = user?.role || "buyer";
      setUserRole(role);
      const options = initializeDocumentOptions(role);
      setDocumentOptions(options);

      if (resubmissionDocument) {
        setIsResubmissionMode(true);
        setDocumentType(resubmissionDocument);

        if (resubmissionFeedback) {
          setAdminFeedback(resubmissionFeedback);
          toast.info(`Please resubmit: ${resubmissionFeedback}`, {
            duration: 6000,
            icon: "📄",
          });
        }
      }

      const requiredDocs = getRequiredDocuments(role, ethiopianMode);
      setDocumentRequirements((prev) => ({
        ...prev,
        required: requiredDocs,
      }));

      fetchExistingDocuments();
      setShowGuide(true);
      setTimeout(() => setShowGuide(false), 5000);
      fetchExistingDocumentsDebounced();
    }
  }, [isOpen, ethiopianMode, resubmissionDocument, resubmissionFeedback]);

  const getRequiredDocuments = (role, isEthiopian) => {
    const baseDocuments = ["proof_of_income"];
    if (isEthiopian) {
      return ["kebele_id", ...baseDocuments];
    } else {
      return ["id_card", ...baseDocuments];
    }
  };

  useEffect(() => {
    const options = initializeDocumentOptions(userRole);
    setDocumentOptions(options);
  }, [userRole, ethiopianMode]);

  useEffect(() => {
    if (propDocumentType) {
      setDocumentType(propDocumentType);
    }
  }, [propDocumentType]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedFile(null);
        setDocumentType(propDocumentType || "");
        setUploadStatus(null);
        setValidationError("");
        setPreviewUrl(null);
        setSearchQuery("");
        setActiveCategory("all");
        setUploadProgressState(0);
        setIsResubmissionMode(false);
        setAdminFeedback("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 300);
    }
  }, [isOpen, propDocumentType]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Fetch existing documents from the backend
  const fetchExistingDocuments = async () => {
    try {
      setIsCheckingDocuments(true);

      console.log("📋 Fetching existing documents...");

      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No token found");
        return;
      }

      // Use the CORRECT endpoint that returns documents
      console.log("🔍 Calling /api/verification/documents/my");
      const response = await fetch(
        "http://localhost:5000/api/verification/documents/my",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      let documents = [];

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Documents API response:", data);

        if (data.success && Array.isArray(data.documents)) {
          documents = data.documents;
          console.log(`🎯 Found ${documents.length} documents`);
        }
      } else {
        console.error(
          "❌ Documents API failed:",
          response.status,
          response.statusText
        );
      }

      // Process documents - using the actual structure from API response
      const processedDocuments = documents.map((doc) => {
        return {
          id: doc.id,
          type: doc.type,
          filename: doc.filename,
          status: doc.status || "pending",
          uploaded_at: doc.uploaded_at || doc.created_at,
          document_url: doc.url,
          rejection_reason: doc.rejection_reason || null,
          review_notes: doc.review_notes || null,
          is_required: true, // Most verification documents are required
          document_label: doc.type
            ? doc.type.replace(/_/g, " ").toUpperCase()
            : "Document",
        };
      });

      console.log("✅ Processed documents:", processedDocuments);
      setExistingDocuments(processedDocuments);

      // Update document requirements
      const requiredDocs = getRequiredDocuments(userRole, ethiopianMode);
      const uploadedTypes = processedDocuments
        .filter(
          (doc) =>
            doc.status === "approved" ||
            doc.status === "submitted" ||
            doc.status === "reviewing" ||
            doc.status === "pending"
        )
        .map((doc) => doc.type);

      const missingTypes = requiredDocs.filter(
        (type) => !uploadedTypes.includes(type)
      );

      const needsResubmission = processedDocuments
        .filter((doc) => doc.status === "needs_resubmission")
        .map((doc) => doc.type);

      setDocumentRequirements({
        required: requiredDocs,
        uploaded: uploadedTypes,
        missing: missingTypes,
        uploadedDocs: processedDocuments,
        needsResubmission: needsResubmission,
      });

      console.log("📊 Document requirements updated:", {
        required: requiredDocs,
        uploaded: uploadedTypes,
        missing: missingTypes,
        needsResubmission: needsResubmission,
        totalDocuments: processedDocuments.length,
      });
    } catch (error) {
      console.error("❌ Error fetching documents:", error);
    } finally {
      setIsCheckingDocuments(false);
    }
  };

  // Get document icon
  const getDocumentIcon = (iconName) => {
    const iconMap = {
      IdCard: <UserCheck className="w-5 h-5" />,
      Globe: <Globe className="w-5 h-5" />,
      FileText: <FileText className="w-5 h-5" />,
      FileArchive: <FileArchive className="w-5 h-5" />,
      FileClock: <FileClock className="w-5 h-5" />,
      FileImage: <FileImage className="w-5 h-5" />,
      FileQuestion: <FileQuestion className="w-5 h-5" />,
      FileSpreadsheet: <FileSpreadsheet className="w-5 h-5" />,
      FileDigit: <FileDigit className="w-5 h-5" />,
      FileKey: <FileKey className="w-5 h-5" />,
      FileSignature: <FileSignature className="w-5 h-5" />,
      Award: <Award className="w-5 h-5" />,
      Building: <Building className="w-5 h-5" />,
      Landmark: <Landmark className="w-5 h-5" />,
      Banknote: <Banknote className="w-5 h-5" />,
      CreditCard: <Card className="w-5 h-5" />,
      Camera: <Camera className="w-5 h-5" />,
      Home: <Home className="w-5 h-5" />,
      Briefcase: <Briefcase className="w-5 h-5" />,
      User: <User className="w-5 h-5" />,
      FileCheck: <FileCheck className="w-5 h-5" />,
      Shield: <Shield className="w-5 h-5" />,
      UserCircle: <UserCircle className="w-5 h-5" />,
      Building2: <Building2 className="w-5 h-5" />,
      FileType: <FileType className="w-5 h-5" />,
      Image: <Image className="w-5 h-5" />,
      Calendar: <Calendar className="w-5 h-5" />,
      FileSearch: <FileSearch className="w-5 h-5" />,
      FileBarChart: <FileBarChart className="w-5 h-5" />,
      ListTodo: <ListTodo className="w-5 h-5" />,
      BookOpen: <BookOpen className="w-5 h-5" />,
      MessageCircle: <MessageCircle className="w-5 h-5" />,
      FileWarning: <FileWarning className="w-5 h-5" />,
    };

    return iconMap[iconName] || <File className="w-5 h-5" />;
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const iconMap = {
      personal: <User className="w-4 h-4" />,
      financial: <Banknote className="w-4 h-4" />,
      property: <Home className="w-4 h-4" />,
      rental: <FileSignature className="w-4 h-4" />,
      professional: <Briefcase className="w-4 h-4" />,
      legal: <FileKey className="w-4 h-4" />,
      all: <File className="w-4 h-4" />,
    };
    return iconMap[category] || <File className="w-4 h-4" />;
  };

  // Check if document is already uploaded
  const isDocumentAlreadyUploaded = () => {
    return existingDocuments.some(
      (doc) =>
        (doc.type === documentType || doc.document_type === documentType) &&
        (doc.status === "pending" ||
          doc.status === "submitted" ||
          doc.status === "reviewing" ||
          doc.status === "approved")
    );
  };

  // Check if document needs resubmission
  const isDocumentNeedsResubmission = () => {
    return existingDocuments.some(
      (doc) =>
        (doc.type === documentType || doc.document_type === documentType) &&
        doc.status === "needs_resubmission"
    );
  };

  // Get uploaded document
  const getUploadedDocument = () => {
    return existingDocuments.find(
      (doc) => doc.type === documentType || doc.document_type === documentType
    );
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
      case "verified":
        return {
          text: "Verified",
          icon: (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ),
          bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
          textColor: "text-emerald-700 dark:text-emerald-300",
          borderColor: "border-emerald-200 dark:border-emerald-800",
          badgeColor: "bg-gradient-to-r from-emerald-500 to-green-500",
        };
      case "rejected":
        return {
          text: "Rejected",
          icon: (
            <FileX className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          ),
          bgColor: "bg-red-100 dark:bg-red-900/30",
          textColor: "text-red-700 dark:text-red-300",
          borderColor: "border-red-200 dark:border-red-800",
          badgeColor: "bg-gradient-to-r from-red-500 to-rose-500",
        };
      case "needs_resubmission":
        return {
          text: "Resubmission Required",
          icon: (
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-800" />
          ),
          bgColor: "bg-amber-100 dark:bg-amber-900/30",
          textColor: "text-amber-700 dark:text-amber-300",
          borderColor: "border-amber-200 dark:border-amber-800",
          badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500",
        };
      case "pending_review":
      case "submitted":
      case "reviewing":
      case "pending":
        return {
          text: "Under Review",
          icon: (
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-800" />
          ),
          bgColor: "bg-amber-100 dark:bg-amber-900/30",
          textColor: "text-amber-700 dark:text-amber-300",
          borderColor: "border-amber-200 dark:border-amber-800",
          badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500",
        };
      default:
        return {
          text: "Uploaded",
          icon: (
            <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          ),
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          textColor: "text-blue-700 dark:text-blue-300",
          borderColor: "border-blue-200 dark:border-blue-800",
          badgeColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
        };
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    if (isUploadDisabled && documentRequirements.missing.length === 0) {
      toast.error(
        "All required documents have been submitted. Please wait for verification."
      );
      return;
    }

    const file = e.target.files[0];
    setValidationError("");
    setPreviewUrl(null);

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setValidationError("File size exceeds 10MB limit");
        toast.error("Please select a file smaller than 10MB");
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "image/svg+xml",
      ];
      if (!allowedTypes.includes(file.type)) {
        setValidationError(
          "Only PDF, JPEG, PNG, WebP, and SVG files are allowed"
        );
        toast.error("Please select a valid file format");
        return;
      }

      setSelectedFile(file);
      setUploadStatus(null);

      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }

      // Auto-select document type if not selected
      if (!documentType && documentOptions.allDocuments.length > 0) {
        const filename = file.name.toLowerCase();
        const matchedType = documentOptions.allDocuments.find(
          (option) =>
            filename.includes(option.value) ||
            option.label.toLowerCase().includes(filename.split(".")[0])
        );
        if (matchedType) {
          setDocumentType(matchedType.value);
        }
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUploadDisabled && documentRequirements.missing.length === 0) {
      toast.error(
        "All required documents have been submitted. Please wait for verification."
      );
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

    const existingDoc = getUploadedDocument();
    const isAlreadyUploaded = isDocumentAlreadyUploaded();
    const needsResubmission = isDocumentNeedsResubmission();

    // If document already exists and is not a resubmission request, show custom modal
    if (isAlreadyUploaded && !needsResubmission && !isResubmissionMode) {
      const status = existingDoc?.status || "pending";
      const uploadedDate = existingDoc?.uploaded_at
        ? new Date(existingDoc.uploaded_at).toLocaleDateString()
        : "Unknown date";

      // Create a custom modal instead of using window.confirm
      const userConfirmed = window.confirm(
        `⚠️ Document Already Uploaded\n\n` +
          `You already have a ${getDocumentTypeLabel(documentType)} uploaded.\n\n` +
          `• Status: ${status.charAt(0).toUpperCase() + status.slice(1)}\n` +
          `• Uploaded: ${uploadedDate}\n\n` +
          `If you need to resubmit because:\n` +
          `• The document was rejected\n` +
          `• You have a better/updated version\n` +
          `• There was an error in the previous upload\n\n` +
          `Please contact support first at support@wubland.com\n\n` +
          `Do you want to proceed with replacement?`
      );

      if (!userConfirmed) {
        return;
      }
    }

    // If document needs resubmission, automatically enable resubmission mode
    if (needsResubmission && !isResubmissionMode) {
      setIsResubmissionMode(true);
      toast.info(
        "Document needs resubmission. Please upload corrected version."
      );
    }

    try {
      setIsLoading(true);
      setUploadStatus({ type: "info", message: "Preparing upload..." });

      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setUploadProgressState(progress);
        if (progress >= 90) clearInterval(progressInterval);
      }, 100);

      // Create FormData
      const uploadFormData = new FormData();
      uploadFormData.append("document", selectedFile);
      uploadFormData.append("documentType", documentType);

      // Determine if this is a resubmission
      const isResubmission =
        isAlreadyUploaded || needsResubmission || isResubmissionMode;
      uploadFormData.append("isResubmission", isResubmission.toString());

      if (isResubmissionMode) {
        uploadFormData.append("resubmissionOf", documentType);
        if (adminFeedback) {
          uploadFormData.append("adminFeedback", adminFeedback);
        }
      }

      // Add request ID
      const requestId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      uploadFormData.append("requestId", requestId);

      setUploadStatus({
        type: "info",
        message: isResubmissionMode
          ? "Uploading resubmission..."
          : "Uploading verification document...",
      });

      console.log("📤 Uploading file:", {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        documentType: documentType,
        isResubmission: isResubmission,
        requestId: requestId,
      });

      // Make API call using fetch directly
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/verification/documents/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
          credentials: "include",
        }
      );

      // Check response
      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error("Upload error response:", errorData);

          // Handle specific errors
          if (
            errorData.message?.includes("already uploaded") ||
            errorData.existingStatus
          ) {
            // Document already exists - fetch updated status
            await fetchExistingDocuments();
            errorMessage =
              errorData.message ||
              "This document is already uploaded and under review.";
          }
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      const data = await response.json();

      clearInterval(progressInterval);
      setUploadProgressState(100);

      if (data.success) {
        const missingCount =
          data.missingDocuments?.length ||
          documentRequirements.missing.length - 1;
        const isLastRequired = missingCount === 0;

        setUploadStatus({
          type: "success",
          message: isResubmissionMode
            ? "Resubmission uploaded! Verification will be reviewed again."
            : isLastRequired
              ? "All required documents uploaded! Verification in progress."
              : `Document uploaded! ${missingCount} more document(s) needed.`,
        });

        toast.success(
          isResubmissionMode
            ? "Resubmission uploaded! Our team will review it again."
            : isLastRequired
              ? "All documents submitted! Verification will be reviewed within 24-48 hours."
              : `Document uploaded! Please upload remaining document(s).`,
          {
            duration: 4000,
            icon: isResubmissionMode ? "🔄" : isLastRequired ? "⏳" : "📄",
            style: {
              background: isDark ? "#1f2937" : "#ffffff",
              color: isDark ? "#f3f4f6" : "#111827",
              border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
            },
          }
        );

        // Refresh documents
        await fetchExistingDocuments();

        // Reset form if not last document
        if (!isLastRequired && !isResubmissionMode) {
          setTimeout(() => {
            setSelectedFile(null);
            setPreviewUrl(null);
            setUploadProgressState(0);
            setUploadStatus(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }, 1000);
        }

        // Call onSubmit callback
        if (onSubmit) {
          setTimeout(() => {
            onSubmit({
              type: documentType,
              url: data.document?.url || data.documentUrl,
              status: "pending",
              message: data.message,
              isReplacement: isResubmission,
              isResubmission: isResubmission,
              isResubmissionMode: isResubmissionMode,
              resubmissionDocument: documentType,
              adminFeedback: adminFeedback,
              filename: selectedFile.name,
              verificationStatus: isLastRequired ? "submitted" : "pending",
              requiresAdminReview: true,
              progress: data.progress,
            });

            if (isLastRequired || isResubmissionMode) {
              setTimeout(() => onClose(), 2000);
            }
          }, 1500);
        }
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("❌ Document upload failed:", error);
      setUploadProgressState(0);

      setUploadStatus({
        type: "error",
        message: error.message || "Failed to upload document",
      });
      setValidationError(error.message || "Failed to upload document");

      toast.error(error.message || "Failed to upload document", {
        duration: 5000,
        style: {
          background: isDark ? "#7f1d1d" : "#fef2f2",
          color: isDark ? "#fecaca" : "#991b1b",
          border: isDark ? "1px solid #991b1b" : "1px solid #fecaca",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file removal
  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError("");
    setUploadProgressState(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUploadDisabled && documentRequirements.missing.length === 0) {
      toast.error(
        "All required documents have been submitted. Please wait for verification."
      );
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

  // Get document type label
  const getDocumentTypeLabel = (value) => {
    const option = documentOptions.allDocuments.find(
      (opt) => opt.value === value
    );
    return option ? option.label : value.replace("_", " ");
  };

  // Filter documents based on active filter and search query
  const filteredDocuments = existingDocuments.filter((doc) => {
    if (!doc || (!doc.type && !doc.document_type)) return false;

    const docType = doc.type || doc.document_type;
    const docStatus = doc.status || "pending";

    if (activeFilter === "uploaded") {
      if (
        !(
          docStatus === "verified" ||
          docStatus === "approved" ||
          docStatus === "pending_review" ||
          docStatus === "submitted" ||
          docStatus === "reviewing" ||
          docStatus === "pending"
        )
      )
        return false;
    } else if (activeFilter === "pending") {
      if (docStatus !== "needs_resubmission") return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const typeStr = docType.toLowerCase();
      const filename = (
        doc.filename ||
        doc.document_filename ||
        ""
      ).toLowerCase();
      const status = docStatus.toLowerCase();
      const feedback = (
        doc.feedback ||
        doc.rejection_reason ||
        ""
      ).toLowerCase();

      return (
        typeStr.includes(query) ||
        filename.includes(query) ||
        status.includes(query) ||
        feedback.includes(query)
      );
    }

    return true;
  });

  // Document statistics
  const documentStats = {
    total: existingDocuments.length,
    verified: existingDocuments.filter(
      (d) => d.status === "verified" || d.status === "approved"
    ).length,
    pending: existingDocuments.filter(
      (d) =>
        d.status === "pending_review" ||
        d.status === "pending" ||
        d.status === "submitted" ||
        d.status === "reviewing"
    ).length,
    rejected: existingDocuments.filter((d) => d.status === "rejected").length,
    needs_resubmission: existingDocuments.filter(
      (d) => d.status === "needs_resubmission"
    ).length,
  };

  // Current category documents
  const currentCategoryDocs =
    activeCategory === "all"
      ? documentOptions.allDocuments
      : documentOptions.categories[activeCategory]?.documents || [];

  // Get upload button text
  const getUploadButtonText = () => {
    if (isLoading) return "Uploading...";
    if (isUploadDisabled && documentRequirements.missing.length === 0)
      return "All Documents Submitted";

    const isRequired = documentRequirements.required.includes(documentType);
    const isAlreadyUploaded = isDocumentAlreadyUploaded();
    const needsResubmission = isDocumentNeedsResubmission();

    if (needsResubmission || isResubmissionMode) {
      return "Submit Resubmission";
    }

    if (isAlreadyUploaded) {
      return "Replace Document";
    }

    if (isRequired && documentRequirements.missing.includes(documentType)) {
      return `Upload ${getDocumentTypeLabel(documentType)} (Required)`;
    }

    return "Upload Document";
  };

  if (!isOpen) return null;

  const isAlreadyUploaded = isDocumentAlreadyUploaded();
  const needsResubmission = isDocumentNeedsResubmission();
  const uploadedDoc = getUploadedDocument();
  const statusBadge = uploadedDoc ? getStatusBadge(uploadedDoc.status) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {showGuide && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[101] animate-slideDown">
          <div
            className={`px-6 py-4 rounded-xl shadow-2xl ${isDark ? "bg-gradient-to-r from-amber-900/90 to-amber-800/90 text-amber-100" : "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800"} border ${isDark ? "border-amber-700" : "border-amber-200"}`}
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  Upload your verification documents
                </p>
                <p className="text-sm opacity-90">
                  You need to upload {documentRequirements.required.length}{" "}
                  required documents
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isOpen &&
        isUploadDisabled &&
        documentRequirements.missing.length === 0 && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[101] animate-slideDown">
            <div
              className={`px-6 py-4 rounded-xl shadow-2xl ${isDark ? "bg-gradient-to-r from-emerald-900/90 to-emerald-800/90 text-emerald-100" : "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800"} border ${isDark ? "border-emerald-700" : "border-emerald-200"}`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">All Documents Submitted!</p>
                  <p className="text-sm opacity-90">
                    Your verification is now in progress. Please wait 24-48
                    hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Modal Container */}
      <div
        className={`relative w-full max-w-6xl rounded-3xl shadow-2xl ${isDark ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-amber-800/30" : "bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200"} border-2 transition-all duration-500 animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "scaleIn 0.3s ease-out" }}
      >
        {/* Header */}
        <div
          className={`p-8 border-b ${isDark ? "border-amber-800/30 bg-gradient-to-r from-amber-900/20 via-amber-800/20 to-amber-900/20" : "border-amber-200 bg-gradient-to-r from-amber-50/80 via-amber-100/50 to-amber-50/80"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl ${isDark ? "bg-gradient-to-br from-amber-500/20 to-amber-600/20" : "bg-gradient-to-br from-amber-100 to-amber-200"}`}
              >
                <FolderOpen
                  className={`w-8 h-8 ${isDark ? "text-amber-800" : "text-amber-600"}`}
                />
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold font-montserrat ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {isResubmissionMode
                    ? "Document Resubmission"
                    : "Document Center"}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <ListTodo
                      className={`w-4 h-4 ${isDark ? "text-amber-800" : "text-amber-600"}`}
                    />
                    <span
                      className={`text-sm font-inter ${isDark ? "text-amber-300/80" : "text-amber-700/80"}`}
                    >
                      {documentRequirements.uploaded.length} of{" "}
                      {documentRequirements.required.length} required documents
                    </span>
                  </div>
                  <div
                    className={`w-1 h-1 rounded-full ${isDark ? "bg-amber-600" : "bg-amber-800"}`}
                  />
                  {isResubmissionMode && (
                    <>
                      <div className="flex items-center gap-2">
                        <AlertCircle
                          className={`w-4 h-4 ${isDark ? "text-orange-400" : "text-orange-600"}`}
                        />
                        <span
                          className={`text-sm font-inter ${isDark ? "text-orange-300/80" : "text-orange-700/80"}`}
                        >
                          Resubmission Required
                        </span>
                      </div>
                      <div
                        className={`w-1 h-1 rounded-full ${isDark ? "bg-orange-600" : "bg-orange-800"}`}
                      />
                    </>
                  )}
                  <div
                    className={`text-sm font-inter ${isDark ? "text-amber-300/80" : "text-amber-700/80"}`}
                  >
                    {ethiopianMode
                      ? "Ethiopian Requirements"
                      : "Standard Requirements"}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl transition-all duration-300 ${isDark ? "hover:bg-amber-900/30 hover:scale-105 text-amber-300" : "hover:bg-amber-100 hover:scale-105 text-amber-600"} active:scale-95`}
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex min-h-0">
            {/* Left Column - Document Type Selection & Requirements */}
            <div className="w-80 p-6 space-y-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
              {/* Resubmission Banner */}
              {isResubmissionMode && (
                <div
                  className={`p-5 rounded-2xl border ${
                    isDark
                      ? "bg-gradient-to-r from-orange-900/20 to-amber-900/20 border-orange-700/30"
                      : "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <AlertCircle
                      className={`w-6 h-6 ${isDark ? "text-orange-400" : "text-orange-600"} flex-shrink-0`}
                    />
                    <div>
                      <p
                        className={`font-bold font-inter ${isDark ? "text-orange-300" : "text-orange-800"}`}
                      >
                        Resubmission Required
                      </p>
                      <p
                        className={`text-sm font-inter mt-1 ${isDark ? "text-orange-400/80" : "text-orange-700/80"}`}
                      >
                        Please upload a corrected version of your{" "}
                        {getDocumentTypeLabel(documentType)}
                      </p>
                      {adminFeedback && (
                        <div
                          className={`mt-3 p-3 rounded-lg ${isDark ? "bg-orange-900/30" : "bg-orange-100"}`}
                        >
                          <div className="flex items-start gap-2">
                            <MessageCircle
                              className={`w-4 h-4 mt-0.5 ${isDark ? "text-orange-400" : "text-orange-600"}`}
                            />
                            <div>
                              <p
                                className={`text-sm font-inter font-medium ${isDark ? "text-orange-300" : "text-orange-700"}`}
                              >
                                Admin Feedback:
                              </p>
                              <p
                                className={`text-sm font-inter ${isDark ? "text-orange-400/80" : "text-orange-700/80"}`}
                              >
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
              <div
                className={`p-4 rounded-xl ${
                  isDark
                    ? "bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-800/30"
                    : "bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare
                    className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                  />
                  <h3
                    className={`font-semibold font-inter ${isDark ? "text-blue-300" : "text-blue-800"}`}
                  >
                    Verification Requirements
                  </h3>
                </div>

                <div className="space-y-2">
                  {documentRequirements.required.map((docType, index) => {
                    const isUploaded =
                      documentRequirements.uploaded.includes(docType);
                    const isCurrent = documentType === docType;
                    const needsResubmission =
                      documentRequirements.needsResubmission.includes(docType);
                    const label = getDocumentTypeLabel(docType);

                    return (
                      <div
                        key={index}
                        className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          isCurrent
                            ? isDark
                              ? "bg-blue-900/30 border border-blue-700"
                              : "bg-blue-100 border border-blue-300"
                            : isDark
                              ? "hover:bg-gray-800/50"
                              : "hover:bg-gray-50"
                        } ${needsResubmission ? "ring-1 ring-orange-500/50" : ""}`}
                        onClick={() => {
                          setDocumentType(docType);
                          if (needsResubmission) {
                            setIsResubmissionMode(true);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {needsResubmission ? (
                              <AlertCircle
                                className={`w-4 h-4 ${isDark ? "text-orange-400" : "text-orange-600"}`}
                              />
                            ) : isUploaded ? (
                              <CheckCircle
                                className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`}
                              />
                            ) : (
                              <Square
                                className={`w-4 h-4 ${isDark ? "text-amber-500" : "text-amber-600"}`}
                              />
                            )}
                            <span
                              className={`text-sm font-inter ${
                                isDark
                                  ? needsResubmission
                                    ? "text-orange-300"
                                    : isUploaded
                                      ? "text-green-300"
                                      : isCurrent
                                        ? "text-blue-300"
                                        : "text-gray-300"
                                  : needsResubmission
                                    ? "text-orange-700"
                                    : isUploaded
                                      ? "text-green-700"
                                      : isCurrent
                                        ? "text-blue-700"
                                        : "text-gray-700"
                              }`}
                            >
                              {label}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              isDark
                                ? needsResubmission
                                  ? "bg-orange-900/30 text-orange-300"
                                  : isUploaded
                                    ? "bg-green-900/30 text-green-300"
                                    : "bg-amber-900/30 text-amber-300"
                                : needsResubmission
                                  ? "bg-orange-100 text-orange-700"
                                  : isUploaded
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {needsResubmission
                              ? "Resubmit"
                              : isUploaded
                                ? "✓ Uploaded"
                                : "Required"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {documentRequirements.missing.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800">
                    <p
                      className={`text-sm font-inter mb-2 ${isDark ? "text-blue-300/80" : "text-blue-700/80"}`}
                    >
                      <span className="font-semibold">Still needed:</span>{" "}
                      {documentRequirements.missing.length} of{" "}
                      {documentRequirements.required.length}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {documentRequirements.missing.map((type, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded text-xs cursor-pointer ${
                            isDark
                              ? "bg-amber-900/40 text-amber-300 hover:bg-amber-900/60"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
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
                    <p
                      className={`text-sm font-inter mb-2 ${isDark ? "text-orange-300/80" : "text-orange-700/80"}`}
                    >
                      <span className="font-semibold">Needs Resubmission:</span>{" "}
                      {documentRequirements.needsResubmission.length}{" "}
                      document(s)
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {documentRequirements.needsResubmission.map(
                        (type, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-xs cursor-pointer ${
                              isDark
                                ? "bg-orange-900/40 text-orange-300 hover:bg-orange-900/60"
                                : "bg-orange-100 text-orange-800 hover:bg-orange-200"
                            }`}
                            onClick={() => {
                              setDocumentType(type);
                              setIsResubmissionMode(true);
                            }}
                          >
                            {getDocumentTypeLabel(type)}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Document Type Selection */}
              <div>
                <h3
                  className={`text-lg font-semibold mb-4 flex items-center gap-2 font-inter ${isDark ? "text-amber-200" : "text-amber-800"}`}
                >
                  <Filter className="w-5 h-5" />
                  Document Type
                </h3>

                {/* Category Tabs */}
                <div className="flex flex-col gap-2 mb-4">
                  {Object.entries(documentOptions.categories).map(
                    ([key, categoryData]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveCategory(key)}
                        className={`py-3 px-4 rounded-xl text-left transition-all duration-300 font-inter ${
                          activeCategory === key
                            ? isDark
                              ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-300 shadow-lg"
                              : "bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300 text-amber-800 shadow-lg"
                            : isDark
                              ? "text-gray-400 hover:text-amber-300 hover:bg-gray-800/50 hover:border-amber-800/30"
                              : "text-gray-600 hover:text-amber-800 hover:bg-amber-50/50 hover:border-amber-200"
                        } border`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {categoryData.icon}
                            <span className="font-medium">
                              {categoryData.label}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-xs ml-6 ${
                            activeCategory === key
                              ? isDark
                                ? "text-amber-800/80"
                                : "text-amber-700/80"
                              : isDark
                                ? "text-gray-500"
                                : "text-gray-500"
                          }`}
                        >
                          {categoryData.documents.length} documents
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Document Type List */}
              <div className="space-y-2">
                {currentCategoryDocs.map((doc) => {
                  const isRequired = documentRequirements.required.includes(
                    doc.value
                  );
                  const isUploaded = documentRequirements.uploaded.includes(
                    doc.value
                  );
                  const isMissing = documentRequirements.missing.includes(
                    doc.value
                  );
                  const needsResubmission =
                    documentRequirements.needsResubmission.includes(doc.value);

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
                      className={`w-full p-3 rounded-xl text-left transition-all duration-300 ${
                        documentType === doc.value
                          ? isDark
                            ? "bg-gradient-to-r from-amber-500/15 to-amber-600/15 border border-amber-500/30"
                            : "bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-300"
                          : isDark
                            ? "hover:bg-gray-800/50 border border-transparent hover:border-amber-800/30"
                            : "hover:bg-amber-50/50 border border-transparent hover:border-amber-200"
                      } border ${needsResubmission ? "ring-1 ring-orange-500/50" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            needsResubmission
                              ? isDark
                                ? "bg-orange-900/30"
                                : "bg-orange-100"
                              : isDark
                                ? "bg-amber-900/30"
                                : "bg-amber-100"
                          }`}
                        >
                          {getDocumentIcon(doc.icon)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <p
                              className={`font-medium font-inter ${
                                documentType === doc.value
                                  ? isDark
                                    ? "text-amber-300"
                                    : "text-amber-800"
                                  : isDark
                                    ? "text-gray-300"
                                    : "text-gray-800"
                              }`}
                            >
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
                                    }}
                                    className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                                      isDark
                                        ? "bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300 hover:from-orange-500/30 hover:to-orange-600/30 hover:text-orange-200 hover:shadow-lg"
                                        : "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 hover:from-orange-200 hover:to-orange-300 hover:text-orange-800 hover:shadow-md"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      <span>Resubmit</span>
                                    </div>
                                  </button>
                                </div>
                              )}
                              {isRequired && !needsResubmission && (
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    isUploaded
                                      ? isDark
                                        ? "bg-green-900/30 text-green-300"
                                        : "bg-green-100 text-green-700"
                                      : isDark
                                        ? "bg-amber-900/30 text-amber-300"
                                        : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {isUploaded ? "✓" : "Required"}
                                </span>
                              )}
                            </div>
                          </div>
                          <p
                            className={`text-xs mt-1 font-inter ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
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
            <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700 min-w-0">
              {/* File Upload Area */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className={`text-lg font-semibold font-inter ${isDark ? "text-amber-200" : "text-amber-800"}`}
                  >
                    {isResubmissionMode
                      ? "Upload Corrected Document"
                      : "Upload Document"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowGuide(true)}
                    className={`p-2 rounded-lg ${isDark ? "hover:bg-amber-900/30 text-amber-300" : "hover:bg-amber-100 text-amber-600"} transition-colors`}
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Restriction Notice */}
                {isUploadDisabled &&
                  documentRequirements.missing.length === 0 &&
                  !isResubmissionMode && (
                    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-start gap-4">
                        <CheckCircle className="w-6 h-6 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="font-bold font-inter text-emerald-700 dark:text-emerald-300">
                            All Documents Submitted!
                          </p>
                          <p className="text-sm font-inter text-emerald-600 dark:text-emerald-400 mt-1">
                            You have submitted all required documents. Your
                            verification is now in progress. Please wait 24-48
                            hours for the verification process to complete.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Selected Document Info */}
                {documentType && (
                  <div
                    className={`mb-6 p-4 rounded-xl ${
                      isDark
                        ? "bg-gradient-to-r from-amber-900/20 to-amber-800/20 border border-amber-800/30"
                        : "bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            needsResubmission || isResubmissionMode
                              ? isDark
                                ? "bg-orange-900/30"
                                : "bg-orange-100"
                              : isDark
                                ? "bg-amber-900/30"
                                : "bg-amber-100"
                          }`}
                        >
                          {getDocumentIcon(
                            documentOptions.allDocuments.find(
                              (d) => d.value === documentType
                            )?.icon || "File"
                          )}
                        </div>
                        <div>
                          <p
                            className={`font-semibold font-inter ${isDark ? "text-amber-200" : "text-amber-800"}`}
                          >
                            {getDocumentTypeLabel(documentType)}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {isResubmissionMode && (
                              <span
                                className={`text-xs font-inter ${isDark ? "text-orange-300/80" : "text-orange-700/80"}`}
                              >
                                <FileWarning className="inline w-3 h-3 mr-1" />
                                Resubmission Required
                              </span>
                            )}
                            <span
                              className={`text-xs font-inter ${isDark ? "text-amber-800/80" : "text-amber-600/80"}`}
                            >
                              {documentRequirements.required.includes(
                                documentType
                              )
                                ? "Required Document"
                                : "Optional Document"}
                            </span>
                            <span
                              className={`w-1 h-1 rounded-full ${isDark ? "bg-amber-600" : "bg-amber-800"}`}
                            />
                            {isAlreadyUploaded ? (
                              <span
                                className={`text-xs font-inter ${isDark ? "text-green-300/80" : "text-green-700/80"}`}
                              >
                                <CheckCircle className="inline w-3 h-3 mr-1" />
                                Already Uploaded
                              </span>
                            ) : (
                              <span
                                className={`text-xs font-inter ${isDark ? "text-amber-800/80" : "text-amber-600/80"}`}
                              >
                                Not Uploaded Yet
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isAlreadyUploaded && uploadedDoc && (
                        <div
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-inter ${statusBadge.bgColor} border ${statusBadge.borderColor}`}
                        >
                          {statusBadge.icon}
                          <span className={statusBadge.textColor}>
                            {statusBadge.text}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Document Status Details */}
                    {isAlreadyUploaded && uploadedDoc && (
                      <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/30">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Status
                            </p>
                            <p
                              className={`text-sm font-medium ${statusBadge.textColor}`}
                            >
                              {uploadedDoc.status?.charAt(0).toUpperCase() +
                                uploadedDoc.status?.slice(1) || "Pending"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Uploaded
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {uploadedDoc.uploaded_at
                                ? new Date(
                                    uploadedDoc.uploaded_at
                                  ).toLocaleDateString()
                                : "Unknown"}
                            </p>
                          </div>
                        </div>
                        {uploadedDoc.review_notes && (
                          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-sm">
                            <p className="text-amber-800 dark:text-amber-300">
                              Notes: {uploadedDoc.review_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show admin feedback for resubmission */}
                    {isResubmissionMode && adminFeedback && (
                      <div
                        className={`mt-4 p-3 rounded-lg ${isDark ? "bg-orange-900/20" : "bg-orange-50"}`}
                      >
                        <div className="flex items-start gap-2">
                          <MessageCircle
                            className={`w-4 h-4 mt-0.5 ${isDark ? "text-orange-400" : "text-orange-600"}`}
                          />
                          <div>
                            <p
                              className={`text-xs font-medium font-inter ${isDark ? "text-orange-300" : "text-orange-700"}`}
                            >
                              Admin Feedback:
                            </p>
                            <p
                              className={`text-xs font-inter ${isDark ? "text-orange-400/80" : "text-orange-700/80"}`}
                            >
                              {adminFeedback}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* File Upload Box */}
                <div
                  onClick={() =>
                    !isLoading &&
                    !(
                      isUploadDisabled &&
                      documentRequirements.missing.length === 0
                    ) &&
                    fileInputRef.current?.click()
                  }
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className={`border-3 border-dashed rounded-2xl p-10 text-center transition-all duration-500 ${
                    isLoading ||
                    (isUploadDisabled &&
                      documentRequirements.missing.length === 0)
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:border-amber-800 hover:shadow-2xl hover:scale-[1.01] cursor-pointer"
                  } ${
                    selectedFile
                      ? isDark
                        ? "border-amber-800 bg-gradient-to-br from-amber-900/10 to-amber-800/10"
                        : "border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100/30"
                      : isDark
                        ? "border-amber-600/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50"
                        : "border-amber-300 bg-gradient-to-br from-gray-50 to-white"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.svg"
                    disabled={
                      isLoading ||
                      (isUploadDisabled &&
                        documentRequirements.missing.length === 0)
                    }
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
                        <p
                          className={`text-xl font-bold font-inter ${isDark ? "text-amber-200" : "text-amber-800"}`}
                        >
                          {selectedFile.name}
                        </p>
                        <div className="flex items-center justify-center gap-4 text-sm font-inter">
                          <span
                            className={
                              isDark ? "text-amber-300/80" : "text-amber-700/80"
                            }
                          >
                            <FileUp className="inline w-4 h-4 mr-1" />
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span
                            className={
                              isDark ? "text-amber-500" : "text-amber-500"
                            }
                          >
                            •
                          </span>
                          <span
                            className={
                              isDark ? "text-amber-300/80" : "text-amber-700/80"
                            }
                          >
                            <FileType className="inline w-4 h-4 mr-1" />
                            {selectedFile.type.split("/")[1].toUpperCase()}
                          </span>
                          <span
                            className={
                              isDark ? "text-amber-500" : "text-amber-500"
                            }
                          >
                            •
                          </span>
                          <span
                            className={
                              isDark ? "text-amber-300/80" : "text-amber-700/80"
                            }
                          >
                            <Calendar className="inline w-4 h-4 mr-1" />
                            {new Date().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          disabled={
                            isLoading ||
                            (isUploadDisabled &&
                              documentRequirements.missing.length === 0)
                          }
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all duration-300"
                        >
                          <FileMinus className="inline w-4 h-4 mr-2" />
                          Remove File
                        </button>
                        {previewUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPreview(!showPreview);
                            }}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all duration-300"
                          >
                            {showPreview ? (
                              <>
                                <EyeOff className="inline w-4 h-4 mr-2" />
                                Hide Preview
                              </>
                            ) : (
                              <>
                                <Eye className="inline w-4 h-4 mr-2" />
                                Show Preview
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center shadow-lg">
                        <UploadCloud
                          className={`w-16 h-16 ${isDark ? "text-amber-800" : "text-amber-600"}`}
                        />
                      </div>
                      <div>
                        <p
                          className={`text-lg font-semibold font-inter mb-2 ${isDark ? "text-amber-200" : "text-amber-800"}`}
                        >
                          Drag & drop your file here
                        </p>
                        <p
                          className={`text-sm font-inter ${isDark ? "text-amber-300/80" : "text-amber-700/80"}`}
                        >
                          or click to browse files
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs">
                          <span
                            className={`px-2 py-1 rounded-full ${isDark ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700"}`}
                          >
                            PDF
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full ${isDark ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700"}`}
                          >
                            JPG/JPEG
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full ${isDark ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700"}`}
                          >
                            PNG
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full ${isDark ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700"}`}
                          >
                            WebP
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full ${isDark ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700"}`}
                          >
                            Max 10MB
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Validation Error */}
                {validationError && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <p className="text-sm font-inter text-red-700 dark:text-red-300">
                        {validationError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload Status */}
                {uploadStatus && (
                  <div
                    className={`mt-4 p-4 rounded-xl border ${
                      uploadStatus.type === "success"
                        ? isDark
                          ? "bg-gradient-to-r from-emerald-900/20 to-green-900/20 border-emerald-800/30"
                          : "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200"
                        : uploadStatus.type === "error"
                          ? isDark
                            ? "bg-gradient-to-r from-red-900/20 to-rose-900/20 border-red-800/30"
                            : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
                          : isDark
                            ? "bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-800/30"
                            : "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {uploadStatus.type === "success" ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : uploadStatus.type === "error" ? (
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <Loader className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                      )}
                      <p
                        className={`text-sm font-inter ${
                          uploadStatus.type === "success"
                            ? "text-emerald-700 dark:text-emerald-300"
                            : uploadStatus.type === "error"
                              ? "text-red-700 dark:text-red-300"
                              : "text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {uploadStatus.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {uploadProgressState > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span
                        className={`text-xs font-inter ${isDark ? "text-amber-300" : "text-amber-700"}`}
                      >
                        Uploading...
                      </span>
                      <span
                        className={`text-xs font-inter ${isDark ? "text-amber-300" : "text-amber-700"}`}
                      >
                        {uploadProgressState}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 transition-all duration-300"
                        style={{ width: `${uploadProgressState}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    (isUploadDisabled &&
                      documentRequirements.missing.length === 0) ||
                    !selectedFile ||
                    !documentType
                  }
                  className={`w-full py-4 px-6 rounded-2xl font-bold font-inter text-lg transition-all duration-500 ${
                    isLoading ||
                    (isUploadDisabled &&
                      documentRequirements.missing.length === 0) ||
                    !selectedFile ||
                    !documentType
                      ? isDark
                        ? "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500 cursor-not-allowed"
                      : isResubmissionMode || needsResubmission
                        ? "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        : "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:via-amber-700 hover:to-amber-800 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" />
                      <span>{getUploadButtonText()}</span>
                    </div>
                  )}
                </button>
                <p
                  className={`text-center mt-3 text-xs font-inter ${isDark ? "text-amber-300/60" : "text-amber-700/60"}`}
                >
                  {isResubmissionMode
                    ? "Resubmitted documents will be reviewed within 24-48 hours"
                    : documentRequirements.required.includes(documentType)
                      ? "Required documents are verified first"
                      : "Optional documents can be uploaded later"}
                </p>
              </div>
            </div>

            {/* Right Column - Uploaded Documents */}
            <div className="w-96 p-6 space-y-6 overflow-y-auto flex-shrink-0">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className={`text-lg font-semibold font-inter ${isDark ? "text-amber-200" : "text-amber-800"}`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5" />
                      Your Documents
                    </div>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchExistingDocuments}
                      disabled={isCheckingDocuments}
                      className={`p-2 rounded-lg ${isDark ? "hover:bg-amber-900/30 text-amber-300" : "hover:bg-amber-100 text-amber-600"} transition-colors`}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isCheckingDocuments ? "animate-spin" : ""}`}
                      />
                    </button>
                    <div className="relative">
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? "text-amber-300/60" : "text-amber-600/60"}`}
                      />
                      <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`pl-10 pr-4 py-2 text-sm rounded-lg border ${isDark ? "bg-gray-800/50 border-amber-800/30 text-amber-200 placeholder-amber-300/40" : "bg-white border-amber-200 text-amber-800 placeholder-amber-600/40"}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Document Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div
                    className={`p-3 rounded-xl border ${isDark ? "bg-gradient-to-r from-emerald-900/20 to-green-900/20 border-emerald-800/30" : "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200"}`}
                  >
                    <p
                      className={`text-xs font-inter ${isDark ? "text-emerald-300/80" : "text-emerald-700/80"}`}
                    >
                      Uploaded
                    </p>
                    <p
                      className={`text-xl font-bold font-inter ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                    >
                      {documentStats.uploaded}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl border ${isDark ? "bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-800/30" : "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200"}`}
                  >
                    <p
                      className={`text-xs font-inter ${isDark ? "text-blue-300/80" : "text-blue-700/80"}`}
                    >
                      Required
                    </p>
                    <p
                      className={`text-xl font-bold font-inter ${isDark ? "text-blue-300" : "text-blue-700"}`}
                    >
                      {documentRequirements.required.length}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl border ${isDark ? "bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-800/30" : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"}`}
                  >
                    <p
                      className={`text-xs font-inter ${isDark ? "text-amber-300/80" : "text-amber-700/80"}`}
                    >
                      Pending
                    </p>
                    <p
                      className={`text-xl font-bold font-inter ${isDark ? "text-amber-300" : "text-amber-700"}`}
                    >
                      {documentStats.pending}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl border ${isDark ? "bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-800/30" : "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200"}`}
                  >
                    <p
                      className={`text-xs font-inter ${isDark ? "text-orange-300/80" : "text-orange-700/80"}`}
                    >
                      Need Resubmit
                    </p>
                    <p
                      className={`text-xl font-bold font-inter ${isDark ? "text-orange-300" : "text-orange-700"}`}
                    >
                      {documentStats.needs_resubmission}
                    </p>
                  </div>
                </div>

                {/* Document Status Tabs */}
                <div className="flex gap-2 mb-4">
                  {[
                    { id: "all", label: "All" },
                    { id: "uploaded", label: "Uploaded" },
                    { id: "pending", label: "Pending" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-inter transition-all ${
                        activeFilter === tab.id
                          ? isDark
                            ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300"
                            : "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800"
                          : isDark
                            ? "text-gray-400 hover:text-amber-300"
                            : "text-gray-600 hover:text-amber-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Documents List */}
                <div
                  ref={documentListRef}
                  className="space-y-3 max-h-[400px] overflow-y-auto pr-2"
                >
                  {isCheckingDocuments ? (
                    <div className="flex justify-center py-8">
                      <Loader className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="ml-2 text-amber-600">
                        Loading documents...
                      </span>
                    </div>
                  ) : existingDocuments.length === 0 ? (
                    <div
                      className={`text-center py-8 rounded-xl ${isDark ? "bg-gray-800/30" : "bg-amber-50/50"}`}
                    >
                      <FileQuestion
                        className={`mx-auto w-12 h-12 mb-3 ${isDark ? "text-amber-800" : "text-amber-400"}`}
                      />
                      <p
                        className={`font-inter ${isDark ? "text-amber-300/80" : "text-amber-700/80"}`}
                      >
                        No documents uploaded yet
                      </p>
                      <p
                        className={`text-xs mt-1 ${isDark ? "text-amber-400/60" : "text-amber-600/60"}`}
                      >
                        Upload your required documents to begin verification
                      </p>
                    </div>
                  ) : (
                    existingDocuments
                      .map((doc, index) => {
                        // Skip documents without type
                        if (!doc.type) {
                          console.warn("Skipping document without type:", doc);
                          return null;
                        }

                        const statusBadge = getStatusBadge(
                          doc.status || "pending"
                        );
                        const docLabel =
                          doc.document_label || getDocumentTypeLabel(doc.type);
                        const isCurrentDocument = documentType === doc.type;

                        return (
                          <div
                            key={doc.id || index}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              isCurrentDocument
                                ? isDark
                                  ? "bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-500/30"
                                  : "bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-300"
                                : isDark
                                  ? "border-amber-800/30 hover:bg-gray-800/50"
                                  : "border-amber-200 hover:bg-amber-50/50"
                            }`}
                            onClick={() => {
                              setDocumentType(doc.type);
                              if (doc.status === "needs_resubmission") {
                                setIsResubmissionMode(true);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div
                                  className={`p-2 rounded-lg ${isDark ? "bg-amber-900/30" : "bg-amber-100"}`}
                                >
                                  {getDocumentIcon(
                                    documentOptions.allDocuments.find(
                                      (d) => d.value === doc.type
                                    )?.icon || "File"
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p
                                    className={`font-medium font-inter ${isDark ? "text-amber-200" : "text-amber-800"}`}
                                  >
                                    {docLabel}
                                  </p>
                                  <p
                                    className={`text-xs mt-1 ${isDark ? "text-amber-300/60" : "text-amber-600/60"}`}
                                  >
                                    {doc.filename || "No filename"}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full font-inter ${statusBadge.bgColor} border ${statusBadge.borderColor}`}
                                    >
                                      <span className="flex items-center gap-1">
                                        {statusBadge.icon}
                                        <span className={statusBadge.textColor}>
                                          {statusBadge.text}
                                        </span>
                                      </span>
                                    </span>
                                    {doc.uploaded_at && (
                                      <span
                                        className={`text-xs ${isDark ? "text-amber-300/60" : "text-amber-600/60"}`}
                                      >
                                        {new Date(
                                          doc.uploaded_at
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isCurrentDocument && (
                                <div className="flex-shrink-0 ml-2">
                                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 animate-pulse" />
                                </div>
                              )}
                            </div>

                            {/* Show additional document info */}
                            {(doc.rejection_reason || doc.review_notes) && (
                              <div
                                className={`mt-3 p-2 rounded-lg text-xs ${
                                  doc.rejection_reason
                                    ? isDark
                                      ? "bg-red-900/20 text-red-300"
                                      : "bg-red-50 text-red-700"
                                    : isDark
                                      ? "bg-blue-900/20 text-blue-300"
                                      : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {doc.rejection_reason && (
                                  <>
                                    <p className="font-medium">
                                      Rejection Reason:
                                    </p>
                                    <p>{doc.rejection_reason}</p>
                                  </>
                                )}
                                {doc.review_notes && !doc.rejection_reason && (
                                  <>
                                    <p className="font-medium">Notes:</p>
                                    <p>{doc.review_notes}</p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                      .filter(Boolean) // Remove null entries
                  )}
                </div>
              </div>

              {/* Completion Progress */}
              {documentRequirements.required.length > 0 && (
                <div
                  className={`p-4 rounded-xl border ${
                    isDark
                      ? "bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-800/30"
                      : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className={`text-sm font-inter font-medium ${isDark ? "text-blue-300" : "text-blue-700"}`}
                    >
                      Verification Progress
                    </p>
                    <span
                      className={`text-sm font-bold font-inter ${isDark ? "text-blue-300" : "text-blue-700"}`}
                    >
                      {Math.round(
                        (documentRequirements.uploaded.length /
                          documentRequirements.required.length) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                      style={{
                        width: `${
                          (documentRequirements.uploaded.length /
                            documentRequirements.required.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <p
                    className={`text-xs mt-2 font-inter ${isDark ? "text-blue-300/80" : "text-blue-700/80"}`}
                  >
                    {documentRequirements.missing.length === 0
                      ? "All required documents submitted!"
                      : `${documentRequirements.missing.length} more document(s) needed`}
                  </p>
                </div>
              )}

              {/* Status Legend */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark
                    ? "bg-gradient-to-r from-gray-800/30 to-gray-900/30 border-gray-700"
                    : "bg-gradient-to-r from-gray-50 to-gray-100/50 border-gray-200"
                }`}
              >
                <p
                  className={`text-sm font-inter font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Status Legend
                </p>
                <div className="space-y-2">
                  {[
                    {
                      status: "approved",
                      label: "Verified/Approved",
                      color: "emerald",
                    },
                    {
                      status: "pending",
                      label: "Under Review",
                      color: "amber",
                    },
                    {
                      status: "needs_resubmission",
                      label: "Resubmission Required",
                      color: "orange",
                    },
                    { status: "rejected", label: "Rejected", color: "red" },
                  ].map((item) => {
                    const badge = getStatusBadge(item.status);
                    return (
                      <div
                        key={item.status}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${badge.badgeColor}`}
                          />
                          <span
                            className={`text-xs font-inter ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {item.label}
                          </span>
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full font-inter ${badge.bgColor} border ${badge.borderColor}`}
                        >
                          <span className={`${badge.textColor}`}>
                            {badge.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div
          className={`p-6 border-t ${isDark ? "border-amber-800/30 bg-gradient-to-r from-amber-900/10 via-amber-800/10 to-amber-900/10" : "border-amber-200 bg-gradient-to-r from-amber-50/80 via-amber-100/50 to-amber-50/80"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield
                  className={`w-4 h-4 ${isDark ? "text-amber-800" : "text-amber-600"}`}
                />
                <span
                  className={`text-xs font-inter ${isDark ? "text-amber-300/80" : "text-amber-700/80"}`}
                >
                  SSL Encrypted
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock
                  className={`w-4 h-4 ${isDark ? "text-amber-800" : "text-amber-600"}`}
                />
                <span
                  className={`text-xs font-inter ${isDark ? "text-amber-300/80" : "text-amber-700/80"}`}
                >
                  Secure Upload
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-4 h-4 ${isDark ? "text-amber-800" : "text-amber-600"}`}
                />
                <span
                  className={`text-xs font-inter ${isDark ? "text-amber-300/80" : "text-amber-700/80"}`}
                >
                  24-48h Review
                </span>
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg font-inter text-sm transition-all ${
                  isDark
                    ? "text-amber-300 hover:text-amber-200 hover:bg-amber-900/30"
                    : "text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                }`}
                disabled={isLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
