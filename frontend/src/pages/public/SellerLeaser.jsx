import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { apiCall } from "../../utils/api.endpoints";
import ThemeToggle from "../../components/ThemeToggle";
import NotificationToggle from "../../components/NotificationToggle";
import Loader from "../../components/Loader";
import Footer from "../../components/Footer";
import FloatingElements from "../../components/FloatingElements";
import ProfileAvatar from "../../components/ProfileAvatar";
import ProfileSetupModal from "../../components/ProfileSetupModal";
import DocumentUploadModal from "../../components/DocumentUploadModal";
import BrokerProfileModal from "../../components/BrokerProfileModal";
import BrokerChatToggle from "../../components/BrokerChatToggle";
import BrokerChatWindow from "../../components/BrokerChatWindow";
import ScheduleViewingModal from "../../components/ScheduleViewingModal";
import HeroTypingText from "../../components/HeroTypingText";
import AnnouncementBanner from "../../components/AnnouncementBanner";

// Import your step components
import Step1PropertyDetails from "../../components/seller-leaser/Step1PropertyDetails";
import Step2ChooseBroker from "../../components/seller-leaser/Step2ChooseBroker";

import { toast } from "react-hot-toast";
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Home,
  Users,
  FileText,
  Calendar,
  MapPin,
  DollarSign,
  ShieldCheck,
  Megaphone,
  Wrench,
  Star,
  Phone,
  Mail,
  Award,
  Clock,
  Eye,
  MessageCircle,
  X,
  Upload,
  Camera,
  Search,
  Filter,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Loader as LoaderIcon,
  Lock,
  TrendingUp,
  Shield,
  Sparkles,
  FileCheck,
  Handshake,
  Check,
  HelpCircle,
  Plus,
  Zap,
  Globe,
  Languages,
  Briefcase,
  Key,
  CheckCircle as CheckCircle2,
  FileEdit,
  UserCheck,
} from "lucide-react";

const SellerLeaser = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // State Management
  const [activeStep, setActiveStep] = useState(1);
  const [userType, setUserType] = useState("seller");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [hasSubmittedDocuments, setHasSubmittedDocuments] = useState(false);
  const [resubmissionDocument, setResubmissionDocument] = useState(null);
  const [canChangeUserType, setCanChangeUserType] = useState(true);
  const [propertyImages, setPropertyImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [assignedBroker, setAssignedBroker] = useState(null);
  const [chatWindowOpen, setChatWindowOpen] = useState(false);
  const [selectedBrokerForChat, setSelectedBrokerForChat] = useState(null);

  // Modal states
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [showScheduleViewingModal, setShowScheduleViewingModal] =
    useState(false);
  const [showVerificationRestriction, setShowVerificationRestriction] =
    useState(false);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [selectedBrokerForModal, setSelectedBrokerForModal] = useState(null);

  // Data States
  const [brokers, setBrokers] = useState([]);

  // Interactive state
  const [activeInfoCard, setActiveInfoCard] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scrolledProgress, setScrolledProgress] = useState(0);
  const [isVerificationInProgress, setIsVerificationInProgress] =
    useState(false);
  const [userDocuments, setUserDocuments] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [lastVerificationCheck, setLastVerificationCheck] = useState(null);

  // Step 2 specific state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [filteredBrokers, setFilteredBrokers] = useState([]);

  // Property Request State
  const [propertyRequest, setPropertyRequest] = useState({
    id: null,
    status: "draft",
    currentStep: 1,
    propertyData: {},
    brokerId: null,
    brokerName: null,
    verificationDate: null,
    inspectionStatus: "pending",
    inspectionReport: null,
    listingProposal: null,
    adminApproval: null,
    contractDetails: null,
    paymentStatus: null,
  });

  // Form Data
  const [formData, setFormData] = useState({
    request_id: null,
    property_type: "",
    location: "",
    price: "",
    price_currency: "ETB",
    verification_method: "physical",
    description: "",
    property_images: [],
    user_type: "seller",
    beds: "",
    baths: "",
    sqft: "",
    year_built: "",
    amenities: [],
    features: [],
  });

  const [formErrors, setFormErrors] = useState({});

  // Refs
  const progressSectionRef = useRef(null);
  const isInitializedRef = useRef(false);

  // ========== NEW: Track completed steps with localStorage persistence ==========
  const [completedSteps, setCompletedSteps] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
  });

  // Load completed steps from localStorage on component mount
  useEffect(() => {
    const loadCompletedSteps = () => {
      const savedSteps = localStorage.getItem("sellerLeaser_completed_steps");
      if (savedSteps) {
        try {
          const parsedSteps = JSON.parse(savedSteps);
          setCompletedSteps(parsedSteps);
          console.log("📋 Loaded saved steps from localStorage:", parsedSteps);

          // Determine which step to show based on completion
          const lastCompletedStep = Math.max(
            ...Object.keys(parsedSteps)
              .filter((key) => parsedSteps[key])
              .map((key) => parseInt(key)),
            0
          );

          if (lastCompletedStep > 0) {
            setActiveStep(lastCompletedStep + 1); // Show next step after last completed
          }
        } catch (error) {
          console.error("Error loading completed steps:", error);
        }
      }
    };

    loadCompletedSteps();
  }, []);

  // ========== HELPER FUNCTIONS ==========

  const getVerificationStepTitle = () => {
    if (!verificationStatus) {
      return hasSubmittedDocuments
        ? "Verification in Progress"
        : "Verify Identity";
    }

    switch (verificationStatus.status) {
      case "verified":
        return "Verified";
      case "needs_resubmission":
        return "Resubmission Required";
      case "reviewing":
        return "Under Review";
      case "submitted":
        return "Submitted";
      case "rejected":
        return "Verification Rejected";
      default:
        return "Verify Identity";
    }
  };

  const getVerificationStepDescription = () => {
    if (!verificationStatus) {
      return hasSubmittedDocuments
        ? isVerificationInProgress
          ? "Documents under review - Please wait"
          : "Documents submitted - Under review"
        : "Upload required documents";
    }

    switch (verificationStatus.status) {
      case "verified":
        return "Identity verified successfully";
      case "needs_resubmission":
        return verificationStatus.feedback || "Please resubmit documents";
      case "reviewing":
        return "Your documents are being reviewed";
      case "submitted":
        return "Documents submitted - awaiting review";
      case "rejected":
        return verificationStatus.feedback || "Verification was not approved";
      default:
        return "Upload required documents";
    }
  };

  const getVerificationStepColor = () => {
    if (!verificationStatus) {
      return hasSubmittedDocuments
        ? "from-amber-800 to-amber-500"
        : "from-amber-800 to-amber-500";
    }

    switch (verificationStatus.status) {
      case "verified":
        return "from-green-500 to-green-600";
      case "needs_resubmission":
        return "from-amber-500 to-amber-600";
      case "reviewing":
        return "from-blue-500 to-blue-600";
      case "submitted":
        return "from-purple-500 to-purple-600";
      case "rejected":
        return "from-red-500 to-red-600";
      default:
        return "from-amber-800 to-amber-500";
    }
  };

  const getVerificationStepIconColor = () => {
    if (!verificationStatus) {
      return hasSubmittedDocuments ? "text-amber-400" : "text-amber-500";
    }

    switch (verificationStatus.status) {
      case "verified":
        return "text-green-500";
      case "needs_resubmission":
        return "text-amber-500";
      case "reviewing":
        return "text-blue-500";
      case "submitted":
        return "text-purple-500";
      case "rejected":
        return "text-red-500";
      default:
        return "text-amber-500";
    }
  };

  // ========== VERIFICATION FUNCTIONS ==========

  const checkVerificationStatus = useCallback(
    async (forceCheck = false) => {
      if (!user?.id) return null;

      try {
        const now = Date.now();
        const lastCheck = lastVerificationCheck || 0;
        const timeSinceLastCheck = now - lastCheck;

        if (!forceCheck && timeSinceLastCheck < 10000) {
          return verificationStatus;
        }

        if (verificationStatus?.status === "verified") {
          return verificationStatus;
        }

        const response = await apiCall(
          "GET_VERIFICATION_STATUS",
          {},
          { method: "GET" },
        );

        if (!response) {
          console.log("❌ Verification status check returned no response");
          return verificationStatus;
        }

        if (!response.success) {
          console.log("❌ Verification status check failed:", response.message);
          return verificationStatus;
        }

        const { user: userData, documents, verificationStep } = response;

        if (!userData) {
          console.log("❌ No user data in verification response");
          return verificationStatus;
        }

        const updatedUser = {
          ...user,
          verification_status:
            userData.verification_status ||
            userData.verificationStepStatus ||
            null,
          verification_step_status:
            userData.verification_step_status ||
            userData.verificationStepStatus ||
            "not_started",
          verification_feedback: userData.verification_feedback || null,
          documents_need_resubmission:
            userData.documents_need_resubmission || false,
          has_submitted_documents: userData.has_submitted_documents || false,
          documents_submitted_at: userData.documents_submitted_at || null,
          last_verification_review_at:
            userData.last_verification_review_at || null,
        };

        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        if (documents && Array.isArray(documents)) {
          setUserDocuments(documents);
          localStorage.setItem(
            `user_documents_${user.id}`,
            JSON.stringify(documents),
          );
        }

        const hasSubmitted =
          userData.verification_status === "pending" ||
          userData.verification_status === "submitted" ||
          userData.verification_status === "reviewing" ||
          userData.has_submitted_documents === true;

        const isPending =
          userData.verification_step_status === "pending" ||
          userData.verification_step_status === "submitted" ||
          userData.verification_step_status === "reviewing" ||
          userData.verification_step_status === "needs_resubmission";

        setHasSubmittedDocuments(hasSubmitted);
        setIsVerificationInProgress(isPending);

        const isStep2Completed =
          userData.verification_step_status === "verified";
        if (isStep2Completed !== completedSteps[2]) {
          setCompletedSteps((prev) => {
            const updated = { ...prev, 2: isStep2Completed };
            localStorage.setItem("sellerLeaser_completed_steps", JSON.stringify(updated));
            return updated;
          });
        }

        const statusData = {
          status: userData.verification_step_status || "not_started",
          feedback: userData.verification_feedback || null,
          needsResubmission: userData.documents_need_resubmission || false,
          lastReviewed: userData.last_verification_review_at || null,
          stepInfo: verificationStep,
          hasSubmitted: hasSubmitted,
          isInProgress: isPending,
          lastChecked: now,
        };

        setVerificationStatus(statusData);
        setLastVerificationCheck(now);

        localStorage.setItem(
          `verification_status_${user.id}`,
          JSON.stringify(statusData),
        );

        const previousStatus = verificationStatus?.status;
        if (
          previousStatus &&
          previousStatus !== userData.verification_step_status
        ) {
          handleVerificationStatusChange(
            previousStatus,
            userData.verification_step_status,
            userData.verification_feedback,
          );
        }

        return statusData;
      } catch (error) {
        console.error("Error checking verification status:", error);

        if (verificationStatus) {
          return verificationStatus;
        }

        return {
          status: "not_started",
          feedback: null,
          needsResubmission: false,
          lastReviewed: null,
          hasSubmitted: false,
          isInProgress: false,
          lastChecked: Date.now(),
        };
      }
    },
    [user, verificationStatus, lastVerificationCheck, completedSteps],
  );

  // Enhanced validateAndUpdateSteps with localStorage persistence
  const validateAndUpdateSteps = useCallback(async () => {
    if (!user) return;

    console.log("🔍 Validating and updating steps...");

    // First, load saved steps from localStorage
    const savedCompletedSteps = localStorage.getItem("sellerLeaser_completed_steps");
    let updatedSteps = { ...completedSteps };

    if (savedCompletedSteps) {
      try {
        const parsedSteps = JSON.parse(savedCompletedSteps);
        updatedSteps = { ...updatedSteps, ...parsedSteps };
        console.log("📋 Loaded saved steps from localStorage:", parsedSteps);
      } catch (error) {
        console.error("❌ Error loading saved steps:", error);
      }
    }

    // Step 1: Check if property request exists
    if (formData.request_id || propertyRequest.id) {
      updatedSteps[1] = true;
      console.log("✅ Step 1 marked complete (property request exists)");
    }

    // Step 2: Check if broker is selected
    if (propertyRequest.brokerId || selectedBroker) {
      updatedSteps[2] = true;
      console.log("✅ Step 2 marked complete (broker selected)");
    }

    // Step 3: Check if inspection is scheduled
    if (propertyRequest.verificationDate) {
      updatedSteps[3] = true;
      console.log("✅ Step 3 marked complete (inspection scheduled)");
    }

    // Step 4: Check if inspection is completed
    if (propertyRequest.inspectionStatus === "completed") {
      updatedSteps[4] = true;
      console.log("✅ Step 4 marked complete (inspection completed)");
    }

    // Step 5: Check if listing proposal exists
    if (propertyRequest.listingProposal) {
      updatedSteps[5] = true;
      console.log("✅ Step 5 marked complete (listing proposal exists)");
    }

    // Step 6: Check if admin approval is received
    if (propertyRequest.adminApproval === "approved") {
      updatedSteps[6] = true;
      console.log("✅ Step 6 marked complete (admin approved)");
    }

    // Step 7: Check if contract is finalized
    if (propertyRequest.contractDetails) {
      updatedSteps[7] = true;
      console.log("✅ Step 7 marked complete (contract finalized)");
    }

    // Update state and save to localStorage
    setCompletedSteps(updatedSteps);
    localStorage.setItem("sellerLeaser_completed_steps", JSON.stringify(updatedSteps));

    console.log("✅ Step validation complete:", updatedSteps);
  }, [user, formData, propertyRequest, selectedBroker, completedSteps]);

  const handleVerificationStatusChange = (oldStatus, newStatus, feedback) => {
    switch (newStatus) {
      case "verified":
        toast.success(
          "🎉 Verification Complete! Your identity has been verified successfully.",
          {
            duration: 5000,
            icon: "✅",
          },
        );
        break;

      case "needs_resubmission":
        toast.error(`🔄 Verification Needs Resubmission`, {
          duration: 6000,
          description:
            feedback || "Please resubmit your documents with corrections",
          icon: "📄",
        });
        break;

      case "rejected":
        toast.error("❌ Verification Rejected", {
          duration: 6000,
          description:
            feedback || "Please contact support for more information",
          icon: "❌",
        });
        break;

      case "reviewing":
        toast("🔍 Your documents are now being reviewed by our team", {
          duration: 4000,
          icon: "👀",
        });
        break;
    }
  };

  // ========== STEP DEFINITIONS ==========

  const getStepConfig = useCallback(() => {
    const steps = {
      seller: [
        {
          number: 1,
          title: "Property Details",
          description: "Tell us about your property",
          icon: Home,
        },
        {
          number: 2,
          title: "Choose Broker",
          description: "Select your preferred broker",
          icon: Users,
        },
        {
          number: 3,
          title: "Schedule Inspection",
          description: "Book property verification",
          icon: Calendar,
        },
        {
          number: 4,
          title: "Property Inspection",
          description: "Broker verification process",
          icon: ShieldCheck,
        },
        {
          number: 5,
          title: "Listing Proposal",
          description: "Review listing details",
          icon: FileText,
        },
        {
          number: 6,
          title: "Admin Approval",
          description: "Final listing approval",
          icon: CheckCircle,
        },
        {
          number: 7,
          title: "Contract & Payment",
          description: "Finalize transaction",
          icon: Handshake,
        },
      ],
      leaser: [
        {
          number: 1,
          title: "Property Details",
          description: "Tell us about your rental",
          icon: Home,
        },
        {
          number: 2,
          title: "Choose Broker",
          description: "Select rental specialist",
          icon: Users,
        },
        {
          number: 3,
          title: "Schedule Inspection",
          description: "Book property verification",
          icon: Calendar,
        },
        {
          number: 4,
          title: "Property Inspection",
          description: "Broker verification process",
          icon: ShieldCheck,
        },
        {
          number: 5,
          title: "Listing Proposal",
          description: "Review listing details",
          icon: FileText,
        },
        {
          number: 6,
          title: "Admin Approval",
          description: "Final listing approval",
          icon: CheckCircle,
        },
        {
          number: 7,
          title: "Lease Agreement",
          description: "Sign rental contract",
          icon: Handshake,
        },
      ],
    };

    const currentUserSteps = steps[userType];

    return currentUserSteps.map((step) => {
      const stepNumber = step.number;
      const completed = completedSteps[stepNumber] || false;
      let description = step.description;

      // Update description based on completion status
      if (completed) {
        switch (stepNumber) {
          case 1:
            description = "Property details submitted";
            break;
          case 2:
            description = propertyRequest.brokerName
              ? `Broker selected: ${propertyRequest.brokerName}`
              : "Broker selected";
            break;
          case 3:
            description = propertyRequest.verificationDate
              ? `Inspection scheduled for ${new Date(propertyRequest.verificationDate).toLocaleDateString()}`
              : "Inspection scheduled";
            break;
          case 4:
            description = "Inspection completed";
            break;
          case 5:
            description = "Listing proposal ready";
            break;
          case 6:
            description = "Listing approved by admin";
            break;
          case 7:
            description = "Transaction completed";
            break;
        }
      }

      return {
        number: stepNumber,
        title: step.title,
        description: description,
        icon: step.icon,
        completed: completed,
        color: completed
          ? "from-green-500 to-green-600"
          : "from-amber-800 to-amber-500",
        iconColor: completed ? "text-green-500" : "text-amber-500",
      };
    });
  }, [userType, completedSteps, propertyRequest]);

  const currentSteps = getStepConfig();

  // ========== NEW: Sequential step navigation like SellerLeaser ==========
  const handleStepClick = useCallback(
    async (stepNumber) => {
      // Only allow clicking on completed steps or the next step after last completed
      const lastCompletedStep = Math.max(
        ...Object.keys(completedSteps)
          .filter((key) => completedSteps[key])
          .map((key) => parseInt(key)),
        0
      );

      if (stepNumber <= lastCompletedStep + 1) {
        setActiveStep(stepNumber);
      } else {
        toast.error(`Please complete step ${lastCompletedStep + 1} first`);
      }
    },
    [completedSteps],
  );

  // Filter and sort brokers effect
  useEffect(() => {
    let result = [...brokers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (broker) =>
          broker.name?.toLowerCase().includes(query) ||
          broker.brokerage_firm?.toLowerCase().includes(query) ||
          broker.specialization?.some((spec) =>
            spec.toLowerCase().includes(query),
          ),
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "rating":
        result.sort(
          (a, b) => (b.average_rating || 0) - (a.average_rating || 0),
        );
        break;
      case "experience":
        result.sort(
          (a, b) => (b.experience_years || 0) - (a.experience_years || 0),
        );
        break;
      case "deals":
        result.sort(
          (a, b) =>
            (b.total_completed_deals || 0) - (a.total_completed_deals || 0),
        );
        break;
      case "commission":
        const getCommissionValue = (rate) =>
          parseFloat(rate?.replace("%", "")) || 0;
        result.sort(
          (a, b) =>
            getCommissionValue(a.commission_rate) -
            getCommissionValue(b.commission_rate),
        );
        break;
      default:
        result.sort(
          (a, b) => (b.average_rating || 0) - (a.average_rating || 0),
        );
    }

    setFilteredBrokers(result);
  }, [brokers, searchQuery, sortBy]);

  // ========== EFFECTS ==========

  useEffect(() => {
    if (verificationStatus?.status === "verified" || completedSteps[2]) {
      setCanChangeUserType(false);
    }
  }, [verificationStatus?.status, completedSteps[2]]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resubmit = urlParams.get("resubmit");
    const docType = urlParams.get("documentType");

    if (resubmit === "true" && docType) {
      setResubmissionDocument(docType);
      setActiveStep(2);
      setShowDocumentUpload(true);

      toast(`Please resubmit your ${docType}`, {
        duration: 5000,
        icon: "📄",
      });
    }
  }, []);

  useEffect(() => {
    let intervalId;

    if (user && isVerificationInProgress) {
      checkVerificationStatus();

      intervalId = setInterval(() => {
        checkVerificationStatus();
      }, 30000);

      const handleFocus = () => {
        checkVerificationStatus();
      };

      window.addEventListener("focus", handleFocus);

      return () => {
        if (intervalId) clearInterval(intervalId);
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [user, isVerificationInProgress, checkVerificationStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveInfoCard((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (progressSectionRef.current) {
        const section = progressSectionRef.current;
        const rect = section.getBoundingClientRect();
        const viewHeight = Math.max(
          document.documentElement.clientHeight,
          window.innerHeight,
        );

        if (rect.top <= viewHeight && rect.bottom >= 0) {
          const progress = 1 - rect.bottom / (viewHeight + rect.height);
          setScrolledProgress(progress);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Initialize
  useEffect(() => {
    const initializeDashboard = async () => {
      if (isInitializedRef.current) return;

      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const userData = JSON.parse(localStorage.getItem("user") || "{}");

        console.log("🚀 Initializing seller/leaser dashboard...", {
          hasToken: !!token,
          userId: userData?.id,
          userName: userData?.first_name || userData?.username,
        });

        if (!token || !userData.id) {
          console.log("❌ No token or user data, redirecting to login");
          navigate("/login-register", {
            state: {
              returnUrl: "/seller-leaser",
              message: "Please login to list your property",
            },
          });
          return;
        }

        setUser(userData);

        // Set user type based on role
        if (userData.role === "seller" || userData.role === "landlord") {
          const typeFromRole = userData.role === "seller" ? "seller" : "leaser";
          setUserType(typeFromRole);
          setFormData((prev) => ({ ...prev, user_type: typeFromRole }));
          console.log(`👤 User type set to: ${typeFromRole}`);
        }

        // Load saved steps from localStorage
        const savedCompletedSteps = localStorage.getItem("sellerLeaser_completed_steps");
        if (savedCompletedSteps) {
          try {
            const parsedSteps = JSON.parse(savedCompletedSteps);
            setCompletedSteps(parsedSteps);
            console.log(
              "📋 Loaded saved steps from localStorage:",
              parsedSteps,
            );
          } catch (error) {
            console.error("❌ Error loading completed steps:", error);
          }
        }

        // Load cached data
        const cachedDocs = localStorage.getItem(
          `user_documents_${userData.id}`,
        );
        const cachedBrokers = localStorage.getItem("cached_brokers");
        const cachedVerification = localStorage.getItem(
          `verification_status_${userData.id}`,
        );
        const cachedPropertyRequest = localStorage.getItem(
          `property_request_${userData.id}`,
        );

        if (cachedDocs) {
          try {
            const docs = JSON.parse(cachedDocs);
            if (Array.isArray(docs)) {
              setUserDocuments(docs);
              console.log("📄 Loaded cached documents:", docs.length);
            }
          } catch (e) {
            console.error("❌ Error parsing cached documents:", e);
          }
        }

        if (cachedVerification) {
          try {
            const verificationData = JSON.parse(cachedVerification);
            if (verificationData && typeof verificationData === "object") {
              setVerificationStatus(verificationData);
              setHasSubmittedDocuments(verificationData.hasSubmitted || false);
              setIsVerificationInProgress(
                verificationData.isInProgress || false,
              );
              setLastVerificationCheck(verificationData.lastChecked || null);

              console.log(
                "✅ Loaded cached verification status:",
                verificationData.status,
              );
            }
          } catch (e) {
            console.error("❌ Error parsing cached verification:", e);
          }
        }

        if (cachedBrokers) {
          try {
            const brokersData = JSON.parse(cachedBrokers);
            if (Array.isArray(brokersData)) {
              setBrokers(brokersData);
              console.log("🤝 Loaded cached brokers:", brokersData.length);
            }
          } catch (e) {
            console.error("❌ Error parsing cached brokers:", e);
          }
        }

        if (cachedPropertyRequest) {
          try {
            const requestData = JSON.parse(cachedPropertyRequest);
            if (requestData && typeof requestData === "object") {
              setPropertyRequest(requestData);
              if (requestData.propertyData) {
                setFormData((prev) => ({
                  ...prev,
                  ...requestData.propertyData,
                }));
              }
              console.log("✅ Loaded cached property request");

              // If broker is selected, mark step 2 as complete
              if (requestData.brokerId) {
                setCompletedSteps((prev) => {
                  const updated = { ...prev, 2: true };
                  localStorage.setItem(
                    "sellerLeaser_completed_steps",
                    JSON.stringify(updated),
                  );
                  return updated;
                });
                setSelectedBroker(requestData.brokerId); // You might need to load broker data here
              }
            }
          } catch (e) {
            console.error("❌ Error parsing property request:", e);
          }
        }

        // Fetch existing property requests from database
        console.log("🔍 Fetching existing property requests from database...");
        try {
          const response = await apiCall("GET_MY_REQUESTS", {});

          if (response.success && response.data && response.data.requests) {
            const requests = response.data.requests;

            // Find the most recent draft/pending request
            const latestRequest = requests.find(
              (req) =>
                req.status === "draft" ||
                req.status === "pending" ||
                req.status === "assigned" ||
                req.status === "submitted" ||
                req.status === "active",
            );

            if (latestRequest) {
              console.log(
                "✅ Found existing property request in database:",
                latestRequest,
              );

              // Safely parse property_data
              let propertyData = {};
              if (latestRequest.property_data) {
                try {
                  propertyData =
                    typeof latestRequest.property_data === "string"
                      ? JSON.parse(latestRequest.property_data)
                      : latestRequest.property_data;
                } catch (parseError) {
                  console.error("❌ Error parsing property_data:", parseError);
                }
              }

              // Update form data with the request data
              setFormData((prev) => ({
                ...prev,
                request_id: latestRequest.id,
                property_type: latestRequest.property_type || "",
                location: latestRequest.location || "",
                price: latestRequest.price || "",
                price_currency: latestRequest.price_currency || "ETB",
                verification_method:
                  latestRequest.verification_method || "physical",
                description: latestRequest.description || "",
                beds: latestRequest.beds || "",
                baths: latestRequest.baths || "",
                sqft: latestRequest.sqft || "",
                user_type:
                  latestRequest.user_type ||
                  (userData.role === "seller" ? "seller" : "leaser"),
                ...propertyData,
              }));

              // Update property request state
              const updatedPropertyRequest = {
                ...propertyRequest,
                id: latestRequest.id,
                status: latestRequest.status,
                brokerId: latestRequest.broker_id || null,
                verificationDate: latestRequest.verification_date || null,
                // Add other fields as needed
              };

              setPropertyRequest(updatedPropertyRequest);
              localStorage.setItem(
                `property_request_${userData.id}`,
                JSON.stringify(updatedPropertyRequest),
              );

              // Mark step 1 as complete if we have a request
              setCompletedSteps((prev) => {
                const updated = { ...prev, 1: true };
                localStorage.setItem(
                  "sellerLeaser_completed_steps",
                  JSON.stringify(updated),
                );
                return updated;
              });

              // If broker is assigned, mark step 2 as complete
              if (latestRequest.broker_id) {
                setCompletedSteps((prev) => {
                  const updated = { ...prev, 2: true };
                  localStorage.setItem(
                    "sellerLeaser_completed_steps",
                    JSON.stringify(updated),
                  );
                  return updated;
                });

                // Fetch broker details and set selected broker
                fetchBrokerDetails(latestRequest.broker_id);
              }
            }
          }
        } catch (error) {
          console.error("❌ Error fetching property requests:", error);
        }

        // Fetch fresh data
        console.log("🔄 Fetching fresh data...");
        const results = await Promise.allSettled([
          fetchBrokers().catch((err) =>
            console.error("❌ Error fetching brokers:", err),
          ),
          checkVerificationStatus(true).catch((err) =>
            console.error("❌ Error checking verification:", err),
          ),
        ]);

        // After loading all data, do a final validation of steps
        await validateAndUpdateSteps();

        console.log("✅ Seller/Leaser dashboard initialization complete");
        console.log("📊 Final step status:", completedSteps);
      } catch (error) {
        console.error("❌ Initialization error:", error);

        if (
          error.message?.includes("Authentication") ||
          error.message?.includes("401")
        ) {
          console.log("🔒 Authentication error, redirecting to login");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          toast.error("Please log in to list your property");
          navigate("/login-register");
        } else if (error.message?.includes("Network")) {
          toast.error(
            "Network error. Please check your connection and try again.",
          );
        } else {
          toast.error(
            "Failed to load dashboard. Please try refreshing the page.",
          );
        }
      } finally {
        setIsLoading(false);
        isInitializedRef.current = true;
        console.log("🏁 Dashboard initialization finished");
      }
    };

    const timer = setTimeout(() => {
      initializeDashboard();
    }, 100);

    return () => clearTimeout(timer);
  }, [checkVerificationStatus, navigate, validateAndUpdateSteps]);

  // Helper function to fetch broker details
  const fetchBrokerDetails = async (brokerId) => {
    try {
      const response = await apiCall("GET_BROKER_BY_ID", { id: brokerId });
      if (response.success && response.data) {
        setSelectedBroker(response.data);
      }
    } catch (error) {
      console.error("Error fetching broker details:", error);
    }
  };

  // ========== HANDLER FUNCTIONS ==========

  const handleProfilePictureUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const response = await apiCall("UPLOAD_PROFILE", {}, { data: formData });
      const updatedUser = {
        ...user,
        profile_picture: response.profilePictureUrl,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile picture updated!");
    } catch (error) {
      toast.error("Failed to upload profile picture");
      throw error;
    }
  };

  const handleEditProfile = async (updates) => {
    try {
      const response = await apiCall("UPDATE_PROFILE", {}, { data: updates });
      if (response.success) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        if (updates.preferences) {
          localStorage.setItem(
            `user_preferences_${user.id}`,
            JSON.stringify(updates.preferences),
          );
        }

        toast.success("Profile updated!");
        return true;
      }
    } catch (error) {
      toast.error("Failed to update profile");
      return false;
    }
  };

  const handleProfileComplete = async (updatedData) => {
    try {
      setIsLoading(true);
      const success = await handleEditProfile(updatedData);

      if (success) {
        setCompletedSteps((prev) => {
          const updated = { ...prev, 1: true };
          localStorage.setItem("sellerLeaser_completed_steps", JSON.stringify(updated));
          return updated;
        });

        toast.success("Profile setup completed!");
        setShowProfileSetup(false);
        setActiveStep(2);
      }
    } catch (error) {
      toast.error("Failed to complete profile setup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUploadComplete = async (uploadData) => {
    try {
      if (isVerificationInProgress && !uploadData.isResubmission) {
        toast.error(
          "Verification is already in progress. Please wait for it to complete.",
        );
        return;
      }

      let data;
      let isFormData = false;

      if (uploadData.url instanceof File) {
        const formData = new FormData();
        formData.append("document", uploadData.url);
        formData.append("documentType", uploadData.type);
        formData.append("isResubmission", uploadData.isResubmission || false);
        formData.append("filename", uploadData.filename || uploadData.url.name);

        data = formData;
        isFormData = true;
      } else if (
        typeof uploadData.url === "string" &&
        uploadData.url.startsWith("data:")
      ) {
        data = {
          documentType: uploadData.type,
          documentUrl: uploadData.url,
          filename: uploadData.filename || "document.jpg",
          isResubmission: uploadData.isResubmission || false,
        };
      } else {
        data = {
          documentType: uploadData.type,
          documentUrl: uploadData.url,
          filename: uploadData.filename || "document",
          isResubmission: uploadData.isResubmission || false,
        };
      }

      const response = await apiCall(
        "UPLOAD_VERIFICATION_DOCUMENT",
        {},
        {
          method: "POST",
          data: data,
          headers: isFormData ? {} : { "Content-Type": "application/json" },
        },
      );

      if (response.success) {
        setHasSubmittedDocuments(true);
        setIsVerificationInProgress(true);

        await checkVerificationStatus(true);

        toast.success(
          response.message ||
            "Documents submitted for verification! Our team will review them within 24-48 hours.",
          {
            duration: 5000,
            icon: "⏳",
          },
        );

        setShowDocumentUpload(false);
        setActiveStep(2);
      } else {
        toast.error(response.message || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(error.message || "Failed to submit documents");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully!");
    navigate("/", { replace: true });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field])
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep3 = () => {
    const errors = {};
    if (!formData.property_type)
      errors.property_type = "Property type is required";
    if (!formData.location || formData.location.trim().length < 3)
      errors.location = "Valid location is required";
    if (!formData.price || parseFloat(formData.price) <= 0)
      errors.price = "Valid price is required";
    if (!formData.property_images || formData.property_images.length < 3)
      errors.property_images = "Please upload at least 3 property photos";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadPropertyImages = async (requestId, images) => {
    try {
      console.log(
        `📸 Uploading ${images.length} images for request ${requestId}`,
      );

      const uploadPromises = images.map(async (image, index) => {
        const formData = new FormData();
        formData.append("image", image);
        formData.append("is_primary", index === 0 ? "1" : "0");

        try {
          const response = await apiCall(
            "UPLOAD_REQUEST_IMAGE",
            { requestId },
            {
              body: formData,
              method: "POST",
            },
          );

          console.log(`✅ Image ${index + 1} uploaded successfully`);
          return response;
        } catch (imageError) {
          console.error(`❌ Failed to upload image ${index + 1}:`, imageError);
          return null;
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      console.log(
        `📊 Image upload results: ${results.filter((r) => r.status === "fulfilled").length} succeeded, ${results.filter((r) => r.status === "rejected").length} failed`,
      );

      return results;
    } catch (error) {
      console.error("❌ Error in uploadPropertyImages:", error);
      throw error;
    }
  };

  const handleSubmitPropertyRequest = async (propertyData) => {
    try {
      console.log("📤 Submitting property request...", propertyData);

      const response = await apiCall(
        "CREATE_PROPERTY_REQUEST",
        {},
        {
          method: "POST",
          data: propertyData,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("✅ Property request API response:", response);

      if (response.success) {
        let requestId = null;

        if (response.data?.request?.id) {
          requestId = response.data.request.id;
        } else if (response.data?.id) {
          requestId = response.data.id;
        } else if (response.request?.id) {
          requestId = response.request.id;
        } else if (response.id) {
          requestId = response.id;
        }

        console.log("📝 Extracted request ID:", requestId);

        if (!requestId) {
          console.error("❌ Could not find request ID in response:", response);
          throw new Error("No request ID returned in response");
        }

        // Save the request ID to localStorage
        localStorage.setItem("last_submitted_request_id", requestId.toString());

        // Update formData with the request ID
        setFormData((prev) => ({
          ...prev,
          request_id: requestId,
        }));

        // Update property request state
        const updatedRequest = {
          ...propertyRequest,
          id: requestId,
          status: "draft",
          currentStep: 2,
          propertyData: propertyData,
        };
        setPropertyRequest(updatedRequest);
        localStorage.setItem(
          `property_request_${user.id}`,
          JSON.stringify(updatedRequest),
        );

        // Mark step 1 as complete
        setCompletedSteps((prev) => {
          const updated = { ...prev, 1: true };
          localStorage.setItem("sellerLeaser_completed_steps", JSON.stringify(updated));
          return updated;
        });

        // Move to step 2
        setActiveStep(2);

        toast.success(
          "Property details submitted successfully! Now select a broker.",
        );

        return requestId;
      } else {
        throw new Error(
          response.message || "Failed to submit property request",
        );
      }
    } catch (error) {
      console.error("❌ Submit error:", error);
      toast.error(error.message || "Failed to submit property request");
      throw error;
    }
  };

  const fetchBrokers = async () => {
    try {
      const response = await apiCall("GET_BROKERS");

      let brokersData = [];
      if (response?.success && Array.isArray(response.brokers)) {
        brokersData = response.brokers;
      } else if (Array.isArray(response)) {
        brokersData = response;
      }

      const parsedBrokers = brokersData.map((broker) => ({
        ...broker,
        specialization: Array.isArray(broker.specialization)
          ? broker.specialization
          : broker.specialization
            ? JSON.parse(broker.specialization)
            : [],
        name:
          broker.name ||
          `${broker.first_name || ""} ${broker.last_name || ""}`.trim() ||
          "Broker",
        average_rating: parseFloat(
          broker.rating || broker.average_rating || 4.5,
        ),
        total_completed_deals:
          broker.completed_deals || broker.total_completed_deals || 0,
        commission_rate: broker.commission_rate || "2.5%",
        is_available: Boolean(broker.is_available),
        is_verified: Boolean(broker.is_verified),
      }));

      setBrokers(parsedBrokers);
      localStorage.setItem("cached_brokers", JSON.stringify(parsedBrokers));
    } catch (error) {
      console.error("Broker fetch error:", error);
      toast.error("Failed to load brokers");
      setBrokers([]);
    }
  };

  const handleBrokerSelect = (broker) => {
    console.log("🎯 Broker selected:", broker?.id, broker?.name);
    setSelectedBroker(broker);
    if (broker) {
      toast.success(`Selected: ${broker.name}`);
    }
  };

  const handleConfirmBrokerSelection = async () => {
    if (!selectedBroker) {
      toast.error("Please select a broker first");
      return;
    }

    const requestId = formData.request_id;

    if (!requestId) {
      console.error("❌ No request ID found. Can't assign broker.");
      toast.error("Please complete step 1 first");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🤝 Assigning broker:", {
        brokerId: selectedBroker.id,
        brokerName: selectedBroker.name,
        requestId: requestId,
      });

      // Show loading toast
      const loadingToast = toast.loading(
        `Assigning ${selectedBroker.name} as your broker...`,
      );

      try {
        // Use apiCall with correct endpoint
        const response = await apiCall(
          "ASSIGN_BROKER",
          { id: requestId },
          {
            data: { brokerId: selectedBroker.id },
          },
        );

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (response.success) {
          console.log("✅ Broker assigned successfully:", response);

          // Update property request state
          const updatedRequest = {
            ...propertyRequest,
            id: requestId,
            brokerId: selectedBroker.id,
            brokerName: selectedBroker.name,
            status: "assigned",
            currentStep: 2,
          };

          setPropertyRequest(updatedRequest);

          // Save to localStorage
          localStorage.setItem(
            `property_request_${user.id}`,
            JSON.stringify(updatedRequest),
          );

          // Mark step 2 as complete
          setCompletedSteps((prev) => {
            const updated = { ...prev, 2: true };
            localStorage.setItem("sellerLeaser_completed_steps", JSON.stringify(updated));
            return updated;
          });

          // ========== SEND NOTIFICATION ==========
          try {
            console.log("📤 Sending broker assignment notification...");
            await apiCall(
              "CREATE_NOTIFICATION_INTERNAL",
              {},
              {
                method: "POST",
                data: {
                  type: "BROKER_ASSIGNED",
                  data: {
                    userId: user.id,
                    requestId: requestId,
                    brokerId: selectedBroker.id,
                    brokerName: selectedBroker.name,
                    message: `${selectedBroker.name} has been assigned as your broker. They will contact you within 24 hours.`,
                    priority: "high",
                    actionUrl: `/seller-leaser?step=2`,
                    metadata: {
                      requestId: requestId,
                      brokerId: selectedBroker.id,
                      brokerName: selectedBroker.name,
                      entityType: "property_request",
                      entityId: requestId,
                    },
                  },
                },
              },
            );
            console.log("✅ Notification sent successfully");
          } catch (notifError) {
            console.warn(
              "❌ Failed to send notification (but broker assignment succeeded):",
              notifError.message,
            );
            // Don't fail the main operation if notification fails
          }

          // Show success alert/modal
          toast.success(
            <div>
              <div className="font-bold">🎉 Broker Assigned Successfully!</div>
              <div className="text-sm mt-1">
                {selectedBroker.name} is now your assigned broker. They will
                contact you within 24 hours.
              </div>
            </div>,
            {
              duration: 5000,
              icon: "✅",
            },
          );

          // Also send chat available notification
          try {
            await apiCall(
              "CREATE_NOTIFICATION_INTERNAL",
              {},
              {
                method: "POST",
                data: {
                  type: "CHAT_AVAILABLE",
                  data: {
                    userId: user.id,
                    requestId: requestId,
                    brokerId: selectedBroker.id,
                    brokerName: selectedBroker.name,
                    message: `Chat is now available with your broker ${selectedBroker.name}. Click the chat button to start communicating.`,
                    priority: "medium",
                    actionUrl: `/chat/${requestId}`,
                    metadata: {
                      requestId: requestId,
                      brokerId: selectedBroker.id,
                      brokerName: selectedBroker.name,
                      entityType: "chat",
                      entityId: requestId,
                      chatData: {
                        participants: [user.id, selectedBroker.id],
                        context: `property_request_${requestId}`,
                        autoOpen: true,
                      },
                    },
                  },
                },
              },
            );
          } catch (chatNotifError) {
            console.warn("Failed to send chat notification:", chatNotifError);
          }

          // Show browser alert for extra visibility
          if (
            window.confirm(
              `✅ Broker ${selectedBroker.name} assigned successfully!\n\nClick OK to proceed to the next step.`,
            )
          ) {
            // Auto-advance to step 3
            setActiveStep(3);
          } else {
            setActiveStep(3); // Still advance even if they cancel the alert
          }
        } else {
          throw new Error(response.message || "Failed to assign broker");
        }
      } catch (apiError) {
        toast.dismiss(loadingToast);
        throw apiError;
      }
    } catch (error) {
      console.error("❌ Broker assignment error:", error);

      // Show detailed error toast
      toast.error(
        <div>
          <div className="font-bold">❌ Failed to Assign Broker</div>
          <div className="text-sm mt-1">
            {error.message || "Please try again or contact support"}
          </div>
        </div>,
        {
          duration: 6000,
          icon: "❌",
        },
      );

      // Show browser alert for critical errors
      alert(
        `❌ Broker Assignment Failed!\n\nError: ${error.message}\n\nPlease try again or contact support.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleInspection = async (viewingData) => {
    try {
      setIsLoading(true);

      const response = await apiCall(
        "CREATE_INSPECTION_APPOINTMENT",
        {},
        {
          data: {
            propertyRequestId: propertyRequest.id,
            brokerId: propertyRequest.brokerId,
            date: viewingData.date,
            time: viewingData.time,
            notes: viewingData.notes,
          },
        },
      );

      if (response.success) {
        const updatedRequest = {
          ...propertyRequest,
          verificationDate: `${viewingData.date} ${viewingData.time}`,
          status: "inspection_scheduled",
        };

        setPropertyRequest(updatedRequest);
        localStorage.setItem(
          `property_request_${user.id}`,
          JSON.stringify(updatedRequest),
        );

        // Mark step 3 as complete
        setCompletedSteps((prev) => {
          const updated = { ...prev, 3: true };
          localStorage.setItem("sellerLeaser_completed_steps", JSON.stringify(updated));
          return updated;
        });

        setActiveStep(4);
        setShowScheduleViewingModal(false);
        toast.success("Inspection scheduled successfully!");
      } else {
        toast.error(response.message || "Failed to schedule inspection");
      }
    } catch (error) {
      console.error("Error scheduling inspection:", error);
      toast.error("Failed to schedule inspection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteInspection = async (report) => {
    try {
      setIsLoading(true);

      const response = await apiCall(
        "COMPLETE_INSPECTION",
        { id: propertyRequest.id },
        {
          data: { report: report },
        },
      );

      if (response.success) {
        const updatedRequest = {
          ...propertyRequest,
          inspectionStatus: "completed",
          inspectionReport: report,
          status: "inspection_completed",
        };

        setPropertyRequest(updatedRequest);
        localStorage.setItem(
          `property_request_${user.id}`,
          JSON.stringify(updatedRequest),
        );

        // Mark step 4 as complete
        setCompletedSteps((prev) => {
          const updated = { ...prev, 4: true };
          localStorage.setItem("sellerLeaser_completed_steps", JSON.stringify(updated));
          return updated;
        });

        setActiveStep(5);
        toast.success(
          "Inspection completed! Broker will prepare listing proposal.",
        );
      } else {
        throw new Error(response.message || "Failed to complete inspection");
      }
    } catch (error) {
      console.error("Inspection completion error:", error);
      toast.error(error.message || "Failed to complete inspection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveListing = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall(
        "SUBMIT_LISTING_APPROVAL",
        { id: propertyRequest.id },
        {
          data: {
            listingProposal: propertyRequest.listingProposal,
            approvedByUser: true,
          },
        },
      );

      if (response.success) {
        const updatedRequest = {
          ...propertyRequest,
          status: "awaiting_admin_approval",
          adminApproval: "pending",
        };

        setPropertyRequest(updatedRequest);
        localStorage.setItem(
          `property_request_${user.id}`,
          JSON.stringify(updatedRequest),
        );

        // Mark step 5 as complete
        setCompletedSteps((prev) => {
          const updated = { ...prev, 5: true };
          localStorage.setItem("sellerLeaser_completed_steps", JSON.stringify(updated));
          return updated;
        });

        setActiveStep(6);
        toast.success("Listing submitted for admin approval!");
      } else {
        throw new Error(response.message || "Failed to submit listing");
      }
    } catch (error) {
      console.error("Listing approval error:", error);
      toast.error(error.message || "Failed to submit listing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueStep = async () => {
    if (activeStep < currentSteps.length) {
      if (
        activeStep === 3 &&
        isVerificationInProgress &&
        verificationStatus?.status !== "verified"
      ) {
        toast.error(
          "Please wait for verification to complete before submitting property details",
        );
        setShowVerificationRestriction(true);
        return;
      }
      setActiveStep(activeStep + 1);
    }
  };

  const handleManualVerificationCheck = async () => {
    try {
      setIsLoading(true);
      toast.loading("Checking verification status...", {
        id: "verification-check",
      });

      const result = await checkVerificationStatus(true);

      if (result) {
        toast.success("Status checked!", { id: "verification-check" });

        if (result.status === "verified") {
          toast.success(
            "✅ Verification complete! You can now submit property details.",
          );
        } else if (result.status === "needs_resubmission") {
          toast.error("🔄 Please resubmit your documents", {
            description: result.feedback,
            duration: 6000,
          });
        }
      }
    } catch (error) {
      toast.error("Error checking status", { id: "verification-check" });
      console.error("Manual check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInfoCards = () => {
    const baseCards = {
      seller: [
        {
          id: 0,
          icon: TrendingUp,
          title: "Maximize Value",
          description:
            "Get the best price for your property with our market analysis and professional pricing strategy.",
          highlight: "Optimal Pricing",
          action: () => {
            if (
              isVerificationInProgress &&
              verificationStatus?.status !== "verified"
            ) {
              toast.error(
                "Please wait for verification to complete before submitting property details",
              );
              return;
            }
            setActiveStep(3);
          },
        },
        {
          id: 1,
          icon: ShieldCheck,
          title: "Secure Transactions",
          description:
            "End-to-end verification process ensuring legal compliance and secure property transfers.",
          highlight: "Risk-Free",
          action: () => {
            if (hasSubmittedDocuments && isVerificationInProgress) {
              setShowVerificationRestriction(true);
              toast.error(
                "Please wait for verification to complete before uploading new documents",
              );
            } else {
              setShowDocumentUpload(true);
            }
          },
        },
        {
          id: 2,
          icon: Globe,
          title: "Maximum Exposure",
          description:
            "Your property listed across 15+ platforms with professional photography and virtual tours.",
          highlight: "Wide Reach",
          action: () => {
            if (
              isVerificationInProgress &&
              verificationStatus?.status !== "verified"
            ) {
              toast.error(
                "Please wait for verification to complete before submitting property details",
              );
              return;
            }
            setActiveStep(3);
          },
        },
        {
          id: 3,
          icon: Handshake,
          title: "Expert Guidance",
          description:
            "Connect with certified Ethiopian brokers offering local expertise and market knowledge.",
          highlight: "Local Partners",
          action: () => {
            if (brokers.length > 0 && completedSteps[2]) {
              // Chat is available from the floating button
              toast.info(
                "Chat with broker is available from the floating button",
              );
            } else if (brokers.length > 0) {
              toast.error("Select a broker first to enable chat");
            } else {
              toast.error("No brokers available at the moment");
            }
          },
        },
      ],
      leaser: [
        {
          id: 0,
          icon: Shield,
          title: "Safe & Secure",
          description:
            "Verified tenants with secure payments and legally binding rental agreements.",
          highlight: "Peace of Mind",
          action: () => {
            if (
              isVerificationInProgress &&
              verificationStatus?.status !== "verified"
            ) {
              toast.error(
                "Please wait for verification to complete before submitting property details",
              );
              return;
            }
            setActiveStep(3);
          },
        },
        {
          id: 1,
          icon: Users,
          title: "Quality Tenants",
          description:
            "Our verification process ensures reliable and responsible tenants for your property.",
          highlight: "Verified Tenants",
          action: () => {
            if (hasSubmittedDocuments && isVerificationInProgress) {
              setShowVerificationRestriction(true);
              toast.error(
                "Please wait for verification to complete before uploading new documents",
              );
            } else {
              setShowDocumentUpload(true);
            }
          },
        },
        {
          id: 2,
          icon: DollarSign,
          title: "Optimize Income",
          description:
            "Market-based rental pricing to maximize your monthly income while remaining competitive.",
          highlight: "Best Returns",
          action: () => {
            if (
              isVerificationInProgress &&
              verificationStatus?.status !== "verified"
            ) {
              toast.error(
                "Please wait for verification to complete before submitting property details",
              );
              return;
            }
            setActiveStep(3);
          },
        },
        {
          id: 3,
          icon: FileCheck,
          title: "Digital Process",
          description:
            "Streamlined digital documentation and contract management for hassle-free renting.",
          highlight: "Paperless",
          action: () => {
            if (hasSubmittedDocuments && isVerificationInProgress) {
              setShowVerificationRestriction(true);
              toast.error(
                "Please wait for verification to complete before uploading new documents",
              );
            } else {
              setShowDocumentUpload(true);
            }
          },
        },
      ],
    };
    return baseCards[userType];
  };

  const getJourneySteps = () => {
    const baseJourneys = {
      seller: [
        {
          step: 1,
          title: "Property Details",
          description: "Tell us about your property and upload photos.",
          icon: Home,
          time: "10-15 mins",
        },
        {
          step: 2,
          title: "Choose Broker",
          description: "Select your preferred certified real estate broker.",
          icon: Users,
          time: "1-2 Days",
        },
        {
          step: 3,
          title: "Schedule Inspection",
          description: "Book property inspection with assigned broker.",
          icon: Calendar,
          time: "2-5 Days",
        },
        {
          step: 4,
          title: "Property Inspection",
          description: "Broker conducts detailed property verification.",
          icon: ShieldCheck,
          time: "1-2 Days",
        },
        {
          step: 5,
          title: "Listing Proposal",
          description: "Review and approve listing details.",
          icon: FileText,
          time: "1-2 Days",
        },
        {
          step: 6,
          title: "Admin Approval",
          description: "Final listing review by admin team.",
          icon: CheckCircle,
          time: "24-48 Hours",
        },
        {
          step: 7,
          title: "Contract & Payment",
          description: "Sign contracts and complete payment.",
          icon: Handshake,
          time: "1-3 Days",
        },
      ],
      leaser: [
        {
          step: 1,
          title: "Property Details",
          description: "Tell us about your rental property.",
          icon: Home,
          time: "10-15 mins",
        },
        {
          step: 2,
          title: "Choose Broker",
          description: "Select rental management specialist.",
          icon: Users,
          time: "1-2 Days",
        },
        {
          step: 3,
          title: "Schedule Inspection",
          description: "Book property assessment with broker.",
          icon: Calendar,
          time: "2-5 Days",
        },
        {
          step: 4,
          title: "Property Inspection",
          description: "Broker verifies property condition.",
          icon: ShieldCheck,
          time: "1-2 Days",
        },
        {
          step: 5,
          title: "Listing Proposal",
          description: "Review rental listing details.",
          icon: FileText,
          time: "1-2 Days",
        },
        {
          step: 6,
          title: "Admin Approval",
          description: "Final approval by admin team.",
          icon: CheckCircle,
          time: "24-48 Hours",
        },
        {
          step: 7,
          title: "Lease Agreement",
          description: "Sign rental contract with tenant.",
          icon: Handshake,
          time: "1-3 Days",
        },
      ],
    };
    return baseJourneys[userType];
  };

  const handleOpenChatWithBroker = (broker) => {
    setSelectedBrokerForChat(broker);
    setChatWindowOpen(true);
  };

  const handleNavigateToSection = (section) => {
    navigate(`/${section}`);
  };

  const infoCards = getInfoCards();
  const journeySteps = getJourneySteps();

  // ========== COMPONENTS ==========

  const ProgressCircle = ({ step, isActive, isCompleted, onClick }) => {
    const IconComponent = step.icon;
    return (
      <div
        className="relative flex flex-col items-center cursor-pointer transition-all duration-500 group"
        onClick={() => onClick(step.number)}
      >
        {step.number > 1 && (
          <div
            className={`absolute -left-16 top-6 w-16 h-0.5 transition-all duration-500 ${
              isCompleted || isActive
                ? `bg-gradient-to-r ${step.color}`
                : "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 group-hover:from-amber-400 group-hover:to-amber-500"
            }`}
          />
        )}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl ${
            isCompleted
              ? `bg-gradient-to-r ${step.color} border-transparent text-white shadow-lg`
              : isActive
                ? `border-transparent bg-gradient-to-r ${step.color} text-white shadow-lg`
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 group-hover:border-amber-400"
          }`}
        >
          {isCompleted ? (
            <CheckCircle className="w-10 h-10 text-white" />
          ) : (
            <IconComponent
              className={`w-10 h-10 ${isActive ? "text-white" : step.iconColor} group-hover:text-amber-500`}
            />
          )}
        </div>
        <div
          className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-lg ${
            isCompleted || isActive
              ? `bg-gradient-to-r ${step.color} text-white`
              : "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white"
          }`}
        >
          {step.number}
        </div>
        <div className="mt-6 text-center max-w-[140px]">
          <h3
            className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
              isActive || isCompleted
                ? `bg-gradient-to-r ${step.color} bg-clip-text text-transparent`
                : "text-gray-600 dark:text-gray-400 group-hover:text-amber-500"
            }`}
          >
            {step.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            {step.description}
          </p>
        </div>
      </div>
    );
  };

  const VerificationStatus = () => {
    const isUploadDisabled =
      hasSubmittedDocuments &&
      isVerificationInProgress &&
      verificationStatus?.status !== "needs_resubmission";

    const getVerificationGradient = () => {
      if (verificationStatus?.status === "needs_resubmission") {
        return "bg-gradient-to-r from-amber-500 to-amber-800";
      } else if (isUploadDisabled) {
        return "bg-gradient-to-r from-gray-500 to-gray-700";
      } else {
        return "bg-gradient-to-r from-amber-500 to-amber-800";
      }
    };

    const getVerificationIcon = () => {
      if (verificationStatus?.status === "needs_resubmission") {
        return (
          <AlertCircle
            className={`w-16 h-16 ${theme === "dark" ? "text-amber-200" : "text-amber-500"}`}
          />
        );
      } else if (isUploadDisabled) {
        return (
          <Lock
            className={`w-16 h-16 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
          />
        );
      } else {
        return (
          <ShieldCheck
            className={`w-16 h-16 ${theme === "dark" ? "text-amber-200" : "text-amber-500"}`}
          />
        );
      }
    };

    const getVerificationTitle = () => {
      if (verificationStatus?.status === "needs_resubmission") {
        return "Resubmission Required";
      } else if (isUploadDisabled) {
        return "Verification In Progress";
      } else {
        return hasSubmittedDocuments
          ? "Complete Your Verification"
          : "Verify Your Identity";
      }
    };

    const getVerificationDescription = () => {
      if (verificationStatus?.status === "needs_resubmission") {
        return "Your documents need corrections. Please review the feedback and upload the corrected versions.";
      } else if (isUploadDisabled) {
        return "Your documents are currently being reviewed. Please wait for the verification process to complete before uploading new documents.";
      } else {
        return hasSubmittedDocuments
          ? "Upload additional documents or check your verification status to complete the process."
          : "Upload required documents to verify your identity and unlock full access to list your property.";
      }
    };

    const getVerificationSteps = () => {
      if (verificationStatus?.status === "needs_resubmission") {
        return [
          {
            icon: <FileText className="w-8 h-8 mx-auto mb-2 text-amber-500" />,
            title: "Review Feedback",
          },
          {
            icon: <Upload className="w-8 h-8 mx-auto mb-2 text-amber-500" />,
            title: "Upload Corrections",
          },
          {
            icon: (
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            ),
            title: "Complete Verification",
          },
        ];
      } else if (isUploadDisabled) {
        return [
          {
            icon: <Clock className="w-8 h-8 mx-auto mb-2 text-gray-500" />,
            title: "Under Review",
            bgColorDark: "bg-gray-800/50 border border-gray-700",
            bgColorLight: "bg-gray-100 border border-gray-300",
          },
          {
            icon: <FileCheck className="w-8 h-8 mx-auto mb-2 text-gray-500" />,
            title: "Processing",
            bgColorDark: "bg-gray-800/50 border border-gray-700",
            bgColorLight: "bg-gray-100 border border-gray-300",
          },
          {
            icon: (
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            ),
            title: "Pending Approval",
            bgColorDark: "bg-gray-800/50 border border-gray-700",
            bgColorLight: "bg-gray-100 border border-gray-300",
          },
        ];
      } else {
        return [
          {
            icon: <FileText className="w-8 h-8 mx-auto mb-2 text-amber-500" />,
            title: "Upload Documents",
          },
          {
            icon: <Shield className="w-8 h-8 mx-auto mb-2 text-amber-500" />,
            title: "Secure Processing",
          },
          {
            icon: (
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            ),
            title: "Get Verified",
          },
        ];
      }
    };

    const getVerificationButtonStyles = () => {
      if (verificationStatus?.status === "needs_resubmission") {
        return "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:text-white";
      } else if (isUploadDisabled) {
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      } else {
        return "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:text-white";
      }
    };

    const getVerificationMainAction = () => {
      if (verificationStatus?.status === "needs_resubmission") {
        return () => {
          setShowDocumentUpload(true);
          toast("Please upload corrected documents as requested", {
            icon: "📄",
          });
        };
      } else if (isUploadDisabled) {
        return () => {
          setShowVerificationRestriction(true);
          toast.error("Cannot upload new documents during verification");
        };
      } else {
        return () => setShowDocumentUpload(true);
      }
    };

    const getVerificationMainButtonContent = () => {
      if (verificationStatus?.status === "needs_resubmission") {
        return (
          <>
            <Upload className="inline w-5 h-5 mr-2" />
            Resubmit Documents
          </>
        );
      } else if (isUploadDisabled) {
        return (
          <>
            <Lock className="inline w-5 h-5 mr-2" />
            Upload Disabled
          </>
        );
      } else {
        return (
          <>
            <Upload className="inline w-5 h-5 mr-2" />
            {hasSubmittedDocuments
              ? "Upload Additional Documents"
              : "Upload Required Documents"}
          </>
        );
      }
    };

    return (
      <div className="text-center py-8">
        <div className="relative mx-auto w-36 h-36 mb-8">
          <div
            className={`absolute inset-0 ${getVerificationGradient()} rounded-full ${verificationStatus?.status === "needs_resubmission" ? "animate-pulse" : ""}`}
          ></div>
          <div
            className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}
          >
            {getVerificationIcon()}
          </div>
        </div>

        <h4
          className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
        >
          {getVerificationTitle()}
        </h4>

        <div className="max-w-2xl mx-auto mb-10">
          <p
            className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
          >
            {getVerificationDescription()}
          </p>

          <div
            className={`p-6 rounded-xl mb-6 ${
              theme === "dark"
                ? "bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/30"
                : "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-lg ${
                  verificationStatus?.status === "verified"
                    ? "bg-gradient-to-r from-green-500 to-green-600"
                    : verificationStatus?.status === "needs_resubmission"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600"
                      : "bg-gradient-to-r from-amber-500 to-amber-600"
                }`}
              >
                {verificationStatus?.status === "verified" ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : verificationStatus?.status === "needs_resubmission" ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h5
                  className={`font-semibold text-lg mb-2 ${theme === "dark" ? "text-amber-300" : "text-amber-700"}`}
                >
                  {getVerificationStepTitle()}
                </h5>
                <p
                  className={`text-sm ${theme === "dark" ? "text-amber-400/80" : "text-amber-600/80"}`}
                >
                  {getVerificationStepDescription()}
                </p>
                {verificationStatus?.feedback && (
                  <div className="mt-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Admin Feedback:</span>{" "}
                      {verificationStatus.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {getVerificationSteps().map((step, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl text-center ${
                  theme === "dark"
                    ? step.bgColorDark ||
                      "bg-gray-800/50 border border-gray-700"
                    : step.bgColorLight || "bg-amber-50 border border-amber-200"
                }`}
              >
                {step.icon}
                <p className="font-medium">{step.title}</p>
              </div>
            ))}
          </div>

          {isVerificationInProgress && (
            <div
              className={`p-6 rounded-xl mb-6 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-800/30"
                  : "bg-gradient-to-r from-blue-50 to-cyan-50/50 border border-blue-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5
                    className={`font-semibold text-lg mb-3 ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}
                  >
                    Verification Status
                  </h5>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                        <span className="text-xs font-bold">1</span>
                      </div>
                      <span
                        className={`text-sm ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                      >
                        Status: {verificationStatus?.status || "Pending"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                        <span className="text-xs font-bold">2</span>
                      </div>
                      <span
                        className={`text-sm ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                      >
                        Last checked:{" "}
                        {lastVerificationCheck
                          ? new Date(lastVerificationCheck).toLocaleTimeString()
                          : "Never"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                        <span className="text-xs font-bold">3</span>
                      </div>
                      <span
                        className={`text-sm ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                      >
                        {isUploadDisabled
                          ? "Uploads disabled during review"
                          : "You can upload documents"}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isUploadDisabled && (
            <div
              className={`p-4 rounded-lg ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-800/30"
                  : "bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p
                  className={`text-sm ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}
                >
                  <span className="font-medium">Security Feature:</span>{" "}
                  {getVerificationStepDescription()}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={getVerificationMainAction()}
            disabled={isUploadDisabled}
            className={`px-10 py-4 font-semibold Button2 ${getVerificationButtonStyles()} ${isUploadDisabled ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {getVerificationMainButtonContent()}
          </button>

          <button
            onClick={handleManualVerificationCheck}
            disabled={isLoading}
            className="px-10 py-4 font-semibold Button2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:text-white flex items-center justify-center gap-2 mx-auto"
          >
            {isLoading ? (
              <>
                <LoaderIcon className="w-5 h-5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Check Status Now
              </>
            )}
          </button>
        </div>

        {isVerificationInProgress &&
          verificationStatus?.status !== "verified" && (
            <div
              className={`text-center mt-4 p-4 rounded-lg ${theme === "dark" ? "bg-amber-900/20 border border-amber-800/30" : "bg-amber-50 border border-amber-200"}`}
            >
              <div className="flex items-center justify-center gap-3">
                <AlertCircle
                  className={`w-5 h-5 ${theme === "dark" ? "text-amber-400" : "text-amber-500"}`}
                />
                <p
                  className={`font-medium ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}
                >
                  You must wait for verification to complete before proceeding
                </p>
              </div>
            </div>
          )}
      </div>
    );
  };

  const VerificationRestrictionModal = () => {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme === "dark" ? "bg-black/70" : "bg-black/50"}`}
      >
        <div
          className={`relative w-full max-w-2xl rounded-2xl shadow-2xl ${
            theme === "dark"
              ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-amber-500/30"
              : "bg-gradient-to-br from-white via-amber-50 to-white border border-amber-200"
          }`}
        >
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                <Lock className="w-12 h-12 text-amber-500 animate-pulse" />
              </div>
            </div>

            <h2
              className={`text-2xl md:text-3xl font-bold text-center mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              Verification in Progress
            </h2>

            <div
              className={`p-6 rounded-xl mb-6 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-700/30"
                  : "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3
                    className={`font-semibold text-lg mb-2 ${theme === "dark" ? "text-amber-300" : "text-amber-700"}`}
                  >
                    {getVerificationStepTitle()}
                  </h3>
                  <p
                    className={`text-sm ${theme === "dark" ? "text-amber-400/80" : "text-amber-600/80"}`}
                  >
                    {getVerificationStepDescription()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
                <div>
                  <h4
                    className={`font-medium ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}
                  >
                    Security Check
                  </h4>
                  <p
                    className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Our team is verifying your documents to ensure authenticity
                    and prevent fraud.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-white">2</span>
                </div>
                <div>
                  <h4
                    className={`font-medium ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}
                  >
                    Manual Review Process
                  </h4>
                  <p
                    className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Each document is manually reviewed by our Ethiopian
                    verification specialists.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
                <div>
                  <h4
                    className={`font-medium ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}
                  >
                    {verificationStatus?.status === "needs_resubmission"
                      ? "Resubmission Required"
                      : "No New Uploads Allowed"}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                  >
                    {verificationStatus?.status === "needs_resubmission"
                      ? "Please resubmit corrected documents as requested by our team."
                      : "You cannot upload new documents while verification is in progress to prevent confusion."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowVerificationRestriction(false)}
                className="flex-1 py-3 font-medium bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowVerificationRestriction(false);
                  if (verificationStatus?.status === "needs_resubmission") {
                    setShowDocumentUpload(true);
                  } else {
                    handleManualVerificationCheck();
                  }
                }}
                className="flex-1 py-3 font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl transition-all duration-300"
              >
                {verificationStatus?.status === "needs_resubmission"
                  ? "Resubmit Documents"
                  : "Check Status"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InformationCenter = () => {
    const currentCard = infoCards[activeInfoCard];
    const isSeller = userType === "seller";

    return (
      <div className="mb-16">
        <div className="text-center mb-12">
          <div
            className={`inline-flex items-center gap-3 mb-4 px-6 py-3 rounded-full ${
              theme === "dark"
                ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                : "bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200"
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="font-semibold text-amber-600">
              {isSeller
                ? "Property Selling Journey"
                : "Rental Management Journey"}
            </span>
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>

          <h2
            className={`text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r ${
              isSeller
                ? "from-amber-500 to-amber-700"
                : "from-amber-700 to-amber-500"
            } bg-clip-text text-transparent`}
          >
            {isSeller
              ? "Sell Your Property with Confidence"
              : "Rent Out Your Property Securely"}
          </h2>

          <p
            className={`text-xl max-w-3xl mx-auto leading-relaxed ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {isSeller
              ? "Navigate Ethiopia's real estate market with expert brokers, secure transactions, and maximum exposure for your property."
              : "Find reliable tenants, optimize your rental income, and manage your property effortlessly with professional support."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div
            className={`relative overflow-hidden p-8 transition-all duration-500 hover:scale-[1.02] cursor-pointer group ${
              theme === "dark"
                ? "bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-amber-500/20"
                : "bg-gradient-to-br from-white via-amber-50 to-white border border-amber-200 shadow-xl"
            }`}
            onClick={currentCard.action}
            onMouseEnter={() => setHoveredCard("featured")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <div
                  className={`inline-flex items-center gap-3 px-5 py-3 rounded-full mb-6 backdrop-blur-sm ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/30"
                      : "bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
                    <currentCard.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {currentCard.highlight}
                  </span>
                </div>
                <h3
                  className={`text-3xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  {currentCard.title}
                </h3>
                <p
                  className={`text-lg mb-6 leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  {currentCard.description}
                </p>
                <div className="flex items-center gap-6 mb-8">
                  <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {currentCard.highlight}
                  </div>
                  <div className="flex space-x-2">
                    {infoCards.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveInfoCard(idx);
                        }}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          activeInfoCard === idx
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 scale-125"
                            : theme === "dark"
                              ? "bg-gray-600 hover:bg-amber-400"
                              : "bg-gray-300 hover:bg-amber-400"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <button className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-105">
                  <span>Start Listing</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
              <div className="flex-1">
                <div className="relative h-64 lg:h-80 group-hover:scale-105 transition-transform duration-500">
                  <img
                    src={
                      isSeller
                        ? "/vectors/SellHouse.svg"
                        : "/vectors/RentHouse.svg"
                    }
                    alt={currentCard.title}
                    className="w-full h-full object-contain p-4 drop-shadow-xl"
                  />
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {infoCards
              .filter((card) => card.id !== activeInfoCard)
              .map((card) => (
                <div
                  key={card.id}
                  className={`p-6 rounded-2xl transition-all duration-300 hover:scale-[1.03] cursor-pointer group relative overflow-hidden ${
                    theme === "dark"
                      ? "bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:from-gray-700/80 hover:to-gray-800/80 border border-gray-700"
                      : "bg-gradient-to-br from-white to-gray-50 hover:from-amber-50 hover:to-orange-50 border border-gray-200 shadow-lg"
                  } ${hoveredCard === card.id ? "ring-2 ring-amber-400 " : ""}`}
                  onClick={card.action}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-transparent to-orange-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                  <div className="relative flex items-start gap-4 mb-4">
                    <div
                      className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                        theme === "dark"
                          ? "bg-gradient-to-br from-amber-900/30 to-orange-900/30"
                          : "bg-gradient-to-br from-amber-100 to-orange-100"
                      }`}
                    >
                      <card.icon
                        className={`w-7 h-7 ${
                          theme === "dark" ? "text-amber-400" : "text-amber-600"
                        } group-hover:scale-110 transition-transform`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4
                        className={`font-bold text-lg mb-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {card.title}
                      </h4>
                      <p
                        className={`text-sm font-medium ${
                          theme === "dark" ? "text-amber-300" : "text-amber-600"
                        }`}
                      >
                        {card.highlight}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm relative ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }  transition-colors`}
                  >
                    {card.description.substring(0, 80)}...
                    <span className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowRight className="w-4 h-4 text-amber-500" />
                    </span>
                  </p>
                </div>
              ))}
          </div>
        </div>

        <div className="mb-16">
          <div className="text-center mb-10">
            <h3
              className={`text-3xl font-bold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Your{" "}
              <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                {isSeller ? "Selling" : "Rental"} Journey
              </span>
            </h3>
            <p
              className={`text-lg max-w-2xl mx-auto ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Follow these simple steps to {isSeller ? "sell" : "rent out"} your
              property in Ethiopia
            </p>
          </div>
          <div className="relative">
            <div
              className={`absolute left=0 right=0 top-12 h-1 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
                  : "bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300"
              } overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-[shimmer_2s_infinite]"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {journeySteps.map((step, index) => (
                <div key={step.step} className="relative">
                  <div
                    className={`absolute z-20 -top-6 left-8 w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg ${
                      hoveredCard === `step-${step.step}`
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse"
                        : "bg-gradient-to-r from-amber-400 to-orange-500"
                    } text-white transition-all duration-300`}
                  >
                    {step.step}
                  </div>
                  <div
                    className={`p-10 transition-all duration-500 hover:scale-[1.05] cursor-pointer group relative overflow-hidden ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-gray-800/60 to-gray-900/60 hover:from-gray-700/80 hover:to-gray-800/80 border border-gray-700/50"
                        : "bg-gradient-to-br from-white to-gray-50 hover:from-amber-50 hover:to-orange-50 border border-gray-200 shadow-xl"
                    }`}
                    onMouseEnter={() => setHoveredCard(`step-${step.step}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className={`p-4 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${
                          theme === "dark"
                            ? "bg-gradient-to-br from-amber-900/30 to-orange-900/30"
                            : "bg-gradient-to-br from-amber-100 to-orange-100"
                        }`}
                      >
                        <step.icon
                          className={`w-8 h-8 ${
                            theme === "dark"
                              ? "text-amber-400"
                              : "text-amber-600"
                          } group-hover:text-orange-500 transition-colors`}
                        />
                      </div>
                      <div>
                        <span
                          className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                            theme === "dark"
                              ? "bg-gray-700 text-gray-300 group-hover:bg-amber-500 group-hover:text-white"
                              : "bg-gray-100 text-gray-600 group-hover:bg-amber-500 group-hover:text-white"
                          } transition-all duration-300`}
                        >
                          {step.time}
                        </span>
                      </div>
                    </div>
                    <h4
                      className={`text-xl font-bold mb-3 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      } group-hover:bg-gradient-to-r group-hover:from-amber-600 group-hover:to-orange-600 group-hover:bg-clip-text group-hover:text-transparent`}
                    >
                      {step.title}
                    </h4>
                    <p
                      className={`text-sm leading-relaxed ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      } transition-colors`}
                    >
                      {step.description}
                    </p>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center group-hover:animate-bounce">
                        <ChevronRight className="w-4 h-4 text-white group-hover:animate-ping" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "ETB 0";
    if (amount >= 1000000) return `ETB ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `ETB ${(amount / 1000).toFixed(0)}K`;
    return `ETB ${amount.toLocaleString()}`;
  };

  // ========== RENDER FUNCTIONS ==========

  const renderStepContent = () => {
    switch (activeStep) {
      case 1: // Property Details
        return (
          <Step1PropertyDetails
            theme={theme}
            formData={formData}
            formErrors={formErrors}
            handleInputChange={handleInputChange}
            handleSubmitPropertyRequest={handleSubmitPropertyRequest}
            isLoading={isLoading}
            propertyImages={propertyImages}
            imagePreviews={imagePreviews}
            setPropertyImages={setPropertyImages}
            setImagePreviews={setImagePreviews}
            setFormData={setFormData}
            setFormErrors={setFormErrors}
            formatCurrency={formatCurrency}
            isStepCompleted={completedSteps[1]}
          />
        );

      case 2: // Choose Broker
        return (
          <Step2ChooseBroker
            theme={theme}
            stepCompleted={completedSteps[2]}
            propertyRequest={propertyRequest}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            filteredBrokers={filteredBrokers}
            selectedBroker={selectedBroker}
            handleBrokerSelect={(broker) => {
              handleBrokerSelect(broker);
              setSelectedBrokerForChat(broker); // Also set for chat
            }}
            handleConfirmBrokerSelection={handleConfirmBrokerSelection}
            isLoading={isLoading}
            selectedBrokerForModal={selectedBrokerForModal}
            setSelectedBrokerForModal={setSelectedBrokerForModal}
            showBrokerModal={showBrokerModal}
            setShowBrokerModal={setShowBrokerModal}
            setShowChat={setChatWindowOpen} // Use setBrokerChatOpen
            setActiveStep={setActiveStep}
            brokers={brokers}
            requestId={formData.request_id}
            handleOpenChatWithBroker={handleOpenChatWithBroker}
          />
        );

      case 3: // Schedule Inspection
        const step3Completed = completedSteps[3];
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <h4
                className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
              >
                {step3Completed
                  ? "Inspection Scheduled"
                  : "Schedule Property Inspection"}
              </h4>
              <p
                className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
              >
                {step3Completed
                  ? "Your property inspection has been scheduled."
                  : "Book a property inspection with your assigned broker."}
              </p>
            </div>

            {!step3Completed ? (
              <div
                className={`p-8 rounded-xl border-2 ${theme === "dark" ? "bg-gray-800/50 border-amber-400/30" : "bg-white border-amber-200"} backdrop-blur-sm`}
              >
                <div className="mb-6">
                  <h5
                    className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                  >
                    Inspection Details
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white hover:border-amber-400"
                            : "bg-white border-gray-300 text-gray-900 hover:border-amber-400"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Preferred Time *
                      </label>
                      <select
                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white hover:border-amber-400"
                            : "bg-white border-gray-300 text-gray-900 hover:border-amber-400"
                        }`}
                      >
                        <option value="">Select Time</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-6">
                    <label
                      className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Any specific areas to focus on during inspection..."
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                      }`}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    const inspectionData = {
                      date: new Date().toISOString().split("T")[0],
                      time: "10:00",
                      notes: "General property inspection",
                    };
                    handleScheduleInspection(inspectionData);
                  }}
                  disabled={isLoading}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Scheduling..." : "Schedule Inspection"}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="relative mx-auto w-36 h-36 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                  <div
                    className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}
                  >
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                </div>
                <h4
                  className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                >
                  Inspection Scheduled
                </h4>
                <div className="max-w-2xl mx-auto mb-10">
                  <p
                    className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Your property inspection has been scheduled for{" "}
                    {propertyRequest.verificationDate}.
                  </p>
                  <div
                    className={`p-6 rounded-xl mb-6 ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}
                  >
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <Calendar className="w-8 h-8 text-green-500" />
                      <span className="text-xl font-semibold">
                        Inspection Confirmed
                      </span>
                    </div>
                    <p className="text-sm mb-4">
                      Your broker will contact you before the inspection.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleContinueStep}
                  className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  Continue to Inspection
                </button>
              </div>
            )}
          </div>
        );

      case 4: // Property Inspection
        const step4Completed = completedSteps[4];

        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <h4
                className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
              >
                {step4Completed
                  ? "Inspection Completed"
                  : "Property Inspection"}
              </h4>
              <p
                className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
              >
                {step4Completed
                  ? "The property inspection has been completed."
                  : "Awaiting broker inspection of your property."}
              </p>
            </div>

            {!step4Completed ? (
              <div className="text-center py-8">
                <div className="relative mx-auto w-36 h-36 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
                  <div
                    className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}
                  >
                    <Clock className="w-16 h-16 text-amber-500" />
                  </div>
                </div>
                <h4
                  className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                >
                  Awaiting Inspection
                </h4>
                <div className="max-w-2xl mx-auto mb-10">
                  <p
                    className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Your broker will inspect the property on the scheduled date.
                    You'll be notified when the inspection is complete.
                  </p>
                  <div
                    className={`p-6 rounded-xl mb-6 ${theme === "dark" ? "bg-amber-900/20 border border-amber-700" : "bg-amber-50 border border-amber-200"}`}
                  >
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <ShieldCheck className="w-8 h-8 text-amber-500" />
                      <span className="text-xl font-semibold">
                        Inspection in Progress
                      </span>
                    </div>
                    <p className="text-sm mb-4">
                      Please wait for your broker to complete the inspection.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Simulate inspection completion
                    const report =
                      "Property inspection completed successfully. All features are in good condition.";
                    handleCompleteInspection(report);
                  }}
                  disabled={isLoading}
                  className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                >
                  {isLoading ? "Completing..." : "Simulate Inspection Complete"}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="relative mx-auto w-36 h-36 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                  <div
                    className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}
                  >
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                </div>
                <h4
                  className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                >
                  Inspection Complete!
                </h4>
                <div className="max-w-2xl mx-auto mb-10">
                  <p
                    className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                  >
                    The property inspection has been completed successfully.
                  </p>
                  <div
                    className={`p-6 rounded-xl mb-6 ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}
                  >
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <ShieldCheck className="w-8 h-8 text-green-500" />
                      <span className="text-xl font-semibold">
                        Inspection Report
                      </span>
                    </div>
                    <p className="text-sm mb-4">
                      {propertyRequest.inspectionReport ||
                        "No report available."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleContinueStep}
                  className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  Continue to Listing Proposal
                </button>
              </div>
            )}
          </div>
        );

      // Add cases for steps 5, 6, 7 as needed...

      default:
        return (
          <div className="py-8">
            <div className="text-center">
              <h4
                className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
              >
                Get Started
              </h4>
              <p
                className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
              >
                Complete your verification to start listing your property
              </p>
              <VerificationStatus />
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`min-h-screen  ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-950 via-black to-gray-950"
          : "bg-gradient-to-br from-amber-50 via-white to-gray-100"
      } relative overflow-x-hidden`}
    >
      {isLoading && <Loader theme={theme} />}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {/* Hero Background */}
      <div
        className="relative  h-[600px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/imgs/userHouse3.jpg')`,
        }}
      >
        {/* Header */}
        <header className="relative w-full max-w-[1580px] mx-auto px-4 sm:px-6 transition-all duration-500 z-10">
          <div className="w-full">
            <div className="NavBar flex flex-col sm:flex-row items-center justify-between py-4 sm:py-6">
              <Link to="/">
                <img
                  src="/vectors/LogoY.svg"
                  alt="Logo"
                  className="logoTop relative top-8 left-5 h-10"
                />
              </Link>
              <nav className="w-full sm:w-auto flex-wrap">
                <ul className="flex flex-wrap justify-center items-center space-x-4 sm:space-x-6 md:space-x-16 lg:space-x-28 sm:-left-52 md:-left-80 lg:-left-12 text-white">
                  <li>
                    <Link
                      to="/properties"
                      className="nav-link hover:text-amber-400 transition-colors"
                    >
                      Properties
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/help"
                      className="nav-link hover:text-amber-400 transition-colors"
                    >
                      Help
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/buyer-renter"
                      className="nav-link hover:text-amber-400 transition-colors"
                    >
                      Buy/Rent
                    </Link>
                  </li>
                  <li>
                    {user ? (
                      <div className="flex items-center space-x-4">
                        <ProfileAvatar
                          userProfilePicture={user?.profile_picture}
                          firstName={user?.first_name}
                          lastName={user?.last_name}
                          username={user?.username}
                          email={user?.email}
                          role={user?.role}
                          userType={userType}
                          onLogout={handleLogout}
                          onUploadImage={handleProfilePictureUpload}
                          onEditProfile={handleEditProfile}
                          onNavigateToSection={handleNavigateToSection}
                        />
                      </div>
                    ) : (
                      <Link
                        to="/login-register"
                        className="nav-link bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg transition-all hover:scale-105"
                      >
                        Sign In
                      </Link>
                    )}
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center pt-16">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 min-h-[72px] flex items-center justify-center">
              <HeroTypingText
                texts={[
                  "Sell Your Property with Confidence",
                  "Maximize Your Property's Value",
                  "Verified Brokers • Secure Transactions",
                  "Get the Best Price for Your Property",
                ]}
                typingSpeed={80}
                pauseTime={2000}
                className="text-amber-400 font-montserrat"
              />
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {userType === "seller"
                ? "Your journey to property selling starts here"
                : "List your rental property with trusted brokers"}
            </p>
            <div className="animate-bounce mt-12">
              <ChevronDown className="w-8 h-8 mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-20">
        <div className="container mx-auto px-4 relative z-10">
          {/* User Type Toggle */}
          <div className="max-w-2xl mx-auto mb-12">
            <div
              className={`p-4 shadow-2xl ${
                theme === "dark"
                  ? "bg-gradient-to-r from-gray-800 to-gray-900 border border-amber-500/20"
                  : "bg-gradient-to-r from-white to-gray-50 border border-amber-200"
              }`}
            >
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    if (!canChangeUserType && userType !== "seller") {
                      toast.error("Cannot switch user type after verification");
                      return;
                    }
                    setUserType("seller");
                  }}
                  className={`flex-1 py-5 px-8 font-bold transition-all duration-300 group ${
                    userType === "seller"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl scale-105"
                      : theme === "dark"
                        ? canChangeUserType
                          ? "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700"
                          : "bg-gradient-to-r from-gray-800 to-gray-900 text-gray-500 cursor-not-allowed"
                        : canChangeUserType
                          ? "bg-gradient-to-r from-gray-200 to-gray-300 text-amber-100 hover:bg-gradient-to-r hover:from-amber-100 hover:to-gray-400"
                          : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!canChangeUserType && userType !== "seller"}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Home
                      className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                        userType === "seller" ? "text-white" : "text-amber-500"
                      }`}
                    />
                    <span
                      className={`transition-transform font-semibold ${
                        userType === "seller" ? "text-white" : "text-amber-500"
                      }`}
                    >
                      Seller Dashboard
                      {!canChangeUserType &&
                        userType === "seller" &&
                        " (Locked)"}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (!canChangeUserType && userType !== "leaser") {
                      toast.error("Cannot switch user type after verification");
                      return;
                    }
                    setUserType("leaser");
                  }}
                  className={`flex-1 py-5 px-8 font-bold transition-all duration-300 group ${
                    userType === "leaser"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl scale-105"
                      : theme === "dark"
                        ? canChangeUserType
                          ? "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700"
                          : "bg-gradient-to-r from-gray-800 to-gray-900 text-gray-500 cursor-not-allowed"
                        : canChangeUserType
                          ? "bg-gradient-to-r from-gray-200 to-gray-300 text-amber-100 hover:bg-gradient-to-r hover:from-amber-100 hover:to-gray-400"
                          : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!canChangeUserType && userType !== "leaser"}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Key
                      className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                        userType === "leaser" ? "text-white" : "text-amber-500"
                      }`}
                    />
                    <span
                      className={`transition-transform font-semibold ${
                        userType === "seller" ? "text-amber-500" : "text-white"
                      }`}
                    >
                      Renter Dashboard
                      {!canChangeUserType &&
                        userType === "leaser" &&
                        " (Locked)"}
                    </span>
                  </div>
                </button>
              </div>

              {/* Warning message when type is locked */}
              {!canChangeUserType && (
                <div
                  className={`mt-4 p-3 rounded-lg text-sm ${
                    theme === "dark"
                      ? "bg-amber-900/20 text-amber-300 border border-amber-700/30"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-3 ">
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">User Type Locked:</span>
                    <p>
                      {" "}
                      Your account type is now locked as a{" "}
                      <strong>{userType}</strong> after verification completion.
                      Contact support if you need to change account types.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Information Center */}
          <InformationCenter />

          {/* Verification Restriction Modal */}
          {showVerificationRestriction && <VerificationRestrictionModal />}

          {/* Progress Tracker Section */}
          <div ref={progressSectionRef} className="mb-20">
            <div className="text-center mb-12">
              <h3
                className={`text-3xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                Your{" "}
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  Step-by-Step Journey
                </span>
              </h3>
              <p
                className={`text-lg max-w-2xl mx-auto ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
              >
                Follow these simple steps to{" "}
                {userType === "seller"
                  ? "sell your property"
                  : "rent out your property"}{" "}
                in Ethiopia
              </p>
            </div>

            {/* Enhanced Progress Tracker */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center space-x-16 relative">
                {currentSteps.map((step) => (
                  <ProgressCircle
                    key={step.number}
                    step={step}
                    isActive={step.number === activeStep}
                    isCompleted={step.completed}
                    onClick={handleStepClick}
                  />
                ))}
              </div>
            </div>

            {/* Enhanced Step Content */}
            <div
              className={`p-10  rounded-3xl border-2 transition-all w-[90%] ml-20 mr-20 duration-700 ${
                theme === "dark"
                  ? "bg-gradient-to-br from-white-900/80 to-gray-800/80 border-amber-500/30"
                  : "bg-gradient-to-br from-white to-amber-50 border border-amber-200"
              } shadow-2xl backdrop-blur-sm`}
              style={{
                transform: `translateY(${scrolledProgress * 20}px)`,
                opacity: 0.8 + scrolledProgress * 0.2,
              }}
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`p-3 rounded-xl ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-amber-900/30 to-orange-900/30"
                          : "bg-gradient-to-r from-amber-100 to-orange-100"
                      }`}
                    >
                      {React.createElement(
                        currentSteps.find((s) => s.number === activeStep)?.icon,
                        {
                          className: `w-8 h-8 ${currentSteps.find((s) => s.number === activeStep)?.iconColor}`,
                        },
                      )}
                    </div>
                    <div>
                      <h3
                        className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {
                          currentSteps.find((s) => s.number === activeStep)
                            ?.title
                        }
                      </h3>
                      <p
                        className={`mt-2 text-lg ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {
                          currentSteps.find((s) => s.number === activeStep)
                            ?.description
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {activeStep > 1 && (
                    <button
                      onClick={() => setActiveStep(activeStep - 1)}
                      className={`flex items-center gap-2 px-4 py-2 font-semibold transition-all duration-300 ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700"
                          : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400"
                      }`}
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Previous
                    </button>
                  )}
                  {activeStep < currentSteps.length && (
                    <button
                      onClick={handleContinueStep}
                      className="flex items-center gap-2 px-4 py-2 Button2"
                      disabled={
                        activeStep === 3 &&
                        isVerificationInProgress &&
                        verificationStatus?.status !== "verified"
                      }
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Step Content */}
              <div className="-py-5">{renderStepContent()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <FloatingElements theme={theme} />

      {/* Render BrokerChatToggle ONLY when step 2 is completed (broker selected) */}
      {completedSteps[2] && selectedBroker && (
        <BrokerChatToggle
          brokerId={selectedBroker.id}
          theme={theme}
          onToggle={() => setChatWindowOpen(!chatWindowOpen)}
          brokerName={selectedBroker.name}
          brokerProfile={selectedBroker.profile_picture}
          unreadCount={0} // You would get this from your chat system
          isChatOpen={chatWindowOpen}
          onOpenChat={() => setChatWindowOpen(true)}
          brokerStatus="online"
        />
      )}

      <NotificationToggle
        onOpenChat={() => {
          if (brokers.length > 0) {
            setSelectedBrokerForChat(brokers[0]);
            setChatWindowOpen(true); // ← CORRECTED
          } else {
            toast.error("No brokers available at the moment");
          }
        }}
        onOpenDocumentUpload={() => setShowDocumentUpload(true)}
        onOpenVerification={() => {}}
        user={user}
      />

      {/* Modals */}
      {showProfileSetup && (
        <ProfileSetupModal
          isOpen={showProfileSetup}
          onClose={() => setShowProfileSetup(false)}
          user={user}
          onComplete={handleProfileComplete}
          userType={userType}
          ethiopianMode={true}
        />
      )}

      {showBrokerModal && selectedBrokerForModal && (
        <BrokerProfileModal
          broker={selectedBrokerForModal}
          isOpen={showBrokerModal}
          onClose={() => {
            console.log("Closing broker modal");
            setShowBrokerModal(false);
          }}
          onSelect={() => {
            console.log(
              "Selecting broker from modal:",
              selectedBrokerForModal.id,
            );
            handleBrokerSelect(selectedBrokerForModal);
            setShowBrokerModal(false);
          }}
          theme={theme}
        />
      )}

      {showDocumentUpload && (
        <DocumentUploadModal
          isOpen={showDocumentUpload}
          onClose={() => setShowDocumentUpload(false)}
          onSubmit={handleDocumentUploadComplete}
          requiredDocuments={[]}
          theme={theme}
          ethiopianMode={true}
          userDocuments={userDocuments}
          isVerificationInProgress={isVerificationInProgress}
          hasSubmittedDocuments={hasSubmittedDocuments}
          resubmissionDocument={resubmissionDocument}
        />
      )}

      {/* REMOVED: BrokerChatInterface modal since we're using BrokerChatToggle */}

      {showScheduleViewingModal && (
        <ScheduleViewingModal
          isOpen={showScheduleViewingModal}
          onClose={() => setShowScheduleViewingModal(false)}
          property={formData}
          broker={selectedBroker}
          onSubmit={handleScheduleInspection}
        />
      )}

      <Footer />
    </div>
  );
};

export default SellerLeaser;